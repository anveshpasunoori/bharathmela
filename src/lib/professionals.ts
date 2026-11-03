// Licensed professionals (realtors and lawyers): license details, specialties and languages,
// stored as JSON in Listing.details. Shared by the form (client), server actions and pages.

export const PROFESSIONAL_CATEGORIES = ["REALTOR", "LEGAL"] as const;
export const isProfessional = (category: string) => (PROFESSIONAL_CATEGORIES as readonly string[]).includes(category);

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Marathi", "Gujarati", "Punjabi", "Bengali", "Urdu", "Odia", "Konkani", "Nepali",
] as const;

const opts = (...pairs: [string, string][]) => pairs.map(([id, label]) => ({ id, label }));

// What each kind of professional can offer, used for the form chips and buyer filters.
export const SPECIALTIES: Record<string, { id: string; label: string }[]> = {
  REALTOR: opts(
    ["BUYING", "Home buying"],
    ["SELLING", "Home selling"],
    ["FIRST_TIME", "First-time buyers"],
    ["NEW_CONSTRUCTION", "New construction"],
    ["INVESTMENT", "Investment properties"],
    ["RENTALS", "Rentals & leasing"],
    ["PROPERTY_MGMT", "Property management"],
    ["COMMERCIAL", "Commercial"],
    ["RELOCATION", "Relocation"],
  ),
  LEGAL: opts(
    ["IMMIGRATION", "Immigration (H-1B, green card, citizenship)"],
    ["FAMILY", "Family & divorce"],
    ["ESTATE", "Wills, trusts & estate planning"],
    ["REAL_ESTATE", "Real estate & leases"],
    ["BUSINESS", "Business formation & contracts"],
    ["EMPLOYMENT", "Employment"],
    ["TAX", "Tax"],
    ["CRIMINAL", "Criminal defense & traffic"],
    ["PERSONAL_INJURY", "Personal injury"],
    ["BANKRUPTCY", "Bankruptcy & debt"],
    ["IP", "Patents, trademarks & IP"],
    ["NRI", "India property & NRI matters"],
  ),
};

export const LICENSE_LABELS: Record<string, { license: string; firm: string; firmHint: string }> = {
  REALTOR: { license: "Real estate license number", firm: "Brokerage", firmHint: "e.g. Coldwell Banker Realty" },
  LEGAL: { license: "Bar number", firm: "Law firm (or \"Solo practice\")", firmHint: "e.g. Rao Immigration Law, PC" },
};

export type ProfessionalDetails = {
  licenseNumber: string;
  licenseState: string;
  firm: string;
  specialties: string[];
  languages: string[];
  freeConsultation: boolean;
  yearsExperience: number | null;
};

export const EMPTY_PROFESSIONAL: ProfessionalDetails = {
  licenseNumber: "",
  licenseState: "",
  firm: "",
  specialties: [],
  languages: ["English"],
  freeConsultation: false,
  yearsExperience: null,
};

export function readProfessional(json: string): ProfessionalDetails | null {
  try {
    const d = JSON.parse(json);
    return d && d.licenseNumber ? { ...EMPTY_PROFESSIONAL, ...d } : null;
  } catch {
    return null;
  }
}

export function parseProfessionalForm(form: FormData, category: string): ProfessionalDetails | { error: string } {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const licenseNumber = get("p_licenseNumber").toUpperCase().replace(/\s+/g, "");
  const licenseState = get("p_licenseState");
  const firm = get("p_firm").slice(0, 120);
  if (!/^[A-Z0-9-]{3,20}$/.test(licenseNumber)) {
    return { error: `Enter your ${category === "LEGAL" ? "bar" : "real estate license"} number (letters and digits only).` };
  }
  if (!(US_STATES as readonly string[]).includes(licenseState)) return { error: "Choose the state that issued your license." };
  if (firm.length < 2) return { error: category === "LEGAL" ? "Enter your law firm, or \"Solo practice\"." : "Enter your supervising brokerage." };
  const specialties = form.getAll("p_specialties").map(String).filter((id) => SPECIALTIES[category]?.some((s) => s.id === id));
  if (!specialties.length) return { error: category === "LEGAL" ? "Choose at least one practice area." : "Choose at least one service." };
  const languages = form.getAll("p_languages").map(String).filter((l) => (LANGUAGES as readonly string[]).includes(l));
  if (!languages.length) return { error: "Choose the languages you work in." };
  const years = Number(get("p_years"));
  if (form.get("p_licenseConfirm") !== "on") return { error: "Please confirm your license is active and in good standing." };
  return {
    licenseNumber,
    licenseState,
    firm,
    specialties,
    languages,
    freeConsultation: form.get("p_freeConsultation") === "on",
    yearsExperience: get("p_years") && Number.isInteger(years) && years >= 0 && years <= 60 ? years : null,
  };
}

export const specialtyLabels = (category: string, d: ProfessionalDetails) =>
  d.specialties.map((id) => SPECIALTIES[category]?.find((s) => s.id === id)?.label).filter(Boolean) as string[];

export function licenseLine(category: string, d: ProfessionalDetails) {
  return category === "LEGAL" ? `${d.licenseState} Bar #${d.licenseNumber}` : `${d.licenseState} RE License #${d.licenseNumber}`;
}

// A web search admins and buyers can use to look the license up with the state.
export function licenseLookupUrl(category: string, d: ProfessionalDetails) {
  const what = category === "LEGAL" ? `${d.licenseState} state bar attorney search ${d.licenseNumber}` : `${d.licenseState} real estate license lookup ${d.licenseNumber}`;
  return `https://www.google.com/search?q=${encodeURIComponent(what)}`;
}

export function professionalSearchText(category: string, d: ProfessionalDetails) {
  return [d.firm, ...specialtyLabels(category, d), ...d.languages, d.freeConsultation ? "free consultation" : ""].join(" ");
}

export type ProfessionalFilters = { specialty?: string; language?: string; freeConsult?: boolean };

export function matchesProfessionalFilters(d: ProfessionalDetails | null, f: ProfessionalFilters) {
  if (!f.specialty && !f.language && !f.freeConsult) return true;
  if (!d) return false;
  if (f.specialty && !d.specialties.includes(f.specialty)) return false;
  if (f.language && !d.languages.includes(f.language)) return false;
  if (f.freeConsult && !d.freeConsultation) return false;
  return true;
}
