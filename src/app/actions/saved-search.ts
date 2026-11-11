"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listingSearchRadius, describeSearch, parseFilters, searchQueryString } from "@/lib/browse-params";
import { db } from "@/lib/db";
import { metroName } from "@/lib/metros";
import { MAX_SAVED_SEARCHES, isAlertOption, sameLocation } from "@/lib/saved-searches";
import { listingSearchCenter, resolveLocation } from "@/lib/user-location";

export type SaveSearchResult = { ok: true; id: string } | { ok: false; error: string };

// Saves the results page's search (from its query string) at the visitor's current location: "within N
// miles" of their saved place, or the whole city they're browsing. Saving the same search again is a no-op.
export async function saveSearch(query: string): Promise<SaveSearchResult> {
  const raw = Object.fromEntries(new URLSearchParams(query));
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/?${query}`)}`);
  const params = searchQueryString(raw);
  if (!params) return { ok: false, error: "Pick a category or search for something first." };

  const resolved = await resolveLocation(raw.metro);
  const { metro, overridden } = resolved;
  const center = listingSearchCenter(resolved);
  const radius = listingSearchRadius({ ...raw, metro: overridden ? metro : undefined });
  const nearMode = radius != null;
  const location = {
    metro,
    nearLat: nearMode ? center.lat : null,
    nearLng: nearMode ? center.lng : null,
    radiusMiles: radius,
  };

  const mine = await db.savedSearch.findMany({ where: { userId: user.id } });
  const existing = mine.find((s) => s.params === params && sameLocation(s, location));
  if (existing) return { ok: true, id: existing.id };
  if (mine.length >= MAX_SAVED_SEARCHES) {
    return { ok: false, error: `You can keep up to ${MAX_SAVED_SEARCHES} saved searches. Delete one on your Saved page first.` };
  }
  const where = nearMode ? `within ${radius} mi of ${center.city}` : `in ${metroName(metro)}`;
  const saved = await db.savedSearch.create({
    data: {
      userId: user.id,
      name: describeSearch(parseFilters(raw), where),
      params,
      ...location,
      nearCity: nearMode ? `${center.city}, ${center.state}` : "",
    },
  });
  revalidatePath("/saved");
  return { ok: true, id: saved.id };
}

async function ownSearch(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/saved%3Ftab%3Dsearches");
  return db.savedSearch.findFirst({ where: { id, userId: user.id } });
}

export async function setSearchAlerts(id: string, alerts: string) {
  if (!isAlertOption(alerts) || !(await ownSearch(id))) return;
  await db.savedSearch.update({ where: { id }, data: { alerts } });
  revalidatePath("/saved");
}

export async function deleteSavedSearch(id: string) {
  if (!(await ownSearch(id))) return;
  await db.savedSearch.delete({ where: { id } });
  revalidatePath("/saved");
}

// From the link in an alert email; works without signing in, since the token is only in that email.
export async function unsubscribeSearch(token: string) {
  await db.savedSearch.updateMany({ where: { unsubscribeToken: token }, data: { alerts: "OFF" } });
}
