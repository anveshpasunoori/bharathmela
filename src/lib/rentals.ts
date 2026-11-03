// Structured details for room-rental listings, stored as JSON in Listing.details.
// Shared by the posting form (client), the server actions and the listing pages.

const opts = <T extends string>(...pairs: [T, string][]) => pairs.map(([id, label]) => ({ id, label }));

export const SPACE_TYPES = opts(
  ["PRIVATE_ROOM", "Private room"],
  ["SHARED_ROOM", "Shared room"],
  ["PAYING_GUEST", "Paying guest (PG)"],
  ["ENTIRE_APARTMENT", "Entire apartment"],
  ["CONDO", "Condo"],
  ["TOWNHOUSE", "Townhouse"],
  ["HOUSE", "Entire house"],
  ["IN_LAW", "Basement / in-law unit"],
);
// Spaces where the tenant shares a home, so a roommate preference can be legal.
export const SHARED_SPACES = ["PRIVATE_ROOM", "SHARED_ROOM", "PAYING_GUEST"];
// Spaces rented as a whole unit, where bedroom and bathroom counts matter.
export const WHOLE_UNITS = ["ENTIRE_APARTMENT", "CONDO", "TOWNHOUSE", "HOUSE", "IN_LAW"];

export const LEASES = opts(
  ["SHORT", "Short stay (under 1 month)"],
  ["MONTH_TO_MONTH", "Month to month"],
  ["3_MONTHS", "3 months"],
  ["6_MONTHS", "6 months"],
  ["12_MONTHS", "12 months"],
  ["FLEXIBLE", "Flexible"],
);
export const BATHROOMS = opts(["PRIVATE", "Private bath"], ["SHARED", "Shared bath"]);
export const FURNISHING = opts(["FURNISHED", "Furnished"], ["PARTLY", "Partly furnished"], ["UNFURNISHED", "Unfurnished"]);
export const UTILITIES = opts(["INCLUDED", "Utilities included"], ["PARTLY", "Some utilities included"], ["EXTRA", "Utilities extra"]);
export const PARKING = opts(["NONE", "No parking"], ["STREET", "Street parking"], ["DRIVEWAY", "Driveway"], ["GARAGE", "Garage"], ["ASSIGNED", "Assigned spot"]);
export const LAUNDRY = opts(["IN_UNIT", "Washer/dryer in unit"], ["IN_BUILDING", "Laundry in building"], ["NONE", "No laundry"]);
export const AMENITIES = opts(
  ["WIFI", "Wi-Fi"],
  ["AC", "Air conditioning"],
  ["HEATING", "Heating"],
  ["KITCHEN", "Kitchen access"],
  ["MEALS", "Meals included"],
  ["DISHWASHER", "Dishwasher"],
  ["GYM", "Gym"],
  ["POOL", "Pool"],
  ["BACKYARD", "Backyard / patio"],
  ["STORAGE", "Storage"],
  ["NEAR_TRANSIT", "Walk to transit"],
  ["WHEELCHAIR", "Wheelchair accessible"],
);
// Rules about the home that apply to everyone. Rules about who may live there aren't offered.
export const HOUSE_RULES = opts(
  ["NO_SMOKING", "No smoking"],
  ["NO_PETS", "No pets"],
  ["PETS_OK", "Pets allowed"],
  ["QUIET_HOURS", "Quiet hours"],
  ["NO_PARTIES", "No parties"],
  ["LIMITED_GUESTS", "Limited overnight guests"],
);
export const ROOMMATE_GENDERS = opts(["ANY", "No preference"], ["FEMALE", "Female roommate"], ["MALE", "Male roommate"]);

export type RentalDetails = {
  spaceType: string;
  availableFrom: string; // YYYY-MM-DD
  lease: string;
  depositCents: number | null;
  utilities: string;
  bathroom: string;
  furnished: string;
  parking: string;
  laundry: string;
  bedrooms: number | null;
  bathrooms: number | null;
  neighborhood: string;
  amenities: string[];
  houseRules: string[];
  ownerOccupied: boolean;
  roommateGender: string;
};

export const EMPTY_RENTAL: RentalDetails = {
  spaceType: "",
  availableFrom: "",
  lease: "MONTH_TO_MONTH",
  depositCents: null,
  utilities: "INCLUDED",
  bathroom: "SHARED",
  furnished: "FURNISHED",
  parking: "STREET",
  laundry: "IN_UNIT",
  bedrooms: null,
  bathrooms: null,
  neighborhood: "",
  amenities: [],
  houseRules: [],
  ownerOccupied: false,
  roommateGender: "ANY",
};

