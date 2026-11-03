import Link from "next/link";
import { LEASES, SPACE_TYPES } from "@/lib/rentals";
import { METROS } from "@/lib/metros";

export type WantedValues = {
  metro: string;
  title: string;
  description: string;
  budget: string;
  moveInDate: string;
  lease: string;
  spaceTypes: string[];
  areas: string;
  needsPrivateBath: boolean;
  needsFurnished: boolean;
  needsParking: boolean;
  hasPets: boolean;
};

export function WantedFields({ initial, lockMetro }: { initial: WantedValues; lockMetro?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-semibold">Before you post</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Describe yourself and what you need. Owners will contact you by message; your email isn&apos;t shown.</li>
          <li>Don&apos;t include your phone number or address here. Share them once you&apos;ve talked to someone.</li>
          <li>Never pay a deposit before seeing a place in person or on a live video call.</li>
        </ul>
      </div>
      {lockMetro ? (
        <input type="hidden" name="metro" value={initial.metro} />
      ) : (
        <div>
          <label className="label" htmlFor="metro">City</label>
          <select className="input" id="metro" name="metro" required defaultValue={initial.metro}>
            {METROS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}, {m.state}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="title">Headline</label>
        <input className="input" id="title" name="title" required minLength={5} maxLength={100} defaultValue={initial.title}
          placeholder="e.g. Working professional looking for a room near Sunnyvale from Dec 1" />
      </div>
      <div>
        <label className="label" htmlFor="description">About you and what you need</label>
        <textarea className="input min-h-32" id="description" name="description" required minLength={30} maxLength={2000} defaultValue={initial.description}
          placeholder="Work or study, schedule, cooking habits, how long you plan to stay, anything an owner should know…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="budget">Max budget / month (USD)</label>
          <input className="input" id="budget" name="budget" inputMode="numeric" required defaultValue={initial.budget} placeholder="1200" />
        </div>
        <div>
          <label className="label" htmlFor="moveInDate">Move-in date</label>
          <input className="input" id="moveInDate" name="moveInDate" type="date" required min={today} defaultValue={initial.moveInDate || today} />
        </div>
        <div>
          <label className="label" htmlFor="lease">How long</label>
          <select className="input" id="lease" name="lease" defaultValue={initial.lease}>
            {LEASES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">I&apos;d take</legend>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {SPACE_TYPES.map((t) => (
            <label key={t.id} className="flex items-center gap-2">
              <input type="checkbox" name="spaceTypes" value={t.id} defaultChecked={initial.spaceTypes.includes(t.id)} /> {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="areas">Preferred areas (optional)</label>
        <input className="input" id="areas" name="areas" maxLength={150} defaultValue={initial.areas} placeholder="e.g. Sunnyvale, Santa Clara, near Caltrain" />
      </div>
      <fieldset>
        <legend className="label">Must-haves</legend>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <label className="flex items-center gap-2"><input type="checkbox" name="needsPrivateBath" defaultChecked={initial.needsPrivateBath} /> Private bath</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="needsFurnished" defaultChecked={initial.needsFurnished} /> Furnished</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="needsParking" defaultChecked={initial.needsParking} /> Parking</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="hasPets" defaultChecked={initial.hasPets} /> I have a pet</label>
        </div>
      </fieldset>
      <label className="flex gap-2 text-sm text-stone-700">
        <input type="checkbox" name="confirm" required className="mt-0.5" />
        <span>
          This post is accurate, I&apos;m 18 or older, and it follows the <Link href="/terms" target="_blank" className="text-brand underline">Terms of Service</Link>.
        </span>
      </label>
    </>
  );
}
