import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * @typedef {object} RoomStreamingControllerFixtures
 * @property {any} roomStreamingStatusResponse
 * @property {import("../utils.js").ApiMock} getRoomStreamingStatusApiMock
 * @property {any} roomStreamingConfigResponse
 * @property {import("../utils.js").ApiMock} getRoomStreamingConfigApiMock
 */

/**
 * Mocks of the `RoomStreamingController`, automatic fixtures served in every test (change the objects before the page
 * requests them).
 *
 * - `roomStreamingStatusResponse`: the streaming status (GET /api/v1/rooms/abc-def-123/streaming/status)
 * - `roomStreamingConfigResponse`: the streaming config of the dialog (GET /api/v1/rooms/abc-def-123/streaming/config)
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & RoomStreamingControllerFixtures, WorkerArgs> : never}
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
