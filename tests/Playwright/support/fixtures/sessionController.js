import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `SessionController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `sessionsResponse`: the sessions of the user (GET /api/v1/sessions)
 */
export const test = base.extend({
  sessionsResponse: async ({}, use) => {
    const sessionsResponse = readFixture("sessions.json");
    await use(sessionsResponse);
  },
  getSessionsApiMock: [
    async ({ page, sessionsResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "sessions", () => ({
          json: sessionsResponse,
        })),
      );
    },
    { auto: true },
  ],
});
