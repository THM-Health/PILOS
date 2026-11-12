import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  interceptAdminUsersIndexRequests,
  interceptAdminUsersNewRequests,
  interceptAdminUsersViewRequests,
} from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const isUsersUrl = (url) => url.pathname === "/api/v1/users";

const isUsersRequest = (request) =>
  request.method() === "GET" && isUsersUrl(new URL(request.url()));

const isUserUrl = (id) => (url) => url.pathname === `/api/v1/users/${id}`;

/**
 * Mock the users list without the user with the given id and fix the meta data.
 */
async function mockUsersWithout(page, id) {
  const users = JSON.parse(
    readFileSync("tests/Playwright/fixtures/users.json", "utf8"),
  );
  users.data = users.data.filter((user) => user.id !== id);
  users.meta.to = 3;
  users.meta.total = 3;
  users.meta.total_no_filter = 3;
  await mockMethod(page, "GET", isUsersUrl, { json: users });
}

const dialog = (page, name) => page.getByTestId(`users-${name}-dialog`);

test.describe("Admin users index user actions", () => {
  test.use({ authenticated: true });

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
    await interceptAdminUsersIndexRequests(page);
  });

  test.describe("delete user", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(dialog(page, "delete")).toHaveCount(0);
      await page
        .getByTestId("user-item")
        .nth(2)
        .getByTestId("users-delete-button")
        .click();
      await expect(dialog(page, "delete")).toBeVisible();
    });

    test("dialog shows the user name and can be cancelled", async ({
      page,
    }) => {
      await expect(dialog(page, "delete")).toContainText(
        "admin.users.delete.title",
      );
      await expect(dialog(page, "delete")).toContainText(
        'admin.users.delete.confirm_{"firstname":"Juan","lastname":"Walter"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog(page, "delete")).toHaveCount(0);
      await expect(page.getByTestId("user-item")).toHaveCount(4);
    });

    test("confirm deletes the user and reloads the list", async ({ page }) => {
      const deleteMock = await mockMethod(page, "DELETE", isUserUrl(3), {
        status: 204,
        hold: true,
      });
      await mockUsersWithout(page, 3);

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();

      const reload = page.waitForRequest(isUsersRequest);
      await nthRequest(deleteMock);
      deleteMock.release();
      await reload;

      // Check that user was deleted and the dialog is closed
      await expect(page.getByTestId("user-item")).toHaveCount(3);
      await expect(dialog(page, "delete")).toHaveCount(0);
    });

    test("dialog of another user shows its name after a delete", async ({
      page,
    }) => {
      await mockMethod(page, "DELETE", isUserUrl(3), { status: 204 });
      await mockUsersWithout(page, 3);

      await page.getByTestId("dialog-continue-button").click();
      await expect(page.getByTestId("user-item")).toHaveCount(3);
      await expect(dialog(page, "delete")).toHaveCount(0);

      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-delete-button")
        .click();
      await expect(dialog(page, "delete")).toBeVisible();
      await expect(dialog(page, "delete")).toContainText(
        "admin.users.delete.title",
      );
      await expect(dialog(page, "delete")).toContainText(
        'admin.users.delete.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog(page, "delete")).toHaveCount(0);
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const deleteMock = await mockMethod(page, "DELETE", isUserUrl(3), {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);

      await expect(dialog(page, "delete")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("user not found (404) reloads the list and closes the dialog", async ({
      page,
    }) => {
      await mockUsersWithout(page, 3);
      const deleteMock = await mockMethod(page, "DELETE", isUserUrl(3), {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [3] },
      });

      const reload = page.waitForRequest(isUsersRequest);
      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);
      await reload;

      await expect(dialog(page, "delete")).toHaveCount(0);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);

      // Check that user is not in list anymore
      await expect(page.getByTestId("user-item")).toHaveCount(3);
    });

    test("the dialog can be opened for another user after a 404", async ({
      page,
    }) => {
      await mockUsersWithout(page, 3);
      await mockMethod(page, "DELETE", isUserUrl(3), {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [3] },
      });

      await page.getByTestId("dialog-continue-button").click();
      await expectToastAndClose(page, "app.flash.model_not_found.title_");
      await expect(page.getByTestId("user-item")).toHaveCount(3);

      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-delete-button")
        .click();
      await expect(dialog(page, "delete")).toBeVisible();
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      const deleteMock = await mockMethod(page, "DELETE", isUserUrl(3), {
        status: 401,
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("reset password", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(dialog(page, "reset-password")).toHaveCount(0);
      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-reset-password-button")
        .click();
      await expect(dialog(page, "reset-password")).toBeVisible();
    });

    test("dialog shows the user name", async ({ page }) => {
      await expect(dialog(page, "reset-password")).toContainText(
        "admin.users.reset_password.title",
      );
      await expect(dialog(page, "reset-password")).toContainText(
        'admin.users.reset_password.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("confirm resets the password", async ({ page }) => {
      const resetMock = await mockMethod(
        page,
        "POST",
        (url) => url.pathname === "/api/v1/users/2/resetPassword",
        { status: 204, hold: true },
      );

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();

      await nthRequest(resetMock);
      resetMock.release();

      // Check that toast message is shown and the dialog is closed
      await expectToastAndClose(
        page,
        'admin.users.password_reset_success_{"mail":"LauraWRivera@domain.tld"}',
      );
      await expect(dialog(page, "reset-password")).toHaveCount(0);
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const resetMock = await mockMethod(
        page,
        "POST",
        (url) => url.pathname === "/api/v1/users/2/resetPassword",
        { status: 500, json: { message: "Test" } },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(resetMock);

      await expect(dialog(page, "reset-password")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      const resetMock = await mockMethod(
        page,
        "POST",
        (url) => url.pathname === "/api/v1/users/2/resetPassword",
        { status: 401 },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(resetMock);

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
    });

    test("open add new user page", async ({ page }) => {
      await interceptAdminUsersNewRequests(page);

      await page.getByTestId("users-add-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/new/);
    });

    test("open edit user page", async ({ page }) => {
      await interceptAdminUsersViewRequests(page);

      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-edit-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/users\/2\/edit/);
    });

    test("open view user page", async ({ page }) => {
      await interceptAdminUsersViewRequests(page);

      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-view-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/users\/2$/);
    });
  });

  test.describe("navigation without update and view permission", () => {
    test.beforeEach(async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "roles.viewAny",
      ];
      await interceptAdminUsersViewRequests(page);
      await mockMethod(page, "GET", isUserUrl(1), {
        path: "tests/Playwright/fixtures/userDataCurrentUser.json",
      });
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
    });

    test("open edit page of the current user", async ({ page }) => {
      await page
        .getByTestId("user-item")
        .nth(0)
        .getByTestId("users-edit-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/users\/1\/edit/);
    });

    test("open view page of the current user", async ({ page }) => {
      await page
        .getByTestId("user-item")
        .nth(0)
        .getByTestId("users-view-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/users\/1$/);
    });
  });
});
