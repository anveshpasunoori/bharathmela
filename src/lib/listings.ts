import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { ratingsFor } from "./reviews";

// Listings anyone can see: live, and from a seller who isn't suspended or deleted.
export const PUBLIC_LISTING: Prisma.ListingWhereInput = {
  status: "ACTIVE",
  vendor: { user: { suspendedAt: null, deletedAt: null } },
};

// Public browse: featured (paid boost) first, then Pro sellers, then newest.
export async function browseListings(metro: string, category?: string, query?: string, diet: string[] = []) {
  const now = new Date();
  const words = (query ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const listings = await db.listing.findMany({
    where: {
      ...PUBLIC_LISTING,
      metro,
      ...(category ? { category } : {}),
      AND: [
        // Every word must appear in the title, description or business name.
        ...words.map((w) => ({
          OR: [{ title: { contains: w } }, { description: { contains: w } }, { vendor: { businessName: { contains: w } } }],
        })),
        // Every chosen dietary marker must be on the listing.
        ...diet.map((tag) => ({ tags: { contains: `,${tag},` } })),
      ],
    },
    include: {
      vendor: {
        include: { subscriptions: { where: { status: "ACTIVE", endsAt: { gt: now } }, select: { plan: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const ratings = await ratingsFor([...new Set(listings.map((l) => l.vendorId))]);
  const ranked = listings.map((l) => ({
    ...l,
    isFeatured: !!l.featuredUntil && l.featuredUntil > now,
    isPro: l.vendor.subscriptions.some((s) => s.plan === "PRO"),
    rating: ratings.get(l.vendorId),
  }));
  ranked.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isPro) - Number(a.isPro));
  return ranked;
}

export type BrowseListing = Awaited<ReturnType<typeof browseListings>>[number];
