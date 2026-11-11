import "server-only";
import { cookies, headers } from "next/headers";
import { type Place, metroFor, placeFromCoords } from "./geo";
import { DEFAULT_METRO, LOCAL_MILES, METROS, isMetro } from "./metros";

// The visitor's chosen location, kept only in a cookie on their device (never in our database).
const COOKIE = "loc";

export async function getUserLocation(): Promise<Place | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    const ok =
      /^\d{5}$/.test(p.zip) && typeof p.city === "string" && /^[A-Z]{2}$/.test(p.state) &&
      Number.isFinite(p.lat) && Number.isFinite(p.lng);
    return ok ? { zip: p.zip, city: p.city.slice(0, 60), state: p.state, lat: p.lat, lng: p.lng } : null;
  } catch {
    return null;
  }
}

export async function saveUserLocation(place: Place) {
  // Round to ~1 km so the cookie doesn't hold a precise home location.
  const rounded = { ...place, lat: Math.round(place.lat * 100) / 100, lng: Math.round(place.lng * 100) / 100 };
  (await cookies()).set(COOKIE, JSON.stringify(rounded), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function clearUserLocation() {
  (await cookies()).delete(COOKIE);
}

// The BharathMela city (metro) the visitor picked from the list, for visitors who don't share a precise location.
const METRO_COOKIE = "metro";

export async function getMetroChoice() {
  const m = (await cookies()).get(METRO_COOKIE)?.value;
  return m && isMetro(m) ? m : null;
}

export async function saveMetroChoice(metro: string) {
  (await cookies()).set(METRO_COOKIE, metro, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

// Approximate location from the hosting platform's IP lookup (Vercel and Cloudflare add these headers),
// so first-time visitors land in the right city without being asked. City-level only; never stored.
async function ipGuess(): Promise<Place | null> {
  const h = await headers();
  const lat = Number(h.get("x-vercel-ip-latitude") ?? h.get("cf-iplatitude"));
  const lng = Number(h.get("x-vercel-ip-longitude") ?? h.get("cf-iplongitude"));
  if (!lat || !lng) return null;
  return placeFromCoords(lat, lng);
}

// Which metro a page should show: a city in the URL wins, then the visitor's saved place, then their
// chosen city, then a guess from their connection. `place` is only set for a precise, saved location.
// `far` is set when the metro came from where the visitor is but is too far away to call local.
export async function resolveLocation(paramMetro?: string) {
  const [place, chosen] = await Promise.all([getUserLocation(), getMetroChoice()]);
  const guess = !place && !chosen ? await ipGuess() : null;
  const overridden = isMetro(paramMetro);
  const from = place ?? guess;
  const auto = from ? metroFor(from) : null;
  const metro = overridden ? paramMetro : place ? auto!.metro : (chosen ?? auto?.metro ?? DEFAULT_METRO);
  const far =
    from && auto && !overridden && metro === auto.metro && auto.miles > LOCAL_MILES
      ? { city: `${from.city}, ${from.state}`, miles: Math.round(auto.miles) }
      : null;
  return { place, guess, metro, chosen: !!chosen, overridden, far };
}

// A selected city uses its center. Otherwise use the visitor's saved or approximate location first.
export function listingSearchCenter({ place, guess, metro, overridden }: Awaited<ReturnType<typeof resolveLocation>>) {
  if (!overridden && (place || guess)) return (place ?? guess)!;
  const city = METROS.find((m) => m.id === metro) ?? METROS.find((m) => m.id === DEFAULT_METRO)!;
  return { city: city.name, state: city.state, lat: city.lat, lng: city.lng };
}
