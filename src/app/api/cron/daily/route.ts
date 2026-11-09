import { syncExpirations } from "@/lib/billing";
import { cronAuthorized } from "@/lib/cron";
import { db } from "@/lib/db";
import { pruneRateLimits } from "@/lib/rate-limit";
import { runCityDigest } from "@/lib/city-digest";
import { runReviewRequests } from "@/lib/review-requests";
import { runSearchAlerts } from "@/lib/saved-searches";

// The daily job (vercel.json runs it every morning): expire plans, boosts and listings and send expiry
// reminders, email saved-search alerts, "how was it?" review requests and (on the 1st) the monthly city
// email, and clear expired logins, codes and rate-limit counters.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  const now = new Date();
  await syncExpirations({ force: true });
  const alerts = await runSearchAlerts(now);
  const reviews = await runReviewRequests(now);
  // The monthly city email goes out on the 1st; ?digest=1 sends it now (for testing).
  const digest = await runCityDigest(now, { force: new URL(req.url).searchParams.get("digest") === "1" });
  const [sessions, emailCodes, phoneCodes, limits] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.emailCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.phoneCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    pruneRateLimits(),
  ]);
  return Response.json({ alerts, ...reviews, ...digest, cleared: { sessions: sessions.count, emailCodes: emailCodes.count, phoneCodes: phoneCodes.count, rateLimits: limits.count } });
}
