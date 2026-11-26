"use client";

import { DISCOUNT_BANDS, type Filters } from "@/lib/filters";

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  facets: { stores: [string, number][]; categories: [string, number][]; subCategories: [string, number][]; brands: [string, number][]; bandCounts: Record<string, number>; endingCount: number };
  priceMax: number;
}

function CheckList({
  title, values, selected, onToggle,
}: { title: string; values: [string, number][]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</legend>
      <div className="max-h-44 space-y-1 overflow-auto pr-1">
        {values.map(([v, n]) => (
          <label key={v} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-1.5 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="flex items-center gap-2 truncate">
              <input type="checkbox" className="accent-indigo-600" checked={selected.includes(v)} onChange={() => onToggle(v)} />
              <span className="truncate text-slate-700 dark:text-slate-200">{v}</span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">{n}</span>
          </label>
        ))}
        {values.length === 0 && <p className="text-xs text-slate-600 dark:text-slate-400">None in this view</p>}
      </div>
    </fieldset>
  );
}

export default function FilterSidebar({ filters: f, onChange, onClear, facets, priceMax }: Props) {
  const toggle = (key: "stores" | "categories" | "subCategories" | "brands") => (v: string) => {
    const cur = f[key];
    onChange({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const maxShown = f.maxPrice ?? priceMax;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filters</h2>
        <button type="button" onClick={onClear} className="text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300">
          Clear all
        </button>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span>Price</span>
          <span className="normal-case">${f.minPrice} – ${maxShown}</span>
        </div>
        <label className="sr-only" htmlFor="min-price">Minimum price</label>
        <input id="min-price" type="range" min={0} max={priceMax} step={1} value={f.minPrice}
          onChange={(e) => onChange({ minPrice: Math.min(Number(e.target.value), maxShown) })}
          className="w-full accent-indigo-600" />
        <label className="sr-only" htmlFor="max-price">Maximum price</label>
        <input id="max-price" type="range" min={0} max={priceMax} step={1} value={maxShown}
          onChange={(e) => onChange({ maxPrice: Math.max(Number(e.target.value), f.minPrice) })}
          className="w-full accent-indigo-600" />
      </div>

      <div>
        <label htmlFor="min-off" className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span>Minimum % off</span><span className="normal-case">{f.minOff}%+</span>
        </label>
        <input id="min-off" type="range" min={0} max={90} step={5} value={f.minOff}
          onChange={(e) => onChange({ minOff: Number(e.target.value) })} className="w-full accent-emerald-600" />
      </div>

      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Discount depth</legend>
        {DISCOUNT_BANDS.map((b) => (
          <label key={b.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-1.5 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="flex items-center gap-2">
              <input type="checkbox" className="accent-indigo-600" checked={f.bands.includes(b.id)}
                onChange={() => onChange({ bands: f.bands.includes(b.id) ? f.bands.filter((x) => x !== b.id) : [...f.bands, b.id] })} />
              <span className="text-slate-700 dark:text-slate-200">{b.label}</span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">{facets.bandCounts[b.id] ?? 0}</span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-1.5 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="flex items-center gap-2">
            <input type="checkbox" className="accent-indigo-600" checked={f.endingOnly} onChange={() => onChange({ endingOnly: !f.endingOnly })} />
            <span className="text-slate-700 dark:text-slate-200">Ending within 7 days</span>
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">{facets.endingCount}</span>
        </label>
      </fieldset>

      <CheckList title="Store" values={facets.stores} selected={f.stores} onToggle={toggle("stores")} />
      <CheckList title="Category" values={facets.categories} selected={f.categories} onToggle={toggle("categories")} />
      <CheckList title="Sub-category" values={facets.subCategories} selected={f.subCategories} onToggle={toggle("subCategories")} />
      <CheckList title="Brand" values={facets.brands} selected={f.brands} onToggle={toggle("brands")} />
    </div>
  );
}
