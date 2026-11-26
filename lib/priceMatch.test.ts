import { describe, expect, it } from "vitest";
import { normalizeTab, finalizeDeals } from "./normalizeDeals";
import { buildPriceGroups } from "./priceMatch";

const NOW = new Date(2026, 10, 26, 12);
const row = (store: string, title: string, price: string) =>
  ["", store, "Electronics", "Headphones", "Acme", title, "", price, "", "", ""];
const header = ["", "Store", "Category", "Sub", "Brand", "Product / Deal", "", "Deal Price ($)", "", "Deal Dates & Notes", "Deal Link"];

describe("buildPriceGroups", () => {
  const items = finalizeDeals(normalizeTab("Sheet2", [
    header,
    row("Costco", "Acme Wireless Noise Cancelling Headphones Black", "$199.99"),
    row("Best Buy", "Acme Wireless Noise Cancelling Headphones Black", "$179.99"),
    row("Walmart", "Acme Wireless Noise Cancelling Headphones Black", "$189.00"),
    row("Costco", "Acme Wireless Noise Cancelling Headphones Black", "$205.00"), // same store, higher: ignored
    row("Lowe's", "Garden Hose 50ft Green", "$25.00"), // single store: no group
  ], NOW).items);

  it("groups one product across stores, one offer per store, cheapest first", () => {
    const groups = buildPriceGroups(items);
    expect(groups).toHaveLength(1);
    const g = groups[0];
    expect(g.offers.map((o) => o.store)).toEqual(["Best Buy", "Walmart", "Costco"]);
    expect(g.offers.find((o) => o.store === "Costco")?.price).toBe(199.99);
    expect(g.lowest.store).toBe("Best Buy");
    expect(g.highest.store).toBe("Costco");
    expect(g.savings).toBeCloseTo(20, 2);
    expect(g.savingsPct).toBe(10);
  });

  it("returns no groups when every product is sold at one store", () => {
    expect(buildPriceGroups(items.filter((d) => d.store === "Lowe's"))).toEqual([]);
  });
});
