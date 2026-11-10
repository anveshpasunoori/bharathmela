"use client";

import { useState } from "react";
import { type CreatorDetails, EMPTY_CREATOR, NICHES, PLATFORMS, RATE_KINDS, formatFollowers } from "@/lib/creators";
import { LANGUAGES } from "@/lib/professionals";

function Chips({ name, options, selected, onChange }: { name: string; options: readonly { id: string; label: string }[]; selected: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <label key={o.id} className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${on ? "bg-brand-soft text-brand ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}>
            <input type="checkbox" name={name} value={o.id} checked={on} className="sr-only" onChange={() => onChange(on ? selected.filter((x) => x !== o.id) : [...selected, o.id])} />
            {on ? "✓ " : ""}
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

// Creator part of the listing form. Field names start with c_ (see parseCreatorForm).
export function CreatorFields({ initial }: { initial?: CreatorDetails | null }) {
  const d = initial ?? EMPTY_CREATOR;
  const [niches, setNiches] = useState(d.niches);
  const [languages, setLanguages] = useState(d.languages);
  const handle = (id: string) => d.platforms.find((p) => p.platform === id);

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <div>
        <p className="font-semibold">Your creator profile</p>
        <p className="text-sm text-stone-600">Businesses use this to find you. Fill in the platforms you&apos;re on; leave the others empty.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="label">Platforms, handles and followers</legend>
        {PLATFORMS.map((p) => {
          const current = handle(p.id);
          return (
            <div key={p.id} className="grid grid-cols-[6.5rem_1fr_6.5rem] items-center gap-2">
              <label htmlFor={`c_handle_${p.id}`} className="text-sm font-medium text-stone-700">{p.label}</label>
              <input className="input" id={`c_handle_${p.id}`} name={`c_handle_${p.id}`} maxLength={120} placeholder="@yourhandle" defaultValue={current ? `@${current.handle}` : ""} autoCapitalize="none" spellCheck={false} />
              <input className="input" name={`c_followers_${p.id}`} aria-label={`${p.label} followers`} maxLength={12} placeholder="12.5K" inputMode="decimal" defaultValue={current ? formatFollowers(current.followers) : ""} />
            </div>
          );
        })}
        <p className="text-xs text-stone-500">Followers like 12500, 12.5K or 1.2M. They&apos;re shown as reported by you, so keep them current.</p>
      </fieldset>

      <fieldset>
        <legend className="label">What your content is about</legend>
        <Chips name="c_niches" options={NICHES} selected={niches} onChange={setNiches} />
      </fieldset>

      <fieldset>
        <legend className="label">Languages your content is in</legend>
        <Chips name="c_languages" options={LANGUAGES.map((l) => ({ id: l, label: l }))} selected={languages} onChange={setLanguages} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">Who you can promote</legend>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="c_nationwide" defaultChecked={d.nationwide} className="mt-0.5" />
          <span>
            <b>Nationwide too:</b> my audience is all over the US, so I can promote businesses in any city or online. (Without this, you show
            only in your own city.)
          </span>
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="c_barter" defaultChecked={d.barter} className="mt-0.5" />
          <span>
            <b>Open to barter:</b> I&apos;ll take free food, products or services instead of cash for some posts.
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend className="label">Your rates in USD <span className="font-normal text-stone-500">(optional; leave empty to discuss)</span></legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RATE_KINDS.map((r) => (
            <label key={r.id} className="text-sm">
              <span className="text-stone-600">{r.label}</span>
              <input className="input mt-0.5" name={`c_rate_${r.id}`} inputMode="decimal" maxLength={8} placeholder="$" defaultValue={d.rates[r.id] ?? ""} />
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="c_samples">Links to your best posts <span className="font-normal text-stone-500">(up to 6, one per line)</span></label>
        <textarea className="input min-h-20 font-mono text-xs" id="c_samples" name="c_samples" defaultValue={d.samples.join("\n")}
          placeholder={"https://www.instagram.com/reel/…\nhttps://youtu.be/…"} />
        <p className="mt-1 text-xs text-stone-500">Instagram, YouTube, TikTok, Facebook or X links only. Collabs you did for other businesses work best.</p>
      </div>

      <label className="flex gap-2 rounded-md bg-white p-3 text-sm ring-1 ring-stone-200">
        <input type="checkbox" name="c_rules" required defaultChecked={!!initial} className="mt-0.5" />
        <span>
          I&apos;m 18 or older, these accounts are mine, my follower counts are real (no bought followers), and I&apos;ll mark every paid or
          gifted post as an ad (#ad, #sponsored or the paid-partnership label), as the FTC requires.
        </span>
      </label>
    </div>
  );
}
