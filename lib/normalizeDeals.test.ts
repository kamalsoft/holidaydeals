import { describe, expect, it } from "vitest";
import { finalizeDeals, normalizeTab, parseEndDate, parsePercent, parsePrice, parseWas } from "./normalizeDeals";
import { savingsOf, type CartItem } from "./cart";
import { buildHighlights } from "./highlights";

const NOW = new Date(2026, 10, 26, 12); // 26 Nov 2026

describe("price and percent parsing", () => {
  it("repairs double-decimal and thousands-separator prices", () => {
    expect(parsePrice("139..99")).toBe(139.99);
    expect(parsePrice("$1,399.99")).toBe(1399.99);
    expect(parsePrice("$69.98")).toBe(69.98);
    expect(parsePrice("call for price")).toBeNull();
    expect(parsePrice("")).toBeNull();
  });

  it("reads percentages and Was prices from notes", () => {
    expect(parsePercent("47%")).toBe(47);
    expect(parsePercent("")).toBeNull();
    expect(parseWas("Was $199.98. Valid Nov 4–10, 2026 (expired)")).toBe(199.98);
    expect(parseWas("Early Black Friday Deals Nov 5-18")).toBeNull();
  });
});

describe("expiry dates", () => {
  it("takes the latest end date in numeric and month-name formats", () => {
    expect(parseEndDate("11/9/26 - 11/30/26; Warehouse & Online", NOW)).toBe(new Date(2026, 10, 30, 23, 59, 59).getTime());
    expect(parseEndDate("Early Black Friday Deals Nov 5-18", NOW)).toBe(new Date(2026, 10, 18, 23, 59, 59).getTime());
    expect(parseEndDate("Valid Nov 4–10, 2026 (expired)", NOW)).toBe(new Date(2026, 10, 10, 23, 59, 59).getTime());
    expect(parseEndDate("", NOW)).toBeNull();
  });
});

describe("normalizeTab", () => {
  it("maps the Sheet2 layout and flags expired deals from the sheet text", () => {
    const rows = [
      ["", "", "", "", "", "", "", "", "", "", ""],
      ["", "Store", "Category", "", "", "Product / Deal", "", "Deal Price ($)", "Other Price / Offer", "Deal Dates & Notes", "Deal Link"],
      ["", "Costco", "Electronics", "TV", "Hisense", "Hisense 55\" QD7", "", "$269.99", "", "11/9/26 - 11/30/26; Warehouse", "https://costco.example"],
      ["", "Best Buy", "Electronics", "Laptop", "HP", "HP 15 laptop", "", "1,299..99", "", "Was $1,499.99. Valid Nov 4–10, 2026 (expired)", ""],
    ];
    const { items, status } = normalizeTab("Sheet2", rows, NOW);
    expect(status.layout).toContain("Sheet2");
    expect(items).toHaveLength(2);
    expect(items[0].price).toBe(269.99);
    expect(items[0].expired).toBe(false);
    expect(items[1].price).toBe(1299.99);
    expect(items[1].wasPrice).toBe(1499.99);
    expect(items[1].offPercent).toBe(13); // computed: (1499.99 - 1299.99) / 1499.99
    expect(items[1].offSource).toBe("computed");
    expect(items[1].expired).toBe(true);
  });

  it("parses headerless Sheet3 rows by fixed position", () => {
    const rows = [
      ["", "Lowe's", "Holiday", "", "5'", "5' Flocked Tree", "", "$69.98", "", "Early Black Friday Deals Nov 5-18", "https://lowes.example", ""],
    ];
    const { items } = normalizeTab("Sheet3", rows, NOW);
    expect(items[0].store).toBe("Lowe's");
    expect(items[0].size).toBe("5'");
    expect(items[0].price).toBe(69.98);
    expect(items[0].expired).toBe(true); // Nov 18 is before Nov 26
  });

  it("throws on an unrecognised headerless tab", () => {
    expect(() => normalizeTab("Other", [["hello", "world"]], NOW)).toThrow(/Unrecognized/);
  });
});

describe("finalizeDeals", () => {
  it("deduplicates on store + title + price and keeps every tab badge", () => {
    const base = normalizeTab("Sheet2", [
      ["", "Store", "Category", "", "", "Product / Deal", "", "Deal Price ($)", "", "Deal Dates & Notes", "Deal Link"],
      ["", "Costco", "Electronics", "", "", "Same TV", "", "$100.00", "", "", ""],
    ], NOW).items;
    const copy = normalizeTab("Sheet3", [["", "costco", "Electronics", "", "", "same tv", "", "$100.00", "", "", ""]], NOW).items;
    const out = finalizeDeals([...base, ...copy]);
    expect(out).toHaveLength(1);
    expect(out[0].tabs).toEqual(["Sheet2", "Sheet3"]);
    expect(out[0].score).not.toBeNull();
  });

  it("compares price within a sub-category regardless of letter case", () => {
    const rows = [
      ["", "Store", "Category", "", "", "Product / Deal", "", "Deal Price ($)", "", "Deal Dates & Notes", "Deal Link"],
      ["", "Lowe's", "Electronics", "Omnibook", "HP", "Laptop A", "", "$699.00", "", "", ""],
      ["", "Best Buy", "Electronics", "OmniBook", "HP", "Laptop B", "", "$399.00", "", "", ""],
      ["", "Costco", "Electronics", "OmniBook", "HP", "Laptop C", "", "$799.00", "", "", ""],
    ];
    const items = finalizeDeals(normalizeTab("Sheet2", rows, NOW).items);
    const lowes = items.find((d) => d.store === "Lowe's");
    // Median of 399, 699, 799 is 699, so Lowe's gets no price points (not the neutral 15).
    expect(lowes?.scoreParts?.price).toBe(0);
  });

  it("scores within 0-100 and gives expired deals no validity points", () => {
    const { items } = normalizeTab("Sheet3", [
      ["", "Lowe's", "Holiday", "", "5'", "Tree", "", "$50.00", "", "Nov 5-18 (expired)", ""],
    ], NOW);
    const [d] = finalizeDeals(items);
    expect(d.scoreParts?.validity).toBe(0);
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(100);
  });
});

describe("highlights and cart", () => {
  it("picks the biggest discount among active deals only", () => {
    const items = normalizeTab("Sheet2", [
      ["", "Store", "Category", "", "", "Product / Deal", "", "Deal Price ($)", "", "Deal Dates & Notes", "Deal Link"],
      ["", "Costco", "Electronics", "", "", "Active TV", "", "100.00", "", "Was $130.00. Valid 11/9/26 - 11/30/26", ""],
      ["", "Costco", "Electronics", "", "", "Bigger expired", "", "50.00", "", "Was $250.00. Nov 4-10, 2026 (expired)", ""],
    ], NOW).items;
    const h = buildHighlights(finalizeDeals(items));
    expect(h.biggestOff?.title).toBe("Active TV");
    expect(h.hotDeals.map((d) => d.title)).toEqual(["Active TV"]);
  });

  it("estimates cart savings from the Was price, or from % OFF when no Was price exists", () => {
    const base: CartItem = { id: "a", title: "", store: "", brand: "", price: 80, wasPrice: 100, offPercent: 20, link: "", addedAt: 0 };
    expect(savingsOf(base)).toBe(20);
    expect(savingsOf({ ...base, wasPrice: null })).toBeCloseTo(20, 5);
  });
});
