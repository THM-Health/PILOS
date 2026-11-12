import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  holdRequest,
  expectActivePage,
  queryOf,
  mockMethod,
} from "../support/utils.js";
import { interceptRoomFilesRequest } from "../support/mocks.js";
import {
  setValidRememberedParticipantName,
  selectFilter,
  selectSortType,
} from "../support/room.js";

const ROOM_PATH = "/api/v1/rooms/abc-def-123";
const ROOM_AUTH_URL = "**/api/v1/rooms/abc-def-123/auth";
const RECORDINGS_URL = "**/api/v1/rooms/abc-def-123/recordings*";

const PERSONALIZED_LINK =
  "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const FORMAT = "rooms.recordings.format_types.";
const ACCESS = "rooms.recordings.access_types.";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const RECORDINGS = [
  {
    id: "e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
    description: "Recording 1",
    date: "08/17/2022, 11:20",
    guestDate: "08/17/2022, 05:20",
    duration: "20 app.time_formats.minutes",
    access: ACCESS + "everyone",
    enabledFormats: ["notes", "podcast", "presentation", "screenshare"],
    disabledFormats: [],
  },
  {
    id: "0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
    description: "Recording 2",
    date: "08/17/2022, 10:00",
    duration: "1 app.time_formats.hour, 0 app.time_formats.minutes",
    access: ACCESS + "participant",
    enabledFormats: [],
    disabledFormats: ["notes", "podcast", "presentation", "screenshare"],
  },
  {
    id: "66bcb180bb1aeb037cb4e5625af3625c6c740224-1660811975",
    description: "Recording 3",
    date: "08/18/2022, 10:39",
    duration: "1 app.time_formats.hour, 1 app.time_formats.minute",
    access: ACCESS + "moderator",
    enabledFormats: ["podcast", "presentation"],
    disabledFormats: ["notes", "screenshare"],
  },
  {
    id: "f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775",
    description: "Recording 4",
    date: "09/20/2022, 11:39",
    duration: "1 app.time_formats.minute",
    access: ACCESS + "owner",
    enabledFormats: ["notes", "screenshare"],
    disabledFormats: ["podcast", "presentation"],
  },
];

function isRoomRequest(request) {
  const url = request.url();
  return (
    request.method() === "GET" &&
    url.includes("/api/v1/rooms/abc-def-123") &&
    !url.includes("/recordings") &&
    !url.includes("/auth")
  );
}

function isRecordingsRequest(request) {
  return request.method() === "GET" && request.url().includes("/recordings");
}

function hasRoomAuthToken(request) {
  return queryOf(request).room_auth_token !== undefined;
}

function onePerPage({ lastPage = 3, total, currentPage = 1 } = {}) {
  return (recordings) => {
    recordings.data = recordings.data.slice(currentPage - 1, currentPage);
    recordings.meta.current_page = currentPage;
    recordings.meta.last_page = lastPage;
    recordings.meta.per_page = 1;
    recordings.meta.from = currentPage;
    recordings.meta.to = currentPage;
    recordings.meta.total = total ?? lastPage;
    recordings.meta.total_no_filter = total ?? lastPage;
  };
}

function firstRecordingOnly(recordings) {
  recordings.data = recordings.data.slice(0, 1);
  recordings.meta.total = 1;
  recordings.meta.total_no_filter = 1;
  recordings.meta.to = 1;
}

function noRecordings(filtered) {
  return (recordings) => {
    recordings.data = [];
    recordings.meta.from = null;
    recordings.meta.to = null;
    recordings.meta.total = 0;
    if (!filtered) {
      recordings.meta.total_no_filter = 0;
    }
  };
}

async function mockRoom(page, changes = {}) {
  // Match the room path only (not /recordings, /auth, …); query params are allowed
  await page.route(
    (url) => url.pathname === ROOM_PATH,
    async (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      const room = readFixture("room.json");
      const request = route.request();
      if (typeof changes === "function") {
        if (changes.length >= 2) {
          changes(room, request);
        } else {
          changes(room);
        }
      } else {
        Object.assign(room.data, changes);
      }
      await route.fulfill({ status: 200, json: room });
    },
  );
}

