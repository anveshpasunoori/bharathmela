import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { LEASES, SPACE_TYPES, spaceTypeLabel } from "./rentals";
import { parseQuery, rankListings } from "./search";

export const WANTED_DAYS = 60;
export const MAX_ACTIVE_WANTED = 2;

// Posts anyone can see: live, not expired, from an account in good standing.
export function publicWantedWhere(now = new Date()): Prisma.RoomWantedWhereInput {
  return { status: "ACTIVE", expiresAt: { gt: now }, user: { suspendedAt: null, deletedAt: null } };
}

export type WantedInput = {
  title: string;
  description: string;
  budgetMaxCents: number;
  moveInDate: string;
  lease: string;
  spaceTypes: string;
  areas: string;
  needsPrivateBath: boolean;
  needsFurnished: boolean;
  needsParking: boolean;
  hasPets: boolean;
};

export function parseWantedForm(form: FormData): WantedInput | { error: string } {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const title = get("title");
  const description = get("description");
  if (title.length < 5 || title.length > 100) return { error: "Headline should be 5 to 100 characters." };
  if (description.length < 30 || description.length > 2000) return { error: "Tell owners a bit about yourself (30 to 2,000 characters)." };
  const budget = Number(get("budget").replace(/[$,]/g, ""));
  if (!Number.isFinite(budget) || budget < 100 || budget > 20_000) return { error: "Enter your maximum monthly budget, like 1200." };
  const moveInDate = get("moveInDate");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveInDate)) return { error: "Choose your move-in date." };
  const moveIn = new Date(`${moveInDate}T12:00:00Z`).getTime();
  if (moveIn < Date.now() - 2 * 86_400_000 || moveIn > Date.now() + 365 * 86_400_000) {
    return { error: "Move-in date should be within the next year." };
  }
  const spaceTypes = form.getAll("spaceTypes").map(String).filter((id) => SPACE_TYPES.some((t) => t.id === id));
  if (!spaceTypes.length) return { error: "Choose at least one type of place you'd take." };
  const lease = LEASES.some((l) => l.id === get("lease")) ? get("lease") : "FLEXIBLE";
  if (form.get("confirm") !== "on") return { error: "Please confirm the post follows the Terms." };
  return {
    title,
    description,
    budgetMaxCents: Math.round(budget * 100),
    moveInDate,
    lease,
    spaceTypes: `,${spaceTypes.join(",")},`,
    areas: get("areas").slice(0, 150),
    needsPrivateBath: form.get("needsPrivateBath") === "on",
    needsFurnished: form.get("needsFurnished") === "on",
    needsParking: form.get("needsParking") === "on",
    hasPets: form.get("hasPets") === "on",
  };
}

export const wantedSpaceLabels = (stored: string) => stored.split(",").filter(Boolean).map(spaceTypeLabel).filter(Boolean);

export function wantedNeeds(p: { needsPrivateBath: boolean; needsFurnished: boolean; needsParking: boolean; hasPets: boolean }) {
  return [
    p.needsPrivateBath && "Private bath",
    p.needsFurnished && "Furnished",
    p.needsParking && "Parking",
    p.hasPets && "Has a pet",
  ].filter(Boolean) as string[];
}

export async function browseWanted(opts: { metro: string; minBudget?: number; space?: string; moveInBy?: string; query?: string }) {
  const now = new Date();
  const posts = await db.roomWanted.findMany({
    where: {
      ...publicWantedWhere(now),
      metro: opts.metro,
      // Owners filter by their rent: show renters whose budget covers it.
      ...(opts.minBudget ? { budgetMaxCents: { gte: opts.minBudget } } : {}),
      ...(opts.space ? { spaceTypes: { contains: `,${opts.space},` } } : {}),
      ...(opts.moveInBy ? { moveInDate: { lte: opts.moveInBy } } : {}),
    },
    include: { user: { select: { name: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
    take: opts.query ? 2000 : 100,
  });
  const parsed = parseQuery(opts.query ?? "");
  if (!parsed.terms.length) return posts;
  const ranked = rankListings(
    { ...parsed, maxPriceCents: undefined, minPriceCents: undefined },
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      description: `${p.description} ${p.areas} ${wantedSpaceLabels(p.spaceTypes).join(" ")}`,
      category: "ROOM_RENTAL",
      priceCents: p.budgetMaxCents,
      priceUnit: "",
      tags: "",
      vendor: { businessName: "" },
      original: p,
    })),
  );
  return ranked.map((r) => r.item.original).slice(0, 100);
}

// Only the first name is shown publicly.
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "Renter";
