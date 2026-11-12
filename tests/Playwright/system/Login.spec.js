import { test, expect } from "../support/system.js";

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-tab-button-local").click();
    await page.locator("#local-email").fill("john.doe@example.org");
  });

  test("local login", async ({ page }) => {
    await page.locator("#local-password").fill("johndoe");
    const loginButton = page.getByTestId("login-button");
    await expect(loginButton).toHaveText("Login");
    await loginButton.click();

    await expect(page.locator(".p-toast")).toBeVisible();
    await expect(page.locator(".p-toast")).toHaveText("Successfully logged in");
    await expect(page).toHaveURL(/\/rooms/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("local login invalid", async ({ page }) => {
    await page.locator("#local-password").fill("johndoe2");
    const loginButton = page.getByTestId("login-button");
    await expect(loginButton).toHaveText("Login");
    await loginButton.click();

    await expect(
      page.getByText("These credentials do not match our records."),
    ).toBeVisible();
  });
});
