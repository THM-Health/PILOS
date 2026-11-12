import { test as base, expect } from "@playwright/test";
import { coverageFixture } from "./coverage.js";
import { readFixture } from "./utils.js";

/**
 * Shared `test` object for the frontend and visual suites (API is mocked, the Cypress fixtures are reused).
 *
 * Fixtures:
 * - `config`, `currentUser`: mutable copies of the default responses, served for the whole test.
 *   Change them before `page.goto()` / `page.reload()` to change what the app receives.
 * - `authenticated` (option): `test.use({ authenticated: true })` mocks a logged in user (replaces `cy.init()`),
 *   otherwise the current user request returns an empty user (guest).
 * - `mockLocale` (option, default true): frontend mocks `/api/v1/locale/en` from the fixture. Visual sets
 *   `mockLocale: false` so translations come from the real locale API (same as Cypress visual `cy.init()`).
 * - every other API request that is not mocked by the test is blocked and fails the test (no real backend).
 * - automatic final state check (replaces `cy.checkFinalState()`): no unexpected toasts, no uncaught page errors.
 *
 * Dark mode: use Playwright's own `test.use({ colorScheme: "dark" })`.
 */
export const test = base.extend({
  coverage: coverageFixture,
  authenticated: [false, { option: true }],
  mockLocale: [true, { option: true }],
  config: async ({ baseURL }, use) => {
    const config = readFixture("config.json");
    config.data.general.base_url = baseURL;
    await use(config);
  },
  currentUser: async ({}, use) => {
    await use(readFixture("currentUser.json"));
  },

  mockApp: [
    async (
      { page, config, currentUser, authenticated, mockLocale, baseURL },
      use,
    ) => {
      // The frontend suite never talks to the real backend. Routes registered later take precedence, so this is the
      // fallback for every API request that a test did not mock explicitly: it is blocked and fails the test.
      // Visual tests leave `/api/v1/locale/*` unmocked so English strings come from the running app.
      const unmockedRequests = [];
      await page.route(
        (url) =>
          url.origin === new URL(baseURL).origin &&
          (url.pathname.startsWith("/api/") ||
            url.pathname.startsWith("/sanctum/")) &&
          (mockLocale || !url.pathname.startsWith("/api/v1/locale/")),
        (route) => {
          unmockedRequests.push(
            `${route.request().method()} ${route.request().url()}`,
          );
          return route.abort();
        },
      );

      await page.route("**/api/v1/config", (route) =>
        route.fulfill({ json: config }),
      );
      if (mockLocale) {
        await page.route("**/api/v1/locale/en", (route) =>
          route.fulfill({ path: "tests/Playwright/fixtures/en.json" }),
        );
      }
      await page.route("**/api/v1/currentUser", (route) =>
        authenticated
          ? route.fulfill({ json: currentUser })
          : route.fulfill({ json: { data: [] } }),
      );

      const errors = [];
      page.on("pageerror", (error) => errors.push(error));

      await use();

      expect(unmockedRequests, "API requests that were not mocked").toEqual([]);

      // Only check while on our own origin, a test may end on an external page
      if (new URL(page.url(), baseURL).origin === new URL(baseURL).origin) {
        await expect(
          page.locator(".p-toast-message"),
          "unexpected toast at end of test",
        ).toHaveCount(0);
      }
      expect(errors, "uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Check a toast that contains all given texts, then close it (open toasts fail the final state check).
 * @param {import("@playwright/test").Page} page
 * @param {string|string[]} text
 */
export async function expectToastAndClose(page, text) {
  let toast = page.locator(".p-toast-message");
  for (const part of [].concat(text)) {
    toast = toast.filter({ hasText: part });
  }
  await expect(toast).toBeVisible();
  await toast.getByRole("button").click();
  await expect(toast).toBeHidden();
}

/**
 * Fake `Notification` API (replaces cy.stub(win, "Notification")). Returns a getter for what the app did with it.
 */
export async function stubNotification(
  page,
  { permission, requestPermissionResult = permission },
) {
  await page.addInitScript(
    ({ permission, requestPermissionResult }) => {
      const state = { constructed: [], closed: 0, requestPermission: 0 };
      window.__notification = state;
      window.Notification = class {
        static permission = permission;
        static requestPermission = async () => {
          state.requestPermission++;
          return requestPermissionResult;
        };
        constructor(...args) {
          state.constructed.push(args);
        }
        close() {
          state.closed++;
        }
        addEventListener() {}
      };
    },
    { permission, requestPermissionResult },
  );
  return () => page.evaluate(() => window.__notification);
}
