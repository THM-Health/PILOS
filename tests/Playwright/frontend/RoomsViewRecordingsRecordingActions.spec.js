import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { mockMethod, nthRequest } from "../support/utils.js";
import {
  interceptRoomIndexRequests,
  interceptRoomRecordingsRequests,
  interceptRoomViewRequests,
} from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  expectNoAuthToken,
  setValidRememberedParticipantName,
} from "../support/room.js";

const ROOM_PATH = "/api/v1/rooms/abc-def-123";
const ROOM_AUTH_URL = "**/api/v1/rooms/abc-def-123/auth";
const RECORDINGS_URL = "**/api/v1/rooms/abc-def-123/recordings*";
const RECORDINGS_PATH = "api/v1/rooms/abc-def-123/recordings/";

const PERSONALIZED_LINK =
  "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR";

// ids of the recordings of the fixture
const RECORDING_1 = "e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035";
const RECORDING_2 = "0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200";
const RECORDING_4 = "f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Mock the room request (with or without query), the room fixture is changed by `mutate`.
 */
function mockRoom(page, mutate = () => {}) {
  const room = readFixture("room.json");
  mutate(room);
  return mockMethod(page, "GET", (url) => url.pathname === ROOM_PATH, {
    status: 200,
    json: room,
  });
}

/**
 * Mock the recordings list with the recordings of the fixture from index `start` to `end`.
 */
function mockRecordings(page, start, end) {
  const recordings = readFixture("roomRecordings.json");
  recordings.data = recordings.data.slice(start, end);
  recordings.meta.to = recordings.data.length;
  recordings.meta.total = recordings.data.length;
  recordings.meta.total_no_filter = recordings.data.length;
  return mockMethod(page, "GET", RECORDINGS_URL, {
    status: 200,
    json: recordings,
  });
}

/**
 * Post a message to the app window (like the recording format windows do) and wait until the window has dispatched it,
 * so the assertions afterwards do not run before the app had the chance to react.
 */
async function postMessage(page, message) {
  await page.evaluate(
    (message) =>
      new Promise((resolve) => {
        window.addEventListener("message", () => resolve(), { once: true });
        window.postMessage(message, window.location.origin);
      }),
    message,
  );
}

/**
 * Check the links of the view dialog, `query` is the room auth token query that is expected after the url.
 */
async function expectFormatLinks(page, query = "") {
  for (const [index, format] of [
    "notes",
    "podcast",
    "presentation",
    "screenshare",
  ].entries()) {
    const button = page.getByTestId(`${format}-button`);
    await expect(button).toBeVisible();
    await expect(button).toContainText(
      `rooms.recordings.format_types.${format}`,
    );
    await expect(button).toHaveAttribute(
      "href",
      `https://example.com/rooms/abc-def-123/recordings/${RECORDING_1}/formats/${index + 1}${query}`,
    );
    await expect(button).toHaveAttribute("rel", "opener");
    await expect(button).toHaveAttribute("target", "_blank");
  }
}

