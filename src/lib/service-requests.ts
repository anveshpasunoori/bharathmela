import "server-only";
import type { ServiceRequest } from "@prisma/client";
import { CATEGORIES, categoryLabel } from "./constants";
import { db } from "./db";
import { sendEmail } from "./email";
import { metroFor, milesBetween, placeFromZip, zipCoords } from "./geo";
import { publicListing } from "./listings";
import { appUrl } from "./saved-searches";
import { SERVICE_TYPES, serviceTypeLabel } from "./service-types";

export const REQUEST_DAYS = 30;
export const MAX_OPEN_REQUESTS = 5;
// Sellers emailed per request, and how far away they can be.
export const MAX_NOTIFIED = 25;
export const NOTIFY_MILES = 40;

// Rooms have their own "I need a place to live" posts.
export const REQUEST_CATEGORIES = CATEGORIES.filter((c) => c.id !== "ROOM_RENTAL");

export const openRequest = (now = new Date()) => ({ status: "OPEN", expiresAt: { gt: now } });

export type RequestInput = {
  category: string;
  serviceType: string;
  title: string;
  description: string;
  neededBy: string;
  budgetCents: number | null;
  zip: string;
  city: string;
  metro: string;
  lat: number;
  lng: number;
};

export function parseRequestForm(form: FormData): RequestInput | { error: string } {
  const category = String(form.get("category") ?? "");
  if (!REQUEST_CATEGORIES.some((c) => c.id === category)) return { error: "Choose what kind of help you need." };
  const serviceType = String(form.get("serviceType") ?? "");
  if (serviceType && !SERVICE_TYPES[category]?.some((t) => t.id === serviceType)) return { error: "Choose a service from the list." };
  const title = String(form.get("title") ?? "").trim().replace(/\s+/g, " ");
  if (title.length < 8 || title.length > 100) return { error: "Sum up what you need in 8 to 100 characters, like “Pujari for griha pravesh on Dec 12”." };
  if (title === title.toUpperCase() && /[A-Z]{6}/.test(title)) return { error: "Please don't write the title in all capital letters." };
  const description = String(form.get("description") ?? "").trim();
  if (description.length < 20 || description.length > 1500) return { error: "Add a few details (20 to 1,500 characters) so sellers can quote accurately." };
  const neededBy = String(form.get("neededBy") ?? "");
  if (neededBy && !/^\d{4}-\d{2}-\d{2}$/.test(neededBy)) return { error: "Pick a valid date, or leave it empty if you're flexible." };
  if (neededBy && neededBy < new Date().toISOString().slice(0, 10)) return { error: "The date has already passed." };
  const budgetRaw = String(form.get("budget") ?? "").trim();
  const budget = budgetRaw ? Number(budgetRaw) : null;
  if (budget != null && (!Number.isFinite(budget) || budget <= 0 || budget > 100_000)) return { error: "Budget should be a number up to 100,000, or leave it empty." };
  const zip = String(form.get("zip") ?? "").trim();
  const place = /^\d{5}$/.test(zip) ? placeFromZip(zip) : null;
  if (!place) return { error: "Enter the 5-digit ZIP code where you need the service." };
  return {
    category, serviceType, title, description, neededBy,
    budgetCents: budget != null ? Math.round(budget * 100) : null,
    zip, city: `${place.city}, ${place.state}`, metro: metroFor(place).metro,
    // Rounded like the location cookie (~1 km), so a request never pins down a home.
    lat: Math.round(place.lat * 100) / 100, lng: Math.round(place.lng * 100) / 100,
  };
}

export const requestServiceLabel = (r: Pick<ServiceRequest, "category" | "serviceType">) =>
  r.serviceType ? serviceTypeLabel(r.category, r.serviceType) : categoryLabel(r.category);

// Sellers with a live listing in the request's category (and service, if one was picked) within
// NOTIFY_MILES or in the same city, nearest first. Never the person who asked.
export async function matchingVendors(r: ServiceRequest) {
  const listings = await db.listing.findMany({
    where: {
      ...publicListing(),
      category: r.category,
      ...(r.serviceType ? { tags: { contains: `,${r.serviceType},` } } : {}),
      vendor: { userId: { not: r.userId }, user: { emailVerifiedAt: { not: null } } },
    },
    select: { zip: true, metro: true, vendorId: true, vendor: { select: { id: true, businessName: true, user: { select: { email: true, name: true } } } } },
    take: 2000,
  });
  const best = new Map<string, { vendor: (typeof listings)[number]["vendor"]; miles: number }>();
  for (const l of listings) {
    const c = zipCoords(l.zip);
    const miles = c ? milesBetween(r, c) : l.metro === r.metro ? NOTIFY_MILES : Infinity;
    if (miles > NOTIFY_MILES && l.metro !== r.metro) continue;
    const seen = best.get(l.vendorId);
    if (!seen || miles < seen.miles) best.set(l.vendorId, { vendor: l.vendor, miles });
  }
  return [...best.values()].sort((a, b) => a.miles - b.miles);
}

// Emails the nearest matching sellers about a new request, once.
export async function notifyVendors(r: ServiceRequest) {
  const vendors = (await matchingVendors(r)).slice(0, MAX_NOTIFIED);
  const link = `${appUrl()}/requests/${r.id}`;
  const when = r.neededBy ? ` · needed by ${r.neededBy}` : "";
  const budget = r.budgetCents != null ? ` · budget about $${(r.budgetCents / 100).toLocaleString("en-US")}` : "";
  for (const { vendor } of vendors) {
    await sendEmail(
      vendor.user.email,
      `New request near you: ${r.title}`,
      `Hi ${vendor.user.name},\n\nSomeone in ${r.city} needs help with ${requestServiceLabel(r)}${when}${budget}:\n\n` +
        `"${r.title}"\n${r.description.slice(0, 400)}${r.description.length > 400 ? "…" : ""}\n\n` +
        `Send them a quote: ${link}\n\n` +
        `You're getting this because you have a listing in ${categoryLabel(r.category)} nearby. Quotes are free. ` +
        `Never ask buyers for payment by wire, gift card or crypto.\n\n– BharathMela`,
    ).catch((e) => console.error("request notification failed", e));
  }
  await db.serviceRequest.update({ where: { id: r.id }, data: { notifiedCount: vendors.length } });
  return vendors.length;
}

// Open requests a seller can quote on: in categories they list in, near their listings, not their own.
export async function requestsForVendor(vendorId: string, userId: string) {
  const listings = await db.listing.findMany({
    where: { vendorId, ...publicListing() },
    select: { category: true, zip: true, metro: true, tags: true },
  });
  if (!listings.length) return [];
  const requests = await db.serviceRequest.findMany({
    where: { ...openRequest(), userId: { not: userId }, category: { in: [...new Set(listings.map((l) => l.category))] } },
    include: { user: { select: { name: true } }, quotes: { where: { vendorId }, select: { id: true } }, _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return requests
    .map((r) => {
      const fits = listings.filter((l) => l.category === r.category && (!r.serviceType || l.tags.includes(`,${r.serviceType},`)));
      const miles = Math.min(
        ...fits.map((l) => {
          const c = zipCoords(l.zip);
          return c ? milesBetween(r, c) : l.metro === r.metro ? NOTIFY_MILES : Infinity;
        }),
      );
      const near = fits.some((l) => l.metro === r.metro) || miles <= NOTIFY_MILES;
      return { request: r, miles, near, quoted: r.quotes.length > 0 };
    })
    .filter((x) => x.near);
}
