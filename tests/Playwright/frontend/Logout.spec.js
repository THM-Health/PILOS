import { serverError } from "../support/utils.js";
import { mergeTests } from "@playwright/test";
import { test as authGeneralTest } from "../support/fixtures/authGeneral.js";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { expect, expectToastAndClose } from "../support/test.js";

const test = mergeTests(
  authGeneralTest,
  roomControllerTest,
  roomTypeControllerTest,
);

test.describe("Logout", () => {
  test.use({ authenticated: true });

  test("successful logout without redirect", async ({
    page,
    postLogoutApiMock,
  }) => {
    const postLogoutRequestsAfterChange = postLogoutApiMock.respondWith({
      status: 204,
    });
    await page.goto("/rooms");

    await page.getByTestId("navbar-user").click();
    const logout = page
      .getByTestId("submenu")
      .first()
      .getByTestId("navbar-user-logout");
    await expect(logout).toHaveText("auth.logout");

    const logoutRequest = postLogoutRequestsAfterChange.waitForNextRequest();
    await logout.click();
    await logoutRequest;

    await expect(page).toHaveURL(/\/logout/);
    await expect(page).not.toHaveURL(/\/rooms/);
    await expect(page.getByText("auth.logout_success")).toBeVisible();
  });

  test("home button after logout leaves the logout page", async ({
    page,
    postLogoutApiMock,
  }) => {
    postLogoutApiMock.respondWith({
      status: 204,
    });
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

  test("successful logout with redirect", async ({
    page,
    postLogoutApiMock,
  }) => {
    const redirectBaseUrl =
      "https://thm-health.github.io/PILOS-Redirect_Test_Pages";
    const redirectUrl = `${redirectBaseUrl}/idp?foo=a&bar=b`;
    postLogoutApiMock.respondWith({
      status: 200,
      json: { redirect: redirectUrl },
    });
    // eslint-disable-next-line no-restricted-syntax -- external redirect URL, not an API request
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
    postLogoutApiMock,
  }) => {
    const postLogoutRequestsAfterChange =
      postLogoutApiMock.respondWith(serverError());
    await page.goto("/rooms");

    await page.getByTestId("navbar-user").click();
    const logoutRequest = postLogoutRequestsAfterChange.waitForNextRequest();
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
