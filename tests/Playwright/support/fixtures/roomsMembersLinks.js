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
 * Serves a paginated list like the API does. If `meta.per_page` is smaller than the number of items, only the requested
 * page (query `page`) of the items is answered. `meta.current_page`, `meta.from` and `meta.to` are derived from the
 * request, the test sets `meta.per_page`, `meta.last_page`, `meta.total` and `meta.total_no_filter`.
 * While `failure.response` is set, this response (`{ status, json }`) is served instead of the list.
 * @param {import("@playwright/test").Page} page
 * @param {string} url
 * @param {{ data: object[], meta: object }} collection - read on every request
 * @param {{ response: object|null }} failure - read on every request
 */
async function serveCollection(page, url, collection, failure) {
  await page.route(url, (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    if (failure.response) {
      return route.fulfill(failure.response);
    }
    const { data, meta } = collection;
    const currentPage = Number(queryOf(route.request()).page ?? 1);
    const offset =
      meta.per_page < data.length ? (currentPage - 1) * meta.per_page : 0;
    const items =
      meta.per_page < data.length
        ? data.slice(offset, offset + meta.per_page)
        : data;
    return route.fulfill({
      json: {
        ...collection,
        data: items,
        meta: {
          ...meta,
          current_page: currentPage,
          from: items.length ? offset + 1 : null,
          to: items.length ? offset + items.length : null,
        },
      },
    });
  });
}

/**
 * Mocked data of the room view with the members and personalized links tab, served in every test (automatic fixtures).
 * Change the objects before the page requests them (before `page.goto()` or the action that reloads them), the routes
 * serve them. Mocks that a test registers with `page.route` or `mockMethod` take precedence.
 *
 * - `room`: the room "abc-def-123", the current user is the owner (GET /api/v1/rooms/abc-def-123)
 * - `roomFiles`: the files of the room without details (GET /api/v1/rooms/abc-def-123/files), shown after a redirect
 * - `roomMembers`: the members of the room (GET /api/v1/rooms/abc-def-123/member), paginated if `meta.per_page` is small
 * - `roomMembersFailure`: set `roomMembersFailure.response = { status, json }` to let the members request fail,
 *   set it back to `null` to serve the members again
 * - `personalizedLinks`: the personalized links of the room (GET /api/v1/rooms/abc-def-123/personalizedLinks),
 *   paginated like the members
 * - `personalizedLinksFailure`: like `roomMembersFailure`, for the personalized links
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
  roomMembersFailure: async ({}, use) => {
    await use({ response: null });
  },
  roomMembers: [
    async ({ page, roomMembersFailure }, use) => {
      const roomMembers = readFixture("roomMembers.json");
      await serveCollection(
        page,
        "**/api/v1/rooms/abc-def-123/member*",
        roomMembers,
        roomMembersFailure,
      );
      await use(roomMembers);
    },
    { auto: true },
  ],
  personalizedLinksFailure: async ({}, use) => {
    await use({ response: null });
  },
  personalizedLinks: [
    async ({ page, personalizedLinksFailure }, use) => {
      const personalizedLinks = readFixture("roomPersonalizedLinks.json");
      await serveCollection(
        page,
        "**/api/v1/rooms/abc-def-123/personalizedLinks*",
        personalizedLinks,
        personalizedLinksFailure,
      );
      await use(personalizedLinks);
    },
    { auto: true },
  ],
});
