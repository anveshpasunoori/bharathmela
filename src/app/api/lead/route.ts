import { createHash } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const KINDS = new Set(["CALL", "TEXT", "WHATSAPP"]);

// A tap on Call, Text or WhatsApp (sent in the background by TrackedContactLink). Each visitor counts once a
// day per seller and kind; the seller's own taps don't count.
export async function POST(req: Request) {
  let body: { vendorId?: string; listingId?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { vendorId, listingId, kind } = body;
  if (!vendorId || !kind || !KINDS.has(kind) || !/^[a-z0-9]{10,40}$/.test(vendorId)) return new Response(null, { status: 400 });
  const [vendor, viewer] = await Promise.all([db.vendorProfile.findUnique({ where: { id: vendorId }, select: { userId: true } }), getCurrentUser()]);
  if (!vendor || viewer?.id === vendor.userId) return new Response(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  const who = viewer?.id ?? `${await clientIp()}|${req.headers.get("user-agent") ?? ""}`;
  const visitorKey = createHash("sha256").update(`${who}|${day}`).digest("hex").slice(0, 32);
  const listing = listingId && /^[a-z0-9]{10,40}$/.test(listingId) ? await db.listing.findFirst({ where: { id: listingId, vendorId }, select: { id: true } }) : null;
  await db.lead
    .create({ data: { vendorId, listingId: listing?.id ?? null, kind, visitorKey } })
    .catch(() => {}); // already counted today
  return new Response(null, { status: 204 });
}
