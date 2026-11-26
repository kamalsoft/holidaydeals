"use client";

import DealCard from "@/components/DealCard";
import type { DealItem } from "@/lib/normalizeDeals";
import type { ViewProps } from "./types";
import Toolbar from "./Toolbar";
import FilterPanel from "./FilterPanel";
import Results from "./Results";

const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

function MiniTile({ label, deal, onOpen }: { label: string; deal: DealItem | null; onOpen: (d: DealItem) => void }) {
  return (
    <button type="button" disabled={!deal} onClick={() => deal && onOpen(deal)}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="mt-1 line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{deal?.title ?? "No match"}</span>
      {deal && (
        <span className="mt-auto pt-2 text-sm font-bold text-slate-900 dark:text-white">
          {money(deal.price)} <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{deal.offPercent ?? ""}{deal.offPercent !== null ? "% off" : ""}</span>
        </span>
      )}
    </button>
  );
}

/** Spotlight layout: one feature deal up top, highlight tiles beside it, then the full results. */
export default function SpotlightView(p: ViewProps) {
  const hero = p.highlights.bestValue ?? p.highlights.hotDeals[0] ?? null;
  const heroStarred = hero ? p.cartIds.has(hero.id) : false;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label="Spotlight deal" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-amber-500 to-emerald-500 p-6 text-white shadow-xl sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/90">✨ Spotlight pick</p>
          {!p.hasData ? (
            <div aria-hidden className="mt-5 h-40 animate-pulse rounded-2xl bg-white/20" />
          ) : hero ? (
            <>
              <h2 className="mt-3 line-clamp-3 text-2xl font-extrabold leading-tight sm:text-3xl">{hero.title}</h2>
              <p className="mt-2 text-sm text-white/90">{[hero.brand, hero.store].filter(Boolean).join(" · ")}</p>
              <div className="mt-5 flex flex-wrap items-end gap-4">
                <span className="text-4xl font-black">{money(hero.price)}</span>
                {hero.wasPrice !== null && <span className="pb-1 text-sm line-through text-white/80">{money(hero.wasPrice)}</span>}
                {hero.offPercent !== null && <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">{hero.offPercent}% off</span>}
                {hero.score !== null && <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">Score {hero.score}</span>}
              </div>
              {hero.notes && <p className="mt-4 text-xs text-white/85">{hero.notes}</p>}
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={() => p.toggleStar(hero)} aria-pressed={heroStarred}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-white/90">
                  {heroStarred ? "★ In wishlist" : "☆ Add to wishlist"}
                </button>
                <button type="button" onClick={() => p.openCompare(hero)} className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30">Compare prices</button>
                {hero.link && <a href={hero.link} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-900/80 px-4 py-2 text-sm font-semibold hover:bg-slate-900">View deal ↗</a>}
              </div>
            </>
          ) : (
            <p className="mt-4 text-white/90">No deals in this view yet.</p>
          )}
        </section>

        {p.hasData ? (
          <div className="grid grid-cols-2 gap-3">
            <MiniTile label="Biggest % off" deal={p.highlights.biggestOff} onOpen={p.openCompare} />
            <MiniTile label="Under $50" deal={p.highlights.under50} onOpen={p.openCompare} />
            <MiniTile label="TV / laptop" deal={p.highlights.bigTicket} onOpen={p.openCompare} />
            <MiniTile label="Ending soon" deal={p.highlights.expiringSoon} onOpen={p.openCompare} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
          </div>
        )}
      </div>

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
