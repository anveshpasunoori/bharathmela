import { OUR_POINTS } from "@/lib/compare";

// What BharathMela offers, as a grid of short cards.
export function OurPoints() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {OUR_POINTS.map((p) => (
        <li key={p.title} className="card space-y-1">
          <p className="font-semibold">{p.title}</p>
          <p className="text-sm text-stone-600">{p.text}</p>
        </li>
      ))}
    </ul>
  );
}

// Questions as an expandable list, like the city pages.
export function FaqList({ faq, title }: { faq: { q: string; a: string }[]; title: string }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="divide-y divide-stone-200 rounded-xl bg-white ring-1 ring-stone-200">
        {faq.map((f) => (
          <details key={f.q} className="group px-4 py-3">
            <summary className="cursor-pointer list-none font-medium text-stone-800 marker:hidden">
              <span className="flex items-center justify-between gap-3">
                {f.q}
                <span aria-hidden className="text-stone-400 transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm text-stone-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
