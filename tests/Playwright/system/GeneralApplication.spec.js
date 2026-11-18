import { test, expect, loginAs } from "../support/system.js";

test.describe("General", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "john");
    await page.goto("/rooms");
    await page.getByTestId("navbar-locale").click();
  });

  test("all locales get rendered", async ({ page }) => {
    const submenu = page.getByTestId("submenu").nth(2);

    await expect(submenu.locator("li")).toHaveCount(3);
    await expect(submenu.getByTestId("navbar-locale-de")).toHaveText(
      "Deutsch (German)",
    );
    await expect(submenu.getByTestId("navbar-locale-en")).toHaveText("English");
    await expect(submenu.getByTestId("navbar-locale-fr")).toHaveText(
      "Français (French)",
    );
  });

  test("changing selected locale", async ({ page }) => {
    const submenu = page.getByTestId("submenu").nth(2);
    await expect(submenu).toBeVisible();

    await submenu.getByTestId("navbar-locale-de").click();

    await expect(page.getByText("Räume").first()).toBeVisible();
  });
});
