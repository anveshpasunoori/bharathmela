// Event types, festivals and time-zone helpers shared by server and client code.

export const EVENT_TYPES = [
  { id: "FESTIVAL", label: "Festival celebrations" },
  { id: "CONCERT", label: "Music & concerts" },
  { id: "DANCE", label: "Dance performances" },
  { id: "RELIGIOUS", label: "Pujas & religious" },
  { id: "COMMUNITY", label: "Community & cultural" },
  { id: "WORKSHOP", label: "Workshops & classes" },
  { id: "KIDS", label: "Kids & family" },
  { id: "COMEDY", label: "Comedy, film & theatre" },
  { id: "OTHER", label: "Other" },
] as const;

export const FESTIVALS = [
  "Makar Sankranti / Pongal / Lohri",
  "Republic Day",
  "Vasant Panchami",
  "Maha Shivaratri",
  "Holi",
  "Ugadi / Gudi Padwa",
  "Ram Navami",
  "Baisakhi / Vishu / Puthandu",
  "Eid",
  "Independence Day",
  "Raksha Bandhan",
  "Janmashtami",
  "Onam",
  "Ganesh Chaturthi",
  "Navratri / Garba / Dandiya",
  "Durga Puja",
  "Bathukamma",
  "Dussehra",
  "Karva Chauth",
  "Diwali",
  "Chhath Puja",
  "Guru Nanak Jayanti",
  "Christmas",
  "Other festival",
] as const;

export function eventTypeLabel(id: string) {
  return EVENT_TYPES.find((t) => t.id === id)?.label ?? id;
}

export const isEventType = (id: string) => EVENT_TYPES.some((t) => t.id === id);
export const isFestival = (name: string) => (FESTIVALS as readonly string[]).includes(name);

// Offset of `timeZone` from UTC at `date`, in milliseconds.
function zoneOffset(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

// "2026-11-14T18:30" typed by an organizer in the event's city → the real instant.
export function localToUtc(local: string, timeZone: string): Date | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = guess - zoneOffset(new Date(guess), timeZone);
  // Second pass corrects the guess when it lands on the other side of a DST change.
  utc = guess - zoneOffset(new Date(utc), timeZone);
  return new Date(utc);
}

// The reverse, for pre-filling a datetime-local input.
export function utcToLocalInput(date: Date, timeZone: string) {
  const local = new Date(date.getTime() + zoneOffset(date, timeZone));
  return local.toISOString().slice(0, 16);
}

export function formatEventTime(start: Date, end: Date, timeZone: string) {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  const zone = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(start).find((p) => p.type === "timeZoneName")?.value;
  const sameDay = day.format(start) === day.format(end);
  return sameDay
    ? `${day.format(start)} · ${time.format(start)} – ${time.format(end)} ${zone ?? ""}`.trim()
    : `${day.format(start)}, ${time.format(start)} – ${day.format(end)}, ${time.format(end)} ${zone ?? ""}`.trim();
}

// Just the hours, for cards that already show the date: "9:30 AM – 12:30 PM", or "7:00 PM – Sun, Nov 15, 1:00 AM"
// when it runs past the start day.
export function formatEventHours(start: Date, end: Date, timeZone: string) {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" });
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  const endsSameDay = day.format(start) === day.format(end);
  return `${time.format(start)} – ${endsSameDay ? "" : `${day.format(end)}, `}${time.format(end)}`;
}

export function eventDateBadge(start: Date, timeZone: string) {
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone, ...o }).format(start);
  return { month: fmt({ month: "short" }).toUpperCase(), day: fmt({ day: "numeric" }), weekday: fmt({ weekday: "short" }) };
}
