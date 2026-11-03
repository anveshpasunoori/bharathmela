const DAY = 86_400_000;

// "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago".
export function timeAgo(date: Date, now = Date.now()) {
  const days = Math.floor((now - date.getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// Seller activity badge from their last visit; null when they haven't been around for a month.
export function activityLabel(lastSeenAt: Date | null | undefined, now = Date.now()) {
  if (!lastSeenAt) return null;
  const days = (now - lastSeenAt.getTime()) / DAY;
  if (days < 1) return "Active today";
  if (days < 7) return "Active this week";
  if (days < 30) return "Active this month";
  return null;
}

export const daysUntil = (date: Date, now = Date.now()) => Math.ceil((date.getTime() - now) / DAY);

// Listings posted in the last week get a "New" label.
export const isNewListing = (createdAt: Date, now = Date.now()) => now - createdAt.getTime() < 7 * DAY;
