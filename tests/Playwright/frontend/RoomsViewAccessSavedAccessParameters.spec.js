import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123*";
const AUTH_URL = "**/api/v1/rooms/abc-def-123/auth*";
const NAME_CHECK_URL = "**/api/v1/participantName/check";
const CODE_KEY = "roomAccessCode_abc-def-123";
const LINK_KEY = "roomPersonalizedLink_abc-def-123";

const SAVED_LINK =
  "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR";
const HASH_LINK =
  "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
const ERROR_LINK = (code) =>
  `${code}evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR`;

const CODE_AUTH_BODY = { data: { id: "roomAuthToken", type: 0 } };
const LINK_AUTH_BODY = { data: { id: "roomAuthToken", type: 1 } };

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

function mockRoom(page, overrides = {}) {
  const room = JSON.parse(
    readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
  );
  Object.assign(room.data, overrides);
  return mockMethod(page, "GET", ROOM_URL, { status: 200, json: room });
}

function mockAuth(page, status, json, options = {}) {
  return mockMethod(page, "POST", AUTH_URL, { status, json, ...options });
}

async function expectAuthBody(mock, body) {
  const request = await nthRequest(mock);
  expect(request.postDataJSON()).toEqual(body);
}

async function expectRoomToken(mock, type) {
  const request = await nthRequest(mock);
  expect(Object.fromEntries(new URL(request.url()).searchParams)).toMatchObject(
    {
      room_auth_token: "roomAuthToken",
      room_auth_token_type: String(type),
    },
  );
}

async function expectStorage(page, key, value) {
  await expect
    .poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), key))
    .toBe(value);
}

async function expectUrlIncludes(page, text) {
  await expect(page).toHaveURL((url) => url.href.includes(text));
}

async function expectUrlNotIncludes(page, text) {
  await expect(page).toHaveURL((url) => !url.href.includes(text));
}

function setHash(page, hash) {
  return page.evaluate((hash) => {
    window.location.hash = hash;
  }, hash);
}

function seedSessionStorage(page, items) {
  return page.addInitScript((items) => {
    if (!window.localStorage.getItem("pw_session_seeded")) {
      window.localStorage.setItem("pw_session_seeded", "1");
      for (const [key, value] of Object.entries(items)) {
        window.sessionStorage.setItem(key, value);
      }
    }
  }, items);
}

async function rememberParticipantName(page, name) {
  const check = await mockMethod(page, "POST", NAME_CHECK_URL, {
    status: 204,
  });
  await page.addInitScript((name) => {
    window.localStorage.setItem("pilos_guest_name", name);
  }, name);
  return check;
}

async function expectParticipant(page, { name, absent = [], canChange }) {
  await expect(page.getByText("Meeting One").first()).toBeVisible();
  await expect(page.getByText("rooms.name_in_video_conference")).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  for (const other of absent) {
    await expect(page.getByText(other)).toHaveCount(0);
  }
  if (canChange) {
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  } else {
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  }
}

const GUEST_MEMBER_ROOM = (username) => ({
  allow_membership: true,
  current_user: null,
  is_member: true,
  username,
});
const GUEST_CODE_ROOM = {
  allow_membership: true,
  current_user: null,
  description: "<p>Test</p>",
};
const GUEST_NEEDS_CODE_ROOM = {
  allow_membership: true,
  current_user: null,
  authenticated: false,
};

test.beforeEach(async ({ page }) => {
  await interceptRoomFilesRequest(page);
});

