import "server-only";
import type { SavedSearch } from "@prisma/client";
import { parseFilters } from "./browse-params";
import { db } from "./db";
import { sendEmail } from "./email";
import { browseListings } from "./listings";
import { priceLabel } from "./plans";
import { listingPath, siteUrl } from "./seo";

export const MAX_SAVED_SEARCHES = 20;
const DAY_MS = 86_400_000;

export const ALERT_OPTIONS = [
  { id: "DAILY", label: "Email me daily" },
  { id: "WEEKLY", label: "Email me weekly" },
  { id: "OFF", label: "No emails" },
] as const;
export const isAlertOption = (v: string) => ALERT_OPTIONS.some((o) => o.id === v);

export const appUrl = siteUrl;

type Location = { metro: string; nearLat: number | null; nearLng: number | null; radiusMiles: number | null };

// Two saves of the same search in the same place are the same saved search.
export const sameLocation = (s: Location, l: Location) =>
  s.metro === l.metro && s.radiusMiles === l.radiusMiles && s.nearLat === l.nearLat && s.nearLng === l.nearLng;

// The results page for a saved search. `ss` marks the visit so its new-listing count resets.
export function savedSearchHref(s: Pick<SavedSearch, "id" | "params" | "metro" | "radiusMiles">) {
  const p = new URLSearchParams(s.params);
  if (s.radiusMiles != null) p.set("radius", String(s.radiusMiles));
  else p.set("metro", s.metro);
  p.set("ss", s.id);
  return `/?${p}`;
}

// Live listings matching a saved search, at its saved location.
export async function savedSearchResults(s: SavedSearch) {
  const f = parseFilters(Object.fromEntries(new URLSearchParams(s.params)));
  const near = s.nearLat != null && s.nearLng != null ? { lat: s.nearLat, lng: s.nearLng, radiusMiles: s.radiusMiles } : undefined;
  const { listings } = await browseListings({ metro: s.metro, category: f.category, query: f.q, diet: f.diet, serviceType: f.serviceType, rentalFilters: f.rentalFilters, proFilters: f.proFilters, eventFilters: f.eventFilters, creatorFilters: f.creatorFilters, near, sort: "new" });
  return listings;
}

// New listings since the user last looked, for the badges on the Saved page.
export async function newMatchCounts(searches: SavedSearch[]) {
  const counts = new Map<string, number>();
  await Promise.all(
    searches.map(async (s) => {
      const listings = await savedSearchResults(s);
      counts.set(s.id, listings.filter((l) => l.createdAt > s.viewedAt).length);
    }),
  );
  return counts;
}

// Emails each saved search that's due its daily or weekly alert, when it has new listings. Meant to run
// on a schedule (see /api/cron/alerts). Each listing is announced once: `alertedUntil` moves forward
// every time a search is checked.
export async function runSearchAlerts(now = new Date()) {
  const due = await db.savedSearch.findMany({
    where: {
      OR: [
        // An hour of slack so a daily job that runs a little early still sends.
        { alerts: "DAILY", OR: [{ lastAlertAt: null }, { lastAlertAt: { lte: new Date(now.getTime() - DAY_MS + 3_600_000) } }] },
        { alerts: "WEEKLY", OR: [{ lastAlertAt: null }, { lastAlertAt: { lte: new Date(now.getTime() - 7 * DAY_MS + 3_600_000) } }] },
      ],
      user: { emailVerifiedAt: { not: null }, suspendedAt: null, deletedAt: null },
    },
    include: { user: { select: { email: true, name: true } } },
    take: 2000,
  });
  let sent = 0;
  for (const s of due) {
    const fresh = (await savedSearchResults(s)).filter((l) => l.createdAt > s.alertedUntil);
    await db.savedSearch.update({ where: { id: s.id }, data: { alertedUntil: now, ...(fresh.length ? { lastAlertAt: now } : {}) } });
    if (!fresh.length) continue;
    const base = appUrl();
    const lines = fresh.slice(0, 5).map((l) => {
      const price = l.priceCents != null ? priceLabel(l.priceCents, l.priceUnit) : null;
      return `• ${l.title}${price ? ` – ${price.main} ${price.unit}`.trimEnd() : ""}\n  ${l.vendor.businessName} · ${base}${listingPath(l)}`;
    });
    const more = fresh.length > 5 ? `\n…and ${fresh.length - 5} more.` : "";
    await sendEmail(
      s.user.email,
      `${fresh.length} new on BharathMela: ${s.name.slice(0, 60)}`,
      `Hi ${s.user.name},\n\nNew listings match your saved search "${s.name}":\n\n${lines.join("\n\n")}${more}\n\n` +
        `See them all: ${base}${savedSearchHref(s)}\n` +
        `Change how often you hear from us: ${base}/saved?tab=searches\n` +
        `Stop these emails: ${base}/alerts/unsubscribe/${s.unsubscribeToken}\n\n– BharathMela`,
      undefined,
      { "List-Unsubscribe": `<${base}/api/alerts/unsubscribe?token=${s.unsubscribeToken}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    ).then((ok) => ok && sent++);
  }
  return { checked: due.length, sent };
}
