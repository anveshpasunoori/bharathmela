"use client";

import { useEffect } from "react";

export function TrackListingView({ id }: { id: string }) {
  useEffect(() => {
    if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    const record = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", record);
      void fetch(`/api/listing-view?id=${encodeURIComponent(id)}`, { method: "POST", keepalive: true }).catch(() => {});
    };
    document.addEventListener("visibilitychange", record);
    record();
    return () => document.removeEventListener("visibilitychange", record);
  }, [id]);
  return null;
}
