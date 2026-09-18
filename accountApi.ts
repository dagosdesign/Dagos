import type { Express, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

/* ACCOUNT: e-mail, phone and password of a Lexistencehub profile.

   Nothing sensitive changes without proof:
   - a new e-mail or phone is confirmed with a 6-digit code sent TO that new address or number;
   - a password is set or changed only with a code sent to the confirmed e-mail (or phone),
     and changing an existing password also needs the current password.

   Codes: random, stored only as a hash, valid 10 minutes, five attempts, one new code per minute.
   Passwords: scrypt with a per-password salt; the password itself is never stored or returned.

   Delivery: e-mail through SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM),
   SMS through Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM). While a channel is
   not configured, a development server shows the code in the app as a test code; a production
   server refuses instead - it never pretends a code was sent.

   Accounts are kept in data/accounts.json, keyed by the profile id the app created on the device. */

type Purpose = "email" | "phone" | "password";
type Channel = "email" | "sms";

interface Account {
  email?: string;
  phone?: string;
  passwordHash?: string; // scrypt: salt:hash
  updatedAt: number;
}

interface Pending {
  purpose: Purpose;
  channel: Channel;
  destination: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

const FILE = path.join(process.cwd(), "data", "accounts.json");
const CODE_TTL = 10 * 60_000;
const RESEND_AFTER = 60_000;
const MAX_ATTEMPTS = 5;
const isProduction = process.env.NODE_ENV === "production";

let accounts: Record<string, Account> = {};
try {
  accounts = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  accounts = {};
}
function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(accounts, null, 1));
}

