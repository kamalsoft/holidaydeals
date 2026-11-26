---
name: holiday-deal-data
description: Reference for the Holiday Deal Finder sheet layouts, cleaning rules, Deal Score and Hot Deals logic. Load before changing lib/normalizeDeals.ts, lib/highlights.ts or app/api/sheets/route.ts.
---

# Holiday Deal Finder: data rules

The Google Sheet is the only source of truth. Never add outside data. Dates are shown as written in the sheet.

## Layouts (detected by header content, not row number)
- **Sheet1 (Amazon):** header row contains `Retailer` and `Product name`. Columns: Retailer, Department, Sub Category, Brand, Product name, Link, Deal Price, % OFF.
- **Sheet2 (multi-retailer):** header contains `Store` and `Product / Deal`. Sub-category and brand are unnamed (columns D and E). Notes are in `Deal Dates & Notes`.
- **Sheet3 (holiday):** no header. Fixed columns B (store), C (category), E (size), F (product), H (price), J (window), K (link).
- Unknown layout with no product rows: the tab reports an error. The app does not guess.

## Cleaning
- Prices: strip `$` and commas, collapse `..` to `.` (`139..99` -> `139.99`). Anything else becomes `null`, shown as "—".
- % off: use the sheet's `% OFF` when present. Otherwise calculate it from `Was $X` in the notes, and label it "calc.".
- Expired: notes contain `(expired)`, or the latest end date mentioned is before today.
- Expiring soon: not expired, and the latest end date is within 7 days.
- Dedup: Store + Title + Price across tabs. Keep every tab badge.

## Deal Score (0-100)
- Discount: 50 points, scaled by % off.
- Validity: 20 points if active with a known end date, 10 if active with no end date, 0 if expired.
- Price: 30 points. Full credit when the price is 50% or more below the sub-category median. Neutral 15 points when fewer than two priced deals exist in the sub-category.

## Highlights
Computed over active deals in the selected tab scope: Biggest % off, Lowest under $50, Best value, Big-ticket TV/laptop (price of $500 or more), 50%+ off, Expiring soon, and Hot deals (top five by % off).

## Known limits
- Cross-year date ranges (e.g. `Dec 28 - Jan 3`) are not parsed.
- Compare matching uses token overlap, not a fuzzy matcher.
