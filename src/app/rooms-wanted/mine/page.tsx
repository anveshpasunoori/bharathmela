import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { metroName } from "@/lib/metros";
import { formatUSD } from "@/lib/plans";
import { MAX_ACTIVE_WANTED } from "@/lib/rooms-wanted";
import { deleteWanted, renewWanted, setWantedVisibility } from "../../actions/room-wanted";

export const metadata = { title: "My room requests – BharathMela" };

const STATUS: Record<string, [string, string]> = {
  ACTIVE: ["Live", "bg-green-100 text-green-800"],
  HIDDEN: ["Hidden", "bg-stone-200 text-stone-700"],
  PENDING_REVIEW: ["In review", "bg-amber-100 text-amber-800"],
  REJECTED: ["Not approved", "bg-red-100 text-red-800"],
  REMOVED: ["Removed", "bg-red-100 text-red-800"],
};

export default async function MyWantedPage({ searchParams }: { searchParams: Promise<{ review?: string; saved?: string; error?: string }> }) {
  const user = await requireUser("/rooms-wanted/mine");
  const params = await searchParams;
  const now = new Date();
  const posts = await db.roomWanted.findMany({
    where: { userId: user.id },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My room requests</h1>
          <p className="text-sm text-stone-600">Up to {MAX_ACTIVE_WANTED} active at a time. Replies from owners arrive by email.</p>
        </div>
        <Link href="/rooms-wanted/new" className="btn">+ New request</Link>
      </div>
      {params.review && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">Your post is being reviewed, usually within 1 business day.</p>
      )}
      {params.saved && <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Saved.</p>}
      {params.error === "limit" && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">You already have {MAX_ACTIVE_WANTED} active posts. Hide or delete one first.</p>
      )}
      {posts.length === 0 && <p className="card text-stone-600">You haven&apos;t posted a request yet.</p>}
      {posts.map((p) => {
        const expired = p.expiresAt <= now;
        const [label, style] = expired ? ["Expired", "bg-stone-200 text-stone-700"] : (STATUS[p.status] ?? [p.status, ""]);
        return (
          <div key={p.id} className="card space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{p.title}</span>
              <span className={`badge ${style}`}>{label}</span>
            </div>
            <p className="text-sm text-stone-500">
              {metroName(p.metro)} · up to {formatUSD(p.budgetMaxCents)}/mo · {p.views} views · {p._count.messages} messages ·{" "}
              {expired ? "expired" : "expires"} {p.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            {(p.status === "REJECTED" || p.status === "REMOVED") && p.moderationNote && (
              <p className="text-sm text-red-700">Reason: {p.moderationNote}</p>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              {p.status === "ACTIVE" && !expired && <Link href={`/rooms-wanted/${p.id}`} className="btn-outline py-1.5">View</Link>}
              {p.status !== "REMOVED" && <Link href={`/rooms-wanted/${p.id}/edit`} className="btn-outline py-1.5">Edit</Link>}
              {(p.status === "ACTIVE" || p.status === "HIDDEN") && (
                <form action={renewWanted.bind(null, p.id)}>
                  <button className="btn-outline py-1.5">{expired ? "Repost" : "Renew 60 days"}</button>
                </form>
              )}
              {(p.status === "ACTIVE" || p.status === "HIDDEN") && !expired && (
                <form action={setWantedVisibility.bind(null, p.id, p.status !== "ACTIVE")}>
                  <button className="btn-outline py-1.5">{p.status === "ACTIVE" ? "Hide (found a place)" : "Show"}</button>
                </form>
              )}
              <ConfirmButton action={deleteWanted.bind(null, p.id)} message={`Delete "${p.title}"?`}>Delete</ConfirmButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
