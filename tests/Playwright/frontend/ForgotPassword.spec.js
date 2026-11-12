import { test, expect, expectToastAndClose } from "../support/test.js";

test.describe("Forgot password", () => {
  test.beforeEach(async ({ config }) => {
    config.data.auth.local = true;
  });

  test("redirects to 404 with local auth disabled", async ({
    page,
    config,
  }) => {
    config.data.auth.local = false;

    await page.goto("/forgot_password");

    await expect(page).toHaveURL(/\/404/);
    await expect(page).not.toHaveURL(/forgot_password/);
  });

  test("redirects to 404 with password change forbidden", async ({
    page,
    config,
  }) => {
    config.data.user.password_change_allowed = false;

    await page.goto("/forgot_password");

    await expect(page).toHaveURL(/\/404/);
    await expect(page).not.toHaveURL(/forgot_password/);
  });

  test.describe("logged in user", () => {
    test.use({ authenticated: true });

    test("redirects to home page with error message", async ({ page }) => {
      await page.route("**/api/v1/roomTypes*", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/roomTypes.json" }),
      );
      await page.route("**/api/v1/rooms*", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/rooms.json" }),
      );

      await page.goto("/forgot_password");

      await expectToastAndClose(page, "app.flash.guests_only");
      await expect(page).not.toHaveURL(/forgot_password/);
      await expect(page.locator("h1")).toContainText("home.title");
    });
  });

  test.describe("form", () => {
    test.beforeEach(async ({ page }) => {
      await page.route("**/sanctum/csrf-cookie", (route) =>
        route.fulfill({
          headers: { "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/" },
        }),
      );
      await page.goto("/forgot_password");
    });

    test("shows empty email field and submit button", async ({ page }) => {
      const emailField = page.getByTestId("email-field");
      await expect(emailField).toContainText("app.email");
      await expect(emailField.locator("#email")).toBeVisible();
      await expect(emailField.locator("#email")).toHaveValue("");
      await expect(page.getByTestId("send-reset-link-button")).toHaveText(
        "auth.send_password_reset_link",
      );
    });

    test("disables form while request is pending", async ({ page }) => {
      let release;
      const gate = new Promise((resolve) => (release = resolve));
      await page.route("**/api/v1/password/email", async (route) => {
        await gate;
        await route.fulfill({ json: { message: "Success!" } });
      });

      await page.locator("#email").fill("JohnDoe@domain.tld");
      await page.getByTestId("send-reset-link-button").click();

      await expect(page.locator("#email")).toBeDisabled();
      await expect(page.getByTestId("send-reset-link-button")).toBeDisabled();

      release();
      await expectToastAndClose(page, "Success!");
    });

    test("sends email and csrf token", async ({ page }) => {
      await page.route("**/api/v1/password/email", (route) =>
        route.fulfill({ json: { message: "Success!" } }),
      );

      await page.locator("#email").fill("JohnDoe@domain.tld");
      const request = page.waitForRequest("**/api/v1/password/email");
      await page.getByTestId("send-reset-link-button").click();

      const forgotPasswordRequest = await request;
      expect(forgotPasswordRequest.postDataJSON()).toEqual({
        email: "JohnDoe@domain.tld",
      });
      expect(await forgotPasswordRequest.headerValue("x-xsrf-token")).toBe(
        "test-csrf",
      );

      await expectToastAndClose(page, "Success!");
    });

    test("shows success message and redirects to home page", async ({
      page,
    }) => {
      await page.route("**/api/v1/password/email", (route) =>
        route.fulfill({ json: { message: "Success!" } }),
      );

      await page.locator("#email").fill("JohnDoe@domain.tld");
      await page.getByTestId("send-reset-link-button").click();

      await expectToastAndClose(page, "Success!");
      await expect(page).not.toHaveURL(/forgot_password/);
      await expect(page.locator("h1")).toContainText("home.title");
    });

    test("shows validation error on 422", async ({ page }) => {
      await page.route("**/api/v1/password/email", (route) =>
        route.fulfill({
          status: 422,
          json: {
            message: "The email field is required",
            errors: { email: ["The email field is required."] },
          },
        }),
      );

      await page.locator("#email").fill("JohnDoe@domain.tld");
      await page.getByTestId("send-reset-link-button").click();

      await expect(page.getByTestId("email-field")).toContainText(
        "The email field is required.",
      );
      await expectToastAndClose(page, "The email field is required");
    });

    test("shows server error on 500 and clears previous validation error", async ({
      page,
    }) => {
      let status = 422;
      await page.route("**/api/v1/password/email", (route) =>
        route.fulfill(
          status === 422
            ? {
                status,
                json: {
                  message: "The email field is required",
                  errors: { email: ["The email field is required."] },
                },
              }
            : { status, json: { message: "Test" } },
        ),
      );

      await page.locator("#email").fill("JohnDoe@domain.tld");
      await page.getByTestId("send-reset-link-button").click();
      await expect(page.getByTestId("email-field")).toContainText(
        "The email field is required.",
      );
      await expectToastAndClose(page, "The email field is required");

      status = 500;
      await page.getByTestId("send-reset-link-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("email-field")).toBeVisible();
      await expect(page.getByTestId("email-field")).not.toContainText(
        "The email field is required.",
      );
    });
  });
});
