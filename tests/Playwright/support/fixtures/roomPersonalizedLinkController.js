import { test as base } from "../test.js";
import { mockApiCollection, readFixture } from "../utils.js";

/**
 * @typedef {object} RoomPersonalizedLinkControllerFixtures
 * @property {any} personalizedLinksResponse
 * @property {import("../utils.js").ApiMock} getRoomPersonalizedLinksApiMock
 */

/**
 * Mocks of the `RoomPersonalizedLinkController`, automatic fixtures served in every test (change the objects before the
 * page requests them).
 *
 * - `personalizedLinksResponse`: the personalized links of the room, paginated by `getRoomPersonalizedLinksApiMock`
 *   (GET /api/v1/rooms/abc-def-123/personalizedLinks) if `meta.per_page` is small
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & RoomPersonalizedLinkControllerFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  personalizedLinksResponse: async ({}, use) => {
    await use(readFixture("roomPersonalizedLinks.json"));
  },
  getRoomPersonalizedLinksApiMock: [
    async ({ page, personalizedLinksResponse }, use) => {
      await use(
        await mockApiCollection(
          page,
          "rooms/abc-def-123/personalizedLinks*",
          personalizedLinksResponse,
        ),
      );
    },
    { auto: true },
  ],
});
