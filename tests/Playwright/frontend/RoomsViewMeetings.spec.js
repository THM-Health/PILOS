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
import { mockMethod } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const PERSONALIZED_LINK =
  "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR";
const REDIRECT_ORIGIN = "https://thm-health.github.io";
const REDIRECT_URL = `${REDIRECT_ORIGIN}/PILOS-Redirect_Test_Pages/bigbluebutton?foo=a&bar=b`;

const RUNNING_MEETING = {
  start: "2023-08-21T08:18:28.000000Z",
  end: null,
};
const FINISHED_MEETING = {
  start: "2023-08-21T08:18:28.000000Z",
  end: "2023-08-21T08:18:20.000000Z",
};

const NO_FEATURES = {
  recording: false,
  attendance_recording: false,
  streaming: false,
};

const DEFAULT_BODY = {
  name: null,
  consent_record_attendance: false,
  consent_record: false,
  consent_record_video: false,
  consent_streaming: false,
  dark_mode: false,
};

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
  return mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
    status: 200,
    json: room,
  });
}

function mockFeatures(page, action, features = {}) {
  return mockMethod(page, "OPTIONS", `**/api/v1/rooms/abc-def-123/${action}*`, {
    status: 200,
    json: { data: { features: { ...NO_FEATURES, ...features } } },
  });
}

function mockFeaturesError(page, action, status, message) {
  return mockMethod(page, "OPTIONS", `**/api/v1/rooms/abc-def-123/${action}*`, {
    status,
    json: { message },
  });
}

function mockAction(page, action, status, json, options = {}) {
  return mockMethod(page, "POST", `**/api/v1/rooms/abc-def-123/${action}*`, {
    status,
    json,
    ...options,
  });
}

function mockActionRedirect(page, action, options = {}) {
  return mockAction(page, action, 200, { url: REDIRECT_URL }, options);
}

function mockAuth(page, type) {
  return mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth*", {
    status: 201,
    json: { data: { id: "roomAuthToken", type } },
  });
}

function mockAuthError(page, message) {
  return mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth*", {
    status: 401,
    json: { message },
  });
}

async function firstRequest(mock) {
  await expect.poll(() => mock.requests.length).toBeGreaterThan(0);
  return mock.requests[0];
}

async function expectRedirect(page) {
  await expect(page).toHaveURL(REDIRECT_URL);
}

async function expectPersonalizedLinkCleared(page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ),
    )
    .toBeNull();
}

const ACTIONS = [
  {
    action: "join",
    buttonId: "room-join-button",
    label: "rooms.join",
    room: { last_meeting: RUNNING_MEETING },
    loadRoom: { last_meeting: RUNNING_MEETING },
  },
  {
    action: "start",
    buttonId: "room-start-button",
    label: "rooms.start",
    room: {},
    loadRoom: { last_meeting: FINISHED_MEETING },
  },
];

