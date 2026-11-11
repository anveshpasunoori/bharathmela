const descriptionPrompts: Record<string, string> = {
  FOOD: "Name your dishes or products, portion sizes, ordering deadline, and pickup or delivery days.",
  TUTORING: "List the subjects, grade levels, lesson format, and available times.",
  DANCE_MUSIC: "Name the dance style or instrument, experience levels, class format, and schedule.",
  EVENT_SERVICES: "Explain what each package includes, your service area, and how far ahead to book.",
  DOMESTIC_HELP: "Describe the work you take on, your availability, and the areas you serve.",
  HOME_SERVICES: "List common jobs, areas you serve, and what customers should send for a quote.",
  AUTO: "List the repairs or services you offer, the vehicles you work on, and how to book.",
  BEAUTY: "Name your services, typical appointment lengths, and how to book.",
  ROOM_RENTAL: "Include move-in date, lease length, utilities, and amenities.",
  REALTOR: "List the neighborhoods you cover and the kinds of buyers or sellers you help.",
  LEGAL: "State your practice areas, jurisdictions, and how to request a consultation.",
  TAX_FINANCE: "List the filings or accounting services you handle and how consultations work.",
  TRAVEL: "Explain the trips you help with, what your service includes, and how to request a quote.",
  ART: "Include the materials, dimensions, customization options, and turnaround time.",
  CLOTHING: "Include sizes, materials, customization, and shipping or pickup options.",
  GARAGE_SALE: "List the date, hours, and a few examples of items available.",
  CREATORS: "List your platforms, content formats, and examples of past collaborations.",
  GOODS: "Explain what is included, when it is available, and how customers can order.",
};

export function listingDescriptionPrompt(category: string) {
  return descriptionPrompts[category] ?? "Explain what you offer, where you serve buyers, and how they can get started.";
}

export function listingSuggestions(listing: {
  description: string;
  priceCents: number | null;
  priceUnit: string;
  category: string;
}, photoCount: number) {
  const suggestions: { field: string; label: string; detail: string }[] = [];
  if (photoCount === 0) {
    suggestions.push({ field: "listing-photos", label: "Add a cover photo", detail: "Use a well-lit photo of your actual product, work, or space." });
  } else if (photoCount === 1) {
    suggestions.push({ field: "listing-photos", label: "Show another angle", detail: "Add a close-up, a second view, or another example of your work." });
  }
  if (listing.description.trim().split(/\s+/).length < 25) {
    suggestions.push({ field: "description", label: "Answer common buyer questions", detail: listingDescriptionPrompt(listing.category) });
  }
  if (listing.priceCents == null && listing.category !== "GARAGE_SALE") {
    suggestions.push({ field: "price", label: "Help buyers budget", detail: "Add a typical price if you have one. For custom quotes, explain in the description what affects the price." });
  } else if (listing.priceCents != null && !listing.priceUnit.trim() && listing.category !== "ROOM_RENTAL") {
    suggestions.push({ field: "priceUnit", label: "Clarify what the price covers", detail: "Say whether the amount is per item, per hour, per visit, or a starting price." });
  }
  return suggestions;
}
