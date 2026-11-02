import "server-only";
import { headers } from "next/headers";

// Fixed-window counters in memory. Good for a single server; move to Redis
// (e.g. Upstash) when running more than one instance.
const buckets = new Map<string, { count: number; resetAt: number }>();

export const LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  loginEmail: { limit: 5, windowMs: 15 * 60_000 },
  signup: { limit: 5, windowMs: 60 * 60_000 },
  report: { limit: 10, windowMs: 60 * 60_000 },
  review: { limit: 10, windowMs: 24 * 60 * 60_000 },
  payment: { limit: 10, windowMs: 24 * 60 * 60_000 },
  listing: { limit: 20, windowMs: 24 * 60 * 60_000 },
} as const;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

// Returns true if the action is allowed, false if the caller is over the limit.
export function hit(kind: keyof typeof LIMITS, key: string) {
  const { limit, windowMs } = LIMITS[kind];
  const id = `${kind}:${key}`;
  const now = Date.now();
  const bucket = buckets.get(id);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 50_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

export const TOO_MANY = "Too many attempts. Please wait a while and try again.";
