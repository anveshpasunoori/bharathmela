import Link from "next/link";
import { categoryLabel } from "@/lib/constants";
import type { BrowseListing } from "@/lib/listings";
import { formatUSD } from "@/lib/plans";
import { isProfessional, licenseLine, readProfessional } from "@/lib/professionals";
import { readRental, rentalSummary } from "@/lib/rentals";
import { DietBadges } from "./DietBadges";
import { Stars } from "./Stars";

export function ListingCard({ listing }: { listing: BrowseListing }) {
  const rental = listing.category === "ROOM_RENTAL" ? readRental(listing.details) : null;
  const pro = isProfessional(listing.category) ? readProfessional(listing.details) : null;
  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`card block transition hover:shadow-md ${listing.isFeatured ? "border-brand ring-1 ring-brand/30" : ""}`}
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {listing.isFeatured && <span className="badge bg-brand text-white">Featured</span>}
        {listing.isPro && <span className="badge bg-amber-100 text-amber-800">Pro seller</span>}
        <span className="badge bg-stone-100 text-stone-600">{categoryLabel(listing.category)}</span>
      </div>
      <h3 className="font-semibold">{listing.title}</h3>
      {listing.rating && <Stars rating={listing.rating.average} count={listing.rating.count} />}
      {rental ? (
        <p className="mt-1 text-sm text-stone-700">{rentalSummary(rental).join(" · ")}</p>
      ) : (
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{listing.description}</p>
      )}
      <DietBadges tags={listing.tags} className="mt-2" />
      {pro && (
        <p className="mt-2 text-xs text-stone-600">
          {pro.firm} · {licenseLine(listing.category, pro)} · {pro.languages.join(", ")}
          {pro.freeConsultation && <span className="badge ml-1 bg-green-50 text-green-800">Free consultation</span>}
        </p>
      )}
      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span className="text-stone-500">{listing.vendor.businessName}</span>
        {listing.priceCents != null && (
          <span className="font-semibold">
            {formatUSD(listing.priceCents)} <span className="font-normal text-stone-500">{listing.priceUnit}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
