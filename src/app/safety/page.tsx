import Link from "next/link";

export const metadata = { title: "Safety tips" };

const SECTIONS = [
  {
    title: "Before you pay",
    tips: [
      "Pay after you receive the food, item or service, or pay a small part up front and the rest on completion.",
      "Never pay by wire transfer, gift cards or crypto. Legitimate sellers don't ask for these.",
      "Use Zelle or Venmo only with people you've met or verified; these payments usually can't be reversed.",
      "Get the price, quantity and timing in writing (a text message is fine).",
    ],
  },
  {
    title: "Renting a room",
    tips: [
      "See the room in person (or on a live video call) before paying any deposit.",
      "Ask to see proof the person can rent it out: a lease that allows subletting, or ownership.",
      "Be wary of owners who are \"out of the country\" and will mail keys after you pay. That's a classic scam.",
      "Sign a written agreement that states rent, deposit and move-out terms.",
    ],
  },
  {
    title: "Hiring help, tutors or teachers",
    tips: [
      "Ask for references and call them.",
      "Run a background check before anyone works alone with children or elders, or in your home.",
      "Meet first in a public place or with someone else present.",
      "Know your obligations: hiring a household worker can make you an employer under tax and labor law.",
    ],
  },
  {
    title: "Home food",
    tips: [
      "Ask about ingredients and allergens before ordering.",
      "Ask whether the seller has the cottage food registration or permit your state requires.",
      "Check that hot food is hot and cold food is cold when you pick it up.",
    ],
  },
  {
    title: "Meeting in person",
    tips: [
      "Meet in a public place for pickups when you can, and tell someone where you're going.",
      "Trust your instincts. If something feels off, walk away.",
    ],
  },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stay safe on BharathMela</h1>
        <p className="mt-1 text-stone-600">
          BharathMela connects you with independent sellers in your community. We screen listings for prohibited items and discriminatory
          wording, verify email addresses, and act on reports, but apart from checking that businesses marked &ldquo;Verified business&rdquo; are real, we don&apos;t vet sellers or take part in deals. These habits protect you.
        </p>
      </div>
      {SECTIONS.map((s) => (
        <section key={s.title} className="card">
          <h2 className="mb-2 font-semibold">{s.title}</h2>
          <ul className="list-disc space-y-1 pl-5 text-stone-700">
            {s.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="card border-red-200 bg-red-50">
        <h2 className="font-semibold text-red-900">Something went wrong?</h2>
        <p className="mt-1 text-sm text-red-900">
          Use &ldquo;Report this listing&rdquo; on the listing page and we&apos;ll review it. If you&apos;ve been defrauded, report it to local
          police and to the FTC at reportfraud.ftc.gov. In an emergency, call 911.
        </p>
      </section>
      <p className="text-sm text-stone-500">
        See also our <Link href="/terms" className="underline">Terms of Service</Link>.
      </p>
    </div>
  );
}
