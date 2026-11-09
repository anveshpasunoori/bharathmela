// Kinds of service within a category, picked by the seller and used as the "Service" filter. Stored in
// the listing's tags as ",ID,ID," (the same column food uses for dietary markers).
const opts = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

export const SERVICE_TYPES: Record<string, { id: string; label: string }[]> = {
  // Food listings also keep their dietary markers in the same column; the ids don't overlap.
  FOOD: opts(
    ["TIFFIN", "Daily tiffin & meal plans"],
    ["PARTY_ORDERS", "Party trays & catering"],
    ["BIRYANI", "Biryani"],
    ["SOUTH_INDIAN", "Dosa, idli & batters"],
    ["THALI", "Thalis & meals"],
    ["SNACKS", "Snacks & chaat"],
    ["SWEETS", "Sweets & desserts"],
    ["BAKERY", "Cakes & bakes"],
  ),
  TUTORING: opts(
    ["MATH", "Math"],
    ["SCIENCE", "Science"],
    ["CODING", "Coding & robotics"],
    ["TEST_PREP", "SAT, ACT & AP prep"],
    ["ABACUS", "Abacus & mental math"],
    ["READING", "Reading & writing"],
    ["INDIAN_LANGUAGES", "Telugu, Hindi, Tamil & more"],
    ["SHLOKAS", "Shlokas, Sanskrit & Vedic chanting"],
    ["COMPETITIONS", "Spelling bee & math olympiad"],
    ["COLLEGE", "College admissions"],
  ),
  DANCE_MUSIC: opts(
    ["BHARATANATYAM", "Bharatanatyam"],
    ["KUCHIPUDI", "Kuchipudi"],
    ["KATHAK", "Kathak"],
    ["ODISSI", "Odissi"],
    ["KATHAKALI", "Kathakali"],
    ["BOLLYWOOD", "Bollywood & folk dance"],
    ["CARNATIC", "Carnatic music"],
    ["HINDUSTANI", "Hindustani music"],
    ["INSTRUMENTS", "Veena, violin & flute"],
    ["PERCUSSION", "Tabla & mridangam"],
    ["KEYBOARD", "Keyboard, harmonium & guitar"],
  ),
  PUJARI: opts(
    ["GRIHA_PRAVESH", "Griha pravesh (housewarming)"],
    ["SATYANARAYANA", "Satyanarayana vratam"],
    ["WEDDING", "Weddings"],
    ["HOMAM", "Homams & havans"],
    ["BABY_CEREMONIES", "Naming, annaprasana & seemantham"],
    ["UPANAYANAM", "Upanayanam"],
    ["LAST_RITES", "Shraddham & last rites"],
    ["VEHICLE_PUJA", "Vehicle puja"],
    ["ASTROLOGY", "Astrology & muhurtham"],
    ["ONLINE_PUJA", "Online pujas"],
  ),
  DOMESTIC_HELP: opts(
    ["NANNY", "Nanny & babysitting"],
    ["COOK", "Cook"],
    ["ELDER_CARE", "Elder care"],
    ["POSTPARTUM", "Postpartum & newborn care"],
    ["CLEANING", "House cleaning & laundry"],
    ["PET_CARE", "Pet sitting & dog walking"],
  ),
  HOME_SERVICES: opts(
    ["ELECTRICAL", "Electrician"],
    ["PLUMBING", "Plumbing"],
    ["HVAC", "AC & heating"],
    ["HANDYMAN", "Handyman"],
    ["PAINTING", "Painting"],
    ["ROOFING", "Roofing & gutters"],
    ["FLOORING", "Flooring & tile"],
    ["LANDSCAPING", "Lawn & landscaping"],
    ["PEST_CONTROL", "Pest control"],
    ["REMODELING", "Remodeling"],
    ["PAVERS", "Pavers & patios"],
    ["APPLIANCE", "Appliance repair"],
    ["ASSEMBLY", "Furniture assembly & TV mounting"],
    ["SMART_HOME", "Wi-Fi, cameras & smart home"],
    ["MOVING", "Packers & movers"],
  ),
  AUTO: opts(
    ["MECHANIC", "Repair & mechanic"],
    ["OIL_CHANGE", "Oil change"],
    ["TIRES", "Tires & alignment"],
    ["BRAKES", "Brakes & batteries"],
    ["BODY_SHOP", "Body work & paint"],
    ["COLLISION", "Collision repair"],
    ["DETAILING", "Detailing & car wash"],
    ["WINDSHIELD", "Windshield & glass"],
    ["TOWING", "Towing & roadside help"],
    ["CAR_SALES", "Car sales (new & used)"],
    ["CAR_BUYING", "Car buying & leasing help"],
    ["DRIVING_LESSONS", "Driving lessons"],
  ),
  BEAUTY: opts(
    ["THREADING", "Threading & waxing"],
    ["FACIALS", "Facials & skin care"],
    ["BRIDAL_MAKEUP", "Bridal makeup & hair"],
    ["MEHNDI", "Mehndi"],
    ["HAIRCUT", "Haircuts at home"],
    ["NAILS", "Nails"],
    ["SAREE_DRAPING", "Saree draping"],
    ["YOGA", "Yoga & meditation"],
    ["FITNESS", "Fitness training"],
  ),
  TAX_FINANCE: opts(
    ["TAX_FILING", "Tax filing"],
    ["ITIN", "ITIN"],
    ["FBAR", "FBAR & India accounts"],
    ["BOOKKEEPING", "Bookkeeping & payroll"],
    ["BUSINESS_TAX", "Business taxes"],
    ["MORTGAGE", "Mortgages & loans"],
    ["INSURANCE", "Insurance"],
  ),
  TRAVEL: opts(
    ["TICKETS", "India flight tickets"],
    ["TOURS", "Tour packages"],
    ["COMPANION", "Travel companion for parents"],
    ["VISA", "OCI, passport & visa help"],
    ["AIRPORT", "Airport rides"],
    ["NOTARY", "Notary & apostille"],
  ),
  ART: opts(
    ["PAINTINGS", "Paintings (Madhubani, Tanjore…)"],
    ["RANGOLI", "Rangoli & kolam"],
    ["FESTIVAL_DECOR", "Golu dolls & festival décor"],
    ["HANDMADE", "Handmade crafts"],
    ["GIFTS", "Custom & return gifts"],
    ["ART_CLASSES", "Art & craft classes"],
  ),
  CLOTHING: opts(
    ["SAREES", "Sarees"],
    ["LEHENGAS", "Lehengas & salwar suits"],
    ["MENS_WEAR", "Kurtas & men's wear"],
    ["KIDS_WEAR", "Kids' festival wear"],
    ["JEWELRY", "Jewelry"],
    ["TAILORING", "Tailoring & blouse stitching"],
    ["OUTFIT_RENTAL", "Outfit rental"],
  ),
  // For garage sales these are the kinds of items on sale.
  GARAGE_SALE: opts(
    ["FURNITURE", "Furniture"],
    ["ELECTRONICS", "Electronics"],
    ["KITCHEN", "Kitchen & appliances"],
    ["KIDS", "Kids & baby"],
    ["CLOTHES", "Clothes & shoes"],
    ["INDIAN", "Indian décor & pooja items"],
    ["BOOKS", "Books & toys"],
    ["TOOLS", "Tools, garden & outdoor"],
    ["CAR", "Car or bikes"],
  ),
  GOODS: opts(
    ["PICKLES", "Pickles, podis & spices"],
    ["PLANTS", "Plants & seeds"],
    ["POOJA_ITEMS", "Pooja items"],
    ["HOMEMADE", "Soaps, candles & homemade goods"],
    ["OTHER", "Something else"],
  ),
};

