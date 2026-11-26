export const DEFAULT_SHEET_ID = "1Kws9jVrDu3LhiTJ_iVgoTSnXr2suh-s58reylOdqvKI";
export const DEFAULT_TABS = ["Sheet1", "Sheet2", "Sheet3"];

const ID_RE = /^[a-zA-Z0-9-_]{20,}$/;

/** Accepts a full Google Sheets URL or a bare spreadsheet ID. */
export function extractSpreadsheetId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  return ID_RE.test(s) ? s : null;
}

export function isValidSpreadsheetId(id: string): boolean {
  return ID_RE.test(id);
}
