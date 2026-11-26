"use client";

import DealRow from "@/components/DealRow";
import FilterPanel from "./FilterPanel";
import Results from "./Results";
import Toolbar from "./Toolbar";
import type { ViewProps } from "./types";

/** Simple: a plain list of deals, one per row, with filters on the left. */
export default function SimpleView(p: ViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
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
          skeleton={<div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800" />)}</div>}
          renderCards={(items) => (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
              {items.map((d) => (
                <DealRow key={d.id} deal={d} starred={p.cartIds.has(d.id)} onToggleStar={p.toggleStar} onCompare={p.openCompare} onHide={p.hideDeal} />
              ))}
            </ul>
          )}
        />
      </div>
    </div>
  );
}
