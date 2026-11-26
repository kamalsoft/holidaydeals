"use client";

import { type ReactElement, useEffect, useMemo, useState } from "react";
import CompareDrawer from "@/components/CompareDrawer";
import ShortlistModal from "@/components/ShortlistModal";
import Footer from "@/components/Footer";
import Preferences from "@/components/Preferences";
import ClassicView from "@/components/layouts/ClassicView";
import FeedView from "@/components/layouts/FeedView";
import SpotlightView from "@/components/layouts/SpotlightView";
import DashboardView from "@/components/layouts/DashboardView";
import type { ViewProps } from "@/components/layouts/types";
import { type DealItem, type SheetsResponse, dealKey } from "@/lib/normalizeDeals";
import { loadSheet } from "@/lib/loadSheet";
import { buildHighlights } from "@/lib/highlights";
import { type Chip, DEFAULT_FILTERS, DISCOUNT_BANDS, type Filters, applyFilters, facet, sortDeals } from "@/lib/filters";
import { findSimilar } from "@/lib/compare";
import { type CartItem, toCartItem } from "@/lib/cart";
import { DEFAULT_SHEET_ID, DEFAULT_TABS } from "@/lib/sheetUrl";
import { loadJson, saveJson } from "@/lib/storage";
import { buildPriceGroups } from "@/lib/priceMatch";
import { DEFAULT_LAYOUT, LAYOUTS, type LayoutId, type ResultsView, VIEW_KEY, parseLayout } from "@/lib/layouts";

const LAYOUT_VIEWS: Record<LayoutId, (p: ViewProps) => ReactElement> = {
  classic: ClassicView,
  feed: FeedView,
  spotlight: SpotlightView,
  dashboard: DashboardView,
};

const KEY_CART = "hdf.cart";
const KEY_HIDDEN = "hdf.hidden";

