import { expect, expectToastAndClose } from "./test.js";
import { forbidden, getRequestQuery, readFixture } from "./utils.js";

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
 * Select the whole content of the room description editor (TipTap), retries until the browser selection equals the
 * editor text.
 * @param {import("@playwright/test").Page} page
 */
export async function selectRoomDescriptionContent(page) {
  const content = page.locator(".tiptap");
  await expect(async () => {
    await content.press("ControlOrMeta+a");
    const selectedText = await page.evaluate(() =>
      window.getSelection().toString(),
    );
    expect(selectedText).toBe(await content.innerText());
  }, "Selecting the text failed").toPass();
}

/**
 * Clear the content of the room description editor (TipTap), retries until the editor is empty.
 * @param {import("@playwright/test").Page} page
 */
export async function clearRoomDescriptionContent(page) {
  const content = page.locator(".tiptap");
  await expect(async () => {
    await content.clear();
    await expect(content).toHaveText("", { timeout: 500 });
  }, "Clearing the text failed").toPass();
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
 * Answer for `getRoomApiMock` with a fresh copy of the room fixture (`room.json`), changed by `mutate`.
 * @param {(room: any) => void} [mutate]
 */
function roomFixtureResponse(mutate = () => {}) {
  const room = readFixture("room.json");
  mutate(room);
  return { json: room };
}

/**
 * Enter the guest name in the room access overlay and login as guest
 * @param {import("@playwright/test").Page} page
 * @param {import("./utils.js").ApiMock} postParticipantNameCheckApiMock
 */
async function loginAsGuest(page, postParticipantNameCheckApiMock) {
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  await page.locator("#participant-name").fill("Max Doe");

  const check = postParticipantNameCheckApiMock.respondWith({ status: 204 });

  await page.getByTestId("room-login-button").click();

  await check.waitForRequest();

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
 * @typedef {object} RoomAuthErrorMocks The handles the room auth error checks change.
 * @property {import("./utils.js").ApiMock} getRoomApiMock
 * @property {import("./utils.js").ApiMock} getRoomFilesApiMock
 * @property {import("./utils.js").ApiMock} postParticipantNameCheckApiMock
 * @property {import("./utils.js").ApiMock} requestApiMock The request that is checked: a fixture handle, or a mock of
 *   `mockApiRequest` for endpoints without a fixture.
 */

/**
 * Check that the auth errors are handled correctly when loading a room tab.
 * @param {import("@playwright/test").Page} page
 * @param {RoomAuthErrorMocks & { roomTabName: string }} options
 */
export async function checkRoomAuthErrorsLoadingTab(
  page,
  {
    getRoomApiMock,
    getRoomFilesApiMock,
    postParticipantNameCheckApiMock,
    requestApiMock,
    roomTabName,
  },
) {
  const roomFiles = getRoomFilesApiMock.respondWith({
    path: "tests/Playwright/fixtures/roomFiles.json",
  });
  getRoomApiMock.respondWith(roomFixtureResponse());

  // Check with 401 error and room that has no access code
  let held = requestApiMock.respondWith({ status: 401, hold: true });

  await page.goto("/rooms/abc-def-123#tab=" + roomTabName);
  await held.waitForRequest();
  await page.reload();
  // The tab is only requested after the room is loaded: wait for the request of the reloaded page, so the room of the
  // reloaded page is still answered with the logged in user
  await held.waitForRequest(2);

  let room = getRoomApiMock.respondWith(
    roomFixtureResponse((data) => {
      data.data.current_user = null;
    }),
  );
  // a held request that was aborted by the reload is never answered, `release` only waits for the live ones
  await held.release();

  // Check that room gets reloaded
  await room.waitForRequest();

  // Enter guest name
  await loginAsGuest(page, postParticipantNameCheckApiMock);

  // Check that file tab is shown
  await roomFiles.waitForRequest();

  await expect(page).not.toHaveURL(new RegExp("#tab=" + roomTabName));

  // Check that toast message is shown and user is logged out
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // Reload with logged in user
  room = getRoomApiMock.respondWith(roomFixtureResponse());
  const filesCountBeforeReload = roomFiles.requests.length;

  await page.goto("/rooms/abc-def-123#tab=files");
  await page.reload();

  await room.waitForRequest();
  await roomFiles.waitForRequest(filesCountBeforeReload + 1);

  // Check with 401 errors but room has an access code
  room = getRoomApiMock.respondWith(
    roomFixtureResponse((data) => {
      data.data.current_user = null;
      data.data.authenticated = false;
    }),
  );

  const requestCountBefore = held.requests.length;
  await page.locator("#tab-" + roomTabName).click();

  await held.waitForRequest(requestCountBefore + 1);

  // Check that room gets reloaded
  await room.waitForRequest();

  // Check that access code overlay is shown
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();

  // Check that error message is shown
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // Check with 401 error but guests are forbidden
  // Reload with logged in user
  room = getRoomApiMock.respondWith(roomFixtureResponse());

  held = requestApiMock.respondWith({ status: 401, hold: true });

  await page.reload();
  await room.waitForRequest();

  room = getRoomApiMock.respondWith({
    status: 403,
    json: { message: "guests_not_allowed" },
  });
  await held.release();

  await room.waitForRequest();

  await expect(
    page.getByText("rooms.only_used_by_authenticated_users").first(),
  ).toBeVisible();
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // Check with 403 error
  // Reload with logged in user
  await page.evaluate(() => window.sessionStorage.clear());

  room = getRoomApiMock.respondWith(roomFixtureResponse());

  held = requestApiMock.respondWith(
    forbidden("This action is unauthorized.", { hold: true }),
  );

  await page.reload();
  await room.waitForRequest();

  room = getRoomApiMock.respondWith(
    roomFixtureResponse((data) => {
      data.data.owner = { id: 2, name: "Max Doe" };
      data.data.is_member = true;
    }),
  );
  const filesBefore = roomFiles.requests.length;
  await held.release();

  // Check that room gets reloaded
  await room.waitForRequest();

  // Check that file tab is shown
  await roomFiles.waitForRequest(filesBefore + 1);

  await expect(page).not.toHaveURL(new RegExp("#tab=" + roomTabName));
  await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);

  // Check that toast message is shown
  await expectToastAndClose(page, "app.flash.unauthorized");
}

/**
 * Check that the auth errors for room actions are handled correctly for the given request actions.
 * @param {import("@playwright/test").Page} page
 * @param {RoomAuthErrorMocks & {
 *   getRoomRecordingsApiMock?: import("./utils.js").ApiMock,
 *   roomTabName: string,
 *   triggerRequestActions: (page: import("@playwright/test").Page) => Promise<void>,
 * }} options `getRoomRecordingsApiMock` is needed for the recordings tab
 */
export async function checkRoomAuthErrors(
  page,
  {
    getRoomApiMock,
    getRoomFilesApiMock,
    getRoomRecordingsApiMock,
    postParticipantNameCheckApiMock,
    requestApiMock,
    roomTabName,
    triggerRequestActions,
  },
) {
  const roomFiles = getRoomFilesApiMock.respondWith({
    path: "tests/Playwright/fixtures/roomFiles.json",
  });

  let roomRecordings;
  if (roomTabName === "recordings") {
    roomRecordings = getRoomRecordingsApiMock.respondWith({
      path: "tests/Playwright/fixtures/roomRecordings.json",
    });
  }

  const withDescription = (data) => {
    if (roomTabName === "description") {
      data.data.description = "<p>Room description</p>";
    }
  };

  const triggerAndWait = async (room, request) => {
    const requestCountBefore = request.requests.length;
    await triggerRequestActions(page);
    await request.waitForRequest(requestCountBefore + 1);
    // Check that room gets reloaded
    await room.waitForRequest();
  };

  // Check with 401 errors and room that has no access code
  let room = getRoomApiMock.respondWith(
    roomFixtureResponse((data) => {
      data.data.current_user = null;
      withDescription(data);
    }),
  );

  let request = requestApiMock.respondWith({ status: 401 });

  await triggerAndWait(room, request);

  // Check that access overlay is shown and enter guest name
  await loginAsGuest(page, postParticipantNameCheckApiMock);

  // Room gets reloaded after the login
  await room.waitForRequest(2);

  switch (roomTabName) {
    case "description":
      // Check that tab stayed the same
      await expect(page).not.toHaveURL(/\/rooms\/abc-def-123#tab=files/);
      await expect(
        page.getByText("rooms.description.title").first(),
      ).toBeVisible();
      break;
    case "files":
      // Check reload of files and check that tab stayed the same
      await roomFiles.waitForRequest();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);
      break;
    case "recordings":
      // Check that tab stayed the same
      await roomRecordings.waitForRequest();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=recordings/);
      break;
    default:
      // Check that file tab is shown
      await roomFiles.waitForRequest();
      await expect(page).not.toHaveURL(new RegExp("#tab=" + roomTabName));
  }

  // Check that toast message is shown and user is logged out
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // Reload with logged in user
  room = getRoomApiMock.respondWith(roomFixtureResponse(withDescription));

  await page.goto("/rooms/abc-def-123#tab=" + roomTabName);
  await page.reload();
  await room.waitForRequest();

  // Check with 401 errors but room has an access code
  room = getRoomApiMock.respondWith(
    roomFixtureResponse((data) => {
      data.data.current_user = null;
      data.data.authenticated = false;
      withDescription(data);
    }),
  );

  await triggerAndWait(room, request);

  // Check that access code overlay is shown
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();

  // Check that error message is shown and user is logged out
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // Reload with logged in user
  room = getRoomApiMock.respondWith(roomFixtureResponse(withDescription));

  await page.reload();
  await room.waitForRequest();

  // Check with 401 error but guests are forbidden
  room = getRoomApiMock.respondWith({
    status: 403,
    json: { message: "guests_not_allowed" },
  });

  await triggerAndWait(room, request);

  // Check that the error message is shown
  await expect(
    page.getByText("rooms.only_used_by_authenticated_users").first(),
  ).toBeVisible();
  await expectToastAndClose(page, "app.flash.unauthenticated");
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // Reload with logged in user
  room = getRoomApiMock.respondWith(roomFixtureResponse(withDescription));

  await page.reload();
  await room.waitForRequest();

  // Check with 403 error
  room = getRoomApiMock.respondWith(
    roomFixtureResponse((data) => {
      data.data.owner = { id: 2, name: "Max Doe" };
      data.data.is_member = true;
      withDescription(data);
    }),
  );

  request = requestApiMock.respondWith(
    forbidden("This action is unauthorized."),
  );

  const filesBefore = roomFiles.requests.length;
  const recordingsBefore = roomRecordings?.requests.length ?? 0;

  await triggerAndWait(room, request);

  switch (roomTabName) {
    case "description":
      // Check that tab stayed the same
      await expect(page).not.toHaveURL(/\/rooms\/abc-def-123#tab=files/);
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
      await roomFiles.waitForRequest(filesBefore + 1);
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);
      break;
    case "recordings":
      // Check that tab stayed the same
      await roomRecordings.waitForRequest(recordingsBefore + 1);
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=recordings/);
      break;
    default:
      // Check that file tab is shown
      await roomFiles.waitForRequest(filesBefore + 1);
      await expect(page).not.toHaveURL(new RegExp("#tab=" + roomTabName));
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);
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
