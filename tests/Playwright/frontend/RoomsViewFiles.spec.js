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
const FILES_URL = "**/api/v1/rooms/abc-def-123/files*";

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

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const FILES = [
  {
    name: "File1.pdf",
    date: "Sep 21, 2020, 09:08",
    guestDate: "Sep 21, 2020, 03:08",
    download: "rooms.files.download_allowed",
    useInMeeting: "rooms.files.not_available_in_next_meeting",
    url: "https://example.com/files/File1.pdf?signature=abc123",
  },
  {
    name: "File2.pdf",
    date: "Sep 21, 2020, 09:08",
    guestDate: "Sep 21, 2020, 03:08",
    download: "rooms.files.download_allowed",
    useInMeeting: "rooms.files.available_in_next_meeting",
    isStartFile: true,
    url: "https://example.com/files/File2.pdf?signature=def456",
  },
  {
    name: "File3.pdf",
    date: "Sep 21, 2020, 09:09",
    guestDate: "Sep 21, 2020, 03:09",
    download: "rooms.files.download_not_allowed",
    useInMeeting: "rooms.files.not_available_in_next_meeting",
    url: "https://example.com/files/File3.pdf?signature=ghi789",
  },
];

function isRoomRequest(request) {
  const url = request.url();
  return (
    request.method() === "GET" &&
    url.includes("/api/v1/rooms/abc-def-123") &&
    !url.includes("/files") &&
    !url.includes("/auth")
  );
}

function isFilesRequest(request) {
  return request.method() === "GET" && request.url().includes("/files");
}

function hasRoomAuthToken(request) {
  return queryOf(request).room_auth_token !== undefined;
}

function onePerPage({ lastPage = 3, total, currentPage = 1 } = {}) {
  return (collection) => {
    collection.data = collection.data.slice(0, 1);
    collection.meta.current_page = currentPage;
    collection.meta.last_page = lastPage;
    collection.meta.per_page = 1;
    collection.meta.from = currentPage;
    collection.meta.to = currentPage;
    collection.meta.total = total ?? lastPage;
    collection.meta.total_no_filter = total ?? lastPage;
  };
}

function noFiles(filtered) {
  return (files) => {
    files.data = [];
    files.meta.from = null;
    files.meta.to = null;
    files.meta.total = 0;
    if (!filtered) {
      files.meta.total_no_filter = 0;
    }
  };
}

async function mockRoom(page, changes = {}) {
  // Match the room path only (not /files, /auth, …); query params are allowed
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

async function mockFiles(page, changes = () => {}) {
  const files = readFixture("roomFiles.json");
  changes(files);
  return mockMethod(page, "GET", FILES_URL, { status: 200, json: files });
}

async function mockFilesError(page, status, json = {}) {
  return mockMethod(page, "GET", FILES_URL, { status, json });
}

/**
 * One file per page: the answer depends on the requested page, like the real API.
 */
async function mockFilesOnePerPage(page, options) {
  await page.route(FILES_URL, async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    const files = readFixture("roomFiles.json");
    const currentPage = Number(queryOf(route.request()).page ?? 1);
    onePerPage({ ...options, currentPage })(files);
    // the file of the requested page
    files.data = [readFixture("roomFiles.json").data[currentPage - 1]];
    await route.fulfill({ status: 200, json: files });
  });
}

async function expectControls(page, enabled, withUpload = false) {
  const search = page.getByTestId("room-files-search");
  const filterLabel = page
    .getByTestId("filter-dropdown")
    .locator(".p-select-label");
  const sortGroup = page.getByTestId("sorting-type-inputgroup");
  const sortLabel = sortGroup
    .getByTestId("sorting-type-dropdown")
    .locator(".p-select-label");
  const reload = page.getByTestId("room-files-reload-button");
  const upload = page.getByTestId("room-files-upload-button");

  if (enabled) {
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
    await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
    await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
    await expect(sortGroup.locator("button")).toBeEnabled();
    await expect(reload).toBeEnabled();
    if (withUpload) {
      await expect(upload).toBeEnabled();
    }
  } else {
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
    await expect(filterLabel).toHaveAttribute("aria-disabled", "true");
    await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
    await expect(sortGroup.locator("button")).toBeDisabled();
    await expect(reload).toBeDisabled();
    if (withUpload) {
      await expect(upload).toBeDisabled();
    }
  }
}

