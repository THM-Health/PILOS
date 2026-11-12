import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomFilesRequest } from "../support/mocks.js";
import { setValidRememberedParticipantName } from "../support/room.js";
import { mockMethod, nthRequest, queryOf } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123*";
const AUTH_URL = "**/api/v1/rooms/abc-def-123/auth*";
const NAME_CHECK_URL = "**/api/v1/participantName/check";

const INVALID_NAME = '<script>alert("HI");</script>';
const INVALID_NAME_ERROR =
  'Name contains the following non-permitted characters: <>";';
const INVALID_NAME_RESPONSE = { errors: { name: [INVALID_NAME_ERROR] } };
const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];
const PERSONALIZED_LINK_TOKEN =
  "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR";

const GUEST_ROOM = { allow_membership: true, current_user: null };
const GUEST_NEEDS_CODE = { ...GUEST_ROOM, authenticated: false };

function mockRoom(page, overrides = {}) {
  const room = JSON.parse(
    readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
  );
  Object.assign(room.data, overrides);
  return mockMethod(page, "GET", ROOM_URL, { status: 200, json: room });
}

function mockNameCheck(page, options = {}) {
  return mockMethod(page, "POST", NAME_CHECK_URL, { status: 204, ...options });
}

function mockNameCheckError(page, status, json) {
  return mockMethod(page, "POST", NAME_CHECK_URL, { status, json });
}

/**
 * Check the remembered guest name in the localStorage (null if there is none)
 */
async function expectGuestNameStorage(page, value) {
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
    )
    .toBe(value);
}

/**
 * Check the room header and the participant name of a guest in the room view
 */
async function expectGuestRoomView(page, name) {
  await expect(page.getByTestId("room-access-overlay")).toBeHidden();
  await expect(page.getByText("Meeting One")).toBeVisible();
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(
    page.getByText("rooms.index.room_component.never_started"),
  ).toBeVisible();
  await expect(page.getByText("rooms.name_in_video_conference")).toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
  await expect(
    page.getByTestId("change-participant-name-button"),
  ).toBeVisible();
}

/**
 * Check the participant name field inside the given scope
 */
async function expectParticipantNameField(scope, name, remember) {
  const field = scope.getByTestId("participant-name-field");
  await expect(field).toBeVisible();
  await expect(field.getByText("rooms.first_and_lastname")).toBeVisible();
  await expect(field.locator("#participant-name")).toBeVisible();
  await expect(field.locator("#participant-name")).toHaveValue(name);
  await expect(
    field.getByText("rooms.remember_participant_name"),
  ).toBeVisible();
  if (remember) {
    await expect(field.locator("#remember-participant-name")).toBeChecked();
  } else {
    await expect(field.locator("#remember-participant-name")).not.toBeChecked();
  }
}

