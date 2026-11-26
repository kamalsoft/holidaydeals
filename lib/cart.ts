import type { DealItem } from "./normalizeDeals";

export interface CartItem {
  id: string;
  title: string;
  store: string;
  brand: string;
  price: number | null;
  wasPrice: number | null;
  offPercent: number | null;
  link: string;
  addedAt: number;
}

export const toCartItem = (d: DealItem): CartItem => ({
  id: d.id,
  title: d.title,
  store: d.store,
  brand: d.brand,
  price: d.price,
  wasPrice: d.wasPrice,
  offPercent: d.offPercent,
  link: d.link,
  addedAt: Date.now(),
});

/** Savings from the sheet's "Was" price, or estimated from % OFF when no "Was" price exists. */
export function savingsOf(i: CartItem): number {
  if (i.price === null) return 0;
  if (i.wasPrice !== null && i.wasPrice > i.price) return i.wasPrice - i.price;
  if (i.offPercent !== null && i.offPercent > 0 && i.offPercent < 100) {
    return (i.price * i.offPercent) / (100 - i.offPercent);
  }
  return 0;
}

export function cartTotals(items: CartItem[]) {
  return {
    spend: items.reduce((s, i) => s + (i.price ?? 0), 0),
    savings: items.reduce((s, i) => s + savingsOf(i), 0),
  };
}

const money = (n: number | null) => (n === null ? "" : n.toFixed(2));

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(items: CartItem[]): string {
  const header = ["Store", "Product", "Brand", "Deal Price", "% OFF", "Was Price", "Est. Savings", "Link"];
  const rows = items.map((i) => [
    i.store, i.title, i.brand, money(i.price), i.offPercent ?? "", money(i.wasPrice),
    money(savingsOf(i)), i.link,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function toMarkdown(items: CartItem[]): string {
  const { spend, savings } = cartTotals(items);
  const lines = [
    "# My Wishlist",
    "",
    `Items: ${items.length} · Total spend: $${spend.toFixed(2)} · Est. savings: $${savings.toFixed(2)}`,
    "",
    "| Store | Product | Price | % OFF | Link |",
    "| --- | --- | --- | --- | --- |",
    ...items.map((i) =>
      `| ${i.store} | ${i.title.replace(/\|/g, "\\|")} | $${money(i.price)} | ${i.offPercent ?? ""} | ${i.link} |`,
    ),
  ];
  return lines.join("\n");
}