const pending = new Map<string, Pending>(); // `${profileId}:${purpose}`

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const validId = (id: unknown): id is string => typeof id === "string" && /^[\w-]{6,64}$/.test(id);
const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120;
const cleanPhone = (s: string) => s.replace(/[\s()-]/g, "");
const validPhone = (s: string) => /^\+[1-9]\d{8,14}$/.test(s);
const validPassword = (s: string) => s.length >= 8 && s.length <= 72 && /[A-Za-z]/.test(s) && /\d/.test(s);

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  return `${salt.toString("hex")}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const given = crypto.scryptSync(password, Buffer.from(salt, "hex"), 64);
  const known = Buffer.from(hash, "hex");
  return given.length === known.length && crypto.timingSafeEqual(given, known);
}

const mask = {
  email: (e: string) => e.replace(/^(.{1,2})[^@]*(@.*)$/, "$1•••$2"),
  phone: (p: string) => `${p.slice(0, 4)}•••${p.slice(-2)}`,
};

function view(id: string) {
  const a = accounts[id] ?? { updatedAt: 0 };
  return { email: a.email ?? null, phone: a.phone ?? null, hasPassword: Boolean(a.passwordHash) };
}

const emailReady = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
const smsReady = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

async function deliver(channel: Channel, destination: string, code: string): Promise<"sent" | "test"> {
  const text = `Your Lexistencehub verification code is ${code}. It is valid for 10 minutes. If you did not ask for it, ignore this message.`;
  if (channel === "email" && emailReady()) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: process.env.SMTP_FROM, to: destination, subject: "Lexistencehub verification code", text });
    return "sent";
  }
  if (channel === "sms" && smsReady()) {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: destination, From: process.env.TWILIO_FROM!, Body: text }),
    });
    if (!r.ok) throw new Error(`SMS provider answered ${r.status}`);
    return "sent";
  }
  if (isProduction) throw new Error("channel_not_configured");
  console.log(`[account] TEST verification code for ${destination}: ${code}`);
  return "test";
}

export function registerAccountRoutes(app: Express) {
  app.get("/api/account/:id", (req: Request, res: Response) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: "bad_id" });
    res.json({ ...view(req.params.id), channels: { email: emailReady() || !isProduction, sms: smsReady() || !isProduction } });
  });

  /* Delete Account: removes the e-mail, phone and password kept for this profile. */
  app.post("/api/account/delete", (req: Request, res: Response) => {
    const { profileId, currentPassword } = req.body as { profileId?: string; currentPassword?: string };
    if (!validId(profileId)) return res.status(400).json({ error: "bad_id" });
    const account = accounts[profileId];
    if (account?.passwordHash && (!currentPassword || !checkPassword(currentPassword, account.passwordHash))) {
      return res.status(403).json({ error: "wrong_password", message: "Your password is not correct." });
    }
    delete accounts[profileId];
    for (const purpose of ["email", "phone", "password"]) pending.delete(`${profileId}:${purpose}`);
    save();
    res.json({ deleted: true });
  });

  /* Step 1: ask for a code. */
  app.post("/api/account/request-code", async (req: Request, res: Response) => {
    const { profileId, purpose, channel, value, currentPassword } = req.body as {
      profileId?: string;
      purpose?: Purpose;
      channel?: Channel;
      value?: string; // the new e-mail or phone
      currentPassword?: string;
    };
    if (!validId(profileId) || !purpose) return res.status(400).json({ error: "bad_request", message: "Missing information." });
    const account = accounts[profileId] ?? { updatedAt: 0 };

    // An account that has a password changes nothing without it.
    if (account.passwordHash) {
      if (!currentPassword || !checkPassword(currentPassword, account.passwordHash)) {
        return res.status(403).json({ error: "wrong_password", message: "Your current password is not correct." });
      }
    }

    let via: Channel;
    let destination: string;
    if (purpose === "email") {
      destination = String(value ?? "").trim().toLowerCase();
      if (!validEmail(destination)) return res.status(400).json({ error: "bad_email", message: "Enter a valid e-mail address." });
      via = "email";
    } else if (purpose === "phone") {
      destination = cleanPhone(String(value ?? ""));
      if (!validPhone(destination)) return res.status(400).json({ error: "bad_phone", message: "Enter the number with its country code, e.g. +90 5xx xxx xx xx." });
      via = "sms";
    } else {
      via = channel === "sms" ? "sms" : "email";
      const known = via === "sms" ? account.phone : account.email;
      if (!known) {
        return res.status(400).json({
          error: "no_destination",
          message: via === "sms" ? "Add and confirm a phone number first." : "Add and confirm your e-mail first.",
        });
      }
      destination = known;
    }

    const key = `${profileId}:${purpose}`;
    const last = pending.get(key);
    if (last && Date.now() - last.sentAt < RESEND_AFTER) {
      return res.status(429).json({ error: "too_soon", message: "A code was just sent. Please wait a minute before asking for another." });
    }

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    try {
      const how = await deliver(via, destination, code);
      pending.set(key, { purpose, channel: via, destination, codeHash: sha(`${profileId}:${code}`), expiresAt: Date.now() + CODE_TTL, attempts: 0, sentAt: Date.now() });
      res.json({
        sentTo: via === "sms" ? mask.phone(destination) : mask.email(destination),
        channel: via,
        // Only a development server without a mail / SMS provider hands the code back.
        testCode: how === "test" ? code : undefined,
      });
    } catch (err: any) {
      const notReady = err?.message === "channel_not_configured";
      console.error("Account code error:", err?.message || err);
      res.status(notReady ? 503 : 502).json({
        error: notReady ? "channel_not_configured" : "delivery_failed",
        message: notReady
          ? `${via === "sms" ? "SMS" : "E-mail"} verification is not available yet.`
          : "The code could not be sent. Please try again.",
      });
    }
  });

  /* Step 2: confirm the code and apply the change. */
  app.post("/api/account/confirm", (req: Request, res: Response) => {
    const { profileId, purpose, code, newPassword } = req.body as { profileId?: string; purpose?: Purpose; code?: string; newPassword?: string };
    if (!validId(profileId) || !purpose) return res.status(400).json({ error: "bad_request", message: "Missing information." });
    const key = `${profileId}:${purpose}`;
    const p = pending.get(key);
    if (!p || Date.now() > p.expiresAt) {
      pending.delete(key);
      return res.status(400).json({ error: "expired", message: "This code has expired. Ask for a new one." });
    }
    if (purpose === "password" && !validPassword(String(newPassword ?? ""))) {
      return res.status(400).json({ error: "weak_password", message: "Use at least 8 characters with a letter and a number." });
    }
    p.attempts++;
    const given = Buffer.from(sha(`${profileId}:${String(code ?? "").trim()}`));
    const known = Buffer.from(p.codeHash);
    if (!crypto.timingSafeEqual(given, known)) {
      if (p.attempts >= MAX_ATTEMPTS) {
        pending.delete(key);
        return res.status(400).json({ error: "too_many", message: "Too many wrong codes. Ask for a new one." });
      }
      return res.status(400).json({ error: "wrong_code", message: `That code is not correct. ${MAX_ATTEMPTS - p.attempts} attempts left.` });
    }

    pending.delete(key);
    const account: Account = { ...(accounts[profileId] ?? {}), updatedAt: Date.now() };
    if (purpose === "email") account.email = p.destination;
    else if (purpose === "phone") account.phone = p.destination;
    else account.passwordHash = hashPassword(String(newPassword));
    accounts[profileId] = account;
    save();
    res.json(view(profileId));
  });
}
