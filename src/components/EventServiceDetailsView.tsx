import { type EventServiceDetails, occasionLabels, rentalItemLabels, serviceLabels } from "@/lib/event-services";

function ChipRow({ title, items, tone = "bg-white text-stone-700 ring-1 ring-stone-200" }: { title: string; items: string[]; tone?: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-stone-500">{title}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i} className={`badge ${tone}`}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function EventServiceDetailsView({ details }: { details: EventServiceDetails }) {
  return (
    <div className="space-y-3 rounded-md bg-stone-50 p-4 text-sm ring-1 ring-stone-200">
      <ChipRow title="Services" items={serviceLabels(details)} tone="bg-brand-soft text-brand ring-1 ring-orange-200" />
      <ChipRow title="Rents out" items={rentalItemLabels(details)} />
      <ChipRow title="Occasions" items={occasionLabels(details)} />
      <dl className="grid gap-3 sm:grid-cols-3">
        {details.areasServed && (
          <div>
            <dt className="text-stone-500">Travels to</dt>
            <dd className="font-medium">{details.areasServed}</dd>
          </div>
        )}
        {details.yearsExperience != null && (
          <div>
            <dt className="text-stone-500">Experience</dt>
            <dd className="font-medium">{details.yearsExperience} years</dd>
          </div>
        )}
        {details.languages.length > 0 && (
          <div>
            <dt className="text-stone-500">Languages</dt>
            <dd className="font-medium">{details.languages.join(", ")}</dd>
          </div>
        )}
      </dl>
      <ul className="flex flex-wrap gap-1.5">
        {details.insured && <li className="badge bg-green-50 text-green-800 ring-1 ring-green-200">Liability insurance (self-reported)</li>}
        {details.delivery && <li className="badge bg-green-50 text-green-800 ring-1 ring-green-200">Delivery, setup & pickup</li>}
      </ul>
    </div>
  );
}
