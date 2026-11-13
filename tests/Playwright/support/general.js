import { expect, expectToastAndClose } from "./test.js";
import { mockApiRequest } from "./utils.js";

/**
 * Check that a user who visits this page without being logged in is redirected to the login page
 * @param {import("@playwright/test").Page} page
 * @param {string} path
 */
export async function testVisitWithoutCurrentUser(page, path) {
  // Overrides the mock of the logged in user, also for tests that use `authenticated: true`
  await mockApiRequest(page, "GET", "currentUser", { json: {} });

  await page.goto(path);
  await expect(page).toHaveURL((url) =>
    url.href.includes("/login?redirect=" + path),
  );
}

/**
 * Check that the user was redirected to the login page with the unauthenticated toast.
 * @param {import("@playwright/test").Page} page
 * @param {string} path - path that was redirected from (without leading origin)
 */
export async function expectLoginRedirect(page, path) {
  await expect(page).toHaveURL((url) =>
    url.href.includes("/login?redirect=" + path),
  );
  await expectToastAndClose(page, "app.flash.unauthenticated");
}
