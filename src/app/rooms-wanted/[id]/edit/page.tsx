import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { WantedFields } from "@/components/WantedFields";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateWanted } from "../../../actions/room-wanted";

export default async function EditWantedPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/rooms-wanted/mine");
  const { id } = await params;
  const post = await db.roomWanted.findUnique({ where: { id } });
  if (!post || post.userId !== user.id || post.status === "REMOVED") notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/rooms-wanted/mine" className="text-sm text-stone-500 hover:text-brand">← My requests</Link>
      <h1 className="mt-2 text-2xl font-bold">Edit request</h1>
      {post.status === "REJECTED" && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">Not approved: {post.moderationNote}. Fix this and save to resubmit.</p>
      )}
      <div className="card mt-4">
        <ActionForm action={updateWanted} submitLabel="Save changes">
          <input type="hidden" name="id" value={post.id} />
          <WantedFields
            lockMetro
            initial={{
              metro: post.metro,
              title: post.title,
              description: post.description,
              budget: String(post.budgetMaxCents / 100),
              moveInDate: post.moveInDate,
              lease: post.lease,
              spaceTypes: post.spaceTypes.split(",").filter(Boolean),
              areas: post.areas,
              needsPrivateBath: post.needsPrivateBath,
              needsFurnished: post.needsFurnished,
              needsParking: post.needsParking,
              hasPets: post.hasPets,
            }}
          />
        </ActionForm>
      </div>
    </div>
  );
}
