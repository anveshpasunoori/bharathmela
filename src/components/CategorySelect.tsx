"use client";

import { CATEGORIES } from "@/lib/constants";
import { CATEGORY_RULES } from "@/lib/legal";

// Category picker that shows the posting rules for the chosen category.
export function CategorySelect({ value, onChange }: { value: string; onChange: (category: string) => void }) {
  const rules = CATEGORY_RULES[value]?.seller;
  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="category">Category</label>
        <select className="input" id="category" name="category" required value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>Choose…</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      {rules && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Rules for this category</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
