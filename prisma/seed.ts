// Dev seed: an admin account plus a few sample vendors and listings.
// Sample vendor logins all use the password "vendor-dev-password".
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY_MS = 86_400_000;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@desibazaar.test";
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

  const samples = [
    {
      email: "lakshmi@desibazaar.test",
      name: "Lakshmi R",
      businessName: "Lakshmi's Andhra Kitchen",
      phone: "(408) 555-0141",
      metro: "bay-area",
      zip: "95054",
      plan: "PRO",
      listings: [
        { title: "Weekly Andhra meal box (5 days)", category: "FOOD", priceCents: 7500, priceUnit: "per week", featured: true,
          description: "Home-style rice, dal, curry, pickle and curd. Pickup in Santa Clara or delivery within 5 miles." },
        { title: "Party orders – biryani trays", category: "FOOD", priceCents: 9000, priceUnit: "per tray (serves 10)", featured: false,
          description: "Chicken or veg dum biryani. Order 3 days ahead." },
      ],
    },
    {
      email: "pandit.sharma@desibazaar.test",
      name: "Ravi Sharma",
      businessName: "Pandit Ravi Sharma",
      phone: "(510) 555-0199",
      metro: "bay-area",
      zip: "94538",
      plan: "BASIC",
      listings: [
        { title: "Griha Pravesh & Satyanarayan Puja", category: "PUJARI", priceCents: 25100, priceUnit: "per puja", featured: false,
          description: "Telugu, Hindi and Sanskrit. Samagri list provided; can bring samagri for an extra fee." },
      ],
    },
    {
      email: "sruthi.arts@desibazaar.test",
      name: "Sruthi V",
      businessName: "Sruthi Laya Kala Kendra",
      phone: "(408) 555-0177",
      metro: "bay-area",
      zip: "95129",
      plan: "FREE",
      listings: [
        { title: "Bharatanatyam & Carnatic vocal classes", category: "DANCE_MUSIC", priceCents: 12000, priceUnit: "per month", featured: false,
          description: "Weekly group classes for ages 6+ in West San Jose. Arangetram preparation available." },
      ],
    },
    {
      email: "venkat.rooms@desibazaar.test",
      name: "Venkat P",
      businessName: "Venkat P",
      phone: "(408) 555-0162",
      metro: "bay-area",
      zip: "95051",
      plan: "FREE",
      listings: [
        { title: "Private room in 3BR house near Lawrence Expwy", category: "ROOM_RENTAL", priceCents: 140000, priceUnit: "per month", featured: false,
          description: "Furnished room with shared bath, utilities and Wi-Fi included. Walk to Caltrain. Available Dec 1." },
      ],
    },
    {
      email: "meena.tutor@desibazaar.test",
      name: "Meena K",
      businessName: "Meena's Math & Telugu Classes",
      phone: "(972) 555-0123",
      metro: "dallas",
      zip: "75024",
      plan: "FREE",
      listings: [
        { title: "Kumon-style math tutoring, grades 1–8", category: "TUTORING", priceCents: 3000, priceUnit: "per hour", featured: false,
          description: "Small groups in Plano or online. Free trial class." },
      ],
    },
  ];

  for (const s of samples) {
    if (await db.user.findUnique({ where: { email: s.email } })) continue;
    const user = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: vendorHash,
        emailVerifiedAt: new Date(now),
        vendor: { create: { businessName: s.businessName, phone: s.phone, metro: s.metro, zip: s.zip } },
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
          metro: s.metro,
          zip: s.zip,
          featuredUntil: l.featured ? new Date(now + 7 * DAY_MS) : null,
        },
      });
    }
  }

  // One vendor waiting for an upgrade approval, so the admin queue has something in it.
  const meena = await db.user.findUnique({ where: { email: "meena.tutor@desibazaar.test" }, include: { vendor: true } });
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
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
