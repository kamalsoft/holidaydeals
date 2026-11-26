import { tokensOf } from "./compare";
import type { DealItem } from "./normalizeDeals";

/** Model codes such as "q60cf", "u8000h", "htw265aswwww": letters and digits, at least 3 characters. */
function modelCodes(d: DealItem): Set<string> {
  const out = new Set<string>();
  for (const t of `${d.brand} ${d.title}`.toLowerCase().split(/[^a-z0-9]+/)) {
    // Specs such as 1080p, 4k, 256gb or 4900mah are not model numbers.
    if (t.length >= 3 && /[a-z]/.test(t) && /\d/.test(t) && !/^\d+(k|p|g|gb|tb|hz|mah|w|v)$/.test(t)) out.add(t);
  }
  return out;
}

/** Screen or capacity sizes written as numbers before inch, ", or cu. ft. */
function sizes(d: DealItem): Set<string> {
  const out = new Set<string>();
  for (const m of d.title.toLowerCase().matchAll(/(\d{1,3}(?:\.\d)?)\s*(?:-?inch|"|”|-?cu\.?|cu\.?\s*ft|cu ft|-?qt\\.?|-?quart|-?gal)/g)) {
    out.add(m[1]);
  }
  return out;
}

const shares = (a: Set<string>, b: Set<string>) => [...a].some((x) => b.has(x));

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
const NO_MODEL_THRESHOLD = 0.75; // title overlap needed when neither product has a model code

/**
 * Groups deals that look like the same product across stores (title tokens + brand),
 * using only the items passed in, so the groups follow the active filters.
 * Matches on shared model codes and matching sizes; falls back to near-identical titles.
 * Shortcut: no UPC or retailer product ID exists in the sheet, so this is still an estimate.
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
    const seedModels = modelCodes(seed);
    const seedSizes = sizes(seed);
    const members: DealItem[] = [seed];
    for (const d of priced) {
      if (d.id === seed.id || used.has(d.id)) continue;
      if (seed.brand && d.brand && seed.brand.toLowerCase() !== d.brand.toLowerCase()) continue;
      // A different screen or capacity size means a different product.
      const dSizes = sizes(d);
      if (seedSizes.size && dSizes.size && !shares(seedSizes, dSizes)) continue;
      const dModels = modelCodes(d);
      // Same model code is the strongest signal. Without model codes, require near-identical titles.
      const sameModel = seedModels.size > 0 && dModels.size > 0 && shares(seedModels, dModels);
      const sameTitle = (() => {
        const st = tokens(seed);
        const dt = tokens(d);
        let inter = 0;
        for (const t of st) if (dt.has(t)) inter++;
        const union = st.size + dt.size - inter;
        return union > 0 && inter / union >= NO_MODEL_THRESHOLD;
      })();
      if (sameModel || (seedModels.size === 0 && dModels.size === 0 && sameTitle)) members.push(d);
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
