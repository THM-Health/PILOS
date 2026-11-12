import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Fixtures for the admin streaming settings page. Both are served for the whole test
 * (`GET /api/v1/streaming` and `GET /api/v1/roomTypes/3/streaming`), a test changes them before the page requests them.
 */
export const test = base.extend({
  streaming: [
    async ({ page }, use) => {
      const streaming = readFixture("streaming.json");
      await page.route("**/api/v1/streaming", (route) =>
        route.request().method() === "GET"
          ? route.fulfill({ json: streaming })
          : route.fallback(),
      );
      await use(streaming);
    },
    { auto: true },
  ],
  roomTypeStreaming: [
    async ({ page }, use) => {
      const roomTypeStreaming = readFixture("roomTypeStreamingSettings.json");
      await page.route("**/api/v1/roomTypes/3/streaming", (route) =>
        route.request().method() === "GET"
          ? route.fulfill({ json: roomTypeStreaming })
          : route.fallback(),
      );
      await use(roomTypeStreaming);
    },
    { auto: true },
  ],
});

export { expect, expectToastAndClose } from "../test.js";
