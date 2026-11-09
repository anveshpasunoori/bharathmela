import "server-only";
// The monthly "new in your city" email, for people who opted in: the month's new listings and the next
// month's events in their city. Sent on the 1st by the daily job; a city with nothing new gets no email.
import { db } from "./db";
import { sendEmail } from "./email";
import { publicEventWhere } from "./event-data";
import { publicListing } from "./listings";
import { metroName, metroTimeZone } from "./metros";
import { priceLabel } from "./plans";
import { categoryLabel } from "./constants";
import { cityPath, eventPath, listingPath, siteUrl } from "./seo";

const DAY_MS = 86_400_000;

export async function runCityDigest(now = new Date(), { force = false } = {}) {
  if (!force && now.getUTCDate() !== 1) return { cityEmails: 0 };
  const people = await db.user.findMany({
    where: {
      cityEmails: true,
      cityEmailMetro: { not: null },
      emailVerifiedAt: { not: null },
      deletedAt: null,
      suspendedAt: null,
      // Once a month, with slack for a job that runs early or twice.
      OR: [{ cityEmailSentAt: null }, { cityEmailSentAt: { lte: new Date(now.getTime() - 20 * DAY_MS) } }],
    },
    select: { id: true, name: true, email: true, cityEmailMetro: true, cityEmailToken: true },
    take: 5000,
  });
  const base = siteUrl();
  const contentFor = new Map<string, string | null>();
  let sent = 0;
  for (const p of people) {
    const metro = p.cityEmailMetro!;
    if (!contentFor.has(metro)) contentFor.set(metro, await cityContent(metro, now, base));
    const content = contentFor.get(metro);
    if (!content) continue;
    const city = metroName(metro).split(",")[0];
    const ok = await sendEmail(
      p.email,
      `New in ${city} this month on BharathMela`,
      `Hi ${p.name},\n\n${content}\n\n` +
        `See everything in ${city}: ${base}${cityPath(metro)}\n` +
        `Change your city: ${base}/account\n` +
        `Stop these emails: ${base}/city-emails/unsubscribe/${p.cityEmailToken}\n\n– BharathMela`,
      undefined,
      { "List-Unsubscribe": `<${base}/api/city-emails/unsubscribe?token=${p.cityEmailToken}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    );
    if (ok) {
      sent++;
      await db.user.update({ where: { id: p.id }, data: { cityEmailSentAt: now } });
    }
  }
  return { cityEmails: sent };
}

async function cityContent(metro: string, now: Date, base: string) {
  const [listings, newCount, events] = await Promise.all([
    db.listing.findMany({
      where: { ...publicListing(now), metro, createdAt: { gt: new Date(now.getTime() - 31 * DAY_MS) } },
      include: { vendor: { select: { businessName: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.listing.count({ where: { ...publicListing(now), metro, createdAt: { gt: new Date(now.getTime() - 31 * DAY_MS) } } }),
    db.event.findMany({
      where: { ...publicEventWhere(now), metro, startsAt: { lt: new Date(now.getTime() + 31 * DAY_MS) } },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
  ]);
  if (!listings.length && !events.length) return null;
  const parts: string[] = [];
  if (listings.length) {
    const lines = listings.map((l) => {
      const price = l.priceCents != null ? priceLabel(l.priceCents, l.priceUnit) : null;
      return `• ${l.title}${price ? ` – ${price.main} ${price.unit}`.trimEnd() : ""}\n  ${l.vendor.businessName} · ${categoryLabel(l.category)} · ${base}${listingPath(l)}`;
    });
    parts.push(`New this month (${newCount}):\n\n${lines.join("\n\n")}${newCount > listings.length ? `\n\n…and ${newCount - listings.length} more.` : ""}`);
  }
  if (events.length) {
    const tz = metroTimeZone(metro);
    const lines = events.map((e) => {
      const day = e.startsAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz });
      return `• ${e.title}\n  ${day} · ${e.venueName} · ${base}${eventPath(e)}`;
    });
    parts.push(`Coming up:\n\n${lines.join("\n\n")}`);
  }
  return parts.join("\n\n");
}
