"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { forgetLocation, locateByCoords, locateByZip } from "@/app/actions/location";
import { METROS } from "@/lib/metros";

// City picker plus "Use my location" (browser GPS → the real city) and a ZIP fallback.
// On the home page a known location switches to "near you" mode, so the metro param is dropped;
// other pages switch to the metro the location belongs to.
export function LocationPicker({
  metro,
  basePath = "/",
  place,
}: {
  metro: string;
  basePath?: string;
  place?: { city: string; state: string } | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("");
  const [zipOpen, setZipOpen] = useState(false);
  const [zip, setZip] = useState("");
  const [pending, start] = useTransition();

  function go(nextMetro: string | null) {
    const next = new URLSearchParams(params);
    next.delete("radius");
    if (nextMetro) next.set("metro", nextMetro);
    else next.delete("metro");
    router.push(`${basePath}?${next}`);
    router.refresh();
  }

  function afterLocate(r: Awaited<ReturnType<typeof locateByZip>>) {
    if (!r.ok) return setStatus(r.error);
    setStatus("");
    setZipOpen(false);
    go(basePath === "/" ? null : r.metro);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setZipOpen(true);
      return setStatus("Location isn't available in this browser. Enter your ZIP code instead.");
    }
    setStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => start(async () => afterLocate(await locateByCoords(pos.coords.latitude, pos.coords.longitude))),
      () => {
        setZipOpen(true);
        setStatus("Couldn't get your location. Enter your ZIP code instead.");
      },
      { maximumAge: 10 * 60_000, timeout: 15_000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-auto" value={metro} onChange={(e) => go(e.target.value)} aria-label="City">
          {METROS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}, {m.state}
            </option>
          ))}
        </select>
        <button type="button" onClick={useMyLocation} className="btn-outline" disabled={pending}>
          📍 Use my location
        </button>
        <button type="button" onClick={() => setZipOpen(!zipOpen)} className="text-sm font-semibold text-brand">
          Enter ZIP
        </button>
        {place && (
          <span className="text-sm text-stone-600">
            Your location: <b>{place.city}, {place.state}</b>{" "}
            <button
              type="button"
              className="text-stone-400 underline hover:text-brand"
              onClick={() =>
                start(async () => {
                  await forgetLocation();
                  go(metro);
                })
              }
            >
              forget
            </button>
          </span>
        )}
      </div>
      {zipOpen && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => afterLocate(await locateByZip(zip)));
          }}
        >
          <input className="input w-32" inputMode="numeric" maxLength={5} placeholder="ZIP code" value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} aria-label="ZIP code" autoFocus />
          <button className="btn-outline" disabled={pending}>Set</button>
        </form>
      )}
      {(status || pending) && <p className="text-sm text-stone-500">{pending ? "Finding listings near you…" : status}</p>}
    </div>
  );
}
