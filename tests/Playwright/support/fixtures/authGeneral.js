import { test as base } from "../test.js";

/**
 * Fixtures of the login, forgot password and password reset pages.
 *
 * - `csrfCookie` (automatic): serves the Sanctum csrf cookie with the token `test-csrf`, so requests of the page
 *   carry the header `x-xsrf-token: test-csrf`.
 */
export const test = base.extend({
  csrfCookie: [
    async ({ page }, use) => {
      await page.route("**/sanctum/csrf-cookie", (route) =>
        route.fulfill({
          headers: { "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/" },
        }),
      );
      await use("test-csrf");
    },
    { auto: true },
  ],
});
