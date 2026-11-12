import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Mocked meetings of the meetings index page (GET /api/v1/meetings), served by a route in every test.
 *
 * `meetings` is `{ requests, status, json }`, read on every request: tests change it before `page.goto()` or the
 * request (e.g. `status` and `json` for an error). Mocks that are registered later in a test (e.g. to hold a request)
 * take precedence.
 * - `show({ slice, meta })` resets `json` to the meetings fixture with a slice of the meetings and changed meta data.
 * - `showPage(pageNumber, lastPage, meta)` shows one meeting per page.
 * - `showNoneFound()` shows a search without result, `showNoneAvailable()` no meetings at all.
 */
export const test = base.extend({
  meetings: [
    async ({ page }, use) => {
      const meetings = {
        requests: [],
        status: 200,
        json: readFixture("meetings.json"),
        show({ slice, meta } = {}) {
          const json = readFixture("meetings.json");
          if (slice) {
            json.data = json.data.slice(...slice);
          }
          Object.assign(json.meta, meta);
          meetings.json = json;
        },
        showPage(pageNumber, lastPage, meta) {
          meetings.show({
            slice: [pageNumber - 1, pageNumber],
            meta: {
              current_page: pageNumber,
              from: pageNumber,
              to: pageNumber,
              last_page: lastPage,
              per_page: 1,
              ...meta,
            },
          });
        },
        showNoneFound() {
          meetings.show({
            slice: [0, 0],
            meta: { from: null, per_page: 1, to: null, total: 0 },
          });
        },
        showNoneAvailable() {
          meetings.show({
            slice: [0, 0],
            meta: {
              from: null,
              per_page: 1,
              to: null,
              total: 0,
              total_no_filter: 0,
            },
          });
        },
      };
      await page.route("**/api/v1/meetings*", (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }
        meetings.requests.push(route.request());
        return route.fulfill({ status: meetings.status, json: meetings.json });
      });
      await use(meetings);
    },
    { auto: true },
  ],
});
