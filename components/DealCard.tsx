"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { DealItem } from "@/lib/normalizeDeals";
import { copyText } from "@/lib/clipboard";

const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

function ScoreRing({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const r = 18;
  const c = 2 * Math.PI * r;
  const tone = value >= 70 ? "stroke-emerald-500" : value >= 40 ? "stroke-amber-500" : "stroke-rose-500";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label={`Deal score ${value} of 100`}>
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-slate-700" />
      <motion.circle
        cx="24" cy="24" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
        className={tone}
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-slate-800 dark:fill-slate-100">
        {value}
      </text>
    </svg>
  );
}

interface Props {
  deal: DealItem;
  index: number;
  starred: boolean;
  onToggleStar: (d: DealItem) => void;
  onCompare: (d: DealItem) => void;
  onHide: (d: DealItem) => void;
}

export default function DealCard({ deal: d, index, starred, onToggleStar, onCompare, onHide }: Props) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const copy = async () => {
    const ok = await copyText(d.link);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <motion.article
      layout={!reduce}
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(index, 12) * 0.03 }}
      whileHover={reduce ? undefined : { y: -3 }}
      className={`group flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-lg dark:bg-slate-900 ${
        d.expired ? "border-dashed border-slate-300 dark:border-slate-700" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200">
          {d.store || "Unknown store"}
        </span>
        {d.tabs.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t}
          </span>
        ))}
        {d.expired && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Expired</span>}
        {d.expiringSoon && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">Ending soon</span>}
      </div>

      <h3 className="line-clamp-3 min-h-[3.6rem] text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {d.title}
      </h3>
      <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">
        {[d.brand, d.subCategory || d.category, d.size].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{money(d.price)}</div>
          {d.wasPrice !== null && (
            <div className="text-xs text-slate-600 line-through">was {money(d.wasPrice)}</div>
          )}
          {d.offPercent !== null && (
            <span className="mt-1 inline-block rounded-xl bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200">
              {d.offPercent}% OFF{d.offSource === "computed" ? " (calc.)" : ""}
            </span>
          )}
        </div>
        {d.score !== null && (
          <div className="flex flex-col items-center">
            <ScoreRing value={d.score} />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Score</span>
          </div>
        )}
      </div>

      {d.notes && (
        <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {d.notes}
        </p>
      )}
      {d.otherOffer && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Other offer: {d.otherOffer}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleStar(d)}
          aria-pressed={starred}
          className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition ${
            starred
              ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          {starred ? "★ Wishlist" : "☆ Wishlist"}
        </button>
        <button
          type="button"
          onClick={() => onCompare(d)}
          className="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
        >
          Compare
        </button>
        <button
          type="button"
          onClick={() => onHide(d)}
          className="whitespace-nowrap rounded-xl px-2 py-1.5 text-xs text-slate-600 transition dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        >
          Hide
        </button>
        {d.link ? (
          <>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy deal link"
              className="whitespace-nowrap rounded-xl px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copied === "ok" ? "Copied ✓" : copied === "fail" ? "Copy failed" : "Copy link"}
            </button>
            <a
              href={d.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto whitespace-nowrap text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
            >
              View deal ↗
            </a>
          </>
        ) : (
          <span className="ml-auto text-xs text-slate-600 dark:text-slate-400">No link</span>
        )}
      </div>
    </motion.article>
  );
}
