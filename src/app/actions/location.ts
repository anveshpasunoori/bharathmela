"use server";

import { metroFor, placeFromCoords, placeFromZip } from "@/lib/geo";
import { clearUserLocation, saveUserLocation } from "@/lib/user-location";

type Result = { ok: true; label: string; metro: string } | { ok: false; error: string };

async function remember(place: NonNullable<ReturnType<typeof placeFromZip>>): Promise<Result> {
  await saveUserLocation(place);
  return { ok: true, label: `${place.city}, ${place.state}`, metro: metroFor(place).metro };
}

export async function locateByCoords(lat: number, lng: number): Promise<Result> {
  const place = placeFromCoords(Number(lat), Number(lng));
  if (!place) return { ok: false, error: "We couldn't match your location to a US city. Enter your ZIP code instead." };
  return remember(place);
}

export async function locateByZip(zip: string): Promise<Result> {
  if (!/^\d{5}$/.test(zip.trim())) return { ok: false, error: "Enter a 5-digit US ZIP code." };
  const place = placeFromZip(zip);
  if (!place) return { ok: false, error: "We don't recognize that ZIP code." };
  return remember(place);
}

export async function forgetLocation() {
  await clearUserLocation();
}
