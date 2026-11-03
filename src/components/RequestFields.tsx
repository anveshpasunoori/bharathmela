"use client";

import { useState } from "react";
import { SERVICE_TYPES } from "@/lib/service-types";

// The "post what you need" form fields; the service list follows the chosen category.
export function RequestFields({
  categories,
  initialCategory,
  initialZip,
}: {
  categories: readonly { id: string; label: string }[];
  initialCategory: string;
  initialZip: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const types = SERVICE_TYPES[category] ?? [];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">What do you need help with?</label>
          <select id="category" name="category" required className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        {types.length > 0 && (
          <div>
            <label className="label" htmlFor="serviceType">Service</label>
            <select id="serviceType" name="serviceType" className="input" defaultValue="">
              <option value="">Any / not sure</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="label" htmlFor="title">In one line</label>
        <input id="title" name="title" required minLength={8} maxLength={100} className="input"
          placeholder="e.g. Pujari for griha pravesh on Dec 12, or AC not cooling" />
      </div>
      <div>
        <label className="label" htmlFor="description">Details</label>
        <textarea id="description" name="description" required minLength={20} maxLength={1500} className="input min-h-32"
          placeholder="What you need, size of the job, languages, anything a seller should know to give you a price." />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="neededBy">Needed by <span className="font-normal text-stone-400">(optional)</span></label>
          <input id="neededBy" name="neededBy" type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="budget">Budget in $ <span className="font-normal text-stone-400">(optional)</span></label>
          <input id="budget" name="budget" inputMode="decimal" className="input" placeholder="e.g. 300" />
        </div>
        <div>
          <label className="label" htmlFor="zip">ZIP code</label>
          <input id="zip" name="zip" required inputMode="numeric" maxLength={5} pattern="\d{5}" className="input" defaultValue={initialZip} />
        </div>
      </div>
      <p className="text-xs text-stone-500">
        Sellers see your first name, city and request, never your email or phone. Quotes arrive by email, and you reply only to the ones you like.
      </p>
    </>
  );
}
