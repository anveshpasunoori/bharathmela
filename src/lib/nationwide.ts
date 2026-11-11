export const NATIONWIDE_TAG = ",NATIONWIDE,";

export const NATIONWIDE_OPTIONS: Record<string, string> = {
  CLOTHING: "I ship clothing or jewelry across the US",
  TUTORING: "I offer online tutoring to students across the US",
  DANCE_MUSIC: "I offer online dance or music classes across the US",
  ART: "I ship art or crafts across the US",
  GOODS: "I ship these goods across the US",
};

export function nationwideOption(category: string) {
  return Object.hasOwn(NATIONWIDE_OPTIONS, category) ? NATIONWIDE_OPTIONS[category] : undefined;
}

export const NATIONWIDE_CATEGORIES = [...Object.keys(NATIONWIDE_OPTIONS), "CREATORS"];

export function isNationwideListing({ category, tags }: { category: string; tags: string }) {
  return NATIONWIDE_CATEGORIES.includes(category) && tags.includes(NATIONWIDE_TAG);
}

export function withNationwideTag(tags: string) {
  return tags ? `${tags}${NATIONWIDE_TAG.slice(1)}` : NATIONWIDE_TAG;
}
