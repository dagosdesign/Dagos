import nodemailer from "nodemailer";

/* Outgoing e-mail through any SMTP provider (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
   Used for account verification codes and for Help & Support messages. */

export const mailReady = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);

export async function sendMail(message: { to: string; subject: string; text: string; replyTo?: string }) {
  if (!mailReady()) throw new Error("mail_not_configured");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, ...message });
}
