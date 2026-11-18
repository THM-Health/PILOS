import { test as base } from "../test.js";

/**
 * @typedef {object} BrowserApisFixtures
 * @property {() => Promise<{ types: string[], text: string|null, html: string|null, readText: string }>} readClipboard
 * @property {(options?: { throwOnConstruct?: boolean }) => Promise<() => Promise<any>>} stubBrowserApis
 */

/**
 * - `readClipboard()`: reads the clipboard of the page (needs the permissions `clipboard-read` and `clipboard-write`)
 *   and returns `{ types, text, html, readText }`.
 * - `stubBrowserApis({ throwOnConstruct })`: call before `page.goto()`. Fakes `Notification` (granted, throws on
 *   construct if requested), `Audio` and `window.focus` and returns a getter for what the app did with them
 *   (`notifications`, `closed`, `listeners`, `handlers`, `audios`, `plays`, `focus`).
 *
 * @type {typeof base extends import("@playwright/test").TestType<infer Args extends {}, infer WorkerArgs extends {}> ? import("@playwright/test").TestType<Args & BrowserApisFixtures, WorkerArgs> : never}
 */
export const test = base.extend({
  readClipboard: async ({ page }, use) => {
    await use(() =>
      page.evaluate(async () => {
        const [item] = await navigator.clipboard.read();
        const read = async (type) =>
          item.types.includes(type) ? (await item.getType(type)).text() : null;
        return {
          types: item.types,
          text: await read("text/plain"),
          html: await read("text/html"),
          readText: await navigator.clipboard.readText(),
        };
      }),
    );
  },
  stubBrowserApis: async ({ page }, use) => {
    await use(async ({ throwOnConstruct = false } = {}) => {
      await page.addInitScript((throwOnConstruct) => {
        const state = {
          notifications: [],
          closed: [],
          listeners: [],
          handlers: [],
          audios: [],
          plays: 0,
          focus: 0,
        };
        window.__browserApis = state;
        window.focus = () => state.focus++;
        window.Audio = class {
          constructor(...args) {
            state.audios.push(args);
          }
          play() {
            state.plays++;
          }
        };
        window.Notification = class {
          static permission = "granted";
          constructor(...args) {
            state.notifications.push(args);
            if (throwOnConstruct) {
              throw new TypeError("test");
            }
            this.index = state.notifications.length - 1;
            state.handlers[this.index] = {};
          }
          close() {
            state.closed.push(this.index);
          }
          addEventListener(event, callback) {
            state.listeners.push([this.index, event]);
            state.handlers[this.index][event] = callback;
          }
        };
      }, throwOnConstruct);
      return () => page.evaluate(() => window.__browserApis);
    });
  },
});
