import type { Chip, Filters } from "@/lib/filters";
import type { Highlights as H } from "@/lib/highlights";
import type { DealItem } from "@/lib/normalizeDeals";
import type { ResultsView } from "@/lib/layouts";
import type { PriceGroup } from "@/lib/priceMatch";

export interface Facets {
  stores: [string, number][];
  categories: [string, number][];
  subCategories: [string, number][];
  brands: [string, number][];
  bandCounts: Record<string, number>;
  endingCount: number;
}

/** Everything a layout needs. The page owns the data and state; layouts only render. */
export interface ViewProps {
  loading: boolean;
  hasData: boolean;
  deals: DealItem[];
  results: DealItem[];
  tabScoped: DealItem[];
  highlights: H;
  facets: Facets;
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
  clearFilters: () => void;
  toggleChip: (c: Chip) => void;
  priceMax: number;
  expiredCount: number;
  hiddenCount: number;
  restoreHidden: () => void;
  cartIds: Set<string>;
  toggleStar: (d: DealItem) => void;
  hideDeal: (d: DealItem) => void;
  openCompare: (d: DealItem) => void;
  asOf: string;
  priceGroups: PriceGroup[];
  view: ResultsView;
  setView: (v: ResultsView) => void;
}
