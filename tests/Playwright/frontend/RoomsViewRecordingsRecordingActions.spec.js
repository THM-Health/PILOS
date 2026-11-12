import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/roomsFilesRecordings.js";
import { mockMethod, nthRequest } from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  expectNoAuthToken,
  setValidRememberedParticipantName,
} from "../support/room.js";

test.use({ authenticated: true });

test.describe("Rooms view recordings recording actions", () => {
  test.beforeEach(async ({ page }) => {
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
          `https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/${index + 1}`,
        );
        await expect(button).toHaveAttribute("rel", "opener");
        await expect(button).toHaveAttribute("target", "_blank");
      }
    });
  });

  test.describe("view recording with access code", () => {
    test.beforeEach(async ({ page, room, roomRecordings }) => {
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });
      room.data.owner = { id: 2, name: "Max Doe" };
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;

      await page.goto("/rooms/abc-def-123#accessCode=123456789&tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
    });

    test("adds the room auth token to the links", async ({ page }) => {
      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-view-button")
        .click();

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
          `https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/${index + 1}?room_auth_token=roomAuthToken&room_auth_token_type=0`,
        );
        await expect(button).toHaveAttribute("rel", "opener");
        await expect(button).toHaveAttribute("target", "_blank");
      }
    });

    test("resets the room auth token on invalid_auth_token", async ({
      page,
      room,
      postMessage,
    }) => {
      room.data.authenticated = false;
      const roomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        {
          json: room,
        },
      );

      await postMessage({ type: "invalid_auth_token" });

      expectNoAuthToken(await nthRequest(roomRequests));

      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid").first(),
      ).toBeVisible();
    });

    test("asks for the access code on require_code", async ({
      page,
      room,
      postMessage,
    }) => {
      // Reset the room auth token first, then reload the room without a token (the access overlay requires a token)
      room.data.authenticated = false;
      await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        { json: room },
      );
      await postMessage({ type: "invalid_auth_token" });
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");

      room.data.authenticated = true;
      const reloadedRoomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        {
          json: room,
        },
      );
      await page.getByTestId("reload-room-button").click();
      await nthRequest(reloadedRoomRequests);
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      room.data.authenticated = false;
      const roomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        {
          json: room,
        },
      );
      await postMessage({ type: "require_code" });

      expectNoAuthToken(await nthRequest(roomRequests));

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

    test.beforeEach(async ({ page, room, roomRecordings }) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;
    });

    test("adds the room auth token to the links", async ({ page }) => {
      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
      );
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      await page
        .getByTestId("room-recording-item")
        .first()
        .getByTestId("room-recordings-view-button")
        .click();

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
          `https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/${index + 1}?room_auth_token=roomAuthToken&room_auth_token_type=1`,
        );
        await expect(button).toHaveAttribute("rel", "opener");
        await expect(button).toHaveAttribute("target", "_blank");
      }
    });

    test("shows an error and redirects on an invalid personalized link", async ({
      page,
      postMessage,
    }) => {
      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
      );
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      const auth = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/auth",
        {
          status: 401,
          json: { message: "invalid_personalized_link" },
        },
      );

      await postMessage({ type: "invalid_auth_token" });
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
      postMessage,
    }) => {
      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
      );
      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

      await postMessage({ type: "guests_only" });

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
      test(`reloads the recordings on ${type}`, async ({
        page,
        roomRecordings,
        postMessage,
      }) => {
        roomRecordings.data = roomRecordings.data.slice(0, remaining);
        roomRecordings.meta.to = remaining;
        roomRecordings.meta.total = remaining;
        roomRecordings.meta.total_no_filter = remaining;
        const recordingsRequests = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/recordings*",
          { json: roomRecordings },
        );

        await postMessage({ type });
        await nthRequest(recordingsRequests);

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
      room,
      roomRecordings,
      postMessage,
    }) => {
      roomRecordings.data = roomRecordings.data.slice(0, 2);
      roomRecordings.meta.to = 2;
      roomRecordings.meta.total = 2;
      roomRecordings.meta.total_no_filter = 2;
      const recordingsRequests = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/recordings*",
        { json: roomRecordings },
      );
      room.data.current_user = null;
      const roomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        { hold: true, json: room },
      );

      await postMessage({ type: "forbidden" });
      await nthRequest(recordingsRequests);

      await expectToastAndClose(page, "rooms.flash.recording_forbidden");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(2);

      // The room request is still pending, so the rest of the page is not yet updated
      await expect(page.getByText("auth.login")).toHaveCount(0);

      roomRequests.release();
      await expect(page.getByText("auth.login").first()).toBeVisible();
    });

    test("reloads room and recordings on forbidden if the permissions changed", async ({
      page,
      room,
      roomRecordings,
      postMessage,
    }) => {
      room.data.current_user = null;
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;
      const recordingsRequests = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/recordings*",
        { json: roomRecordings },
      );
      const participantNameCheck = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          request.url().includes("/api/v1/participantName/check"),
      );

      await postMessage({ type: "forbidden" });

      await expectToastAndClose(page, "rooms.flash.recording_forbidden");
      await participantNameCheck;

      // Recordings are reloaded because of the error and again because the room changed
      await nthRequest(recordingsRequests, 2);
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

    test("shows a message on guests_not_allowed", async ({
      page,
      postMessage,
    }) => {
      await postMessage({ type: "guests_not_allowed" });

      await expect(
        page.getByText("rooms.only_used_by_authenticated_users").first(),
      ).toBeVisible();
    });

    for (const [name, message] of [
      ["without message", null],
      ["without type", {}],
      ["with null type", { type: null }],
    ]) {
      test(`ignores messages ${name}`, async ({
        page,
        roomRecordings,
        postMessage,
      }) => {
        const recordingsRequests = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/recordings*",
          { json: roomRecordings },
        );

        await postMessage(message);

        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
        await expect(page.locator(".p-toast-message")).toHaveCount(0);
        expect(recordingsRequests.requests).toHaveLength(0);
      });
    }
  });

  test("ignores messages of a different base url", async ({
    page,
    config,
    roomRecordings,
    postMessage,
  }) => {
    config.data.room.file_terms_of_use = "Test terms of use";
    config.data.general.base_url = "";

    await page.goto("/rooms/abc-def-123#tab=recordings");
    await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

    const recordingsRequests = await mockMethod(
      page,
      "GET",
      "**/api/v1/rooms/abc-def-123/recordings*",
      { json: roomRecordings },
    );

    await postMessage({ type: "file_not_found" });

    await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    await expect(page.locator(".p-toast-message")).toHaveCount(0);
    expect(recordingsRequests.requests).toHaveLength(0);
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

    test("disables the dialog buttons while deleting", async ({
      page,
      roomRecordings,
    }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
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

      roomRecordings.data = roomRecordings.data.slice(1, 4);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;
      deleteRequest.release();
      await expect(dialog).toBeHidden();
    });

    test("deletes the recording and reloads the list", async ({
      page,
      roomRecordings,
    }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
        { status: 204 },
      );
      roomRecordings.data = roomRecordings.data.slice(1, 4);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

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
      roomRecordings,
    }) => {
      await page
        .getByTestId("room-recording-item")
        .nth(3)
        .getByTestId("room-recordings-delete-button")
        .click();

      await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/recordings/f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "recording",
            ids: ["f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775"],
          },
        },
      );
      roomRecordings.data = roomRecordings.data.slice(0, 3);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

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

      await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/recordings/0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
        {
          status: 500,
          json: { message: "Test" },
        },
      );

      const dialog = page.getByTestId("room-recordings-delete-dialog");
      await dialog.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

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
        "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
        "recordings",
      );
    });

    test("redirects to the room index page if the room was not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
        },
      );

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
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
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
        "**/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
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

    test("saves the changes and updates the recording", async ({
      page,
      roomRecordings,
    }) => {
      const editRequest = await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
        { status: 204 },
      );

      roomRecordings.data[0].description = "Recording 1 Test";
      roomRecordings.data[0].access = 3;
      roomRecordings.data[0].formats[0].disabled = true;
      roomRecordings.data[0].formats[1].disabled = true;
      roomRecordings.data[0].formats[2].disabled = true;

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
      roomRecordings,
    }) => {
      await page
        .getByTestId("room-recording-item")
        .nth(3)
        .getByTestId("room-recordings-edit-button")
        .click();

      await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/recordings/f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "recording",
            ids: ["f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775"],
          },
        },
      );
      roomRecordings.data = roomRecordings.data.slice(0, 3);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

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

      await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/recordings/0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
        {
          status: 422,
          json: {
            message: "Validation failed",
            errors: {
              description: ["The description field is required."],
              access: ["The access field is required."],
              formats: ["The formats field is required."],
            },
          },
        },
      );

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
      await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/recordings/0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
        {
          status: 500,
          json: { message: "Test" },
        },
      );
      await dialog.getByTestId("dialog-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

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
        "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
        "recordings",
      );
    });

    test("redirects to the room index page if the room was not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
        },
      );

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
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });
});
