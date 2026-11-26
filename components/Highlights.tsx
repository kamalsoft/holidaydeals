"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import type { DealItem } from "@/lib/normalizeDeals";
import type { Highlights as H } from "@/lib/highlights";

function CountUp({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);
  const ref = useRef(to);
  useEffect(() => {
    if (reduce) return;
    const controls = animate(ref.current, to, { duration: 0.8, onUpdate: (v) => setVal(Math.round(v)) });
    ref.current = to;
    return () => controls.stop();
  }, [to, reduce]);
  return <>{reduce ? to : val}</>;
}

function Card({
  icon, label, deal, hint, onOpen, accent,
}: {
  icon: string; label: string; deal: DealItem | null; hint?: string; onOpen: (d: DealItem) => void; accent: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => deal && onOpen(deal)}
      disabled={!deal}
      whileHover={{ y: -2 }}
      className={`relative flex min-h-[9.5rem] flex-col overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br p-4 text-left shadow-sm transition disabled:opacity-60 dark:border-white/5 ${accent}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        <span aria-hidden>{icon}</span> {label}
      </div>
      {deal ? (
        <>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{deal.title}</p>
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            {deal.price !== null && <span className="text-xl font-bold text-slate-900 dark:text-white">${deal.price.toFixed(2)}</span>}
            {deal.offPercent !== null && <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{deal.offPercent}% off</span>}
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{deal.store}</span>
          </div>
          {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No match in this view.</p>
      )}
    </motion.button>
  );
}

export function StatStrip({ deep, count }: { deep: number; count: number }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
      <span>
        <strong className="text-slate-900 dark:text-white"><CountUp to={count} /></strong> active deals
      </span>
      <span aria-hidden>·</span>
      <span>
        <strong className="text-emerald-700 dark:text-emerald-300"><CountUp to={deep} /></strong> at 50%+ off
      </span>
    </div>
  );
}

export function HotDealsCard({ items, asOf, onOpen }: { items: DealItem[]; asOf: string; onOpen: (d: DealItem) => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-4 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-amber-500/10 md:col-span-2 xl:col-span-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
          <span aria-hidden>🔥</span> Hot deals
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">from sheet · {asOf}</span>
      </div>
      <ol className="mt-2 divide-y divide-rose-100 dark:divide-rose-500/10">
        {items.length === 0 && <li className="py-2 text-sm text-slate-500">No discounted deals in this view.</li>}
        {items.map((d, i) => (
          <li key={d.id}>
            <button type="button" onClick={() => onOpen(d)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-white/50 dark:hover:bg-white/5">
              <span className="w-5 text-xs font-bold text-rose-700 dark:text-rose-300">{i + 1}</span>
              <span className="line-clamp-1 flex-1 text-sm text-slate-900 dark:text-slate-100">{d.title}</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{d.offPercent}%</span>
              <span className="w-16 text-right text-sm text-slate-700 dark:text-slate-200">{d.price === null ? "—" : `$${d.price.toFixed(2)}`}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Highlights({ h, asOf, onOpen }: { h: H; asOf: string; onOpen: (d: DealItem) => void }) {
  return (
    <section aria-label="Top picks" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card icon="🏷️" label="Biggest % off" deal={h.biggestOff} accent="from-emerald-100 to-white dark:from-emerald-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="💲" label="Lowest under $50" deal={h.under50} accent="from-sky-100 to-white dark:from-sky-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="⭐" label="Best value" deal={h.bestValue} hint={h.bestValue?.score != null ? `Deal score ${h.bestValue.score}/100` : undefined} accent="from-violet-100 to-white dark:from-violet-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="📺" label="Big-ticket TV / laptop" deal={h.bigTicket} accent="from-indigo-100 to-white dark:from-indigo-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card
        icon="🎯"
        label="50%+ off"
        deal={h.deep50.top}
        hint={`${h.deep50.count} deals at 50%+ off`}
        accent="from-fuchsia-100 to-white dark:from-fuchsia-500/15 dark:to-slate-900"
        onOpen={onOpen}
      />
      <Card icon="⏳" label="Expiring soon" deal={h.expiringSoon} hint={h.expiringSoon?.notes} accent="from-amber-100 to-white dark:from-amber-500/15 dark:to-slate-900" onOpen={onOpen} />
      <HotDealsCard items={h.hotDeals} asOf={asOf} onOpen={onOpen} />
    </section>
  );
}
