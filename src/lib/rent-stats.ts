// Typical-rent math, kept free of database code so it can be tested on its own.

export const MIN_COMPARABLES = 5;
export const NEARBY_MILES = 15;

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// How a listing's rent compares with similar nearby rents. Null when there isn't enough data to say.
export function compareRent(rentCents: number, comparableCents: number[]) {
  if (comparableCents.length < MIN_COMPARABLES) return null;
  const typical = median(comparableCents)!;
  const ratio = rentCents / typical;
  return {
    typicalCents: typical,
    count: comparableCents.length,
    percent: Math.round((ratio - 1) * 100),
    // Far below market is the classic rental-scam bait.
    suspiciouslyLow: ratio < 0.5,
  };
}
