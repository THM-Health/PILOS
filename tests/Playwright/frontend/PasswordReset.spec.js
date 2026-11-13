import { test } from "../support/fixtures/authGeneral.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  holdApiRequest,
  validationErrors,
  serverError,
  errorResponse,
} from "../support/utils.js";

test.describe("Password reset", () => {
  test.beforeEach(async ({ configResponse }) => {
    configResponse.data.auth.local = true;
  });

  test("redirects to 404 if local auth is disabled", async ({
    page,
    configResponse,
  }) => {
    configResponse.data.auth.local = false;

    await page.goto("/reset_password");

    await expect(page).toHaveURL(/\/404/);
    await expect(page).not.toHaveURL(/forgot_password/);
  });

  test.describe("logged in user", () => {
    test.use({ authenticated: true });

    test("shows error and redirects to home page", async ({ page }) => {
      await interceptRoomIndexRequests(page);

      await page.goto("/reset_password");

      await expectToastAndClose(page, "app.flash.guests_only");

      await expect(page).not.toHaveURL(/reset_password/);
      await expect(page.locator("h1")).toContainText("home.title");
    });
  });

  test.describe("existing user", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        "/reset_password?email=johndoe@domain.tld&token=Token123",
      );
    });

    test("shows the form for an existing user", async ({ page }) => {
      await expect(page.getByText("auth.input_new_password")).toBeVisible();
      await expect(
        page.getByText("auth.input_new_password_new_user"),
      ).toBeHidden();

      const newPassword = page.getByTestId("new-password-field");
      await expect(newPassword).toContainText("auth.new_password");
      await expect(newPassword.locator("#new_password")).toBeVisible();

      const confirmation = page.getByTestId("password-confirmation-field");
      await expect(confirmation).toContainText(
        "auth.new_password_confirmation",
      );
      await expect(
        confirmation.locator("#password_confirmation"),
      ).toBeVisible();

      await expect(page.getByTestId("reset-password-button")).toHaveText(
        "auth.change_password",
      );
    });

    test.describe("submit", () => {
      let releaseReset;

      test.beforeEach(async ({ page, currentUserResponse }) => {
        // The initial current user request must be finished before the user is mocked as logged in
        await expect(page.locator("#new_password")).toBeVisible();
        await page.route("**/api/v1/currentUser", (route) =>
          route.fulfill({ json: currentUserResponse }),
        );
        await interceptRoomIndexRequests(page);

        releaseReset = await holdApiRequest(page, "password/reset", {
          status: 200,
          json: { message: "Success!" },
        });

        await page.locator("#new_password").fill("secretPassword123#");
        await page.locator("#password_confirmation").fill("secretPassword123#");
      });

      test("shows loading state while the request is pending", async ({
        page,
      }) => {
        await page.getByTestId("reset-password-button").click();

        await expect(page.locator("#new_password")).toBeDisabled();
        await expect(page.locator("#password_confirmation")).toBeDisabled();
        await expect(page.getByTestId("reset-password-button")).toBeDisabled();

        releaseReset();
        await expectToastAndClose(page, "Success!");
      });

      test("sends data and csrf token", async ({ page }) => {
        const resetRequest = page.waitForRequest("**/api/v1/password/reset");
        await page.getByTestId("reset-password-button").click();
        releaseReset();

        const request = await resetRequest;
        expect(request.postDataJSON()).toEqual({
          email: "johndoe@domain.tld",
          password: "secretPassword123#",
          password_confirmation: "secretPassword123#",
          token: "Token123",
        });
        expect(await request.headerValue("x-xsrf-token")).toBe("test-csrf");

        await expectToastAndClose(page, "Success!");
      });

      test("shows success and redirects to home page", async ({ page }) => {
        const currentUserRequest = page.waitForRequest("**/api/v1/currentUser");
        await page.getByTestId("reset-password-button").click();
        releaseReset();
        await currentUserRequest;

        await expectToastAndClose(page, "Success!");

        await expect(page).not.toHaveURL(/reset_password/);
        await expect(page.locator("h1")).toContainText("home.title");
      });
    });
  });

  test("shows the form for a new user", async ({ page }) => {
    await page.goto(
      "/reset_password?email=johndoe@domain.tld&token=Token123&welcome=true",
    );

    await expect(
      page.getByText("auth.input_new_password_new_user"),
    ).toBeVisible();
    await expect(page.getByTestId("reset-password-button")).toHaveText(
      "auth.set_password",
    );
  });

  test.describe("errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/reset_password");
      await page.locator("#new_password").fill("secretPassword123");
      await page
        .locator("#password_confirmation")
        .fill("newSecretPassword123#");
    });

    test("shows 422 field errors and toast", async ({ page }) => {
      await page.route("**/api/v1/password/reset", (route) =>
        route.fulfill(
          validationErrors(
            {
              password: ["The New password field is required."],
              password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
            "The New password field is required. (and 1 more error)",
          ),
        ),
      );

      await page.getByTestId("reset-password-button").click();

      await expect(page.getByTestId("new-password-field")).toContainText(
        "The New password field is required.",
      );
      await expect(
        page.getByTestId("password-confirmation-field"),
      ).toContainText("The New password confirmation field is required.");
      await expectToastAndClose(
        page,
        "The New password field is required. (and 1 more error)",
      );
    });

    test("replaces previous 422 errors with new ones", async ({ page }) => {
      await page.route("**/api/v1/password/reset", (route) =>
        route.fulfill(
          validationErrors(
            {
              password: ["The New password field is required."],
              password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
            "The New password field is required. (and 1 more error)",
          ),
        ),
      );
      await page.getByTestId("reset-password-button").click();
      await expectToastAndClose(
        page,
        "The New password field is required. (and 1 more error)",
      );

      await page.route("**/api/v1/password/reset", (route) =>
        route.fulfill(
          validationErrors(
            {
              email: ["The Email field is required."],
              token: ["The Token field is required."],
            },
            "The Email field is required. (and 1 more error)",
          ),
        ),
      );
      await page.locator("#new_password").fill("newSecretPassword123#");
      await page.getByTestId("reset-password-button").click();

      await expect(
        page.getByText("The Email field is required.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("The Token field is required.", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("new-password-field")).not.toContainText(
        "The New password field is required.",
      );
      await expect(
        page.getByTestId("password-confirmation-field"),
      ).not.toContainText("The New password confirmation field is required.");
      await expectToastAndClose(
        page,
        "The Email field is required. (and 1 more error)",
      );
    });

    test("hides 422 errors after a 500 error", async ({ page }) => {
      await page.route("**/api/v1/password/reset", (route) =>
        route.fulfill(
          validationErrors(
            {
              email: ["The Email field is required."],
              token: ["The Token field is required."],
            },
            "The Email field is required. (and 1 more error)",
          ),
        ),
      );
      await page.getByTestId("reset-password-button").click();
      await expect(
        page.getByText("The Email field is required.", { exact: true }),
      ).toBeVisible();
      await expectToastAndClose(
        page,
        "The Email field is required. (and 1 more error)",
      );

      await page.route("**/api/v1/password/reset", (route) =>
        route.fulfill(serverError()),
      );
      await page.getByTestId("reset-password-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(
        page.getByText("The Email field is required.", { exact: true }),
      ).toBeHidden();
      await expect(
        page.getByText("The Token field is required.", { exact: true }),
      ).toBeHidden();
    });

    test("shows too many requests error", async ({ page }) => {
      await page.route("**/api/v1/password/reset", (route) =>
        route.fulfill(errorResponse(429, "Too many requests")),
      );

      await page.getByTestId("reset-password-button").click();

      await expectToastAndClose(page, "app.flash.too_many_requests");
    });
  });
});
