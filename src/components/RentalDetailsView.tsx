import { type RentalDetails, amenityLabels, houseRuleLabels, rentalFacts } from "@/lib/rentals";

export function RentalScamWarning() {
  return (
    <div className="rounded-md border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900" role="note">
      <b>Avoid rental scams.</b> See the place in person (or on a live video call) before paying anything. Never wire money, pay with gift
      cards, or deal with a landlord who is &ldquo;out of the country&rdquo; and will mail you the keys.
    </div>
  );
}

export function RentalDetailsView({ details, zip }: { details: RentalDetails; zip: string }) {
  const amenities = amenityLabels(details);
  const rules = houseRuleLabels(details);
  const area = details.neighborhood ? `${details.neighborhood}, ${zip}` : zip;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area)}`;
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        {rentalFacts(details).map((f) => (
          <div key={f.label}>
            <dt className="text-stone-500">{f.label}</dt>
            <dd className="font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
      {amenities.length > 0 && (
        <div>
          <p className="mb-1 text-sm text-stone-500">Amenities</p>
          <ul className="flex flex-wrap gap-1.5">
            {amenities.map((a) => (
              <li key={a} className="badge bg-stone-100 text-stone-700">{a}</li>
            ))}
          </ul>
        </div>
      )}
      {rules.length > 0 && (
        <div>
          <p className="mb-1 text-sm text-stone-500">House rules</p>
          <ul className="flex flex-wrap gap-1.5">
            {rules.map((r) => (
              <li key={r} className="badge bg-amber-50 text-amber-900 ring-1 ring-amber-200">{r}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-sm">
        <span className="text-stone-500">Area: </span>
        {area} ·{" "}
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">View area on map ↗</a>
        <span className="block text-xs text-stone-500">Exact address is shared by the owner after you get in touch.</span>
      </p>
    </div>
  );
}
