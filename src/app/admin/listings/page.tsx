import Link from "next/link";
import { approveEvent, approveListing, approveWanted, rejectEvent, rejectListing, rejectWanted } from "../../actions/admin";
import { DietBadges } from "@/components/DietBadges";
import { categoryLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { eventTypeLabel, formatEventTime } from "@/lib/events";
import { metroName, metroTimeZone } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";

const fmtDate = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function AdminListingsPage() {
  const [pending, pendingEvents, pendingWanted] = await Promise.all([
    db.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { vendor: { include: { user: { select: { email: true, createdAt: true } } } } },
      orderBy: { updatedAt: "asc" },
    }),
    db.event.findMany({
      where: { status: "PENDING_REVIEW", endsAt: { gt: new Date() } },
      include: { vendor: { include: { user: { select: { email: true, createdAt: true } } } } },
      orderBy: { startsAt: "asc" },
    }),
    db.roomWanted.findMany({
      where: { status: "PENDING_REVIEW", expiresAt: { gt: new Date() } },
      include: { user: { select: { name: true, email: true, createdAt: true } } },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  return (
    <section className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">Listings to review</h1>
        <p className="text-sm text-stone-600">
          Held because they&apos;re a seller&apos;s first listing, in a reviewed category (rentals, domestic help), or flagged by the filters.
          Check for discriminatory wording, scams, prohibited items and misleading claims.
        </p>
      </div>
      {pending.length === 0 && <p className="card text-stone-600">Nothing waiting.</p>}
      <ul className="space-y-4">
        {pending.map((l) => (
          <li key={l.id} className="card space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="badge mr-2 bg-stone-100 text-stone-700">{categoryLabel(l.category)}</span>
                <span className="font-semibold">{l.title}</span>
              </div>
              <span className="text-sm text-stone-500">{fmtDate(l.updatedAt)}</span>
            </div>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Why it&apos;s here: {l.moderationNote}</p>
            <DietBadges tags={l.tags} />
            <p className="whitespace-pre-line text-sm text-stone-700">{l.description}</p>
            {l.priceCents != null && (
              <p className="text-sm font-semibold">
                {formatUSD(l.priceCents)} {l.priceUnit}
              </p>
            )}
            <p className="text-sm text-stone-500">
              {l.vendor.businessName} · {l.vendor.user.email} · {l.vendor.phone} · {metroName(l.metro)} · seller joined{" "}
              {l.vendor.user.createdAt.toLocaleDateString()} ·{" "}
              <Link href={`/admin/users?q=${encodeURIComponent(l.vendor.user.email)}`} className="text-brand">manage seller</Link>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <form action={approveListing.bind(null, l.id)}>
                <button className="btn">Approve</button>
              </form>
              <form action={rejectListing.bind(null, l.id)} className="flex flex-1 gap-2">
                <input name="note" className="input" placeholder="What to fix (shown to seller)" required />
                <button className="btn-outline whitespace-nowrap text-red-700">Reject</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="pt-4 text-lg font-bold">Events to review</h2>
      {pendingEvents.length === 0 && <p className="card text-stone-600">No events waiting.</p>}
      <ul className="space-y-4">
        {pendingEvents.map((e) => (
          <li key={e.id} className="card space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="badge mr-2 bg-stone-100 text-stone-700">{eventTypeLabel(e.type)}</span>
                {e.festival && <span className="badge mr-2 bg-orange-100 text-orange-800">{e.festival}</span>}
                <span className="font-semibold">{e.title}</span>
              </div>
              <span className="text-sm text-stone-500">{formatEventTime(e.startsAt, e.endsAt, metroTimeZone(e.metro))}</span>
            </div>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Why it&apos;s here: {e.moderationNote}</p>
            <p className="whitespace-pre-line text-sm text-stone-700">{e.description}</p>
            <p className="text-sm">
              <b>{e.venueName}</b>, {e.address} · {e.isFree ? "Free" : `From ${formatUSD(e.priceCents ?? 0)}`}
              {e.ticketUrl && (
                <>
                  {" · "}
                  <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-brand underline">{e.ticketUrl}</a>
                </>
              )}
            </p>
            <p className="text-sm text-stone-500">
              {e.vendor.businessName} · {e.vendor.user.email} · {e.vendor.phone} · {metroName(e.metro)} ·{" "}
              <Link href={`/admin/users?q=${encodeURIComponent(e.vendor.user.email)}`} className="text-brand">manage organizer</Link>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <form action={approveEvent.bind(null, e.id)}>
                <button className="btn">Approve</button>
              </form>
              <form action={rejectEvent.bind(null, e.id)} className="flex flex-1 gap-2">
                <input name="note" className="input" placeholder="What to fix (shown to organizer)" required />
                <button className="btn-outline whitespace-nowrap text-red-700">Reject</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="pt-4 text-lg font-bold">Room requests to review</h2>
      {pendingWanted.length === 0 && <p className="card text-stone-600">No room requests waiting.</p>}
      <ul className="space-y-4">
        {pendingWanted.map((w) => (
          <li key={w.id} className="card space-y-3">
            <p className="font-semibold">{w.title}</p>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Why it&apos;s here: {w.moderationNote}</p>
            <p className="whitespace-pre-line text-sm text-stone-700">{w.description}</p>
            <p className="text-sm text-stone-500">
              Up to {formatUSD(w.budgetMaxCents)}/mo · {w.areas || "no areas given"} · {metroName(w.metro)} · {w.user.name} · {w.user.email} ·
              joined {w.user.createdAt.toLocaleDateString()}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <form action={approveWanted.bind(null, w.id)}>
                <button className="btn">Approve</button>
              </form>
              <form action={rejectWanted.bind(null, w.id)} className="flex flex-1 gap-2">
                <input name="note" className="input" placeholder="What to fix (shown to poster)" required />
                <button className="btn-outline whitespace-nowrap text-red-700">Reject</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
