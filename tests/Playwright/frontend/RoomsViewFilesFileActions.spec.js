import { readFileSync } from "node:fs";
import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/roomsFilesRecordings.js";
import {
  mockMethod,
  nthRequest,
  parseFormData,
  queryOf,
  readFixture,
} from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  setValidRememberedParticipantName,
} from "../support/room.js";

test.use({ authenticated: true });

test.describe("Rooms view files file actions", () => {
  test.beforeEach(async ({ page }) => {
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

      test("shows the loading state while uploading", async ({
        page,
        roomFiles,
      }) => {
        const upload = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/files",
          { status: 204, hold: true },
        );
        roomFiles.data.push({
          id: 4,
          filename: "testFile.txt",
          download: false,
          use_in_meeting: false,
          is_start_file: false,
          uploaded: "2020-09-21T07:10:00.000000Z",
        });
        roomFiles.meta.per_page = 4;
        roomFiles.meta.to = 4;
        roomFiles.meta.total = 4;
        roomFiles.meta.total_no_filter = 4;

        await page
          .locator("#file")
          .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");

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
        test(`uploads ${name}`, async ({ page, roomFiles }) => {
          // The request is held while the body is read, the browser releases the file after the response
          const upload = await mockMethod(
            page,
            "POST",
            "**/api/v1/rooms/abc-def-123/files",
            { status: 204, hold: true },
          );
          roomFiles.data.push({
            id: 4,
            filename: name,
            download: false,
            use_in_meeting: false,
            is_start_file: false,
            uploaded: "2020-09-21T07:10:00.000000Z",
          });
          roomFiles.meta.per_page = 4;
          roomFiles.meta.to = 4;
          roomFiles.meta.total = 4;
          roomFiles.meta.total_no_filter = 4;
          const files = await mockMethod(
            page,
            "GET",
            "**/api/v1/rooms/abc-def-123/files*",
            { json: roomFiles },
          );

          const uploadRequest = page.waitForRequest(
            (request) =>
              request.method() === "POST" && request.url().includes("/files"),
          );
          // An in-memory file, Chromium does not expose the content of files from disk in intercepted request bodies
          await page.locator("#file").setInputFiles({
            name,
            mimeType: "text/plain",
            buffer: readFileSync(`tests/Playwright/fixtures/files/${name}`),
          });

          const formData = await parseFormData(await uploadRequest);
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

      test("keeps the messages of all uploaded files", async ({
        page,
        roomFiles,
      }) => {
        await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
          status: 204,
        });
        roomFiles.data.push({
          id: 4,
          filename: "testFile.txt",
          download: false,
          use_in_meeting: false,
          is_start_file: false,
          uploaded: "2020-09-21T07:10:00.000000Z",
        });
        roomFiles.meta.per_page = 4;
        roomFiles.meta.to = 4;
        roomFiles.meta.total = 4;
        roomFiles.meta.total_no_filter = 4;

        const dialog = page.getByTestId("room-files-upload-dialog");
        await page
          .locator("#file")
          .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");
        await expect(dialog.getByTestId("uploaded-file-message")).toHaveCount(
          1,
        );

        roomFiles.data.push({
          id: 5,
          filename: "testFile2.txt",
          download: false,
          use_in_meeting: false,
          is_start_file: false,
          uploaded: "2020-09-21T07:10:00.000000Z",
        });
        roomFiles.meta.per_page = 5;
        roomFiles.meta.to = 5;
        roomFiles.meta.total = 5;
        roomFiles.meta.total_no_filter = 5;
        await page
          .locator("#file")
          .setInputFiles("tests/Playwright/fixtures/files/testFile2.txt");

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
        roomFiles,
      }) => {
        await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
          status: 204,
        });
        for (const [index, name] of [
          "testFile.txt",
          "testFile2.txt",
        ].entries()) {
          roomFiles.data.push({
            id: 4 + index,
            filename: name,
            download: false,
            use_in_meeting: false,
            is_start_file: false,
            uploaded: "2020-09-21T07:10:00.000000Z",
          });
        }
        roomFiles.meta.per_page = 5;
        roomFiles.meta.to = 5;
        roomFiles.meta.total = 5;
        roomFiles.meta.total_no_filter = 5;

        const dialog = page.getByTestId("room-files-upload-dialog");
        await page
          .locator("#file")
          .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");
        await page
          .locator("#file")
          .setInputFiles("tests/Playwright/fixtures/files/testFile2.txt");
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
        test("shows an error if the file is too large", async ({ page }) => {
          await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
            status: 413,
          });

          await page
            .locator("#file")
            .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");

          const dialog = page.getByTestId("room-files-upload-dialog");
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText("app.file.too_large");
        });

        test("shows validation errors", async ({ page }) => {
          await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
            status: 422,
            json: {
              message: "The File must be a file of type: pdf, doc.",
              errors: { file: ["The File must be a file of type: pdf, doc."] },
            },
          });

          await page
            .locator("#file")
            .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");

          const dialog = page.getByTestId("room-files-upload-dialog");
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText(
            "The File must be a file of type: pdf, doc.",
          );
        });

        test("shows a toast on a server error", async ({ page }) => {
          await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
            status: 500,
            json: { message: "Test" },
          });

          await page
            .locator("#file")
            .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");

          await expectToastAndClose(page, [
            'app.flash.server_error.message_{"message":"Test"}',
            'app.flash.server_error.error_code_{"statusCode":500}',
          ]);
          await expect(
            page.getByTestId("room-files-upload-dialog"),
          ).toBeVisible();
        });

        test("hides the validation errors after a server error", async ({
          page,
        }) => {
          const dialog = page.getByTestId("room-files-upload-dialog");
          await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
            status: 422,
            json: {
              message: "The File must be a file of type: pdf, doc.",
              errors: { file: ["The File must be a file of type: pdf, doc."] },
            },
          });
          await page
            .locator("#file")
            .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");
          await expect(dialog).toContainText(
            "The File must be a file of type: pdf, doc.",
          );

          await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
            status: 500,
            json: { message: "Test" },
          });
          await page
            .locator("#file")
            .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");

          await expectToastAndClose(page, [
            'app.flash.server_error.message_{"message":"Test"}',
            'app.flash.server_error.error_code_{"statusCode":500}',
          ]);
          await expect(dialog).toBeVisible();
          await expect(dialog).not.toContainText(
            "The File must be a file of type: pdf, doc.",
          );
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
          "**/api/v1/rooms/abc-def-123/files",
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/files", {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
        });

        await page.getByTestId("room-files-upload-button").click();
        await expect(
          page.getByTestId("room-files-upload-dialog"),
        ).toBeVisible();
        await page
          .locator("#file")
          .setInputFiles("tests/Playwright/fixtures/files/testFile.txt");

        await expect(page).toHaveURL(
          (url) =>
            url.pathname.startsWith("/rooms") &&
            !url.href.includes("abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("delete file", () => {
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

    test("shows the loading state while deleting", async ({
      page,
      roomFiles,
    }) => {
      const remove = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/files/1",
        { status: 204, hold: true },
      );
      roomFiles.data.shift();
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;

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

    test("deletes the file", async ({ page, roomFiles }) => {
      const remove = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/files/1",
        { status: 204 },
      );
      roomFiles.data.shift();
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: roomFiles },
      );

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
      test("reloads the files if the file is not found", async ({
        page,
        roomFiles,
      }) => {
        await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/files/3",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room_file",
              ids: [3],
            },
          },
        );
        roomFiles.data.pop();
        roomFiles.meta.to = 2;
        roomFiles.meta.total = 2;
        roomFiles.meta.total_no_filter = 2;
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: roomFiles },
        );

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
        await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/files/2",
          {
            status: 500,
            json: { message: "Test" },
          },
        );

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
              .getByTestId("room-file-item")
              .nth(0)
              .getByTestId("room-files-delete-button")
              .click();
            const dialog = page.getByTestId("room-files-delete-dialog");
            await expect(dialog).toBeVisible();
            await dialog.getByTestId("dialog-continue-button").click();
          },
          "DELETE",
          "**/api/v1/rooms/abc-def-123/files/1",
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/files/1",
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
          .getByTestId("room-file-item")
          .nth(0)
          .getByTestId("room-files-delete-button")
          .click();
        await page
          .getByTestId("room-files-delete-dialog")
          .getByTestId("dialog-continue-button")
          .click();

        await expect(page).toHaveURL(
          (url) =>
            url.pathname.startsWith("/rooms") &&
            !url.href.includes("abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("change file settings", () => {
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

      test("shows the loading state while saving", async ({
        page,
        roomFiles,
      }) => {
        const dialog = page.getByTestId("room-files-configure-dialog");
        await dialog.locator("#download").click();
        await dialog.locator("#use_in_meeting").click();

        const edit = await mockMethod(
          page,
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/1",
          { status: 204, hold: true },
        );
        roomFiles.data[0].download = false;
        roomFiles.data[0].use_in_meeting = true;

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

      test("saves the changed settings", async ({ page, roomFiles }) => {
        const dialog = page.getByTestId("room-files-configure-dialog");
        await dialog.locator("#download").click();
        await dialog.locator("#use_in_meeting").click();

        const edit = await mockMethod(
          page,
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/1",
          { status: 204 },
        );
        roomFiles.data[0].download = false;
        roomFiles.data[0].use_in_meeting = true;
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: roomFiles },
        );

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
      test("reloads the files if the file is not found", async ({
        page,
        roomFiles,
      }) => {
        await mockMethod(page, "PATCH", "**/api/v1/rooms/abc-def-123/files/3", {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room_file",
            ids: [3],
          },
        });
        roomFiles.data.pop();
        roomFiles.meta.to = 2;
        roomFiles.meta.total = 2;
        roomFiles.meta.total_no_filter = 2;
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: roomFiles },
        );

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
          await mockMethod(
            page,
            "PATCH",
            "**/api/v1/rooms/abc-def-123/files/2",
            {
              status: 422,
              json: {
                message:
                  "The Downloadable field is required. (and 2 more errors)",
                errors: {
                  download: ["The Downloadable field is required."],
                  use_in_meeting: [
                    "The Use in the next meeting field is required.",
                  ],
                },
              },
            },
          );

          const dialog = page.getByTestId("room-files-configure-dialog");
          await dialog.getByTestId("dialog-save-button").click();

          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText(
            "The Downloadable field is required.",
          );
          await expect(dialog).toContainText(
            "The Use in the next meeting field is required.",
          );
        });

        test("hides the validation errors after a server error", async ({
          page,
        }) => {
          const dialog = page.getByTestId("room-files-configure-dialog");

          await mockMethod(
            page,
            "PATCH",
            "**/api/v1/rooms/abc-def-123/files/2",
            {
              status: 422,
              json: {
                message:
                  "The Downloadable field is required. (and 2 more errors)",
                errors: {
                  download: ["The Downloadable field is required."],
                  use_in_meeting: [
                    "The Use in the next meeting field is required.",
                  ],
                },
              },
            },
          );
          await dialog.getByTestId("dialog-save-button").click();
          await expect(dialog).toContainText(
            "The Downloadable field is required.",
          );

          await mockMethod(
            page,
            "PATCH",
            "**/api/v1/rooms/abc-def-123/files/2",
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
          await expect(dialog).not.toContainText(
            "The Downloadable field is required.",
          );
          await expect(dialog).not.toContainText(
            "The Use in the next meeting field is required.",
          );

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
          "**/api/v1/rooms/abc-def-123/files/1",
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "PATCH", "**/api/v1/rooms/abc-def-123/files/1", {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
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

        await expect(page).toHaveURL(
          (url) =>
            url.pathname.startsWith("/rooms") &&
            !url.href.includes("abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("set start presentation file", () => {
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
      await expect(
        first.getByTestId("room-files-start-file-button"),
      ).toHaveText("rooms.files.set_start_file");

      const second = page.getByTestId("room-file-item").nth(1);
      await expect(second).toContainText("File2.pdf");
      await expect(second).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(second).toContainText("rooms.files.start_file");
      await expect(
        second.getByTestId("room-files-start-file-button"),
      ).toHaveCount(0);
    });

    test("shows the loading state while saving", async ({ page }) => {
      const patch = await mockMethod(
        page,
        "PATCH",
        "**/api/v1/rooms/abc-def-123/files/1",
        { status: 204, hold: true },
      );

      const startFileButton = page
        .getByTestId("room-file-item")
        .nth(0)
        .getByTestId("room-files-start-file-button");
      await startFileButton.click();

      await expect(startFileButton).toBeDisabled();
      patch.release();
    });

    test("sets the file as start file", async ({ page, roomFiles }) => {
      const patch = await mockMethod(
        page,
        "PATCH",
        "**/api/v1/rooms/abc-def-123/files/1",
        { status: 204 },
      );
      roomFiles.data[0].is_start_file = true;
      roomFiles.data[0].use_in_meeting = true;
      roomFiles.data[1].is_start_file = false;
      roomFiles.start_file = { ...roomFiles.data[0], room_id: "abc-def-123" };
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: roomFiles },
      );

      const first = page.getByTestId("room-file-item").nth(0);
      await first.getByTestId("room-files-start-file-button").click();

      const request = await nthRequest(patch);
      expect(request.postDataJSON()).toEqual({ is_start_file: true });
      await nthRequest(files);

      // The file is the start file now
      await expect(first).toContainText("rooms.files.start_file");
      await expect(first).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(
        first.getByTestId("room-files-start-file-button"),
      ).toHaveCount(0);

      // The other file is not the start file anymore
      const second = page.getByTestId("room-file-item").nth(1);
      await expect(second).not.toContainText("rooms.files.start_file");
      await expect(second).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(
        second.getByTestId("room-files-start-file-button"),
      ).toHaveText("rooms.files.set_start_file");
    });

    test.describe("errors", () => {
      test("reloads the files if the file is not found", async ({
        page,
        roomFiles,
      }) => {
        await mockMethod(page, "PATCH", "**/api/v1/rooms/abc-def-123/files/3", {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room_file",
            ids: [3],
          },
        });
        roomFiles.data.pop();
        roomFiles.meta.to = 2;
        roomFiles.meta.total = 2;
        roomFiles.meta.total_no_filter = 2;
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: roomFiles },
        );

        await page
          .getByTestId("room-file-item")
          .nth(2)
          .getByTestId("room-files-start-file-button")
          .click();
        await nthRequest(files);

        await expectToastAndClose(page, "rooms.flash.file_gone");
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);
      });

      test("shows a server error", async ({ page }) => {
        await mockMethod(page, "PATCH", "**/api/v1/rooms/abc-def-123/files/1", {
          status: 500,
          json: { message: "Test" },
        });

        await page
          .getByTestId("room-file-item")
          .nth(0)
          .getByTestId("room-files-start-file-button")
          .click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("handles auth errors", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page
              .getByTestId("room-file-item")
              .nth(0)
              .getByTestId("room-files-start-file-button")
              .click();
          },
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/1",
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "PATCH", "**/api/v1/rooms/abc-def-123/files/1", {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
        });

        await page
          .getByTestId("room-file-item")
          .nth(0)
          .getByTestId("room-files-start-file-button")
          .click();

        await expect(page).toHaveURL(
          (url) =>
            url.pathname.startsWith("/rooms") &&
            !url.href.includes("abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("set system wide default presentation as start presentation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=files");
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
    });

    test("shows the system default as not being the start file", async ({
      page,
    }) => {
      const systemDefault = page.getByTestId("room-file-system-default");
      await expect(systemDefault).toContainText("rooms.files.system_default");
      await expect(systemDefault).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(systemDefault).not.toContainText("rooms.files.start_file");
      await expect(
        systemDefault.getByTestId("room-files-start-file-button"),
      ).toHaveText("rooms.files.set_start_file");

      const startFile = page.getByTestId("room-file-item").nth(1);
      await expect(startFile).toContainText("File2.pdf");
      await expect(startFile).toContainText("rooms.files.start_file");
    });

    test("shows the loading state while saving", async ({ page }) => {
      const patch = await mockMethod(
        page,
        "PATCH",
        "**/api/v1/rooms/abc-def-123/files/system_default",
        { status: 204, hold: true },
      );

      const systemDefaultButton = page
        .getByTestId("room-file-system-default")
        .getByTestId("room-files-start-file-button");
      await systemDefaultButton.click();

      await expect(systemDefaultButton).toBeDisabled();
      patch.release();
    });

    test("sets the system default as start file", async ({
      page,
      roomFiles,
    }) => {
      const patch = await mockMethod(
        page,
        "PATCH",
        "**/api/v1/rooms/abc-def-123/files/system_default",
        { status: 204 },
      );
      roomFiles.system_default.prefer_as_start = true;
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: roomFiles },
      );

      const systemDefault = page.getByTestId("room-file-system-default");
      const systemDefaultButton = systemDefault.getByTestId(
        "room-files-start-file-button",
      );
      await systemDefaultButton.click();

      const request = await nthRequest(patch);
      expect(request.postDataJSON()).toEqual({ prefer_as_start: true });
      await nthRequest(files);

      // The system default is the start file now
      await expect(systemDefault).toContainText("rooms.files.start_file");
      await expect(systemDefault).toContainText(
        "rooms.files.available_in_next_meeting",
      );
      await expect(systemDefaultButton).toHaveCount(0);

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
        roomFiles,
      }) => {
        await mockMethod(
          page,
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/system_default",
          {
            status: 404,
            json: { message: "system_default_presentation_not_set" },
          },
        );
        roomFiles.system_default.file = null;
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: roomFiles },
        );

        const systemDefault = page.getByTestId("room-file-system-default");
        await systemDefault.getByTestId("room-files-start-file-button").click();
        await nthRequest(files);

        await expect(systemDefault).toHaveCount(0);
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
        await mockMethod(
          page,
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/system_default",
          { status: 500, json: { message: "Test" } },
        );

        await page
          .getByTestId("room-file-system-default")
          .getByTestId("room-files-start-file-button")
          .click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("handles auth errors", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page
              .getByTestId("room-file-system-default")
              .getByTestId("room-files-start-file-button")
              .click();
          },
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/system_default",
          "files",
        );
      });

      test("redirects to the room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(
          page,
          "PATCH",
          "**/api/v1/rooms/abc-def-123/files/system_default",
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
          .getByTestId("room-file-system-default")
          .getByTestId("room-files-start-file-button")
          .click();

        await expect(page).toHaveURL(
          (url) =>
            url.pathname.startsWith("/rooms") &&
            !url.href.includes("abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("download file with terms of use", () => {
    test.use({ authenticated: false });

    test.beforeEach(async ({ page, config, room }) => {
      config.data.room.file_terms_of_use = "Test terms of use";
      room.data.current_user = null;

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
    test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

    test.beforeEach(async ({ page, room }) => {
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
      });
      room.data.owner = { id: 2, name: "Max Doe" };

      await page.goto("/rooms/abc-def-123#accessCode=123456789");
      await expect(page.getByTestId("room-file-item")).toHaveCount(2);
    });

    test("resets the room auth token on an invalid auth token", async ({
      page,
      room,
      postMessage,
    }) => {
      const roomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        { json: room },
      );

      room.data.authenticated = false;
      await postMessage({ type: "invalid_auth_token" });

      // Check that room auth token is reset
      const request = await nthRequest(roomRequests);
      expect(queryOf(request)).not.toHaveProperty("room_auth_token");
      expect(queryOf(request)).not.toHaveProperty("room_auth_token_type");

      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid").first(),
      ).toBeVisible();
    });

    test("reloads the room without the room auth token after an invalid auth token", async ({
      page,
      room,
      postMessage,
    }) => {
      const roomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        { json: room },
      );
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: readFixture("roomFilesNoDetails.json") },
      );

      room.data.authenticated = false;
      await postMessage({ type: "invalid_auth_token" });
      await nthRequest(roomRequests, 1);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");

      // Reload room (but without setting room auth token)
      room.data.authenticated = true;
      await page.getByTestId("reload-room-button").click();

      const request = await nthRequest(roomRequests, 2);
      expect(queryOf(request)).not.toHaveProperty("room_auth_token");
      await nthRequest(files, 1);
    });

    test("resets the room auth token if a code is required", async ({
      page,
      room,
      postMessage,
    }) => {
      const roomRequests = await mockMethod(
        page,
        "GET",
        (url) => url.pathname === "/api/v1/rooms/abc-def-123",
        { json: room },
      );

      // The room auth token was reset by an invalid auth token
      room.data.authenticated = false;
      await postMessage({ type: "invalid_auth_token" });
      await nthRequest(roomRequests, 1);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");

      room.data.authenticated = true;
      await page.getByTestId("reload-room-button").click();
      await nthRequest(roomRequests, 2);

      room.data.authenticated = false;
      await postMessage({ type: "require_code" });

      // Check that room auth token is not set
      const request = await nthRequest(roomRequests, 3);
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

    test.beforeEach(async ({ room }) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;
    });

    test("removes the personalized link on an invalid auth token", async ({
      page,
      postMessage,
    }) => {
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);

      const auth = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/auth",
        { status: 401, json: { message: "invalid_personalized_link" } },
      );
      await postMessage({ type: "invalid_auth_token" });
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
      postMessage,
    }) => {
      await mockMethod(page, "POST", "**/api/v1/rooms/abc-def-123/auth", {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
      });

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
      await expect(page.getByTestId("room-file-item")).toHaveCount(3);

      await postMessage({ type: "guests_only" });

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

    test("reloads the files if the file is not found", async ({
      page,
      roomFiles,
      postMessage,
    }) => {
      roomFiles.data.shift();
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: roomFiles },
      );

      await postMessage({ type: "file_not_found" });

      await nthRequest(files);
      await expectToastAndClose(page, "rooms.flash.file_gone");
      await expect(page.getByTestId("room-file-item")).toHaveCount(2);
    });

    test("reloads the files if the file is not found (not_found)", async ({
      page,
      roomFiles,
      postMessage,
    }) => {
      roomFiles.data = [roomFiles.data[1]];
      roomFiles.meta.to = 1;
      roomFiles.meta.total = 1;
      roomFiles.meta.total_no_filter = 1;
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: roomFiles },
      );

      await postMessage({ type: "not_found" });

      await nthRequest(files);
      await expectToastAndClose(page, "rooms.flash.file_gone");
      await expect(page.getByTestId("room-file-item")).toHaveCount(1);
    });

    test.describe("forbidden", () => {
      test("reloads only the files first", async ({
        page,
        room,
        postMessage,
      }) => {
        await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123/files*", {
          json: readFixture("roomFilesNoDetails.json"),
        });

        // The room is only reloaded after the files, to check the intermediate state
        room.data.current_user = null;
        await mockMethod(
          page,
          "GET",
          (url) => url.pathname === "/api/v1/rooms/abc-def-123",
          { json: room, hold: true },
        );

        await postMessage({ type: "forbidden" });

        await expectToastAndClose(page, "rooms.flash.file_forbidden");
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);

        // Check that rest of the page is not yet updated
        await expect(page.getByText("auth.login")).toHaveCount(0);
      });

      test("reloads the room and the files afterwards", async ({
        page,
        room,
        postMessage,
      }) => {
        const filesWithoutDetails = readFixture("roomFilesNoDetails.json");
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: filesWithoutDetails },
        );

        // The room is only reloaded after the files, to check the intermediate state
        room.data.current_user = null;
        const reloadRoom = await mockMethod(
          page,
          "GET",
          (url) => url.pathname === "/api/v1/rooms/abc-def-123",
          { json: room, hold: true },
        );

        const check = await mockMethod(
          page,
          "POST",
          "**/api/v1/participantName/check",
          { status: 204 },
        );
        await postMessage({ type: "forbidden" });

        await expectToastAndClose(page, "rooms.flash.file_forbidden");
        await expect(page.getByTestId("room-file-item")).toHaveCount(2);

        // Check that room and files are reloaded (because of changes in the room (current_user))
        filesWithoutDetails.data = [filesWithoutDetails.data[0]];
        filesWithoutDetails.meta.to = 1;
        filesWithoutDetails.meta.total = 1;
        filesWithoutDetails.meta.total_no_filter = 1;
        reloadRoom.release();
        await nthRequest(reloadRoom);
        await nthRequest(check);

        await expect(page.getByTestId("room-access-overlay")).toBeHidden();
        await nthRequest(files, 2);

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

    test("shows an error if guests are not allowed", async ({
      page,
      postMessage,
    }) => {
      await postMessage({ type: "guests_not_allowed" });

      await expect(
        page.getByText("rooms.only_used_by_authenticated_users").first(),
      ).toBeVisible();
    });

    for (const [name, message] of [
      ["null", null],
      ["undefined", undefined],
      ["without type", {}],
      ["with null type", { type: null }],
    ]) {
      test(`ignores messages ${name}`, async ({
        page,
        roomFiles,
        postMessage,
      }) => {
        const files = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123/files*",
          { json: roomFiles },
        );

        await postMessage(message);

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

    test("ignores messages from the app url", async ({
      page,
      roomFiles,
      postMessage,
    }) => {
      const files = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123/files*",
        { json: roomFiles },
      );

      await postMessage({ type: "file_not_found" });

      await expect(page.getByTestId("room-file-item")).toHaveCount(3);
      await expect(page.locator(".p-toast-message")).toHaveCount(0);
      expect(files.requests).toHaveLength(0);
    });
  });
});
