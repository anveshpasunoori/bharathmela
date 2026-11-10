import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { OurPoints } from "@/components/OurPoints";
import { METROS } from "@/lib/metros";
import { SITE_DESCRIPTION, absoluteUrl, cityPath, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "About BharathMela (Bharat Mela): Indian marketplace in the US" },
  description: `BharathMela, also written Bharat Mela, is a marketplace for the Indian community in the US. ${SITE_DESCRIPTION}`,
  alternates: { canonical: "/about" },
};

// The brand's own page: what the name means and what the site is, in the words people search for it.
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold sm:text-3xl">About BharathMela</h1>
        <p className="text-stone-700">
          <b>BharathMela</b> (you may also see it written <b>Bharat Mela</b> or BharatMela) is an online marketplace for the Indian community
          in the United States. <i>Bharath</i> is India, and a <i>mela</i> is a fair where everyone comes together to buy, sell and celebrate.
          That&apos;s the idea: one place in your city for home kitchens, pujaris, tutors, dance and music teachers, wedding vendors, home
          services, rooms and roommates, community events and more.
        </p>
        <p className="text-stone-700">
          Most of these businesses are run from home and found by word of mouth or in WhatsApp and Facebook groups, where posts disappear in
          a day. BharathMela gives them a page that stays searchable, with prices, reviews and a way to message them directly. Buyers never
          pay to use it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="btn">Browse BharathMela</Link>
          <Link href="/vendor/signup" className="btn-outline">List your business free</Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What you can do here</h2>
        <OurPoints />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Cities</h2>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Cities">
          {METROS.map((m) => (
            <Link key={m.id} href={cityPath(m.id)} className="text-brand hover:underline">{m.name}, {m.state}</Link>
          ))}
        </nav>
      </section>

      <p className="text-sm text-stone-600">
        Questions or ideas? <Link href="/contact" className="font-semibold text-brand">Contact us</Link>. Wondering how we compare with other
        sites? <Link href="/compare" className="font-semibold text-brand">See the comparisons</Link>.
      </p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", url: absoluteUrl("/about"), name: "About BharathMela", about: { "@id": `${siteUrl()}/#organization` } }} />
    </div>
  );
}
