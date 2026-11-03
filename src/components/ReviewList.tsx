import { Stars } from "./Stars";

type Review = {
  id: string;
  rating: number;
  comment: string;
  updatedAt: Date;
  vendorReply: string;
  buyer: { name: string };
};

export function ReviewList({ reviews, sellerName }: { reviews: Review[]; sellerName: string }) {
  if (reviews.length === 0) return <p className="text-sm text-stone-500">No ratings yet.</p>;
  return (
    <ul className="divide-y divide-stone-100">
      {reviews.map((r) => (
        <li key={r.id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {r.buyer.name} <span className="text-xs text-green-700">✓ verified email</span>
            </span>
            <span className="flex items-center gap-2">
              <Stars rating={r.rating} />
              <span className="text-xs text-stone-500">{r.updatedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </span>
          </div>
          {r.comment && <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{r.comment}</p>}
          {r.vendorReply && (
            <div className="mt-2 rounded-md border-l-2 border-brand bg-brand-soft px-3 py-2 text-sm">
              <p className="text-xs font-semibold text-stone-600">Reply from {sellerName}</p>
              <p className="whitespace-pre-line text-stone-700">{r.vendorReply}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
