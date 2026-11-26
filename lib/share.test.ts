import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "./share";

describe("wishlist share code", () => {
  it("round-trips keys, including accents and symbols", () => {
    const keys = ["amazon|hisense 65\" u7 mini-led|797.99", "lowe's|café 16\" laptop|699"];
    expect(decodeShare(encodeShare(keys))).toEqual(keys);
  });

  it("rejects codes that are not a list of strings", () => {
    expect(decodeShare("not-base64!!")).toBeNull();
    expect(decodeShare(encodeShare([]))).toEqual([]);
    expect(decodeShare(btoa(JSON.stringify([1, 2])))).toBeNull();
  });
});
