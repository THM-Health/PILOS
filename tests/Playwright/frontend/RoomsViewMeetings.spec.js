import {
  unauthorized,
  forbidden,
  validationErrors,
  serverError,
  modelNotFound,
} from "../support/utils.js";
import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import {
  setValidRememberedParticipantName,
  expectAuthToken,
  expectNoAuthToken,
} from "../support/room.js";

const test = mergeTests(roomControllerTest, participantNameCheckTest);

test.describe("Rooms view meetings", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomFilesRequest(page);
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  for (const { action, buttonId, label, roomData, loadRoomData } of [
    {
      action: "join",
      buttonId: "room-join-button",
      label: "rooms.join",
      roomData: {
        last_meeting: { start: "2023-08-21T08:18:28.000000Z", end: null },
      },
      loadRoomData: {
        last_meeting: { start: "2023-08-21T08:18:28.000000Z", end: null },
      },
    },
    {
      action: "start",
      buttonId: "room-start-button",
      label: "rooms.start",
      roomData: {},
      loadRoomData: {
        last_meeting: {
          start: "2023-08-21T08:18:28.000000Z",
          end: "2023-08-21T08:18:20.000000Z",
        },
      },
    },
  ]) {
    test.describe(`${action} meeting`, () => {
      test.beforeEach(async ({ roomResponse }) => {
        Object.assign(roomResponse.data, roomData);
      });

      test(`${action} with loading state`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        roomJoinOrStartRedirectUrl,
        roomJoinOrStartRequestBodyWithoutConsent,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        const button = page.getByTestId(buttonId);
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith({
            status: 200,
            json: { url: roomJoinOrStartRedirectUrl },
            hold: true,
          });

        await page.goto("/rooms/abc-def-123");

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

        await optionsRoomJoinOrStartApiMock.waitForRequest();
        postRoomJoinOrStartApiMock.release();

        await expect(
          postRoomJoinOrStartRequestsAfterChange,
        ).toHaveReceivedRequest({
          json: roomJoinOrStartRequestBodyWithoutConsent,
        });
        await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
      });

      test(`${action} with attendance logging`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        roomJoinOrStartRedirectUrl,
        roomJoinOrStartRequestBodyWithoutConsent,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        const button = page.getByTestId(buttonId);
        optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith({
            status: 200,
            json: { url: roomJoinOrStartRedirectUrl },
            hold: true,
          });

        await page.goto("/rooms/abc-def-123");

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
        postRoomJoinOrStartApiMock.release();

        await expect(
          postRoomJoinOrStartRequestsAfterChange,
        ).toHaveReceivedRequest({
          json: {
            ...roomJoinOrStartRequestBodyWithoutConsent,
            consent_record_attendance: true,
          },
        });
        await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
      });

      test(`${action} with streaming`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        roomJoinOrStartRedirectUrl,
        roomJoinOrStartRequestBodyWithoutConsent,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        const button = page.getByTestId(buttonId);
        optionsRoomJoinOrStartApiMock.features.streaming = true;
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith({
            status: 200,
            json: { url: roomJoinOrStartRedirectUrl },
            hold: true,
          });

        await page.goto("/rooms/abc-def-123");

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
        postRoomJoinOrStartApiMock.release();

        await expect(
          postRoomJoinOrStartRequestsAfterChange,
        ).toHaveReceivedRequest({
          json: {
            ...roomJoinOrStartRequestBodyWithoutConsent,
            consent_streaming: true,
          },
        });
        await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
      });

      test(`${action} with recording`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        roomJoinOrStartRedirectUrl,
        roomJoinOrStartRequestBodyWithoutConsent,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        const button = page.getByTestId(buttonId);
        optionsRoomJoinOrStartApiMock.features.recording = true;
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith({
            status: 200,
            json: { url: roomJoinOrStartRedirectUrl },
            hold: true,
          });

        await page.goto("/rooms/abc-def-123");

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
        postRoomJoinOrStartApiMock.release();

        await expect(
          postRoomJoinOrStartRequestsAfterChange,
        ).toHaveReceivedRequest({
          json: {
            ...roomJoinOrStartRequestBodyWithoutConsent,
            consent_record: true,
            consent_record_video: true,
          },
        });
        await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
      });

      test(`${action} with recording without video`, async ({
        page,
        roomResponse,
        optionsRoomJoinOrStartApiMock,
        postRoomJoinOrStartApiMock,
        roomJoinOrStartRedirectUrl,
        roomJoinOrStartRequestBodyWithoutConsent,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        roomResponse.data.record = true;
        optionsRoomJoinOrStartApiMock.features.recording = true;

        await page.goto("/rooms/abc-def-123");
        await page.getByTestId(buttonId).click();

        const checkbox = dialog.locator("#record-agreement");
        await expect(checkbox).not.toBeChecked();
        await checkbox.click();
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(postRoomJoinOrStartApiMock).toHaveReceivedRequest({
          json: {
            ...roomJoinOrStartRequestBodyWithoutConsent,
            consent_record: true,
          },
        });
        await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
      });

      test(`${action} with access code`, async ({
        page,
        roomResponse,
        getRoomApiMock,
        optionsRoomJoinOrStartApiMock,
        postRoomJoinOrStartApiMock,
        roomJoinOrStartRedirectUrl,
        roomJoinOrStartRequestBodyWithoutConsent,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        roomResponse.data.owner = { id: 2, name: "Max Doe" };
        optionsRoomJoinOrStartApiMock.features.recording = true;
        optionsRoomJoinOrStartApiMock.features.attendance_recording = true;

        await page.goto("/rooms/abc-def-123#accessCode=123456789");
        await getRoomApiMock.waitForRequest();

        await page.getByTestId(buttonId).click();

        // Check that the access code is sent
        expectAuthToken(
          await optionsRoomJoinOrStartApiMock.waitForRequest(),
          "0",
        );

        await expect(dialog).toBeVisible();
        for (const id of [
          "record-attendance-agreement",
          "record-agreement",
          "record-video-agreement",
        ]) {
          const checkbox = dialog.locator(`#${id}`);
          await expect(checkbox).not.toBeChecked();
          await checkbox.click();
        }

        await dialog.getByTestId("dialog-continue-button").click();

        const sent = await postRoomJoinOrStartApiMock.waitForRequest();
        expect(sent.postDataJSON()).toEqual({
          ...roomJoinOrStartRequestBodyWithoutConsent,
          consent_record_attendance: true,
          consent_record: true,
          consent_record_video: true,
        });
        expectAuthToken(sent, "0");
        await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
      });

      test(`${action} with invalid access code`, async ({
        page,
        roomResponse,
        getRoomApiMock,
        postRoomJoinOrStartApiMock,
      }) => {
        const button = page.getByTestId(buttonId);
        roomResponse.data.owner = { id: 2, name: "Max Doe" };

        await page.goto("/rooms/abc-def-123#accessCode=123456789");
        await getRoomApiMock.waitForRequest();
        await expect(button).toBeVisible();

        // The request is rejected and the room is reloaded (not authenticated anymore)
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith(
            unauthorized("invalid_auth_token"),
          );
        roomResponse.data.authenticated = false;
        const roomRequestCount = getRoomApiMock.requests.length;

        await button.click();

        // Check that the access code is sent and reset afterwards
        expectAuthToken(
          await postRoomJoinOrStartRequestsAfterChange.waitForRequest(),
          "0",
        );
        expectNoAuthToken(
          await getRoomApiMock.waitForRequest(roomRequestCount + 1),
        );

        await expectToastAndClose(page, "rooms.flash.access_code_invalid");
        await expect(
          page.getByText("rooms.flash.access_code_invalid"),
        ).toBeVisible();

        // Reload the room (but without room auth token)
        roomResponse.data.authenticated = true;
        await page.getByTestId("reload-room-button").click();

        expectNoAuthToken(
          await getRoomApiMock.waitForRequest(roomRequestCount + 2),
        );
        await expect(button).toBeVisible();
      });

      test(`${action} with access code required`, async ({
        page,
        roomResponse,
        getRoomApiMock,
        postRoomJoinOrStartApiMock,
      }) => {
        const button = page.getByTestId(buttonId);
        roomResponse.data.owner = { id: 2, name: "Max Doe" };

        await page.goto("/rooms/abc-def-123");
        await getRoomApiMock.waitForRequest();
        await expect(button).toBeVisible();

        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith(forbidden("require_code"));
        roomResponse.data.authenticated = false;
        const roomRequestCount = getRoomApiMock.requests.length;

        await button.click();

        expectNoAuthToken(
          await postRoomJoinOrStartRequestsAfterChange.waitForRequest(),
        );
        expectNoAuthToken(
          await getRoomApiMock.waitForRequest(roomRequestCount + 1),
        );

        await expectToastAndClose(page, "rooms.require_access_code");

        await expect(page.locator("#access-code")).toHaveValue("");
        await expect(
          page.getByText("rooms.flash.access_code_invalid"),
        ).toHaveCount(0);
      });

      test.describe("dark mode", () => {
        test.use({ colorScheme: "dark" });

        test(`${action} with dark mode`, async ({
          page,
          postRoomJoinOrStartApiMock,
          roomJoinOrStartRedirectUrl,
          roomJoinOrStartRequestBodyWithoutConsent,
        }) => {
          await page.goto("/rooms/abc-def-123");
          await page.getByTestId(buttonId).click();

          await expect(postRoomJoinOrStartApiMock).toHaveReceivedRequest({
            json: {
              ...roomJoinOrStartRequestBodyWithoutConsent,
              dark_mode: true,
            },
          });
          await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
        });
      });

      test(`${action} with validation errors for missing agreements`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        const button = page.getByTestId(buttonId);
        // The room settings changed in the meantime, therefore the agreements are missing
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith(
            validationErrors(
              {
                consent_record_attendance: [
                  "The consent record attendance must be accepted.",
                ],
                consent_record: ["The consent record must be accepted."],
              },
              "The consent record attendance must be accepted. (and 1 more error)",
              { hold: true },
            ),
          );

        await page.goto("/rooms/abc-def-123");
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

        optionsRoomJoinOrStartApiMock.features.recording = true;
        optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
        postRoomJoinOrStartApiMock.release();
        await postRoomJoinOrStartRequestsAfterChange.waitForRequest();

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
        expect(postRoomJoinOrStartRequestsAfterChange.requests).toHaveLength(1);
      });

      test(`${action} with required agreements and validation error`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        optionsRoomJoinOrStartApiMock.features.recording = true;
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith(
            validationErrors(
              {
                consent_record_attendance: [
                  "The consent record attendance must be accepted.",
                ],
              },
              "The consent record attendance must be accepted.",
            ),
          );

        await page.goto("/rooms/abc-def-123");
        await page.getByTestId(buttonId).click();

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
        optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
        await dialog.getByTestId("dialog-continue-button").click();
        await postRoomJoinOrStartRequestsAfterChange.waitForRequest();

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
        optionsRoomJoinOrStartApiMock,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        optionsRoomJoinOrStartApiMock.features.recording = true;
        optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
        const postRoomJoinOrStartRequestsAfterChange1 =
          postRoomJoinOrStartApiMock.respondWith(
            validationErrors(
              {
                consent_record_attendance: [
                  "The consent record attendance must be accepted.",
                ],
              },
              "The consent record attendance must be accepted.",
            ),
          );

        await page.goto("/rooms/abc-def-123");
        await page.getByTestId(buttonId).click();
        await expect(dialog).toBeVisible();
        for (const id of [
          "record-attendance-agreement",
          "record-agreement",
          "record-video-agreement",
        ]) {
          const checkbox = dialog.locator(`#${id}`);
          await expect(checkbox).not.toBeChecked();
          await checkbox.click();
        }
        await dialog.getByTestId("dialog-continue-button").click();
        await postRoomJoinOrStartRequestsAfterChange1.waitForRequest();
        await expect(
          dialog.getByText("The consent record attendance must be accepted."),
        ).toBeVisible();

        const postRoomJoinOrStartRequestsAfterChange2 =
          postRoomJoinOrStartApiMock.respondWith(serverError());
        await dialog.getByTestId("dialog-continue-button").click();
        await postRoomJoinOrStartRequestsAfterChange2.waitForRequest();

        // Check that room join dialog stays open and 422 error messages are hidden
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText(
          "The consent record attendance must be accepted.",
        );
        await expect(dialog).not.toContainText(
          "The consent record must be accepted.",
        );
      });

      test(`${action} with room not found`, async ({
        page,
        optionsRoomJoinOrStartApiMock,
        postRoomJoinOrStartApiMock,
      }) => {
        const dialog = page.getByTestId("room-join-dialog");
        optionsRoomJoinOrStartApiMock.features.recording = true;
        optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
        const postRoomJoinOrStartRequestsAfterChange =
          postRoomJoinOrStartApiMock.respondWith(
            modelNotFound("room", ["abc-def-123"]),
          );
        await interceptRoomIndexRequests(page);

        await page.goto("/rooms/abc-def-123");
        await page.getByTestId(buttonId).click();
        await expect(dialog).toBeVisible();
        for (const id of [
          "record-attendance-agreement",
          "record-agreement",
          "record-video-agreement",
        ]) {
          const checkbox = dialog.locator(`#${id}`);
          await expect(checkbox).not.toBeChecked();
          await checkbox.click();
        }
        await dialog.getByTestId("dialog-continue-button").click();
        await postRoomJoinOrStartRequestsAfterChange.waitForRequest();

        // Check that redirect to room index page worked and error message is shown
        await expect(page).toHaveURL(
          (url) =>
            url.pathname.includes("/rooms") &&
            !url.pathname.includes("/rooms/abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });

      test.describe("guests", () => {
        test.use({ authenticated: false });

        test.beforeEach(async ({ roomResponse }) => {
          roomResponse.data.current_user = null;
        });

        test(`${action} as guest`, async ({
          page,
          optionsRoomJoinOrStartApiMock,
          postRoomJoinOrStartApiMock,
          roomJoinOrStartRedirectUrl,
          roomJoinOrStartRequestBodyWithoutConsent,
        }) => {
          const dialog = page.getByTestId("room-join-dialog");
          optionsRoomJoinOrStartApiMock.features.recording = true;
          optionsRoomJoinOrStartApiMock.features.attendance_recording = true;

          await page.goto("/rooms/abc-def-123");
          await page.getByTestId(buttonId).click();
          await optionsRoomJoinOrStartApiMock.waitForRequest();

          await expect(dialog).toBeVisible();
          for (const id of [
            "record-attendance-agreement",
            "record-agreement",
            "record-video-agreement",
          ]) {
            const checkbox = dialog.locator(`#${id}`);
            await expect(checkbox).not.toBeChecked();
            await checkbox.click();
          }
          await dialog.getByTestId("dialog-continue-button").click();

          await expect(postRoomJoinOrStartApiMock).toHaveReceivedRequest({
            json: {
              ...roomJoinOrStartRequestBodyWithoutConsent,
              name: "Laura Rivera",
              consent_record_attendance: true,
              consent_record: true,
              consent_record_video: true,
            },
          });
          await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
        });

        test(`${action} as guest with invalid name`, async ({
          page,
          optionsRoomJoinOrStartApiMock,
          roomJoinOrStartRequestBodyWithoutConsent,
          postRoomJoinOrStartApiMock,
        }) => {
          const dialog = page.getByTestId("room-join-dialog");
          optionsRoomJoinOrStartApiMock.features.recording = true;
          optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
          const postRoomJoinOrStartRequestsAfterChange =
            postRoomJoinOrStartApiMock.respondWith(
              validationErrors(
                {
                  name: [
                    "The name contains the following non-permitted characters: 123!",
                  ],
                },
                "The name contains the following non-permitted characters: 123!",
              ),
            );

          await page.goto("/rooms/abc-def-123");
          await page.getByTestId(buttonId).click();
          await expect(dialog).toBeVisible();
          for (const id of [
            "record-attendance-agreement",
            "record-agreement",
            "record-video-agreement",
          ]) {
            const checkbox = dialog.locator(`#${id}`);
            await expect(checkbox).not.toBeChecked();
            await checkbox.click();
          }
          await dialog.getByTestId("dialog-continue-button").click();

          await expect(
            postRoomJoinOrStartRequestsAfterChange,
          ).toHaveReceivedRequest({
            json: {
              ...roomJoinOrStartRequestBodyWithoutConsent,
              name: "Laura Rivera",
              consent_record_attendance: true,
              consent_record: true,
              consent_record_video: true,
            },
          });

          // Check if error message is shown
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText(
            "The name contains the following non-permitted characters: 123!",
          );
        });

        test(`${action} as guest with server error hides name error`, async ({
          page,
          optionsRoomJoinOrStartApiMock,
          postRoomJoinOrStartApiMock,
        }) => {
          const dialog = page.getByTestId("room-join-dialog");
          optionsRoomJoinOrStartApiMock.features.recording = true;
          optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
          const postRoomJoinOrStartRequestsAfterChange1 =
            postRoomJoinOrStartApiMock.respondWith(
              validationErrors(
                {
                  name: [
                    "The name contains the following non-permitted characters: 123!",
                  ],
                },
                "The name contains the following non-permitted characters: 123!",
              ),
            );

          await page.goto("/rooms/abc-def-123");
          await page.getByTestId(buttonId).click();
          await expect(dialog).toBeVisible();
          for (const id of [
            "record-attendance-agreement",
            "record-agreement",
            "record-video-agreement",
          ]) {
            const checkbox = dialog.locator(`#${id}`);
            await expect(checkbox).not.toBeChecked();
            await checkbox.click();
          }
          await dialog.getByTestId("dialog-continue-button").click();
          await postRoomJoinOrStartRequestsAfterChange1.waitForRequest();
          await expect(dialog).toContainText(
            "The name contains the following non-permitted characters: 123!",
          );

          const postRoomJoinOrStartRequestsAfterChange2 =
            postRoomJoinOrStartApiMock.respondWith(serverError());
          await dialog.getByTestId("dialog-continue-button").click();
          await postRoomJoinOrStartRequestsAfterChange2.waitForRequest();

          // Check that room join dialog stays open and 422 error messages are hidden
          await expectToastAndClose(page, [
            'app.flash.server_error.message_{"message":"Test"}',
            'app.flash.server_error.error_code_{"statusCode":500}',
          ]);
          await expect(dialog).toBeVisible();
          await expect(dialog).not.toContainText(
            "The name contains the following non-permitted characters: 123!",
          );
        });

        test(`${action} with personalized link`, async ({
          page,
          roomResponse,
          optionsRoomJoinOrStartApiMock,
          postRoomJoinOrStartApiMock,
          roomJoinOrStartRedirectUrl,
          roomJoinOrStartRequestBodyWithoutConsent,
          postRoomAuthApiMock,
        }) => {
          const dialog = page.getByTestId("room-join-dialog");
          roomResponse.data.username = "Max Doe";
          const postRoomAuthRequestsAfterChange =
            postRoomAuthApiMock.respondWith({
              status: 201,
              json: { data: { id: "roomAuthToken", type: 1 } },
            });
          optionsRoomJoinOrStartApiMock.features.recording = true;
          optionsRoomJoinOrStartApiMock.features.attendance_recording = true;

          // Visit room with personalized link
          await page.goto(
            "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          );
          await postRoomAuthRequestsAfterChange.waitForRequest();

          await page.getByTestId(buttonId).click();
          // Check that the token is set
          expectAuthToken(
            await optionsRoomJoinOrStartApiMock.waitForRequest(),
            "1",
          );

          await expect(dialog).toBeVisible();
          for (const id of [
            "record-attendance-agreement",
            "record-agreement",
            "record-video-agreement",
          ]) {
            const checkbox = dialog.locator(`#${id}`);
            await expect(checkbox).not.toBeChecked();
            await checkbox.click();
          }
          await dialog.getByTestId("dialog-continue-button").click();

          const sent = await postRoomJoinOrStartApiMock.waitForRequest();
          expect(sent.postDataJSON()).toEqual({
            ...roomJoinOrStartRequestBodyWithoutConsent,
            name: "Laura Rivera",
            consent_record_attendance: true,
            consent_record: true,
            consent_record_video: true,
          });
          expectAuthToken(sent, "1");
          await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
        });

        test(`${action} with invalid personalized link`, async ({
          page,
          postRoomAuthApiMock,
          postRoomJoinOrStartApiMock,
        }) => {
          const button = page.getByTestId(buttonId);
          postRoomAuthApiMock.respondWith({
            status: 201,
            json: { data: { id: "roomAuthToken", type: 1 } },
          });

          await page.goto(
            "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          );
          await expect(button).toBeVisible();

          const postRoomAuthRequestsAfterChange =
            postRoomAuthApiMock.respondWith(
              unauthorized("invalid_personalized_link"),
            );
          const postRoomJoinOrStartRequestsAfterChange =
            postRoomJoinOrStartApiMock.respondWith(
              unauthorized("invalid_auth_token"),
            );

          await button.click();
          await postRoomJoinOrStartRequestsAfterChange.waitForRequest();
          await postRoomAuthRequestsAfterChange.waitForRequest();

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
          await expect
            .poll(() =>
              page.evaluate(() =>
                window.sessionStorage.getItem(
                  "roomPersonalizedLink_abc-def-123",
                ),
              ),
            )
            .toBeNull();
        });

        test(`${action} as guest not allowed`, async ({
          page,
          postRoomJoinOrStartApiMock,
        }) => {
          const postRoomJoinOrStartRequestsAfterChange =
            postRoomJoinOrStartApiMock.respondWith(
              forbidden("guests_not_allowed"),
            );

          await page.goto("/rooms/abc-def-123");
          await expect(page.getByTestId(buttonId)).toHaveText(label);
          await page.getByTestId(buttonId).click();
          await postRoomJoinOrStartRequestsAfterChange.waitForRequest();

          await expect(
            page.getByText("rooms.only_used_by_authenticated_users"),
          ).toBeVisible();
        });

        test(`${action} requirements as guest not allowed`, async ({
          page,
          roomResponse,
          optionsRoomJoinOrStartApiMock,
        }) => {
          Object.assign(roomResponse.data, loadRoomData);
          optionsRoomJoinOrStartApiMock.status = 403;
          optionsRoomJoinOrStartApiMock.error = {
            message: "guests_not_allowed",
          };

          await page.goto("/rooms/abc-def-123");
          await page.getByTestId(buttonId).click();
          await optionsRoomJoinOrStartApiMock.waitForRequest();

          await expect(
            page.getByText("rooms.only_used_by_authenticated_users"),
          ).toBeVisible();
        });

        test(`${action} requirements with server error and retry`, async ({
          page,
          roomResponse,
          getRoomApiMock,
          optionsRoomJoinOrStartApiMock,
        }) => {
          const dialog = page.getByTestId("room-join-dialog");
          Object.assign(roomResponse.data, loadRoomData);
          optionsRoomJoinOrStartApiMock.status = 500;
          optionsRoomJoinOrStartApiMock.error = { message: "Test" };

          await page.goto("/rooms/abc-def-123");
          await page.getByTestId(buttonId).click();
          await optionsRoomJoinOrStartApiMock.waitForRequest();

          // Check that the dialog stays open and the error message is shown
          await expectToastAndClose(page, [
            'app.flash.server_error.message_{"message":"Test"}',
            'app.flash.server_error.error_code_{"statusCode":500}',
          ]);
          await expect(dialog).toBeVisible();

          // The access code is invalid now and the room is reloaded
          optionsRoomJoinOrStartApiMock.status = 401;
          optionsRoomJoinOrStartApiMock.error = {
            message: "invalid_auth_token",
          };
          roomResponse.data.authenticated = false;
          const roomRequestCount = getRoomApiMock.requests.length;
          await page.getByTestId("loading-retry-button").click();

          await optionsRoomJoinOrStartApiMock.waitForRequest(2);
          await getRoomApiMock.waitForRequest(roomRequestCount + 1);

          await expectToastAndClose(page, "rooms.flash.access_code_invalid");

          // Check dialog is closed and access code input is shown with the error message
          await expect(dialog).toBeHidden();
          await expect(
            page.getByText("rooms.flash.access_code_invalid"),
          ).toBeVisible();
        });

        test(`${action} requirements with access code required`, async ({
          page,
          roomResponse,
          getRoomApiMock,
          optionsRoomJoinOrStartApiMock,
        }) => {
          const button = page.getByTestId(buttonId);
          Object.assign(roomResponse.data, loadRoomData);
          await page.goto("/rooms/abc-def-123");
          await expect(button).toBeVisible();

          optionsRoomJoinOrStartApiMock.status = 403;
          optionsRoomJoinOrStartApiMock.error = {
            message: "require_code",
          };
          roomResponse.data.authenticated = false;
          const roomRequestCount = getRoomApiMock.requests.length;

          await button.click();
          await optionsRoomJoinOrStartApiMock.waitForRequest();
          await getRoomApiMock.waitForRequest(roomRequestCount + 1);

          await expectToastAndClose(page, "rooms.require_access_code");

          // Check that the access code input is shown without value and error message
          await expect(page.locator("#access-code")).toHaveValue("");
          await expect(page.getByTestId("room-join-dialog")).toBeHidden();
          await expect(
            page.getByText("rooms.flash.access_code_invalid"),
          ).toHaveCount(0);
        });

        test(`${action} requirements with invalid personalized link`, async ({
          page,
          roomResponse,
          optionsRoomJoinOrStartApiMock,
          postRoomAuthApiMock,
        }) => {
          const button = page.getByTestId(buttonId);
          Object.assign(roomResponse.data, loadRoomData);
          postRoomAuthApiMock.respondWith({
            status: 201,
            json: { data: { id: "roomAuthToken", type: 1 } },
          });

          await page.goto(
            "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          );
          await expect(button).toBeVisible();

          const postRoomAuthRequestsAfterChange =
            postRoomAuthApiMock.respondWith(
              unauthorized("invalid_personalized_link"),
            );
          optionsRoomJoinOrStartApiMock.status = 401;
          optionsRoomJoinOrStartApiMock.error = {
            message: "invalid_auth_token",
          };

          await button.click();
          await optionsRoomJoinOrStartApiMock.waitForRequest();
          await postRoomAuthRequestsAfterChange.waitForRequest();

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
          await expect
            .poll(() =>
              page.evaluate(() =>
                window.sessionStorage.getItem(
                  "roomPersonalizedLink_abc-def-123",
                ),
              ),
            )
            .toBeNull();
        });

        test(`${action} requirements with room not found`, async ({
          page,
          roomResponse,
          optionsRoomJoinOrStartApiMock,
        }) => {
          const button = page.getByTestId(buttonId);
          Object.assign(roomResponse.data, loadRoomData);
          await page.goto("/rooms/abc-def-123");
          await expect(button).toBeVisible();

          optionsRoomJoinOrStartApiMock.status = 404;
          optionsRoomJoinOrStartApiMock.error = {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          };

          await button.click();
          await optionsRoomJoinOrStartApiMock.waitForRequest();

          // Check that redirect to 404 page worked and error message is shown
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.includes("/404") &&
              !url.pathname.includes("/rooms/abc-def-123"),
          );
          await expectToastAndClose(page, [
            'app.flash.model_not_found.title_{"model":"app.model.room"}',
            'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
          ]);
        });
      });
    });
  }

  test.describe("join meeting only", () => {
    test.beforeEach(async ({ roomResponse }) => {
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
    });

    test("join with closed room", async ({
      page,
      roomResponse,
      getRoomApiMock,
      postRoomJoinOrStartApiMock,
    }) => {
      const postRoomJoinOrStartRequestsAfterChange =
        postRoomJoinOrStartApiMock.respondWith({
          status: 460,
          json: {
            message: "Joining failed! The room is currently closed.",
          },
        });

      await page.goto("/rooms/abc-def-123");
      await expect(page.getByTestId("room-join-button")).toBeVisible();

      // The room is not running anymore
      roomResponse.data.last_meeting = null;
      const roomRequestCount = getRoomApiMock.requests.length;
      await page.getByTestId("room-join-button").click();
      await postRoomJoinOrStartRequestsAfterChange.waitForRequest();
      await getRoomApiMock.waitForRequest(roomRequestCount + 1);

      // Check if error message is shown and button has switched to start room
      await expectToastAndClose(page, "app.errors.not_running");
      await expect(page.getByTestId("room-start-button")).toHaveText(
        "rooms.start",
      );
      await expect(page.getByTestId("room-join-button")).toHaveCount(0);
    });
  });

  test.describe("start meeting only", () => {
    test("start without permission", async ({
      page,
      roomResponse,
      getRoomApiMock,
      optionsRoomJoinOrStartApiMock,
      postRoomJoinOrStartApiMock,
    }) => {
      optionsRoomJoinOrStartApiMock.features.recording = true;
      optionsRoomJoinOrStartApiMock.features.attendance_recording = true;
      const postRoomJoinOrStartRequestsAfterChange =
        postRoomJoinOrStartApiMock.respondWith(
          forbidden("This action is unauthorized."),
        );

      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-start-button").click();

      const dialog = page.getByTestId("room-join-dialog");
      await expect(dialog).toBeVisible();

      // The room is reloaded and the user is not allowed to start the room anymore
      roomResponse.data.can_start = false;
      const roomRequestCount = getRoomApiMock.requests.length;
      await dialog.getByTestId("dialog-continue-button").click();
      await postRoomJoinOrStartRequestsAfterChange.waitForRequest();
      await getRoomApiMock.waitForRequest(roomRequestCount + 1);

      // Check that room join dialog is closed and the error message is shown
      await expectToastAndClose(page, "rooms.flash.start_forbidden");
      await expect(dialog).toBeHidden();

      // Check that start room button does not exist anymore
      await expect(page.getByText("rooms.not_running")).toBeVisible();
      await expect(page.getByTestId("room-start-button")).toHaveCount(0);

      // Reload room with permission to start room
      roomResponse.data.can_start = true;
      await page.getByTestId("reload-room-button").click();
      await getRoomApiMock.waitForRequest(roomRequestCount + 2);
      await expect(page.getByTestId("room-start-button")).toBeVisible();
    });

    test("start of already running room switches to join", async ({
      page,
      roomResponse,
      getRoomApiMock,
      optionsRoomJoinOrStartApiMock,
      roomJoinOrStartRedirectUrl,
      postRoomJoinOrStartApiMock,
    }) => {
      optionsRoomJoinOrStartApiMock.features.recording = true;
      const postRoomJoinOrStartRequestsAfterChange1 =
        postRoomJoinOrStartApiMock.respondWith({
          status: 474,
          json: {
            message:
              "The room could not be started because it is already running.",
          },
        });

      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-start-button").click();

      const dialog = page.getByTestId("room-join-dialog");
      await expect(dialog).toBeVisible();
      await expect(page.getByText("rooms.not_running")).toHaveCount(0);

      // The room is running now
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      const roomRequestCount = getRoomApiMock.requests.length;
      await dialog.getByTestId("dialog-continue-button").click();

      await postRoomJoinOrStartRequestsAfterChange1.waitForRequest();
      await getRoomApiMock.waitForRequest(roomRequestCount + 1);
      await optionsRoomJoinOrStartApiMock.waitForRequest(2);

      await expect(page.getByTestId("room-join-button")).toHaveText(
        "rooms.join",
      );
      await expect(page.getByTestId("room-start-button")).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("app.errors.room_already_running");

      // Check if join request gets send when clicking on continue button
      const postRoomJoinOrStartRequestsAfterChange2 =
        postRoomJoinOrStartApiMock.respondWith({
          status: 200,
          json: { url: roomJoinOrStartRedirectUrl },
        });
      await dialog.getByTestId("dialog-continue-button").click();

      await postRoomJoinOrStartRequestsAfterChange2.waitForRequest();
      await expect(page).toHaveURL(roomJoinOrStartRedirectUrl);
    });

    test("start requirements without permission", async ({
      page,
      roomResponse,
      optionsRoomJoinOrStartApiMock,
    }) => {
      roomResponse.data.current_user = null;
      optionsRoomJoinOrStartApiMock.status = 403;
      optionsRoomJoinOrStartApiMock.error = {
        message: "This action is unauthorized.",
      };

      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-start-button").click();
      await optionsRoomJoinOrStartApiMock.waitForRequest();

      // Check if error message is shown and the dialog is closed
      await expectToastAndClose(page, "rooms.flash.start_forbidden");
      await expect(page.getByTestId("room-join-dialog")).toBeHidden();
    });
  });
});
