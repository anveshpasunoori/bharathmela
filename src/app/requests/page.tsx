import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { firstName } from "@/lib/rooms-wanted";
import { openRequest, requestServiceLabel, requestsForVendor } from "@/lib/service-requests";
import { timeAgo } from "@/lib/time";

export const metadata = { title: "Requests – BharathMela" };

// "My requests" for buyers, and for sellers a "Near you" tab of open requests they can quote on.
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string; deleted?: string }> }) {
  const user = await requireUser("/requests");
  const params = await searchParams;
  const now = new Date();
  const mine = await db.serviceRequest.findMany({
    where: { userId: user.id },
    include: { _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" },
  });
  const near = user.vendor ? await requestsForVendor(user.vendor.id, user.id) : [];
  const unanswered = near.filter((n) => !n.quoted).length;
  const tab = user.vendor && (params.tab === "near" || (params.tab !== "mine" && !mine.length && near.length)) ? "near" : "mine";
  const tabLink = (on: boolean) =>
    `-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-2.5 text-sm font-semibold transition ${
      on ? "border-brand text-brand" : "border-transparent text-stone-500 hover:text-stone-800"
    }`;
  const isOpen = (r: { status: string; expiresAt: Date }) => r.status === openRequest(now).status && r.expiresAt > now;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Requests</h1>
          <p className="mt-1 text-sm text-stone-600">Tell sellers near you what you need and get quotes, without calling around.</p>
        </div>
        <Link href="/requests/new" className="btn">Post what you need</Link>
      </div>
      {params.deleted && <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Request deleted.</p>}

      {user.vendor && (
        <nav className="flex gap-6 border-b border-stone-200" aria-label="Requests">
          <Link href="/requests?tab=mine" className={tabLink(tab === "mine")} aria-current={tab === "mine" ? "page" : undefined}>
            My requests <span className="font-normal text-stone-400">{mine.length}</span>
          </Link>
          <Link href="/requests?tab=near" className={tabLink(tab === "near")} aria-current={tab === "near" ? "page" : undefined}>
            Near you <span className="font-normal text-stone-400">{near.length}</span>
            {unanswered > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[11px] leading-none text-white">{unanswered} to answer</span>}
          </Link>
        </nav>
      )}

      {tab === "near" ? (
        near.length === 0 ? (
          <p className="card text-center text-stone-600">No open requests near you in your categories right now. We&apos;ll email you when one comes in.</p>
        ) : (
          <ul className="space-y-3">
            {near.map(({ request: r, quoted, miles }) => (
              <li key={r.id}>
                <Link href={`/requests/${r.id}`} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:shadow-sm">
                  <CategoryIcon id={r.category} size={48} className="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">{requestServiceLabel(r)}</span>
                    <span className="block font-semibold leading-snug">{r.title}</span>
                    <span className="block text-xs text-stone-500">
                      {firstName(r.user.name)} · {r.city}{Number.isFinite(miles) ? ` · ${Math.round(miles)} mi` : ""} · {r.neededBy ? `by ${r.neededBy}` : "flexible date"} · {timeAgo(r.createdAt)}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${quoted ? "bg-stone-100 text-stone-600" : "bg-brand text-white"}`}>
                    {quoted ? "Quoted" : `Quote · ${r._count.quotes} sent`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : mine.length === 0 ? (
        <div className="card space-y-2 text-center text-stone-600">
          <p className="font-semibold text-stone-800">Need a pujari, a plumber or a tiffin service?</p>
          <p className="mx-auto max-w-md text-sm">Post what you need once. Sellers near you who offer it get an email and send you quotes; you reply only to the ones you like.</p>
          <Link href="/requests/new" className="btn mt-2">Post what you need</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {mine.map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:shadow-sm">
                <CategoryIcon id={r.category} size={48} className={`h-12 w-12 ${isOpen(r) ? "" : "opacity-50 grayscale"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{r.title}</span>
                  <span className="block text-xs text-stone-500">
                    {requestServiceLabel(r)} · {r.city} · {isOpen(r) ? `open, ${r.notifiedCount} seller${r.notifiedCount === 1 ? "" : "s"} notified` : r.status === "CLOSED" ? "closed" : "expired"}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${r._count.quotes ? "bg-brand text-white" : "bg-stone-100 text-stone-600"}`}>
                  {r._count.quotes} quote{r._count.quotes === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
