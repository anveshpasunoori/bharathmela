"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { locateByCoords } from "@/app/actions/location";

const ASKED_KEY = "bm-location-asked";

// For visitors without a saved location: ask the browser for their position once, shortly after the page
// shows. If they allow it, switch the app to their real city. If they decline, never ask again.
export function AutoLocate() {
  const router = useRouter();
  useEffect(() => {
    if (!navigator.geolocation) return;
    let asked = false;
    try {
      asked = localStorage.getItem(ASKED_KEY) === "1";
    } catch {
      // Storage blocked (private mode): just ask this time.
    }

    const locate = () =>
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const r = await locateByCoords(pos.coords.latitude, pos.coords.longitude);
          if (r.ok) router.refresh();
        },
        () => {},
        { maximumAge: 30 * 60_000, timeout: 15_000 },
      );

    const run = async () => {
      // If permission was already granted earlier, locate silently even if we asked before.
      const state = await navigator.permissions?.query({ name: "geolocation" }).then((p) => p.state).catch(() => "prompt");
      if (state === "denied") return;
      if (state !== "granted" && asked) return;
      try {
        localStorage.setItem(ASKED_KEY, "1");
      } catch {}
      locate();
    };
    // Let the page render first so the prompt doesn't block the first look.
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, [router]);
  return null;
}
