import type { DealItem } from "./normalizeDeals";

export type Chip = "under25" | "under100" | "off50" | "warehouse";
export type SortKey = "score" | "off" | "priceAsc" | "priceDesc" | "ending";

export interface Filters {
  query: string;
  tab: string; // "ALL" or a tab name
  stores: string[];
  categories: string[];
  subCategories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number | null; // null = no upper cap
  minOff: number;
  bands: string[]; // discount-depth band ids, see DISCOUNT_BANDS
  endingOnly: boolean;
  hideExpired: boolean;
  chips: Chip[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  tab: "ALL",
  stores: [],
  categories: [],
  subCategories: [],
  brands: [],
  minPrice: 0,
  maxPrice: null,
  minOff: 0,
  bands: [],
  endingOnly: false,
  hideExpired: true,
  chips: [],
  sort: "score",
};

export const DISCOUNT_BANDS = [
  { id: "1-24", label: "1–24% off", min: 1, max: 24 },
  { id: "25-49", label: "25–49% off", min: 25, max: 49 },
  { id: "50-74", label: "50–74% off", min: 50, max: 74 },
  { id: "75-100", label: "75%+ off", min: 75, max: 100 },
];

const WAREHOUSE = /costco|sam'?s club/i;

export function applyFilters(items: DealItem[], f: Filters): DealItem[] {
  const q = f.query.trim().toLowerCase();
  return items.filter((d) => {
    if (f.tab !== "ALL" && !d.tabs.includes(f.tab)) return false;
    if (f.hideExpired && d.expired) return false;
    if (q && !`${d.title} ${d.brand} ${d.store} ${d.notes} ${d.category} ${d.subCategory}`.toLowerCase().includes(q)) return false;
    if (f.stores.length && !f.stores.includes(d.store)) return false;
    if (f.categories.length && !f.categories.includes(d.category)) return false;
    if (f.subCategories.length && !f.subCategories.includes(d.subCategory)) return false;
    if (f.brands.length && !f.brands.includes(d.brand)) return false;
    // Items without a price are kept unless a price bound is set.
    if (d.price !== null) {
      if (d.price < f.minPrice) return false;
      if (f.maxPrice !== null && d.price > f.maxPrice) return false;
    } else if (f.minPrice > 0 || f.maxPrice !== null) {
      return false;
    }
    if (f.minOff > 0 && (d.offPercent ?? 0) < f.minOff) return false;
    if (f.bands.length) {
      const off = d.offPercent ?? -1;
      const inBand = DISCOUNT_BANDS.some((b) => f.bands.includes(b.id) && off >= b.min && off <= b.max);
      if (!inBand) return false;
    }
    if (f.endingOnly && !d.expiringSoon) return false;
    for (const c of f.chips) {
      if (c === "under25" && (d.price === null || d.price >= 25)) return false;
      if (c === "under100" && (d.price === null || d.price >= 100)) return false;
      if (c === "off50" && (d.offPercent ?? 0) < 50) return false;
      if (c === "warehouse" && !WAREHOUSE.test(d.store)) return false;
    }
    return true;
  });
}

export function sortDeals(items: DealItem[], sort: SortKey): DealItem[] {
  const num = (v: number | null, fallback: number) => (v === null ? fallback : v);
  const cmp = {
    score: (a: DealItem, b: DealItem) => num(b.score, -1) - num(a.score, -1),
    off: (a: DealItem, b: DealItem) => num(b.offPercent, -1) - num(a.offPercent, -1),
    priceAsc: (a: DealItem, b: DealItem) => num(a.price, Number.MAX_SAFE_INTEGER) - num(b.price, Number.MAX_SAFE_INTEGER),
    priceDesc: (a: DealItem, b: DealItem) => num(b.price, -1) - num(a.price, -1),
    ending: (a: DealItem, b: DealItem) => num(a.endsAt, Number.MAX_SAFE_INTEGER) - num(b.endsAt, Number.MAX_SAFE_INTEGER),
  }[sort];
  return [...items].sort(cmp);
}

/** Counts per facet value, most frequent first. */
export function facet(items: DealItem[], key: "store" | "category" | "subCategory" | "brand"): [string, number][] {
  const m = new Map<string, number>();
  for (const d of items) {
    const v = d[key];
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** True when any filter, search, chip or sort differs from the defaults. */
export function isFiltered(f: Filters): boolean {
  const d = DEFAULT_FILTERS;
  return (
    f.query.trim() !== "" ||
    f.tab !== d.tab ||
    f.stores.length > 0 ||
    f.categories.length > 0 ||
    f.subCategories.length > 0 ||
    f.brands.length > 0 ||
    f.minPrice !== d.minPrice ||
    f.maxPrice !== d.maxPrice ||
    f.minOff !== d.minOff ||
    f.bands.length > 0 ||
    f.endingOnly !== d.endingOnly ||
    f.hideExpired !== d.hideExpired ||
    f.chips.length > 0 ||
    f.sort !== d.sort
  );
}
