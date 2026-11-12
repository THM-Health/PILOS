import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { mockMethod, nthRequest, queryOf } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123*";
const AUTH_URL = "**/api/v1/rooms/abc-def-123/auth*";
const LINK_KEY = "roomPersonalizedLink_abc-def-123";

const TOKEN =
  "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR";
const errorToken = (code) => `${code}${TOKEN.slice(4)}`;

const AUTH_OK = { data: { id: "roomAuthToken", type: 1 } };
const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const PARTICIPANT_ROOM = {
  username: "Laura Rivera",
  allow_membership: true,
  is_member: true,
  current_user: null,
};

function mockRoom(page, overrides = {}) {
  const room = JSON.parse(
    readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
  );
  Object.assign(room.data, overrides);
  return mockMethod(page, "GET", ROOM_URL, { status: 200, json: room });
}

function mockRoomError(page, status, message, options = {}) {
  return mockMethod(page, "GET", ROOM_URL, {
    status,
    json: { message },
    ...options,
  });
}

function mockAuth(page, status, json, options = {}) {
  return mockMethod(page, "POST", AUTH_URL, { status, json, ...options });
}

async function expectAuthBody(auth, token, n = 1) {
  const request = await nthRequest(auth, n);
  expect(request.postDataJSON()).toEqual({
    personalized_link_token: token,
    type: 1,
  });
}

async function expectRoomToken(room, n = 1) {
  const request = await nthRequest(room, n);
  expect(queryOf(request)).toMatchObject({
    room_auth_token: "roomAuthToken",
    room_auth_token_type: "1",
  });
}

async function expectStorage(page, value) {
  await expect
    .poll(() =>
      page.evaluate((key) => window.sessionStorage.getItem(key), LINK_KEY),
    )
    .toBe(value);
}

async function expectUrlIncludes(page, text) {
  await expect(page).toHaveURL((url) => url.href.includes(text));
}

async function expectUrlNotIncludes(page, text) {
  await expect(page).toHaveURL((url) => !url.href.includes(text));
}

async function expectRoomLoaded(page) {
  await expect(page.getByText("Meeting One").first()).toBeVisible();
  await expect(page.getByText("John Doe").first()).toBeVisible();
  await expect(
    page.getByText("rooms.index.room_component.never_started"),
  ).toBeVisible();
}

async function expectInvalidLink(page) {
  await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
  await expect(
    page.getByText("rooms.invalid_personalized_link").first(),
  ).toBeVisible();
  await expectUrlIncludes(page, "/rooms/abc-def-123/invalid_personalized_link");
}

async function expectGuestsOnlyRedirect(page) {
  await expectToastAndClose(page, "app.flash.guests_only");
  await expectUrlNotIncludes(page, "/rooms");
}

/** Room as seen with a personalized link: participant name, reduced buttons and tabs */
async function expectPersonalizedLinkView(page) {
  await expectRoomLoaded(page);

  await expect(page.getByText("rooms.name_in_video_conference")).toBeVisible();
  await expect(page.getByText("Laura Rivera")).toBeVisible();
  await expect(page.getByTestId("change-participant-name-button")).toHaveCount(
    0,
  );

  await expect(page.getByTestId("reload-room-button")).toBeVisible();
  await expect(page.getByTestId("room-join-membership-button")).toHaveCount(0);
  await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
  await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);

  await expect(page.locator("#tab-files")).toBeVisible();
  await expect(page.locator("#tab-recordings")).toBeVisible();
  for (const tab of [
    "description",
    "members",
    "tokens",
    "history",
    "settings",
  ]) {
    await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
  }
  await expect(page.getByText("rooms.files.title")).toBeVisible();

  await expect(page.getByTestId("room-share-button")).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await interceptRoomFilesRequest(page);
});

