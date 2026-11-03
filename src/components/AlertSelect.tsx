"use client";

import { useTransition } from "react";
import { setSearchAlerts } from "@/app/actions/saved-search";

// How often a saved search emails new matches; saves as soon as it changes.
export function AlertSelect({ id, value, options }: { id: string; value: string; options: readonly { id: string; label: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <select
      className="input w-auto py-1.5 text-sm"
      defaultValue={value}
      disabled={pending}
      aria-label="Email alerts"
      onChange={(e) => {
        const next = e.target.value;
        start(() => setSearchAlerts(id, next));
      }}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}
