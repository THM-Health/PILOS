import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  holdApiRequest,
  validationErrors,
  serverError,
  errorResponse,
} from "../support/utils.js";

test.use({ authenticated: true });

test.beforeEach(async ({ configResponse }) => {
  configResponse.data.auth.local = true;
});

test("redirect to 404 with local auth disabled", async ({
  page,
  configResponse,
}) => {
  configResponse.data.auth.local = false;

  await page.goto("/verify_email");

  await expect(page).toHaveURL(/\/404/);
  await expect(page).not.toHaveURL(/\/verify_email/);
});

test("redirect to login if not logged in", async ({ page }) => {
  await testVisitWithoutCurrentUser(page, "/verify_email");
});

test.describe("verify email", () => {
  test("shows loading state and sends email and token", async ({ page }) => {
    const release = await holdApiRequest(page, "email/verify");
    const requestPromise = page.waitForRequest("**/api/v1/email/verify");

    await page.goto("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    await expect(page.getByText("app.verify_email.title")).toBeVisible();
    await expect(page.getByTestId("overlay")).toBeVisible();

    release();

    const request = await requestPromise;
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      email: "MaxDoe@domain.tld",
      token: "Token123",
    });

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expect(page.getByTestId("verify-success-message")).toBeVisible();
  });

  test("shows success message", async ({ page }) => {
    await page.route("**/api/v1/email/verify", (route) =>
      route.fulfill({ status: 200 }),
    );

    await page.goto("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    await expect(page.getByTestId("verify-success-message")).toContainText(
      "app.verify_email.success",
    );
    await expect(page.getByTestId("overlay")).toBeHidden();
    await expect(page.getByTestId("verify-invalid-message")).toBeHidden();
    await expect(page.getByTestId("verify-error-message")).toBeHidden();
  });
});

test.describe("verify email errors", () => {
  test("shows invalid message on 422 with missing props", async ({ page }) => {
    await page.route("**/api/v1/email/verify", (route) =>
      route.fulfill(
        validationErrors(
          {
            email: ["The email field is required."],
            token: ["The token field is required."],
          },
          "The email field is required. (and 1 more error)",
        ),
      ),
    );

    await page.goto("/verify_email");

    await expect(page.getByTestId("verify-invalid-message")).toContainText(
      "app.verify_email.invalid",
    );
    await expect(page.getByTestId("verify-success-message")).toBeHidden();
    await expect(page.getByTestId("verify-error-message")).toBeHidden();
  });

  test("shows invalid message on 422 with invalid token", async ({ page }) => {
    await page.route("**/api/v1/email/verify", (route) =>
      route.fulfill({ status: 422 }),
    );

    await page.goto("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    await expect(page.getByTestId("verify-invalid-message")).toContainText(
      "app.verify_email.invalid",
    );
    await expect(page.getByTestId("verify-success-message")).toBeHidden();
    await expect(page.getByTestId("verify-error-message")).toBeHidden();
  });

  test("shows error message and toast on server error", async ({ page }) => {
    await page.route("**/api/v1/email/verify", (route) =>
      route.fulfill(serverError()),
    );

    await page.goto("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    await expectToastAndClose(page, [
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
    await expect(page.getByTestId("verify-error-message")).toContainText(
      "app.verify_email.fail",
    );
    await expect(page.getByTestId("verify-success-message")).toBeHidden();
    await expect(page.getByTestId("verify-invalid-message")).toBeHidden();
  });

  test("shows error message and toast on too many requests", async ({
    page,
  }) => {
    await page.route("**/api/v1/email/verify", (route) =>
      route.fulfill(errorResponse(429, "Too many requests")),
    );

    await page.goto("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    await expectToastAndClose(page, "app.flash.too_many_requests");
    await expect(page.getByTestId("verify-error-message")).toContainText(
      "app.verify_email.fail",
    );
    await expect(page.getByTestId("verify-success-message")).toBeHidden();
    await expect(page.getByTestId("verify-invalid-message")).toBeHidden();
  });

  test("redirects to login on unauthenticated", async ({ page }) => {
    await page.route("**/api/v1/email/verify", (route) =>
      route.fulfill({ status: 401 }),
    );

    await page.goto("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    await expectLoginRedirect(page, "/verify_email");
  });
});
