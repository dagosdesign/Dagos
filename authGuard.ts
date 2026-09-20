import "dotenv/config";
import type { Express, NextFunction, Request, Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* WHO IS CALLING, AND WHAT MAY THEY USE

   The AI endpoints cost money on every call, so the server - not the app - decides
   who may use them:

   - every endpoint is rate limited per IP address;
   - the Premium endpoints (AI Lex chat, AI Speaking, insight, analysis, practice)
     need a signed-in user whose plan in the entitlements table is Premium, and
     each has a daily limit per user.

   The user is identified by the Supabase access token the app sends
   (Authorization: Bearer ...), checked with the service-role client. Without
   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY the account checks are skipped and the
   server behaves as before (local development) - the IP rate limit still applies. */

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const admin: SupabaseClient | null =
  url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

export const accountsEnabled = admin !== null;

export interface Caller {
  userId: string;
  email: string | null;
}

declare module "express-serve-static-core" {
  interface Request {
    caller?: Caller;
  }
}

/* ---- small caches, so a chat does not look the user up on every message ---- */
const TTL = 60_000;
const tokenCache = new Map<string, { caller: Caller; at: number }>();
const planCache = new Map<string, { premium: boolean; at: number }>();

export async function callerOf(req: Request): Promise<Caller | null> {
  if (!admin) return null;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const hit = tokenCache.get(token);
  if (hit && Date.now() - hit.at < TTL) return hit.caller;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const caller = { userId: data.user.id, email: data.user.email ?? null };
  tokenCache.set(token, { caller, at: Date.now() });
  if (tokenCache.size > 5000) tokenCache.clear();
  return caller;
}

export async function isPremium(userId: string): Promise<boolean> {
  if (!admin) return true;
  const hit = planCache.get(userId);
  if (hit && Date.now() - hit.at < TTL) return hit.premium;
  const { data } = await admin.from("entitlements").select("plan,expires_at").eq("user_id", userId).maybeSingle();
  const premium = Boolean(data && data.plan === "premium" && (!data.expires_at || new Date(data.expires_at) > new Date()));
  planCache.set(userId, { premium, at: Date.now() });
  return premium;
}

/* ---- per-IP rate limit: a sliding minute ---- */
const hits = new Map<string, number[]>();
function tooFast(key: string, perMinute: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter(t => now - t < 60_000);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 20_000) hits.clear();
  return list.length > perMinute;
}

const dailyLimit = (feature: string, fallback: number) => {
  const v = Number(process.env[`AI_DAILY_${feature.toUpperCase()}`]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

interface GuardOptions {
  feature: string; // 'chat' | 'speaking' | 'analysis' | 'practice' | 'content'
  premium?: boolean; // needs a signed-in Premium user
  perMinute?: number; // per IP
  perDay?: number; // per user (Premium endpoints)
}

export function guard({ feature, premium = false, perMinute = 30, perDay = 200 }: GuardOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (tooFast(`${feature}:${req.ip}`, perMinute)) {
        return res.status(429).json({ error: "rate_limited", message: "Too many requests. Please wait a moment." });
      }
      if (!admin) return next(); // accounts not configured: local development

      const caller = await callerOf(req);
      if (caller) req.caller = caller;
      if (!premium) return next();

      if (!caller) return res.status(401).json({ error: "sign_in_required", message: "Please sign in to use this feature." });
      if (!(await isPremium(caller.userId))) {
        return res.status(402).json({ error: "premium_required", message: "This feature is part of Premium." });
      }
      const { data: used, error } = await admin.rpc("bump_ai_usage", { p_user: caller.userId, p_feature: feature });
      if (!error && typeof used === "number" && used > dailyLimit(feature, perDay)) {
        return res.status(429).json({ error: "daily_limit", message: "You have reached today's limit for this feature. It starts again tomorrow." });
      }
      next();
    } catch (err: any) {
      console.error("Guard error:", err?.message || err);
      res.status(500).json({ error: "guard_failed", message: "Please try again." });
    }
  };
}

/* Delete Account for a signed-in user: the auth user goes, and with it (cascade)
   the learning data, the plan row and the usage rows. */
export function registerAccountDeletion(app: Express) {
  app.post("/api/account/delete-user", async (req: Request, res: Response) => {
    if (!admin) return res.status(503).json({ error: "accounts_not_configured" });
    const caller = await callerOf(req);
    if (!caller) return res.status(401).json({ error: "sign_in_required", message: "Please sign in again." });
    const { error } = await admin.auth.admin.deleteUser(caller.userId);
    if (error) {
      console.error("Delete user error:", error.message);
      return res.status(500).json({ error: "delete_failed", message: "Your account could not be deleted. Please try again." });
    }
    planCache.delete(caller.userId);
    res.json({ deleted: true });
  });
}
