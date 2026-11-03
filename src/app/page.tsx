import type { Metadata } from "next";
import { BrowsePage, type BrowseParams } from "@/components/BrowsePage";
import { CATEGORIES } from "@/lib/constants";
import { isMetro } from "@/lib/metros";
import { cityCategoryPath, cityPath } from "@/lib/seo";

// Browsing a city or a category in a city through query strings has a clean page of its own; point
// search engines there. Keyword searches aren't indexed.
export async function generateMetadata({ searchParams }: { searchParams: Promise<BrowseParams> }): Promise<Metadata> {
  const p = await searchParams;
  const category = CATEGORIES.some((c) => c.id === p.category) ? p.category : undefined;
  const canonical = isMetro(p.metro) ? (category ? cityCategoryPath(p.metro, category) : cityPath(p.metro)) : "/";
  return { alternates: { canonical }, ...(p.q || p.ss ? { robots: { index: false, follow: true } } : {}) };
}

export default async function Home({ searchParams }: { searchParams: Promise<BrowseParams> }) {
  return <BrowsePage params={await searchParams} />;
}
