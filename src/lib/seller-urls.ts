import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { sellerPathBase, sellerPathCandidate, type SellerLocation } from "./seller-slugs";

// Serialize reservations through the same transaction as the profile write. A unique
// database index also protects against imports that do not use this allocator.
export async function allocateSellerPath(tx: Prisma.TransactionClient, seller: SellerLocation) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(64285319)`;
  const base = sellerPathBase(seller);
  for (let number = 1; ; number++) {
    const publicPath = sellerPathCandidate(base, number);
    if (!await tx.vendorProfile.findUnique({ where: { publicPath }, select: { id: true } })) return publicPath;
  }
}

// Used by legacy redirects and the resumable backfill; never changes an assigned URL.
export async function ensureSellerPath(id: string) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(64285319)`;
    const seller = await tx.vendorProfile.findUniqueOrThrow({ where: { id } });
    if (seller.publicPath) return seller.publicPath;
    const publicPath = await allocateSellerPath(tx, seller);
    await tx.vendorProfile.update({ where: { id }, data: { publicPath } });
    return publicPath;
  });
}
