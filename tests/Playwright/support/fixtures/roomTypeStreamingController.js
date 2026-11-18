import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * @typedef {object} RoomTypeStreamingControllerFixtures
 * @property {any} roomTypeStreamingResponse
 * @property {import("../utils.js").ApiMock} getRoomTypeStreamingApiMock
 */

/**
 * Mocks of the `RoomTypeStreamingController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `roomTypeStreamingResponse`: the streaming settings of the room type 3 (GET /api/v1/roomTypes/3/streaming)
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & RoomTypeStreamingControllerFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  roomTypeStreamingResponse: async ({}, use) => {
    const roomTypeStreamingResponse = readFixture(
      "roomTypeStreamingSettings.json",
    );
    await use(roomTypeStreamingResponse);
  },
  getRoomTypeStreamingApiMock: [
    async ({ page, roomTypeStreamingResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "roomTypes/3/streaming", () => ({
          json: roomTypeStreamingResponse,
        })),
      );
    },
    { auto: true },
  ],
});
