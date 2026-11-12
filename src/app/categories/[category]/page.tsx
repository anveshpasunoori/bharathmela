import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowsePage, type BrowseParams } from "@/components/BrowsePage";
import { categoryLabel } from "@/lib/constants";
import { CATEGORY_PITCH, CATEGORY_SEO_TITLE, categoryFromSlug, categoryPath } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<BrowseParams>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = categoryFromSlug((await params).category);
  if (!category) return {};
  return {
    title: CATEGORY_SEO_TITLE[category] ?? categoryLabel(category),
    description: `${CATEGORY_PITCH[category]}. Browse listings and contact sellers directly on BharathMela.`,
    alternates: { canonical: categoryPath(category) },
    robots: { index: false, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = categoryFromSlug((await params).category);
  if (!category) notFound();
  return <BrowsePage params={{ ...await searchParams, category }} categoryLanding />;
}
