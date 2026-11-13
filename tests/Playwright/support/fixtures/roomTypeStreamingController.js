import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `RoomTypeStreamingController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `roomTypeStreamingResponse`: the streaming settings of the room type 3 (GET /api/v1/roomTypes/3/streaming)
 */
export const test = base.extend({
  roomTypeStreamingResponse: [
    async ({ page }, use) => {
      const roomTypeStreamingResponse = readFixture(
        "roomTypeStreamingSettings.json",
      );
      await mockApiRequest(page, "GET", "roomTypes/3/streaming", {
        json: roomTypeStreamingResponse,
      });
      await use(roomTypeStreamingResponse);
    },
    { auto: true },
  ],
});
