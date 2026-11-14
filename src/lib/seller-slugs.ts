import { METROS } from "./metros";
import { slugify } from "./seo";
import zipcodes from "zipcodes";

export type SellerLocation = { businessName: string; city: string; metro: string; zip?: string };

// Static app routes take precedence over the city route in Next.js.
const RESERVED_CITIES = new Set(["about", "account", "actions", "admin", "alerts", "api", "categories", "city-emails", "compare", "contact", "creators", "events", "free-instagram-influencer", "free-youtube-influencer", "hire-influencers", "in", "indian-classifieds", "influencers", "listing", "login", "messages", "pricing", "privacy", "requests", "rooms-wanted", "safety", "saved", "seller", "signup", "terms", "vendor", "verify"]);

export function sellerPathBase(seller: SellerLocation) {
  const metro = METROS.find((m) => m.id === seller.metro);
  const zip = seller.zip ? zipcodes.codes[seller.zip] : undefined;
  const city = seller.city.trim();
  const stateMatch = city.match(/,\s*([a-z]{2})$/i);
  const town = stateMatch ? city.slice(0, stateMatch.index).trim() : city;
  const citySlug = slugify(town || zip?.city || metro?.name || "local") || "local";
  const location = RESERVED_CITIES.has(citySlug) ? `${citySlug}-city` : citySlug;
  return `/${location}/${slugify(seller.businessName) || "business"}`;
}

export function sellerPathCandidate(base: string, number: number) {
  return number === 1 ? base : `${base}-${number}`;
}
