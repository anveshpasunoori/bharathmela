"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { METROS, nearestMetro } from "@/lib/metros";

export function LocationPicker({ metro }: { metro: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("");

  function go(id: string) {
    const next = new URLSearchParams(params);
    next.set("metro", id);
    router.push(`/?${next}`);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setStatus("Location isn't available in this browser.");
    setStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = nearestMetro(pos.coords.latitude, pos.coords.longitude);
        setStatus(`Showing ${m.name}`);
        go(m.id);
      },
      () => setStatus("Couldn't get your location. Pick your city instead."),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="input w-auto" value={metro} onChange={(e) => go(e.target.value)} aria-label="City">
        {METROS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}, {m.state}
          </option>
        ))}
      </select>
      <button type="button" onClick={useMyLocation} className="btn-outline">
        Use my location
      </button>
      {status && <span className="text-sm text-stone-500">{status}</span>}
    </div>
  );
}
