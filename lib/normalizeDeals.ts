/**
 * Schema normalizer: maps the three sheet layouts into one DealItem shape.
 * All values come from the sheet. Dates are kept as written in the sheet.
 */

export interface DealItem {
  id: string;
  store: string;
  category: string;
  subCategory: string;
  brand: string;
  title: string;
  link: string;
  size: string;
  price: number | null;
  rawPrice: string;
  wasPrice: number | null;
  offPercent: number | null;
  offSource: "sheet" | "computed" | null;
  /** "Deal Dates & Notes" exactly as written in the sheet. */
  notes: string;
  otherOffer: string;
  /** End of the validity window (end of that day), or null if none was found. */
  endsAt: number | null;
  expired: boolean;
  expiringSoon: boolean;
  /** Source tab badges (several after deduplication). */
  tabs: string[];
  /** 1-based data row number within the CSV export of the first source tab. */
  sourceRow: number;
  score: number | null;
  scoreParts: { discount: number; validity: number; price: number } | null;
}

export interface TabStatus {
  name: string;
  layout: string | null;
  count: number;
  error: string | null;
}

export interface TabResult {
  status: TabStatus;
  items: DealItem[];
}

const DAY = 86_400_000;
export const EXPIRING_WINDOW_DAYS = 7;

type Field =
  | "store" | "category" | "subCategory" | "brand" | "title" | "link"
  | "size" | "price" | "offPct" | "notes" | "otherOffer";

/** [header label or null, fallback column index] */
interface Layout {
  name: string;
  /** Header cells (lowercase) that must all appear in the header row. null = headerless. */
  marker: string[] | null;
  cols: Partial<Record<Field, [string | null, number]>>;
}

const LAYOUTS: Layout[] = [
  {
    name: "Sheet1 (Amazon)",
    marker: ["retailer", "product name"],
    cols: {
      store: ["Retailer", 1], category: ["Department", 2], subCategory: ["Sub Category", 3],
      brand: ["Brand", 4], title: ["Product name", 5], link: ["Link", 6],
      price: ["Deal Price", 7], offPct: ["% OFF", 8],
    },
  },
  {
    name: "Sheet2 (Multi-retailer)",
    marker: ["store", "product / deal"],
    cols: {
      store: ["Store", 1], category: ["Category", 2], subCategory: [null, 3], brand: [null, 4],
      title: ["Product / Deal", 5], price: ["Deal Price ($)", 7],
      otherOffer: ["Other Price / Offer", 8], notes: ["Deal Dates & Notes", 9], link: ["Deal Link", 10],
    },
  },
  {
    // Sheet3: no header row, fixed positions (B, C, E, F, H, J, K).
    name: "Sheet3 (Holiday)",
    marker: null,
    cols: {
      store: [null, 1], category: [null, 2], size: [null, 4], title: [null, 5],
      price: [null, 7], notes: [null, 9], link: [null, 10],
    },
  },
];

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** "139..99" -> 139.99, "$1,399.99" -> 1399.99, "" or junk -> null */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/\.{2,}/g, ".");
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
}

/** "47%" -> 47 */
export function parsePercent(raw: string): number | null {
  const m = raw.match(/-?\d+(\.\d+)?/);
  return m ? Math.round(Number(m[0])) : null;
}

/** Pulls "Was $199.98" style prices out of the notes text. */
export function parseWas(notes: string): number | null {
  const m = notes.match(/was\s*\$?\s*([\d.,]*\d)/i);
  return m ? parsePrice(m[1]) : null;
}

/**
 * Latest end date mentioned in the notes, as end-of-day timestamp.
 * Handles "11/9/26 - 11/30/26" and "Nov 4–10, 2026". Missing year = current year.
 * Shortcut: cross-year ranges like "Dec 28 - Jan 3" are not handled, upgrade if such dates appear.
 */
export function parseEndDate(notes: string, now: Date): number | null {
  let best: number | null = null;
  const keep = (t: number) => { if (best === null || t > best) best = t; };

  for (const m of notes.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g)) {
    const y = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
    keep(new Date(y, Number(m[1]) - 1, Number(m[2]), 23, 59, 59).getTime());
  }
  for (const m of notes.matchAll(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:\s*[-–—]\s*(\d{1,2}))?(?:,?\s*(\d{4}))?/gi,
  )) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const day = Number(m[3] ?? m[2]);
    const year = m[4] ? Number(m[4]) : now.getFullYear();
    keep(new Date(year, month, day, 23, 59, 59).getTime());
  }
  return best;
}

const cell = (row: string[], i: number | undefined): string =>
  i === undefined ? "" : (row[i] ?? "").trim();

function resolveCols(layout: Layout, header: string[] | null): Partial<Record<Field, number>> {
  const out: Partial<Record<Field, number>> = {};
  for (const [field, [label, idx]] of Object.entries(layout.cols) as [Field, [string | null, number]][]) {
    const found = label && header
      ? header.findIndex((h) => h.toLowerCase() === label.toLowerCase())
      : -1;
    out[field] = found >= 0 ? found : idx;
  }
  return out;
}

