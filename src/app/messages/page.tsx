import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/time";

export const metadata = { title: "Messages", robots: { index: false } };

const money = (cents: number, unit: string) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;

// Conversations with buyers, sellers and room owners, newest first with unread ones marked; and quotes on
// service requests, both ways.
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const user = await requireUser("/messages");
  const { show } = await searchParams;
  const tab = show === "quotes" ? "quotes" : "conversations";
  const vendorId = user.vendor?.id;
  const [conversations, quotesIn, quotesOut] = await Promise.all([
    db.conversation.findMany({
      where: { OR: [{ startedById: user.id }, { otherId: user.id }] },
      include: {
        startedBy: { select: { name: true, vendor: { select: { businessName: true } } } },
        other: { select: { name: true, vendor: { select: { businessName: true } } } },
        listing: { select: { title: true } },
        roomWanted: { select: { title: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, fromUserId: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 200,
    }),
    db.quote.findMany({
      where: { request: { userId: user.id } },
      include: { vendor: { select: { businessName: true } }, request: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    vendorId
      ? db.quote.findMany({
          where: { vendorId },
          include: { request: { select: { id: true, title: true, user: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : Promise.resolve([]),
  ]);

  const rows = conversations.map((c) => {
    const iStarted = c.startedById === user.id;
    const them = iStarted ? c.other : c.startedBy;
    const read = iStarted ? c.startedByReadAt : c.otherReadAt;
    return {
      id: c.id,
      who: them.vendor?.businessName ?? them.name,
      about: c.listing?.title ?? c.roomWanted?.title,
      last: c.messages[0],
      at: c.lastMessageAt,
      unread: c.lastSenderId !== user.id && (!read || read < c.lastMessageAt),
    };
  });
  const quotes = [
    ...quotesIn.map((q) => ({ id: q.id, at: q.createdAt, received: true, who: q.vendor.businessName, request: q.request, body: q.message, price: q.priceCents != null ? money(q.priceCents, q.priceUnit) : null })),
    ...quotesOut.map((q) => ({ id: q.id, at: q.createdAt, received: false, who: q.request.user.name.split(" ")[0], request: q.request, body: q.message, price: q.priceCents != null ? money(q.priceCents, q.priceUnit) : null })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const unread = rows.filter((r) => r.unread).length;
  const tabLink = (id: string, label: string, n: number) => (
    <Link
      href={id === "conversations" ? "/messages" : `/messages?show=${id}`}
      aria-current={tab === id ? "page" : undefined}
      className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold ${tab === id ? "border-brand text-brand" : "border-transparent text-stone-500 hover:text-stone-800"}`}
    >
      {label} <span className="font-normal text-stone-500">{n}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <AutoRefresh seconds={20} />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-stone-600">
          {unread ? `${unread} unread conversation${unread === 1 ? "" : "s"}. ` : ""}Your conversations stay on BharathMela; email addresses aren&apos;t shared.
        </p>
      </div>
      <nav className="flex gap-6 border-b border-stone-200" aria-label="Messages">
        {tabLink("conversations", "Conversations", rows.length)}
        {tabLink("quotes", "Quotes", quotes.length)}
      </nav>

      {tab === "conversations" ? (
        rows.length === 0 ? (
          <div className="card space-y-2 text-center text-stone-600">
            <p className="font-semibold text-stone-800">No conversations yet</p>
            <p className="text-sm">Message a seller from any listing, or post what you need to get quotes.</p>
            <Link href="/requests/new" className="btn mt-2">Post what you need</Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/messages/${r.id}`} className="flex gap-3 px-4 py-3 hover:bg-stone-50">
                  <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${r.unread ? "bg-brand" : "bg-transparent"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate ${r.unread ? "font-bold text-stone-900" : "font-semibold text-stone-800"}`}>{r.who}</span>
                      <span className="shrink-0 text-xs text-stone-500">{timeAgo(r.at)}</span>
                    </span>
                    {r.about && <span className="block truncate text-xs text-stone-500">{r.about}</span>}
                    {r.last && (
                      <span className={`block truncate text-sm ${r.unread ? "text-stone-800" : "text-stone-600"}`}>
                        {r.last.fromUserId === user.id ? "You: " : ""}
                        {r.last.body}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : quotes.length === 0 ? (
        <div className="card space-y-2 text-center text-stone-600">
          <p className="font-semibold text-stone-800">No quotes yet</p>
          <p className="text-sm">Post what you need, and sellers near you send their quotes here.</p>
          <Link href="/requests/new" className="btn mt-2">Post what you need</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {quotes.map((q) => (
            <li key={q.id} className="card space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${q.received ? "bg-brand-soft text-brand" : "bg-stone-100 text-stone-600"}`}>Quote {q.received ? "from" : "to"}</span>
                  <span className="font-semibold">{q.who}</span>
                </p>
                <span className="text-xs text-stone-500">{timeAgo(q.at)}</span>
              </div>
              <p className="text-sm text-stone-600">
                About <Link href={`/requests/${q.request.id}`} className="font-medium text-brand hover:underline">{q.request.title}</Link>
              </p>
              {q.price && <p className="text-sm font-semibold">{q.price}</p>}
              <p className="line-clamp-4 whitespace-pre-line text-sm text-stone-700">{q.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
