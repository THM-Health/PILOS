import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptAdminRolesIndexRequests,
  interceptAdminRolesNewRequests,
  interceptAdminRolesViewRequests,
} from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod } from "../support/utils.js";

const DELETE_ROLE_URL = "**/api/v1/roles/3";

/**
 * Mock the roles list without the role "Students" (id 3), as it is after the role was deleted.
 * @param {import("@playwright/test").Page} page
 */
async function mockRolesWithoutStudents(page) {
  const roles = JSON.parse(
    readFileSync("tests/Playwright/fixtures/roles.json", "utf8"),
  );
  roles.data = roles.data.filter((role) => role.id !== 3);
  roles.meta.to = 2;
  roles.meta.total = 2;
  roles.meta.total_no_filter = 2;

  await page.route("**/api/v1/roles*", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: roles })
      : route.fallback(),
  );
}

test.use({ authenticated: true });

test.describe("Admin roles index role actions", () => {
  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
      "roles.update",
      "roles.create",
      "roles.delete",
    ];
    await interceptAdminRolesIndexRequests(page);

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
    }) => {
      const deleteRequest = await mockMethod(page, "DELETE", DELETE_ROLE_URL, {
        status: 204,
        hold: true,
      });
      await mockRolesWithoutStudents(page);

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

      deleteRequest.release();
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
      await mockMethod(page, "DELETE", DELETE_ROLE_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("roles-delete-dialog")).toBeVisible();
    });

    test("role linked to users keeps the dialog open", async ({ page }) => {
      await mockMethod(page, "DELETE", DELETE_ROLE_URL, {
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
    }) => {
      await mockMethod(page, "DELETE", DELETE_ROLE_URL, {
        status: 404,
        json: { message: "model_not_found", model: "role", ids: [3] },
      });
      await mockRolesWithoutStudents(page);

      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);
      await expect(page.getByTestId("roles-delete-dialog")).toHaveCount(0);
      await expect(page.getByTestId("role-item")).toHaveCount(2);
    });

    test("unauthenticated redirects to the login page", async ({ page }) => {
      await mockMethod(page, "DELETE", DELETE_ROLE_URL, { status: 401 });

      await page.getByTestId("dialog-continue-button").click();

      await expectLoginRedirect(page, "/admin/roles");
    });
  });

  test("open add new role page", async ({ page }) => {
    await interceptAdminRolesNewRequests(page);

    await page.getByTestId("roles-add-button").click();
    await expect(page).toHaveURL(/\/admin\/roles\/new/);
  });

  test("open edit role page", async ({ page }) => {
    await interceptAdminRolesViewRequests(page);

    await page
      .getByTestId("role-item")
      .nth(1)
      .getByTestId("roles-edit-button")
      .click();
    await expect(page).toHaveURL(/\/admin\/roles\/2\/edit/);
  });

  test("open view role page", async ({ page }) => {
    await interceptAdminRolesViewRequests(page);

    await page
      .getByTestId("role-item")
      .nth(1)
      .getByTestId("roles-view-button")
      .click();
    await expect(page).toHaveURL(/\/admin\/roles\/2$/);
  });
});
