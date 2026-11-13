import { mergeTests } from "@playwright/test";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { test as sessionControllerTest } from "../support/fixtures/sessionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptAdminUsersIndexRequests } from "../support/mocks.js";
import {
  expectLoginRedirect,
  testVisitWithoutCurrentUser,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  mockApiRequest,
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

test.describe("Admin users edit", () => {
  test.beforeEach(async ({ currentUserResponse, configResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "roles.viewAny",
    ];
    configResponse.data.auth.local = true;
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/users/2/edit");
  });

  test("visit with user without permission to edit users", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
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
    test.beforeEach(async ({ userResponse }) => {
      userResponse.data.superuser = true;
      userResponse.data.roles.push({
        id: 1,
        name: "Superuser",
        automatic: true,
        superuser: true,
      });
    });

    test("edit page of a superuser is shown to a superuser", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.superuser = true;

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
      currentUserResponse,
    }) => {
      currentUserResponse.data.superuser = false;

      await page.goto("/admin/users/2/edit");

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=base$/);
      await expect(page).not.toHaveURL(/\/edit/);
    });
  });

  test.describe("visit edit user page", () => {
    test("loading state hides buttons and tabs", async ({
      page,
      userResponse,
    }) => {
      const getUserApiMock = await mockApiRequest(page, "GET", "users/2", {
        hold: true,
        json: userResponse,
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

      getUserApiMock.release();
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
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions.push("users.delete");

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
      userResponse,
    }) => {
      await mockApiRequest(page, "GET", "users/2", serverError());

      await page.goto("/admin/users/2/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      await mockApiRequest(page, "GET", "users/2", {
        json: userResponse,
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
      await mockApiRequest(page, "GET", "users/2", modelNotFound("user", [2]));

      await page.goto("/admin/users/2/edit");

      await expect(page).toHaveURL(/\/admin\/users$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockApiRequest(page, "GET", "users/2", { status: 401 });

      await page.goto("/admin/users/2/edit");

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });
});
