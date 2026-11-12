import { categoryPath } from "./seo";
import { CATEGORIES } from "./constants";

// How categories are grouped in the header's Browse menu and the phone menu, with a short line on each.
const GROUPS: { title: string; items: [id: string, blurb: string][] }[] = [
  {
    title: "Food & home",
    items: [
      ["FOOD", "Tiffins, fresh produce, milk & dairy"],
      ["DOMESTIC_HELP", "Nannies, cooks, elder care"],
      ["HOME_SERVICES", "Electrician, plumber, AC, movers"],
      ["AUTO", "Mechanic, tires, driving lessons"],
    ],
  },
  {
    title: "Learning",
    items: [
      ["TUTORING", "Math, languages, test prep"],
      ["DANCE_MUSIC", "Classical dance, vocal, instruments"],
    ],
  },
  {
    title: "Ceremonies & events",
    items: [
      ["PUJARI", "Pujas, homams, weddings"],
      ["EVENT_SERVICES", "Photo, DJ, decor, mehndi, rentals"],
      ["BEAUTY", "Threading, bridal makeup, yoga"],
    ],
  },
  {
    title: "Housing & professionals",
    items: [
      ["ROOM_RENTAL", "Rooms, apartments, in-law units"],
      ["REALTOR", "Buy or sell a home"],
      ["LEGAL", "Immigration, family, business"],
      ["TAX_FINANCE", "Tax filing, ITIN, FBAR, insurance"],
      ["TRAVEL", "India tickets, tours, notary"],
    ],
  },
  {
    title: "Shop",
    items: [
      ["CLOTHING", "Sarees, lehengas, jewelry"],
      ["ART", "Paintings, crafts, decor"],
      ["GARAGE_SALE", "Moving-out and weekend sales"],
      ["GOODS", "Pickles, plants, pooja items"],
    ],
  },
  {
    title: "Promote your business",
    items: [["CREATORS", "Food bloggers, reels, local influencers"]],
  },
];

export const NAV_GROUPS = GROUPS.map((g) => ({
  title: g.title,
  items: g.items.map(([id, blurb]) => {
    const c = CATEGORIES.find((c) => c.id === id)!;
    return { id, blurb, label: c.label, icon: c.icon, href: categoryPath(id) };
  }),
}));
