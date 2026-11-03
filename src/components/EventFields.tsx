"use client";

import { useState } from "react";
import { EVENT_TYPES, FESTIVALS } from "@/lib/events";

export type EventValues = {
  title: string;
  description: string;
  type: string;
  festival: string;
  startsAt: string; // datetime-local value in the event's city
  endsAt: string;
  venueName: string;
  address: string;
  isFree: boolean;
  price: string;
  ticketUrl: string;
};

export function EventFields({ initial, cityLabel }: { initial?: EventValues; cityLabel: string }) {
  const [type, setType] = useState(initial?.type ?? "");
  const [isFree, setIsFree] = useState(initial?.isFree ?? true);
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">Type of event</label>
          <select className="input" id="type" name="type" required value={type} onChange={(e) => setType(e.target.value)}>
            <option value="" disabled>Choose…</option>
            {EVENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="festival">Festival (optional)</label>
          <select className="input" id="festival" name="festival" defaultValue={initial?.festival ?? ""}>
            <option value="">Not a festival event</option>
            {FESTIVALS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="title">Event name</label>
        <input className="input" id="title" name="title" required minLength={5} maxLength={120} defaultValue={initial?.title}
          placeholder={type === "FESTIVAL" ? "e.g. Diwali Mela 2026 – food, dance and fireworks show" : "e.g. Carnatic vocal concert by Sri Ramesh"} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input min-h-32" id="description" name="description" required minLength={20} maxLength={3000} defaultValue={initial?.description}
          placeholder="Performers, program, food, parking, dress code, age limits, who's organizing…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startsAt">Starts</label>
          <input className="input" id="startsAt" name="startsAt" type="datetime-local" required value={startsAt}
            onChange={(e) => {
              setStartsAt(e.target.value);
              if (!endsAt || endsAt <= e.target.value) {
                // Default to a 3-hour event.
                const d = new Date(`${e.target.value}:00Z`);
                if (!isNaN(d.getTime())) setEndsAt(new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 16));
              }
            }} />
        </div>
        <div>
          <label className="label" htmlFor="endsAt">Ends</label>
          <input className="input" id="endsAt" name="endsAt" type="datetime-local" required value={endsAt} min={startsAt}
            onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-stone-500">Times are local to {cityLabel}.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="venueName">Venue</label>
          <input className="input" id="venueName" name="venueName" required maxLength={120} defaultValue={initial?.venueName}
            placeholder="e.g. Sunnyvale Hindu Temple, or Online" />
        </div>
        <div>
          <label className="label" htmlFor="address">Address</label>
          <input className="input" id="address" name="address" required maxLength={200} defaultValue={initial?.address}
            placeholder="Street, city, ZIP" autoComplete="street-address" />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="label">Entry</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free entry
        </label>
        {!isFree && (
          <div>
            <label className="label" htmlFor="price">Lowest ticket price (USD)</label>
            <input className="input" id="price" name="price" inputMode="decimal" required defaultValue={initial?.price} placeholder="15" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="ticketUrl">Tickets or RSVP link (optional)</label>
          <input className="input" id="ticketUrl" name="ticketUrl" type="url" maxLength={300} defaultValue={initial?.ticketUrl}
            placeholder="https://www.eventbrite.com/e/…" />
          <p className="mt-1 text-xs text-stone-500">Links to sites other than well-known ticketing sites are reviewed before going live.</p>
        </div>
      </fieldset>
    </>
  );
}
