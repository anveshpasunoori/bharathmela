import Link from "next/link";
import { redirect } from "next/navigation";
import { unsubscribeSearch } from "@/app/actions/saved-search";
import { db } from "@/lib/db";

export const metadata = { title: "Stop search alerts", robots: { index: false } };

// From the "Stop these emails" link in an alert. Turning alerts off takes a button press, not just the
// visit, so mail scanners that open links don't unsubscribe people by accident.
export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string }> }) {
  const { token } = await params;
  const { done } = await searchParams;
  const search = await db.savedSearch.findUnique({ where: { unsubscribeToken: token }, select: { name: true, alerts: true } });
  if (!search) {
    return (
      <div className="card mx-auto max-w-md space-y-2 text-center">
        <h1 className="text-xl font-bold">Link not found</h1>
        <p className="text-stone-600">This saved search may have been deleted. You can manage alerts on your Saved page.</p>
        <Link href="/saved?tab=searches" className="btn mt-2">Go to saved searches</Link>
      </div>
    );
  }
  const off = search.alerts === "OFF";
  return (
    <div className="card mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-bold">{off ? "Alerts are off" : "Stop emails for this search?"}</h1>
      <p className="text-stone-600">&ldquo;{search.name}&rdquo;</p>
      {off ? (
        <p className="text-sm text-stone-600">
          {done ? "Done. " : ""}You won&apos;t get emails for this search. The search stays saved, and you can turn alerts back on anytime.
        </p>
      ) : (
        <form
          action={async () => {
            "use server";
            await unsubscribeSearch(token);
            redirect(`/alerts/unsubscribe/${token}?done=1`);
          }}
        >
          <button className="btn">Stop these emails</button>
        </form>
      )}
      <Link href="/saved?tab=searches" className="block text-sm font-semibold text-brand">Manage all saved searches</Link>
    </div>
  );
}
