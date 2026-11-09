import "server-only";
// How fast a seller answers messages: for each buyer who wrote in the last 90 days, the time until the
// seller's first reply. Shown as "Usually replies within an hour" once there are a few conversations.
import { db } from "./db";

const DAY_MS = 86_400_000;
const MIN_CONVERSATIONS = 3;

export async function replyTimeLabel(sellerUserId: string, now = new Date()) {
  const since = new Date(now.getTime() - 90 * DAY_MS);
  const [incoming, outgoing] = await Promise.all([
    db.message.findMany({ where: { toUserId: sellerUserId, createdAt: { gt: since } }, select: { fromUserId: true, createdAt: true }, orderBy: { createdAt: "asc" }, take: 500 }),
    db.message.findMany({ where: { fromUserId: sellerUserId, createdAt: { gt: since } }, select: { toUserId: true, createdAt: true }, orderBy: { createdAt: "asc" }, take: 500 }),
  ]);
  // Each buyer's first message, and the seller's first reply to that buyer after it.
  const firstAsk = new Map<string, Date>();
  for (const m of incoming) if (!firstAsk.has(m.fromUserId)) firstAsk.set(m.fromUserId, m.createdAt);
  const waits: number[] = [];
  for (const [buyer, asked] of firstAsk) {
    const reply = outgoing.find((m) => m.toUserId === buyer && m.createdAt > asked);
    // No reply counts as a long wait, so ignoring messages doesn't look fast.
    waits.push(reply ? reply.createdAt.getTime() - asked.getTime() : 3 * DAY_MS);
  }
  if (waits.length < MIN_CONVERSATIONS) return null;
  const median = [...waits].sort((a, b) => a - b)[Math.floor(waits.length / 2)];
  const hours = median / 3_600_000;
  if (hours <= 1) return "Usually replies within an hour";
  if (hours <= 4) return "Usually replies within a few hours";
  if (hours <= 24) return "Usually replies within a day";
  return null;
}
