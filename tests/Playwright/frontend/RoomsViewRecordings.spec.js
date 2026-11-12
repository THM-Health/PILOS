import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/roomsFilesRecordings.js";
import {
  holdRequest,
  expectActivePage,
  queryOf,
  mockMethod,
  readFixture,
} from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  setValidRememberedParticipantName,
  selectFilter,
  selectSortType,
} from "../support/room.js";

test.use({ authenticated: true });

test.describe("Rooms view recordings", () => {
  test.beforeEach(async ({ page }) => {
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("load recordings", () => {
    test("shows the loading state", async ({ page, roomRecordings }) => {
      const release = await holdRequest(
        page,
        "**/api/v1/rooms/abc-def-123/recordings*",
        { json: roomRecordings },
      );

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-recordings").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=recordings/);

      const search = page.getByTestId("room-recordings-search");
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const filterLabel = page
        .getByTestId("filter-dropdown")
        .locator(".p-select-label");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(filterLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeDisabled();
      await expect(
        page.getByTestId("room-recordings-reload-button"),
      ).toBeDisabled();

      release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(filterLabel).toHaveAttribute("aria-disabled", "false");
      await expect(sortLabel).toHaveAttribute("aria-disabled", "false");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(
        page.getByTestId("room-recordings-reload-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
    });

    for (const [index, recording] of [
      {
        description: "Recording 1",
        date: "08/17/2022, 11:20",
        duration: "20 app.time_formats.minutes",
        access: "rooms.recordings.access_types.everyone",
        enabledFormats: ["notes", "podcast", "presentation", "screenshare"],
        disabledFormats: [],
      },
      {
        description: "Recording 2",
        date: "08/17/2022, 10:00",
        duration: "1 app.time_formats.hour, 0 app.time_formats.minutes",
        access: "rooms.recordings.access_types.participant",
        enabledFormats: [],
        disabledFormats: ["notes", "podcast", "presentation", "screenshare"],
      },
      {
        description: "Recording 3",
        date: "08/18/2022, 10:39",
        duration: "1 app.time_formats.hour, 1 app.time_formats.minute",
        access: "rooms.recordings.access_types.moderator",
        enabledFormats: ["podcast", "presentation"],
        disabledFormats: ["notes", "screenshare"],
      },
      {
        description: "Recording 4",
        date: "09/20/2022, 11:39",
        duration: "1 app.time_formats.minute",
        access: "rooms.recordings.access_types.owner",
        enabledFormats: ["notes", "screenshare"],
        disabledFormats: ["podcast", "presentation"],
      },
    ].entries()) {
      test(`shows ${recording.description}`, async ({
        page,
        baseURL,
        roomRecordings,
      }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");

        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

        const item = page.getByTestId("room-recording-item").nth(index);
        await expect(item).toContainText(recording.description);
        await expect(item).toContainText(recording.date);
        await expect(item).toContainText(recording.duration);
        await expect(item).toContainText(recording.access);

        const enabledFormats = item.getByTestId("recording-format-enabled");
        await expect(enabledFormats).toHaveCount(
          recording.enabledFormats.length,
        );
        await expect(enabledFormats).toContainText(
          recording.enabledFormats.map(
            (format) => "rooms.recordings.format_types." + format,
          ),
        );
        const disabledFormats = item.getByTestId("recording-format-disabled");
        await expect(disabledFormats).toHaveCount(
          recording.disabledFormats.length,
        );
        await expect(disabledFormats).toContainText(
          recording.disabledFormats.map(
            (format) => "rooms.recordings.format_types." + format,
          ),
        );

        await expect(
          item.getByTestId("room-recordings-view-button"),
        ).toBeVisible();
        await expect(
          item.getByTestId("room-recordings-edit-button"),
        ).toBeVisible();
        await expect(
          item.getByTestId("room-recordings-delete-button"),
        ).toBeVisible();
        await expect(
          item.getByTestId("room-recordings-download-button"),
        ).toBeVisible();

        const download = item.locator(
          'a[data-test="room-recordings-download-button"]',
        );
        await expect(download).toHaveAttribute(
          "href",
          baseURL + "/download/recording/" + roomRecordings.data[index].id,
        );
        await expect(download).toHaveAttribute("target", "_blank");
      });
    }

    test("shows the unlimited retention period message", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");

      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      const message = page.getByTestId("retention-period-message");
      await expect(message).toBeVisible();
      await expect(message).toContainText(
        "rooms.recordings.retention_period.title",
      );
      await expect(message).toContainText(
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
        roomRecordings,
      }) => {
        const release = await holdRequest(
          page,
          "**/api/v1/rooms/abc-def-123/recordings*",
          { json: roomRecordings },
        );

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

      test("enables the buttons after reloading", async ({
        page,
        baseURL,
        roomRecordings,
      }) => {
        const release = await holdRequest(
          page,
          "**/api/v1/rooms/abc-def-123/recordings*",
          { json: roomRecordings },
        );

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
          baseURL + "/download/recording/" + roomRecordings.data[0].id,
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
    test.beforeEach(async ({ page, room }) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });
    });

    test("loads the recordings with the room auth token", async ({
      page,
      roomRecordings,
    }) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;

      const authRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/auth",
      );
      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

      await page.goto("/rooms/abc-def-123#accessCode=123456789&tab=recordings");

      await authRequest;
      expect(queryOf(await recordingsRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });

      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=recordings/);

      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      const item = page.getByTestId("room-recording-item").first();
      await expect(item).toContainText("Recording 1");
      await expect(item).toContainText("08/17/2022, 11:20");
      await expect(item).toContainText("20 app.time_formats.minutes");
      await expect(
        item.getByTestId("room-recordings-view-button"),
      ).toBeVisible();
      await expect(item).not.toContainText(
        "rooms.recordings.access_types.everyone",
      );
      await expect(item.getByTestId("recording-format-enabled")).toHaveCount(0);
      await expect(item.getByTestId("recording-format-disabled")).toHaveCount(
        0,
      );
      await expect(
        item.getByTestId("room-recordings-download-button"),
      ).toHaveCount(0);
      await expect(item.getByTestId("room-recordings-edit-button")).toHaveCount(
        0,
      );
      await expect(
        item.getByTestId("room-recordings-delete-button"),
      ).toHaveCount(0);

      const message = page.getByTestId("retention-period-message");
      await expect(message).toBeVisible();
      await expect(message).toContainText(
        "rooms.recordings.retention_period.title",
      );
      await expect(message).toContainText(
        "rooms.recordings.retention_period.unlimited",
      );
    });

    test("resets the room auth token and shows an error on an invalid token", async ({
      page,
      room,
    }) => {
      // The room is only authenticated with the token, it gets reloaded without it after the error
      await page.route(
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        (route) => {
          room.data.authenticated =
            queryOf(route.request()).room_auth_token !== undefined;
          return route.fulfill({ json: room });
        },
      );
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/recordings*", {
        status: 401,
        json: { message: "invalid_auth_token" },
      });

      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );
      const roomReloadRequest = page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123" &&
          queryOf(request).room_auth_token === undefined,
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
      room,
    }) => {
      // First the room is authenticated, after the error the reloaded room is not
      let roomRequests = 0;
      await page.route(
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        (route) => {
          room.data.authenticated = roomRequests++ === 0;
          return route.fulfill({ json: room });
        },
      );
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/recordings*", {
        status: 403,
        json: { message: "require_code" },
      });

      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );
      const roomReloadRequest = page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123" &&
          roomRequests >= 1,
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

    test.beforeEach(async ({ room }) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;
    });

    test("loads the recordings with the room auth token", async ({
      page,
      roomRecordings,
    }) => {
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;

      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
      );

      expect(queryOf(await recordingsRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });

      await expect(
        page.getByText("rooms.recordings.title").first(),
      ).toBeVisible();

      await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
      const item = page.getByTestId("room-recording-item").first();
      await expect(item).toContainText("Recording 1");
      await expect(item).toContainText("08/17/2022, 05:20");
      await expect(item).toContainText("20 app.time_formats.minutes");
      await expect(
        item.getByTestId("room-recordings-view-button"),
      ).toBeVisible();
      await expect(item).not.toContainText(
        "rooms.recordings.access_types.everyone",
      );
      await expect(item.getByTestId("recording-format-enabled")).toHaveCount(0);
      await expect(item.getByTestId("recording-format-disabled")).toHaveCount(
        0,
      );
      await expect(
        item.getByTestId("room-recordings-download-button"),
      ).toHaveCount(0);
      await expect(item.getByTestId("room-recordings-edit-button")).toHaveCount(
        0,
      );
      await expect(
        item.getByTestId("room-recordings-delete-button"),
      ).toHaveCount(0);

      const message = page.getByTestId("retention-period-message");
      await expect(message).toBeVisible();
      await expect(message).toContainText(
        "rooms.recordings.retention_period.title",
      );
      await expect(message).toContainText(
        "rooms.recordings.retention_period.unlimited",
      );
    });

    test("shows an error and redirects if the personalized link is invalid", async ({
      page,
    }) => {
      // The first authentication is valid, the authentication after the recordings error is not
      let authRequests = 0;
      await page.route("**/api/v1/rooms/abc-def-123/auth", (route) =>
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
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/recordings*", {
        status: 401,
        json: { message: "invalid_auth_token" },
      });

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
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
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/recordings*", {
        status: 420,
        json: { message: "guests_only" },
      });

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
      );

      await expectToastAndClose(page, "app.flash.guests_only");

      await expect(page).not.toHaveURL(/\/rooms/);
    });
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
    }) => {
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/recordings*", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/rooms/abc-def-123#tab=recordings");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );

      const search = page.getByTestId("room-recordings-search");
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(
        page.getByTestId("filter-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(
        sortGroup
          .getByTestId("sorting-type-dropdown")
          .locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(
        page.getByTestId("room-recordings-reload-button"),
      ).toBeEnabled();
    });

    test("reloads the recordings after a server error", async ({
      page,
      roomRecordings,
    }) => {
      await page.route(
        "**/api/v1/rooms/abc-def-123/recordings*",
        (route) => route.fulfill({ status: 500, json: { message: "Test" } }),
        { times: 1 },
      );

      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // The reload is answered with the first of three pages
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.last_page = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

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
      test.beforeEach(async ({ page, roomRecordings }) => {
        roomRecordings.meta.per_page = 1;
        roomRecordings.meta.last_page = 3;
        roomRecordings.meta.total = 3;
        roomRecordings.meta.total_no_filter = 3;
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

        await page.route(
          "**/api/v1/rooms/abc-def-123/recordings*",
          (route) => route.fulfill({ status: 500, json: { message: "Test" } }),
          { times: 1 },
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("shows the overlay and the error on a server error", async ({
        page,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );

        const search = page.getByTestId("room-recordings-search");
        const sortGroup = page.getByTestId("sorting-type-inputgroup");
        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();
        await expect(
          page.getByTestId("filter-dropdown").locator(".p-select-label"),
        ).not.toHaveAttribute("aria-disabled", "true");
        await expect(
          sortGroup
            .getByTestId("sorting-type-dropdown")
            .locator(".p-select-label"),
        ).not.toHaveAttribute("aria-disabled", "true");
        await expect(sortGroup.locator("button")).toBeEnabled();
        await expect(
          page.getByTestId("room-recordings-reload-button"),
        ).toBeEnabled();
      });

      test("reloads the first page", async ({ page }) => {
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );
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
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/recordings*", {
        status: 404,
        json: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      });

      await page.goto("/rooms/abc-def-123#tab=recordings");

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });

    test.describe("as guest", () => {
      test.use({ authenticated: false });

      test("redirects to the 404 page if the room is not found", async ({
        page,
        room,
      }) => {
        room.data.current_user = null;
        await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/recordings*",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );

        await page.goto("/rooms/abc-def-123#tab=recordings");

        await expect(page).toHaveURL((url) => url.pathname === "/404");
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
    roomRecordings,
  }) => {
    roomRecordings.meta.per_page = 1;
    roomRecordings.meta.last_page = 2;
    roomRecordings.meta.total = 2;
    roomRecordings.meta.total_no_filter = 2;

    await page.goto("/rooms/abc-def-123#tab=recordings");
    await expect(page.getByTestId("room-recording-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the recordings
    const requests = [];
    await page.route("**/api/v1/rooms/abc-def-123/recordings*", (route) => {
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

      test("shows only the view button", async ({
        page,
        room,
        roomRecordings,
      }) => {
        room.data.current_user = null;
        roomRecordings.data = roomRecordings.data.slice(0, 1);
        roomRecordings.meta.to = 1;
        roomRecordings.meta.total = 1;
        roomRecordings.meta.total_no_filter = 1;

        await page.goto("/rooms/abc-def-123#tab=recordings");

        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        const item = page.getByTestId("room-recording-item").first();
        await expect(item).toContainText("Recording 1");
        await expect(item).toContainText("08/17/2022, 05:20");
        await expect(item).toContainText("20 app.time_formats.minutes");
        await expect(
          item.getByTestId("room-recordings-view-button"),
        ).toBeVisible();
        await expect(item).not.toContainText(
          "rooms.recordings.access_types.everyone",
        );
        await expect(item.getByTestId("recording-format-enabled")).toHaveCount(
          0,
        );
        await expect(item.getByTestId("recording-format-disabled")).toHaveCount(
          0,
        );
        await expect(
          item.getByTestId("room-recordings-download-button"),
        ).toHaveCount(0);
        await expect(
          item.getByTestId("room-recordings-edit-button"),
        ).toHaveCount(0);
        await expect(
          item.getByTestId("room-recordings-delete-button"),
        ).toHaveCount(0);

        const message = page.getByTestId("retention-period-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText(
          "rooms.recordings.retention_period.title",
        );
        await expect(message).toContainText(
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });

    test.describe("with rooms.viewAll permission", () => {
      test.beforeEach(async ({ page, room, currentUser }) => {
        currentUser.data.permissions = ["rooms.viewAll"];
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll"];

        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      for (const [index, recording] of [
        {
          description: "Recording 1",
          date: "08/17/2022, 11:20",
          duration: "20 app.time_formats.minutes",
          access: "rooms.recordings.access_types.everyone",
        },
        {
          description: "Recording 2",
          date: "08/17/2022, 10:00",
          duration: "1 app.time_formats.hour, 0 app.time_formats.minutes",
          access: "rooms.recordings.access_types.participant",
        },
        {
          description: "Recording 3",
          date: "08/18/2022, 10:39",
          duration: "1 app.time_formats.hour, 1 app.time_formats.minute",
          access: "rooms.recordings.access_types.moderator",
        },
        {
          description: "Recording 4",
          date: "09/20/2022, 11:39",
          duration: "1 app.time_formats.minute",
          access: "rooms.recordings.access_types.owner",
        },
      ].entries()) {
        test(`shows only the view button for ${recording.description}`, async ({
          page,
        }) => {
          const item = page.getByTestId("room-recording-item").nth(index);
          await expect(item).toContainText(recording.description);
          await expect(item).toContainText(recording.date);
          await expect(item).toContainText(recording.duration);
          await expect(
            item.getByTestId("room-recordings-view-button"),
          ).toBeVisible();
          await expect(item).not.toContainText(recording.access);
          await expect(
            item.getByTestId("recording-format-enabled"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("recording-format-disabled"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-recordings-download-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-recordings-edit-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-recordings-delete-button"),
          ).toHaveCount(0);
        });
      }

      test("shows the retention period message", async ({ page }) => {
        const message = page.getByTestId("retention-period-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText(
          "rooms.recordings.retention_period.title",
        );
        await expect(message).toContainText(
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });

    test.describe("as co-owner", () => {
      test.beforeEach(async ({ page, room }) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
        room.data.is_co_owner = true;

        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      for (const [index, recording] of [
        {
          description: "Recording 1",
          date: "08/17/2022, 11:20",
          duration: "20 app.time_formats.minutes",
          access: "rooms.recordings.access_types.everyone",
          enabledFormats: ["notes", "podcast", "presentation", "screenshare"],
          disabledFormats: [],
        },
        {
          description: "Recording 2",
          date: "08/17/2022, 10:00",
          duration: "1 app.time_formats.hour, 0 app.time_formats.minutes",
          access: "rooms.recordings.access_types.participant",
          enabledFormats: [],
          disabledFormats: ["notes", "podcast", "presentation", "screenshare"],
        },
        {
          description: "Recording 3",
          date: "08/18/2022, 10:39",
          duration: "1 app.time_formats.hour, 1 app.time_formats.minute",
          access: "rooms.recordings.access_types.moderator",
          enabledFormats: ["podcast", "presentation"],
          disabledFormats: ["notes", "screenshare"],
        },
        {
          description: "Recording 4",
          date: "09/20/2022, 11:39",
          duration: "1 app.time_formats.minute",
          access: "rooms.recordings.access_types.owner",
          enabledFormats: ["notes", "screenshare"],
          disabledFormats: ["podcast", "presentation"],
        },
      ].entries()) {
        test(`shows all details and buttons for ${recording.description}`, async ({
          page,
        }) => {
          const item = page.getByTestId("room-recording-item").nth(index);
          await expect(item).toContainText(recording.description);
          await expect(item).toContainText(recording.date);
          await expect(item).toContainText(recording.duration);
          await expect(item).toContainText(recording.access);

          const enabledFormats = item.getByTestId("recording-format-enabled");
          await expect(enabledFormats).toHaveCount(
            recording.enabledFormats.length,
          );
          await expect(enabledFormats).toContainText(
            recording.enabledFormats.map(
              (format) => "rooms.recordings.format_types." + format,
            ),
          );
          const disabledFormats = item.getByTestId("recording-format-disabled");
          await expect(disabledFormats).toHaveCount(
            recording.disabledFormats.length,
          );
          await expect(disabledFormats).toContainText(
            recording.disabledFormats.map(
              (format) => "rooms.recordings.format_types." + format,
            ),
          );

          await expect(
            item.getByTestId("room-recordings-view-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-recordings-edit-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-recordings-delete-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-recordings-download-button"),
          ).toBeVisible();
        });
      }

      test("shows the retention period message", async ({ page }) => {
        const message = page.getByTestId("retention-period-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText(
          "rooms.recordings.retention_period.title",
        );
        await expect(message).toContainText(
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });

    test.describe("with rooms.manage permission", () => {
      test.beforeEach(async ({ page, room, currentUser }) => {
        currentUser.data.permissions = ["rooms.viewAll", "rooms.manage"];
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll", "rooms.manage"];

        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);
      });

      for (const [index, recording] of [
        {
          description: "Recording 1",
          date: "08/17/2022, 11:20",
          duration: "20 app.time_formats.minutes",
          access: "rooms.recordings.access_types.everyone",
          enabledFormats: ["notes", "podcast", "presentation", "screenshare"],
          disabledFormats: [],
        },
        {
          description: "Recording 2",
          date: "08/17/2022, 10:00",
          duration: "1 app.time_formats.hour, 0 app.time_formats.minutes",
          access: "rooms.recordings.access_types.participant",
          enabledFormats: [],
          disabledFormats: ["notes", "podcast", "presentation", "screenshare"],
        },
        {
          description: "Recording 3",
          date: "08/18/2022, 10:39",
          duration: "1 app.time_formats.hour, 1 app.time_formats.minute",
          access: "rooms.recordings.access_types.moderator",
          enabledFormats: ["podcast", "presentation"],
          disabledFormats: ["notes", "screenshare"],
        },
        {
          description: "Recording 4",
          date: "09/20/2022, 11:39",
          duration: "1 app.time_formats.minute",
          access: "rooms.recordings.access_types.owner",
          enabledFormats: ["notes", "screenshare"],
          disabledFormats: ["podcast", "presentation"],
        },
      ].entries()) {
        test(`shows all details and buttons for ${recording.description}`, async ({
          page,
        }) => {
          const item = page.getByTestId("room-recording-item").nth(index);
          await expect(item).toContainText(recording.description);
          await expect(item).toContainText(recording.date);
          await expect(item).toContainText(recording.duration);
          await expect(item).toContainText(recording.access);

          const enabledFormats = item.getByTestId("recording-format-enabled");
          await expect(enabledFormats).toHaveCount(
            recording.enabledFormats.length,
          );
          await expect(enabledFormats).toContainText(
            recording.enabledFormats.map(
              (format) => "rooms.recordings.format_types." + format,
            ),
          );
          const disabledFormats = item.getByTestId("recording-format-disabled");
          await expect(disabledFormats).toHaveCount(
            recording.disabledFormats.length,
          );
          await expect(disabledFormats).toContainText(
            recording.disabledFormats.map(
              (format) => "rooms.recordings.format_types." + format,
            ),
          );

          await expect(
            item.getByTestId("room-recordings-view-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-recordings-edit-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-recordings-delete-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-recordings-download-button"),
          ).toBeVisible();
        });
      }

      test("shows the retention period message", async ({ page }) => {
        const message = page.getByTestId("retention-period-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText(
          "rooms.recordings.retention_period.title",
        );
        await expect(message).toContainText(
          'rooms.recordings.retention_period.days_{"days":365}',
        );
      });
    });
  });

  test.describe("search", () => {
    test("loads the recordings without a search query", async ({ page }) => {
      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

      await page.goto("/rooms/abc-def-123#tab=recordings");

      const query = queryOf(await recordingsRequest);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no recordings match the search query", async ({
      page,
      roomRecordings,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      roomRecordings.data = [];
      roomRecordings.meta.from = null;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 0;
      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

      await page
        .getByTestId("room-recordings-search")
        .locator("input")
        .fill("Test");
      await page
        .getByTestId("room-recordings-search")
        .locator("button")
        .click();

      expect(queryOf(await recordingsRequest)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("app.filter_no_result")).toBeVisible();
      await expect(page.getByTestId("room-recording-item")).toHaveCount(0);
    });

    test("shows a message if there are no recordings in the room", async ({
      page,
      roomRecordings,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=recordings");
      await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

      roomRecordings.data = [];
      roomRecordings.meta.from = null;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 0;
      roomRecordings.meta.total_no_filter = 0;
      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

      await page
        .getByTestId("room-recordings-search")
        .locator("input")
        .fill("Test2");
      await page
        .getByTestId("room-recordings-search")
        .locator("input")
        .press("Enter");

      expect(queryOf(await recordingsRequest)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(page.getByText("rooms.recordings.nodata")).toBeVisible();
      await expect(page.getByTestId("room-recording-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page, roomRecordings }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

        roomRecordings.meta.per_page = 1;
        roomRecordings.meta.last_page = 2;
        roomRecordings.meta.total = 2;
        roomRecordings.meta.total_no_filter = 2;
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

        await page
          .getByTestId("room-recordings-search")
          .locator("input")
          .fill("Recording");
        await page
          .getByTestId("room-recordings-search")
          .locator("button")
          .click();

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
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await recordingsRequest)).toMatchObject({
          query: "Recording",
          page: "2",
        });

        await expect(
          page.getByTestId("room-recordings-search").locator("input"),
        ).toHaveValue("Recording");
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-recording-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");
      });

      test("resets the page when changing the search query", async ({
        page,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");

        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

        await page
          .getByTestId("room-recordings-search")
          .locator("input")
          .fill("Record");
        await page
          .getByTestId("room-recordings-search")
          .locator("button")
          .click();

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
      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

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
        roomRecordings,
      }) => {
        roomRecordings.data = [];
        roomRecordings.meta.from = null;
        roomRecordings.meta.to = null;
        roomRecordings.meta.total = 0;
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

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
        roomRecordings,
      }) => {
        roomRecordings.data = [];
        roomRecordings.meta.from = null;
        roomRecordings.meta.to = null;
        roomRecordings.meta.total = 0;
        roomRecordings.meta.total_no_filter = 0;
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

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
        test.beforeEach(async ({ page, roomRecordings }) => {
          roomRecordings.meta.per_page = 1;
          roomRecordings.meta.last_page = 2;
          roomRecordings.meta.total = 2;
          roomRecordings.meta.total_no_filter = 2;
          const recordingsRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/recordings*",
          );

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
          const recordingsRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/recordings*",
          );

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
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-recording-item").first(),
          ).toContainText("Recording 2");

          const recordingsRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/recordings*",
          );

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
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          const recordingsRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/recordings*",
          );

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
      const recordingsRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/recordings*",
      );

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
      test.beforeEach(async ({ page, roomRecordings }) => {
        await page.goto("/rooms/abc-def-123#tab=recordings");
        await expect(page.getByTestId("room-recording-item")).toHaveCount(4);

        roomRecordings.meta.per_page = 1;
        roomRecordings.meta.last_page = 4;
        roomRecordings.meta.total = 4;
        roomRecordings.meta.total_no_filter = 4;
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

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
        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

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
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-recording-item").first(),
        ).toContainText("Recording 2");

        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();

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
        const sortRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        await sortRequest;
        await expectActivePage(page, 0);

        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

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
        const sortRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        await sortRequest;

        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        const recordingsRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/recordings*",
        );

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
