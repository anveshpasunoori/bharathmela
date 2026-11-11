import { CategoryThumbnail } from "@/components/CategoryThumbnail";
import type { SavedSearch } from "@prisma/client";
import Link from "next/link";
import { deleteSavedSearch } from "@/app/actions/saved-search";
import { parseFilters } from "@/lib/browse-params";
import { ALERT_OPTIONS, savedSearchHref } from "@/lib/saved-searches";
import { timeAgo } from "@/lib/time";
import { AlertSelect } from "./AlertSelect";
import { BellIcon } from "./SaveSearchButton";

// The Searches tab on the Saved page: each saved search with its new listings, a link to its results,
// how often it emails, and delete.
export function SavedSearchList({ searches, newCounts }: { searches: SavedSearch[]; newCounts: Map<string, number> }) {
  if (!searches.length) {
    return (
      <div className="card space-y-2 text-center text-stone-600">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
          <BellIcon className="h-6 w-6" />
        </div>
        <p className="font-semibold text-stone-800">No saved searches yet</p>
        <p className="mx-auto max-w-md text-sm">
          On any results page, tap <b>Save search</b> and we&apos;ll email you when new listings match: a room under your budget, a
          Telugu-speaking pujari, a tiffin near you.
        </p>
        <Link href="/" className="btn mt-2">Start a search</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {searches.map((s) => {
        const fresh = newCounts.get(s.id) ?? 0;
        const category = parseFilters(Object.fromEntries(new URLSearchParams(s.params))).category;
        return (
          <li key={s.id} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
            <Link href={savedSearchHref(s)} className="flex min-w-0 flex-1 items-center gap-3">
              {category ? (
                <CategoryThumbnail id={category} size={48} className="h-12 w-12" />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[22%] bg-brand-soft text-xl" aria-hidden>🔍</span>
              )}
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-stone-900 hover:text-brand">{s.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                  {fresh > 0 ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 font-semibold text-snow">{fresh} new</span>
                  ) : (
                    <span>No new listings</span>
                  )}
                  <span>Saved {timeAgo(s.createdAt)}</span>
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Link href={savedSearchHref(s)} className="btn-outline py-1.5">View</Link>
              <AlertSelect id={s.id} value={s.alerts} options={ALERT_OPTIONS} />
              <form action={deleteSavedSearch.bind(null, s.id)}>
                <button className="rounded-md px-2 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-red-700" aria-label={`Delete saved search ${s.name}`}>
                  Delete
                </button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
