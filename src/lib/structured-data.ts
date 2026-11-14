// schema.org data for listing, seller and event pages, so search engines can show prices, ratings,
// dates and breadcrumbs. Only facts shown on the page go in.
import { categoryLabel } from "./constants";
import { readGarageSale } from "./garage-sales";
import { metroName } from "./metros";
import { absoluteUrl, cityCategoryPath, cityPath, eventPath, listingPath, sellerPath, snippet } from "./seo";

// Categories where the seller offers a service rather than selling an item.
const SERVICE_CATEGORIES = new Set([
  "TUTORING", "DANCE_MUSIC", "PUJARI", "EVENT_SERVICES", "DOMESTIC_HELP", "HOME_SERVICES", "AUTO", "BEAUTY", "REALTOR", "LEGAL",
  "TAX_FINANCE", "TRAVEL", "CREATORS",
]);

type ListingForSchema = {
  id: string;
  title: string;
  description: string;
  category: string;
  metro: string;
  zip: string;
  priceCents: number | null;
  details: string;
  vendorId: string;
  photos: { url: string }[];
  vendor: { businessName: string; publicPath: string | null };
};
type Rating = { average: number; count: number } | undefined;

const city = (metro: string) => metroName(metro).split(",")[0];
const region = (metro: string) => metroName(metro).split(", ")[1];

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export const listingCrumbs = (l: Pick<ListingForSchema, "id" | "title" | "category" | "metro">) => [
  { name: "Home", path: "/" },
  { name: metroName(l.metro), path: cityPath(l.metro) },
  { name: categoryLabel(l.category), path: cityCategoryPath(l.metro, l.category) },
  { name: l.title, path: listingPath(l) },
];

function seller(l: ListingForSchema, rating: Rating) {
  return {
    "@type": "LocalBusiness",
    name: l.vendor.businessName,
    url: absoluteUrl(sellerPath({ id: l.vendorId, businessName: l.vendor.businessName, publicPath: l.vendor.publicPath })),
    address: { "@type": "PostalAddress", addressLocality: city(l.metro), addressRegion: region(l.metro), postalCode: l.zip, addressCountry: "US" },
    ...(rating && rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average.toFixed(1), reviewCount: rating.count, bestRating: 5, worstRating: 1 } }
      : {}),
  };
}

export function listingSchema(l: ListingForSchema, rating: Rating) {
  const url = absoluteUrl(listingPath(l));
  const image = l.photos.map((p) => absoluteUrl(p.url)).slice(0, 3);
  const offer =
    l.priceCents != null
      ? { offers: { "@type": "Offer", price: (l.priceCents / 100).toFixed(2), priceCurrency: "USD", availability: "https://schema.org/InStock", url } }
      : {};
  const base = { "@context": "https://schema.org", name: l.title, description: snippet(l.description, 300), url, ...(image.length ? { image } : {}) };

  if (l.category === "ROOM_RENTAL") return null;
  if (l.category === "GARAGE_SALE") {
    const sale = readGarageSale(l.details);
    if (!sale) return null;
    return {
      ...base,
      "@type": "SaleEvent",
      startDate: sale.startDate,
      endDate: sale.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: sale.address || city(l.metro), address: { "@type": "PostalAddress", addressLocality: city(l.metro), addressRegion: region(l.metro), postalCode: l.zip, addressCountry: "US" } },
      organizer: { "@type": "Person", name: l.vendor.businessName },
    };
  }
  if (SERVICE_CATEGORIES.has(l.category)) {
    return { ...base, "@type": "Service", serviceType: categoryLabel(l.category), areaServed: { "@type": "City", name: metroName(l.metro) }, provider: seller(l, rating), ...offer };
  }
  return { ...base, "@type": "Product", category: categoryLabel(l.category), brand: { "@type": "Brand", name: l.vendor.businessName }, ...offer };
}

export function sellerSchema(s: { id: string; businessName: string; publicPath: string | null; about: string; metro: string; zip: string; phone: string }, rating: Rating) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s.businessName,
    url: absoluteUrl(sellerPath(s)),
    ...(s.about ? { description: snippet(s.about, 300) } : {}),
    telephone: s.phone,
    address: { "@type": "PostalAddress", addressLocality: city(s.metro), addressRegion: region(s.metro), postalCode: s.zip, addressCountry: "US" },
    ...(rating && rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average.toFixed(1), reviewCount: rating.count, bestRating: 5, worstRating: 1 } }
      : {}),
  };
}

export function eventSchema(e: {
  id: string; title: string; description: string; startsAt: Date; endsAt: Date; venueName: string; address: string; isFree: boolean;
  priceCents: number | null; ticketUrl: string; metro: string; vendor: { businessName: string; id: string; publicPath: string | null };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: snippet(e.description, 300),
    startDate: e.startsAt.toISOString(),
    endDate: e.endsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: absoluteUrl(eventPath(e)),
    location: { "@type": "Place", name: e.venueName, address: { "@type": "PostalAddress", streetAddress: e.address, addressLocality: city(e.metro), addressRegion: region(e.metro), addressCountry: "US" } },
    organizer: { "@type": "Organization", name: e.vendor.businessName, url: absoluteUrl(sellerPath(e.vendor)) },
    offers: {
      "@type": "Offer",
      price: e.isFree ? "0" : ((e.priceCents ?? 0) / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: e.ticketUrl || absoluteUrl(eventPath(e)),
    },
  };
}

// The listings shown on a city-category page, in order.
export function itemListSchema(name: string, items: { id: string; title: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((l, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(listingPath(l)), name: l.title })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
