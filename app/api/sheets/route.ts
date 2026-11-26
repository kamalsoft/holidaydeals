import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import {
  finalizeDeals,
  normalizeTab,
  type DealItem,
  type SheetsResponse,
  type TabResult,
} from "@/lib/normalizeDeals";
import { isValidSpreadsheetId } from "@/lib/sheetUrl";

const MAX_TABS = 20;
const NOT_PUBLIC =
  'Sheet is private, invalid, or this tab does not exist. Set sharing to "Anyone with the link can view" and check the tab name.';

async function loadTab(spreadsheetId: string, name: string, now: Date): Promise<TabResult> {
  const url =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/csv" },
      next: { revalidate: 300 },
    });
    const text = await res.text();
    const type = res.headers.get("content-type") ?? "";
    // Private or missing sheets come back as an HTML login/error page.
    if (!res.ok || type.includes("text/html") || text.trimStart().startsWith("<")) {
      return { status: { name, layout: null, count: 0, error: NOT_PUBLIC }, items: [] };
    }
    const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), { header: false });
    return normalizeTab(name, parsed.data, now);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: { name, layout: null, count: 0, error: message }, items: [] };
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<SheetsResponse>> {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!isValidSpreadsheetId(id)) {
    return NextResponse.json(
      { spreadsheetId: id, fetchedAt: new Date().toISOString(), tabs: [], deals: [], error: "Invalid spreadsheet ID." },
      { status: 400 },
    );
  }

  const names = [
    ...new Set(
      (req.nextUrl.searchParams.get("tabs") ?? "Sheet1,Sheet2,Sheet3")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s.length <= 100),
    ),
  ].slice(0, MAX_TABS);

  const now = new Date();
  const results = await Promise.all(names.map((n) => loadTab(id, n, now)));
  const deals: DealItem[] = finalizeDeals(results.flatMap((r) => r.items));
  const allFailed = results.length > 0 && results.every((r) => r.status.error);

  return NextResponse.json({
    spreadsheetId: id,
    fetchedAt: now.toISOString(),
    tabs: results.map((r) => r.status),
    deals,
    error: allFailed ? results[0].status.error ?? undefined : undefined,
  });
}
