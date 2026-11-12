import { test } from "../support/fixtures/userProfile.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("User profile email", () => {
  test("selecting the tab sets the hash", async ({ page }) => {
    await page.goto("/profile");
    await page.getByTestId("email-tab-button").click();

    await expect(page).toHaveURL(/\/profile#tab=email/);
    await expect(page.getByText("admin.users.email")).toBeVisible();
  });

  test.describe("with permission to update own attributes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile#tab=email");
      await expect(page.getByTestId("email-field")).toBeVisible();
    });

    test("fields are shown", async ({ page }) => {
      const password = page.getByTestId("email-tab-current-password-field");
      await expect(password).toBeVisible();
      await expect(password).toContainText("auth.current_password");
      await expect(password.locator("#current_password")).toHaveValue("");

      const email = page.getByTestId("email-field");
      await expect(email).toContainText("app.email");
      await expect(email.locator("#email")).toHaveValue("JohnDoe@domain.tld");
    });

    test("fields are disabled while saving", async ({ page }) => {
      const mock = await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
        status: 202,
        hold: true,
      });

      await page.locator("#current_password").fill("secretPassword123#");
      await page.locator("#email").fill("john.doe@example.com");

      const saveButton = page.getByTestId("user-tab-email-save-button");
      await expect(saveButton).toHaveText("auth.change_email");
      await saveButton.click();

      await expect(page.locator("#current_password")).toBeDisabled();
      await expect(page.locator("#email")).toBeDisabled();

      mock.release();
      await expect(page.locator("#email")).toBeEnabled();
    });

    test("save changes sends the new email and resets the fields", async ({
      page,
    }) => {
      const mock = await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
        status: 202,
      });

      await page.locator("#current_password").fill("secretPassword123#");
      await page.locator("#email").fill("john.doe@example.com");
      await page.getByTestId("user-tab-email-save-button").click();

      const request = await nthRequest(mock);
      expect(request.postDataJSON()).toEqual({
        email: "john.doe@example.com",
        current_password: "secretPassword123#",
      });

      await expect(page.locator("#current_password")).toHaveValue("");
      await expect(page.locator("#current_password")).toBeEnabled();
      await expect(page.locator("#email")).toHaveValue("JohnDoe@domain.tld");
      await expect(page.locator("#email")).toBeEnabled();

      await expect(
        page.getByTestId("email-confirmation-message"),
      ).toContainText(
        'auth.send_email_confirm_mail_{"email":"john.doe@example.com"}',
      );
    });

    test("confirmation message is hidden if the server already changed the email", async ({
      page,
      profileUser,
    }) => {
      await mockMethod(page, "PUT", "**/api/v1/users/1/email", { status: 202 });

      await page.locator("#current_password").fill("secretPassword123#");
      await page.locator("#email").fill("john.doe@example.com");
      await page.getByTestId("user-tab-email-save-button").click();
      await expect(
        page.getByTestId("email-confirmation-message"),
      ).toBeVisible();

      const user = structuredClone(profileUser);
      user.data.email = "john.doe@example.com";
      await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
        status: 200,
        json: { data: user.data },
      });

      await page.locator("#current_password").fill("secretPassword123#");
      await page.locator("#email").fill("john.doe@example.com");
      await page.getByTestId("user-tab-email-save-button").click();

      await expect(page.getByTestId("email-confirmation-message")).toBeHidden();
      await expect(page.locator("#current_password")).toHaveValue("");
      await expect(page.locator("#current_password")).toBeEnabled();
      await expect(page.locator("#email")).toHaveValue("john.doe@example.com");
      await expect(page.locator("#email")).toBeEnabled();
    });

    test.describe("save changes errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.locator("#current_password").fill("secretPassword123#");
      });

      test("throttle error (471)", async ({ page }) => {
        await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
          status: 471,
        });
        await page.getByTestId("user-tab-email-save-button").click();

        await expectToastAndClose(page, "auth.throttle_email");
      });

      test("validation error (422)", async ({ page }) => {
        await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
          status: 422,
          json: {
            message: "The email field is required. (and 1 more error)",
            errors: {
              email: ["The email field is required."],
              current_password: ["The current password is incorrect."],
            },
          },
        });
        await page.getByTestId("user-tab-email-save-button").click();

        await expectToastAndClose(
          page,
          "The email field is required. (and 1 more error)",
        );
        await expect(
          page.getByTestId("email-tab-current-password-field"),
        ).toContainText("The current password is incorrect.");
        await expect(page.getByTestId("email-field")).toContainText(
          "The email field is required.",
        );
      });

      test("server error (500) hides previous validation errors", async ({
        page,
      }) => {
        await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
          status: 422,
          json: {
            message: "The email field is required. (and 1 more error)",
            errors: {
              email: ["The email field is required."],
              current_password: ["The current password is incorrect."],
            },
          },
        });
        await page.getByTestId("user-tab-email-save-button").click();
        await expectToastAndClose(
          page,
          "The email field is required. (and 1 more error)",
        );
        await expect(page.getByTestId("email-field")).toContainText(
          "The email field is required.",
        );

        await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
          status: 500,
          json: { message: "Test" },
        });
        await page.locator("#current_password").fill("secretPassword123#");
        await page.getByTestId("user-tab-email-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(
          page.getByTestId("email-tab-current-password-field"),
        ).not.toContainText("The current password is incorrect.");
        await expect(page.getByTestId("email-field")).not.toContainText(
          "The email field is required.",
        );
      });

      test("unauthenticated (401) redirects to login", async ({ page }) => {
        await mockMethod(page, "PUT", "**/api/v1/users/1/email", {
          status: 401,
        });
        await page.getByTestId("user-tab-email-save-button").click();

        await expectLoginRedirect(page, "/profile");
      });
    });
  });

  test.describe("email cannot be changed", () => {
    test.afterEach(async ({ page }) => {
      await expect(page.locator("#email")).toBeDisabled();
      await expect(page.locator("#email")).toHaveValue("JohnDoe@domain.tld");
      await expect(
        page.getByTestId("email-tab-current-password-field"),
      ).toHaveCount(0);
      await expect(page.getByTestId("user-tab-email-save-button")).toHaveCount(
        0,
      );
    });

    test("without users.updateOwnAttributes permission", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.permissions = [];

      await page.goto("/profile#tab=email");
      await expect(page.locator("#email")).toBeVisible();
    });

    test("as external user", async ({ page, profileUser }) => {
      profileUser.data.authenticator = "ldap";
      profileUser.data.external_id = "jdo";

      await page.goto("/profile#tab=email");
      await expect(page.locator("#email")).toBeVisible();
    });
  });
});
