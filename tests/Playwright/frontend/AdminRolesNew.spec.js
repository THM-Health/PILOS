import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  checkPermissionGroup,
  checkRoomLimitHelpDialog,
  expectAdminBreadcrumbs,
} from "../support/admin.js";
import { interceptAdminRolesNewRequests } from "../support/mocks.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const ROLES_URL = "**/api/v1/roles";
const PERMISSIONS_URL = "**/api/v1/permissions";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const categories = [
  {
    key: "rooms",
    permissions: ["rooms.create", "rooms.viewAll", "rooms.manage"],
  },
  { key: "meetings", permissions: ["meetings.viewAny"] },
  { key: "admin", permissions: ["admin.view"] },
  { key: "settings", permissions: ["settings.viewAny", "settings.update"] },
  { key: "system", permissions: ["system.monitor"] },
  {
    key: "users",
    permissions: [
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "users.delete",
      "users.updateOwnAttributes",
    ],
  },
  {
    key: "roles",
    permissions: [
      "roles.viewAny",
      "roles.view",
      "roles.update",
      "roles.create",
      "roles.delete",
    ],
  },
  {
    key: "room_types",
    permissions: [
      "roomTypes.view",
      "roomTypes.update",
      "roomTypes.create",
      "roomTypes.delete",
    ],
  },
  {
    key: "servers",
    permissions: [
      "servers.viewAny",
      "servers.view",
      "servers.update",
      "servers.create",
      "servers.delete",
    ],
  },
  {
    key: "server_pools",
    permissions: [
      "serverPools.viewAny",
      "serverPools.view",
      "serverPools.update",
      "serverPools.create",
      "serverPools.delete",
    ],
  },
];

const allPermissions = categories.flatMap((category) => category.permissions);

// Order in which the permissions are selected by the "add new role" test
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
  5, 3, 4, 6, 7, 9, 8, 35, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 24, 23,
  22, 21, 29, 28, 27, 26, 25, 34, 33, 32, 31, 30,
];

const roomLimitField = (page) => page.getByTestId("room-limit-field");

