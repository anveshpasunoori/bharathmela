import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ShareButton } from "@/components/ShareButton";
import { TrustBadges } from "@/components/TrustBadges";
import { ContactButtons } from "@/components/ContactButtons";
import { DietBadges } from "@/components/DietBadges";
import { EventServiceDetailsView } from "@/components/EventServiceDetailsView";
import { ProfessionalDetailsView } from "@/components/ProfessionalDetailsView";
import { RentalDetailsView } from "@/components/RentalDetailsView";
import { ReviewList } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { getCurrentUser } from "@/lib/auth";
import { milesBetween, zipCoords } from "@/lib/geo";
import { timeAgo } from "@/lib/time";
import { getUserLocation } from "@/lib/user-location";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { CATEGORY_RULES } from "@/lib/legal";
import { publicListing } from "@/lib/listings";
import { metroName } from "@/lib/metros";
import { formatUSD, priceLabel } from "@/lib/plans";
import { readEventService } from "@/lib/event-services";
import { isProfessional, readProfessional } from "@/lib/professionals";
import { readRental, spaceTypeLabel } from "@/lib/rentals";
import { rentComparison } from "@/lib/rent-trends";
import { PUBLIC_REVIEW, ratingsFor } from "@/lib/reviews";
import { messageSeller, toggleSaved } from "../../actions/buyer";
import { submitReview } from "../../actions/review";

