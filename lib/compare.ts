import type { DealItem } from "./normalizeDeals";

export interface Similar {
  item: DealItem;
  similarity: number;
}

// Shortcut: a small hand-picked stop list and Jaccard on tokens, not a real matcher.
// Upgrade to a proper fuzzy matcher if matches look wrong.
const STOP = new Set(["the", "and", "with", "for", "inch", "class", "series", "smart", "new", "black", "white", "pack"]);

const tokensOf = (d: DealItem) =>
  new Set(
    `${d.brand} ${d.title}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );

/** Similar deals from other stores, cheapest first. Requires matching brand when both have one. */
export function findSimilar(target: DealItem, all: DealItem[], limit = 12, threshold = 0.3): Similar[] {
  const tt = tokensOf(target);
  const out: Similar[] = [];
  for (const d of all) {
    if (d.id === target.id || d.store === target.store) continue;
    if (target.brand && d.brand && target.brand.toLowerCase() !== d.brand.toLowerCase()) continue;
    const dt = tokensOf(d);
    let inter = 0;
    for (const t of tt) if (dt.has(t)) inter++;
    const union = tt.size + dt.size - inter;
    const similarity = union ? inter / union : 0;
    if (similarity >= threshold) out.push({ item: d, similarity });
  }
  return out
    .sort((a, b) => (a.item.price ?? Number.MAX_SAFE_INTEGER) - (b.item.price ?? Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
}
