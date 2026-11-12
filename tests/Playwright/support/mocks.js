/**
 * Mocks for the API requests of the pages (port of the Cypress interceptCommands).
 *
 * Every function registers `page.route` handlers (GET only) answering with the fixtures from
 * `tests/Playwright/fixtures`. Call them before `page.goto()`. They return nothing: where Cypress used an alias
 * (`cy.wait("@roomRequest")`) create the promise at the call site before the action that triggers the request, e.g.
 * `const request = page.waitForRequest("**\/api/v1/rooms/abc-def-123");`.
 * The base mocks of `cy.init()` (currentUser, locale, config) are provided by the `test` fixtures.
 */

const fixturePath = (name) => `tests/Playwright/fixtures/${name}`;

/**
 * Answers GET requests to `api/v1/<path>` with a fixture, other methods fall through to the next matching route.
 * @param {import("@playwright/test").Page} page
 * @param {string} path - glob relative to `api/v1/`
 * @param {string|object} fixture - fixture file name or the response body
 */
async function mockGet(page, path, fixture) {
  await page.route(`**/api/v1/${path}`, (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    return typeof fixture === "string"
      ? route.fulfill({ path: fixturePath(fixture) })
      : route.fulfill({ json: fixture });
  });
}

/**
 * Mocks the files tab of a room (rooms/abc-def-123).
 * @param {import("@playwright/test").Page} page
 * @param {boolean} [withFileDetails=false]
 */
export async function interceptRoomFilesRequest(page, withFileDetails = false) {
  await mockGet(
    page,
    "rooms/abc-def-123/files*",
    withFileDetails ? "roomFiles.json" : "roomFilesNoDetails.json",
  );
}

/**
 * Mocks the requests of the room index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptRoomIndexRequests(page) {
  await mockGet(page, "roomTypes*", "roomTypes.json");
  await mockGet(page, "rooms*", "rooms.json");
}

/**
 * Mocks the requests of the room view page (rooms/abc-def-123).
 * @param {import("@playwright/test").Page} page
 */
export async function interceptRoomViewRequests(page) {
  await mockGet(page, "rooms/abc-def-123", "room.json");
}

/**
 * Mocks the requests of the admin users index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminUsersIndexRequests(page) {
  await mockGet(page, "users*", "users.json");
  await mockGet(page, "roles*", "roles.json");
}

/**
 * Mocks the requests of the admin servers index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminServersIndexRequests(page) {
  await mockGet(page, "servers*", "servers.json");
}

/**
 * Mocks the requests of the admin server pools index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminServerPoolsIndexRequests(page) {
  await mockGet(page, "serverPools*", "serverPools.json");
}

/**
 * Mocks the requests of the admin streaming index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminStreamingIndexRequests(page) {
  await mockGet(page, "streaming", "streaming.json");
}

/**
 * Mocks the requests of the admin room types index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminRoomTypesIndexRequests(page) {
  await mockGet(page, "roomTypes*", "roomTypes.json");
}

/**
 * Mocks the requests of the admin settings page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminSettingsRequest(page) {
  await mockGet(page, "settings", "settings.json");
  await mockGet(page, "getTimezones", "timezones.json");
}

/**
 * Mocks the requests of the admin roles index page.
 * @param {import("@playwright/test").Page} page
 */
export async function interceptAdminRolesIndexRequests(page) {
  await mockGet(page, "roles*", "roles.json");
}
