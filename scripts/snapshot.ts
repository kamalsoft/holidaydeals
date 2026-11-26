// Fetches the holiday sheet once and writes public/data/snapshot.json (run by the Pages workflow).
// Stops on its own after the holiday window; the site then falls back to the live sheet.
import { mkdirSync, writeFileSync } from "node:fs";
import { loadSheet } from "../lib/loadSheet";
import { DEFAULT_SHEET_ID, DEFAULT_TABS } from "../lib/sheetUrl";

const WINDOW_END = Date.parse("2026-11-28T23:59:59Z");

async function main() {
  if (Date.now() > WINDOW_END) {
    console.log("Snapshot window has ended; skipping.");
    return;
  }
  const result = await loadSheet(DEFAULT_SHEET_ID, DEFAULT_TABS);
  if (result.error || result.deals.length === 0) {
    console.error("Snapshot failed:", result.error ?? "no deals found");
    process.exit(1);
  }
  mkdirSync("public/data", { recursive: true });
  writeFileSync("public/data/snapshot.json", JSON.stringify(result));
  console.log(`Snapshot written: ${result.deals.length} deals at ${result.fetchedAt}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
