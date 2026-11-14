import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { getCurrentUser } from "@/lib/auth";
import { CREATORS_PATH, type CreatorPage, LANGUAGE_PAGES, NICHE_PAGES, creatorPageCounts, creatorPagePath, creatorPageTitle, creatorsFor } from "@/lib/creator-pages";
import { anyVerified, formatFollowers, readCreator, totalFollowers } from "@/lib/creators";
import { isMetro, metroName } from "@/lib/metros";
import { type Faq, joinList } from "@/lib/page-faq";
import { formatUSD } from "@/lib/plans";
import { savedListingIds } from "@/lib/listings";
import { cityCategoryPath } from "@/lib/seo";
import { breadcrumbs, faqSchema, itemListSchema } from "@/lib/structured-data";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// What the page's creators charge for a reel and how many take barter, for the intro and questions.
function summarize(listings: Awaited<ReturnType<typeof creatorsFor>>) {
  const creators = listings.map((l) => readCreator(l.details)).filter((c) => c != null);
  const reels = creators.map((c) => c.rates.REEL).filter((n): n is number => n != null && n > 0);
  const cities = [...new Set(listings.map((l) => l.metro).filter(isMetro))];
  return {
    verified: creators.filter(anyVerified).length,
    barter: creators.filter((c) => c.barter).length,
    nationwide: creators.filter((c) => c.nationwide).length,
    audience: creators.reduce((sum, c) => sum + totalFollowers(c), 0),
    reel: reels.length >= 2 ? { low: Math.min(...reels), typical: median(reels), count: reels.length } : null,
    cities,
  };
}

