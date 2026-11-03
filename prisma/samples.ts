// Sample vendors and listings for the dev seed: every category in the SF Bay Area and Jacksonville,
// plus a spread across other cities. All names, phones (555-01xx) and emails (.test) are made up.

type Plan = "FREE" | "BASIC" | "PRO";

export type SampleListing = {
  title: string;
  category: string;
  priceCents: number | null;
  priceUnit: string;
  description: string;
  featured?: boolean;
  tags?: string[]; // dietary markers for FOOD
  details?: Record<string, unknown>; // rental, professional or event-service details
};

export type SampleVendor = {
  email: string;
  name: string;
  businessName: string;
  phone: string;
  metro: string;
  zip: string;
  plan: Plan;
  about?: string;
  whatsapp?: boolean;
  phoneVerified?: boolean;
  listings: SampleListing[];
};

const rental = (d: Partial<Record<string, unknown>>) => ({
  spaceType: "PRIVATE_ROOM", availableFrom: "2026-12-01", lease: "6_MONTHS", depositCents: null, utilities: "INCLUDED",
  bathroom: "SHARED", furnished: "FURNISHED", parking: "DRIVEWAY", laundry: "IN_UNIT", bedrooms: null, bathrooms: null,
  neighborhood: "", amenities: [], houseRules: [], ownerOccupied: false, roommateGender: "ANY", ...d,
});

const pro = (d: Partial<Record<string, unknown>>) => ({
  licenseNumber: "", licenseState: "", firm: "", specialties: [], languages: ["English"], freeConsultation: false,
  yearsExperience: null, ...d,
});

const eventSvc = (d: Partial<Record<string, unknown>>) => ({
  services: [], rentalItems: [], delivery: false, occasions: [], areasServed: "", languages: ["English"], insured: false,
  yearsExperience: null, ...d,
});

// Garage sale samples run on the next weekend after seeding, so they're always upcoming.
const nextWeekend = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7));
  const sat = d.toISOString().slice(0, 10);
  const sun = new Date(d.getTime() + 86_400_000).toISOString().slice(0, 10);
  return { sat, sun };
};

