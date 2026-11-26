"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import DealCard from "@/components/DealCard";
import DealTable from "@/components/DealTable";
import FilterSidebar from "@/components/FilterSidebar";
import CompareDrawer from "@/components/CompareDrawer";
import ShortlistModal from "@/components/ShortlistModal";
import Footer from "@/components/Footer";
import Highlights, { StatStrip } from "@/components/Highlights";
import { type DealItem, type SheetsResponse, dealKey } from "@/lib/normalizeDeals";
import { buildHighlights } from "@/lib/highlights";
import { type Chip, DEFAULT_FILTERS, type Filters, applyFilters, facet, sortDeals } from "@/lib/filters";
import { findSimilar } from "@/lib/compare";
import { type CartItem, toCartItem } from "@/lib/cart";
import { DEFAULT_SHEET_ID, DEFAULT_TABS, extractSpreadsheetId } from "@/lib/sheetUrl";
import { loadJson, saveJson } from "@/lib/storage";

const KEY_SHEET = "hdf.sheet";
const KEY_SHEETS = "hdf.sheets";
const KEY_TABS = "hdf.tabs";
const KEY_CART = "hdf.cart";
const KEY_HIDDEN = "hdf.hidden";
const PAGE_SIZE = 48;
const MAX_SAVED_SHEETS = 8;

const CHIPS: { id: Chip; label: string }[] = [
  { id: "under25", label: "Under $25" },
  { id: "under100", label: "Under $100" },
  { id: "off50", label: "50%+ off" },
  { id: "warehouse", label: "Warehouse / Club" },
];

const SORTS: { id: Filters["sort"]; label: string }[] = [
  { id: "score", label: "Best Deal Score" },
  { id: "off", label: "Biggest % off" },
  { id: "priceAsc", label: "Price: low to high" },
  { id: "priceDesc", label: "Price: high to low" },
  { id: "ending", label: "Ending soonest" },
];

