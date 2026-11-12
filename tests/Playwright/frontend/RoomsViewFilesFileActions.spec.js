import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  mockMethod,
  nthRequest,
  parseFormData,
  queryOf,
} from "../support/utils.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  setValidRememberedParticipantName,
} from "../support/room.js";

const ROOM_PATH = "/api/v1/rooms/abc-def-123";
const ROOM_AUTH_URL = "**/api/v1/rooms/abc-def-123/auth";
const FILES_URL = "**/api/v1/rooms/abc-def-123/files*";
const UPLOAD_URL = "**/api/v1/rooms/abc-def-123/files";
const PARTICIPANT_NAME_CHECK_URL = "**/api/v1/participantName/check";

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

const ROOM_NOT_FOUND = {
  message: "model_not_found",
  model: "room",
  ids: ["abc-def-123"],
};

const FILE_NOT_FOUND = {
  message: "model_not_found",
  model: "room_file",
  ids: [3],
};

const SERVER_ERROR = { message: "Test" };

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const isRoomRequest = (url) => url.pathname === ROOM_PATH;

/**
 * Mock the room request, `mutate` changes the room fixture (and gets the request).
 * Later mocks win over earlier ones.
 */
async function mockRoom(page, mutate = () => {}) {
  const requests = [];
  await page.route(isRoomRequest, async (route) => {
    const request = route.request();
    if (request.method() !== "GET") {
      return route.fallback();
    }
    requests.push(request);
    const room = readFixture("room.json");
    mutate(room, request);
    await route.fulfill({ json: room });
  });
  return { requests };
}

/**
 * Mock the file list, `mutate` changes the fixture. Returns the request mock (see `mockMethod`).
 */
function mockFiles(page, mutate = () => {}, fixture = "roomFiles.json") {
  const files = readFixture(fixture);
  mutate(files);
  return mockMethod(page, "GET", FILES_URL, { status: 200, json: files });
}

/**
 * Keep only the files of the given range and update the meta data accordingly.
 */
function keepFiles(start, end) {
  return (files) => {
    files.data = files.data.slice(start, end);
    files.meta.to = files.data.length;
    files.meta.total = files.data.length;
    files.meta.total_no_filter = files.data.length;
  };
}

/**
 * Append uploaded files (ids start at 4) to the file list.
 */
function withUploadedFiles(...names) {
  return (files) => {
    names.forEach((filename, index) => {
      files.data.push({
        id: 4 + index,
        filename,
        download: false,
        use_in_meeting: false,
        is_start_file: false,
        uploaded: "2020-09-21T07:10:00.000000Z",
      });
    });
    files.meta.per_page = files.data.length;
    files.meta.to = files.data.length;
    files.meta.total = files.data.length;
    files.meta.total_no_filter = files.data.length;
  };
}

/**
 * Send a message to the window (like the iframe of the file download does) and wait until it was delivered.
 */
function postMessage(page, message) {
  return page.evaluate(
    (message) =>
      new Promise((resolve) => {
        // registered after the listener of the app, so the app has handled the message when this resolves
        window.addEventListener("message", resolve, { once: true });
        window.postMessage(message, window.location.origin);
      }),
    message,
  );
}

/**
 * Select a file in the upload dialog and return the upload request.
 */
function uploadFile(page, name = "testFile.txt") {
  const request = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().includes("/files"),
  );
  // An in-memory file, Chromium does not expose the content of files from disk in intercepted request bodies
  return page
    .locator("#file")
    .setInputFiles({
      name,
      mimeType: "text/plain",
      buffer: readFileSync(`tests/Playwright/fixtures/files/${name}`),
    })
    .then(() => request);
}

async function expectRedirectToRoomIndex(page) {
  await expect(page).toHaveURL(
    (url) =>
      url.pathname.startsWith("/rooms") && !url.href.includes("abc-def-123"),
  );
}

