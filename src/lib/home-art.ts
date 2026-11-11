// Pictures for the home page, cut from the art sheets in design/home-art/ by scripts/cut-home-art.mjs.

// Category cards. A category without one shows its drawing on a soft color panel.
export const HOME_CATEGORY_PHOTOS: Partial<Record<string, string>> = {
  FOOD: "/home/categories/FOOD.webp",
  TUTORING: "/home/categories/TUTORING.webp",
  HOME_SERVICES: "/home/categories/HOME_SERVICES.webp",
  EVENT_SERVICES: "/home/categories/EVENT_SERVICES.webp",
  PUJARI: "/home/categories/PUJARI.webp",
  ROOM_RENTAL: "/home/categories/ROOM_RENTAL.webp",
};

// Events have no photos of their own, so event cards show a picture for the kind of event: diyas for
// Diwali and other festival nights, a temple for religious events, dancers for everything cultural.
// Kinds not listed keep the colored festive panel.
export function homeEventPhoto(e: { type: string; festival: string }): string | null {
  if (/diwali|deepavali|karthika/i.test(e.festival)) return "/home/events/diyas.webp";
  if (e.type === "RELIGIOUS") return "/home/events/temple.webp";
  if (e.type === "FESTIVAL") return e.festival ? "/home/events/diyas.webp" : "/home/events/dance.webp";
  if (["DANCE", "CONCERT", "COMMUNITY"].includes(e.type)) return "/home/events/dance.webp";
  return null;
}

// A licensed hero photo (wide, subject on the right; cut from the hero sheet). When set it replaces the
// drawn temple scene behind the hero.
export const HOME_HERO_PHOTO: string | null = null;

// The full picture behind "Can't find what you need?" (from the hero sheet), when there is one.
export const HOME_REQUEST_BANNER: string | null = null;

// The green temple skyline along the bottom of that banner.
export const HOME_REQUEST_SKYLINE = "/home/request-skyline.webp";
