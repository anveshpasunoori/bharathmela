import Link from "next/link";
import { redirect } from "next/navigation";
import { unsubscribeCityEmails } from "@/app/actions/city-emails";
import { db } from "@/lib/db";

export const metadata = { title: "Stop monthly emails", robots: { index: false } };

// From the "Stop these emails" link in the monthly city email. It takes a button press, not just the
// visit, so mail scanners that open links don't unsubscribe people by accident.
export default async function CityEmailUnsubscribePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string }> }) {
  const { token } = await params;
  const { done } = await searchParams;
  const user = await db.user.findUnique({ where: { cityEmailToken: token }, select: { cityEmails: true } });
  if (!user) {
    return (
      <div className="card mx-auto max-w-md space-y-2 text-center">
        <h1 className="text-xl font-bold">Link not found</h1>
        <p className="text-stone-600">You can manage your emails on your account page.</p>
        <Link href="/account" className="btn mt-2">Go to your account</Link>
      </div>
    );
  }
  return (
    <div className="card mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-bold">{user.cityEmails ? "Stop the monthly city email?" : "Monthly emails are off"}</h1>
      {user.cityEmails ? (
        <form
          action={async () => {
            "use server";
            await unsubscribeCityEmails(token);
            redirect(`/city-emails/unsubscribe/${token}?done=1`);
          }}
        >
          <button className="btn">Stop these emails</button>
        </form>
      ) : (
        <p className="text-sm text-stone-600">{done ? "Done. " : ""}You won&apos;t get the monthly email. You can turn it back on from your account page.</p>
      )}
      <Link href="/account" className="block text-sm font-semibold text-brand">Your account</Link>
    </div>
  );
}
