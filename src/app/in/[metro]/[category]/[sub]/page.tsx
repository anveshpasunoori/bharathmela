import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowsePage, type BrowseParams } from "@/components/BrowsePage";
import { categoryLabel } from "@/lib/constants";
import { parseFilters } from "@/lib/browse-params";
import { browseListings } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { categoryFromSlug } from "@/lib/seo";
import { citySubcategoryPath, subcategoriesFor, subcategoryFromSlug } from "@/lib/subcategories";

// One indexable page per city, category and subcategory: "Oil change in Jacksonville, FL".

async function resolve(params: Promise<{ metro: string; category: string; sub: string }>) {
  const { metro, category: slug, sub: subSlug } = await params;
  const category = categoryFromSlug(slug);
  if (!isMetro(metro) || !category) return null;
  const sub = subcategoryFromSlug(category, subSlug);
  if (!sub) return null;
  return { metro, category, sub, param: subcategoriesFor(category)!.param };
}

export async function generateMetadata({ params }: { params: Promise<{ metro: string; category: string; sub: string }> }): Promise<Metadata> {
  const page = await resolve(params);
  if (!page) return {};
  const { metro, category, sub, param } = page;
  const city = metroName(metro);
  const f = parseFilters({ category, [param]: sub.id });
  const { listings } = await browseListings({ metro, ...f, query: f.q, sort: "new" });
  const count = listings.length;
  const title = `${sub.label} in ${city}`;
  const description = `${sub.label} from the Indian community in ${city}${count ? `: ${count} local listing${count === 1 ? "" : "s"}` : ""}, under ${categoryLabel(category)}. Compare prices and reviews and contact sellers directly on BharathMela.`;
  const path = citySubcategoryPath(metro, category, sub.id);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    // Kept out of search results until something is listed.
    ...(count ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CitySubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ metro: string; category: string; sub: string }>;
  searchParams: Promise<BrowseParams>;
}) {
  const page = await resolve(params);
  if (!page) notFound();
  const query = await searchParams;
  return <BrowsePage params={{ ...query, category: page.category, [page.param]: page.sub.id, metro: page.metro }} />;
}