export const SAMPLE_VENDORS: SampleVendor[] = [
  // ── SF Bay Area ────────────────────────────────────────────────────────────
  {
    email: "lakshmi@bharathmela.test", name: "Lakshmi R", businessName: "Lakshmi's Andhra Kitchen", phone: "(408) 555-0141",
    metro: "bay-area", zip: "95054", plan: "PRO", whatsapp: true, phoneVerified: true,
    about: "Home cook from Vijayawada, cooking for Bay Area families since 2018. County-registered home kitchen.",
    listings: [
      { title: "Weekly Andhra meal box (5 days)", category: "FOOD", priceCents: 7500, priceUnit: "per week", featured: true,
        tags: ["VEGETARIAN", "EGGLESS", "NUT_FREE"],
        description: "Home-style rice, dal, curry, pickle and curd. Pickup in Santa Clara or delivery within 5 miles." },
      { title: "Party orders – biryani trays", category: "FOOD", priceCents: 9000, priceUnit: "per tray (serves 10)",
        tags: ["HALAL"],
        description: "Chicken or veg dum biryani. Order 3 days ahead." },
    ],
  },
  {
    email: "gujarati.thali@bharathmela.test", name: "Hetal Shah", businessName: "Hetal's Jain Thali", phone: "(408) 555-0145",
    metro: "bay-area", zip: "95035", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Jain & Gujarati thali – no onion, no garlic", category: "FOOD", priceCents: 1400, priceUnit: "per plate",
        tags: ["VEGETARIAN", "JAIN", "EGGLESS"],
        description: "Rotli, dal, shaak, kadhi, rice and a sweet. Made fresh daily; order by 10 AM for same-day pickup in Milpitas." },
      { title: "Vegan millet snack boxes", category: "FOOD", priceCents: 1800, priceUnit: "per box",
        tags: ["VEGAN", "GLUTEN_FREE", "ORGANIC", "DAIRY_FREE"],
        description: "Ragi chakli, jowar puffs and roasted makhana made with organic millets. Great for school lunch boxes." },
    ],
  },
  {
    email: "pandit.sharma@bharathmela.test", name: "Ravi Sharma", businessName: "Pandit Ravi Sharma", phone: "(510) 555-0199",
    metro: "bay-area", zip: "94538", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Griha Pravesh & Satyanarayan Puja", category: "PUJARI", priceCents: 25100, priceUnit: "per puja",
        description: "Telugu, Hindi and Sanskrit. Samagri list provided; can bring samagri for an extra fee." },
    ],
  },
  {
    email: "sruthi.arts@bharathmela.test", name: "Sruthi V", businessName: "Sruthi Laya Kala Kendra", phone: "(408) 555-0177",
    metro: "bay-area", zip: "95129", plan: "FREE",
    listings: [
      { title: "Bharatanatyam & Carnatic vocal classes", category: "DANCE_MUSIC", priceCents: 12000, priceUnit: "per month",
        description: "Weekly group classes for ages 6+ in West San Jose. Arangetram preparation available." },
    ],
  },
  {
    email: "abacus.kids@bharathmela.test", name: "Deepa Iyer", businessName: "Bright Minds Abacus & Coding", phone: "(408) 555-0109",
    metro: "bay-area", zip: "95014", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Abacus, mental math and Scratch coding for kids 6–12", category: "TUTORING", priceCents: 4000, priceUnit: "per class",
        description: "Small groups of up to 6 in Cupertino, or live online. Free trial class and a progress report every month." },
      { title: "SAT math & AP Calculus tutoring", category: "TUTORING", priceCents: 6000, priceUnit: "per hour",
        description: "One-on-one tutoring by a former high-school math teacher. Practice tests and weekly feedback to parents." },
    ],
  },
  {
    email: "seva.help@bharathmela.test", name: "Kamala Devi", businessName: "Kamala Devi", phone: "(510) 555-0114",
    metro: "bay-area", zip: "94539", plan: "FREE", whatsapp: true,
    listings: [
      { title: "Experienced nanny and cook – weekdays", category: "DOMESTIC_HELP", priceCents: 2500, priceUnit: "per hour",
        description: "12 years caring for babies and toddlers. I can cook South and North Indian vegetarian meals. CPR certified, references available. Speaks Tamil, Telugu, Hindi and English." },
    ],
  },
  {
    email: "venkat.rooms@bharathmela.test", name: "Venkat P", businessName: "Venkat P", phone: "(408) 555-0162",
    metro: "bay-area", zip: "95051", plan: "FREE", phoneVerified: true,
    listings: [
      { title: "Private room in 3BR house near Lawrence Expwy", category: "ROOM_RENTAL", priceCents: 140000, priceUnit: "per month",
        details: rental({ depositCents: 100000, neighborhood: "Lawrence Expwy & El Camino", amenities: ["WIFI", "AC", "KITCHEN", "NEAR_TRANSIT"],
          houseRules: ["NO_SMOKING", "QUIET_HOURS"], ownerOccupied: true }),
        description: "Furnished room with shared bath, utilities and Wi-Fi included. Walk to Caltrain. Available Dec 1." },
      { title: "1BR in-law unit with private entrance, Sunnyvale", category: "ROOM_RENTAL", priceCents: 235000, priceUnit: "per month",
        details: rental({ spaceType: "IN_LAW", lease: "12_MONTHS", depositCents: 235000, utilities: "PARTLY", bathroom: "PRIVATE",
          furnished: "UNFURNISHED", bedrooms: 1, bathrooms: 1, neighborhood: "Cherry Chase", amenities: ["WIFI", "KITCHEN", "BACKYARD"],
          houseRules: ["NO_SMOKING", "PETS_OK"] }),
        description: "Separate 1-bedroom unit behind our house with its own kitchen, bath and entrance. Water and trash included." },
    ],
  },
  {
    email: "priya.realtor@bharathmela.test", name: "Priya Nair", businessName: "Priya Nair Realty", phone: "(408) 555-0188",
    metro: "bay-area", zip: "95014", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Your Bay Area home buying & selling partner", category: "REALTOR", priceCents: null, priceUnit: "",
        details: pro({ licenseNumber: "02123456", licenseState: "CA", firm: "Coldwell Banker Realty",
          specialties: ["BUYING", "SELLING", "FIRST_TIME", "RELOCATION"], languages: ["English", "Hindi", "Malayalam"], freeConsultation: true, yearsExperience: 11 }),
        description: "Helping first-time buyers and relocating families find homes near good schools and short commutes across the South Bay. Free first meeting to walk through budget, loan pre-approval and neighborhoods." },
    ],
  },
  {
    email: "rao.law@bharathmela.test", name: "Srinivas Rao", businessName: "Rao Immigration Law, PC", phone: "(650) 555-0175",
    metro: "bay-area", zip: "94043", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Immigration & family law attorney – H-1B, green card, citizenship", category: "LEGAL", priceCents: 25000, priceUnit: "per hour",
        details: pro({ licenseNumber: "289412", licenseState: "CA", firm: "Rao Immigration Law, PC", specialties: ["IMMIGRATION", "FAMILY", "NRI"],
          languages: ["English", "Telugu", "Hindi"], freeConsultation: true, yearsExperience: 15 }),
        description: "15 years handling H-1B, PERM and green card cases, citizenship, and family matters, plus India property and power-of-attorney questions for NRIs. Free 30-minute first consultation by phone or video." },
    ],
  },
  {
    email: "lens.lights@bharathmela.test", name: "Karthik Reddy", businessName: "Lens & Lights Studio", phone: "(408) 555-0133",
    metro: "bay-area", zip: "95131", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Candid wedding photography & films", category: "EVENT_SERVICES", priceCents: 250000, priceUnit: "starting at", featured: true,
        details: eventSvc({ services: ["PHOTOGRAPHY", "VIDEOGRAPHY"], occasions: ["WEDDING", "SANGEET", "HALDI_MEHNDI", "RECEPTION", "BABY_SHOWER"],
          areasServed: "Bay Area, Sacramento", languages: ["English", "Telugu", "Hindi"], insured: true, yearsExperience: 9 }),
        description: "Candid photos and cinematic films for weddings, sangeet, haldi and baby showers. Full-day coverage with two shooters, drone add-on and a highlight film in 3 weeks." },
    ],
  },
  {
    email: "baraat.beats@bharathmela.test", name: "Harpreet Singh", businessName: "Baraat Beats DJ & Decor", phone: "(510) 555-0156",
    metro: "bay-area", zip: "94587", plan: "BASIC",
    listings: [
      { title: "DJ, dhol & stage decor for sangeet and receptions", category: "EVENT_SERVICES", priceCents: 120000, priceUnit: "starting at",
        details: eventSvc({ services: ["DJ", "LIGHTING", "DECOR", "DHOL"], occasions: ["WEDDING", "SANGEET", "RECEPTION", "BIRTHDAY", "CORPORATE"],
          areasServed: "Bay Area and Central Valley", languages: ["English", "Hindi", "Punjabi"], insured: true, yearsExperience: 12 }),
        description: "Bollywood, Punjabi and Tollywood DJ with dance-floor lighting, live dhol for baraat entries and stage and mandap decor packages." },
    ],
  },
  {
    email: "utsav.rentals@bharathmela.test", name: "Lakshmi Narayanan", businessName: "Utsav Party Rentals", phone: "(408) 555-0122",
    metro: "bay-area", zip: "95035", plan: "FREE",
    listings: [
      { title: "Party rentals: tents, mandap, jhoola & bounce houses", category: "EVENT_SERVICES", priceCents: 20000, priceUnit: "starting at",
        details: eventSvc({ services: ["RENTALS", "DECOR"], rentalItems: ["TENTS", "TABLES_CHAIRS", "LINENS", "MANDAP", "THRONE_JHOOLA", "SERVING", "BOUNCE"],
          delivery: true, occasions: ["WEDDING", "BIRTHDAY", "HOUSEWARMING", "FESTIVAL", "BABY_SHOWER"], areasServed: "South Bay and East Bay",
          languages: ["English", "Tamil"], insured: true, yearsExperience: 6 }),
        description: "Tents, tables and chairs, linens, chafing dishes, mandap and jhoola rentals, plus kids' bounce houses. We deliver, set up and pick up." },
    ],
  },
  {
    email: "rangoli.art@bharathmela.test", name: "Ananya Ghosh", businessName: "Rangoli & Canvas", phone: "(650) 555-0127",
    metro: "bay-area", zip: "94086", plan: "FREE",
    listings: [
      { title: "Hand-painted Madhubani and Tanjore paintings", category: "ART", priceCents: 18000, priceUnit: "per item",
        description: "Original Madhubani on handmade paper and Tanjore-style paintings with gold foil. Custom sizes and names on request; 3–4 weeks." },
      { title: "Diwali diya and rangoli workshop for kids", category: "ART", priceCents: 3500, priceUnit: "per child",
        description: "2-hour hands-on workshop in Sunnyvale: paint your own clay diyas and learn a simple rangoli. All materials included." },
    ],
  },
  {
    email: "silk.threads@bharathmela.test", name: "Revathi S", businessName: "Silk Threads Boutique", phone: "(408) 555-0190",
    metro: "bay-area", zip: "95136", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Kanjeevaram and soft silk sarees – home boutique", category: "CLOTHING", priceCents: 22000, priceUnit: "starting at", featured: true,
        description: "Pure silk sarees from Kanchipuram and Dharmavaram, with silk mark. Visit by appointment in San Jose; blouse stitching available." },
      { title: "Kids' lehengas and pattu pavadai", category: "CLOTHING", priceCents: 4500, priceUnit: "per item",
        description: "Festival outfits for girls ages 2–12. Sizes in stock; alterations included." },
    ],
  },
  {
    email: "desi.pantry@bharathmela.test", name: "Mohan Das", businessName: "Desi Pantry Pickles & Podis", phone: "(510) 555-0108",
    metro: "bay-area", zip: "94555", plan: "FREE",
    listings: [
      { title: "Homemade mango avakaya and gongura pickles", category: "GOODS", priceCents: 1200, priceUnit: "per 500 g jar",
        description: "Made in small batches with cold-pressed sesame oil. Also karam podi and idli podi. Pickup in Fremont or shipped in California." },
    ],
  },

  {
    email: "fixit.home@bharathmela.test", name: "Suresh Babu", businessName: "FixIt Home Services", phone: "(408) 555-0151",
    metro: "bay-area", zip: "95050", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Licensed electrician and handyman – same-week visits", category: "HOME_SERVICES", priceCents: 9500, priceUnit: "per visit", featured: true,
        tags: ["ELECTRICAL", "HANDYMAN", "APPLIANCE"],
        description: "CA-licensed electrical contractor (license in profile). Outlets, ceiling fans, EV chargers, TV mounting, furniture assembly and small repairs. Insured; written estimate before any job." },
    ],
  },
  {
    email: "bay.auto@bharathmela.test", name: "Manoj Pillai", businessName: "Manoj Mobile Mechanic", phone: "(510) 555-0136",
    metro: "bay-area", zip: "94536", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Mobile mechanic – oil change, brakes and batteries at your home", category: "AUTO", priceCents: 6000, priceUnit: "starting at",
        tags: ["MECHANIC", "OIL_CHANGE"],
        description: "ASE-certified mechanic, 14 years. Oil changes, brake pads, batteries and check-engine diagnostics in your driveway across Fremont, Newark and Union City. Written estimate first." },
      { title: "Driving lessons for new arrivals and teens", category: "AUTO", priceCents: 7000, priceUnit: "per lesson",
        tags: ["DRIVING_LESSONS"],
        description: "State-licensed instructor with a dual-control car. Freeway practice, parallel parking and DMV test route prep. Lessons in English, Hindi and Malayalam." },
    ],
  },
  {
    email: "glow.beauty@bharathmela.test", name: "Pooja Mehta", businessName: "Glow by Pooja", phone: "(408) 555-0119",
    metro: "bay-area", zip: "95131", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Eyebrow threading and bridal makeup – home studio", category: "BEAUTY", priceCents: 1200, priceUnit: "starting at",
        tags: ["THREADING", "BRIDAL_MAKEUP", "SAREE_DRAPING"],
        description: "Licensed esthetician. Threading in my North San Jose home studio, and bridal and party makeup with saree draping at your venue. Single-use supplies, clean tools every time." },
    ],
  },
  {
    email: "bay.tax@bharathmela.test", name: "Ramya Krishnan", businessName: "Krishnan Tax & Books, EA", phone: "(650) 555-0128",
    metro: "bay-area", zip: "94086", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Enrolled Agent – H-1B, NRI and small business taxes", category: "TAX_FINANCE", priceCents: 20000, priceUnit: "starting at",
        tags: ["TAX_FILING", "FBAR", "BUSINESS_TAX", "ITIN"],
        description: "IRS Enrolled Agent with a PTIN. Federal and California returns, FBAR and FATCA for India accounts, ITIN applications for spouses and parents, and LLC returns. Flat fees quoted up front." },
    ],
  },
  {
    email: "bay.travel@bharathmela.test", name: "Anand Rao", businessName: "Namaste Travels", phone: "(408) 555-0174",
    metro: "bay-area", zip: "95054", plan: "FREE",
    listings: [
      { title: "India flight tickets and travel companions for parents", category: "TRAVEL", priceCents: 2500, priceUnit: "booking fee",
        tags: ["TICKETS", "COMPANION"],
        description: "Registered California seller of travel. Fares to Hyderabad, Bengaluru, Chennai, Delhi and Mumbai, and we match your parents with a vetted travel companion on the same flight. Pay the airline fare by card." },
    ],
  },

  {
    email: "bay.moving@bharathmela.test", name: "Neha Gupta", businessName: "Neha Gupta", phone: "(408) 555-0103",
    metro: "bay-area", zip: "94089", plan: "FREE",
    listings: [
      { title: "Moving to India sale – furniture, kitchen, kids' stuff", category: "GARAGE_SALE", priceCents: 200, priceUnit: "items from",
        tags: ["FURNITURE", "KITCHEN", "KIDS", "INDIAN"],
        details: { startDate: nextWeekend().sat, endDate: nextWeekend().sun, hours: "9 AM – 2 PM", address: "Sunnyvale, near Lawrence & Tasman" },
        description: "Everything must go before our move back to Pune: sofa set, dining table, Instant Pot, mixer-grinder, kids' bikes and toys, brass diyas and a pooja mandir. Cash or Zelle at pickup." },
    ],
  },

  // ── Jacksonville, FL ───────────────────────────────────────────────────────
  {
    email: "jax.kitchen@bharathmela.test", name: "Sowmya K", businessName: "Sowmya's Kitchen", phone: "(904) 555-0131",
    metro: "jacksonville", zip: "32082", plan: "PRO", whatsapp: true, phoneVerified: true,
    about: "Andhra and Tamil home cooking in Ponte Vedra Beach. Florida cottage food registered.",
    listings: [
      { title: "Weekday tiffin service – Ponte Vedra & Nocatee", category: "FOOD", priceCents: 6500, priceUnit: "per week", featured: true,
        tags: ["VEGETARIAN", "EGGLESS"],
        description: "Lunch box Monday to Friday: chapati or rice, dal, sabzi, curd and salad. Delivered to Ponte Vedra Beach, Nocatee and St. Johns." },
      { title: "Weekend dosa and idli batter", category: "FOOD", priceCents: 900, priceUnit: "per quart",
        tags: ["VEGAN", "GLUTEN_FREE", "DAIRY_FREE"],
        description: "Stone-ground batter made Friday nights. Pickup Saturday mornings in Ponte Vedra Beach." },
    ],
  },
  {
    email: "jax.biryani@bharathmela.test", name: "Imran Ahmed", businessName: "Hyderabadi Handi", phone: "(904) 555-0152",
    metro: "jacksonville", zip: "32256", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Hyderabadi dum biryani – family packs", category: "FOOD", priceCents: 3500, priceUnit: "per family pack (serves 4)",
        tags: ["HALAL"],
        description: "Chicken, goat or veg dum biryani with mirchi ka salan and raita. Order by Thursday for weekend pickup near Southside." },
    ],
  },
  {
    email: "jax.tutor@bharathmela.test", name: "Ramesh Venkat", businessName: "Ramesh Math & Science", phone: "(904) 555-0143",
    metro: "jacksonville", zip: "32259", plan: "FREE",
    listings: [
      { title: "Math and science tutoring, grades 5–12", category: "TUTORING", priceCents: 4500, priceUnit: "per hour",
        description: "Algebra, geometry, physics and chemistry. In St. Johns or online. Helps with FAST and SAT prep." },
      { title: "Telugu reading and writing for kids", category: "TUTORING", priceCents: 8000, priceUnit: "per month",
        description: "Weekend classes for ages 5–12 using the Manabadi curriculum. Small online groups." },
    ],
  },
  {
    email: "jax.nritya@bharathmela.test", name: "Kavya Menon", businessName: "Nrityalaya Jacksonville", phone: "(904) 555-0166",
    metro: "jacksonville", zip: "32224", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Kuchipudi and Bollywood dance classes", category: "DANCE_MUSIC", priceCents: 9000, priceUnit: "per month",
        description: "Classical Kuchipudi for ages 5+, and fun Bollywood fitness for adults on Saturday mornings. Beach Blvd studio." },
      { title: "Hindustani vocal and harmonium lessons", category: "DANCE_MUSIC", priceCents: 3500, priceUnit: "per lesson",
        description: "Private lessons for beginners and intermediate students, in person or on Zoom." },
    ],
  },
  {
    email: "jax.pujari@bharathmela.test", name: "Subrahmanya Sastry", businessName: "Sastry Garu – Vedic Pujas", phone: "(904) 555-0118",
    metro: "jacksonville", zip: "32257", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Housewarming, Satyanarayana Vratam and naming ceremonies", category: "PUJARI", priceCents: 20100, priceUnit: "per puja",
        description: "Telugu and Sanskrit pujas across Jacksonville, St. Augustine and Ponte Vedra. Samagri list sent in advance." },
      { title: "Wedding and seemantham ceremonies", category: "PUJARI", priceCents: 50100, priceUnit: "starting at",
        description: "Full wedding rituals and seemantham with explanations in English for guests. Travel within 60 miles included." },
    ],
  },
  {
    email: "jax.help@bharathmela.test", name: "Saraswathi M", businessName: "Saraswathi M", phone: "(904) 555-0125",
    metro: "jacksonville", zip: "32258", plan: "FREE", whatsapp: true,
    listings: [
      { title: "Cooking help and elder care – part time", category: "DOMESTIC_HELP", priceCents: 2000, priceUnit: "per hour",
        description: "Can cook daily meals and help seniors with walks and medicine reminders. 8 years of experience; references available. Speaks Telugu, Kannada and English." },
      { title: "Postpartum care and newborn help", category: "DOMESTIC_HELP", priceCents: 2800, priceUnit: "per hour",
        description: "Traditional postpartum meals, a traditional oil bath for the baby, and night help for the first weeks after delivery." },
    ],
  },
  {
    email: "jax.rooms@bharathmela.test", name: "Naveen R", businessName: "Naveen R", phone: "(904) 555-0137",
    metro: "jacksonville", zip: "32256", plan: "FREE", phoneVerified: true,
    listings: [
      { title: "Furnished private room near Deerwood Park offices", category: "ROOM_RENTAL", priceCents: 85000, priceUnit: "per month",
        details: rental({ depositCents: 50000, lease: "MONTH_TO_MONTH", parking: "ASSIGNED", neighborhood: "Deerwood / Southside",
          amenities: ["WIFI", "AC", "KITCHEN", "GYM", "POOL"], houseRules: ["NO_SMOKING", "NO_PARTIES"], ownerOccupied: true }),
        description: "Room in a 3BR apartment, 5 minutes from Deerwood Park and Baymeadows offices. Gym and pool in the community." },
      { title: "2BR townhouse in Nocatee – whole unit", category: "ROOM_RENTAL", priceCents: 220000, priceUnit: "per month",
        details: rental({ spaceType: "TOWNHOUSE", availableFrom: "2027-01-01", lease: "12_MONTHS", depositCents: 220000, utilities: "EXTRA",
          bathroom: "PRIVATE", furnished: "UNFURNISHED", parking: "GARAGE", bedrooms: 2, bathrooms: 2.5, neighborhood: "Nocatee",
          amenities: ["AC", "DISHWASHER", "POOL", "BACKYARD"], houseRules: ["NO_SMOKING", "PETS_OK"] }),
        description: "Two-bedroom townhouse with a one-car garage in an A-rated school zone. Community pools and splash park." },
    ],
  },
  {
    email: "jax.realtor@bharathmela.test", name: "Sunita Patel", businessName: "Sunita Patel, First Coast Homes", phone: "(904) 555-0181",
    metro: "jacksonville", zip: "32081", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Buying in Nocatee, St. Johns or Ponte Vedra? Let's talk", category: "REALTOR", priceCents: null, priceUnit: "", featured: true,
        details: pro({ licenseNumber: "SL3456789", licenseState: "FL", firm: "Keller Williams First Coast",
          specialties: ["BUYING", "SELLING", "NEW_CONSTRUCTION", "RELOCATION"], languages: ["English", "Gujarati", "Hindi"], freeConsultation: true, yearsExperience: 8 }),
        description: "Relocating to Northeast Florida? I help families compare new construction and resale homes in St. Johns County, with honest advice on HOA fees, flood zones and insurance." },
    ],
  },
  {
    email: "jax.law@bharathmela.test", name: "Arjun Mehta", businessName: "Mehta Law Group", phone: "(904) 555-0170",
    metro: "jacksonville", zip: "32202", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Business formation, contracts and estate planning", category: "LEGAL", priceCents: 30000, priceUnit: "per hour",
        details: pro({ licenseNumber: "1023456", licenseState: "FL", firm: "Mehta Law Group", specialties: ["BUSINESS", "ESTATE", "REAL_ESTATE"],
          languages: ["English", "Hindi", "Gujarati"], freeConsultation: true, yearsExperience: 10 }),
        description: "LLC setup, partnership agreements, commercial leases, wills and trusts. Flat-fee packages for small businesses. Free 20-minute first call." },
    ],
  },
  {
    email: "jax.events@bharathmela.test", name: "Nikhil Rao", businessName: "First Coast Shaadi Events", phone: "(904) 555-0149",
    metro: "jacksonville", zip: "32246", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Wedding decor, mandap and DJ packages", category: "EVENT_SERVICES", priceCents: 150000, priceUnit: "starting at",
        details: eventSvc({ services: ["DECOR", "DJ", "LIGHTING", "PLANNING"], occasions: ["WEDDING", "SANGEET", "RECEPTION", "ENGAGEMENT"],
          areasServed: "Jacksonville, St. Augustine, Amelia Island", languages: ["English", "Hindi", "Telugu"], insured: true, yearsExperience: 7 }),
        description: "Beach and ballroom weddings: mandap, floral decor, uplighting and a DJ for sangeet and reception. Day-of coordination included." },
      { title: "Mehndi artist for brides and parties", category: "EVENT_SERVICES", priceCents: 30000, priceUnit: "starting at",
        details: eventSvc({ services: ["MEHNDI", "MAKEUP"], occasions: ["WEDDING", "HALDI_MEHNDI", "BABY_SHOWER", "FESTIVAL"],
          areasServed: "Jacksonville and the Beaches", languages: ["English", "Hindi"], yearsExperience: 5 }),
        description: "Organic henna for brides, bridal parties and Karva Chauth. Bridal makeup available." },
    ],
  },
  {
    email: "jax.rentals@bharathmela.test", name: "Pooja Desai", businessName: "Jax Party Rentals", phone: "(904) 555-0192",
    metro: "jacksonville", zip: "32259", plan: "FREE",
    listings: [
      { title: "Backdrops, throne chairs and table rentals", category: "EVENT_SERVICES", priceCents: 15000, priceUnit: "starting at",
        details: eventSvc({ services: ["RENTALS"], rentalItems: ["BACKDROPS", "THRONE_JHOOLA", "TABLES_CHAIRS", "LINENS", "LIGHTS"],
          delivery: true, occasions: ["BIRTHDAY", "BABY_SHOWER", "HOUSEWARMING", "FESTIVAL"], areasServed: "St. Johns County and Jacksonville", yearsExperience: 3 }),
        description: "Floral and sequin backdrops, swing and throne chairs, tables and string lights for home parties. Delivery and setup included." },
    ],
  },
  {
    email: "jax.art@bharathmela.test", name: "Meera Krishnan", businessName: "Kolam Studio", phone: "(904) 555-0105",
    metro: "jacksonville", zip: "32082", plan: "FREE",
    listings: [
      { title: "Custom Pichwai and Kerala mural paintings", category: "ART", priceCents: 25000, priceUnit: "starting at",
        description: "Hand-painted Pichwai and Kerala mural art on canvas, made to order for pooja rooms and living rooms." },
      { title: "Handmade golu dolls and festival decor", category: "ART", priceCents: 2500, priceUnit: "per item",
        description: "Clay golu dolls, toran door hangings and decorated diyas. Pickup in Ponte Vedra Beach." },
    ],
  },
  {
    email: "jax.boutique@bharathmela.test", name: "Farah Khan", businessName: "Noor Boutique", phone: "(904) 555-0116",
    metro: "jacksonville", zip: "32256", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Designer salwar suits, kurtis and lehengas", category: "CLOTHING", priceCents: 6000, priceUnit: "starting at",
        description: "Latest festive and party wear in sizes XS–3XL. Home boutique near Town Center; try-ons by appointment." },
      { title: "Imitation and kundan jewelry sets", category: "CLOTHING", priceCents: 3500, priceUnit: "per set",
        description: "Necklace and earring sets, bangles and maang tikkas to match your outfit. Rental options for weddings." },
    ],
  },
  {
    email: "jax.goods@bharathmela.test", name: "Venu Gopal", businessName: "Venu's Garden & Pooja Store", phone: "(904) 555-0158",
    metro: "jacksonville", zip: "32224", plan: "FREE",
    listings: [
      { title: "Tulsi, curry leaf and jasmine plants", category: "GOODS", priceCents: 1500, priceUnit: "per plant",
        description: "Healthy potted Rama and Krishna tulsi, curry leaf and mogra plants grown in Jacksonville. Tips on keeping them alive in winter." },
      { title: "Pooja items and festival supplies", category: "GOODS", priceCents: 500, priceUnit: "starting at",
        description: "Brass diyas, kalash sets, agarbatti, camphor and kumkum. Diwali and Navratri kits available." },
    ],
  },

  {
    email: "jax.home@bharathmela.test", name: "Kiran Gowda", businessName: "First Coast Home Pros", phone: "(904) 555-0160",
    metro: "jacksonville", zip: "32259", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "AC repair, plumbing and handyman – St. Johns & Ponte Vedra", category: "HOME_SERVICES", priceCents: 8900, priceUnit: "service call", featured: true,
        tags: ["HVAC", "PLUMBING", "HANDYMAN"],
        description: "Florida-licensed HVAC and plumbing contractor (license numbers on request). AC tune-ups before summer, leaks, water heaters and odd jobs. Insured, upfront written quotes." },
      { title: "Lawn care, pavers and pest control packages", category: "HOME_SERVICES", priceCents: 4500, priceUnit: "per visit",
        tags: ["LANDSCAPING", "PAVERS", "PEST_CONTROL"],
        description: "Weekly or biweekly mowing, edging and hedge trimming, paver patio cleaning and sealing, and licensed quarterly pest control for Nocatee and St. Johns homes." },
    ],
  },
  {
    email: "jax.movers@bharathmela.test", name: "Ravi Teja", businessName: "Desi Movers Jax", phone: "(904) 555-0109",
    metro: "jacksonville", zip: "32256", plan: "FREE",
    listings: [
      { title: "Local movers – apartments and houses", category: "HOME_SERVICES", priceCents: 12000, priceUnit: "per hour (2 movers)",
        tags: ["MOVING"],
        description: "Two-person crew with a 20-foot truck for local moves around Jacksonville. Packing materials available. Insured; we give a written estimate after a quick video walkthrough." },
    ],
  },
  {
    email: "jax.auto@bharathmela.test", name: "Sandeep Nair", businessName: "Southside Auto Care", phone: "(904) 555-0147",
    metro: "jacksonville", zip: "32256", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Tires, oil change and detailing near Deerwood", category: "AUTO", priceCents: 4900, priceUnit: "starting at",
        tags: ["TIRES", "OIL_CHANGE", "DETAILING"],
        description: "Registered Florida repair shop. Synthetic oil changes, new and used tires with balancing, and interior and exterior detailing while you wait. Written estimates on all repairs." },
      { title: "Driving lessons – learner's permit to road test", category: "AUTO", priceCents: 6500, priceUnit: "per lesson",
        tags: ["DRIVING_LESSONS"],
        description: "Florida-licensed driving instructor with a dual-control car. Pickup from home in St. Johns and Southside. Patient lessons for newcomers, parents visiting on long stays and teens." },
    ],
  },
  {
    email: "jax.beauty@bharathmela.test", name: "Lavanya Reddy", businessName: "Lavanya Beauty & Yoga", phone: "(904) 555-0183",
    metro: "jacksonville", zip: "32082", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Threading, waxing and party makeup in Ponte Vedra", category: "BEAUTY", priceCents: 1000, priceUnit: "starting at",
        tags: ["THREADING", "BRIDAL_MAKEUP", "HAIRCUT"],
        description: "Licensed cosmetologist. Eyebrow threading, waxing, and makeup and hair for festivals and weddings. Home studio in Ponte Vedra Beach or at your home." },
      { title: "Morning yoga and meditation classes", category: "BEAUTY", priceCents: 6000, priceUnit: "per month",
        tags: ["YOGA", "FITNESS"],
        description: "Gentle hatha yoga and pranayama in a small group by the beach, Tuesdays and Saturdays at 7 AM. Beginners and seniors welcome." },
    ],
  },
  {
    email: "jax.tax@bharathmela.test", name: "Venkatesh Iyer", businessName: "Iyer CPA & Insurance", phone: "(904) 555-0198",
    metro: "jacksonville", zip: "32246", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "CPA for families and small businesses – FBAR, ITIN, payroll", category: "TAX_FINANCE", priceCents: 25000, priceUnit: "starting at",
        tags: ["TAX_FILING", "FBAR", "ITIN", "BOOKKEEPING", "BUSINESS_TAX"],
        description: "Florida-licensed CPA. Individual and business returns, FBAR for India accounts, ITIN help as a Certifying Acceptance Agent, and monthly bookkeeping for home businesses." },
      { title: "Home, auto and life insurance quotes", category: "TAX_FINANCE", priceCents: null, priceUnit: "",
        tags: ["INSURANCE"],
        description: "Licensed Florida insurance agent (license number on request). Compare home, auto and term life quotes from several carriers, including flood and wind coverage for coastal homes." },
    ],
  },
  {
    email: "jax.travel@bharathmela.test", name: "Shanti Prasad", businessName: "Jax Desi Travels & Notary", phone: "(904) 555-0112",
    metro: "jacksonville", zip: "32224", plan: "FREE",
    listings: [
      { title: "India tickets, tour packages and notary services", category: "TRAVEL", priceCents: 3000, priceUnit: "starting at",
        tags: ["TICKETS", "TOURS", "NOTARY"],
        description: "Registered Florida seller of travel and commissioned Florida notary. Fares to India, Kerala and Kashmir tour packages, and notarizing forms and affidavits. Evenings and weekends." },
    ],
  },

  {
    email: "jax.garage@bharathmela.test", name: "Srinivas K", businessName: "Srinivas K", phone: "(904) 555-0127",
    metro: "jacksonville", zip: "32081", plan: "FREE",
    listings: [
      { title: "Nocatee community garage sale – electronics, books and tools", category: "GARAGE_SALE", priceCents: 100, priceUnit: "items from",
        tags: ["ELECTRONICS", "BOOKS", "TOOLS", "CLOTHES"],
        details: { startDate: nextWeekend().sat, endDate: nextWeekend().sat, hours: "8 AM – 1 PM", address: "Nocatee, Crosswater Pkwy area" },
        description: "Three families selling together: monitors, a printer, kids' books and board games, lawn mower and garden tools, sarees and kurtas. Everything priced to go; come early for the best picks." },
    ],
  },

  // ── Other cities ───────────────────────────────────────────────────────────
  {
    email: "meena.tutor@bharathmela.test", name: "Meena K", businessName: "Meena's Math & Telugu Classes", phone: "(972) 555-0123",
    metro: "dallas", zip: "75024", plan: "FREE",
    listings: [
      { title: "Kumon-style math tutoring, grades 1–8", category: "TUTORING", priceCents: 3000, priceUnit: "per hour",
        description: "Small groups in Plano or online. Free trial class." },
    ],
  },
  {
    email: "dfw.kitchen@bharathmela.test", name: "Anitha Reddy", businessName: "Anitha's Ruchulu", phone: "(469) 555-0140",
    metro: "dallas", zip: "75034", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Andhra meals and snacks – Frisco pickup", category: "FOOD", priceCents: 1300, priceUnit: "per plate",
        tags: ["VEGETARIAN"],
        description: "Daily rotating menu: pappu, curry, rasam and rice. Murukku and chekkalu by the pound for festivals." },
    ],
  },
  {
    email: "dfw.help@bharathmela.test", name: "Lata Joshi", businessName: "Lata Joshi", phone: "(214) 555-0129",
    metro: "dallas", zip: "75063", plan: "FREE",
    listings: [
      { title: "House cleaning and laundry help", category: "DOMESTIC_HELP", priceCents: 2200, priceUnit: "per hour",
        description: "Weekly or every-other-week cleaning in Irving and Coppell. I bring my own supplies on request." },
    ],
  },
  {
    email: "dfw.saree@bharathmela.test", name: "Bhavana Rao", businessName: "Bhavana Collections", phone: "(972) 555-0148",
    metro: "dallas", zip: "75025", plan: "FREE",
    listings: [
      { title: "Pochampally ikat and handloom cotton sarees", category: "CLOTHING", priceCents: 9000, priceUnit: "per item",
        description: "Handloom sarees sourced directly from weavers. Home showroom in Plano on weekends." },
    ],
  },
  {
    email: "nj.kitchen@bharathmela.test", name: "Rekha Pillai", businessName: "Kerala Kitchen Edison", phone: "(732) 555-0161",
    metro: "new-jersey", zip: "08820", plan: "PRO", phoneVerified: true,
    listings: [
      { title: "Kerala sadya and appam-stew weekend orders", category: "FOOD", priceCents: 2200, priceUnit: "per plate", featured: true,
        tags: ["VEGETARIAN", "GLUTEN_FREE"],
        description: "Onam-style sadya on banana leaf with 16 dishes, or appam with vegetable stew. Edison and Iselin pickup." },
    ],
  },
  {
    email: "nj.dance@bharathmela.test", name: "Anjali Bose", businessName: "Natyanjali Odissi", phone: "(609) 555-0103",
    metro: "new-jersey", zip: "08536", plan: "FREE",
    listings: [
      { title: "Odissi dance classes in Plainsboro", category: "DANCE_MUSIC", priceCents: 11000, priceUnit: "per month",
        description: "Beginner to advanced Odissi with annual recitals. Ages 7 and up." },
    ],
  },
  {
    email: "nj.cpa@bharathmela.test", name: "Vikram Shah", businessName: "Shah Tax & Books", phone: "(201) 555-0184",
    metro: "new-jersey", zip: "07302", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Tax filing for H-1B and NRI families, FBAR included", category: "TAX_FINANCE", priceCents: 25000, priceUnit: "starting at",
        tags: ["TAX_FILING", "FBAR", "BOOKKEEPING"],
        description: "Federal and state returns, FBAR and FATCA reporting for India accounts, and bookkeeping for small businesses." },
    ],
  },
  {
    email: "atl.pujari@bharathmela.test", name: "Ganesh Bhat", businessName: "Pandit Ganesh Bhat", phone: "(678) 555-0172",
    metro: "atlanta", zip: "30097", plan: "FREE",
    listings: [
      { title: "Kannada and Sanskrit pujas, homams and weddings", category: "PUJARI", priceCents: 25100, priceUnit: "per puja",
        description: "Ganapathi homam, Lakshmi puja, upanayanam and weddings across Duluth, Johns Creek and Alpharetta." },
    ],
  },
  {
    email: "atl.law@bharathmela.test", name: "Nisha Agarwal", businessName: "Agarwal Family Law", phone: "(770) 555-0119",
    metro: "atlanta", zip: "30005", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Family law, divorce and custody attorney", category: "LEGAL", priceCents: 27500, priceUnit: "per hour",
        details: pro({ licenseNumber: "512345", licenseState: "GA", firm: "Agarwal Family Law", specialties: ["FAMILY", "ESTATE"],
          languages: ["English", "Hindi", "Punjabi"], freeConsultation: false, yearsExperience: 13 }),
        description: "Divorce, child custody, prenuptial agreements and wills, handled with privacy and care." },
    ],
  },
  {
    email: "chi.realtor@bharathmela.test", name: "Sameer Qureshi", businessName: "Sameer Q Realty", phone: "(630) 555-0164",
    metro: "chicago", zip: "60540", plan: "FREE",
    listings: [
      { title: "Naperville and Aurora homes for growing families", category: "REALTOR", priceCents: null, priceUnit: "",
        details: pro({ licenseNumber: "475123456", licenseState: "IL", firm: "Baird & Warner", specialties: ["BUYING", "SELLING", "INVESTMENT"],
          languages: ["English", "Urdu", "Hindi"], freeConsultation: true, yearsExperience: 6 }),
        description: "Buy, sell or invest in the western suburbs with a local who knows District 203 and 204 schools." },
    ],
  },
  {
    email: "sea.rooms@bharathmela.test", name: "Arun Kumar", businessName: "Arun Kumar", phone: "(425) 555-0111",
    metro: "seattle", zip: "98052", plan: "FREE",
    listings: [
      { title: "Shared room in Redmond, walk to Microsoft campus", category: "ROOM_RENTAL", priceCents: 75000, priceUnit: "per month",
        details: rental({ spaceType: "SHARED_ROOM", lease: "3_MONTHS", depositCents: 40000, parking: "STREET", laundry: "IN_BUILDING",
          neighborhood: "Overlake", amenities: ["WIFI", "HEATING", "KITCHEN", "NEAR_TRANSIT"], houseRules: ["NO_SMOKING", "QUIET_HOURS"] }),
        description: "Bed in a shared room in a 2BR apartment. Good for interns and new joiners. Bus to campus in 5 minutes." },
    ],
  },
  {
    email: "sea.photo@bharathmela.test", name: "Divya Menon", businessName: "Divya Menon Photography", phone: "(206) 555-0187",
    metro: "seattle", zip: "98004", plan: "BASIC", phoneVerified: true,
    listings: [
      { title: "Maternity, baby and family photo sessions", category: "EVENT_SERVICES", priceCents: 35000, priceUnit: "per session",
        details: eventSvc({ services: ["PHOTOGRAPHY"], occasions: ["BABY_SHOWER", "BIRTHDAY", "FESTIVAL"], areasServed: "Eastside and Seattle",
          languages: ["English", "Malayalam"], yearsExperience: 7 }),
        description: "Outdoor and in-home sessions with 40+ edited photos. Seemantham and first-birthday coverage too." },
    ],
  },
];

