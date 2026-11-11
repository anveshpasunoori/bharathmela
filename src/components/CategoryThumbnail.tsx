import Image from "next/image";
import { HOME_CATEGORY_PHOTOS } from "@/lib/home-art";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryThumbnail({ id, size, className = "" }: { id: string; size: number; className?: string }) {
  const photo = HOME_CATEGORY_PHOTOS[id];
  if (!photo) return <CategoryIcon id={id} size={size} className={className} />;

  return (
    <Image
      src={photo}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-lg object-cover ${className}`}
    />
  );
}
