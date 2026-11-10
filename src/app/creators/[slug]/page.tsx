import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorsHub } from "@/components/CreatorsHub";
import { creatorPageFromSlug, creatorPagePath, creatorPageTitle, creatorsFor } from "@/lib/creator-pages";

// One page per niche (/creators/food) and per content language (/creators/telugu), across every city.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = creatorPageFromSlug((await params).slug);
  if (!page) return {};
  const count = (await creatorsFor(page)).length;
  const title = `${creatorPageTitle(page)} in the US`.replace(/^./, (c) => c.toUpperCase());
  const description =
    page.kind === "language"
      ? `${page.language}-speaking creators and influencers who promote businesses${count ? `: ${count} listed` : ""}. Compare followers, niches and rates, verified handles, and creators open to barter.`
      : `Indian ${page.kind === "niche" ? page.label.toLowerCase() : ""} creators and influencers who promote businesses${count ? `: ${count} listed` : ""}. Compare followers, languages and rates, verified handles, and creators open to barter.`;
  const path = creatorPagePath(page);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    ...(count ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CreatorNichePage({ params }: { params: Promise<{ slug: string }> }) {
  const page = creatorPageFromSlug((await params).slug);
  if (!page) notFound();
  return <CreatorsHub page={page} />;
}
