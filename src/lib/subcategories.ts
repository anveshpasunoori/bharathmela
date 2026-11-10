// The subcategories of each category (Auto Services → Oil change, Towing…), in one place for the browse
// chips, the clean city pages (/in/jacksonville/auto-services/oil-change) and the sitemap. Most come from
// the seller-picked service types; rooms, realtors, lawyers and event vendors keep their own lists in
// their listing details and filter by their own URL parameter.
import { NICHES, readCreator } from "./creators";
import { EVENT_SERVICES, readEventService } from "./event-services";
import { SPECIALTIES, readProfessional } from "./professionals";
import { SPACE_TYPES, readRental } from "./rentals";
import { cityCategoryPath } from "./seo";
import { SERVICE_TYPES, parseServiceTypes } from "./service-types";

export type SubcategoryParam = "type" | "space" | "spec" | "svc" | "niche";
export type Subcategory = { id: string; label: string; slug: string };

const withSlugs = (list: { id: string; label: string }[]) =>
  list.map((o) => ({ ...o, slug: o.id.toLowerCase().replace(/_/g, "-") }));

export function subcategoriesFor(category: string | undefined): { param: SubcategoryParam; options: Subcategory[] } | null {
  if (!category) return null;
  if (category === "ROOM_RENTAL") return { param: "space", options: withSlugs(SPACE_TYPES) };
  if (category === "EVENT_SERVICES") return { param: "svc", options: withSlugs(EVENT_SERVICES) };
  if (category === "CREATORS") return { param: "niche", options: withSlugs(NICHES) };
  if (SPECIALTIES[category]) return { param: "spec", options: withSlugs(SPECIALTIES[category]) };
  if (SERVICE_TYPES[category]) return { param: "type", options: withSlugs(SERVICE_TYPES[category]) };
  return null;
}

export const subcategoryFromSlug = (category: string, slug: string) =>
  subcategoriesFor(category)?.options.find((o) => o.slug === slug);

export const subcategoryLabel = (category: string, id: string) =>
  subcategoriesFor(category)?.options.find((o) => o.id === id)?.label;

export const citySubcategoryPath = (metro: string, category: string, id: string) => {
  const sub = subcategoriesFor(category)?.options.find((o) => o.id === id);
  return sub ? `${cityCategoryPath(metro, category)}/${sub.slug}` : cityCategoryPath(metro, category);
};

// The subcategory picked in a browse page's parameters, if any.
export function pickedSubcategory(category: string | undefined, params: Record<string, string | undefined>) {
  const subs = subcategoriesFor(category);
  if (!subs) return undefined;
  const id = params[subs.param];
  return subs.options.find((o) => o.id === id);
}

// The subcategories one listing appears under (for the sitemap).
export function listingSubcategories(l: { category: string; tags: string; details: string }): string[] {
  const subs = subcategoriesFor(l.category);
  if (!subs) return [];
  if (subs.param === "space") return [readRental(l.details)?.spaceType ?? ""].filter(Boolean);
  if (subs.param === "spec") return readProfessional(l.details)?.specialties ?? [];
  if (subs.param === "svc") return readEventService(l.details)?.services ?? [];
  if (subs.param === "niche") return readCreator(l.details)?.niches ?? [];
  return parseServiceTypes(l.category, l.tags);
}
