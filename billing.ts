import type { Express, Request, Response } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { admin, forgetPlan, guard } from "./authGuard";

/* PREMIUM PURCHASES (Google Play / App Store through RevenueCat).

   The stores charge; RevenueCat checks every receipt; this server writes the result
   into the entitlements table, which is the only place the app and the AI endpoints
   read Premium from. The app user id in RevenueCat is the Supabase user id, so
   Premium belongs to the account, not to a phone.

   Two ways in, one truth:
   - POST /api/billing/webhook  RevenueCat calls it on every purchase, renewal,
     cancellation, expiry, refund or transfer (Authorization: the shared secret).
   - POST /api/billing/sync     the app calls it right after a purchase or a restore,
     so Premium opens at once without waiting for the webhook.
   Both ask RevenueCat's API for the subscriber's current state instead of trusting
   the event body - order and duplicates of events then do not matter.

   Env: REVENUECAT_SECRET_KEY (sk_..., server only), REVENUECAT_WEBHOOK_AUTH (any long
   random string, also entered in RevenueCat), REVENUECAT_ENTITLEMENT (default "lexistencehub_premium", the identifier in RevenueCat). */

const SECRET = process.env.REVENUECAT_SECRET_KEY || "";
/* The shared webhook secret as both sides mean it: pasting it into a dashboard easily
   adds spaces, quotes or a "Bearer " prefix on one side only, so those are ignored. */
const cleanSecret = (s: string) =>
  s.trim().replace(/^Bearers+/i, "").replace(/^["']+|["']+$/g, "").trim();
const WEBHOOK_AUTH = cleanSecret(process.env.REVENUECAT_WEBHOOK_AUTH || "");
// Never the secret itself: its length and a one-way fingerprint, for the server log.
const fingerprint = (s: string) => `${s.length} chars, #${createHash("sha256").update(s).digest("hex").slice(0, 8)}`;
const sameSecret = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};
const ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT || "lexistencehub_premium";
if (process.env.NODE_ENV === "production" && (!SECRET || !WEBHOOK_AUTH)) {
  console.error("REVENUECAT_SECRET_KEY / REVENUECAT_WEBHOOK_AUTH missing: Premium purchases cannot be confirmed.");
}

// Supabase user ids; RevenueCat's own anonymous ids ($RCAnonymousID:...) are skipped.
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STORE_SOURCE: Record<string, string> = { app_store: "app_store", mac_app_store: "app_store", play_store: "play_store" };

interface RcEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
}
interface RcSubscriber {
  entitlements?: Record<string, RcEntitlement>;
  subscriptions?: Record<string, { store?: string }>;
}

/* Reads the subscriber from RevenueCat and writes the plan. Returns what was written. */
export async function syncPlan(userId: string): Promise<{ plan: "free" | "premium"; expiresAt: string | null }> {
  if (!admin) throw new Error("accounts_not_configured");
  if (!SECRET) throw new Error("billing_not_configured");

  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${SECRET}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`revenuecat_${res.status}`);
  const { subscriber } = (await res.json()) as { subscriber?: RcSubscriber };

  const ent = subscriber?.entitlements?.[ENTITLEMENT];
  const ends = [ent?.expires_date, ent?.grace_period_expires_date].filter(Boolean).map(d => Date.parse(d as string));
  const lifetime = Boolean(ent) && ent!.expires_date === null;
  const endsAt = ends.length ? Math.max(...ends) : null;
  const active = lifetime || (endsAt !== null && endsAt > Date.now());

  const { data: row } = await admin.from("entitlements").select("plan,source").eq("user_id", userId).maybeSingle();
  // Premium given by hand (a reviewer or test account) is not taken away by the store.
  if (!active && row?.plan === "premium" && row.source === "manual") {
    forgetPlan(userId);
    return { plan: "premium", expiresAt: null };
  }

  const store = ent ? subscriber?.subscriptions?.[ent.product_identifier]?.store : undefined;
  const next = {
    user_id: userId,
    plan: active ? ("premium" as const) : ("free" as const),
    expires_at: active && !lifetime && endsAt !== null ? new Date(endsAt).toISOString() : null,
    source: active ? STORE_SOURCE[store ?? ""] ?? "revenuecat" : row?.source ?? "manual",
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("entitlements").upsert(next, { onConflict: "user_id" });
  if (error) throw new Error(`entitlements_write: ${error.message}`);
  forgetPlan(userId);
  return { plan: next.plan, expiresAt: next.expires_at };
}

export function registerBillingRoutes(app: Express) {
  app.post("/api/billing/webhook", async (req: Request, res: Response) => {
    if (!WEBHOOK_AUTH) return res.status(503).json({ error: "billing_not_configured" });
    const auth = cleanSecret(String(req.headers.authorization || ""));
    if (!sameSecret(auth, WEBHOOK_AUTH)) {
      // Which side is wrong shows in the two fingerprints; the secrets are never logged.
      console.warn(`Billing webhook refused: received [${fingerprint(auth)}], expected [${fingerprint(WEBHOOK_AUTH)}]`);
      return res.status(401).json({ error: "unauthorized" });
    }

    const event = (req.body && req.body.event) || {};
    if (event.type === "TEST") return res.json({ ok: true });
    // Everyone the event touches: the buyer, their aliases and both sides of a transfer.
    const ids = new Set<string>(
      [
        event.app_user_id,
        event.original_app_user_id,
        ...(Array.isArray(event.aliases) ? event.aliases : []),
        ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
        ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
      ].filter((id): id is string => typeof id === "string" && USER_ID.test(id))
    );
    try {
      for (const id of ids) await syncPlan(id);
      res.json({ ok: true, users: ids.size });
    } catch (err: any) {
      // A non-2xx answer makes RevenueCat retry the webhook later.
      console.error("Billing webhook error:", err?.message || err);
      res.status(500).json({ error: "sync_failed" });
    }
  });

  app.post(
    "/api/billing/sync",
    guard({ feature: "billing_sync", signedIn: true, perMinute: 6, perDay: 60 }),
    async (req: Request, res: Response) => {
      try {
        res.json(await syncPlan(req.caller!.userId));
      } catch (err: any) {
        console.error("Billing sync error:", err?.message || err);
        res.status(502).json({ error: "sync_failed", message: "Your purchase could not be confirmed yet. Please try Restore Purchases in a moment." });
      }
    }
  );
}