test.describe("saved access parameter priority", () => {
  test.beforeEach(async ({ page }) => {
    await rememberParticipantName(page, "Laura Rivera");
  });

  test("personalized link from hash wins over all saved access parameters", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 200, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));
    await seedSessionStorage(page, {
      [CODE_KEY]: "123456789",
      [LINK_KEY]: SAVED_LINK,
    });

    await page.goto(
      `${ROOM_PATH}#accessCode=987654321&personalizedLink=${HASH_LINK}`,
    );

    await expectAuthBody(auth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    await expectParticipant(page, {
      name: "Max Doe",
      absent: ["Laura Rivera"],
      canChange: false,
    });
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();

    // The saved access code is not touched, the personalized link is updated to the value from the hash
    await expectStorage(page, CODE_KEY, "123456789");
    await expectStorage(page, LINK_KEY, HASH_LINK);

    // The competing access code hash was removed
    await expectUrlNotIncludes(page, "accessCode");
  });

  test("removed access code hash cannot win on a later reload", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 200, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));
    await seedSessionStorage(page, {
      [CODE_KEY]: "123456789",
      [LINK_KEY]: SAVED_LINK,
    });

    await page.goto(
      `${ROOM_PATH}#accessCode=987654321&personalizedLink=${HASH_LINK}`,
    );
    await expectStorage(page, LINK_KEY, HASH_LINK);
    await expectUrlNotIncludes(page, "accessCode");

    // Reset to previous value and reload without hash
    await page.evaluate(
      ([key, value]) => window.sessionStorage.setItem(key, value),
      [LINK_KEY, SAVED_LINK],
    );
    await page.reload();

    await expect.poll(() => auth.requests.length).toBeGreaterThanOrEqual(2);
    expect(auth.requests[1].postDataJSON()).toEqual({
      personalized_link_token: SAVED_LINK,
      type: 1,
    });
    await expect.poll(() => room.requests.length).toBeGreaterThanOrEqual(2);
    expect(
      Object.fromEntries(new URL(room.requests[1].url()).searchParams),
    ).toMatchObject({
      room_auth_token: "roomAuthToken",
      room_auth_token_type: "1",
    });

    await expectParticipant(page, {
      name: "Max Doe",
      absent: ["Laura Rivera"],
      canChange: false,
    });
  });

  test("access code from hash wins over saved access parameters", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 200, CODE_AUTH_BODY);
    const room = await mockRoom(page, {
      allow_membership: true,
      current_user: null,
    });
    await seedSessionStorage(page, {
      [CODE_KEY]: "123456789",
      [LINK_KEY]: SAVED_LINK,
    });

    await page.goto(`${ROOM_PATH}#accessCode=987654321`);

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await expectRoomToken(room, 0);

    await expectParticipant(page, {
      name: "Laura Rivera",
      absent: ["Max Doe"],
      canChange: true,
    });

    // The access code in the session storage is updated and the personalized link is removed
    await expectStorage(page, CODE_KEY, "987654321");
    await expectStorage(page, LINK_KEY, null);
  });

  test("saved access code is used on reload without hash", async ({ page }) => {
    const auth = await mockAuth(page, 200, CODE_AUTH_BODY);
    const room = await mockRoom(page, {
      allow_membership: true,
      current_user: null,
    });
    await seedSessionStorage(page, { [CODE_KEY]: "987654321" });

    await page.goto(ROOM_PATH);

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await expectRoomToken(room, 0);

    await expectParticipant(page, {
      name: "Laura Rivera",
      absent: ["Max Doe"],
      canChange: true,
    });
  });
});

