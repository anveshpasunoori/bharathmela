import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SaveHeart } from "@/components/SaveHeart";
import { TrackedContactLink } from "@/components/TrackedContactLink";
import { listingPlaceholderPhoto } from "@/lib/home-art";
import { categoryLabel } from "@/lib/constants";
import type { BrowseListing } from "@/lib/listings";
import { listingPath, snippet } from "@/lib/seo";
import { listingSubcategories } from "@/lib/subcategories";
import { MobileViewAll, SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

// One business per card, shown through its best listing. Everything on the card comes from the records:
// the Verified badge only for businesses BharathMela checked, ratings only when there are reviews,
// distance only when the visitor shared a precise location, Call only with a phone number.
export function pickFeatured(listings: BrowseListing[], max = 6) {
  const byVendor = new Map<string, BrowseListing>();
  for (const l of listings) {
    const seen = byVendor.get(l.vendorId);
    // A listing with a photo represents the business better than one without.
    if (!seen || (!seen.photos[0] && l.photos[0])) byVendor.set(l.vendorId, l);
  }
  const score = (l: BrowseListing) =>
    (l.vendor.businessVerifiedAt ? 3 : 0) +
    (l.rating && l.rating.count > 0 ? l.rating.average * Math.min(l.rating.count, 20) / 20 : 0) +
    (l.photos[0] ? 1 : 0) +
    (l.isFeatured ? 1.5 : 0);
  return [...byVendor.values()]
    .map((l, i) => ({ l, s: score(l), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, max)
    .map((x) => x.l);
}

function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}

export function BusinessCard({ listing, saved }: { listing: BrowseListing; saved?: boolean }) {
  const v = listing.vendor;
  const href = listingPath(listing);
  const tel = telHref(v.phone);
  const miles = listing.distanceMiles;
  const sub = listingSubcategories(listing)[0];
  const stockPhoto = listingPlaceholderPhoto(listing.category);
  const about = snippet(v.about || listing.description, 90) || listing.title;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-20px_rgba(32,41,35,0.38)]">
      <Link href={href} className="relative block aspect-[2/1] overflow-hidden bg-brand-soft" tabIndex={-1} aria-hidden>
        {listing.photos[0] ? (
          <Image
            src={listing.photos[0].thumbUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : stockPhoto ? (
          <Image src={stockPhoto} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
        ) : (
          <div className="card-pattern flex h-full items-center justify-center">
            <CategoryIcon id={listing.category} sub={sub} size={140} className="w-32 drop-shadow-md transition duration-500 group-hover:scale-110" />
          </div>
        )}
      </Link>
      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        {listing.isFeatured && (
          <span className="badge bg-stone-900/80 text-stone-50" title="This seller paid to show this listing first">Sponsored</span>
        )}
        {v.businessVerifiedAt && (
          <span className="badge inline-flex items-center gap-1 bg-forest text-snow shadow-sm" title="BharathMela checked this business is real">
            <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor"><path d="M10 1.5l2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L10 18.5l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1zM8.7 13.2l5.6-5.6-1.2-1.2-4.4 4.4-2-2-1.2 1.2z" /></svg>
            Verified
          </span>
        )}
      </div>
      {saved != null && (
        <div className="heart-pop absolute left-2 top-2 z-10">
          <SaveHeart listingId={listing.id} title={listing.title} saved={saved} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-semibold leading-snug text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-forest focus-visible:outline-none">
            {v.businessName}
          </Link>
        </h3>
        {(listing.rating?.count || miles != null) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            {listing.rating && listing.rating.count > 0 && (
              <span className="flex items-center gap-1">
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-saffron" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" /></svg>
                <b className="font-semibold text-saffron-dark">{listing.rating.average.toFixed(1)}</b>
                <span>({listing.rating.count} {listing.rating.count === 1 ? "review" : "reviews"})</span>
              </span>
            )}
            {listing.rating?.count && miles != null ? <span aria-hidden>·</span> : null}
            {miles != null && <span>{miles < 1 ? "Under 1 mi" : `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`}</span>}
          </p>
        )}
        <p className="mt-1 text-xs font-medium text-muted">
          {categoryLabel(listing.category)}{!listing.photos[0] && stockPhoto && " · Illustrative photo"}
        </p>
        <p className="mt-1.5 line-clamp-2 text-sm text-ink/75">{about}</p>
        <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-4">
          <Link href={href} className="group/link inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-forest-dark">
            View details <span aria-hidden className="transition-transform duration-150 group-hover/link:translate-x-0.5">→</span>
          </Link>
          {tel && (
            <TrackedContactLink
              href={tel}
              kind="CALL"
              vendorId={listing.vendorId}
              listingId={listing.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 px-4 py-1.5 text-sm font-semibold text-forest transition duration-150 hover:border-forest hover:bg-forest hover:text-snow"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>
              Call
            </TrackedContactLink>
          )}
        </div>
      </div>
    </article>
  );
}

// `ownVendorId`: no save heart on the visitor's own listings.
export function FeaturedBusinesses({ listings, savedIds, ownVendorId, allHref, where }: { listings: BrowseListing[]; savedIds: Set<string>; ownVendorId?: string; allHref: string; where: string }) {
  return (
    <Reveal className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" aria-labelledby="home-featured">
      <SectionHeading id="home-featured" icon="star" title="Featured businesses near you" href={allHref} linkText="View all businesses" />
      {listings.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {listings.map((l) => (
            <li key={l.id} data-reveal-item>
              <BusinessCard listing={l} saved={l.vendorId === ownVendorId ? undefined : savedIds.has(l.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">No businesses listed {where} yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Run a business from home or serve the Indian community here? Be the first one neighbours find.</p>
          <Link href="/vendor/signup" className="mt-5 inline-flex rounded-full bg-saffron px-5 py-2.5 text-sm font-semibold text-snow transition hover:bg-saffron-dark">
            List your business free
          </Link>
        </div>
      )}
      {listings.length > 0 && <MobileViewAll href={allHref}>View all businesses</MobileViewAll>}
    </Reveal>
  );
}

// Placeholder cards while the businesses load.
export function FeaturedSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading businesses">
      <div className="skeleton mb-6 h-9 w-72 rounded-lg" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="skeleton aspect-[2/1]" />
            <div className="space-y-2 p-5">
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
