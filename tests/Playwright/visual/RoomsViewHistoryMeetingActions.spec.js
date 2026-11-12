import { test, expect } from "../support/test.js";

test.describe("Rooms view history meeting actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/rooms/abc-def-123", (route) =>
      route.fulfill({ path: "tests/Playwright/fixtures/room.json" }),
    );
    await page.route("**/api/v1/rooms/abc-def-123/meetings*", (route) =>
      route.fulfill({ path: "tests/Playwright/fixtures/roomHistory.json" }),
    );
    await page.route(
      "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
      (route) =>
        route.fulfill({
          path: "tests/Playwright/fixtures/roomHistoryStats.json",
        }),
    );

    await page.goto("/rooms/abc-def-123#tab=history");
    await page
      .getByTestId("room-history-item")
      .nth(4)
      .getByTestId("room-history-statistic-button")
      .click();
    await expect(page.getByTestId("overlay")).toBeHidden();
  });

  test("stats chart", async ({ page }) => {
    await expect(page.locator('[data-test="chart"] > canvas')).toHaveScreenshot(
      "room-history-chart.png",
    );
  });

  test.describe("dark mode", () => {
    test.use({ colorScheme: "dark" });

    test("stats chart", async ({ page }) => {
      await expect(
        page.locator('[data-test="chart"] > canvas'),
      ).toHaveScreenshot("room-history-chart-dark.png");
    });
  });
});
