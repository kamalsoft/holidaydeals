import type { DealItem } from "./normalizeDeals";

export interface Highlights {
  biggestOff: DealItem | null;
  under50: DealItem | null;
  bestValue: DealItem | null;
  deep50: { count: number; top: DealItem | null };
  expiringSoon: DealItem | null;
  bigTicket: DealItem | null;
  hotDeals: DealItem[];
}

const TV_LAPTOP = /\b(tv|televisions?|laptops?|notebooks?)\b/i;

function best(xs: DealItem[], key: (d: DealItem) => number): DealItem | null {
  let top: DealItem | null = null;
  for (const d of xs) if (top === null || key(d) > key(top)) top = d;
  return top;
}

/** Highlights are computed over active (non-expired) deals in the scope given. */
export function buildHighlights(items: DealItem[]): Highlights {
  const active = items.filter((d) => !d.expired);
  const priced = active.filter((d) => d.price !== null);
  const withOff = active.filter((d) => d.offPercent !== null);
  const deep = withOff.filter((d) => (d.offPercent ?? 0) >= 50);
  const bigTicketPool = priced.filter(
    (d) => (d.price ?? 0) >= 500 && TV_LAPTOP.test(`${d.subCategory} ${d.title}`),
  );

  return {
    biggestOff: best(withOff, (d) => d.offPercent ?? -1),
    under50: best(priced.filter((d) => (d.price ?? 0) < 50), (d) => -(d.price ?? 0)),
    bestValue: best(active, (d) => d.score ?? -1),
    deep50: { count: deep.length, top: best(deep, (d) => d.offPercent ?? -1) },
    expiringSoon: best(active.filter((d) => d.expiringSoon), (d) => -(d.endsAt ?? Infinity)),
    bigTicket: best(bigTicketPool, (d) => d.score ?? -1),
    hotDeals: [...withOff]
      .sort((a, b) => (b.offPercent ?? 0) - (a.offPercent ?? 0) || (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10),
  };
}
