"use client";

import { useState } from "react";
import {
  AMENITIES,
  BATHROOMS,
  EMPTY_RENTAL,
  FURNISHING,
  HOUSE_RULES,
  LAUNDRY,
  LEASES,
  PARKING,
  ROOMMATE_GENDERS,
  type RentalDetails,
  SHARED_SPACES,
  SPACE_TYPES,
  UTILITIES,
  WHOLE_UNITS,
} from "@/lib/rentals";

type Option = { id: string; label: string };

function Select({ name, label, options, value }: { name: string; label: string; options: Option[]; value: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select className="input" id={name} name={name} defaultValue={value}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Chips({ name, label, options, selected }: { name: string; label: string; options: Option[]; selected: string[] }) {
  const [on, setOn] = useState(selected);
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = on.includes(o.id);
          return (
            <label key={o.id} className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${checked ? "bg-brand-soft text-brand ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}>
              <input type="checkbox" name={name} value={o.id} checked={checked} className="sr-only"
                onChange={() => setOn(checked ? on.filter((x) => x !== o.id) : [...on, o.id])} />
              {checked ? "✓ " : ""}
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// The room-rental part of the listing form. Field names start with r_ and are read by parseRentalForm.
export function RentalFields({ initial }: { initial?: RentalDetails | null }) {
  const d = initial ?? EMPTY_RENTAL;
  const [spaceType, setSpaceType] = useState(d.spaceType);
  const [ownerOccupied, setOwnerOccupied] = useState(d.ownerOccupied);
  const shared = SHARED_SPACES.includes(spaceType);
  const whole = WHOLE_UNITS.includes(spaceType);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="font-semibold">Rental details</p>
      <fieldset>
        <legend className="label">Type of space</legend>
        <div className="flex flex-wrap gap-2">
          {SPACE_TYPES.map((t) => (
            <label key={t.id} className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${spaceType === t.id ? "bg-brand text-snow ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}>
              <input type="radio" name="r_spaceType" value={t.id} checked={spaceType === t.id} onChange={() => setSpaceType(t.id)} className="sr-only" required />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="r_availableFrom">Available from</label>
          <input className="input" type="date" id="r_availableFrom" name="r_availableFrom" required min={today} defaultValue={d.availableFrom || today} />
        </div>
        <Select name="r_lease" label="Lease" options={LEASES} value={d.lease} />
        <div>
          <label className="label" htmlFor="r_deposit">Deposit (USD)</label>
          <input className="input" id="r_deposit" name="r_deposit" inputMode="decimal" placeholder="e.g. 1000"
            defaultValue={d.depositCents != null ? String(d.depositCents / 100) : ""} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select name="r_utilities" label="Utilities" options={UTILITIES} value={d.utilities} />
        <Select name="r_furnished" label="Furnishing" options={FURNISHING} value={d.furnished} />
        {whole ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="r_bedrooms">Beds</label>
              <input className="input" id="r_bedrooms" name="r_bedrooms" type="number" min={0} max={10} defaultValue={d.bedrooms ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="r_bathrooms">Baths</label>
              <input className="input" id="r_bathrooms" name="r_bathrooms" type="number" min={0} max={10} defaultValue={d.bathrooms ?? ""} />
            </div>
          </div>
        ) : (
          <Select name="r_bathroom" label="Bathroom" options={BATHROOMS} value={d.bathroom} />
        )}
        <Select name="r_parking" label="Parking" options={PARKING} value={d.parking} />
        <Select name="r_laundry" label="Laundry" options={LAUNDRY} value={d.laundry} />
        <div>
          <label className="label" htmlFor="r_neighborhood">Neighborhood / cross streets</label>
          <input className="input" id="r_neighborhood" name="r_neighborhood" maxLength={100} defaultValue={d.neighborhood}
            placeholder="e.g. Lawrence & Tasman" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-stone-500">Don&apos;t post the exact address. Share it with people after you&apos;ve talked to them.</p>

      <Chips name="r_amenities" label="Amenities" options={AMENITIES} selected={d.amenities} />
      <Chips name="r_houseRules" label="House rules (must apply to everyone)" options={HOUSE_RULES} selected={d.houseRules} />

      {shared && (
        <div className="space-y-2 rounded-md bg-white p-3 ring-1 ring-stone-200">
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="r_ownerOccupied" checked={ownerOccupied} onChange={(e) => setOwnerOccupied(e.target.checked)} className="mt-0.5" />
            <span>I live in this home and the tenant will share living space (kitchen, living room or bathroom) with me.</span>
          </label>
          {ownerOccupied && (
            <>
              <Select name="r_roommateGender" label="Roommate preference" options={ROOMMATE_GENDERS} value={d.roommateGender} />
              <p className="text-xs text-stone-500">
                Fair housing rules generally allow a gender preference only when you share your own living space. Preferences about religion,
                community, language, family status or diet aren&apos;t allowed.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
