import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { SaveHeart } from "./SaveHeart";
import { categoryLabel, parseTags, tagLabel } from "@/lib/constants";
import { readEventService, serviceLabels } from "@/lib/event-services";
import type { BrowseListing } from "@/lib/listings";
import { priceLabel } from "@/lib/plans";
import { isProfessional, readProfessional, specialtyLabels } from "@/lib/professionals";
import { readRental, rentalSummary } from "@/lib/rentals";
import { hasServiceTypes, parseServiceTypes, serviceTypeLabel } from "@/lib/service-types";
import { readGarageSale, saleWhen } from "@/lib/garage-sales";

// The one line of facts a buyer scans for in each category.
function keyFacts(listing: BrowseListing) {
  if (listing.category === "ROOM_RENTAL") {
    const r = readRental(listing.details);
    if (r) return rentalSummary(r).join(" · ");
  }
  if (listing.category === "EVENT_SERVICES") {
    const e = readEventService(listing.details);
    if (e) return serviceLabels(e).join(" · ");
  }
  if (isProfessional(listing.category)) {
    const p = readProfessional(listing.details);
    if (p) return [p.firm, specialtyLabels(listing.category, p)[0], p.languages.filter((l) => l !== "English").join(", ")].filter(Boolean).join(" · ");
  }
  if (listing.category === "GARAGE_SALE") {
    const sale = readGarageSale(listing.details);
    if (sale) return saleWhen(sale);
  }
  if (hasServiceTypes(listing.category)) {
    const types = parseServiceTypes(listing.category, listing.tags);
    if (types.length) return types.slice(0, 3).map((t) => serviceTypeLabel(listing.category, t)).join(" · ");
  }
  const diet = parseTags(listing.tags);
  if (diet.length) return diet.filter((t) => !(t === "VEGETARIAN" && diet.includes("VEGAN"))).slice(0, 3).map(tagLabel).join(" · ");
  return categoryLabel(listing.category);
}

// `saved` puts a save heart on the photo (true when already saved); leave it out on the seller's own listings.
export function ListingCard({ listing, saved }: { listing: BrowseListing; saved?: boolean }) {
  const price = listing.priceCents != null ? priceLabel(listing.priceCents, listing.priceUnit) : null;
  const miles = listing.distanceMiles;
  return (
    <div className="group relative">
      <Link href={`/listing/${listing.id}`} className="block overflow-hidden rounded-xl bg-white ring-1 ring-stone-200 transition hover:shadow-md">
        <div className="relative aspect-[4/3] bg-brand-soft">
          {listing.photos[0] ? (
            <Image src={listing.photos[0].thumbUrl} alt="" width={600} height={450} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <CategoryIcon id={listing.category} size={112} className="h-24 w-24 opacity-90 transition group-hover:scale-105 sm:h-28 sm:w-28" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            {/* Paid placement is labeled as such (FTC guidance on search ads). */}
            {listing.isFeatured && <span className="badge bg-stone-900/80 text-white" title="This seller paid to show this listing first">Sponsored</span>}
            {listing.isPro && <span className="badge bg-white/90 text-amber-800" title="Seller is on the paid Pro plan">Pro</span>}
            {listing.isNew && !listing.isFeatured && <span className="badge bg-white/90 text-green-800">New</span>}
          </div>
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-brand">{listing.title}</h3>
          {price && (
            <p className="text-sm">
              <b>{price.main}</b> <span className="text-stone-500">{price.unit}</span>
            </p>
          )}
          <p className="truncate text-sm text-stone-600">{keyFacts(listing)}</p>
          <div className="flex items-center justify-between gap-2 pt-1 text-xs text-stone-500">
            <span className="truncate">
              {listing.vendor.businessName}
              {miles != null && <> · {miles < 1 ? "<1" : Math.round(miles)} mi</>}
            </span>
            {listing.rating && (
              <span className="shrink-0 text-stone-700">
                <span className="text-amber-500">★</span> {listing.rating.average.toFixed(1)} ({listing.rating.count})
              </span>
            )}
          </div>
        </div>
      </Link>
      {saved != null && (
        <div className="absolute right-1.5 top-1.5">
          <SaveHeart listingId={listing.id} title={listing.title} saved={saved} />
        </div>
      )}
    </div>
  );
}
