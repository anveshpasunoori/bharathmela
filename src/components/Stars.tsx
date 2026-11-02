export function Stars({ rating, count }: { rating: number; count?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <span className="text-amber-500">{"★".repeat(rounded)}<span className="text-stone-300">{"★".repeat(5 - rounded)}</span></span>
      <span className="text-stone-600">
        {rating.toFixed(1)}
        {count != null && ` (${count})`}
      </span>
    </span>
  );
}
