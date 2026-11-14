import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicEventWhere } from "@/lib/event-data";
import { publicListing } from "@/lib/listings";
import { METROS } from "@/lib/metros";
import { ALL_CITY_CATEGORY_PAGES, absoluteUrl, cityCategoryPath, cityPath, eventPath, listingPath, sellerPath } from "@/lib/seo";
import { citySubcategoryPath, listingSubcategories } from "@/lib/subcategories";
import { COMPARISONS, comparePath } from "@/lib/compare";
import { CREATORS_PATH, LANGUAGE_PAGES, NICHE_PAGES, creatorPageCounts, creatorPagePath } from "@/lib/creator-pages";

// Built on request from the live database (not at deploy time, so builds don't need a database).
export const dynamic = "force-dynamic";

// Every public page search engines should know about: city pages, city-category and subcategory pages
// with listings, live listings, upcoming events and seller pages. City-category pages with live listings come first.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [listings, events, sellers, counts, creators] = await Promise.all([
    db.listing.findMany({ where: publicListing(), select: { id: true, title: true, updatedAt: true, metro: true, category: true, tags: true, details: true }, orderBy: { updatedAt: "desc" }, take: 45_000 }),
    db.event.findMany({ where: publicEventWhere(now), select: { id: true, title: true, updatedAt: true }, take: 5_000 }),
    db.vendorProfile.findMany({
      where: { user: { suspendedAt: null, deletedAt: null }, listings: { some: publicListing() } },
      select: { id: true, businessName: true, publicPath: true },
      take: 20_000,
    }),
    db.listing.groupBy({ by: ["metro", "category"], where: publicListing(), _count: true, _max: { updatedAt: true } }),
    creatorPageCounts(),
  ]);
  // Nationwide creators pages: the hub, and niche and language pages once someone is listed under them.
  const creatorPages = [
    ...NICHE_PAGES.filter((p) => creators.niches.get(p.id)),
    ...LANGUAGE_PAGES.filter((p) => creators.languages.get(p.language)),
  ];
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
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/events"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/rooms-wanted"), changeFrequency: "daily", priority: 0.5 },
    ...["/pricing", "/safety", "/contact", "/terms", "/privacy"].map((p) => ({ url: absoluteUrl(p), changeFrequency: "monthly" as const, priority: 0.3 })),
    { url: absoluteUrl("/indian-classifieds"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/compare"), changeFrequency: "monthly", priority: 0.5 },
    ...COMPARISONS.map((c) => ({ url: absoluteUrl(comparePath(c)), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: absoluteUrl(CREATORS_PATH), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/influencers"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/hire-influencers"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/free-instagram-influencer"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/free-youtube-influencer"), changeFrequency: "monthly", priority: 0.7 },
    ...creatorPages.map((p) => ({ url: absoluteUrl(creatorPagePath(p)), changeFrequency: "daily" as const, priority: 0.7 })),
    ...METROS.map((m) => ({ url: absoluteUrl(cityPath(m.id)), changeFrequency: "daily" as const, priority: 0.8 })),
    // Only pages with something listed: empty ones ask search engines not to index them.
    ...ALL_CITY_CATEGORY_PAGES().flatMap(({ metro, category }) => {
      const updated = live.get(`${metro}|${category}`);
      return updated ? [{ url: absoluteUrl(cityCategoryPath(metro, category)), lastModified: updated, changeFrequency: "daily" as const, priority: 0.9 }] : [];
    }),
    ...[...subPages].map(([url, updated]) => ({ url: absoluteUrl(url), lastModified: updated, changeFrequency: "daily" as const, priority: 0.8 })),
    ...listings.map((l) => ({ url: absoluteUrl(listingPath(l)), lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...events.map((e) => ({ url: absoluteUrl(eventPath(e)), lastModified: e.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...sellers.map((s) => ({ url: absoluteUrl(sellerPath(s)), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
