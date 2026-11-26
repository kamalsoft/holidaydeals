"use client";

import { useRef } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import { useDialogFocus } from "@/components/useDialogFocus";
import type { ViewProps } from "./types";
import Toolbar from "./Toolbar";

/**
 * Filters for every layout. On large screens it is a column beside the results.
 * On phones and tablets it is a drawer, opened from the Filters button, that also holds the options.
 */
export default function FilterPanel({ p }: { p: ViewProps }) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, p.filtersOpen, () => p.setFiltersOpen(false));

  return (
    <>
      {p.filtersOpen && (
        <button type="button" aria-label="Close filters" onClick={() => p.setFiltersOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" />
      )}
      <aside
        ref={ref}
        aria-label="Filters"
        className={`fixed inset-y-0 left-0 z-50 w-[min(22rem,88vw)] overflow-y-auto bg-white p-4 shadow-2xl transition-transform duration-200 dark:bg-slate-900 ${
          p.filtersOpen ? "translate-x-0" : "-translate-x-full"
        } lg:sticky lg:top-24 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:w-auto lg:translate-x-0 lg:self-start lg:overflow-auto lg:rounded-2xl lg:border lg:border-slate-200 lg:p-4 lg:shadow-none dark:lg:border-slate-700`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filters &amp; options</h2>
          <button type="button" onClick={() => p.setFiltersOpen(false)} aria-label="Close filters" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        <Toolbar
          layout="lg:hidden flex flex-col items-stretch"
          filters={p.filters}
          patch={p.patch}
          toggleChip={p.toggleChip}
          expiredCount={p.expiredCount}
          hiddenCount={p.hiddenCount}
          restoreHidden={p.restoreHidden}
          view={p.view}
          setView={p.setView}
          clearFilters={p.clearFilters}
        />
        <div className="mt-4">
          <FilterSidebar filters={p.filters} onChange={p.patch} onClear={p.clearFilters} facets={p.facets} priceMax={p.priceMax} />
        </div>
      </aside>
    </>
  );
}
