import { test as base } from "../test.js";
import { queryOf, readFixture } from "../utils.js";

/**
 * Serves a mutable body for all GET requests of a url, other methods fall through to later mocks.
 * @param {import("@playwright/test").Page} page
 * @param {string|Function} url
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
 * Serves a paginated list like the API does: if `meta.per_page` is smaller than the number of items, only the requested
 * page (query `page`) of the items is answered. The test sets `meta.last_page`, `meta.total` and `meta.total_no_filter`.
 * @param {import("@playwright/test").Page} page
 * @param {string} url
 * @param {{ data: object[], meta: object }} collection - read on every request
 */
async function serveCollection(page, url, collection) {
  await page.route(url, (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    const { data, meta } = collection;
    if (meta.per_page >= data.length) {
      return route.fulfill({ json: collection });
    }
    const currentPage = Number(queryOf(route.request()).page ?? 1);
    const items = data.slice(
      (currentPage - 1) * meta.per_page,
      currentPage * meta.per_page,
    );
    return route.fulfill({
      json: {
        ...collection,
        data: items,
        meta: {
          ...meta,
          current_page: currentPage,
          from: (currentPage - 1) * meta.per_page + 1,
          to: (currentPage - 1) * meta.per_page + items.length,
        },
      },
    });
  });
}

/**
 * Mocked data of the room view with the files and recordings tab, served in every test (automatic fixtures).
 * Change the objects before the page requests them (before `page.goto()` or the action that reloads them), the routes
 * serve them. Mocks that a test registers with `page.route` or `mockMethod` take precedence.
 *
 * - `room`: the room "abc-def-123", the current user is the owner (GET /api/v1/rooms/abc-def-123)
 * - `roomFiles`: the files of the room (GET /api/v1/rooms/abc-def-123/files), paginated if `meta.per_page` is small
 * - `roomRecordings`: the recordings of the room (GET /api/v1/rooms/abc-def-123/recordings), paginated like the files
 * - `postMessage(message)`: sends a message to the app window (like the windows of the file download and recording
 *   formats do) and resolves when the window has dispatched it, so the app had the chance to react
 * - `roomFilesFixtureName` (option): fixture file of the files, `roomFilesNoDetails.json` for the view without the
 *   details of the files (users that are not allowed to manage the room get these files from the API)
 */
export const test = base.extend({
  roomFilesFixtureName: ["roomFiles.json", { option: true }],
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
    async ({ page, roomFilesFixtureName }, use) => {
      const roomFiles = readFixture(roomFilesFixtureName);
      await serveCollection(
        page,
        "**/api/v1/rooms/abc-def-123/files*",
        roomFiles,
      );
      await use(roomFiles);
    },
    { auto: true },
  ],
  postMessage: async ({ page }, use) => {
    await use((message) =>
      page.evaluate(
        (message) =>
          new Promise((resolve) => {
            // registered after the listener of the app, so the app has handled the message when this resolves
            window.addEventListener("message", () => resolve(), { once: true });
            window.postMessage(message, window.location.origin);
          }),
        message,
      ),
    );
  },
  roomRecordings: [
    async ({ page }, use) => {
      const roomRecordings = readFixture("roomRecordings.json");
      await serveCollection(
        page,
        "**/api/v1/rooms/abc-def-123/recordings*",
        roomRecordings,
      );
      await use(roomRecordings);
    },
    { auto: true },
  ],
});
