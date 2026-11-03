import { type ProfessionalDetails, licenseLine, licenseLookupUrl, specialtyLabels } from "@/lib/professionals";

export function ProfessionalDetailsView({ category, details }: { category: string; details: ProfessionalDetails }) {
  const specialties = specialtyLabels(category, details);
  return (
    <div className="space-y-3 rounded-md bg-stone-50 p-4 text-sm ring-1 ring-stone-200">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">{category === "LEGAL" ? "Law firm" : "Brokerage"}</dt>
          <dd className="font-medium">{details.firm}</dd>
        </div>
        <div>
          <dt className="text-stone-500">License</dt>
          <dd className="font-medium">
            {licenseLine(category, details)}{" "}
            <a href={licenseLookupUrl(category, details)} target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-brand underline">
              look it up
            </a>
          </dd>
        </div>
        {details.yearsExperience != null && (
          <div>
            <dt className="text-stone-500">Experience</dt>
            <dd className="font-medium">{details.yearsExperience} years</dd>
          </div>
        )}
        <div>
          <dt className="text-stone-500">Languages</dt>
          <dd className="font-medium">{details.languages.join(", ")}</dd>
        </div>
      </dl>
      <div>
        <p className="mb-1 text-stone-500">{category === "LEGAL" ? "Practice areas" : "Services"}</p>
        <ul className="flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <li key={s} className="badge bg-white text-stone-700 ring-1 ring-stone-200">{s}</li>
          ))}
          {details.freeConsultation && <li className="badge bg-green-50 text-green-800 ring-1 ring-green-200">Free first consultation</li>}
        </ul>
      </div>
      {category === "LEGAL" && (
        <p className="text-xs text-stone-500">
          Attorney advertising. Prior results don&apos;t guarantee a similar outcome. Contacting this lawyer doesn&apos;t create an attorney-client
          relationship; don&apos;t send confidential information until you&apos;ve agreed to work together.
        </p>
      )}
    </div>
  );
}
