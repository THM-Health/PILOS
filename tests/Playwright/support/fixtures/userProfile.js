import { test as base } from "../test.js";

/**
 * - `currentUserResponse`: the logged in user, only has the permission `users.updateOwnAttributes`
 */
export const test = base.extend({
  currentUserResponse: async ({ currentUserResponse }, use) => {
    currentUserResponse.data.permissions = ["users.updateOwnAttributes"];
    await use(currentUserResponse);
  },
});