test.describe("hash change with no saved access parameters", () => {
  test.beforeEach(async ({ page }) => {
    await rememberParticipantName(page, "Laura Rivera");
    await mockRoom(page, GUEST_NEEDS_CODE_ROOM);

    await page.goto(ROOM_PATH);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("access code in hash", async ({ page }) => {
    const auth = await mockAuth(page, 201, CODE_AUTH_BODY, { hold: true });
    const room = await mockRoom(page, {
      description: "<p>Test</p>",
      current_user: null,
      allow_membership: true,
    });

    await setHash(page, "accessCode=987654321");

    // Check loading state
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    auth.release();

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await expectRoomToken(room, 0);

    // Check that url was cleared and access code was saved to sessionStorage
    await expectUrlNotIncludes(page, "accessCode");
    await expectStorage(page, CODE_KEY, "987654321");

    await expectParticipant(page, { name: "Laura Rivera", canChange: true });
  });

  test("personalized link in hash", async ({ page }) => {
    const auth = await mockAuth(page, 201, LINK_AUTH_BODY, { hold: true });
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));

    await setHash(page, `personalizedLink=${HASH_LINK}`);

    // Check loading state
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    auth.release();

    await expectAuthBody(auth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    // Check that url was cleared and personalized link was saved to sessionStorage
    await expectUrlNotIncludes(page, "personalizedLink");
    await expectStorage(page, LINK_KEY, HASH_LINK);

    await expectParticipant(page, {
      name: "Max Doe",
      absent: ["Laura Rivera"],
      canChange: false,
    });
  });

  test("personalized link and access code in hash", async ({ page }) => {
    const auth = await mockAuth(page, 201, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));

    await setHash(page, `personalizedLink=${HASH_LINK}&accessCode=987654321`);

    await expectAuthBody(auth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    // Check that url was cleared and personalized link was saved to sessionStorage
    await expectUrlNotIncludes(page, "personalizedLink");
    await expectUrlNotIncludes(page, "accessCode");
    await expectStorage(page, LINK_KEY, HASH_LINK);

    await expectParticipant(page, {
      name: "Max Doe",
      absent: ["Laura Rivera"],
      canChange: false,
    });
  });
});

test.describe("hash change with saved access code", () => {
  test.beforeEach(async ({ page }) => {
    await rememberParticipantName(page, "Laura Rivera");
    await seedSessionStorage(page, { [CODE_KEY]: "987654321" });
  });

  test("saved access code is used", async ({ page }) => {
    const auth = await mockAuth(page, 201, CODE_AUTH_BODY);
    const room = await mockRoom(page, GUEST_CODE_ROOM);

    await page.goto(ROOM_PATH);

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await expectRoomToken(room, 0);

    await expectParticipant(page, { name: "Laura Rivera", canChange: true });
  });

  test("different access code in hash", async ({ page }) => {
    const auth = await mockAuth(page, 201, CODE_AUTH_BODY);
    await mockRoom(page, GUEST_CODE_ROOM);

    await page.goto(ROOM_PATH);
    await expectParticipant(page, { name: "Laura Rivera", canChange: true });
    await nthRequest(auth);

    const room = await mockRoom(page, GUEST_CODE_ROOM);
    await setHash(page, "accessCode=123456789");

    await expect.poll(() => auth.requests.length).toBe(2);
    expect(auth.requests[1].postDataJSON()).toEqual({
      access_code: "123456789",
      type: 0,
    });
    await expectRoomToken(room, 0);

    // Check that url was cleared and access code was updated in sessionStorage
    await expectUrlNotIncludes(page, "accessCode");
    await expectStorage(page, CODE_KEY, "123456789");

    await expectParticipant(page, { name: "Laura Rivera", canChange: true });
  });

  test("personalized link in hash", async ({ page }) => {
    const auth = await mockAuth(page, 201, CODE_AUTH_BODY);
    await mockRoom(page, GUEST_CODE_ROOM);

    await page.goto(ROOM_PATH);
    await expectParticipant(page, { name: "Laura Rivera", canChange: true });
    await nthRequest(auth);

    const linkAuth = await mockAuth(page, 201, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));

    await setHash(page, `personalizedLink=${HASH_LINK}`);

    await expectAuthBody(linkAuth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    await expectUrlNotIncludes(page, "personalizedLink");
    await expectStorage(page, LINK_KEY, HASH_LINK);

    await expectParticipant(page, {
      name: "Max Doe",
      absent: ["Laura Rivera"],
      canChange: false,
    });
  });

  test("personalized link and access code in hash", async ({ page }) => {
    const auth = await mockAuth(page, 201, CODE_AUTH_BODY);
    await mockRoom(page, GUEST_CODE_ROOM);

    await page.goto(ROOM_PATH);
    await expectParticipant(page, { name: "Laura Rivera", canChange: true });
    await nthRequest(auth);

    const linkAuth = await mockAuth(page, 201, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));

    await setHash(page, `personalizedLink=${HASH_LINK}&accessCode=987654321`);

    await expectAuthBody(linkAuth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    await expectUrlNotIncludes(page, "personalizedLink");
    await expectUrlNotIncludes(page, "accessCode");
    await expectStorage(page, LINK_KEY, HASH_LINK);

    await expectParticipant(page, {
      name: "Max Doe",
      absent: ["Laura Rivera"],
      canChange: false,
    });
  });
});

test.describe("hash change with saved personalized link", () => {
  test.beforeEach(async ({ page }) => {
    await rememberParticipantName(page, "Laura Rivera");
    await seedSessionStorage(page, { [LINK_KEY]: SAVED_LINK });
  });

  /**
   * Visit the room with the saved personalized link and wait for the room to be shown
   */
  async function visitWithSavedLink(page) {
    const auth = await mockAuth(page, 201, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Max Doe"));

    await page.goto(ROOM_PATH);

    await expectAuthBody(auth, {
      personalized_link_token: SAVED_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    await expectParticipant(page, { name: "Max Doe", canChange: false });
  }

  test("saved personalized link is used", async ({ page }) => {
    await visitWithSavedLink(page);
  });

  test("access code in hash", async ({ page }) => {
    await visitWithSavedLink(page);

    const auth = await mockAuth(page, 201, CODE_AUTH_BODY);
    const room = await mockRoom(page, GUEST_CODE_ROOM);

    await setHash(page, "accessCode=987654321");

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await expectRoomToken(room, 0);

    // Check that url was cleared and sessionStorage was updated
    await expectUrlNotIncludes(page, "accessCode");
    await expectStorage(page, CODE_KEY, "987654321");
    await expectStorage(page, LINK_KEY, null);

    await expectParticipant(page, {
      name: "Laura Rivera",
      absent: ["Max Doe"],
      canChange: true,
    });
  });

  test("different personalized link in hash", async ({ page }) => {
    await visitWithSavedLink(page);

    const auth = await mockAuth(page, 201, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Angela Jones"));

    await setHash(page, `personalizedLink=${HASH_LINK}`);

    await expectAuthBody(auth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    // Check that url was cleared and personalized link was updated in sessionStorage
    await expectUrlNotIncludes(page, "personalizedLink");
    await expectStorage(page, LINK_KEY, HASH_LINK);

    await expectParticipant(page, {
      name: "Angela Jones",
      absent: ["Max Doe"],
      canChange: false,
    });
  });

  test("different personalized link and access code in hash", async ({
    page,
  }) => {
    await visitWithSavedLink(page);

    const auth = await mockAuth(page, 201, LINK_AUTH_BODY);
    const room = await mockRoom(page, GUEST_MEMBER_ROOM("Angela Jones"));

    await setHash(page, `personalizedLink=${HASH_LINK}&accessCode=987654321`);

    await expectAuthBody(auth, {
      personalized_link_token: HASH_LINK,
      type: 1,
    });
    await expectRoomToken(room, 1);

    // Check that url was cleared, the access code was not saved and the personalized link was updated
    await expectUrlNotIncludes(page, "personalizedLink");
    await expectUrlNotIncludes(page, "accessCode");
    await expectStorage(page, CODE_KEY, null);
    await expectStorage(page, LINK_KEY, HASH_LINK);

    await expectParticipant(page, {
      name: "Angela Jones",
      absent: ["Laura Rivera"],
      canChange: false,
    });
  });
});

test.describe("hash change with access code errors", () => {
  test.use({ authenticated: true });

  const NEEDS_CODE_ROOM = {
    owner: { id: 2, name: "Max Doe" },
    authenticated: false,
    description: "<p>Test</p>",
    allow_membership: true,
  };

  test.beforeEach(async ({ page }) => {
    await mockRoom(page, NEEDS_CODE_ROOM);

    await page.goto(ROOM_PATH);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("422 error", async ({ page }) => {
    const auth = await mockAuth(page, 422, {
      message: "The Access code field is required.",
      errors: { access_code: ["The Access code field is required."] },
    });
    const room = await mockRoom(page, NEEDS_CODE_ROOM);

    await setHash(page, "accessCode=123456789");

    await nthRequest(auth);
    await nthRequest(room);
    await expectStorage(page, CODE_KEY, null);

    const overlay = page.getByTestId("room-access-overlay");
    await expect(overlay).toBeVisible();
    await expect(
      overlay.getByText("The Access code field is required."),
    ).toBeVisible();
  });

  test("invalid code error", async ({ page }) => {
    const auth = await mockAuth(page, 401, { message: "invalid_code" });
    const room = await mockRoom(page, NEEDS_CODE_ROOM);

    await setHash(page, "accessCode=987654321");

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await nthRequest(room);
    await expectStorage(page, CODE_KEY, null);

    // Check if error message is shown
    await expectToastAndClose(page, "rooms.flash.access_code_invalid");
    await expect(
      page.getByText("rooms.flash.access_code_invalid"),
    ).toBeVisible();

    const overlay = page.getByTestId("room-access-overlay");
    await expect(overlay).toBeVisible();
    await expect(overlay.locator("#access-code")).toHaveValue("987-654-321");
  });

  test("rate limit error", async ({ page }) => {
    const auth = await mockAuth(page, 429, {
      limit: "room_auth",
      retry_after: 5,
    });
    const room = await mockRoom(page, NEEDS_CODE_ROOM);

    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));

    await setHash(page, "accessCode=987654321");

    await expectAuthBody(auth, { access_code: "987654321", type: 0 });
    await nthRequest(room);
    await expectStorage(page, CODE_KEY, "987654321");

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
    await page.clock.resume();

    await expectToastAndClose(page, "app.flash.too_many_requests");

    // Check if input and buttons are enabled again
    await expect(page.locator("#access-code")).toBeEnabled();
    await expect(page.getByTestId("room-login-button")).toBeEnabled();
    await expect(page.getByTestId("reload-room-button")).toBeEnabled();
  });

  test("server error", async ({ page }) => {
    const auth = await mockAuth(page, 500, { message: "Test" });

    await setHash(page, "accessCode=987654321");

    await nthRequest(auth);
    await expectStorage(page, CODE_KEY, "987654321");

    await expectToastAndClose(page, SERVER_ERROR_TOAST);
    await expect(page.getByTestId("reload-button")).toBeVisible();
  });

  test("guests not allowed error", async ({ page }) => {
    await mockAuth(page, 403, { message: "guests_not_allowed" });

    await setHash(page, "accessCode=987654321");

    await expect(
      page.getByText("rooms.only_used_by_authenticated_users"),
    ).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expectStorage(page, CODE_KEY, "987654321");
  });

  test("room not found error as authenticated user", async ({ page }) => {
    await interceptRoomIndexRequests(page);
    const auth = await mockAuth(page, 404, MODEL_NOT_FOUND_BODY);

    await setHash(page, "accessCode=987654321");

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

test.describe("hash change with access code errors as guest", () => {
  test("room not found error", async ({ page }) => {
    const check = await rememberParticipantName(page, "Angela Jones");
    await mockRoom(page, {
      current_user: null,
      authenticated: false,
    });
    const auth = await mockAuth(page, 404, MODEL_NOT_FOUND_BODY);

    await page.goto(ROOM_PATH);
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();

    await setHash(page, "accessCode=987654321");

    await nthRequest(check);
    await nthRequest(auth);

    // Check that redirect to 404 page worked
    await expectUrlIncludes(page, "/404");
    await expectUrlNotIncludes(page, "/rooms/abc-def-123");

    await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
  });
});

test.describe("hash change with personalized link errors", () => {
  test.beforeEach(async ({ page }) => {
    await mockRoom(page, GUEST_NEEDS_CODE_ROOM);

    await page.goto(ROOM_PATH);
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  /**
   * Set the personalized link in the hash and check that it is sent to the server
   */
  async function setLinkHash(page, auth, link) {
    await setHash(page, `personalizedLink=${link}&accessCode=987654321`);
    await expectAuthBody(auth, { personalized_link_token: link, type: 1 });
  }

  test("invalid personalized link (401)", async ({ page }) => {
    const auth = await mockAuth(page, 401, {
      message: "invalid_personalized_link",
    });

    await setLinkHash(page, auth, ERROR_LINK("E401"));

    await expectStorage(page, LINK_KEY, null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link"),
    ).toBeVisible();
    await expectUrlIncludes(
      page,
      "/rooms/abc-def-123/invalid_personalized_link",
    );
  });

  test("invalid personalized link (422)", async ({ page }) => {
    const auth = await mockAuth(page, 422, {
      message: "The Access token field is required.",
      errors: {
        personalized_link_token: ["The Access token field is required."],
      },
    });

    await setLinkHash(page, auth, ERROR_LINK("E422"));

    await expectStorage(page, LINK_KEY, null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link"),
    ).toBeVisible();
    await expectUrlIncludes(
      page,
      "/rooms/abc-def-123/invalid_personalized_link",
    );
  });

  test("guests only error", async ({ page }) => {
    const auth = await mockAuth(page, 420, { message: "guests_only" });

    await setLinkHash(page, auth, ERROR_LINK("E420"));

    await expectStorage(page, LINK_KEY, ERROR_LINK("E420"));

    await expectToastAndClose(page, "app.flash.guests_only");
    await expectUrlNotIncludes(page, "/rooms");
  });

  test("server error", async ({ page }) => {
    const auth = await mockAuth(page, 500, { message: "Test" });

    await setLinkHash(page, auth, ERROR_LINK("E500"));

    await expectStorage(page, LINK_KEY, ERROR_LINK("E500"));

    await expectToastAndClose(page, SERVER_ERROR_TOAST);
    await expect(page.getByTestId("reload-button")).toBeVisible();
  });

  test("room not found error", async ({ page }) => {
    const auth = await mockAuth(page, 404, MODEL_NOT_FOUND_BODY);

    await setLinkHash(page, auth, ERROR_LINK("E404"));

    // Check that redirect to 404 page worked and error message is shown
    await expectUrlIncludes(page, "/404");
    await expectUrlNotIncludes(page, "rooms/abc-def-123");

    await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
  });
});
