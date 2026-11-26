"use client";

import { type ReactNode, useRef } from "react";
import { useDialogFocus } from "@/components/useDialogFocus";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** The ☰ menu on phones: holds the controls that do not fit in the header. */
export default function MobileMenu({ open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, open, onClose);
  if (!open) return null;
  return (
    <>
      <button type="button" aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-y-0 right-0 z-50 w-[min(20rem,88vw)] space-y-4 overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900 lg:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Menu</h2>
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        {children}
      </div>
    </>
  );
}
