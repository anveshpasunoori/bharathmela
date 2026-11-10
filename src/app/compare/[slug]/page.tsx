import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { FaqList, OurPoints } from "@/components/OurPoints";
import { COMPARISONS, comparePath, comparisonFromSlug } from "@/lib/compare";
import { METROS } from "@/lib/metros";
import { cityPath } from "@/lib/seo";
import { breadcrumbs, faqSchema } from "@/lib/structured-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = comparisonFromSlug((await params).slug);
  if (!c) return {};
  return { title: c.title.includes("BharathMela") ? { absolute: c.title } : c.title, description: c.description, alternates: { canonical: comparePath(c) }, openGraph: { title: c.title, description: c.description, url: comparePath(c) } };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = comparisonFromSlug((await params).slug);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
          <Link href="/" className="hover:text-brand">Home</Link> › <Link href="/compare" className="hover:text-brand">Compare</Link>
        </nav>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{c.title}</h1>
        <p className="mt-2 text-stone-700">{c.intro}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className="btn">Browse BharathMela</Link>
          <Link href="/vendor/signup" className="btn-outline">List your business free</Link>
        </div>
      </div>

      {c.rows && (
        <div className="overflow-x-auto rounded-xl ring-1 ring-stone-200">
          <table className="w-full bg-white text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-2 font-medium"></th>
                <th className="px-4 py-2 font-medium">{c.name}</th>
                <th className="px-4 py-2 font-semibold text-brand">BharathMela</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {c.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-4 py-2 font-medium text-stone-700">{r.label}</th>
                  <td className="px-4 py-2 text-stone-600">{r.them}</td>
                  <td className="px-4 py-2 font-medium">{r.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What you get on BharathMela</h2>
        <OurPoints />
      </section>

      <FaqList faq={c.faq} title="Common questions" />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-stone-700">Start in your city</h2>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Cities">
          {METROS.map((m) => (
            <Link key={m.id} href={cityPath(m.id)} className="text-brand hover:underline">{m.name}</Link>
          ))}
        </nav>
      </section>

      <p className="text-xs text-stone-500">
        {c.name} and other names mentioned here are trademarks of their owners. BharathMela isn&apos;t affiliated with or endorsed by them.
        See also: {COMPARISONS.filter((x) => x.slug !== c.slug).map((x, i) => (
          <span key={x.slug}>{i > 0 && ", "}<Link href={comparePath(x)} className="underline hover:text-brand">{x.name}</Link></span>
        ))}.
      </p>
      <JsonLd data={[breadcrumbs([{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }, { name: c.title, path: comparePath(c) }]), faqSchema(c.faq)]} />
    </div>
  );
}
