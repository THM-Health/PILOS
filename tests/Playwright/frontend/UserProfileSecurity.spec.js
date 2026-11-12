import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { interceptUserProfileRequests } from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const USER_URL = "**/api/v1/users/1";
const PASSWORD_URL = "**/api/v1/users/1/password";
const SESSIONS_URL = "**/api/v1/sessions";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const tabButtons = [
  "base-tab-button",
  "email-tab-button",
  "security-tab-button",
  "others-tab-button",
];

async function expectBothSessions(page) {
  const sessions = page.getByTestId("session-panel");
  await expect(sessions).toHaveCount(2);

  await expect(sessions.nth(0)).toBeVisible();
  await expect(sessions.nth(0)).toContainText("Windows");
  await expect(sessions.nth(0)).toContainText("auth.sessions.current");
  await expect(sessions.nth(0)).toContainText("auth.sessions.browser Chrome");
  await expect(sessions.nth(0)).toContainText("auth.sessions.ip 10.9.1.2");

  await expect(sessions.nth(1)).toBeVisible();
  await expect(sessions.nth(1)).toContainText("iOS");
  await expect(sessions.nth(1)).toContainText("01/23/2022, 16:55");
  await expect(sessions.nth(1)).toContainText(
    "auth.sessions.browser Mobile Safari",
  );
  await expect(sessions.nth(1)).toContainText("auth.sessions.ip 10.9.1.5");
}

async function expectOnlyCurrentSession(page) {
  const sessions = page.getByTestId("session-panel");
  await expect(sessions).toHaveCount(1);
  await expect(sessions.nth(0)).toBeVisible();
  await expect(sessions.nth(0)).toContainText("Windows");
  await expect(sessions.nth(0)).toContainText("auth.sessions.current");
  await expect(sessions.nth(0)).toContainText("auth.sessions.browser Chrome");
  await expect(sessions.nth(0)).toContainText("auth.sessions.ip 10.9.1.2");
}

async function expectRolesDisabled(page) {
  await expect(
    page.getByText("admin.users.roles_and_permissions"),
  ).toBeVisible();
  const roles = page.getByTestId("roles-field");
  await expect(roles).toBeVisible();
  await expect(roles).toContainText("app.roles");
  const dropdown = roles.getByTestId("role-dropdown");
  await expect(dropdown).toContainText("Superuser");
  await expect(dropdown).toContainText("User");
  await expect(dropdown).toHaveClass(/multiselect--disabled/);
}

async function expectNoPasswordFields(page) {
  await expect(page.getByTestId("logout-all-sessions-button")).toBeVisible();
  await expect(
    page.getByTestId("security-tab-current-password-field"),
  ).toHaveCount(0);
  await expect(page.getByTestId("new-password-field")).toHaveCount(0);
  await expect(page.getByTestId("new-password-confirmation-field")).toHaveCount(
    0,
  );
  await expect(page.getByTestId("change-password-save-button")).toHaveCount(0);
}

async function fillPasswords(page) {
  await page.locator("#current_password").fill("secretPassword123#");
  await page.locator("#new_password").fill("newSecretPassword123#");
  await page
    .locator("#new_password_confirmation")
    .fill("newSecretPassword123#");
}

async function expectEverythingDisabled(page) {
  for (const tabButton of tabButtons) {
    await expect(page.getByTestId(tabButton)).toBeDisabled();
  }
  await expect(page.locator("#current_password")).toBeDisabled();
  await expect(page.locator("#new_password")).toBeDisabled();
  await expect(page.locator("#new_password_confirmation")).toBeDisabled();
  await expect(page.getByTestId("change-password-save-button")).toBeDisabled();
  await expect(page.getByTestId("logout-all-sessions-button")).toBeDisabled();
}

test.use({ authenticated: true });

