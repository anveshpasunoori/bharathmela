import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listingPath } from "@/lib/seo";
import { timeAgo } from "@/lib/time";

export const metadata = { title: "Messages", robots: { index: false } };

type Item = {
  id: string;
  at: Date;
  direction: "received" | "sent";
  kind: "Message" | "Quote";
  who: string;
  about?: { title: string; href: string };
  body: string;
  price?: string;
};

const money = (cents: number, unit: string) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;

// Everything sent through BharathMela in one place: messages about listings and room requests, and quotes
// on service requests, both directions. Replies happen by email (each message was sent with the other
// person as reply-to), so this is a record, not a chat.
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const user = await requireUser("/messages");
  const { show } = await searchParams;
  const vendorId = user.vendor?.id;
  const [messages, quotesIn, quotesOut] = await Promise.all([
    db.message.findMany({
      where: { OR: [{ toUserId: user.id }, { fromUserId: user.id }] },
      include: {
        fromUser: { select: { name: true, vendor: { select: { businessName: true } } } },
        toUser: { select: { name: true, vendor: { select: { businessName: true } } } },
        listing: { select: { id: true, title: true } },
        roomWanted: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
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

  const displayName = (u: { name: string; vendor: { businessName: string } | null }) => u.vendor?.businessName ?? u.name.split(" ")[0];
  const items: Item[] = [
    ...messages.map((m): Item => {
      const received = m.toUserId === user.id;
      return {
        id: m.id,
        at: m.createdAt,
        direction: received ? "received" : "sent",
        kind: "Message",
        who: displayName(received ? m.fromUser : m.toUser),
        about: m.listing
          ? { title: m.listing.title, href: listingPath(m.listing) }
          : m.roomWanted
            ? { title: m.roomWanted.title, href: `/rooms-wanted/${m.roomWanted.id}` }
            : undefined,
        body: m.body,
      };
    }),
    ...quotesIn.map((q): Item => ({
      id: q.id,
      at: q.createdAt,
      direction: "received",
      kind: "Quote",
      who: q.vendor.businessName,
      about: { title: q.request.title, href: `/requests/${q.request.id}` },
      body: q.message,
      price: q.priceCents != null ? money(q.priceCents, q.priceUnit) : undefined,
    })),
    ...quotesOut.map((q): Item => ({
      id: q.id,
      at: q.createdAt,
      direction: "sent",
      kind: "Quote",
      who: q.request.user.name.split(" ")[0],
      about: { title: q.request.title, href: `/requests/${q.request.id}` },
      body: q.message,
      price: q.priceCents != null ? money(q.priceCents, q.priceUnit) : undefined,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const filter = show === "received" || show === "sent" ? show : "all";
  const shown = filter === "all" ? items : items.filter((i) => i.direction === filter);
  const tab = (id: string, label: string, n: number) => (
    <Link
      href={id === "all" ? "/messages" : `/messages?show=${id}`}
      aria-current={filter === id ? "page" : undefined}
      className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold ${filter === id ? "border-brand text-brand" : "border-transparent text-stone-500 hover:text-stone-800"}`}
    >
      {label} <span className="font-normal text-stone-500">{n}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-stone-600">
          Messages and quotes sent through BharathMela. To answer one, reply to the email we sent you; it goes straight to the other
          person.
        </p>
      </div>
      <nav className="flex gap-6 border-b border-stone-200" aria-label="Messages">
        {tab("all", "All", items.length)}
        {tab("received", "Received", items.filter((i) => i.direction === "received").length)}
        {tab("sent", "Sent", items.filter((i) => i.direction === "sent").length)}
      </nav>
      {shown.length === 0 ? (
        <div className="card space-y-2 text-center text-stone-600">
          <p className="font-semibold text-stone-800">No messages yet</p>
          <p className="text-sm">Message a seller from any listing, or post what you need to get quotes.</p>
          <Link href="/requests/new" className="btn mt-2">Post what you need</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((i) => (
            <li key={`${i.kind}-${i.id}`} className="card space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${i.direction === "received" ? "bg-brand-soft text-brand" : "bg-stone-100 text-stone-600"}`}>
                    {i.kind} {i.direction === "received" ? "from" : "to"}
                  </span>
                  <span className="font-semibold">{i.who}</span>
                </p>
                <span className="text-xs text-stone-500">{timeAgo(i.at)}</span>
              </div>
              {i.about && (
                <p className="text-sm text-stone-600">
                  About <Link href={i.about.href} className="font-medium text-brand hover:underline">{i.about.title}</Link>
                </p>
              )}
              {i.price && <p className="text-sm font-semibold">{i.price}</p>}
              <p className="line-clamp-4 whitespace-pre-line text-sm text-stone-700">{i.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
