import { mergeTests } from "@playwright/test";
import { test as userProfileTest } from "../support/fixtures/userProfile.js";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { test as sessionControllerTest } from "../support/fixtures/sessionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockApiRequest,
  validationErrors,
  serverError,
} from "../support/utils.js";

const test = mergeTests(
  userProfileTest,
  userControllerTest,
  timezonesTest,
  sessionControllerTest,
);

test.use({ authenticated: true });

test.describe("User profile security", () => {
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
      const sessions = page.getByTestId("session-panel");
      await expect(sessions).toHaveCount(2);

      await expect(sessions.nth(0)).toBeVisible();
      await expect(sessions.nth(0)).toContainText("Windows");
      await expect(sessions.nth(0)).toContainText("auth.sessions.current");
      await expect(sessions.nth(0)).toContainText(
        "auth.sessions.browser Chrome",
      );
      await expect(sessions.nth(0)).toContainText("auth.sessions.ip 10.9.1.2");

      await expect(sessions.nth(1)).toBeVisible();
      await expect(sessions.nth(1)).toContainText("iOS");
      await expect(sessions.nth(1)).toContainText("01/23/2022, 16:55");
      await expect(sessions.nth(1)).toContainText(
        "auth.sessions.browser Mobile Safari",
      );
      await expect(sessions.nth(1)).toContainText("auth.sessions.ip 10.9.1.5");

      await expect(page.getByTestId("logout-all-sessions-button")).toHaveText(
        "auth.sessions.logout_all",
      );
    });

    test.describe("change password", () => {
      test.beforeEach(async ({ page }) => {
        await page.locator("#current_password").fill("secretPassword123#");
        await page.locator("#new_password").fill("newSecretPassword123#");
        await page
          .locator("#new_password_confirmation")
          .fill("newSecretPassword123#");
      });

      test("loading state while saving", async ({
        page,
        profileUserResponse,
      }) => {
        const putUserPasswordApiMock = await mockApiRequest(
          page,
          "PUT",
          "users/1/password",
          {
            json: profileUserResponse,
            hold: true,
          },
        );

        await page.getByTestId("change-password-save-button").click();
        await putUserPasswordApiMock.waitForRequest();

        for (const tabButton of [
          "base-tab-button",
          "email-tab-button",
          "security-tab-button",
          "others-tab-button",
        ]) {
          await expect(page.getByTestId(tabButton)).toBeDisabled();
        }
        await expect(page.locator("#current_password")).toBeDisabled();
        await expect(page.locator("#new_password")).toBeDisabled();
        await expect(page.locator("#new_password_confirmation")).toBeDisabled();
        await expect(
          page.getByTestId("change-password-save-button"),
        ).toBeDisabled();
        await expect(
          page.getByTestId("logout-all-sessions-button"),
        ).toBeDisabled();

        putUserPasswordApiMock.release();
        await expectToastAndClose(page, "auth.flash.password_changed");
      });

      test("sends the passwords", async ({ page, profileUserResponse }) => {
        const putUserPasswordApiMock = await mockApiRequest(
          page,
          "PUT",
          "users/1/password",
          {
            json: profileUserResponse,
          },
        );

        await page.getByTestId("change-password-save-button").click();

        const request = await putUserPasswordApiMock.waitForRequest();
        expect(request.postDataJSON()).toEqual({
          new_password: "newSecretPassword123#",
          new_password_confirmation: "newSecretPassword123#",
          current_password: "secretPassword123#",
        });
        await expectToastAndClose(page, "auth.flash.password_changed");
      });

      test("fields are reset and enabled after saving", async ({
        page,
        profileUserResponse,
      }) => {
        await mockApiRequest(page, "PUT", "users/1/password", {
          json: profileUserResponse,
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

        const sessions = page.getByTestId("session-panel");
        await expect(sessions).toHaveCount(2);

        await expect(sessions.nth(0)).toBeVisible();
        await expect(sessions.nth(0)).toContainText("Windows");
        await expect(sessions.nth(0)).toContainText("auth.sessions.current");
        await expect(sessions.nth(0)).toContainText(
          "auth.sessions.browser Chrome",
        );
        await expect(sessions.nth(0)).toContainText(
          "auth.sessions.ip 10.9.1.2",
        );

        await expect(sessions.nth(1)).toBeVisible();
        await expect(sessions.nth(1)).toContainText("iOS");
        await expect(sessions.nth(1)).toContainText("01/23/2022, 16:55");
        await expect(sessions.nth(1)).toContainText(
          "auth.sessions.browser Mobile Safari",
        );
        await expect(sessions.nth(1)).toContainText(
          "auth.sessions.ip 10.9.1.5",
        );
      });

      test("422 errors are shown at the fields", async ({ page }) => {
        await mockApiRequest(
          page,
          "PUT",
          "users/1/password",
          validationErrors(
            {
              current_password: ["The Current password field is required."],
              new_password: ["The New password field is required."],
              new_password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
            "The Current password field is required. (and 2 more errors)",
          ),
        );

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
        await mockApiRequest(
          page,
          "PUT",
          "users/1/password",
          validationErrors(
            {
              current_password: ["The Current password field is required."],
              new_password: ["The New password field is required."],
              new_password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
            "The Current password field is required.",
          ),
        );
        await page.getByTestId("change-password-save-button").click();
        await expectToastAndClose(
          page,
          "The Current password field is required.",
        );
        await expect(
          page.getByTestId("security-tab-current-password-field"),
        ).toContainText("The Current password field is required.");

        await mockApiRequest(page, "PUT", "users/1/password", serverError());
        await expect(page.locator("#current_password")).toHaveValue("");
        await page.locator("#current_password").fill("secretPassword123#");
        await page.locator("#new_password").fill("newSecretPassword123#");
        await page
          .locator("#new_password_confirmation")
          .fill("newSecretPassword123#");
        await page.getByTestId("change-password-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
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
        await mockApiRequest(page, "PUT", "users/1/password", {
          status: 401,
        });

        await page.getByTestId("change-password-save-button").click();

        await expectLoginRedirect(page, "/profile");
      });
    });

    test.describe("logout all other sessions", () => {
      test("loading state while logging out", async ({
        page,
        sessionsResponse,
      }) => {
        const deleteSessionsApiMock = await mockApiRequest(
          page,
          "DELETE",
          "sessions",
          {
            status: 204,
            hold: true,
          },
        );
        sessionsResponse.data = sessionsResponse.data.slice(0, 1);

        await page.getByTestId("logout-all-sessions-button").click();
        await deleteSessionsApiMock.waitForRequest();

        for (const tabButton of [
          "base-tab-button",
          "email-tab-button",
          "security-tab-button",
          "others-tab-button",
        ]) {
          await expect(page.getByTestId(tabButton)).toBeDisabled();
        }
        await expect(page.locator("#current_password")).toBeDisabled();
        await expect(page.locator("#new_password")).toBeDisabled();
        await expect(page.locator("#new_password_confirmation")).toBeDisabled();
        await expect(
          page.getByTestId("change-password-save-button"),
        ).toBeDisabled();
        await expect(
          page.getByTestId("logout-all-sessions-button"),
        ).toBeDisabled();

        deleteSessionsApiMock.release();
        await expectToastAndClose(page, "auth.flash.logout_all_others");
      });

      test("only the current session remains", async ({
        page,
        sessionsResponse,
        getSessionsApiMock,
      }) => {
        const deleteSessionsApiMock = await mockApiRequest(
          page,
          "DELETE",
          "sessions",
          {
            status: 204,
          },
        );
        const getSessionsRequestsAfterChange = getSessionsApiMock.respondWith({
          json: {
            ...sessionsResponse,
            data: sessionsResponse.data.slice(0, 1),
          },
        });

        await page.getByTestId("logout-all-sessions-button").click();
        await deleteSessionsApiMock.waitForRequest();
        await getSessionsRequestsAfterChange.waitForRequest();

        await expectToastAndClose(page, "auth.flash.logout_all_others");

        const panels = page.getByTestId("session-panel");
        await expect(panels).toHaveCount(1);
        await expect(panels.nth(0)).toBeVisible();
        await expect(panels.nth(0)).toContainText("Windows");
        await expect(panels.nth(0)).toContainText("auth.sessions.current");
        await expect(panels.nth(0)).toContainText(
          "auth.sessions.browser Chrome",
        );
        await expect(panels.nth(0)).toContainText("auth.sessions.ip 10.9.1.2");
      });

      test("server error shows a toast", async ({ page }) => {
        await mockApiRequest(page, "DELETE", "sessions", serverError());

        await page.getByTestId("logout-all-sessions-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("401 redirects to the login", async ({ page }) => {
        await mockApiRequest(page, "DELETE", "sessions", {
          status: 401,
        });

        await page.getByTestId("logout-all-sessions-button").click();

        await expectLoginRedirect(page, "/profile");
      });
    });
  });

  test("view without password change allowed", async ({
    page,
    configResponse,
  }) => {
    configResponse.data.user.password_change_allowed = false;

    await page.goto("/profile#tab=security");

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

    await expect(page.getByTestId("logout-all-sessions-button")).toBeVisible();
    await expect(
      page.getByTestId("security-tab-current-password-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("new-password-field")).toHaveCount(0);
    await expect(
      page.getByTestId("new-password-confirmation-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("change-password-save-button")).toHaveCount(
      0,
    );

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

    await expect(page.getByTestId("logout-all-sessions-button")).toHaveText(
      "auth.sessions.logout_all",
    );
    await expect(page.getByTestId("logout-all-sessions-button")).toBeEnabled();
  });

  test("view as external user", async ({ page, profileUserResponse }) => {
    profileUserResponse.data.authenticator = "ldap";
    profileUserResponse.data.external_id = "jdo";

    await page.goto("/profile#tab=security");

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

    await expect(page.getByTestId("logout-all-sessions-button")).toBeVisible();
    await expect(
      page.getByTestId("security-tab-current-password-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("new-password-field")).toHaveCount(0);
    await expect(
      page.getByTestId("new-password-confirmation-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("change-password-save-button")).toHaveCount(
      0,
    );

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

    await expect(page.getByTestId("logout-all-sessions-button")).toHaveText(
      "auth.sessions.logout_all",
    );
    await expect(page.getByTestId("logout-all-sessions-button")).toBeEnabled();
  });

  test.describe("load sessions error", () => {
    test("loading shows the overlay without sessions", async ({
      page,
      getSessionsApiMock,
    }) => {
      const getSessionsRequestsAfterChange = getSessionsApiMock.respondWith(
        serverError({ hold: true }),
      );

      await page.goto("/profile#tab=security");
      await getSessionsRequestsAfterChange.waitForRequest();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("session-panel")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);

      getSessionsApiMock.release();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("error shows the overlay with retry button", async ({
      page,
      getSessionsApiMock,
    }) => {
      getSessionsApiMock.respondWith(serverError());

      await page.goto("/profile#tab=security");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("session-panel")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveText(
        "app.reload",
      );
    });

    test("retry loads the sessions", async ({
      page,
      sessionsResponse,
      getSessionsApiMock,
    }) => {
      getSessionsApiMock.respondWith(serverError());

      await page.goto("/profile#tab=security");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      const getSessionsRequestsAfterChange = getSessionsApiMock.respondWith({
        json: sessionsResponse,
      });
      await page.getByTestId("loading-retry-button").click();
      await getSessionsRequestsAfterChange.waitForRequest();

      await expect(page.getByTestId("overlay")).toBeHidden();

      const panels = page.getByTestId("session-panel");
      await expect(panels).toHaveCount(2);

      await expect(panels.nth(0)).toBeVisible();
      await expect(panels.nth(0)).toContainText("Windows");
      await expect(panels.nth(0)).toContainText("auth.sessions.current");
      await expect(panels.nth(0)).toContainText("auth.sessions.browser Chrome");
      await expect(panels.nth(0)).toContainText("auth.sessions.ip 10.9.1.2");

      await expect(panels.nth(1)).toBeVisible();
      await expect(panels.nth(1)).toContainText("iOS");
      await expect(panels.nth(1)).toContainText("01/23/2022, 16:55");
      await expect(panels.nth(1)).toContainText(
        "auth.sessions.browser Mobile Safari",
      );
      await expect(panels.nth(1)).toContainText("auth.sessions.ip 10.9.1.5");
    });
  });
});
