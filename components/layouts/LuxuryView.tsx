"use client";

import DealCard from "@/components/DealCard";
import FilterPanel from "./FilterPanel";
import Results from "./Results";
import Toolbar from "./Toolbar";
import type { ViewProps } from "./types";

const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

/** Luxury: a dark, gold-accented room. A featured deal, then the results in a framed panel. */
export default function LuxuryView(p: ViewProps) {
  const feature = p.highlights.bestValue ?? p.highlights.hotDeals[0] ?? null;
  return (
    <div className="space-y-6 rounded-2xl border border-amber-300/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 text-amber-50 shadow-2xl sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">Luxury selection</p>
          <h2 className="mt-1 text-2xl font-extrabold text-amber-200 sm:text-3xl">The finest deals of the season</h2>
        </div>
        {p.hasData && <p className="text-sm text-amber-100/70">{p.deals.length.toLocaleString()} curated deals</p>}
      </header>

      {p.hasData && feature && (
        <section aria-label="Featured deal" className="grid gap-4 rounded-2xl border border-amber-300/30 bg-slate-900/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">Featured</p>
            <h3 className="mt-1 line-clamp-2 text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-1 text-sm text-amber-100/70">{[feature.brand, feature.store].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            <span className="text-3xl font-bold text-amber-200">{money(feature.price)}</span>
            {feature.offPercent !== null && <span className="whitespace-nowrap rounded-full bg-amber-300 px-3 py-1 text-sm font-bold text-slate-900">{feature.offPercent}% off</span>}
            <button type="button" onClick={() => p.openCompare(feature)} className="whitespace-nowrap rounded-xl border border-amber-300/60 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-300/10">
              Compare prices
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <FilterPanel p={p} />
        <div className="min-w-0 space-y-4">
          <Toolbar
            filters={p.filters} patch={p.patch} toggleChip={p.toggleChip} expiredCount={p.expiredCount}
            hiddenCount={p.hiddenCount} restoreHidden={p.restoreHidden} view={p.view} setView={p.setView}
            clearFilters={p.clearFilters} layout="hidden lg:flex flex-wrap items-center"
          />
          {p.hasData && (<p className="text-sm text-amber-100/70">
            Showing <strong className="text-amber-200">{p.results.length}</strong> of {p.deals.length} deals
          </p>)}
          <Results
            p={p}
            skeleton={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-800" />)}</div>}
            renderCards={(items) => (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
