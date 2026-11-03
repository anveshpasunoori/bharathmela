"use client";

import { useState } from "react";
import { EMPTY_PROFESSIONAL, LANGUAGES, LICENSE_LABELS, type ProfessionalDetails, SPECIALTIES, US_STATES } from "@/lib/professionals";

function ChipGroup({ name, label, options, initial }: { name: string; label: string; options: { id: string; label: string }[]; initial: string[] }) {
  const [on, setOn] = useState(initial);
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

// License and specialty fields for realtors and lawyers. Field names start with p_ (see parseProfessionalForm).
export function ProfessionalFields({ category, initial }: { category: "REALTOR" | "LEGAL"; initial?: ProfessionalDetails | null }) {
  const d = initial ?? EMPTY_PROFESSIONAL;
  const labels = LICENSE_LABELS[category];
  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="font-semibold">{category === "LEGAL" ? "Bar license & practice" : "License & services"}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="p_licenseNumber">{labels.license}</label>
          <input className="input" id="p_licenseNumber" name="p_licenseNumber" required maxLength={20} defaultValue={d.licenseNumber}
            placeholder={category === "LEGAL" ? "e.g. 289412" : "e.g. 02012345"} />
        </div>
        <div>
          <label className="label" htmlFor="p_licenseState">Licensed in</label>
          <select className="input" id="p_licenseState" name="p_licenseState" required defaultValue={d.licenseState}>
            <option value="" disabled>State…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="p_years">Years of experience</label>
          <input className="input" id="p_years" name="p_years" type="number" min={0} max={60} defaultValue={d.yearsExperience ?? ""} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="p_firm">{labels.firm}</label>
        <input className="input" id="p_firm" name="p_firm" required maxLength={120} defaultValue={d.firm} placeholder={labels.firmHint} />
      </div>
      <ChipGroup name="p_specialties" label={category === "LEGAL" ? "Practice areas" : "Services"} options={SPECIALTIES[category]} initial={d.specialties} />
      <ChipGroup name="p_languages" label="Languages you work in" options={LANGUAGES.map((l) => ({ id: l, label: l }))} initial={d.languages} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="p_freeConsultation" defaultChecked={d.freeConsultation} /> I offer a free first consultation
      </label>
      <label className="flex gap-2 text-sm text-stone-700">
        <input type="checkbox" name="p_licenseConfirm" required className="mt-0.5" />
        <span>
          My license is active and in good standing, and this listing follows my state&apos;s {category === "LEGAL" ? "bar advertising rules" : "real estate advertising and fair housing rules"}.
          DesiBazaar will check the license number before the listing goes live.
        </span>
      </label>
    </div>
  );
}
