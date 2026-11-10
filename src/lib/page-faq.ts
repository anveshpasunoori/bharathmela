// Questions and answers for the bottom of city-category and subcategory pages ("How much does an oil change
// cost in Jacksonville?"), built from the listings on the page so each page says something of its own.
// Shown on the page and given to search engines as FAQPage data; only facts on the page go in.
import { formatUSD } from "./plans";

type Priced = { priceCents: number | null; priceUnit: string; title: string; vendor: { businessName: string }; rating?: { average: number; count: number } | null };

export type Faq = { q: string; a: string };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The price range for the most common price unit ("per hour"), when at least two listings share it.
export function priceRange(listings: Priced[]) {
  const byUnit = new Map<string, number[]>();
  for (const l of listings) {
    if (l.priceCents == null || l.priceCents <= 0) continue;
    const unit = l.priceUnit.trim().toLowerCase();
    byUnit.set(unit, [...(byUnit.get(unit) ?? []), l.priceCents]);
  }
  const [unit, prices] = [...byUnit].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!prices || prices.length < 2) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  return { unit, low: sorted[0], high: sorted[sorted.length - 1], typical: sorted[Math.floor(sorted.length / 2)], count: sorted.length };
}

// "Ponte Vedra, Orange Park and Fleming Island": the first few, joined for a sentence.
export const joinList = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

// The paragraph under a city-category or subcategory page's heading, written from what's listed, so each
// page reads differently from the same category in another city.
export function pageIntro({ lead, city, listings, towns, noun = "seller" }: { lead: string; city: string; listings: Priced[]; towns: string[]; noun?: string }) {
  if (!listings.length) {
    return `${lead} in ${city}. Nothing is listed here yet: post what you need and local ${noun}s will send you quotes as they join, or list your own business free.`;
  }
  const sellers = new Set(listings.map((l) => l.vendor.businessName)).size;
  const range = priceRange(listings);
  const unit = range?.unit && !/^(starting at|from)$/.test(range.unit) ? ` ${range.unit}` : "";
  return (
    `${lead} in ${city}. ${plural(listings.length, "listing")} from ${plural(sellers, `local ${noun}`)}` +
    `${towns.length ? ` in ${joinList(towns.slice(0, 4))}` : ""}` +
    `${range ? `, with prices from ${formatUSD(range.low)}${unit}` : ""}. ` +
    `Compare prices and reviews, then message them directly. It's free for buyers.`
  );
}

// Questions for a city's own page ("Indian businesses in Jacksonville"), from its category counts and events.
export function cityFaq({ city, counts, events }: { city: string; counts: { label: string; n: number }[]; events: { title: string }[] }): Faq[] {
  const busy = counts.filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
  const total = busy.reduce((sum, c) => sum + c.n, 0);
  const faq: Faq[] = [
    {
      q: `What Indian businesses and services are in ${city}?`,
      a: total
        ? `${plural(total, "listing")} from the Indian community, most in ${joinList(busy.slice(0, 4).map((c) => c.label.toLowerCase()))}.`
        : `Home food, tutors, pujaris, dance and music classes, wedding vendors, home services and more, as local sellers join.`,
    },
  ];
  if (events.length) {
    faq.push({ q: `Are there Indian events in ${city} coming up?`, a: `Yes: ${joinList(events.slice(0, 3).map((e) => e.title))}. See all on the events page.` });
  }
  faq.push(
    { q: `Can I get quotes without calling around?`, a: `Post what you need and local sellers who offer it get your request by email and send you quotes. It's free.` },
    { q: `How do I list my business in ${city}?`, a: `Sign up as a seller and post your first listing free. Home businesses and individuals selling once (a room, a garage sale) can list too.` },
  );
  return faq;
}

export function pageFaq({ what, city, listings, tip, towns = [], requests = true }: { what: string; city: string; listings: Priced[]; tip?: string; towns?: string[]; requests?: boolean }): Faq[] {
  const faq: Faq[] = [];
  const sellers = new Set(listings.map((l) => l.vendor.businessName)).size;
  faq.push({
    q: `How many ${what} listings are there in ${city}?`,
    a: listings.length
      ? `${plural(listings.length, "listing")} from ${plural(sellers, "local seller")} in the Indian community, updated as sellers post.`
      : `None yet. Post what you need and sellers will send you quotes as they join, or list your own business free.`,
  });
  const range = priceRange(listings);
  if (range) {
    const unit = range.unit && !/^(starting at|from)$/.test(range.unit) ? ` ${range.unit}` : "";
    const span = range.low === range.high ? formatUSD(range.low) : `${formatUSD(range.low)} to ${formatUSD(range.high)}`;
    faq.push({
      q: `How much does ${what} cost in ${city}?`,
      a: `Across ${range.count} listings with a price, ${span}${unit}, with a typical price of ${formatUSD(range.typical)}${unit}. Sellers set their own prices, so ask what's included.`,
    });
  }
  const top = listings.filter((l) => l.rating && l.rating.count > 0).sort((a, b) => b.rating!.average - a.rating!.average || b.rating!.count - a.rating!.count)[0];
  if (top?.rating) {
    faq.push({
      q: `Who is the top-rated seller for ${what} in ${city}?`,
      a: `${top.vendor.businessName}, rated ${top.rating.average.toFixed(1)} out of 5 from ${plural(top.rating.count, "review")}, for "${top.title}".`,
    });
  }
  if (towns.length > 1) {
    faq.push({ q: `Which areas around ${city} are covered?`, a: `Sellers here are in ${joinList(towns.slice(0, 6))}. Each listing shows how far it is from you once you set your location.` });
  }
  if (tip) faq.push({ q: `What should I check first?`, a: tip });
  if (requests) {
    faq.push({ q: `Can I get quotes without calling around?`, a: `Yes. Post what you need for free, and local sellers who offer ${what.toLowerCase()} get it by email and send you quotes.` });
  }
  faq.push({
    q: `How do I contact a seller?`,
    a: `Open a listing to message the seller on BharathMela, or call or text them if they share a phone number. It's free for buyers, and you pay the seller directly.`,
  });
  return faq;
}
