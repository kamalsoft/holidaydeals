"use client";

import DealCard from "@/components/DealCard";
import Highlights from "@/components/Highlights";
import { SORTS } from "@/lib/layouts";
import FilterPanel from "./FilterPanel";
import Results from "./Results";
import Toolbar from "./Toolbar";
import type { ViewProps } from "./types";

/** Rich: colourful highlight tiles, a scrollable category bar, and cards with quick sort buttons. */
export default function RichView(p: ViewProps) {
  const categories = p.facets.categories.slice(0, 14);
  const active = p.filters.categories[0] ?? null;
  const pick = (c: string) => p.patch({ categories: active === c ? [] : [c] });
  return (
    <div className="space-y-6">
      {p.hasData && <Highlights h={p.highlights} asOf={p.asOf} onOpen={p.openCompare} />}

      <nav aria-label="Categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map(([name, n]) => (
          <button key={name} type="button" aria-pressed={active === name} onClick={() => pick(name)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm ${active === name ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"}`}>
            {name} <span className="opacity-70">{n}</span>
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2">
        {SORTS.slice(0, 4).map((s) => (
          <button key={s.id} type="button" aria-pressed={p.filters.sort === s.id} onClick={() => p.patch({ sort: s.id })}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${p.filters.sort === s.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <FilterPanel p={p} />
        <div className="min-w-0 space-y-4">
          <Toolbar
            filters={p.filters} patch={p.patch} toggleChip={p.toggleChip} expiredCount={p.expiredCount}
            hiddenCount={p.hiddenCount} restoreHidden={p.restoreHidden} view={p.view} setView={p.setView}
            clearFilters={p.clearFilters} layout="hidden lg:flex flex-wrap items-center"
          />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Showing <strong className="text-slate-900 dark:text-white">{p.results.length}</strong> of {p.deals.length} deals
          </p>
          <Results
            p={p}
            skeleton={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}</div>}
            renderCards={(items) => (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((d, i) => (
                  <DealCard key={d.id} deal={d} index={i} starred={p.cartIds.has(d.id)} onToggleStar={p.toggleStar} onCompare={p.openCompare} onHide={p.hideDeal} />
                ))}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