test.describe("Rooms view recordings recording actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomViewRequests(page);
    await interceptRoomRecordingsRequests(page);
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("view recording", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    });

    test("shows the dialog with the recording details", async ({ page }) => {
      const dialog = page.getByTestId("room-recordings-view-dialog");
      await expect(dialog).toBeHidden();

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-view-button")
        .click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("Recording 1");
      await expect(dialog).toContainText(
        "08/17/2022, 11:20 - 08/17/2022, 11:40",
      );
    });

    test("shows the links to the formats", async ({ page }) => {
      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-view-button")
        .click();

      await expect(
        page.getByTestId("room-recordings-view-dialog"),
      ).toBeVisible();
      await expectFormatLinks(page);
    });
  });

  test.describe("view recording with access code", () => {
    test.beforeEach(async ({ page }) => {
      await mockMethod(page, "POST", ROOM_AUTH_URL, {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
      });
      await mockRecordings(page, 0, 1);

      await page.goto("/rooms/abc-def-123#accessCode=123456789&tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
    });

    test("adds the room auth token to the links", async ({ page }) => {
      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-view-button")
        .click();

      await expectFormatLinks(
        page,
        "?room_auth_token=roomAuthToken&room_auth_token_type=0",
      );
    });

    test("resets the room auth token on invalid_auth_token", async ({
      page,
    }) => {
      const room = await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.authenticated = false;
      });

      await postMessage(page, { type: "invalid_auth_token" });

      expectNoAuthToken(await nthRequest(room));

      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid").first(),
      ).toBeVisible();
    });

    test("asks for the access code on require_code", async ({ page }) => {
      // Reset the room auth token first, then reload the room without a token (the access overlay requires a token)
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.authenticated = false;
      });
      await postMessage(page, { type: "invalid_auth_token" });
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");

      const reloadedRoom = await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
      });
      await page.getByTestId("reload-room-button").click();
      await nthRequest(reloadedRoom);
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      const room = await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.authenticated = false;
      });
      await postMessage(page, { type: "require_code" });

      expectNoAuthToken(await nthRequest(room));

      await expectToastAndClose(page, "rooms.require_access_code");

      await expect(page.locator("#access-code")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toHaveCount(0);
    });
  });

  test.describe("view recording with personalized link", () => {
    test.use({ authenticated: false });

    test.beforeEach(async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.username = "Max Doe";
        room.data.current_user = null;
      });
      await mockMethod(page, "POST", ROOM_AUTH_URL, {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });
      await mockRecordings(page, 0, 1);
    });

    test("adds the room auth token to the links", async ({ page }) => {
      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}&tab=recordings`,
      );
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-view-button")
        .click();

      await expectFormatLinks(
        page,
        "?room_auth_token=roomAuthToken&room_auth_token_type=1",
      );
    });

    test("shows an error and redirects on an invalid personalized link", async ({
      page,
    }) => {
      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}&tab=recordings`,
      );
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      const auth = await mockMethod(page, "POST", ROOM_AUTH_URL, {
        status: 401,
        json: { message: "invalid_personalized_link" },
      });

      await postMessage(page, { type: "invalid_auth_token" });
      await nthRequest(auth);

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBeNull();

      await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
      await expect(
        page.getByText("rooms.invalid_personalized_link").first(),
      ).toBeVisible();
      await expect(page).toHaveURL(
        /\/rooms\/abc-def-123\/invalid_personalized_link/,
      );
    });

    test("redirects to the home page if only guests are allowed", async ({
      page,
    }) => {
      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}&tab=recordings`,
      );
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      await postMessage(page, { type: "guests_only" });

      await expectToastAndClose(page, "app.flash.guests_only");
      await expect(page).not.toHaveURL(/\/rooms/);
    });
  });

  test.describe("view recording with errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    });

    for (const [type, remaining] of [
      ["file_not_found", 3],
      ["not_found", 2],
    ]) {
      test(`reloads the recordings on ${type}`, async ({ page }) => {
        const recordings = await mockRecordings(page, 0, remaining);

        await postMessage(page, { type });
        await nthRequest(recordings);

        await expectToastAndClose(page, "rooms.flash.recording_gone");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(
          remaining,
        );
        await expect(
          page.getByTestId("room-recordings-view-dialog"),
        ).toBeHidden();
      });
    }

    test("reloads the recordings on forbidden and delays the room update", async ({
      page,
    }) => {
      const recordings = await mockRecordings(page, 0, 2);
      const room = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === ROOM_PATH,
        {
          hold: true,
          status: 200,
          json: (() => {
            const data = readFixture("room.json");
            data.data.current_user = null;
            return data;
          })(),
        },
      );

      await postMessage(page, { type: "forbidden" });
      await nthRequest(recordings);

      await expectToastAndClose(page, "rooms.flash.recording_forbidden");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(2);

      // The room request is still pending, so the rest of the page is not yet updated
      await expect(page.getByText("auth.login")).toHaveCount(0);

      room.release();
      await expect(page.getByText("auth.login").first()).toBeVisible();
    });

    test("reloads room and recordings on forbidden if the permissions changed", async ({
      page,
    }) => {
      await mockRoom(page, (room) => {
        room.data.current_user = null;
      });
      const recordings = await mockRecordings(page, 0, 1);
      const participantNameCheck = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          request.url().includes("/api/v1/participantName/check"),
      );

      await postMessage(page, { type: "forbidden" });

      await expectToastAndClose(page, "rooms.flash.recording_forbidden");
      await participantNameCheck;

      // Recordings are reloaded because of the error and again because the room changed
      await nthRequest(recordings, 2);
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("auth.login").first()).toBeVisible();

      // Recording details and buttons for a guest
      const item = page.getByTestId("room-recording-item").first();
      await expect(item).toContainText("Recording 1");
      await expect(item).not.toContainText(
        "rooms.recordings.access_types.everyone",
      );
      await expect(item.getByTestId("recording-format-disabled")).toHaveCount(
        0,
      );
      await expect(item.getByTestId("recording-format-enabled")).toHaveCount(0);
      await expect(
        item.getByTestId("room-recordings-view-button"),
      ).toBeVisible();
      await expect(
        item.getByTestId("room-recordings-download-button"),
      ).toHaveCount(0);
      await expect(item.getByTestId("room-recordings-edit-button")).toHaveCount(
        0,
      );
      await expect(
        item.getByTestId("room-recordings-delete-button"),
      ).toHaveCount(0);
    });

    test("shows a message on guests_not_allowed", async ({ page }) => {
      await postMessage(page, { type: "guests_not_allowed" });

      await expect(
        page.getByText("rooms.only_used_by_authenticated_users").first(),
      ).toBeVisible();
    });

    for (const [name, message] of [
      ["without message", null],
      ["without type", {}],
      ["with null type", { type: null }],
    ]) {
      test(`ignores messages ${name}`, async ({ page }) => {
        const recordings = await mockRecordings(page, 0, 4);

        await postMessage(page, message);

        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
        await expect(page.locator(".p-toast-message")).toHaveCount(0);
        expect(recordings.requests).toHaveLength(0);
      });
    }
  });

  test("ignores messages of a different base url", async ({ page, config }) => {
    config.data.room.file_terms_of_use = "Test terms of use";
    config.data.general.base_url = "";

    await page.goto("/rooms/abc-def-123#tab=recordings");
    await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

    const recordings = await mockRecordings(page, 0, 4);

    await postMessage(page, { type: "file_not_found" });

    await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    await expect(page.locator(".p-toast-message")).toHaveCount(0);
    expect(recordings.requests).toHaveLength(0);
  });

  test.describe("delete recording", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    });

    test("shows the confirmation dialog", async ({ page }) => {
      const dialog = page.getByTestId("room-recordings-delete-dialog");
      await expect(dialog).toBeHidden();

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-delete-button")
        .click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        "rooms.recordings.modals.delete.title",
      );
      await expect(dialog).toContainText(
        "rooms.recordings.modals.delete.confirm",
      );
    });

    test("disables the dialog buttons while deleting", async ({ page }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        `**/${RECORDINGS_PATH}${RECORDING_1}`,
        { hold: true, status: 204 },
      );

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-delete-button")
        .click();

      const dialog = page.getByTestId("room-recordings-delete-dialog");
      await expect(dialog.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await dialog.getByTestId("dialog-continue-button").click();

      await expect(dialog.getByTestId("dialog-continue-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();

      await mockRecordings(page, 1, 4);
      deleteRequest.release();
      await expect(dialog).toBeHidden();
    });

    test("deletes the recording and reloads the list", async ({ page }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        `**/${RECORDINGS_PATH}${RECORDING_1}`,
        { status: 204 },
      );
      await mockRecordings(page, 1, 4);

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-delete-button")
        .click();
      await page
        .getByTestId("room-recordings-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await nthRequest(deleteRequest);

      await expect(page.getByTestId("room-recording-item")).toHaveCount(3);
      await expect(
        page.getByTestId("room-recordings-delete-dialog"),
      ).toBeHidden();
    });

    test("reloads the list if the recording was not found", async ({
      page,
    }) => {
      await page
        .getByTestId("room-recording-item")
        .nth(3)
        .getByTestId("room-recordings-delete-button")
        .click();

      await mockMethod(page, "DELETE", `**/${RECORDINGS_PATH}${RECORDING_4}`, {
        status: 404,
        json: {
          message: "model_not_found",
          model: "recording",
          ids: [RECORDING_4],
        },
      });
      await mockRecordings(page, 0, 3);

      await page
        .getByTestId("room-recordings-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await expectToastAndClose(page, "rooms.flash.recording_gone");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(3);
      await expect(
        page.getByTestId("room-recordings-delete-dialog"),
      ).toBeHidden();
    });

    test("keeps the dialog open on a server error", async ({ page }) => {
      await page
        .getByTestId("room-recording-item")
        .nth(1)
        .getByTestId("room-recordings-delete-button")
        .click();

      await mockMethod(page, "DELETE", `**/${RECORDINGS_PATH}${RECORDING_2}`, {
        status: 500,
        json: { message: "Test" },
      });

      const dialog = page.getByTestId("room-recordings-delete-dialog");
      await dialog.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(dialog).toBeVisible();
      await dialog.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page
            .getByTestId("room-recording-item")
            .first()
            .getByTestId("room-recordings-delete-button")
            .click();
          const dialog = page.getByTestId("room-recordings-delete-dialog");
          await expect(dialog).toBeVisible();
          await dialog.getByTestId("dialog-continue-button").click();
        },
        "DELETE",
        `${RECORDINGS_PATH}${RECORDING_1}`,
        "recordings",
      );
    });

    test("redirects to the room index page if the room was not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "DELETE", `**/${RECORDINGS_PATH}${RECORDING_1}`, {
        status: 404,
        json: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      });

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-delete-button")
        .click();
      await page
        .getByTestId("room-recordings-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/rooms") &&
          !url.href.includes("rooms/abc-def-123"),
      );
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("edit recording", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    });

    test("shows the dialog with the current values", async ({ page }) => {
      const dialog = page.getByTestId("room-recordings-edit-dialog");
      await expect(dialog).toBeHidden();

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-edit-button")
        .click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.recordings.modals.edit.title");
      await expect(dialog).toContainText(
        "08/17/2022, 11:20 - 08/17/2022, 11:40",
      );

      const description = dialog.getByTestId("description-field");
      await expect(description).toContainText("rooms.recordings.description");
      await expect(description.locator("#description")).toHaveValue(
        "Recording 1",
      );

      const formats = dialog.getByTestId("available-formats-field");
      await expect(formats).toContainText("rooms.recordings.available_formats");
      for (const [index, format] of [
        "notes",
        "podcast",
        "presentation",
        "screenshare",
      ].entries()) {
        const field = formats.getByTestId(`format-${index + 1}-field`);
        await expect(field).toContainText(
          `rooms.recordings.format_types.${format}`,
        );
        await expect(field.locator(`#format-${index + 1}`)).toBeChecked();
      }

      const access = dialog.getByTestId("access-field");
      await expect(access).toContainText("rooms.recordings.access");
      for (const [index, type] of [
        "everyone",
        "participant",
        "moderator",
        "owner",
      ].entries()) {
        const field = access.getByTestId(`access-${index}-field`);
        await expect(field).toContainText(
          `rooms.recordings.access_types.${type}`,
        );
        if (index === 0) {
          await expect(field.locator(`#access-${index}`)).toBeChecked();
        } else {
          await expect(field.locator(`#access-${index}`)).not.toBeChecked();
        }
      }
    });

    test("disables the form while saving", async ({ page }) => {
      const editRequest = await mockMethod(
        page,
        "PUT",
        `**/${RECORDINGS_PATH}${RECORDING_1}`,
        { hold: true, status: 204 },
      );

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-edit-button")
        .click();

      const dialog = page.getByTestId("room-recordings-edit-dialog");
      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.cancel",
      );
      await dialog.getByTestId("dialog-save-button").click();

      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      for (const id of [
        "description",
        "format-1",
        "format-2",
        "format-3",
        "format-4",
        "access-0",
        "access-1",
        "access-2",
        "access-3",
      ]) {
        await expect(page.locator(`#${id}`)).toBeDisabled();
      }

      editRequest.release();
      await expect(dialog).toBeHidden();
    });

    test("saves the changes and updates the recording", async ({ page }) => {
      const editRequest = await mockMethod(
        page,
        "PUT",
        `**/${RECORDINGS_PATH}${RECORDING_1}`,
        { status: 204 },
      );

      const recordings = readFixture("roomRecordings.json");
      recordings.data[0].description = "Recording 1 Test";
      recordings.data[0].access = 3;
      recordings.data[0].formats[0].disabled = true;
      recordings.data[0].formats[1].disabled = true;
      recordings.data[0].formats[2].disabled = true;
      await mockMethod(page, "GET", RECORDINGS_URL, {
        status: 200,
        json: recordings,
      });

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-edit-button")
        .click();

      const dialog = page.getByTestId("room-recordings-edit-dialog");
      await dialog.locator("#description").pressSequentially(" Test");
      await dialog.locator("#format-1").click();
      await dialog.locator("#format-2").click();
      await dialog.locator("#format-3").click();
      await dialog.locator("#access-3").click();
      await dialog.getByTestId("dialog-save-button").click();

      const request = await nthRequest(editRequest);
      expect(request.postDataJSON()).toEqual({
        description: "Recording 1 Test",
        access: 3,
        formats: [
          { id: 1, disabled: true },
          { id: 2, disabled: true },
          { id: 3, disabled: true },
          { id: 4, disabled: false },
        ],
      });

      await expect(dialog).toBeHidden();

      const item = page.getByTestId("room-recording-item").first();
      await expect(item).toContainText("Recording 1 Test");
      await expect(item).toContainText("08/17/2022, 11:20");
      await expect(item).toContainText("20 app.time_formats.minutes");
      await expect(item).toContainText("rooms.recordings.access_types.owner");

      const disabledFormats = item.getByTestId("recording-format-disabled");
      await expect(disabledFormats).toHaveCount(3);
      await expect(disabledFormats.nth(0)).toContainText(
        "rooms.recordings.format_types.notes",
      );
      await expect(disabledFormats.nth(1)).toContainText(
        "rooms.recordings.format_types.podcast",
      );
      await expect(disabledFormats.nth(2)).toContainText(
        "rooms.recordings.format_types.presentation",
      );

      const enabledFormats = item.getByTestId("recording-format-enabled");
      await expect(enabledFormats).toHaveCount(1);
      await expect(enabledFormats.first()).toContainText(
        "rooms.recordings.format_types.screenshare",
      );
    });

    test("reloads the list if the recording was not found", async ({
      page,
    }) => {
      await page
        .getByTestId("room-recording-item")
        .nth(3)
        .getByTestId("room-recordings-edit-button")
        .click();

      await mockMethod(page, "PUT", `**/${RECORDINGS_PATH}${RECORDING_4}`, {
        status: 404,
        json: {
          message: "model_not_found",
          model: "recording",
          ids: [RECORDING_4],
        },
      });
      await mockRecordings(page, 0, 3);

      await page
        .getByTestId("room-recordings-edit-dialog")
        .getByTestId("dialog-save-button")
        .click();

      await expectToastAndClose(page, "rooms.flash.recording_gone");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(3);
      await expect(
        page.getByTestId("room-recordings-edit-dialog"),
      ).toBeHidden();
    });

    test("shows validation errors and hides them after another error", async ({
      page,
    }) => {
      await page
        .getByTestId("room-recording-item")
        .nth(1)
        .getByTestId("room-recordings-edit-button")
        .click();

      await mockMethod(page, "PUT", `**/${RECORDINGS_PATH}${RECORDING_2}`, {
        status: 422,
        json: {
          message: "Validation failed",
          errors: {
            description: ["The description field is required."],
            access: ["The access field is required."],
            formats: ["The formats field is required."],
          },
        },
      });

      const dialog = page.getByTestId("room-recordings-edit-dialog");
      await dialog.getByTestId("dialog-save-button").click();

      await expect(dialog.getByTestId("description-field")).toContainText(
        "The description field is required.",
      );
      await expect(dialog.getByTestId("available-formats-field")).toContainText(
        "The formats field is required.",
      );
      await expect(dialog.getByTestId("access-field")).toContainText(
        "The access field is required.",
      );

      // A following server error hides the validation errors, the dialog stays open
      await mockMethod(page, "PUT", `**/${RECORDINGS_PATH}${RECORDING_2}`, {
        status: 500,
        json: { message: "Test" },
      });
      await dialog.getByTestId("dialog-save-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId("description-field")).not.toContainText(
        "The description field is required.",
      );
      await expect(
        dialog.getByTestId("available-formats-field"),
      ).not.toContainText("The formats field is required.");
      await expect(dialog.getByTestId("access-field")).not.toContainText(
        "The access field is required.",
      );

      await dialog.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page
            .getByTestId("room-recording-item")
            .first()
            .getByTestId("room-recordings-edit-button")
            .click();
          const dialog = page.getByTestId("room-recordings-edit-dialog");
          await expect(dialog).toBeVisible();
          await dialog.getByTestId("dialog-save-button").click();
        },
        "PUT",
        `${RECORDINGS_PATH}${RECORDING_1}`,
        "recordings",
      );
    });

    test("redirects to the room index page if the room was not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "PUT", `**/${RECORDINGS_PATH}${RECORDING_1}`, {
        status: 404,
        json: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      });

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-edit-button")
        .click();
      await page
        .getByTestId("room-recordings-edit-dialog")
        .getByTestId("dialog-save-button")
        .click();

      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/rooms") &&
          !url.href.includes("rooms/abc-def-123"),
      );
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });
});
