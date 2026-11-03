import Link from "next/link";
import { formatUSD } from "@/lib/plans";
import { formatAvailable } from "@/lib/rentals";

type CardPost = {
  id: string;
  title: string;
  budgetMaxCents: number;
  moveInDate: string;
  areas: string;
  spaceLabels: string[];
  needs: string[];
  firstName: string;
};

export function WantedCard({ post }: { post: CardPost }) {
  const moveIn = formatAvailable(post.moveInDate).replace("Available", "Move in");
  return (
    <Link href={`/rooms-wanted/${post.id}`} className="card block transition hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="badge bg-sky-100 text-sky-800">Looking for a place</span>
        <span className="text-sm font-semibold">up to {formatUSD(post.budgetMaxCents)}/mo</span>
      </div>
      <h3 className="font-semibold">{post.title}</h3>
      <p className="mt-1 text-sm text-stone-700">
        {post.spaceLabels.join(" or ")} · {moveIn === "Move in now" ? "Move in now" : moveIn}
      </p>
      {post.areas && <p className="text-sm text-stone-500">Areas: {post.areas}</p>}
      {post.needs.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {post.needs.map((n) => (
            <li key={n} className="badge bg-stone-100 text-stone-700">{n}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-stone-500">Posted by {post.firstName}</p>
    </Link>
  );
}
