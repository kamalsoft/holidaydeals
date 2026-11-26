import { configDefaults, defineConfig } from "vitest/config";

// Playwright specs live in e2e/ and must not run under vitest.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
