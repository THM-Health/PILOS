import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { expect } from "../support/test.js";
import { mockApiRequest } from "../support/utils.js";

const test = roomControllerTest;

test.describe("Rooms view history meeting actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await mockApiRequest(
      page,
      "GET",
      "meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
      { path: "tests/Playwright/fixtures/roomHistoryStats.json" },
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
