"use client";

import type { DealItem } from "@/lib/normalizeDeals";
import type { SortKey } from "@/lib/filters";

interface Props {
  deals: DealItem[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  starredIds: Set<string>;
  onToggleStar: (d: DealItem) => void;
  onCompare: (d: DealItem) => void;
  onHide: (d: DealItem) => void;
}

export default function DealTable({ deals, sort, onSort, starredIds, onToggleStar, onCompare, onHide }: Props) {
  const th = (label: string, key: SortKey | null) => (
    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {key ? (
        <button type="button" onClick={() => onSort(key)} className={`hover:text-slate-900 dark:hover:text-white ${sort === key ? "text-indigo-700 dark:text-indigo-300" : ""}`}>
          {label}
        </button>
      ) : label}
    </th>
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[760px] divide-y divide-slate-100 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/80">
          <tr>
            {th("Product", null)}
            {th("Store", null)}
            {th("Price", sort === "priceAsc" ? "priceDesc" : "priceAsc")}
            {th("% OFF", "off")}
            {th("Score", "score")}
            {th("Dates & notes (as in sheet)", null)}
            <th className="px-3 py-2" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {deals.map((d) => (
            <tr key={d.id} className={d.expired ? "opacity-60" : ""}>
              <td className="max-w-md px-3 py-2">
                <div className="line-clamp-2 font-medium text-slate-900 dark:text-slate-100">{d.title}</div>
                <div className="text-xs text-slate-500">{d.tabs.join(" · ")} · row {d.sourceRow}</div>
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{d.store}</td>
              <td className="px-3 py-2 font-semibold">{d.price === null ? "—" : `$${d.price.toFixed(2)}`}</td>
              <td className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">{d.offPercent === null ? "—" : `${d.offPercent}%`}</td>
              <td className="px-3 py-2">{d.score ?? "—"}</td>
              <td className="max-w-xs px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{d.notes || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                <button type="button" onClick={() => onToggleStar(d)} aria-pressed={starredIds.has(d.id)}
                  className="mr-2 text-amber-500 hover:text-amber-400" aria-label={starredIds.has(d.id) ? "Remove from wishlist" : "Add to wishlist"}>
                  {starredIds.has(d.id) ? "★" : "☆"}
                </button>
                <button type="button" onClick={() => onCompare(d)} className="mr-2 text-xs text-indigo-700 hover:underline dark:text-indigo-300">Compare</button>
                <button type="button" onClick={() => onHide(d)} className="mr-2 text-xs text-slate-500 hover:text-rose-700 hover:underline">Hide</button>
                {d.link && <a href={d.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Open ↗</a>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
