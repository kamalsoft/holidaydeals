import type { DealItem } from "./normalizeDeals";

/** Stable key for a deal across sheet edits: store, title and price. */
export const shareKey = (d: Pick<DealItem, "store" | "title" | "price">) =>
  `${d.store.toLowerCase()}|${d.title.toLowerCase()}|${d.price ?? ""}`;

const MAX_ITEMS = 200;

/** URL-safe base64 of the list of deal keys. */
export function encodeShare(keys: string[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify(keys));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Returns the deal keys, or null if the code is not valid. */
export function decodeShare(code: string): string[] | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const list: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(list) || !list.every((x) => typeof x === "string")) return null;
    return list.slice(0, MAX_ITEMS);
  } catch {
    return null;
  }
}
