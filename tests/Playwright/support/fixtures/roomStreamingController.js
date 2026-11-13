import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `RoomStreamingController`, automatic fixtures served in every test (change the objects before the page
 * requests them).
 *
 * - `roomStreamingStatusResponse`: the streaming status (GET /api/v1/rooms/abc-def-123/streaming/status)
 * - `roomStreamingConfigResponse`: the streaming config of the dialog (GET /api/v1/rooms/abc-def-123/streaming/config)
 */
export const test = base.extend({
  roomStreamingStatusResponse: async ({}, use) => {
    const roomStreamingStatusResponse = readFixture("roomStreamingStatus.json");
    await use(roomStreamingStatusResponse);
  },
  getRoomStreamingStatusApiMock: [
    async ({ page, roomStreamingStatusResponse }, use) => {
      await use(
        await mockApiRequest(
          page,
          "GET",
          "rooms/abc-def-123/streaming/status",
          () => ({ json: roomStreamingStatusResponse }),
        ),
      );
    },
    { auto: true },
  ],
  roomStreamingConfigResponse: async ({}, use) => {
    const roomStreamingConfigResponse = readFixture("roomStreamingConfig.json");
    await use(roomStreamingConfigResponse);
  },
  getRoomStreamingConfigApiMock: [
    async ({ page, roomStreamingConfigResponse }, use) => {
      await use(
        await mockApiRequest(
          page,
          "GET",
          "rooms/abc-def-123/streaming/config",
          () => ({ json: roomStreamingConfigResponse }),
        ),
      );
    },
    { auto: true },
  ],
});
