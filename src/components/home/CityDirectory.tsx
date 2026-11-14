import Link from "next/link";
import { METROS } from "@/lib/metros";
import { cityPath } from "@/lib/seo";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

// A plain link to every city page, a short paragraph that says what the site is (with the other ways people
// spell the name), and links to the comparison pages. Helps visitors find their city, and helps search
// engines tie "Bharat Mela", "Indian classifieds in <city>" and "Sulekha alternative" searches to this site.
export function CityDirectory() {
  const cities = [...METROS].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Reveal as="section" stagger={15} aria-labelledby="home-cities" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
      <SectionHeading id="home-cities" icon="lotus" title="Indian classifieds by city" href="/indian-classifieds" linkText="All cities" />
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
        {cities.map((m) => (
          <li key={m.id} data-reveal-item>
            <Link href={cityPath(m.id)} className="text-sm font-medium text-ink/80 hover:text-forest hover:underline">
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-6 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-xl font-semibold text-ink">About BharathMela</h2>
          <p className="mt-2 leading-relaxed text-muted">
            <b className="text-ink">BharathMela</b> (also written Bharat Mela or Bharath Mela) is a marketplace and Indian classifieds site for
            the Indian community in the United States. Find home food and tiffins, tutors, pujaris, dance and music teachers, wedding vendors,
            home services, rooms and roommates near you, read reviews and contact sellers directly. Browsing is free.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink">Coming from another site?</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><Link href="/compare/sulekha" className="font-semibold text-forest hover:underline">Looking for a Sulekha alternative</Link></li>
            <li><Link href="/compare/craigslist" className="font-semibold text-forest hover:underline">Craigslist for the Indian community</Link></li>
            <li><Link href="/compare/facebook-marketplace" className="font-semibold text-forest hover:underline">Beyond Facebook groups</Link></li>
            <li><Link href="/compare/whatsapp-groups" className="font-semibold text-forest hover:underline">Better than WhatsApp groups</Link></li>
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
