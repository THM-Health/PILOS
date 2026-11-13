import { test as base } from "../test.js";
import { mockApiList, readFixture } from "../utils.js";

/**
 * Mocks of the `MeetingController`, automatic fixtures served in every test.
 *
 * - `meetingsResponse`: the meetings of the meetings index page, answered by the list mock `getMeetingsApiMock`
 *   (GET /api/v1/meetings, see `mockApiList`).
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
