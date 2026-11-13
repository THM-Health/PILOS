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
 * - `userSearchResponse`: the result of the user search (GET /api/v1/users/search) that `getUsersSearchApiMock`
 *   answers, by default three users
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

  userResponse: async ({}, use) => {
    const userResponse = readFixture("userDataUser.json");
    await use(userResponse);
  },
  getUserApiMock: [
    async ({ page, userResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "users/2", () => ({
          json: userResponse,
        })),
      );
    },
    { auto: true },
  ],
  profileUserResponse: async ({}, use) => {
    const profileUserResponse = readFixture("userDataCurrentUser.json");
    await use(profileUserResponse);
  },
  getProfileUserApiMock: [
    async ({ page, profileUserResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "users/1", () => ({
          json: profileUserResponse,
        })),
      );
    },
    { auto: true },
  ],
  userSearchResponse: async ({}, use) => {
    await use({
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
    });
  },
  getUsersSearchApiMock: [
    async ({ page, userSearchResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "users/search*", () => ({
          json: userSearchResponse,
        })),
      );
    },
    { auto: true },
  ],
});
