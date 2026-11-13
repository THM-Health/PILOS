import { mergeTests } from "@playwright/test";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as permissionControllerTest } from "../support/fixtures/permissionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  mockApiRequest,
  readFixture,
  validationErrors,
  serverError,
  modelNotFound,
} from "../support/utils.js";
import {
  checkPermissionGroup,
  checkRoomLimitHelpDialog,
  expectAdminBreadcrumbs,
} from "../support/admin.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";

const test = mergeTests(roleControllerTest, permissionControllerTest);

test.use({ authenticated: true });

test.describe("Admin roles edit", () => {
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

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/roles/2/edit");
  });

  test("visit with user without permission to edit roles", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
    ];

    await page.goto("/admin/roles/2/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/roles\/2\/edit/);
  });

  test.describe("loading and buttons", () => {
    test("loading state", async ({ page, roleResponse }) => {
      const getRoleApiMock = await mockApiRequest(page, "GET", "roles/2", {
        json: roleResponse,
        hold: true,
      });

      await page.goto("/admin/roles/2/edit");
      await expect(page.getByText("admin.title").first()).toBeVisible();

      // Check loading
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);

      getRoleApiMock.release();

      // Check that loading is done
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test("buttons after loading", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      const cancelButton = page.getByTestId("roles-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveJSProperty("tagName", "A");
      await expect(cancelButton).toContainText("app.cancel_editing");
      await expect(cancelButton).toHaveAttribute("href", "/admin/roles/2");
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toBeVisible();
      await expect(page.getByTestId("roles-delete-button")).toBeEnabled();
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeEnabled();
      await expect(page.getByTestId("roles-save-button")).toContainText(
        "app.save",
      );
    });

    test("breadcrumbs", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.edit_{"name":"Staff"}',
      );
    });

    test("buttons without delete permission", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
        "roles.create",
      ];

      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      const cancelButton = page.getByTestId("roles-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveJSProperty("tagName", "A");
      await expect(cancelButton).toContainText("app.cancel_editing");
      await expect(cancelButton).toHaveAttribute("href", "/admin/roles/2");
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeEnabled();
      await expect(page.getByTestId("roles-save-button")).toContainText(
        "app.save",
      );
    });
  });

  test.describe("edit name and room limit", () => {
    test("change name", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      const nameField = page.getByTestId("name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("app.model_name");

      await page.locator("#name").fill("Standard role");
      await expect(page.locator("#name")).toHaveValue("Standard role");

      // Check that breadcrumbs stays the same
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.edit_{"name":"Staff"}',
      );
    });

    test("room limit default state", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      const field = page.getByTestId("room-limit-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("app.room_limit");

      const defaultField = field.getByTestId("room-limit-mode-default-field");
      await expect(defaultField).toBeVisible();
      await expect(defaultField).toContainText(
        'admin.roles.room_limit.default_{"value":"app.unlimited"}',
      );
      await expect(defaultField.locator("#default")).toBeChecked();
      await expect(defaultField.locator("#default")).toBeEnabled();

      const unlimitedField = field.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedField).toBeVisible();
      await expect(unlimitedField).toContainText("app.unlimited");
      await expect(unlimitedField.locator("#unlimited")).not.toBeChecked();
      await expect(unlimitedField.locator("#unlimited")).toBeEnabled();

      const customField = field.getByTestId("room-limit-mode-custom-field");
      await expect(customField).toBeVisible();
      await expect(customField).toContainText("admin.roles.room_limit.custom");
      await expect(customField.locator("#custom")).not.toBeChecked();
      await expect(customField.locator("#custom")).toBeEnabled();

      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("select unlimited room limit", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await page.locator("#unlimited").click();

      await expect(page.locator("#unlimited")).toBeChecked();
      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("room limit help dialog", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toHaveCount(0);

      await page.getByTestId("roles-room-limit-help-button").click();

      await checkRoomLimitHelpDialog(page);

      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toHaveCount(0);
    });

    test("loaded role with unlimited room limit", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.room_limit = -1;

      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#default")).toBeEnabled();
      await expect(page.locator("#unlimited")).toBeChecked();
      await expect(page.locator("#unlimited")).toBeEnabled();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#custom")).toBeEnabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("loaded role with custom room limit", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.room_limit = 5;

      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#default")).toBeEnabled();
      await expect(page.locator("#unlimited")).not.toBeChecked();
      await expect(page.locator("#unlimited")).toBeEnabled();
      await expect(page.locator("#custom")).toBeChecked();
      await expect(page.locator("#custom")).toBeEnabled();
      await expect(page.locator("#room-limit")).toBeVisible();
      await expect(page.locator("#room-limit")).toHaveValue("5");
    });

    test("switch from custom room limit to default", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.room_limit = 5;

      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#room-limit")).toBeVisible();

      await page.locator("#default").click();

      await expect(page.locator("#default")).toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });
  });

  test.describe("permission list", () => {
    test("list header and categories", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await expect(
        page.getByText("admin.roles.permissions_title"),
      ).toBeVisible();

      const list = page.getByTestId("permission-list");
      await expect(list).toBeVisible();
      await expect(list).toContainText("admin.roles.permission_name");
      await expect(list).toContainText("admin.roles.permission_explicit");
      await expect(list).toContainText("admin.roles.permission_included");
      await expect(list.getByTestId("permission-category")).toHaveCount(10);
    });

    test.describe("with included permissions", () => {
      test("change permissions of category rooms", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(0);
        await expect(category).toContainText(
          "admin.roles.permissions.rooms.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(3);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["rooms.create", true, true, false],
          ["rooms.viewAll", true, true, false],
          ["rooms.manage", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            0 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#rooms\\.manage").click();
        await page.locator("#rooms\\.create").click();
        await page.locator("#rooms\\.view_all").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["rooms.create", false, true, false],
          ["rooms.viewAll", false, true, false],
          ["rooms.manage", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            0 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category meetings", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(1);
        await expect(category).toContainText(
          "admin.roles.permissions.meetings.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(1);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["meetings.viewAny", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            3 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#meetings\\.view_any").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["meetings.viewAny", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            3 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category admin", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(2);
        await expect(category).toContainText(
          "admin.roles.permissions.admin.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(1);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["admin.view", false, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            4 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#admin\\.view").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["admin.view", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            4 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category settings", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(3);
        await expect(category).toContainText(
          "admin.roles.permissions.settings.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(2);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["settings.viewAny", false, false, false],
          ["settings.update", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            5 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#settings\\.update").click();
        await page.locator("#settings\\.view_any").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["settings.viewAny", true, true, false],
          ["settings.update", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            5 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category system", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(4);
        await expect(category).toContainText(
          "admin.roles.permissions.system.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(1);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["system.monitor", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            7 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#system\\.monitor").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["system.monitor", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            7 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category users", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(5);
        await expect(category).toContainText(
          "admin.roles.permissions.users.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(6);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["users.viewAny", true, true, false],
          ["users.view", false, false, false],
          ["users.update", false, false, false],
          ["users.create", false, false, false],
          ["users.delete", false, false, false],
          ["users.updateOwnAttributes", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            8 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#users\\.update_own_attributes").click();
        await page.locator("#users\\.delete").click();
        await page.locator("#users\\.create").click();
        await page.locator("#users\\.update").click();
        await page.locator("#users\\.view").click();
        await page.locator("#users\\.view_any").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["users.viewAny", false, true, false],
          ["users.view", true, true, false],
          ["users.update", true, true, false],
          ["users.create", true, true, false],
          ["users.delete", true, true, false],
          ["users.updateOwnAttributes", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            8 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category roles", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(6);
        await expect(category).toContainText(
          "admin.roles.permissions.roles.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(5);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["roles.viewAny", false, true, false],
          ["roles.view", false, false, false],
          ["roles.update", false, false, false],
          ["roles.create", false, false, false],
          ["roles.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            14 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#roles\\.delete").click();
        await page.locator("#roles\\.create").click();
        await page.locator("#roles\\.update").click();
        await page.locator("#roles\\.view").click();
        await page.locator("#roles\\.view_any").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["roles.viewAny", true, true, false],
          ["roles.view", true, true, false],
          ["roles.update", true, true, false],
          ["roles.create", true, true, false],
          ["roles.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            14 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category room_types", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(7);
        await expect(category).toContainText(
          "admin.roles.permissions.room_types.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(4);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["roomTypes.view", false, true, false],
          ["roomTypes.update", true, true, false],
          ["roomTypes.create", true, true, false],
          ["roomTypes.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            19 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#room_types\\.delete").click();
        await page.locator("#room_types\\.create").click();
        await page.locator("#room_types\\.update").click();
        await page.locator("#room_types\\.view").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["roomTypes.view", true, true, false],
          ["roomTypes.update", false, false, false],
          ["roomTypes.create", false, false, false],
          ["roomTypes.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            19 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category servers", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(8);
        await expect(category).toContainText(
          "admin.roles.permissions.servers.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(5);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["servers.viewAny", false, false, false],
          ["servers.view", false, false, false],
          ["servers.update", false, false, false],
          ["servers.create", false, false, false],
          ["servers.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            23 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#servers\\.delete").click();
        await page.locator("#servers\\.create").click();
        await page.locator("#servers\\.update").click();
        await page.locator("#servers\\.view").click();
        await page.locator("#servers\\.view_any").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["servers.viewAny", true, true, false],
          ["servers.view", true, true, false],
          ["servers.update", true, true, false],
          ["servers.create", true, true, false],
          ["servers.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            23 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category server_pools", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const category = page.getByTestId("permission-category").nth(9);
        await expect(category).toContainText(
          "admin.roles.permissions.server_pools.title",
        );
        await expect(category.getByTestId("permission-group")).toHaveCount(5);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["serverPools.viewAny", false, true, false],
          ["serverPools.view", false, false, false],
          ["serverPools.update", false, false, false],
          ["serverPools.create", false, false, false],
          ["serverPools.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            28 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }

        await page.locator("#server_pools\\.delete").click();
        await page.locator("#server_pools\\.create").click();
        await page.locator("#server_pools\\.update").click();
        await page.locator("#server_pools\\.view").click();
        await page.locator("#server_pools\\.view_any").click();

        for (const [index, [permission, explicit, included, disabled]] of [
          ["serverPools.viewAny", true, true, false],
          ["serverPools.view", true, true, false],
          ["serverPools.update", true, true, false],
          ["serverPools.create", true, true, false],
          ["serverPools.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            28 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });
    });

    test.describe("without included permissions", () => {
      test.beforeEach(async ({ roleResponse, permissionsResponse }) => {
        for (const permission of permissionsResponse.data) {
          permission.included_permissions = [];
        }
        roleResponse.data.permissions = [];
      });

      test("initial permissions of category rooms", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["rooms.create", false, false, false],
          ["rooms.viewAll", false, false, false],
          ["rooms.manage", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            0 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category rooms", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#rooms\\.manage").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["rooms.create", false, false, false],
          ["rooms.viewAll", false, false, false],
          ["rooms.manage", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            0 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category meetings", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["meetings.viewAny", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            3 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category admin", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["admin.view", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            4 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category settings", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["settings.viewAny", false, false, false],
          ["settings.update", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            5 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category settings", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#settings\\.update").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["settings.viewAny", false, false, false],
          ["settings.update", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            5 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category system", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["system.monitor", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            7 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category users", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["users.viewAny", false, false, false],
          ["users.view", false, false, false],
          ["users.update", false, false, false],
          ["users.create", false, false, false],
          ["users.delete", false, false, false],
          ["users.updateOwnAttributes", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            8 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category users", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#users\\.delete").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["users.viewAny", false, false, false],
          ["users.view", false, false, false],
          ["users.update", false, false, false],
          ["users.create", false, false, false],
          ["users.delete", true, true, false],
          ["users.updateOwnAttributes", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            8 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category roles", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["roles.viewAny", false, false, false],
          ["roles.view", false, false, false],
          ["roles.update", false, false, false],
          ["roles.create", false, false, false],
          ["roles.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            14 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category roles", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#roles\\.delete").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["roles.viewAny", false, false, false],
          ["roles.view", false, false, false],
          ["roles.update", false, false, false],
          ["roles.create", false, false, false],
          ["roles.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            14 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category room_types", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["roomTypes.view", false, false, false],
          ["roomTypes.update", false, false, false],
          ["roomTypes.create", false, false, false],
          ["roomTypes.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            19 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category room_types", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#room_types\\.delete").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["roomTypes.view", false, false, false],
          ["roomTypes.update", false, false, false],
          ["roomTypes.create", false, false, false],
          ["roomTypes.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            19 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category servers", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["servers.viewAny", false, false, false],
          ["servers.view", false, false, false],
          ["servers.update", false, false, false],
          ["servers.create", false, false, false],
          ["servers.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            23 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category servers", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#servers\\.delete").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["servers.viewAny", false, false, false],
          ["servers.view", false, false, false],
          ["servers.update", false, false, false],
          ["servers.create", false, false, false],
          ["servers.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            23 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("initial permissions of category server_pools", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        for (const [index, [permission, explicit, included, disabled]] of [
          ["serverPools.viewAny", false, false, false],
          ["serverPools.view", false, false, false],
          ["serverPools.update", false, false, false],
          ["serverPools.create", false, false, false],
          ["serverPools.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            28 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("change permissions of category server_pools", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#server_pools\\.delete").click();

        // Only the clicked permission changes, nothing is included by it
        for (const [index, [permission, explicit, included, disabled]] of [
          ["serverPools.viewAny", false, false, false],
          ["serverPools.view", false, false, false],
          ["serverPools.update", false, false, false],
          ["serverPools.create", false, false, false],
          ["serverPools.delete", true, true, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            28 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });
    });

    test.describe("with restricted permissions", () => {
      test.beforeEach(async ({ roleResponse }) => {
        roleResponse.data.permissions = [];
      });

      test("restrictions for servers, server pools and system", async ({
        page,
        permissionsResponse,
      }) => {
        permissionsResponse.meta.restrictions = [
          "servers.*",
          "system.monitor",
          "serverPools.viewAny",
          "serverPools.view",
          "serverPools.create",
          "serverPools.update",
          "serverPools.delete",
        ];

        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const list = page.getByTestId("permission-list");
        await expect(list).toContainText("admin.roles.permission_name");
        await expect(list).toContainText("admin.roles.permission_explicit");
        await expect(list).toContainText("admin.roles.permission_included");
        await expect(list.getByTestId("permission-category")).toHaveCount(10);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["rooms.create", false, false, false],
          ["rooms.viewAll", false, false, false],
          ["rooms.manage", false, false, false],
          ["meetings.viewAny", false, false, false],
          ["admin.view", false, false, false],
          ["settings.viewAny", false, false, false],
          ["settings.update", false, false, false],
          ["system.monitor", false, false, true],
          ["users.viewAny", false, false, false],
          ["users.view", false, false, false],
          ["users.update", false, false, false],
          ["users.create", false, false, false],
          ["users.delete", false, false, false],
          ["users.updateOwnAttributes", false, false, false],
          ["roles.viewAny", false, false, false],
          ["roles.view", false, false, false],
          ["roles.update", false, false, false],
          ["roles.create", false, false, false],
          ["roles.delete", false, false, false],
          ["roomTypes.view", false, false, false],
          ["roomTypes.update", false, false, false],
          ["roomTypes.create", false, false, false],
          ["roomTypes.delete", false, false, false],
          ["servers.viewAny", false, false, true],
          ["servers.view", false, false, true],
          ["servers.update", false, false, true],
          ["servers.create", false, false, true],
          ["servers.delete", false, false, true],
          ["serverPools.viewAny", false, false, true],
          ["serverPools.view", false, false, true],
          ["serverPools.update", false, false, true],
          ["serverPools.create", false, false, true],
          ["serverPools.delete", false, false, true],
        ].entries()) {
          await checkPermissionGroup(
            page,
            0 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("select permission that includes restricted permission", async ({
        page,
        permissionsResponse,
      }) => {
        permissionsResponse.meta.restrictions = [
          "servers.*",
          "system.monitor",
          "serverPools.viewAny",
          "serverPools.view",
          "serverPools.create",
          "serverPools.update",
          "serverPools.delete",
        ];

        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        await page.locator("#room_types\\.delete").click();

        // The restricted permission is included by the selected one, but can not be changed
        for (const [index, [permission, explicit, included, disabled]] of [
          ["serverPools.viewAny", false, true, true],
          ["serverPools.view", false, false, true],
          ["serverPools.update", false, false, true],
          ["serverPools.create", false, false, true],
          ["serverPools.delete", false, false, true],
        ].entries()) {
          await checkPermissionGroup(
            page,
            28 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });

      test("restrictions for the other categories", async ({
        page,
        permissionsResponse,
      }) => {
        permissionsResponse.meta.restrictions = [
          "rooms.*",
          "meetings.viewAny",
          "admin.view",
          "settings.*",
          "users.*",
          "roles.*",
          "roomTypes.*",
        ];

        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const list = page.getByTestId("permission-list");
        await expect(list).toContainText("admin.roles.permission_name");
        await expect(list).toContainText("admin.roles.permission_explicit");
        await expect(list).toContainText("admin.roles.permission_included");
        await expect(list.getByTestId("permission-category")).toHaveCount(10);

        for (const [index, [permission, explicit, included, disabled]] of [
          ["rooms.create", false, false, true],
          ["rooms.viewAll", false, false, true],
          ["rooms.manage", false, false, true],
          ["meetings.viewAny", false, false, true],
          ["admin.view", false, false, true],
          ["settings.viewAny", false, false, true],
          ["settings.update", false, false, true],
          ["system.monitor", false, false, false],
          ["users.viewAny", false, false, true],
          ["users.view", false, false, true],
          ["users.update", false, false, true],
          ["users.create", false, false, true],
          ["users.delete", false, false, true],
          ["users.updateOwnAttributes", false, false, true],
          ["roles.viewAny", false, false, true],
          ["roles.view", false, false, true],
          ["roles.update", false, false, true],
          ["roles.create", false, false, true],
          ["roles.delete", false, false, true],
          ["roomTypes.view", false, false, true],
          ["roomTypes.update", false, false, true],
          ["roomTypes.create", false, false, true],
          ["roomTypes.delete", false, false, true],
          ["servers.viewAny", false, false, false],
          ["servers.view", false, false, false],
          ["servers.update", false, false, false],
          ["servers.create", false, false, false],
          ["servers.delete", false, false, false],
          ["serverPools.viewAny", false, false, false],
          ["serverPools.view", false, false, false],
          ["serverPools.update", false, false, false],
          ["serverPools.create", false, false, false],
          ["serverPools.delete", false, false, false],
        ].entries()) {
          await checkPermissionGroup(
            page,
            0 + index,
            permission,
            explicit,
            included,
            disabled,
          );
        }
      });
    });
  });

  test.describe("save", () => {
    test("loading state while saving", async ({ page, roleResponse }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.locator("#rooms\\.create")).toBeVisible();
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
        json: roleResponse,
        hold: true,
      });

      await expect(page.getByTestId("roles-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("roles-save-button").click();

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();

      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#default")).toBeDisabled();
      await expect(page.locator("#unlimited")).toBeDisabled();
      await expect(page.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);

      // Permission list is not shown while saving
      await expect(page.getByTestId("permission-group")).toHaveCount(0);

      const cancelButton = page.getByTestId("roles-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveJSProperty("tagName", "BUTTON");
      await expect(cancelButton).toBeDisabled();
      await expect(page.getByTestId("roles-delete-button")).toBeDisabled();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();

      putRoleApiMock.release();

      // Check that role page is shown
      await expect(page).toHaveURL(/\/admin\/roles\/2$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Staff"}',
      );
      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test("loading state while saving with custom room limit", async ({
      page,
    }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await page.locator("#custom").click();
      await expect(page.locator("#room-limit")).toBeVisible();

      const role = readFixture("role.json");
      role.data.room_limit = 5;
      const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
        json: role,
        hold: true,
      });

      await page.getByTestId("roles-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#default")).toBeDisabled();
      await expect(page.locator("#unlimited")).toBeDisabled();
      await expect(page.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toBeDisabled();

      putRoleApiMock.release();

      await expect(page).toHaveURL(/\/admin\/roles\/2$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Staff"}',
      );
    });

    test("save changed name, room limit and permissions", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await page.locator("#name").fill("Standard role");
      await page.locator("#unlimited").click();

      await page.locator("#rooms\\.manage").click();
      await page.locator("#rooms\\.create").click();
      await page.locator("#rooms\\.view_all").click();
      await page.locator("#meetings\\.view_any").click();
      await page.locator("#admin\\.view").click();
      await page.locator("#settings\\.update").click();
      await page.locator("#settings\\.view_any").click();
      await page.locator("#system\\.monitor").click();
      await page.locator("#users\\.update_own_attributes").click();
      await page.locator("#users\\.delete").click();
      await page.locator("#users\\.create").click();
      await page.locator("#users\\.update").click();
      await page.locator("#users\\.view").click();
      await page.locator("#users\\.view_any").click();
      await page.locator("#roles\\.delete").click();
      await page.locator("#roles\\.create").click();
      await page.locator("#roles\\.update").click();
      await page.locator("#roles\\.view").click();
      await page.locator("#roles\\.view_any").click();
      await page.locator("#room_types\\.delete").click();
      await page.locator("#room_types\\.create").click();
      await page.locator("#room_types\\.update").click();
      await page.locator("#room_types\\.view").click();
      await page.locator("#servers\\.delete").click();
      await page.locator("#servers\\.create").click();
      await page.locator("#servers\\.update").click();
      await page.locator("#servers\\.view").click();
      await page.locator("#servers\\.view_any").click();
      await page.locator("#server_pools\\.delete").click();
      await page.locator("#server_pools\\.create").click();
      await page.locator("#server_pools\\.update").click();
      await page.locator("#server_pools\\.view").click();
      await page.locator("#server_pools\\.view_any").click();

      const role = readFixture("superuserRole.json");
      role.data.name = "Standard role";
      role.data.room_limit = -1;
      role.data.superuser = false;
      const selectedPermissions = [
        5, 7, 9, 8, 35, 20, 19, 18, 17, 16, 14, 13, 12, 11, 10, 21, 29, 28, 27,
        26, 25, 34, 33, 32, 31, 30,
      ];
      role.data.permissions = role.data.permissions.filter((permission) =>
        selectedPermissions.includes(permission.id),
      );
      await mockApiRequest(page, "GET", "roles/2", { json: role });
      const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
        json: role,
      });

      await page.getByTestId("roles-save-button").click();

      await expect(putRoleApiMock).toHaveReceivedRequest({
        json: {
          name: "Standard role",
          room_limit: -1,
          permissions: selectedPermissions,
          updated_at: role.data.updated_at,
        },
      });

      // Check that role page is shown
      await expect(page).toHaveURL(/\/admin\/roles\/2$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Standard role"}',
      );
      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test("save custom room limit", async ({ page, roleResponse }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await page.locator("#custom").click();
      await expect(page.locator("#room-limit")).toHaveValue("0");
      await page.locator("#room-limit").fill("5");

      roleResponse.data.room_limit = 5;
      const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
        json: roleResponse,
      });

      await page.getByTestId("roles-save-button").click();

      await expect(putRoleApiMock).toHaveReceivedRequest({
        json: {
          name: "Staff",
          room_limit: 5,
          permissions: roleResponse.data.permissions.map(
            (permission) => permission.id,
          ),
          updated_at: roleResponse.data.updated_at,
        },
      });

      await expect(page).toHaveURL(/\/admin\/roles\/2$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Staff"}',
      );
    });

    test("save unlimited room limit without changing it", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.room_limit = -1;
      const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
        json: roleResponse,
      });

      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#unlimited")).toBeChecked();

      await page.getByTestId("roles-save-button").click();

      await expect(putRoleApiMock).toHaveReceivedRequest({
        json: {
          name: "Staff",
          room_limit: -1,
          permissions: roleResponse.data.permissions.map(
            (permission) => permission.id,
          ),
          updated_at: roleResponse.data.updated_at,
        },
      });

      await expect(page).toHaveURL(/\/admin\/roles\/2$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Staff"}',
      );
    });

    test("save default room limit after switching from custom", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.room_limit = 5;

      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#room-limit")).toHaveValue("5");
      await page.locator("#default").click();
      await expect(page.locator("#room-limit")).toHaveCount(0);

      roleResponse.data.room_limit = null;
      const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
        json: roleResponse,
      });

      await page.getByTestId("roles-save-button").click();

      await expect(putRoleApiMock).toHaveReceivedRequest({
        json: {
          name: "Staff",
          room_limit: null,
          permissions: roleResponse.data.permissions.map(
            (permission) => permission.id,
          ),
          updated_at: roleResponse.data.updated_at,
        },
      });

      await expect(page).toHaveURL(/\/admin\/roles\/2$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Staff"}',
      );
    });
  });

  test.describe("save errors", () => {
    test("validation errors", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await mockApiRequest(
        page,
        "PUT",
        "roles/2",
        validationErrors(
          {
            name: ["The Name field is required."],
            room_limit: ["The Room limit must be at least -1."],
            permissions: ["The Permissions field must be present."],
          },
          "The name field is required. (and 2 more errors)",
        ),
      );

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(
        page,
        "The name field is required. (and 2 more errors)",
      );

      await expect(page.getByTestId("name-field")).toContainText(
        "The Name field is required.",
      );
      await expect(page.getByTestId("room-limit-field")).toContainText(
        "The Room limit must be at least -1.",
      );
      await expect(
        page.getByText("The Permissions field must be present."),
      ).toBeVisible();
    });

    test("validation errors are hidden after a server error", async ({
      page,
    }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await mockApiRequest(
        page,
        "PUT",
        "roles/2",
        validationErrors(
          {
            name: ["The Name field is required."],
            room_limit: ["The Room limit must be at least -1."],
            permissions: ["The Permissions field must be present."],
          },
          "The name field is required. (and 2 more errors)",
        ),
      );

      await page.getByTestId("roles-save-button").click();
      await expectToastAndClose(
        page,
        "The name field is required. (and 2 more errors)",
      );
      await expect(page.getByTestId("name-field")).toContainText(
        "The Name field is required.",
      );

      await mockApiRequest(page, "PUT", "roles/2", serverError());

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that 422 error messages are hidden
      await expect(page.getByTestId("name-field")).toBeVisible();
      await expect(page.getByTestId("name-field")).not.toContainText(
        "The Name field is required.",
      );
      await expect(page.getByTestId("room-limit-field")).toBeVisible();
      await expect(page.getByTestId("room-limit-field")).not.toContainText(
        "The Room limit must be at least -1.",
      );
      await expect(
        page.getByText("The Permissions field must be present."),
      ).toHaveCount(0);
    });

    test("server error", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await mockApiRequest(page, "PUT", "roles/2", serverError());

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test.describe("stale model", () => {
      test("dialog is shown", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const role = readFixture("role.json");
        role.data.name = "Standard role";
        role.data.room_limit = -1;
        await mockApiRequest(page, "PUT", "roles/2", {
          status: 428,
          json: { new_model: role.data, message: "stale_model" },
        });

        await expect(page.getByTestId("stale-role-dialog")).toHaveCount(0);

        await page.getByTestId("roles-save-button").click();

        const dialog = page.getByTestId("stale-role-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.role"}',
        );
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("reload with the new data", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const role = readFixture("role.json");
        role.data.name = "Standard role";
        role.data.room_limit = -1;
        await mockApiRequest(page, "PUT", "roles/2", {
          status: 428,
          json: { new_model: role.data, message: "stale_model" },
        });

        await page.getByTestId("roles-save-button").click();
        await expect(page.getByTestId("stale-role-dialog")).toBeVisible();
        await expect(page.getByTestId("stale-role-dialog")).toContainText(
          "app.errors.stale_error",
        );
        await expect(
          page
            .getByTestId("stale-role-dialog")
            .getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          page
            .getByTestId("stale-role-dialog")
            .getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
        await page.getByTestId("stale-dialog-reject-button").click();

        await expect(page.getByTestId("stale-role-dialog")).toHaveCount(0);

        // Check that breadcrumbs is updated
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.roles.index",
          'admin.breadcrumbs.roles.edit_{"name":"Standard role"}',
        );

        // Check that correct data is shown
        await expect(page.locator("#name")).toHaveValue("Standard role");
        await expect(page.locator("#unlimited")).toBeChecked();
        await expect(page.locator("#room-limit")).toHaveCount(0);
        await checkPermissionGroup(page, 0, "rooms.create", true, true, false);
        await checkPermissionGroup(page, 1, "rooms.viewAll", true, true, false);
        await checkPermissionGroup(
          page,
          2,
          "rooms.manage",
          false,
          false,
          false,
        );
      });

      test("overwrite", async ({ page }) => {
        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        // First stale error, reload to get the new data
        const reloadedRole = readFixture("role.json");
        reloadedRole.data.name = "Standard role";
        reloadedRole.data.room_limit = -1;
        await mockApiRequest(page, "PUT", "roles/2", {
          status: 428,
          json: { new_model: reloadedRole.data, message: "stale_model" },
        });

        await page.getByTestId("roles-save-button").click();
        await expect(page.getByTestId("stale-role-dialog")).toBeVisible();
        await expect(page.getByTestId("stale-role-dialog")).toContainText(
          "app.errors.stale_error",
        );
        await expect(
          page
            .getByTestId("stale-role-dialog")
            .getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          page
            .getByTestId("stale-role-dialog")
            .getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.locator("#name")).toHaveValue("Standard role");

        // Trigger the stale error again
        const newerRole = readFixture("superuserRole.json");
        newerRole.data.name = "Standard role 2";
        newerRole.data.room_limit = -1;
        newerRole.data.superuser = false;
        await mockApiRequest(page, "PUT", "roles/2", {
          status: 428,
          json: { new_model: newerRole.data, message: "stale_model" },
        });

        await expect(page.getByTestId("stale-role-dialog")).toHaveCount(0);
        await page.getByTestId("roles-save-button").click();
        await expect(page.getByTestId("stale-role-dialog")).toBeVisible();
        await expect(page.getByTestId("stale-role-dialog")).toContainText(
          "app.errors.stale_error",
        );
        await expect(
          page
            .getByTestId("stale-role-dialog")
            .getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          page
            .getByTestId("stale-role-dialog")
            .getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");

        // Overwrite
        await mockApiRequest(page, "GET", "roles/2", {
          json: reloadedRole,
        });
        const putRoleApiMock = await mockApiRequest(page, "PUT", "roles/2", {
          json: reloadedRole,
        });

        await page.getByTestId("stale-dialog-accept-button").click();

        // Check that correct data is sent
        await expect(putRoleApiMock).toHaveReceivedRequest({
          json: {
            name: "Standard role",
            room_limit: -1,
            permissions: reloadedRole.data.permissions.map(
              (permission) => permission.id,
            ),
            updated_at: reloadedRole.data.updated_at,
          },
        });

        // Check that redirect worked
        await expect(page).toHaveURL(/\/admin\/roles\/2$/);
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.roles.index",
          'admin.breadcrumbs.roles.view_{"name":"Standard role"}',
        );
      });
    });

    test("role not found", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await mockApiRequest(page, "PUT", "roles/2", modelNotFound("role", [2]));

      await page.getByTestId("roles-save-button").click();

      // Check that redirect to the roles index worked and the error is shown
      await expect(page).toHaveURL((url) => url.pathname === "/admin/roles");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("unauthenticated", async ({ page }) => {
      await page.goto("/admin/roles/2/edit");
      await expect(page.locator("#name")).toHaveValue("Staff");

      await mockApiRequest(page, "PUT", "roles/2", { status: 401 });

      await page.getByTestId("roles-save-button").click();

      await expectLoginRedirect(page, "/admin/roles/2/edit");
    });
  });

  test.describe("load errors", () => {
    test("permissions request fails and can be retried", async ({
      page,
      roleResponse,
      permissionsResponse,
    }) => {
      const getPermissionsApiMock = await mockApiRequest(
        page,
        "GET",
        "permissions",
        serverError({ hold: true }),
      );

      await page.goto("/admin/roles/2/edit");

      // Check loading
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);

      getPermissionsApiMock.release();

      // Check that error message is shown
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that overlay is still shown because of error
      await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();

      // Reload with correct data
      const getRoleApiMock = await mockApiRequest(page, "GET", "roles/2", {
        json: roleResponse,
      });
      const getPermissionsApiMock2 = await mockApiRequest(
        page,
        "GET",
        "permissions",
        {
          json: permissionsResponse,
        },
      );

      await expect(page.getByTestId("loading-retry-button")).toHaveText(
        "app.reload",
      );
      await page.getByTestId("loading-retry-button").click();
      await getRoleApiMock.waitForRequest();
      await getPermissionsApiMock2.waitForRequest();

      // Check that overlay is not shown anymore
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("permissions request unauthenticated", async ({ page }) => {
      await mockApiRequest(page, "GET", "permissions", { status: 401 });

      await page.goto("/admin/roles/2/edit");

      await expectLoginRedirect(page, "/admin/roles/2/edit");
    });

    test("role request fails and can be retried", async ({
      page,
      roleResponse,
      permissionsResponse,
    }) => {
      await mockApiRequest(page, "GET", "roles/2", serverError());

      await page.goto("/admin/roles/2/edit");

      // Check that overlay is shown
      await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();

      // Check that error message is shown
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      const getRoleApiMock = await mockApiRequest(page, "GET", "roles/2", {
        json: roleResponse,
      });
      const getPermissionsApiMock = await mockApiRequest(
        page,
        "GET",
        "permissions",
        {
          json: permissionsResponse,
        },
      );

      await expect(page.getByTestId("loading-retry-button")).toHaveText(
        "app.reload",
      );
      await page.getByTestId("loading-retry-button").click();
      await getRoleApiMock.waitForRequest();
      await getPermissionsApiMock.waitForRequest();

      // Check that overlay is not shown anymore
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("role not found", async ({ page }) => {
      await mockApiRequest(page, "GET", "roles/2", modelNotFound("role", [2]));

      await page.goto("/admin/roles/2/edit");

      await expect(page).toHaveURL((url) => url.pathname === "/admin/roles");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("role request unauthenticated", async ({ page }) => {
      await mockApiRequest(page, "GET", "roles/2", {
        status: 401,
        json: {},
      });

      await page.goto("/admin/roles/2/edit");

      await expectLoginRedirect(page, "/admin/roles/2/edit");
    });
  });

  for (const userIsSuperuser of [true, false]) {
    test.describe(`user is ${userIsSuperuser ? "" : "not "}superuser`, () => {
      test.beforeEach(({ currentUserResponse }) => {
        currentUserResponse.data.superuser = userIsSuperuser;
      });

      test("role that is not a superuser role is editable", async ({
        page,
        roleResponse,
      }) => {
        roleResponse.data.room_limit = 5;

        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Staff");

        const cancelButton = page.getByTestId("roles-cancel-edit-button");
        await expect(cancelButton).toBeVisible();
        await expect(cancelButton).toBeEnabled();
        await expect(cancelButton).toContainText("app.cancel_editing");
        await expect(cancelButton).toHaveAttribute("href", "/admin/roles/2");
        await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
        await expect(page.getByTestId("roles-delete-button")).toBeVisible();
        await expect(page.getByTestId("roles-delete-button")).toBeEnabled();
        await expect(page.getByTestId("roles-save-button")).toBeVisible();
        await expect(page.getByTestId("roles-save-button")).toBeEnabled();
        await expect(page.getByTestId("roles-save-button")).toContainText(
          "app.save",
        );

        // Check name and room limit field not disabled
        await expect(page.locator("#name")).toBeEnabled();
        await expect(page.locator("#default")).toBeEnabled();
        await expect(page.locator("#unlimited")).toBeEnabled();
        await expect(page.locator("#custom")).toBeEnabled();
        await expect(page.locator("#room-limit")).toBeEnabled();

        // Check permission list not disabled
        const checkboxes = page
          .getByTestId("permission-group")
          .getByRole("checkbox");
        await expect(checkboxes).toHaveCount(33);
        for (const checkbox of await checkboxes.all()) {
          await expect(checkbox).toBeEnabled();
        }
      });

      test("superuser role is only partly editable", async ({ page }) => {
        await mockApiRequest(page, "GET", "roles/2", {
          json: readFixture("superuserRole.json"),
        });

        await page.goto("/admin/roles/2/edit");
        await expect(page.locator("#name")).toHaveValue("Superuser");

        const cancelButton = page.getByTestId("roles-cancel-edit-button");
        await expect(cancelButton).toBeVisible();
        await expect(cancelButton).toBeEnabled();
        await expect(cancelButton).toContainText("app.cancel_editing");
        await expect(cancelButton).toHaveAttribute("href", "/admin/roles/2");
        await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
        await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
        await expect(page.getByTestId("roles-save-button")).toBeVisible();
        await expect(page.getByTestId("roles-save-button")).toBeEnabled();
        await expect(page.getByTestId("roles-save-button")).toContainText(
          "app.save",
        );

        // Check name field not disabled
        await expect(page.locator("#name")).toBeEnabled();

        // Check room limit field is disabled
        await expect(page.locator("#default")).toBeDisabled();
        await expect(page.locator("#unlimited")).toBeDisabled();
        await expect(page.locator("#custom")).toBeDisabled();
        await expect(page.locator("#room-limit")).toHaveCount(0);

        // Check permission list is shown correctly and disabled
        await expect(
          page.getByText("admin.roles.permissions_title"),
        ).toBeVisible();
        const checkboxes = page
          .getByTestId("permission-group")
          .getByRole("checkbox");
        await expect(checkboxes).toHaveCount(33);
        for (const checkbox of await checkboxes.all()) {
          await expect(checkbox).toBeChecked();
          await expect(checkbox).toBeDisabled();
        }
      });
    });
  }
});
