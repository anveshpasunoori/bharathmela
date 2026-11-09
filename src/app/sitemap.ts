import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicEventWhere } from "@/lib/event-data";
import { publicListing } from "@/lib/listings";
import { METROS } from "@/lib/metros";
import { ALL_CITY_CATEGORY_PAGES, absoluteUrl, cityCategoryPath, cityPath, eventPath, listingPath, sellerPath } from "@/lib/seo";
import { citySubcategoryPath, listingSubcategories } from "@/lib/subcategories";

// Built on request from the live database (not at deploy time, so builds don't need a database).
export const dynamic = "force-dynamic";

// Every public page search engines should know about: city and city-category pages, live listings,
// subcategory pages with listings, upcoming events and seller pages. City-category pages with live listings come first.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [listings, events, sellers, counts] = await Promise.all([
    db.listing.findMany({ where: publicListing(), select: { id: true, title: true, updatedAt: true, metro: true, category: true, tags: true, details: true }, orderBy: { updatedAt: "desc" }, take: 45_000 }),
    db.event.findMany({ where: publicEventWhere(now), select: { id: true, title: true, updatedAt: true }, take: 5_000 }),
    db.vendorProfile.findMany({
      where: { user: { suspendedAt: null, deletedAt: null }, listings: { some: publicListing() } },
      select: { id: true, businessName: true },
      take: 20_000,
    }),
    db.listing.groupBy({ by: ["metro", "category"], where: publicListing(), _count: true, _max: { updatedAt: true } }),
  ]);
  const live = new Map(counts.map((c) => [`${c.metro}|${c.category}`, c._max.updatedAt ?? now]));
  // Subcategory pages ("Oil change in Jacksonville") only once something is listed under them.
  const subPages = new Map<string, Date>();
  for (const l of listings) {
    for (const id of listingSubcategories(l)) {
      const url = citySubcategoryPath(l.metro, l.category, id);
      if (!subPages.has(url) || subPages.get(url)! < l.updatedAt) subPages.set(url, l.updatedAt);
    }
  }

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/events"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/rooms-wanted"), changeFrequency: "daily", priority: 0.5 },
    ...["/pricing", "/safety", "/contact", "/terms", "/privacy"].map((p) => ({ url: absoluteUrl(p), changeFrequency: "monthly" as const, priority: 0.3 })),
    ...METROS.map((m) => ({ url: absoluteUrl(cityPath(m.id)), changeFrequency: "daily" as const, priority: 0.8 })),
    ...ALL_CITY_CATEGORY_PAGES().map(({ metro, category }) => {
      const updated = live.get(`${metro}|${category}`);
      return { url: absoluteUrl(cityCategoryPath(metro, category)), lastModified: updated, changeFrequency: "daily" as const, priority: updated ? 0.9 : 0.4 };
    }),
    ...[...subPages].map(([url, updated]) => ({ url: absoluteUrl(url), lastModified: updated, changeFrequency: "daily" as const, priority: 0.8 })),
    ...listings.map((l) => ({ url: absoluteUrl(listingPath(l)), lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...events.map((e) => ({ url: absoluteUrl(eventPath(e)), lastModified: e.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...sellers.map((s) => ({ url: absoluteUrl(sellerPath(s)), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
