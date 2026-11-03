import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { localToUtc, utcToLocalInput } from "./events";
import { metroTimeZone } from "./metros";
import { parseQuery, rankListings } from "./search";

// Events anyone can see: live, not over yet, and from an organizer who isn't suspended or deleted.
export function publicEventWhere(now = new Date()): Prisma.EventWhereInput {
  return {
    status: "ACTIVE",
    endsAt: { gt: now },
    vendor: { user: { suspendedAt: null, deletedAt: null } },
  };
}

export type EventWhen = "all" | "today" | "weekend" | "week" | "month";

// Start and end of a date window in the city's time zone.
function windowFor(when: EventWhen, timeZone: string, now = new Date()): { gte?: Date; lt?: Date } {
  if (when === "all") return {};
  const today = utcToLocalInput(now, timeZone).slice(0, 10);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  // Midnight today in the city. Day arithmetic below can be an hour off across a DST change, which is fine for these windows.
  const midnight = localToUtc(`${today}T00:00`, timeZone)!;
  const day = 86_400_000;
  switch (when) {
    case "today":
      return { lt: new Date(midnight.getTime() + day) };
    case "weekend": {
      const toSat = (6 - weekday + 7) % 7;
      const sat = new Date(midnight.getTime() + (weekday === 0 ? -1 : toSat) * day);
      return { gte: sat, lt: new Date(sat.getTime() + 2 * day) };
    }
    case "week":
      return { lt: new Date(midnight.getTime() + 7 * day) };
    case "month":
      return { lt: new Date(midnight.getTime() + 31 * day) };
  }
}

export async function upcomingEvents(opts: {
  metro: string;
  type?: string;
  festival?: string;
  when?: EventWhen;
  freeOnly?: boolean;
  query?: string;
  take?: number;
}) {
  const now = new Date();
  const range = windowFor(opts.when ?? "all", metroTimeZone(opts.metro), now);
  const events = await db.event.findMany({
    where: {
      ...publicEventWhere(now),
      metro: opts.metro,
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.festival ? { festival: opts.festival } : {}),
      ...(opts.freeOnly ? { isFree: true } : {}),
      // An event is in the window if it overlaps it.
      ...(range.lt ? { startsAt: { lt: range.lt } } : {}),
      ...(range.gte ? { endsAt: { gt: range.gte } } : {}),
    },
    include: { vendor: { select: { businessName: true, id: true } } },
    orderBy: { startsAt: "asc" },
    take: opts.query ? 2000 : (opts.take ?? 100),
  });
  const parsed = parseQuery(opts.query ?? "");
  if (!parsed.terms.length) return events;
  // Reuse listing search: festival, venue and organizer all count as searchable text.
  const ranked = rankListings(
    parsed,
    events.map((e) => ({
      ...e,
      category: "",
      priceUnit: `${e.festival} ${e.venueName} ${e.address}`,
      tags: "",
      vendor: { businessName: e.vendor.businessName },
      original: e,
    })),
  );
  return ranked.map((r) => r.item.original).slice(0, opts.take ?? 100);
}

export type UpcomingEvent = Awaited<ReturnType<typeof upcomingEvents>>[number];