test.describe("Rooms view meetings", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    // the redirect to the conference server must not leave the test
    await page.route(`${REDIRECT_ORIGIN}/**`, (route) =>
      route.fulfill({ contentType: "text/html", body: "<html></html>" }),
    );
    await interceptRoomFilesRequest(page);
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  for (const { action, buttonId, label, room, loadRoom } of ACTIONS) {
    test.describe(`${action} meeting`, () => {
      let dialog;
      let button;

      const acceptAll = async () => {
        for (const id of [
          "record-attendance-agreement",
          "record-agreement",
          "record-video-agreement",
        ]) {
          const checkbox = dialog.locator(`#${id}`);
          await expect(checkbox).not.toBeChecked();
          await checkbox.click();
        }
      };

      test.beforeEach(async ({ page }) => {
        dialog = page.getByTestId("room-join-dialog");
        button = page.getByTestId(buttonId);
        await mockRoom(page, room);
      });

      test(`${action} with loading state`, async ({ page }) => {
        const features = await mockFeatures(page, action);
        const request = await mockActionRedirect(page, action, { hold: true });

        await page.goto(ROOM_PATH);

        await expect(dialog).toBeHidden();
        await expect(button).toBeEnabled();
        await expect(button).toHaveText(label);
        await button.click();

        await expect(dialog).toBeVisible();
        await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
        await expect(
          dialog.getByTestId("dialog-continue-button"),
        ).toBeDisabled();
        await expect(button).toBeDisabled();

        await firstRequest(features);
        request.release();

        expect((await firstRequest(request)).postDataJSON()).toEqual(
          DEFAULT_BODY,
        );
        await expectRedirect(page);
      });

      test(`${action} with attendance logging`, async ({ page }) => {
        await mockFeatures(page, action, { attendance_recording: true });
        const request = await mockActionRedirect(page, action, { hold: true });

        await page.goto(ROOM_PATH);

        await expect(dialog).toBeHidden();
        await expect(button).toBeEnabled();
        await expect(button).toHaveText(label);
        await button.click();

        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText("rooms.recording_attendance_info"),
        ).toBeVisible();
        await expect(
          dialog.getByText("rooms.recording_attendance_accept"),
        ).toBeVisible();
        const checkbox = dialog.locator("#record-attendance-agreement");
        await expect(checkbox).not.toBeChecked();
        await checkbox.click();
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
        await expect(
          dialog.getByTestId("dialog-continue-button"),
        ).toBeDisabled();
        request.release();

        expect((await firstRequest(request)).postDataJSON()).toEqual({
          ...DEFAULT_BODY,
          consent_record_attendance: true,
        });
        await expectRedirect(page);
      });

      test(`${action} with streaming`, async ({ page }) => {
        await mockFeatures(page, action, { streaming: true });
        const request = await mockActionRedirect(page, action, { hold: true });

        await page.goto(ROOM_PATH);

        await expect(dialog).toBeHidden();
        await expect(button).toBeEnabled();
        await expect(button).toHaveText(label);
        await button.click();

        await expect(dialog).toBeVisible();
        await expect(dialog.getByText("rooms.streaming_info")).toBeVisible();
        await expect(dialog.getByText("rooms.streaming_accept")).toBeVisible();
        const checkbox = dialog.locator("#streaming-agreement");
        await expect(checkbox).not.toBeChecked();
        await checkbox.click();
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
        await expect(
          dialog.getByTestId("dialog-continue-button"),
        ).toBeDisabled();
        request.release();

        expect((await firstRequest(request)).postDataJSON()).toEqual({
          ...DEFAULT_BODY,
          consent_streaming: true,
        });
        await expectRedirect(page);
      });

      test(`${action} with recording`, async ({ page }) => {
        await mockFeatures(page, action, { recording: true });
        const request = await mockActionRedirect(page, action, { hold: true });

        await page.goto(ROOM_PATH);

        await expect(dialog).toBeHidden();
        await expect(button).toBeEnabled();
        await expect(button).toHaveText(label);
        await button.click();

        await expect(dialog).toBeVisible();
        await expect(dialog.getByText("rooms.recording_info")).toBeVisible();
        await expect(dialog.getByText("rooms.recording_accept")).toBeVisible();
        await expect(
          dialog.getByText("rooms.recording_video_accept"),
        ).toBeVisible();

        for (const id of ["record-agreement", "record-video-agreement"]) {
          const checkbox = dialog.locator(`#${id}`);
          await expect(checkbox).not.toBeChecked();
          await checkbox.click();
        }
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
        await expect(
          dialog.getByTestId("dialog-continue-button"),
        ).toBeDisabled();
        request.release();

        expect((await firstRequest(request)).postDataJSON()).toEqual({
          ...DEFAULT_BODY,
          consent_record: true,
          consent_record_video: true,
        });
        await expectRedirect(page);
      });

      test(`${action} with recording without video`, async ({ page }) => {
        await mockRoom(page, { ...room, record: true });
        await mockFeatures(page, action, { recording: true });
        const request = await mockActionRedirect(page, action);

        await page.goto(ROOM_PATH);
        await button.click();

        const checkbox = dialog.locator("#record-agreement");
        await expect(checkbox).not.toBeChecked();
        await checkbox.click();
        await dialog.getByTestId("dialog-continue-button").click();

        expect((await firstRequest(request)).postDataJSON()).toEqual({
          ...DEFAULT_BODY,
          consent_record: true,
        });
        await expectRedirect(page);
      });

      test(`${action} with access code`, async ({ page }) => {
        await mockAuth(page, 0);
        const roomMock = await mockRoom(page, {
          ...room,
          owner: { id: 2, name: "Max Doe" },
        });
        const features = await mockFeatures(page, action, {
          recording: true,
          attendance_recording: true,
        });

        await page.goto(`${ROOM_PATH}#accessCode=123456789`);
        await firstRequest(roomMock);

        await button.click();

        // Check that the access code is sent
        expectAuthToken(await firstRequest(features), "0");

        await expect(dialog).toBeVisible();
        await acceptAll();

        const request = await mockActionRedirect(page, action);
        await dialog.getByTestId("dialog-continue-button").click();

        const sent = await firstRequest(request);
        expect(sent.postDataJSON()).toEqual({
          ...DEFAULT_BODY,
          consent_record_attendance: true,
          consent_record: true,
          consent_record_video: true,
        });
        expectAuthToken(sent, "0");
        await expectRedirect(page);
      });

      test(`${action} with invalid access code`, async ({ page }) => {
        await mockAuth(page, 0);
        const roomMock = await mockRoom(page, {
          ...room,
          owner: { id: 2, name: "Max Doe" },
        });
        await mockFeatures(page, action);

        await page.goto(`${ROOM_PATH}#accessCode=123456789`);
        await firstRequest(roomMock);
        await expect(button).toBeVisible();

        // The request is rejected and the room is reloaded (not authenticated anymore)
        const request = await mockAction(page, action, 401, {
          message: "invalid_auth_token",
        });
        const reloadedRoom = await mockRoom(page, {
          ...room,
          owner: { id: 2, name: "Max Doe" },
          authenticated: false,
        });

        await button.click();

        // Check that the access code is sent and reset afterwards
        expectAuthToken(await firstRequest(request), "0");
        expectNoAuthToken(await firstRequest(reloadedRoom));

        await expectToastAndClose(page, "rooms.flash.access_code_invalid");
        await expect(
          page.getByText("rooms.flash.access_code_invalid"),
        ).toBeVisible();

        // Reload the room (but without room auth token)
        const reloadedAgain = await mockRoom(page, {
          ...room,
          owner: { id: 2, name: "Max Doe" },
        });
        await page.getByTestId("reload-room-button").click();

        expectNoAuthToken(await firstRequest(reloadedAgain));
        await expect(button).toBeVisible();
      });

      test(`${action} with access code required`, async ({ page }) => {
        const roomMock = await mockRoom(page, {
          ...room,
          owner: { id: 2, name: "Max Doe" },
        });
        await mockFeatures(page, action);

        await page.goto(ROOM_PATH);
        await firstRequest(roomMock);
        await expect(button).toBeVisible();

        const request = await mockAction(page, action, 403, {
          message: "require_code",
        });
        const reloadedRoom = await mockRoom(page, {
          ...room,
          owner: { id: 2, name: "Max Doe" },
          authenticated: false,
        });

        await button.click();

        expectNoAuthToken(await firstRequest(request));
        expectNoAuthToken(await firstRequest(reloadedRoom));

        await expectToastAndClose(page, "rooms.require_access_code");

        await expect(page.locator("#access-code")).toHaveValue("");
        await expect(
          page.getByText("rooms.flash.access_code_invalid"),
        ).toHaveCount(0);
      });

      test.describe("dark mode", () => {
        test.use({ colorScheme: "dark" });

        test(`${action} with dark mode`, async ({ page }) => {
          await mockFeatures(page, action);
          const request = await mockActionRedirect(page, action);

          await page.goto(ROOM_PATH);
          await button.click();

          expect((await firstRequest(request)).postDataJSON()).toEqual({
            ...DEFAULT_BODY,
            dark_mode: true,
          });
          await expectRedirect(page);
        });
      });

      test(`${action} with validation errors for missing agreements`, async ({
        page,
      }) => {
        // The room settings changed in the meantime, therefore the agreements are missing
        await mockFeatures(page, action);
        const request = await mockAction(
          page,
          action,
          422,
          {
            message:
              "The consent record attendance must be accepted. (and 1 more error)",
            errors: {
              consent_record_attendance: [
                "The consent record attendance must be accepted.",
              ],
              consent_record: ["The consent record must be accepted."],
            },
          },
          { hold: true },
        );

        await page.goto(ROOM_PATH);
        await expect(dialog).toBeHidden();
        await button.click();

        await expect(dialog).toBeVisible();
        // Make sure that checkboxes for agreements are not shown
        await expect(dialog.getByText("rooms.recording_info")).toHaveCount(0);
        await expect(dialog.getByText("rooms.recording_accept")).toHaveCount(0);
        await expect(
          dialog.getByText("rooms.recording_video_accept"),
        ).toHaveCount(0);
        await expect(dialog.locator("#record-agreement")).toHaveCount(0);
        await expect(dialog.locator("#record-video-agreement")).toHaveCount(0);
        await expect(
          dialog.getByTestId("dialog-continue-button"),
        ).toBeDisabled();

        await mockFeatures(page, action, {
          recording: true,
          attendance_recording: true,
        });
        request.release();
        await firstRequest(request);

        // Check that checkboxes for agreements are shown
        await expect(dialog.getByText("rooms.recording_info")).toBeVisible();
        await expect(dialog.getByText("rooms.recording_accept")).toBeVisible();
        await expect(
          dialog.getByText("rooms.recording_video_accept"),
        ).toBeVisible();
        await expect(dialog.locator("#record-agreement")).not.toBeChecked();
        await expect(
          dialog.locator("#record-video-agreement"),
        ).not.toBeChecked();
        await expect(
          dialog.getByTestId("dialog-continue-button"),
        ).toBeEnabled();

        // Check if error messages are shown
        await expect(
          dialog.getByText("The consent record attendance must be accepted."),
        ).toBeVisible();
        await expect(
          dialog.getByText("The consent record must be accepted."),
        ).toBeVisible();

        // Close dialog
        await dialog.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toBeHidden();

        // Check that the error messages are reset when opening the dialog again
        await button.click();
        await expect(dialog).toBeVisible();
        await expect(dialog.locator("#record-agreement")).toBeVisible();
        await expect(
          dialog.getByText("The consent record attendance must be accepted."),
        ).toHaveCount(0);
        await expect(
          dialog.getByText("The consent record must be accepted."),
        ).toHaveCount(0);
      });

      test(`${action} with required agreements and validation error`, async ({
        page,
      }) => {
        await mockFeatures(page, action, { recording: true });
        const request = await mockAction(page, action, 422, {
          message: "The consent record attendance must be accepted.",
          errors: {
            consent_record_attendance: [
              "The consent record attendance must be accepted.",
            ],
          },
        });

        await page.goto(ROOM_PATH);
        await button.click();

        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText("The consent record attendance must be accepted."),
        ).toHaveCount(0);

        // Check if checkboxes are required
        const recordAgreement = dialog.locator("#record-agreement");
        await expect(recordAgreement).not.toBeChecked();
        await expect(recordAgreement).toHaveJSProperty("required", true);
        await recordAgreement.click();
        await expect(
          dialog.locator("#record-video-agreement"),
        ).not.toBeChecked();

        // Attendance agreement is not shown
        await expect(
          dialog.locator("#record-attendance-agreement"),
        ).toHaveCount(0);

        // The settings changed and the attendance agreement is required now
        await mockFeatures(page, action, {
          recording: true,
          attendance_recording: true,
        });
        await dialog.getByTestId("dialog-continue-button").click();
        await firstRequest(request);

        await expect(
          dialog.getByText("The consent record attendance must be accepted."),
        ).toBeVisible();

        // Agree to consent record attendance
        const attendanceAgreement = dialog.locator(
          "#record-attendance-agreement",
        );
        await expect(attendanceAgreement).not.toBeChecked();
        await expect(attendanceAgreement).toHaveJSProperty("required", true);
        await attendanceAgreement.click();
        await expect(attendanceAgreement).toBeChecked();
      });

      test(`${action} with server error hides validation errors`, async ({
        page,
      }) => {
        await mockFeatures(page, action, {
          recording: true,
          attendance_recording: true,
        });
        const validationRequest = await mockAction(page, action, 422, {
          message: "The consent record attendance must be accepted.",
          errors: {
            consent_record_attendance: [
              "The consent record attendance must be accepted.",
            ],
          },
        });

        await page.goto(ROOM_PATH);
        await button.click();
        await expect(dialog).toBeVisible();
        await acceptAll();
        await dialog.getByTestId("dialog-continue-button").click();
        await firstRequest(validationRequest);
        await expect(
          dialog.getByText("The consent record attendance must be accepted."),
        ).toBeVisible();

        const request = await mockAction(page, action, 500, {
          message: "Test",
        });
        await dialog.getByTestId("dialog-continue-button").click();
        await firstRequest(request);

        // Check that room join dialog stays open and 422 error messages are hidden
        await expectToastAndClose(page, SERVER_ERROR_TOAST);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText(
          "The consent record attendance must be accepted.",
        );
        await expect(dialog).not.toContainText(
          "The consent record must be accepted.",
        );
      });

      test(`${action} with room not found`, async ({ page }) => {
        await mockFeatures(page, action, {
          recording: true,
          attendance_recording: true,
        });
        const request = await mockAction(
          page,
          action,
          404,
          MODEL_NOT_FOUND_BODY,
        );
        await interceptRoomIndexRequests(page);

        await page.goto(ROOM_PATH);
        await button.click();
        await expect(dialog).toBeVisible();
        await acceptAll();
        await dialog.getByTestId("dialog-continue-button").click();
        await firstRequest(request);

        // Check that redirect to room index page worked and error message is shown
        await expect(page).toHaveURL(
          (url) =>
            url.pathname.includes("/rooms") &&
            !url.pathname.includes("/rooms/abc-def-123"),
        );
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });

      test.describe("guests", () => {
        test.use({ authenticated: false });

        test.beforeEach(async ({ page }) => {
          await mockRoom(page, { ...room, current_user: null });
        });

        test(`${action} as guest`, async ({ page }) => {
          const features = await mockFeatures(page, action, {
            recording: true,
            attendance_recording: true,
          });
          const request = await mockActionRedirect(page, action);

          await page.goto(ROOM_PATH);
          await button.click();
          await firstRequest(features);

          await expect(dialog).toBeVisible();
          await acceptAll();
          await dialog.getByTestId("dialog-continue-button").click();

          expect((await firstRequest(request)).postDataJSON()).toEqual({
            ...DEFAULT_BODY,
            name: "Laura Rivera",
            consent_record_attendance: true,
            consent_record: true,
            consent_record_video: true,
          });
          await expectRedirect(page);
        });

        test(`${action} as guest with invalid name`, async ({ page }) => {
          await mockFeatures(page, action, {
            recording: true,
            attendance_recording: true,
          });
          const request = await mockAction(page, action, 422, {
            message:
              "The name contains the following non-permitted characters: 123!",
            errors: {
              name: [
                "The name contains the following non-permitted characters: 123!",
              ],
            },
          });

          await page.goto(ROOM_PATH);
          await button.click();
          await expect(dialog).toBeVisible();
          await acceptAll();
          await dialog.getByTestId("dialog-continue-button").click();

          expect((await firstRequest(request)).postDataJSON()).toEqual({
            ...DEFAULT_BODY,
            name: "Laura Rivera",
            consent_record_attendance: true,
            consent_record: true,
            consent_record_video: true,
          });

          // Check if error message is shown
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText(
            "The name contains the following non-permitted characters: 123!",
          );
        });

        test(`${action} as guest with server error hides name error`, async ({
          page,
        }) => {
          await mockFeatures(page, action, {
            recording: true,
            attendance_recording: true,
          });
          const invalidName = await mockAction(page, action, 422, {
            message:
              "The name contains the following non-permitted characters: 123!",
            errors: {
              name: [
                "The name contains the following non-permitted characters: 123!",
              ],
            },
          });

          await page.goto(ROOM_PATH);
          await button.click();
          await expect(dialog).toBeVisible();
          await acceptAll();
          await dialog.getByTestId("dialog-continue-button").click();
          await firstRequest(invalidName);
          await expect(dialog).toContainText(
            "The name contains the following non-permitted characters: 123!",
          );

          const request = await mockAction(page, action, 500, {
            message: "Test",
          });
          await dialog.getByTestId("dialog-continue-button").click();
          await firstRequest(request);

          // Check that room join dialog stays open and 422 error messages are hidden
          await expectToastAndClose(page, SERVER_ERROR_TOAST);
          await expect(dialog).toBeVisible();
          await expect(dialog).not.toContainText(
            "The name contains the following non-permitted characters: 123!",
          );
        });

        test(`${action} with personalized link`, async ({ page }) => {
          await mockRoom(page, {
            ...room,
            current_user: null,
            username: "Max Doe",
          });
          const auth = await mockAuth(page, 1);
          const features = await mockFeatures(page, action, {
            recording: true,
            attendance_recording: true,
          });
          const request = await mockActionRedirect(page, action);

          // Visit room with personalized link
          await page.goto(`${ROOM_PATH}#personalizedLink=${PERSONALIZED_LINK}`);
          await firstRequest(auth);

          await button.click();
          // Check that the token is set
          expectAuthToken(await firstRequest(features), "1");

          await expect(dialog).toBeVisible();
          await acceptAll();
          await dialog.getByTestId("dialog-continue-button").click();

          const sent = await firstRequest(request);
          expect(sent.postDataJSON()).toEqual({
            ...DEFAULT_BODY,
            name: "Laura Rivera",
            consent_record_attendance: true,
            consent_record: true,
            consent_record_video: true,
          });
          expectAuthToken(sent, "1");
          await expectRedirect(page);
        });

        test(`${action} with invalid personalized link`, async ({ page }) => {
          await mockAuth(page, 1);
          await mockFeatures(page, action);

          await page.goto(`${ROOM_PATH}/${PERSONALIZED_LINK}`);
          await expect(button).toBeVisible();

          const auth = await mockAuthError(page, "invalid_personalized_link");
          const request = await mockAction(page, action, 401, {
            message: "invalid_auth_token",
          });

          await button.click();
          await firstRequest(request);
          await firstRequest(auth);

          // Check that error message is shown and url changed
          await expectToastAndClose(
            page,
            "rooms.flash.personalized_link_invalid",
          );
          await expect(
            page.getByText("rooms.invalid_personalized_link"),
          ).toBeVisible();
          await expect(page).toHaveURL(
            /\/rooms\/abc-def-123\/invalid_personalized_link/,
          );
          await expectPersonalizedLinkCleared(page);
        });

        test(`${action} as guest not allowed`, async ({ page }) => {
          await mockFeatures(page, action);
          const request = await mockAction(page, action, 403, {
            message: "guests_not_allowed",
          });

          await page.goto(ROOM_PATH);
          await expect(button).toHaveText(label);
          await button.click();
          await firstRequest(request);

          await expect(
            page.getByText("rooms.only_used_by_authenticated_users"),
          ).toBeVisible();
        });

        test(`${action} requirements as guest not allowed`, async ({
          page,
        }) => {
          await mockRoom(page, { ...loadRoom, current_user: null });
          const features = await mockFeaturesError(
            page,
            action,
            403,
            "guests_not_allowed",
          );

          await page.goto(ROOM_PATH);
          await button.click();
          await firstRequest(features);

          await expect(
            page.getByText("rooms.only_used_by_authenticated_users"),
          ).toBeVisible();
        });

        test(`${action} requirements with server error and retry`, async ({
          page,
        }) => {
          await mockRoom(page, { ...loadRoom, current_user: null });
          const features = await mockFeaturesError(page, action, 500, "Test");

          await page.goto(ROOM_PATH);
          await button.click();
          await firstRequest(features);

          // Check that the dialog stays open and the error message is shown
          await expectToastAndClose(page, SERVER_ERROR_TOAST);
          await expect(dialog).toBeVisible();

          // The access code is invalid now and the room is reloaded
          const retryFeatures = await mockFeaturesError(
            page,
            action,
            401,
            "invalid_auth_token",
          );
          const reloadedRoom = await mockRoom(page, {
            ...loadRoom,
            current_user: null,
            authenticated: false,
          });
          await page.getByTestId("loading-retry-button").click();

          await firstRequest(retryFeatures);
          await firstRequest(reloadedRoom);

          await expectToastAndClose(page, "rooms.flash.access_code_invalid");

          // Check dialog is closed and access code input is shown with the error message
          await expect(dialog).toBeHidden();
          await expect(
            page.getByText("rooms.flash.access_code_invalid"),
          ).toBeVisible();
        });

        test(`${action} requirements with access code required`, async ({
          page,
        }) => {
          await mockRoom(page, { ...loadRoom, current_user: null });
          await page.goto(ROOM_PATH);
          await expect(button).toBeVisible();

          const features = await mockFeaturesError(
            page,
            action,
            403,
            "require_code",
          );
          const reloadedRoom = await mockRoom(page, {
            ...loadRoom,
            current_user: null,
            authenticated: false,
          });

          await button.click();
          await firstRequest(features);
          await firstRequest(reloadedRoom);

          await expectToastAndClose(page, "rooms.require_access_code");

          // Check that the access code input is shown without value and error message
          await expect(page.locator("#access-code")).toHaveValue("");
          await expect(dialog).toBeHidden();
          await expect(
            page.getByText("rooms.flash.access_code_invalid"),
          ).toHaveCount(0);
        });

        test(`${action} requirements with invalid personalized link`, async ({
          page,
        }) => {
          await mockRoom(page, { ...loadRoom, current_user: null });
          await mockAuth(page, 1);

          await page.goto(`${ROOM_PATH}/${PERSONALIZED_LINK}`);
          await expect(button).toBeVisible();

          const auth = await mockAuthError(page, "invalid_personalized_link");
          const features = await mockFeaturesError(
            page,
            action,
            401,
            "invalid_auth_token",
          );

          await button.click();
          await firstRequest(features);
          await firstRequest(auth);

          // Check that error message is shown and url changed
          await expectToastAndClose(
            page,
            "rooms.flash.personalized_link_invalid",
          );
          await expect(
            page.getByText("rooms.invalid_personalized_link"),
          ).toBeVisible();
          await expect(page).toHaveURL(
            /\/rooms\/abc-def-123\/invalid_personalized_link/,
          );
          await expectPersonalizedLinkCleared(page);
        });

        test(`${action} requirements with room not found`, async ({ page }) => {
          await mockRoom(page, { ...loadRoom, current_user: null });
          await page.goto(ROOM_PATH);
          await expect(button).toBeVisible();

          const features = await mockMethod(
            page,
            "OPTIONS",
            `**/api/v1/rooms/abc-def-123/${action}*`,
            { status: 404, json: MODEL_NOT_FOUND_BODY },
          );

          await button.click();
          await firstRequest(features);

          // Check that redirect to 404 page worked and error message is shown
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.includes("/404") &&
              !url.pathname.includes("/rooms/abc-def-123"),
          );
          await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
        });
      });
    });
  }

  test.describe("join meeting only", () => {
    const joinRoom = { last_meeting: RUNNING_MEETING };

    test.beforeEach(async ({ page }) => {
      await mockRoom(page, joinRoom);
    });

    test("join with closed room", async ({ page }) => {
      await mockFeatures(page, "join");
      const request = await mockAction(page, "join", 460, {
        message: "Joining failed! The room is currently closed.",
      });

      await page.goto(ROOM_PATH);
      await expect(page.getByTestId("room-join-button")).toBeVisible();

      // The room is not running anymore
      const reloadedRoom = await mockRoom(page);
      await page.getByTestId("room-join-button").click();
      await firstRequest(request);
      await firstRequest(reloadedRoom);

      // Check if error message is shown and button has switched to start room
      await expectToastAndClose(page, "app.errors.not_running");
      await expect(page.getByTestId("room-start-button")).toHaveText(
        "rooms.start",
      );
      await expect(page.getByTestId("room-join-button")).toHaveCount(0);
    });
  });

  test.describe("start meeting only", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoom(page);
    });

    test("start without permission", async ({ page }) => {
      await mockFeatures(page, "start", {
        recording: true,
        attendance_recording: true,
      });
      const request = await mockAction(page, "start", 403, {
        message: "This action is unauthorized.",
      });

      await page.goto(ROOM_PATH);
      await page.getByTestId("room-start-button").click();

      const dialog = page.getByTestId("room-join-dialog");
      await expect(dialog).toBeVisible();

      // The room is reloaded and the user is not allowed to start the room anymore
      const reloadedRoom = await mockRoom(page, { can_start: false });
      await dialog.getByTestId("dialog-continue-button").click();
      await firstRequest(request);
      await firstRequest(reloadedRoom);

      // Check that room join dialog is closed and the error message is shown
      await expectToastAndClose(page, "rooms.flash.start_forbidden");
      await expect(dialog).toBeHidden();

      // Check that start room button does not exist anymore
      await expect(page.getByText("rooms.not_running")).toBeVisible();
      await expect(page.getByTestId("room-start-button")).toHaveCount(0);

      // Reload room with permission to start room
      const permittedRoom = await mockRoom(page);
      await page.getByTestId("reload-room-button").click();
      await firstRequest(permittedRoom);
      await expect(page.getByTestId("room-start-button")).toBeVisible();
    });

    test("start of already running room switches to join", async ({ page }) => {
      await mockFeatures(page, "start", { recording: true });
      const request = await mockAction(page, "start", 474, {
        message: "The room could not be started because it is already running.",
      });

      await page.goto(ROOM_PATH);
      await page.getByTestId("room-start-button").click();

      const dialog = page.getByTestId("room-join-dialog");
      await expect(dialog).toBeVisible();
      await expect(page.getByText("rooms.not_running")).toHaveCount(0);

      // The room is running now
      const reloadedRoom = await mockRoom(page, {
        last_meeting: RUNNING_MEETING,
      });
      const joinFeatures = await mockFeatures(page, "join", {
        recording: true,
      });
      await dialog.getByTestId("dialog-continue-button").click();

      await firstRequest(request);
      await firstRequest(reloadedRoom);
      await firstRequest(joinFeatures);

      await expect(page.getByTestId("room-join-button")).toHaveText(
        "rooms.join",
      );
      await expect(page.getByTestId("room-start-button")).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("app.errors.room_already_running");

      // Check if join request gets send when clicking on continue button
      const joinRequest = await mockActionRedirect(page, "join");
      await dialog.getByTestId("dialog-continue-button").click();

      await firstRequest(joinRequest);
      await expectRedirect(page);
    });

    test("start requirements without permission", async ({ page }) => {
      await mockRoom(page, { current_user: null });
      const features = await mockFeaturesError(
        page,
        "start",
        403,
        "This action is unauthorized.",
      );

      await page.goto(ROOM_PATH);
      await page.getByTestId("room-start-button").click();
      await firstRequest(features);

      // Check if error message is shown and the dialog is closed
      await expectToastAndClose(page, "rooms.flash.start_forbidden");
      await expect(page.getByTestId("room-join-dialog")).toBeHidden();
    });
  });
});