export default function Home() {
  // The sheet is fixed to the project's source; the link box was removed.
  const sheetId = DEFAULT_SHEET_ID;
  const tabNames = DEFAULT_TABS;

  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<LayoutId>(DEFAULT_LAYOUT);
  const [view, setView] = useState<ResultsView>("cards");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  const [data, setData] = useState<SheetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [compareDeal, setCompareDeal] = useState<DealItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // Restore per-browser preferences and the layout from the URL after mount.
  /* eslint-disable react-hooks/set-state-in-effect -- reading localStorage and the URL must wait for mount to avoid hydration mismatch */
  useEffect(() => {
    setCart(loadJson(KEY_CART, []));
    setHidden(loadJson(KEY_HIDDEN, []));
    setView(loadJson<ResultsView>(VIEW_KEY, "cards"));
    setLayout(parseLayout(new URLSearchParams(window.location.search).get("layout")));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Switching layout updates the address bar, so the link can be shared.
  const changeLayout = (id: LayoutId) => {
    setLayout(id);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", id);
    window.history.replaceState(null, "", url.toString());
  };

  useEffect(() => { if (ready) saveJson(KEY_HIDDEN, hidden); }, [ready, hidden]);
  useEffect(() => { if (ready) saveJson(KEY_CART, cart); }, [ready, cart]);
  useEffect(() => { if (ready) saveJson(VIEW_KEY, view); }, [ready, view]);

  // Fetch the sheet in the browser (the static site has no server).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    // Reset the loading flag when a new request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    loadSheet(sheetId, tabNames)
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load the sheet.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, sheetId, tabNames]);

  // Per-device hides: hidden deals are removed everywhere (cards, highlights, facets, compare).
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const deals = useMemo(
    () => (data?.deals ?? []).filter((d) => !hiddenSet.has(dealKey(d))),
    [data, hiddenSet],
  );
  const priceMax = useMemo(() => Math.ceil(deals.reduce((m, d) => Math.max(m, d.price ?? 0), 0)), [deals]);
  const expiredCount = useMemo(() => deals.filter((d) => d.expired).length, [deals]);

  // Scope to the selected tab first; highlights and facets follow that scope.
  const tabScoped = useMemo(
    () => (filters.tab === "ALL" ? deals : deals.filter((d) => d.tabs.includes(filters.tab))),
    [deals, filters.tab],
  );
  const highlights = useMemo(() => buildHighlights(tabScoped), [tabScoped]);
  const facets = useMemo(() => {
    const base = applyFilters(deals, { ...filters, stores: [], categories: [], subCategories: [], brands: [], bands: [], endingOnly: false });
    return {
      stores: facet(base, "store"),
      categories: facet(base, "category"),
      subCategories: facet(base, "subCategory"),
      brands: facet(base, "brand"),
      bandCounts: Object.fromEntries(DISCOUNT_BANDS.map((b) => [b.id, base.filter((d) => d.offPercent !== null && d.offPercent >= b.min && d.offPercent <= b.max).length])),
      endingCount: base.filter((d) => d.expiringSoon).length,
    };
  }, [deals, filters]);

  const results = useMemo(() => sortDeals(applyFilters(deals, filters), filters.sort), [deals, filters]);
  const cartIds = useMemo(() => new Set(cart.map((i) => i.id)), [cart]);
  const priceGroups = useMemo(() => (view === "match" ? buildPriceGroups(results) : []), [results, view]);
  const compareSimilar = useMemo(
    () => (compareDeal ? findSimilar(compareDeal, deals) : []),
    [compareDeal, deals],
  );

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const toggleChip = (c: Chip) =>
    patch({ chips: filters.chips.includes(c) ? filters.chips.filter((x) => x !== c) : [...filters.chips, c] });
  const hideDeal = (d: DealItem) =>
    setHidden((prev) => (prev.includes(dealKey(d)) ? prev : [...prev, dealKey(d)]));
  const toggleStar = (d: DealItem) =>
    setCart((prev) => (prev.some((i) => i.id === d.id) ? prev.filter((i) => i.id !== d.id) : [...prev, toCartItem(d)]));
  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS, tab: filters.tab, hideExpired: filters.hideExpired });

  const asOf = data ? new Date(data.fetchedAt).toLocaleString() : "—";

  const vm: ViewProps = {
    loading,
    hasData: !!data,
    deals,
    results,
    tabScoped,
    highlights,
    facets,
    filters,
    patch,
    clearFilters,
    toggleChip,
    priceMax,
    expiredCount,
    hiddenCount: hidden.length,
    restoreHidden: () => setHidden([]),
    cartIds,
    toggleStar,
    hideDeal,
    openCompare: setCompareDeal,
    asOf,
    priceGroups,
    view,
    setView,
  };
  const Current = LAYOUT_VIEWS[layout];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top bar: title, search, layout, display settings, wishlist */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">Holiday Deal Finder</span>
            <span aria-hidden> ✨</span>
          </h1>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Thanksgiving Day Deals 2026</span>
          <label className="relative order-last min-w-0 flex-1 basis-full sm:order-none sm:basis-auto">
            <span className="sr-only">Search deals</span>
            <input
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder="Search product, brand, store, notes…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/40 focus:ring-4 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            Layout
            <select
              value={layout}
              onChange={(e) => changeLayout(e.target.value as LayoutId)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <Preferences />
          <button type="button" onClick={() => setCartOpen(true)} className="relative rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300">
            🎁 Wishlist
            {cart.length > 0 && <span className="ml-1.5 rounded-full bg-slate-900 px-1.5 text-xs text-white">{cart.length}</span>}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {data?.tabs.some((t) => t.error) && (
          <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-300">
            {data.tabs.filter((t) => t.error).map((t) => <li key={t.name}>⚠ {t.name}: {t.error}</li>)}
          </ul>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <Current {...vm} />

        <Footer sheetId={sheetId} asOf={data ? asOf : null} />
      </div>

      <CompareDrawer target={compareDeal} similar={compareSimilar} onClose={() => setCompareDeal(null)} />
      <ShortlistModal
        open={cartOpen}
        items={cart}
        onRemove={(id) => setCart((prev) => prev.filter((i) => i.id !== id))}
        onClear={() => setCart([])}
        onClose={() => setCartOpen(false)}
      />
    </main>
  );
}
