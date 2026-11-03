"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { locateByCoords } from "@/app/actions/location";

// On the home page for visitors who haven't shared a location: one tap to see what's closest, asking
// the browser for permission only then.
export function NearMePrompt({ city }: { city: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pending, start] = useTransition();
  function locate() {
    if (!navigator.geolocation) return setStatus("Location isn't available here. Pick your city at the top instead.");
    setStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        start(async () => {
          const r = await locateByCoords(pos.coords.latitude, pos.coords.longitude);
          if (!r.ok) return setStatus(r.error);
          setStatus("");
          router.refresh();
        }),
      () => setStatus("No problem. You can pick your city or ZIP at the top anytime."),
      { maximumAge: 10 * 60_000, timeout: 15_000 },
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
      <span>Showing {city}.</span>
      <button type="button" onClick={locate} disabled={pending} className="font-semibold text-brand hover:underline disabled:opacity-60">
        📍 Show what&apos;s near me
      </button>
      {status && <span className="text-stone-500">{status}</span>}
    </div>
  );
}
