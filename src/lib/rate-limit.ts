import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

// Fixed-window counters kept in Postgres, so limits hold across every server instance.

export const LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  loginEmail: { limit: 5, windowMs: 15 * 60_000 },
  signup: { limit: 5, windowMs: 60 * 60_000 },
  report: { limit: 10, windowMs: 60 * 60_000 },
  review: { limit: 10, windowMs: 24 * 60 * 60_000 },
  payment: { limit: 10, windowMs: 24 * 60 * 60_000 },
  listing: { limit: 20, windowMs: 24 * 60 * 60_000 },
  message: { limit: 15, windowMs: 24 * 60 * 60_000 },
  sms: { limit: 5, windowMs: 24 * 60 * 60_000 },
} as const;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

// Returns true if the action is allowed, false if the caller is over the limit. One atomic statement
// starts a new window or counts the attempt, so concurrent requests can't slip past the limit.
export async function hit(kind: keyof typeof LIMITS, key: string) {
  const { limit, windowMs } = LIMITS[kind];
  const id = `${kind}:${key}`.slice(0, 300);
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${id}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return (rows[0]?.count ?? 1) <= limit;
}

// Drops expired counters; run from the daily job.
export const pruneRateLimits = () => db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });

export const TOO_MANY = "Too many attempts. Please wait a while and try again.";
