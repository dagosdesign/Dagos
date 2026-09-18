import type { Express, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { mailReady, sendMail } from "./mailer";

/* HELP & SUPPORT: a student's message to the Lexistencehub team.

   Every message is kept in data/support.json with a reference (LX-XXXXXX). When SMTP and
   SUPPORT_EMAIL are configured it is also e-mailed to the team, with the student's address
   as Reply-To - answering the e-mail answers the student. Limits: five messages per hour
   per profile and per address, and a hidden field that only bots fill in. */

interface Ticket {
  ref: string;
  at: number;
  profileId: string;
  topic: string;
  email: string;
  message: string;
  context: Record<string, string>;
  emailed: boolean;
}

const FILE = path.join(process.cwd(), "data", "support.json");
const TOPICS = ["Question", "Problem", "Membership & Payment", "Suggestion", "Other"];
const PER_HOUR = 5;

let tickets: Ticket[] = [];
try {
  tickets = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  tickets = [];
}
const recent = new Map<string, number[]>();

function limited(key: string): boolean {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter(t => now - t < 3_600_000);
  if (list.length >= PER_HOUR) return true;
  list.push(now);
  recent.set(key, list);
  return false;
}

export function registerSupportRoutes(app: Express) {
  app.post("/api/support", async (req: Request, res: Response) => {
    const { profileId, topic, email, message, context, website } = req.body as {
      profileId?: string;
      topic?: string;
      email?: string;
      message?: string;
      context?: Record<string, unknown>;
      website?: string; // hidden field: people never fill it in
    };
    if (website) return res.json({ ref: "LX-000000" });

    const id = typeof profileId === "string" && /^[\w-]{6,64}$/.test(profileId) ? profileId : "";
    const mail = String(email ?? "").trim().toLowerCase();
    const text = String(message ?? "").trim();
    if (!id) return res.status(400).json({ message: "Missing information." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) || mail.length > 120) return res.status(400).json({ message: "Enter a valid e-mail address so we can reply." });
    if (text.length < 10) return res.status(400).json({ message: "Please describe your question in a little more detail." });
    if (text.length > 2000) return res.status(400).json({ message: "Please keep your message under 2000 characters." });
    if (limited(id) || limited(req.ip ?? "ip")) return res.status(429).json({ message: "You have sent several messages. Please try again in an hour." });

    const safeContext: Record<string, string> = {};
    for (const [k, v] of Object.entries(context ?? {}).slice(0, 10)) safeContext[k.slice(0, 30)] = String(v).slice(0, 200);

    const ticket: Ticket = {
      ref: `LX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      at: Date.now(),
      profileId: id,
      topic: TOPICS.includes(String(topic)) ? String(topic) : "Other",
      email: mail,
      message: text,
      context: safeContext,
      emailed: false,
    };

    const to = process.env.SUPPORT_EMAIL;
    if (to && mailReady()) {
      try {
        await sendMail({
          to,
          replyTo: mail,
          subject: `[${ticket.ref}] ${ticket.topic} - Lexistencehub support`,
          text: `${text}\n\n---\nFrom: ${mail}\nReference: ${ticket.ref}\nTopic: ${ticket.topic}\n${Object.entries(safeContext).map(([k, v]) => `${k}: ${v}`).join("\n")}`,
        });
        ticket.emailed = true;
      } catch (err: any) {
        console.error("Support mail error:", err?.message || err);
      }
    }

    tickets.push(ticket);
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(tickets.slice(-5000), null, 1));
    } catch (err: any) {
      console.error("Support store error:", err?.message || err);
      if (!ticket.emailed) return res.status(500).json({ message: "Your message could not be sent. Please try again." });
    }
    console.log(`[support] ${ticket.ref} ${ticket.topic} from ${mail}${ticket.emailed ? " (e-mailed)" : " (stored only)"}`);
    res.json({ ref: ticket.ref });
  });
}
