import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Serves a mutable response for all requests of a method and url, other methods fall through to other mocks.
 * @param {import("@playwright/test").Page} page
 * @param {string} method
 * @param {string} url
 * @param {{ requests: import("@playwright/test").Request[], status?: number, json?: any }} mock - read on every
 *   request, so tests can change it before the page requests it
 */
async function serve(page, method, url, mock) {
  await page.route(url, (route) => {
    if (route.request().method() !== method) {
      return route.fallback();
    }
    mock.requests.push(route.request());
    return route.fulfill({
      status: mock.status ?? 200,
      json: mock.json,
    });
  });
}

/**
 * Mocked requests of the room abc-def-123 when it is accessed (served by routes, change the objects before `page.goto()`).
 * Mocks that are registered later in a test (e.g. to hold or fail a request) take precedence over these.
 *
 * All of them are automatic, tests change them before `page.goto()` or the request.
 * - `room`: the room (GET /api/v1/rooms/abc-def-123), `room.data` is the room itself.
 * - `roomRequests`: `{ requests }` of the room requests served by `room`.
 * - `roomAuth`: `{ requests, status, json }` of the room auth request (POST /api/v1/rooms/abc-def-123/auth),
 *   by default a successful login with the room auth token of type 0.
 * - `nameCheck`: `{ requests, status, json }` of the participant name check (POST /api/v1/participantName/check),
 *   by default valid (204).
 */
export const test = base.extend({
  roomRequests: async ({}, use) => {
    await use({ requests: [] });
  },
  room: [
    async ({ page, roomRequests }, use) => {
      const room = readFixture("room.json");
      await page.route("**/api/v1/rooms/abc-def-123*", (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }
        roomRequests.requests.push(route.request());
        return route.fulfill({ json: room });
      });
      await use(room);
    },
    { auto: true },
  ],
  roomAuth: [
    async ({ page }, use) => {
      const roomAuth = {
        requests: [],
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      };
      await serve(page, "POST", "**/api/v1/rooms/abc-def-123/auth*", roomAuth);
      await use(roomAuth);
    },
    { auto: true },
  ],
  nameCheck: [
    async ({ page }, use) => {
      const nameCheck = { requests: [], status: 204 };
      await serve(page, "POST", "**/api/v1/participantName/check", nameCheck);
      await use(nameCheck);
    },
    { auto: true },
  ],
});
