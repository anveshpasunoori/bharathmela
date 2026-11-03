import Link from "next/link";

// Switches between rooms offered (listings) and people looking (requests).
export function RentalTabs({ metro, active }: { metro: string; active: "offered" | "wanted" }) {
  const tab = (on: boolean) => `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${on ? "border-brand text-brand" : "border-transparent text-stone-600 hover:text-stone-900"}`;
  return (
    <nav className="flex gap-1 border-b border-stone-200" aria-label="Room rentals">
      <Link href={`/?metro=${metro}&category=ROOM_RENTAL`} className={tab(active === "offered")}>Rooms offered</Link>
      <Link href={`/rooms-wanted?metro=${metro}`} className={tab(active === "wanted")}>People looking for a place</Link>
    </nav>
  );
}
