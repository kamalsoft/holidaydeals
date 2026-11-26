"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDialogFocus } from "@/components/useDialogFocus";
import { cartTotals, savingsOf, toCsv, toMarkdown, type CartItem } from "@/lib/cart";
import { downloadFile } from "@/lib/storage";
import { copyText } from "@/lib/clipboard";

interface Props {
  open: boolean;
  items: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  shareUrl: () => string;
}

export default function ShortlistModal({ open, items, onRemove, onClear, onClose, shareUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const copyShare = async () => {
    setCopied(await copyText(shareUrl()));
    setTimeout(() => setCopied(false), 1500);
  };
  const { spend, savings } = cartTotals(items);
  const stamp = () => new Date().toISOString().slice(0, 10);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label="My Wishlist"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">🎁 My Wishlist</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl px-2 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            </header>

            <div className="grid grid-cols-3 gap-4 p-4">
              <Stat label="Items" value={String(items.length)} />
              <Stat label="Total spend" value={`$${spend.toFixed(2)}`} />
              <Stat label="Est. savings" value={`$${savings.toFixed(2)}`} accent />
            </div>

            <ul className="flex-1 divide-y divide-slate-100 overflow-auto px-4 dark:divide-slate-800">
              {items.length === 0 && <li className="py-8 text-center text-sm text-slate-600">Your wishlist is empty. Star deals to add them here.</li>}
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-100">{i.title}</p>
                    <p className="text-xs text-slate-600">{i.store} · save ~${savingsOf(i).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">{i.price === null ? "—" : `$${i.price.toFixed(2)}`}</span>
                    <button type="button" onClick={() => onRemove(i.id)} className="text-xs text-rose-600 hover:underline">Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <button type="button" disabled={!items.length} onClick={() => downloadFile(`holiday-wishlist-${stamp()}.csv`, toCsv(items), "text/csv")}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40">Export CSV</button>
              <button type="button" disabled={!items.length} onClick={() => downloadFile(`holiday-wishlist-${stamp()}.md`, toMarkdown(items), "text/markdown")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900">Export Markdown</button>
              <button type="button" disabled={!items.length} onClick={copyShare}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">
                {copied ? "Link copied ✓" : "Copy share link"}
              </button>
              <button type="button" disabled={!items.length} onClick={onClear}
                className="ml-auto text-sm text-rose-600 hover:underline disabled:opacity-40">Clear wishlist</button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${accent ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>{value}</div>
    </div>
  );
}
