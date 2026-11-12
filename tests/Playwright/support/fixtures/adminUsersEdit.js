import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/* eslint-disable no-unused-vars --
 * `mockApp` is requested to register the routes after its fallback route (later routes win), the auto fixture only
 * requests the resource fixtures. */

/**
 * Fixtures for the admin users edit pages (user 2 is edited).
 *
 * - `user`, `roles`: mutable copies of the fixture responses, served for GET requests. Change them before
 *   `page.goto()` (or before the app requests them again) to change what the app receives.
 * - `timezones`, `sessions`: served as they are.
 * - `secondRolesPage`: response of the second page of the roles, to be mocked by the test that switches the page.
 * - `adminUsersEditRequests` (auto): makes sure all requests of the edit page are mocked.
 *
 * Other methods than GET fall through, so the tests can mock saving with `mockMethod`.
 */
export const test = base.extend({
  user: async ({ page, mockApp }, use) => {
    const user = readFixture("userDataUser.json");
    await page.route("**/api/v1/users/2", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: user })
        : route.fallback(),
    );
    await use(user);
  },

  roles: async ({ page, mockApp }, use) => {
    const roles = readFixture("roles.json");
    await page.route("**/api/v1/roles*", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: roles })
        : route.fallback(),
    );
    await use(roles);
  },

  timezones: async ({ page, mockApp }, use) => {
    const timezones = readFixture("timezones.json");
    await page.route("**/api/v1/getTimezones", (route) =>
      route.fulfill({ json: timezones }),
    );
    await use(timezones);
  },

  sessions: async ({ page, mockApp }, use) => {
    const sessions = readFixture("sessions.json");
    await page.route("**/api/v1/sessions", (route) =>
      route.fulfill({ json: sessions }),
    );
    await use(sessions);
  },

  secondRolesPage: async ({}, use) => {
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

  adminUsersEditRequests: [
    async ({ user, roles, timezones, sessions }, use) => {
      await use();
    },
    { auto: true },
  ],
});
