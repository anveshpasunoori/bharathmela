import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PUBLIC_LISTING } from "@/lib/listings";
import { ratingsFor } from "@/lib/reviews";
import { toggleSaved } from "../actions/buyer";

export const metadata = { title: "Saved listings – BharathMela" };

export default async function SavedPage() {
  const user = await requireUser("/saved");
  const saved = await db.favorite.findMany({
    where: { userId: user.id },
    include: { listing: { include: { vendor: true, photos: { orderBy: { position: "asc" }, take: 1, select: { thumbUrl: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  // Listings that were removed or hidden stay in the list so the buyer knows what happened.
  const live = await db.listing.findMany({ where: { id: { in: saved.map((s) => s.listingId) }, ...PUBLIC_LISTING }, select: { id: true } });
  const liveIds = new Set(live.map((l) => l.id));
  const ratings = await ratingsFor([...new Set(saved.map((s) => s.listing.vendorId))]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Saved listings</h1>
        <p className="text-stone-600">Your shortlist. Tap ♡ on any listing to add it here.</p>
      </div>
      {saved.length === 0 && (
        <div className="card text-center text-stone-600">
          <p>Nothing saved yet.</p>
          <Link href="/" className="btn mt-3">Browse listings</Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map(({ listing }) =>
          liveIds.has(listing.id) ? (
            <div key={listing.id} className="relative">
              <ListingCard
                listing={{
                  ...listing,
                  vendor: { ...listing.vendor, subscriptions: [] },
                  isFeatured: !!listing.featuredUntil && listing.featuredUntil > now,
                  isPro: false,
                  rating: ratings.get(listing.vendorId),
                  score: 0,
                  distanceMiles: null,
                }}
              />
              <form action={toggleSaved.bind(null, listing.id)} className="absolute right-3 top-3">
                <button className="rounded-full bg-white px-2 py-1 text-sm shadow ring-1 ring-stone-200" aria-label="Remove from saved">♥ Remove</button>
              </form>
            </div>
          ) : (
            <div key={listing.id} className="card flex items-center justify-between gap-3 text-sm text-stone-500">
              <span>&ldquo;{listing.title}&rdquo; is no longer available.</span>
              <form action={toggleSaved.bind(null, listing.id)}>
                <button className="underline">Remove</button>
              </form>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
