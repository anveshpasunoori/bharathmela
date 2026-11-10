import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportForm } from "@/components/ReportForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportConversation } from "../../../actions/report";

export const metadata = { title: "Report a conversation", robots: { index: false } };

// Either person in a conversation can report it. Our team can then read it to check.
export default async function ReportConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const { sent } = await searchParams;
  const user = await requireUser(`/messages/${id}/report`);
  const conversation = await db.conversation.findFirst({
    where: { id, OR: [{ startedById: user.id }, { otherId: user.id }] },
    include: { startedBy: { select: { name: true, vendor: { select: { businessName: true } } } }, other: { select: { name: true, vendor: { select: { businessName: true } } } } },
  });
  if (!conversation) notFound();
  const them = conversation.startedById === user.id ? conversation.other : conversation.startedBy;
  const name = them.vendor?.businessName ?? them.name;

  if (sent) {
    return (
      <div className="card mx-auto max-w-lg space-y-3 text-center">
        <h1 className="text-xl font-bold">Thanks for reporting</h1>
        <p className="text-stone-600">Our team will look into it. Don&apos;t send money or personal details to {name} in the meantime.</p>
        <p className="text-sm text-stone-600">
          If you lost money, also contact your bank or card company right away, local police, and{" "}
          <a href="https://reportfraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">reportfraud.ftc.gov</a>.
        </p>
        <Link href="/messages" className="btn">Back to messages</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/messages/${id}`} className="text-sm text-stone-500 hover:text-brand">← Back to the conversation</Link>
      <h1 className="mt-1 text-2xl font-bold">Report {name}</h1>
      <p className="mb-4 mt-1 text-stone-600">
        Our team will read this conversation to check what happened. {them.name.split(" ")[0]} won&apos;t see who reported them.
      </p>
      <div className="card">
        <ReportForm
          action={reportConversation}
          hidden={{ conversationId: id }}
          askEmail={false}
          reasons={["SCAM", "PAYMENT", "FAKE_BUSINESS", "NO_DELIVERY", "SAFETY", "DISCRIMINATION", "OTHER"]}
        />
      </div>
    </div>
  );
}
