import { mergeTests } from "@playwright/test";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as postMessageToAppTest } from "../support/fixtures/postMessageToApp.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  holdApiRequest,
  expectActivePage,
  getRequestQuery,
  readFixture,
  unauthorized,
  forbidden,
  errorResponse,
  serverError,
  modelNotFound,
} from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  setValidRememberedParticipantName,
  selectFilter,
  selectSortType,
} from "../support/room.js";

const test = mergeTests(
  roomControllerTest,
  roomFileControllerTest,
  postMessageToAppTest,
  participantNameCheckTest,
);

test.use({ authenticated: true });

test.describe("Rooms view files", () => {
  test.beforeEach(async ({ page }) => {
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("load files", () => {
    test("shows the loading state", async ({
      page,
      roomFilesResponse,
      getRoomFilesApiMock,
    }) => {
      getRoomFilesApiMock.respondWith({ json: roomFilesResponse, hold: true });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-files").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);

      const search = page.getByTestId("room-files-search");
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
      await expect(page.getByTestId("room-files-reload-button")).toBeDisabled();
      await expect(page.getByTestId("room-files-upload-button")).toBeDisabled();

      getRoomFilesApiMock.release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(page.getByTestId("room-files-reload-button")).toBeEnabled();
      await expect(page.getByTestId("room-files-upload-button")).toBeEnabled();
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    for (const [index, file] of [
      {
        name: "File1.pdf",
        date: "Sep 21, 2020, 09:08",
        download: "rooms.files.download_allowed",
        useInMeeting: "rooms.files.not_available_in_next_meeting",
        isStartFile: false,
        url: "https://example.com/files/File1.pdf?signature=abc123",
      },
      {
        name: "File2.pdf",
        date: "Sep 21, 2020, 09:08",
        download: "rooms.files.download_allowed",
        useInMeeting: "rooms.files.available_in_next_meeting",
        isStartFile: true,
        url: "https://example.com/files/File2.pdf?signature=def456",
      },
      {
        name: "File3.pdf",
        date: "Sep 21, 2020, 09:09",
        download: "rooms.files.download_not_allowed",
        useInMeeting: "rooms.files.not_available_in_next_meeting",
        isStartFile: false,
        url: "https://example.com/files/File3.pdf?signature=ghi789",
      },
    ].entries()) {
      test(`shows ${file.name}`, async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=files");

        await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        const item = page.getByTestId("room-file-item").nth(index);
        await expect(item).toContainText(file.name);
        await expect(item).toContainText(file.date);
        await expect(item).toContainText(file.download);
        await expect(item).toContainText(file.useInMeeting);
        await expect(
          item.getByTestId("room-files-download-button"),
        ).toBeEnabled();
        await expect(
          item.getByTestId("room-files-configure-button"),
        ).toBeEnabled();
        await expect(
          item.getByTestId("room-files-delete-button"),
        ).toBeEnabled();

        if (file.isStartFile) {
          await expect(item).toContainText("rooms.files.start_file");
          await expect(
            item.getByTestId("room-files-start-file-button"),
          ).toHaveCount(0);
        } else {
          await expect(item).not.toContainText("rooms.files.start_file");
          await expect(
            item.getByTestId("room-files-start-file-button"),
          ).toBeEnabled();
        }

        const anchor = item.locator(
          'a[data-test="room-files-download-button"]',
        );
        await expect(anchor).toHaveAttribute("href", file.url);
        await expect(anchor).toHaveAttribute("rel", "opener");
        await expect(anchor).toHaveAttribute("target", "_blank");
      });
    }

    test("shows the system default presentation", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");

      const systemDefault = page.getByTestId("room-file-system-default");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(systemDefault).toContainText("rooms.files.system_default");
      await expect(systemDefault).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(systemDefault).not.toContainText("rooms.files.start_file");
      await expect(
        systemDefault.locator(
          'a[data-test="room-files-download-system-default-button"]',
        ),
      ).toHaveAttribute("href", "Default.pdf");
    });

    test("shows the system default as start presentation if no file is the start file", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.data.forEach((file) => {
        file.is_start_file = false;
        file.use_in_meeting = false;
      });
      roomFilesResponse.start_file = null;
      roomFilesResponse.system_default.prefer_as_start = true;

      await page.goto("/rooms/abc-def-123#tab=files");

      const systemDefault = page.getByTestId("room-file-system-default");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(systemDefault).toContainText("rooms.files.system_default");
      await expect(systemDefault).toContainText("rooms.files.start_file");
      await expect(systemDefault).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(
        systemDefault.getByTestId("room-files-start-file-button"),
      ).toHaveCount(0);

      for (const item of await page.getByTestId("room-file-item").all()) {
        await expect(item).not.toContainText("rooms.files.start_file");
        await expect(
          item.getByTestId("room-files-start-file-button"),
        ).toBeVisible();
      }
    });

    test("shows the system default as start presentation if there are no files", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.data = [];
      roomFilesResponse.meta.from = null;
      roomFilesResponse.meta.to = null;
      roomFilesResponse.meta.total = 0;
      roomFilesResponse.meta.total_no_filter = 0;
      roomFilesResponse.start_file = null;
      roomFilesResponse.system_default.prefer_as_start = true;

      await page.goto("/rooms/abc-def-123#tab=files");

      const systemDefault = page.getByTestId("room-file-system-default");
      await expect(systemDefault).toContainText("rooms.files.start_file");
      await expect(systemDefault).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
      await expect(page.getByText("rooms.files.nodata")).toBeVisible();
    });

    test("shows the file as start presentation if the system default is preferred but not set", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.system_default.file = null;
      roomFilesResponse.system_default.prefer_as_start = true;

      await page.goto("/rooms/abc-def-123#tab=files");

      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(page.getByTestId("room-file-system-default")).toHaveCount(0);

      const item = page.getByTestId("room-file-item").nth(1);
      await expect(item).toContainText("File2.pdf");
      await expect(item).toContainText("rooms.files.download_allowed");
      await expect(item).toContainText("rooms.files.available_in_next_meeting");
      await expect(item).toContainText("rooms.files.start_file");
      await expect(
        item.getByTestId("room-files-start-file-button"),
      ).toHaveCount(0);
    });

    test.describe("reload", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=files");
        await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      });

      test("disables the buttons and shows the overlay while reloading", async ({
        page,
        roomFilesResponse,
      }) => {
        await holdApiRequest(page, "rooms/abc-def-123/files*", {
          json: roomFilesResponse,
        });

        await page.getByTestId("room-files-reload-button").click();

        await expect(page.getByTestId("overlay")).toBeVisible();

        const item = page.getByTestId("room-file-item").first();
        await expect(
          item.locator('button[data-test="room-files-download-button"]'),
        ).toBeDisabled();
        await expect(
          item.getByTestId("room-files-start-file-button"),
        ).toBeDisabled();
        await expect(
          item.getByTestId("room-files-configure-button"),
        ).toBeDisabled();
        await expect(
          item.locator('button[data-test="room-files-delete-button"]'),
        ).toBeDisabled();
      });

      test("enables the buttons and hides the overlay after reloading", async ({
        page,
        roomFilesResponse,
        getRoomFilesApiMock,
      }) => {
        getRoomFilesApiMock.respondWith({
          json: roomFilesResponse,
          hold: true,
        });

        await page.getByTestId("room-files-reload-button").click();
        await expect(page.getByTestId("overlay")).toBeVisible();

        getRoomFilesApiMock.release();

        await expect(page.getByTestId("overlay")).toBeHidden();

        const item = page.getByTestId("room-file-item").first();
        await expect(
          item.locator('a[data-test="room-files-download-button"]'),
        ).toHaveAttribute(
          "href",
          "https://example.com/files/File1.pdf?signature=abc123",
        );
        await expect(
          item.getByTestId("room-files-start-file-button"),
        ).toBeEnabled();
        await expect(
          item.getByTestId("room-files-configure-button"),
        ).toBeEnabled();
        await expect(
          item.locator('button[data-test="room-files-delete-button"]'),
        ).toBeEnabled();
      });
    });
  });

  test.describe("access code", () => {
    test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

    test.beforeEach(async ({ roomResponse, postRoomAuthApiMock }) => {
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      postRoomAuthApiMock.respondWith({
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });
    });

    test("loads the files with the room auth token", async ({ page }) => {
      const authRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/auth",
      );
      const roomRequest = page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123",
      );
      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );

      await page.goto("/rooms/abc-def-123#accessCode=123456789");

      await authRequest;
      await roomRequest;
      expect(getRequestQuery(await filesRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });

      await expect(page.getByText("rooms.files.title").first()).toBeVisible();
      await expect(page.getByTestId("room-files-upload-button")).toHaveCount(0);
      await expect(page.getByTestId("room-file-system-default")).toHaveCount(0);
    });

    for (const [index, file] of [
      {
        name: "File1.pdf",
        date: "Sep 21, 2020, 09:08",
        url: "https://example.com/files/File1.pdf?signature=abc123",
      },
      {
        name: "File2.pdf",
        date: "Sep 21, 2020, 09:08",
        url: "https://example.com/files/File2.pdf?signature=def456",
      },
    ].entries()) {
      test(`shows ${file.name} with the room auth token in the download link`, async ({
        page,
      }) => {
        await page.goto("/rooms/abc-def-123#accessCode=123456789");

        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        const item = page.getByTestId("room-file-item").nth(index);
        await expect(item).toContainText(file.name);
        await expect(item).toContainText(file.date);
        await expect(
          item.getByTestId("room-files-download-button"),
        ).toBeEnabled();
        for (const text of [
          "rooms.files.download_allowed",
          "rooms.files.download_not_allowed",
          "rooms.files.available_in_next_meeting",
          "rooms.files.not_available_in_next_meeting",
          "rooms.files.start_file",
        ]) {
          await expect(item).not.toContainText(text);
        }
        await expect(
          item.getByTestId("room-files-configure-button"),
        ).toHaveCount(0);
        await expect(item.getByTestId("room-files-delete-button")).toHaveCount(
          0,
        );
        await expect(
          item.getByTestId("room-files-start-file-button"),
        ).toHaveCount(0);

        const anchor = item.locator(
          'a[data-test="room-files-download-button"]',
        );
        await expect(anchor).toHaveAttribute(
          "href",
          file.url + "&room_auth_token=roomAuthToken&room_auth_token_type=0",
        );
        await expect(anchor).toHaveAttribute("rel", "opener");
        await expect(anchor).toHaveAttribute("target", "_blank");
      });
    }

    test("resets the room auth token and shows an error on an invalid token", async ({
      page,
      roomResponse,
      getRoomFilesApiMock,
    }) => {
      // The room is only authenticated with the token, it gets reloaded without it after the error
      await page.route(
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        (route) => {
          roomResponse.data.authenticated =
            getRequestQuery(route.request()).room_auth_token !== undefined;
          return route.fulfill({ json: roomResponse });
        },
      );
      getRoomFilesApiMock.respondWith(unauthorized("invalid_auth_token"));

      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      const roomReloadRequest = page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123" &&
          getRequestQuery(request).room_auth_token === undefined,
      );

      await page.goto("/rooms/abc-def-123#accessCode=123456789");

      expect(getRequestQuery(await filesRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });

      const reloadQuery = getRequestQuery(await roomReloadRequest);
      expect(reloadQuery.room_auth_token).toBeUndefined();
      expect(reloadQuery.room_auth_token_type).toBeUndefined();

      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid").first(),
      ).toBeVisible();
    });

    test("resets the room auth token and shows an error if a code is required", async ({
      page,
      roomResponse,
      getRoomFilesApiMock,
    }) => {
      // First the room is authenticated, after the error the reloaded room is not
      let roomRequests = 0;
      await page.route(
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        (route) => {
          roomResponse.data.authenticated = roomRequests++ === 0;
          return route.fulfill({ json: roomResponse });
        },
      );
      getRoomFilesApiMock.respondWith(forbidden("require_code"));

      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      const roomReloadRequest = page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123" &&
          roomRequests >= 1,
      );

      await page.goto("/rooms/abc-def-123#tab=files");

      const filesQuery = getRequestQuery(await filesRequest);
      expect(filesQuery.room_auth_token).toBeUndefined();
      expect(filesQuery.room_auth_token_type).toBeUndefined();

      const reloadQuery = getRequestQuery(await roomReloadRequest);
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

    test.beforeEach(async ({ roomResponse }) => {
      roomResponse.data.username = "Max Doe";
      roomResponse.data.current_user = null;
    });

    test.describe("with a valid link", () => {
      test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

      test.beforeEach(async ({ postRoomAuthApiMock }) => {
        postRoomAuthApiMock.respondWith({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 1 } },
        });
      });

      test("loads the files with the room auth token", async ({ page }) => {
        const authRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/auth",
        );
        const roomRequest = page.waitForRequest(
          (request) =>
            new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123",
        );
        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );

        await page.goto(
          "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );

        await authRequest;
        await roomRequest;
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });

        await expect(page.getByText("rooms.files.title").first()).toBeVisible();
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        await expect(page.getByTestId("room-files-upload-button")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("room-file-system-default")).toHaveCount(
          0,
        );
      });

      for (const [index, file] of [
        {
          name: "File1.pdf",
          date: "Sep 21, 2020, 03:08",
          url: "https://example.com/files/File1.pdf?signature=abc123",
        },
        {
          name: "File2.pdf",
          date: "Sep 21, 2020, 03:08",
          url: "https://example.com/files/File2.pdf?signature=def456",
        },
      ].entries()) {
        test(`shows ${file.name} with the room auth token in the download link`, async ({
          page,
        }) => {
          await page.goto(
            "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          );

          await expect(page.getByTestId("room-file-item")).toHaveCount(2);
          const item = page.getByTestId("room-file-item").nth(index);
          await expect(item).toContainText(file.name);
          await expect(item).toContainText(file.date);
          await expect(
            item.getByTestId("room-files-download-button"),
          ).toBeEnabled();
          for (const text of [
            "rooms.files.download_allowed",
            "rooms.files.download_not_allowed",
            "rooms.files.available_in_next_meeting",
            "rooms.files.not_available_in_next_meeting",
            "rooms.files.start_file",
          ]) {
            await expect(item).not.toContainText(text);
          }
          await expect(
            item.getByTestId("room-files-configure-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-files-delete-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-files-start-file-button"),
          ).toHaveCount(0);

          const anchor = item.locator(
            'a[data-test="room-files-download-button"]',
          );
          await expect(anchor).toHaveAttribute(
            "href",
            file.url + "&room_auth_token=roomAuthToken&room_auth_token_type=1",
          );
          await expect(anchor).toHaveAttribute("rel", "opener");
          await expect(anchor).toHaveAttribute("target", "_blank");
        });
      }
    });

    test("shows an error and redirects if the personalized link is invalid", async ({
      page,
      getRoomFilesApiMock,
    }) => {
      // The first authentication is valid, the authentication after the files error is not
      let authRequests = 0;
      await page.route("**/api/v1/rooms/abc-def-123/auth", (route) =>
        authRequests++ === 0
          ? route.fulfill({
              status: 201,
              json: { data: { id: "roomAuthToken", type: 1 } },
            })
          : route.fulfill(unauthorized("invalid_personalized_link")),
      );
      getRoomFilesApiMock.respondWith(unauthorized("invalid_auth_token"));

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
      await expect(
        page.getByText("rooms.invalid_personalized_link").first(),
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
      postRoomAuthApiMock,
      getRoomFilesApiMock,
    }) => {
      postRoomAuthApiMock.respondWith({
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });
      getRoomFilesApiMock.respondWith(errorResponse(420, "guests_only"));

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      await expectToastAndClose(page, "app.flash.guests_only");

      await expect(page).not.toHaveURL(/\/rooms/);
    });
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
      getRoomFilesApiMock,
    }) => {
      getRoomFilesApiMock.respondWith(serverError());

      await page.goto("/rooms/abc-def-123#tab=files");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );

      const search = page.getByTestId("room-files-search");
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
      await expect(page.getByTestId("room-files-reload-button")).toBeEnabled();
    });

    test("reloads the files after a server error", async ({
      page,
      roomFilesResponse,
    }) => {
      await page.route(
        "**/api/v1/rooms/abc-def-123/files*",
        (route) => route.fulfill(serverError()),
        { times: 1 },
      );

      await page.goto("/rooms/abc-def-123#tab=files");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // The reload is answered with the first of three pages
      roomFilesResponse.meta.per_page = 1;
      roomFilesResponse.meta.last_page = 3;

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      await expect(page.getByTestId("room-file-item")).toHaveCount(1);
      await expect(page.getByTestId("room-file-item").first()).toContainText(
        "File1.pdf",
      );
    });

    test.describe("on changing the page", () => {
      test.beforeEach(async ({ page, roomFilesResponse }) => {
        roomFilesResponse.meta.per_page = 1;
        roomFilesResponse.meta.last_page = 3;
        await page.goto("/rooms/abc-def-123#tab=files");
        await expect(page.getByTestId("room-file-item")).toHaveCount(1);

        await page.route(
          "**/api/v1/rooms/abc-def-123/files*",
          (route) => route.fulfill(serverError()),
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

        const search = page.getByTestId("room-files-search");
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
          page.getByTestId("room-files-reload-button"),
        ).toBeEnabled();
      });

      test("reloads the first page", async ({ page }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await page.getByTestId("loading-retry-button").click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          page: "1",
        });

        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File1.pdf",
        );

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectActivePage(page, 0);
      });
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
      getRoomFilesApiMock,
    }) => {
      await interceptRoomIndexRequests(page);
      getRoomFilesApiMock.respondWith(modelNotFound("room", ["abc-def-123"]));

      await page.goto("/rooms/abc-def-123#tab=files");

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
        roomResponse,
        getRoomFilesApiMock,
      }) => {
        roomResponse.data.current_user = null;
        getRoomFilesApiMock.respondWith(modelNotFound("room", ["abc-def-123"]));

        await page.goto("/rooms/abc-def-123#tab=files");

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
    roomFilesResponse,
  }) => {
    roomFilesResponse.meta.per_page = 1;
    roomFilesResponse.meta.last_page = 2;
    roomFilesResponse.meta.total = 2;
    roomFilesResponse.meta.total_no_filter = 2;
    roomFilesResponse.data[0].role = 3;

    await page.goto("/rooms/abc-def-123#tab=files");
    await expect(page.getByTestId("room-file-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the files
    const requests = [];
    await page.route("**/api/v1/rooms/abc-def-123/files*", (route) => {
      requests.push(getRequestQuery(route.request()));
      const files = readFixture("roomFiles.json");
      if (requests.length === 1) {
        files.data = [];
        files.meta.current_page = 2;
        files.meta.from = null;
        files.meta.per_page = 2;
        files.meta.to = null;
        files.meta.total = 2;
        files.meta.total_no_filter = 2;
      } else {
        files.data = files.data.slice(0, 2);
        files.meta.per_page = 2;
        files.meta.to = 2;
        files.meta.total = 2;
        files.meta.total_no_filter = 2;
      }
      return route.fulfill({ json: files });
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for the second page, then the page is reset
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[0]).toMatchObject({ page: "2" });
    expect(requests[1]).toMatchObject({ page: "1" });

    await expect(page.getByTestId("room-file-item")).toHaveCount(2);
  });

  test.describe("permissions", () => {
    test.describe("as guest", () => {
      test.use({
        authenticated: false,
        roomFilesFixtureName: "roomFilesNoDetails.json",
      });

      test.beforeEach(async ({ roomResponse }) => {
        roomResponse.data.current_user = null;
      });

      test("shows only the download buttons without terms of use", async ({
        page,
      }) => {
        await page.goto("/rooms/abc-def-123");

        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        await expect(page.getByTestId("room-files-upload-button")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("terms-of-use-message")).toHaveCount(0);
        await expect(page.getByTestId("room-file-system-default")).toHaveCount(
          0,
        );

        for (const [index, file] of [
          {
            name: "File1.pdf",
            date: "Sep 21, 2020, 03:08",
            url: "https://example.com/files/File1.pdf?signature=abc123",
          },
          {
            name: "File2.pdf",
            date: "Sep 21, 2020, 03:08",
            url: "https://example.com/files/File2.pdf?signature=def456",
          },
        ].entries()) {
          const item = page.getByTestId("room-file-item").nth(index);
          await expect(item).toContainText(file.name);
          await expect(item).toContainText(file.date);
          await expect(
            item.getByTestId("room-files-download-button"),
          ).toBeEnabled();
          for (const text of [
            "rooms.files.download_allowed",
            "rooms.files.download_not_allowed",
            "rooms.files.available_in_next_meeting",
            "rooms.files.not_available_in_next_meeting",
            "rooms.files.start_file",
          ]) {
            await expect(item).not.toContainText(text);
          }
          await expect(
            item.getByTestId("room-files-configure-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-files-delete-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-files-start-file-button"),
          ).toHaveCount(0);

          const anchor = item.locator(
            'a[data-test="room-files-download-button"]',
          );
          await expect(anchor).toHaveAttribute("href", file.url);
          await expect(anchor).toHaveAttribute("rel", "opener");
          await expect(anchor).toHaveAttribute("target", "_blank");
        }
      });

      test.describe("with terms of use", () => {
        test.beforeEach(async ({ page, configResponse }) => {
          configResponse.data.room.file_terms_of_use = "Test terms of use";
          await page.goto("/rooms/abc-def-123");
          await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        });

        test("shows the terms of use and only the download buttons", async ({
          page,
        }) => {
          await expect(
            page.getByTestId("room-files-upload-button"),
          ).toHaveCount(0);

          const message = page.getByTestId("terms-of-use-message");
          await expect(message).toBeVisible();
          await expect(message).toContainText("rooms.files.terms_of_use.title");
          await expect(message).toContainText("Test terms of use");
          await expect(message).toContainText(
            "rooms.files.terms_of_use.accept",
          );
          await expect(message.locator("#terms_of_use")).not.toBeChecked();
          await expect(
            page.getByTestId("room-file-system-default"),
          ).toHaveCount(0);

          // Without accepted terms of use the download is a button instead of a link
          for (const [index, file] of [
            { name: "File1.pdf", date: "Sep 21, 2020, 03:08" },
            { name: "File2.pdf", date: "Sep 21, 2020, 03:08" },
          ].entries()) {
            const item = page.getByTestId("room-file-item").nth(index);
            await expect(item).toContainText(file.name);
            await expect(item).toContainText(file.date);
            await expect(
              item.getByTestId("room-files-download-button"),
            ).toBeEnabled();
            for (const text of [
              "rooms.files.download_allowed",
              "rooms.files.download_not_allowed",
              "rooms.files.available_in_next_meeting",
              "rooms.files.not_available_in_next_meeting",
              "rooms.files.start_file",
            ]) {
              await expect(item).not.toContainText(text);
            }
            await expect(
              item.getByTestId("room-files-configure-button"),
            ).toHaveCount(0);
            await expect(
              item.getByTestId("room-files-delete-button"),
            ).toHaveCount(0);
            await expect(
              item.getByTestId("room-files-start-file-button"),
            ).toHaveCount(0);
          }
        });

        test("hides the terms of use after accepting them", async ({
          page,
        }) => {
          await page.locator("#terms_of_use").click();
          await expect(
            page.getByTestId("terms-of-use-required-info"),
          ).toHaveCount(0);

          await expect(
            page
              .getByTestId("terms-of-use-message")
              .getByText("Test terms of use"),
          ).toBeHidden();
          await expect(page.locator("#terms_of_use")).toBeHidden();
        });
      });
    });

    test.describe("with rooms.viewAll permission", () => {
      test.beforeEach(async ({ currentUserResponse, roomResponse }) => {
        currentUserResponse.data.permissions = ["rooms.viewAll"];
        roomResponse.data.owner = { id: 2, name: "Max Doe" };
        roomResponse.data.current_user.permissions = ["rooms.viewAll"];
      });

      test("shows only the download buttons without terms of use", async ({
        page,
      }) => {
        await page.goto("/rooms/abc-def-123#tab=files");

        await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        await expect(page.getByTestId("room-files-upload-button")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("terms-of-use-message")).toHaveCount(0);
        await expect(page.getByTestId("room-file-system-default")).toHaveCount(
          0,
        );

        for (const [index, file] of [
          {
            name: "File1.pdf",
            date: "Sep 21, 2020, 09:08",
            url: "https://example.com/files/File1.pdf?signature=abc123",
          },
          {
            name: "File2.pdf",
            date: "Sep 21, 2020, 09:08",
            url: "https://example.com/files/File2.pdf?signature=def456",
          },
          {
            name: "File3.pdf",
            date: "Sep 21, 2020, 09:09",
            url: "https://example.com/files/File3.pdf?signature=ghi789",
          },
        ].entries()) {
          const item = page.getByTestId("room-file-item").nth(index);
          await expect(item).toContainText(file.name);
          await expect(item).toContainText(file.date);
          await expect(
            item.getByTestId("room-files-download-button"),
          ).toBeEnabled();
          for (const text of [
            "rooms.files.download_allowed",
            "rooms.files.download_not_allowed",
            "rooms.files.available_in_next_meeting",
            "rooms.files.not_available_in_next_meeting",
            "rooms.files.start_file",
          ]) {
            await expect(item).not.toContainText(text);
          }
          await expect(
            item.getByTestId("room-files-configure-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-files-delete-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-files-start-file-button"),
          ).toHaveCount(0);

          const anchor = item.locator(
            'a[data-test="room-files-download-button"]',
          );
          await expect(anchor).toHaveAttribute("href", file.url);
          await expect(anchor).toHaveAttribute("rel", "opener");
          await expect(anchor).toHaveAttribute("target", "_blank");
        }
      });

      test.describe("with terms of use", () => {
        test.beforeEach(async ({ page, configResponse }) => {
          configResponse.data.room.file_terms_of_use = "Test terms of use";
          await page.goto("/rooms/abc-def-123#tab=files");
          await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        });

        test("shows the terms of use and only the download buttons", async ({
          page,
        }) => {
          await expect(
            page.getByTestId("room-files-upload-button"),
          ).toHaveCount(0);

          const message = page.getByTestId("terms-of-use-message");
          await expect(message).toBeVisible();
          await expect(message).toContainText("rooms.files.terms_of_use.title");
          await expect(message).toContainText("Test terms of use");
          await expect(message).toContainText(
            "rooms.files.terms_of_use.accept",
          );
          await expect(message.locator("#terms_of_use")).not.toBeChecked();
          await expect(
            page.getByTestId("room-file-system-default"),
          ).toHaveCount(0);

          // Without accepted terms of use the download is a button instead of a link
          for (const [index, file] of [
            { name: "File1.pdf", date: "Sep 21, 2020, 09:08" },
            { name: "File2.pdf", date: "Sep 21, 2020, 09:08" },
            { name: "File3.pdf", date: "Sep 21, 2020, 09:09" },
          ].entries()) {
            const item = page.getByTestId("room-file-item").nth(index);
            await expect(item).toContainText(file.name);
            await expect(item).toContainText(file.date);
            await expect(
              item.getByTestId("room-files-download-button"),
            ).toBeEnabled();
            for (const text of [
              "rooms.files.download_allowed",
              "rooms.files.download_not_allowed",
              "rooms.files.available_in_next_meeting",
              "rooms.files.not_available_in_next_meeting",
              "rooms.files.start_file",
            ]) {
              await expect(item).not.toContainText(text);
            }
            await expect(
              item.getByTestId("room-files-configure-button"),
            ).toHaveCount(0);
            await expect(
              item.getByTestId("room-files-delete-button"),
            ).toHaveCount(0);
            await expect(
              item.getByTestId("room-files-start-file-button"),
            ).toHaveCount(0);
          }
        });

        test("hides the terms of use after accepting them", async ({
          page,
        }) => {
          await page.locator("#terms_of_use").click();
          await expect(
            page.getByTestId("terms-of-use-required-info"),
          ).toHaveCount(0);

          await expect(
            page
              .getByTestId("terms-of-use-message")
              .getByText("Test terms of use"),
          ).toBeHidden();
          await expect(page.locator("#terms_of_use")).toBeHidden();
        });
      });
    });

    test.describe("as co-owner", () => {
      test.beforeEach(async ({ page, configResponse, roomResponse }) => {
        configResponse.data.room.file_terms_of_use = "Test terms of use";
        roomResponse.data.owner = { id: 2, name: "Max Doe" };
        roomResponse.data.is_member = true;
        roomResponse.data.is_co_owner = true;
        await page.goto("/rooms/abc-def-123#tab=files");
        await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      });

      test("shows the upload button and no terms of use", async ({ page }) => {
        await expect(page.getByTestId("terms-of-use-message")).toHaveCount(0);
        await expect(
          page.getByTestId("room-files-upload-button"),
        ).toBeVisible();
      });

      test("shows the system default presentation with all buttons", async ({
        page,
      }) => {
        const systemDefault = page.getByTestId("room-file-system-default");
        await expect(systemDefault).toContainText("rooms.files.system_default");
        await expect(systemDefault).toContainText(
          "rooms.files.available_in_next_meeting",
        );
        await expect(systemDefault).not.toContainText("rooms.files.start_file");
        await expect(
          systemDefault.getByTestId(
            "room-files-download-system-default-button",
          ),
        ).toBeEnabled();
        await expect(
          systemDefault.getByTestId("room-files-start-file-button"),
        ).toHaveText("rooms.files.set_start_file");
        await expect(
          systemDefault.getByTestId("room-files-start-file-button"),
        ).toBeEnabled();
      });

      for (const [index, file] of [
        {
          name: "File1.pdf",
          date: "Sep 21, 2020, 09:08",
          download: "rooms.files.download_allowed",
          useInMeeting: "rooms.files.not_available_in_next_meeting",
          isStartFile: false,
          url: "https://example.com/files/File1.pdf?signature=abc123",
        },
        {
          name: "File2.pdf",
          date: "Sep 21, 2020, 09:08",
          download: "rooms.files.download_allowed",
          useInMeeting: "rooms.files.available_in_next_meeting",
          isStartFile: true,
          url: "https://example.com/files/File2.pdf?signature=def456",
        },
        {
          name: "File3.pdf",
          date: "Sep 21, 2020, 09:09",
          download: "rooms.files.download_not_allowed",
          useInMeeting: "rooms.files.not_available_in_next_meeting",
          isStartFile: false,
          url: "https://example.com/files/File3.pdf?signature=ghi789",
        },
      ].entries()) {
        test(`shows ${file.name} with all buttons`, async ({ page }) => {
          const item = page.getByTestId("room-file-item").nth(index);
          await expect(item).toContainText(file.name);
          await expect(item).toContainText(file.date);
          await expect(item).toContainText(file.download);
          await expect(item).toContainText(file.useInMeeting);
          await expect(
            item.getByTestId("room-files-download-button"),
          ).toBeEnabled();
          await expect(
            item.getByTestId("room-files-configure-button"),
          ).toBeEnabled();
          await expect(
            item.getByTestId("room-files-delete-button"),
          ).toBeEnabled();

          if (file.isStartFile) {
            await expect(item).toContainText("rooms.files.start_file");
            await expect(
              item.getByTestId("room-files-start-file-button"),
            ).toHaveCount(0);
          } else {
            await expect(item).not.toContainText("rooms.files.start_file");
            await expect(
              item.getByTestId("room-files-start-file-button"),
            ).toBeEnabled();
          }

          const anchor = item.locator(
            'a[data-test="room-files-download-button"]',
          );
          await expect(anchor).toHaveAttribute("href", file.url);
          await expect(anchor).toHaveAttribute("rel", "opener");
          await expect(anchor).toHaveAttribute("target", "_blank");
        });
      }
    });

    test.describe("with rooms.manage permission", () => {
      test.beforeEach(
        async ({ page, currentUserResponse, configResponse, roomResponse }) => {
          configResponse.data.room.file_terms_of_use = "Test terms of use";
          currentUserResponse.data.permissions = [
            "rooms.viewAll",
            "rooms.manage",
          ];
          roomResponse.data.owner = { id: 2, name: "Max Doe" };
          roomResponse.data.current_user.permissions = [
            "rooms.viewAll",
            "rooms.manage",
          ];
          await page.goto("/rooms/abc-def-123#tab=files");
          await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        },
      );

      test("shows the upload button and no terms of use", async ({ page }) => {
        await expect(page.getByTestId("terms-of-use-message")).toHaveCount(0);
        await expect(
          page.getByTestId("room-files-upload-button"),
        ).toBeVisible();
      });

      test("shows the system default presentation with all buttons", async ({
        page,
      }) => {
        const systemDefault = page.getByTestId("room-file-system-default");
        await expect(systemDefault).toContainText("rooms.files.system_default");
        await expect(systemDefault).toContainText(
          "rooms.files.available_in_next_meeting",
        );
        await expect(systemDefault).not.toContainText("rooms.files.start_file");
        await expect(
          systemDefault.getByTestId(
            "room-files-download-system-default-button",
          ),
        ).toBeEnabled();
        await expect(
          systemDefault.getByTestId("room-files-start-file-button"),
        ).toHaveText("rooms.files.set_start_file");
        await expect(
          systemDefault.getByTestId("room-files-start-file-button"),
        ).toBeEnabled();
      });

      for (const [index, file] of [
        {
          name: "File1.pdf",
          date: "Sep 21, 2020, 09:08",
          download: "rooms.files.download_allowed",
          useInMeeting: "rooms.files.not_available_in_next_meeting",
          isStartFile: false,
          url: "https://example.com/files/File1.pdf?signature=abc123",
        },
        {
          name: "File2.pdf",
          date: "Sep 21, 2020, 09:08",
          download: "rooms.files.download_allowed",
          useInMeeting: "rooms.files.available_in_next_meeting",
          isStartFile: true,
          url: "https://example.com/files/File2.pdf?signature=def456",
        },
        {
          name: "File3.pdf",
          date: "Sep 21, 2020, 09:09",
          download: "rooms.files.download_not_allowed",
          useInMeeting: "rooms.files.not_available_in_next_meeting",
          isStartFile: false,
          url: "https://example.com/files/File3.pdf?signature=ghi789",
        },
      ].entries()) {
        test(`shows ${file.name} with all buttons`, async ({ page }) => {
          const item = page.getByTestId("room-file-item").nth(index);
          await expect(item).toContainText(file.name);
          await expect(item).toContainText(file.date);
          await expect(item).toContainText(file.download);
          await expect(item).toContainText(file.useInMeeting);
          await expect(
            item.getByTestId("room-files-download-button"),
          ).toBeEnabled();
          await expect(
            item.getByTestId("room-files-configure-button"),
          ).toBeEnabled();
          await expect(
            item.getByTestId("room-files-delete-button"),
          ).toBeEnabled();

          if (file.isStartFile) {
            await expect(item).toContainText("rooms.files.start_file");
            await expect(
              item.getByTestId("room-files-start-file-button"),
            ).toHaveCount(0);
          } else {
            await expect(item).not.toContainText("rooms.files.start_file");
            await expect(
              item.getByTestId("room-files-start-file-button"),
            ).toBeEnabled();
          }

          const anchor = item.locator(
            'a[data-test="room-files-download-button"]',
          );
          await expect(anchor).toHaveAttribute("href", file.url);
          await expect(anchor).toHaveAttribute("rel", "opener");
          await expect(anchor).toHaveAttribute("target", "_blank");
        });
      }
    });
  });

  test.describe("search", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("requests the first page without a search query", async ({ page }) => {
      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      await page.getByTestId("room-files-reload-button").click();
      const query = getRequestQuery(await filesRequest);

      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no files match the search query", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.data = [];
      roomFilesResponse.meta.from = null;
      roomFilesResponse.meta.to = null;
      roomFilesResponse.meta.total = 0;

      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      const search = page.getByTestId("room-files-search");
      await search.locator("input").fill("Test");
      await search.locator("button").click();
      expect(getRequestQuery(await filesRequest)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("app.filter_no_result")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test("shows a message if there are no files in the room and searches with enter", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.data = [];
      roomFilesResponse.meta.from = null;
      roomFilesResponse.meta.to = null;
      roomFilesResponse.meta.total = 0;
      roomFilesResponse.meta.total_no_filter = 0;

      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      await page
        .getByTestId("room-files-search")
        .locator("input")
        .fill("Test2");
      await page
        .getByTestId("room-files-search")
        .locator("input")
        .press("Enter");
      expect(getRequestQuery(await filesRequest)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(page.getByText("rooms.files.nodata")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test.describe("with files on two pages", () => {
      test.beforeEach(async ({ page, roomFilesResponse }) => {
        roomFilesResponse.meta.per_page = 1;
        roomFilesResponse.meta.last_page = 2;
        roomFilesResponse.meta.total = 2;
        roomFilesResponse.meta.total_no_filter = 2;

        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        const search = page.getByTestId("room-files-search");
        await search.locator("input").fill("File");
        await search.locator("button").click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          query: "File",
          page: "1",
        });

        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
      });

      test("shows the first page", async ({ page }) => {
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File1.pdf",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keeps the search query when changing the page", async ({
        page,
      }) => {
        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          query: "File",
          page: "2",
        });

        await expect(
          page.getByTestId("room-files-search").locator("input"),
        ).toHaveValue("File");
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File2.pdf",
        );
      });

      test("resets the page when changing the search query", async ({
        page,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        const search = page.getByTestId("room-files-search");
        await search.locator("input").fill("Fil");
        await search.locator("button").click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          query: "Fil",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("requests the first page without a filter", async ({ page }) => {
      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      await page.getByTestId("room-files-reload-button").click();
      const query = getRequestQuery(await filesRequest);

      expect(query.filter).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows the filter options", async ({ page }) => {
      await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);
      await expect(page.getByTestId("filter-dropdown")).toHaveText(
        "rooms.files.filter.all",
      );

      await page.getByTestId("filter-dropdown").click();

      await expect(page.getByTestId("filter-dropdown-items")).toBeVisible();
      const options = page
        .getByTestId("filter-dropdown-items")
        .getByTestId("filter-dropdown-option");
      await expect(options).toHaveCount(3);
      await expect(options.nth(0)).toHaveText("rooms.files.filter.all");
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
      await expect(options.nth(1)).toHaveText(
        "rooms.files.filter.downloadable",
      );
      await expect(options.nth(2)).toHaveText(
        "rooms.files.filter.use_in_meeting",
      );
    });

    test("shows a message if no files match the filter", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.data = [];
      roomFilesResponse.meta.from = null;
      roomFilesResponse.meta.to = null;
      roomFilesResponse.meta.total = 0;

      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      await selectFilter(page, 1);
      expect(getRequestQuery(await filesRequest)).toMatchObject({
        filter: "downloadable",
        page: "1",
      });

      await expect(page.getByTestId("filter-dropdown")).toHaveText(
        "rooms.files.filter.downloadable",
      );
      await expect(page.getByText("app.filter_no_result")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test("shows a message if there are no files in the room", async ({
      page,
      roomFilesResponse,
    }) => {
      roomFilesResponse.data = [];
      roomFilesResponse.meta.from = null;
      roomFilesResponse.meta.to = null;
      roomFilesResponse.meta.total = 0;
      roomFilesResponse.meta.total_no_filter = 0;

      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      await selectFilter(page, 2);
      expect(getRequestQuery(await filesRequest)).toMatchObject({
        filter: "use_in_meeting",
        page: "1",
      });

      await expect(page.getByTestId("filter-dropdown")).toHaveText(
        "rooms.files.filter.use_in_meeting",
      );
      await expect(page.getByText("rooms.files.nodata")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test.describe("with files on two pages", () => {
      test.beforeEach(async ({ page, roomFilesResponse }) => {
        roomFilesResponse.meta.per_page = 1;
        roomFilesResponse.meta.last_page = 2;
        roomFilesResponse.meta.total = 2;
        roomFilesResponse.meta.total_no_filter = 2;

        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await selectFilter(page, 1);
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          filter: "downloadable",
          page: "1",
        });

        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
      });

      test("shows the first page", async ({ page }) => {
        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.files.filter.downloadable",
        );
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File1.pdf",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keeps the filter when changing the page", async ({ page }) => {
        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          filter: "downloadable",
          page: "2",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.files.filter.downloadable",
        );
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File2.pdf",
        );
      });

      test("resets the filter and the page when selecting all files", async ({
        page,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await selectFilter(page, 0);
        const query = getRequestQuery(await filesRequest);
        expect(query.filter).toBeUndefined();
        expect(query).toMatchObject({ page: "1" });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.files.filter.all",
        );
        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sort", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("requests the files sorted by upload date descending", async ({
      page,
    }) => {
      const filesRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/files*",
      );
      await page.getByTestId("room-files-reload-button").click();

      expect(getRequestQuery(await filesRequest)).toMatchObject({
        sort_by: "uploaded",
        sort_direction: "desc",
        page: "1",
      });
    });

    test("shows the sorting options", async ({ page }) => {
      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "rooms.files.sort.uploaded_at",
      );

      await page.getByTestId("sorting-type-dropdown").click();

      await expect(
        page.getByTestId("sorting-type-dropdown-items"),
      ).toBeVisible();
      const options = page
        .getByTestId("sorting-type-dropdown-items")
        .getByTestId("sorting-type-dropdown-option");
      await expect(options).toHaveCount(2);
      await expect(options.nth(0)).toHaveText("rooms.files.sort.filename");
      await expect(options.nth(1)).toHaveText("rooms.files.sort.uploaded_at");
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    });

    test.describe("by filename", () => {
      test.beforeEach(async ({ page, roomFilesResponse }) => {
        roomFilesResponse.meta.per_page = 1;
        roomFilesResponse.meta.last_page = 3;

        await page.getByTestId("sorting-type-dropdown").click();
        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await page
          .getByTestId("sorting-type-dropdown-items")
          .getByTestId("sorting-type-dropdown-option")
          .nth(0)
          .click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          sort_by: "filename",
          sort_direction: "desc",
          page: "1",
        });

        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
      });

      test("shows the first page", async ({ page }) => {
        await expect(
          page.getByTestId("sorting-type-dropdown-items"),
        ).toHaveCount(0);
        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "rooms.files.sort.filename",
        );
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File1.pdf",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keeps the sorting when changing the page", async ({ page }) => {
        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          sort_by: "filename",
          sort_direction: "desc",
          page: "2",
        });

        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "rooms.files.sort.filename",
        );
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-file-item")).toHaveCount(1);
        await expect(page.getByTestId("room-file-item").first()).toContainText(
          "File2.pdf",
        );
      });

      test("resets the page when changing the sorting direction", async ({
        page,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        const filesRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/files*",
        );
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        expect(getRequestQuery(await filesRequest)).toMatchObject({
          sort_by: "filename",
          sort_direction: "asc",
          page: "1",
        });

        await expectActivePage(page, 0);
      });

      test.describe("ascending", () => {
        test.beforeEach(async ({ page }) => {
          const filesRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/files*",
          );
          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();
          expect(getRequestQuery(await filesRequest)).toMatchObject({
            sort_direction: "asc",
          });
          await expectActivePage(page, 0);
        });

        test("keeps the sorting direction when changing the page", async ({
          page,
        }) => {
          const filesRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/files*",
          );
          await page.getByTestId("paginator-next-button").nth(1).click();
          expect(getRequestQuery(await filesRequest)).toMatchObject({
            sort_by: "filename",
            sort_direction: "asc",
            page: "2",
          });

          await expectActivePage(page, 1);
        });

        test("resets the page when changing the sorting type", async ({
          page,
        }) => {
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          const filesRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/files*",
          );
          await selectSortType(page, 1);
          expect(getRequestQuery(await filesRequest)).toMatchObject({
            sort_by: "uploaded",
            sort_direction: "asc",
            page: "1",
          });

          await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
            "rooms.files.sort.uploaded_at",
          );
          await expectActivePage(page, 0);
        });
      });
    });
  });
});
