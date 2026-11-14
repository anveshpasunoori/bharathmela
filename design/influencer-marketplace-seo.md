# Influencer marketplace search intent

Research date: November 13, 2026 (America/New_York).

Two entry pages reuse the existing creator listing, onboarding, messaging and collaboration-request flows. The existing `/creators` directory and niche/language routes remain the profile discovery destination.

| Page | Primary intent | Supporting phrases |
| --- | --- | --- |
| `/influencers` | influencer marketplace, brand collaborations | YouTube creators, Instagram brand collaborations, micro-influencers, paid collaborations, YouTube sponsorships |
| `/hire-influencers` | hire influencers, find influencers | Indian YouTube influencers in the US, social media influencers, Instagram creators, influencer marketing for small businesses |

Current web search queries: `influencer marketplace hire YouTube influencers Indian creators brands` and `influencer marketplace creators find brand collaborations micro influencers`.

Sources surfaced in current search results:

- https://creatorscout.in/marketplace — find and hire creators; Instagram, YouTube and UGC discovery.
- https://duwiz.com/ — micro-influencer marketing and creator brand collaborations.
- https://www.heepsy.com/influencer-marketplace — marketplace campaign briefs and creator applications.
- https://www.jem.social/opportunities — creator opportunities and brand campaigns.

These are qualitative search-intent signals, not measured search volume, keyword difficulty, or a verified Google results ranking. The search provider did not expose Google-specific SERP data. US/Indian-community qualifiers come from BharathMela's existing audience, not from the India-focused competitors' geographic targeting. Confirm performance after launch with Google Search Console; paid keyword data was not available.

Implementation follows Google's guidance to use descriptive titles, useful content and crawlable links, without keyword stuffing or a meta-keywords tag:

- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide

Both pages have distinct H1s, titles and descriptions, self-referencing canonical URLs, Open Graph/Twitter metadata, visible FAQs with matching structured data, breadcrumb structured data, sitemap entries and internal links. FAQ markup does not guarantee a Google rich result. No fabricated testimonials, creator counts, earnings, campaign guarantees or payment/escrow functionality are presented.
