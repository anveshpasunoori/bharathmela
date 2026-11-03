"use client";

import { useState } from "react";
import { EMPTY_EVENT_SERVICE, EVENT_SERVICES, type EventServiceDetails, OCCASIONS, RENTAL_ITEMS } from "@/lib/event-services";
import { LANGUAGES } from "@/lib/professionals";

function Chips({
  name,
  options,
  selected,
  onChange,
}: {
  name: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <label key={o.id} className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${on ? "bg-brand-soft text-brand ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}>
            <input type="checkbox" name={name} value={o.id} checked={on} className="sr-only"
              onChange={() => onChange(on ? selected.filter((x) => x !== o.id) : [...selected, o.id])} />
            {on ? "✓ " : ""}
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

// Event-vendor part of the listing form. Field names start with e_ (see parseEventServiceForm).
export function EventServiceFields({ initial }: { initial?: EventServiceDetails | null }) {
  const d = initial ?? EMPTY_EVENT_SERVICE;
  const [services, setServices] = useState(d.services);
  const [occasions, setOccasions] = useState(d.occasions);
  const [languages, setLanguages] = useState(d.languages);
  const [rentalItems, setRentalItems] = useState(d.rentalItems);
  const rentals = services.includes("RENTALS");
  const bartending = services.includes("BARTENDING");
  const visual = services.includes("PHOTOGRAPHY") || services.includes("VIDEOGRAPHY");

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="font-semibold">Your event services</p>
      <fieldset>
        <legend className="label">Services you offer</legend>
        <Chips name="e_services" options={EVENT_SERVICES} selected={services} onChange={setServices} />
      </fieldset>
      {rentals && (
        <div className="space-y-3 rounded-md bg-white p-3 ring-1 ring-stone-200">
          <fieldset>
            <legend className="label">What you rent out</legend>
            <Chips name="e_rentalItems" options={RENTAL_ITEMS} selected={rentalItems} onChange={setRentalItems} />
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="e_delivery" defaultChecked={d.delivery} /> I deliver, set up and pick up
          </label>
          {rentalItems.includes("BOUNCE") && (
            <label className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <input type="checkbox" name="e_inflatableConfirm" required className="mt-0.5" />
              <span>
                My inflatables are insured, inspected as my state requires, and set up and anchored by trained staff following the
                manufacturer&apos;s wind and supervision rules.
              </span>
            </label>
          )}
          <p className="text-xs text-stone-500">Put your damage deposit, late-return and cleaning fees in the rental agreement.</p>
        </div>
      )}
      <fieldset>
        <legend className="label">Occasions you work</legend>
        <Chips name="e_occasions" options={OCCASIONS} selected={occasions} onChange={setOccasions} />
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="e_areasServed">Areas you travel to</label>
          <input className="input" id="e_areasServed" name="e_areasServed" maxLength={150} defaultValue={d.areasServed}
            placeholder="e.g. All of Bay Area, Sacramento, Reno" />
        </div>
        <div>
          <label className="label" htmlFor="e_years">Years of experience</label>
          <input className="input" id="e_years" name="e_years" type="number" min={0} max={60} defaultValue={d.yearsExperience ?? ""} />
        </div>
      </div>
      <fieldset>
        <legend className="label">Languages (for MCs, planners and anyone talking to guests)</legend>
        <Chips name="e_languages" options={LANGUAGES.map((l) => ({ id: l, label: l }))} selected={languages} onChange={setLanguages} />
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="e_insured" defaultChecked={d.insured} /> I carry general liability insurance and can give venues a certificate
      </label>
      {bartending && (
        <label className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <input type="checkbox" name="e_alcoholConfirm" required className="mt-0.5" />
          <span>
            I serve only alcohol the host provides, only to guests 21+, and follow my state&apos;s server-certification rules. If I supply or sell
            alcohol, I hold the required liquor or caterer&apos;s license.
          </span>
        </label>
      )}
      {visual && (
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="e_portfolioConfirm" required className="mt-0.5" />
          <span>The photos and videos I share are my own work, and I have permission from the people in them.</span>
        </label>
      )}
    </div>
  );
}
