"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useDialogFocus } from "@/components/useDialogFocus";
import type { DealItem } from "@/lib/normalizeDeals";
import type { Similar } from "@/lib/compare";

interface Props {
  target: DealItem | null;
  similar: Similar[];
  onClose: () => void;
}

export default function CompareDrawer({ target, similar, onClose }: Props) {
  const reduce = useReducedMotion();
  const asideRef = useRef<HTMLElement>(null);
  useDialogFocus(asideRef, target !== null, onClose);
  const priced = [target, ...similar.map((s) => s.item)].filter((d): d is DealItem => !!d && d.price !== null);
  const lowest = priced.reduce<DealItem | null>((b, d) => (b === null || (d.price ?? 0) < (b.price ?? 0) ? d : b), null);

  return (
    <AnimatePresence>
      {target && (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.aside ref={asideRef} role="dialog" aria-modal="true" aria-label="Compare prices"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: reduce ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduce ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Compare prices</h2>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{target.title}</p>
                <p className="text-xs text-slate-500">{target.store} · ${target.price?.toFixed(2) ?? "—"}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            </header>

            <div className="flex-1 space-y-2 overflow-auto p-4">
              {lowest && (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Lowest price among matches: <strong>${lowest.price?.toFixed(2)}</strong> at {lowest.store}
                </div>
              )}
              {similar.length === 0 && (
                <p className="text-sm text-slate-500">No similar deals from other stores in this sheet.</p>
              )}
              {similar.map(({ item, similarity }) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.store} · {Math.round(similarity * 100)}% match</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold text-slate-900 dark:text-white">{item.price === null ? "—" : `$${item.price.toFixed(2)}`}</div>
                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-700 hover:underline dark:text-indigo-300">Open ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
