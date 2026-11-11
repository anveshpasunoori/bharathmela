import { MIN_INTENT_SIGNALS } from "./market-intents";

export const TRIAL_BOOST_DAYS = 7;
const DAY_MS = 86_400_000;

export function boostAvailability(
  listing: { status: string; featuredUntil: Date | null; expiresAt: Date | null },
  days: number, searches: number | null, now = new Date(),
) {
  const startsAt = listing.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
  const endsAt = new Date(startsAt.getTime() + days * DAY_MS);
  const reason = listing.status !== "ACTIVE" || !listing.expiresAt || listing.expiresAt <= now
    ? "Publish or renew this listing to make it visible before promoting it."
    : listing.expiresAt <= endsAt
      ? "Renew this listing so it stays live throughout the promotion."
      : searches == null
        ? "Demand data is temporarily unavailable. Check back before buying a promotion."
        : searches < MIN_INTENT_SIGNALS
          ? "There isn’t enough recent search activity in this category and area to recommend a paid promotion yet."
          : null;
  return { startsAt, endsAt, reason };
}
