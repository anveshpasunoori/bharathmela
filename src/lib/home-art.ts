import { CATEGORIES } from "./constants";

export const HOME_CATEGORY_PHOTOS: Partial<Record<string, string>> = Object.fromEntries(
  CATEGORIES.map(({ id }) => [id, `/home/categories/${id}.webp`]),
);

// Event cards use shared cultural artwork selected by event type.
export function homeEventPhoto(e: { type: string; festival: string }): string {
  if (e.type === "RELIGIOUS" || /diwali|deepavali|karthika/i.test(e.festival)) return "/home/events/diyas.webp";
  if (e.type === "FESTIVAL" || ["DANCE", "CONCERT", "COMMUNITY"].includes(e.type)) return "/home/events/dance.webp";
  if (e.type === "WORKSHOP" || e.type === "KIDS") return "/home/categories/TUTORING.webp";
  return "/home/events/stage.webp";
}

const BUSINESS_PHOTOS: Partial<Record<string, string>> = {
  FOOD: "/home/businesses/FOOD.webp",
  TUTORING: "/home/businesses/TUTORING.webp",
  EVENT_SERVICES: "/home/businesses/EVENT_SERVICES.webp",
};

export function listingPlaceholderPhoto(category: string) {
  return BUSINESS_PHOTOS[category] ?? HOME_CATEGORY_PHOTOS[category];
}
