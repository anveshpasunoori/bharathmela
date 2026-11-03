import { metroName } from "@/lib/metros";
import { LocationPicker } from "./LocationPicker";

// "📍 Fremont, CA · Change": one line until the visitor wants to change their city.
export function LocationLine({
  metro,
  place,
  basePath,
  suffix,
  children,
}: {
  metro: string;
  place: { city: string; state: string } | null;
  basePath: string;
  suffix?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer list-none text-stone-700">
        📍 <b>{place ? `${place.city}, ${place.state}` : metroName(metro)}</b>
        {suffix} ·{" "}
        <span className="font-semibold text-brand group-open:hidden">{place ? "Change" : "Use my location"}</span>
        <span className="hidden font-semibold text-brand group-open:inline">Close</span>
      </summary>
      <div className="mt-3 space-y-3">
        <LocationPicker metro={metro} place={place} basePath={basePath} />
        {children}
      </div>
    </details>
  );
}
