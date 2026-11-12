import { test as base } from "../test.js";
import { readFixture } from "../utils.js";
import { checkPermissionGroup } from "../admin.js";

// Permissions in the order of the permission list of the role pages
const permissionNames = [
  ...["rooms.create", "rooms.viewAll", "rooms.manage"],
  "meetings.viewAny",
  "admin.view",
  ...["settings.viewAny", "settings.update"],
  "system.monitor",
  ...["users.viewAny", "users.view", "users.update", "users.create"],
  ...["users.delete", "users.updateOwnAttributes"],
  ...["roles.viewAny", "roles.view", "roles.update", "roles.create"],
  "roles.delete",
  ...["roomTypes.view", "roomTypes.update", "roomTypes.create"],
  "roomTypes.delete",
  ...["servers.viewAny", "servers.view", "servers.update", "servers.create"],
  "servers.delete",
  ...["serverPools.viewAny", "serverPools.view", "serverPools.update"],
  ...["serverPools.create", "serverPools.delete"],
];

/**
 * Serves a mutable body for all GET requests of a url, other methods fall through to later mocks.
 * @param {import("@playwright/test").Page} page
 * @param {string|Function} url
 * @param {object} body - read on every request, so tests can change it before the page requests it
 */
async function serveGet(page, url, body) {
  await page.route(url, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: body })
      : route.fallback(),
  );
}

/**
 * Mocked data of the admin roles pages, served in every test (automatic fixtures). Change the objects before `page.goto()`, the routes serve them.
 *
 * - `roles`: list of roles (GET /api/v1/roles)
 * - `role`: the role "Staff" with id 2 (GET /api/v1/roles/2)
 * - `permissionList`: all permissions (GET /api/v1/permissions), not called `permissions` because that is a Playwright option
 */
export const test = base.extend({
  roles: [
    async ({ page }, use) => {
      const roles = readFixture("roles.json");
      await serveGet(page, (url) => url.pathname === "/api/v1/roles", roles);
      await use(roles);
    },
    { auto: true },
  ],
  role: [
    async ({ page }, use) => {
      const role = readFixture("role.json");
      await serveGet(page, "**/api/v1/roles/2", role);
      await use(role);
    },
    { auto: true },
  ],
  permissionList: [
    async ({ page }, use) => {
      const permissionList = readFixture("permissions.json");
      await serveGet(page, "**/api/v1/permissions", permissionList);
      await use(permissionList);
    },
    { auto: true },
  ],
  expectPermissions: async ({ page, permissionList }, use) => {
    await use(async (explicit, { restrictions = [] } = {}) => {
      const nameById = Object.fromEntries(
        permissionList.data.map((permission) => [
          permission.id,
          permission.name,
        ]),
      );
      const included = new Set(explicit);
      for (const permission of permissionList.data) {
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

      for (const [index, permission] of permissionNames.entries()) {
        await checkPermissionGroup(
          page,
          index,
          permission,
          explicit.includes(permission),
          included.has(permission),
          isRestricted(permission),
        );
      }
    });
  },
});
