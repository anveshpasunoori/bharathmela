import "server-only";
import { resolveMx } from "node:dns/promises";

// Throwaway-inbox providers. Extend as abuse shows up; a maintained list
// (e.g. the disposable-email-domains project) can replace this later.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
  "10minutemail.net", "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmailo.com", "throwawaymail.com",
  "yopmail.com", "yopmail.net", "getnada.com", "nada.email", "trashmail.com", "dispostable.com",
  "maildrop.cc", "mailnesia.com", "mintemail.com", "fakeinbox.com", "emailondeck.com", "moakt.com",
  "mohmal.com", "burnermail.io", "spamgourmet.com", "mailcatch.com", "tempinbox.com", "inboxkitten.com",
  "mail.tm", "mailpoof.com", "33mail.com", "spambox.us", "trbvm.com", "dropmail.me", "emailfake.com",
  "fakemail.net", "luxusmail.org", "tmail.ws", "tmpmail.org", "tmpmail.net", "1secmail.com", "1secmail.org",
]);

// Rejects disposable providers and domains that can't receive mail.
// The emailed code is what actually proves the address is real.
export async function checkEmailDomain(email: string): Promise<string | null> {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) return "Please use your regular email address, not a temporary one.";
  if (process.env.NODE_ENV !== "production" && domain.endsWith(".test")) return null;
  try {
    const mx = await resolveMx(domain);
    if (!mx.length) return "That email domain can't receive mail. Check for typos.";
  } catch {
    return "That email domain can't receive mail. Check for typos.";
  }
  return null;
}

// Sends through Resend when RESEND_API_KEY is set; otherwise prints to the server log (development).
// `headers` is for extras such as List-Unsubscribe on alert emails.
export async function sendEmail(to: string, subject: string, text: string, replyTo?: string, headers?: Record<string, string>) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email to ${to}${replyTo ? `, reply-to ${replyTo}` : ""}] ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "BharathMela <no-reply@example.com>",
      to,
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(headers ? { headers } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
}
