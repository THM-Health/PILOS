import { mergeTests } from "@playwright/test";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as permissionControllerTest } from "../support/fixtures/permissionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockApiRequest,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(roleControllerTest, permissionControllerTest);

test.use({ authenticated: true });

test.describe("Admin roles index role actions", () => {
  test.beforeEach(async ({ page, currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
      "roles.update",
      "roles.create",
      "roles.delete",
    ];

    await page.goto("/admin/roles");
    await expect(page.getByTestId("role-item")).toHaveCount(3);
  });

  test.describe("delete role", () => {
    test.beforeEach(async ({ page }) => {
      await expect(page.getByTestId("roles-delete-dialog")).toHaveCount(0);

      await page
        .getByTestId("role-item")
        .nth(2)
        .getByTestId("roles-delete-button")
        .click();

      await expect(page.getByTestId("roles-delete-dialog")).toBeVisible();
    });

    test("dialog shows title and role name", async ({ page }) => {
      const dialog = page.getByTestId("roles-delete-dialog");
      await expect(dialog).toContainText("admin.roles.delete.title");
      await expect(dialog).toContainText(
        'admin.roles.delete.confirm_{"name":"Students"}',
      );
    });

    test("confirm deletes the role and refreshes the list", async ({
      page,
      rolesResponse,
    }) => {
      const deleteRoleApiMock = await mockApiRequest(
        page,
        "DELETE",
        "roles/3",
        {
          status: 204,
          hold: true,
        },
      );
      // The list after the role was deleted
      rolesResponse.data = rolesResponse.data.filter((role) => role.id !== 3);
      rolesResponse.meta.to = 2;
      rolesResponse.meta.total = 2;
      rolesResponse.meta.total_no_filter = 2;

      const rolesRequest = page.waitForRequest(
        (request) =>
          request.method() === "GET" &&
          new URL(request.url()).pathname === "/api/v1/roles",
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

      deleteRoleApiMock.release();
      await rolesRequest;

      // Check that role was deleted
      await expect(page.getByTestId("role-item")).toHaveCount(2);

      // Check that dialog was closed
      await expect(page.getByTestId("roles-delete-dialog")).toHaveCount(0);
    });

    test("cancel closes the dialog and keeps the role", async ({ page }) => {
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await page.getByTestId("dialog-cancel-button").click();

      await expect(page.getByTestId("roles-delete-dialog")).toBeHidden();
      await expect(page.getByTestId("role-item")).toHaveCount(3);
    });

    test("dialog shows the name of the role it is opened for", async ({
      page,
    }) => {
      await page.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("roles-delete-dialog")).toBeHidden();

      await page
        .getByTestId("role-item")
        .nth(1)
        .getByTestId("roles-delete-button")
        .click();

      const dialog = page.getByTestId("roles-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.roles.delete.title");
      await expect(dialog).toContainText(
        'admin.roles.delete.confirm_{"name":"Staff"}',
      );
    });

    test("server error keeps the dialog open", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "roles/3", serverError());

      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("roles-delete-dialog")).toBeVisible();
    });

    test("role linked to users keeps the dialog open", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "roles/3", {
        status: 464,
        json: {
          message:
            "The role is linked to users and therefore it can't be deleted!",
        },
      });

      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"The role is linked to users and therefore it can\'t be deleted!"}',
        'app.flash.server_error.error_code_{"statusCode":464}',
      ]);
      await expect(page.getByTestId("roles-delete-dialog")).toBeVisible();
    });

    test("role not found closes the dialog and refreshes the list", async ({
      page,
      rolesResponse,
    }) => {
      await mockApiRequest(
        page,
        "DELETE",
        "roles/3",
        modelNotFound("role", [3]),
      );
      rolesResponse.data = rolesResponse.data.filter((role) => role.id !== 3);
      rolesResponse.meta.to = 2;
      rolesResponse.meta.total = 2;
      rolesResponse.meta.total_no_filter = 2;

      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);
      await expect(page.getByTestId("roles-delete-dialog")).toHaveCount(0);
      await expect(page.getByTestId("role-item")).toHaveCount(2);
    });

    test("unauthenticated redirects to the login page", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "roles/3", { status: 401 });

      await page.getByTestId("dialog-continue-button").click();

      await expectLoginRedirect(page, "/admin/roles");
    });
  });

  test("open add new role page", async ({ page }) => {
    await page.getByTestId("roles-add-button").click();
    await expect(page).toHaveURL(/\/admin\/roles\/new/);
  });

  test("open edit role page", async ({ page }) => {
    await page
      .getByTestId("role-item")
      .nth(1)
      .getByTestId("roles-edit-button")
      .click();
    await expect(page).toHaveURL(/\/admin\/roles\/2\/edit/);
  });

  test("open view role page", async ({ page }) => {
    await page
      .getByTestId("role-item")
      .nth(1)
      .getByTestId("roles-view-button")
      .click();
    await expect(page).toHaveURL(/\/admin\/roles\/2$/);
  });
});
