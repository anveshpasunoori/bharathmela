import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LocalTime } from "@/components/LocalTime";
import { ReplyBox } from "@/components/ReplyBox";
import { requireUser } from "@/lib/auth";
import { RISKY_PAYMENT } from "@/lib/scam-words";
import { db } from "@/lib/db";
import { listingPath, sellerPath } from "@/lib/seo";
import { replyInConversation } from "../../actions/conversations";

export const metadata = { title: "Conversation", robots: { index: false } };

const SELLER_QUICK_REPLIES = ["Yes, it's available.", "What date do you need it?", "Please call me at the number on my listing.", "Thanks! Let me check and get back to you."];

// One conversation: messages as bubbles, a reply box, and safety reminders. Opening it marks it read.
export default async function ConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const { sent } = await searchParams;
  const user = await requireUser(`/messages/${id}`);
  const conversation = await db.conversation.findFirst({
    where: { id, OR: [{ startedById: user.id }, { otherId: user.id }] },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 500 },
      startedBy: { select: { id: true, name: true, vendor: { select: { id: true, businessName: true, publicPath: true } } } },
      other: { select: { id: true, name: true, vendor: { select: { id: true, businessName: true, publicPath: true } } } },
      listing: { select: { id: true, title: true, vendor: { select: { userId: true } } } },
      roomWanted: { select: { id: true, title: true } },
    },
  });
  if (!conversation) notFound();

  const iStarted = conversation.startedById === user.id;
  const them = iStarted ? conversation.other : conversation.startedBy;
  const theirName = them.vendor?.businessName ?? them.name;
  await db.conversation.update({ where: { id }, data: iStarted ? { startedByReadAt: new Date() } : { otherReadAt: new Date() } });
  const iAmSeller = conversation.listing?.vendor.userId === user.id;
  const risky = conversation.messages.some((m) => m.fromUserId !== user.id && RISKY_PAYMENT.test(m.body));
  // New-day dividers by calendar date (UTC on the server; close enough to group messages).
  const day = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <AutoRefresh />
      <div>
        <Link href="/messages" className="text-sm text-stone-500 hover:text-brand">← Messages</Link>
        <h1 className="mt-1 text-xl font-bold">
          {them.vendor ? (
            <Link href={sellerPath(them.vendor)} className="hover:text-brand">{theirName}</Link>
          ) : (
            theirName
          )}
        </h1>
        {(conversation.listing || conversation.roomWanted) && (
          <p className="text-sm text-stone-600">
            About{" "}
            {conversation.listing ? (
              <Link href={listingPath(conversation.listing)} className="font-medium text-brand hover:underline">{conversation.listing.title}</Link>
            ) : (
              <Link href={`/rooms-wanted/${conversation.roomWanted!.id}`} className="font-medium text-brand hover:underline">{conversation.roomWanted!.title}</Link>
            )}
          </p>
        )}
      </div>

      {sent && <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Message sent. We&apos;ll email you when they reply.</p>}
      {risky && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          ⚠️ This conversation mentions a payment method scammers use. Never pay with gift cards, wire transfers or crypto, and don&apos;t pay a
          deposit before you&apos;ve met or seen the place. <Link href="/safety" className="font-semibold underline">Safety tips</Link> ·{" "}
          <Link href={`/messages/${conversation.id}/report`} className="font-semibold underline">Report</Link>
        </p>
      )}

      <ol className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:p-4" aria-label="Messages">
        {conversation.messages.map((m, i) => {
          const mine = m.fromUserId === user.id;
          const newDay = i === 0 || day(conversation.messages[i - 1].createdAt) !== day(m.createdAt);
          return (
            <li key={m.id}>
              {newDay && (
                <p className="my-2 text-center text-xs text-stone-400">
                  <LocalTime iso={m.createdAt.toISOString()} format="day" />
                </p>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-sm bg-brand text-snow" : "rounded-bl-sm bg-stone-100 text-stone-800"}`}>
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[11px] ${mine ? "text-snow/80" : "text-stone-500"}`}><LocalTime iso={m.createdAt.toISOString()} format="time" /></p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <ReplyBox action={replyInConversation.bind(null, conversation.id)} quickReplies={iAmSeller ? SELLER_QUICK_REPLIES : []} />

      <p className="text-xs text-stone-500">
        Messages stay on BharathMela; your email address isn&apos;t shared. Something wrong?{" "}
        <Link href={`/messages/${conversation.id}/report`} className="font-semibold text-red-700 underline">Report this conversation</Link>.
      </p>
    </div>
  );
}
