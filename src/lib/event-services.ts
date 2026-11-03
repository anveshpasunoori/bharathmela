// Wedding and event vendors (photographers, DJs, bartenders, decorators…): which services
// they offer, for which occasions, and where. Stored as JSON in Listing.details.

const opts = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

export const EVENT_SERVICES = opts(
  ["PHOTOGRAPHY", "Photography"],
  ["VIDEOGRAPHY", "Videography & drone"],
  ["DJ", "DJ & sound"],
  ["BARTENDING", "Bartending"],
  ["DECOR", "Decor, mandap & flowers"],
  ["LIGHTING", "Lighting & stage"],
  ["MAKEUP", "Makeup & hair"],
  ["MEHNDI", "Mehndi artist"],
  ["DHOL", "Dhol & baraat"],
  ["LIVE_MUSIC", "Live band & singers"],
  ["MC", "MC / anchor"],
  ["CHOREOGRAPHY", "Sangeet choreography"],
  ["PLANNING", "Event & wedding planning"],
  ["PHOTO_BOOTH", "Photo booth"],
  ["RENTALS", "Party rentals"],
  ["CATERING", "Catering"],
  ["CAKES", "Cakes & desserts"],
  ["INVITATIONS", "Invitations & stationery"],
);

// What a party-rental business rents out (shown when "Party rentals" is chosen).
export const RENTAL_ITEMS = opts(
  ["TENTS", "Tents & canopies"],
  ["TABLES_CHAIRS", "Tables & chairs"],
  ["LINENS", "Linens & chair covers"],
  ["MANDAP", "Mandap rental"],
  ["THRONE_JHOOLA", "Throne chairs & jhoola"],
  ["BACKDROPS", "Backdrops & photo walls"],
  ["SERVING", "Chafing dishes & serving gear"],
  ["DANCE_FLOOR", "Dance floor & staging"],
  ["AV", "Sound, mics & projectors"],
  ["LIGHTS", "Lights & string lights"],
  ["BOUNCE", "Bounce houses & kids' games"],
  ["OUTFITS", "Outfit & jewelry rental"],
  ["GENERATORS", "Generators, heaters & fans"],
);

export const OCCASIONS = opts(
  ["WEDDING", "Weddings"],
  ["SANGEET", "Sangeet"],
  ["HALDI_MEHNDI", "Haldi & mehndi"],
  ["RECEPTION", "Receptions"],
  ["ENGAGEMENT", "Engagements"],
  ["BIRTHDAY", "Birthdays"],
  ["BABY_SHOWER", "Baby showers & seemantham"],
  ["HOUSEWARMING", "Housewarming & pujas"],
  ["FESTIVAL", "Festival celebrations"],
  ["GRADUATION", "Graduations"],
  ["CORPORATE", "Corporate events"],
);

export type EventServiceDetails = {
  services: string[];
  rentalItems: string[];
  delivery: boolean; // party rentals: delivers and sets up
  occasions: string[];
  areasServed: string;
  languages: string[];
  insured: boolean;
  yearsExperience: number | null;
};

export const EMPTY_EVENT_SERVICE: EventServiceDetails = {
  services: [],
  rentalItems: [],
  delivery: false,
  occasions: ["WEDDING"],
  areasServed: "",
  languages: ["English"],
  insured: false,
  yearsExperience: null,
};

export function readEventService(json: string): EventServiceDetails | null {
  try {
    const d = JSON.parse(json);
    return d && Array.isArray(d.services) && d.services.length ? { ...EMPTY_EVENT_SERVICE, ...d } : null;
  } catch {
    return null;
  }
}

export function parseEventServiceForm(form: FormData, languages: readonly string[]): EventServiceDetails | { error: string } {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const many = (name: string, list: { id: string }[]) => form.getAll(name).map(String).filter((id) => list.some((o) => o.id === id));
  const services = many("e_services", EVENT_SERVICES);
  if (!services.length) return { error: "Choose at least one service you offer." };
  const rentals = services.includes("RENTALS");
  const rentalItems = rentals ? many("e_rentalItems", RENTAL_ITEMS) : [];
  if (rentals && !rentalItems.length) return { error: "Choose what you rent out." };
  if (rentalItems.includes("BOUNCE") && form.get("e_inflatableConfirm") !== "on") {
    return { error: "Bounce-house rentals must confirm they're insured and set up and anchored by trained staff." };
  }
  const occasions = many("e_occasions", OCCASIONS);
  if (!occasions.length) return { error: "Choose the occasions you work." };
  if (services.includes("BARTENDING") && form.get("e_alcoholConfirm") !== "on") {
    return { error: "Bartenders must confirm they serve only host-provided alcohol to guests 21+, or hold the required liquor license." };
  }
  if ((services.includes("PHOTOGRAPHY") || services.includes("VIDEOGRAPHY")) && form.get("e_portfolioConfirm") !== "on") {
    return { error: "Please confirm the work you show is your own and you have permission from the people in it." };
  }
  const years = Number(get("e_years"));
  return {
    services,
    rentalItems,
    delivery: rentals && form.get("e_delivery") === "on",
    occasions,
    areasServed: get("e_areasServed").slice(0, 150),
    languages: form.getAll("e_languages").map(String).filter((l) => languages.includes(l)),
    insured: form.get("e_insured") === "on",
    yearsExperience: get("e_years") && Number.isInteger(years) && years >= 0 && years <= 60 ? years : null,
  };
}

const label = (list: { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? "";
export const serviceLabels = (d: EventServiceDetails) => d.services.map((id) => label(EVENT_SERVICES, id)).filter(Boolean);
export const rentalItemLabels = (d: EventServiceDetails) => d.rentalItems.map((id) => label(RENTAL_ITEMS, id)).filter(Boolean);
export const occasionLabels = (d: EventServiceDetails) => d.occasions.map((id) => label(OCCASIONS, id)).filter(Boolean);

export function eventServiceSearchText(d: EventServiceDetails) {
  return [...serviceLabels(d), ...rentalItemLabels(d), ...occasionLabels(d), d.areasServed, ...d.languages].join(" ");
}

export type EventServiceFilters = { service?: string; item?: string; occasion?: string; insured?: boolean };

export function matchesEventServiceFilters(d: EventServiceDetails | null, f: EventServiceFilters) {
  if (!f.service && !f.item && !f.occasion && !f.insured) return true;
  if (!d) return false;
  if (f.service && !d.services.includes(f.service)) return false;
  if (f.item && !d.rentalItems.includes(f.item)) return false;
  if (f.occasion && !d.occasions.includes(f.occasion)) return false;
  if (f.insured && !d.insured) return false;
  return true;
}
