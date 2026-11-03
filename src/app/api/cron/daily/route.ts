import { syncExpirations } from "@/lib/billing";
import { cronAuthorized } from "@/lib/cron";
import { db } from "@/lib/db";
import { pruneRateLimits } from "@/lib/rate-limit";
import { runSearchAlerts } from "@/lib/saved-searches";

// The daily job (vercel.json runs it every morning): expire plans, boosts and listings and send expiry
// reminders, email saved-search alerts, and clear expired logins, codes and rate-limit counters.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  const now = new Date();
  await syncExpirations({ force: true });
  const alerts = await runSearchAlerts(now);
  const [sessions, emailCodes, phoneCodes, limits] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.emailCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.phoneCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    pruneRateLimits(),
  ]);
  return Response.json({ alerts, cleared: { sessions: sessions.count, emailCodes: emailCodes.count, phoneCodes: phoneCodes.count, rateLimits: limits.count } });
}
