import { test as base } from "./roomsAccess.js";
import { readFixture } from "../utils.js";

/**
 * Fixtures for the room view specs about the general room page, the history, the description and notifications.
 * Extends the room fixtures (`room`, `roomAuth`, `nameCheck`) of `roomsAccess.js`.
 *
 * - `roomHistory`: the meeting history of the room (GET /api/v1/rooms/abc-def-123/meetings), served in every test.
 *   `{ requests, status, json }` is read on every request, tests change it before the request (e.g. `status` and `json`
 *   for an error). `roomHistory.showOnePerPage({ lastPage, currentPage, total })` resets `json` to one meeting per page.
 * - `meetingFeatures`: the requirements of joining or starting a meeting (OPTIONS /api/v1/rooms/abc-def-123/join and
 *   /start), served in every test. `{ requests, status, features, error }`: `features` are the enabled features
 *   (recording, attendance_recording, streaming, all disabled by default), `error` is the response body that is served
 *   instead of the features if it is set (together with `status`).
 * - `meetingAction`: the response of joining or starting a meeting (POST /api/v1/rooms/abc-def-123/join and /start),
 *   served in every test. `{ requests, status, json, redirectUrl, defaultBody }` (`defaultBody` is the request body without any
 *   consent), by default a redirect to `redirectUrl`, which is
 *   answered with an empty page. Change `status` and `json` for errors.
 * - `readClipboard()`: reads the clipboard of the page (needs the permissions `clipboard-read` and `clipboard-write`)
 *   and returns `{ types, text, html, readText }`.
 * - `stubBrowserApis({ throwOnConstruct })`: call before `page.goto()`. Fakes `Notification` (granted, throws on
 *   construct if requested), `Audio` and `window.focus` and returns a getter for what the app did with them
 *   (`notifications`, `closed`, `listeners`, `handlers`, `audios`, `plays`, `focus`).
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
  meetingFeatures: [
    async ({ page }, use) => {
      const meetingFeatures = {
        requests: [],
        status: 200,
        features: {
          recording: false,
          attendance_recording: false,
          streaming: false,
        },
        error: undefined,
      };
      await page.route("**/api/v1/rooms/abc-def-123/{join,start}*", (route) => {
        if (route.request().method() !== "OPTIONS") {
          return route.fallback();
        }
        meetingFeatures.requests.push(route.request());
        return route.fulfill({
          status: meetingFeatures.status,
          json: meetingFeatures.error ?? {
            data: { features: meetingFeatures.features },
          },
        });
      });
      await use(meetingFeatures);
    },
    { auto: true },
  ],
  meetingAction: [
    async ({ page }, use) => {
      const redirectUrl =
        "https://thm-health.github.io/PILOS-Redirect_Test_Pages/bigbluebutton?foo=a&bar=b";
      const meetingAction = {
        requests: [],
        status: 200,
        json: { url: redirectUrl },
        redirectUrl,
        defaultBody: {
          name: null,
          consent_record_attendance: false,
          consent_record: false,
          consent_record_video: false,
          consent_streaming: false,
          dark_mode: false,
        },
      };
      // The redirect to the conference server must not leave the test
      await page.route("https://thm-health.github.io/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<html></html>" }),
      );
      await page.route("**/api/v1/rooms/abc-def-123/{join,start}*", (route) => {
        if (route.request().method() !== "POST") {
          return route.fallback();
        }
        meetingAction.requests.push(route.request());
        return route.fulfill({
          status: meetingAction.status,
          json: meetingAction.json,
        });
      });
      await use(meetingAction);
    },
    { auto: true },
  ],
  roomHistory: [
    async ({ page }, use) => {
      const roomHistory = {
        requests: [],
        status: 200,
        json: readFixture("roomHistory.json"),
        showOnePerPage({ lastPage, currentPage = 1, total } = {}) {
          const history = readFixture("roomHistory.json");
          history.data = history.data.slice(currentPage - 1, currentPage);
          history.meta.current_page = currentPage;
          history.meta.from = currentPage;
          history.meta.to = currentPage;
          history.meta.last_page = lastPage;
          history.meta.per_page = 1;
          if (total !== undefined) {
            history.meta.total = total;
          }
          this.json = history;
        },
      };
      await page.route("**/api/v1/rooms/abc-def-123/meetings*", (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }
        roomHistory.requests.push(route.request());
        return route.fulfill({
          status: roomHistory.status,
          json: roomHistory.json,
        });
      });
      await use(roomHistory);
    },
    { auto: true },
  ],
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
