import { test as base } from "../test.js";
import { mockApiList, mockApiRequest, readFixture } from "../utils.js";
import { AdminServerPoolsServerSelect } from "../pages/AdminServerPoolsServerSelect.js";

/**
 * Mocks of the `ServerPoolController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `serverPoolResponse`: GET /api/v1/serverPools/1
 * - `createdServerPoolResponse`: GET /api/v1/serverPools/20, the server pool that is returned after creating one
 * - `serverPoolsResponse`: the list of server pools, answered by the list mock `getServerPoolsApiMock`
 *   (GET /api/v1/serverPools, see `mockApiList`)
 * - `serverPoolsFirstPageResponse`: first of two pages of the server pools, not served, to be mocked by the test
 * - `serverSelect`: page object of the server multiselect
 */
export const test = base.extend({
  serverPoolResponse: async ({}, use) => {
    const serverPoolResponse = readFixture("serverPool.json");
    await use(serverPoolResponse);
  },
  getServerPoolApiMock: [
    async ({ page, serverPoolResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "serverPools/1", () => ({
          json: serverPoolResponse,
        })),
      );
    },
    { auto: true },
  ],

  createdServerPoolResponse: async ({}, use) => {
    const createdServerPoolResponse = readFixture("serverPool.json");
    createdServerPoolResponse.data.id = 20;
    createdServerPoolResponse.data.name = "Server Pool 1";
    createdServerPoolResponse.data.description = "Server Pool 1 description";
    createdServerPoolResponse.data.servers = [];
    await use(createdServerPoolResponse);
  },
  getCreatedServerPoolApiMock: [
    async ({ page, createdServerPoolResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "serverPools/20", () => ({
          json: createdServerPoolResponse,
        })),
      );
    },
    { auto: true },
  ],

  serverPoolsResponse: async ({}, use) => {
    await use(readFixture("serverPools.json"));
  },
  getServerPoolsApiMock: [
    async ({ page, serverPoolsResponse }, use) => {
      await use(await mockApiList(page, "serverPools*", serverPoolsResponse));
    },
    { auto: true },
  ],

  /** First of two pages of the server pools (the fixture server pools are one page). */
  serverPoolsFirstPageResponse: async ({}, use) => {
    const serverPools = readFixture("serverPools.json");
    serverPools.data = serverPools.data.slice(0, 1);
    serverPools.meta.last_page = 2;
    serverPools.meta.per_page = 1;
    serverPools.meta.to = 1;
    await use(serverPools);
  },

  serverSelect: async ({ page }, use) => {
    await use(new AdminServerPoolsServerSelect(page));
  },
});
