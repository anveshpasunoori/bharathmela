import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowsePage, type BrowseParams } from "@/components/BrowsePage";
import { isMetro, metroName } from "@/lib/metros";
import { cityPath } from "@/lib/seo";

// One indexable page per city: "Indian home businesses in Jacksonville, FL".
// Rendered on request (it reads the visitor's location); the sitemap lists every combination.

export async function generateMetadata({ params }: { params: Promise<{ metro: string }> }): Promise<Metadata> {
  const { metro } = await params;
  if (!isMetro(metro)) return {};
  const city = metroName(metro);
  const title = `Indian home businesses, services and events in ${city}`;
  const description = `Home food, tutors, pujaris, dance and music classes, wedding vendors, home services, rooms and more from the Indian community in ${city}. Compare prices and reviews and contact sellers directly.`;
  return { title, description, alternates: { canonical: cityPath(metro) }, openGraph: { title, description, url: cityPath(metro) } };
}

export default async function CityPage({ params, searchParams }: { params: Promise<{ metro: string }>; searchParams: Promise<BrowseParams> }) {
  const { metro } = await params;
  if (!isMetro(metro)) notFound();
  const query = await searchParams;
  return <BrowsePage params={{ ...query, metro: query.radius ? undefined : metro }} />;
}