async function mockRecordings(page, changes = () => {}) {
  const recordings = readFixture("roomRecordings.json");
  changes(recordings);
  return mockMethod(page, "GET", RECORDINGS_URL, {
    status: 200,
    json: recordings,
  });
}

async function mockRecordingsError(page, status, json = {}) {
  return mockMethod(page, "GET", RECORDINGS_URL, { status, json });
}

async function expectControls(page, enabled, { strict = false } = {}) {
  const search = page.getByTestId("room-recordings-search");
  const filterLabel = page
    .getByTestId("filter-dropdown")
    .locator(".p-select-label");
  const sortGroup = page.getByTestId("sorting-type-inputgroup");
  const sortLabel = sortGroup
    .getByTestId("sorting-type-dropdown")
    .locator(".p-select-label");
  const reload = page.getByTestId("room-recordings-reload-button");

  if (enabled) {
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
    if (strict) {
      await expect(filterLabel).toHaveAttribute("aria-disabled", "false");
      await expect(sortLabel).toHaveAttribute("aria-disabled", "false");
    } else {
      await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
    }
    await expect(sortGroup.locator("button")).toBeEnabled();
    await expect(reload).toBeEnabled();
  } else {
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
    await expect(filterLabel).toHaveAttribute("aria-disabled", "true");
    await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
    await expect(sortGroup.locator("button")).toBeDisabled();
    await expect(reload).toBeDisabled();
  }
}

async function expectFormats(item, testId, formats) {
  const locator = item.getByTestId(testId);
  if (formats.length === 0) {
    await expect(locator).toHaveCount(0);
  } else {
    await expect(locator).toHaveCount(formats.length);
    await expect(locator).toContainText(
      formats.map((format) => FORMAT + format),
    );
  }
}

async function expectRecording(
  page,
  index,
  view,
  { baseURL, guest = false } = {},
) {
  const expected = RECORDINGS[index];
  const item = page.getByTestId("room-recording-item").nth(index);

  await expect(item).toContainText(expected.description);
  await expect(item).toContainText(
    guest && expected.guestDate ? expected.guestDate : expected.date,
  );
  await expect(item).toContainText(expected.duration);

  const view_button = item.getByTestId("room-recordings-view-button");
  const download = item.getByTestId("room-recordings-download-button");
  const edit = item.getByTestId("room-recordings-edit-button");
  const remove = item.getByTestId("room-recordings-delete-button");

  await expect(view_button).toBeVisible();

  if (view === "full") {
    await expect(item).toContainText(expected.access);
    await expectFormats(
      item,
      "recording-format-enabled",
      expected.enabledFormats,
    );
    await expectFormats(
      item,
      "recording-format-disabled",
      expected.disabledFormats,
    );

    await expect(edit).toBeVisible();
    await expect(remove).toBeVisible();
    await expect(download).toBeVisible();
    if (baseURL) {
      const link = item.locator(
        'a[data-test="room-recordings-download-button"]',
      );
      await expect(link).toHaveAttribute(
        "href",
        baseURL + "/download/recording/" + expected.id,
      );
      await expect(link).toHaveAttribute("target", "_blank");
    }
  } else {
    await expect(item).not.toContainText(expected.access);
    await expect(item.getByTestId("recording-format-enabled")).toHaveCount(0);
    await expect(item.getByTestId("recording-format-disabled")).toHaveCount(0);

    await expect(download).toHaveCount(0);
    await expect(edit).toHaveCount(0);
    await expect(remove).toHaveCount(0);
  }
}

async function expectRetentionPeriod(page, text) {
  const message = page.getByTestId("retention-period-message");
  await expect(message).toBeVisible();
  await expect(message).toContainText(
    "rooms.recordings.retention_period.title",
  );
  await expect(message).toContainText(text);
}

