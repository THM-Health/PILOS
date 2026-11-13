import { mergeTests } from "@playwright/test";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as permissionControllerTest } from "../support/fixtures/permissionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  checkPermissionGroup,
  checkRoomLimitHelpDialog,
  expectAdminBreadcrumbs,
} from "../support/admin.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  mockApiRequest,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(roleControllerTest, permissionControllerTest);

test.describe("Admin roles view", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
    ];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/roles/2");
  });

  test("visit with user without permission to view roles", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = ["admin.view", "roles.viewAny"];

    await page.goto("/admin/roles/2");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/roles\/2/);
  });

  test.describe("loading and display", () => {
    // [permission, explicit, included]; `includedWithoutDependencies` overrides included for the dependency test
    const categories = [
      {
        key: "rooms",
        groups: [
          ["rooms.create", true, true],
          ["rooms.viewAll", true, true],
          ["rooms.manage", false, false],
        ],
      },
      { key: "meetings", groups: [["meetings.viewAny", true, true]] },
      { key: "admin", groups: [["admin.view", false, true]] },
      {
        key: "settings",
        groups: [
          ["settings.viewAny", false, false],
          ["settings.update", false, false],
        ],
      },
      { key: "system", groups: [["system.monitor", false, false]] },
      {
        key: "users",
        groups: [
          ["users.viewAny", true, true],
          ["users.view", false, false],
          ["users.update", false, false],
          ["users.create", false, false],
          ["users.delete", false, false],
          ["users.updateOwnAttributes", false, false],
        ],
      },
      {
        key: "roles",
        groups: [
          ["roles.viewAny", false, true],
          ["roles.view", false, false],
          ["roles.update", false, false],
          ["roles.create", false, false],
          ["roles.delete", false, false],
        ],
      },
      {
        key: "room_types",
        groups: [
          ["roomTypes.view", false, true, false],
          ["roomTypes.update", true, true],
          ["roomTypes.create", true, true],
          ["roomTypes.delete", true, true],
        ],
      },
      {
        key: "servers",
        groups: [
          ["servers.viewAny", false, false],
          ["servers.view", false, false],
          ["servers.update", false, false],
          ["servers.create", false, false],
          ["servers.delete", false, false],
        ],
      },
      {
        key: "server_pools",
        groups: [
          ["serverPools.viewAny", false, true, false],
          ["serverPools.view", false, false],
          ["serverPools.update", false, false],
          ["serverPools.create", false, false],
          ["serverPools.delete", false, false],
        ],
      },
    ];

    test("loading state hides buttons until the role is loaded", async ({
      page,
      roleResponse,
    }) => {
      const getRoleApiMock = await mockApiRequest(page, "GET", "roles/2", {
        hold: true,
        json: roleResponse,
      });

      await page.goto("/admin/roles/2");

      await expect(page.getByText("admin.title").first()).toBeVisible();

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      getRoleApiMock.release();

      // Check that loading is done
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      // Check that buttons are still hidden
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);
    });

    test("breadcrumbs and role data", async ({ page }) => {
      await page.goto("/admin/roles/2");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Staff"}',
      );

      const nameField = page.getByTestId("name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("app.model_name");
      await expect(nameField.locator("#name")).toHaveValue("Staff");
      await expect(nameField.locator("#name")).toBeDisabled();

      const roomLimit = page.getByTestId("room-limit-field");
      await expect(roomLimit).toBeVisible();
      await expect(roomLimit).toContainText("app.room_limit");

      const defaultOption = roomLimit.getByTestId(
        "room-limit-mode-default-field",
      );
      await expect(defaultOption).toBeVisible();
      await expect(defaultOption).toContainText(
        'admin.roles.room_limit.default_{"value":"app.unlimited"}',
      );
      await expect(defaultOption.locator("#default")).toBeChecked();
      await expect(defaultOption.locator("#default")).toBeDisabled();

      const unlimitedOption = roomLimit.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedOption).toBeVisible();
      await expect(unlimitedOption).toContainText("app.unlimited");
      await expect(unlimitedOption.locator("#unlimited")).not.toBeChecked();
      await expect(unlimitedOption.locator("#unlimited")).toBeDisabled();

      const customOption = roomLimit.getByTestId(
        "room-limit-mode-custom-field",
      );
      await expect(customOption).toBeVisible();
      await expect(customOption).toContainText("admin.roles.room_limit.custom");
      await expect(customOption.locator("#custom")).not.toBeChecked();
      await expect(customOption.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("room limit help dialog", async ({ page }) => {
      await page.goto("/admin/roles/2");

      await expect(page.getByTestId("room-limit-field")).toBeVisible();
      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toHaveCount(0);

      await page.getByTestId("roles-room-limit-help-button").click();

      await checkRoomLimitHelpDialog(page);
      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toHaveCount(0);
    });

    test("permission list header", async ({ page }) => {
      await page.goto("/admin/roles/2");

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

    for (const [categoryIndex, category] of categories.entries()) {
      test(`permissions of category ${category.key}`, async ({ page }) => {
        await page.goto("/admin/roles/2");

        const element = page
          .getByTestId("permission-list")
          .getByTestId("permission-category")
          .nth(categoryIndex);
        await expect(element).toContainText(
          `admin.roles.permissions.${category.key}.title`,
        );
        await expect(element.getByTestId("permission-group")).toHaveCount(
          category.groups.length,
        );

        for (const [
          index,
          [permission, explicit, included],
        ] of category.groups.entries()) {
          await checkPermissionGroup(
            element,
            index,
            permission,
            explicit,
            included,
            true,
          );
        }
      });
    }

    test.describe("without permission dependencies", () => {
      test.beforeEach(async ({ permissionsResponse }) => {
        for (const index of [18, 19, 20, 21]) {
          permissionsResponse.data[index].included_permissions = [];
        }
      });

      test("permission list header", async ({ page }) => {
        await page.goto("/admin/roles/2");

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

      for (const [categoryIndex, category] of categories.entries()) {
        test(`permissions of category ${category.key}`, async ({ page }) => {
          await page.goto("/admin/roles/2");

          const element = page
            .getByTestId("permission-list")
            .getByTestId("permission-category")
            .nth(categoryIndex);
          await expect(element).toContainText(
            `admin.roles.permissions.${category.key}.title`,
          );
          await expect(element.getByTestId("permission-group")).toHaveCount(
            category.groups.length,
          );

          for (const [
            index,
            [permission, explicit, included, includedWithoutDependencies],
          ] of category.groups.entries()) {
            await checkPermissionGroup(
              element,
              index,
              permission,
              explicit,
              includedWithoutDependencies ?? included,
              true,
            );
          }
        });
      }
    });

    test("no permissions available", async ({ page, permissionsResponse }) => {
      permissionsResponse.data = [];

      await page.goto("/admin/roles/2");

      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.locator("#name")).toBeDisabled();
      const roomLimit = page.getByTestId("room-limit-field");
      await expect(roomLimit).toBeVisible();
      await expect(roomLimit).toContainText("app.room_limit");

      const defaultOption = roomLimit.getByTestId(
        "room-limit-mode-default-field",
      );
      await expect(defaultOption).toBeVisible();
      await expect(defaultOption).toContainText(
        'admin.roles.room_limit.default_{"value":"app.unlimited"}',
      );
      await expect(defaultOption.locator("#default")).toBeChecked();
      await expect(defaultOption.locator("#default")).toBeDisabled();

      const unlimitedOption = roomLimit.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedOption).toBeVisible();
      await expect(unlimitedOption).toContainText("app.unlimited");
      await expect(unlimitedOption.locator("#unlimited")).not.toBeChecked();
      await expect(unlimitedOption.locator("#unlimited")).toBeDisabled();

      const customOption = roomLimit.getByTestId(
        "room-limit-mode-custom-field",
      );
      await expect(customOption).toBeVisible();
      await expect(customOption).toContainText("admin.roles.room_limit.custom");
      await expect(customOption.locator("#custom")).not.toBeChecked();
      await expect(customOption.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);

      await expect(
        page.getByText("admin.roles.permissions_title"),
      ).toBeVisible();
      await expect(page.getByText("admin.roles.no_options")).toBeVisible();
      await expect(page.getByTestId("permission-list")).toHaveCount(0);
    });
  });

  test.describe("room limit", () => {
    test.beforeEach(async ({ configResponse }) => {
      configResponse.data.room.limit = 5;
    });

    test("system default", async ({ page }) => {
      await page.goto("/admin/roles/2");

      const roomLimit = page.getByTestId("room-limit-field");
      await expect(roomLimit).toBeVisible();
      await expect(roomLimit).toContainText("app.room_limit");

      const defaultOption = roomLimit.getByTestId(
        "room-limit-mode-default-field",
      );
      await expect(defaultOption).toBeVisible();
      await expect(defaultOption).toContainText(
        'admin.roles.room_limit.default_{"value":5}',
      );
      await expect(defaultOption.locator("#default")).toBeChecked();
      await expect(defaultOption.locator("#default")).toBeDisabled();

      const unlimitedOption = roomLimit.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedOption).toBeVisible();
      await expect(unlimitedOption).toContainText("app.unlimited");
      await expect(unlimitedOption.locator("#unlimited")).not.toBeChecked();
      await expect(unlimitedOption.locator("#unlimited")).toBeDisabled();

      const customOption = roomLimit.getByTestId(
        "room-limit-mode-custom-field",
      );
      await expect(customOption).toBeVisible();
      await expect(customOption).toContainText("admin.roles.room_limit.custom");
      await expect(customOption.locator("#custom")).not.toBeChecked();
      await expect(customOption.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("unlimited", async ({ page, roleResponse }) => {
      roleResponse.data.room_limit = -1;

      await page.goto("/admin/roles/2");

      const roomLimit = page.getByTestId("room-limit-field");
      await expect(roomLimit).toBeVisible();
      await expect(roomLimit).toContainText("app.room_limit");

      const defaultOption = roomLimit.getByTestId(
        "room-limit-mode-default-field",
      );
      await expect(defaultOption).toBeVisible();
      await expect(defaultOption).toContainText(
        'admin.roles.room_limit.default_{"value":5}',
      );
      await expect(defaultOption.locator("#default")).not.toBeChecked();
      await expect(defaultOption.locator("#default")).toBeDisabled();

      const unlimitedOption = roomLimit.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedOption).toBeVisible();
      await expect(unlimitedOption).toContainText("app.unlimited");
      await expect(unlimitedOption.locator("#unlimited")).toBeChecked();
      await expect(unlimitedOption.locator("#unlimited")).toBeDisabled();

      const customOption = roomLimit.getByTestId(
        "room-limit-mode-custom-field",
      );
      await expect(customOption).toBeVisible();
      await expect(customOption).toContainText("admin.roles.room_limit.custom");
      await expect(customOption.locator("#custom")).not.toBeChecked();
      await expect(customOption.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("custom", async ({ page, roleResponse }) => {
      roleResponse.data.room_limit = 2;

      await page.goto("/admin/roles/2");

      const roomLimit = page.getByTestId("room-limit-field");
      await expect(roomLimit).toBeVisible();
      await expect(roomLimit).toContainText("app.room_limit");

      const defaultOption = roomLimit.getByTestId(
        "room-limit-mode-default-field",
      );
      await expect(defaultOption).toBeVisible();
      await expect(defaultOption).toContainText(
        'admin.roles.room_limit.default_{"value":5}',
      );
      await expect(defaultOption.locator("#default")).not.toBeChecked();
      await expect(defaultOption.locator("#default")).toBeDisabled();

      const unlimitedOption = roomLimit.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedOption).toBeVisible();
      await expect(unlimitedOption).toContainText("app.unlimited");
      await expect(unlimitedOption.locator("#unlimited")).not.toBeChecked();
      await expect(unlimitedOption.locator("#unlimited")).toBeDisabled();

      const customOption = roomLimit.getByTestId(
        "room-limit-mode-custom-field",
      );
      await expect(customOption).toBeVisible();
      await expect(customOption).toContainText("admin.roles.room_limit.custom");
      await expect(customOption.locator("#custom")).toBeChecked();
      await expect(customOption.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toBeVisible();
      await expect(page.locator("#room-limit")).toHaveValue("2");
      await expect(page.locator("#room-limit")).toBeDisabled();
    });
  });

  test.describe("load errors", () => {
    test("role request fails and can be retried", async ({
      page,
      roleResponse,
    }) => {
      await mockApiRequest(page, "GET", "roles/2", serverError());

      await page.goto("/admin/roles/2");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("overlay")).toBeVisible();

      // Reload with correct data
      await mockApiRequest(page, "GET", "roles/2", { json: roleResponse });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");
      const roleRetry = page.waitForRequest(
        (r) => r.method() === "GET" && r.url().endsWith("/api/v1/roles/2"),
      );
      const permissionsRetry = page.waitForRequest(
        (r) => r.method() === "GET" && r.url().endsWith("/api/v1/permissions"),
      );
      await retryButton.click();
      await roleRetry;
      await permissionsRetry;

      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("role not found", async ({ page }) => {
      await mockApiRequest(page, "GET", "roles/2", modelNotFound("role", [2]));

      await page.goto("/admin/roles/2");

      // Check that redirect worked
      await expect(page).toHaveURL(/\/admin\/roles$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("role request unauthenticated", async ({ page }) => {
      await mockApiRequest(page, "GET", "roles/2", { status: 401 });

      await page.goto("/admin/roles/2");

      await expectLoginRedirect(page, "/admin/roles/2");
    });

    test("permissions request fails and can be retried", async ({
      page,
      permissionsResponse,
    }) => {
      const getPermissionsApiMock = await mockApiRequest(
        page,
        "GET",
        "permissions",
        serverError({ hold: true }),
      );

      await page.goto("/admin/roles/2");

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      getPermissionsApiMock.release();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that overlay is still shown because of error
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      // Reload with correct data
      await mockApiRequest(page, "GET", "permissions", {
        json: permissionsResponse,
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");
      const roleRetry = page.waitForRequest(
        (r) => r.method() === "GET" && r.url().endsWith("/api/v1/roles/2"),
      );
      const permissionsRetry = page.waitForRequest(
        (r) => r.method() === "GET" && r.url().endsWith("/api/v1/permissions"),
      );
      await retryButton.click();
      await roleRetry;
      await permissionsRetry;

      await expect(page.getByTestId("permission-list")).toBeVisible();
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("permissions request unauthenticated", async ({ page }) => {
      await mockApiRequest(page, "GET", "permissions", { status: 401 });

      await page.goto("/admin/roles/2");

      await expectLoginRedirect(page, "/admin/roles/2");
    });
  });

  test.describe("button visibility", () => {
    test("with update permission", async ({ page, currentUserResponse }) => {
      currentUserResponse.data.permissions.push("roles.update");

      await page.goto("/admin/roles/2");

      const editButton = page.getByTestId("roles-edit-button");
      await expect(editButton).toBeVisible();
      await expect(editButton).toHaveText("app.edit");
      await expect(editButton).toHaveAttribute("href", "/admin/roles/2/edit");
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);
    });

    test("with delete permission", async ({ page, currentUserResponse }) => {
      currentUserResponse.data.permissions.push(
        "roles.update",
        "roles.create",
        "roles.delete",
      );

      await page.goto("/admin/roles/2");

      const editButton = page.getByTestId("roles-edit-button");
      await expect(editButton).toBeVisible();
      await expect(editButton).toHaveText("app.edit");
      await expect(editButton).toHaveAttribute("href", "/admin/roles/2/edit");
      await expect(page.getByTestId("roles-delete-button")).toBeVisible();
      await expect(page.getByTestId("roles-delete-button")).toBeEnabled();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);
    });

    for (const userIsSuperuser of [undefined, false]) {
      test.describe(`user superuser flag ${userIsSuperuser ?? "from fixture"}`, () => {
        test.beforeEach(async ({ currentUserResponse }) => {
          if (userIsSuperuser === false) {
            currentUserResponse.data.superuser = false;
          }
          currentUserResponse.data.permissions.push(
            "roles.create",
            "roles.update",
            "roles.delete",
          );
        });

        test("role is not a superuser role", async ({ page }) => {
          await page.goto("/admin/roles/2");

          const editButton = page.getByTestId("roles-edit-button");
          await expect(editButton).toBeVisible();
          await expect(editButton).toBeEnabled();
          await expect(editButton).toContainText("app.edit");
          await expect(editButton).toHaveAttribute(
            "href",
            "/admin/roles/2/edit",
          );
          await expect(page.getByTestId("roles-delete-button")).toBeVisible();
          await expect(page.getByTestId("roles-delete-button")).toBeEnabled();
          await expect(
            page.getByTestId("roles-cancel-edit-button"),
          ).toHaveCount(0);
        });

        test("role is a superuser role", async ({ page, roleResponse }) => {
          roleResponse.data.superuser = true;

          await page.goto("/admin/roles/2");

          const editButton = page.getByTestId("roles-edit-button");
          await expect(editButton).toBeVisible();
          await expect(editButton).toBeEnabled();
          await expect(editButton).toContainText("app.edit");
          await expect(editButton).toHaveAttribute(
            "href",
            "/admin/roles/2/edit",
          );
          await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
          await expect(
            page.getByTestId("roles-cancel-edit-button"),
          ).toHaveCount(0);
        });
      });
    }
  });
});