test.describe("Rooms View access participant name", () => {
  test.beforeEach(async ({ page }) => {
    await interceptRoomFilesRequest(page);
  });

  test.describe("participant name errors (guest)", () => {
    test("shows participant name field without access code field", async ({
      page,
    }) => {
      await mockRoom(page, GUEST_ROOM);
      await page.goto(ROOM_PATH);

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expectParticipantNameField(page, "", false);
      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
      await expect(page.getByTestId("access-code-field")).toHaveCount(0);
    });

    test("shows validation error of the participant name", async ({ page }) => {
      await mockRoom(page, GUEST_ROOM);
      const check = await mockNameCheckError(page, 422, INVALID_NAME_RESPONSE);
      await page.goto(ROOM_PATH);

      await page.locator("#participant-name").fill(INVALID_NAME);
      await page.getByTestId("room-login-button").click();

      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: INVALID_NAME });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(INVALID_NAME_ERROR),
      ).toBeVisible();
    });

    test("shows error toast if the participant name check fails", async ({
      page,
    }) => {
      await mockRoom(page, GUEST_ROOM);
      const check = await mockNameCheckError(page, 500, { message: "Test" });
      await page.goto(ROOM_PATH);

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();

      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: "Laura Rivera" });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("shows participant name and access code field if the room requires an access code", async ({
      page,
    }) => {
      await mockRoom(page, GUEST_NEEDS_CODE);
      await page.goto(ROOM_PATH);

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expectParticipantNameField(page, "", false);
      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
      await expect(page.getByTestId("access-code-field")).toBeVisible();
    });

    test("does not send the access code and shows only the name error if the room requires an access code", async ({
      page,
    }) => {
      await mockRoom(page, GUEST_NEEDS_CODE);
      const check = await mockNameCheckError(page, 422, INVALID_NAME_RESPONSE);
      const auth = await mockMethod(page, "POST", AUTH_URL, {
        status: 422,
        json: {
          message: "The Access code field is required.",
          errors: { access_code: ["The Access code field is required."] },
        },
      });
      await page.goto(ROOM_PATH);
      await expect(page.getByTestId("access-code-field")).toBeVisible();

      await page.locator("#participant-name").fill(INVALID_NAME);
      await page.getByTestId("room-login-button").click();

      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: INVALID_NAME });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(INVALID_NAME_ERROR),
      ).toBeVisible();

      // room auth request was not sent and the access code error is not shown
      expect(auth.requests).toHaveLength(0);
      await expect(
        page
          .getByTestId("access-code-field")
          .getByText("The Access code field is required."),
      ).toHaveCount(0);
    });
  });

  test.describe("remembered participant name (guest)", () => {
    test("shows error and clears an invalid remembered participant name", async ({
      page,
    }) => {
      await page.addInitScript((name) => {
        window.localStorage.setItem("pilos_guest_name", name);
      }, INVALID_NAME);
      await mockRoom(page, GUEST_NEEDS_CODE);
      const check = await mockNameCheckError(page, 422, INVALID_NAME_RESPONSE);
      await page.goto(ROOM_PATH);

      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: INVALID_NAME });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      const field = page.getByTestId("participant-name-field");
      await expect(field.locator("#participant-name")).toHaveValue(
        INVALID_NAME,
      );
      await expect(field.getByText(INVALID_NAME_ERROR)).toBeVisible();

      await expectGuestNameStorage(page, null);
    });

    test("does not use an access code from the url if the remembered participant name is invalid", async ({
      page,
    }) => {
      // Seed the name only for the first load, the hash change reloads the page
      await page.addInitScript((name) => {
        if (!window.sessionStorage.getItem("seeded")) {
          window.sessionStorage.setItem("seeded", "1");
          window.localStorage.setItem("pilos_guest_name", name);
        }
      }, INVALID_NAME);
      const room = await mockRoom(page, GUEST_NEEDS_CODE);
      await mockNameCheckError(page, 422, INVALID_NAME_RESPONSE);
      const auth = await mockMethod(page, "POST", AUTH_URL, {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });
      await page.goto(ROOM_PATH);
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(INVALID_NAME_ERROR),
      ).toBeVisible();
      await expectGuestNameStorage(page, null);
      const roomRequestsBefore = room.requests.length;

      // Reinitialize with an access code
      await page.evaluate(() => {
        window.location.hash = "accessCode=123456789";
      });

      await nthRequest(room, roomRequestsBefore + 1);
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#participant-name")).toHaveValue("");
      await expect(page.locator("#access-code")).toHaveValue("123-456-789");
      expect(auth.requests).toHaveLength(0);
    });

    test("keeps a valid remembered participant name if the check fails with a server error", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      });
      await mockRoom(page, GUEST_NEEDS_CODE);
      const check = await mockNameCheckError(page, 500, { message: "Test" });
      await page.goto(ROOM_PATH);

      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: "Laura Rivera" });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expectGuestNameStorage(page, "Laura Rivera");
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("logs in with the remembered participant name and the access code from the url", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      });
      // The room is authenticated as soon as the request carries the room auth token
      const roomRequests = [];
      await page.route(ROOM_URL, (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }
        roomRequests.push(route.request());
        const roomData = JSON.parse(
          readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
        );
        Object.assign(roomData.data, GUEST_ROOM, {
          authenticated: "room_auth_token" in queryOf(route.request()),
        });
        return route.fulfill({ status: 200, json: roomData });
      });
      const check = await mockNameCheck(page);
      const auth = await mockMethod(page, "POST", AUTH_URL, {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });

      await page.goto(ROOM_PATH + "#accessCode=123456789");

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });
      expect((await nthRequest(auth)).postDataJSON()).toEqual({
        access_code: "123456789",
        type: 0,
      });

      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      const authenticatedRequest = roomRequests.find(
        (request) => "room_auth_token" in queryOf(request),
      );
      expect(queryOf(authenticatedRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    test.describe("after logout", () => {
      test.use({ authenticated: true });

      test("asks for the access code and restores the remembered participant name", async ({
        page,
      }) => {
        await page.addInitScript(() => {
          window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
        });
        await mockRoom(page);
        await page.goto(ROOM_PATH);
        await expect(page.getByTestId("reload-room-button")).toBeVisible();

        const check = await mockNameCheck(page, { hold: true });
        const room = await mockRoom(page, GUEST_NEEDS_CODE);

        await page.getByTestId("reload-room-button").click();
        await nthRequest(room);

        await expectToastAndClose(page, "rooms.require_access_code");

        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        const name = page.locator("#participant-name");
        await expect(name).toHaveValue("");
        await expect(name).toBeDisabled();

        check.release();

        expect((await nthRequest(check)).postDataJSON()).toEqual({
          name: "Laura Rivera",
        });
        await expect(name).toHaveValue("Laura Rivera");
        await expect(name).toBeEnabled();
        await expect(page.locator("#remember-participant-name")).toBeChecked();
        await expect(page.getByTestId("access-code-field")).toBeVisible();
      });
    });
  });

  test.describe("change participant name (guest)", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoom(page, GUEST_ROOM);
      await page.goto(ROOM_PATH);

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();

      await page.locator("#participant-name").fill("Laura Rivera");
    });

    test("shows loading state while the participant name is checked", async ({
      page,
    }) => {
      const check = await mockNameCheck(page, { hold: true });

      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
      await page.getByTestId("room-login-button").click();

      const overlay = page.getByTestId("room-access-overlay");
      await expect(overlay).toBeVisible();
      await expect(overlay.getByTestId("room-login-button")).toBeDisabled();

      check.release();
      await nthRequest(check);

      await expect(overlay).toBeHidden();
    });

    test.describe("after login", () => {
      let check;

      test.beforeEach(async ({ page }) => {
        check = await mockNameCheck(page);
        await page.getByTestId("room-login-button").click();
        await nthRequest(check);
        await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      });

      test("shows the room with the participant name without remembering it", async ({
        page,
      }) => {
        await expectGuestRoomView(page, "Laura Rivera");
        await expectGuestNameStorage(page, null);
        await expect(
          page.getByTestId("room-change-participant-name-dialog"),
        ).toHaveCount(0);
      });

      test("opens the change participant name dialog", async ({ page }) => {
        await expect(
          page.getByTestId("change-participant-name-button"),
        ).toHaveText("rooms.change_participant_name");
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("rooms.change_participant_name");
        await expectParticipantNameField(dialog, "Laura Rivera", false);
        await expect(dialog.getByTestId("dialog-cancel-button")).toBeVisible();
        await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
          "app.cancel",
        );
        await expect(dialog.getByTestId("dialog-save-button")).toBeVisible();
        await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
          "app.save",
        );
      });

      test("keeps the participant name if the dialog is cancelled", async ({
        page,
      }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await dialog.locator("#participant-name").fill("Max Doe");
        await dialog.getByTestId("dialog-cancel-button").click();

        await expect(dialog).toBeHidden();
        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toBeVisible();
        await expectGuestNameStorage(page, null);

        // The changed value is discarded
        await page.getByTestId("change-participant-name-button").click();
        await expect(dialog.locator("#participant-name")).toHaveValue(
          "Laura Rivera",
        );
      });

      test("changes the participant name", async ({ page }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await dialog.locator("#participant-name").fill("Max Doe");
        await dialog.getByTestId("dialog-save-button").click();

        expect((await nthRequest(check, 2)).postDataJSON()).toEqual({
          name: "Max Doe",
        });
        await expect(dialog).toBeHidden();

        await expectGuestNameStorage(page, null);
        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Max Doe")).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toHaveCount(0);

        // The dialog is prefilled with the current name
        await page.getByTestId("change-participant-name-button").click();
        await expectParticipantNameField(dialog, "Max Doe", false);
      });

      test("remembers the participant name", async ({ page }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await expectParticipantNameField(dialog, "Laura Rivera", false);
        await dialog.locator("#remember-participant-name").check();
        await dialog.getByTestId("dialog-save-button").click();

        await nthRequest(check, 2);
        await expect(dialog).toBeHidden();

        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toBeVisible();
        await expectGuestNameStorage(page, "Laura Rivera");

        // The dialog shows the remembered state
        await page.getByTestId("change-participant-name-button").click();
        await expectParticipantNameField(dialog, "Laura Rivera", true);
      });

      test("forgets the remembered participant name", async ({ page }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await dialog.locator("#remember-participant-name").check();
        await dialog.getByTestId("dialog-save-button").click();
        await nthRequest(check, 2);
        await expect(dialog).toBeHidden();
        await expectGuestNameStorage(page, "Laura Rivera");

        await page.getByTestId("change-participant-name-button").click();
        await expectParticipantNameField(dialog, "Laura Rivera", true);
        await dialog.locator("#remember-participant-name").uncheck();
        await dialog.getByTestId("dialog-save-button").click();

        await nthRequest(check, 3);
        await expect(dialog).toBeHidden();

        await expectGuestNameStorage(page, null);
        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toBeVisible();

        await page.getByTestId("change-participant-name-button").click();
        await expectParticipantNameField(dialog, "Laura Rivera", false);
      });
    });
  });

  test.describe("remembered participant name is used to join (guest)", () => {
    test.beforeEach(async ({ page }) => {
      await setValidRememberedParticipantName(page, "Laura Rivera");
      await mockRoom(page, GUEST_ROOM);
      await page.goto(ROOM_PATH);
      await expectGuestRoomView(page, "Laura Rivera");
    });

    test("shows the room with the remembered participant name", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("room-change-participant-name-dialog"),
      ).toHaveCount(0);
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog).toBeVisible();
      await expectParticipantNameField(dialog, "Laura Rivera", true);
    });

    test("changes the remembered participant name", async ({ page }) => {
      const check = await mockNameCheck(page);
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expectParticipantNameField(dialog, "Laura Rivera", true);
      await dialog.locator("#participant-name").fill("Max Doe");
      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: "Max Doe",
      });
      await expect(dialog).toBeHidden();

      await expectGuestNameStorage(page, "Max Doe");
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toHaveCount(0);

      // The dialog is prefilled with the current name
      await page.getByTestId("change-participant-name-button").click();
      await expectParticipantNameField(dialog, "Max Doe", true);
    });

    test("forgets the remembered participant name", async ({ page }) => {
      const check = await mockNameCheck(page);
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expectParticipantNameField(dialog, "Laura Rivera", true);
      await dialog.locator("#remember-participant-name").uncheck();
      await dialog.getByTestId("dialog-save-button").click();

      await nthRequest(check);
      await expect(dialog).toBeHidden();

      await expectGuestNameStorage(page, null);
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      await page.getByTestId("change-participant-name-button").click();
      await expectParticipantNameField(dialog, "Laura Rivera", false);
    });

    test("shows validation error and keeps the participant name if the change is invalid", async ({
      page,
    }) => {
      const check = await mockNameCheckError(page, 422, INVALID_NAME_RESPONSE);
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expectParticipantNameField(dialog, "Laura Rivera", true);
      await dialog.locator("#participant-name").fill(INVALID_NAME);
      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: INVALID_NAME,
      });

      // The dialog stays open and shows the error
      await expect(dialog).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText(INVALID_NAME_ERROR),
      ).toBeVisible();

      await dialog.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();
      await expectGuestNameStorage(page, "Laura Rivera");

      // The dialog shows the current participant name again
      await page.getByTestId("change-participant-name-button").click();
      await expect(dialog.locator("#participant-name")).toHaveValue(
        "Laura Rivera",
      );
      await expect(dialog.locator("#remember-participant-name")).toBeChecked();
    });

    test("shows error toast and keeps the dialog open if the check fails", async ({
      page,
    }) => {
      const check = await mockNameCheckError(page, 500, { message: "Test" });
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });

      await expect(dialog).toBeVisible();
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });
  });

  test.describe("personalized link", () => {
    let room;
    let auth;

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      });
      room = await mockRoom(page, {
        username: "Max Doe",
        allow_membership: true,
        is_member: true,
        current_user: null,
      });
      auth = await mockMethod(page, "POST", AUTH_URL, {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });
    });

    /**
     * Visit the room with the personalized link and check the requests of the login
     */
    async function visitWithPersonalizedLink(page, check) {
      await page.goto(
        `${ROOM_PATH}#personalizedLink=${PERSONALIZED_LINK_TOKEN}`,
      );

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });
      expect((await nthRequest(auth)).postDataJSON()).toEqual({
        personalized_link_token: PERSONALIZED_LINK_TOKEN,
        type: 1,
      });

      // The room is requested with the room auth token
      await expect
        .poll(() =>
          room.requests.some(
            (request) => queryOf(request).room_auth_token === "roomAuthToken",
          ),
        )
        .toBe(true);
      const request = room.requests.find(
        (request) => queryOf(request).room_auth_token === "roomAuthToken",
      );
      expect(queryOf(request)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(PERSONALIZED_LINK_TOKEN);

      // The personalized link is removed from the url
      await expect(page).toHaveURL(
        (url) => !url.hash.includes("personalizedLink"),
      );

      // The participant name of the personalized link is shown and can not be changed
      await expect(page.getByText("Meeting One")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(
        page.getByTestId("change-participant-name-button"),
      ).toHaveCount(0);
    }

    test("ignores an invalid remembered participant name and clears it", async ({
      page,
    }) => {
      const check = await mockNameCheckError(page, 422, INVALID_NAME_RESPONSE);

      await visitWithPersonalizedLink(page, check);

      await expectGuestNameStorage(page, null);
    });

    test("keeps the remembered participant name and shows an error toast if the check fails", async ({
      page,
    }) => {
      const check = await mockNameCheckError(page, 500, { message: "Test" });

      await visitWithPersonalizedLink(page, check);

      await expectGuestNameStorage(page, "Laura Rivera");
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });
  });
});
