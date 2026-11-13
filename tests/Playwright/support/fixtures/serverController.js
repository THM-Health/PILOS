import { test as base } from "../test.js";
import { mockApiList, mockApiRequest, readFixture } from "../utils.js";
import { AdminServersForm } from "../pages/AdminServersForm.js";

/**
 * Mocks of the `ServerController`.
 * Automatic fixtures served in every test (change the objects before `page.goto()` or before the action that triggers
 * the request, the routes serve the current state). Tests change the answer of a mock with `respondWith()`, and
 * register a new mock with `mockApiRequest` for endpoints that have none.
 *
 * - `serverResponse`: the server with the id 1 (GET /api/v1/servers/1), other methods are not mocked
 * - `serversResponse`: the list of servers, answered by the list mock `getServersApiMock` (GET /api/v1/servers, see
 *   `mockApiList`)
 * - `serverForm`: page object of the server form
 */
export const test = base.extend({
  serverResponse: async ({}, use) => {
    const serverResponse = readFixture("server.json");
    await use(serverResponse);
  },
  getServerApiMock: [
    async ({ page, serverResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "servers/1*", () => ({
          json: serverResponse,
        })),
      );
    },
    { auto: true },
  ],

  serversResponse: async ({}, use) => {
    await use(readFixture("servers.json"));
  },
  getServersApiMock: [
    async ({ page, serversResponse }, use) => {
      await use(await mockApiList(page, "servers*", serversResponse));
    },
    { auto: true },
  ],

  serverForm: async ({ page }, use) => {
    await use(new AdminServersForm(page));
  },
});
