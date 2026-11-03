"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { writeAdWithAI } from "@/app/actions/vendor";
import { DIET_TAGS, normalizeTags } from "@/lib/constants";
import { SERVICE_TYPES, hasServiceTypes, typeWording } from "@/lib/service-types";
import type { EventServiceDetails } from "@/lib/event-services";
import type { GarageSaleDetails } from "@/lib/garage-sales";
import type { ProfessionalDetails } from "@/lib/professionals";
import type { RentalDetails } from "@/lib/rentals";
import { CategorySelect } from "./CategorySelect";
import { EventServiceFields } from "./EventServiceFields";
import { ProfessionalFields } from "./ProfessionalFields";
import { RentalFields } from "./RentalFields";

// Listing inputs plus the AI ad writer, which fills them in from the seller's rough idea.
// `types` are the services offered, for categories with service types (Home Services, Auto, Beauty…).
export type ListingValues = { category: string; title: string; description: string; price: string; priceUnit: string; tags: string[]; types?: string[] };

export function ListingFields({
  canUseAI,
  initial,
  initialRental,
  initialProfessional,
  initialEventService,
  initialGarageSale,
}: {
  canUseAI: boolean;
  initial?: ListingValues;
  initialRental?: RentalDetails | null;
  initialProfessional?: ProfessionalDetails | null;
  initialEventService?: EventServiceDetails | null;
  initialGarageSale?: GarageSaleDetails | null;
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [priceUnit, setPriceUnit] = useState(initial?.priceUnit ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [types, setTypes] = useState<string[]>(initial?.types ?? []);
  const [idea, setIdea] = useState("");
  const [aiError, setAiError] = useState("");
  const [writing, startWriting] = useTransition();
  const rental = category === "ROOM_RENTAL";

  function writeAd() {
    setAiError("");
    startWriting(async () => {
      const { draft, error } = await writeAdWithAI(idea, category);
      if (error || !draft) return setAiError(error ?? "Something went wrong.");
      setTitle(draft.title.slice(0, 100));
      setDescription(draft.description.slice(0, 2000));
      setPrice(draft.price_usd != null ? String(draft.price_usd) : "");
      setPriceUnit(draft.price_unit.slice(0, 40));
      if (category === "FOOD") setTags(normalizeTags(draft.diet_tags));
    });
  }

  return (
    <>
      <CategorySelect value={category} onChange={setCategory} />

      <div className="rounded-md border border-brand/30 bg-brand-soft p-4">
        <p className="font-semibold">✨ AI ad writer</p>
        {canUseAI ? (
          <>
            <p className="mb-2 text-sm text-stone-600">
              Describe what you offer in your own words, in any language mix. We&apos;ll write the ad; you can edit it before publishing.
            </p>
            <textarea
              className="input min-h-20"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={2000}
              placeholder="e.g. I make Andhra style pickles at home – mango, gongura, tomato. $12 a jar, pickup in Plano or ship anywhere in Texas"
              aria-label="Your idea"
            />
            {aiError && <p className="mt-2 text-sm text-red-700">{aiError}</p>}
            <button type="button" onClick={writeAd} disabled={writing} className="btn-outline mt-2">
              {writing ? "Writing your ad…" : title ? "Rewrite my ad" : "Write my ad"}
            </button>
            <p className="mt-2 text-xs text-stone-500">AI can make mistakes. Check every detail; you are responsible for what you publish.</p>
          </>
        ) : (
          <p className="text-sm text-stone-600">
            Turn a rough idea into a polished ad in seconds.{" "}
            <Link href="/vendor/upgrade?plan=PRO" className="font-semibold text-brand underline">
              Included with Pro
            </Link>
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input className="input" id="title" name="title" required minLength={5} maxLength={100}
          value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Gujarati thali tiffin" />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input min-h-40" id="description" name="description" required minLength={20} maxLength={2000}
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What you offer, pickup/delivery area, how to order, languages spoken…" />
      </div>
      {category === "FOOD" && (
        <fieldset>
          <legend className="label">Dietary markers (tick only what&apos;s true for everything in this listing)</legend>
          <div className="flex flex-wrap gap-2">
            {DIET_TAGS.map((t) => {
              const on = tags.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${on ? "bg-green-50 text-green-800 ring-green-600" : "bg-white text-stone-700 ring-stone-300"}`}
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={t.id}
                    checked={on}
                    onChange={() => setTags(normalizeTags(on ? tags.filter((x) => x !== t.id) : [...tags, t.id]))}
                    className="sr-only"
                  />
                  {on ? "✓ " : ""}
                  {t.label}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-stone-500">Vegan also marks Vegetarian, Eggless and Dairy-free; Jain also marks Vegetarian.</p>
        </fieldset>
      )}

      {hasServiceTypes(category) && (
        <fieldset>
          <legend className="label">{typeWording(category).legend}</legend>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES[category].map((t) => {
              const on = types.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${on ? "bg-brand-soft text-brand ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}
                >
                  <input
                    type="checkbox"
                    name="types"
                    value={t.id}
                    checked={on}
                    onChange={() => setTypes(on ? types.filter((x) => x !== t.id) : [...types, t.id])}
                    className="sr-only"
                  />
                  {on ? "✓ " : ""}
                  {t.label}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-stone-500">{typeWording(category).hint}</p>
        </fieldset>
      )}

      {category === "GARAGE_SALE" && (
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="label sm:col-span-2">When and where</legend>
          <div>
            <label className="label" htmlFor="saleStart">First day</label>
            <input id="saleStart" name="saleStart" type="date" required className="input" defaultValue={initialGarageSale?.startDate} />
          </div>
          <div>
            <label className="label" htmlFor="saleEnd">Last day <span className="font-normal text-stone-400">(if more than one)</span></label>
            <input id="saleEnd" name="saleEnd" type="date" className="input" defaultValue={initialGarageSale?.endDate} />
          </div>
          <div>
            <label className="label" htmlFor="saleHours">Hours</label>
            <input id="saleHours" name="saleHours" required maxLength={40} className="input" placeholder="8 AM – 1 PM" defaultValue={initialGarageSale?.hours} />
          </div>
          <div>
            <label className="label" htmlFor="saleAddress">Address or cross streets <span className="font-normal text-stone-400">(optional)</span></label>
            <input id="saleAddress" name="saleAddress" maxLength={120} className="input" placeholder="e.g. Nocatee, near Crosswater Pkwy" defaultValue={initialGarageSale?.address} />
          </div>
          <p className="text-xs text-stone-500 sm:col-span-2">
            Shown on your listing. Many people share just the neighborhood and add the address the day before. Your listing comes down after the last day.
          </p>
        </fieldset>
      )}

      {category === "EVENT_SERVICES" && <EventServiceFields initial={initialEventService} />}

      {(category === "REALTOR" || category === "LEGAL") && (
        <ProfessionalFields key={category} category={category} initial={initialProfessional} />
      )}

      {rental ? (
        <>
          <div>
            <label className="label" htmlFor="price">Monthly rent (USD)</label>
            <input className="input" id="price" name="price" inputMode="decimal" placeholder="1200" required
              value={price} onChange={(e) => setPrice(e.target.value)} />
            <input type="hidden" name="priceUnit" value="per month" />
          </div>
          <RentalFields initial={initialRental} />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="price">Price in USD (optional)</label>
            <input className="input" id="price" name="price" inputMode="decimal" placeholder="12.50"
              value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="priceUnit">Price unit</label>
            <input className="input" id="priceUnit" name="priceUnit" maxLength={40} placeholder="per plate, per hour…"
              value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} />
          </div>
        </div>
      )}
    </>
  );
}
