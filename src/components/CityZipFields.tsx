"use client";

import { useRef, useState } from "react";
import { lookupSellerZip } from "@/app/actions/location";

type Found = NonNullable<Awaited<ReturnType<typeof lookupSellerZip>>>;

// ZIP and city for a seller. The city is free text; entering a ZIP fills in (and corrects) the city for that
// ZIP and says which BharathMela city page the listings will appear on. The seller can still edit the city
// afterwards, e.g. to a neighborhood name.
export function CityZipFields({ initialZip = "", initialCity = "", initialFound = null }: { initialZip?: string; initialCity?: string; initialFound?: Found | null }) {
  const [zip, setZip] = useState(initialZip);
  const [city, setCity] = useState(initialCity);
  const [found, setFound] = useState<Found | null>(initialFound);
  const [status, setStatus] = useState<"idle" | "looking" | "unknown">("idle");
  const latest = useRef("");

  async function onZip(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setZip(digits);
    latest.current = digits;
    if (digits.length < 5) {
      setFound(null);
      setStatus("idle");
      return;
    }
    setStatus("looking");
    const result = await lookupSellerZip(digits);
    if (latest.current !== digits) return; // they kept typing
    setFound(result);
    setStatus(result ? "idle" : "unknown");
    if (result) setCity(result.city);
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="zip">ZIP</label>
          <input
            className="input"
            id="zip"
            name="zip"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            required
            autoComplete="postal-code"
            value={zip}
            onChange={(e) => onZip(e.target.value)}
            aria-describedby="zip-hint"
          />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="city">City</label>
          <input
            className="input"
            id="city"
            name="city"
            required
            maxLength={60}
            autoComplete="address-level2"
            placeholder="Filled in from your ZIP"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>
      <p id="zip-hint" className="text-xs text-stone-500" aria-live="polite">
        {status === "looking" && "Looking up your ZIP…"}
        {status === "unknown" && <span className="text-red-700">We couldn&apos;t find that ZIP. Please check it.</span>}
        {status === "idle" && found && (
          <>
            📍 {found.city}, {found.state} ·{" "}
            {initialFound && found.area !== initialFound.area ? (
              <>Your listings will <b>move to {found.area}</b> when you save.</>
            ) : found.far ? (
              <>There&apos;s no BharathMela city near you yet, so your listings will appear under the nearest one, <b>{found.area}</b>.</>
            ) : (
              <>Your listings will appear under <b>{found.area}</b>.</>
            )}
          </>
        )}
        {status === "idle" && !found && "Enter your ZIP and we'll fill in your city."}
      </p>
    </div>
  );
}
