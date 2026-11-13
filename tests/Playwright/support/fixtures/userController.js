import { test as base } from "../test.js";
import { mockApiList, mockApiRequest, readFixture } from "../utils.js";

/**
 * Mocks of the `UserController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `usersResponse`: list of users, answered by the list mock `getUsersApiMock` (GET /api/v1/users, see `mockApiList`)
 * - `userResponse`: the viewed user Laura Rivera (GET /api/v1/users/2)
 * - `profileUserResponse`: the user shown on the profile page, John Doe (GET /api/v1/users/1)
 * - `userSearchResponse`: `{ status, json }` answered to the user search (GET /api/v1/users/search), by default three users
 */
export const test = base.extend({
  usersResponse: async ({}, use) => {
    await use(readFixture("users.json"));
  },
  getUsersApiMock: [
    async ({ page, usersResponse }, use) => {
      await use(await mockApiList(page, "users*", usersResponse));
    },
    { auto: true },
  ],

  userResponse: [
    async ({ page }, use) => {
      const userResponse = readFixture("userDataUser.json");
      await mockApiRequest(page, "GET", "users/2", { json: userResponse });
      await use(userResponse);
    },
    { auto: true },
  ],
  profileUserResponse: [
    async ({ page }, use) => {
      const profileUserResponse = readFixture("userDataCurrentUser.json");
      await mockApiRequest(page, "GET", "users/1", {
        json: profileUserResponse,
      });
      await use(profileUserResponse);
    },
    { auto: true },
  ],
  userSearchResponse: [
    async ({ page }, use) => {
      const userSearchResponse = {
        status: 200,
        json: {
          data: [
            {
              id: 5,
              firstname: "Laura",
              lastname: "Rivera",
              email: "LauraWRivera@domain.tld",
              image: null,
            },
            {
              id: 10,
              firstname: "Laura",
              lastname: "Walter",
              email: "LauraMWalter@domain.tld",
              image: null,
            },
            {
              id: 1,
              firstname: "John",
              lastname: "Doe",
              email: "JohnDoe@domain.tld",
              image: null,
            },
          ],
        },
      };
      await mockApiRequest(
        page,
        "GET",
        /\/api\/v1\/users\/search\?query=/,
        () => userSearchResponse,
      );
      await use(userSearchResponse);
    },
    { auto: true },
  ],
});
