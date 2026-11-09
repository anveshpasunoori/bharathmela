import { ListingCard } from "./ListingCard";
import type { BrowseListing } from "@/lib/listings";

// A titled row of listing cards that scrolls sideways on phones and wraps into a grid on wider screens.
export function ListingRow({ title, listings, savedIds, viewerVendorId }: { title: string; listings: BrowseListing[]; savedIds: Set<string>; viewerVendorId?: string }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {listings.map((l) => (
          <div key={l.id} className="w-64 shrink-0 snap-start sm:w-auto">
            <ListingCard listing={l} saved={l.vendorId === viewerVendorId ? undefined : savedIds.has(l.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
