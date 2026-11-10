import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ContactButtons } from "@/components/ContactButtons";
import { ShareButtons } from "@/components/ShareButtons";
import { EventCard } from "@/components/EventCard";
import { ListingCard } from "@/components/ListingCard";
import { ReviewList } from "@/components/ReviewList";
import { TrustBadges } from "@/components/TrustBadges";
import { Stars } from "@/components/Stars";
import { JsonLd } from "@/components/JsonLd";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUrl, idFromSlugParam, sellerPath, snippet } from "@/lib/seo";
import { sellerSchema } from "@/lib/structured-data";
import { db } from "@/lib/db";
import { replyTimeLabel } from "@/lib/reply-time";
import { isNewListing } from "@/lib/time";
import { publicEventWhere } from "@/lib/event-data";
import { publicListing, savedListingIds } from "@/lib/listings";
import { metroName } from "@/lib/metros";
import { PUBLIC_REVIEW, ratingsFor } from "@/lib/reviews";

async function getSeller(id: string) {
  return db.vendorProfile.findFirst({
    where: { id: idFromSlugParam(id), user: { suspendedAt: null, deletedAt: null } },
    include: { user: { select: { createdAt: true, lastSeenAt: true, emailVerifiedAt: true, phoneVerifiedAt: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const seller = await getSeller((await params).id);
  if (!seller) return { title: "Seller not found", robots: { index: false } };
  const title = `${seller.businessName} – ${metroName(seller.metro)}`;
  const description = snippet(seller.about || `${seller.businessName} on BharathMela: listings, reviews and contact details in ${metroName(seller.metro)}.`);
  return { title, description, alternates: { canonical: sellerPath(seller) }, openGraph: { type: "profile", title, description, url: sellerPath(seller) } };
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const param = (await params).id;
  const seller = await getSeller(param);
  if (!seller) notFound();
  // Old and shortened links (/seller/<id>) move to the readable address.
  if (`/seller/${param}` !== sellerPath(seller)) permanentRedirect(sellerPath(seller));
  const id = seller.id;

  const now = new Date();
  const viewer = await getCurrentUser();
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
  const savedIds = await savedListingIds(viewer?.id, listings.map((l) => l.id));
  const summary = ratings.get(id);

  // The category they list most in sets the shop's picture.
  const mainCategory = [...listings.reduce((m, l) => m.set(l.category, (m.get(l.category) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
        <div className="card-pattern h-24 sm:h-32" aria-hidden />
        <div className="space-y-3 px-5 pb-5">
          <div className="-mt-10 flex items-end gap-3 sm:-mt-12">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-md ring-4 ring-white sm:h-24 sm:w-24">
              {mainCategory ? (
                <CategoryIcon id={mainCategory} size={96} className="h-full w-full" />
              ) : (
                <span className="text-3xl font-bold text-brand">{seller.businessName.charAt(0)}</span>
              )}
            </span>
          </div>
          <div>
            <p className="text-xs text-stone-500">Independent seller</p>
            <h1 className="text-2xl font-bold">
              {seller.businessName} {pro > 0 && <span className="badge bg-amber-100 align-middle text-amber-800" title="Seller is on the paid Pro plan">Pro</span>}{" "}
              {seller.foundingSeller && <span className="badge bg-orange-100 align-middle text-orange-800" title="One of the first sellers on BharathMela in this city">★ Founding seller</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 text-sm text-stone-600">
              {summary ? <Stars rating={summary.average} count={summary.count} /> : <span>No ratings yet</span>}
              <span>{seller.city || metroName(seller.metro)}</span>
              <span>Member since {seller.user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
          <TrustBadges
            emailVerified={!!seller.user.emailVerifiedAt}
            phoneVerified={!!seller.user.phoneVerifiedAt}
            lastSeenAt={seller.user.lastSeenAt}
            businessVerified={!!seller.businessVerifiedAt}
            replyLabel={await replyTimeLabel(seller.userId)}
          />
          {seller.about && <p className="whitespace-pre-line text-stone-700">{seller.about}</p>}
          <ContactButtons phone={seller.phone} whatsapp={seller.whatsapp} name={seller.businessName} vendorId={seller.id} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <span>Share:</span>
            <ShareButtons compact url={absoluteUrl(sellerPath(seller))} text={`${seller.businessName} on BharathMela`} campaign="seller" />
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="card text-stone-600">No live listings right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                saved={viewer?.vendor?.id === id ? undefined : savedIds.has(l.id)}
                listing={{ ...l, vendor: { ...l.vendor, subscriptions: [] }, isFeatured: !!l.featuredUntil && l.featuredUntil > now, isPro: pro > 0, rating: undefined, score: 0, distanceMiles: null, isNew: isNewListing(l.createdAt) }}
              />
            ))}
          </div>
        )}
      </section>

      {events.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Upcoming events ({events.length})</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      {viewer?.vendor?.id !== id && (
        <p className="text-xs text-stone-500">
          BharathMela doesn&apos;t take part in deals. Never pay with gift cards, wire transfers or crypto.{" "}
          <Link href="/safety" className="underline">Safety tips</Link> ·{" "}
          <Link href={`/seller/${id}/report`} className="font-semibold text-red-700 underline">Report this business</Link>
        </p>
      )}
      <JsonLd data={sellerSchema(seller, summary)} />
    </div>
  );
}
