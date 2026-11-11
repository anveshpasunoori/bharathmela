import { utcToLocalInput } from "./events";

const DAY = 86_400_000;

const art = {
  harvest: "Kites over a harvest celebration",
  holi: "Bright bowls of Holi colors",
  diwali: "Diyas on a colorful rangoli",
  eid: "Dates and lanterns on an Eid table",
  onam: "An Onam flower arrangement and sadya",
  vishu: "Golden kanikonna blossoms, fruit and a brass bowl for Vishu",
  garba: "Garba dancers celebrating with dandiya sticks",
  halloween: "Glowing pumpkins outside a neighborhood storefront",
  christmas: "Christmas greenery, lights and gifts",
};

type Theme = keyof typeof art;
type Observance = [festival: string, date: string, theme: Theme, through?: string];

// Homepage cover dates, using local calendar days. Update movable dates annually.
// Hindu observances: Drik Panchang (New York and Kerala). Eid estimates: Time and Date (US).
const calendar: Observance[] = [
  ["Sankranthi / Pongal", "2027-01-14", "harvest", "2027-01-16"],
  ["Eid al-Fitr", "2027-03-10", "eid", "2027-03-11"],
  ["Holi", "2027-03-22", "holi"],
  ["Vishu", "2027-04-15", "vishu"],
  ["Eid al-Adha", "2027-05-17", "eid", "2027-05-18"],
  ["Onam", "2027-09-12", "onam"],
  ["Navratri / Garba", "2027-09-30", "garba", "2027-10-08"],
  ["Diwali", "2027-10-28", "diwali", "2027-10-29"],
];

const annual: Observance[] = [
  ["Halloween", "10-31", "halloween"],
  ["Christmas", "12-25", "christmas"],
];

export type FestivalCover = { festival: string; src: string; alt: string };

export function selectFestivalCover(now: Date, timeZone: string): FestivalCover | null {
  const date = utcToLocalInput(now, timeZone).slice(0, 10);
  const today = Date.parse(date);
  const year = Number(date.slice(0, 4));
  const schedule = [...calendar, ...[year, year + 1].flatMap((y) =>
    annual.map(([festival, monthDay, theme]): Observance => [festival, `${y}-${monthDay}`, theme]),
  )];
  const active = schedule.filter(([, start, , through]) =>
    Date.parse(start) <= today + 7 * DAY && Date.parse(through ?? start) >= today,
  );
  // Show a festival in progress first. Otherwise, feature the nearest upcoming one.
  active.sort(([, a], [, b]) => {
    if (a <= date && b <= date) return b.localeCompare(a);
    return a.localeCompare(b);
  });
  const next = active[0];
  return next ? { festival: next[0], src: `/home/festivals/${next[2]}.webp`, alt: art[next[2]] } : null;
}
