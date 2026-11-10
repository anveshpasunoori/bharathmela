import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/OurPoints";
import { CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { METROS } from "@/lib/metros";
import { CATEGORY_PITCH, cityCategoryPath, cityPath } from "@/lib/seo";
import { breadcrumbs, faqSchema } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indian Classifieds in the USA: Desi Marketplace by City",
  description:
    "Free Indian classifieds for the US: home food and tiffins, pujaris, tutors, mehndi, wedding vendors, rooms and roommates, garage sales and events from the desi community in your city.",
  alternates: { canonical: "/indian-classifieds" },
};

// A landing page for people searching "Indian classifieds" or "desi classifieds": every category, the
// cities with the most listings, and links into each.
export default async function IndianClassifiedsPage() {
  const groups = await db.listing.groupBy({ by: ["metro", "category"], where: publicListing(), _count: true });
  const byMetro = new Map<string, number>();
  const byCategory = new Map<string, { n: number; top: string; topN: number }>();
  for (const g of groups) {
    byMetro.set(g.metro, (byMetro.get(g.metro) ?? 0) + g._count);
    const c = byCategory.get(g.category) ?? { n: 0, top: g.metro, topN: 0 };
    byCategory.set(g.category, { n: c.n + g._count, top: g._count > c.topN ? g.metro : c.top, topN: Math.max(c.topN, g._count) });
  }
  const total = [...byMetro.values()].reduce((a, b) => a + b, 0);
  const cities = [...METROS].sort((a, b) => (byMetro.get(b.id) ?? 0) - (byMetro.get(a.id) ?? 0));
  const faq = [
    { q: "Are BharathMela classifieds free?", a: "Yes for buyers: browsing, messaging sellers and posting what you need are free. Sellers list their first business free, with paid plans only for more listings." },
    { q: "Which cities are covered?", a: `${METROS.length} US metro areas, including ${cities.slice(0, 5).map((m) => m.name).join(", ")}. You can also browse by distance from your ZIP code.` },
    { q: "How is this different from Craigslist or Facebook groups?", a: "Everything here is from and for the Indian community, sorted into categories like tiffins, pujaris and mehndi, with seller reviews, scam reporting and posts that stay searchable." },
    { q: "How do I post an ad?", a: "Create a free seller account, confirm your email and post your listing. Selling once, like a room or a garage sale? Post under your own name, no business needed." },
  ];
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Indian classifieds in the USA</h1>
        <p className="mt-2 text-stone-700">
          BharathMela is a free desi marketplace for the Indian community in the US{total ? `, with ${total} live listings` : ""}: home food,
          services, classes, rooms and events from people in your own city. Pick a city or a category to start.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">By city</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cities.map((m) => (
            <li key={m.id}>
              <Link href={cityPath(m.id)} className="card block py-2.5 hover:ring-brand">
                <span className="font-medium">{m.name}</span>
                <span className="block text-xs text-stone-500">{byMetro.get(m.id) ? `${byMetro.get(m.id)} listing${byMetro.get(m.id) === 1 ? "" : "s"}` : m.state}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">By category</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const s = byCategory.get(c.id);
            return (
              <li key={c.id} className="card flex gap-3">
                <CategoryIcon id={c.id} size={44} className="h-11 w-11 shrink-0" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{c.label}</p>
                  <p className="text-stone-600">{CATEGORY_PITCH[c.id]}.</p>
                  {s && (
                    <Link href={cityCategoryPath(s.top, c.id)} className="font-medium text-brand hover:underline">
                      {c.label} in {METROS.find((m) => m.id === s.top)?.name ?? s.top} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <FaqList faq={faq} title="Common questions" />
      <JsonLd data={[breadcrumbs([{ name: "Home", path: "/" }, { name: "Indian classifieds", path: "/indian-classifieds" }]), faqSchema(faq)]} />
    </div>
  );
}
