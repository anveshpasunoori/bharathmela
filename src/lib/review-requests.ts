import "server-only";
// "How was it?" emails: a few days after a buyer messages a seller about a listing, ask them once to rate
// that seller. Reviews are what make buyers trust a new marketplace (and show as stars in search results).
import { db } from "./db";
import { sendEmail } from "./email";
import { absoluteUrl, listingPath } from "./seo";

const DAY_MS = 86_400_000;
const AFTER_DAYS = 3; // long enough for the order, class or job to have happened
const WITHIN_DAYS = 10; // don't ask about old conversations
const MAX_PER_RUN = 300;

export async function runReviewRequests(now = new Date()) {
  const messages = await db.message.findMany({
    where: {
      createdAt: { lte: new Date(now.getTime() - AFTER_DAYS * DAY_MS), gt: new Date(now.getTime() - WITHIN_DAYS * DAY_MS) },
      listingId: { not: null },
      fromUser: { role: "BUYER", deletedAt: null, suspendedAt: null },
      toUser: { vendor: { isNot: null } },
    },
    select: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { vendor: { select: { id: true, businessName: true } } } },
      listing: { select: { id: true, title: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 2000,
  });

  // One request per buyer and seller, about the first listing they asked about.
  const pairs = new Map<string, (typeof messages)[number]>();
  for (const m of messages) {
    const vendor = m.toUser.vendor;
    if (!vendor || !m.listing) continue;
    const key = `${m.fromUser.id}|${vendor.id}`;
    if (!pairs.has(key)) pairs.set(key, m);
  }

  let sent = 0;
  for (const m of pairs.values()) {
    if (sent >= MAX_PER_RUN) break;
    const vendor = m.toUser.vendor!;
    const [asked, reviewed] = await Promise.all([
      db.reviewRequest.findUnique({ where: { buyerId_vendorId: { buyerId: m.fromUser.id, vendorId: vendor.id } } }),
      db.review.findUnique({ where: { vendorId_buyerId: { vendorId: vendor.id, buyerId: m.fromUser.id } } }),
    ]);
    if (asked || reviewed || m.listing!.status === "REMOVED") continue;
    // Record first, so a crash mid-run can't send the same request twice.
    await db.reviewRequest.create({ data: { buyerId: m.fromUser.id, vendorId: vendor.id } });
    const ok = await sendEmail(
      m.fromUser.email,
      `How was ${vendor.businessName}?`,
      `Hi ${m.fromUser.name},\n\nYou contacted ${vendor.businessName} about "${m.listing!.title}" on BharathMela a few days ago. If you went ahead, a quick rating helps other families in your city choose, and helps a small business grow.\n\nRate ${vendor.businessName}: ${absoluteUrl(`${listingPath(m.listing!)}?review=1#reviews`)}\n\nIt takes 30 seconds. If you didn't end up using them, just ignore this email.\n\n– BharathMela`,
    );
    if (ok) sent++;
    else await db.reviewRequest.delete({ where: { buyerId_vendorId: { buyerId: m.fromUser.id, vendorId: vendor.id } } });
  }
  return { reviewRequests: sent };
}
