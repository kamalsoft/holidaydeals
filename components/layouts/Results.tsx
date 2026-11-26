"use client";

import type { ReactNode } from "react";
import DealTable from "@/components/DealTable";
import PriceMatchCard from "@/components/PriceMatchCard";
import type { DealItem } from "@/lib/normalizeDeals";
import type { ViewProps } from "./types";

interface Props {
  p: ViewProps;
  /** Layout-specific card rendering (grid of cards, or rows). */
  renderCards: (items: DealItem[]) => ReactNode;
  /** Layout-specific skeleton while the sheet loads. */
  skeleton: ReactNode;
  /** Fill the remaining height and scroll inside it (used by the Feed layout). */
  scroll?: boolean;
}

/** Shared results area: loading, empty state, and the Cards / Table switch. */
export default function Results({ p, renderCards, skeleton, scroll }: Props) {
  const wrap = scroll ? "min-h-0 flex-1 overflow-y-auto pr-1" : "";
  if (p.loading && !p.hasData) return <div className={wrap}>{skeleton}</div>;
  if (!p.hasData) return null;
  if (p.results.length === 0) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600 dark:border-slate-700">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="M8 11h6" />
        </svg>
        <p>No deals match these filters. Try clearing a filter.</p>
        <button type="button" onClick={p.clearFilters} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500">
          Reset filters
        </button>
      </div>
    );
  }
  if (p.view === "match") {
    const cards = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {p.priceGroups.map((g) => (
          <PriceMatchCard key={g.id} group={g} starred={p.cartIds.has(g.lowest.id)} onToggleStar={p.toggleStar} onCompare={p.openCompare} />
        ))}
      </div>
    );
    if (p.priceGroups.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600 dark:border-slate-700">
          No product appears at two or more stores in this view. Try clearing a filter.
        </div>
      );
    }
    return (
      <div className={`${wrap} space-y-4`}>
        <p role="note" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          ⚠ Price matches are estimates. Prices change in real time, and this sheet was collected at one point in time. Matching uses product names, so check the product, dates and price on the store&apos;s site before you buy.
        </p>
        {cards}
      </div>
    );
  }
  if (p.view === "table") {
    return (
      <div className={scroll ? "flex min-h-0 flex-1 flex-col" : ""}>
        <DealTable
          deals={p.results}
          starredIds={p.cartIds}
          onToggleStar={p.toggleStar}
          onCompare={p.openCompare}
          onHide={p.hideDeal}
        />
      </div>
    );
  }
  return <div className={wrap}>{renderCards(p.results)}</div>;
}