const label = (list: { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? "";
const valid = (list: { id: string }[], id: string) => list.some((o) => o.id === id);

export function readRental(json: string): RentalDetails | null {
  try {
    const d = JSON.parse(json);
    return d && d.spaceType ? { ...EMPTY_RENTAL, ...d } : null;
  } catch {
    return null;
  }
}

// Validates the rental part of the listing form. Returns details or an error message.
export function parseRentalForm(form: FormData): RentalDetails | { error: string } {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const spaceType = get("r_spaceType");
  if (!valid(SPACE_TYPES, spaceType)) return { error: "Choose the type of space." };
  const availableFrom = get("r_availableFrom");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(availableFrom)) return { error: "Choose the date the space is available from." };
  const avail = new Date(`${availableFrom}T12:00:00Z`).getTime();
  if (avail < Date.now() - 60 * 86_400_000 || avail > Date.now() + 365 * 86_400_000) {
    return { error: "The available-from date should be within the next year." };
  }
  const pick = (name: string, list: { id: string }[], fallback: string) => (valid(list, get(name)) ? get(name) : fallback);
  const deposit = get("r_deposit").replace(/^\$/, "");
  let depositCents: number | null = null;
  if (deposit) {
    const n = Number(deposit);
    if (!Number.isFinite(n) || n < 0 || n > 50_000) return { error: "Deposit must be a number, like 1000." };
    depositCents = Math.round(n * 100);
  }
  const count = (name: string, max: number) => {
    const n = Number(get(name));
    return get(name) && Number.isInteger(n) && n >= 0 && n <= max ? n : null;
  };
  const many = (name: string, list: { id: string }[]) => form.getAll(name).map(String).filter((id) => valid(list, id));
  const houseRules = many("r_houseRules", HOUSE_RULES);
  if (houseRules.includes("NO_PETS") && houseRules.includes("PETS_OK")) return { error: "Choose either \"No pets\" or \"Pets allowed\", not both." };

  const shared = SHARED_SPACES.includes(spaceType);
  const ownerOccupied = shared && form.get("r_ownerOccupied") === "on";
  // A gender preference is only allowed when the poster lives in, and shares, the home.
  const roommateGender = ownerOccupied ? pick("r_roommateGender", ROOMMATE_GENDERS, "ANY") : "ANY";

  return {
    spaceType,
    availableFrom,
    lease: pick("r_lease", LEASES, "MONTH_TO_MONTH"),
    depositCents,
    utilities: pick("r_utilities", UTILITIES, "INCLUDED"),
    bathroom: pick("r_bathroom", BATHROOMS, "SHARED"),
    furnished: pick("r_furnished", FURNISHING, "FURNISHED"),
    parking: pick("r_parking", PARKING, "NONE"),
    laundry: pick("r_laundry", LAUNDRY, "NONE"),
    bedrooms: WHOLE_UNITS.includes(spaceType) ? count("r_bedrooms", 10) : null,
    bathrooms: WHOLE_UNITS.includes(spaceType) ? count("r_bathrooms", 10) : null,
    neighborhood: get("r_neighborhood").slice(0, 100),
    amenities: many("r_amenities", AMENITIES),
    houseRules,
    ownerOccupied,
    roommateGender,
  };
}

export const spaceTypeLabel = (id: string) => label(SPACE_TYPES, id);

export function formatAvailable(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00Z`);
  if (d.getTime() <= Date.now()) return "Available now";
  return `Available ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

// Short facts for cards: "Private room · Private bath · Furnished · Available Dec 1".
export function rentalSummary(d: RentalDetails) {
  return [
    spaceTypeLabel(d.spaceType),
    d.bedrooms != null ? `${d.bedrooms} bd` : "",
    d.bathrooms != null ? `${d.bathrooms} ba` : SHARED_SPACES.includes(d.spaceType) ? label(BATHROOMS, d.bathroom) : "",
    label(FURNISHING, d.furnished),
    formatAvailable(d.availableFrom),
  ].filter(Boolean);
}

// Full fact list for the listing page.
export function rentalFacts(d: RentalDetails) {
  const leaseLabel = label(LEASES, d.lease);
  return [
    { label: "Space", value: spaceTypeLabel(d.spaceType) },
    { label: "Available", value: formatAvailable(d.availableFrom) },
    { label: "Lease", value: leaseLabel },
    { label: "Deposit", value: d.depositCents != null ? (d.depositCents === 0 ? "No deposit" : `$${(d.depositCents / 100).toLocaleString()}`) : "Ask" },
    { label: "Utilities", value: label(UTILITIES, d.utilities) },
    ...(d.bedrooms != null ? [{ label: "Bedrooms", value: String(d.bedrooms) }] : []),
    ...(d.bathrooms != null ? [{ label: "Bathrooms", value: String(d.bathrooms) }] : [{ label: "Bathroom", value: label(BATHROOMS, d.bathroom) }]),
    { label: "Furnishing", value: label(FURNISHING, d.furnished) },
    { label: "Parking", value: label(PARKING, d.parking) },
    { label: "Laundry", value: label(LAUNDRY, d.laundry) },
    ...(d.ownerOccupied ? [{ label: "Living setup", value: "Shared with the person renting it" }] : []),
    ...(d.roommateGender !== "ANY" ? [{ label: "Roommate preference", value: label(ROOMMATE_GENDERS, d.roommateGender) }] : []),
  ];
}

export const amenityLabels = (d: RentalDetails) => d.amenities.map((id) => label(AMENITIES, id));
export const houseRuleLabels = (d: RentalDetails) => d.houseRules.map((id) => label(HOUSE_RULES, id));

// Words added to search so "pg", "private bath" or a neighborhood name finds the listing.
export function rentalSearchText(d: RentalDetails) {
  return [...rentalSummary(d), d.neighborhood, ...amenityLabels(d), ...houseRuleLabels(d), d.spaceType === "PAYING_GUEST" ? "pg paying guest" : ""].join(" ");
}

export type RentalFilters = { space?: string; maxRent?: number; availableBy?: string; privateBath?: boolean; furnished?: boolean; pets?: boolean };

export function matchesRentalFilters(d: RentalDetails | null, priceCents: number | null, f: RentalFilters) {
  if (!d) return !(f.space || f.availableBy || f.privateBath || f.furnished || f.pets) && (f.maxRent == null || (priceCents ?? Infinity) <= f.maxRent);
  if (f.space && d.spaceType !== f.space) return false;
  if (f.maxRent != null && (priceCents == null || priceCents > f.maxRent)) return false;
  if (f.availableBy && d.availableFrom > f.availableBy) return false;
  if (f.privateBath && d.bathroom !== "PRIVATE" && !(d.bathrooms && d.bathrooms > 0)) return false;
  if (f.furnished && d.furnished === "UNFURNISHED") return false;
  if (f.pets && !d.houseRules.includes("PETS_OK")) return false;
  return true;
}
