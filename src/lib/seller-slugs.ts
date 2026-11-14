import { METROS } from "./metros";
import { slugify } from "./seo";
import zipcodes from "zipcodes";

export type SellerLocation = { businessName: string; city: string; metro: string; zip?: string };

export function sellerPathBase(seller: SellerLocation) {
  const metro = METROS.find((m) => m.id === seller.metro);
  const zip = seller.zip ? zipcodes.codes[seller.zip] : undefined;
  const city = seller.city.trim();
  const stateMatch = city.match(/,\s*([a-z]{2})$/i);
  const town = stateMatch ? city.slice(0, stateMatch.index).trim() : city;
  const state = stateMatch?.[1] || zip?.state || metro?.state || "US";
  const location = `${slugify(town || zip?.city || metro?.name || "local") || "local"}-${state.toLowerCase()}`;
  return `/${location}/${slugify(seller.businessName) || "business"}`;
}

export function sellerPathCandidate(base: string, number: number) {
  return number === 1 ? base : `${base}-${number}`;
}