function findHeader(rows: string[][]): { layout: Layout; headerIndex: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const lower = rows[i].map((c) => c.trim().toLowerCase());
    for (const layout of LAYOUTS) {
      if (layout.marker && layout.marker.every((m) => lower.includes(m))) {
        return { layout, headerIndex: i };
      }
    }
  }
  return null;
}

/** Normalizes one tab's parsed CSV rows. Throws if the layout is unrecognized. */
export function normalizeTab(tab: string, rows: string[][], now: Date): TabResult {
  const found = findHeader(rows) ?? { layout: LAYOUTS[2], headerIndex: -1 };
  const { layout, headerIndex } = found;
  const header = headerIndex >= 0 ? rows[headerIndex].map((c) => c.trim()) : null;
  const col = resolveCols(layout, header);
  const nowMs = now.getTime();
  const items: DealItem[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (f: Field) => cell(row, col[f]);
    const title = get("title");
    if (!title) continue;

    const notes = get("notes");
    const rawPrice = get("price");
    const price = parsePrice(rawPrice);
    const wasPrice = parseWas(notes);
    const sheetOff = parsePercent(get("offPct"));
    const computed = sheetOff === null && wasPrice !== null && price !== null && wasPrice > price
      ? Math.round(((wasPrice - price) / wasPrice) * 100)
      : null;
    const endsAt = parseEndDate(notes, now);
    const expired = /\(expired\)/i.test(notes) || (endsAt !== null && endsAt < nowMs);

    items.push({
      id: `${tab}:${r + 1}`,
      store: get("store"),
      category: get("category"),
      subCategory: get("subCategory"),
      brand: get("brand"),
      title,
      link: get("link"),
      size: get("size"),
      price,
      rawPrice,
      wasPrice,
      offPercent: sheetOff ?? computed,
      offSource: sheetOff !== null ? "sheet" : computed !== null ? "computed" : null,
      notes,
      otherOffer: get("otherOffer"),
      endsAt,
      expired,
      expiringSoon: !expired && endsAt !== null && endsAt - nowMs <= EXPIRING_WINDOW_DAYS * DAY,
      tabs: [tab],
      sourceRow: r + 1,
      score: null,
      scoreParts: null,
    });
  }

  if (headerIndex < 0 && items.length === 0) {
    throw new Error("Unrecognized sheet layout: no header row and no product rows found.");
  }
  return {
    status: { name: tab, layout: layout.name, count: items.length, error: null },
    items,
  };
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * Deduplicates on Store + Product + Price across all tabs (keeping tab badges),
 * then computes the Deal Score (0-100):
 *  - discount: 50 pts, scaled by % OFF
 *  - validity: 20 pts if active with a known end date, 10 if active with no end date, 0 if expired
 *  - price: 30 pts, full credit when the price is 50%+ below its sub-category median.
 *    Neutral 15 pts when the sub-category has fewer than 2 priced deals.
 */
/** Stable identity of a deal across sheet edits (row numbers can change; store, title and price rarely do). */
export function dealKey(d: Pick<DealItem, "store" | "title" | "price" | "rawPrice">): string {
  return `${d.store.toLowerCase()}|${d.title.toLowerCase()}|${d.price ?? d.rawPrice}`;
}

export function finalizeDeals(all: DealItem[]): DealItem[] {
  const byKey = new Map<string, DealItem>();
  for (const d of all) {
    const key = dealKey(d);
    const prev = byKey.get(key);
    if (prev) {
      for (const t of d.tabs) if (!prev.tabs.includes(t)) prev.tabs.push(t);
    } else {
      byKey.set(key, d);
    }
  }
  const items = [...byKey.values()];

  const groups = new Map<string, number[]>();
  // Case-insensitive so "Omnibook" (Lowe's) and "OmniBook" (other stores) compare together.
  const groupOf = (d: DealItem) => `${d.category}|${d.subCategory}`.toLowerCase();
  for (const d of items) {
    if (d.price === null) continue;
    const g = groupOf(d);
    groups.set(g, [...(groups.get(g) ?? []), d.price]);
  }

  for (const d of items) {
    const discount = ((d.offPercent ?? 0) / 100) * 50;
    const validity = d.expired ? 0 : d.endsAt === null ? 10 : 20;
    let price = 15;
    if (d.price !== null) {
      const prices = groups.get(groupOf(d)) ?? [];
      if (prices.length >= 2) {
        const m = median(prices);
        const savings = m > 0 ? (m - d.price) / m : 0;
        price = Math.min(1, Math.max(0, savings / 0.5)) * 30;
      }
    } else {
      price = 0;
    }
    d.scoreParts = {
      discount: Math.round(discount * 10) / 10,
      validity,
      price: Math.round(price * 10) / 10,
    };
    d.score = Math.round(Math.min(100, Math.max(0, discount + validity + price)));
  }
  return items;
}

export interface SheetsResponse {
  spreadsheetId: string;
  fetchedAt: string;
  tabs: TabStatus[];
  deals: DealItem[];
  error?: string;
}