function permissionId(permission) {
  return permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

async function selectPermissions(page, permissions) {
  for (const permission of permissions) {
    // The ids contain dots, so a CSS #id selector would treat the suffix as a class
    await page.locator(`[id="${permissionId(permission)}"]`).click();
  }
}

/**
 * Check all permission groups: explicit ones are checked, included ones (explicit plus the permissions they include
 * according to the permissions response) show the included icon, restricted ones are disabled.
 */
async function expectPermissions(
  page,
  explicit,
  { permissions = readFixture("permissions.json"), restrictions = [] } = {},
) {
  const nameById = Object.fromEntries(
    permissions.data.map((permission) => [permission.id, permission.name]),
  );
  const included = new Set(explicit);
  for (const permission of permissions.data) {
    if (explicit.includes(permission.name)) {
      permission.included_permissions.forEach((id) =>
        included.add(nameById[id]),
      );
    }
  }
  const isRestricted = (permission) =>
    restrictions.some((pattern) =>
      pattern.endsWith(".*")
        ? permission.startsWith(pattern.slice(0, -1))
        : permission === pattern,
    );

  for (const [index, permission] of allPermissions.entries()) {
    await checkPermissionGroup(
      page,
      index,
      permission,
      explicit.includes(permission),
      included.has(permission),
      isRestricted(permission),
    );
  }
}

test.use({ authenticated: true });

test.describe("Admin roles new", () => {
  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
      "roles.update",
      "roles.create",
      "roles.delete",
    ];
    await interceptAdminRolesNewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/roles/new");
  });

  test("visit with user without permission to add new roles", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
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
      const field = roomLimitField(page);
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
      for (const [index, category] of categories.entries()) {
        await expect(permissionCategories.nth(index)).toContainText(
          `admin.roles.permissions.${category.key}.title`,
        );
        await expect(
          permissionCategories.nth(index).getByTestId("permission-group"),
        ).toHaveCount(category.permissions.length);
      }

      await expectPermissions(page, []);
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
      test(`select permission ${permission}`, async ({ page }) => {
        await selectPermissions(page, [permission]);

        await expectPermissions(page, [permission]);
      });
    }

    test("selecting permissions step by step accumulates explicit and included permissions", async ({
      page,
    }) => {
      const first = ["users.updateOwnAttributes", "users.delete"];
      await selectPermissions(page, first);
      await expectPermissions(page, first);

      await selectPermissions(page, ["roles.delete", "serverPools.delete"]);
      await expectPermissions(page, [
        ...first,
        "roles.delete",
        "serverPools.delete",
      ]);
    });

    test("selecting an included permission makes it explicit", async ({
      page,
    }) => {
      await selectPermissions(page, ["rooms.manage", "rooms.create"]);

      await expectPermissions(page, ["rooms.manage", "rooms.create"]);
    });
  });

  test.describe("save", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();
      await page.locator("#name").fill("Standard role");
    });

    test("add new role with permissions", async ({ page }) => {
      const role = readFixture("superuserRole.json");
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.superuser = false;
      const newRole = await mockMethod(page, "POST", ROLES_URL, {
        status: 201,
        json: role,
      });
      await mockMethod(page, "GET", "**/api/v1/roles/40", { json: role });

      await selectPermissions(page, selectionOrder);
      await page.getByTestId("roles-save-button").click();

      const request = await nthRequest(newRole);
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

    test("loading state while saving", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.room_limit = 5;
      role.data.permissions = [];
      const newRole = await mockMethod(page, "POST", ROLES_URL, {
        status: 201,
        json: role,
        hold: true,
      });
      await mockMethod(page, "GET", "**/api/v1/roles/40", { json: role });

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
          allPermissions
            .map((permission) => `[id="${permissionId(permission)}"]`)
            .join(","),
        ),
      ).toHaveCount(0);

      newRole.release();

      const request = await nthRequest(newRole);
      expect(request.postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: 5,
        permissions: [],
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("add new role with custom room limit", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.id = 40;
      role.data.room_limit = 5;
      role.data.permissions = [];
      const newRole = await mockMethod(page, "POST", ROLES_URL, {
        status: 201,
        json: role,
      });
      await mockMethod(page, "GET", "**/api/v1/roles/40", { json: role });

      await page.locator("#custom").click();
      await page.locator("#room-limit").fill("5");
      await page.getByTestId("roles-save-button").click();

      expect((await nthRequest(newRole)).postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: 5,
        permissions: [],
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
    });

    test("add new role with unlimited room limit", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.id = 40;
      role.data.room_limit = -1;
      role.data.permissions = [];
      const newRole = await mockMethod(page, "POST", ROLES_URL, {
        status: 201,
        json: role,
      });
      await mockMethod(page, "GET", "**/api/v1/roles/40", { json: role });

      await page.locator("#unlimited").click();
      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      await page.getByTestId("roles-save-button").click();

      expect((await nthRequest(newRole)).postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: -1,
        permissions: [],
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
    });

    test("add new role with default room limit after switching back", async ({
      page,
    }) => {
      const role = readFixture("role.json");
      role.data.id = 40;
      role.data.room_limit = null;
      role.data.permissions = [];
      const newRole = await mockMethod(page, "POST", ROLES_URL, {
        status: 201,
        json: role,
      });
      await mockMethod(page, "GET", "**/api/v1/roles/40", { json: role });

      await page.locator("#unlimited").click();
      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
      await page.locator("#default").click();
      await expect(page.locator("#default")).toBeChecked();
      await page.getByTestId("roles-save-button").click();

      expect((await nthRequest(newRole)).postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: null,
        permissions: [],
      });
      await expect(page).toHaveURL(/\/admin\/roles\/40$/);
    });

    test("422 error shows validation messages", async ({ page }) => {
      await mockMethod(page, "POST", ROLES_URL, {
        status: 422,
        json: {
          message: "The name field is required. (and 2 more errors)",
          errors: {
            name: ["The Name field is required."],
            room_limit: ["The Room limit must be at least -1."],
            permissions: ["The Permissions field must be present."],
          },
        },
      });

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(
        page,
        "The name field is required. (and 2 more errors)",
      );
      await expect(page.getByTestId("name-field")).toContainText(
        "The Name field is required.",
      );
      await expect(roomLimitField(page)).toContainText(
        "The Room limit must be at least -1.",
      );
      await expect(
        page.getByText("The Permissions field must be present."),
      ).toBeVisible();
    });

    test("500 error after 422 error hides validation messages", async ({
      page,
    }) => {
      await mockMethod(page, "POST", ROLES_URL, {
        status: 422,
        json: {
          message: "The name field is required. (and 2 more errors)",
          errors: {
            name: ["The Name field is required."],
            room_limit: ["The Room limit must be at least -1."],
            permissions: ["The Permissions field must be present."],
          },
        },
      });
      await page.getByTestId("roles-save-button").click();
      await expectToastAndClose(
        page,
        "The name field is required. (and 2 more errors)",
      );
      await expect(
        page.getByText("The Permissions field must be present."),
      ).toBeVisible();

      await mockMethod(page, "POST", ROLES_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("name-field")).toBeVisible();
      await expect(page.getByTestId("name-field")).not.toContainText(
        "The Name field is required.",
      );
      await expect(roomLimitField(page)).toBeVisible();
      await expect(roomLimitField(page)).not.toContainText(
        "The Room limit must be at least -1.",
      );
      await expect(
        page.getByText("The Permissions field must be present."),
      ).toHaveCount(0);
    });

    test("500 error", async ({ page }) => {
      await mockMethod(page, "POST", ROLES_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page).toHaveURL(/\/admin\/roles\/new$/);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "POST", ROLES_URL, { status: 401 });

      await page.getByTestId("roles-save-button").click();

      await expectLoginRedirect(page, "/admin/roles/new");
    });
  });

  test.describe("permission dependencies", () => {
    test("permissions without included permissions", async ({ page }) => {
      const permissions = readFixture("permissions.json");
      permissions.data.forEach((permission) => {
        permission.included_permissions = [];
      });
      await mockMethod(page, "GET", PERMISSIONS_URL, { json: permissions });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();
      await expectPermissions(page, [], { permissions });

      await selectPermissions(page, ["rooms.manage"]);
      await expectPermissions(page, ["rooms.manage"], { permissions });
    });

    test("selecting the highest permissions without dependencies", async ({
      page,
    }) => {
      const permissions = readFixture("permissions.json");
      permissions.data.forEach((permission) => {
        permission.included_permissions = [];
      });
      await mockMethod(page, "GET", PERMISSIONS_URL, { json: permissions });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      const highest = [
        "settings.update",
        "users.delete",
        "roles.delete",
        "roomTypes.delete",
        "servers.delete",
        "serverPools.delete",
      ];
      await selectPermissions(page, highest);
      await expectPermissions(page, highest, { permissions });
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
    }) => {
      const permissions = readFixture("permissions.json");
      permissions.meta.restrictions = restrictedServers;
      await mockMethod(page, "GET", PERMISSIONS_URL, { json: permissions });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await expect(page.getByTestId("permission-category")).toHaveCount(10);
      await expectPermissions(page, [], {
        permissions,
        restrictions: restrictedServers,
      });
    });

    test("selecting a permission that includes a restricted permission", async ({
      page,
    }) => {
      const permissions = readFixture("permissions.json");
      permissions.meta.restrictions = restrictedServers;
      await mockMethod(page, "GET", PERMISSIONS_URL, { json: permissions });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await selectPermissions(page, ["roomTypes.delete"]);

      await expectPermissions(page, ["roomTypes.delete"], {
        permissions,
        restrictions: restrictedServers,
      });
    });

    test("different restrictions are applied", async ({ page }) => {
      const restrictions = [
        "rooms.*",
        "meetings.viewAny",
        "admin.view",
        "settings.*",
        "users.*",
        "roles.*",
        "roomTypes.*",
      ];
      const permissions = readFixture("permissions.json");
      permissions.meta.restrictions = restrictions;
      await mockMethod(page, "GET", PERMISSIONS_URL, { json: permissions });

      await page.goto("/admin/roles/new");
      await expect(page.getByTestId("permission-list")).toBeVisible();

      await expect(page.getByTestId("permission-category")).toHaveCount(10);
      await expectPermissions(page, [], { permissions, restrictions });
    });
  });

  test.describe("load permissions errors", () => {
    test("loading state", async ({ page }) => {
      const permissionsRequest = await mockMethod(
        page,
        "GET",
        PERMISSIONS_URL,
        { status: 500, json: { message: "Test" }, hold: true },
      );

      await page.goto("/admin/roles/new");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();

      permissionsRequest.release();

      await expectToastAndClose(page, serverErrorToast);
    });

    test("error keeps overlay and hides buttons", async ({ page }) => {
      await mockMethod(page, "GET", PERMISSIONS_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/roles/new");

      await expectToastAndClose(page, serverErrorToast);

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

    test("reload after error loads the permissions", async ({ page }) => {
      await mockMethod(page, "GET", PERMISSIONS_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/roles/new");
      await expectToastAndClose(page, serverErrorToast);

      await mockMethod(page, "GET", PERMISSIONS_URL, {
        json: readFixture("permissions.json"),
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
      await mockMethod(page, "GET", PERMISSIONS_URL, { status: 401 });

      await page.goto("/admin/roles/new");

      await expectLoginRedirect(page, "/admin/roles/new");
    });
  });
});
