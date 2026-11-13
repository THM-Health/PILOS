import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";
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
 * Mocks of the `PermissionController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `permissionsResponse`: all permissions (GET /api/v1/permissions)
 * - `expectPermissions(explicit, { restrictions })`: checks the permission list of the role pages
 */
export const test = base.extend({
  permissionsResponse: [
    async ({ page }, use) => {
      const permissionsResponse = readFixture("permissions.json");
      await mockApiRequest(page, "GET", "permissions", {
        json: permissionsResponse,
      });
      await use(permissionsResponse);
    },
    { auto: true },
  ],
  expectPermissions: async ({ page, permissionsResponse }, use) => {
    await use(async (explicit, { restrictions = [] } = {}) => {
      const nameById = Object.fromEntries(
        permissionsResponse.data.map((permission) => [
          permission.id,
          permission.name,
        ]),
      );
      const included = new Set(explicit);
      for (const permission of permissionsResponse.data) {
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
