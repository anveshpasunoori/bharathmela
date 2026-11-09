"use server";

import type { FormState } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { CONTACT_TOPICS } from "@/lib/contact";
import { sendEmail } from "@/lib/email";
import { TOO_MANY, clientIp, hit } from "@/lib/rate-limit";

// The Contact page: sends the message to SUPPORT_EMAIL with the sender as reply-to, so support can answer
// from their own inbox.
export async function sendContactMessage(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const topic = String(form.get("topic") ?? "");
  const message = String(form.get("message") ?? "").trim().slice(0, 4000);
  if (!name) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter your email so we can reply." };
  if (!(CONTACT_TOPICS as readonly string[]).includes(topic)) return { error: "Choose what this is about." };
  if (message.length < 10) return { error: "Please tell us a little more." };
  if (!(await hit("contact", await clientIp()))) return { error: TOO_MANY };
  const to = process.env.SUPPORT_EMAIL;
  if (!to) {
    console.error("[contact] SUPPORT_EMAIL is not set; message not delivered");
    return { error: "Our contact form isn't working right now. Please try again later." };
  }
  const account = user ? `\nAccount: ${user.email} (${user.role.toLowerCase()}${user.vendor ? `, seller` : ""})` : "\nNot signed in";
  const sent = await sendEmail(to, `[${topic}] from ${name}`, `${message}\n\n—\nFrom: ${name} <${email}>${account}`, email);
  if (!sent) return { error: "We couldn't send your message just now. Please try again in a few minutes." };
  return { message: "Thanks, we got your message. We usually reply within one business day." };
}
