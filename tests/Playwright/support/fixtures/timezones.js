import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * Mock of the route `getTimezones` (a route without controller).
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `timezonesResponse`: the timezones (GET /api/v1/getTimezones)
 */
export const test = base.extend({
  timezonesResponse: async ({}, use) => {
    const timezonesResponse = readFixture("timezones.json");
    await use(timezonesResponse);
  },
  getTimezonesApiMock: [
    async ({ page, timezonesResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "getTimezones", () => ({
          json: timezonesResponse,
        })),
      );
    },
    { auto: true },
  ],
});
