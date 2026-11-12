import { expect, expectToastAndClose } from "./test.js";

/**
 * Check that a user who visits this page without being logged in is redirected to the login page
 * @param {import("@playwright/test").Page} page
 * @param {string} path
 */
export async function testVisitWithoutCurrentUser(page, path) {
  // Overrides the mock of the logged in user, also for tests that use `authenticated: true`
  await page.route("**/api/v1/currentUser", (route) =>
    route.fulfill({ json: {} }),
  );

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

/**
 * Set the hash without triggering a hashchange event and reload the page.
 * @param {import("@playwright/test").Page} page
 * @param {string} hash
 */
export async function reloadWithHash(page, hash) {
  await page.evaluate((hash) => {
    const url = new URL(window.location.href);
    url.hash = hash;

    // Replace the current history entry with the new URL to avoid triggering a hashchange event
    window.history.replaceState(window.history.state, "", url.toString());
  }, hash);

  await page.reload();
}
