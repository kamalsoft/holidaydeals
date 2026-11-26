"use client";

import { useState } from "react";
import type { DealItem } from "@/lib/normalizeDeals";
import { copyText } from "@/lib/clipboard";

const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

interface Props {
  deal: DealItem;
  starred: boolean;
  onToggleStar: (d: DealItem) => void;
  onCompare: (d: DealItem) => void;
  onHide: (d: DealItem) => void;
}

/** One deal as a compact row (used by the Feed layout). */
export default function DealRow({ deal: d, starred, onToggleStar, onCompare, onHide }: Props) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const copy = async () => {
    const ok = await copyText(d.link);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied(null), 1500);
  };
  const btn = "rounded-xl px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${d.expired ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1 basis-64">
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">{d.store || "Unknown store"}</span>
          {d.expired && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Expired</span>}
          {d.expiringSoon && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">Ending soon</span>}
        </div>
        <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{d.title}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {[d.brand, d.subCategory || d.category, d.size, d.notes].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-900 dark:text-white">{money(d.price)}</span>
        {d.wasPrice !== null && <span className="text-xs text-slate-500 line-through">{money(d.wasPrice)}</span>}
        {d.offPercent !== null && (
          <span className="rounded-xl bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
            {d.offPercent}% off
          </span>
        )}
        {d.score !== null && (
          <span className="rounded-xl border border-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300" aria-label={`Deal score ${d.score} of 100`}>
            Score {d.score}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onToggleStar(d)} aria-pressed={starred} className={btn}>
          {starred ? "★ Wishlist" : "☆ Wishlist"}
        </button>
        <button type="button" onClick={() => onCompare(d)} className={btn}>Compare</button>
        {d.link && (
          <button type="button" onClick={copy} aria-label="Copy deal link" className={btn}>
            {copied === "ok" ? "Copied ✓" : copied === "fail" ? "Copy failed" : "Copy link"}
          </button>
        )}
        <button type="button" onClick={() => onHide(d)} className={btn}>Hide</button>
        {d.link ? (
          <a href={d.link} target="_blank" rel="noopener noreferrer" className="ml-1 rounded-xl bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500">
            View ↗
          </a>
        ) : (
          <span className="ml-1 text-xs text-slate-600 dark:text-slate-400">No link</span>
        )}
      </div>
    </li>
  );
}
