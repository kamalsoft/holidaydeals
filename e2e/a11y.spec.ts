import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Cards fade in; scan the settled colours, not a half-faded frame.
test.use({ reducedMotion: "reduce" });

const LAYOUTS = ["classic", "feed", "spotlight", "dashboard", "simple", "superior", "rich", "luxury"];

// Colour contrast must pass WCAG 2 AA in every layout, in both themes.
for (const theme of ["light", "dark"] as const) {
  test(`colour contrast passes WCAG AA in every layout (${theme})`, async ({ page }) => {
    test.setTimeout(10 * 60_000);
    await page.addInitScript((value) => {
      try {
        localStorage.setItem("hdf.theme", value);
      } catch {}
    }, JSON.stringify(theme));

    const failures: string[] = [];
    for (const layout of LAYOUTS) {
      await page.goto(`/?layout=${layout}`);
      await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).disableRules(["region"]).analyze();
      const violations = results.violations.filter((v) => v.id === "color-contrast" && (v.impact === "serious" || v.impact === "critical"));
      for (const v of violations) {
        for (const node of v.nodes) {
          const line = `[${theme}/${layout}] ${v.id} (${v.impact}) ${node.target.join(" ")} :: ${node.failureSummary?.split("\n").slice(-1)[0] ?? ""}`;
          failures.push(line);
        }
      }
    }
    if (failures.length) console.log(failures.join("\n"));
    expect(failures).toEqual([]);
  });
}
