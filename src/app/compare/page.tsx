import type { Metadata } from "next";
import Link from "next/link";
import { OurPoints } from "@/components/OurPoints";
import { COMPARISONS, comparePath } from "@/lib/compare";

export const metadata: Metadata = {
  title: { absolute: "BharathMela compared with Sulekha, Craigslist and Facebook groups" },
  description: "How BharathMela, the marketplace for the Indian community in the US, compares with Sulekha, Craigslist, Facebook Marketplace and WhatsApp groups.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">How BharathMela compares</h1>
        <p className="mt-2 text-stone-700">
          Indians in the US find home food, pujaris, tutors, rooms and more in many places. Here&apos;s how BharathMela is different from each.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {COMPARISONS.map((c) => (
          <li key={c.slug}>
            <Link href={comparePath(c)} className="card block space-y-1 hover:ring-brand">
              <p className="font-semibold">BharathMela vs {c.name}</p>
              <p className="text-sm text-stone-600">{c.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What you get on BharathMela</h2>
        <OurPoints />
      </section>
    </div>
  );
}
