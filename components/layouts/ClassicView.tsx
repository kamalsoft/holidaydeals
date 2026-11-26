"use client";

import DealCard from "@/components/DealCard";
import Highlights, { StatStrip } from "@/components/Highlights";
import type { ViewProps } from "./types";
import Toolbar from "./Toolbar";
import FilterPanel from "./FilterPanel";
import Results from "./Results";

/** Default layout: highlight tiles on top, filters on the left, cards below. */
export default function ClassicView(p: ViewProps) {
  return (
    <>
      {p.loading && !p.hasData ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
        </div>
      ) : (
        p.hasData && <Highlights h={p.highlights} asOf={p.asOf} onOpen={p.openCompare} />
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <FilterPanel p={p} />

        <div className="min-w-0 space-y-4">
          <Toolbar
            filters={p.filters}
            patch={p.patch}
            toggleChip={p.toggleChip}
            expiredCount={p.expiredCount}
            hiddenCount={p.hiddenCount}
            restoreHidden={p.restoreHidden}
            view={p.view}
            setView={p.setView} clearFilters={p.clearFilters} layout="hidden lg:flex flex-wrap items-center"
          />

          <section aria-live="polite" className="space-y-3">
            {p.hasData && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Showing <strong className="text-slate-900 dark:text-white">{p.results.length}</strong> of {p.deals.length} deals
                </span>
                <StatStrip deep={p.highlights.deep50.count} count={p.tabScoped.filter((d) => !d.expired).length} />
              </div>
            )}
            <Results
              p={p}
              skeleton={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
                </div>
              }
              renderCards={(items) => (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((d, i) => (
                    <DealCard key={d.id} deal={d} index={i} starred={p.cartIds.has(d.id)} onToggleStar={p.toggleStar} onCompare={p.openCompare} onHide={p.hideDeal} />
                  ))}
                </div>
              )}
            />
          </section>
        </div>
      </div>
    </>
  );
}
