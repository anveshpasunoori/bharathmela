import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbs, faqSchema } from "@/lib/structured-data";

const join = "/vendor/signup?kind=individual&next=%2Fvendor%2Flistings%2Fnew%3Fcategory%3DCREATORS";
const brief = "/requests/new?category=CREATORS";

export function InfluencerMarketplace({ audience }: { audience: "creators" | "brands" }) {
  const creator = audience === "creators";
  const path = creator ? "/influencers" : "/hire-influencers";
  const title = creator ? "Find brand collaborations as an influencer" : "Find and hire influencers for your brand";
  const steps = creator ? [
    ["Create your profile", "Add your social handles, content languages, niche, sample posts and audience size. Your first listing is free."],
    ["Show what you offer", "Set rates for YouTube videos, Reels, Shorts, feed posts or event appearances. Choose local or nationwide reach and whether you accept barter."],
    ["Start a conversation", "Receive relevant collaboration requests and reply with your ideas and prices. Agree on the scope, timeline and payment directly with the business."],
  ] : [
    ["Discover the right creators", "Browse Indian influencers across the US by niche and content language. Review their platforms, sample content, audience and listed rates."],
    ["Share your campaign brief", "Post a collaboration request with your location, budget, preferred platforms and deliverables. Say whether you offer payment, products or services."],
    ["Agree on the details", "Message creators and compare proposals. Confirm content approvals, usage rights, deadlines and payment terms before work begins."],
  ];
  const faq = creator ? [
    { q: "Can micro-influencers join the marketplace?", a: "Yes. You can create a profile without a minimum follower requirement. Share accurate audience counts, relevant samples and a clear niche so businesses can assess the fit." },
    { q: "Can I find YouTube sponsorships and Instagram brand collaborations?", a: "You can list YouTube videos, Reels, Shorts, stories and feed posts, with rates for each format. Businesses can contact you through your listing or send matching collaboration requests. Opportunities and earnings are not guaranteed." },
    { q: "Do I need to work with brands in my city?", a: "Choose local collaborations for visits and appearances, or mark your profile as available nationwide for online campaigns across the US." },
    { q: "How do paid and barter collaborations work?", a: "List your rates and indicate whether you accept products or services in exchange for content. Discuss deliverables and compensation directly with each business before accepting a collaboration." },
  ] : [
    { q: "How do I find influencers for my small business?", a: "Start with creators whose niche, language and location fit your customers. Browse the creator directory, review content samples and rates, then contact a creator or post a collaboration request." },
    { q: "Can I hire YouTube influencers and Instagram creators?", a: "Creator profiles support YouTube, Instagram, TikTok, Facebook and X. Check each profile for available formats and pricing, such as a YouTube video, Instagram Reel or event appearance." },
    { q: "How much does influencer marketing cost?", a: "Creators set their own rates. Cost depends on the deliverable, production, audience and usage rights. Review listed rates and request a quote for your brief; there is no fixed marketplace campaign price." },
    { q: "Are influencer followers and results verified?", a: "Follower counts are self-reported. A verified handle indicates an account ownership check and a follower count observed at verification, not a guarantee of engagement or campaign results. Ask for current audience insights before hiring." },
  ];

  return <div className="space-y-10 pb-8">
    <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-muted"><Link href="/" className="hover:underline">Home</Link><span aria-hidden>/</span><span>{creator ? "For influencers" : "Hire influencers"}</span></nav>
    <nav aria-label="Influencer marketplace" className="flex flex-wrap gap-2 text-sm font-semibold">
      {[["/influencers", "For influencers"], ["/hire-influencers", "For brands & businesses"], ["/creators", "Browse creators"]].map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`rounded-full border px-4 py-2 ${path === href ? "border-forest bg-forest text-snow" : "border-line bg-white text-ink hover:bg-brand-soft"}`}>{label}</Link>)}
    </nav>
    {creator && <nav aria-label="Free creator listings" className="flex flex-wrap gap-4 text-sm font-semibold text-forest">
      <Link href="/free-instagram-influencer" className="underline">Free Instagram influencer listing</Link>
      <Link href="/free-youtube-influencer" className="underline">Free YouTube influencer listing</Link>
    </nav>}
    <section className="grid gap-8 rounded-3xl border border-line bg-brand-soft p-6 sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:p-12">
      <div className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-forest">BharathMela · Influencer marketplace</p>
        <h1 className="max-w-2xl text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">{creator ? "Turn your creativity into conversations with brands. Connect with businesses looking for Indian YouTube creators, social media influencers and local voices across the US." : "Connect with Indian YouTube influencers, Instagram creators and micro-influencers across the US. Find a voice that fits your audience, language and local community."}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={creator ? join : "/creators"} className="btn">{creator ? "Create your influencer profile" : "Browse influencers"}</Link>
          <Link href={creator ? "/hire-influencers" : brief} className="font-semibold text-forest underline underline-offset-4">{creator ? "Looking to hire a creator?" : "Post a collaboration request"}</Link>
        </div>
        <p className="text-sm text-muted">{creator ? "Your first listing is free · Local or nationwide · Paid or barter" : "Direct conversations · Creator-set rates · Local and nationwide"}</p>
      </div>
      <aside className="self-center rounded-2xl border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{creator ? "Your content. Your community." : "Build your next collaboration"}</p>
        <h2 className="mt-3 text-2xl text-ink">{creator ? "Make your niche your introduction" : "A good fit starts with a clear brief"}</h2>
        <ul className="mt-5 space-y-4 text-sm text-muted">
          {(creator ? ["YouTube videos & Shorts", "Instagram Reels, stories & posts", "Food, fashion, tech, travel & more", "Content in your audience’s language"] : ["Audience: who you want to reach", "Format: video, Reel, post or appearance", "Budget: paid or clearly described barter", "Location: in-person or online"]).map((item) => <li key={item} className="border-b border-line pb-3">{item}</li>)}
        </ul>
      </aside>
    </section>
    <section aria-labelledby="how-it-works">
      <h2 id="how-it-works" className="text-3xl text-ink">{creator ? "From creator profile to brand conversation" : "Influencer marketing in three steps"}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">{steps.map(([heading, body], i) => <article key={heading} className="rounded-2xl border border-line bg-white p-6"><span className="text-sm font-bold text-forest">0{i + 1}</span><h3 className="mt-3 text-lg font-semibold text-ink">{heading}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{body}</p></article>)}</div>
    </section>
    <section className="grid gap-5 rounded-2xl border border-line p-6 sm:p-8 md:grid-cols-2">
      <h2 className="text-3xl text-ink">{creator ? "A place for local voices and micro-influencers" : "Reach the community your business serves"}</h2>
      <div className="space-y-3 text-muted"><p>{creator ? "You do not need a celebrity-sized following to describe the value you bring. Show your storytelling style, the communities you reach and the kinds of businesses you want to work with." : "From a restaurant launch to a product demonstration, look for creators whose content matches your goals. Consider audience location, language and engagement alongside follower count."}</p><p>{creator ? "Food bloggers, beauty creators, family vloggers and tech reviewers can showcase their work to businesses seeking relevant partnerships." : "Use the directory’s niche and language pages to explore relevant creators, then discuss YouTube sponsorships, social media promotions or local event appearances directly."}</p><Link href="/creators" className="inline-block font-semibold text-forest underline">Explore the creator directory →</Link></div>
    </section>
    <section aria-labelledby="marketplace-faq"><h2 id="marketplace-faq" className="mb-5 text-3xl text-ink">{creator ? "Influencer collaboration questions" : "Hiring influencers: common questions"}</h2><div className="divide-y divide-line rounded-2xl border border-line bg-white">{faq.map(({ q, a }) => <details key={q} className="p-5"><summary className="cursor-pointer font-semibold text-ink">{q}</summary><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{a}</p></details>)}</div></section>
    <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-forest p-8 text-snow"><div><h2 className="text-2xl">{creator ? "Let businesses discover your work" : "Ready to meet your next creator?"}</h2><p className="mt-2 text-sm">{creator ? "Build a profile that tells brands what you can create." : "Share your brief and invite relevant creators into the conversation."}</p></div><Link href={creator ? join : brief} className="rounded-full bg-white px-5 py-3 font-semibold text-forest">{creator ? "List yourself as an influencer" : "Post your collaboration request"}</Link></section>
    <JsonLd data={[breadcrumbs([{ name: "Home", path: "/" }, { name: creator ? "For influencers" : "Hire influencers", path }]), faqSchema(faq)]} />
  </div>;
}
