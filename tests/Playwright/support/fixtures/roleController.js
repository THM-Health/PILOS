import { test as base } from "../test.js";
import { mockApiList, mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `RoleController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `rolesResponse`: list of roles (GET /api/v1/roles)
 * - `roleResponse`: the role "Staff" with id 2 (GET /api/v1/roles/2)
 * - `rolesSecondPageResponse`: second page of the roles, not served, to be mocked by the test that switches the page
 */
export const test = base.extend({
  rolesResponse: async ({}, use) => {
    await use(readFixture("roles.json"));
  },
  getRolesApiMock: [
    async ({ page, rolesResponse }, use) => {
      await use(await mockApiList(page, "roles*", rolesResponse));
    },
    { auto: true },
  ],
  roleResponse: async ({}, use) => {
    const roleResponse = readFixture("role.json");
    await use(roleResponse);
  },
  getRoleApiMock: [
    async ({ page, roleResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "roles/2", () => ({
          json: roleResponse,
        })),
      );
    },
    { auto: true },
  ],

  rolesSecondPageResponse: async ({}, use) => {
    await use({
      data: [
        {
          id: 4,
          name: "Dean",
          default: false,
          updated_at: "2021-01-08T15:51:08.000000Z",
          model_name: "Role",
          room_limit: 20,
        },
        {
          id: 5,
          name: "Faculty",
          default: false,
          updated_at: "2021-03-19T09:12:44.000000Z",
          model_name: "Role",
          room_limit: 20,
        },
        {
          id: 6,
          name: "Manager",
          default: false,
          updated_at: "2021-05-22T11:55:21.000000Z",
          model_name: "Role",
          room_limit: -1,
        },
      ],
      meta: {
        current_page: 2,
        from: 4,
        last_page: 2,
        per_page: 3,
        to: 6,
        total: 6,
      },
    });
  },
});
