import { mergeTests } from "@playwright/test";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { test as sessionControllerTest } from "../support/fixtures/sessionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockApiRequest,
  readFixture,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(
  userControllerTest,
  roleControllerTest,
  timezonesTest,
  sessionControllerTest,
);

test.use({ authenticated: true });

test.describe("Admin users index user actions", () => {
  test.beforeEach(async ({ currentUserResponse, configResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "users.delete",
      "roles.viewAny",
    ];
    configResponse.data.auth.local = true;
  });

  test.describe("delete user", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-delete-dialog")).toHaveCount(0);
      await page
        .getByTestId("user-item")
        .nth(2)
        .getByTestId("users-delete-button")
        .click();
      await expect(page.getByTestId("users-delete-dialog")).toBeVisible();
    });

    test("dialog shows the user name and can be cancelled", async ({
      page,
    }) => {
      const dialog = page.getByTestId("users-delete-dialog");
      await expect(dialog).toContainText("admin.users.delete.title");
      await expect(dialog).toContainText(
        'admin.users.delete.confirm_{"firstname":"Juan","lastname":"Walter"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId("user-item")).toHaveCount(4);
    });

    test("confirm deletes the user and reloads the list", async ({
      page,
      usersResponse,
      getUsersApiMock,
    }) => {
      const deleteUserApiMock = await mockApiRequest(
        page,
        "DELETE",
        "users/3",
        {
          status: 204,
          hold: true,
        },
      );
      usersResponse.data = usersResponse.data.filter((user) => user.id !== 3);
      Object.assign(usersResponse.meta, {
        to: 3,
        total: 3,
        total_no_filter: 3,
      });

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

      const reload = getUsersApiMock.waitForNextRequest();
      await deleteUserApiMock.waitForRequest();
      deleteUserApiMock.release();
      await reload;

      // Check that user was deleted and the dialog is closed
      await expect(page.getByTestId("user-item")).toHaveCount(3);
      await expect(page.getByTestId("users-delete-dialog")).toHaveCount(0);
    });

    test("dialog of another user shows its name after a delete", async ({
      page,
      usersResponse,
    }) => {
      await mockApiRequest(page, "DELETE", "users/3", { status: 204 });
      usersResponse.data = usersResponse.data.filter((user) => user.id !== 3);
      Object.assign(usersResponse.meta, {
        to: 3,
        total: 3,
        total_no_filter: 3,
      });

      await page.getByTestId("dialog-continue-button").click();
      await expect(page.getByTestId("user-item")).toHaveCount(3);
      await expect(page.getByTestId("users-delete-dialog")).toHaveCount(0);

      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-delete-button")
        .click();
      const dialog = page.getByTestId("users-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.delete.title");
      await expect(dialog).toContainText(
        'admin.users.delete.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const deleteUserApiMock = await mockApiRequest(
        page,
        "DELETE",
        "users/3",
        serverError(),
      );

      await page.getByTestId("dialog-continue-button").click();
      await deleteUserApiMock.waitForRequest();

      await expect(page.getByTestId("users-delete-dialog")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("user not found (404) reloads the list and closes the dialog", async ({
      page,
      usersResponse,
      getUsersApiMock,
    }) => {
      usersResponse.data = usersResponse.data.filter((user) => user.id !== 3);
      Object.assign(usersResponse.meta, {
        to: 3,
        total: 3,
        total_no_filter: 3,
      });
      const deleteUserApiMock = await mockApiRequest(
        page,
        "DELETE",
        "users/3",
        modelNotFound("user", [3]),
      );

      const reload = getUsersApiMock.waitForNextRequest();
      await page.getByTestId("dialog-continue-button").click();
      await deleteUserApiMock.waitForRequest();
      await reload;

      await expect(page.getByTestId("users-delete-dialog")).toHaveCount(0);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);

      // Check that user is not in list anymore
      await expect(page.getByTestId("user-item")).toHaveCount(3);
    });

    test("the dialog can be opened for another user after a 404", async ({
      page,
      usersResponse,
    }) => {
      usersResponse.data = usersResponse.data.filter((user) => user.id !== 3);
      Object.assign(usersResponse.meta, {
        to: 3,
        total: 3,
        total_no_filter: 3,
      });
      await mockApiRequest(
        page,
        "DELETE",
        "users/3",
        modelNotFound("user", [3]),
      );

      await page.getByTestId("dialog-continue-button").click();
      await expectToastAndClose(page, "app.flash.model_not_found.title_");
      await expect(page.getByTestId("user-item")).toHaveCount(3);

      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-delete-button")
        .click();
      await expect(page.getByTestId("users-delete-dialog")).toBeVisible();
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      const deleteUserApiMock = await mockApiRequest(
        page,
        "DELETE",
        "users/3",
        {
          status: 401,
        },
      );

      await page.getByTestId("dialog-continue-button").click();
      await deleteUserApiMock.waitForRequest();

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("reset password", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-reset-password-dialog")).toHaveCount(
        0,
      );
      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-reset-password-button")
        .click();
      await expect(
        page.getByTestId("users-reset-password-dialog"),
      ).toBeVisible();
    });

    test("dialog shows the user name", async ({ page }) => {
      const dialog = page.getByTestId("users-reset-password-dialog");
      await expect(dialog).toContainText("admin.users.reset_password.title");
      await expect(dialog).toContainText(
        'admin.users.reset_password.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("confirm resets the password", async ({ page }) => {
      const postUserResetPasswordApiMock = await mockApiRequest(
        page,
        "POST",
        "users/2/resetPassword",
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

      await postUserResetPasswordApiMock.waitForRequest();
      postUserResetPasswordApiMock.release();

      // Check that toast message is shown and the dialog is closed
      await expectToastAndClose(
        page,
        'admin.users.password_reset_success_{"mail":"LauraWRivera@domain.tld"}',
      );
      await expect(page.getByTestId("users-reset-password-dialog")).toHaveCount(
        0,
      );
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const postUserResetPasswordApiMock = await mockApiRequest(
        page,
        "POST",
        "users/2/resetPassword",
        serverError(),
      );

      await page.getByTestId("dialog-continue-button").click();
      await postUserResetPasswordApiMock.waitForRequest();

      await expect(
        page.getByTestId("users-reset-password-dialog"),
      ).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      const postUserResetPasswordApiMock = await mockApiRequest(
        page,
        "POST",
        "users/2/resetPassword",
        { status: 401 },
      );

      await page.getByTestId("dialog-continue-button").click();
      await postUserResetPasswordApiMock.waitForRequest();

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
    });

    test("open add new user page", async ({ page }) => {
      await page.getByTestId("users-add-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/new/);
    });

    test("open edit user page", async ({ page }) => {
      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-edit-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/users\/2\/edit/);
    });

    test("open view user page", async ({ page }) => {
      await page
        .getByTestId("user-item")
        .nth(1)
        .getByTestId("users-view-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/users\/2$/);
    });
  });

  test.describe("navigation without update and view permission", () => {
    test.beforeEach(
      async ({ page, currentUserResponse, getProfileUserApiMock }) => {
        currentUserResponse.data.permissions = [
          "admin.view",
          "users.viewAny",
          "roles.viewAny",
        ];
        getProfileUserApiMock.respondWith({
          json: readFixture("userDataCurrentUser.json"),
        });
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(4);
      },
    );

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
