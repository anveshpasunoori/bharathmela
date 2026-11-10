"use server";

import { metroFor, placeFromCoords, placeFromZip, sellerPlace } from "@/lib/geo";
import { LOCAL_MILES, isMetro, metroName } from "@/lib/metros";
import { clearUserLocation, saveMetroChoice, saveUserLocation } from "@/lib/user-location";

type Result = { ok: true; label: string; metro: string } | { ok: false; error: string };

async function remember(place: NonNullable<ReturnType<typeof placeFromZip>>): Promise<Result> {
  const metro = metroFor(place).metro;
  await saveUserLocation(place);
  await saveMetroChoice(metro);
  return { ok: true, label: `${place.city}, ${place.state}`, metro };
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

// Picking a city from the list replaces any precise location.
export async function chooseMetro(metro: string) {
  if (!isMetro(metro)) return;
  await clearUserLocation();
  await saveMetroChoice(metro);
}

// The seller sign-up form's ZIP box: the town for that ZIP and the BharathMela city area it falls in.
// Nothing is saved.
export async function lookupSellerZip(zip: string) {
  if (!/^\d{5}$/.test(zip)) return null;
  const place = sellerPlace(zip, "");
  return place && { city: place.zipCity, state: place.state, area: metroName(place.metro), far: place.miles > LOCAL_MILES };
}
