import Image from "next/image";

// A category's illustration (public/categories/<CATEGORY>.svg), drawn in the app's palette. Decorative:
// the category name is always shown next to it.
export function CategoryIcon({ id, size, className = "" }: { id: string; size: number; className?: string }) {
  return <Image src={`/categories/${id}.svg`} alt="" width={size} height={size} unoptimized className={`shrink-0 ${className}`} />;
}
