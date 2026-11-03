import Image from "next/image";
import { CATEGORIES } from "@/lib/constants";

// Categories with an illustration in public/categories/<CATEGORY>.webp. The rest show their emoji on a
// matching tile until they get one.
const ILLUSTRATED = new Set(["ROOM_RENTAL", "TUTORING", "FOOD", "LEGAL", "DOMESTIC_HELP", "DANCE_MUSIC", "REALTOR", "EVENT_SERVICES"]);

// Decorative: the category name is always shown next to it.
export function CategoryIcon({ id, size, className = "" }: { id: string; size: number; className?: string }) {
  if (ILLUSTRATED.has(id)) {
    return <Image src={`/categories/${id}.webp`} alt="" width={size} height={size} unoptimized className={`shrink-0 ${className}`} />;
  }
  return (
    <span
      aria-hidden
      style={{ fontSize: size * 0.5 }}
      className={`grid shrink-0 place-items-center rounded-[22%] bg-brand-soft shadow-sm ring-1 ring-orange-100 ${className}`}
    >
      {CATEGORIES.find((c) => c.id === id)?.icon}
    </span>
  );
}