export default function Home() {
  const [ready, setReady] = useState(false);
  const [sheetId, setSheetId] = useState(DEFAULT_SHEET_ID);
  const [savedSheets, setSavedSheets] = useState<string[]>([DEFAULT_SHEET_ID]);
  const [tabNames, setTabNames] = useState<string[]>(DEFAULT_TABS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  const [data, setData] = useState<SheetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [compareDeal, setCompareDeal] = useState<DealItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [sourceInput, setSourceInput] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [tabInput, setTabInput] = useState("");

  // Restore per-browser preferences after mount (avoids server/client mismatch).
  /* eslint-disable react-hooks/set-state-in-effect -- reading localStorage must wait for mount to avoid hydration mismatch */
  useEffect(() => {
    setSheetId(loadJson(KEY_SHEET, DEFAULT_SHEET_ID));
    setSavedSheets(loadJson(KEY_SHEETS, [DEFAULT_SHEET_ID]));
    setTabNames(loadJson(KEY_TABS, DEFAULT_TABS));
    setCart(loadJson(KEY_CART, []));
    setHidden(loadJson(KEY_HIDDEN, []));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => { if (ready) saveJson(KEY_HIDDEN, hidden); }, [ready, hidden]);
  useEffect(() => { if (ready) saveJson(KEY_SHEET, sheetId); }, [ready, sheetId]);
  useEffect(() => { if (ready) saveJson(KEY_SHEETS, savedSheets); }, [ready, savedSheets]);
  useEffect(() => { if (ready) saveJson(KEY_TABS, tabNames); }, [ready, tabNames]);
  useEffect(() => { if (ready) saveJson(KEY_CART, cart); }, [ready, cart]);

  // Fetch the sheet (server caches each tab's CSV for 5 minutes).
  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    // Reset the loading flag when a new request starts (sheet, tabs, or refresh changed).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ id: sheetId, tabs: tabNames.join(",") });
    fetch(`/api/sheets?${qs.toString()}`, { signal: ctrl.signal })
      .then(async (r) => {
        const json = (await r.json()) as SheetsResponse;
        if (!r.ok) throw new Error(json.error ?? "Request failed");
        return json;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
        setVisible(PAGE_SIZE);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load the sheet.");
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [ready, sheetId, tabNames, reloadKey]);

  // Per-device hides: hidden deals are removed everywhere (cards, highlights, facets, compare).
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const deals = useMemo(
    () => (data?.deals ?? []).filter((d) => !hiddenSet.has(dealKey(d))),
    [data, hiddenSet],
  );
  const hiddenCount = hidden.length;
  const priceMax = useMemo(() => Math.ceil(deals.reduce((m, d) => Math.max(m, d.price ?? 0), 0)), [deals]);
  const expiredCount = useMemo(() => deals.filter((d) => d.expired).length, [deals]);

  // Scope to the selected tab first; highlights and facets follow that scope.
  const tabScoped = useMemo(
    () => (filters.tab === "ALL" ? deals : deals.filter((d) => d.tabs.includes(filters.tab))),
    [deals, filters.tab],
  );
  const highlights = useMemo(() => buildHighlights(tabScoped), [tabScoped]);
  const facets = useMemo(() => {
    const base = applyFilters(deals, { ...filters, stores: [], categories: [], subCategories: [], brands: [] });
    return {
      stores: facet(base, "store"),
      categories: facet(base, "category"),
      subCategories: facet(base, "subCategory"),
      brands: facet(base, "brand"),
    };
  }, [deals, filters]);

  const results = useMemo(() => sortDeals(applyFilters(deals, filters), filters.sort), [deals, filters]);
  const cartIds = useMemo(() => new Set(cart.map((i) => i.id)), [cart]);
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

  function loadSource(e: FormEvent) {
    e.preventDefault();
    const id = extractSpreadsheetId(sourceInput);
    if (!id) {
      setSourceError("That isn't a Google Sheets link or spreadsheet ID.");
      return;
    }
    setSourceError(null);
    setSourceInput("");
    setSheetId(id);
    setSavedSheets((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX_SAVED_SHEETS));
    setFilters((f) => ({ ...f, tab: "ALL" }));
  }

  function removeSavedSheet(id: string) {
    setSavedSheets((prev) => prev.filter((x) => x !== id));
    if (id === sheetId) setSheetId(DEFAULT_SHEET_ID);
  }

  function addTab(e: FormEvent) {
    e.preventDefault();
    const name = tabInput.trim();
    if (!name || tabNames.includes(name)) return setTabInput("");
    setTabNames([...tabNames, name]);
    setTabInput("");
  }

  function removeTab(name: string) {
    setTabNames(tabNames.filter((t) => t !== name));
    if (filters.tab === name) patch({ tab: "ALL" });
  }

  const tabStatus = (name: string) => data?.tabs.find((t) => t.name === name);
  const asOf = data ? new Date(data.fetchedAt).toLocaleString() : "—";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 dark:text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
          <h1 className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">Holiday Deal Finder</span>
            <span aria-hidden> ✨</span>
          </h1>
          <form onSubmit={loadSource} className="flex flex-1 gap-2">
            <label htmlFor="sheet-input" className="sr-only">Google Sheets URL or ID</label>
            <input
              id="sheet-input"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="Paste a Google Sheets URL or spreadsheet ID"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/40 focus:ring-4 dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">Load</button>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Refresh data">↻</button>
            <button type="button" onClick={() => setCartOpen(true)} className="relative rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300">
              🎁 Wishlist
              {cart.length > 0 && <span className="ml-1.5 rounded-full bg-slate-900 px-1.5 text-xs text-white">{cart.length}</span>}
            </button>
          </form>
        </div>
        {sourceError && <p className="mx-auto max-w-7xl px-4 pb-2 text-xs text-rose-600">{sourceError}</p>}
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Saved sources + tabs */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-slate-500">Sources</span>
            {savedSheets.map((id) => (
              <span key={id} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${id === sheetId ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200" : "border-slate-300 dark:border-slate-700"}`}>
                <button type="button" onClick={() => setSheetId(id)} className="font-mono">{id.slice(0, 10)}…</button>
                {id !== sheetId && <button type="button" onClick={() => removeSavedSheet(id)} aria-label="Remove source" className="text-slate-400 hover:text-rose-600">×</button>}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => patch({ tab: "ALL" })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filters.tab === "ALL" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"}`}
            >
              All tabs unified
            </button>
            {tabNames.map((t) => {
              const st = tabStatus(t);
              const active = filters.tab === t;
              return (
                <span key={t} className={`inline-flex items-center gap-1 rounded-full px-1 py-1 ring-1 ${active ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"}`}>
                  <button type="button" onClick={() => patch({ tab: t })} className="px-3 text-sm font-semibold">
                    {t}{st ? <span className="ml-1.5 text-xs opacity-80">{st.error ? "⚠" : st.count}</span> : null}
                  </button>
                  <button type="button" onClick={() => removeTab(t)} aria-label={`Remove tab ${t}`} className="pr-2 text-xs opacity-60 hover:opacity-100">×</button>
                </span>
              );
            })}
            <form onSubmit={addTab} className="inline-flex gap-1">
              <label htmlFor="tab-input" className="sr-only">Add tab name</label>
              <input id="tab-input" value={tabInput} onChange={(e) => setTabInput(e.target.value)} placeholder="+ tab name"
                className="w-28 rounded-full border border-dashed border-slate-400 bg-transparent px-3 py-1 text-sm outline-none focus:border-indigo-500" />
            </form>
          </div>

          {data?.tabs.some((t) => t.error) && (
            <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-300">
              {data.tabs.filter((t) => t.error).map((t) => <li key={t.name}>⚠ {t.name}: {t.error}</li>)}
            </ul>
          )}
        </section>

        {error && (
          <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        {/* Highlights */}
        {loading && !data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
          </div>
        ) : (
          data && <Highlights h={highlights} asOf={asOf} onOpen={setCompareDeal} />
        )}

        {/* Toolbar */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <label className="relative min-w-[14rem] flex-1">
              <span className="sr-only">Search deals</span>
              <input
                value={filters.query}
                onChange={(e) => { patch({ query: e.target.value }); setVisible(PAGE_SIZE); }}
                placeholder="Search product, brand, store, notes…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/40 focus:ring-4 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={filters.hideExpired}
              onClick={() => patch({ hideExpired: !filters.hideExpired })}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              <span className={`relative h-5 w-9 rounded-full transition ${filters.hideExpired ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${filters.hideExpired ? "left-[18px]" : "left-0.5"}`} />
              </span>
              {filters.hideExpired ? "Hiding" : "Showing"} expired ({expiredCount})
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CHIPS.map((c) => {
              const on = filters.chips.includes(c.id);
              return (
                <button key={c.id} type="button" aria-pressed={on} onClick={() => toggleChip(c.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"}`}>
                  {c.label}
                </button>
              );
            })}
            <select aria-label="Sort deals" value={filters.sort} onChange={(e) => patch({ sort: e.target.value as Filters["sort"] })}
              className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="flex overflow-hidden rounded-xl border border-slate-300 text-sm dark:border-slate-700" role="group" aria-label="View">
              {(["grid", "table"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                  className={`px-3 py-2 capitalize ${view === v ? "bg-indigo-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{v}</button>
              ))}
            </div>
            {hiddenCount > 0 && (
              <button type="button" onClick={() => setHidden([])} className="rounded-xl border border-dashed border-slate-400 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Restore {hiddenCount} hidden
              </button>
            )}
            <button type="button" onClick={() => setShowFilters((s) => !s)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm lg:hidden dark:border-slate-700">
              Filters
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className={`${showFilters ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-auto`}>
            <FilterSidebar
              filters={filters}
              onChange={patch}
              onClear={() => setFilters({ ...DEFAULT_FILTERS, tab: filters.tab, hideExpired: filters.hideExpired })}
              facets={facets}
              priceMax={priceMax}
            />
          </aside>

          <section aria-live="polite">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>
                Showing <strong className="text-slate-900 dark:text-white">{results.length}</strong> of {deals.length} deals
              </span>
              <StatStrip deep={highlights.deep50.count} count={tabScoped.filter((d) => !d.expired).length} />
            </div>

            {loading && !data && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
              </div>
            )}

            {!loading && data && results.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
                No deals match these filters. Try clearing a filter.
              </div>
            )}

            {data && results.length > 0 && view === "grid" && (
              <AnimatePresence initial={false}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.slice(0, visible).map((d, i) => (
                    <DealCard key={d.id} deal={d} index={i} starred={cartIds.has(d.id)} onToggleStar={toggleStar} onCompare={setCompareDeal} onHide={hideDeal} />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {data && results.length > 0 && view === "table" && (
              <DealTable
                deals={results.slice(0, visible)}
                sort={filters.sort}
                onSort={(s) => patch({ sort: s })}
                starredIds={cartIds}
                onToggleStar={toggleStar}
                onCompare={setCompareDeal}
                onHide={hideDeal}
              />
            )}

            {results.length > visible && (
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                  Show more ({results.length - visible} left)
                </button>
              </div>
            )}

          </section>
        </div>

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
