import "server-only";
// Handle checks for creators: a code per handle, kept until the handle changes.
import { db } from "./db";
import { isVerified, newCheckCode, readCreator } from "./creators";

// The checks for one creator listing, one per handle, making a code for any handle that doesn't have a
// current one (new handle, or the handle changed since the last check).
export async function checksFor(listing: { id: string; details: string }) {
  const creator = readCreator(listing.details);
  if (!creator) return [];
  const existing = await db.creatorCheck.findMany({ where: { listingId: listing.id } });
  const rows = [];
  for (const p of creator.platforms) {
    let check = existing.find((c) => c.platform === p.platform);
    if (!check || check.handle.toLowerCase() !== p.handle.toLowerCase()) {
      const fresh = { handle: p.handle, code: newCheckCode(), status: "WAITING", reviewNote: "", submittedAt: null, reviewedAt: null };
      check = await db.creatorCheck.upsert({
        where: { listingId_platform: { listingId: listing.id, platform: p.platform } },
        create: { listingId: listing.id, platform: p.platform, ...fresh },
        update: fresh,
      });
    } else if (check.status === "VERIFIED" && !isVerified(p)) {
      // Verified before, but the reported audience has grown past what was checked: ask again.
      check = await db.creatorCheck.update({ where: { id: check.id }, data: { status: "WAITING", reviewNote: "Your follower count went up a lot since we checked. Submit again and we'll re-check." } });
    }
    rows.push({ check, platform: p });
  }
  return rows;
}
