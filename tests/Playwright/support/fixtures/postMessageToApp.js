import { test as base } from "../test.js";

/**
 * @typedef {object} PostMessageToAppFixtures
 * @property {(message: object) => Promise<void>} postMessageToApp
 */

/**
 * - `postMessageToApp(message)`: sends a message to the app window (like the windows of the file download and recording
 *   formats do) and resolves when the window has dispatched it, so the app had the chance to react
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & PostMessageToAppFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  postMessageToApp: async ({ page }, use) => {
    await use((message) =>
      page.evaluate(
        (message) =>
          new Promise((resolve) => {
            // registered after the listener of the app, so the app has handled the message when this resolves
            window.addEventListener("message", () => resolve(), { once: true });
            window.postMessage(message, window.location.origin);
          }),
        message,
      ),
    );
  },
});