async function expectFile(
  page,
  index,
  view,
  { guest = false, href = FILES[index].url, link = true } = {},
) {
  const expected = FILES[index];
  const item = page.getByTestId("room-file-item").nth(index);

  await expect(item).toContainText(expected.name);
  await expect(item).toContainText(guest ? expected.guestDate : expected.date);

  const download = item.getByTestId("room-files-download-button");
  const edit = item.getByTestId("room-files-configure-button");
  const remove = item.getByTestId("room-files-delete-button");
  const startFile = item.getByTestId("room-files-start-file-button");

  await expect(download).toBeEnabled();

  if (view === "full") {
    await expect(item).toContainText(expected.download);
    await expect(item).toContainText(expected.useInMeeting);
    await expect(edit).toBeEnabled();
    await expect(remove).toBeEnabled();

    if (expected.isStartFile) {
      await expect(item).toContainText("rooms.files.start_file");
      await expect(startFile).toHaveCount(0);
    } else {
      await expect(item).not.toContainText("rooms.files.start_file");
      await expect(startFile).toBeEnabled();
    }
  } else {
    await expect(item).not.toContainText(expected.download);
    await expect(item).not.toContainText(expected.useInMeeting);
    await expect(item).not.toContainText("rooms.files.start_file");
    await expect(edit).toHaveCount(0);
    await expect(remove).toHaveCount(0);
    await expect(startFile).toHaveCount(0);
  }

  // Without accepted terms of use the download is a button instead of a link
  if (link) {
    const anchor = item.locator('a[data-test="room-files-download-button"]');
    await expect(anchor).toHaveAttribute("href", href);
    await expect(anchor).toHaveAttribute("rel", "opener");
    await expect(anchor).toHaveAttribute("target", "_blank");
  }
}

const systemDefault = (page) => page.getByTestId("room-file-system-default");

async function expectNoSystemDefault(page) {
  await expect(systemDefault(page)).toHaveCount(0);
}

async function expectTermsOfUse(page) {
  const message = page.getByTestId("terms-of-use-message");
  await expect(message).toBeVisible();
  await expect(message).toContainText("rooms.files.terms_of_use.title");
  await expect(message).toContainText("Test terms of use");
  await expect(message).toContainText("rooms.files.terms_of_use.accept");
  await expect(message.locator("#terms_of_use")).not.toBeChecked();
}

async function acceptTermsOfUse(page) {
  await page.locator("#terms_of_use").click();
  await expect(page.getByTestId("terms-of-use-required-info")).toHaveCount(0);

  await expect(
    page.getByTestId("terms-of-use-message").getByText("Test terms of use"),
  ).toBeHidden();
  await expect(page.locator("#terms_of_use")).toBeHidden();
}

// There are two paginator components, the first one for small devices and the second one for larger devices

async function search(page, query) {
  const search = page.getByTestId("room-files-search");
  await search.locator("input").fill(query);
  await search.locator("button").click();
}

async function filesQueryAfter(page, action) {
  const request = page.waitForRequest(isFilesRequest);
  await action();
  return queryOf(await request);
}