test.describe("guest with personalized link", () => {
  test("shows loading spinner until the room auth request is answered", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 201, AUTH_OK, { hold: true });
    await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    auth.release();

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-loading-spinner")).toBeHidden();
  });

  test("authenticates with the link from the hash and loads the room with the token", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 201, AUTH_OK);
    const room = await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expectAuthBody(auth, TOKEN);
    await expectRoomToken(room);
  });

  test("stores the link in the sessionStorage and removes it from the url", async ({
    page,
  }) => {
    await mockAuth(page, 201, AUTH_OK);
    await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expectStorage(page, TOKEN);
    await expectUrlNotIncludes(page, "#personalizedLink");
  });

  test("shows the room as participant", async ({ page }) => {
    await mockAuth(page, 201, AUTH_OK);
    await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expectPersonalizedLinkView(page);
  });

  test("shows the room as moderator", async ({ page }) => {
    const auth = await mockAuth(page, 201, AUTH_OK);
    const room = await mockRoom(page, {
      ...PARTICIPANT_ROOM,
      is_moderator: true,
    });

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expectAuthBody(auth, TOKEN);
    await expectRoomToken(room);
    await expectStorage(page, TOKEN);
    await expectUrlNotIncludes(page, "#personalizedLink");
    await expectPersonalizedLinkView(page);
  });

  test("authenticates with the link from the legacy route", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 201, AUTH_OK);
    const room = await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}/${TOKEN}`);

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expectAuthBody(auth, TOKEN);
    await expectRoomToken(room);
    await expectStorage(page, TOKEN);

    // The link is neither visible as hash nor as path
    await expectUrlNotIncludes(page, "#personalizedLink");
    await expectUrlNotIncludes(page, TOKEN);

    await expectPersonalizedLinkView(page);
  });

  test("reuses the link from the sessionStorage after a reload", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 201, AUTH_OK);
    const room = await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);
    await expectRoomLoaded(page);

    await page.reload();

    await expectAuthBody(auth, TOKEN, 2);
    await expectRoomToken(room, 2);
    await expectStorage(page, TOKEN);
    await expectPersonalizedLinkView(page);
  });

  test("reload button with an invalid link clears the link and shows an error", async ({
    page,
  }) => {
    await mockAuth(page, 201, AUTH_OK);
    await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);
    await expectRoomLoaded(page);

    const auth = await mockAuth(page, 401, {
      message: "invalid_personalized_link",
    });
    const room = await mockRoomError(page, 401, "invalid_auth_token");

    await page.getByTestId("reload-room-button").click();

    await expectRoomToken(room);
    await nthRequest(auth);
    await expectStorage(page, null);
    await expectInvalidLink(page);
  });

  test("reload button with an invalid token clears the link and shows an error", async ({
    page,
  }) => {
    await mockAuth(page, 201, AUTH_OK);
    await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);
    await expectRoomLoaded(page);
    await expectStorage(page, TOKEN);

    const room = await mockRoomError(page, 401, "invalid_auth_token");
    const auth = await mockAuth(page, 401, {
      message: "invalid_personalized_link",
    });

    await page.getByTestId("reload-room-button").click();

    await expectRoomToken(room);
    await nthRequest(auth);
    await expectStorage(page, null);
    await expectInvalidLink(page);
  });

  test("reload button shows the guests only error if the room is no longer accessible", async ({
    page,
  }) => {
    await mockAuth(page, 201, AUTH_OK);
    await mockRoom(page, PARTICIPANT_ROOM);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);
    await expectRoomLoaded(page);
    await expectStorage(page, TOKEN);

    const room = await mockRoomError(page, 420, "guests_only");

    await page.getByTestId("reload-room-button").click();

    await nthRequest(room);
    await expectGuestsOnlyRedirect(page);
  });
});

test.describe("room auth request errors", () => {
  test("invalid personalized link (401) clears the link and shows an error", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 401, {
      message: "invalid_personalized_link",
    });

    await page.goto(`${ROOM_PATH}#personalizedLink=${errorToken("E401")}`);

    await expectAuthBody(auth, errorToken("E401"));
    await expectStorage(page, null);
    await expectInvalidLink(page);
  });

  test("validation error (422) clears the link and shows an error", async ({
    page,
  }) => {
    const auth = await mockMethod(page, "POST", AUTH_URL, {
      status: 422,
      json: {
        message: "The Access token field is required.",
        errors: {
          personalized_link_token: ["The Access token field is required."],
        },
      },
    });

    await page.goto(`${ROOM_PATH}#personalizedLink=${errorToken("E422")}`);

    await expectAuthBody(auth, errorToken("E422"));
    await expectStorage(page, null);
    await expectInvalidLink(page);
  });

  test("guests only error (420) redirects away from the room", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 420, { message: "guests_only" });

    await page.goto(`${ROOM_PATH}#personalizedLink=${errorToken("E420")}`);

    await expectAuthBody(auth, errorToken("E420"));
    await expectStorage(page, errorToken("E420"));
    await expectGuestsOnlyRedirect(page);
    await expectUrlNotIncludes(page, "rooms/abc-def-123");
  });

  test("room not found (404) redirects to the 404 page", async ({ page }) => {
    const auth = await mockAuth(page, 404, {
      message: "model_not_found",
      model: "room",
      ids: ["abc-def-123"],
    });

    await page.goto(`${ROOM_PATH}#personalizedLink=${errorToken("E404")}`);

    await expectAuthBody(auth, errorToken("E404"));

    await expectUrlIncludes(page, "/404");
    await expectUrlNotIncludes(page, "rooms/abc-def-123");
    await expectToastAndClose(page, [
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  test.describe("server error (500)", () => {
    let auth;

    test.beforeEach(async ({ page }) => {
      auth = await mockAuth(page, 500, { message: "Test" });

      await page.goto(`${ROOM_PATH}#personalizedLink=${errorToken("E500")}`);
      await expectAuthBody(auth, errorToken("E500"));
      await expectStorage(page, errorToken("E500"));
    });

    test("shows an error and a reload button", async ({ page }) => {
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(page.getByTestId("reload-button")).toBeVisible();
      await expectUrlNotIncludes(page, "#personalizedLink");
    });

    test("keeps the error after a reload and reuses the link from the sessionStorage", async ({
      page,
    }) => {
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(page.getByTestId("reload-button")).toBeVisible();

      await page.reload();

      await expectAuthBody(auth, errorToken("E500"), 2);
      await expectStorage(page, errorToken("E500"));
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(page.getByTestId("reload-button")).toBeVisible();
    });

    test("reload button sends the auth request again and loads the room", async ({
      page,
    }) => {
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(page.getByTestId("reload-button")).toBeVisible();

      const newAuth = await mockAuth(page, 201, AUTH_OK);
      const room = await mockRoom(page, PARTICIPANT_ROOM);

      await page.getByTestId("reload-button").click();

      await expectAuthBody(newAuth, errorToken("E500"));
      await expectRoomToken(room);
      await expectStorage(page, errorToken("E500"));
      await expectRoomLoaded(page);
    });
  });
});

test.describe("room request errors", () => {
  test("invalid auth token (401) requests a new auth token, an invalid link shows an error", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 201, AUTH_OK);
    const room = await mockRoomError(page, 401, "invalid_auth_token", {
      hold: true,
    });

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expectAuthBody(auth, TOKEN);

    // The second auth request (after the invalid token) is held, then answered with an invalid link
    const secondAuth = await mockAuth(
      page,
      401,
      { message: "invalid_personalized_link" },
      { hold: true },
    );
    room.release();

    await expectRoomToken(room);
    await expectAuthBody(secondAuth, TOKEN);
    await expectStorage(page, TOKEN);
    secondAuth.release();

    await expectStorage(page, null);
    await expectInvalidLink(page);
  });

  test("guests only error (420) redirects away from the room", async ({
    page,
  }) => {
    const auth = await mockAuth(page, 201, AUTH_OK);
    const room = await mockRoomError(page, 420, "guests_only");

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expectAuthBody(auth, TOKEN);
    await expectRoomToken(room);
    await expectStorage(page, TOKEN);
    await expectGuestsOnlyRedirect(page);
    await expectUrlNotIncludes(page, "rooms/abc-def-123");
  });

  test.describe("server error (500)", () => {
    let auth;
    let room;

    test.beforeEach(async ({ page }) => {
      auth = await mockAuth(page, 201, AUTH_OK);
      room = await mockRoomError(page, 500, "Test");

      await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);
      await expectAuthBody(auth, TOKEN);
      await expectRoomToken(room);
      await expectStorage(page, TOKEN);
    });

    test("shows an error and a reload button", async ({ page }) => {
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(page.getByTestId("reload-button")).toBeVisible();
    });

    test("reload button requests the room again with the same auth token", async ({
      page,
    }) => {
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(page.getByTestId("reload-button")).toBeVisible();

      const differentAuth = await mockAuth(page, 201, {
        data: { id: "differentToken", type: 1 },
      });
      const newRoom = await mockRoom(page, PARTICIPANT_ROOM);

      await page.getByTestId("reload-button").click();

      await expectRoomToken(newRoom);
      await expectStorage(page, TOKEN);
      await expectRoomLoaded(page);

      // The auth request was not sent again
      expect(differentAuth.requests).toHaveLength(0);
    });
  });
});

