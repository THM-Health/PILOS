import { test as base } from "../test.js";
import { mockApiList, readFixture } from "../utils.js";

/**
 * @typedef {object} MeetingControllerFixtures
 * @property {any} meetingsResponse
 * @property {import("../utils.js").ApiListMock} getMeetingsApiMock
 */

/**
 * Mocks of the `MeetingController`, automatic fixtures served in every test.
 *
 * - `meetingsResponse`: the meetings of the meetings index page, answered by the list mock `getMeetingsApiMock`
 *   (GET /api/v1/meetings, see `mockApiList`).
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & MeetingControllerFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  meetingsResponse: async ({}, use) => {
    await use(readFixture("meetings.json"));
  },
  getMeetingsApiMock: [
    async ({ page, meetingsResponse }, use) => {
      await use(await mockApiList(page, "meetings*", meetingsResponse));
    },
    { auto: true },
  ],
});
