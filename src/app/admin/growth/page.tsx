import { db } from "@/lib/db";
import { FOUNDING_SELLERS_PER_CITY } from "@/lib/growth";
import { publicListing } from "@/lib/listings";
import { metroName } from "@/lib/metros";

export const metadata = { title: "Growth", robots: { index: false } };

const DAY_MS = 86_400_000;

// How the marketplace is growing: sign-ups and where they come from (the utm tags on shared links,
// QR posters and referral links), supply per city, referrals, the monthly email and review requests.
function growthStats() {
  const now = Date.now();
  const since = (days: number) => new Date(now - days * DAY_MS);
  const people = { deletedAt: null, role: { not: "ADMIN" } };
  return Promise.all([
    db.user.groupBy({ by: ["role"], where: { ...people, createdAt: { gt: since(7) } }, _count: true }),
    db.user.groupBy({ by: ["role"], where: { ...people, createdAt: { gt: since(30) } }, _count: true }),
    db.user.groupBy({ by: ["role"], where: { ...people, createdAt: { gt: since(90) } }, _count: true }),
    db.user.groupBy({ by: ["signupSource", "signupCampaign", "role"], where: { ...people, createdAt: { gt: since(90) } }, _count: true }),
    db.listing.groupBy({ by: ["metro"], where: publicListing(), _count: true }),
    db.vendorProfile.groupBy({ by: ["metro"], where: { foundingSeller: true }, _count: true }),
    db.vendorProfile.count({ where: { referredById: { not: null } } }),
    db.subscription.count({ where: { source: "REFERRAL" } }),
    db.vendorProfile.findMany({
      where: { referrals: { some: {} } },
      select: { businessName: true, metro: true, _count: { select: { referrals: true } } },
      orderBy: { referrals: { _count: "desc" } },
      take: 10,
    }),
    db.user.count({ where: { cityEmails: true, deletedAt: null } }),
    db.reviewRequest.count({ where: { sentAt: { gt: since(30) } } }),
    db.review.count({ where: { createdAt: { gt: since(30) } } }),
  ]);
}

export default async function GrowthPage() {
  const [week, month, quarter, bySource, liveByCity, foundersByCity, referred, rewarded, topReferrers, subscribers, requests, reviews] =
    await growthStats();

  const split = (rows: { role: string; _count: number }[]) => ({
    sellers: rows.filter((r) => r.role === "VENDOR").reduce((n, r) => n + r._count, 0),
    buyers: rows.filter((r) => r.role === "BUYER").reduce((n, r) => n + r._count, 0),
  });
  const periods = [
    { label: "Last 7 days", ...split(week) },
    { label: "Last 30 days", ...split(month) },
    { label: "Last 90 days", ...split(quarter) },
  ];
  // One row per source and campaign, with sellers and buyers side by side.
  const sources = new Map<string, { source: string; campaign: string; sellers: number; buyers: number }>();
  for (const r of bySource) {
    const key = `${r.signupSource}|${r.signupCampaign}`;
    const row = sources.get(key) ?? { source: r.signupSource || "direct / unknown", campaign: r.signupCampaign, sellers: 0, buyers: 0 };
    if (r.role === "VENDOR") row.sellers += r._count;
    else row.buyers += r._count;
    sources.set(key, row);
  }
  const sourceRows = [...sources.values()].sort((a, b) => b.sellers + b.buyers - (a.sellers + a.buyers));
  const founders = new Map(foundersByCity.map((f) => [f.metro, f._count]));
  const cities = [...liveByCity].sort((a, b) => b._count - a._count);
  const th = "px-3 py-2 text-left font-semibold";
  const td = "px-3 py-2";

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold">New accounts</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {periods.map((p) => (
            <div key={p.label} className="card py-4">
              <p className="text-sm text-stone-500">{p.label}</p>
              <p className="mt-1 text-2xl font-bold">{p.sellers + p.buyers}</p>
              <p className="text-sm text-stone-600">{p.sellers} sellers · {p.buyers} buyers</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-semibold">Where sign-ups came from (last 90 days)</h2>
        <p className="mb-2 text-sm text-stone-500">
          From tagged links: share buttons (whatsapp, facebook, link), QR posters (qr), seller referral links (referral), and any link you tag
          yourself, e.g. <code>?utm_source=telugu-assoc&amp;utm_campaign=jax-launch</code>.
        </p>
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr><th className={th}>Source</th><th className={th}>Campaign</th><th className={th}>Sellers</th><th className={th}>Buyers</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sourceRows.length ? (
                sourceRows.map((r) => (
                  <tr key={`${r.source}|${r.campaign}`}>
                    <td className={td}>{r.source}</td><td className={`${td} text-stone-500`}>{r.campaign || "–"}</td><td className={td}>{r.sellers}</td><td className={td}>{r.buyers}</td>
                  </tr>
                ))
              ) : (
                <tr><td className={td} colSpan={4}>No sign-ups yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Live listings and founding sellers by city</h2>
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr><th className={th}>City</th><th className={th}>Live listings</th><th className={th}>Founding spots used</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cities.map((c) => (
                <tr key={c.metro}>
                  <td className={td}>{metroName(c.metro)}</td><td className={td}>{c._count}</td>
                  <td className={td}>{founders.get(c.metro) ?? 0} of {FOUNDING_SELLERS_PER_CITY}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card py-4">
          <p className="text-sm text-stone-500">Referrals</p>
          <p className="mt-1 text-2xl font-bold">{referred}</p>
          <p className="text-sm text-stone-600">sellers joined by referral · {rewarded} free months given</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-stone-500">Monthly city email</p>
          <p className="mt-1 text-2xl font-bold">{subscribers}</p>
          <p className="text-sm text-stone-600">subscribers</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-stone-500">Last 30 days</p>
          <p className="mt-1 text-2xl font-bold">{reviews}</p>
          <p className="text-sm text-stone-600">reviews written · {requests} review requests sent</p>
        </div>
      </section>

      {topReferrers.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Top referrers</h2>
          <ul className="divide-y divide-stone-100 rounded-xl bg-white text-sm ring-1 ring-stone-200">
            {topReferrers.map((v) => (
              <li key={v.businessName} className="flex justify-between px-3 py-2">
                <span>{v.businessName} <span className="text-stone-500">· {metroName(v.metro)}</span></span>
                <span>{v._count.referrals}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-stone-500">Page views, top pages and referring sites are in Vercel → your project → Analytics.</p>
    </div>
  );
}