// Buyers who leave the sample reviews (password "buyer-dev-password").
export const SAMPLE_BUYERS = [
  { email: "anil.renter@bharathmela.test", name: "Anil Kumar" },
  { email: "shreya.buyer@bharathmela.test", name: "Shreya M" },
  { email: "rahul.buyer@bharathmela.test", name: "Rahul T" },
  { email: "padma.buyer@bharathmela.test", name: "Padma S" },
];

export const SAMPLE_REVIEWS: { vendor: string; buyer: string; rating: number; comment: string; reply?: string }[] = [
  { vendor: "lakshmi@bharathmela.test", buyer: "shreya.buyer@bharathmela.test", rating: 5, comment: "Tastes like home. The pappu and pickle are perfect, and delivery was always on time.", reply: "Thank you Shreya! See you next week." },
  { vendor: "lakshmi@bharathmela.test", buyer: "rahul.buyer@bharathmela.test", rating: 4, comment: "Great biryani for our party. A little spicy for the kids, so ask for mild." },
  { vendor: "lens.lights@bharathmela.test", buyer: "padma.buyer@bharathmela.test", rating: 5, comment: "Captured every moment of our daughter's wedding. The highlight film made everyone cry." },
  { vendor: "pandit.sharma@bharathmela.test", buyer: "shreya.buyer@bharathmela.test", rating: 5, comment: "Explained every step of the griha pravesh in English for our friends. Very punctual." },
  { vendor: "sruthi.arts@bharathmela.test", buyer: "padma.buyer@bharathmela.test", rating: 5, comment: "My daughter loves her classes. Patient teacher." },
  { vendor: "jax.kitchen@bharathmela.test", buyer: "shreya.buyer@bharathmela.test", rating: 5, comment: "Best tiffin in Ponte Vedra. Fresh every day and not oily." },
  { vendor: "jax.kitchen@bharathmela.test", buyer: "rahul.buyer@bharathmela.test", rating: 4, comment: "The batter makes crispy dosas. Wish there was Sunday pickup too." },
  { vendor: "jax.pujari@bharathmela.test", buyer: "padma.buyer@bharathmela.test", rating: 5, comment: "Beautiful seemantham ceremony. He sent the samagri list a week ahead." },
  { vendor: "jax.events@bharathmela.test", buyer: "rahul.buyer@bharathmela.test", rating: 5, comment: "Our beach mandap looked stunning and the DJ kept everyone dancing." },
  { vendor: "jax.realtor@bharathmela.test", buyer: "anil.renter@bharathmela.test", rating: 5, comment: "Helped us understand flood insurance before we bought in Nocatee. No pressure at all." },
  { vendor: "jax.biryani@bharathmela.test", buyer: "anil.renter@bharathmela.test", rating: 4, comment: "Authentic Hyderabadi taste. The goat biryani is the one to get." },
  { vendor: "jax.tutor@bharathmela.test", buyer: "padma.buyer@bharathmela.test", rating: 5, comment: "My son's algebra grade went from a C to an A in one semester." },
  { vendor: "nj.kitchen@bharathmela.test", buyer: "shreya.buyer@bharathmela.test", rating: 5, comment: "Onam sadya was just like back home in Kochi." },
  { vendor: "silk.threads@bharathmela.test", buyer: "padma.buyer@bharathmela.test", rating: 4, comment: "Genuine silk with silk mark. Blouse stitching took two weeks." },
];

