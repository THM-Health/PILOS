import { test as base } from "../test.js";
import { mockApiRequest } from "../utils.js";

/**
 * Fixtures of the login, forgot password and password reset pages.
 *
 * - `postPasswordEmailApiMock`, `postPasswordResetApiMock`, `postEmailVerifyApiMock`, `postLogoutApiMock`: the mocks of
 *   the auth endpoints, registered when a test requests them (answer 200 or 204), a test changes the answer with
 *   `respondWith()`.
 * - `getCsrfCookieApiMock` (automatic): serves the Sanctum csrf cookie with the token `test-csrf`, so requests of the
 *   page carry the header `x-xsrf-token: test-csrf`.
 */
export const test = base.extend({
  getCsrfCookieApiMock: [
    // mockApp: the route must be registered after its fallback route that blocks unmocked requests
    // eslint-disable-next-line no-unused-vars
    async ({ page, mockApp }, use) => {
      await use(
        await mockApiRequest(page, "GET", "**/sanctum/csrf-cookie", {
          headers: { "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/" },
        }),
      );
    },
    { auto: true },
  ],
  // mockApp: the routes must be registered after its fallback route that blocks unmocked requests
  // eslint-disable-next-line no-unused-vars
  postPasswordEmailApiMock: async ({ page, mockApp }, use) => {
    await use(
      await mockApiRequest(page, "POST", "password/email", { status: 200 }),
    );
  },
  // eslint-disable-next-line no-unused-vars
  postPasswordResetApiMock: async ({ page, mockApp }, use) => {
    await use(
      await mockApiRequest(page, "POST", "password/reset", { status: 200 }),
    );
  },
  // eslint-disable-next-line no-unused-vars
  postEmailVerifyApiMock: async ({ page, mockApp }, use) => {
    await use(
      await mockApiRequest(page, "POST", "email/verify", { status: 200 }),
    );
  },
  // eslint-disable-next-line no-unused-vars
  postLogoutApiMock: async ({ page, mockApp }, use) => {
    await use(await mockApiRequest(page, "POST", "logout", { status: 204 }));
  },
});