async function getListing(id: string) {
  return db.listing.findFirst({
    where: { id, ...publicListing() },
    include: { vendor: true, photos: { orderBy: { position: "asc" } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const listing = await getListing((await params).id);
  return listing
    ? { title: `${listing.title} – ${listing.vendor.businessName} | BharathMela`, description: listing.description.slice(0, 160) }
    : { title: "Listing not found | BharathMela" };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();
  const buyerNote = CATEGORY_RULES[listing.category]?.buyer;
  const rental = listing.category === "ROOM_RENTAL" ? readRental(listing.details) : null;
  const professional = isProfessional(listing.category) ? readProfessional(listing.details) : null;
  const eventService = listing.category === "EVENT_SERVICES" ? readEventService(listing.details) : null;

  const [user, reviews, ratings, sellerSince, place] = await Promise.all([
    getCurrentUser(),
    db.review.findMany({
      where: { vendorId: listing.vendorId, ...PUBLIC_REVIEW },
      include: { buyer: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    ratingsFor([listing.vendorId]),
    db.user.findUnique({
      where: { id: listing.vendor.userId },
      select: { createdAt: true, lastSeenAt: true, emailVerifiedAt: true, phoneVerifiedAt: true },
    }),
    getUserLocation(),
  ]);
  const saved = user ? !!(await db.favorite.findUnique({ where: { userId_listingId: { userId: user.id, listingId: listing.id } } })) : false;
  const coords = place && zipCoords(listing.zip);
  const miles = place && coords ? Math.round(milesBetween(place, coords)) : null;
  const own = user?.id === listing.vendor.userId;
  const rent = rental ? await rentComparison(listing) : null;
  // Count views from everyone except the seller.
  if (user?.id !== listing.vendor.userId) {
    await db.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } });
  }
  const summary = ratings.get(listing.vendorId);
  const mine = user ? await db.review.findUnique({ where: { vendorId_buyerId: { vendorId: listing.vendorId, buyerId: user.id } } }) : null;
  const here = `/listing/${listing.id}`;

  const price = listing.priceCents != null ? priceLabel(listing.priceCents, listing.priceUnit) : null;
  const facts = [
    categoryLabel(listing.category),
    miles != null ? `${miles < 1 ? "under 1" : miles} mi away` : metroName(listing.metro),
    `posted ${timeAgo(listing.createdAt)}`,
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24 sm:pb-0">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/?category=${listing.category}`} className="text-sm text-stone-500 hover:text-brand">← Back</Link>
        <div className="flex gap-2">
          <ShareButton title={listing.title} text={`${listing.title} – ${listing.vendor.businessName} on BharathMela`} className="btn-outline whitespace-nowrap px-3 py-1.5" />
          {!own && (
            <form action={toggleSaved.bind(null, listing.id)}>
              <button className={`btn-outline whitespace-nowrap px-3 py-1.5 ${saved ? "text-brand" : ""}`} aria-pressed={saved}>
                {saved ? "♥ Saved" : "♡ Save"}
              </button>
            </form>
          )}
        </div>
      </div>

      <PhotoGallery photos={listing.photos} title={listing.title} />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
        {price && (
          <p className="text-xl">
            <b>{price.main}</b> <span className="text-base text-stone-500">{price.unit}</span>
          </p>
        )}
        <p className="text-sm text-stone-500">{facts.join(" · ")}</p>
        <DietBadges tags={listing.tags} className="pt-1" />
      </header>

      {rental && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-900">
          <b>Rental tip:</b> see the place before paying anything, and never wire money or pay with gift cards.
        </p>
      )}

      <section className="card space-y-3" aria-label="Seller">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href={`/seller/${listing.vendorId}`} className="text-lg font-semibold hover:text-brand">{listing.vendor.businessName}</Link>
            {summary && <div><Stars rating={summary.average} count={summary.count} /></div>}
          </div>
          {sellerSince && (
            <TrustBadges
              emailVerified={!!sellerSince.emailVerifiedAt}
              phoneVerified={!!sellerSince.phoneVerifiedAt}
              lastSeenAt={sellerSince.lastSeenAt}
            />
          )}
        </div>
        <ContactButtons phone={listing.vendor.phone} whatsapp={listing.vendor.whatsapp} name={listing.vendor.businessName} />
        {!own && (
          <details id="message" className="text-sm">
            <summary className="cursor-pointer font-semibold text-brand">✉ Message instead</summary>
            <div className="mt-3">
              {!user ? (
                <p className="text-stone-600">
                  <Link href={`/login?next=${here}`} className="font-semibold text-brand">Log in</Link> or{" "}
                  <Link href={`/signup?next=${here}`} className="font-semibold text-brand">sign up free</Link> to message the seller.
                </p>
              ) : (
                <ActionForm action={messageSeller} submitLabel="Send message" className="space-y-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <textarea className="input min-h-24" name="message" required minLength={10} maxLength={2000} aria-label="Message"
                    placeholder="Hi! Is this available on Saturday the 14th?" />
                  <p className="text-xs text-stone-500">The seller replies to your email. Your email isn&apos;t shown on the site.</p>
                </ActionForm>
              )}
            </div>
          </details>
        )}
      </section>

      <section className="space-y-3" aria-label="Details">
        <h2 className="font-semibold">About</h2>
        {rental && <RentalDetailsView details={rental} zip={listing.zip} />}
        {rent && (
          <p className={`rounded-md px-3 py-2 text-sm ${rent.suspiciouslyLow ? "bg-red-50 text-red-900" : "bg-stone-50 text-stone-700"}`}>
            Typical rent for a {spaceTypeLabel(rental!.spaceType).toLowerCase()} within 15 mi is <b>{formatUSD(rent.typicalCents)}/mo</b>; this one is{" "}
            {rent.percent === 0 ? "about the same" : `${Math.abs(rent.percent)}% ${rent.percent < 0 ? "lower" : "higher"}`}.
            {rent.suspiciouslyLow && <> <b>Far below typical rent is a common scam sign.</b></>}
          </p>
        )}
        {professional && <ProfessionalDetailsView category={listing.category} details={professional} />}
        {eventService && <EventServiceDetailsView details={eventService} />}
        <p className="whitespace-pre-line text-stone-700">{listing.description}</p>
      </section>

      <section className="space-y-3 border-t border-stone-200 pt-5" aria-label="Reviews">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Reviews {summary && <span className="font-normal text-stone-500">({summary.count})</span>}</h2>
          {summary && summary.count > reviews.length && (
            <Link href={`/seller/${listing.vendorId}`} className="text-sm text-brand">See all</Link>
          )}
        </div>
        <ReviewList reviews={reviews} sellerName={listing.vendor.businessName} />
        {!own && (
          <details className="text-sm" open={!!mine}>
            <summary className="cursor-pointer font-semibold text-brand">{mine ? "Edit your review" : "Write a review"}</summary>
            <div className="mt-3">
              {!user ? (
                <p className="text-stone-600">
                  <Link href={`/login?next=${here}`} className="font-semibold text-brand">Log in</Link> or{" "}
                  <Link href={`/signup?next=${here}`} className="font-semibold text-brand">sign up free</Link> to review this seller.
                </p>
              ) : user.role !== "BUYER" ? (
                <p className="text-stone-600">Reviews are written from buyer accounts.</p>
              ) : !user.emailVerifiedAt ? (
                <p className="text-stone-600">
                  <Link href={`/verify?next=${here}`} className="font-semibold text-brand">Verify your email</Link> to review this seller.
                </p>
              ) : (
                <ActionForm action={submitReview} submitLabel={mine ? "Update review" : "Post review"} className="space-y-3">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <fieldset>
                    <legend className="label">Your rating</legend>
                    <div className="flex flex-wrap gap-3">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <label key={n} className="flex items-center gap-1">
                          <input type="radio" name="rating" value={n} required defaultChecked={mine?.rating === n} />
                          <span className="text-amber-500">{"★".repeat(n)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <textarea className="input min-h-20" name="comment" maxLength={1000} defaultValue={mine?.comment}
                    placeholder="What was your experience? (optional)" aria-label="Comment" />
                  <label className="flex gap-2 text-stone-700">
                    <input type="checkbox" name="honest" required className="mt-0.5" />
                    <span>This is my honest experience. I&apos;m not related to the seller and wasn&apos;t paid for it.</span>
                  </label>
                </ActionForm>
              )}
            </div>
          </details>
        )}
      </section>

      <footer className="space-y-1 border-t border-stone-200 pt-4 text-xs text-stone-500">
        {buyerNote && <p>{buyerNote}</p>}
        <p>
          Listed by an independent seller. BharathMela doesn&apos;t verify sellers or take part in deals.{" "}
          <Link href="/safety" className="underline">Safety tips</Link> ·{" "}
          <Link href={`/listing/${listing.id}/report`} className="font-semibold text-red-700 underline">Report</Link>
        </p>
      </footer>

      {!own && (
        // Contact stays in reach on phones while the buyer reads the listing.
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <ContactButtons phone={listing.vendor.phone} whatsapp={listing.vendor.whatsapp} name={listing.vendor.businessName} compact />
        </div>
      )}
    </div>
  );
}
