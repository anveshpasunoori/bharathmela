import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { CONTACT_TOPICS } from "@/lib/contact";
import { sendContactMessage } from "../actions/contact";

export const metadata = {
  title: "Contact us",
  description: "Questions about your account, plans or a listing? Send BharathMela a message.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const user = await getCurrentUser();
  const { topic } = await searchParams;
  const support = process.env.SUPPORT_EMAIL;
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contact us</h1>
        <p className="mt-1 text-stone-600">
          Questions about your account, plans or a listing? Send us a message and we&apos;ll reply by email, usually within one business
          day.{support && <> You can also write to <a href={`mailto:${support}`} className="font-semibold text-brand">{support}</a>.</>}
        </p>
      </div>
      <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Questions about a product or service? Contact the seller directly from their listing. BharathMela doesn&apos;t take part in deals.
        In danger? Call 911.
      </p>
      <div className="card">
        <ActionForm action={sendContactMessage} submitLabel="Send message">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input className="input" id="name" name="name" required maxLength={100} defaultValue={user?.name ?? ""} autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="email">Your email</label>
            <input className="input" id="email" name="email" type="email" required defaultValue={user?.email ?? ""} autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="topic">What&apos;s it about?</label>
            <select className="input" id="topic" name="topic" required defaultValue={CONTACT_TOPICS.find((t) => t === topic) ?? ""}>
              <option value="" disabled>Choose…</option>
              {CONTACT_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="message">Message</label>
            <textarea className="input min-h-32" id="message" name="message" required minLength={10} maxLength={4000} />
          </div>
        </ActionForm>
      </div>
      <p className="text-sm text-stone-600">
        Something unsafe on a listing? Use <b>Report</b> on that listing so we can act on it fast. See also our{" "}
        <Link href="/safety" className="font-semibold text-brand">Safety tips</Link>.
      </p>
    </div>
  );
}
