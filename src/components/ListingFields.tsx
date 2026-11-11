"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { listingDescriptionPrompt } from "@/lib/listing-coach";
import { writeAdWithAI } from "@/app/actions/vendor";
import { nationwideOption } from "@/lib/nationwide";
import { categoryLabel, DIET_TAGS, normalizeTags } from "@/lib/constants";
import { SERVICE_TYPES, hasServiceTypes, typeWording } from "@/lib/service-types";
import type { CreatorDetails } from "@/lib/creators";
import type { EventServiceDetails } from "@/lib/event-services";
import type { GarageSaleDetails } from "@/lib/garage-sales";
import type { ProfessionalDetails } from "@/lib/professionals";
import type { RentalDetails } from "@/lib/rentals";
import { CategorySelect } from "./CategorySelect";
import { CreatorFields } from "./CreatorFields";
import { EventServiceFields } from "./EventServiceFields";
import { ProfessionalFields } from "./ProfessionalFields";
import { RentalFields } from "./RentalFields";

// Listing inputs plus the AI ad writer, which fills them in from the seller's rough idea.
// `types` are the services offered, for categories with service types (Home Services, Auto, Beauty…).
export type ListingValues = { category: string; title: string; description: string; price: string; priceUnit: string; tags: string[]; types?: string[]; nationwide?: boolean };

export function ListingFields({
  canUseAI,
  initial,
  initialRental,
  initialProfessional,
  initialEventService,
  initialGarageSale,
  initialCreator,
}: {
  canUseAI: boolean;
  initial?: ListingValues;
  initialRental?: RentalDetails | null;
  initialProfessional?: ProfessionalDetails | null;
  initialEventService?: EventServiceDetails | null;
  initialGarageSale?: GarageSaleDetails | null;
  initialCreator?: CreatorDetails | null;
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
  const nationwide = nationwideOption(category);
  const freshFood = category === "FOOD" && (types.includes("FRESH_PRODUCE") || types.includes("MILK_DAIRY"));
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
      {nationwide && (
        <label className="flex gap-2 rounded-xl border border-line bg-white p-3 text-sm" key={category}>
          <input type="checkbox" name="nationwide" className="mt-0.5" defaultChecked={initial?.category === category && initial?.nationwide} />
          <span>{nationwide}<span className="mt-1 block text-xs text-muted">Buyers can find this listing outside your local area.</span></span>
        </label>
      )}

      <details className="rounded-xl border border-line bg-white p-4">
        <summary className="cursor-pointer font-semibold text-forest">Help me write my listing</summary>
        <div className="mt-3">
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
              {aiError && <p role="alert" className="mt-2 text-sm text-red-700">{aiError}</p>}
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
      </details>

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input className="input" id="title" name="title" required minLength={5} maxLength={100}
          value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Gujarati thali tiffin" />
        <p className="mt-1 text-xs text-muted">Name what you offer in words customers would search for.</p>
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input min-h-40" id="description" name="description" required minLength={20} maxLength={2000}
          aria-describedby="description-tip description-count" value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder={freshFood ? "What’s available, price per unit, pickup or delivery days, and how to order…" : "What you offer, pickup/delivery area, how to order, languages spoken…"} />
        <p id="description-tip" className="mt-1 text-sm text-muted">{listingDescriptionPrompt(category)}</p>
        <p id="description-count" className="mt-1 text-xs text-muted">{description.length} / 2,000 characters</p>
      </div>
      {(title.trim() || description.trim()) && (
        <details className="rounded-xl border border-line bg-ivory p-4">
          <summary className="cursor-pointer font-semibold text-forest">Preview listing text</summary>
          <div className="mt-3 space-y-1 break-words">
            {category && <p className="text-xs font-medium text-muted">{categoryLabel(category)}</p>}
            <p className="font-semibold text-ink">{title.trim() || "Your listing title"}</p>
            {description.trim() && <p className="whitespace-pre-line text-sm text-muted">{description}</p>}
          </div>
        </details>
      )}
      {category === "FOOD" && (
        <fieldset>
          <legend className="label">Dietary markers (tick only what&apos;s true for everything in this listing)</legend>
          <div className="flex flex-wrap gap-2">
            {DIET_TAGS.map((t) => {
              const on = tags.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${on ? "bg-green-50 text-green-800 ring-green-600" : "bg-white text-stone-700 ring-stone-300"}`}
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
                  className={`relative cursor-pointer rounded-full px-3 py-1 text-sm ring-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${on ? "bg-brand-soft text-brand ring-brand" : "bg-white text-stone-700 ring-stone-300"}`}
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
            <label className="label" htmlFor="saleEnd">Last day <span className="font-normal text-stone-500">(if more than one)</span></label>
            <input id="saleEnd" name="saleEnd" type="date" className="input" defaultValue={initialGarageSale?.endDate} />
          </div>
          <div>
            <label className="label" htmlFor="saleHours">Hours</label>
            <input id="saleHours" name="saleHours" required maxLength={40} className="input" placeholder="8 AM – 1 PM" defaultValue={initialGarageSale?.hours} />
          </div>
          <div>
            <label className="label" htmlFor="saleAddress">Address or cross streets <span className="font-normal text-stone-500">(optional)</span></label>
            <input id="saleAddress" name="saleAddress" maxLength={120} className="input" placeholder="e.g. Nocatee, near Crosswater Pkwy" defaultValue={initialGarageSale?.address} />
          </div>
          <p className="text-xs text-stone-500 sm:col-span-2">
            Shown on your listing. Many people share just the neighborhood and add the address the day before. Your listing comes down after the last day.
          </p>
        </fieldset>
      )}

      {category === "EVENT_SERVICES" && <EventServiceFields initial={initialEventService} />}

      {category === "CREATORS" && <CreatorFields initial={initialCreator} />}

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
            <input className="input" id="priceUnit" name="priceUnit" maxLength={40} placeholder={freshFood ? "per lb, per basket, per gallon…" : "per plate, per hour…"}
              value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} />
          </div>
        </div>
      )}
    </>
  );
}