type SampleEvent = {
  vendor: string; metro: string; offset: number; start: string; end: string; title: string; type: string; festival: string;
  description: string; venueName: string; address: string; isFree: boolean; priceCents: number | null; ticketUrl: string;
};

export const SAMPLE_EVENTS: SampleEvent[] = [
  { vendor: "lakshmi@bharathmela.test", metro: "bay-area", offset: 5, start: "11:00", end: "20:00",
    title: "Diwali Mela 2026 – food stalls, dance & fireworks show", type: "FESTIVAL", festival: "Diwali",
    description: "Family Diwali celebration with 30+ food and shopping stalls, classical and Bollywood dance performances, rangoli contest for kids and a fireworks show at 7:30 PM. Free parking.",
    venueName: "Santa Clara Convention Center", address: "5001 Great America Pkwy, Santa Clara, CA 95054", isFree: false, priceCents: 1000,
    ticketUrl: "https://www.eventbrite.com/e/diwali-mela-sample" },
  { vendor: "sruthi.arts@bharathmela.test", metro: "bay-area", offset: 9, start: "17:30", end: "20:30",
    title: "Carnatic vocal concert & student Bharatanatyam recital", type: "CONCERT", festival: "",
    description: "Annual recital by students of Sruthi Laya Kala Kendra, followed by a Carnatic vocal concert with violin and mridangam accompaniment. All are welcome.",
    venueName: "Cupertino Community Hall", address: "10350 Torre Ave, Cupertino, CA 95014", isFree: true, priceCents: null, ticketUrl: "" },
  { vendor: "pandit.sharma@bharathmela.test", metro: "bay-area", offset: 3, start: "10:00", end: "13:00",
    title: "Community Satyanarayan Puja & prasadam", type: "RELIGIOUS", festival: "",
    description: "Monthly community Satyanarayan Vratham with katha in Telugu and Hindi. Families can sponsor a kalasham. Prasadam lunch served after the puja.",
    venueName: "Fremont Community Center", address: "40204 Paseo Padre Pkwy, Fremont, CA 94538", isFree: true, priceCents: null, ticketUrl: "" },
  { vendor: "meena.tutor@bharathmela.test", metro: "dallas", offset: 12, start: "19:00", end: "23:00",
    title: "Diwali Garba & Dandiya Night", type: "FESTIVAL", festival: "Diwali",
    description: "Live dhol and singers, garba and dandiya raas for all ages, dandiya sticks available at the door, Gujarati snacks on sale.",
    venueName: "Plano Event Center", address: "2000 E Spring Creek Pkwy, Plano, TX 75074", isFree: false, priceCents: 1500,
    ticketUrl: "https://www.eventbrite.com/e/garba-night-sample" },
  { vendor: "jax.nritya@bharathmela.test", metro: "jacksonville", offset: 6, start: "16:00", end: "21:00",
    title: "Jacksonville Diwali Utsav – dance, food & diyas", type: "FESTIVAL", festival: "Diwali",
    description: "Dance performances by local students, a diya-painting corner for kids, food stalls from home kitchens and a community aarti at sunset.",
    venueName: "Treaty Oak Park", address: "1123 Prudential Dr, Jacksonville, FL 32207", isFree: true, priceCents: null, ticketUrl: "" },
  { vendor: "jax.pujari@bharathmela.test", metro: "jacksonville", offset: 10, start: "09:30", end: "12:30",
    title: "Karthika Deepam and Satyanarayana Vratam", type: "RELIGIOUS", festival: "",
    description: "Community vratam with deepam lighting. Families may register to sit for the puja; prasadam lunch afterward.",
    venueName: "Ponte Vedra Community Hall", address: "200 Library Blvd, Ponte Vedra Beach, FL 32082", isFree: true, priceCents: null, ticketUrl: "" },
  { vendor: "jax.tutor@bharathmela.test", metro: "jacksonville", offset: 16, start: "14:00", end: "17:00",
    title: "Kids' math olympiad practice day", type: "KIDS", festival: "",
    description: "Free practice contest for grades 3–8 with puzzles, prizes and snacks. Parents get tips on contest prep.",
    venueName: "Bartram Trail Library", address: "60 Davis Pond Blvd, St. Johns, FL 32259", isFree: true, priceCents: null, ticketUrl: "" },
  { vendor: "jax.events@bharathmela.test", metro: "jacksonville", offset: 22, start: "19:00", end: "23:30",
    title: "Bollywood Night at the Beach", type: "DANCE", festival: "",
    description: "DJ night with Bollywood, Punjabi and Tollywood hits, a dance-off and Indian street food. 21+ after 9 PM.",
    venueName: "Seawalk Pavilion", address: "75 1st St N, Jacksonville Beach, FL 32250", isFree: false, priceCents: 2000,
    ticketUrl: "https://www.eventbrite.com/e/bollywood-beach-sample" },
  { vendor: "nj.dance@bharathmela.test", metro: "new-jersey", offset: 8, start: "15:00", end: "18:00",
    title: "Odissi annual recital – Nritya Sandhya", type: "DANCE", festival: "",
    description: "Students of Natyanjali present Pallavi, Abhinaya and Moksha pieces with live music.",
    venueName: "Plainsboro Library Auditorium", address: "9 Van Doren St, Plainsboro, NJ 08536", isFree: true, priceCents: null, ticketUrl: "" },
];

