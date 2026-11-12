import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Answers the GET requests of the url with the (mutable) body, other methods fall through to the next route.
 * @param {import("@playwright/test").Page} page
 * @param {string} url
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
 * Mocked data of the user profile page, served in every test (automatic fixtures). Change the objects before
 * `page.goto()`, the routes serve them.
 *
 * - `currentUser`: the logged in user, only has the permission `users.updateOwnAttributes`
 * - `profileUser`: the user shown on the page, John Doe with id 1 (`GET /api/v1/users/1`)
 * - `timezones` (`GET /api/v1/getTimezones`) and `sessions` (`GET /api/v1/sessions`)
 */
export const test = base.extend({
  currentUser: async ({ currentUser }, use) => {
    currentUser.data.permissions = ["users.updateOwnAttributes"];
    await use(currentUser);
  },
  profileUser: [
    async ({ page }, use) => {
      const profileUser = readFixture("userDataCurrentUser.json");
      await serveGet(page, "**/api/v1/users/1", profileUser);
      await use(profileUser);
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
