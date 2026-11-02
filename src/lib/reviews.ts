import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

export type RatingSummary = { average: number; count: number };

// Reviews anyone can see: not hidden by an admin, and from a buyer who isn't suspended or deleted.
export const PUBLIC_REVIEW: Prisma.ReviewWhereInput = {
  status: "VISIBLE",
  buyer: { suspendedAt: null, deletedAt: null },
};

export async function ratingsFor(vendorIds: string[]) {
  const rows = await db.review.groupBy({
    by: ["vendorId"],
    where: { vendorId: { in: vendorIds }, ...PUBLIC_REVIEW },
    _avg: { rating: true },
    _count: true,
  });
  return new Map<string, RatingSummary>(rows.map((r) => [r.vendorId, { average: r._avg.rating ?? 0, count: r._count }]));
}
