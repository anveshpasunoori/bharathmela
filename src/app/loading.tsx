// Shown while a page loads: grey placeholders in the shape of a results page.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-2/3 rounded-lg bg-stone-200" />
      <div className="h-11 rounded-lg bg-stone-200" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-stone-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
            <div className="aspect-[4/3] bg-stone-100" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-4/5 rounded bg-stone-200" />
              <div className="h-4 w-1/3 rounded bg-stone-200" />
              <div className="h-3 w-1/2 rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
