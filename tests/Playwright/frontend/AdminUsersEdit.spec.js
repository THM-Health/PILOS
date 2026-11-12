import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/adminUsersEdit.js";
import { interceptAdminUsersIndexRequests } from "../support/mocks.js";
import {
  expectLoginRedirect,
  testVisitWithoutCurrentUser,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import { mockMethod } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin users edit", () => {
  test.beforeEach(async ({ currentUser, config }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "roles.viewAny",
    ];
    config.data.auth.local = true;
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/users/2/edit");
  });

  test("visit with user without permission to edit users", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.create",
      "roles.viewAny",
    ];

    await page.goto("/admin/users/2/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/users\/2\/edit/);
  });

  test.describe("superuser", () => {
    test.beforeEach(async ({ user }) => {
      user.data.superuser = true;
      user.data.roles.push({
        id: 1,
        name: "Superuser",
        automatic: true,
        superuser: true,
      });
    });

    test("edit page of a superuser is shown to a superuser", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.superuser = true;

      await page.goto("/admin/users/2/edit");

      const cancelButton = page.getByTestId("users-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
      await expect(cancelButton).toContainText("app.cancel_editing");
      await expect(cancelButton).toHaveAttribute(
        "href",
        "/admin/users/2#tab=base",
      );
      await expect(page.getByTestId("users-edit-button")).toHaveCount(0);
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("users-delete-button")).toHaveCount(0);
      const saveButton = page.getByTestId("user-tab-profile-save-button");
      await expect(saveButton).toBeEnabled();
      await expect(saveButton).toContainText("app.save");

      for (const id of [
        "base-tab-button",
        "email-tab-button",
        "security-tab-button",
        "others-tab-button",
      ]) {
        await expect(page.getByTestId(id)).toBeVisible();
      }
    });

    test("non-superuser is redirected to the view page", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.superuser = false;

      await page.goto("/admin/users/2/edit");

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=base$/);
      await expect(page).not.toHaveURL(/\/edit/);
    });
  });

  test.describe("visit edit user page", () => {
    test("loading state hides buttons and tabs", async ({ page, user }) => {
      const userRequest = await mockMethod(page, "GET", "**/api/v1/users/2", {
        hold: true,
        json: user,
      });

      await page.goto("/admin/users/2/edit");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();

      for (const id of [
        "users-cancel-edit-button",
        "users-edit-button",
        "users-reset-password-button",
        "users-delete-button",
        "user-tab-profile-save-button",
        "base-tab-button",
        "email-tab-button",
        "security-tab-button",
        "others-tab-button",
      ]) {
        await expect(page.getByTestId(id)).toHaveCount(0);
      }

      userRequest.release();
      await expect(page.getByTestId("base-tab-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("buttons and tabs are shown", async ({ page }) => {
      await page.goto("/admin/users/2/edit");

      await expect(page.getByTestId("base-tab-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeHidden();

      const cancelButton = page.getByTestId("users-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
      await expect(cancelButton).toContainText("app.cancel_editing");
      await expect(cancelButton).toHaveAttribute(
        "href",
        "/admin/users/2#tab=base",
      );
      await expect(page.getByTestId("users-edit-button")).toHaveCount(0);
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("users-delete-button")).toHaveCount(0);
      const saveButton = page.getByTestId("user-tab-profile-save-button");
      await expect(saveButton).toBeEnabled();
      await expect(saveButton).toContainText("app.save");

      for (const id of [
        "base-tab-button",
        "email-tab-button",
        "security-tab-button",
        "others-tab-button",
      ]) {
        await expect(page.getByTestId(id)).toBeVisible();
      }
    });

    test("breadcrumbs", async ({ page }) => {
      await page.goto("/admin/users/2/edit");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        'admin.breadcrumbs.users.edit_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("delete button is shown with delete permission", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.permissions.push("users.delete");

      await page.goto("/admin/users/2/edit");

      const cancelButton = page.getByTestId("users-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
      await expect(cancelButton).toContainText("app.cancel_editing");
      await expect(cancelButton).toHaveAttribute(
        "href",
        "/admin/users/2#tab=base",
      );
      await expect(page.getByTestId("users-edit-button")).toHaveCount(0);
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("users-delete-button")).toBeEnabled();
      await expect(
        page.getByTestId("user-tab-profile-save-button"),
      ).toBeEnabled();
    });

    test("invalid tab hash falls back to the base tab", async ({ page }) => {
      await page.goto("/admin/users/2/edit#tab=invalid");

      // Check that base tab is shown
      await expect(page.locator("#firstname")).toBeVisible();

      // Check that cancel edit button contains base tab as hash parameter
      await expect(
        page.getByTestId("users-cancel-edit-button"),
      ).toHaveAttribute("href", "/admin/users/2#tab=base");

      // Check that invalid tab is cleared
      await expect(page).not.toHaveURL(/#tab=invalid/);
    });
  });

  test.describe("errors", () => {
    test("server error shows overlay and allows reload", async ({
      page,
      user,
    }) => {
      await mockMethod(page, "GET", "**/api/v1/users/2", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/users/2/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      await mockMethod(page, "GET", "**/api/v1/users/2", {
        json: user,
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("base-tab-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("404 error redirects to users index", async ({ page }) => {
      await interceptAdminUsersIndexRequests(page);
      await mockMethod(page, "GET", "**/api/v1/users/2", {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });

      await page.goto("/admin/users/2/edit");

      await expect(page).toHaveURL(/\/admin\/users$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/users/2", { status: 401 });

      await page.goto("/admin/users/2/edit");

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });
});
