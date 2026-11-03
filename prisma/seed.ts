// Dev seed: an admin account plus sample vendors, listings, reviews, events and room requests (see ./samples).
// Sample vendor logins all use the password "vendor-dev-password"; buyers use "buyer-dev-password".
// Safe to re-run: anything that already exists is left alone.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { localToUtc } from "../src/lib/events";
import { readGarageSale, saleExpiry } from "../src/lib/garage-sales";
import { metroTimeZone } from "../src/lib/metros";
import { SAMPLE_BUYERS, SAMPLE_EVENTS, SAMPLE_REVIEWS, SAMPLE_VENDORS, SAMPLE_WANTED } from "./samples";

const db = new PrismaClient();
const DAY_MS = 86_400_000;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bharathmela.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-dev-password";
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const vendorHash = await bcrypt.hash("vendor-dev-password", 10);
  const now = Date.now();

  for (const s of SAMPLE_VENDORS) {
    if (await db.user.findUnique({ where: { email: s.email } })) continue;
    const user = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: vendorHash,
        emailVerifiedAt: new Date(now),
        phoneVerifiedAt: s.phoneVerified ? new Date(now) : null,
        createdAt: new Date(now - 120 * DAY_MS),
        vendor: {
          create: { businessName: s.businessName, phone: s.phone, whatsapp: !!s.whatsapp, about: s.about ?? "", metro: s.metro, zip: s.zip },
        },
      },
      include: { vendor: true },
    });
    const vendorId = user.vendor!.id;

    if (s.plan !== "FREE") {
      await db.subscription.create({
        data: {
          vendorId,
          plan: s.plan,
          status: "ACTIVE",
          startsAt: new Date(now),
          endsAt: new Date(now + 30 * DAY_MS),
          payment: {
            create: {
              vendorId,
              purpose: "SUBSCRIPTION",
              amountCents: s.plan === "PRO" ? 2499 : 999,
              method: "ZELLE",
              reference: "SEED",
              status: "APPROVED",
              reviewedAt: new Date(now),
            },
          },
        },
      });
    }

    for (const l of s.listings) {
      await db.listing.create({
        data: {
          vendorId,
          title: l.title,
          description: l.description,
          category: l.category,
          priceCents: l.priceCents,
          priceUnit: l.priceUnit,
          tags: l.tags?.length ? `,${l.tags.join(",")},` : "",
          details: JSON.stringify(l.details ?? {}),
          metro: s.metro,
          zip: s.zip,
          featuredUntil: l.featured ? new Date(now + 7 * DAY_MS) : null,
          // Garage sales come down after their last day; everything else after 90 days.
          expiresAt: l.category === "GARAGE_SALE" ? saleExpiry(readGarageSale(JSON.stringify(l.details))!) : new Date(now + 90 * DAY_MS),
        },
      });
    }
  }

  // One vendor waiting for an upgrade approval, so the admin queue has something in it.
  const meena = await db.user.findUnique({ where: { email: "meena.tutor@bharathmela.test" }, include: { vendor: true } });
  if (meena?.vendor && !(await db.payment.count({ where: { vendorId: meena.vendor.id } }))) {
    await db.subscription.create({
      data: {
        vendorId: meena.vendor.id,
        plan: "BASIC",
        payment: {
          create: { vendorId: meena.vendor.id, purpose: "SUBSCRIPTION", amountCents: 999, method: "VENMO", reference: "VENMO-4821" },
        },
      },
    });
  }

  // Sample events, a few days to weeks out, at local times in each city. Added once each, by title.
  const vendorBy = async (email: string) => (await db.user.findUnique({ where: { email }, include: { vendor: true } }))?.vendor;
  // Community events happen on weekends: move each one forward to the Saturday (even offset) or Sunday (odd offset).
  const day = (offset: number, time: string, tz: string) => {
    const base = new Date(now + offset * DAY_MS);
    const toWeekend = (6 - base.getUTCDay() + 7) % 7 + (offset % 2);
    const d = new Date(base.getTime() + toWeekend * DAY_MS).toISOString().slice(0, 10);
    return localToUtc(`${d}T${time}`, tz)!;
  };
  for (const { vendor: email, offset, start, end, ...e } of SAMPLE_EVENTS) {
    const vendor = await vendorBy(email);
    if (!vendor || (await db.event.findFirst({ where: { title: e.title } }))) continue;
    const tz = metroTimeZone(e.metro);
    await db.event.create({ data: { ...e, vendorId: vendor.id, startsAt: day(offset, start, tz), endsAt: day(offset, end, tz) } });
  }

  // Buyers for reviews and room requests (password "buyer-dev-password").
  const buyerHash = await bcrypt.hash("buyer-dev-password", 10);
  const buyers = new Map<string, string>();
  for (const b of SAMPLE_BUYERS) {
    const user = await db.user.upsert({
      where: { email: b.email },
      update: {},
      create: { ...b, role: "BUYER", passwordHash: buyerHash, emailVerifiedAt: new Date(now), createdAt: new Date(now - 60 * DAY_MS) },
    });
    buyers.set(b.email, user.id);
  }

  // Reviews, spread over the last few months.
  for (const [i, r] of SAMPLE_REVIEWS.entries()) {
    const vendor = await vendorBy(r.vendor);
    const buyerId = buyers.get(r.buyer);
    if (!vendor || !buyerId) continue;
    const at = new Date(now - (5 + i * 6) * DAY_MS);
    await db.review.upsert({
      where: { vendorId_buyerId: { vendorId: vendor.id, buyerId } },
      update: {},
      create: {
        vendorId: vendor.id, buyerId, rating: r.rating, comment: r.comment, createdAt: at,
        vendorReply: r.reply ?? "", vendorRepliedAt: r.reply ? new Date(at.getTime() + DAY_MS) : null,
      },
    });
  }

  // "I need a place to live" requests from the sample renter. Added once each, by title.
  const renterId = buyers.get("anil.renter@bharathmela.test")!;
  for (const w of SAMPLE_WANTED) {
    if (await db.roomWanted.findFirst({ where: { title: w.title } })) continue;
    await db.roomWanted.create({
      data: {
        userId: renterId, metro: w.metro, title: w.title, description: w.description, budgetMaxCents: w.budgetMaxCents,
        moveInDate: new Date(now + w.moveIn * DAY_MS).toISOString().slice(0, 10), lease: w.lease, spaceTypes: `,${w.spaceTypes.join(",")},`,
        areas: w.areas, needsPrivateBath: !!w.needsPrivateBath, needsFurnished: !!w.needsFurnished, needsParking: !!w.needsParking, hasPets: false,
        expiresAt: new Date(now + 60 * DAY_MS),
      },
    });
  }
}
main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
