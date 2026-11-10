import { type CreatorDetails, RATE_KINDS, formatFollowers, nicheLabels, platformLabel, profileUrl, totalFollowers } from "@/lib/creators";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

// A creator's listing: platforms with follower counts (linking to the real profiles), niches, languages,
// reach, barter and rates.
export function CreatorDetailsView({ details }: { details: CreatorDetails }) {
  const rates = RATE_KINDS.filter((r) => details.rates[r.id] != null);
  return (
    <div className="space-y-4 rounded-md bg-stone-50 p-4 text-sm ring-1 ring-stone-200">
      <div>
        <p className="mb-1.5 text-stone-500">Audience · {formatFollowers(totalFollowers(details))} followers in total</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[...details.platforms]
            .sort((a, b) => b.followers - a.followers)
            .map((p) => (
              <li key={p.platform}>
                <a
                  href={profileUrl(p)}
                  target="_blank"
                  rel="nofollow ugc noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 ring-1 ring-stone-200 hover:ring-brand"
                >
                  <span>
                    <span className="font-semibold">{platformLabel(p.platform)}</span>{" "}
                    <span className="text-stone-500">@{p.handle}</span>
                  </span>
                  <span className="font-semibold text-brand">{formatFollowers(p.followers)}</span>
                </a>
              </li>
            ))}
        </ul>
        <p className="mt-1 text-xs text-stone-500">Follower counts are reported by the creator. Open their profiles to check before you agree on a deal.</p>
      </div>

      <div>
        <p className="mb-1 text-stone-500">Content about</p>
        <ul className="flex flex-wrap gap-1.5">
          {nicheLabels(details).map((n) => (
            <li key={n} className="badge bg-brand-soft text-brand ring-1 ring-orange-200">{n}</li>
          ))}
        </ul>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Languages</dt>
          <dd className="font-medium">{details.languages.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Promotes businesses</dt>
          <dd className="font-medium">{details.nationwide ? "In their city and nationwide (online)" : "In their own city"}</dd>
        </div>
      </dl>

      {(rates.length > 0 || details.barter) && (
        <div>
          <p className="mb-1 text-stone-500">Rates</p>
          <ul className="flex flex-wrap gap-1.5">
            {rates.map((r) => (
              <li key={r.id} className="badge bg-white text-stone-700 ring-1 ring-stone-200">
                {r.label}: <b className="ml-1">{money(details.rates[r.id])}</b>
              </li>
            ))}
            {details.barter && <li className="badge bg-green-50 text-green-800 ring-1 ring-green-200">Open to barter (food, products or services)</li>}
          </ul>
        </div>
      )}

      {details.samples.length > 0 && (
        <div>
          <p className="mb-1 text-stone-500">Recent work</p>
          <ul className="space-y-1">
            {details.samples.map((url) => (
              <li key={url} className="truncate">
                <a href={url} target="_blank" rel="nofollow ugc noopener noreferrer" className="text-brand underline">
                  {url.replace(/^https:\/\/(www\.)?/, "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
