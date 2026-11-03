// Search-engine basics shared by pages, the sitemap and structured data: the site's address, clean URLs
// for city and category pages, and readable listing URLs.
import { CATEGORIES, categoryLabel } from "./constants";
import { METROS, metroName } from "./metros";

export const SITE_NAME = "BharathMela";
export const SITE_TAGLINE = "Indian home businesses near you";
export const SITE_DESCRIPTION =
  "Find home food, tutors, pujaris, dance and music teachers, wedding vendors, home services, rooms and more from the Indian community in your US city.";

export const siteUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const absoluteUrl = (path: string) => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;

// URL words for each category, as people search for them.
export const CATEGORY_SLUGS: Record<string, string> = {
  FOOD: "home-food",
  TUTORING: "tutoring",
  DANCE_MUSIC: "dance-music-classes",
  PUJARI: "pujari",
  EVENT_SERVICES: "wedding-event-services",
  DOMESTIC_HELP: "nannies-domestic-help",
  HOME_SERVICES: "home-services",
  AUTO: "auto-services",
  BEAUTY: "beauty-wellness",
  ROOM_RENTAL: "rooms-for-rent",
  REALTOR: "realtors",
  LEGAL: "lawyers",
  TAX_FINANCE: "tax-accounting",
  TRAVEL: "travel",
  ART: "art-crafts",
  CLOTHING: "clothing-jewelry",
  GARAGE_SALE: "garage-sales",
  GOODS: "goods-services",
};

// One line per category for page intros and descriptions.
export const CATEGORY_PITCH: Record<string, string> = {
  FOOD: "Home-cooked tiffins, meal boxes, biryani trays, snacks and festival sweets from Indian home kitchens",
  TUTORING: "Math, science, coding, SAT prep and Telugu, Hindi or Tamil classes from local tutors",
  DANCE_MUSIC: "Bharatanatyam, Kuchipudi, Kathak, Bollywood dance and Carnatic or Hindustani music classes",
  PUJARI: "Pujaris and priests for griha pravesh, Satyanarayana vratam, weddings, homams and naming ceremonies",
  EVENT_SERVICES: "Wedding photographers, DJs, decorators, mehndi artists, caterers and party rentals",
  DOMESTIC_HELP: "Nannies, cooks, elder care and postpartum help",
  HOME_SERVICES: "Electricians, plumbers, AC repair, handymen, movers, painters and pest control",
  AUTO: "Mechanics, oil changes, tires, detailing and driving lessons",
  BEAUTY: "Eyebrow threading, bridal makeup, mehndi, saree draping, yoga and fitness",
  ROOM_RENTAL: "Rooms, shared rooms, paying-guest stays and apartments for rent",
  REALTOR: "Real estate agents who help with buying, selling and relocating",
  LEGAL: "Immigration, family, business and estate lawyers",
  TAX_FINANCE: "Tax preparers, CPAs, ITIN and FBAR help, bookkeeping and insurance agents",
  TRAVEL: "India flight tickets, tour packages, travel companions for parents and notaries",
  ART: "Madhubani, Tanjore and Kerala mural paintings, rangoli and handmade crafts",
  CLOTHING: "Sarees, lehengas, kurtas, kids' festival wear and jewelry",
  GARAGE_SALE: "Garage, yard and moving sales from families moving or moving back to India",
  GOODS: "Pickles, podis, plants, pooja items and other homemade goods",
};

export const categoryFromSlug = (slug: string) => Object.keys(CATEGORY_SLUGS).find((id) => CATEGORY_SLUGS[id] === slug);
export const cityPath = (metro: string) => `/in/${metro}`;
export const cityCategoryPath = (metro: string, category: string) => `/in/${metro}/${CATEGORY_SLUGS[category]}`;

export const cityCategoryTitle = (metro: string, category: string) => `${categoryLabel(category)} in ${metroName(metro)}`;

// "/listing/cm1abc-weekday-tiffin-service": the id, then the title as words. Ids never contain "-",
// so the id is everything before the first one.
export const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
export const listingPath = (l: { id: string; title: string }) => `/listing/${l.id}${slugify(l.title) ? `-${slugify(l.title)}` : ""}`;
export const idFromSlugParam = (param: string) => param.split("-")[0];

// Trimmed to a search-result-friendly length on a word boundary.
export function snippet(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export const ALL_CITY_CATEGORY_PAGES = () =>
  METROS.flatMap((m) => CATEGORIES.map((c) => ({ metro: m.id, category: c.id })));
