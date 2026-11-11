"use client";

import { DEFAULT_SEARCH_RADIUS } from "@/lib/browse-params";
import { VoiceSearchButton } from "../VoiceSearchButton";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";

// `params` opens the right browse page: the category, plus its subcategory filter when there is one.
export type SearchSuggestion = { label: string; category: string; categoryLabel: string; params: Record<string, string> };
export type SearchLocation = { value: string; label: string };

// The home page search: a keyword box with suggestions from our categories and subcategories (arrow keys
// and Enter work), a location picker limited to the cities BharathMela covers, and the search button.
// Results open on the existing browse page, so search, ranking and filters stay exactly as they are.
export function SmartSearch({
  suggestions,
  popular,
  locations,
  defaultLocation,
}: {
  suggestions: SearchSuggestion[];
  popular: SearchSuggestion[];
  locations: SearchLocation[];
  defaultLocation: string;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState(defaultLocation);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const term = q.trim().toLowerCase();
  const items = useMemo(() => {
    if (!term) return popular.slice(0, 6);
    const words = term.split(/\s+/);
    return suggestions
      .map((s) => {
        const hay = `${s.label} ${s.categoryLabel}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const rank = s.label.toLowerCase().startsWith(term) ? 0 : hay.includes(` ${words[0]}`) ? 1 : 2;
        return { s, rank };
      })
      .filter((x): x is { s: SearchSuggestion; rank: number } => !!x)
      .sort((a, b) => a.rank - b.rank || a.s.label.length - b.s.label.length)
      .slice(0, 7)
      .map((x) => x.s);
  }, [term, suggestions, popular]);

  // Where the location picker points: "near" keeps the visitor's own saved place (radius search).
  const where = (): Record<string, string> => ({ radius: String(DEFAULT_SEARCH_RADIUS), ...(loc === "near" ? {} : { metro: loc }) });

  function go(s?: SearchSuggestion) {
    setOpen(false);
    if (s) {
      return router.push(`/?${new URLSearchParams({ ...where(), ...s.params })}`);
    }
    const p = new URLSearchParams(where());
    if (q.trim()) p.set("q", q.trim());
    router.push(`/?${p}`);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(open && active >= 0 ? items[active] : undefined);
      }}
      className="relative flex w-full flex-col gap-2 rounded-3xl bg-white p-2 shadow-[0_18px_50px_-18px_rgba(20,86,56,0.35)] ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-forest/40 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full"
    >
      <div className="relative flex min-w-0 flex-1 items-center">
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 h-5 w-5 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <label htmlFor={`${id}-q`} className="sr-only">What are you looking for?</label>
        <input
          ref={input}
          id={`${id}-q`}
          type="search"
          maxLength={100}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="What are you looking for?"
          value={q}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => (blurTimer.current = setTimeout(() => setOpen(false), 120))}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % Math.max(items.length, 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
          className="h-12 w-full min-w-0 rounded-full bg-transparent pl-12 pr-3 text-base text-ink outline-none placeholder:text-muted focus-visible:outline-none"
        />
        <VoiceSearchButton onTranscript={(text) => {
          setQ(text);
          setActive(-1);
          input.current?.focus();
        }} />
      </div>

      <div className="flex items-center gap-2 sm:contents">
        <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
        <div className="relative flex min-w-0 flex-1 items-center rounded-full bg-ivory sm:w-56 sm:flex-none sm:bg-transparent">
          <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 h-5 w-5 text-forest" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          <label htmlFor={`${id}-loc`} className="sr-only">Location</label>
          <select
            id={`${id}-loc`}
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            className="h-12 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full bg-transparent pl-10 pr-8 text-sm font-semibold text-ink outline-none focus-visible:outline-none"
          >
            {locations.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-3 h-4 w-4 text-muted" fill="currentColor">
            <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
          </svg>
        </div>
        <button
          type="submit"
          className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-forest px-5 font-semibold text-snow transition duration-150 hover:bg-forest-dark active:scale-[0.98] sm:px-6"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          Search
          <span aria-hidden className="hidden transition-transform duration-150 group-hover:translate-x-0.5 sm:inline">→</span>
        </button>
      </div>

      {open && items.length > 0 && (
        <div className="dropdown-panel absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl sm:right-auto sm:w-[min(100%,34rem)]">
          <p className="px-4 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">{term ? "Suggestions" : "Popular searches"}</p>
          <ul id={listId} role="listbox" aria-label={term ? "Suggestions" : "Popular searches"}>
            {items.map((s, i) => (
              <li
                key={`${s.category}-${s.label}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(s)}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm aria-selected:bg-brand-soft"
              >
                <span className="font-medium text-ink">{s.label}</span>
                <span className="truncate text-xs text-muted">{s.categoryLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
