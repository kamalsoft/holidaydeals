import { tokensOf } from "./compare";
import type { DealItem } from "./normalizeDeals";

/** The same product sold at two or more stores, one offer per store, cheapest first. */
export interface PriceGroup {
  id: string;
  title: string;
  brand: string;
  offers: DealItem[];
  lowest: DealItem;
  highest: DealItem;
  savings: number;
  savingsPct: number;
}

const SEED_LIMIT = 300;
const MAX_GROUPS = 60;
const THRESHOLD = 0.3; // same Jaccard threshold the Compare drawer uses

/**
 * Groups deals that look like the same product across stores (title tokens + brand),
 * using only the items passed in, so the groups follow the active filters.
 * Shortcut: token overlap, not a real product-ID match. Upgrade if matches look wrong.
 */
export function buildPriceGroups(items: DealItem[]): PriceGroup[] {
  // Deals without a store name cannot be compared by store, so they are left out.
  const priced = items.filter((d) => d.price !== null && d.store.trim() !== "");
  const price = (d: DealItem) => d.price ?? 0;
  const cache = new Map<string, Set<string>>();
  const tokens = (d: DealItem) => {
    let t = cache.get(d.id);
    if (!t) {
      t = tokensOf(d);
      cache.set(d.id, t);
    }
    return t;
  };

  const seeds = [...priced].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, SEED_LIMIT);
  const used = new Set<string>();
  const groups: PriceGroup[] = [];

  for (const seed of seeds) {
    if (used.has(seed.id)) continue;
    const st = tokens(seed);
    const members: DealItem[] = [seed];
    for (const d of priced) {
      if (d.id === seed.id || used.has(d.id)) continue;
      if (seed.brand && d.brand && seed.brand.toLowerCase() !== d.brand.toLowerCase()) continue;
      const dt = tokens(d);
      let inter = 0;
      for (const t of st) if (dt.has(t)) inter++;
      const union = st.size + dt.size - inter;
      if (union && inter / union >= THRESHOLD) members.push(d);
    }

    // One offer per store: keep the cheapest listing from each store.
    const byStore = new Map<string, DealItem>();
    for (const d of members) {
      const cur = byStore.get(d.store);
      if (!cur || price(d) < price(cur)) byStore.set(d.store, d);
    }
    const offers = [...byStore.values()].sort((a, b) => price(a) - price(b));
    if (offers.length < 2) continue;

    members.forEach((m) => used.add(m.id));
    const lowest = offers[0];
    const highest = offers[offers.length - 1];
    const savings = price(highest) - price(lowest);
    groups.push({
      id: seed.id,
      title: seed.title,
      brand: seed.brand || lowest.brand,
      offers,
      lowest,
      highest,
      savings,
      savingsPct: price(highest) > 0 ? Math.round((savings / price(highest)) * 100) : 0,
    });
  }

  return groups.sort((a, b) => b.savings - a.savings).slice(0, MAX_GROUPS);
}
