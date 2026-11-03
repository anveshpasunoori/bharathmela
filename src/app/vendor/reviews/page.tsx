import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { Stars } from "@/components/Stars";
import { requireVendor } from "@/lib/auth";
import { db } from "@/lib/db";
import { PUBLIC_REVIEW } from "@/lib/reviews";
import { replyToReview } from "../../actions/review";

export default async function VendorReviewsPage() {
  const { vendor } = await requireVendor();
  const reviews = await db.review.findMany({
    where: { vendorId: vendor.id, ...PUBLIC_REVIEW },
    include: { buyer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/vendor" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
      <div>
        <h1 className="text-2xl font-bold">Your ratings</h1>
        <p className="text-stone-600">
          Reply publicly to thank customers or address a concern, and keep it polite. You can&apos;t remove ratings; if one is fake or
          abusive, contact support and we&apos;ll review it.
        </p>
      </div>
      {reviews.length === 0 && <p className="card text-stone-600">No ratings yet. Ask happy customers to rate you on BharathMela.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{r.buyer.name}</span>
            <Stars rating={r.rating} />
          </div>
          {r.comment && <p className="whitespace-pre-line text-sm text-stone-700">{r.comment}</p>}
          <ActionForm action={replyToReview} submitLabel={r.vendorReply ? "Update reply" : "Post reply"} secondary className="space-y-2">
            <input type="hidden" name="reviewId" value={r.id} />
            <textarea className="input min-h-16 text-sm" name="reply" maxLength={1000} defaultValue={r.vendorReply}
              placeholder="Your public reply (optional)" aria-label="Reply" />
          </ActionForm>
        </div>
      ))}
    </div>
  );
}
