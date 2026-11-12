import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  checkPermissionGroup,
  checkRoomLimitHelpDialog,
  expectAdminBreadcrumbs,
} from "../support/admin.js";
import {
  interceptAdminRolesViewRequests,
  interceptAdminRolesIndexRequests,
} from "../support/mocks.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { mockMethod } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const ROLE_URL = "**/api/v1/roles/2";
const PERMISSIONS_URL = "**/api/v1/permissions";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

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

/**
 * Check the room limit field: text of the default option and which mode is selected (all disabled).
 * @param {import("@playwright/test").Page} page
 * @param {string} defaultText
 * @param {"default"|"unlimited"|"custom"} mode
 */
async function expectRoomLimit(page, defaultText, mode) {
  const field = page.getByTestId("room-limit-field");
  await expect(field).toBeVisible();
  await expect(field).toContainText("app.room_limit");

  const options = {
    default: [defaultText, "room-limit-mode-default-field"],
    unlimited: ["app.unlimited", "room-limit-mode-unlimited-field"],
    custom: ["admin.roles.room_limit.custom", "room-limit-mode-custom-field"],
  };
  for (const [name, [text, testId]] of Object.entries(options)) {
    const option = field.getByTestId(testId);
    await expect(option).toBeVisible();
    await expect(option).toContainText(text);
    const radio = option.locator(`#${name}`);
    if (name === mode) {
      await expect(radio).toBeChecked();
    } else {
      await expect(radio).not.toBeChecked();
    }
    await expect(radio).toBeDisabled();
  }
}

test.describe("Admin roles view", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    await interceptAdminRolesViewRequests(page);
    currentUser.data.permissions = [
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
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view", "roles.viewAny"];

    await page.goto("/admin/roles/2");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/roles\/2/);
  });

  test.describe("loading and display", () => {
    test("loading state hides buttons until the role is loaded", async ({
      page,
    }) => {
      const roleRequest = await mockMethod(page, "GET", ROLE_URL, {
        hold: true,
        json: readFixture("role.json"),
      });

      await page.goto("/admin/roles/2");

      await expect(page.getByText("admin.title").first()).toBeVisible();

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      roleRequest.release();

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

      await expectRoomLimit(
        page,
        'admin.roles.room_limit.default_{"value":"app.unlimited"}',
        "default",
      );
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
      test.beforeEach(async ({ page }) => {
        const permissions = readFixture("permissions.json");
        for (const index of [18, 19, 20, 21]) {
          permissions.data[index].included_permissions = [];
        }
        await page.route(PERMISSIONS_URL, (route) =>
          route.fulfill({ json: permissions }),
        );
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

    test("no permissions available", async ({ page }) => {
      await page.route(PERMISSIONS_URL, (route) =>
        route.fulfill({ json: { data: [], meta: { restrictions: [""] } } }),
      );

      await page.goto("/admin/roles/2");

      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.locator("#name")).toBeDisabled();
      await expectRoomLimit(
        page,
        'admin.roles.room_limit.default_{"value":"app.unlimited"}',
        "default",
      );
      await expect(page.locator("#room-limit")).toHaveCount(0);

      await expect(
        page.getByText("admin.roles.permissions_title"),
      ).toBeVisible();
      await expect(page.getByText("admin.roles.no_options")).toBeVisible();
      await expect(page.getByTestId("permission-list")).toHaveCount(0);
    });
  });

  test.describe("room limit", () => {
    test.beforeEach(async ({ config }) => {
      config.data.room.limit = 5;
    });

    test("system default", async ({ page }) => {
      await page.goto("/admin/roles/2");

      await expectRoomLimit(
        page,
        'admin.roles.room_limit.default_{"value":5}',
        "default",
      );
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("unlimited", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.room_limit = -1;
      await page.route(ROLE_URL, (route) => route.fulfill({ json: role }));

      await page.goto("/admin/roles/2");

      await expectRoomLimit(
        page,
        'admin.roles.room_limit.default_{"value":5}',
        "unlimited",
      );
      await expect(page.locator("#room-limit")).toHaveCount(0);
    });

    test("custom", async ({ page }) => {
      const role = readFixture("role.json");
      role.data.room_limit = 2;
      await page.route(ROLE_URL, (route) => route.fulfill({ json: role }));

      await page.goto("/admin/roles/2");

      await expectRoomLimit(
        page,
        'admin.roles.room_limit.default_{"value":5}',
        "custom",
      );
      await expect(page.locator("#room-limit")).toBeVisible();
      await expect(page.locator("#room-limit")).toHaveValue("2");
      await expect(page.locator("#room-limit")).toBeDisabled();
    });
  });

  test.describe("load errors", () => {
    test("role request fails and can be retried", async ({ page }) => {
      await mockMethod(page, "GET", ROLE_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/roles/2");

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("overlay")).toBeVisible();

      // Reload with correct data
      await mockMethod(page, "GET", ROLE_URL, {
        json: readFixture("role.json"),
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

      await expect(page.locator("#name")).toHaveValue("Staff");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test("role not found", async ({ page }) => {
      await interceptAdminRolesIndexRequests(page);
      await mockMethod(page, "GET", ROLE_URL, {
        status: 404,
        json: { message: "model_not_found", model: "role", ids: [2] },
      });

      await page.goto("/admin/roles/2");

      // Check that redirect worked
      await expect(page).toHaveURL(/\/admin\/roles$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.role"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("role request unauthenticated", async ({ page }) => {
      await mockMethod(page, "GET", ROLE_URL, { status: 401 });

      await page.goto("/admin/roles/2");

      await expectLoginRedirect(page, "/admin/roles/2");
    });

    test("permissions request fails and can be retried", async ({ page }) => {
      const permissionsRequest = await mockMethod(
        page,
        "GET",
        PERMISSIONS_URL,
        { hold: true, status: 500, json: { message: "Test" } },
      );

      await page.goto("/admin/roles/2");

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      permissionsRequest.release();

      await expectToastAndClose(page, serverErrorToast);

      // Check that overlay is still shown because of error
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);

      // Reload with correct data
      await mockMethod(page, "GET", PERMISSIONS_URL, {
        json: readFixture("permissions.json"),
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
      await mockMethod(page, "GET", PERMISSIONS_URL, { status: 401 });

      await page.goto("/admin/roles/2");

      await expectLoginRedirect(page, "/admin/roles/2");
    });
  });

  test.describe("button visibility", () => {
    test("with update permission", async ({ page, currentUser }) => {
      currentUser.data.permissions.push("roles.update");

      await page.goto("/admin/roles/2");

      const editButton = page.getByTestId("roles-edit-button");
      await expect(editButton).toBeVisible();
      await expect(editButton).toHaveText("app.edit");
      await expect(editButton).toHaveAttribute("href", "/admin/roles/2/edit");
      await expect(page.getByTestId("roles-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("roles-save-button")).toHaveCount(0);
    });

    test("with delete permission", async ({ page, currentUser }) => {
      currentUser.data.permissions.push(
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
        test.beforeEach(async ({ currentUser }) => {
          if (userIsSuperuser === false) {
            currentUser.data.superuser = false;
          }
          currentUser.data.permissions.push(
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

        test("role is a superuser role", async ({ page }) => {
          const role = readFixture("role.json");
          role.data.superuser = true;
          await page.route(ROLE_URL, (route) => route.fulfill({ json: role }));

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
