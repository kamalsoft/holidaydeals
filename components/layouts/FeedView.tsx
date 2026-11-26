"use client";

import DealRow from "@/components/DealRow";
import type { Filters } from "@/lib/filters";
import type { ViewProps } from "./types";
import Toolbar from "./Toolbar";
import FilterPanel from "./FilterPanel";
import Results from "./Results";

/** Quick feed tabs: each one is a sort order. */
const FEED_TABS: { sort: Filters["sort"]; label: string }[] = [
  { sort: "off", label: "🔥 Hot" },
  { sort: "score", label: "⭐ Best value" },
  { sort: "ending", label: "⏳ Ending soon" },
  { sort: "priceAsc", label: "💲 Lowest price" },
];

/**
 * Feed layout. On large screens the page itself does not scroll: filters, tabs and the
 * hot-deals rail stay in place, and only the results list scrolls.
 */
export default function FeedView(p: ViewProps) {
  const categories = p.facets.categories.slice(0, 12);
  const activeCategory = p.filters.categories[0] ?? null;
  const toggleCategory = (c: string) => p.patch({ categories: activeCategory === c ? [] : [c] });

  return (
    <div className="grid gap-6 lg:h-[calc(100dvh-8rem)] lg:grid-cols-[16rem_1fr_18rem]">
      <FilterPanel p={p} />

      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        {/* Fixed top: category bar, tabs, toolbar */}
        <nav aria-label="Categories" className="-mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" aria-pressed={!activeCategory} onClick={() => p.patch({ categories: [] })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${!activeCategory ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"}`}>
            All
          </button>
          {categories.map(([name, n]) => (
            <button key={name} type="button" aria-pressed={activeCategory === name} onClick={() => toggleCategory(name)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${activeCategory === name ? "bg-indigo-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"}`}>
              {name} <span className="opacity-70">{n}</span>
            </button>
          ))}
        </nav>

        <div role="tablist" aria-label="Feed" className="flex shrink-0 flex-wrap gap-2">
          {FEED_TABS.map((t) => {
            const on = p.filters.sort === t.sort;
            return (
              <button key={t.sort} role="tab" aria-selected={on} type="button" onClick={() => p.patch({ sort: t.sort })}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="shrink-0">
          <Toolbar filters={p.filters} patch={p.patch} toggleChip={p.toggleChip} expiredCount={p.expiredCount} hiddenCount={p.hiddenCount} restoreHidden={p.restoreHidden} view={p.view} setView={p.setView} clearFilters={p.clearFilters} layout="hidden lg:flex flex-wrap items-center" />
        </div>

        <p aria-live="polite" className="shrink-0 text-sm text-slate-600 dark:text-slate-300">
          Showing <strong className="text-slate-900 dark:text-white">{p.results.length}</strong> of {p.deals.length} deals
        </p>

        {/* Scrolling results */}
        <Results
          p={p}
          scroll
          skeleton={<div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}</div>}
          renderCards={(items) => (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
              {items.map((d) => (
                <DealRow key={d.id} deal={d} starred={p.cartIds.has(d.id)} onToggleStar={p.toggleStar} onCompare={p.openCompare} onHide={p.hideDeal} />
              ))}
            </ul>
          )}
        />
      </div>

      {/* Hot deals rail */}
      <aside aria-label="Hot deals" className="rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-4 dark:border-rose-500/30 dark:from-rose-500/10 dark:to-slate-900 lg:overflow-hidden">
        <h2 className="mb-2 text-sm font-bold text-rose-800 dark:text-rose-200">🔥 Hot deals</h2>
        <ol className="space-y-1">
          {p.highlights.hotDeals.map((d, i) => (
            <li key={d.id}>
              <button type="button" onClick={() => p.openCompare(d)} className="flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-white dark:hover:bg-white/5">
                <span className="w-5 shrink-0 text-xs font-bold text-rose-700 dark:text-rose-300">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-xs font-semibold text-slate-900 dark:text-slate-100">{d.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{d.store}{d.price !== null ? ` · $${d.price.toFixed(2)}` : ""}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-300">{d.offPercent}%</span>
              </button>
            </li>
          ))}
        </ol>
        {p.highlights.hotDeals.length === 0 && <p className="text-xs text-slate-500">No discounted deals in this view.</p>}
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">From the sheet · as of {p.asOf}</p>
      </aside>
    </div>
  );
}
