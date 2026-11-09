"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

// A time or date in the viewer's own time zone (the server runs on UTC). The server draws the UTC text first;
// the browser swaps in local time.
export function LocalTime({ iso, format }: { iso: string; format: "time" | "day" }) {
  const options: Intl.DateTimeFormatOptions = format === "time" ? { hour: "numeric", minute: "2-digit" } : { weekday: "short", month: "short", day: "numeric" };
  const text = useSyncExternalStore(
    noSubscribe,
    () => new Date(iso).toLocaleString("en-US", options),
    () => new Date(iso).toLocaleString("en-US", { ...options, timeZone: "UTC" }),
  );
  return <time dateTime={iso}>{text}</time>;
}
