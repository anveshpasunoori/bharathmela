import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { HOME_CATEGORY_PHOTOS } from "@/lib/home-art";
import { categoryName } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { CATEGORY_PITCH, categoryPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Browse categories",
  description: "Explore food, classes, services, rentals, and more from Indian businesses on BharathMela.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const lang = await getLang();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Browse categories</h1>
        <p className="mt-2 text-muted">Find local businesses, classes, rentals, and more.</p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {CATEGORIES.map(({ id, label }) => {
          const photo = HOME_CATEGORY_PHOTOS[id];
          return (
            <li key={id}>
              <Link href={categoryPath(id)} className="market-tile group block h-full overflow-hidden rounded-xl border border-line bg-white shadow-soft">
                {photo && (
                  <div className="relative aspect-[3/2] overflow-hidden bg-brand-soft">
                    <Image src={photo} alt="" fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw" className="object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" />
                  </div>
                )}
                <div className="space-y-1 px-3 py-3 sm:px-4">
                  <h2 className="font-semibold leading-tight text-forest">{categoryName(lang, id, label)}</h2>
                  <p className="text-xs leading-relaxed text-muted">{CATEGORY_PITCH[id]}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
