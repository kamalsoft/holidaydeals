"use client";

import { useEffect, useState } from "react";
import { loadJson, saveJson } from "@/lib/storage";

type Theme = "system" | "light" | "dark";
const KEY_THEME = "hdf.theme";
// Stored as a boolean so the choice from earlier versions still applies.
const KEY_CB = "hdf.cb";

/** Display settings (theme and colour palette) in a small panel behind a gear button. */
export default function Preferences() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [accessible, setAccessible] = useState(false);
  const [ready, setReady] = useState(false);

  // Read saved choices after mount; the pre-paint script has already applied them.
  /* eslint-disable react-hooks/set-state-in-effect -- reading localStorage must wait for mount to avoid hydration mismatch */
  useEffect(() => {
    setTheme(loadJson<Theme>(KEY_THEME, "system"));
    setAccessible(loadJson<boolean>(KEY_CB, false));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    saveJson(KEY_THEME, theme);
    saveJson(KEY_CB, accessible);
    root.dataset.cb = accessible ? "on" : "off";
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [ready, theme, accessible]);

  const selectClass = "w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Display settings"
        className="rounded-xl border border-slate-300 px-2.5 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        ⚙
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close display settings" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div role="dialog" aria-label="Display settings" className="absolute right-0 z-50 mt-2 w-60 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className={`mt-1 normal-case ${selectClass}`}>
                <option value="system">Match device</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Colour palette
              <select value={accessible ? "accessible" : "standard"} onChange={(e) => setAccessible(e.target.value === "accessible")} className={`mt-1 normal-case ${selectClass}`}>
                <option value="standard">Standard</option>
                <option value="accessible">High contrast, colour-vision friendly</option>
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
