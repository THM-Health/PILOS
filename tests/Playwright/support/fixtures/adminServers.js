import { test as base } from "../test.js";
import { readFixture } from "../utils.js";
import { AdminServersForm } from "../pages/AdminServersForm.js";

/**
 * Fixtures of the admin servers pages.
 *
 * - `server`: the server with the id 1, served for `GET /api/v1/servers/1`. Change the object before `page.goto`
 *   (or later, the next request gets the changes), other methods are not mocked.
 * - `servers`: the list of servers, served for `GET /api/v1/servers`. Change the object before the request.
 * - `serverForm`: page object of the server form.
 */
export const test = base.extend({
  server: [
    async ({ page }, use) => {
      const server = readFixture("server.json");
      await page.route(
        (url) => url.pathname === "/api/v1/servers/1",
        (route) =>
          route.request().method() === "GET"
            ? route.fulfill({ json: server })
            : route.fallback(),
      );
      await use(server);
    },
    { auto: true },
  ],

  servers: [
    async ({ page }, use) => {
      const servers = readFixture("servers.json");
      await page.route(
        (url) => url.pathname === "/api/v1/servers",
        (route) =>
          route.request().method() === "GET"
            ? route.fulfill({ json: servers })
            : route.fallback(),
      );
      await use(servers);
    },
    { auto: true },
  ],

  serverForm: async ({ page }, use) => {
    await use(new AdminServersForm(page));
  },
});

/**
 * Show only one server per page of the servers list (replaces the content of `servers`).
 * @param {object} servers - servers list as returned by the `servers` fixture or `readFixture("servers.json")`
 * @param {number} pageNumber - 1 based, the server of this position of the fixture is shown
 * @param {object} [options]
 * @param {number} [options.lastPage=5]
 * @param {object} [options.usage] - values for the usage counts of the shown server
 * @param {object} [options.meta] - additional meta data
 */
export function showServersPage(
  servers,
  pageNumber,
  { lastPage = 5, usage = {}, meta = {} } = {},
) {
  const fixture = readFixture("servers.json");
  servers.data = fixture.data.slice(pageNumber - 1, pageNumber);
  Object.assign(servers.data[0], usage);
  servers.meta = {
    ...fixture.meta,
    current_page: pageNumber,
    from: pageNumber,
    last_page: lastPage,
    per_page: 1,
    to: pageNumber,
    ...meta,
  };
}
