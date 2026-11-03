import { sellerPath } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Stars } from "@/components/Stars";
import { requireUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { REPORT_REASONS } from "@/lib/legal";
import { db } from "@/lib/db";
import { publicListing } from "@/lib/listings";
import { ratingsFor } from "@/lib/reviews";
import { firstName } from "@/lib/rooms-wanted";
import { requestServiceLabel } from "@/lib/service-requests";
import { timeAgo } from "@/lib/time";
import { closeRequest, deleteRequest, reportRequest, sendQuote } from "../../actions/service-request";

export const metadata = { title: "Request", robots: { index: false } };

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// One request. The buyer sees the quotes they got; sellers in the category see the request and can quote.
// Requests aren't public pages: only signed-in sellers and the buyer can open them.
export default async function RequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> }) {
  const { id } = await params;
  const { posted } = await searchParams;
  const user = await requireUser(`/requests/${id}`);
  const request = await db.serviceRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true } }, quotes: { include: { vendor: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!request) notFound();
  const own = request.userId === user.id;
  const admin = user.role === "ADMIN";
  const now = new Date();
  const open = request.status === "OPEN" && request.expiresAt > now;
  if (!own && !user.vendor && !admin) {
    return (
      <div className="card mx-auto max-w-md space-y-2 text-center">
        <h1 className="text-xl font-bold">Only sellers can see requests</h1>
        <p className="text-stone-600">Requests are shared with sellers who can help. Need something yourself?</p>
        <Link href="/requests/new" className="btn mt-2">Post what you need</Link>
      </div>
    );
  }
  if (!own && !open && !admin) {
    return (
      <div className="card mx-auto max-w-md space-y-2 text-center">
        <h1 className="text-xl font-bold">This request is closed</h1>
        <p className="text-stone-600">The buyer found help or the request expired.</p>
        <Link href="/requests?tab=near" className="btn mt-2">See other requests near you</Link>
      </div>
    );
  }

  const ratings = await ratingsFor(request.quotes.map((q) => q.vendorId));
  const myQuote = user.vendor ? request.quotes.find((q) => q.vendorId === user.vendor!.id) : undefined;
  const canQuote = !own && !!user.vendor && !myQuote && open &&
    !!(await db.listing.findFirst({ where: { vendorId: user.vendor.id, category: request.category, ...publicListing() }, select: { id: true } }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href={own ? "/requests" : "/requests?tab=near"} className="text-sm text-stone-500 hover:text-brand">
        ← {own ? "My requests" : "Requests near you"}
      </Link>

      {own && posted != null && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900 ring-1 ring-green-200">
          {Number(posted) > 0
            ? `Posted. We emailed ${posted} seller${posted === "1" ? "" : "s"} near you; quotes will show up here and in your inbox.`
            : "Posted. No sellers near you offer this yet; new sellers in this category will see your request while it's open."}
        </p>
      )}

      <header className="card space-y-3">
        <div className="flex items-start gap-3">
          <CategoryIcon id={request.category} size={48} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{requestServiceLabel(request)}</p>
            <h1 className="text-xl font-bold leading-snug">{request.title}</h1>
            <p className="mt-0.5 text-sm text-stone-500">
              {own ? "You" : firstName(request.user.name)} · {request.city} · posted {timeAgo(request.createdAt)}
            </p>
          </div>
        </div>
        <p className="whitespace-pre-line text-stone-700">{request.description}</p>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div><dt className="inline text-stone-500">Needed by: </dt><dd className="inline font-medium">{request.neededBy || "Flexible"}</dd></div>
          {request.budgetCents != null && <div><dt className="inline text-stone-500">Budget: </dt><dd className="inline font-medium">about {money(request.budgetCents)}</dd></div>}
          <div><dt className="inline text-stone-500">Status: </dt><dd className="inline font-medium">{open ? `Open until ${request.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : request.status === "CLOSED" ? "Closed" : "Expired"}</dd></div>
        </dl>
        {own && (
          <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
            {open && (
              <ConfirmButton action={closeRequest.bind(null, request.id)} message="Close this request? Sellers won't be able to send more quotes." className="btn-outline py-1.5">
                I found someone, close it
              </ConfirmButton>
            )}
            <ConfirmButton action={deleteRequest.bind(null, request.id)} message="Delete this request and its quotes?">Delete</ConfirmButton>
          </div>
        )}
      </header>

      {own ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Quotes ({request.quotes.length})</h2>
          {request.quotes.length === 0 ? (
            <p className="card text-stone-600">No quotes yet. Sellers usually answer within a day or two; we&apos;ll email you when one arrives.</p>
          ) : (
            request.quotes.map((q) => {
              const rating = ratings.get(q.vendorId);
              return (
                <article key={q.id} className="card space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={sellerPath({ id: q.vendorId, businessName: q.vendor.businessName })} className="font-semibold hover:text-brand">{q.vendor.businessName}</Link>
                      <p className="text-xs text-stone-500">
                        {rating ? <Stars rating={rating.average} count={rating.count} /> : "No reviews yet"} · {timeAgo(q.createdAt)}
                      </p>
                    </div>
                    {q.priceCents != null && (
                      <p className="text-right font-semibold">{money(q.priceCents)} <span className="text-sm font-normal text-stone-500">{q.priceUnit}</span></p>
                    )}
                  </div>
                  <p className="whitespace-pre-line text-sm text-stone-700">{q.message}</p>
                  <p className="text-xs text-stone-500">
                    To answer, reply to the email we sent you, or see their <Link href={sellerPath({ id: q.vendorId, businessName: q.vendor.businessName })} className="font-medium text-brand">profile and listings</Link>.
                  </p>
                </article>
              );
            })
          )}
          <p className="text-xs text-stone-500">
            BharathMela doesn&apos;t check sellers&apos; work. Check licenses and reviews, get the price and terms in writing, and never pay by wire, gift card or crypto.
          </p>
        </section>
      ) : myQuote ? (
        <section className="card space-y-1">
          <h2 className="font-semibold">Your quote</h2>
          {myQuote.priceCents != null && <p className="font-semibold">{money(myQuote.priceCents)} {myQuote.priceUnit}</p>}
          <p className="whitespace-pre-line text-sm text-stone-700">{myQuote.message}</p>
          <p className="text-xs text-stone-500">Sent {timeAgo(myQuote.createdAt)}. If they&apos;re interested they&apos;ll reply to your email.</p>
        </section>
      ) : canQuote ? (
        <section className="card space-y-3">
          <h2 className="font-semibold">Send a quote</h2>
          <ActionForm action={sendQuote} submitLabel="Send quote">
            <input type="hidden" name="id" value={request.id} />
            <div>
              <label className="label" htmlFor="message">Message</label>
              <textarea id="message" name="message" required minLength={20} maxLength={1500} className="input min-h-28"
                placeholder="What you'd do, when you're free, what's included, and any licenses or insurance you have." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="price">Price in $ <span className="font-normal text-stone-500">(optional)</span></label>
                <input id="price" name="price" inputMode="decimal" className="input" placeholder="e.g. 250" />
              </div>
              <div>
                <label className="label" htmlFor="priceUnit">Per <span className="font-normal text-stone-500">(optional)</span></label>
                <input id="priceUnit" name="priceUnit" maxLength={40} className="input" placeholder="e.g. per visit, total, per hour" />
              </div>
            </div>
            <p className="text-xs text-stone-500">The buyer gets your message by email and can reply to you directly. One quote per request; never ask for payment up front.</p>
          </ActionForm>
        </section>
      ) : (
        <p className="card text-sm text-stone-600">
          Add a live listing in {categoryLabel(request.category)} to quote on requests like this.{" "}
          <Link href="/vendor/listings/new" className="font-semibold text-brand">Create a listing</Link>
        </p>
      )}
      {!own && user.vendor && (
        <details className="text-sm text-stone-500">
          <summary className="cursor-pointer">Report this request</summary>
          <div className="card mt-2">
            <ActionForm action={reportRequest} submitLabel="Send report" secondary>
              <input type="hidden" name="id" value={request.id} />
              <select name="reason" required className="input" defaultValue="">
                <option value="" disabled>Why are you reporting it?</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
              <textarea name="details" maxLength={2000} className="input" placeholder="Anything that helps us review it (optional)" />
            </ActionForm>
          </div>
        </details>
      )}
    </div>
  );
}
