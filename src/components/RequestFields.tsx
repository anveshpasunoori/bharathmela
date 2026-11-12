"use client";

import { useState } from "react";
import { COLLAB_PAY, NICHES, PLATFORMS } from "@/lib/creators";
import { LANGUAGES } from "@/lib/professionals";
import { SERVICE_TYPES } from "@/lib/service-types";

// Extra questions when a business asks creators for a collab: how they'll pay and who they want.
function CollabFields() {
  const [pay, setPay] = useState("EITHER");
  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <fieldset>
        <legend className="label">How will you pay the creator?</legend>
        <div className="flex flex-wrap gap-2">
          {COLLAB_PAY.map((p) => (
            <label key={p.id} className={`cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${pay === p.id ? "bg-brand-soft text-brand ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}>
              <input type="radio" name="k_pay" value={p.id} checked={pay === p.id} onChange={() => setPay(p.id)} className="sr-only" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      {pay !== "CASH" && (
        <div>
          <label className="label" htmlFor="k_barter">What you offer instead of cash</label>
          <input id="k_barter" name="k_barter" required minLength={5} maxLength={150} className="input" placeholder="e.g. Dinner for 4, or a free month of dance classes" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="k_language">Content language</label>
          <select id="k_language" name="k_language" className="input" defaultValue="">
            <option value="">Any language</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="k_platform">Platform</label>
          <select id="k_platform" name="k_platform" className="input" defaultValue="">
            <option value="">Any platform</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="k_anywhere" defaultChecked className="mt-0.5" />
        <span>Creators from anywhere in the US are welcome (their audience may be online, not only local)</span>
      </label>
      <p className="text-xs text-stone-500">Creators must mark paid or gifted posts as ads (#ad). Barter deals count too.</p>
    </div>
  );
}

// The "post what you need" form fields; the service list follows the chosen category.
export function RequestFields({
  categories,
  initialCategory,
  initialTitle = "",
  initialZip,
  areaLabel,
}: {
  categories: readonly { id: string; label: string }[];
  initialCategory: string;
  initialTitle?: string;
  initialZip: string;
  areaLabel?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const creators = category === "CREATORS";
  const types = creators ? NICHES : (SERVICE_TYPES[category] ?? []);
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
            <label className="label" htmlFor="serviceType">{creators ? "Kind of creator" : "Service"}</label>
            <select id="serviceType" name="serviceType" className="input" defaultValue="">
              <option value="">Any / not sure</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {creators && <CollabFields />}
      <div>
        <label className="label" htmlFor="title">In one line</label>
        <input id="title" name="title" required minLength={8} maxLength={100} className="input" defaultValue={initialTitle}
          placeholder={creators ? "e.g. Food reel for our new biryani pop-up" : "e.g. Pujari for griha pravesh on Dec 12, or AC not cooling"} />
      </div>
      <div>
        <label className="label" htmlFor="description">Details</label>
        <textarea id="description" name="description" required minLength={20} maxLength={1500} className="input min-h-32"
          placeholder={creators
            ? "Your business, what you'd like (reels, stories, a YouTube video, an event visit), dates, and anything the creator should try or mention."
            : "What you need, size of the job, languages, anything a seller should know to give you a price."} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="neededBy">Needed by <span className="font-normal text-stone-500">(optional)</span></label>
          <input id="neededBy" name="neededBy" type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="budget">Budget in $ <span className="font-normal text-stone-500">(optional)</span></label>
          <input id="budget" name="budget" inputMode="decimal" className="input" placeholder="e.g. 300" />
        </div>
        <div>
          <label className="label" htmlFor="zip">ZIP code</label>
          <input id="zip" name="zip" required inputMode="numeric" maxLength={5} pattern="\d{5}" className="input" defaultValue={initialZip} aria-describedby={areaLabel ? "request-area" : undefined} />
          {areaLabel && <p id="request-area" className="mt-1 text-xs text-muted">Enter the ZIP code where you need service in the {areaLabel} area.</p>}
        </div>
      </div>
      <p className="text-xs text-stone-500">
        Sellers see your first name, city and request, never your email or phone. Quotes arrive by email, and you reply only to the ones you like.
      </p>
    </>
  );
}
