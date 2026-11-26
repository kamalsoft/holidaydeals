"use client";

import { CHIPS, SORTS, type ResultsView } from "@/lib/layouts";
import { type Chip, type Filters, isFiltered } from "@/lib/filters";

const VIEWS: { id: ResultsView; label: string }[] = [
  { id: "cards", label: "▦ Cards" },
  { id: "table", label: "☰ Table" },
  { id: "match", label: "⇄ Price match" },
];

interface Props {
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
  toggleChip: (c: Chip) => void;
  expiredCount: number;
  hiddenCount: number;
  restoreHidden: () => void;
  view: ResultsView;
  setView: (v: ResultsView) => void;
  clearFilters: () => void;
  /** Display classes for this placement (desktop row or phone drawer). */
  layout?: string;
}

/** Expired toggle, quick chips, sort and restore-hidden. Shared by every layout. */
export default function Toolbar({ filters, patch, toggleChip, expiredCount, hiddenCount, restoreHidden, view, setView, clearFilters, layout = "flex flex-wrap items-center" }: Props) {
  return (
    <section className={`${layout} gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70`}>
      <button
        type="button"
        role="switch"
        aria-checked={filters.hideExpired}
        onClick={() => patch({ hideExpired: !filters.hideExpired })}
        className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
      >
        <span className={`relative h-5 w-9 rounded-full transition ${filters.hideExpired ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${filters.hideExpired ? "left-[18px]" : "left-0.5"}`} />
        </span>
        {filters.hideExpired ? "Hiding" : "Showing"} expired ({expiredCount})
      </button>
      {CHIPS.map((c) => {
        const on = filters.chips.includes(c.id);
        return (
          <button key={c.id} type="button" aria-pressed={on} onClick={() => toggleChip(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"}`}>
            {c.label}
          </button>
        );
      })}
      <select aria-label="Sort deals" value={filters.sort} onChange={(e) => patch({ sort: e.target.value as Filters["sort"] })}
        className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
        {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <div role="group" aria-label="Results view" className="ml-auto flex overflow-hidden rounded-xl border border-slate-300 text-sm dark:border-slate-700">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}
            className={`whitespace-nowrap px-3 py-2 ${view === v.id ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"}`}>
            {v.label}
          </button>
        ))}
      </div>
      {isFiltered(filters) && (
        <button type="button" onClick={clearFilters} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500">
          Reset filters
        </button>
      )}
      {hiddenCount > 0 && (
        <button type="button" onClick={restoreHidden} className="rounded-xl border border-dashed border-slate-400 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          Restore {hiddenCount} hidden
        </button>
      )}
    </section>
  );
}
