import { test, expect, loginAs } from "../support/system.js";

test.describe("Room View general", () => {
  test("open room as owner", async ({ page }) => {
    await loginAs(page, "daniel");
    await page.goto("/rooms/abc-def-123");

    await expect(page.getByText("Anatomy").first()).toBeVisible();
  });

  test.describe("user without membership", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, "angela");
      await page.goto("/rooms/abc-def-123");

      await expect(page.getByText("Anatomy").first()).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("wrong access code keeps the access overlay, correct code grants access afterwards", async ({
      page,
    }) => {
      const accessCode = page.getByTestId("access-code-field").locator("input");
      await accessCode.fill("111111111");
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();

      await accessCode.clear();
      await accessCode.fill("123456789");
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toHaveCount(0);
    });

    test("correct access code grants access", async ({ page }) => {
      await page
        .getByTestId("access-code-field")
        .locator("input")
        .fill("123456789");
      await page.getByTestId("room-login-button").click();

      await expect(page.getByTestId("room-access-overlay")).toHaveCount(0);
    });
  });

  test("guest forbidden", async ({ page }) => {
    await page.goto("/rooms/abc-def-123");

    await expect(
      page.getByText("This room can only be used by authenticated users."),
    ).toBeVisible();
  });

  test.describe("guest allowed", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-234");

      await expect(page.getByText("Math").first()).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await page
        .getByTestId("participant-name-field")
        .locator("#participant-name")
        .fill("John Doe");
    });

    test("wrong access code keeps the access overlay, correct code grants access afterwards", async ({
      page,
    }) => {
      const accessCode = page.getByTestId("access-code-field").locator("input");
      await accessCode.fill("111111111");
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();

      await accessCode.clear();
      await accessCode.fill("123456789");
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toHaveCount(0);
    });

    test("correct access code grants access", async ({ page }) => {
      await page
        .getByTestId("access-code-field")
        .locator("input")
        .fill("123456789");
      await page.getByTestId("room-login-button").click();

      await expect(page.getByTestId("room-access-overlay")).toHaveCount(0);
    });
  });

  test("room not found", async ({ page }) => {
    await page.goto("/rooms/123-456-789");

    await expect(
      page.getByText("The requested address was not found"),
    ).toBeVisible();
  });
});
