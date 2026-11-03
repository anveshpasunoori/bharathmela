"use client";

import { useState } from "react";

// "Selling as": a business, or just yourself (a garage sale, a room to rent, a one-off). People selling
// for themselves skip the business name and appear under their own name.
export function SellerKindFields({ initialKind, showName }: { initialKind: "business" | "individual"; showName: boolean }) {
  const [kind, setKind] = useState(initialKind);
  const option = (value: "business" | "individual", title: string, hint: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-lg p-3 ring-1 ${kind === value ? "bg-brand-soft ring-brand" : "bg-white ring-stone-200"}`}>
      <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="mt-1 accent-[#c2410c]" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-stone-500">{hint}</span>
      </span>
    </label>
  );
  return (
    <>
      <fieldset className="space-y-2">
        <legend className="label">Selling as</legend>
        {option("business", "A business", "Home kitchen, tutor, pujari, event vendor, contractor, shop…")}
        {option("individual", "Just me", "A garage sale, a room to rent, or selling a few things")}
      </fieldset>
      {showName && (
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input className="input" id="name" name="name" required autoComplete="name" />
        </div>
      )}
      {kind === "business" && (
        <div>
          <label className="label" htmlFor="businessName">Business name</label>
          <input className="input" id="businessName" name="businessName" required placeholder="e.g. Lakshmi's Andhra Kitchen" />
        </div>
      )}
    </>
  );
}
