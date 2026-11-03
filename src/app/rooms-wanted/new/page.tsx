import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { WantedFields } from "@/components/WantedFields";
import { requireUser } from "@/lib/auth";
import { DEFAULT_METRO, isMetro } from "@/lib/metros";
import { WANTED_DAYS } from "@/lib/rooms-wanted";
import { createWanted } from "../../actions/room-wanted";

export const metadata = { title: "I need a place to live – DesiBazaar" };

export default async function NewWantedPage({ searchParams }: { searchParams: Promise<{ metro?: string }> }) {
  const user = await requireUser("/rooms-wanted/new");
  if (!user.emailVerifiedAt) redirect("/verify?next=/rooms-wanted/new");
  const { metro } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/rooms-wanted" className="text-sm text-stone-500 hover:text-brand">← People looking for a place</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">I need a place to live</h1>
      <p className="mb-4 text-stone-600">
        Free. Owners with a room or apartment can message you. Your post stays up for {WANTED_DAYS} days and you can renew it.
      </p>
      <div className="card">
        <ActionForm action={createWanted} submitLabel="Post my request">
          <WantedFields
            initial={{
              metro: isMetro(metro) ? metro : (user.vendor?.metro ?? DEFAULT_METRO),
              title: "",
              description: "",
              budget: "",
              moveInDate: "",
              lease: "FLEXIBLE",
              spaceTypes: ["PRIVATE_ROOM"],
              areas: "",
              needsPrivateBath: false,
              needsFurnished: false,
              needsParking: false,
              hasPets: false,
            }}
          />
        </ActionForm>
      </div>
    </div>
  );
}
