import { test as base } from "../test.js";
import { mockApiCollection, readFixture } from "../utils.js";

/**
 * Mocks of the `RecordingController`, automatic fixtures served in every test (change the objects before the page
 * requests them).
 *
 * - `roomRecordingsResponse`: the recordings of the room, paginated by `getRoomRecordingsApiMock`
 *   (GET /api/v1/rooms/abc-def-123/recordings) if `meta.per_page` is small
 */
export const test = base.extend({
  roomRecordingsResponse: async ({}, use) => {
    await use(readFixture("roomRecordings.json"));
  },
  getRoomRecordingsApiMock: [
    async ({ page, roomRecordingsResponse }, use) => {
      await use(
        await mockApiCollection(
          page,
          "rooms/abc-def-123/recordings*",
          roomRecordingsResponse,
        ),
      );
    },
    { auto: true },
  ],
});
