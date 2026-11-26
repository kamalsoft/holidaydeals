import { defineConfig, devices } from "@playwright/test";

// Local runs use the Chrome already installed; CI uses Playwright's bundled Chromium.
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npx next dev -p 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" },
    },
  ],
});
