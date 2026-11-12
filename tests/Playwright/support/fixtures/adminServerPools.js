/* eslint-disable no-unused-vars -- `mockApp` is requested so these routes are registered after its catch-all route */
import { test as base } from "../test.js";
import { readFixture } from "../utils.js";
import { AdminServerPoolsServerSelect } from "../pages/AdminServerPoolsServerSelect.js";

/**
 * Fixtures of the admin server pool pages. The mocked data is a mutable object, tests change it before `page.goto()`
 * (or before the next request) and the route serves its current state. Tests mock a request again with `mockMethod`
 * to override the fixture, e.g. for errors.
 *
 * - `serverPool`: `GET /api/v1/serverPools/1`
 * - `createdServerPool`: `GET /api/v1/serverPools/20`, the server pool that is returned after creating one
 * - `serverPools`: `GET /api/v1/serverPools` (list), `showServerPoolsPage(n)` shows page `n` of two with one pool per page
 * - `servers`: `GET /api/v1/servers` (list), `showServersPage(n)` shows page `n` of two with two servers per page
 * - `serverSelect`: page object of the server multiselect
 */
export const test = base.extend({
  serverPool: [
    async ({ page, mockApp }, use) => {
      const serverPool = readFixture("serverPool.json");
      await page.route("**/api/v1/serverPools/1", (route) =>
        route.request().method() === "GET"
          ? route.fulfill({ json: serverPool })
          : route.fallback(),
      );
      await use(serverPool);
    },
    { auto: true },
  ],

  createdServerPool: [
    async ({ page, mockApp }, use) => {
      const serverPool = readFixture("serverPool.json");
      serverPool.data.id = 20;
      serverPool.data.name = "Server Pool 1";
      serverPool.data.description = "Server Pool 1 description";
      serverPool.data.servers = [];
      await page.route("**/api/v1/serverPools/20", (route) =>
        route.request().method() === "GET"
          ? route.fulfill({ json: serverPool })
          : route.fallback(),
      );
      await use(serverPool);
    },
    { auto: true },
  ],

  serverPools: [
    async ({ page, mockApp }, use) => {
      const serverPools = readFixture("serverPools.json");
      await page.route(
        (url) => url.pathname === "/api/v1/serverPools",
        (route) =>
          route.request().method() === "GET"
            ? route.fulfill({ json: serverPools })
            : route.fallback(),
      );
      await use(serverPools);
    },
    { auto: true },
  ],

  showServerPoolsPage: async ({ serverPools }, use) => {
    const all = readFixture("serverPools.json");
    await use((pageNumber) => {
      serverPools.data = all.data.slice(pageNumber - 1, pageNumber);
      Object.assign(serverPools.meta, {
        current_page: pageNumber,
        from: pageNumber,
        last_page: 2,
        per_page: 1,
        to: pageNumber,
      });
    });
  },

  servers: [
    async ({ page, mockApp }, use) => {
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

  showServersPage: async ({ servers }, use) => {
    const all = readFixture("servers.json");
    await use((pageNumber) => {
      const start = (pageNumber - 1) * 2;
      servers.data = all.data.slice(start, start + 2);
      Object.assign(servers.meta, {
        current_page: pageNumber,
        from: start + 1,
        last_page: 2,
        per_page: 2,
        to: start + 2,
      });
    });
  },

  serverSelect: async ({ page }, use) => {
    await use(new AdminServerPoolsServerSelect(page));
  },
});
