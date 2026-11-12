import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  checkPermissionGroup,
  checkRoomLimitHelpDialog,
} from "../support/admin.js";
import {
  interceptAdminRolesViewRequests,
  interceptAdminRolesIndexRequests,
} from "../support/mocks.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const ROLE_URL = "**/api/v1/roles/2";
const PERMISSIONS_URL = "**/api/v1/permissions";

const defaultUserPermissions = [
  "admin.view",
  "roles.viewAny",
  "roles.view",
  "roles.update",
  "roles.create",
  "roles.delete",
];

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const modelNotFoundToast = [
  'app.flash.model_not_found.title_{"model":"app.model.role"}',
  'app.flash.model_not_found.details_{"ids":"2"}',
];

const T = "explicit";
const F = "none";
const INCLUDED = "included";

const categories = [
  {
    key: "rooms",
    permissions: ["rooms.create", "rooms.viewAll", "rooms.manage"],
  },
  {
    key: "meetings",
    permissions: ["meetings.viewAny"],
  },
  {
    key: "admin",
    permissions: ["admin.view"],
  },
  {
    key: "settings",
    permissions: ["settings.viewAny", "settings.update"],
  },
  {
    key: "system",
    permissions: ["system.monitor"],
  },
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

const defaultRoleCategories = [
  {
    before: [T, T, F],
    steps: [
      {
        click: ["rooms.manage", "rooms.create", "rooms.viewAll"],
        after: [INCLUDED, INCLUDED, T],
      },
    ],
  },
  {
    before: [T],
    steps: [{ click: ["meetings.viewAny"], after: [F] }],
  },
  {
    before: [INCLUDED],
    steps: [{ click: ["admin.view"], after: [T] }],
  },
  {
    before: [F, F],
    steps: [
      { click: ["settings.update"], after: [INCLUDED, T] },
      { click: ["settings.viewAny"], after: [T, T] },
    ],
  },
  {
    before: [F],
    steps: [{ click: ["system.monitor"], after: [T] }],
  },
  {
    before: [T, F, F, F, F, F],
    steps: [
      {
        click: [
          "users.updateOwnAttributes",
          "users.delete",
          "users.create",
          "users.update",
          "users.view",
          "users.viewAny",
        ],
        after: [INCLUDED, T, T, T, T, T],
      },
    ],
  },
  {
    before: [INCLUDED, F, F, F, F],
    steps: [
      {
        click: [
          "roles.delete",
          "roles.create",
          "roles.update",
          "roles.view",
          "roles.viewAny",
        ],
        after: [T, T, T, T, T],
      },
    ],
  },
  {
    before: [INCLUDED, T, T, T],
    steps: [
      {
        click: [
          "roomTypes.delete",
          "roomTypes.create",
          "roomTypes.update",
          "roomTypes.view",
        ],
        after: [T, F, F, F],
      },
    ],
  },
  {
    before: [F, F, F, F, F],
    steps: [
      {
        click: [
          "servers.delete",
          "servers.create",
          "servers.update",
          "servers.view",
          "servers.viewAny",
        ],
        after: [T, T, T, T, T],
      },
    ],
  },
  {
    before: [INCLUDED, F, F, F, F],
    steps: [
      {
        click: [
          "serverPools.delete",
          "serverPools.create",
          "serverPools.update",
          "serverPools.view",
          "serverPools.viewAny",
        ],
        after: [T, T, T, T, T],
      },
    ],
  },
];

function permissionDomId(permission) {
  return permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function checkbox(root, permission) {
  // Permission ids contain dots, so a CSS #id selector would treat the suffix as a class
  return root.locator(`[id="${permissionDomId(permission)}"]`);
}

function permissionFlags(state) {
  switch (state) {
    case T:
      return { explicit: true, included: true };
    case F:
      return { explicit: false, included: false };
    case INCLUDED:
      return { explicit: false, included: true };
    default: {
      const _exhaustive = state;
      throw new Error(`Unknown permission state: ${_exhaustive}`);
    }
  }
}

function globalPermissionIndex(categoryIndex, permissionIndex) {
  let index = 0;
  for (let i = 0; i < categoryIndex; i++) {
    index += categories[i].permissions.length;
  }
  return index + permissionIndex;
}

async function checkCategory(
  page,
  categoryIndex,
  states,
  disabledByPermission = {},
) {
  const category = categories[categoryIndex];
  await expect(
    page.getByTestId("permission-category").nth(categoryIndex),
  ).toContainText(`admin.roles.permissions.${category.key}.title`);
  await expect(
    page
      .getByTestId("permission-category")
      .nth(categoryIndex)
      .getByTestId("permission-group"),
  ).toHaveCount(category.permissions.length);

  for (const [permissionIndex, permission] of category.permissions.entries()) {
    const { explicit, included } = permissionFlags(states[permissionIndex]);
    await checkPermissionGroup(
      page,
      globalPermissionIndex(categoryIndex, permissionIndex),
      permission,
      explicit,
      included,
      Boolean(disabledByPermission[permission]),
    );
  }
}

async function checkAllPermissions(page, states, allDisabled = false) {
  for (const [index, permission] of allPermissions.entries()) {
    const { explicit, included } = permissionFlags(states[index]);
    await checkPermissionGroup(
      page,
      index,
      permission,
      explicit,
      included,
      allDisabled,
    );
  }
}

async function checkBreadcrumb(page, mode, name) {
  const breadcrumbs = page.getByTestId("admin-breadcrumb");
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs).toContainText("admin.breadcrumbs.roles.index");
  const crumbKey =
    mode === "edit"
      ? `admin.breadcrumbs.roles.edit_{"name":"${name}"}`
      : `admin.breadcrumbs.roles.view_{"name":"${name}"}`;
  await expect(breadcrumbs).toContainText(crumbKey);
}

function restrictedPermissions(restrictions) {
  const patterns = restrictions.filter((pattern) => pattern !== "");
  const disabled = {};
  for (const permission of allPermissions) {
    disabled[permission] = patterns.some((pattern) => {
      if (pattern.endsWith(".*")) {
        return permission.startsWith(pattern.slice(0, -1));
      }
      return permission === pattern;
    });
  }
  return disabled;
}

async function mockRequest(page, method, url, response) {
  await page.route(url, async (route) => {
    if (route.request().method() !== method) {
      return route.fallback();
    }
    await route.fulfill(response);
  });
}

async function holdRequest(page, method, url, response) {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(url, async (route) => {
    if (route.request().method() !== method) {
      return route.fallback();
    }
    await gate;
    await route.fulfill(response);
  });
  return release;
}

async function mockRole(page, body, status = 200) {
  await page.route(ROLE_URL, async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    await route.fulfill({ status, json: body });
  });
}

