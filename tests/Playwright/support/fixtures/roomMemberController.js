import { test as base } from "../test.js";
import { mockApiCollection, readFixture } from "../utils.js";

/**
 * @typedef {object} RoomMemberControllerFixtures
 * @property {any} roomMembersResponse
 * @property {import("../utils.js").ApiMock} getRoomMembersApiMock
 */

/**
 * Mocks of the `RoomMemberController`, automatic fixtures served in every test (change the objects before the page
 * requests them).
 *
 * - `roomMembersResponse`: the members of the room, paginated by `getRoomMembersApiMock`
 *   (GET /api/v1/rooms/abc-def-123/member) if `meta.per_page` is small
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & RoomMemberControllerFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  roomMembersResponse: async ({}, use) => {
    await use(readFixture("roomMembers.json"));
  },
  getRoomMembersApiMock: [
    async ({ page, roomMembersResponse }, use) => {
      await use(
        await mockApiCollection(
          page,
          "rooms/abc-def-123/member*",
          roomMembersResponse,
        ),
      );
    },
    { auto: true },
  ],
});
