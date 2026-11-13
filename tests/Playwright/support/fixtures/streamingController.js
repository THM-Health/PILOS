import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `StreamingController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `streamingResponse`: the streaming settings (GET /api/v1/streaming)
 */
export const test = base.extend({
  streamingResponse: [
    async ({ page }, use) => {
      const streamingResponse = readFixture("streaming.json");
      await mockApiRequest(page, "GET", "streaming", {
        json: streamingResponse,
      });
      await use(streamingResponse);
    },
    { auto: true },
  ],
});
