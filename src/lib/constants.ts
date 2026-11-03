export const CATEGORIES = [
  { id: "FOOD", label: "Home Food & Cloud Kitchens", priceHint: "per plate" },
  { id: "TUTORING", label: "Tutoring & Classes", priceHint: "per hour" },
  { id: "DANCE_MUSIC", label: "Dance, Music & Sangeetham", priceHint: "per month" },
  { id: "PUJARI", label: "Pujari & Religious Services", priceHint: "per puja" },
  { id: "DOMESTIC_HELP", label: "Domestic Help & Nannies", priceHint: "per hour" },
  { id: "ROOM_RENTAL", label: "Room Rentals", priceHint: "per month" },
  { id: "ART", label: "Art & Crafts", priceHint: "per item" },
  { id: "CLOTHING", label: "Clothing & Jewelry", priceHint: "per item" },
  { id: "GOODS", label: "Other Goods & Services", priceHint: "" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const PAYMENT_METHODS = [
  { id: "ZELLE", label: "Zelle" },
  { id: "VENMO", label: "Venmo" },
  { id: "OTHER", label: "Other" },
] as const;

// Dietary markers for food listings. These are the seller's own claims; we don't verify them.
export const DIET_TAGS = [
  { id: "VEGETARIAN", label: "Vegetarian" },
  { id: "VEGAN", label: "Vegan" },
  { id: "JAIN", label: "Jain (no onion/garlic)" },
  { id: "EGGLESS", label: "Eggless" },
  { id: "GLUTEN_FREE", label: "Gluten-free" },
  { id: "DAIRY_FREE", label: "Dairy-free" },
  { id: "NUT_FREE", label: "Nut-free" },
  { id: "ORGANIC", label: "Organic" },
  { id: "HALAL", label: "Halal" },
] as const;

export type DietTag = (typeof DIET_TAGS)[number]["id"];

// Tags that follow from another one, added automatically so filters stay accurate.
const IMPLIED: Partial<Record<DietTag, DietTag[]>> = {
  VEGAN: ["VEGETARIAN", "EGGLESS", "DAIRY_FREE"],
  JAIN: ["VEGETARIAN"],
};

export function isDietTag(id: string): id is DietTag {
  return DIET_TAGS.some((t) => t.id === id);
}

export function normalizeTags(ids: string[]): DietTag[] {
  const set = new Set(ids.filter(isDietTag));
  for (const id of [...set]) for (const implied of IMPLIED[id] ?? []) set.add(implied);
  return DIET_TAGS.map((t) => t.id).filter((id) => set.has(id));
}

export const serializeTags = (ids: DietTag[]) => (ids.length ? `,${ids.join(",")},` : "");
export const parseTags = (stored: string) => normalizeTags(stored.split(","));
export const tagLabel = (id: string) => DIET_TAGS.find((t) => t.id === id)?.label ?? id;
