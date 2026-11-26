"use client";

import { useMemo } from "react";
import DealCard from "@/components/DealCard";
import type { ViewProps } from "./types";
import Toolbar from "./Toolbar";
import FilterPanel from "./FilterPanel";
import Results from "./Results";

const BUCKETS = [
  { label: "1–24% off", min: 1, max: 24, color: "bg-sky-400" },
  { label: "25–49% off", min: 25, max: 49, color: "bg-indigo-500" },
  { label: "50–74% off", min: 50, max: 74, color: "bg-fuchsia-500" },
  { label: "75%+ off", min: 75, max: 100, color: "bg-rose-500" },
];

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-4 text-white shadow-md ${accent}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-white/85">{label}</div>
      <div className="mt-1 text-3xl font-black tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/85">{hint}</div>}
    </div>
  );
}

/** Dashboard layout: headline numbers and a discount-spread chart above the results. */
export default function DashboardView(p: ViewProps) {
  const active = useMemo(() => p.tabScoped.filter((d) => !d.expired), [p.tabScoped]);
  const withOff = useMemo(() => active.filter((d) => d.offPercent !== null), [active]);
  const avgOff = withOff.length ? Math.round(withOff.reduce((s, d) => s + (d.offPercent ?? 0), 0) / withOff.length) : 0;
  const ending = active.filter((d) => d.expiringSoon).length;
  const buckets = BUCKETS.map((b) => ({
    ...b,
    count: withOff.filter((d) => (d.offPercent ?? 0) >= b.min && (d.offPercent ?? 0) <= b.max).length,
  }));
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="space-y-6">
      {p.hasData ? (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Active deals" value={active.length.toLocaleString()} accent="from-indigo-600 to-violet-600" />
        <Kpi label="At 50%+ off" value={p.highlights.deep50.count.toLocaleString()} accent="from-fuchsia-600 to-rose-600" />
        <Kpi label="Average % off" value={`${avgOff}%`} hint={`${withOff.length} deals with a discount`} accent="from-sky-600 to-cyan-600" />
        <Kpi label="Ending soon" value={ending.toLocaleString()} hint="within 7 days" accent="from-amber-500 to-orange-600" />
        <Kpi label="In your wishlist" value={p.cartIds.size.toLocaleString()} hint="saved in this browser" accent="from-emerald-600 to-teal-600" />
      </div>
) : (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}</div>
      )}

      <section aria-label="Discount spread" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">How deep are the discounts?</h2>
        <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">Active deals with a % off, grouped by depth.</p>
        <ul className="space-y-3">
          {buckets.map((b) => (
            <li key={b.label} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">{b.label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <span className={`block h-full rounded-full ${b.color} transition-[width] duration-700`} style={{ width: `${(b.count / maxCount) * 100}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">{b.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <FilterPanel p={p} />
        <div className="min-w-0 space-y-4">
          <Toolbar filters={p.filters} patch={p.patch} toggleChip={p.toggleChip} expiredCount={p.expiredCount} hiddenCount={p.hiddenCount} restoreHidden={p.restoreHidden} view={p.view} setView={p.setView} clearFilters={p.clearFilters} layout="hidden lg:flex flex-wrap items-center" />
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
