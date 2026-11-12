import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import {
  setValidRememberedParticipantName,
  expectAuthToken,
  expectNoAuthToken,
} from "../support/room.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123*";
const AUTH_URL = "**/api/v1/rooms/abc-def-123/auth*";
const NAME_CHECK_URL = "**/api/v1/participantName/check";
const SESSION_KEY = "roomAccessCode_abc-def-123";
const LOGIN_URL = "/login?redirect=/rooms/abc-def-123";

const ROOM_AUTH_BODY = { data: { id: "roomAuthToken", type: 0 } };
const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];
const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];
const MODEL_NOT_FOUND_BODY = {
  message: "model_not_found",
  model: "room",
  ids: ["abc-def-123"],
};

/**
 * Room data of a room with an owner that is not the current user and an access code
 */
const MEMBER_ROOM = {
  owner: { id: 2, name: "Max Doe" },
  description: "<p>Test</p>",
  allow_membership: true,
};
const NEEDS_CODE = { ...MEMBER_ROOM, authenticated: false };
const GUEST_ROOM = {
  description: "<p>Test</p>",
  current_user: null,
  allow_membership: true,
};
const GUEST_NEEDS_CODE = { ...GUEST_ROOM, authenticated: false };

function mockRoom(page, overrides = {}) {
  const room = JSON.parse(
    readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
  );
  Object.assign(room.data, overrides);
  return mockMethod(page, "GET", ROOM_URL, { status: 200, json: room });
}

function mockRoomError(page, status, json, options = {}) {
  return mockMethod(page, "GET", ROOM_URL, { status, json, ...options });
}

function mockAuth(page, status = 201, json = ROOM_AUTH_BODY, options = {}) {
  return mockMethod(page, "POST", AUTH_URL, { status, json, ...options });
}

function mockNameCheck(page, options = {}) {
  return mockMethod(page, "POST", NAME_CHECK_URL, { status: 204, ...options });
}

async function expectAuthBody(mock, accessCode, count = 1) {
  const request = await nthRequest(mock, count);
  expect(request.postDataJSON()).toEqual({ access_code: accessCode, type: 0 });
}

async function expectSessionAccessCode(page, value) {
  await expect
    .poll(() =>
      page.evaluate((key) => window.sessionStorage.getItem(key), SESSION_KEY),
    )
    .toBe(value);
}

async function expectGuestNameStorage(page, value) {
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
    )
    .toBe(value);
}

function seedSessionAccessCode(page, code) {
  return page.addInitScript(
    ({ key, code }) => window.sessionStorage.setItem(key, code),
    { key: SESSION_KEY, code },
  );
}

async function expectRoomHeader(scope, owner) {
  await expect(scope.getByText("Meeting One")).toBeVisible();
  await expect(scope.getByText(owner)).toBeVisible();
  await expect(
    scope.getByText("rooms.index.room_component.never_started"),
  ).toBeVisible();
}

async function expectRoomView(
  page,
  { owner, guestName = null, member = false },
) {
  const isGuest = guestName !== null;

  await expect(page.locator("#tab-description")).toBeVisible();
  await expect(page.getByTestId("room-access-overlay")).toBeHidden();

  await expectRoomHeader(page, owner);

  // participant name
  if (isGuest) {
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText(guestName)).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  } else {
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  }

  // buttons
  await expect(page.getByTestId("reload-room-button")).toBeVisible();
  if (isGuest) {
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
  } else {
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    if (member) {
      await expect(
        page.getByTestId("room-end-membership-button"),
      ).toBeVisible();
      await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
        0,
      );
    } else {
      await expect(
        page.getByTestId("room-join-membership-button"),
      ).toBeVisible();
      await expect(page.getByTestId("room-end-membership-button")).toHaveCount(
        0,
      );
    }
  }

  // tabs
  await expect(page.locator("#tab-files")).toBeVisible();
  await expect(page.locator("#tab-recordings")).toBeVisible();
  await expect(page.locator("#tab-members")).toHaveCount(0);
  await expect(page.locator("#tab-tokens")).toHaveCount(0);
  await expect(page.locator("#tab-history")).toHaveCount(0);
  await expect(page.locator("#tab-settings")).toHaveCount(0);

  // the correct tab is shown
  await expect(page.getByText("rooms.description.title")).toBeVisible();

  await expect(page.getByTestId("room-share-button")).toHaveCount(0);
}

