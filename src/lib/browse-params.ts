// Reads the results page's query string into search filters. Shared by the results page and saved-search
// alerts, so an alert finds exactly what the saved page showed.
import { CATEGORIES, categoryLabel, isDietTag, tagLabel } from "./constants";
import { EVENT_SERVICES, type EventServiceFilters, OCCASIONS, RENTAL_ITEMS } from "./event-services";
import { LANGUAGES, type ProfessionalFilters, SPECIALTIES, isProfessional } from "./professionals";
import { type RentalFilters, SPACE_TYPES } from "./rentals";

type Params = Record<string, string | undefined>;

// "Within N miles" choices for visitors who shared their location.
export const RADII = [5, 10, 25, 50, 100];

// The query-string keys that make up a search (location and sort are kept separately).
export const SEARCH_PARAMS = [
  "category", "q", "diet", "space", "maxRent", "by", "pbath", "furn", "pets", "spec", "lang", "free", "svc", "item", "occ", "ins",
] as const;

export function parseFilters(params: Params) {
  const category = CATEGORIES.some((c) => c.id === params.category) ? params.category : undefined;
  const q = (params.q ?? "").slice(0, 100);
  // Dietary filters only apply to food.
  const diet = category === "FOOD" ? (params.diet ?? "").split(",").filter(isDietTag) : [];
  // Rental filters only apply to room rentals.
  const rentalFilters: RentalFilters =
    category === "ROOM_RENTAL"
      ? {
          space: SPACE_TYPES.some((t) => t.id === params.space) ? params.space : undefined,
          maxRent: Number(params.maxRent) > 0 ? Math.round(Number(params.maxRent) * 100) : undefined,
          availableBy: /^\d{4}-\d{2}-\d{2}$/.test(params.by ?? "") ? params.by : undefined,
          privateBath: params.pbath === "1",
          furnished: params.furn === "1",
          pets: params.pets === "1",
        }
      : {};
  // Specialty, language and free-consultation filters for realtors and lawyers.
  const proFilters: ProfessionalFilters =
    category && isProfessional(category)
      ? {
          specialty: SPECIALTIES[category].some((s) => s.id === params.spec) ? params.spec : undefined,
          language: (LANGUAGES as readonly string[]).includes(params.lang ?? "") ? params.lang : undefined,
          freeConsult: params.free === "1",
        }
      : {};
  // Service, rental item, occasion and insurance filters for wedding and event vendors.
  const eventFilters: EventServiceFilters =
    category === "EVENT_SERVICES"
      ? {
          service: EVENT_SERVICES.some((s) => s.id === params.svc) ? params.svc : undefined,
          item: RENTAL_ITEMS.some((s) => s.id === params.item) ? params.item : undefined,
          occasion: OCCASIONS.some((o) => o.id === params.occ) ? params.occ : undefined,
          insured: params.ins === "1",
        }
      : {};
  return { category, q, diet, rentalFilters, proFilters, eventFilters };
}

export type Filters = ReturnType<typeof parseFilters>;

// Only the search part of a query string, in a stable order: what a saved search keeps.
export function searchQueryString(params: Params) {
  const p = new URLSearchParams();
  for (const k of SEARCH_PARAMS) {
    const v = params[k];
    if (v) p.set(k, v.slice(0, 100));
  }
  return p.toString();
}

const label = (opts: readonly { id: string; label: string }[], id?: string) => opts.find((o) => o.id === id)?.label;

// A short name for a saved search: "Room Rentals · Private room · up to $1,000 · within 25 mi of Saint Johns".
export function describeSearch(f: Filters, where: string) {
  const parts: string[] = [];
  if (f.category) parts.push(categoryLabel(f.category));
  if (f.q) parts.push(`“${f.q}”`);
  if (f.diet.length) parts.push(f.diet.map(tagLabel).join(", "));
  const r = f.rentalFilters;
  if (r.space) parts.push(label(SPACE_TYPES, r.space)!);
  if (r.maxRent) parts.push(`up to $${(r.maxRent / 100).toLocaleString("en-US")}`);
  if (r.availableBy) parts.push(`available by ${r.availableBy}`);
  if (r.privateBath) parts.push("private bath");
  if (r.furnished) parts.push("furnished");
  if (r.pets) parts.push("pets OK");
  const p = f.proFilters;
  if (p.specialty && f.category) parts.push(label(SPECIALTIES[f.category], p.specialty)!);
  if (p.language) parts.push(`speaks ${p.language}`);
  if (p.freeConsult) parts.push("free consultation");
  const e = f.eventFilters;
  if (e.service) parts.push(label(EVENT_SERVICES, e.service)!);
  if (e.item) parts.push(label(RENTAL_ITEMS, e.item)!);
  if (e.occasion) parts.push(label(OCCASIONS, e.occasion)!);
  if (e.insured) parts.push("insured");
  parts.push(where);
  return parts.filter(Boolean).join(" · ").slice(0, 200);
}
