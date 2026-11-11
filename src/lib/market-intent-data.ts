import "server-only";
import { db } from "./db";
import { INTENT_RETENTION_DAYS, INTENT_WINDOW_DAYS, rankMarketIntents, selectPopularIntents } from "./market-intents";

const DAY_MS = 86_400_000;

export function intentDay(now: Date, daysAgo = 0) {
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  return new Date(date.getTime() - daysAgo * DAY_MS);
}

async function recentSignals(metro?: string) {
  const now = new Date();
  const recent = intentDay(now, 6);
  try {
    const rows = await db.marketIntent.groupBy({
      by: ["day", "action", "kind"],
      where: { day: { gte: intentDay(now, INTENT_WINDOW_DAYS - 1) }, ...(metro ? { metro } : {}) },
      _count: true,
    });
    return rows.map((row) => ({ ...row, recent: row.day >= recent, count: row._count }));
  } catch (error) {
    console.error("[market-intent] Could not read interactions", (error as { code?: string }).code);
    return [];
  }
}

export async function popularMarketIntents(metro: string) {
  const local = await recentSignals(metro);
  const selected = selectPopularIntents(local, []);
  return selected.rows.length ? selected : selectPopularIntents([], await recentSignals());
}

export async function marketplaceIntentReport() {
  return rankMarketIntents(await recentSignals());
}

export async function pruneMarketIntents(now: Date) {
  return db.marketIntent.deleteMany({ where: { day: { lt: intentDay(now, INTENT_RETENTION_DAYS - 1) } } });
}
