import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowsePage, type BrowseParams } from "@/components/BrowsePage";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { isMetro, metroName } from "@/lib/metros";
import { CATEGORY_PITCH, CATEGORY_SEO_TITLE, categoryFromSlug, cityCategoryPath } from "@/lib/seo";

// One indexable page per city and category: "Home Food & Cloud Kitchens in Jacksonville, FL".
// Rendered on request (it reads the visitor's location); the sitemap lists every combination.

export async function generateMetadata({ params }: { params: Promise<{ metro: string; category: string }> }): Promise<Metadata> {
  const { metro, category: slug } = await params;
  const category = categoryFromSlug(slug);
  if (!isMetro(metro) || !category) return {};
  const city = metroName(metro);
  const count = await db.listing.count({ where: { ...publicListing(), metro, category } });
  const title = `${CATEGORY_SEO_TITLE[category] ?? categoryLabel(category)} in ${city}`;
  const description = `${CATEGORY_PITCH[category]} in ${city}${count ? `: ${count} local listing${count === 1 ? "" : "s"}` : ""}. Compare prices and reviews and contact sellers directly on BharathMela.`;
  const path = cityCategoryPath(metro, category);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    // Pages with nothing listed yet are kept out of search results until they have listings.
    ...(count ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CityCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ metro: string; category: string }>;
  searchParams: Promise<BrowseParams>;
}) {
  const { metro, category: slug } = await params;
  const category = categoryFromSlug(slug);
  if (!isMetro(metro) || !category) notFound();
  const query = await searchParams;
  return <BrowsePage params={{ ...query, category, metro: query.radius ? undefined : metro }} />;
}
