import { utcToLocalInput } from "./events";

const DAY = 86_400_000;

const art = {
  harvest: "Kites over a harvest celebration",
  holi: "Bright bowls of Holi colors",
  diwali: "Diyas on a colorful rangoli",
  eid: "Dates and lanterns on an Eid table",
  onam: "An Onam flower arrangement and sadya",
  garba: "Garba dancers celebrating with dandiya sticks",
  christmas: "Christmas greenery, lights and gifts",
  community: "Marigolds, textiles and Indian sweets",
  tricolor: "Orange, white and green decorations",
};

type Theme = keyof typeof art;
type Observance = [festival: string, date: string, theme: Theme, through?: string];

// Homepage display dates, not ritual timings. Update movable dates annually.
// Sources: indianpanchang.com/festivals/2027, timeanddate.com/holidays/india/2027,
// Drik Panchang's 2026 New York Chhath and Guru Nanak calendars, and mypanchang.com/newsite/bathukamma.php.
const calendar: Observance[] = [
  ["Chhath Puja", "2026-11-13", "community", "2026-11-16"],
  ["Guru Nanak Jayanti", "2026-11-24", "community"],
  ["Makar Sankranti / Pongal / Lohri", "2027-01-13", "harvest", "2027-01-16"],
  ["Vasant Panchami", "2027-02-11", "community"],
  ["Maha Shivaratri", "2027-03-06", "community"],
  ["Eid", "2027-03-10", "eid", "2027-03-11"],
  ["Holi", "2027-03-22", "holi"],
  ["Easter", "2027-03-28", "community"],
  ["Ugadi / Gudi Padwa", "2027-04-07", "community"],
  ["Baisakhi / Vishu / Puthandu", "2027-04-14", "harvest"],
  ["Ram Navami", "2027-04-14", "community", "2027-04-15"],
  ["Mahavir Jayanti", "2027-04-19", "community"],
  ["Eid", "2027-05-17", "eid", "2027-05-18"],
  ["Buddha Purnima", "2027-05-20", "community"],
  ["Raksha Bandhan", "2027-08-17", "community"],
  ["Janmashtami", "2027-08-25", "community"],
  ["Ganesh Chaturthi", "2027-09-04", "community"],
  ["Onam", "2027-09-12", "onam"],
  ["Bathukamma", "2027-09-29", "community", "2027-10-07"],
  ["Navratri / Garba / Dandiya", "2027-09-30", "garba", "2027-10-08"],
  ["Durga Puja", "2027-10-05", "community", "2027-10-09"],
  ["Dussehra", "2027-10-09", "community"],
  ["Karva Chauth", "2027-10-18", "community"],
  ["Diwali", "2027-10-28", "diwali", "2027-10-29"],
  ["Chhath Puja", "2027-11-03", "community", "2027-11-04"],
  ["Guru Nanak Jayanti", "2027-11-14", "community"],
];

const annual: Observance[] = [
  ["Republic Day", "01-26", "tricolor"],
  ["Independence Day", "08-15", "tricolor"],
  ["Christmas", "12-25", "christmas"],
];

export type FestivalCover = { festival: string; src: string; alt: string };

function cover(festival: string, theme: Theme): FestivalCover {
  return { festival, src: `/home/festivals/${theme}.webp`, alt: art[theme] };
}

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
  return next ? cover(next[0], next[2]) : null;
}

export function localFestivalCover(event: { festival: string; startsAt: Date }, now: Date, timeZone: string): FestivalCover | null {
  const today = Date.parse(utcToLocalInput(now, timeZone).slice(0, 10));
  const eventDay = Date.parse(utcToLocalInput(event.startsAt, timeZone).slice(0, 10));
  if (eventDay > today + 7 * DAY) return null;
  const theme = [...calendar, ...annual].find(([name]) => name === event.festival)?.[2] ?? "community";
  const name = event.festival && event.festival !== "Other festival" ? event.festival : "Community festival";
  return cover(name, theme);
}
