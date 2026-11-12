import { test, expect, expectToastAndClose } from "../support/test.js";

const redirectBaseUrl =
  "https://thm-health.github.io/PILOS-Redirect_Test_Pages";

test.describe("Logout", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/roomTypes*", (route) =>
      route.fulfill({ path: "tests/Playwright/fixtures/roomTypes.json" }),
    );
    await page.route("**/api/v1/rooms*", (route) =>
      route.fulfill({ path: "tests/Playwright/fixtures/rooms.json" }),
    );
  });

  test("successful logout without redirect", async ({ page }) => {
    await page.route("**/api/v1/logout", (route) =>
      route.fulfill({ status: 204 }),
    );
    await page.goto("/rooms");

    await page.getByTestId("navbar-user").click();
    const logout = page
      .getByTestId("submenu")
      .first()
      .getByTestId("navbar-user-logout");
    await expect(logout).toHaveText("auth.logout");

    const logoutRequest = page.waitForRequest("**/api/v1/logout");
    await logout.click();
    await logoutRequest;

    await expect(page).toHaveURL(/\/logout/);
    await expect(page).not.toHaveURL(/\/rooms/);
    await expect(page.getByText("auth.logout_success")).toBeVisible();
  });

  test("home button after logout leaves the logout page", async ({ page }) => {
    await page.route("**/api/v1/logout", (route) =>
      route.fulfill({ status: 204 }),
    );
    await page.goto("/rooms");
    await page.getByTestId("navbar-user").click();
    await page
      .getByTestId("submenu")
      .first()
      .getByTestId("navbar-user-logout")
      .click();
    await expect(page).toHaveURL(/\/logout/);

    const homeButton = page.getByTestId("home-button");
    await expect(homeButton).toHaveText("app.home");
    await homeButton.click();

    await expect(page).not.toHaveURL(/\/logout/);
  });

  test("successful logout with redirect", async ({ page }) => {
    const redirectUrl = `${redirectBaseUrl}/idp?foo=a&bar=b`;
    await page.route("**/api/v1/logout", (route) =>
      route.fulfill({ status: 200, json: { redirect: redirectUrl } }),
    );
    await page.route(`${redirectBaseUrl}/**`, (route) =>
      route.fulfill({ body: "redirected", contentType: "text/html" }),
    );
    await page.goto("/rooms");

    await page.getByTestId("navbar-user").click();
    const logout = page
      .getByTestId("submenu")
      .first()
      .getByTestId("navbar-user-logout");
    await expect(logout).toHaveText("auth.logout");
    await logout.click();

    await expect(page).toHaveURL(redirectUrl);
  });

  test("failed logout shows an error and keeps the user logged in", async ({
    page,
  }) => {
    await page.route("**/api/v1/logout", (route) =>
      route.fulfill({ status: 500, json: { message: "Test" } }),
    );
    await page.goto("/rooms");

    await page.getByTestId("navbar-user").click();
    const logoutRequest = page.waitForRequest("**/api/v1/logout");
    await page
      .getByTestId("submenu")
      .first()
      .getByTestId("navbar-user-logout")
      .click();
    await logoutRequest;

    await expectToastAndClose(page, "auth.flash.logout_error");

    await expect(page).toHaveURL(/\/rooms/);
    await expect(page).not.toHaveURL(/\/logout|\/login/);
  });
});
