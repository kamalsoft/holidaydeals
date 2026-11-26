import type { Chip, Filters } from "./filters";

/** Page layouts. Pick one with ?layout=<id> in the URL. The first entry is the default. */
export const LAYOUTS = [
  { id: "classic", name: "Classic" },
  { id: "feed", name: "Feed" },
  { id: "spotlight", name: "Spotlight" },
  { id: "dashboard", name: "Dashboard" },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]["id"];
export const DEFAULT_LAYOUT: LayoutId = "classic";

export function parseLayout(value: string | null): LayoutId {
  return LAYOUTS.some((l) => l.id === value) ? (value as LayoutId) : DEFAULT_LAYOUT;
}

export const CHIPS: { id: Chip; label: string }[] = [
  { id: "under25", label: "Under $25" },
  { id: "under100", label: "Under $100" },
  { id: "off50", label: "50%+ off" },
  { id: "warehouse", label: "Warehouse / Club" },
];

export const SORTS: { id: Filters["sort"]; label: string }[] = [
  { id: "score", label: "Best Deal Score" },
  { id: "off", label: "Biggest % off" },
  { id: "priceAsc", label: "Price: low to high" },
  { id: "priceDesc", label: "Price: high to low" },
  { id: "ending", label: "Ending soonest" },
];

export type ResultsView = "cards" | "table" | "match";
export const VIEW_KEY = "hdf.view";
