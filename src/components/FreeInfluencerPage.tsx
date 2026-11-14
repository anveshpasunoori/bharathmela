import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { FREE_INFLUENCER_PAGES, type FreeInfluencerPlatform } from "@/lib/free-influencer-pages";
import { breadcrumbs, faqSchema } from "@/lib/structured-data";

const join = "/vendor/signup?kind=individual&next=%2Fvendor%2Flistings%2Fnew%3Fcategory%3DCREATORS";

export function FreeInfluencerPage({ platform }: { platform: FreeInfluencerPlatform }) {
  const page = FREE_INFLUENCER_PAGES[platform];
  const label = `Free ${page.platform} influencer listing`;
  const crumbs = [{ name: "Home", path: "/" }, { name: "For influencers", path: "/influencers" }, { name: label, path: page.path }];
  const faq = [
    { q: `What is free about the ${page.platform} influencer listing?`, a: "Your first listing on BharathMela is free. Optional upgrades follow the pricing page. Free listing does not mean free influencer work: creators set their own rates and agree on compensation directly with businesses." },
    { q: page.question, a: page.answer },
    { q: `Can businesses request barter ${page.platform} collaborations?`, a: "Yes. Creators can indicate whether they accept products or services in exchange for content. Both sides must agree on the offer, deliverables and timeline; a creator is not required to accept barter." },
  ];

  return (
    <div className="space-y-10 pb-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/" className="hover:underline">Home</Link><span aria-hidden>/</span>
        <Link href="/influencers" className="hover:underline">For influencers</Link><span aria-hidden>/</span>
        <span aria-current="page">{label}</span>
      </nav>
      <section className="space-y-5 rounded-3xl border border-line bg-brand-soft p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-forest">BharathMela · {page.platform} creators</p>
        <h1 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">{page.h1}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted">{page.intro}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={join} className="btn">Create your {page.platform} listing</Link>
          <Link href="/hire-influencers" className="font-semibold text-forest underline">Looking to hire an influencer?</Link>
        </div>
        <p className="max-w-3xl text-sm text-muted">Your first listing is free. Creators set their own collaboration rates; paid work and barter are agreed directly. <Link href="/pricing" className="underline">View listing plans</Link>.</p>
      </section>
      <section aria-labelledby="content-formats">
        <h2 id="content-formats" className="text-3xl text-ink">{page.formatsHeading}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {page.formats.map(([heading, body]) => (
            <article key={heading} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-semibold text-ink">{heading}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="grid gap-6 rounded-2xl border border-line p-6 sm:p-8 md:grid-cols-2">
        <h2 className="text-3xl text-ink">{page.profileHeading}</h2>
        <div className="space-y-4 text-muted">
          <p>{page.profileText}</p>
          <p>Start with a seller profile, then choose the Creators category to publish your services. Add relevant samples and rates so businesses know what to ask for.</p>
          <Link href={join} className="inline-block font-semibold text-forest underline">Start your creator profile →</Link>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-3xl text-ink">{page.collabHeading}</h2>
        <p className="max-w-3xl leading-relaxed text-muted">{page.collabText}</p>
        <Link href="/creators" className="inline-block font-semibold text-forest underline">Explore the creator marketplace →</Link>
      </section>
      <section aria-labelledby="platform-faq">
        <h2 id="platform-faq" className="mb-5 text-3xl text-ink">{page.faqHeading}</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {faq.map(({ q, a }) => (
            <details key={q} className="p-5">
              <summary className="cursor-pointer font-semibold text-ink">{q}</summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <nav aria-label="Creator listing platforms" className="flex flex-wrap gap-4 text-sm font-semibold text-forest">
        {Object.values(FREE_INFLUENCER_PAGES).map((item) => (
          <Link key={item.path} href={item.path} aria-current={page.path === item.path ? "page" : undefined} className="underline underline-offset-4">Free {item.platform} influencer listing</Link>
        ))}
      </nav>
      <JsonLd data={[breadcrumbs(crumbs), faqSchema(faq)]} />
    </div>
  );
}
