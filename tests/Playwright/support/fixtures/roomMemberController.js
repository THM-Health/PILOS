import { test as base } from "../test.js";
import { mockApiCollection, readFixture } from "../utils.js";

/**
 * Mocks of the `RoomMemberController`, automatic fixtures served in every test (change the objects before the page
 * requests them).
 *
 * - `roomMembersResponse`: the members of the room, paginated by `getRoomMembersApiMock`
 *   (GET /api/v1/rooms/abc-def-123/member) if `meta.per_page` is small
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
