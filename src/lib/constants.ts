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
