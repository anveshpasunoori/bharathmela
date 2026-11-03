import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { ContactButtons } from "@/components/ContactButtons";
import { DietBadges } from "@/components/DietBadges";
import { ProfessionalDetailsView } from "@/components/ProfessionalDetailsView";
import { RentalDetailsView, RentalScamWarning } from "@/components/RentalDetailsView";
import { ReviewList } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { CATEGORY_RULES, PLATFORM_DISCLAIMER } from "@/lib/legal";
import { PUBLIC_LISTING } from "@/lib/listings";
import { metroName } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { isProfessional, readProfessional } from "@/lib/professionals";
import { readRental } from "@/lib/rentals";
import { PUBLIC_REVIEW, ratingsFor } from "@/lib/reviews";
import { submitReview } from "../../actions/review";

async function getListing(id: string) {
  return db.listing.findFirst({ where: { id, ...PUBLIC_LISTING }, include: { vendor: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const listing = await getListing((await params).id);
  return listing
    ? { title: `${listing.title} – ${listing.vendor.businessName} | DesiBazaar`, description: listing.description.slice(0, 160) }
    : { title: "Listing not found | DesiBazaar" };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();
  const buyerNote = CATEGORY_RULES[listing.category]?.buyer;
  const rental = listing.category === "ROOM_RENTAL" ? readRental(listing.details) : null;
  const professional = isProfessional(listing.category) ? readProfessional(listing.details) : null;

  const [user, reviews, ratings, sellerSince] = await Promise.all([
    getCurrentUser(),
    db.review.findMany({
      where: { vendorId: listing.vendorId, ...PUBLIC_REVIEW },
      include: { buyer: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    ratingsFor([listing.vendorId]),
    db.user.findUnique({ where: { id: listing.vendor.userId }, select: { createdAt: true } }),
  ]);
  // Count views from everyone except the seller.
  if (user?.id !== listing.vendor.userId) {
    await db.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } });
  }
  const summary = ratings.get(listing.vendorId);
  const mine = user ? await db.review.findUnique({ where: { vendorId_buyerId: { vendorId: listing.vendorId, buyerId: user.id } } }) : null;
  const here = `/listing/${listing.id}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/?metro=${listing.metro}&category=${listing.category}`} className="text-sm text-stone-500 hover:text-brand">
        ← {categoryLabel(listing.category)} in {metroName(listing.metro)}
      </Link>
      {rental && <RentalScamWarning />}
      <article className="card space-y-3">
        <span className="badge bg-stone-100 text-stone-600">{categoryLabel(listing.category)}</span>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <DietBadges tags={listing.tags} />
        {listing.priceCents != null && (
          <p className="text-lg font-semibold">
            {formatUSD(listing.priceCents)} <span className="text-base font-normal text-stone-500">{listing.priceUnit}</span>
          </p>
        )}
        {rental && <RentalDetailsView details={rental} zip={listing.zip} />}
        {professional && <ProfessionalDetailsView category={listing.category} details={professional} />}
        <p className="whitespace-pre-line text-stone-700">{listing.description}</p>
        <p className="text-xs text-stone-400">Updated {listing.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      </article>

      <div className="card space-y-3">
        <div>
          <p className="text-xs text-stone-500">Posted by an independent seller</p>
          <Link href={`/seller/${listing.vendorId}`} className="text-lg font-semibold hover:text-brand">
            {listing.vendor.businessName}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 text-sm text-stone-600">
            {summary && <Stars rating={summary.average} count={summary.count} />}
            <span>{metroName(listing.metro)} · ZIP {listing.zip}</span>
            {sellerSince && <span>On DesiBazaar since {sellerSince.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
          </div>
        </div>
        <ContactButtons phone={listing.vendor.phone} whatsapp={listing.vendor.whatsapp} name={listing.vendor.businessName} />
        <p className="text-xs text-stone-500">
          Tip: agree on price and details in writing, and pay only after you receive the item or service.{" "}
          <Link href="/safety" className="underline">Safety tips</Link>
        </p>
      </div>

      <section className="card space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Ratings for {listing.vendor.businessName}</h2>
          {summary && summary.count > reviews.length && (
            <Link href={`/seller/${listing.vendorId}`} className="text-sm text-brand">See all {summary.count}</Link>
          )}
        </div>
        {!user && (
          <p className="text-sm text-stone-600">
            <Link href={`/login?next=${here}`} className="font-semibold text-brand">Log in</Link> or{" "}
            <Link href={`/signup?next=${here}`} className="font-semibold text-brand">create a free account</Link> to rate this seller.
          </p>
        )}
        {user?.role === "BUYER" && !user.emailVerifiedAt && (
          <p className="text-sm text-stone-600">
            <Link href={`/verify?next=${here}`} className="font-semibold text-brand">Verify your email</Link> to rate this seller.
          </p>
        )}
        {user?.role === "BUYER" && user.emailVerifiedAt && (
          <ActionForm action={submitReview} submitLabel={mine ? "Update my rating" : "Post rating"} className="space-y-3">
            <input type="hidden" name="listingId" value={listing.id} />
            <fieldset>
              <legend className="label">Your rating</legend>
              <div className="flex flex-wrap gap-3">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="flex items-center gap-1 text-sm">
                    <input type="radio" name="rating" value={n} required defaultChecked={mine?.rating === n} />
                    <span className="text-amber-500">{"★".repeat(n)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <textarea className="input min-h-20" name="comment" maxLength={1000} defaultValue={mine?.comment}
              placeholder="What was your experience? (optional)" aria-label="Comment" />
            <label className="flex gap-2 text-sm text-stone-700">
              <input type="checkbox" name="honest" required className="mt-0.5" />
              <span>This is my honest opinion from my own dealings with this seller. I&apos;m not related to them and wasn&apos;t paid for it.</span>
            </label>
          </ActionForm>
        )}
        <ReviewList reviews={reviews} sellerName={listing.vendor.businessName} />
        <p className="text-xs text-stone-500">Ratings are the opinions of individual users, not of DesiBazaar.</p>
      </section>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        {buyerNote && <p className="mb-2 font-medium text-stone-800">{buyerNote}</p>}
        <p>{PLATFORM_DISCLAIMER}</p>
        <Link href={`/listing/${listing.id}/report`} className="mt-2 inline-block font-semibold text-red-700 hover:underline">
          Report this listing
        </Link>
      </div>
    </div>
  );
}
