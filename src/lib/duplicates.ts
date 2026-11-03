// Near-duplicate detection for listing text: word 3-gram (shingle) overlap. Catches a seller
// reposting the same ad, and one account copying another's ad (a common scam pattern).

function shingles(text: string) {
  const words = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set<string>();
  if (words.length < 3) {
    if (words.length) set.add(words.join(" "));
    return set;
  }
  for (let i = 0; i + 3 <= words.length; i++) set.add(words.slice(i, i + 3).join(" "));
  return set;
}

// Jaccard similarity of two texts' shingles, 0 (nothing shared) to 1 (identical wording).
export function similarity(a: string, b: string) {
  const x = shingles(a);
  const y = shingles(b);
  if (!x.size || !y.size) return 0;
  let shared = 0;
  for (const s of x) if (y.has(s)) shared++;
  return shared / (x.size + y.size - shared);
}

export const SAME_SELLER_DUPLICATE = 0.8;
export const CROSS_SELLER_COPY = 0.7;

type Candidate = { id: string; title: string; description: string; vendorId: string };

export function findDuplicates(text: string, vendorId: string, candidates: Candidate[]) {
  let own: Candidate | null = null;
  let copied: Candidate | null = null;
  for (const c of candidates) {
    const score = similarity(text, `${c.title} ${c.description}`);
    if (c.vendorId === vendorId && score >= SAME_SELLER_DUPLICATE && !own) own = c;
    if (c.vendorId !== vendorId && score >= CROSS_SELLER_COPY && !copied) copied = c;
  }
  return { own, copied };
}
