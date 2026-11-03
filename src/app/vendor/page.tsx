import Link from "next/link";
import { deleteEvent, setEventVisibility } from "../actions/event";
import { deleteListing, renewListing, setListingVisibility } from "../actions/vendor";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan, syncExpirations } from "@/lib/billing";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatEventTime } from "@/lib/events";
import { daysUntil } from "@/lib/time";
import { metroTimeZone } from "@/lib/metros";
import { PLANS, formatUSD } from "@/lib/plans";
import { ratingsFor } from "@/lib/reviews";
import { ConfirmButton } from "@/components/ConfirmButton";
import { MoreMenu } from "@/components/MoreMenu";

const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    submitted?: string;
    error?: string;
    review?: string;
    published?: string;
    updated?: string;
    eventPublished?: string;
    phoneVerified?: string;
    tab?: string;
  }>;
}) {
  const { user, vendor } = await requireVendor();
  const params = await searchParams;
  await syncExpirations();

  const [{ plan, subscription }, listings, payments, ratings, events] = await Promise.all([
    getVendorPlan(vendor.id),
    db.listing.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({
      where: { vendorId: vendor.id },
      include: { subscription: true, adBoost: { include: { listing: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    ratingsFor([vendor.id]),
    db.event.findMany({ where: { vendorId: vendor.id }, orderBy: { startsAt: "desc" }, take: 50 }),
  ]);
  const tz = metroTimeZone(vendor.metro);
  const now = new Date();
  const upcomingEventCount = events.filter((e) => e.endsAt > now && (e.status === "ACTIVE" || e.status === "PENDING_REVIEW")).length;
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const expiringCount = listings.filter(
    (l) => (l.status === "ACTIVE" || l.status === "HIDDEN") && l.expiresAt && daysUntil(l.expiresAt) <= 7,
  ).length;
  const usedCount = listings.filter((l) => l.status === "ACTIVE" || l.status === "PENDING_REVIEW").length;
  const canAdd = usedCount < plan.maxListings;
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const rating = ratings.get(vendor.id);
  const tab = params.tab === "events" || params.tab === "billing" ? params.tab : "listings";
  const inReview = listings.filter((l) => l.status === "PENDING_REVIEW").length + events.filter((e) => e.status === "PENDING_REVIEW").length;

  // One message at a time, from whatever the seller just did.
  const flash: [string, "ok" | "info" | "error"] | null = params.submitted
    ? ["Thanks! We received your payment details and will confirm within 1 business day.", "ok"]
    : params.review
      ? [`Your ${params.review === "event" ? "event" : "listing"} was sent for review. We usually check within 1 business day.`, "info"]
      : params.published
        ? ["Your listing is live.", "ok"]
        : params.eventPublished
          ? ["Your event is live.", "ok"]
          : params.updated
            ? ["Your changes are saved.", "ok"]
            : params.phoneVerified
              ? ["✓ Your phone is verified.", "ok"]
              : params.error === "limit"
                ? ["You've reached your plan's listing limit. Hide a listing or upgrade.", "error"]
                : params.error === "eventLimit"
                  ? ["You've reached your plan's limit of upcoming events. Hide an event or upgrade.", "error"]
                  : null;
  const flashTone = { ok: "bg-green-50 text-green-800", info: "bg-amber-50 text-amber-900", error: "bg-red-50 text-red-700" };

  // Everything that needs the seller's attention, in one checklist.
  const todos: { text: string; href: string; action: string }[] = [
    ...(!user.phoneVerifiedAt ? [{ text: "Verify your phone to get a ✓ badge buyers trust", href: "/vendor/verify-phone", action: "Verify" }] : []),
    ...(expiringCount ? [{ text: `Renew ${expiringCount} listing${expiringCount === 1 ? "" : "s"} expiring soon`, href: "/vendor?tab=listings", action: "Review" }] : []),
    ...(!listings.length ? [{ text: "Post your first listing", href: "/vendor/listings/new", action: "Start" }] : []),
  ];
  const tabClass = (t: string) =>
    `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t ? "border-brand text-brand" : "border-transparent text-stone-600 hover:text-stone-900"}`;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{vendor.businessName}</h1>
        <p className="text-sm text-stone-600">
          {activeCount} live · {totalViews.toLocaleString()} views ·{" "}
          {rating ? <>★ {rating.average.toFixed(1)} ({rating.count})</> : "no ratings yet"} · {plan.name} plan
        </p>
        <p className="mt-1 flex flex-wrap gap-x-4 text-sm font-semibold text-brand">
          <Link href={`/seller/${vendor.id}`}>Public page</Link>
          <Link href="/vendor/profile">Edit profile</Link>
          <Link href="/vendor/reviews">Reviews</Link>
        </p>
      </header>

      {flash && <p className={`rounded-md px-4 py-3 text-sm ${flashTone[flash[1]]}`}>{flash[0]}</p>}

      {todos.length > 0 && (
        <section className="card space-y-2 py-4">
          <h2 className="text-sm font-semibold">To do</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {todos.map((t) => (
              <li key={t.text} className="flex items-center justify-between gap-3 py-2">
                <span>{t.text}</span>
                <Link href={t.href} className="btn-outline shrink-0 px-3 py-1">{t.action}</Link>
              </li>
            ))}
          </ul>
          {inReview > 0 && <p className="text-xs text-stone-500">{inReview} item{inReview === 1 ? " is" : "s are"} waiting for review. Nothing to do.</p>}
        </section>
      )}

      <nav className="flex gap-1 border-b border-stone-200" aria-label="Dashboard">
        <Link href="/vendor" className={tabClass("listings")}>Listings ({listings.length})</Link>
        <Link href="/vendor?tab=events" className={tabClass("events")}>Events ({events.length})</Link>
        <Link href="/vendor?tab=billing" className={tabClass("billing")}>Plan & payments</Link>
      </nav>

      {tab === "billing" && (
      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Current plan</p>
          <p className="text-xl font-semibold">{plan.name}</p>
          <p className="text-sm text-stone-600">
            {usedCount} of {plan.maxListings} listings · {upcomingEventCount} of {plan.maxEvents} events
            {subscription?.endsAt && <> · paid through {fmtDate(subscription.endsAt)}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.id !== "PRO" && (
            <Link href="/vendor/upgrade?plan=PRO" className="btn">
              Upgrade to Pro · {formatUSD(PLANS.PRO.priceCents)}
            </Link>
          )}
          {plan.id === "FREE" && (
            <Link href="/vendor/upgrade?plan=BASIC" className="btn-outline">
              Basic · {formatUSD(PLANS.BASIC.priceCents)}
            </Link>
          )}
          {plan.id !== "FREE" && (
            <Link href={`/vendor/upgrade?plan=${plan.id}`} className="btn-outline">
              Renew {plan.name}
            </Link>
          )}
        </div>
      </section>
      )}

      {tab === "listings" && (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          {canAdd ? (
            <Link href="/vendor/listings/new" className="btn">
              + New listing
            </Link>
          ) : (
            <span className="text-sm text-stone-500">Limit reached – upgrade to add more</span>
          )}
        </div>
        {listings.length === 0 && <p className="card text-stone-600">No listings yet. Add your first one!</p>}
        <ul className="space-y-3">
          {listings.map((l) => {
            const featured = l.featuredUntil && l.featuredUntil > now;
            return (
              <li key={l.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{l.title}</span>
                    <ListingStatus status={l.status} />
                    {featured && <span className="badge bg-brand text-white">Featured until {fmtDate(l.featuredUntil!)}</span>}
                  </div>
                  <p className="text-sm text-stone-500">
                    {categoryLabel(l.category)} · {l.views.toLocaleString()} view{l.views === 1 ? "" : "s"}
                    {l.expiresAt && (l.status === "ACTIVE" || l.status === "HIDDEN") && (
                      <>
                        {" · "}
                        {l.expiresAt <= now ? (
                          <span className="font-semibold text-red-700">Expired – not showing to buyers</span>
                        ) : daysUntil(l.expiresAt) <= 7 ? (
                          <span className="font-semibold text-amber-700">Expires in {daysUntil(l.expiresAt)} days</span>
                        ) : (
                          <>Showing until {l.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                        )}
                      </>
                    )}
                  </p>
                  {(l.status === "REJECTED" || l.status === "REMOVED") && l.moderationNote && (
                    <p className="mt-1 text-sm text-red-700">Reason: {l.moderationNote}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {l.status === "ACTIVE" && (!l.expiresAt || l.expiresAt > now) && (
                    <Link href={`/vendor/listings/${l.id}/boost`} className="btn py-1.5">
                      {featured ? "Extend promotion" : "Promote"}
                    </Link>
                  )}
                  {(l.status === "ACTIVE" || l.status === "HIDDEN") && l.expiresAt && daysUntil(l.expiresAt) <= 14 && (
                    <form action={renewListing.bind(null, l.id)}>
                      <button className="btn py-1.5">Renew 90 days</button>
                    </form>
                  )}
                  {l.status !== "REMOVED" && (
                    <Link href={`/vendor/listings/${l.id}/edit`} className="btn-outline py-1.5">
                      {l.status === "REJECTED" ? "Fix & resubmit" : "Edit"}
                    </Link>
                  )}
                  <MoreMenu>
                    {(l.status === "ACTIVE" || l.status === "HIDDEN") && (
                      <form action={setListingVisibility.bind(null, l.id, l.status !== "ACTIVE")}>
                        <button className="btn-outline py-1.5">{l.status === "ACTIVE" ? "Hide from buyers" : "Show to buyers"}</button>
                      </form>
                    )}
                    <ConfirmButton action={deleteListing.bind(null, l.id)} message={`Delete "${l.title}"? This can't be undone.`}>
                      Delete
                    </ConfirmButton>
                  </MoreMenu>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      )}

      {tab === "events" && (
      <section id="events" className="scroll-mt-20">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your events</h2>
            <p className="text-sm text-stone-500">
              {upcomingEventCount} of {plan.maxEvents} upcoming events used
            </p>
          </div>
          {upcomingEventCount < plan.maxEvents ? (
            <Link href="/vendor/events/new" className="btn">+ New event</Link>
          ) : (
            <span className="text-sm text-stone-500">Limit reached – upgrade to add more</span>
          )}
        </div>
        {events.length === 0 && (
          <p className="card text-stone-600">Hosting a concert, dance show, festival celebration or workshop? Post it here.</p>
        )}
        <ul className="space-y-3">
          {events.map((e) => {
            const past = e.endsAt <= now;
            return (
              <li key={e.id} className={`card flex flex-wrap items-center justify-between gap-3 ${past ? "opacity-60" : ""}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{e.title}</span>
                    {past ? <span className="badge bg-stone-200 text-stone-700">Ended</span> : <ListingStatus status={e.status} />}
                  </div>
                  <p className="text-sm text-stone-500">
                    {formatEventTime(e.startsAt, e.endsAt, tz)} · {e.views.toLocaleString()} view{e.views === 1 ? "" : "s"}
                  </p>
                  {(e.status === "REJECTED" || e.status === "REMOVED") && e.moderationNote && (
                    <p className="mt-1 text-sm text-red-700">Reason: {e.moderationNote}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {e.status === "ACTIVE" && !past && (
                    <Link href={`/events/${e.id}`} className="btn-outline py-1.5">View</Link>
                  )}
                  {e.status !== "REMOVED" && !past && (
                    <Link href={`/vendor/events/${e.id}/edit`} className="btn-outline py-1.5">
                      {e.status === "REJECTED" ? "Fix & resubmit" : "Edit"}
                    </Link>
                  )}
                  <MoreMenu>
                    {(e.status === "ACTIVE" || e.status === "HIDDEN") && !past && (
                      <form action={setEventVisibility.bind(null, e.id, e.status !== "ACTIVE")}>
                        <button className="btn-outline py-1.5">{e.status === "ACTIVE" ? "Hide from buyers" : "Show to buyers"}</button>
                      </form>
                    )}
                    <ConfirmButton action={deleteEvent.bind(null, e.id)} message={`Delete "${e.title}"? This can't be undone.`}>
                      Delete
                    </ConfirmButton>
                  </MoreMenu>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      )}

      {tab === "billing" && payments.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Payments</h2>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">For</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="px-4 py-2">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-2">
                      {p.subscription
                        ? `${PLANS[p.subscription.plan as keyof typeof PLANS].name} plan`
                        : `Feature “${p.adBoost?.listing.title}” for ${p.adBoost?.days} days`}
                    </td>
                    <td className="px-4 py-2">{formatUSD(p.amountCents)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={p.status} />
                      {p.adminNote && <span className="ml-2 text-stone-500">{p.adminNote}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ListingStatus({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    ACTIVE: ["Live", "bg-green-100 text-green-800"],
    HIDDEN: ["Hidden", "bg-stone-200 text-stone-700"],
    PENDING_REVIEW: ["In review", "bg-amber-100 text-amber-800"],
    REJECTED: ["Not approved", "bg-red-100 text-red-800"],
    REMOVED: ["Removed", "bg-red-100 text-red-800"],
  };
  const [label, style] = map[status] ?? [status, ""];
  return <span className={`badge ${style}`}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = { PENDING: "Waiting for confirmation", APPROVED: "Confirmed", REJECTED: "Rejected" };
  return <span className={`badge ${styles[status] ?? ""}`}>{labels[status] ?? status}</span>;
}
