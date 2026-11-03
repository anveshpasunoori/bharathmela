import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactButtons } from "@/components/ContactButtons";
import { EventCard } from "@/components/EventCard";
import { ListingCard } from "@/components/ListingCard";
import { ReviewList } from "@/components/ReviewList";
import { TrustBadges } from "@/components/TrustBadges";
import { Stars } from "@/components/Stars";
import { db } from "@/lib/db";
import { publicEventWhere } from "@/lib/event-data";
import { publicListing } from "@/lib/listings";
import { metroName } from "@/lib/metros";
import { PUBLIC_REVIEW, ratingsFor } from "@/lib/reviews";

async function getSeller(id: string) {
  return db.vendorProfile.findFirst({
    where: { id, user: { suspendedAt: null, deletedAt: null } },
    include: { user: { select: { createdAt: true, lastSeenAt: true, emailVerifiedAt: true, phoneVerifiedAt: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const seller = await getSeller((await params).id);
  return { title: seller ? `${seller.businessName} | BharathMela` : "Seller not found | BharathMela" };
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) notFound();

  const now = new Date();
  const [listings, reviews, ratings, pro, events] = await Promise.all([
    db.listing.findMany({
      where: { vendorId: id, ...publicListing() },
      include: { vendor: true, photos: { orderBy: { position: "asc" }, take: 1, select: { thumbUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.review.findMany({ where: { vendorId: id, ...PUBLIC_REVIEW }, include: { buyer: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 50 }),
    ratingsFor([id]),
    db.subscription.count({ where: { vendorId: id, plan: "PRO", status: "ACTIVE", endsAt: { gt: now } } }),
    db.event.findMany({ where: { vendorId: id, ...publicEventWhere(now) }, include: { vendor: true }, orderBy: { startsAt: "asc" }, take: 10 }),
  ]);
  const summary = ratings.get(id);

  return (
    <div className="space-y-6">
      <header className="card space-y-3">
        <div>
          <p className="text-xs text-stone-500">Independent seller</p>
          <h1 className="text-2xl font-bold">
            {seller.businessName} {pro > 0 && <span className="badge bg-amber-100 align-middle text-amber-800" title="Seller is on the paid Pro plan">Pro</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 text-sm text-stone-600">
            {summary ? <Stars rating={summary.average} count={summary.count} /> : <span>No ratings yet</span>}
            <span>{metroName(seller.metro)}</span>
            <span>Member since {seller.user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <TrustBadges
          emailVerified={!!seller.user.emailVerifiedAt}
          phoneVerified={!!seller.user.phoneVerifiedAt}
          lastSeenAt={seller.user.lastSeenAt}
        />
        {seller.about && <p className="whitespace-pre-line text-stone-700">{seller.about}</p>}
        <ContactButtons phone={seller.phone} whatsapp={seller.whatsapp} name={seller.businessName} />
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="card text-stone-600">No live listings right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={{ ...l, vendor: { ...l.vendor, subscriptions: [] }, isFeatured: !!l.featuredUntil && l.featuredUntil > now, isPro: pro > 0, rating: undefined, score: 0, distanceMiles: null }}
              />
            ))}
          </div>
        )}
      </section>

      {events.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Upcoming events ({events.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="mb-2 font-semibold">Ratings</h2>
        <ReviewList reviews={reviews} sellerName={seller.businessName} />
        <p className="mt-2 text-xs text-stone-500">Ratings are the opinions of individual users, not of BharathMela.</p>
      </section>
    </div>
  );
}
