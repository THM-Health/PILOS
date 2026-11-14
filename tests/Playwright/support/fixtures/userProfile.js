import { test as base } from "../test.js";

/**
 * @typedef {object} UserProfileFixtures
 * @property {any} currentUserResponse
 */

/**
 * - `currentUserResponse`: the logged in user, only has the permission `users.updateOwnAttributes`
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & UserProfileFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  currentUserResponse: async ({ currentUserResponse }, use) => {
    currentUserResponse.data.permissions = ["users.updateOwnAttributes"];
    await use(currentUserResponse);
  },
});