async function expectUserOverlay(page, { owner, code = "" }) {
  const overlay = page.getByTestId("room-access-overlay");
  await expect(overlay).toBeVisible();
  await expectRoomHeader(overlay, owner);

  await expect(overlay.getByTestId("room-login-as-user-button")).toHaveCount(0);
  await expect(overlay.getByTestId("participant-name-field")).toHaveCount(0);

  const codeField = overlay.getByTestId("access-code-field");
  await expect(codeField).toBeVisible();
  await expect(codeField.getByText("rooms.access_code")).toBeVisible();
  await expect(codeField.locator("#access-code")).toBeVisible();
  await expect(codeField.locator("#access-code")).toHaveValue(code);
}

async function expectGuestOverlay(page, { name = "", code = "" }) {
  const overlay = page.getByTestId("room-access-overlay");
  await expect(overlay).toBeVisible();
  await expectRoomHeader(overlay, "John Doe");

  const loginButton = overlay.getByTestId("room-login-as-user-button");
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toHaveText("auth.offer_login");
  await expect(loginButton).toHaveAttribute("href", LOGIN_URL);

  const nameField = overlay.getByTestId("participant-name-field");
  await expect(nameField).toBeVisible();
  await expect(nameField.getByText("rooms.first_and_lastname")).toBeVisible();
  await expect(nameField.locator("#participant-name")).toBeVisible();
  await expect(nameField.locator("#participant-name")).toHaveValue(name);
  await expect(
    nameField.getByText("rooms.remember_participant_name"),
  ).toBeVisible();
  if (name) {
    await expect(nameField.locator("#remember-participant-name")).toBeChecked();
  } else {
    await expect(
      nameField.locator("#remember-participant-name"),
    ).not.toBeChecked();
  }

  const codeField = overlay.getByTestId("access-code-field");
  await expect(codeField).toBeVisible();
  await expect(codeField.getByText("rooms.access_code")).toBeVisible();
  await expect(codeField.locator("#access-code")).toBeVisible();
  await expect(codeField.locator("#access-code")).toHaveValue(code);
}

test.beforeEach(async ({ page }) => {
  await interceptRoomFilesRequest(page);
});