export async function CreatorsHub({ page }: { page: CreatorPage }) {
  const [listings, counts, viewer] = await Promise.all([creatorsFor(page), creatorPageCounts(), getCurrentUser()]);
  const savedIds = await savedListingIds(viewer?.id, listings.map((l) => l.id));
  const s = summarize(listings);
  const title = creatorPageTitle(page);
  const who = page.kind === "niche" ? `${page.label.toLowerCase()} creators` : page.kind === "language" ? `creators making content in ${page.language}` : "Indian creators and influencers";

  const intro = listings.length
    ? `${plural(listings.length, "creator")} from ${joinList(s.cities.slice(0, 4).map((m) => metroName(m).split(",")[0]))}${s.cities.length > 4 ? " and more" : ""}` +
      ` with ${formatFollowers(s.audience)} followers in total` +
      `${s.verified ? `, ${s.verified} with ${s.verified === 1 ? "a verified handle" : "verified handles"}` : ""}. ` +
      `${s.nationwide ? `${plural(s.nationwide, "creator")} ${s.nationwide === 1 ? "promotes" : "promote"} businesses anywhere in the US online. ` : ""}` +
      `Message them directly, or post a collab request and matching creators send you ideas and prices, paid or barter.`
    : `No ${who} are listed yet. Post a collab request and matching creators will hear about it as they join, or list yourself if you're a creator.`;

  const faq: Faq[] = [
    {
      q: `How do I find ${who} to promote my business?`,
      a: `Browse the profiles here: each shows platforms, follower counts, niches, languages and rates. Or post a collab request with what you're offering, and creators who fit get an email and send you their ideas and prices.`,
    },
  ];
  if (s.reel) {
    faq.push({
      q: `How much do ${who} charge?`,
      a: `Across ${s.reel.count} creators listing a price for a reel or short, from ${formatUSD(s.reel.low * 100)}, with a typical rate of ${formatUSD(s.reel.typical * 100)}. Bigger audiences and extra posts cost more, so ask what's included.`,
    });
  }
  faq.push(
    {
      q: `Do creators accept barter instead of cash?`,
      a: s.barter
        ? `Yes: ${plural(s.barter, "creator")} here are open to barter, such as a meal for the family, products or a service. Filter for "Open to barter", or post a barter-only collab request.`
        : `Many do. Post a barter collab request saying what you can offer, like a meal for the family, products or a service.`,
    },
    {
      q: `Are the follower counts real?`,
      a: `Creators report their own counts. A ✓ Verified badge means BharathMela checked the creator owns that account (with a code in its bio) and saw the follower count. Open the profiles to check before you agree on a deal.`,
    },
    {
      q: `Can a creator in another city promote my business?`,
      a: `Yes, for online content. Creators who work nationwide show on every city's page, and collab requests can welcome creators from anywhere. For in-person visits and event appearances, pick a creator near you.`,
    },
  );

  const crumbs = [{ name: "Home", path: "/" }, { name: "Creators & Influencers", path: CREATORS_PATH }, ...(page.kind === "all" ? [] : [{ name: title, path: creatorPagePath(page) }])];
  const chip = (href: string, label: string, n: number, on: boolean) => (
    <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3 py-1 ring-1 ${on ? "bg-stone-900 text-stone-50 ring-stone-900" : "bg-white text-stone-700 ring-stone-200 hover:text-brand"}`}>
      {label} <span className={on ? "text-stone-300" : "text-stone-400"}>{n}</span>
    </Link>
  );
  const listMe = viewer?.vendor ? "/vendor/listings/new?category=CREATORS" : `/vendor/signup?kind=individual&next=${encodeURIComponent("/vendor/listings/new?category=CREATORS")}`;

  return (
    <div className="space-y-6">
      <nav aria-label="Influencer marketplace" className="flex flex-wrap gap-4 text-sm font-semibold text-forest">
        <Link href="/hire-influencers" className="hover:underline">For brands: hire influencers</Link>
        <Link href="/influencers" className="hover:underline">For influencers: brand collaborations</Link>
      </nav>
      <section className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span aria-hidden>›</span>
          {page.kind === "all" ? <span className="text-stone-700">Creators & Influencers</span> : <Link href={CREATORS_PATH} className="hover:text-brand">Creators & Influencers</Link>}
        </nav>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}{page.kind === "all" ? " in the US" : ""}</h1>
        <p className="max-w-3xl text-sm text-stone-600">{intro}</p>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Creators by niche">
          {chip(CREATORS_PATH, "All", counts.all.length, page.kind === "all")}
          {NICHE_PAGES.filter((p) => counts.niches.get(p.id)).map((p) => chip(creatorPagePath(p), p.label, counts.niches.get(p.id)!, page.kind === "niche" && page.id === p.id))}
        </nav>
        {LANGUAGE_PAGES.some((p) => counts.languages.get(p.language)) && (
          <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Creators by language">
            <span className="text-stone-500">Content in</span>
            {LANGUAGE_PAGES.filter((p) => counts.languages.get(p.language)).map((p) => chip(creatorPagePath(p), p.language, counts.languages.get(p.language)!, page.kind === "language" && page.language === p.language))}
          </nav>
        )}
      </section>

      {listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} saved={l.vendorId === viewer?.vendor?.id ? undefined : savedIds.has(l.id)} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-soft px-5 py-4 ring-1 ring-orange-100">
        <div>
          <p className="font-semibold">Want creators to come to you?</p>
          <p className="text-sm text-stone-600">Post a collab request: paid or barter. Matching creators get an email and send you their ideas and prices.</p>
        </div>
        <Link href="/requests/new?category=CREATORS" className="btn">Post a collab request</Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 px-5 py-4 ring-1 ring-sky-100">
        <div>
          <p className="font-semibold">Are you a creator or influencer?</p>
          <p className="text-sm text-stone-600">List yourself free, and businesses can reach you for paid or barter collabs, in your city or nationwide.</p>
        </div>
        <Link href={listMe} className="btn">List yourself as a creator</Link>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{title}: common questions</h2>
        <div className="divide-y divide-stone-200 rounded-xl bg-white ring-1 ring-stone-200">
          {faq.map((f) => (
            <details key={f.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-medium text-stone-800 marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span aria-hidden className="text-stone-400 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-stone-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {s.cities.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">Local creators by city</h2>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Local creators by city">
            {s.cities.map((m) => (
              <Link key={m} href={cityCategoryPath(m, "CREATORS")} className="text-brand hover:underline">
                Creators in {metroName(m)}
              </Link>
            ))}
          </nav>
        </section>
      )}

      <JsonLd data={[breadcrumbs(crumbs), ...(listings.length ? [itemListSchema(title, listings)] : []), faqSchema(faq)]} />
    </div>
  );
}