test.describe("User profile security", () => {
  test.beforeEach(async ({ page }) => {
    await interceptUserProfileRequests(page);
  });

  test("selecting the tab sets the hash", async ({ page }) => {
    await page.goto("/profile");
    await page.getByTestId("security-tab-button").click();

    await expect(page).toHaveURL(/\/profile#tab=security/);
    await expect(
      page.getByText("admin.users.roles_and_permissions"),
    ).toBeVisible();
  });

  test.describe("with password change allowed", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile#tab=security");
      await expect(page.getByTestId("roles-field")).toBeVisible();
    });

    test("roles are shown in a disabled select", async ({ page }) => {
      await expectRolesDisabled(page);
    });

    test("password fields are shown empty", async ({ page }) => {
      const current = page.getByTestId("security-tab-current-password-field");
      await expect(current).toBeVisible();
      await expect(current).toContainText("auth.current_password");
      await expect(current.locator("#current_password")).toHaveValue("");

      const newPassword = page.getByTestId("new-password-field");
      await expect(newPassword).toBeVisible();
      await expect(newPassword).toContainText("auth.new_password");
      await expect(newPassword.locator("#new_password")).toHaveValue("");

      const confirmation = page.getByTestId("new-password-confirmation-field");
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toContainText(
        "auth.new_password_confirmation",
      );
      await expect(
        confirmation.locator("#new_password_confirmation"),
      ).toHaveValue("");

      await expect(page.getByTestId("change-password-save-button")).toHaveText(
        "auth.change_password",
      );
    });

    test("all sessions are shown", async ({ page }) => {
      await expectBothSessions(page);
      await expect(page.getByTestId("logout-all-sessions-button")).toHaveText(
        "auth.sessions.logout_all",
      );
    });

    test.describe("change password", () => {
      test.beforeEach(async ({ page }) => {
        await fillPasswords(page);
      });

      test("loading state while saving", async ({ page }) => {
        const save = await mockMethod(page, "PUT", PASSWORD_URL, {
          json: readFixture("userDataCurrentUser.json"),
          hold: true,
        });

        await page.getByTestId("change-password-save-button").click();
        await nthRequest(save);

        await expectEverythingDisabled(page);
        save.release();
        await expectToastAndClose(page, "auth.flash.password_changed");
      });

      test("sends the passwords", async ({ page }) => {
        const save = await mockMethod(page, "PUT", PASSWORD_URL, {
          json: readFixture("userDataCurrentUser.json"),
        });

        await page.getByTestId("change-password-save-button").click();

        const request = await nthRequest(save);
        expect(request.postDataJSON()).toEqual({
          new_password: "newSecretPassword123#",
          new_password_confirmation: "newSecretPassword123#",
          current_password: "secretPassword123#",
        });
        await expectToastAndClose(page, "auth.flash.password_changed");
      });

      test("fields are reset and enabled after saving", async ({ page }) => {
        await mockMethod(page, "PUT", PASSWORD_URL, {
          json: readFixture("userDataCurrentUser.json"),
        });

        await page.getByTestId("change-password-save-button").click();

        await expectToastAndClose(page, "auth.flash.password_changed");
        await expect(page.locator("#current_password")).toHaveValue("");
        await expect(page.locator("#current_password")).toBeEnabled();
        await expect(page.locator("#new_password")).toHaveValue("");
        await expect(page.locator("#new_password")).toBeEnabled();
        await expect(page.locator("#new_password_confirmation")).toHaveValue(
          "",
        );
        await expect(page.locator("#new_password_confirmation")).toBeEnabled();
        await expectBothSessions(page);
      });

      test("422 errors are shown at the fields", async ({ page }) => {
        await mockMethod(page, "PUT", PASSWORD_URL, {
          status: 422,
          json: {
            message:
              "The Current password field is required. (and 2 more errors)",
            errors: {
              current_password: ["The Current password field is required."],
              new_password: ["The New password field is required."],
              new_password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
          },
        });

        await page.getByTestId("change-password-save-button").click();

        await expectToastAndClose(
          page,
          "The Current password field is required. (and 2 more errors)",
        );
        await expect(
          page.getByTestId("security-tab-current-password-field"),
        ).toContainText("The Current password field is required.");
        await expect(page.getByTestId("new-password-field")).toContainText(
          "The New password field is required.",
        );
        await expect(
          page.getByTestId("new-password-confirmation-field"),
        ).toContainText("The New password confirmation field is required.");
      });

      test("server error hides previous 422 errors and shows a toast", async ({
        page,
      }) => {
        await mockMethod(page, "PUT", PASSWORD_URL, {
          status: 422,
          json: {
            message: "The Current password field is required.",
            errors: {
              current_password: ["The Current password field is required."],
              new_password: ["The New password field is required."],
              new_password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
          },
        });
        await page.getByTestId("change-password-save-button").click();
        await expectToastAndClose(
          page,
          "The Current password field is required.",
        );
        await expect(
          page.getByTestId("security-tab-current-password-field"),
        ).toContainText("The Current password field is required.");

        await mockMethod(page, "PUT", PASSWORD_URL, {
          status: 500,
          json: { message: "Test" },
        });
        await expect(page.locator("#current_password")).toHaveValue("");
        await fillPasswords(page);
        await page.getByTestId("change-password-save-button").click();

        await expectToastAndClose(page, serverErrorToast);
        await expect(
          page.getByTestId("security-tab-current-password-field"),
        ).not.toContainText("The Current password field is required.");
        await expect(page.getByTestId("new-password-field")).not.toContainText(
          "The New password field is required.",
        );
        await expect(
          page.getByTestId("new-password-confirmation-field"),
        ).not.toContainText("The New password confirmation field is required.");
      });

      test("401 redirects to the login", async ({ page }) => {
        await mockMethod(page, "PUT", PASSWORD_URL, { status: 401 });

        await page.getByTestId("change-password-save-button").click();

        await expectLoginRedirect(page, "/profile");
      });
    });

    test.describe("logout all other sessions", () => {
      test("loading state while logging out", async ({ page }) => {
        const logout = await mockMethod(page, "DELETE", SESSIONS_URL, {
          status: 204,
          hold: true,
        });
        const sessions = readFixture("sessions.json");
        sessions.data = sessions.data.slice(0, 1);
        await mockMethod(page, "GET", SESSIONS_URL, { json: sessions });

        await page.getByTestId("logout-all-sessions-button").click();
        await nthRequest(logout);

        await expectEverythingDisabled(page);
        logout.release();
        await expectToastAndClose(page, "auth.flash.logout_all_others");
      });

      test("only the current session remains", async ({ page }) => {
        const logout = await mockMethod(page, "DELETE", SESSIONS_URL, {
          status: 204,
        });
        const sessions = readFixture("sessions.json");
        sessions.data = sessions.data.slice(0, 1);
        const reload = await mockMethod(page, "GET", SESSIONS_URL, {
          json: sessions,
        });

        await page.getByTestId("logout-all-sessions-button").click();
        await nthRequest(logout);
        await nthRequest(reload);

        await expectToastAndClose(page, "auth.flash.logout_all_others");
        await expectOnlyCurrentSession(page);
      });

      test("server error shows a toast", async ({ page }) => {
        await mockMethod(page, "DELETE", SESSIONS_URL, {
          status: 500,
          json: { message: "Test" },
        });

        await page.getByTestId("logout-all-sessions-button").click();

        await expectToastAndClose(page, serverErrorToast);
      });

      test("401 redirects to the login", async ({ page }) => {
        await mockMethod(page, "DELETE", SESSIONS_URL, { status: 401 });

        await page.getByTestId("logout-all-sessions-button").click();

        await expectLoginRedirect(page, "/profile");
      });
    });
  });

  test("view without password change allowed", async ({ page, config }) => {
    config.data.user.password_change_allowed = false;

    await page.goto("/profile#tab=security");

    await expectRolesDisabled(page);
    await expectNoPasswordFields(page);
    await expectBothSessions(page);
    await expect(page.getByTestId("logout-all-sessions-button")).toHaveText(
      "auth.sessions.logout_all",
    );
    await expect(page.getByTestId("logout-all-sessions-button")).toBeEnabled();
  });

  test("view as external user", async ({ page }) => {
    const user = readFixture("userDataCurrentUser.json");
    user.data.authenticator = "ldap";
    user.data.external_id = "jdo";
    await mockMethod(page, "GET", USER_URL, { json: user });

    await page.goto("/profile#tab=security");

    await expectRolesDisabled(page);
    await expectNoPasswordFields(page);
    await expectBothSessions(page);
    await expect(page.getByTestId("logout-all-sessions-button")).toHaveText(
      "auth.sessions.logout_all",
    );
    await expect(page.getByTestId("logout-all-sessions-button")).toBeEnabled();
  });

  test.describe("load sessions error", () => {
    test("loading shows the overlay without sessions", async ({ page }) => {
      const sessions = await mockMethod(page, "GET", SESSIONS_URL, {
        status: 500,
        json: { message: "Test" },
        hold: true,
      });

      await page.goto("/profile#tab=security");
      await nthRequest(sessions);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("session-panel")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);

      sessions.release();
      await expectToastAndClose(page, serverErrorToast);
    });

    test("error shows the overlay with retry button", async ({ page }) => {
      await mockMethod(page, "GET", SESSIONS_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/profile#tab=security");

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("session-panel")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveText(
        "app.reload",
      );
    });

    test("retry loads the sessions", async ({ page }) => {
      await mockMethod(page, "GET", SESSIONS_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/profile#tab=security");
      await expectToastAndClose(page, serverErrorToast);

      const retry = await mockMethod(page, "GET", SESSIONS_URL, {
        json: readFixture("sessions.json"),
      });
      await page.getByTestId("loading-retry-button").click();
      await nthRequest(retry);

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectBothSessions(page);
    });
  });
});
