import { db } from "@/lib/db";
import { eventTypeLabel } from "@/lib/events";
import { metroName, metroTimeZone } from "@/lib/metros";
import { OG_SIZE, shareCard } from "@/lib/og-card";
import { formatUSD } from "@/lib/plans";
import { idFromSlugParam } from "@/lib/seo";

// The share card for an event: what, when, where and whether it's free.
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Event on BharathMela";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const event = await db.event.findUnique({
    where: { id: idFromSlugParam((await params).id) },
    select: { title: true, type: true, festival: true, startsAt: true, venueName: true, metro: true, isFree: true, priceCents: true, status: true },
  });
  if (!event || event.status !== "ACTIVE") return shareCard({ kicker: "Events", title: "Indian community events near you", footer: "bharathmela.com" });
  const when = event.startsAt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: metroTimeZone(event.metro) });
  return shareCard({
    kicker: event.festival || eventTypeLabel(event.type),
    title: event.title,
    highlight: `${when} · ${event.isFree ? "Free" : event.priceCents != null ? `From ${formatUSD(event.priceCents)}` : "Tickets"}`,
    footer: `${event.venueName}, ${metroName(event.metro)}`,
  });
}
