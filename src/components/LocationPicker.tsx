"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { chooseMetro, forgetLocation, locateByCoords, locateByZip } from "@/app/actions/location";
import { METROS } from "@/lib/metros";

// The location panel in the top bar: GPS, ZIP or a city from the list. Location is app-wide, so after a
// change the current page reloads without any page-specific city or distance in its URL.
export function LocationPicker({ metro, hasPlace }: { metro: string; hasPlace: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [status, setStatus] = useState("");
  const [zip, setZip] = useState("");
  const [pending, start] = useTransition();

  function applied() {
    const next = new URLSearchParams(params);
    next.delete("metro");
    next.delete("radius");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
    // Close the surrounding <details> panel.
    document.querySelectorAll<HTMLDetailsElement>("details[data-location]").forEach((d) => (d.open = false));
  }

  function afterLocate(r: Awaited<ReturnType<typeof locateByZip>>) {
    if (!r.ok) return setStatus(r.error);
    setStatus("");
    applied();
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setStatus("Location isn't available in this browser. Enter your ZIP code instead.");
    setStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => start(async () => afterLocate(await locateByCoords(pos.coords.latitude, pos.coords.longitude))),
      () => setStatus("Couldn't get your location. Enter your ZIP code instead."),
      { maximumAge: 10 * 60_000, timeout: 15_000 },
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <button type="button" onClick={useMyLocation} className="btn w-full" disabled={pending}>
        📍 Use my current location
      </button>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => afterLocate(await locateByZip(zip)));
        }}
      >
        <input className="input flex-1" inputMode="numeric" maxLength={5} placeholder="Or enter ZIP code" value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} aria-label="ZIP code" />
        <button className="btn-outline" disabled={pending || zip.length !== 5}>Go</button>
      </form>
      <label className="block">
        <span className="mb-1 block text-xs text-stone-500">Or pick a city</span>
        <select
          className="input"
          value={metro}
          onChange={(e) => {
            const m = e.target.value;
            start(async () => {
              await chooseMetro(m);
              applied();
            });
          }}
          aria-label="City"
        >
          {METROS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}, {m.state}
            </option>
          ))}
        </select>
      </label>
      {hasPlace && (
        <button
          type="button"
          className="text-xs text-stone-500 underline hover:text-brand"
          onClick={() =>
            start(async () => {
              await forgetLocation();
              applied();
            })
          }
        >
          Forget my precise location
        </button>
      )}
      {(status || pending) && <p className="text-stone-500">{pending ? "Updating…" : status}</p>}
    </div>
  );
}
