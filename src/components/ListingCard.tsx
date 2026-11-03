import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import type { BrowseListing } from "@/lib/listings";
import { priceLabel } from "@/lib/plans";
import { readEventService, rentalItemLabels, serviceLabels } from "@/lib/event-services";
import { isProfessional, licenseLine, readProfessional } from "@/lib/professionals";
import { readRental, rentalSummary } from "@/lib/rentals";
import { timeAgo } from "@/lib/time";
import { DietBadges } from "./DietBadges";
import { Stars } from "./Stars";

export function ListingCard({ listing }: { listing: BrowseListing }) {
  const rental = listing.category === "ROOM_RENTAL" ? readRental(listing.details) : null;
  const pro = isProfessional(listing.category) ? readProfessional(listing.details) : null;
  const ev = listing.category === "EVENT_SERVICES" ? readEventService(listing.details) : null;
  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`card block overflow-hidden transition hover:shadow-md ${listing.isFeatured ? "border-stone-400" : ""}`}
    >
      <div className="-mx-5 -mt-5 mb-3 aspect-[4/3] overflow-hidden rounded-t-lg bg-brand-soft">
        {listing.photos[0] ? (
          <Image src={listing.photos[0].thumbUrl} alt="" width={600} height={450} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-5xl opacity-70" aria-hidden>
            {CATEGORIES.find((c) => c.id === listing.category)?.icon}
          </div>
        )}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {/* Paid placement is labeled as such (FTC guidance on search ads). */}
        {listing.isFeatured && <span className="badge bg-stone-800 text-white" title="This seller paid to show this listing first">Sponsored</span>}
        {listing.isPro && <span className="badge bg-amber-100 text-amber-800" title="Seller is on the paid Pro plan">Pro</span>}
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
      {ev && (
        <p className="mt-2 text-xs text-stone-600">
          {[...serviceLabels(ev), ...rentalItemLabels(ev).slice(0, 3)].join(" · ")}
          {ev.insured && <span className="badge ml-1 bg-green-50 text-green-800">Insured</span>}
        </p>
      )}
      {pro && (
        <p className="mt-2 text-xs text-stone-600">
          {pro.firm} · {licenseLine(listing.category, pro)} · {pro.languages.join(", ")}
          {pro.freeConsultation && <span className="badge ml-1 bg-green-50 text-green-800">Free consultation</span>}
        </p>
      )}
      <p className="mt-2 text-xs text-stone-400">Updated {timeAgo(listing.updatedAt)}</p>
      <div className="mt-1 flex items-baseline justify-between text-sm">
        <span className="text-stone-500">
          {listing.vendor.businessName}
          {listing.distanceMiles != null && (
            <span className="block text-xs">
              📍 {listing.distanceMiles < 1 ? "under 1 mi" : `${Math.round(listing.distanceMiles)} mi`} away
            </span>
          )}
        </span>
        {listing.priceCents != null && (
          <span className="font-semibold">
            {priceLabel(listing.priceCents, listing.priceUnit).main}{" "}
            <span className="font-normal text-stone-500">{priceLabel(listing.priceCents, listing.priceUnit).unit}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
