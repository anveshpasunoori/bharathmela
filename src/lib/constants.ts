export const CATEGORIES = [
  { id: "FOOD", label: "Home Food & Cloud Kitchens", priceHint: "per plate", icon: "🍛" },
  { id: "TUTORING", label: "Tutoring & Classes", priceHint: "per hour", icon: "📚" },
  { id: "DANCE_MUSIC", label: "Dance, Music & Sangeetham", priceHint: "per month", icon: "💃" },
  { id: "PUJARI", label: "Pujari & Religious Services", priceHint: "per puja", icon: "🪔" },
  { id: "EVENT_SERVICES", label: "Weddings & Event Services", priceHint: "starting at", icon: "📸" },
  { id: "DOMESTIC_HELP", label: "Domestic Help & Nannies", priceHint: "per hour", icon: "🧹" },
  { id: "HOME_SERVICES", label: "Home Services & Repairs", priceHint: "starting at", icon: "🔧" },
  { id: "AUTO", label: "Auto Services", priceHint: "starting at", icon: "🚗" },
  { id: "BEAUTY", label: "Beauty & Wellness", priceHint: "starting at", icon: "💅" },
  { id: "ROOM_RENTAL", label: "Room Rentals", priceHint: "per month", icon: "🏠" },
  { id: "REALTOR", label: "Realtors & Real Estate", priceHint: "", icon: "🏡" },
  { id: "LEGAL", label: "Lawyers & Legal Services", priceHint: "per hour", icon: "⚖️" },
  { id: "TAX_FINANCE", label: "Tax & Accounting", priceHint: "starting at", icon: "🧾" },
  { id: "TRAVEL", label: "Travel Help", priceHint: "starting at", icon: "✈️" },
  { id: "ART", label: "Art & Crafts", priceHint: "per item", icon: "🎨" },
  { id: "CLOTHING", label: "Clothing & Jewelry", priceHint: "per item", icon: "🥻" },
  { id: "GOODS", label: "Other Goods & Services", priceHint: "", icon: "🛍️" },
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
