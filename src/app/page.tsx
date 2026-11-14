import type { Metadata } from "next";
import { BrowsePage, type BrowseParams } from "@/components/BrowsePage";
import { HomePage } from "@/components/home/HomePage";
import { CATEGORIES } from "@/lib/constants";
import { isMetro } from "@/lib/metros";
import { SITE_DESCRIPTION, SITE_NAME, cityCategoryPath, cityPath } from "@/lib/seo";

// Browsing a city or a category in a city through query strings has a clean page of its own; point
// search engines there. Keyword searches aren't indexed.
export async function generateMetadata({ searchParams }: { searchParams: Promise<BrowseParams> }): Promise<Metadata> {
  const p = await searchParams;
  // The plain home page is the brand's landing page: lead with the name and its other spelling, so a
  // search for "BharathMela" or "Bharat Mela" lands here rather than on /about.
  if (!Object.values(p).some((v) => v != null && v !== ""))
    return {
      title: { absolute: `${SITE_NAME} (Bharat Mela) – Indian businesses near you in the US` },
      description: `${SITE_NAME} (Bharat Mela) is the marketplace for the Indian community in the US. ${SITE_DESCRIPTION}`,
      alternates: { canonical: "/" },
    };
  const category = CATEGORIES.some((c) => c.id === p.category) ? p.category : undefined;
  const canonical = isMetro(p.metro) ? (category ? cityCategoryPath(p.metro, category) : cityPath(p.metro)) : "/";
  return { alternates: { canonical }, ...(p.q || p.ss ? { robots: { index: false, follow: true } } : {}) };
}

// The plain home page gets its own layout; any search, category, city or filter opens the browse page.
export default async function Home({ searchParams }: { searchParams: Promise<BrowseParams> }) {
  const params = await searchParams;
  if (!Object.values(params).some((v) => v != null && v !== "")) return <HomePage />;
  return <BrowsePage params={params} />;
}
