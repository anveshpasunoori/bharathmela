"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan } from "@/lib/billing";
import { db } from "@/lib/db";
import { isEventType, isFestival, localToUtc } from "@/lib/events";
import { REVIEW_FIRST_LISTING } from "@/lib/legal";
import { metroTimeZone } from "@/lib/metros";
import { screenListing } from "@/lib/moderation";
import { TOO_MANY, hit } from "@/lib/rate-limit";

const DAY_MS = 86_400_000;

// Ticket links to these sites go live without review; anything else is checked by an admin.
const KNOWN_TICKET_SITES = [
  "eventbrite.com", "ticketmaster.com", "sulekha.com", "meetup.com", "allevents.in", "universe.com", "zeffy.com",
  "ticketleap.com", "brownpapertickets.com", "seatgeek.com", "axs.com", "dice.fm", "tix.com", "showclix.com",
  "ticketspice.com", "humanitix.com", "givebutter.com", "docs.google.com", "forms.gle",
];

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

type EventInput = {
  title: string;
  description: string;
  type: string;
  festival: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  address: string;
  isFree: boolean;
  priceCents: number | null;
  ticketUrl: string;
};

function parseEvent(form: FormData, metro: string): EventInput | { error: string } {
  const title = field(form, "title");
  const description = field(form, "description");
  const type = field(form, "type");
  const festival = field(form, "festival");
  const venueName = field(form, "venueName");
  const address = field(form, "address");
  const isFree = form.get("isFree") === "on";
  const price = field(form, "price").replace(/^\$/, "");
  const ticketUrl = field(form, "ticketUrl");

  if (title.length < 5 || title.length > 120) return { error: "Title should be 5 to 120 characters." };
  if (description.length < 20 || description.length > 3000) return { error: "Description should be 20 to 3,000 characters." };
  if (!isEventType(type)) return { error: "Choose an event type." };
  if (festival && !isFestival(festival)) return { error: "Choose a festival from the list." };
  if (venueName.length < 2 || venueName.length > 120) return { error: "Enter the venue name (or \"Online\")." };
  if (address.length < 5 || address.length > 200) return { error: "Enter the venue address, or the city for online events." };

  const tz = metroTimeZone(metro);
  const startsAt = localToUtc(field(form, "startsAt"), tz);
  const endsAt = localToUtc(field(form, "endsAt"), tz);
  if (!startsAt || !endsAt) return { error: "Enter a start and end date and time." };
  if (endsAt <= startsAt) return { error: "The event must end after it starts." };
  if (endsAt.getTime() - startsAt.getTime() > 14 * DAY_MS) return { error: "Events can last at most 14 days." };
  if (endsAt.getTime() < Date.now()) return { error: "That date is in the past." };
  if (startsAt.getTime() > Date.now() + 365 * DAY_MS) return { error: "Events can be posted up to a year ahead." };

  let priceCents: number | null = null;
  if (!isFree) {
    const n = Number(price);
    if (!price || !Number.isFinite(n) || n <= 0 || n > 10_000) return { error: "Enter the lowest ticket price, or mark the event as free." };
    priceCents = Math.round(n * 100);
  }
  if (ticketUrl) {
    let url: URL;
    try {
      url = new URL(ticketUrl);
    } catch {
      return { error: "The ticket link must be a full web address starting with https://" };
    }
    if (url.protocol !== "https:" || ticketUrl.length > 300) return { error: "The ticket link must start with https:// (and be under 300 characters)." };
  }
  if (form.get("confirm") !== "on") return { error: "Please confirm the event follows the rules and Terms." };
  return { title, description, type, festival, startsAt, endsAt, venueName, address, isFree, priceCents, ticketUrl };
}

function ticketHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function moderateEvent(input: EventInput, vendorId: string) {
  const screening = screenListing(`${input.title}\n${input.description}\n${input.venueName}`, "EVENT");
  if (screening.block) return { error: screening.block } as const;
  const reasons = [...screening.flags];
  const host = ticketHost(input.ticketUrl);
  if (host && !KNOWN_TICKET_SITES.some((site) => host === site || host.endsWith(`.${site}`))) {
    reasons.push(`ticket link goes to ${host}`);
  }
  if (REVIEW_FIRST_LISTING) {
    const approvedBefore = await db.event.count({ where: { vendorId, status: { in: ["ACTIVE", "HIDDEN"] } } });
    if (!approvedBefore) reasons.push("organizer's first event");
  }
  return reasons.length
    ? ({ status: "PENDING_REVIEW", moderationNote: reasons.join("; ") } as const)
    : ({ status: "ACTIVE", moderationNote: "" } as const);
}

// Upcoming live and in-review events count toward the plan's event limit.
async function hasRoomForEvent(vendorId: string, excludeId?: string) {
  const { plan } = await getVendorPlan(vendorId);
  const used = await db.event.count({
    where: {
      vendorId,
      status: { in: ["ACTIVE", "PENDING_REVIEW"] },
      endsAt: { gt: new Date() },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return { ok: used < plan.maxEvents, plan };
}

async function ownEvent(vendorId: string, eventId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || event.vendorId !== vendorId) throw new Error("Event not found");
  return event;
}

export async function createEvent(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const input = parseEvent(form, vendor.metro);
  if ("error" in input) return input;
  if (!(await hit("listing", vendor.id))) return { error: TOO_MANY };
  const { ok, plan } = await hasRoomForEvent(vendor.id);
  if (!ok) {
    return { error: `Your ${plan.name} plan allows ${plan.maxEvents} upcoming event(s). Upgrade, or wait until one has finished.` };
  }
  const decision = await moderateEvent(input, vendor.id);
  if ("error" in decision) return decision;

  await db.event.create({ data: { vendorId: vendor.id, metro: vendor.metro, ...input, ...decision } });
  revalidatePath("/vendor");
  redirect(`/vendor?tab=events&${decision.status === "PENDING_REVIEW" ? "review=event" : "eventPublished=1"}`);
}

export async function updateEvent(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const event = await ownEvent(vendor.id, field(form, "eventId"));
  if (event.status === "REMOVED") return { error: "This event was removed by BharathMela and can't be edited." };
  const input = parseEvent(form, event.metro);
  if ("error" in input) return input;
  if (!(await hit("listing", vendor.id))) return { error: TOO_MANY };

  const decision = await moderateEvent(input, vendor.id);
  if ("error" in decision) return decision;
  const status =
    decision.status === "PENDING_REVIEW" || event.status === "REJECTED" || event.status === "PENDING_REVIEW"
      ? "PENDING_REVIEW"
      : event.status;
  await db.event.update({
    where: { id: event.id },
    data: { ...input, status, moderationNote: status === "PENDING_REVIEW" ? decision.moderationNote || "edited after rejection" : "" },
  });
  revalidatePath("/vendor");
  revalidatePath("/events/[id]", "page");
  redirect(`/vendor?tab=events&${status === "PENDING_REVIEW" ? "review=event" : "updated=1"}`);
}

export async function setEventVisibility(eventId: string, visible: boolean) {
  const { vendor } = await requireVendor();
  const event = await ownEvent(vendor.id, eventId);
  if (event.status !== "ACTIVE" && event.status !== "HIDDEN") return;
  if (visible) {
    const { ok } = await hasRoomForEvent(vendor.id, event.id);
    if (!ok) redirect("/vendor?tab=events&error=eventLimit");
  }
  await db.event.update({ where: { id: eventId }, data: { status: visible ? "ACTIVE" : "HIDDEN" } });
  revalidatePath("/vendor");
}

export async function deleteEvent(eventId: string) {
  const { vendor } = await requireVendor();
  await ownEvent(vendor.id, eventId);
  await db.event.delete({ where: { id: eventId } });
  revalidatePath("/vendor");
}
