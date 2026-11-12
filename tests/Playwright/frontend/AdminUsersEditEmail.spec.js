import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptAdminUsersViewRequests,
  interceptAdminUsersIndexRequests,
} from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const USER_URL = "**/api/v1/users/2";
const EMAIL_URL = "**/api/v1/users/2/email";
const EDIT_URL = "/admin/users/2/edit#tab=email";

test.use({ authenticated: true });

test.describe("Admin users edit email", () => {
  test.beforeEach(async ({ page, currentUser, config }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "users.delete",
      "roles.viewAny",
    ];
    config.data.auth.local = true;
    await interceptAdminUsersViewRequests(page);
  });

  test.describe("view", () => {
    test("opening the email tab sets the hash and shows the email field", async ({
      page,
    }) => {
      await page.goto("/admin/users/2/edit");
      await page.getByTestId("email-tab-button").click();

      await expect(page.getByText("admin.users.email")).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=email/);
      await expect(
        page.getByTestId("email-tab-current-password-field"),
      ).toHaveCount(0);

      const emailField = page.getByTestId("email-field");
      await expect(emailField).toBeVisible();
      await expect(emailField).toContainText("app.email");
      await expect(emailField.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await expect(emailField.locator("#email")).toBeEnabled();
    });

    test("external user cannot change the email", async ({ page }) => {
      const user = readFixture("userDataUser.json");
      user.data.authenticator = "ldap";
      user.data.external_id = "lwr";
      await mockMethod(page, "GET", USER_URL, { json: user });

      await page.goto(EDIT_URL);

      await expect(page.locator("#email")).toBeDisabled();
      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await expect(
        page.getByTestId("email-tab-current-password-field"),
      ).toHaveCount(0);
      await expect(page.getByTestId("user-tab-email-save-button")).toHaveCount(
        0,
      );
    });
  });

  test.describe("save changes", () => {
    let user;

    test.beforeEach(async ({ page }) => {
      user = readFixture("userDataUser.json");
      user.data.email = "laura.rivera@example.com";

      await page.goto(EDIT_URL);
      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await page.locator("#email").fill("laura.rivera@example.com");
    });

    test("sends the new email and redirects to the user view", async ({
      page,
    }) => {
      const save = await mockMethod(page, "PUT", EMAIL_URL, { json: user });
      const userRequest = await mockMethod(page, "GET", USER_URL, {
        json: user,
      });

      await expect(page.getByTestId("user-tab-email-save-button")).toHaveText(
        "auth.change_email",
      );
      await page.getByTestId("user-tab-email-save-button").click();

      expect((await nthRequest(save)).postDataJSON()).toEqual({
        email: "laura.rivera@example.com",
      });

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=email/);
      await expect(page).not.toHaveURL(/\/edit/);
      await nthRequest(userRequest);
    });

    test("disables tabs, header buttons and fields while saving", async ({
      page,
    }) => {
      const save = await mockMethod(page, "PUT", EMAIL_URL, {
        json: user,
        hold: true,
      });
      await mockMethod(page, "GET", USER_URL, { json: user });

      await page.getByTestId("user-tab-email-save-button").click();

      await expect(page.getByTestId("base-tab-button")).toBeDisabled();
      await expect(page.getByTestId("email-tab-button")).toBeDisabled();
      await expect(page.getByTestId("security-tab-button")).toBeDisabled();
      await expect(page.getByTestId("others-tab-button")).toBeDisabled();

      await expect(page.getByTestId("users-cancel-edit-button")).toBeVisible();
      await expect(page.getByTestId("users-cancel-edit-button")).toBeDisabled();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("users-delete-button")).toBeVisible();
      await expect(page.getByTestId("users-delete-button")).toBeDisabled();

      await expect(page.locator("#current_password")).toHaveCount(0);
      await expect(page.locator("#email")).toBeDisabled();

      save.release();

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=email/);
      await expect(page).not.toHaveURL(/\/edit/);
    });
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(EDIT_URL);
      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
    });

    test("422 error shows the messages at the field", async ({ page }) => {
      const save = await mockMethod(page, "PUT", EMAIL_URL, {
        status: 422,
        json: {
          message: "The email field is required",
          errors: { email: ["The email field is required."] },
        },
      });
      await page.getByTestId("user-tab-email-save-button").click();
      await nthRequest(save);

      await expectToastAndClose(page, "The email field is required");
      await expect(page.getByTestId("email-field")).toContainText(
        "The email field is required.",
      );
    });

    test("500 error shows a toast and hides previous field errors", async ({
      page,
    }) => {
      const validationError = await mockMethod(page, "PUT", EMAIL_URL, {
        status: 422,
        json: {
          message: "The email field is required",
          errors: { email: ["The email field is required."] },
        },
      });
      await page.getByTestId("user-tab-email-save-button").click();
      await nthRequest(validationError);
      await expectToastAndClose(page, "The email field is required");
      await expect(page.getByTestId("email-field")).toContainText(
        "The email field is required.",
      );

      const serverError = await mockMethod(page, "PUT", EMAIL_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("user-tab-email-save-button").click();
      await nthRequest(serverError);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("email-field")).not.toContainText(
        "The email field is required.",
      );
    });

    test("404 error redirects to users index", async ({ page }) => {
      await interceptAdminUsersIndexRequests(page);
      const save = await mockMethod(page, "PUT", EMAIL_URL, {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });
      const usersRequest = page.waitForRequest(/\/api\/v1\/users\?/);
      await page.getByTestId("user-tab-email-save-button").click();
      await nthRequest(save);

      await expect(page).not.toHaveURL(/\/admin\/users\/2\/edit/);
      await expect(page).toHaveURL(/\/admin\/users/);
      await usersRequest;
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("401 error redirects to login", async ({ page }) => {
      const save = await mockMethod(page, "PUT", EMAIL_URL, { status: 401 });
      await page.getByTestId("user-tab-email-save-button").click();
      await nthRequest(save);

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });
});