export const SAMPLE_WANTED = [
  { metro: "bay-area", title: "Software engineer looking for a room near Sunnyvale from December",
    description: "Moving from Hyderabad for a new job in Sunnyvale. Quiet, non-smoker, I cook simple vegetarian food and keep shared spaces clean. Looking to stay at least 6 months.",
    budgetMaxCents: 140000, moveIn: 25, lease: "6_MONTHS", spaceTypes: ["PRIVATE_ROOM", "PAYING_GUEST"], areas: "Sunnyvale, Santa Clara, Mountain View",
    needsFurnished: true },
  { metro: "dallas", title: "Grad student needs a shared room near UT Dallas",
    description: "Masters student starting in January. Looking for a shared or private room within biking distance of UT Dallas. Flexible on lease length.",
    budgetMaxCents: 70000, moveIn: 45, lease: "FLEXIBLE", spaceTypes: ["SHARED_ROOM", "PRIVATE_ROOM"], areas: "Richardson, near UTD" },
  { metro: "jacksonville", title: "New hire looking for a room near Southside / Deerwood",
    description: "Starting at a bank in Deerwood Park next month. Non-smoker, works regular hours, happy to share cooking. Looking for 6–12 months.",
    budgetMaxCents: 95000, moveIn: 20, lease: "6_MONTHS", spaceTypes: ["PRIVATE_ROOM"], areas: "Southside, Baymeadows, Deerwood", needsParking: true },
  { metro: "jacksonville", title: "Family of three needs a 2BR in St. Johns County",
    description: "Relocating from New Jersey with a 6-year-old. Looking for a 2BR apartment or townhouse in a good school zone, 12-month lease.",
    budgetMaxCents: 240000, moveIn: 40, lease: "12_MONTHS", spaceTypes: ["ENTIRE_APARTMENT", "TOWNHOUSE"], areas: "Nocatee, St. Johns, Ponte Vedra",
    needsPrivateBath: true, needsParking: true },
  { metro: "new-jersey", title: "Room near Edison or Iselin, close to NJ Transit",
    description: "Commuting to Manhattan for work. Need a clean private room near the train. Vegetarian, no pets.",
    budgetMaxCents: 110000, moveIn: 30, lease: "MONTH_TO_MONTH", spaceTypes: ["PRIVATE_ROOM", "PAYING_GUEST"], areas: "Edison, Iselin, Metuchen" },
];
