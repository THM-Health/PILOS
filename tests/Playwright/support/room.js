import { expect, expectToastAndClose } from "./test.js";
import { getRequestQuery, readFixture, forbidden } from "./utils.js";

const ROOM_URL = "**/api/v1/rooms/abc-def-123";
const ROOM_FILES_URL = "**/api/v1/rooms/abc-def-123/files*";
const ROOM_RECORDINGS_URL = "**/api/v1/rooms/abc-def-123/recordings*";
const PARTICIPANT_NAME_CHECK_URL = "**/api/v1/participantName/check";

/**
 * The Cypress commands received relative globs like `api/v1/rooms/abc-def-123/files*`,
 * Playwright globs have to match the whole URL.
 */
function toUrlMatcher(url) {
  if (typeof url !== "string" || url.startsWith("**") || /^\w+:/.test(url)) {
    return url;
  }
  return "**/" + url.replace(/^\//, "");
}

/**
 * Select a filter dropdown option by index.
 * @param {import("@playwright/test").Page} page
 * @param {number} index
 */
export async function selectFilter(page, index) {
  await page.getByTestId("filter-dropdown").click();
  await page.getByTestId("filter-dropdown-option").nth(index).click();
}

/**
 * Select a sorting type dropdown option by index.
 * @param {import("@playwright/test").Page} page
 * @param {number} index
 */
export async function selectSortType(page, index) {
  await page.getByTestId("sorting-type-dropdown").click();
  await page.getByTestId("sorting-type-dropdown-option").nth(index).click();
}

/**
 * Check that the request carries the room auth token of the given type (default guest token type "0").
 * @param {import("@playwright/test").Request} request
 * @param {string} [type="0"]
 */
export function expectAuthToken(request, type = "0") {
  expect(getRequestQuery(request)).toMatchObject({
    room_auth_token: "roomAuthToken",
    room_auth_token_type: type,
  });
}

/**
 * Check that the request does not carry a room auth token.
 * @param {import("@playwright/test").Request} request
 */
export function expectNoAuthToken(request) {
  expect(getRequestQuery(request)).not.toHaveProperty("room_auth_token");
  expect(getRequestQuery(request)).not.toHaveProperty("room_auth_token_type");
}

/**
 * Mock all requests of the given method and url. Routes registered later take precedence over earlier ones
 * (like `cy.intercept`). The returned state counts the requests that reached this mock (replaces `cy.wait("@alias")`).
 * @returns {{ count: number }}
 */
async function mockRequest(page, method, url, response) {
  const state = { count: 0 };
  await page.route(toUrlMatcher(url), (route) => {
    if (method && route.request().method() !== method) {
      return route.fallback();
    }
    state.count++;
    return route.fulfill(response);
  });
  return state;
}

/**
 * Mock the room request with the room fixture, optionally changed by `mutate`.
 */
async function mockRoom(page, mutate = () => {}) {
  const room = readFixture("room.json");
  mutate(room);
  return mockRequest(page, "GET", ROOM_URL, { status: 200, json: room });
}

/**
 * Mock the room request with an error response.
 */
function mockRoomError(page, status, body) {
  return mockRequest(page, "GET", ROOM_URL, { status, json: body });
}

/**
 * Hold the requests (like `interceptIndefinitely`) until `sendResponse()` is called, which answers them.
 */
async function holdRequest(page, method, url, response) {
  let openGate;
  const gate = new Promise((resolve) => (openGate = resolve));
  const state = { count: 0, responded: 0 };

  await page.route(toUrlMatcher(url), async (route) => {
    if (method && route.request().method() !== method) {
      return route.fallback();
    }
    state.count++;
    await gate;
    try {
      await route.fulfill(response);
      state.responded++;
    } catch {
      // the request has been aborted in the meantime, e.g. by a reload
    }
  });

  return {
    state,
    sendResponse: async () => {
      const respondedBefore = state.responded;
      openGate();
      // a held request that was aborted by a reload is never answered, so only wait if there is a live one
      await expect
        .poll(() => state.responded > respondedBefore || state.count === 0)
        .toBe(true);
    },
  };
}

/**
 * Wait until the mock has received more requests than `countBefore`.
 */
async function expectRequestsAfter(state, countBefore = 0) {
  await expect.poll(() => state.count).toBeGreaterThan(countBefore);
}

async function expectUrlIncludes(page, text) {
  await expect(page).toHaveURL((url) => url.href.includes(text));
}

async function expectUrlNotIncludes(page, text) {
  await expect(page).toHaveURL((url) => !url.href.includes(text));
}

async function expectLoginLink(page) {
  await expect(page.getByText("auth.login").first()).toBeVisible();
}

/**
 * Enter the guest name in the room access overlay and login as guest
 */
async function loginAsGuest(page) {
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  await page.locator("#participant-name").fill("Max Doe");

  const check = await mockRequest(page, "POST", PARTICIPANT_NAME_CHECK_URL, {
    status: 204,
  });

  await page.getByTestId("room-login-button").click();

  await expectRequestsAfter(check);

  await expect(page.getByTestId("room-access-overlay")).toBeHidden();
}

/**
 * Check if a room setting field inside the room type details view is displayed correctly
 * @param {import("@playwright/test").Page} page
 * @param {string} field
 * @param {(boolean|string)} value
 * @param {boolean} enforced
 * @param {boolean} isInfo
 */
export async function checkDefaultRoomSettingField(
  page,
  field,
  value,
  enforced,
  isInfo,
) {
  const setting = page.getByTestId(`room-type-${field}-setting`);
  await expect(setting).toBeAttached();

  const enforcedIcon = setting.getByTestId("room-setting-enforced-icon");
  const enabledIcon = setting.getByTestId("room-type-setting-enabled-icon");
  const disabledIcon = setting.getByTestId("room-type-setting-disabled-icon");

  if (enforced) {
    await expect(enforcedIcon).toBeAttached();
  } else {
    await expect(enforcedIcon).toHaveCount(0);
  }

  if (isInfo) {
    await expect(enabledIcon).toHaveCount(0);
    await expect(disabledIcon).toHaveCount(0);
    await expect(setting.getByTestId("room-type-setting-info")).toHaveText(
      value,
    );
  } else {
    if (value) {
      await expect(enabledIcon).toBeAttached();
      await expect(disabledIcon).toHaveCount(0);
    } else {
      await expect(enabledIcon).toHaveCount(0);
      await expect(disabledIcon).toBeAttached();
    }
    await expect(setting.getByTestId("room-setting-info-icon")).toHaveCount(0);
  }
}

/**
 * Check if the comparison between the current and new value for a room setting field is displayed correctly
 * inside the confirmation dialog
 * @param {import("@playwright/test").Page} page
 * @param {string} field
 * @param {(boolean|string)} currentValue
 * @param {boolean} currentEnforced
 * @param {(boolean|string)} newValue
 * @param {boolean} newEnforced
 * @param {boolean} isInfo
 */
export async function checkCompareRoomSettingField(
  page,
  field,
  currentValue,
  currentEnforced,
  newValue,
  newEnforced,
  isInfo,
) {
  const comparison = page.getByTestId(`room-type-${field}-comparison`);
  await expect(comparison).toBeAttached();

  const enforcedIcon = (side) =>
    comparison.locator(
      `[data-test="${side}-enforced"] > [data-test="room-setting-enforced-icon"]`,
    );

  if (currentEnforced) {
    await expect(enforcedIcon("current")).toBeAttached();
  } else {
    await expect(enforcedIcon("current")).toHaveCount(0);
  }
  if (newEnforced) {
    await expect(enforcedIcon("new")).toBeAttached();
  } else {
    await expect(enforcedIcon("new")).toHaveCount(0);
  }

  if (isInfo) {
    await expect(comparison.getByTestId("current-enabled")).toHaveCount(0);
    await expect(comparison.getByTestId("current-disabled")).toHaveCount(0);
    await expect(comparison.getByTestId("current-info")).toHaveText(
      currentValue,
    );
    await expect(comparison.getByTestId("new-enabled")).toHaveCount(0);
    await expect(comparison.getByTestId("new-disabled")).toHaveCount(0);
    await expect(comparison.getByTestId("new-info")).toHaveText(newValue);
  } else {
    for (const [side, value] of [
      ["current", currentValue],
      ["new", newValue],
    ]) {
      const enabled = comparison.getByTestId(`${side}-enabled`);
      const disabled = comparison.getByTestId(`${side}-disabled`);
      if (value) {
        await expect(enabled).toBeAttached();
        await expect(disabled).toHaveCount(0);
      } else {
        await expect(enabled).toHaveCount(0);
        await expect(disabled).toBeAttached();
      }
    }
    await expect(comparison.getByTestId("current-info")).toHaveCount(0);
    await expect(comparison.getByTestId("new-info")).toHaveCount(0);
  }
}

/**
 * Check that the auth errors are handled correctly when loading a room tab.
 * The request is a Playwright url glob, e.g. `**\/api/v1/rooms/abc-def-123/meetings*` (a leading `**\/` is optional).
 * @param {import("@playwright/test").Page} page
 * @param {string} requestMethod
 * @param {string} requestUrl
 * @param {string} roomTabName
 */
export async function checkRoomAuthErrorsLoadingTab(
  page,
  requestMethod,
  requestUrl,
  roomTabName,
) {
  const roomFiles = await mockRequest(page, "GET", ROOM_FILES_URL, {
    path: "tests/Playwright/fixtures/roomFiles.json",
  });
  await mockRoom(page);

  // Check with 401 error and room that has no access code
  let held = await holdRequest(page, requestMethod, requestUrl, {
    status: 401,
  });

  await page.goto("/rooms/abc-def-123#tab=" + roomTabName);
  await expectRequestsAfter(held.state);
  await page.reload();
  // The tab is only requested after the room is loaded: wait for the request of the reloaded page, so the room of the
  // reloaded page is still answered with the logged in user
  await expectRequestsAfter(held.state, 1);

  let room = await mockRoom(page, (data) => {
    data.data.current_user = null;
  });
  await held.sendResponse();

  // Check that room gets reloaded
  await expectRequestsAfter(room);

  // Enter guest name
  await loginAsGuest(page);

  // Check that file tab is shown
  await expectRequestsAfter(roomFiles);

  await expectUrlNotIncludes(page, "#tab=" + roomTabName);

  // Check that toast message is shown and user is logged out
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expectLoginLink(page);

  // Reload with logged in user
  room = await mockRoom(page);
  const filesCountBeforeReload = roomFiles.count;

  await page.goto("/rooms/abc-def-123#tab=files");
  await page.reload();

  await expectRequestsAfter(room);
  await expectRequestsAfter(roomFiles, filesCountBeforeReload);

  // Check with 401 errors but room has an access code
  room = await mockRoom(page, (data) => {
    data.data.current_user = null;
    data.data.authenticated = false;
  });

  const requestCountBefore = held.state.count;
  await page.locator("#tab-" + roomTabName).click();

  await expectRequestsAfter(held.state, requestCountBefore);

  // Check that room gets reloaded
  await expectRequestsAfter(room);

  // Check that access code overlay is shown
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();

  // Check that error message is shown
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expectLoginLink(page);

  // Check with 401 error but guests are forbidden
  // Reload with logged in user
  room = await mockRoom(page);

  held = await holdRequest(page, requestMethod, requestUrl, { status: 401 });

  await page.reload();
  await expectRequestsAfter(room);

  room = await mockRoomError(page, 403, { message: "guests_not_allowed" });
  await held.sendResponse();

  await expectRequestsAfter(room);

  await expect(
    page.getByText("rooms.only_used_by_authenticated_users").first(),
  ).toBeVisible();
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expectLoginLink(page);

  // Check with 403 error
  // Reload with logged in user
  await page.evaluate(() => window.sessionStorage.clear());

  room = await mockRoom(page);

  held = await holdRequest(
    page,
    requestMethod,
    requestUrl,
    forbidden("This action is unauthorized."),
  );

  await page.reload();
  await expectRequestsAfter(room);

  room = await mockRoom(page, (data) => {
    data.data.owner = { id: 2, name: "Max Doe" };
    data.data.is_member = true;
  });
  const filesBefore = roomFiles.count;
  await held.sendResponse();

  // Check that room gets reloaded
  await expectRequestsAfter(room);

  // Check that file tab is shown
  await expectRequestsAfter(roomFiles, filesBefore);

  await expectUrlNotIncludes(page, "#tab=" + roomTabName);
  await expectUrlIncludes(page, "/rooms/abc-def-123#tab=files");

  // Check that toast message is shown
  await expectToastAndClose(page, "app.flash.unauthorized");
}

/**
 * Check that the auth errors for room actions are handled correctly for the given request actions.
 * The request is a Playwright url glob, e.g. `**\/api/v1/rooms/abc-def-123/files` (a leading `**\/` is optional).
 * @param {import("@playwright/test").Page} page
 * @param {function(import("@playwright/test").Page): Promise<void>} triggerRequestActions
 * @param {string} requestMethod
 * @param {string} requestUrl
 * @param {string} roomTabName
 */
export async function checkRoomAuthErrors(
  page,
  triggerRequestActions,
  requestMethod,
  requestUrl,
  roomTabName,
) {
  const roomFiles = await mockRequest(page, "GET", ROOM_FILES_URL, {
    path: "tests/Playwright/fixtures/roomFiles.json",
  });

  let roomRecordings;
  if (roomTabName === "recordings") {
    roomRecordings = await mockRequest(page, "GET", ROOM_RECORDINGS_URL, {
      path: "tests/Playwright/fixtures/roomRecordings.json",
    });
  }

  const withDescription = (data) => {
    if (roomTabName === "description") {
      data.data.description = "<p>Room description</p>";
    }
  };

  const triggerAndWait = async (room, request) => {
    const requestCountBefore = request.count;
    await triggerRequestActions(page);
    await expectRequestsAfter(request, requestCountBefore);
    // Check that room gets reloaded
    await expectRequestsAfter(room);
  };

  // Check with 401 errors and room that has no access code
  let room = await mockRoom(page, (data) => {
    data.data.current_user = null;
    withDescription(data);
  });

  let request = await mockRequest(page, requestMethod, requestUrl, {
    status: 401,
  });

  await triggerAndWait(room, request);

  // Check that access overlay is shown and enter guest name
  await loginAsGuest(page);

  // Room gets reloaded after the login
  await expect.poll(() => room.count).toBeGreaterThanOrEqual(2);

  switch (roomTabName) {
    case "description":
      // Check that tab stayed the same
      await expectUrlNotIncludes(page, "/rooms/abc-def-123#tab=files");
      await expect(
        page.getByText("rooms.description.title").first(),
      ).toBeVisible();
      break;
    case "files":
      // Check reload of files and check that tab stayed the same
      await expectRequestsAfter(roomFiles);
      await expectUrlIncludes(page, "/rooms/abc-def-123#tab=files");
      break;
    case "recordings":
      // Check that tab stayed the same
      await expectRequestsAfter(roomRecordings);
      await expectUrlIncludes(page, "/rooms/abc-def-123#tab=recordings");
      break;
    default:
      // Check that file tab is shown
      await expectRequestsAfter(roomFiles);
      await expectUrlNotIncludes(page, "#tab=" + roomTabName);
  }

  // Check that toast message is shown and user is logged out
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expectLoginLink(page);

  // Reload with logged in user
  room = await mockRoom(page, withDescription);

  await page.goto("/rooms/abc-def-123#tab=" + roomTabName);
  await page.reload();
  await expectRequestsAfter(room);

  // Check with 401 errors but room has an access code
  room = await mockRoom(page, (data) => {
    data.data.current_user = null;
    data.data.authenticated = false;
    withDescription(data);
  });

  await triggerAndWait(room, request);

  // Check that access code overlay is shown
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();

  // Check that error message is shown and user is logged out
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expectLoginLink(page);

  // Reload with logged in user
  room = await mockRoom(page, withDescription);

  await page.reload();
  await expectRequestsAfter(room);

  // Check with 401 error but guests are forbidden
  room = await mockRoomError(page, 403, { message: "guests_not_allowed" });

  await triggerAndWait(room, request);

  // Check that the error message is shown
  await expect(
    page.getByText("rooms.only_used_by_authenticated_users").first(),
  ).toBeVisible();
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expectLoginLink(page);

  // Reload with logged in user
  room = await mockRoom(page, withDescription);

  await page.reload();
  await expectRequestsAfter(room);

  // Check with 403 error
  room = await mockRoom(page, (data) => {
    data.data.owner = { id: 2, name: "Max Doe" };
    data.data.is_member = true;
    withDescription(data);
  });

  request = await mockRequest(
    page,
    requestMethod,
    requestUrl,
    forbidden("This action is unauthorized."),
  );

  const filesBefore = roomFiles.count;
  const recordingsBefore = roomRecordings?.count ?? 0;

  await triggerAndWait(room, request);

  switch (roomTabName) {
    case "description":
      // Check that tab stayed the same
      await expectUrlNotIncludes(page, "/rooms/abc-def-123#tab=files");
      await expect(
        page.getByText("rooms.description.title").first(),
      ).toBeVisible();
      // Check that editor is closed after 403 error
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
      await expect(
        page.getByTestId("room-description-save-button"),
      ).toHaveCount(0);
      break;
    case "files":
      // Check reload of files and check that tab stayed the same
      await expectRequestsAfter(roomFiles, filesBefore);
      await expectUrlIncludes(page, "/rooms/abc-def-123#tab=files");
      break;
    case "recordings":
      // Check that tab stayed the same
      await expectRequestsAfter(roomRecordings, recordingsBefore);
      await expectUrlIncludes(page, "/rooms/abc-def-123#tab=recordings");
      break;
    default:
      // Check that file tab is shown
      await expectRequestsAfter(roomFiles, filesBefore);
      await expectUrlNotIncludes(page, "#tab=" + roomTabName);
      await expectUrlIncludes(page, "/rooms/abc-def-123#tab=files");
  }

  // Check that toast message is shown
  await expectToastAndClose(page, "app.flash.unauthorized");
}

/**
 * Remember a guest name. It passes the participant name check as long as `postParticipantNameCheckApiMock` has its
 * default response (204).
 * The name is seeded once before the first page load, so the app can still change or remove it afterwards.
 * @param {import("@playwright/test").Page} page
 * @param {string} name
 */
export async function setValidRememberedParticipantName(page, name) {
  await page.addInitScript((name) => {
    if (!window.localStorage.getItem("pw_guest_name_seeded")) {
      window.localStorage.setItem("pw_guest_name_seeded", "1");
      window.localStorage.setItem("pilos_guest_name", name);
    }
  }, name);
}
