import { test as base } from "../test.js";
import { mockApiRequest } from "../utils.js";

/**
 * @typedef {object} ParticipantNameCheckFixtures
 * @property {import("../utils.js").ApiMock} postParticipantNameCheckApiMock
 */

/**
 * - `postParticipantNameCheckApiMock`: `{ requests }` of the participant name check (POST /api/v1/participantName/check, a route without
 *   controller), by default valid (204), automatic fixture served in every test. Tests that need another response mock
 *   the request themselves with `mockApiRequest`, later mocks win.
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & ParticipantNameCheckFixtures, WorkerArgs> : never}
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
