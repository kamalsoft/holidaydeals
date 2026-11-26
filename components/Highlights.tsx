"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
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

/** Compact highlight tile: one product, its price and discount. */
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
      className={`flex min-h-[6.5rem] flex-col overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br p-3 text-left shadow-sm transition disabled:opacity-60 dark:border-white/5 ${accent}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        <span aria-hidden>{icon}</span> {label}
      </div>
      {deal ? (
        <>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-white">{deal.title}</p>
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            {deal.price !== null && <span className="text-base font-bold text-slate-900 dark:text-white">${deal.price.toFixed(2)}</span>}
            {deal.offPercent !== null && <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{deal.offPercent}% off</span>}
          </div>
          {hint && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No match in this view.</p>
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

/** Compact Hot Deals tile: shows the top deal and opens the full list in a popup. */
function HotDealsCard({ items, onShowAll }: { items: DealItem[]; onShowAll: () => void }) {
  const top = items[0] ?? null;
  return (
    <div className="flex min-h-[6.5rem] flex-col rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-3 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-amber-500/10">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
        <span aria-hidden>🔥</span> Hot deals
      </div>
      {top ? (
        <>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-white">{top.title}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{top.offPercent}% off</span>
            <button type="button" onClick={onShowAll} className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-500">
              View top {items.length}
            </button>
          </div>
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No discounted deals in this view.</p>
      )}
    </div>
  );
}

/** Popup listing the top hot deals. Closes with the button, Escape, or a click outside. */
function HotDealsModal({
  open, items, asOf, onClose, onOpen,
}: { open: boolean; items: DealItem[]; asOf: string; onClose: () => void; onOpen: (d: DealItem) => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="hot-deals-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 id="hot-deals-title" className="text-base font-bold text-slate-900 dark:text-white">🔥 Hot deals</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Biggest discounts from the sheet · as of {asOf}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close hot deals" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            </header>
            <ol className="flex-1 divide-y divide-slate-100 overflow-auto dark:divide-slate-800">
              {items.map((d, i) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpen(d); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span className="w-6 text-xs font-bold text-rose-700 dark:text-rose-300">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 block text-sm text-slate-900 dark:text-slate-100">{d.title}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{d.store}</span>
                    </span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{d.offPercent}%</span>
                    <span className="w-20 text-right text-sm text-slate-700 dark:text-slate-200">{d.price === null ? "—" : `$${d.price.toFixed(2)}`}</span>
                  </button>
                </li>
              ))}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Highlights({ h, asOf, onOpen }: { h: H; asOf: string; onOpen: (d: DealItem) => void }) {
  const [hotOpen, setHotOpen] = useState(false);
  const closeHot = () => setHotOpen(false);
  return (
    <section aria-label="Top picks" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <Card icon="🏷️" label="Biggest % off" deal={h.biggestOff} accent="from-emerald-100 to-white dark:from-emerald-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="💲" label="Under $50" deal={h.under50} accent="from-sky-100 to-white dark:from-sky-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="⭐" label="Best value" deal={h.bestValue} hint={h.bestValue?.score != null ? `Score ${h.bestValue.score}/100` : undefined} accent="from-violet-100 to-white dark:from-violet-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="📺" label="TV / laptop" deal={h.bigTicket} accent="from-indigo-100 to-white dark:from-indigo-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="🎯" label="50%+ off" deal={h.deep50.top} hint={`${h.deep50.count} deals`} accent="from-fuchsia-100 to-white dark:from-fuchsia-500/15 dark:to-slate-900" onOpen={onOpen} />
      <Card icon="⏳" label="Ending soon" deal={h.expiringSoon} hint={h.expiringSoon?.notes} accent="from-amber-100 to-white dark:from-amber-500/15 dark:to-slate-900" onOpen={onOpen} />
      <HotDealsCard items={h.hotDeals} onShowAll={() => setHotOpen(true)} />
      <HotDealsModal open={hotOpen} items={h.hotDeals} asOf={asOf} onClose={closeHot} onOpen={onOpen} />
    </section>
  );
}
