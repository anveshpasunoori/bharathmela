import { createHmac } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { intentDay } from "@/lib/market-intent-data";
import { clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return new Response(null, { status: 204 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-z0-9]{10,40}$/.test(id)) return new Response(null, { status: 400 });
  const now = new Date();
  const day = intentDay(now);
  try {
    const [listing, viewer] = await Promise.all([
      db.listing.findFirst({ where: { id, ...publicListing(now) }, select: { vendor: { select: { userId: true } } } }),
      getCurrentUser(),
    ]);
    if (!listing || viewer?.id === listing.vendor.userId) return new Response(null, { status: 204 });
    const who = viewer?.id ?? `${await clientIp(request.headers)}|${request.headers.get("user-agent")?.slice(0, 300) ?? ""}`;
    const visitorKey = createHmac("sha256", secret).update(`listing-view|${day.toISOString()}|${who}`).digest("hex").slice(0, 32);
    await db.$transaction(async (tx) => {
      const result = await tx.listingView.createMany({ data: [{ listingId: id, day, visitorKey }], skipDuplicates: true });
      if (!result.count) return;
      await tx.listing.update({ where: { id }, data: { views: { increment: 1 } } });
      await tx.adBoost.updateMany({
        where: { listingId: id, status: "ACTIVE", startsAt: { lte: now }, endsAt: { gt: now }, viewTrackingStartedAt: { not: null } },
        data: { trackedViews: { increment: 1 } },
      });
    });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
