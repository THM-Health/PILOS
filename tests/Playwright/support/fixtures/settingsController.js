import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `SettingsController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `settingsResponse`: the settings (GET /api/v1/settings). Responses of save requests that use the same object return
 *   the state of the server.
 */
export const test = base.extend({
  settingsResponse: async ({}, use) => {
    await use(readFixture("settings.json"));
  },
  getSettingsApiMock: [
    async ({ page, settingsResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "settings", () => ({
          json: settingsResponse,
        })),
      );
    },
    { auto: true },
  ],
});
