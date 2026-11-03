import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { ratingsFor } from "./reviews";
import { type RentalFilters, matchesRentalFilters, readRental, rentalSearchText } from "./rentals";
import { parseQuery, rankListings, suggestQuery } from "./search";

// Listings anyone can see: live, and from a seller who isn't suspended or deleted.
export const PUBLIC_LISTING: Prisma.ListingWhereInput = {
  status: "ACTIVE",
  vendor: { user: { suspendedAt: null, deletedAt: null } },
};

const withPlans = (now: Date) =>
  ({
    vendor: { include: { subscriptions: { where: { status: "ACTIVE", endsAt: { gt: now } }, select: { plan: true } } } },
  }) satisfies Prisma.ListingInclude;

// Browse a city. Without a search: featured (paid boost) first, then Pro sellers, then newest.
// With a search: best matches first, with a small lift for featured and Pro listings.
export async function browseListings(
  metro: string,
  category?: string,
  query = "",
  diet: string[] = [],
  rentalFilters: RentalFilters = {},
) {
  const now = new Date();
  const filters: Prisma.ListingWhereInput = {
    ...PUBLIC_LISTING,
    ...(category ? { category } : {}),
    // Every chosen dietary marker must be on the listing.
    AND: diet.map((tag) => ({ tags: { contains: `,${tag},` } })),
  };
  const parsed = parseQuery(query);
  const searching = parsed.terms.length > 0 || parsed.maxPriceCents != null || parsed.minPriceCents != null;

  const filteringRentals = category === "ROOM_RENTAL" && Object.values(rentalFilters).some((v) => v != null && v !== false);
  const fetched = await db.listing.findMany({
    where: { ...filters, metro },
    include: withPlans(now),
    orderBy: { createdAt: "desc" },
    take: searching || filteringRentals ? 5000 : 200,
  });
  const candidates = filteringRentals
    ? fetched.filter((l) => matchesRentalFilters(readRental(l.details), l.priceCents, rentalFilters))
    : fetched;
  // Rental details (space type, neighborhood, amenities) are searchable too.
  const scored = searching
    ? rankListings(
        parsed,
        candidates.map((l) => {
          const rental = l.category === "ROOM_RENTAL" ? readRental(l.details) : null;
          return { ...l, description: rental ? `${l.description} ${rentalSearchText(rental)}` : l.description, original: l };
        }),
      ).map(({ item, score }) => ({ item: item.original, score }))
    : candidates.map((item) => ({ item, score: 0 }));

  const ratings = await ratingsFor([...new Set(scored.map((s) => s.item.vendorId))]);
  const listings = scored.map(({ item, score }) => {
    const isFeatured = !!item.featuredUntil && item.featuredUntil > now;
    const isPro = item.vendor.subscriptions.some((s) => s.plan === "PRO");
    return { ...item, isFeatured, isPro, rating: ratings.get(item.vendorId), score: score * (isFeatured ? 1.15 : 1) * (isPro ? 1.05 : 1) };
  });
  listings.sort((a, b) =>
    searching ? b.score - a.score : Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isPro) - Number(a.isPro),
  );

  // Help when a search comes up short: a spelling fix, or the same search in other cities.
  let suggestion: string | null = null;
  let otherMetros: { metro: string; count: number }[] = [];
  if (searching && parsed.terms.length && listings.length < 3) {
    suggestion = suggestQuery(parsed, candidates);
    if (!listings.length) {
      const elsewhere = await db.listing.findMany({
        where: { ...filters, metro: { not: metro } },
        select: { id: true, title: true, description: true, category: true, priceCents: true, priceUnit: true, tags: true, metro: true, vendor: { select: { businessName: true } } },
        take: 5000,
      });
      const counts = new Map<string, number>();
      for (const { item } of rankListings(parsed, elsewhere)) counts.set(item.metro, (counts.get(item.metro) ?? 0) + 1);
      otherMetros = [...counts].map(([m, count]) => ({ metro: m, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      if (!suggestion) suggestion = suggestQuery(parsed, elsewhere);
    }
  }

  return {
    listings,
    search: {
      active: searching,
      suggestion,
      otherMetros,
      hintedCategory: parsed.hintedCategory,
      maxPriceCents: parsed.maxPriceCents,
      minPriceCents: parsed.minPriceCents,
    },
  };
}

export type BrowseListing = Awaited<ReturnType<typeof browseListings>>["listings"][number];
