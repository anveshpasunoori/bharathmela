import Image from "next/image";
import { homeEventPhoto, listingPlaceholderPhoto } from "@/lib/home-art";
import { eventPath, sellerPath } from "@/lib/seo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteEvent, setEventVisibility } from "../actions/event";
import { deleteListing, renewListing, setListingVisibility } from "../actions/vendor";
import { requireVendor } from "@/lib/auth";
import { requestsForVendor } from "@/lib/service-requests";
import { getVendorPlan, syncExpirations } from "@/lib/billing";
import { welcomeVerifiedSeller } from "@/lib/growth";
import { openBillingPortal } from "../actions/stripe";
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
    founding?: string;
    reset?: string;
    paid?: string;
    tab?: string;
  }>;
}) {
  const { user, vendor } = await requireVendor();
  const params = await searchParams;
  // Verified sellers who joined before the founding offer, or while their city still has spots, get it now.
  if (user.emailVerifiedAt && !vendor.foundingSeller && (await welcomeVerifiedSeller(user.id))) redirect("/vendor?founding=1");
  await syncExpirations();

  const [{ plan, subscription }, listings, payments, ratings, events, proUntil] = await Promise.all([
    getVendorPlan(vendor.id),
    db.listing.findMany({ where: { vendorId: vendor.id }, include: { _count: { select: { photos: true } }, photos: { select: { thumbUrl: true }, orderBy: { position: "asc" }, take: 1 } }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({
      where: { vendorId: vendor.id },
      include: { subscription: true, adBoost: { include: { listing: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    ratingsFor([vendor.id]),
    db.event.findMany({ where: { vendorId: vendor.id }, orderBy: { startsAt: "desc" }, take: 50 }),
    // Pro can be several periods back to back (free founding or referral months, then paid ones).
    db.subscription
      .findFirst({ where: { vendorId: vendor.id, plan: "PRO", status: "ACTIVE", endsAt: { gt: new Date() } }, orderBy: { endsAt: "desc" } })
      .then((s) => s?.endsAt ?? null),
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
  // Leads this month: taps on Call, Text and WhatsApp, and messages sent through the site.
  const { leadsByKind, leadsByListing, messagesThisMonth } = await monthLeads(vendor.id, user.id);
  const leadTotal = Object.values(leadsByKind).reduce((a, b) => a + b, 0) + messagesThisMonth;
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
              : params.reset
                ? ["Your password is changed, and you're logged in.", "ok"]
              : params.paid
                ? ["Thanks! Your card payment went through. Your plan or boost turns on within a minute.", "ok"]
              : params.founding
                ? ["Welcome, founding seller! You're one of the first sellers in your city, so Pro is free for you for the next few months.", "ok"]
              : params.error === "limit"
                ? ["You've reached your plan's listing limit. Hide a listing or upgrade.", "error"]
                : params.error === "eventLimit"
                  ? ["You've reached your plan's limit of upcoming events. Hide an event or upgrade.", "error"]
                  : null;
  const flashTone = { ok: "bg-green-50 text-green-800", info: "bg-amber-50 text-amber-900", error: "bg-red-50 text-red-700" };

  // Everything that needs the seller's attention, in one checklist.
  const toAnswer = (await requestsForVendor(vendor.id, user.id)).filter((r) => !r.quoted).length;
  // Cards without a photo all look alike, so nudge sellers to add one.
  const noPhotos = listings.filter((l) => (l.status === "ACTIVE" || l.status === "PENDING_REVIEW") && l._count.photos === 0);
  const todos: { text: string; href: string; action: string }[] = [
    ...(noPhotos.length
      ? [{ text: `Add a photo to ${noPhotos.length === 1 ? `"${noPhotos[0].title}"` : `${noPhotos.length} listings`}: listings with real photos get far more calls`, href: `/vendor/listings/${noPhotos[0].id}/edit`, action: "Add photo" }]
      : []),
    ...(toAnswer ? [{ text: `${toAnswer} buyer${toAnswer === 1 ? "" : "s"} near you posted what they need`, href: "/requests?tab=near", action: "Send quotes" }] : []),
    ...(!user.phoneVerifiedAt ? [{ text: "Verify your phone to get a ✓ badge buyers trust", href: "/vendor/verify-phone", action: "Verify" }] : []),
    ...(expiringCount ? [{ text: `Renew ${expiringCount} listing${expiringCount === 1 ? "" : "s"} expiring soon`, href: "/vendor?tab=listings", action: "Review" }] : []),
    ...(!listings.length ? [{ text: "Post your first listing", href: "/vendor/listings/new", action: "Start" }] : []),
  ];
  const tabs = [
    { id: "listings", href: "/vendor", label: "Listings", count: listings.length },
    { id: "events", href: "/vendor?tab=events", label: "Events", count: events.length },
    { id: "billing", href: "/vendor?tab=billing", label: "Plan & payments" },
  ];

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-gradient-to-br from-brand-soft to-white p-5 sm:p-7">
          <div className="min-w-0">
            <p className="text-sm font-medium text-forest">My business</p>
            <h1 className="mt-1 break-words text-3xl font-semibold text-ink sm:text-4xl">{vendor.businessName}</h1>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
              <span>{plan.name} plan</span>
              <span>{activeCount} live {activeCount === 1 ? "listing" : "listings"}</span>
              <span>{rating ? `★ ${rating.average.toFixed(1)} (${rating.count})` : "No ratings yet"}</span>
            </p>
            {vendor.foundingSeller && proUntil && (
              <p className="mt-3 text-sm font-medium text-amber-900 dark:text-amber-200">
                Founding seller · Free Pro through {fmtDate(proUntil)}
              </p>
            )}
          </div>
          <Link href={sellerPath(vendor)} className="btn-outline min-h-11 rounded-full px-4">View public page <span aria-hidden className="ml-2">↗</span></Link>
        </div>
        <nav aria-label="Business tools" className="flex flex-wrap gap-x-5 gap-y-1 px-5 py-2 text-sm font-medium text-forest sm:px-7">
          <Link className="py-2 hover:underline" href="/vendor/profile">Edit profile</Link>
          <Link className="py-2 hover:underline" href="/vendor/reviews">Reviews</Link>
          <Link className="py-2 hover:underline" href="/requests?tab=near">Requests near you</Link>
          <Link className="py-2 hover:underline" href="/vendor/promote">Share &amp; earn free Pro</Link>
        </nav>
      </header>

      {flash && <p className={`rounded-md px-4 py-3 text-sm ${flashTone[flash[1]]}`}>{flash[0]}</p>}

      <section className="rounded-2xl border border-line bg-white p-5 shadow-soft" aria-labelledby="business-activity">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="business-activity" className="text-xl font-semibold">Business activity</h2>
          <span className="text-sm text-muted">{totalViews.toLocaleString()} lifetime listing views</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {([
            ["Calls", leadsByKind.CALL],
            ["Texts", leadsByKind.TEXT],
            ["WhatsApp", leadsByKind.WHATSAPP],
            ["Messages", messagesThisMonth],
          ] as const).map(([label, count]) => (
            <div key={label} className="rounded-xl border border-line bg-stone-50 px-3 py-3 sm:px-4">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{count.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">
          {leadTotal === 0 ? <>No contacts this month. <Link href="/vendor/promote" className="font-semibold text-forest hover:underline">Share your business page</Link> to help buyers find you.</> : "This month. Contact taps are counted once per person per day."}
        </p>
      </section>

      {todos.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">Needs attention</h2>
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

      <nav className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1.5" aria-label="Dashboard">
        {tabs.map(({ id, href, label, count }) => (
          <Link
            key={id}
            href={href}
            aria-current={tab === id ? "page" : undefined}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-brand-soft hover:text-forest aria-[current=page]:bg-forest aria-[current=page]:text-snow"
          >
            {label}{count != null && <span className="text-xs tabular-nums opacity-85">{count}</span>}
          </Link>
        ))}
      </nav>

      {tab === "billing" && (
      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Current plan</p>
          <p className="text-xl font-semibold">{plan.name}</p>
          <p className="text-sm text-stone-600">
            {usedCount} of {plan.maxListings} listings · {upcomingEventCount} of {plan.maxEvents} events
            {subscription?.endsAt && (
              <> · {subscription.source === "PAID" ? "paid" : "free"} through {fmtDate(plan.id === "PRO" && proUntil ? proUntil : subscription.endsAt)}</>
            )}
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
          {vendor.stripeSubscriptionId ? (
            // Paying by card: renewals are automatic; changes happen on Stripe's billing page.
            <form action={openBillingPortal}>
              <button className="btn-outline">Manage billing</button>
            </form>
          ) : (
            plan.id !== "FREE" && (
              <Link href={`/vendor/upgrade?plan=${plan.id}`} className="btn-outline">
                Renew {plan.name}
              </Link>
            )
          )}
        </div>
      </section>
      )}

      {tab === "listings" && (
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Your listings</h2>
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
            const photo = l.photos[0]?.thumbUrl ?? listingPlaceholderPhoto(l.category);
            return (
              <li key={l.id} className="rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
                <div className="flex items-start gap-4">
                  {photo && <Image src={photo} alt="" width={96} height={80} className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20 sm:w-24" />}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{l.title}</span>
                      <ListingStatus status={l.status} />
                      {featured && <span className="badge bg-brand text-snow">Featured until {fmtDate(l.featuredUntil!)}</span>}
                    </div>
                    <p className="text-sm text-stone-500">
                      {categoryLabel(l.category)} · {l.views.toLocaleString()} view{l.views === 1 ? "" : "s"}
                      {leadsByListing.get(l.id) ? <> · <b className="text-stone-800">{leadsByListing.get(l.id)} contact{leadsByListing.get(l.id) === 1 ? "" : "s"}</b> this month</> : null}
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
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
                  {l.status === "ACTIVE" && (!l.expiresAt || l.expiresAt > now) && (
                    <Link href={`/vendor/listings/${l.id}/boost`} className="btn-outline py-1.5">
                      {featured ? "Extend promotion" : "Promote"}
                    </Link>
                  )}
                  {(l.status === "ACTIVE" || l.status === "HIDDEN") && l.expiresAt && daysUntil(l.expiresAt) <= 14 && (
                    <form action={renewListing.bind(null, l.id)}>
                      <button className="btn py-1.5">Renew 90 days</button>
                    </form>
                  )}
                  {l.category === "CREATORS" && l.status !== "REMOVED" && (
                    <Link href="/vendor/verify-handles" className="btn-outline py-1.5">Verify handles</Link>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Your events</h2>
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
              <li key={e.id} className="rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
                <div className="flex items-start gap-4">
                  <Image src={homeEventPhoto(e)} alt="" width={96} height={80} className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20 sm:w-24" />
                  <div className="min-w-0 space-y-1">
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
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
                  {e.status === "ACTIVE" && !past && (
                    <Link href={eventPath(e)} className="btn-outline py-1.5">View</Link>
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
                      {p.method === "CARD" && <span className="ml-2 text-stone-500">Card</span>}
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

// Contacts since the 1st of this month: taps by kind, per listing, and messages received.
async function monthLeads(vendorId: string, sellerUserId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const [byKind, byListing, messagesThisMonth] = await Promise.all([
    db.lead.groupBy({ by: ["kind"], where: { vendorId, createdAt: { gte: start } }, _count: true }),
    db.lead.groupBy({ by: ["listingId"], where: { vendorId, createdAt: { gte: start }, listingId: { not: null } }, _count: true }),
    db.message.count({ where: { toUserId: sellerUserId, createdAt: { gte: start } } }),
  ]);
  const leadsByKind = { CALL: 0, TEXT: 0, WHATSAPP: 0 } as Record<string, number>;
  for (const r of byKind) leadsByKind[r.kind] = r._count;
  return { leadsByKind, leadsByListing: new Map(byListing.map((r) => [r.listingId!, r._count])), messagesThisMonth };
}
