import "server-only";
// Nationwide pages for creators, who often work online and aren't tied to one city: /creators, one page
// per niche (/creators/food) and one per content language (/creators/telugu). City pages
// (/in/jacksonville/creators-influencers) stay for local creators.
import { NICHES, anyVerified, readCreator, totalFollowers } from "./creators";
import { browseListings } from "./listings";
import { LANGUAGES } from "./professionals";

export const CREATORS_PATH = "/creators";

export type CreatorPage = { kind: "all" } | { kind: "niche"; id: string; label: string; slug: string } | { kind: "language"; language: string; slug: string };

const nicheSlug = (id: string) => id.toLowerCase().replace(/_/g, "-");
export const NICHE_PAGES = NICHES.map((n) => ({ kind: "niche" as const, id: n.id, label: n.label, slug: nicheSlug(n.id) }));
export const LANGUAGE_PAGES = LANGUAGES.filter((l) => l !== "English").map((l) => ({ kind: "language" as const, language: l, slug: l.toLowerCase() }));

export function creatorPageFromSlug(slug: string): CreatorPage | null {
  return NICHE_PAGES.find((p) => p.slug === slug) ?? LANGUAGE_PAGES.find((p) => p.slug === slug) ?? null;
}
export const creatorPagePath = (p: CreatorPage) => (p.kind === "all" ? CREATORS_PATH : `${CREATORS_PATH}/${p.slug}`);

// "Telugu influencers & content creators", "Food & restaurants creators & influencers".
export function creatorPageTitle(p: CreatorPage) {
  if (p.kind === "niche") return `Indian ${p.label.toLowerCase()} influencers & creators`;
  if (p.kind === "language") return `${p.language} influencers & content creators`;
  return "Indian influencers & content creators";
}

// The creators on a page from every city: verified first, then the biggest audience.
export async function creatorsFor(p: CreatorPage) {
  const { listings } = await browseListings({
    metro: "",
    anywhere: true,
    category: "CREATORS",
    creatorFilters: p.kind === "niche" ? { niche: p.id } : p.kind === "language" ? { language: p.language } : {},
    sort: "new",
  });
  const rank = new Map(
    listings.map((l) => {
      const c = readCreator(l.details);
      return [l.id, { verified: c ? anyVerified(c) : false, followers: c ? totalFollowers(c) : 0 }];
    }),
  );
  return listings.sort(
    (a, b) => Number(rank.get(b.id)!.verified) - Number(rank.get(a.id)!.verified) || rank.get(b.id)!.followers - rank.get(a.id)!.followers,
  );
}

// How many creators each niche and language page would show, so empty pages aren't linked or indexed.
export async function creatorPageCounts() {
  const all = await creatorsFor({ kind: "all" });
  const niches = new Map<string, number>();
  const languages = new Map<string, number>();
  for (const l of all) {
    const c = readCreator(l.details);
    if (!c) continue;
    for (const n of c.niches) niches.set(n, (niches.get(n) ?? 0) + 1);
    for (const lang of c.languages) languages.set(lang, (languages.get(lang) ?? 0) + 1);
  }
  return { all, niches, languages };
}
