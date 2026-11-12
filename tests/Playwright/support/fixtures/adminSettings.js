import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Mocked data of the admin settings page.
 *
 * - `settings` (automatic, the page needs it in every test): mutable copy of `settings.json`, served for `GET /api/v1/settings`. Change it before `page.goto()` to
 *   change what the page loads. Responses of save requests that use the same object return the state of the server.
 *   The timezones that the page needs for the default timezone dropdown are mocked together with it.
 * - `settingsRequests`: the `GET /api/v1/settings` requests that were made, to check if the page was reloaded.
 */
export const test = base.extend({
  settingsRequests: async ({}, use) => {
    await use([]);
  },
  settings: [
    async ({ page, settingsRequests }, use) => {
      const settings = readFixture("settings.json");
      await page.route("**/api/v1/settings", (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }
        settingsRequests.push(route.request());
        return route.fulfill({ json: settings });
      });
      await page.route("**/api/v1/getTimezones", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/timezones.json" }),
      );
      await use(settings);
    },
    { auto: true },
  ],
});
