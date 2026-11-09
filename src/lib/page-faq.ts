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

export function pageFaq({ what, city, listings, tip }: { what: string; city: string; listings: Priced[]; tip?: string }): Faq[] {
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
  if (tip) faq.push({ q: `What should I check first?`, a: tip });
  faq.push({
    q: `How do I contact a seller?`,
    a: `Open a listing to message the seller on BharathMela, or call or text them if they share a phone number. It's free for buyers, and you pay the seller directly.`,
  });
  return faq;
}
