import { test as base } from "../test.js";
import { mockApiCollection, readFixture } from "../utils.js";

/**
 * Mocks of the `RoomFileController`, automatic fixtures served in every test (change the objects before the page requests
 * them). Tests that need another response mock the request themselves with `mockApiRequest`, later mocks win.
 *
 * - `roomFilesResponse`: the files of the room, paginated by `getRoomFilesApiMock` (GET /api/v1/rooms/abc-def-123/files)
 *   if `meta.per_page` is small
 * - `roomFilesFixtureName` (option): fixture file of the files, `roomFilesNoDetails.json` for the view without the
 *   details of the files (users that are not allowed to manage the room get these files from the API)
 */
export const test = base.extend({
  roomFilesFixtureName: ["roomFiles.json", { option: true }],
  roomFilesResponse: async ({ roomFilesFixtureName }, use) => {
    await use(readFixture(roomFilesFixtureName));
  },
  getRoomFilesApiMock: [
    async ({ page, roomFilesResponse }, use) => {
      await use(
        await mockApiCollection(
          page,
          "rooms/abc-def-123/files*",
          roomFilesResponse,
        ),
      );
    },
    { auto: true },
  ],
});