// What the type picker is called, where "service" doesn't fit.
export const SERVICE_TYPE_WORDING: Record<string, { filter: string; any: string; legend: string; hint: string }> = {
  GARAGE_SALE: { filter: "Items", any: "Any items", legend: "What's for sale (pick all that apply)", hint: "Buyers filter by these." },
  FOOD: { filter: "Food", any: "Any food", legend: "What you make (pick all that apply)", hint: "Buyers browse by these, so pick only what you actually sell." },
  TUTORING: { filter: "Subject", any: "Any subject", legend: "Subjects you teach (pick all that apply)", hint: "Parents browse by these, so pick only what you actually teach." },
  DANCE_MUSIC: { filter: "Style", any: "Any style", legend: "Styles you teach (pick all that apply)", hint: "Students browse by these, so pick only what you actually teach." },
  ART: { filter: "Kind", any: "Any kind", legend: "What you make or teach (pick all that apply)", hint: "Buyers browse by these." },
  CLOTHING: { filter: "Kind", any: "Anything", legend: "What you sell (pick all that apply)", hint: "Buyers browse by these." },
  GOODS: { filter: "Kind", any: "Anything", legend: "What you sell (pick all that apply)", hint: "Buyers browse by these." },
};
export const typeWording = (category: string) =>
  SERVICE_TYPE_WORDING[category] ?? { filter: "Service", any: "Any service", legend: "Services you offer (pick all that apply)", hint: "Buyers filter by these, so pick only what you actually do." };

export const hasServiceTypes = (category: string | undefined) => !!category && category in SERVICE_TYPES;

export function parseServiceTypes(category: string, stored: string) {
  const ids = new Set(stored.split(","));
  return (SERVICE_TYPES[category] ?? []).filter((t) => ids.has(t.id)).map((t) => t.id);
}

export const serializeServiceTypes = (category: string, ids: string[]) => {
  const valid = parseServiceTypes(category, `,${ids.join(",")},`);
  return valid.length ? `,${valid.join(",")},` : "";
};

export const serviceTypeLabel = (category: string, id: string) => SERVICE_TYPES[category]?.find((t) => t.id === id)?.label ?? id;
