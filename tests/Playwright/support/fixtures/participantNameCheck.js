import { test as base } from "../test.js";
import { mockApiRequest } from "../utils.js";

/**
 * - `postParticipantNameCheckApiMock`: `{ requests }` of the participant name check (POST /api/v1/participantName/check, a route without
 *   controller), by default valid (204), automatic fixture served in every test. Tests that need another response mock
 *   the request themselves with `mockApiRequest`, later mocks win.
 */
export const test = base.extend({
  postParticipantNameCheckApiMock: [
    async ({ page }, use) => {
      await use(
        await mockApiRequest(page, "POST", "participantName/check", {
          status: 204,
        }),
      );
    },
    { auto: true },
  ],
});
