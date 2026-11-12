import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Serves a mutable response for the GET requests of a url. Other methods fall through to other mocks, mocks that are
 * registered later in a test (e.g. to hold a request) take precedence.
 * @param {import("@playwright/test").Page} page
 * @param {string} url
 * @param {{ requests: import("@playwright/test").Request[], status: number, json: any, waiting: Function[] }} mock
 */
async function serve(page, url, mock) {
  await page.route(url, (route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      return route.fallback();
    }
    mock.requests.push(request);
    mock.waiting.splice(0).forEach((resolve) => resolve(request));
    return route.fulfill({ status: mock.status, json: mock.json });
  });
}

/**
 * Mocked requests of the rooms index page (served by routes, change the objects before `page.goto()` or the request).
 *
 * - `rooms`: the room list (GET /api/v1/rooms) with `{ requests, status, json }`, `json` is the rooms fixture.
 *   `next()` returns the promise of the next request (call it before the action that triggers the request).
 *   `show({ slice, meta })` resets `json` to the fixture with a slice of the rooms and changed meta data,
 *   `showPage(pageNumber, lastPage, meta)` to one room per page, `showAll()` to the fixture, `showNoneFound()` to a
 *   search without result and `showNoneAvailable()` to no rooms at all.
 * - `roomTypes`: the room types (GET /api/v1/roomTypes) with `{ requests, status, json }`,
 *   `roomTypes.withSettings()` switches `json` to the room types with default room settings and features.
 */
export const test = base.extend({
  rooms: [
    async ({ page }, use) => {
      const waiting = [];
      const rooms = {
        requests: [],
        waiting,
        status: 200,
        json: readFixture("rooms.json"),
        next: () => new Promise((resolve) => waiting.push(resolve)),
        show({ slice, meta } = {}) {
          const json = readFixture("rooms.json");
          if (slice) {
            json.data = json.data.slice(...slice);
          }
          Object.assign(json.meta, meta);
          rooms.json = json;
        },
        showPage(pageNumber, lastPage, meta) {
          rooms.show({
            slice: [pageNumber - 1, pageNumber],
            meta: {
              current_page: pageNumber,
              from: pageNumber,
              to: pageNumber,
              last_page: lastPage,
              per_page: 1,
              ...meta,
            },
          });
        },
        showAll() {
          rooms.show();
        },
        showNoneFound() {
          rooms.show({
            slice: [0, 0],
            meta: { from: null, per_page: 1, to: null, total: 0 },
          });
        },
        showNoneAvailable() {
          rooms.show({
            slice: [0, 0],
            meta: {
              from: null,
              per_page: 1,
              to: null,
              total: 0,
              total_no_filter: 0,
            },
          });
        },
      };
      await serve(page, "**/api/v1/rooms*", rooms);
      await use(rooms);
    },
    { auto: true },
  ],
  roomTypes: [
    async ({ page }, use) => {
      const waiting = [];
      const roomTypes = {
        requests: [],
        waiting,
        status: 200,
        json: readFixture("roomTypes.json"),
        withSettings() {
          roomTypes.json = readFixture("roomTypesWithSettings.json");
        },
      };
      await serve(page, "**/api/v1/roomTypes*", roomTypes);
      await use(roomTypes);
    },
    { auto: true },
  ],
});
