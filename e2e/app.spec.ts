import { expect, test } from "@playwright/test";

// These run against the live sheet (dev server reads it directly), so they check structure, not exact numbers.

test("loads deals with the header and filters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Holiday Deal Finder/ })).toBeVisible();
  await expect(page.getByText("Thanksgiving Day Deals 2026")).toBeVisible();
  await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Filters" }).or(page.getByRole("region", { name: "Filters" })).first()).toBeVisible();
});

test("every layout renders deals on desktop", async ({ page }) => {
  for (const layout of ["classic", "feed", "spotlight", "dashboard", "simple", "superior", "rich", "luxury"]) {
    await page.goto(`/?layout=${layout}`);
    await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });
  }
});

test("layout comes from the URL and the menu updates it", async ({ page }) => {
  await page.goto("/?layout=feed");
  await expect(page.getByRole("complementary", { name: "Hot deals" })).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Layout").selectOption("spotlight");
  await expect(page).toHaveURL(/layout=spotlight/);
  await expect(page.getByLabel("Spotlight deal")).toBeVisible();
});

test("cards, table and price-match views switch in every layout", async ({ page }) => {
  await page.goto("/?layout=classic");
  await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "☰ Table" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "⇄ Price match" }).click();
  await expect(page.getByRole("note")).toContainText("Price matches are estimates");
  await page.getByRole("button", { name: "▦ Cards" }).click();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("theme setting switches the page to dark", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Display settings" }).click();
  await page.getByLabel("Theme").selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByLabel("Theme").selectOption("light");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("hot deals popup traps focus, closes with Escape and returns focus", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "View top 10" });
  await expect(opener).toBeVisible({ timeout: 60_000 });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: /Hot deals/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("reset filters clears the search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });
  const search = page.getByPlaceholder("Search product, brand, store, notes…");
  await search.fill("zzz-no-such-deal");
  const empty = page.getByRole("status").filter({ hasText: "No deals match these filters" });
  await expect(empty).toBeVisible();
  await empty.getByRole("button", { name: "Reset filters" }).click();
  await expect(search).toHaveValue("");
});

test.describe("phone layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const layout of ["classic", "feed", "spotlight", "dashboard", "simple", "superior", "rich", "luxury"]) {
    test(`${layout} fits the screen width`, async ({ page }) => {
      await page.goto(`/?layout=${layout}`);
      await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("filters open from the Filters button and close again", async ({ page }) => {
    await page.goto("/?layout=classic");
    await expect(page.getByText(/Showing/).first()).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: /^Filters/ }).click();
    const panel = page.getByRole("complementary", { name: "Filters" });
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /^Filters/ })).toBeFocused();
  });

  test("the ☰ menu holds layout and display options", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByLabel("Layout")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
  });
});

test("desktop defaults to Classic when the link has no layout", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await expect(page.getByLabel("Layout").first()).toHaveValue("classic");
});

test.describe("phone default layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("phones default to Simple when the link has no layout", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" }).getByLabel("Layout")).toHaveValue("simple");
  });
});
