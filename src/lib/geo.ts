import "server-only";
import zipcodes from "zipcodes";
import { METROS } from "./metros";

// Offline US ZIP → city/coordinates lookups, so a visitor's location never leaves our server.

export type Place = { zip: string; city: string; state: string; lat: number; lng: number };

type Zip = { zip: string; lat: number; lng: number; city: string; state: string };

let usZips: Zip[] | undefined;
let byZip: Map<string, Zip> | undefined;

function load() {
  if (!usZips) {
    usZips = Object.values(zipcodes.codes)
      // Military mail ZIPs (AA/AE/AP) have overseas coordinates; leave them out.
      .filter((c) => c.country === "US" && c.latitude && c.longitude && /^\d{5}$/.test(c.zip) && !["AA", "AE", "AP"].includes(c.state))
      .map((c) => ({ zip: c.zip, lat: c.latitude, lng: c.longitude, city: c.city, state: c.state }));
    byZip = new Map(usZips.map((z) => [z.zip, z]));
  }
  return { usZips, byZip: byZip! };
}

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

const toPlace = (z: Zip): Place => ({ zip: z.zip, city: z.city, state: z.state, lat: z.lat, lng: z.lng });

export function placeFromZip(zip: string): Place | null {
  const z = load().byZip.get(zip.trim().slice(0, 5));
  return z ? toPlace(z) : null;
}

// The city at these coordinates. Some ZIP codes belong to a single company ("City National Bank"),
// so the city name is a distance-weighted vote of the ZIPs nearby rather than just the closest one.
// Null outside the US (no ZIP within 30 miles).
export function placeFromCoords(lat: number, lng: number): Place | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const here = { lat, lng };
  const near: { z: Zip; d: number }[] = [];
  for (const z of load().usZips) {
    // Cheap box check before the exact distance.
    if (Math.abs(z.lat - lat) > 0.5 || Math.abs(z.lng - lng) > 0.7) continue;
    near.push({ z, d: milesBetween(here, z) });
  }
  if (!near.length) return null;
  near.sort((a, b) => a.d - b.d);
  if (near[0].d > 30) return null;
  const votes = new Map<string, number>();
  for (const { z, d } of near.filter((n) => n.d <= near[0].d + 5)) {
    const key = `${z.city}|${z.state}`;
    votes.set(key, (votes.get(key) ?? 0) + 1 / (d + 0.5));
  }
  const [city, state] = [...votes].sort((a, b) => b[1] - a[1])[0][0].split("|");
  // Report the closest ZIP that's actually in the winning city.
  const zip = near.find((n) => n.z.city === city && n.z.state === state)!.z;
  return { zip: zip.zip, city, state, lat, lng };
}

export function zipCoords(zip: string) {
  const z = load().byZip.get(zip);
  return z ? { lat: z.lat, lng: z.lng } : null;
}

// The BharathMela metro a place belongs to, and how far away it is.
export function metroFor(place: { lat: number; lng: number }) {
  let best: (typeof METROS)[number] = METROS[0];
  let miles = Infinity;
  for (const m of METROS) {
    const d = milesBetween(place, m);
    if (d < miles) {
      miles = d;
      best = m;
    }
  }
  return { metro: best.id, miles };
}

// Where a seller is, from the ZIP they enter: the town (what they typed, or the ZIP's own town) and the metro
// whose pages their listings appear on. Null for a ZIP we don't know.
export function sellerPlace(zip: string, typedCity: string) {
  const place = placeFromZip(zip);
  if (!place) return null;
  const { metro, miles } = metroFor(place);
  const town = typedCity.replace(/\s+/g, " ").replace(/,\s*[A-Za-z]{2}$/, "").trim().slice(0, 60) || place.city;
  return { city: `${town}, ${place.state}`, zipCity: place.city, state: place.state, metro, miles };
}