async function mockPermissions(page, permissions) {
  await page.route(PERMISSIONS_URL, async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    await route.fulfill({ json: permissions });
  });
}

function waitForSaveRequest(page) {
  return page.waitForRequest(
    (request) =>
      request.method() === "PUT" && request.url().includes("/api/v1/roles/2"),
  );
}

async function openEditPage(page, name = "Staff") {
  await page.goto("/admin/roles/2/edit");
  await expect(page.locator("#name")).toHaveValue(name);
}

async function expectRedirectToRolesIndex(page) {
  await expect(page).toHaveURL((url) => url.pathname === "/admin/roles");
  await expectToastAndClose(page, modelNotFoundToast);
}

async function expectViewPage(page, name) {
  await expect(page).toHaveURL((url) => url.pathname === "/admin/roles/2");
  await checkBreadcrumb(page, "view", name);
}

test.use({ authenticated: true });

test.describe("Admin roles edit", () => {
  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = [...defaultUserPermissions];
    await interceptAdminRolesViewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/roles/2/edit");
  });

  test("visit with user without permission to edit roles", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
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
    test("loading state", async ({ page }) => {
      const release = await holdRequest(page, "GET", ROLE_URL, {
        json: readFixture("role.json"),
      });

      await page.goto("/admin/roles/2/edit");

      await expect(page.getByText("admin.title").first()).toBeVisible();

      // Check loading
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);

      release();

      // Check that loading is done
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test("buttons after loading", async ({ page }) => {
      await openEditPage(page);

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
      await openEditPage(page);

      await checkBreadcrumb(page, "edit", "Staff");
    });

    test("buttons without delete permission", async ({ page, currentUser }) => {
      currentUser.data.permissions = defaultUserPermissions.filter(
        (permission) => permission !== "roles.delete",
      );

      await openEditPage(page);

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
      await openEditPage(page);

      const nameField = page.getByTestId("name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("app.model_name");

      await page.locator("#name").fill("Standard role");
      await expect(page.locator("#name")).toHaveValue("Standard role");

      // Check that breadcrumbs stays the same
      await checkBreadcrumb(page, "edit", "Staff");
    });

    test("room limit default state", async ({ page }) => {
      await openEditPage(page);

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
      await openEditPage(page);

      await page.locator("#unlimited").click();

      await expect(page.locator("#unlimited")).toBeChecked();
      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("room limit help dialog", async ({ page }) => {
      await openEditPage(page);

      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toHaveCount(0);

      await page.getByTestId("roles-room-limit-help-button").click();

      await checkRoomLimitHelpDialog(page);

      await expect(
        page.getByTestId("roles-room-limit-help-dialog"),
      ).toHaveCount(0);
    });

    test("loaded role with unlimited room limit", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.room_limit = -1;
      await mockRole(page, role);

      await openEditPage(page);

      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#default")).toBeEnabled();
      await expect(page.locator("#unlimited")).toBeChecked();
      await expect(page.locator("#unlimited")).toBeEnabled();
      await expect(page.locator("#custom")).not.toBeChecked();
      await expect(page.locator("#custom")).toBeEnabled();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("loaded role with custom room limit", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.room_limit = 5;
      await mockRole(page, role);

      await openEditPage(page);

      await expect(page.locator("#default")).not.toBeChecked();
      await expect(page.locator("#default")).toBeEnabled();
      await expect(page.locator("#unlimited")).not.toBeChecked();
      await expect(page.locator("#unlimited")).toBeEnabled();
      await expect(page.locator("#custom")).toBeChecked();
      await expect(page.locator("#custom")).toBeEnabled();
      await expect(page.locator("#room-limit")).toBeVisible();
      await expect(page.locator("#room-limit")).toHaveValue("5");
    });

    test("switch from custom room limit to default", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.room_limit = 5;
      await mockRole(page, role);

      await openEditPage(page);
      await expect(page.locator("#room-limit")).toBeVisible();

      await page.locator("#default").click();

      await expect(page.locator("#default")).toBeChecked();
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });
  });

  test.describe("permission list", () => {
    test("list header and categories", async ({ page }) => {
      await openEditPage(page);

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
      for (const [index, category] of categories.entries()) {
        test(`change permissions of category ${category.key}`, async ({
          page,
        }) => {
          await openEditPage(page);

          const { before, steps } = defaultRoleCategories[index];
          await checkCategory(page, index, before);

          const element = page.getByTestId("permission-category").nth(index);
          for (const step of steps) {
            for (const permission of step.click) {
              await checkbox(element, permission).click();
            }
            await checkCategory(page, index, step.after);
          }
        });
      }
    });

    test.describe("without included permissions", () => {
      const clickedPermissions = {
        rooms: "rooms.manage",
        settings: "settings.update",
        users: "users.delete",
        roles: "roles.delete",
        room_types: "roomTypes.delete",
        servers: "servers.delete",
        server_pools: "serverPools.delete",
      };

      test.beforeEach(async ({ page }) => {
        const permissions = readFixture("permissions.json");
        for (const permission of permissions.data) {
          permission.included_permissions = [];
        }
        await mockPermissions(page, permissions);

        const role = readFixture("role.json");
        role.data.permissions = [];
        await mockRole(page, role);
      });

      for (const [index, category] of categories.entries()) {
        test(`initial permissions of category ${category.key}`, async ({
          page,
        }) => {
          await openEditPage(page);

          await checkCategory(
            page,
            index,
            category.permissions.map(() => F),
          );
        });
      }

      for (const [index, category] of categories.entries()) {
        const clicked = clickedPermissions[category.key];
        if (!clicked) {
          continue;
        }

        test(`change permissions of category ${category.key}`, async ({
          page,
        }) => {
          await openEditPage(page);

          const element = page.getByTestId("permission-category").nth(index);
          await checkbox(element, clicked).click();

          // Only the clicked permission changes, nothing is included by it
          await checkCategory(
            page,
            index,
            category.permissions.map((permission) =>
              permission === clicked ? T : F,
            ),
          );
        });
      }
    });

    test.describe("with restricted permissions", () => {
      const restrictionsServers = [
        "servers.*",
        "system.monitor",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.create",
        "serverPools.update",
        "serverPools.delete",
      ];
      const restrictionsOthers = [
        "rooms.*",
        "meetings.viewAny",
        "admin.view",
        "settings.*",
        "users.*",
        "roles.*",
        "roomTypes.*",
      ];

      test.beforeEach(async ({ page }) => {
        const role = readFixture("role.json");
        role.data.permissions = [];
        await mockRole(page, role);
      });

      test("restrictions for servers, server pools and system", async ({
        page,
      }) => {
        const permissions = readFixture("permissions.json");
        permissions.meta.restrictions = restrictionsServers;
        await mockPermissions(page, permissions);

        await openEditPage(page);

        const list = page.getByTestId("permission-list");
        await expect(list).toContainText("admin.roles.permission_name");
        await expect(list).toContainText("admin.roles.permission_explicit");
        await expect(list).toContainText("admin.roles.permission_included");
        await expect(list.getByTestId("permission-category")).toHaveCount(10);

        const disabled = restrictedPermissions(restrictionsServers);
        for (const [index, category] of categories.entries()) {
          await checkCategory(
            page,
            index,
            category.permissions.map(() => F),
            disabled,
          );
        }
      });

      test("select permission that includes restricted permission", async ({
        page,
      }) => {
        const permissions = readFixture("permissions.json");
        permissions.meta.restrictions = restrictionsServers;
        await mockPermissions(page, permissions);

        await openEditPage(page);

        await checkbox(page, "roomTypes.delete").click();

        await checkCategory(
          page,
          9,
          [INCLUDED, F, F, F, F],
          restrictedPermissions(restrictionsServers),
        );
      });

      test("restrictions for the other categories", async ({ page }) => {
        const permissions = readFixture("permissions.json");
        permissions.meta.restrictions = restrictionsOthers;
        await mockPermissions(page, permissions);

        await openEditPage(page);

        const list = page.getByTestId("permission-list");
        await expect(list).toContainText("admin.roles.permission_name");
        await expect(list.getByTestId("permission-category")).toHaveCount(10);

        const disabled = restrictedPermissions(restrictionsOthers);
        for (const [index, category] of categories.entries()) {
          await checkCategory(
            page,
            index,
            category.permissions.map(() => F),
            disabled,
          );
        }
      });
    });
  });

  test.describe("save", () => {
    test("loading state while saving", async ({ page }) => {
      await openEditPage(page);
      await expect(checkbox(page, "rooms.create")).toBeVisible();
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      const role = readFixture("role.json");
      const release = await holdRequest(page, "PUT", ROLE_URL, { json: role });

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
      for (const permission of allPermissions) {
        await expect(checkbox(page, permission)).toHaveCount(0);
      }

      const cancelButton = page.getByTestId("roles-cancel-edit-button");
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveJSProperty("tagName", "BUTTON");
      await expect(cancelButton).toBeDisabled();
      await expect(page.getByTestId("roles-delete-button")).toBeDisabled();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();

      release();

      await expectViewPage(page, "Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test("loading state while saving with custom room limit", async ({
      page,
    }) => {
      await openEditPage(page);

      await page.locator("#custom").click();
      await expect(page.locator("#room-limit")).toBeVisible();

      const role = readFixture("role.json");
      role.data.room_limit = 5;
      await mockRole(page, role);
      const release = await holdRequest(page, "PUT", ROLE_URL, { json: role });

      await page.getByTestId("roles-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#default")).toBeDisabled();
      await expect(page.locator("#unlimited")).toBeDisabled();
      await expect(page.locator("#custom")).toBeDisabled();
      await expect(page.locator("#room-limit")).toBeDisabled();

      release();

      await expectViewPage(page, "Staff");
    });

    test("save changed name, room limit and permissions", async ({ page }) => {
      await openEditPage(page);

      await page.locator("#name").fill("Standard role");
      await page.locator("#unlimited").click();

      const clickedPermissions = [
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
      for (const permission of clickedPermissions) {
        await checkbox(page, permission).click();
      }

      const selectedPermissions = [
        5, 7, 9, 8, 35, 20, 19, 18, 17, 16, 14, 13, 12, 11, 10, 21, 29, 28, 27,
        26, 25, 34, 33, 32, 31, 30,
      ];
      const role = readFixture("superuserRole.json");
      role.data.name = "Standard role";
      role.data.room_limit = -1;
      role.data.superuser = false;
      role.data.permissions = role.data.permissions.filter((permission) =>
        selectedPermissions.includes(permission.id),
      );
      await mockRole(page, role);
      await mockRequest(page, "PUT", ROLE_URL, { json: role });

      const saveRequest = waitForSaveRequest(page);
      await page.getByTestId("roles-save-button").click();

      expect((await saveRequest).postDataJSON()).toEqual({
        name: "Standard role",
        room_limit: -1,
        permissions: selectedPermissions,
        updated_at: role.data.updated_at,
      });

      // Check that role page is shown
      await expectViewPage(page, "Standard role");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test("save custom room limit", async ({ page }) => {
      await openEditPage(page);

      await page.locator("#custom").click();
      await expect(page.locator("#room-limit")).toBeVisible();
      await expect(page.locator("#room-limit")).toHaveValue("0");
      await page.locator("#room-limit").fill("5");

      const role = readFixture("role.json");
      role.data.room_limit = 5;
      await mockRole(page, role);
      await mockRequest(page, "PUT", ROLE_URL, { json: role });

      const saveRequest = waitForSaveRequest(page);
      await page.getByTestId("roles-save-button").click();

      expect((await saveRequest).postDataJSON()).toEqual({
        name: role.data.name,
        room_limit: 5,
        permissions: role.data.permissions.map((permission) => permission.id),
        updated_at: role.data.updated_at,
      });

      await expectViewPage(page, "Staff");
    });

    test("save unlimited room limit without changing it", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.room_limit = -1;
      await mockRole(page, role);
      await mockRequest(page, "PUT", ROLE_URL, { json: role });

      await openEditPage(page);
      await expect(page.locator("#unlimited")).toBeChecked();

      const saveRequest = waitForSaveRequest(page);
      await page.getByTestId("roles-save-button").click();

      expect((await saveRequest).postDataJSON()).toEqual({
        name: role.data.name,
        room_limit: -1,
        permissions: role.data.permissions.map((permission) => permission.id),
        updated_at: role.data.updated_at,
      });

      await expectViewPage(page, "Staff");
    });

    test("save default room limit after switching from custom", async ({
      page,
    }) => {
      const customRole = readFixture("role.json");
      customRole.data.room_limit = 5;
      await mockRole(page, customRole);

      await openEditPage(page);
      await expect(page.locator("#room-limit")).toHaveValue("5");
      await page.locator("#default").click();
      await expect(page.locator("#room-limit")).toHaveCount(0);

      const role = readFixture("role.json");
      role.data.room_limit = null;
      await mockRole(page, role);
      await mockRequest(page, "PUT", ROLE_URL, { json: role });

      const saveRequest = waitForSaveRequest(page);
      await page.getByTestId("roles-save-button").click();

      expect((await saveRequest).postDataJSON()).toEqual({
        name: role.data.name,
        room_limit: null,
        permissions: role.data.permissions.map((permission) => permission.id),
        updated_at: role.data.updated_at,
      });

      await expectViewPage(page, "Staff");
    });
  });

  test.describe("save errors", () => {
    test("validation errors", async ({ page }) => {
      await openEditPage(page);

      await mockRequest(page, "PUT", ROLE_URL, {
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
      await openEditPage(page);

      await mockRequest(page, "PUT", ROLE_URL, {
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

      await mockRequest(page, "PUT", ROLE_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, serverErrorToast);

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
      await openEditPage(page);

      await mockRequest(page, "PUT", ROLE_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("roles-save-button").click();

      await expectToastAndClose(page, serverErrorToast);
    });

    test.describe("stale model", () => {
      const staleResponse = (role) => ({
        status: 428,
        json: { new_model: role.data, message: "stale_model" },
      });

      async function checkStaleDialog(page) {
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
      }

      test("dialog is shown", async ({ page }) => {
        await openEditPage(page);

        const role = readFixture("role.json");
        role.data.name = "Standard role";
        role.data.room_limit = -1;
        await mockRequest(page, "PUT", ROLE_URL, staleResponse(role));

        await expect(page.getByTestId("stale-role-dialog")).toHaveCount(0);

        await page.getByTestId("roles-save-button").click();

        await checkStaleDialog(page);
      });

      test("reload with the new data", async ({ page }) => {
        await openEditPage(page);
        await checkBreadcrumb(page, "edit", "Staff");

        const role = readFixture("role.json");
        role.data.name = "Standard role";
        role.data.room_limit = -1;
        await mockRequest(page, "PUT", ROLE_URL, staleResponse(role));

        await page.getByTestId("roles-save-button").click();
        await checkStaleDialog(page);

        await page.getByTestId("stale-dialog-reject-button").click();

        await expect(page.getByTestId("stale-role-dialog")).toHaveCount(0);

        // Check that breadcrumbs is updated
        await checkBreadcrumb(page, "edit", "Standard role");

        // Check that correct data is shown
        await expect(page.locator("#name")).toHaveValue("Standard role");
        await expect(page.locator("#unlimited")).toBeChecked();
        await expect(page.locator("#room-limit")).toHaveCount(0);

        await checkAllPermissions(
          page,
          defaultRoleCategories.flatMap((category) => category.before),
        );
      });

      test("overwrite", async ({ page }) => {
        await openEditPage(page);

        // First stale error, reload to get the new data
        const reloadedRole = readFixture("role.json");
        reloadedRole.data.name = "Standard role";
        reloadedRole.data.room_limit = -1;
        await mockRequest(page, "PUT", ROLE_URL, staleResponse(reloadedRole));

        await page.getByTestId("roles-save-button").click();
        await checkStaleDialog(page);
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.locator("#name")).toHaveValue("Standard role");

        // Trigger the stale error again
        const newerRole = readFixture("superuserRole.json");
        newerRole.data.name = "Standard role 2";
        newerRole.data.room_limit = -1;
        newerRole.data.superuser = false;
        await mockRequest(page, "PUT", ROLE_URL, staleResponse(newerRole));

        await expect(page.getByTestId("stale-role-dialog")).toHaveCount(0);
        await page.getByTestId("roles-save-button").click();
        await checkStaleDialog(page);

        // Overwrite
        await mockRole(page, reloadedRole);
        await mockRequest(page, "PUT", ROLE_URL, { json: reloadedRole });

        const saveRequest = waitForSaveRequest(page);
        await page.getByTestId("stale-dialog-accept-button").click();

        // Check that correct data is sent
        expect((await saveRequest).postDataJSON()).toEqual({
          name: reloadedRole.data.name,
          room_limit: reloadedRole.data.room_limit,
          permissions: reloadedRole.data.permissions.map(
            (permission) => permission.id,
          ),
          updated_at: reloadedRole.data.updated_at,
        });

        // Check that redirect worked
        await expectViewPage(page, "Standard role");
      });
    });

    test("role not found", async ({ page }) => {
      await openEditPage(page);
      await interceptAdminRolesIndexRequests(page);

      await mockRequest(page, "PUT", ROLE_URL, {
        status: 404,
        json: { message: "model_not_found", model: "role", ids: [2] },
      });

      await page.getByTestId("roles-save-button").click();

      await expectRedirectToRolesIndex(page);
    });

    test("unauthenticated", async ({ page }) => {
      await openEditPage(page);

      await mockRequest(page, "PUT", ROLE_URL, { status: 401 });

      await page.getByTestId("roles-save-button").click();

      await expectLoginRedirect(page, "/admin/roles/2/edit");
    });
  });

  test.describe("load errors", () => {
    test("permissions request fails and can be retried", async ({ page }) => {
      const release = await holdRequest(page, "GET", PERMISSIONS_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/roles/2/edit");

      // Check loading
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);

      release();

      // Check that error message is shown
      await expectToastAndClose(page, serverErrorToast);

      // Check that overlay is still shown because of error
      await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toBeVisible();
      await expect(page.getByTestId("roles-save-button")).toBeDisabled();

      // Reload with correct data
      await mockPermissions(page, readFixture("permissions.json"));

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");

      const roleRequest = page.waitForRequest(ROLE_URL);
      const permissionsRequest = page.waitForRequest(PERMISSIONS_URL);
      await retryButton.click();
      await roleRequest;
      await permissionsRequest;

      // Check that overlay is not shown anymore
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("permissions request unauthenticated", async ({ page }) => {
      await mockRequest(page, "GET", PERMISSIONS_URL, { status: 401 });

      await page.goto("/admin/roles/2/edit");

      await expectLoginRedirect(page, "/admin/roles/2/edit");
    });

    test("role request fails and can be retried", async ({ page }) => {
      await mockRole(page, { message: "Test" }, 500);

      await page.goto("/admin/roles/2/edit");

      // Check that overlay is shown
      await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();

      // Check that error message is shown
      await expectToastAndClose(page, serverErrorToast);

      // Reload with correct data
      await mockRole(page, readFixture("role.json"));

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");

      const roleRequest = page.waitForRequest(ROLE_URL);
      const permissionsRequest = page.waitForRequest(PERMISSIONS_URL);
      await retryButton.click();
      await roleRequest;
      await permissionsRequest;

      // Check that overlay is not shown anymore
      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("role not found", async ({ page }) => {
      await interceptAdminRolesIndexRequests(page);
      await mockRole(
        page,
        { message: "model_not_found", model: "role", ids: [2] },
        404,
      );

      await page.goto("/admin/roles/2/edit");

      await expectRedirectToRolesIndex(page);
    });

    test("role request unauthenticated", async ({ page }) => {
      await mockRole(page, {}, 401);

      await page.goto("/admin/roles/2/edit");

      await expectLoginRedirect(page, "/admin/roles/2/edit");
    });
  });

  for (const userIsSuperuser of [true, false]) {
    test.describe(`user is ${userIsSuperuser ? "" : "not "}superuser`, () => {
      test.beforeEach(({ currentUser }) => {
        currentUser.data.superuser = userIsSuperuser;
      });

      test("role that is not a superuser role is editable", async ({
        page,
      }) => {
        const role = readFixture("role.json");
        role.data.room_limit = 5;
        await mockRole(page, role);

        await openEditPage(page);

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
        for (const permission of allPermissions) {
          await expect(checkbox(page, permission)).toBeEnabled();
        }
      });

      test("superuser role is only partly editable", async ({ page }) => {
        await mockRole(page, readFixture("superuserRole.json"));

        await openEditPage(page, "Superuser");

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

        await checkAllPermissions(
          page,
          allPermissions.map(() => T),
          true,
        );
      });
    });
  }
});