// There are two paginator components, the first one for small devices and the second one for larger devices

async function toggleSortDirection(page) {
  const recordingsRequest = page.waitForRequest(isRecordingsRequest);
  await page.getByTestId("sorting-type-inputgroup").locator("button").click();
  await recordingsRequest;
}

test.describe("Rooms view recordings", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await mockRoom(page);
    await interceptRoomFilesRequest(page);
    await mockRecordings(page);
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("load recordings", () => {
    test("shows the loading state", async ({ page }) => {
      const release = await holdRequest(page, RECORDINGS_URL, {
        json: readFixture("roomRecordings.json"),
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-recordings").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=recordings/);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectControls(page, false);

      release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectControls(page, true, { strict: true });
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    });

    for (const [index, recording] of RECORDINGS.entries()) {
      test(`shows ${recording.description}`, async ({ page, baseURL }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");

        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
        await expectRecording(page, index, "full", { baseURL });
      });
    }

    test("shows the unlimited retention period message", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");

      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      await expectRetentionPeriod(
        page,
        "rooms.recordings.retention_period.unlimited",
      );
    });

    test.describe("reload", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      test("disables the buttons and shows the overlay while reloading", async ({
        page,
      }) => {
        const release = await holdRequest(page, RECORDINGS_URL, {
          json: readFixture("roomRecordings.json"),
        });

        await page.getByTestId("room-recordings-reload-button").click();

        await expect(page.getByTestId("overlay")).toBeVisible();

        const item = page.getByTestId("room-recording-item").first();
        await expect(
          item.getByTestId("room-recordings-view-button"),
        ).toBeDisabled();
        await expect(
          item.locator('button[data-test="room-recordings-download-button"]'),
        ).toBeDisabled();
        await expect(
          item.locator('button[data-test="room-recordings-edit-button"]'),
        ).toBeDisabled();
        await expect(
          item.locator('button[data-test="room-recordings-delete-button"]'),
        ).toBeDisabled();

        release();
        await expect(page.getByTestId("overlay")).toBeHidden();
      });

      test("enables the buttons after reloading", async ({ page, baseURL }) => {
        const release = await holdRequest(page, RECORDINGS_URL, {
          json: readFixture("roomRecordings.json"),
        });

        await page.getByTestId("room-recordings-reload-button").click();
        await expect(page.getByTestId("overlay")).toBeVisible();

        release();
        await expect(page.getByTestId("overlay")).toBeHidden();

        const item = page.getByTestId("room-recording-item").first();
        await expect(
          item.getByTestId("room-recordings-view-button"),
        ).toBeEnabled();
        const download = item.locator(
          'a[data-test="room-recordings-download-button"]',
        );
        await expect(download).toHaveAttribute(
          "href",
          baseURL + "/download/recording/" + RECORDINGS[0].id,
        );
        await expect(download).toHaveAttribute("target", "_blank");
        await expect(
          item.locator('button[data-test="room-recordings-edit-button"]'),
        ).toBeEnabled();
        await expect(
          item.locator('button[data-test="room-recordings-delete-button"]'),
        ).toBeEnabled();
      });
    });
  });

  test.describe("access code", () => {
    test.beforeEach(async ({ page }) => {
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 0 } },
        }),
      );
    });

    test("loads the recordings with the room auth token", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
      });
      await mockRecordings(page, firstRecordingOnly);

      const authRequest = page.waitForRequest(ROOM_AUTH_URL);
      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await page.goto("/rooms/abc-def-123#accessCode=123456789&tab=recordings");

      await authRequest;
      expect(queryOf(await recordingsRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });

      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=recordings/);

      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      await expectRecording(page, 0, "limited");
      await expectRetentionPeriod(
        page,
        "rooms.recordings.retention_period.unlimited",
      );
    });

    test("resets the room auth token and shows an error on an invalid token", async ({
      page,
    }) => {
      // The room is only authenticated with the token, it gets reloaded without it after the error
      await mockRoom(page, (room, request) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.authenticated = hasRoomAuthToken(request);
      });
      await mockRecordingsError(page, 401, { message: "invalid_auth_token" });

      const recordingsRequest = page.waitForRequest(isRecordingsRequest);
      const roomReloadRequest = page.waitForRequest(
        (request) => isRoomRequest(request) && !hasRoomAuthToken(request),
      );

      await page.goto("/rooms/abc-def-123#accessCode=123456789&tab=recordings");

      expect(queryOf(await recordingsRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });

      const reloadQuery = queryOf(await roomReloadRequest);
      expect(reloadQuery.room_auth_token).toBeUndefined();
      expect(reloadQuery.room_auth_token_type).toBeUndefined();

      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid").first(),
      ).toBeVisible();
    });

    test("resets the room auth token and shows an error if a code is required", async ({
      page,
    }) => {
      // First the room is authenticated, after the error the reloaded room is not
      let roomRequests = 0;
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.authenticated = roomRequests++ === 0;
      });
      await mockRecordingsError(page, 403, { message: "require_code" });

      const recordingsRequest = page.waitForRequest(isRecordingsRequest);
      const roomReloadRequest = page.waitForRequest(
        (request) => isRoomRequest(request) && roomRequests >= 1,
      );

      await page.goto("/rooms/abc-def-123#tab=recordings");

      const recordingsQuery = queryOf(await recordingsRequest);
      expect(recordingsQuery.room_auth_token).toBeUndefined();
      expect(recordingsQuery.room_auth_token_type).toBeUndefined();

      const reloadQuery = queryOf(await roomReloadRequest);
      expect(reloadQuery.room_auth_token).toBeUndefined();
      expect(reloadQuery.room_auth_token_type).toBeUndefined();

      await expectToastAndClose(page, "rooms.require_access_code");

      await expect(page.locator("#access-code")).toHaveValue("");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toHaveCount(0);
    });
  });

  test.describe("personalized link", () => {
    test.use({ authenticated: false });

    test.beforeEach(async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.username = "Max Doe";
        room.data.current_user = null;
      });
    });

    test("loads the recordings with the room auth token", async ({ page }) => {
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 1 } },
        }),
      );
      await mockRecordings(page, firstRecordingOnly);

      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}&tab=recordings`,
      );

      expect(queryOf(await recordingsRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });

      await expect(
        page.getByText("rooms.recordings.title").first(),
      ).toBeVisible();

      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      await expectRecording(page, 0, "limited", { guest: true });
      await expectRetentionPeriod(
        page,
        "rooms.recordings.retention_period.unlimited",
      );
    });

    test("shows an error and redirects if the personalized link is invalid", async ({
      page,
    }) => {
      // The first authentication is valid, the authentication after the recordings error is not
      let authRequests = 0;
      await page.route(ROOM_AUTH_URL, (route) =>
        authRequests++ === 0
          ? route.fulfill({
              status: 201,
              json: { data: { id: "roomAuthToken", type: 1 } },
            })
          : route.fulfill({
              status: 401,
              json: { message: "invalid_personalized_link" },
            }),
      );
      await mockRecordingsError(page, 401, { message: "invalid_auth_token" });

      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}&tab=recordings`,
      );

      await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
      await expect(
        page.getByText("rooms.invalid_personalized_link"),
      ).toBeVisible();
      await expect(page).toHaveURL(
        /\/rooms\/abc-def-123\/invalid_personalized_link/,
      );

      // The personalized link is removed
      expect(authRequests).toBe(2);
      expect(
        await page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      ).toBeNull();
    });

    test("shows an error and redirects to the home page if only guests are allowed", async ({
      page,
    }) => {
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 1 } },
        }),
      );
      await mockRecordingsError(page, 420, { message: "guests_only" });

      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}&tab=recordings`,
      );

      await expectToastAndClose(page, "app.flash.guests_only");

      await expect(page).not.toHaveURL(/\/rooms/);
    });
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
    }) => {
      await mockRecordingsError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=recordings");

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
      await expectControls(page, true);
    });

    test("reloads the recordings after a server error", async ({ page }) => {
      await mockRecordingsError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await mockRecordings(page, onePerPage({ lastPage: 3 }));

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      await expect(
        page.getByTestId("room-recording-item").first(),
      ).toContainText("Recording 1");
    });

    test.describe("on changing the page", () => {
      test.beforeEach(async ({ page }) => {
        await mockRecordings(page, onePerPage({ lastPage: 3 }));
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

        await mockRecordingsError(page, 500, { message: "Test" });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, SERVER_ERROR_TOAST);
      });

      test("shows the overlay and the error on a server error", async ({
        page,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );
        await expectControls(page, true);
      });

      test("reloads the first page", async ({ page }) => {
        await mockRecordings(page, onePerPage({ lastPage: 3 }));

        const recordingsRequest = page.waitForRequest(isRecordingsRequest);
        await expect(page.getByTestId("overlay")).toBeVisible();
        await page.getByTestId("loading-retry-button").click();

        expect(queryOf(await recordingsRequest)).toMatchObject({ page: "1" });

        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 1");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectActivePage(page, 0);
      });
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await page.route("**/api/v1/roomTypes*", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/roomTypes.json" }),
      );
      await page.route("**/api/v1/rooms?*", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/rooms.json" }),
      );
      await mockRecordingsError(page, 404, {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      });

      await page.goto("/rooms/abc-def-123#tab=recordings");

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });

    test.describe("as guest", () => {
      test.use({ authenticated: false });

      test("redirects to the 404 page if the room is not found", async ({
        page,
      }) => {
        await mockRoom(page, (room) => {
          room.data.current_user = null;
        });
        await mockRecordingsError(page, 404, {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        });

        await page.goto("/rooms/abc-def-123#tab=recordings");

        await expect(page).toHaveURL((url) => url.pathname === "/404");
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
  }) => {
    await mockRecordings(page, (recordings) => {
      onePerPage({ lastPage: 2, total: 2 })(recordings);
    });

    await page.goto("/rooms/abc-def-123#tab=recordings");
    await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the recordings
    const requests = [];
    await page.route(RECORDINGS_URL, (route) => {
      requests.push(queryOf(route.request()));
      const recordings = readFixture("roomRecordings.json");
      if (requests.length === 1) {
        recordings.data = [];
        recordings.meta.current_page = 2;
        recordings.meta.from = null;
        recordings.meta.per_page = 2;
        recordings.meta.to = null;
        recordings.meta.total = 2;
        recordings.meta.total_no_filter = 2;
      } else {
        recordings.data = recordings.data.slice(0, 2);
        recordings.meta.per_page = 2;
        recordings.meta.to = 2;
        recordings.meta.total = 2;
        recordings.meta.total_no_filter = 2;
      }
      return route.fulfill({ json: recordings });
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for the second page, then the page is reset
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[0]).toMatchObject({ page: "2" });
    expect(requests[1]).toMatchObject({ page: "1" });

    await expect(page.getByTestId("room-recording-item")).toHaveCount(2);
  });

  test.describe("permissions", () => {
    test.beforeEach(async ({ config }) => {
      config.data.recording.recording_retention_period = 365;
    });

    test.describe("as guest", () => {
      test.use({ authenticated: false });

      test("shows only the view button", async ({ page }) => {
        await mockRoom(page, (room) => {
          room.data.current_user = null;
        });
        await mockRecordings(page, firstRecordingOnly);

        await page.goto("/rooms/abc-def-123#tab=recordings");

        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        await expectRecording(page, 0, "limited", { guest: true });
        await expectRetentionPeriod(
          page,
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });

    test.describe("with rooms.viewAll permission", () => {
      test.beforeEach(async ({ page, currentUser }) => {
        currentUser.data.permissions = ["rooms.viewAll"];
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.current_user.permissions = ["rooms.viewAll"];
        });

        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      for (const [index, recording] of RECORDINGS.entries()) {
        test(`shows only the view button for ${recording.description}`, async ({
          page,
        }) => {
          await expectRecording(page, index, "limited");
        });
      }

      test("shows the retention period message", async ({ page }) => {
        await expectRetentionPeriod(
          page,
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });

    test.describe("as co-owner", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.is_member = true;
          room.data.is_co_owner = true;
        });

        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      for (const [index, recording] of RECORDINGS.entries()) {
        test(`shows all details and buttons for ${recording.description}`, async ({
          page,
        }) => {
          await expectRecording(page, index, "full");
        });
      }

      test("shows the retention period message", async ({ page }) => {
        await expectRetentionPeriod(
          page,
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });

    test.describe("with rooms.manage permission", () => {
      test.beforeEach(async ({ page, currentUser }) => {
        currentUser.data.permissions = ["rooms.viewAll", "rooms.manage"];
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.current_user.permissions = [
            "rooms.viewAll",
            "rooms.manage",
          ];
        });

        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      for (const [index, recording] of RECORDINGS.entries()) {
        test(`shows all details and buttons for ${recording.description}`, async ({
          page,
        }) => {
          await expectRecording(page, index, "full");
        });
      }

      test("shows the retention period message", async ({ page }) => {
        await expectRetentionPeriod(
          page,
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });
  });

  test.describe("search", () => {
    const searchInput = (page) =>
      page.getByTestId("room-recordings-search").locator("input");
    const searchButton = (page) =>
      page.getByTestId("room-recordings-search").locator("button");

    test("loads the recordings without a search query", async ({ page }) => {
      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await page.goto("/rooms/abc-def-123#tab=recordings");

      const query = queryOf(await recordingsRequest);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no recordings match the search query", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      await mockRecordings(page, noRecordings(true));
      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await searchInput(page).fill("Test");
      await searchButton(page).click();

      expect(queryOf(await recordingsRequest)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("app.filter_no_result")).toBeVisible();
      await expect(page.getByTestId("room-recording-item")).toHaveCount(0);
    });

    test("shows a message if there are no recordings in the room", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      await mockRecordings(page, noRecordings(false));
      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await searchInput(page).fill("Test2");
      await searchInput(page).press("Enter");

      expect(queryOf(await recordingsRequest)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(page.getByText("rooms.recordings.nodata")).toBeVisible();
      await expect(page.getByTestId("room-recording-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

        await mockRecordings(page, onePerPage({ lastPage: 2, total: 2 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await searchInput(page).fill("Recording");
        await searchButton(page).click();

        expect(queryOf(await recordingsRequest)).toMatchObject({
          query: "Recording",
          page: "1",
        });

        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      });

      test("shows the recordings of the search", async ({ page }) => {
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 1");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keeps the search query when changing the page", async ({
        page,
      }) => {
        await mockRecordings(
          page,
          onePerPage({ currentPage: 2, lastPage: 2, total: 2 }),
        );
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await recordingsRequest)).toMatchObject({
          query: "Recording",
          page: "2",
        });

        await expect(searchInput(page)).toHaveValue("Recording");
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");
      });

      test("resets the page when changing the search query", async ({
        page,
      }) => {
        await mockRecordings(
          page,
          onePerPage({ currentPage: 2, lastPage: 2, total: 2 }),
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");

        await mockRecordings(page, onePerPage({ lastPage: 2, total: 2 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await searchInput(page).fill("Record");
        await searchButton(page).click();

        expect(queryOf(await recordingsRequest)).toMatchObject({
          query: "Record",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter", () => {
    test("loads the recordings without a filter", async ({ page }) => {
      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await page.goto("/rooms/abc-def-123#tab=recordings");

      const query = queryOf(await recordingsRequest);
      expect(query.filter).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows the filter options", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);
      await expect(page.getByTestId("filter-dropdown")).toHaveText(
        "rooms.recordings.filter.all",
      );

      await page.getByTestId("filter-dropdown").click();

      const items = page.getByTestId("filter-dropdown-items");
      await expect(items).toBeVisible();

      const options = items.getByTestId("filter-dropdown-option");
      await expect(options).toHaveText([
        "rooms.recordings.filter.all",
        "rooms.recordings.filter.everyone_access",
        "rooms.recordings.filter.participant_access",
        "rooms.recordings.filter.moderator_access",
        "rooms.recordings.filter.owner_access",
      ]);
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
    });

    test.describe("after loading", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      test("shows a message if no recordings match the filter", async ({
        page,
      }) => {
        await mockRecordings(page, noRecordings(true));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await selectFilter(page, 1);

        expect(queryOf(await recordingsRequest)).toMatchObject({
          filter: "everyone_access",
          page: "1",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.recordings.filter.everyone_access",
        );
        await expect(page.getByText("app.filter_no_result")).toBeVisible();
        await expect(page.getByTestId("room-recording-item")).toHaveCount(0);
      });

      test("shows a message if there are no recordings in the room", async ({
        page,
      }) => {
        await mockRecordings(page, noRecordings(false));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await selectFilter(page, 2);

        expect(queryOf(await recordingsRequest)).toMatchObject({
          filter: "participant_access",
          page: "1",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.recordings.filter.participant_access",
        );
        await expect(page.getByText("rooms.recordings.nodata")).toBeVisible();
        await expect(page.getByTestId("room-recording-item")).toHaveCount(0);
      });

      test.describe("with multiple pages", () => {
        test.beforeEach(async ({ page }) => {
          await mockRecordings(page, onePerPage({ lastPage: 2, total: 2 }));
          const recordingsRequest = page.waitForRequest(isRecordingsRequest);

          await selectFilter(page, 3);

          expect(queryOf(await recordingsRequest)).toMatchObject({
            filter: "moderator_access",
            page: "1",
          });
          await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        });

        test("shows the filtered recordings", async ({ page }) => {
          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.recordings.filter.moderator_access",
          );
          await expect(
            page.getByTestId("room-recording-item").first(),
          ).toContainText("Recording 1");
          await expect(page.getByTestId("paginator-page")).toHaveCount(2);
          await expectActivePage(page, 0);
        });

        test("keeps the filter when changing the page", async ({ page }) => {
          await mockRecordings(
            page,
            onePerPage({ currentPage: 2, lastPage: 2, total: 2 }),
          );
          const recordingsRequest = page.waitForRequest(isRecordingsRequest);

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(queryOf(await recordingsRequest)).toMatchObject({
            filter: "moderator_access",
            page: "2",
          });

          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.recordings.filter.moderator_access",
          );
          await expectActivePage(page, 1);
          await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
          await expect(
            page.getByTestId("room-recording-item").first(),
          ).toContainText("Recording 2");
        });

        test("resets the page when changing the filter", async ({ page }) => {
          await mockRecordings(
            page,
            onePerPage({ currentPage: 2, lastPage: 2, total: 2 }),
          );
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-recording-item").first(),
          ).toContainText("Recording 2");

          await mockRecordings(page, onePerPage({ lastPage: 2, total: 2 }));
          const recordingsRequest = page.waitForRequest(isRecordingsRequest);

          await selectFilter(page, 4);

          expect(queryOf(await recordingsRequest)).toMatchObject({
            filter: "owner_access",
            page: "1",
          });

          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.recordings.filter.owner_access",
          );
          await expectActivePage(page, 0);
        });

        test("resets the filter and the page", async ({ page }) => {
          await mockRecordings(
            page,
            onePerPage({ currentPage: 2, lastPage: 2, total: 2 }),
          );
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          await mockRecordings(page, onePerPage({ lastPage: 2, total: 2 }));
          const recordingsRequest = page.waitForRequest(isRecordingsRequest);

          await selectFilter(page, 0);

          const query = queryOf(await recordingsRequest);
          expect(query.filter).toBeUndefined();
          expect(query).toMatchObject({ page: "1" });

          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.recordings.filter.all",
          );
          await expectActivePage(page, 0);
        });
      });
    });
  });

  test.describe("sort", () => {
    test("loads the recordings sorted by start", async ({ page }) => {
      const recordingsRequest = page.waitForRequest(isRecordingsRequest);

      await page.goto("/rooms/abc-def-123#tab=recordings");

      expect(queryOf(await recordingsRequest)).toMatchObject({
        sort_by: "start",
        sort_direction: "desc",
        page: "1",
      });
    });

    test("shows the sorting options", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "rooms.recordings.sort.start",
      );

      await page.getByTestId("sorting-type-dropdown").click();

      const items = page.getByTestId("sorting-type-dropdown-items");
      await expect(items).toBeVisible();

      const options = items.getByTestId("sorting-type-dropdown-option");
      await expect(options).toHaveText([
        "rooms.recordings.sort.description",
        "rooms.recordings.sort.start",
      ]);
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    });

    test.describe("after changing the sorting type", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

        await mockRecordings(page, onePerPage({ lastPage: 4 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await selectSortType(page, 0);

        expect(queryOf(await recordingsRequest)).toMatchObject({
          sort_by: "description",
          sort_direction: "desc",
          page: "1",
        });
        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      });

      test("shows the sorted recordings", async ({ page }) => {
        await expect(
          page.getByTestId("sorting-type-dropdown-items"),
        ).toHaveCount(0);
        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "rooms.recordings.sort.description",
        );
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 1");
        await expect(page.getByTestId("paginator-page")).toHaveCount(4);
        await expectActivePage(page, 0);
      });

      test("keeps the sorting when changing the page", async ({ page }) => {
        await mockRecordings(page, onePerPage({ currentPage: 2, lastPage: 4 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await recordingsRequest)).toMatchObject({
          sort_by: "description",
          sort_direction: "desc",
          page: "2",
        });

        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "rooms.recordings.sort.description",
        );
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");
      });

      test("resets the page when changing the sorting direction", async ({
        page,
      }) => {
        await mockRecordings(page, onePerPage({ currentPage: 2, lastPage: 4 }));
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");

        await mockRecordings(page, onePerPage({ lastPage: 4 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await toggleSortDirection(page);

        expect(queryOf(await recordingsRequest)).toMatchObject({
          sort_by: "description",
          sort_direction: "asc",
          page: "1",
        });

        await expectActivePage(page, 0);
      });

      test("keeps the sorting direction when changing the page", async ({
        page,
      }) => {
        await toggleSortDirection(page);
        await expectActivePage(page, 0);

        await mockRecordings(page, onePerPage({ currentPage: 2, lastPage: 4 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await recordingsRequest)).toMatchObject({
          sort_by: "description",
          sort_direction: "asc",
          page: "2",
        });

        await expectActivePage(page, 1);
      });

      test("resets the page when changing the sorting type", async ({
        page,
      }) => {
        await toggleSortDirection(page);

        await mockRecordings(page, onePerPage({ currentPage: 2, lastPage: 4 }));
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        await mockRecordings(page, onePerPage({ lastPage: 4 }));
        const recordingsRequest = page.waitForRequest(isRecordingsRequest);

        await selectSortType(page, 1);

        expect(queryOf(await recordingsRequest)).toMatchObject({
          sort_by: "start",
          sort_direction: "asc",
          page: "1",
        });

        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "rooms.recordings.sort.start",
        );
        await expectActivePage(page, 0);
      });
    });
  });
});
