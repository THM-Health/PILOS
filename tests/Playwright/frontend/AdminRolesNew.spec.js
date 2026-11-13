import { mergeTests } from "@playwright/test";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as permissionControllerTest } from "../support/fixtures/permissionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  checkRoomLimitHelpDialog,
  expectAdminBreadcrumbs,
} from "../support/admin.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  mockApiRequest,
  readFixture,
  validationErrors,
  serverError,
} from "../support/utils.js";

const test = mergeTests(roleControllerTest, permissionControllerTest);

test.use({ authenticated: true });

test.describe("Admin roles new", () => {
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
    await testVisitWithoutCurrentUser(page, "/admin/roles/new");
  });

  test("visit with user without permission to add new roles", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
      "roles.update",
    ];

    await page.goto("/admin/roles/new");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/roles\/new/);
    await expectToastAndClose(page, "app.flash.unauthorized");
  });

  test.describe("form", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();
    });

    test("header buttons and breadcrumbs", async ({ page }) => {
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveText(
        "app.save",
      );

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        "admin.breadcrumbs.roles.new",
      );
    });

    test("name field", async ({ page }) => {
      await expect(page.getByTestId("name-field")).toContainText(
        "app.model_name",
      );
      await expect(page.locator("#name")).toHaveValue("");
      await page.locator("#name").fill("Standard role");
      await expect(page.locator("#name")).toHaveValue("Standard role");
    });

    test("room limit field defaults to the default mode", async ({ page }) => {
      const field = page.getByTestId("room-limit-field");
      await expect(field).toContainText("app.room_limit");

      const defaultField = field.getByTestId("room-limit-mode-default-field");
      await expect(defaultField).toContainText(
        'admin.roles.room_limit.default_{"value":"app.unlimited"}',
      );
      await expect(defaultField.locator("#default")).toBeChecked();
      await expect(defaultField.locator("#default")).toBeEnabled();

      const unlimitedField = field.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedField).toContainText("app.unlimited");
      await expect(unlimitedField.locator("#unlimited")).not.toBeChecked();
      await expect(unlimitedField.locator("#unlimited")).toBeEnabled();

      const customField = field.getByTestId("room-limit-mode-custom-field");
      await expect(customField).toContainText("admin.roles.room_limit.custom");
      await expect(customField.locator("#custom")).not.toBeChecked();
      await expect(customField.locator("#custom")).toBeEnabled();

      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("room limit help dialog", async ({ page }) => {
      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toBeHidden();

      await page.getByTestId("roles-room-limit-help-button").click();

      await checkRoomLimitHelpDialog(page);
    });

    test("custom room limit shows input with initial value 0", async ({
      page,
    }) => {
      await page.locator("#custom").click();

      await expect(page.locator("#room-limit")).toBeVisible();
      await expect(page.locator("#room-limit")).toHaveValue("0");
      await page.locator("#room-limit").fill("5");
      await expect(page.locator("#room-limit")).toHaveValue("5");
    });

    test("permission list is shown without any selected permission", async ({
      page,
      expectPermissions,
    }) => {
      await expect(page.getByTestId("permission-list")).toContainText(
        "admin.roles.permission_name",
      );
      await expect(page.getByTestId("permission-list")).toContainText(
        "admin.roles.permission_explicit",
      );
      await expect(page.getByTestId("permission-list")).toContainText(
        "admin.roles.permission_included",
      );
      await expect(
        page.getByText("admin.roles.permissions_title"),
      ).toBeVisible();

      const permissionCategories = page.getByTestId("permission-category");
      await expect(permissionCategories).toHaveCount(10);
      // [category key, number of permissions]
      for (const [index, [key, count]] of [
        ["rooms", 3],
        ["meetings", 1],
        ["admin", 1],
        ["settings", 2],
        ["system", 1],
        ["users", 6],
        ["roles", 5],
        ["room_types", 4],
        ["servers", 5],
        ["server_pools", 5],
      ].entries()) {
        await expect(permissionCategories.nth(index)).toContainText(
          `admin.roles.permissions.${key}.title`,
        );
        await expect(
          permissionCategories.nth(index).getByTestId("permission-group"),
        ).toHaveCount(count);
      }

      await expectPermissions([]);
    });

    for (const permission of [
      "rooms.manage",
      "admin.view",
      "settings.update",
      "users.delete",
      "roles.delete",
      "roomTypes.delete",
      "servers.delete",
      "serverPools.delete",
      "meetings.viewAny",
      "system.monitor",
      "users.updateOwnAttributes",
    ]) {
      test(`select permission ${permission}`, async ({
        page,
        expectPermissions,
      }) => {
        // The ids contain dots, so a CSS #id selector would treat the suffix as a class
        await page
          .locator(
            `[id="${permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()}"]`,
          )
          .click();

        await expectPermissions([permission]);
      });
    }

    test("selecting permissions step by step accumulates explicit and included permissions", async ({
      page,
      expectPermissions,
    }) => {
      await page.locator('[id="users.update_own_attributes"]').click();
      await page.locator('[id="users.delete"]').click();
      await expectPermissions(["users.updateOwnAttributes", "users.delete"]);

      await page.locator('[id="roles.delete"]').click();
      await page.locator('[id="server_pools.delete"]').click();
      await expectPermissions([
        "users.updateOwnAttributes",
        "users.delete",
        "roles.delete",
        "serverPools.delete",
      ]);
    });

    test("selecting an included permission makes it explicit", async ({
      page,
      expectPermissions,
    }) => {
      await page.locator('[id="rooms.manage"]').click();
      await page.locator('[id="rooms.create"]').click();

      await expectPermissions(["rooms.manage", "rooms.create"]);
    });
  });

  test.describe("save", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();
      await page.locator("#name").fill("Standard role");
    });

    test("add new role with permissions", async ({ page }) => {
      // Order in which the permissions are selected
      const selectionOrder = [
        "rooms.manage",
        "rooms.create",
        "rooms.viewAll",
        "meetings.viewAny",
        "admin.view",
        "settings.update",
        "settings.viewAny",
        "system.monitor",
        "users.updateOwnAttributes",
        "users.delete",
        "users.create",
        "users.update",
        "users.view",
        "users.viewAny",
        "roles.delete",
        "roles.create",
        "roles.update",
        "roles.view",
        "roles.viewAny",
        "roomTypes.delete",
        "roomTypes.create",
        "roomTypes.update",
        "roomTypes.view",
        "servers.delete",
        "servers.create",
        "servers.update",
        "servers.view",
        "servers.viewAny",
        "serverPools.delete",
        "serverPools.create",
        "serverPools.update",
        "serverPools.view",
        "serverPools.viewAny",
      ];
      // Permission ids of the permissions.json fixture in the order of `selectionOrder`
      const selectionOrderIds = [
        5, 3, 4, 6, 7, 9, 8, 35, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 24,
        23, 22, 21, 29, 28, 27, 26, 25, 34, 33, 32, 31, 30,
      ];

      const role = readFixture("superuserRole.json");
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.superuser = false;
      const postRolesApiMock = await mockApiRequest(page, "POST", "roles", {
        status: 201,
        json: role,
      });
      await mockApiRequest(page, "GET", "roles/40", { json: role });

      for (const permission of selectionOrder) {
        await page
          .locator(
            `[id="${permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()}"]`,
          )
          .click();
      }
      await page.getByTestId("roles-save-button").click();

      const request = await postRolesApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: null,
        permissions: selectionOrderIds,
      });

      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.roles.index",
        'admin.breadcrumbs.roles.view_{"name":"Standard role"}',
      );
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("loading state while saving", async ({
      page,
      roleResponse,
      permissionsResponse,
    }) => {
      roleResponse.data.id = 40;
      roleResponse.data.name = "Standard role";
      roleResponse.data.room_limit = 5;
      roleResponse.data.permissions = [];
      const postRolesApiMock = await mockApiRequest(page, "POST", "roles", {
        status: 201,
        json: roleResponse,
        hold: true,
      });
      await mockApiRequest(page, "GET", "roles/40", { json: roleResponse });

      await page.locator("#custom").click();
      await page.locator("#room-limit").fill("5");
      await expect(page.getByTestId("overlay")).toBeHidden();

      await page.getByTestId("roles-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#default")).toBeDisabled();
      await expect(page.locator("#unlimited")).toBeDisabled();
      await expect(page.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toBeDisabled();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();
      // The permission checkboxes are not rendered while saving
      await expect(
        page.locator(
          permissionsResponse.data
            .map(
              ({ name }) =>
                `[id="${name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()}"]`,
            )
            .join(","),
        ),
      ).toHaveCount(0);

      postRolesApiMock.release();

      const request = await postRolesApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: 5,
        permissions: [],
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("add new role with custom room limit", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.id = 40;
      roleResponse.data.room_limit = 5;
      roleResponse.data.permissions = [];
      const postRolesApiMock = await mockApiRequest(page, "POST", "roles", {
        status: 201,
        json: roleResponse,
      });
      await mockApiRequest(page, "GET", "roles/40", { json: roleResponse });

      await page.locator("#custom").click();
      await page.locator("#room-limit").fill("5");
      await page.getByTestId("roles-save-button").click();

      await expect(postRolesApiMock).toHaveReceivedRequest({
        json: {
          name: "Standard role",
          room_limit: 5,
          permissions: [],
        },
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
    });

    test("add new role with unlimited room limit", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.id = 40;
      roleResponse.data.room_limit = -1;
      roleResponse.data.permissions = [];
      const postRolesApiMock = await mockApiRequest(page, "POST", "roles", {
        status: 201,
        json: roleResponse,
      });
      await mockApiRequest(page, "GET", "roles/40", { json: roleResponse });

      await page.locator("#unlimited").click();
      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      await page.getByTestId("roles-save-button").click();

      await expect(postRolesApiMock).toHaveReceivedRequest({
        json: {
          name: "Standard role",
          room_limit: -1,
          permissions: [],
        },
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
    });

    test("add new role with default room limit after switching back", async ({
      page,
      roleResponse,
    }) => {
      roleResponse.data.id = 40;
      roleResponse.data.room_limit = null;
      roleResponse.data.permissions = [];
      const postRolesApiMock = await mockApiRequest(page, "POST", "roles", {
        status: 201,
        json: roleResponse,
      });
      await mockApiRequest(page, "GET", "roles/40", { json: roleResponse });

      await page.locator("#unlimited").click();
      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      await page.locator("#default").click();
      await expect(page.locator("#default")).toBeChecked();
      await page.getByTestId("roles-save-button").click();

      await expect(postRolesApiMock).toHaveReceivedRequest({
        json: {
          name: "Standard role",
          room_limit: null,
          permissions: [],
        },
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
    });

    test("422 error shows validation messages", async ({ page }) => {
      await mockApiRequest(
        page,
        "POST",
        "roles",
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

    test("500 error after 422 error hides validation messages", async ({
      page,
    }) => {
      await mockApiRequest(
        page,
        "POST",
        "roles",
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
      await expect(
        page.getByText("The Permissions field must be present."),
      ).toBeVisible();

      await mockApiRequest(page, "POST", "roles", serverError());
      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
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

    test("500 error", async ({ page }) => {
      await mockApiRequest(page, "POST", "roles", serverError());

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page).toHaveURL(/\/admin\/roles\/new$/);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockApiRequest(page, "POST", "roles", { status: 401 });

      await page.getByTestId("roles-save-button").click();

      await expectLoginRedirect(page, "/admin/roles/new");
    });
  });

  test.describe("permission dependencies", () => {
    test("permissions without included permissions", async ({
      page,
      permissionsResponse,
      expectPermissions,
    }) => {
      permissionsResponse.data.forEach((permission) => {
        permission.included_permissions = [];
      });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();
      await expectPermissions([]);

      await page.locator('[id="rooms.manage"]').click();
      await expectPermissions(["rooms.manage"]);
    });

    test("selecting the highest permissions without dependencies", async ({
      page,
      permissionsResponse,
      expectPermissions,
    }) => {
      permissionsResponse.data.forEach((permission) => {
        permission.included_permissions = [];
      });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await page.locator('[id="settings.update"]').click();
      await page.locator('[id="users.delete"]').click();
      await page.locator('[id="roles.delete"]').click();
      await page.locator('[id="room_types.delete"]').click();
      await page.locator('[id="servers.delete"]').click();
      await page.locator('[id="server_pools.delete"]').click();
      await expectPermissions([
        "settings.update",
        "users.delete",
        "roles.delete",
        "roomTypes.delete",
        "servers.delete",
        "serverPools.delete",
      ]);
    });
  });

  test.describe("restricted permissions", () => {
    const restrictedServers = [
      "servers.*",
      "system.monitor",
      "serverPools.viewAny",
      "serverPools.view",
      "serverPools.create",
      "serverPools.update",
      "serverPools.delete",
    ];

    test("restricted servers, system and server pools are disabled", async ({
      page,
      permissionsResponse,
      expectPermissions,
    }) => {
      permissionsResponse.meta.restrictions = restrictedServers;

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await expect(page.getByTestId("permission-category")).toHaveCount(10);
      await expectPermissions([], { restrictions: restrictedServers });
    });

    test("selecting a permission that includes a restricted permission", async ({
      page,
      permissionsResponse,
      expectPermissions,
    }) => {
      permissionsResponse.meta.restrictions = restrictedServers;

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await page.locator('[id="room_types.delete"]').click();

      await expectPermissions(["roomTypes.delete"], {
        restrictions: restrictedServers,
      });
    });

    test("different restrictions are applied", async ({
      page,
      permissionsResponse,
      expectPermissions,
    }) => {
      const restrictions = [
        "rooms.*",
        "meetings.viewAny",
        "admin.view",
        "settings.*",
        "users.*",
        "roles.*",
        "roomTypes.*",
      ];
      permissionsResponse.meta.restrictions = restrictions;

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await expect(page.getByTestId("permission-category")).toHaveCount(10);
      await expectPermissions([], { restrictions });
    });
  });

  test.describe("load permissions errors", () => {
    test("loading state", async ({ page }) => {
      const getPermissionsApiMock = await mockApiRequest(
        page,
        "GET",
        "permissions",
        serverError({ hold: true }),
      );

      await page.goto("/admin/roles/new");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();

      getPermissionsApiMock.release();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("error keeps overlay and hides buttons", async ({ page }) => {
      await mockApiRequest(page, "GET", "permissions", serverError());

      await page.goto("/admin/roles/new");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Overlay is still shown because of the error
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();
      await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toHaveText(
        "app.reload",
      );
    });

    test("reload after error loads the permissions", async ({
      page,
      permissionsResponse,
    }) => {
      await mockApiRequest(page, "GET", "permissions", serverError());

      await page.goto("/admin/roles/new");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await mockApiRequest(page, "GET", "permissions", {
        json: permissionsResponse,
      });
      const reloaded = page.waitForRequest(
        (request) =>
          request.method() === "GET" &&
          request.url().includes("/api/v1/permissions"),
      );
      await page.getByTestId("loading-retry-button").click();
      await reloaded;

      await expect(page.getByTestId("permission-list")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockApiRequest(page, "GET", "permissions", { status: 401 });

      await page.goto("/admin/roles/new");

      await expectLoginRedirect(page, "/admin/roles/new");
    });
  });
});
