import { Suspense } from "react";
import { metroName } from "@/lib/metros";
import { resolveLocation } from "@/lib/user-location";
import { AutoLocate } from "./AutoLocate";
import { LocationPicker } from "./LocationPicker";

// "📍 Fremont, CA ▾" in the top bar on every page; opens the location panel.
export async function HeaderLocation() {
  const { place, guess, metro, chosen } = await resolveLocation();
  const center = place ?? guess;
  const label = center ? `${center.city}, ${center.state}` : metroName(metro);
  return (
    <details data-location data-dropdown className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-sm text-stone-700 hover:text-brand">
        <span aria-hidden>📍</span>
        <span className="max-w-[60vw] truncate font-semibold sm:max-w-xs">{label}</span>
        <span className="text-stone-500 group-open:rotate-180" aria-hidden>▾</span>
        <span className="sr-only">Change location</span>
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-72 rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
        <p className="mb-3 text-sm font-semibold">Where are you?</p>
        <Suspense>
          <LocationPicker metro={metro} hasPlace={!!place} />
        </Suspense>
      </div>
      {/* Only for visitors who haven't set or picked a location themselves. */}
      {!place && !chosen && <AutoLocate />}
    </details>
  );
}
