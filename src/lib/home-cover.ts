import { utcToLocalInput } from "./events";

const covers = [
  {
    src: "/home/neighborhood-storefront.webp",
    alt: "An Indian shopkeeper welcoming a customer on a neighborhood main street",
  },
  {
    src: "/home/neighborhood-clothing.webp",
    alt: "A clothing shop owner showing a silk saree to a customer",
  },
  {
    src: "/home/neighborhood-music.webp",
    alt: "A music teacher showing a student how to play tabla",
  },
] as const;

export function everydayHomeCover(now: Date, timeZone: string) {
  const localDay = utcToLocalInput(now, timeZone).slice(0, 10);
  const dayNumber = Math.floor(Date.parse(localDay) / 86_400_000);
  return covers[((dayNumber % covers.length) + covers.length) % covers.length];
}
