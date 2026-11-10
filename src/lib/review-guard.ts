import "server-only";
// Guardrails against fake ratings. Ratings that look risky aren't refused: they're held (status PENDING)
// until an admin checks them, so honest customers aren't turned away and fakers don't learn which rule
// they tripped. The buyer is only told their rating will appear after a quick check.
import { createHash } from "node:crypto";
import { db } from "./db";
import { clientIp } from "./rate-limit";

const DAY_MS = 86_400_000;
// A seller getting more than this many ratings in a day is unusual for a local business.
const BURST_PER_DAY = 5;
const NEW_ACCOUNT_MS = DAY_MS;
const SAME_NETWORK_DAYS = 90;

// Hash of the visitor's network address, salted so it can't be reversed from the database alone.
export async function ipHash() {
  const ip = await clientIp();
  if (ip === "unknown") return "";
  const salt = process.env.IP_HASH_SECRET || process.env.CRON_SECRET || "bharathmela";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32);
}

// Ratings bought with a discount, refund or gift, or written to order.
const INCENTIVE =
  /\b(in exchange for|for a (free|discount)|got (a )?(discount|refund|gift|freebie|free \w+) (for|to) (this|my|the) (review|rating)|paid (review|rating)|asked (me )?to (give|leave) 5|told (me )?to (give|leave) 5|5 stars? (for|and get) (a )?(discount|free))\b/i;

// Words that only show up when a review is written from a template or by the seller.
const SCRIPTED = /\b(\[(business|seller|name)\]|insert (name|business)|as an ai|my (own )?business|our (shop|kitchen|business) (is|was))\b/i;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

type Check = { vendorId: string; vendorUserId: string; buyer: { id: string; createdAt: Date }; comment: string; ip: string };

// What makes a rating trustworthy (a recorded contact), and the reasons to hold it, if any.
export async function checkReview({ vendorId, vendorUserId, buyer, comment, ip }: Check) {
  const since = new Date(Date.now() - SAME_NETWORK_DAYS * DAY_MS);
  const [conversation, asked, seller, sameNetwork, lastDay, sameText] = await Promise.all([
    db.conversation.findFirst({
      where: {
        OR: [
          { startedById: buyer.id, otherId: vendorUserId },
          { startedById: vendorUserId, otherId: buyer.id },
        ],
      },
      select: { id: true },
    }),
    db.reviewRequest.findUnique({ where: { buyerId_vendorId: { buyerId: buyer.id, vendorId } }, select: { id: true } }),
    db.user.findUnique({ where: { id: vendorUserId }, select: { lastIpHash: true } }),
    ip
      ? db.review.count({ where: { vendorId, ipHash: ip, buyerId: { not: buyer.id }, updatedAt: { gte: since } } })
      : Promise.resolve(0),
    db.review.count({ where: { vendorId, buyerId: { not: buyer.id }, createdAt: { gte: new Date(Date.now() - DAY_MS) } } }),
    normalize(comment).length >= 20
      ? db.review.findMany({ where: { buyerId: { not: buyer.id }, comment: { not: "" } }, select: { comment: true }, orderBy: { createdAt: "desc" }, take: 2000 })
      : Promise.resolve([]),
  ]);

  const verifiedContact = !!(conversation || asked);
  const reasons: string[] = [];
  if (ip && seller?.lastIpHash === ip) reasons.push("rated from the seller's own network");
  if (sameNetwork > 0) reasons.push(`another account rated this seller from the same network (${sameNetwork})`);
  if (!verifiedContact && Date.now() - buyer.createdAt.getTime() < NEW_ACCOUNT_MS) reasons.push("account under a day old with no contact with the seller");
  if (lastDay >= BURST_PER_DAY) reasons.push(`${lastDay + 1} ratings for this seller in 24 hours`);
  if (INCENTIVE.test(comment)) reasons.push("mentions a reward for the rating");
  if (SCRIPTED.test(comment)) reasons.push("reads like a template or the seller's own words");
  const text = normalize(comment);
  if (sameText.some((r) => normalize(r.comment) === text)) reasons.push("same text as another account's rating");

  return { verifiedContact, holdReason: reasons.join("; ") };
}
