import "server-only";
import { db } from "./db";
import { intentDay } from "./market-intent-data";
import { INTENT_WINDOW_DAYS } from "./market-intents";

export { boostAvailability, TRIAL_BOOST_DAYS } from "./boost-policy";

export async function localBoostDemand(listing: { metro: string; category: string }, now = new Date()) {
  try {
    return await db.marketIntent.count({
      where: { metro: listing.metro, action: listing.category, kind: "search", day: { gte: intentDay(now, INTENT_WINDOW_DAYS - 1) } },
    });
  } catch {
    return null;
  }
}

export async function boostDemandForMetro(metro: string, now = new Date()) {
  try {
    const rows = await db.marketIntent.groupBy({
      by: ["action"],
      where: { metro, kind: "search", day: { gte: intentDay(now, INTENT_WINDOW_DAYS - 1) } },
      _count: true,
    });
    return new Map(rows.map((row) => [row.action, row._count]));
  } catch {
    return null;
  }
}
