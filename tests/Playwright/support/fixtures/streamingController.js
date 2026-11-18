import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/**
 * @typedef {object} StreamingControllerFixtures
 * @property {any} streamingResponse
 * @property {import("../utils.js").ApiMock} getStreamingApiMock
 */

/**
 * Mocks of the `StreamingController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `streamingResponse`: the streaming settings (GET /api/v1/streaming)
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & StreamingControllerFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  streamingResponse: async ({}, use) => {
    const streamingResponse = readFixture("streaming.json");
    await use(streamingResponse);
  },
  getStreamingApiMock: [
    async ({ page, streamingResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "streaming", () => ({
          json: streamingResponse,
        })),
      );
    },
    { auto: true },
  ],
});
