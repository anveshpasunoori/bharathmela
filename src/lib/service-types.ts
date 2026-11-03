// Kinds of service within a category, picked by the seller and used as the "Service" filter. Stored in
// the listing's tags as ",ID,ID," (the same column food uses for dietary markers).
const opts = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

export const SERVICE_TYPES: Record<string, { id: string; label: string }[]> = {
  HOME_SERVICES: opts(
    ["ELECTRICAL", "Electrician"],
    ["PLUMBING", "Plumbing"],
    ["HVAC", "AC & heating"],
    ["HANDYMAN", "Handyman"],
    ["PAINTING", "Painting"],
    ["ROOFING", "Roofing & gutters"],
    ["LANDSCAPING", "Lawn & landscaping"],
    ["PEST_CONTROL", "Pest control"],
    ["REMODELING", "Remodeling"],
    ["PAVERS", "Pavers & patios"],
    ["APPLIANCE", "Appliance repair"],
    ["MOVING", "Packers & movers"],
  ),
  AUTO: opts(
    ["MECHANIC", "Repair & mechanic"],
    ["OIL_CHANGE", "Oil change"],
    ["TIRES", "Tires"],
    ["BODY_SHOP", "Body & paint"],
    ["DETAILING", "Detailing"],
    ["DRIVING_LESSONS", "Driving lessons"],
  ),
  BEAUTY: opts(
    ["THREADING", "Threading & waxing"],
    ["BRIDAL_MAKEUP", "Bridal makeup & hair"],
    ["MEHNDI", "Mehndi"],
    ["HAIRCUT", "Haircuts at home"],
    ["SAREE_DRAPING", "Saree draping"],
    ["YOGA", "Yoga & meditation"],
    ["FITNESS", "Fitness training"],
  ),
  TAX_FINANCE: opts(
    ["TAX_FILING", "Tax filing"],
    ["ITIN", "ITIN"],
    ["FBAR", "FBAR & India accounts"],
    ["BOOKKEEPING", "Bookkeeping"],
    ["BUSINESS_TAX", "Business taxes"],
    ["INSURANCE", "Insurance"],
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
  TRAVEL: opts(
    ["TICKETS", "India flight tickets"],
    ["TOURS", "Tour packages"],
    ["COMPANION", "Travel companion for parents"],
    ["NOTARY", "Notary & apostille"],
  ),
};

// What the type picker is called, where "service" doesn't fit.
export const SERVICE_TYPE_WORDING: Record<string, { filter: string; any: string; legend: string; hint: string }> = {
  GARAGE_SALE: { filter: "Items", any: "Any items", legend: "What's for sale (pick all that apply)", hint: "Buyers filter by these." },
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
