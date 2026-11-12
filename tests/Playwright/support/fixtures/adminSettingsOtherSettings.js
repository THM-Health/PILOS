import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Fixtures for the admin settings page. Both are served for the whole test (`GET /api/v1/settings` and
 * `GET /api/v1/getTimezones`), a test changes them before `page.goto()` / `page.reload()`.
 */
export const test = base.extend({
  settings: [
    async ({ page }, use) => {
      const settings = readFixture("settings.json");
      await page.route("**/api/v1/settings", (route) =>
        route.fulfill({ json: settings }),
      );
      await use(settings);
    },
    { auto: true },
  ],
  timezones: [
    async ({ page }, use) => {
      const timezones = readFixture("timezones.json");
      await page.route("**/api/v1/getTimezones", (route) =>
        route.fulfill({ json: timezones }),
      );
      await use(timezones);
    },
    { auto: true },
  ],
});

export { expect, expectToastAndClose } from "../test.js";