test.describe("logged in user", () => {
  test.use({ authenticated: true });

  test("shows the access overlay", async ({ page }) => {
    await mockRoom(page, NEEDS_CODE);
    await page.goto(ROOM_PATH);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expectUserOverlay(page, { owner: "Max Doe" });
  });

  test("login with access code", async ({ page }) => {
    await mockRoom(page, NEEDS_CODE);
    await page.goto(ROOM_PATH);

    await expectUserOverlay(page, { owner: "Max Doe" });
    await page.locator("#access-code").fill("123456789");

    const auth = await mockAuth(page, 201, ROOM_AUTH_BODY, { hold: true });
    const room = await mockRoom(page, MEMBER_ROOM);

    await page.getByTestId("room-login-button").click();

    // Check loading
    await expect(page.locator("#access-code")).toBeDisabled();
    await expect(page.getByTestId("reload-room-button")).toBeDisabled();
    await expect(page.getByTestId("room-login-button")).toBeDisabled();
    await nthRequest(auth);
    auth.release();

    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));

    await expectRoomView(page, { owner: "Max Doe" });
    await expectSessionAccessCode(page, "123456789");
  });

  test("reload with access code in sessionStorage", async ({ page }) => {
    await seedSessionAccessCode(page, "123456789");
    const auth = await mockAuth(page);
    const room = await mockRoom(page, MEMBER_ROOM);

    await page.goto(ROOM_PATH);

    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));

    await expectRoomView(page, { owner: "Max Doe" });
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
  });

  test("reload with access code in hash", async ({ page }) => {
    const auth = await mockAuth(page);
    const room = await mockRoom(page, MEMBER_ROOM);

    await page.goto(`${ROOM_PATH}#accessCode=123456789`);

    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));

    await expectSessionAccessCode(page, "123456789");
    // The access code is removed from the hash
    await expect(page).toHaveURL((url) => !url.href.includes("#accessCode"));

    await expectRoomView(page, { owner: "Max Doe" });
  });

  test("login with access code after reload without stored access code", async ({
    page,
  }) => {
    await mockRoom(page, NEEDS_CODE);
    await page.goto(ROOM_PATH);

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await page.locator("#access-code").fill("123456789");

    const auth = await mockAuth(page, 200);
    const room = await mockRoom(page, MEMBER_ROOM);

    await page.getByTestId("room-login-button").click();

    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));

    await expectRoomView(page, { owner: "Max Doe" });
  });

  test("invalid access code when reloading the room", async ({ page }) => {
    await seedSessionAccessCode(page, "123456789");
    await mockAuth(page);
    await mockRoom(page, MEMBER_ROOM);
    await page.goto(ROOM_PATH);
    await expectRoomView(page, { owner: "Max Doe" });

    // The request with the room auth token is rejected, the room is reloaded without it
    const rejected = await mockRoomError(
      page,
      401,
      { message: "invalid_auth_token" },
      { hold: true },
    );
    await page.getByTestId("reload-room-button").click();
    await nthRequest(rejected);

    const reloaded = await mockRoom(page, NEEDS_CODE);
    rejected.release();

    expectAuthToken(await nthRequest(rejected));
    expectNoAuthToken(await nthRequest(reloaded));

    await expectToastAndClose(page, "rooms.flash.access_code_invalid");
    await expect(
      page.getByText("rooms.flash.access_code_invalid"),
    ).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("access code not needed anymore", async ({ page }) => {
    await mockRoom(page, NEEDS_CODE);
    await page.goto(ROOM_PATH);

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await page.locator("#access-code").fill("123456789");

    const auth = await mockMethod(page, "POST", AUTH_URL, { status: 204 });
    const room = await mockRoom(page, { ...MEMBER_ROOM, is_member: true });

    await page.getByTestId("room-login-button").click();

    await expectAuthBody(auth, "123456789");
    expectNoAuthToken(await nthRequest(room));

    await expectRoomView(page, { owner: "Max Doe", member: true });
  });

  test("legacy access code", async ({ page }) => {
    await mockRoom(page, { ...NEEDS_CODE, legacy_code: true });
    await page.goto(ROOM_PATH);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expectUserOverlay(page, { owner: "Max Doe" });
    await page.locator("#access-code").fill("012abc");

    const auth = await mockAuth(page);
    const room = await mockRoom(page, MEMBER_ROOM);

    await page.getByTestId("room-login-button").click();

    await expectAuthBody(auth, "012abc");
    expectAuthToken(await nthRequest(room));

    await expectRoomView(page, { owner: "Max Doe" });
  });

  test.describe("auth errors", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoom(page, NEEDS_CODE);
      await page.goto(ROOM_PATH);
      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expectUserOverlay(page, { owner: "Max Doe" });
    });

    test("validation error", async ({ page }) => {
      const auth = await mockAuth(page, 422, {
        message: "The Access code field is required.",
        errors: { access_code: ["The Access code field is required."] },
      });

      await page.getByTestId("room-login-button").click();
      await nthRequest(auth);

      await expectSessionAccessCode(page, null);
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByText("The Access code field is required."),
      ).toBeVisible();
    });

    test("invalid access code", async ({ page }) => {
      const auth = await mockAuth(page, 401, { message: "invalid_code" });
      const room = await mockRoom(page, NEEDS_CODE);

      await page.locator("#access-code").fill("987654321");
      await page.getByTestId("room-login-button").click();

      await expectAuthBody(auth, "987654321");
      await nthRequest(room);

      await expectSessionAccessCode(page, null);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("987-654-321");
    });

    test("invalid access code in sessionStorage", async ({ page }) => {
      const auth = await mockAuth(page, 401, { message: "invalid_code" });
      const room = await mockRoom(page, NEEDS_CODE);
      await seedSessionAccessCode(page, "987654321");

      await page.goto(ROOM_PATH);

      await expectAuthBody(auth, "987654321");
      await nthRequest(room);

      // The invalid access code in the session storage is cleared
      await expectSessionAccessCode(page, null);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("987-654-321");
    });

    test("rate limit", async ({ page }) => {
      // Take control of the time to check the countdown
      await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
      await page.goto(ROOM_PATH);
      await expectUserOverlay(page, { owner: "Max Doe" });
      await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));

      const auth = await mockAuth(page, 429, {
        limit: "room_auth",
        retry_after: 5,
      });
      await page.locator("#access-code").fill("987654321");
      await page.getByTestId("room-login-button").click();

      await expectAuthBody(auth, "987654321");
      await expectSessionAccessCode(page, null);

      // Check if input and buttons are disabled
      await expect(page.locator("#access-code")).toBeDisabled();
      await expect(page.getByTestId("room-login-button")).toBeDisabled();
      await expect(page.getByTestId("reload-room-button")).toBeDisabled();

      // Check countdown
      for (let i = 5; i > 0; i--) {
        await expect(
          page.getByText(`rooms.auth_throttled_{"count":${i},"n":${i}}`),
        ).toBeVisible();
        await page.clock.runFor(1000);
      }

      // The toast animations need the time to run again
      await page.clock.resume();
      await expectToastAndClose(page, "app.flash.too_many_requests");

      // Check if input and buttons are enabled again
      await expect(page.locator("#access-code")).toBeEnabled();
      await expect(page.getByTestId("room-login-button")).toBeEnabled();
      await expect(page.getByTestId("reload-room-button")).toBeEnabled();
    });

    test("server error", async ({ page }) => {
      const auth = await mockAuth(page, 500, { message: "Test" });

      await page.getByTestId("room-login-button").click();
      await nthRequest(auth);

      await expectSessionAccessCode(page, null);
      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      // Check that access overlay is still shown and not disabled
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toBeEnabled();
      await expect(page.getByTestId("room-login-button")).toBeEnabled();
    });

    test("guests not allowed", async ({ page }) => {
      const auth = await mockAuth(page, 403, { message: "guests_not_allowed" });

      await page.getByTestId("room-login-button").click();
      await nthRequest(auth);

      await expectSessionAccessCode(page, null);
      await expect(
        page.getByText("rooms.only_used_by_authenticated_users"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    });

    test("room not found", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      const auth = await mockAuth(page, 404, MODEL_NOT_FOUND_BODY);

      await page.getByTestId("room-login-button").click();
      await nthRequest(auth);

      // Check that redirect to room index page worked
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/rooms") &&
          !url.pathname.includes("/rooms/abc-def-123"),
      );
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("room request errors", () => {
    test("invalid auth token after login", async ({ page }) => {
      await mockRoom(page, NEEDS_CODE);
      await page.goto(ROOM_PATH);
      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await page.locator("#access-code").fill("123456789");

      const auth = await mockAuth(page);
      const rejected = await mockRoomError(
        page,
        401,
        { message: "invalid_auth_token" },
        { hold: true },
      );

      await page.getByTestId("room-login-button").click();

      await expectAuthBody(auth, "123456789");
      await expectSessionAccessCode(page, "123456789");

      await nthRequest(rejected);
      // The room is reloaded without the auth token
      const reloaded = await mockRoom(page, NEEDS_CODE);
      rejected.release();

      expectAuthToken(await nthRequest(rejected));
      expectNoAuthToken(await nthRequest(reloaded));

      await expectSessionAccessCode(page, "123456789");
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("server error after login", async ({ page }) => {
      await mockRoom(page, NEEDS_CODE);
      await page.goto(ROOM_PATH);
      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await page.locator("#access-code").fill("123456789");

      const auth = await mockAuth(page);
      const room = await mockRoomError(page, 500, { message: "Test" });

      await page.getByTestId("room-login-button").click();

      await expectAuthBody(auth, "123456789");
      expectAuthToken(await nthRequest(room));
      await expectSessionAccessCode(page, "123456789");

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      // Check that access code overlay is still shown and not disabled
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toBeEnabled();
      await expect(page.getByTestId("room-login-button")).toBeEnabled();
    });
  });

  test.describe("reload room with access code", () => {
    test.beforeEach(async ({ page }) => {
      // Login with the access code, the room is authenticated afterwards
      await mockRoom(page, NEEDS_CODE);
      await page.goto(ROOM_PATH);
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await page.locator("#access-code").fill("123456789");

      await mockAuth(page);
      const room = await mockRoom(page, {
        ...MEMBER_ROOM,
        authenticated: true,
      });
      await page.getByTestId("room-login-button").click();

      await nthRequest(room);
      await expectSessionAccessCode(page, "123456789");
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByTestId("reload-room-button")).toBeEnabled();
    });

    test("invalid auth token", async ({ page }) => {
      const rejected = await mockRoomError(
        page,
        401,
        { message: "invalid_auth_token" },
        { hold: true },
      );
      await page.getByTestId("reload-room-button").click();
      await nthRequest(rejected);

      const reloaded = await mockRoom(page, NEEDS_CODE);
      rejected.release();

      // The first request has the access code, the second request (reload room) not
      expectAuthToken(await nthRequest(rejected));
      expectNoAuthToken(await nthRequest(reloaded));

      await expectSessionAccessCode(page, "123456789");
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("access code required again", async ({ page }) => {
      const reloaded = await mockRoom(page, NEEDS_CODE);
      await page.getByTestId("reload-room-button").click();

      expectAuthToken(await nthRequest(reloaded));

      // The saved access code is reset
      await expectSessionAccessCode(page, null);
      await expectToastAndClose(page, "rooms.require_access_code");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toHaveCount(0);
      await expect(page.locator("#access-code")).toHaveValue("");
    });
  });

  test("member with saved access code needs the code again after reload", async ({
    page,
  }) => {
    await seedSessionAccessCode(page, "123456789");
    const auth = await mockAuth(page);
    const room = await mockRoom(page, {
      ...MEMBER_ROOM,
      authenticated: true,
      is_member: true,
    });

    await page.goto(ROOM_PATH);

    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));
    await expectSessionAccessCode(page, "123456789");

    await expect(page.getByTestId("room-end-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );

    // A later reload requires the access code and resets the saved access parameters
    const reloaded = await mockRoom(page, NEEDS_CODE);
    await page.getByTestId("reload-room-button").click();

    expectAuthToken(await nthRequest(reloaded));
    await expectSessionAccessCode(page, null);
    await expectToastAndClose(page, "rooms.require_access_code");
    await expect(page.getByText("rooms.flash.access_code_invalid")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");
  });
});

test.describe("guest", () => {
  test("shows the access overlay", async ({ page }) => {
    await mockRoom(page, { ...GUEST_NEEDS_CODE, description: null });
    await page.goto(ROOM_PATH);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expectGuestOverlay(page, {});
  });

  test("login with name and access code", async ({ page }) => {
    await mockRoom(page, GUEST_NEEDS_CODE);
    await page.goto(ROOM_PATH);

    await expectGuestOverlay(page, {});
    await page.locator("#participant-name").fill("Laura Rivera");
    await page.locator("#access-code").fill("123456789");

    const nameCheck = await mockNameCheck(page, { hold: true });
    const auth = await mockAuth(page, 201, ROOM_AUTH_BODY, { hold: true });
    const room = await mockRoom(page, GUEST_ROOM);

    await page.getByTestId("room-login-button").click();

    // Check loading while participant name is validated
    await expect(page.locator("#participant-name")).toBeDisabled();
    await expect(page.locator("#remember-participant-name")).toBeDisabled();
    await expect(page.locator("#access-code")).toBeDisabled();
    await expect(page.getByTestId("room-login-button")).toBeDisabled();
    await nthRequest(nameCheck);
    nameCheck.release();

    expect((await nthRequest(nameCheck)).postDataJSON()).toEqual({
      name: "Laura Rivera",
    });

    // Check loading while room access code is validated
    await nthRequest(auth);
    await expect(page.locator("#participant-name")).toBeDisabled();
    await expect(page.locator("#remember-participant-name")).toBeDisabled();
    await expect(page.locator("#access-code")).toBeDisabled();
    await expect(page.getByTestId("reload-room-button")).toBeDisabled();
    await expect(page.getByTestId("room-login-button")).toBeDisabled();
    auth.release();

    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));

    await expectRoomView(page, {
      owner: "John Doe",
      guestName: "Laura Rivera",
    });
    await expectSessionAccessCode(page, "123456789");
    // The name was not remembered
    await expectGuestNameStorage(page, null);
  });

  test("reload with access code in hash", async ({ page }) => {
    await mockRoom(page, GUEST_NEEDS_CODE);
    await page.goto(`${ROOM_PATH}#accessCode=123456789`);

    // The access code is prefilled
    await expectGuestOverlay(page, { code: "123-456-789" });
    await expect(page.locator("#access-code")).toHaveValue("123-456-789");
  });

  test("reload with access code in sessionStorage", async ({ page }) => {
    await seedSessionAccessCode(page, "123456789");
    await mockRoom(page, GUEST_NEEDS_CODE);
    await page.goto(ROOM_PATH);

    // The access code is prefilled
    await expectGuestOverlay(page, { code: "123-456-789" });
    await expect(page.locator("#access-code")).toHaveValue("123-456-789");
  });

  test("reload with remembered guest name", async ({ page }) => {
    await mockRoom(page, GUEST_NEEDS_CODE);
    const nameCheck = await mockNameCheck(page, { hold: true });
    await page.addInitScript(() =>
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera"),
    );

    await page.goto(ROOM_PATH);

    // Check loading
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    await nthRequest(nameCheck);
    nameCheck.release();

    // The guest name is prefilled
    await expectGuestOverlay(page, { name: "Laura Rivera" });
  });

  test("reload with remembered guest name and access code in sessionStorage", async ({
    page,
  }) => {
    await setValidRememberedParticipantName(page, "Laura Rivera");
    await seedSessionAccessCode(page, "123456789");
    const nameCheck = await mockNameCheck(page);
    const auth = await mockAuth(page);
    const room = await mockRoom(page, GUEST_ROOM);

    await page.goto(ROOM_PATH);

    await nthRequest(nameCheck);
    await expectAuthBody(auth, "123456789");
    expectAuthToken(await nthRequest(room));

    await expectRoomView(page, {
      owner: "John Doe",
      guestName: "Laura Rivera",
    });
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
  });

  test.describe("auth errors", () => {
    test("room not found", async ({ page }) => {
      await mockRoom(page, GUEST_NEEDS_CODE);
      await page.goto(ROOM_PATH);
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();

      await page.locator("#participant-name").fill("Max Doe");

      const nameCheck = await mockNameCheck(page);
      const auth = await mockAuth(page, 404, MODEL_NOT_FOUND_BODY);

      await page.getByTestId("room-login-button").click();

      await nthRequest(nameCheck);
      await nthRequest(auth);

      // Check that redirect to 404 page worked
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/404") &&
          !url.pathname.includes("/rooms/abc-def-123"),
      );
      await expectGuestNameStorage(page, null);
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });
});
