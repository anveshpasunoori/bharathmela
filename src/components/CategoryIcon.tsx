import Image from "next/image";
import { CATEGORIES } from "@/lib/constants";

// Categories with a drawing in public/categories/<CATEGORY>.svg (made by scripts/category-icons.mjs). Any
// category without one shows its emoji on a matching tile.
const ILLUSTRATED = new Set<string>(CATEGORIES.map((c) => c.id));

// Decorative: the category name is always shown next to it.
export function CategoryIcon({ id, size, className = "" }: { id: string; size: number; className?: string }) {
  if (ILLUSTRATED.has(id)) {
    // Square tiles: the class sets the width and the height follows.
    return <Image src={`/categories/${id}.svg`} alt="" width={size} height={size} unoptimized style={{ height: "auto" }} className={`shrink-0 ${className}`} />;
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
