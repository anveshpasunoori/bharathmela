import { parseTags, tagLabel } from "@/lib/constants";

// Green markers for a food listing's dietary tags. Vegetarian is implied by Vegan and Jain, so it's
// left out next to them to keep the row short.
export function DietBadges({ tags, className = "" }: { tags: string; className?: string }) {
  const ids = parseTags(tags);
  const shown = ids.includes("VEGAN") || ids.includes("JAIN") ? ids.filter((id) => id !== "VEGETARIAN") : ids;
  if (!shown.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`} aria-label="Dietary markers">
      {shown.map((id) => (
        <li key={id} className="badge bg-green-50 text-green-800 ring-1 ring-green-200">
          {id === "VEGETARIAN" || id === "VEGAN" ? "🌱 " : ""}
          {tagLabel(id)}
        </li>
      ))}
    </ul>
  );
}
