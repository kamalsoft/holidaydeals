import { defineConfig } from "vitest/config";

// Unit tests only. The Playwright specs in e2e/ run under `npm run e2e`.
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "components/**/*.test.ts"],
  },
});
