"use client";

import DealCard from "@/components/DealCard";
import Highlights from "@/components/Highlights";
import FilterPanel from "./FilterPanel";
import Results from "./Results";
import Toolbar from "./Toolbar";
import type { ViewProps } from "./types";

/** Superior: a welcome band, the top three picks in large cards, then the full results. */
export default function SuperiorView(p: ViewProps) {
  const top = p.results.slice(0, 3);
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Superior picks</p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Best deals, ranked by Deal Score</h2>
        {p.hasData && (
          <p className="mt-2 text-sm text-white/85">
            {p.deals.length.toLocaleString()} deals from the sheet · {p.highlights.deep50.count} at 50%+ off
          </p>
        )}
      </section>

      {p.hasData && top.length > 0 && (
        <section aria-label="Top three picks" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {top.map((d, i) => (
            <DealCard key={d.id} deal={d} index={i} starred={p.cartIds.has(d.id)} onToggleStar={p.toggleStar} onCompare={p.openCompare} onHide={p.hideDeal} />
          ))}
        </section>
      )}

      {p.hasData && <Highlights h={p.highlights} asOf={p.asOf} onOpen={p.openCompare} />}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <FilterPanel p={p} />
        <div className="min-w-0 space-y-4">
          <Toolbar
            filters={p.filters} patch={p.patch} toggleChip={p.toggleChip} expiredCount={p.expiredCount}
            hiddenCount={p.hiddenCount} restoreHidden={p.restoreHidden} view={p.view} setView={p.setView}
            clearFilters={p.clearFilters} layout="hidden lg:flex flex-wrap items-center"
          />
          {p.hasData && (<p className="text-sm text-slate-600 dark:text-slate-300">
            Showing <strong className="text-slate-900 dark:text-white">{p.results.length}</strong> of {p.deals.length} deals
          </p>)}
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
