"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { locateByCoords } from "@/app/actions/location";

// For visitors without a saved location who already allowed location for this site: use it quietly.
// Nobody is asked on arrival; the "Show what's near me" button (NearMePrompt) asks when they want it.
export function AutoLocate() {
  const router = useRouter();
  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((p) => {
        if (p.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const r = await locateByCoords(pos.coords.latitude, pos.coords.longitude);
            if (r.ok) router.refresh();
          },
          () => {},
          { maximumAge: 30 * 60_000, timeout: 15_000 },
        );
      })
      .catch(() => {});
  }, [router]);
  return null;
}
