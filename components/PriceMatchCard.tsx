"use client";

import type { DealItem } from "@/lib/normalizeDeals";
import type { PriceGroup } from "@/lib/priceMatch";

const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

interface Props {
  group: PriceGroup;
  starred: boolean;
  onToggleStar: (d: DealItem) => void;
  onCompare: (d: DealItem) => void;
}

/** One product sold at several stores: each store's price, with the lowest one marked. */
export default function PriceMatchCard({ group: g, starred, onToggleStar, onCompare }: Props) {
  return (
    <article className="flex flex-col rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
        ⇄ Price match · {g.offers.length} stores
      </div>
      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{g.title}</h3>
      {g.brand && <p className="text-xs text-slate-500 dark:text-slate-400">{g.brand}</p>}
      {new Set(g.offers.map((o) => o.endsAt)).size > 1 && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          Deal dates differ between stores. Check each offer&apos;s dates.
        </p>
      )}

      <ol className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
        {g.offers.map((o) => {
          const isLowest = o.id === g.lowest.id;
          return (
            <li key={o.id} className={`flex items-center gap-2 px-3 py-2 ${isLowest ? "bg-emerald-50 dark:bg-emerald-500/10" : ""}`}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-700 dark:text-slate-200">{o.store}</span>
                {o.notes && <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400" title={o.notes}>{o.notes}</span>}
              </span>
              {isLowest && <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Lowest</span>}
              <span className={`w-20 text-right text-sm font-bold tabular-nums ${isLowest ? "text-emerald-800 dark:text-emerald-200" : "text-slate-900 dark:text-white"}`}>
                {money(o.price)}
              </span>
              {o.link ? (
                <a href={o.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${o.store} deal`} className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300">↗</a>
              ) : (
                <span className="w-3" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        Save <strong className="text-emerald-700 dark:text-emerald-300">{money(g.savings)}</strong> ({g.savingsPct}%) by buying at{" "}
        <strong>{g.lowest.store}</strong> instead of {g.highest.store}.
      </p>

      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Snapshot from the sheet. Prices change often; confirm at the store.</p>

      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <button type="button" onClick={() => onToggleStar(g.lowest)} aria-pressed={starred}
          className="whitespace-nowrap rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-amber-300">
          {starred ? "★ Lowest in wishlist" : "☆ Add lowest to wishlist"}
        </button>
        <button type="button" onClick={() => onCompare(g.lowest)}
          className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
          Compare
        </button>
      </div>
    </article>
  );
}
