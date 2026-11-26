import Papa from "papaparse";
import {
  finalizeDeals,
  normalizeTab,
  type SheetsResponse,
  type TabResult,
} from "./normalizeDeals";
import { DEFAULT_SHEET_ID, DEFAULT_TABS, SITE_BASE, isValidSpreadsheetId } from "./sheetUrl";

const NOT_PUBLIC =
  'Sheet is private, invalid, or this tab does not exist. Set sharing to "Anyone with the link can view" and check the tab name.';

const fail = (name: string, message: string): TabResult => ({
  status: { name, layout: null, count: 0, error: message },
  items: [],
});

/** Fetches one tab as CSV directly from Google (the sheet allows browser requests). */
async function loadTab(spreadsheetId: string, name: string, now: Date): Promise<TabResult> {
  const url =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const type = res.headers.get("content-type") ?? "";
    // Private or missing sheets come back as an HTML login/error page.
    if (!res.ok || type.includes("text/html") || text.trimStart().startsWith("<")) {
      return fail(name, NOT_PUBLIC);
    }
    const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), { header: false });
    return normalizeTab(name, parsed.data, now);
  } catch (err) {
    // Browsers hide the reason for blocked requests, so a network/CORS TypeError usually means "not public".
    if (err instanceof TypeError) return fail(name, NOT_PUBLIC);
    return fail(name, err instanceof Error ? err.message : "Unknown error");
  }
}

/**
 * Uses the hourly snapshot built into the site when it matches the default sheet and tabs.
 * Otherwise (or if the snapshot is missing) it reads the live sheet.
 */
export async function loadPublishedOrLive(spreadsheetId: string, names: string[]): Promise<SheetsResponse> {
  const sameSource =
    spreadsheetId === DEFAULT_SHEET_ID && names.join(",") === DEFAULT_TABS.join(",");
  if (sameSource) {
    try {
      const res = await fetch(`${SITE_BASE}/data/snapshot.json`);
      if (res.ok) {
        const snap = (await res.json()) as SheetsResponse;
        if (!snap.error && snap.deals?.length) return snap;
      }
    } catch {
      // No snapshot available: fall through to the live sheet.
    }
  }
  return loadSheet(spreadsheetId, names);
}

export async function loadSheet(spreadsheetId: string, names: string[]): Promise<SheetsResponse> {
  const now = new Date();
  if (!isValidSpreadsheetId(spreadsheetId)) {
    return { spreadsheetId, fetchedAt: now.toISOString(), tabs: [], deals: [], error: "Invalid spreadsheet ID." };
  }
  const results = await Promise.all(names.map((n) => loadTab(spreadsheetId, n, now)));
  const allFailed = results.length > 0 && results.every((r) => r.status.error);
  return {
    spreadsheetId,
    fetchedAt: now.toISOString(),
    tabs: results.map((r) => r.status),
    deals: finalizeDeals(results.flatMap((r) => r.items)),
    error: allFailed ? (results[0].status.error ?? undefined) : undefined,
  };
}
