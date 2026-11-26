"use client";

import type { DealItem } from "@/lib/normalizeDeals";

const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

interface Props {
  deals: DealItem[];
  starredIds: Set<string>;
  onToggleStar: (d: DealItem) => void;
  onCompare: (d: DealItem) => void;
  onHide: (d: DealItem) => void;
}

/** Table view of deals. Sorting comes from the Sort menu in the toolbar. */
export default function DealTable({ deals, starredIds, onToggleStar, onCompare, onHide }: Props) {
  const head = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
  const action = "rounded-xl px-1.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th scope="col" className={head}>Product</th>
            <th scope="col" className={head}>Store</th>
            <th scope="col" className={`${head} text-right`}>Price</th>
            <th scope="col" className={`${head} text-right`}>% off</th>
            <th scope="col" className={`${head} text-right`}>Score</th>
            <th scope="col" className={head}>Dates &amp; notes</th>
            <th scope="col" className={head}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {deals.map((d) => (
            <tr key={d.id} className={`align-top ${d.expired ? "opacity-60" : ""}`}>
              <td className="max-w-md px-3 py-2">
                <div className="line-clamp-2 font-medium text-slate-900 dark:text-slate-100">{d.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{[d.brand, d.subCategory || d.category].filter(Boolean).join(" · ")}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-300">{d.store || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">{money(d.price)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-300">{d.offPercent === null ? "—" : `${d.offPercent}%`}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700 dark:text-slate-300">{d.score ?? "—"}</td>
              <td className="max-w-xs px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{d.notes || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                <button type="button" onClick={() => onToggleStar(d)} aria-pressed={starredIds.has(d.id)} className={action}>
                  {starredIds.has(d.id) ? "★ Wishlist" : "☆ Wishlist"}
                </button>
                <button type="button" onClick={() => onCompare(d)} className={action}>Compare</button>
                <button type="button" onClick={() => onHide(d)} className={action}>Hide</button>
                {d.link ? (
                  <a href={d.link} target="_blank" rel="noopener noreferrer" className="ml-1 rounded-xl bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-500">View ↗</a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
