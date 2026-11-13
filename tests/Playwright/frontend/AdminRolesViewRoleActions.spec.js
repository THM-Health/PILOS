import { mergeTests } from "@playwright/test";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as permissionControllerTest } from "../support/fixtures/permissionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { checkPermissionGroup } from "../support/admin.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockApiRequest,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(roleControllerTest, permissionControllerTest);

test.describe("Admin roles view role actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
      "roles.update",
      "roles.create",
      "roles.delete",
    ];
  });

  test.describe("delete role", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/roles/2");

      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("roles-delete-dialog")).toHaveCount(0);

      await page.getByTestId("roles-delete-button").click();

      await expect(page.getByTestId("roles-delete-dialog")).toBeVisible();
    });

    test("dialog shows title and role name", async ({ page }) => {
      const dialog = page.getByTestId("roles-delete-dialog");
      await expect(dialog).toContainText("admin.roles.delete.title");
      await expect(dialog).toContainText(
        'admin.roles.delete.confirm_{"name":"Staff"}',
      );
    });

    test("confirm deletes the role and redirects to the index", async ({
      page,
      rolesResponse,
    }) => {
      const deleteRoleApiMock = await mockApiRequest(
        page,
        "DELETE",
        "roles/2",
        {
          status: 204,
          hold: true,
        },
      );

      // The list after the role was deleted
      rolesResponse.data = rolesResponse.data.filter((role) => role.id !== 2);
      rolesResponse.meta.to = 2;
      rolesResponse.meta.total = 2;
      rolesResponse.meta.total_no_filter = 2;

      const dialog = page.getByTestId("roles-delete-dialog");
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

      // Check that redirect worked
      await expect(page).toHaveURL(/\/admin\/roles$/);

      // Check that role was deleted
      await expect(page.getByTestId("role-item")).toHaveCount(2);

      // Check that dialog was closed
      await expect(dialog).toHaveCount(0);
    });

    test("server error keeps the dialog open", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "roles/2", serverError());

      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("roles-delete-dialog")).toBeVisible();
    });

    test("role linked to users keeps the dialog open", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "roles/2", {
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

    test("role not found redirects to the index", async ({ page }) => {
      await mockApiRequest(
        page,
        "DELETE",
        "roles/2",
        modelNotFound("role", [2]),
      );

      await page.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL(/\/admin\/roles$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("unauthenticated redirects to the login page", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "roles/2", { status: 401 });

      await page.getByTestId("dialog-continue-button").click();

      await expectLoginRedirect(page, "/admin/roles/2");
    });
  });

  test.describe("switch between edit and view", () => {
    // [permission, explicit, included] in the order of the permission list, state of the unchanged role
    const pristinePermissions = [
      ["rooms.create", true, true],
      ["rooms.viewAll", true, true],
      ["rooms.manage", false, false],
      ["meetings.viewAny", true, true],
      ["admin.view", false, true],
      ["settings.viewAny", false, false],
      ["settings.update", false, false],
      ["system.monitor", false, false],
      ["users.viewAny", true, true],
      ["users.view", false, false],
      ["users.update", false, false],
      ["users.create", false, false],
      ["users.delete", false, false],
      ["users.updateOwnAttributes", false, false],
      ["roles.viewAny", false, true],
      ["roles.view", false, false],
      ["roles.update", false, false],
      ["roles.create", false, false],
      ["roles.delete", false, false],
      ["roomTypes.view", false, true],
      ["roomTypes.update", true, true],
      ["roomTypes.create", true, true],
      ["roomTypes.delete", true, true],
      ["servers.viewAny", false, false],
      ["servers.view", false, false],
      ["servers.update", false, false],
      ["servers.create", false, false],
      ["servers.delete", false, false],
      ["serverPools.viewAny", false, true],
      ["serverPools.view", false, false],
      ["serverPools.update", false, false],
      ["serverPools.create", false, false],
      ["serverPools.delete", false, false],
    ];

    test("cancel edit discards changes and shows the view", async ({
      page,
    }) => {
      await page.goto("/admin/roles/2/edit");

      // Check values and change them
      await expect(page.locator("#name")).toHaveValue("Staff");
      await page.locator("#name").fill("Staff 2");

      await expect(page.locator("#default")).toBeChecked();
      await expect(page.locator("#unlimited")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      await expect(page.locator("#custom")).not.toBeChecked();
      await page.locator("#custom").click();
      await expect(page.locator("#room-limit")).toHaveValue("0");
      await page.locator("#room-limit").fill("10");

      // Check each permission before it is toggled
      for (const [index, [permission, explicit, included]] of [
        ...pristinePermissions.entries(),
      ]) {
        let includedBefore = included;
        if (permission === "users.updateOwnAttributes") {
          includedBefore = true;
        } else if (permission === "serverPools.viewAny") {
          includedBefore = false;
        }
        await checkPermissionGroup(
          page,
          index,
          permission,
          explicit,
          includedBefore,
          false,
        );
        const id = permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
        await page.locator(`[id="${id}"]`).click();
      }

      // Check that save button is shown
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeEnabled();

      // Switch to view
      await page.getByTestId("roles-cancel-edit-button").click();

      // Check if redirect worked
      await expect(page).toHaveURL(/\/admin\/roles\/2$/);

      // Check that changes were not saved
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#default")).toBeChecked();
      await expect(page.locator("#default")).toBeDisabled();
      await expect(page.locator("#unlimited")).not.toBeChecked();
      await expect(page.locator("#unlimited")).toBeDisabled();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      for (const [index, [permission, explicit, included]] of [
        ...pristinePermissions.entries(),
      ]) {
        await checkPermissionGroup(
          page,
          index,
          permission,
          explicit,
          included,
          true,
        );
      }

      // Check that save button is not visible
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);
    });

    test("edit button switches from view to edit", async ({ page }) => {
      await page.goto("/admin/roles/2");

      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      await page.getByTestId("roles-edit-button").click();

      // Check if redirect worked
      await expect(page).toHaveURL(/\/admin\/roles\/2\/edit$/);

      // Check that original values are shown
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.locator("#name")).toBeEnabled();
      await expect(page.locator("#default")).toBeChecked();
      await expect(page.locator("#default")).toBeEnabled();
      await expect(page.locator("#unlimited")).not.toBeChecked();
      await expect(page.locator("#unlimited")).toBeEnabled();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#custom")).toBeEnabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      for (const [index, [permission, explicit, included]] of [
        ...pristinePermissions.entries(),
      ]) {
        await checkPermissionGroup(
          page,
          index,
          permission,
          explicit,
          included,
          false,
        );
      }

      // Check that save button is shown
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeEnabled();
    });
  });
});
