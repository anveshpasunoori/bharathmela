"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveSearch } from "@/app/actions/saved-search";

export function BellIcon({ className = "h-4 w-4", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 3.5c-3.3 0-5.5 2.5-5.5 5.6v3.1c0 1-.4 2-1.1 2.8L4.5 16h15l-.9-1c-.7-.8-1.1-1.8-1.1-2.8V9.1c0-3.1-2.2-5.6-5.5-5.6Z M9.8 18.5a2.3 2.3 0 0 0 4.4 0"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// "Save search" on a results page: keeps this search (filters and location) and emails daily when new
// listings match. Once saved, it links to where alerts are managed.
export function SaveSearchButton({ query, saved }: { query: string; saved: boolean }) {
  const [done, setDone] = useState(saved);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (done) {
    return (
      <Link href="/saved?tab=searches" className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-medium text-brand ring-1 ring-orange-200 hover:ring-brand">
        <BellIcon filled />
        Manage saved search
      </Link>
    );
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-800 hover:border-brand hover:text-brand disabled:opacity-60"
        onClick={() =>
          start(async () => {
            const r = await saveSearch(query);
            if (r.ok) setDone(true);
            else setError(r.error);
          })
        }
      >
        <BellIcon />
        {pending ? "Saving…" : "Save search"}
      </button>
      {error && <span className="max-w-xs text-right text-xs text-red-700" role="alert">{error}</span>}
    </span>
  );
}
