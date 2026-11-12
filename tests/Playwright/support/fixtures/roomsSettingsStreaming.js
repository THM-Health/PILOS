import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Serves a mutable body for all GET requests of a url, other methods fall through to later mocks.
 * @param {import("@playwright/test").Page} page
 * @param {string|Function} url
 * @param {{ status?: number, json: object }|object} body - read on every request, so tests can change it before the
 *   page requests it
 */
async function serveGet(page, url, body) {
  await page.route(url, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: body })
      : route.fallback(),
  );
}

/**
 * Mocked data of the room view with the settings and streaming tab, served in every test (automatic fixtures).
 * Change the objects before the page requests them (before `page.goto()` or the action that reloads them), the routes
 * serve them. Mocks that a test registers with `page.route` or `mockMethod` take precedence.
 *
 * - `room`: the room "abc-def-123", the current user is the owner (GET /api/v1/rooms/abc-def-123)
 * - `roomFiles`: the files of the room without details (GET /api/v1/rooms/abc-def-123/files), shown after a redirect
 * - `roomSettings`: the settings of the room (GET /api/v1/rooms/abc-def-123/settings)
 * - `roomTypes`: the room types with their settings (GET /api/v1/roomTypes), shown in the room type change dialog
 * - `userSearch`: `{ status, json }` answered to the user search of the transfer ownership dialog
 *   (GET /api/v1/users/search), by default three users
 * - `roomStreamingStatus`: the streaming status (GET /api/v1/rooms/abc-def-123/streaming/status)
 * - `roomStreamingConfig`: the streaming config of the dialog (GET /api/v1/rooms/abc-def-123/streaming/config)
 */
export const test = base.extend({
  room: [
    async ({ page }, use) => {
      const room = readFixture("room.json");
      await serveGet(
        page,
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        room,
      );
      await use(room);
    },
    { auto: true },
  ],
  roomFiles: [
    async ({ page }, use) => {
      const roomFiles = readFixture("roomFilesNoDetails.json");
      await serveGet(page, "**/api/v1/rooms/abc-def-123/files*", roomFiles);
      await use(roomFiles);
    },
    { auto: true },
  ],
  roomSettings: [
    async ({ page }, use) => {
      const roomSettings = readFixture("roomSettings.json");
      await serveGet(
        page,
        "**/api/v1/rooms/abc-def-123/settings",
        roomSettings,
      );
      await use(roomSettings);
    },
    { auto: true },
  ],
  roomTypes: [
    async ({ page }, use) => {
      const roomTypes = readFixture("roomTypesWithSettings.json");
      await serveGet(page, "**/api/v1/roomTypes*", roomTypes);
      await use(roomTypes);
    },
    { auto: true },
  ],
  userSearch: [
    async ({ page }, use) => {
      const userSearch = {
        status: 200,
        json: {
          data: [
            {
              id: 5,
              firstname: "Laura",
              lastname: "Rivera",
              email: "LauraWRivera@domain.tld",
              image: null,
            },
            {
              id: 10,
              firstname: "Laura",
              lastname: "Walter",
              email: "LauraMWalter@domain.tld",
              image: null,
            },
            {
              id: 1,
              firstname: "John",
              lastname: "Doe",
              email: "JohnDoe@domain.tld",
              image: null,
            },
          ],
        },
      };
      await page.route(/\/api\/v1\/users\/search\?query=/, (route) =>
        route.request().method() === "GET"
          ? route.fulfill(userSearch)
          : route.fallback(),
      );
      await use(userSearch);
    },
    { auto: true },
  ],
  roomStreamingStatus: [
    async ({ page }, use) => {
      const roomStreamingStatus = readFixture("roomStreamingStatus.json");
      await serveGet(
        page,
        "**/api/v1/rooms/abc-def-123/streaming/status",
        roomStreamingStatus,
      );
      await use(roomStreamingStatus);
    },
    { auto: true },
  ],
  roomStreamingConfig: [
    async ({ page }, use) => {
      const roomStreamingConfig = readFixture("roomStreamingConfig.json");
      await serveGet(
        page,
        "**/api/v1/rooms/abc-def-123/streaming/config",
        roomStreamingConfig,
      );
      await use(roomStreamingConfig);
    },
    { auto: true },
  ],
});