test.describe("authenticated user", () => {
  test.use({ authenticated: true });

  const OWNED_BY_OTHER = {
    owner: { id: 2, name: "Max Doe" },
    is_member: true,
    is_moderator: true,
    allow_membership: true,
  };

  test("visiting with a personalized link in the hash redirects away from the room", async ({
    page,
  }) => {
    await interceptRoomIndexRequests(page);
    const room = await mockRoom(page, OWNED_BY_OTHER);

    await page.goto(`${ROOM_PATH}#personalizedLink=${TOKEN}`);

    await expectGuestsOnlyRedirect(page);
    expect(room.requests).toHaveLength(0);
  });

  test("a personalized link in the sessionStorage is ignored and cleared", async ({
    page,
  }) => {
    const room = await mockRoom(page, OWNED_BY_OTHER);
    const auth = await mockAuth(page, 201, AUTH_OK);

    await page.addInitScript(
      ([key, token]) => window.sessionStorage.setItem(key, token),
      [LINK_KEY, TOKEN],
    );

    await page.goto(ROOM_PATH);

    // Room is requested without auth token
    const request = await nthRequest(room);
    expect(queryOf(request)).not.toHaveProperty("room_auth_token");
    expect(queryOf(request)).not.toHaveProperty("room_auth_token_type");

    await expect(page.getByText("Meeting One").first()).toBeVisible();

    // No participant name is shown
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    await expectStorage(page, null);
    expect(auth.requests).toHaveLength(0);
  });
});
