import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Answers the GET requests of the url with the (mutable) body, other methods fall through to the next route.
 * @param {import("@playwright/test").Page} page
 * @param {string|RegExp|Function} url
 * @param {object} body
 */
async function serveGet(page, url, body) {
  await page.route(url, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: body })
      : route.fallback(),
  );
}

/**
 * Mocked data of the admin users pages. Every fixture is served by a route, a test changes the object (before or after
 * `page.goto()`) to change what the app receives:
 * - `users`: list of users (`GET /api/v1/users`)
 * - `paginateUsers(pageNumber, lastPage, meta)`: reduces `users` to the single user of that page (one user per page)
 * - `roles`: first page of the roles (`GET /api/v1/roles`), `secondRoles`: the second page of them (not served, a test
 *   mocks it where needed)
 * - `user`: the viewed user Laura Rivera (`GET /api/v1/users/2`)
 * - `timezones` (`GET /api/v1/getTimezones`) and `sessions` (`GET /api/v1/sessions`)
 */
export const test = base.extend({
  users: [
    async ({ page }, use) => {
      const users = readFixture("users.json");
      await serveGet(page, "**/api/v1/users*", users);
      await use(users);
    },
    { auto: true },
  ],

  paginateUsers: async ({ users }, use) => {
    const allUsers = structuredClone(users.data);
    await use((pageNumber, lastPage, meta = {}) => {
      users.data = structuredClone(allUsers).slice(pageNumber - 1, pageNumber);
      Object.assign(users.meta, {
        current_page: pageNumber,
        from: pageNumber,
        last_page: lastPage,
        per_page: 1,
        to: pageNumber,
        ...meta,
      });
    });
  },

  roles: [
    async ({ page }, use) => {
      const roles = readFixture("roles.json");
      await serveGet(page, "**/api/v1/roles*", roles);
      await use(roles);
    },
    { auto: true },
  ],

  secondRoles: async ({}, use) => {
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

  user: [
    async ({ page }, use) => {
      const user = readFixture("userDataUser.json");
      await serveGet(page, "**/api/v1/users/2", user);
      await use(user);
    },
    { auto: true },
  ],

  timezones: [
    async ({ page }, use) => {
      const timezones = readFixture("timezones.json");
      await serveGet(page, "**/api/v1/getTimezones", timezones);
      await use(timezones);
    },
    { auto: true },
  ],

  sessions: [
    async ({ page }, use) => {
      const sessions = readFixture("sessions.json");
      await serveGet(page, "**/api/v1/sessions", sessions);
      await use(sessions);
    },
    { auto: true },
  ],
});
