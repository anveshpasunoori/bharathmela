import "server-only";
import { cookies } from "next/headers";
import type { Place } from "./geo";

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