test.describe("Rooms view files file actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await mockRoom(page);
    await interceptRoomFilesRequest(page, true);
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("upload file", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("upload dialog is closed by default", async ({ page }) => {
      await expect(page.getByTestId("room-files-upload-button")).toBeVisible();
      await expect(page.getByTestId("room-files-upload-dialog")).toBeHidden();
    });

    test.describe("with open dialog", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId("room-files-upload-button").click();
        await expect(
          page.getByTestId("room-files-upload-dialog"),
        ).toBeVisible();
      });

      test("shows the upload dialog", async ({ page }) => {
        const dialog = page.getByTestId("room-files-upload-dialog");

        await expect(dialog).toContainText("rooms.files.upload");
        await expect(dialog).toContainText(
          'app.file.allowed_formats_{"formats":"pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, odt, ods, odp, odg, odc, odi, jpg, jpeg, png"}',
        );
        await expect(dialog).toContainText('app.file.max_size_{"size":"30 MB"');

        const dropZone = dialog.getByTestId("drop-zone");
        await expect(dropZone).not.toHaveClass(/cursor-wait/);
        await expect(dropZone).toHaveText("rooms.files.select_or_drag");
        await expect(dialog.getByTestId("progress-bar")).toHaveCount(0);

        const browseButton = dialog.getByTestId("upload-file-button");
        await expect(browseButton).toBeVisible();
        await expect(browseButton).not.toHaveClass(/p-disabled/);
        await expect(browseButton).toContainText("app.browse");
      });

      test("browse button opens the file selection", async ({ page }) => {
        await page.locator("#file").evaluate((input) => {
          window.fileInputClicks = 0;
          input.click = () => {
            window.fileInputClicks++;
          };
        });

        await page.getByTestId("upload-file-button").focus();
        await page.keyboard.press("Enter");

        await expect
          .poll(() => page.evaluate(() => window.fileInputClicks))
          .toBe(1);
      });

      test("shows the loading state while uploading", async ({ page }) => {
        const upload = await mockMethod(page, "POST", UPLOAD_URL, {
          status: 204,
          hold: true,
        });
        await mockFiles(page, withUploadedFiles("testFile.txt"));

        await uploadFile(page);

        const dialog = page.getByTestId("room-files-upload-dialog");
        await expect(dialog.getByTestId("upload-file-button")).toHaveClass(
          /p-disabled/,
        );
        const dropZone = dialog.getByTestId("drop-zone");
        await expect(dropZone).toHaveClass(/cursor-wait/);
        await expect(dropZone).toHaveText("testFile.txt");
        await expect(dialog.getByTestId("progress-bar")).toBeVisible();

        upload.release();

        await expect(dialog.getByTestId("uploaded-file-message")).toHaveCount(
          1,
        );
      });

      for (const name of ["testFile.txt", "testFile2.txt"]) {
        test(`uploads ${name}`, async ({ page }) => {
          // The request is held while the body is read, the browser releases the file after the response
          const upload = await mockMethod(page, "POST", UPLOAD_URL, {
            status: 204,
            hold: true,
          });
          const files = await mockFiles(page, withUploadedFiles(name));

          const request = await uploadFile(page, name);

          const formData = await parseFormData(request);
          const uploadedFile = formData.get("file");
          expect(uploadedFile.name).toBe(name);
          expect(uploadedFile.type).toBe("text/plain");
          expect(await uploadedFile.text()).toBe(
            readFileSync(`tests/Playwright/fixtures/files/${name}`, "utf8"),
          );

          upload.release();

          // Files are reloaded
          await nthRequest(files, 1);

          // Dialog stays open, loading is finished and the success message is shown
          const dialog = page.getByTestId("room-files-upload-dialog");
          await expect(dialog).toBeVisible();
          await expect(
            dialog.getByTestId("upload-file-button"),
          ).not.toHaveClass(/p-disabled/);
          await expect(dialog.getByTestId("drop-zone")).not.toHaveClass(
            /cursor-wait/,
          );
          await expect(dialog.getByTestId("drop-zone")).toHaveText(
            "rooms.files.select_or_drag",
          );
          await expect(dialog.getByTestId("progress-bar")).toHaveCount(0);
          await expect(dialog.getByTestId("uploaded-file-message")).toHaveText(
            `rooms.files.uploaded_{"name":"${name}"}`,
          );
        });
      }

      test("keeps the messages of all uploaded files", async ({ page }) => {
        await mockMethod(page, "POST", UPLOAD_URL, { status: 204 });
        await mockFiles(page, withUploadedFiles("testFile.txt"));

        const dialog = page.getByTestId("room-files-upload-dialog");
        await uploadFile(page, "testFile.txt");
        await expect(dialog.getByTestId("uploaded-file-message")).toHaveCount(
          1,
        );

        await mockFiles(
          page,
          withUploadedFiles("testFile.txt", "testFile2.txt"),
        );
        await uploadFile(page, "testFile2.txt");

        const messages = dialog.getByTestId("uploaded-file-message");
        await expect(messages).toHaveCount(2);
        await expect(messages.nth(0)).toHaveText(
          'rooms.files.uploaded_{"name":"testFile.txt"}',
        );
        await expect(messages.nth(1)).toHaveText(
          'rooms.files.uploaded_{"name":"testFile2.txt"}',
        );
      });

      test("shows the uploaded files after closing the dialog", async ({
        page,
      }) => {
        await mockMethod(page, "POST", UPLOAD_URL, { status: 204 });
        await mockFiles(
          page,
          withUploadedFiles("testFile.txt", "testFile2.txt"),
        );

        const dialog = page.getByTestId("room-files-upload-dialog");
        await uploadFile(page, "testFile.txt");
        await uploadFile(page, "testFile2.txt");
        await expect(dialog.getByTestId("uploaded-file-message")).toHaveCount(
          2,
        );

        await dialog.getByTestId("dialog-header-close-button").click();
        await expect(dialog).toBeHidden();

        const items = page.getByTestId("room-file-item");
        await expect(items).toHaveCount(5);

        for (const [index, name] of [
          [3, "testFile.txt"],
          [4, "testFile2.txt"],
        ]) {
          await expect(items.nth(index)).toContainText(name);
          await expect(items.nth(index)).toContainText("Sep 21, 2020, 09:10");
          await expect(items.nth(index)).toContainText(
            "rooms.files.download_not_allowed",
          );
          await expect(items.nth(index)).toContainText(
            "rooms.files.not_available_in_next_meeting",
          );
        }
      });

      test.describe("errors", () => {
        const validationError = "The File must be a file of type: pdf, doc.";
        const validationResponse = {
          status: 422,
          json: {
            message: validationError,
            errors: { file: [validationError] },
          },
        };

        test("shows an error if the file is too large", async ({ page }) => {
          await mockMethod(page, "POST", UPLOAD_URL, { status: 413 });

          await uploadFile(page);

          const dialog = page.getByTestId("room-files-upload-dialog");
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText("app.file.too_large");
        });

        test("shows validation errors", async ({ page }) => {
          await mockMethod(page, "POST", UPLOAD_URL, validationResponse);

          await uploadFile(page);

          const dialog = page.getByTestId("room-files-upload-dialog");
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText(validationError);
        });

        test("shows a toast on a server error", async ({ page }) => {
          await mockMethod(page, "POST", UPLOAD_URL, {
            status: 500,
            json: SERVER_ERROR,
          });

          await uploadFile(page);

          await expectToastAndClose(page, SERVER_ERROR_TOAST);
          await expect(
            page.getByTestId("room-files-upload-dialog"),
          ).toBeVisible();
        });

        test("hides the validation errors after a server error", async ({
          page,
        }) => {
          const dialog = page.getByTestId("room-files-upload-dialog");
          await mockMethod(page, "POST", UPLOAD_URL, validationResponse);
          await uploadFile(page);
          await expect(dialog).toContainText(validationError);

          await mockMethod(page, "POST", UPLOAD_URL, {
            status: 500,
            json: SERVER_ERROR,
          });
          await uploadFile(page);

          await expectToastAndClose(page, SERVER_ERROR_TOAST);
          await expect(dialog).toBeVisible();
          await expect(dialog).not.toContainText(validationError);
        });
      });
    });

    test.describe("auth errors", () => {
      test("handles auth errors", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page.getByTestId("room-files-upload-button").click();
            await expect(
              page.getByTestId("room-files-upload-dialog"),
            ).toBeVisible();
            await page
              .locator("#file")
              .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");
          },
          "POST",
          UPLOAD_URL,
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "POST", UPLOAD_URL, {
          status: 404,
          json: ROOM_NOT_FOUND,
        });

        await page.getByTestId("room-files-upload-button").click();
        await expect(
          page.getByTestId("room-files-upload-dialog"),
        ).toBeVisible();
        await uploadFile(page);

        await expectRedirectToRoomIndex(page);
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test.describe("delete file", () => {
    const deleteUrl = (id) => `**/api/v1/rooms/abc-def-123/files/${id}`;

    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("shows the confirmation dialog", async ({ page }) => {
      const dialog = page.getByTestId("room-files-delete-dialog");
      await expect(dialog).toBeHidden();

      await page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-delete-button")
        .click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.files.delete");
      await expect(dialog).toContainText(
        'rooms.files.confirm_delete_{"filename":"File1.pdf"}',
      );
    });

    test("shows the loading state while deleting", async ({ page }) => {
      const remove = await mockMethod(page, "DELETE", deleteUrl(1), {
        status: 204,
        hold: true,
      });
      await mockFiles(page, keepFiles(1, 3));

      await page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-delete-button")
        .click();

      const dialog = page.getByTestId("room-files-delete-dialog");
      await expect(dialog.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await dialog.getByTestId("dialog-continue-button").click();

      await expect(dialog.getByTestId("dialog-continue-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();

      remove.release();

      await expect(dialog).toBeHidden();
    });

    test("deletes the file", async ({ page }) => {
      const remove = await mockMethod(page, "DELETE", deleteUrl(1), {
        status: 204,
      });
      const files = await mockFiles(page, keepFiles(1, 3));

      await page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-delete-button")
        .click();
      await page
        .getByTestId("room-files-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await nthRequest(remove);
      await nthRequest(files);

      await expect(page.getByTestId("room-file-item")).toHaveCount(2);
      await expect(page.getByTestId("room-files-delete-dialog")).toBeHidden();
    });

    test.describe("errors", () => {
      test("reloads the files if the file is not found", async ({ page }) => {
        await mockMethod(page, "DELETE", deleteUrl(3), {
          status: 404,
          json: FILE_NOT_FOUND,
        });
        const files = await mockFiles(page, keepFiles(0, 2));

        await page
          .getByTestId("room-file-item")
          .nth(2)
          .getByTestId("room-files-delete-button")
          .click();
        await page
          .getByTestId("room-files-delete-dialog")
          .getByTestId("dialog-continue-button")
          .click();

        await nthRequest(files);

        await expectToastAndClose(page, "rooms.flash.file_gone");
        await expect(page.getByTestId("room-files-delete-dialog")).toBeHidden();
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
      });

      test("keeps the dialog open on a server error", async ({ page }) => {
        await mockMethod(page, "DELETE", deleteUrl(2), {
          status: 500,
          json: SERVER_ERROR,
        });

        await page
          .getByTestId("room-file-item")
          .nth(1)
          .getByTestId("room-files-delete-button")
          .click();

        const dialog = page.getByTestId("room-files-delete-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          'rooms.files.confirm_delete_{"filename":"File2.pdf"}',
        );

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
              .getByTestId("room-file-item")
              .nth(0)
              .getByTestId("room-files-delete-button")
              .click();
            const dialog = page.getByTestId("room-files-delete-dialog");
            await expect(dialog).toBeVisible();
            await dialog.getByTestId("dialog-continue-button").click();
          },
          "DELETE",
          deleteUrl(1),
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "DELETE", deleteUrl(1), {
          status: 404,
          json: ROOM_NOT_FOUND,
        });

        await page
          .getByTestId("room-file-item")
          .nth(0)
          .getByTestId("room-files-delete-button")
          .click();
        await page
          .getByTestId("room-files-delete-dialog")
          .getByTestId("dialog-continue-button")
          .click();

        await expectRedirectToRoomIndex(page);
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test.describe("change file settings", () => {
    const editUrl = (id) => `**/api/v1/rooms/abc-def-123/files/${id}`;
    const changedFile = (files) => {
      files.data[0].download = false;
      files.data[0].use_in_meeting = true;
    };

    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test.describe("with open dialog", () => {
      test.beforeEach(async ({ page }) => {
        await expect(
          page.getByTestId("room-files-configure-dialog"),
        ).toBeHidden();
        await page
          .getByTestId("room-file-item")
          .nth(0)
          .getByTestId("room-files-configure-button")
          .click();
      });

      test("shows the current settings", async ({ page }) => {
        const dialog = page.getByTestId("room-files-configure-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("rooms.files.configure");

        const download = dialog.getByTestId("download-field");
        await expect(download).toContainText("rooms.files.downloadable");
        await expect(download.locator("#download")).toBeChecked();

        const useInMeeting = dialog.getByTestId("use-in-meeting-field");
        await expect(useInMeeting).toContainText(
          "rooms.files.available_in_next_meeting",
        );
        await expect(useInMeeting.locator("#use_in_meeting")).not.toBeChecked();
      });

      test("shows the loading state while saving", async ({ page }) => {
        const dialog = page.getByTestId("room-files-configure-dialog");
        await dialog.locator("#download").click();
        await dialog.locator("#use_in_meeting").click();

        const edit = await mockMethod(page, "PATCH", editUrl(1), {
          status: 204,
          hold: true,
        });
        await mockFiles(page, changedFile);

        await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
          "app.save",
        );
        await dialog.getByTestId("dialog-save-button").click();

        await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
        await expect(dialog.locator("#download")).toBeDisabled();
        await expect(dialog.locator("#use_in_meeting")).toBeDisabled();
        await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
          "app.cancel",
        );
        await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();

        edit.release();

        await expect(dialog).toBeHidden();
      });

      test("saves the changed settings", async ({ page }) => {
        const dialog = page.getByTestId("room-files-configure-dialog");
        await dialog.locator("#download").click();
        await dialog.locator("#use_in_meeting").click();

        const edit = await mockMethod(page, "PATCH", editUrl(1), {
          status: 204,
        });
        const files = await mockFiles(page, changedFile);

        await dialog.getByTestId("dialog-save-button").click();

        const request = await nthRequest(edit);
        expect(request.postDataJSON()).toEqual({
          download: false,
          use_in_meeting: true,
        });
        await nthRequest(files);

        await expect(dialog).toBeHidden();

        // Check that file settings were changed
        const item = page.getByTestId("room-file-item").nth(0);
        await expect(item).toContainText("rooms.files.download_not_allowed");
        await expect(item).toContainText(
          "rooms.files.available_in_next_meeting",
        );
        await expect(item).not.toContainText("rooms.files.download_allowed");
        await expect(item).not.toContainText(
          "rooms.files.not_available_in_next_meeting",
        );
      });
    });

    test.describe("errors", () => {
      const validationErrors = [
        "The Downloadable field is required.",
        "The Use in the next meeting field is required.",
      ];

      test("reloads the files if the file is not found", async ({ page }) => {
        await mockMethod(page, "PATCH", editUrl(3), {
          status: 404,
          json: FILE_NOT_FOUND,
        });
        const files = await mockFiles(page, keepFiles(0, 2));

        await page
          .getByTestId("room-file-item")
          .nth(2)
          .getByTestId("room-files-configure-button")
          .click();
        await page
          .getByTestId("room-files-configure-dialog")
          .getByTestId("dialog-save-button")
          .click();

        await nthRequest(files);

        await expectToastAndClose(page, "rooms.flash.file_gone");
        await expect(
          page.getByTestId("room-files-configure-dialog"),
        ).toBeHidden();
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
      });

      test.describe("for the second file", () => {
        const validationResponse = {
          status: 422,
          json: {
            message: "The Downloadable field is required. (and 2 more errors)",
            errors: {
              download: [validationErrors[0]],
              use_in_meeting: [validationErrors[1]],
            },
          },
        };

        test.beforeEach(async ({ page }) => {
          await page
            .getByTestId("room-file-item")
            .nth(1)
            .getByTestId("room-files-configure-button")
            .click();
          await expect(
            page.getByTestId("room-files-configure-dialog"),
          ).toBeVisible();
        });

        test("shows validation errors", async ({ page }) => {
          await mockMethod(page, "PATCH", editUrl(2), validationResponse);

          const dialog = page.getByTestId("room-files-configure-dialog");
          await dialog.getByTestId("dialog-save-button").click();

          await expect(dialog).toBeVisible();
          for (const error of validationErrors) {
            await expect(dialog).toContainText(error);
          }
        });

        test("hides the validation errors after a server error", async ({
          page,
        }) => {
          const dialog = page.getByTestId("room-files-configure-dialog");

          await mockMethod(page, "PATCH", editUrl(2), validationResponse);
          await dialog.getByTestId("dialog-save-button").click();
          await expect(dialog).toContainText(validationErrors[0]);

          await mockMethod(page, "PATCH", editUrl(2), {
            status: 500,
            json: SERVER_ERROR,
          });
          await dialog.getByTestId("dialog-save-button").click();

          await expectToastAndClose(page, SERVER_ERROR_TOAST);
          await expect(dialog).toBeVisible();
          for (const error of validationErrors) {
            await expect(dialog).not.toContainText(error);
          }

          await dialog.getByTestId("dialog-cancel-button").click();
          await expect(dialog).toBeHidden();
        });
      });

      test("handles auth errors", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page
              .getByTestId("room-file-item")
              .nth(0)
              .getByTestId("room-files-configure-button")
              .click();
            const dialog = page.getByTestId("room-files-configure-dialog");
            await expect(dialog).toBeVisible();
            await dialog.getByTestId("dialog-save-button").click();
          },
          "PATCH",
          editUrl(1),
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "PATCH", editUrl(1), {
          status: 404,
          json: ROOM_NOT_FOUND,
        });

        await page
          .getByTestId("room-file-item")
          .nth(0)
          .getByTestId("room-files-configure-button")
          .click();
        await page
          .getByTestId("room-files-configure-dialog")
          .getByTestId("dialog-save-button")
          .click();

        await expectRedirectToRoomIndex(page);
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test.describe("set start presentation file", () => {
    const patchUrl = (id) => `**/api/v1/rooms/abc-def-123/files/${id}`;
    const startFileButton = (page, index) =>
      page
        .getByTestId("room-file-item")
        .nth(index)
        .getByTestId("room-files-start-file-button");

    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("shows which file is the start file", async ({ page }) => {
      const first = page.getByTestId("room-file-item").nth(0);
      await expect(first).toContainText("File1.pdf");
      await expect(first).toContainText(
        "rooms.files.not_available_in_next_meeting",
      );
      await expect(first).not.toContainText("rooms.files.start_file");
      await expect(startFileButton(page, 0)).toHaveText(
        "rooms.files.set_start_file",
      );

      const second = page.getByTestId("room-file-item").nth(1);
      await expect(second).toContainText("File2.pdf");
      await expect(second).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(second).toContainText("rooms.files.start_file");
      await expect(startFileButton(page, 1)).toHaveCount(0);
    });

    test("shows the loading state while saving", async ({ page }) => {
      const patch = await mockMethod(page, "PATCH", patchUrl(1), {
        status: 204,
        hold: true,
      });
      await mockFiles(page);

      await startFileButton(page, 0).click();

      await expect(startFileButton(page, 0)).toBeDisabled();
      patch.release();
    });

    test("sets the file as start file", async ({ page }) => {
      const patch = await mockMethod(page, "PATCH", patchUrl(1), {
        status: 204,
      });
      const files = await mockFiles(page, (files) => {
        files.data[0].is_start_file = true;
        files.data[0].use_in_meeting = true;
        files.data[1].is_start_file = false;
        files.start_file = { ...files.data[0], room_id: "abc-def-123" };
      });

      await startFileButton(page, 0).click();

      const request = await nthRequest(patch);
      expect(request.postDataJSON()).toEqual({ is_start_file: true });
      await nthRequest(files);

      // The file is the start file now
      const first = page.getByTestId("room-file-item").nth(0);
      await expect(first).toContainText("rooms.files.start_file");
      await expect(first).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(startFileButton(page, 0)).toHaveCount(0);

      // The other file is not the start file anymore
      const second = page.getByTestId("room-file-item").nth(1);
      await expect(second).not.toContainText("rooms.files.start_file");
      await expect(second).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(startFileButton(page, 1)).toHaveText(
        "rooms.files.set_start_file",
      );
    });

    test.describe("errors", () => {
      test("reloads the files if the file is not found", async ({ page }) => {
        await mockMethod(page, "PATCH", patchUrl(3), {
          status: 404,
          json: FILE_NOT_FOUND,
        });
        const files = await mockFiles(page, keepFiles(0, 2));

        await startFileButton(page, 2).click();
        await nthRequest(files);

        await expectToastAndClose(page, "rooms.flash.file_gone");
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
      });

      test("shows a server error", async ({ page }) => {
        await mockMethod(page, "PATCH", patchUrl(1), {
          status: 500,
          json: SERVER_ERROR,
        });

        await startFileButton(page, 0).click();

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
      });

      test("handles auth errors", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await startFileButton(page, 0).click();
          },
          "PATCH",
          patchUrl(1),
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "PATCH", patchUrl(1), {
          status: 404,
          json: ROOM_NOT_FOUND,
        });

        await startFileButton(page, 0).click();

        await expectRedirectToRoomIndex(page);
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test.describe("set system wide default presentation as start presentation", () => {
    const systemDefaultUrl = "**/api/v1/rooms/abc-def-123/files/system_default";
    const systemDefault = (page) =>
      page.getByTestId("room-file-system-default");
    const systemDefaultButton = (page) =>
      systemDefault(page).getByTestId("room-files-start-file-button");

    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("shows the system default as not being the start file", async ({
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
      await expect(systemDefaultButton(page)).toHaveText(
        "rooms.files.set_start_file",
      );

      const startFile = page.getByTestId("room-file-item").nth(1);
      await expect(startFile).toContainText("File2.pdf");
      await expect(startFile).toContainText("rooms.files.start_file");
    });

    test("shows the loading state while saving", async ({ page }) => {
      const patch = await mockMethod(page, "PATCH", systemDefaultUrl, {
        status: 204,
        hold: true,
      });
      await mockFiles(page);

      await systemDefaultButton(page).click();

      await expect(systemDefaultButton(page)).toBeDisabled();
      patch.release();
    });

    test("sets the system default as start file", async ({ page }) => {
      const patch = await mockMethod(page, "PATCH", systemDefaultUrl, {
        status: 204,
      });
      const files = await mockFiles(page, (files) => {
        files.system_default.prefer_as_start = true;
      });

      await systemDefaultButton(page).click();

      const request = await nthRequest(patch);
      expect(request.postDataJSON()).toEqual({ prefer_as_start: true });
      await nthRequest(files);

      // The system default is the start file now
      await expect(systemDefault(page)).toContainText("rooms.files.start_file");
      await expect(systemDefault(page)).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(systemDefaultButton(page)).toHaveCount(0);

      // The file is not shown as start file anymore
      const file = page.getByTestId("room-file-item").nth(1);
      await expect(file).not.toContainText("rooms.files.start_file");
      await expect(file).toContainText("rooms.files.available_in_next_meeting");
      await expect(file.getByTestId("room-files-start-file-button")).toHaveText(
        "rooms.files.set_start_file",
      );
    });

    test.describe("errors", () => {
      test("hides the system default if it is not set anymore", async ({
        page,
      }) => {
        await mockMethod(page, "PATCH", systemDefaultUrl, {
          status: 404,
          json: { message: "system_default_presentation_not_set" },
        });
        const files = await mockFiles(page, (files) => {
          files.system_default.file = null;
        });

        await systemDefaultButton(page).click();
        await nthRequest(files);

        await expect(systemDefault(page)).toHaveCount(0);
        await expectToastAndClose(
          page,
          "rooms.flash.default_presentation_not_set",
        );

        // The file is still the start file
        const file = page.getByTestId("room-file-item").nth(1);
        await expect(file).toContainText("rooms.files.start_file");
        await expect(
          file.getByTestId("room-files-start-file-button"),
        ).toHaveCount(0);
      });

      test("shows a server error", async ({ page }) => {
        await mockMethod(page, "PATCH", systemDefaultUrl, {
          status: 500,
          json: SERVER_ERROR,
        });

        await systemDefaultButton(page).click();

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
      });

      test("handles auth errors", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await systemDefaultButton(page).click();
          },
          "PATCH",
          systemDefaultUrl,
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "PATCH", systemDefaultUrl, {
          status: 404,
          json: ROOM_NOT_FOUND,
        });

        await systemDefaultButton(page).click();

        await expectRedirectToRoomIndex(page);
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });
  });

  test.describe("download file with terms of use", () => {
    test.use({ authenticated: false });

    test.beforeEach(async ({ page, config }) => {
      config.data.room.file_terms_of_use = "Test terms of use";
      await mockRoom(page, (room) => {
        room.data.current_user = null;
      });

      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("download button is not a link before accepting the terms", async ({
      page,
    }) => {
      const download = page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-download-button");

      await expect(download).not.toHaveAttribute("href");

      await download.click();

      await expect(
        page.getByTestId("terms-of-use-required-info"),
      ).toBeVisible();
      await expect(page.getByTestId("terms-of-use-required-info")).toHaveText(
        "rooms.files.terms_of_use.required",
      );
    });

    test("focuses the close button and returns the focus to the download button", async ({
      page,
    }) => {
      const download = page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-download-button");
      await download.click();
      await expect(
        page.getByTestId("terms-of-use-required-info"),
      ).toBeVisible();

      await page.keyboard.press("Tab");
      const closeButton = page.getByTestId("popover-close-button");
      await expect(closeButton).toBeFocused();

      await closeButton.click();
      await expect(page.getByTestId("terms-of-use-required-info")).toBeHidden();

      await expect(download).toBeFocused();
    });

    test("hides the required info after accepting the terms", async ({
      page,
    }) => {
      await page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-download-button")
        .click();
      await expect(
        page.getByTestId("terms-of-use-required-info"),
      ).toBeVisible();

      await page
        .getByTestId("terms-of-use-message")
        .locator("#terms_of_use")
        .click();

      await expect(page.getByTestId("terms-of-use-required-info")).toBeHidden();
    });

    test("download button is a link after accepting the terms", async ({
      page,
    }) => {
      await page
        .getByTestId("terms-of-use-message")
        .locator("#terms_of_use")
        .click();

      const download = page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-download-button");
      await expect(download).toHaveAttribute(
        "href",
        "https://example.com/files/File1.pdf?signature=abc123",
      );
      await expect(download).toHaveAttribute("rel", "opener");
      await expect(download).toHaveAttribute("target", "_blank");
    });
  });

  test.describe("download file with access code errors", () => {
    let roomAuthenticated;

    test.beforeEach(async ({ page }) => {
      roomAuthenticated = true;
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 0 } },
        }),
      );
    });

    async function openRoomWithAccessCode(page) {
      const room = await mockRoom(page, (data) => {
        data.data.owner = { id: 2, name: "Max Doe" };
        data.data.authenticated = roomAuthenticated;
      });
      const files = await mockFiles(page, () => {}, "roomFilesNoDetails.json");

      await page.goto("/rooms/abc-def-123#accessCode=123456789");

      await nthRequest(room);
      await nthRequest(files);
      await expect(page.getByTestId("room-file-item")).toHaveCount(2);

      return { room, files };
    }

    test("resets the room auth token on an invalid auth token", async ({
      page,
    }) => {
      const { room } = await openRoomWithAccessCode(page);

      roomAuthenticated = false;
      await postMessage(page, { type: "invalid_auth_token" });

      // Check that room auth token is reset
      const request = await nthRequest(room, 2);
      expect(queryOf(request)).not.toHaveProperty("room_auth_token");
      expect(queryOf(request)).not.toHaveProperty("room_auth_token_type");

      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid").first(),
      ).toBeVisible();
    });

    test("reloads the room without the room auth token after an invalid auth token", async ({
      page,
    }) => {
      const { room, files } = await openRoomWithAccessCode(page);

      roomAuthenticated = false;
      await postMessage(page, { type: "invalid_auth_token" });
      await nthRequest(room, 2);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");

      // Reload room (but without setting room auth token)
      roomAuthenticated = true;
      await page.getByTestId("reload-room-button").click();

      const request = await nthRequest(room, 3);
      expect(queryOf(request)).not.toHaveProperty("room_auth_token");
      await nthRequest(files, 2);
    });

    test("resets the room auth token if a code is required", async ({
      page,
    }) => {
      const { room } = await openRoomWithAccessCode(page);

      // The room auth token was reset by an invalid auth token
      roomAuthenticated = false;
      await postMessage(page, { type: "invalid_auth_token" });
      await nthRequest(room, 2);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");

      roomAuthenticated = true;
      await page.getByTestId("reload-room-button").click();
      await nthRequest(room, 3);

      roomAuthenticated = false;
      await postMessage(page, { type: "require_code" });

      // Check that room auth token is not set
      const request = await nthRequest(room, 4);
      expect(queryOf(request)).not.toHaveProperty("room_auth_token");
      expect(queryOf(request)).not.toHaveProperty("room_auth_token_type");

      await expectToastAndClose(page, "rooms.require_access_code");

      await expect(page.locator("#access-code")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toHaveCount(0);
    });
  });

  test.describe("download file with personalized link errors", () => {
    test.use({ authenticated: false });

    const personalizedLinkUrl = `/rooms/abc-def-123#personalizedLink=${PERSONALIZED_LINK}`;

    test.beforeEach(async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.username = "Max Doe";
        room.data.current_user = null;
      });
    });

    test("removes the personalized link on an invalid auth token", async ({
      page,
    }) => {
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 1 } },
        }),
      );

      await page.goto(personalizedLinkUrl);
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);

      const auth = await mockMethod(page, "POST", ROOM_AUTH_URL, {
        status: 401,
        json: { message: "invalid_personalized_link" },
      });
      await postMessage(page, { type: "invalid_auth_token" });
      await nthRequest(auth);

      // Check that sessionStorage is cleared
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBeNull();

      // Check that error message is shown and url changed
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
      await page.route(ROOM_AUTH_URL, (route) =>
        route.fulfill({
          status: 201,
          json: { data: { id: "roomAuthToken", type: 1 } },
        }),
      );

      await page.goto(personalizedLinkUrl);
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);

      await postMessage(page, { type: "guests_only" });

      await expectToastAndClose(page, "app.flash.guests_only");

      // Check that redirected to home page
      await expect(page).not.toHaveURL(/\/rooms/);
    });
  });

  test.describe("download file errors", () => {
    test.beforeEach(async ({ page, config }) => {
      config.data.room.file_terms_of_use = "Test terms of use";
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("reloads the files if the file is not found", async ({ page }) => {
      const files = await mockFiles(page, keepFiles(1, 3));

      await postMessage(page, { type: "file_not_found" });

      await nthRequest(files);
      await expectToastAndClose(page, "rooms.flash.file_gone");
      await expect(page.getByTestId("room-file-item")).toHaveCount(2);
    });

    test("reloads the files if the file is not found (not_found)", async ({
      page,
    }) => {
      const files = await mockFiles(page, keepFiles(1, 2));

      await postMessage(page, { type: "not_found" });

      await nthRequest(files);
      await expectToastAndClose(page, "rooms.flash.file_gone");
      await expect(page.getByTestId("room-file-item")).toHaveCount(1);
    });

    test.describe("forbidden", () => {
      let reloadRoom;

      test.beforeEach(async ({ page }) => {
        await mockFiles(page, () => {}, "roomFilesNoDetails.json");

        // The room is only reloaded after the files, to check the intermediate state
        const room = readFixture("room.json");
        room.data.current_user = null;
        reloadRoom = await mockMethod(page, "GET", isRoomRequest, {
          status: 200,
          json: room,
          hold: true,
        });
      });

      test("reloads only the files first", async ({ page }) => {
        await postMessage(page, { type: "forbidden" });

        await expectToastAndClose(page, "rooms.flash.file_forbidden");
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);

        // Check that rest of the page is not yet updated
        await expect(page.getByText("auth.login")).toHaveCount(0);
      });

      test("reloads the room and the files afterwards", async ({ page }) => {
        const check = await mockMethod(
          page,
          "POST",
          PARTICIPANT_NAME_CHECK_URL,
          {
            status: 204,
          },
        );
        await postMessage(page, { type: "forbidden" });

        await expectToastAndClose(page, "rooms.flash.file_forbidden");
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);

        // Check that room and files are reloaded (because of changes in the room (current_user))
        const files = await mockFiles(
          page,
          keepFiles(0, 1),
          "roomFilesNoDetails.json",
        );
        reloadRoom.release();
        await nthRequest(reloadRoom);
        await nthRequest(check);

        await expect(page.getByTestId("room-access-overlay")).toBeHidden();
        await nthRequest(files);

        // Check that file list was updated again
        await expect(page.getByTestId("room-file-item")).toHaveCount(1);

        // Check that action buttons are hidden and download agreement message is shown
        const item = page.getByTestId("room-file-item").nth(0);
        await expect(page.getByTestId("room-files-upload-button")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("terms-of-use-message")).toBeVisible();
        await expect(
          item.getByTestId("room-files-download-button"),
        ).toBeEnabled();
        await expect(
          item.getByTestId("room-files-configure-button"),
        ).toHaveCount(0);
        await expect(item.getByTestId("room-files-delete-button")).toHaveCount(
          0,
        );

        // Check that rest of the page is updated
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });
    });

    test("shows an error if guests are not allowed", async ({ page }) => {
      await postMessage(page, { type: "guests_not_allowed" });

      await expect(
        page.getByText("rooms.only_used_by_authenticated_users").first(),
      ).toBeVisible();
    });

    const ignoredMessages = {
      null: null,
      undefined: undefined,
      "without type": {},
      "with null type": { type: null },
    };

    for (const [name, message] of Object.entries(ignoredMessages)) {
      test(`ignores messages ${name}`, async ({ page }) => {
        const files = await mockFiles(page);

        await postMessage(page, message);

        // Check that files are still there, toast message is not shown and files are not reloaded
        await expect(page.getByTestId("room-file-item")).toHaveCount(3);
        await expect(page.locator(".p-toast-message")).toHaveCount(0);
        expect(files.requests).toHaveLength(0);
      });
    }
  });

  test.describe("download file errors with different base url", () => {
    test.beforeEach(async ({ page, config }) => {
      config.data.room.file_terms_of_use = "Test terms of use";
      config.data.general.base_url = "";
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("ignores messages from the app url", async ({ page }) => {
      const files = await mockFiles(page);

      await postMessage(page, { type: "file_not_found" });

      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(page.locator(".p-toast-message")).toHaveCount(0);
      expect(files.requests).toHaveLength(0);
    });
  });
});
