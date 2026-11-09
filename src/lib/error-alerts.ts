import "server-only";
// Emails ALERT_EMAIL (or SUPPORT_EMAIL) when a request fails in production, at most once an hour for each
// distinct error, so a broken page is noticed without flooding the inbox. Details stay in the host's logs.
import { sendEmail } from "./email";
import { hit } from "./rate-limit";
import { siteUrl } from "./seo";

export async function alertOnError(e: { message?: string; digest?: string; stack?: string }, request: { path: string; method: string }) {
  const to = process.env.ALERT_EMAIL || process.env.SUPPORT_EMAIL;
  if (process.env.NODE_ENV !== "production" || !to) return;
  // Same error on the same page = one alert an hour; numbers and ids in paths are folded together.
  const where = request.path.split("?")[0].replace(/\/[a-z0-9]{20,}[^/]*/gi, "/:id");
  const signature = `${where}|${(e.message ?? "").slice(0, 120)}`;
  if (!(await hit("errorAlert", signature))) return;
  await sendEmail(
    to,
    `[BharathMela error] ${request.method} ${where}`,
    `A request failed on ${siteUrl()}.\n\nPage: ${request.method} ${request.path}\nError: ${e.message ?? "(no message)"}\nDigest: ${e.digest ?? "-"}\n\n${(e.stack ?? "").split("\n").slice(0, 8).join("\n")}\n\nMore in the host's logs (search for the digest). You'll get at most one email an hour for this error.`,
  );
}
