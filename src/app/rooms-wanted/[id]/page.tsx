import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { REPORT_REASONS } from "@/lib/legal";
import { metroName } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { LEASES, formatAvailable } from "@/lib/rentals";
import { firstName, publicWantedWhere, wantedNeeds, wantedSpaceLabels } from "@/lib/rooms-wanted";
import { contactRenter, reportWanted } from "../../actions/room-wanted";

async function getPost(id: string) {
  return db.roomWanted.findFirst({ where: { id, ...publicWantedWhere() }, include: { user: { select: { id: true, name: true, createdAt: true } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const post = await getPost((await params).id);
  return { title: post ? `${post.title} | BharathMela` : "Post not found | BharathMela" };
}

export default async function WantedPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> }) {
  const { id } = await params;
  const { posted } = await searchParams;
  const post = await getPost(id);
  if (!post) notFound();
  const user = await getCurrentUser();
  const own = user?.id === post.userId;
  if (!own) await db.roomWanted.update({ where: { id }, data: { views: { increment: 1 } } });
  const here = `/rooms-wanted/${post.id}`;
  const facts = [
    { label: "Budget", value: `Up to ${formatUSD(post.budgetMaxCents)} / month` },
    { label: "Move in", value: formatAvailable(post.moveInDate).replace("Available", "") || "Now" },
    { label: "Stay", value: LEASES.find((l) => l.id === post.lease)?.label ?? "Flexible" },
    { label: "Would take", value: wantedSpaceLabels(post.spaceTypes).join(", ") },
    ...(post.areas ? [{ label: "Areas", value: post.areas }] : []),
    { label: "City", value: metroName(post.metro) },
  ];
  const needs = wantedNeeds(post);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/rooms-wanted?metro=${post.metro}`} className="text-sm text-stone-500 hover:text-brand">← People looking in {metroName(post.metro)}</Link>
      {posted && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Your request is live. Owners can message you; replies arrive by email. Manage it from <Link href="/rooms-wanted/mine" className="underline">My requests</Link>.
        </p>
      )}
      <article className="card space-y-4">
        <span className="badge bg-sky-100 text-sky-800">Looking for a place</span>
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-stone-500">{f.label}</dt>
              <dd className="font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
        {needs.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {needs.map((n) => (
              <li key={n} className="badge bg-stone-100 text-stone-700">{n}</li>
            ))}
          </ul>
        )}
        <p className="whitespace-pre-line text-stone-700">{post.description}</p>
        <p className="text-xs text-stone-500">
          Posted by {firstName(post.user.name)} · member since {post.user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })} ·
          email verified
        </p>
      </article>

      {!own && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Have a place for {firstName(post.user.name)}?</h2>
          {!user ? (
            <p className="text-sm text-stone-600">
              <Link href={`/login?next=${here}`} className="font-semibold text-brand">Log in</Link> or{" "}
              <Link href={`/signup?next=${here}`} className="font-semibold text-brand">create a free account</Link> to send a message.
            </p>
          ) : !user.emailVerifiedAt ? (
            <p className="text-sm text-stone-600">
              <Link href={`/verify?next=${here}`} className="font-semibold text-brand">Verify your email</Link> to send a message.
            </p>
          ) : (
            <ActionForm action={contactRenter} submitLabel="Send message" className="space-y-3">
              <input type="hidden" name="id" value={post.id} />
              <textarea className="input min-h-28" name="message" required minLength={20} maxLength={2000} aria-label="Message"
                placeholder="Describe your place: type, rent, area, when it's available, and how to reach you." />
              <p className="text-xs text-stone-500">
                We email your message to {firstName(post.user.name)} with your email as the reply address. Don&apos;t ask for deposits before they&apos;ve
                seen the place.
              </p>
            </ActionForm>
          )}
        </section>
      )}

      <details className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <summary className="cursor-pointer font-semibold text-red-700">Report this post</summary>
        <ActionForm action={reportWanted} submitLabel="Send report" secondary className="mt-3 space-y-3">
          <input type="hidden" name="id" value={post.id} />
          <select className="input" name="reason" required defaultValue="" aria-label="Reason">
            <option value="" disabled>Choose a reason…</option>
            {REPORT_REASONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <textarea className="input min-h-20" name="details" maxLength={2000} placeholder="Details (optional)" aria-label="Details" />
        </ActionForm>
      </details>
    </div>
  );
}
