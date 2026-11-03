// Dev seed: an admin account plus a few sample vendors and listings.
// Sample vendor logins all use the password "vendor-dev-password".
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { localToUtc } from "../src/lib/events";

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
          tags: ",VEGETARIAN,EGGLESS,NUT_FREE,",
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
          details: "{\"spaceType\": \"PRIVATE_ROOM\", \"availableFrom\": \"2026-12-01\", \"lease\": \"6_MONTHS\", \"depositCents\": 100000, \"utilities\": \"INCLUDED\", \"bathroom\": \"SHARED\", \"furnished\": \"FURNISHED\", \"parking\": \"DRIVEWAY\", \"laundry\": \"IN_UNIT\", \"bedrooms\": null, \"bathrooms\": null, \"neighborhood\": \"Lawrence Expwy & El Camino\", \"amenities\": [\"WIFI\", \"AC\", \"KITCHEN\", \"NEAR_TRANSIT\"], \"houseRules\": [\"NO_SMOKING\", \"QUIET_HOURS\"], \"ownerOccupied\": true, \"roommateGender\": \"ANY\"}",
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
          tags: "tags" in l ? l.tags : "",
          details: "details" in l ? l.details : "{}",
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

  // Sample events, a few days to weeks out, at local times in each city.
  if (!(await db.event.count())) {
    const vendorBy = async (email: string) => (await db.user.findUnique({ where: { email }, include: { vendor: true } }))?.vendor;
    const day = (offset: number, time: string, tz: string) => {
      const d = new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10);
      return localToUtc(`${d}T${time}`, tz)!;
    };
    const PT = "America/Los_Angeles";
    const CT = "America/Chicago";
    const events = [
      { email: "lakshmi@desibazaar.test", metro: "bay-area", tz: PT, offset: 5, start: "11:00", end: "20:00",
        title: "Diwali Mela 2026 – food stalls, dance & fireworks show", type: "FESTIVAL", festival: "Diwali",
        description: "Family Diwali celebration with 30+ food and shopping stalls, classical and Bollywood dance performances, rangoli contest for kids and a fireworks show at 7:30 PM. Free parking.",
        venueName: "Santa Clara Convention Center", address: "5001 Great America Pkwy, Santa Clara, CA 95054", isFree: false, priceCents: 1000,
        ticketUrl: "https://www.eventbrite.com/e/diwali-mela-sample" },
      { email: "sruthi.arts@desibazaar.test", metro: "bay-area", tz: PT, offset: 9, start: "17:30", end: "20:30",
        title: "Carnatic vocal concert & student Bharatanatyam recital", type: "CONCERT", festival: "",
        description: "Annual recital by students of Sruthi Laya Kala Kendra, followed by a Carnatic vocal concert with violin and mridangam accompaniment. All are welcome.",
        venueName: "Cupertino Community Hall", address: "10350 Torre Ave, Cupertino, CA 95014", isFree: true, priceCents: null, ticketUrl: "" },
      { email: "pandit.sharma@desibazaar.test", metro: "bay-area", tz: PT, offset: 3, start: "10:00", end: "13:00",
        title: "Community Satyanarayan Puja & prasadam", type: "RELIGIOUS", festival: "",
        description: "Monthly community Satyanarayan Vratham with katha in Telugu and Hindi. Families can sponsor a kalasham. Prasadam lunch served after the puja.",
        venueName: "Fremont Community Center", address: "40204 Paseo Padre Pkwy, Fremont, CA 94538", isFree: true, priceCents: null, ticketUrl: "" },
      { email: "meena.tutor@desibazaar.test", metro: "dallas", tz: CT, offset: 12, start: "19:00", end: "23:00",
        title: "Navratri Garba & Dandiya Night", type: "FESTIVAL", festival: "Navratri / Garba / Dandiya",
        description: "Live dhol and singers, garba and dandiya raas for all ages, dandiya sticks available at the door, Gujarati snacks on sale.",
        venueName: "Plano Event Center", address: "2000 E Spring Creek Pkwy, Plano, TX 75074", isFree: false, priceCents: 1500,
        ticketUrl: "https://www.eventbrite.com/e/garba-night-sample" },
    ];
    for (const e of events) {
      const vendor = await vendorBy(e.email);
      if (!vendor) continue;
      await db.event.create({
        data: {
          vendorId: vendor.id, metro: e.metro, title: e.title, type: e.type, festival: e.festival, description: e.description,
          startsAt: day(e.offset, e.start, e.tz), endsAt: day(e.offset, e.end, e.tz), venueName: e.venueName, address: e.address,
          isFree: e.isFree, priceCents: e.priceCents, ticketUrl: e.ticketUrl,
        },
      });
    }
  }

  // Sample "I need a place" requests from a seeded renter (password "buyer-dev-password").
  if (!(await db.roomWanted.count())) {
    const renter = await db.user.upsert({
      where: { email: "anil.renter@desibazaar.test" },
      update: {},
      create: {
        email: "anil.renter@desibazaar.test",
        name: "Anil Kumar",
        role: "BUYER",
        passwordHash: await bcrypt.hash("buyer-dev-password", 10),
        emailVerifiedAt: new Date(now),
        createdAt: new Date(now - 30 * DAY_MS),
      },
    });
    const soon = (days: number) => new Date(now + days * DAY_MS).toISOString().slice(0, 10);
    await db.roomWanted.createMany({
      data: [
        {
          userId: renter.id, metro: "bay-area", title: "Software engineer looking for a room near Sunnyvale from December",
          description: "Moving from Hyderabad for a new job in Sunnyvale. Quiet, non-smoker, I cook simple vegetarian food and keep shared spaces clean. Looking to stay at least 6 months.",
          budgetMaxCents: 140000, moveInDate: soon(25), lease: "6_MONTHS", spaceTypes: ",PRIVATE_ROOM,PAYING_GUEST,",
          areas: "Sunnyvale, Santa Clara, Mountain View", needsPrivateBath: false, needsFurnished: true, needsParking: false, hasPets: false,
          expiresAt: new Date(now + 60 * DAY_MS),
        },
        {
          userId: renter.id, metro: "dallas", title: "Grad student needs a shared room near UT Dallas",
          description: "Masters student starting in January. Looking for a shared or private room within biking distance of UT Dallas. Flexible on lease length.",
          budgetMaxCents: 70000, moveInDate: soon(45), lease: "FLEXIBLE", spaceTypes: ",SHARED_ROOM,PRIVATE_ROOM,",
          areas: "Richardson, near UTD", needsPrivateBath: false, needsFurnished: false, needsParking: false, hasPets: false,
          expiresAt: new Date(now + 60 * DAY_MS),
        },
      ],
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