test.describe("Rooms view files", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await mockRoom(page);
    await interceptRoomFilesRequest(page, true);
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("load files", () => {
    test("shows the loading state", async ({ page }) => {
      const release = await holdRequest(page, FILES_URL, {
        json: readFixture("roomFiles.json"),
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-files").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectControls(page, false, true);

      release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectControls(page, true, true);
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    for (const [index, file] of FILES.entries()) {
      test(`shows ${file.name}`, async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=files");

        await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        await expectFile(page, index, "full");
      });
    }

    test("shows the system default presentation", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");

      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(systemDefault(page)).toContainText(
        "rooms.files.system_default",
      );
      await expect(systemDefault(page)).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(systemDefault(page)).not.toContainText(
        "rooms.files.start_file",
      );
      await expect(
        systemDefault(page).locator(
          'a[data-test="room-files-download-system-default-button"]',
        ),
      ).toHaveAttribute("href", "Default.pdf");
    });

    test("shows the system default as start presentation if no file is the start file", async ({
      page,
    }) => {
      await mockFiles(page, (files) => {
        files.data.forEach((file) => {
          file.is_start_file = false;
          file.use_in_meeting = false;
        });
        files.start_file = null;
        files.system_default.prefer_as_start = true;
      });

      await page.goto("/rooms/abc-def-123#tab=files");

      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(systemDefault(page)).toContainText(
        "rooms.files.system_default",
      );
      await expect(systemDefault(page)).toContainText("rooms.files.start_file");
      await expect(systemDefault(page)).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(
        systemDefault(page).getByTestId("room-files-start-file-button"),
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
    }) => {
      await mockFiles(page, (files) => {
        noFiles()(files);
        files.start_file = null;
        files.system_default.prefer_as_start = true;
      });

      await page.goto("/rooms/abc-def-123#tab=files");

      await expect(systemDefault(page)).toContainText("rooms.files.start_file");
      await expect(systemDefault(page)).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
      await expect(page.getByText("rooms.files.nodata")).toBeVisible();
    });

    test("shows the file as start presentation if the system default is preferred but not set", async ({
      page,
    }) => {
      await mockFiles(page, (files) => {
        files.system_default.file = null;
        files.system_default.prefer_as_start = true;
      });

      await page.goto("/rooms/abc-def-123#tab=files");

      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expectNoSystemDefault(page);

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
      }) => {
        await holdRequest(page, FILES_URL, {
          json: readFixture("roomFiles.json"),
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
      }) => {
        const release = await holdRequest(page, FILES_URL, {
          json: readFixture("roomFiles.json"),
        });

        await page.getByTestId("room-files-reload-button").click();
        await expect(page.getByTestId("overlay")).toBeVisible();

        release();

        await expect(page.getByTestId("overlay")).toBeHidden();

        const item = page.getByTestId("room-file-item").first();
        await expect(
          item.locator('a[data-test="room-files-download-button"]'),
        ).toHaveAttribute("href", FILES[0].url);
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
    test.beforeEach(async ({ page }) => {
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 0 } },
        }),
      );
    });

    test("loads the files with the room auth token", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
      });
      await interceptRoomFilesRequest(page);

      const authRequest = page.waitForRequest(ROOM_AUTH_URL);
      const roomRequest = page.waitForRequest(isRoomRequest);
      const filesRequest = page.waitForRequest(isFilesRequest);

      await page.goto("/rooms/abc-def-123#accessCode=123456789");

      await authRequest;
      await roomRequest;
      expect(queryOf(await filesRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });

      await expect(page.getByText("rooms.files.title").first()).toBeVisible();
      await expect(page.getByTestId("room-files-upload-button")).toHaveCount(0);
      await expectNoSystemDefault(page);
    });

    for (const index of [0, 1]) {
      test(`shows ${FILES[index].name} with the room auth token in the download link`, async ({
        page,
      }) => {
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
        });
        await interceptRoomFilesRequest(page);

        await page.goto("/rooms/abc-def-123#accessCode=123456789");

        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        await expectFile(page, index, "limited", {
          href:
            FILES[index].url +
            "&room_auth_token=roomAuthToken&room_auth_token_type=0",
        });
      });
    }

    test("resets the room auth token and shows an error on an invalid token", async ({
      page,
    }) => {
      // The room is only authenticated with the token, it gets reloaded without it after the error
      await mockRoom(page, (room, request) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.authenticated = hasRoomAuthToken(request);
      });
      await mockFilesError(page, 401, { message: "invalid_auth_token" });

      const filesRequest = page.waitForRequest(isFilesRequest);
      const roomReloadRequest = page.waitForRequest(
        (request) => isRoomRequest(request) && !hasRoomAuthToken(request),
      );

      await page.goto("/rooms/abc-def-123#accessCode=123456789");

      expect(queryOf(await filesRequest)).toMatchObject({
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
      await mockFilesError(page, 403, { message: "require_code" });

      const filesRequest = page.waitForRequest(isFilesRequest);
      const roomReloadRequest = page.waitForRequest(
        (request) => isRoomRequest(request) && roomRequests >= 1,
      );

      await page.goto("/rooms/abc-def-123#tab=files");

      const filesQuery = queryOf(await filesRequest);
      expect(filesQuery.room_auth_token).toBeUndefined();
      expect(filesQuery.room_auth_token_type).toBeUndefined();

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

    test.describe("with a valid link", () => {
      test.beforeEach(async ({ page }) => {
        await page.route(ROOM_AUTH_URL, (route) =>
          route.fulfill({
            status: 201,
            json: { data: { id: "roomAuthToken", type: 1 } },
          }),
        );
        await interceptRoomFilesRequest(page);
      });

      test("loads the files with the room auth token", async ({ page }) => {
        const authRequest = page.waitForRequest(ROOM_AUTH_URL);
        const roomRequest = page.waitForRequest(isRoomRequest);
        const filesRequest = page.waitForRequest(isFilesRequest);

        await page.goto(
          `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}`,
        );

        await authRequest;
        await roomRequest;
        expect(queryOf(await filesRequest)).toMatchObject({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });

        await expect(page.getByText("rooms.files.title").first()).toBeVisible();
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        await expect(page.getByTestId("room-files-upload-button")).toHaveCount(
          0,
        );
        await expectNoSystemDefault(page);
      });

      for (const index of [0, 1]) {
        test(`shows ${FILES[index].name} with the room auth token in the download link`, async ({
          page,
        }) => {
          await page.goto(
            `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}`,
          );

          await expect(page.getByTestId("room-file-item")).toHaveCount(2);
          await expectFile(page, index, "limited", {
            guest: true,
            href:
              FILES[index].url +
              "&room_auth_token=roomAuthToken&room_auth_token_type=1",
          });
        });
      }
    });

    test("shows an error and redirects if the personalized link is invalid", async ({
      page,
    }) => {
      // The first authentication is valid, the authentication after the files error is not
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
      await mockFilesError(page, 401, { message: "invalid_auth_token" });

      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}`,
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
    }) => {
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 1 } },
        }),
      );
      await mockFilesError(page, 420, { message: "guests_only" });

      await page.goto(
        `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}`,
      );

      await expectToastAndClose(page, "app.flash.guests_only");

      await expect(page).not.toHaveURL(/\/rooms/);
    });
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
    }) => {
      await mockFilesError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=files");

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
      await expectControls(page, true);
    });

    test("reloads the files after a server error", async ({ page }) => {
      await mockFilesError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=files");
      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await mockFilesOnePerPage(page, { lastPage: 3 });

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
      test.beforeEach(async ({ page }) => {
        await mockFilesOnePerPage(page, { lastPage: 3 });
        await page.goto("/rooms/abc-def-123#tab=files");
        await expect(page.getByTestId("room-file-item")).toHaveCount(1);

        await mockFilesError(page, 500, { message: "Test" });
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
        await mockFilesOnePerPage(page, { lastPage: 3 });

        await expect(page.getByTestId("overlay")).toBeVisible();
        const query = await filesQueryAfter(page, () =>
          page.getByTestId("loading-retry-button").click(),
        );
        expect(query).toMatchObject({ page: "1" });

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
    }) => {
      await page.route("**/api/v1/roomTypes*", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/roomTypes.json" }),
      );
      await page.route("**/api/v1/rooms?*", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/rooms.json" }),
      );
      await mockFilesError(page, 404, {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      });

      await page.goto("/rooms/abc-def-123#tab=files");

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
        await mockFilesError(page, 404, {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        });

        await page.goto("/rooms/abc-def-123#tab=files");

        await expect(page).toHaveURL((url) => url.pathname === "/404");
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
  }) => {
    await mockFiles(page, (files) => {
      onePerPage({ lastPage: 2, total: 2 })(files);
      files.data[0].role = 3;
    });

    await page.goto("/rooms/abc-def-123#tab=files");
    await expect(page.getByTestId("room-file-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the files
    const requests = [];
    await page.route(FILES_URL, (route) => {
      requests.push(queryOf(route.request()));
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
      test.use({ authenticated: false });

      test.beforeEach(async ({ page }) => {
        await mockRoom(page, (room) => {
          room.data.current_user = null;
        });
        await interceptRoomFilesRequest(page);
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
        await expectNoSystemDefault(page);

        await expectFile(page, 0, "limited", { guest: true });
        await expectFile(page, 1, "limited", { guest: true });
      });

      test.describe("with terms of use", () => {
        test.beforeEach(async ({ page, config }) => {
          config.data.room.file_terms_of_use = "Test terms of use";
          await page.goto("/rooms/abc-def-123");
          await expect(page.getByTestId("room-file-item")).toHaveCount(2);
        });

        test("shows the terms of use and only the download buttons", async ({
          page,
        }) => {
          await expect(
            page.getByTestId("room-files-upload-button"),
          ).toHaveCount(0);
          await expectTermsOfUse(page);
          await expectNoSystemDefault(page);

          await expectFile(page, 0, "limited", { guest: true, link: false });
          await expectFile(page, 1, "limited", { guest: true, link: false });
        });

        test("hides the terms of use after accepting them", async ({
          page,
        }) => {
          await acceptTermsOfUse(page);
        });
      });
    });

    test.describe("with rooms.viewAll permission", () => {
      test.beforeEach(async ({ page, currentUser }) => {
        currentUser.data.permissions = ["rooms.viewAll"];
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.current_user.permissions = ["rooms.viewAll"];
        });
        await interceptRoomFilesRequest(page, true);
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
        await expectNoSystemDefault(page);

        await expectFile(page, 0, "limited");
        await expectFile(page, 1, "limited");
        await expectFile(page, 2, "limited");
      });

      test.describe("with terms of use", () => {
        test.beforeEach(async ({ page, config }) => {
          config.data.room.file_terms_of_use = "Test terms of use";
          await page.goto("/rooms/abc-def-123#tab=files");
          await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        });

        test("shows the terms of use and only the download buttons", async ({
          page,
        }) => {
          await expect(
            page.getByTestId("room-files-upload-button"),
          ).toHaveCount(0);
          await expectTermsOfUse(page);
          await expectNoSystemDefault(page);

          await expectFile(page, 0, "limited", { link: false });
          await expectFile(page, 1, "limited", { link: false });
          await expectFile(page, 2, "limited", { link: false });
        });

        test("hides the terms of use after accepting them", async ({
          page,
        }) => {
          await acceptTermsOfUse(page);
        });
      });
    });

    test.describe("as co-owner", () => {
      test.beforeEach(async ({ page, config }) => {
        config.data.room.file_terms_of_use = "Test terms of use";
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.is_member = true;
          room.data.is_co_owner = true;
        });
        await interceptRoomFilesRequest(page, true);
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
        await expect(systemDefault(page)).toContainText(
          "rooms.files.system_default",
        );
        await expect(systemDefault(page)).toContainText(
          "rooms.files.available_in_next_meeting",
        );
        await expect(systemDefault(page)).not.toContainText(
          "rooms.files.start_file",
        );
        await expect(
          systemDefault(page).getByTestId(
            "room-files-download-system-default-button",
          ),
        ).toBeEnabled();
        await expect(
          systemDefault(page).getByTestId("room-files-start-file-button"),
        ).toHaveText("rooms.files.set_start_file");
        await expect(
          systemDefault(page).getByTestId("room-files-start-file-button"),
        ).toBeEnabled();
      });

      for (const [index, file] of FILES.entries()) {
        test(`shows ${file.name} with all buttons`, async ({ page }) => {
          await expectFile(page, index, "full");
        });
      }
    });

    test.describe("with rooms.manage permission", () => {
      test.beforeEach(async ({ page, currentUser, config }) => {
        config.data.room.file_terms_of_use = "Test terms of use";
        currentUser.data.permissions = ["rooms.viewAll", "rooms.manage"];
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.current_user.permissions = [
            "rooms.viewAll",
            "rooms.manage",
          ];
        });
        await interceptRoomFilesRequest(page, true);
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
        await expect(systemDefault(page)).toContainText(
          "rooms.files.system_default",
        );
        await expect(systemDefault(page)).toContainText(
          "rooms.files.available_in_next_meeting",
        );
        await expect(systemDefault(page)).not.toContainText(
          "rooms.files.start_file",
        );
        await expect(
          systemDefault(page).getByTestId(
            "room-files-download-system-default-button",
          ),
        ).toBeEnabled();
        await expect(
          systemDefault(page).getByTestId("room-files-start-file-button"),
        ).toHaveText("rooms.files.set_start_file");
        await expect(
          systemDefault(page).getByTestId("room-files-start-file-button"),
        ).toBeEnabled();
      });

      for (const [index, file] of FILES.entries()) {
        test(`shows ${file.name} with all buttons`, async ({ page }) => {
          await expectFile(page, index, "full");
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
      const query = await filesQueryAfter(page, () =>
        page.getByTestId("room-files-reload-button").click(),
      );

      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no files match the search query", async ({
      page,
    }) => {
      await mockFiles(page, noFiles(true));

      const query = await filesQueryAfter(page, () => search(page, "Test"));
      expect(query).toMatchObject({ query: "Test", page: "1" });

      await expect(page.getByText("app.filter_no_result")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test("shows a message if there are no files in the room and searches with enter", async ({
      page,
    }) => {
      await mockFiles(page, noFiles(false));

      const query = await filesQueryAfter(page, async () => {
        await page
          .getByTestId("room-files-search")
          .locator("input")
          .fill("Test2");
        await page
          .getByTestId("room-files-search")
          .locator("input")
          .press("Enter");
      });
      expect(query).toMatchObject({ query: "Test2", page: "1" });

      await expect(page.getByText("rooms.files.nodata")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test.describe("with files on two pages", () => {
      test.beforeEach(async ({ page }) => {
        await mockFilesOnePerPage(page, { lastPage: 2, total: 2 });

        const query = await filesQueryAfter(page, () => search(page, "File"));
        expect(query).toMatchObject({ query: "File", page: "1" });

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
        const query = await filesQueryAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({ query: "File", page: "2" });

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

        const query = await filesQueryAfter(page, () => search(page, "Fil"));
        expect(query).toMatchObject({ query: "Fil", page: "1" });

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
      const query = await filesQueryAfter(page, () =>
        page.getByTestId("room-files-reload-button").click(),
      );

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

    test("shows a message if no files match the filter", async ({ page }) => {
      await mockFiles(page, noFiles(true));

      const query = await filesQueryAfter(page, () => selectFilter(page, 1));
      expect(query).toMatchObject({ filter: "downloadable", page: "1" });

      await expect(page.getByTestId("filter-dropdown")).toHaveText(
        "rooms.files.filter.downloadable",
      );
      await expect(page.getByText("app.filter_no_result")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test("shows a message if there are no files in the room", async ({
      page,
    }) => {
      await mockFiles(page, noFiles(false));

      const query = await filesQueryAfter(page, () => selectFilter(page, 2));
      expect(query).toMatchObject({ filter: "use_in_meeting", page: "1" });

      await expect(page.getByTestId("filter-dropdown")).toHaveText(
        "rooms.files.filter.use_in_meeting",
      );
      await expect(page.getByText("rooms.files.nodata")).toBeVisible();
      await expect(page.getByTestId("room-file-item")).toHaveCount(0);
    });

    test.describe("with files on two pages", () => {
      test.beforeEach(async ({ page }) => {
        await mockFilesOnePerPage(page, { lastPage: 2, total: 2 });

        const query = await filesQueryAfter(page, () => selectFilter(page, 1));
        expect(query).toMatchObject({ filter: "downloadable", page: "1" });

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
        const query = await filesQueryAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({ filter: "downloadable", page: "2" });

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

        const query = await filesQueryAfter(page, () => selectFilter(page, 0));
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
      const query = await filesQueryAfter(page, () =>
        page.getByTestId("room-files-reload-button").click(),
      );

      expect(query).toMatchObject({
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
      test.beforeEach(async ({ page }) => {
        await mockFilesOnePerPage(page, { lastPage: 3 });

        await page.getByTestId("sorting-type-dropdown").click();
        const query = await filesQueryAfter(page, () =>
          page
            .getByTestId("sorting-type-dropdown-items")
            .getByTestId("sorting-type-dropdown-option")
            .nth(0)
            .click(),
        );
        expect(query).toMatchObject({
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
        const query = await filesQueryAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({
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

        const query = await filesQueryAfter(page, () =>
          page.getByTestId("sorting-type-inputgroup").locator("button").click(),
        );
        expect(query).toMatchObject({
          sort_by: "filename",
          sort_direction: "asc",
          page: "1",
        });

        await expectActivePage(page, 0);
      });

      test.describe("ascending", () => {
        test.beforeEach(async ({ page }) => {
          const query = await filesQueryAfter(page, () =>
            page
              .getByTestId("sorting-type-inputgroup")
              .locator("button")
              .click(),
          );
          expect(query).toMatchObject({ sort_direction: "asc" });
          await expectActivePage(page, 0);
        });

        test("keeps the sorting direction when changing the page", async ({
          page,
        }) => {
          const query = await filesQueryAfter(page, () =>
            page.getByTestId("paginator-next-button").nth(1).click(),
          );
          expect(query).toMatchObject({
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

          const query = await filesQueryAfter(page, () =>
            selectSortType(page, 1),
          );
          expect(query).toMatchObject({
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
