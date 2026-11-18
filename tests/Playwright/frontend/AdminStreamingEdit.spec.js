import { mergeTests } from "@playwright/test";
import { test as streamingControllerTest } from "../support/fixtures/streamingController.js";
import { test as roomTypeStreamingControllerTest } from "../support/fixtures/roomTypeStreamingController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { readFileSync } from "node:fs";
import { checkSettingsFileSelector } from "../support/admin.js";
import {
  mockApiRequest,
  getRequestFormData,
  expectActivePage,
  readFixture,
  validationErrors,
  serverError,
} from "../support/utils.js";

const test = mergeTests(
  streamingControllerTest,
  roomTypeStreamingControllerTest,
);

test.describe("Admin streaming settings with edit permission", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ configResponse, currentUserResponse }) => {
    configResponse.data.streaming.enabled = true;
    currentUserResponse.data.permissions = [
      "admin.view",
      "streaming.viewAny",
      "streaming.update",
    ];
  });

  test.describe("general settings", () => {
    test("show settings", async ({ page }) => {
      await page.goto("/admin/streaming_settings");
      await expect(
        page.getByText("admin.streaming.general.title"),
      ).toBeVisible();

      const pauseImageField = page.getByTestId("default-pause-image-field");
      await expect(pauseImageField).toBeVisible();
      await expect(pauseImageField).toContainText(
        "admin.streaming.default_pause_image",
      );
      await checkSettingsFileSelector(
        page,
        pauseImageField,
        "",
        "pause.jpg",
        true,
      );

      const cssField = page.getByTestId("css-file-field");
      await expect(cssField).toBeVisible();
      await expect(cssField).toContainText("admin.streaming.css_file");
      await checkSettingsFileSelector(
        page,
        cssField,
        "",
        "streaming.css",
        true,
      );

      const joinParametersField = page.getByTestId("join-parameters-field");
      await expect(joinParametersField).toBeVisible();
      await expect(joinParametersField).toContainText(
        "admin.streaming.join_parameters",
      );
      await expect(joinParametersField).toContainText(
        "admin.streaming.join_parameters_description",
      );
      await expect(joinParametersField.locator("#join-parameters")).toHaveValue(
        "",
      );
      await expect(
        joinParametersField.locator("#join-parameters"),
      ).toBeEnabled();
    });

    test("show saved settings", async ({ page, streamingResponse }) => {
      streamingResponse.data.default_pause_image =
        "https://example.com/image.png";
      streamingResponse.data.css_file = "https://example.com/streaming.css";
      streamingResponse.data.join_parameters =
        "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
      await page.goto("/admin/streaming_settings");

      const pauseImageField = page.getByTestId("default-pause-image-field");
      await expect(pauseImageField).toBeVisible();
      await expect(pauseImageField).toContainText(
        "admin.streaming.default_pause_image",
      );
      await checkSettingsFileSelector(
        page,
        pauseImageField,
        "https://example.com/image.png",
        "pause.jpg",
        true,
      );

      const cssField = page.getByTestId("css-file-field");
      await expect(cssField).toBeVisible();
      await expect(cssField).toContainText("admin.streaming.css_file");
      await checkSettingsFileSelector(
        page,
        cssField,
        "https://example.com/streaming.css",
        "streaming.css",
        true,
      );

      const joinParametersField = page.getByTestId("join-parameters-field");
      await expect(joinParametersField).toContainText(
        "admin.streaming.join_parameters",
      );
      await expect(joinParametersField).toContainText(
        "admin.streaming.join_parameters_description",
      );
      await expect(joinParametersField.locator("#join-parameters")).toHaveValue(
        "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true",
      );
      await expect(
        joinParametersField.locator("#join-parameters"),
      ).toBeEnabled();
    });

    test.describe("save changes", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/streaming_settings");
        await expect(page.getByTestId("save-button")).toBeEnabled();

        await checkSettingsFileSelector(
          page,
          page.getByTestId("default-pause-image-field"),
          "",
          "pause.jpg",
          true,
        );
        await checkSettingsFileSelector(
          page,
          page.getByTestId("css-file-field"),
          "",
          "streaming.css",
          true,
        );
        await page
          .getByTestId("default-pause-image-field")
          .getByTestId("file-input-input")
          .setInputFiles({
            name: "pause.jpg",
            mimeType: "image/jpeg",
            buffer: readFileSync("tests/Playwright/fixtures/files/pause.jpg"),
          });
        await page
          .getByTestId("css-file-field")
          .getByTestId("file-input-input")
          .setInputFiles({
            name: "streaming.css",
            mimeType: "text/css",
            buffer: readFileSync(
              "tests/Playwright/fixtures/files/streaming.css",
            ),
          });
        await page
          .locator("#join-parameters")
          .fill(
            "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true",
          );
      });

      test("shows loading state while saving", async ({ page }) => {
        const postStreamingApiMock = await mockApiRequest(
          page,
          "POST",
          "streaming",
          {
            json: readFixture("streaming.json"),
            hold: true,
          },
        );

        await expect(page.getByTestId("save-button")).toContainText("app.save");
        await page.getByTestId("save-button").click();

        await expect(page.getByTestId("overlay")).toBeVisible();
        const editButtons = page
          .getByTestId("room-type-item")
          .getByTestId("streaming-room-type-settings-edit-button");
        await expect(editButtons.nth(0)).toBeDisabled();
        await expect(editButtons.nth(1)).toBeDisabled();
        await expect(page.getByTestId("save-button")).toBeDisabled();

        postStreamingApiMock.release();
        await expect(page.getByTestId("overlay")).toHaveCount(0);
        await expect(page.getByTestId("save-button")).toBeEnabled();
      });

      test("saves uploaded files and join parameters", async ({ page }) => {
        const postStreamingApiMock = await mockApiRequest(
          page,
          "POST",
          "streaming",
          {
            json: readFixture("streaming.json"),
          },
        );

        await page.getByTestId("save-button").click();

        const requestFormData = await getRequestFormData(
          await postStreamingApiMock.waitForRequest(),
        );
        const pauseImage = requestFormData.get("default_pause_image");
        expect(pauseImage.name).toBe("pause.jpg");
        expect(pauseImage.type).toBe("image/jpeg");
        expect(Buffer.from(await pauseImage.arrayBuffer())).toEqual(
          readFileSync("tests/Playwright/fixtures/files/pause.jpg"),
        );
        const cssFile = requestFormData.get("css_file");
        expect(cssFile.name).toBe("streaming.css");
        expect(cssFile.type).toBe("text/css");
        expect(Buffer.from(await cssFile.arrayBuffer())).toEqual(
          readFileSync("tests/Playwright/fixtures/files/streaming.css"),
        );
        expect(requestFormData.get("join_parameters")).toBe(
          "userdata-bbb_hide_nav_bar=true\r\nuserdata-bbb_hide_notifications=true",
        );
      });

      test("shows saved files after saving", async ({ page }) => {
        const settings = readFixture("streaming.json");
        settings.data.default_pause_image = "https://example.com/pause.jpg";
        settings.data.css_file = "https://example.com/streaming.css";
        settings.data.join_parameters =
          "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
        await mockApiRequest(page, "POST", "streaming", {
          json: settings,
        });

        await page.getByTestId("save-button").click();

        await expect(page.getByTestId("overlay")).toHaveCount(0);
        await expect(page.getByTestId("save-button")).toBeEnabled();

        const pauseImageField = page.getByTestId("default-pause-image-field");
        await expect(
          pauseImageField.getByTestId("file-input-button"),
        ).toHaveText("app.browse");
        await expect(
          pauseImageField.getByTestId("settings-file-delete-button"),
        ).toBeVisible();
        const pauseImageView = pauseImageField.getByTestId(
          "settings-file-view-button",
        );
        await expect(pauseImageView).toBeVisible();
        await expect(pauseImageView).toContainText("app.view");
        await expect(pauseImageView).toHaveAttribute(
          "href",
          "https://example.com/pause.jpg",
        );

        const cssField = page.getByTestId("css-file-field");
        await expect(cssField.getByTestId("file-input-button")).toHaveText(
          "app.browse",
        );
        await expect(
          cssField.getByTestId("settings-file-delete-button"),
        ).toBeVisible();
        const cssView = cssField.getByTestId("settings-file-view-button");
        await expect(cssView).toBeVisible();
        await expect(cssView).toContainText("app.view");
        await expect(cssView).toHaveAttribute(
          "href",
          "https://example.com/streaming.css",
        );
      });
    });

    test.describe("delete files", () => {
      test.beforeEach(async ({ page, streamingResponse }) => {
        streamingResponse.data.default_pause_image =
          "https://example.com/pause.jpg";
        streamingResponse.data.css_file = "https://example.com/streaming.css";
        streamingResponse.data.join_parameters =
          "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
        await page.goto("/admin/streaming_settings");
        await expect(page.getByTestId("save-button")).toBeEnabled();
      });

      test("saves deleted pause image and CSS file", async ({ page }) => {
        await page
          .getByTestId("default-pause-image-field")
          .getByTestId("settings-file-delete-button")
          .click();
        await page
          .getByTestId("css-file-field")
          .getByTestId("settings-file-delete-button")
          .click();

        const settings = readFixture("streaming.json");
        settings.data.join_parameters =
          "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
        const postStreamingApiMock = await mockApiRequest(
          page,
          "POST",
          "streaming",
          {
            json: settings,
          },
        );

        await page.getByTestId("save-button").click();

        const requestFormData = await getRequestFormData(
          await postStreamingApiMock.waitForRequest(),
        );
        expect(requestFormData.get("default_pause_image")).toBe("");
        expect(requestFormData.get("css_file")).toBe("");
      });

      test("shows empty file selectors after deleting and saving", async ({
        page,
      }) => {
        await page
          .getByTestId("default-pause-image-field")
          .getByTestId("settings-file-delete-button")
          .click();
        await page
          .getByTestId("css-file-field")
          .getByTestId("settings-file-delete-button")
          .click();

        const settings = readFixture("streaming.json");
        settings.data.join_parameters =
          "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
        const postStreamingApiMock = await mockApiRequest(
          page,
          "POST",
          "streaming",
          {
            json: settings,
          },
        );
        await page.getByTestId("save-button").click();
        await postStreamingApiMock.waitForRequest();
        await expect(page.getByTestId("overlay")).toHaveCount(0);

        const pauseImageField = page.getByTestId("default-pause-image-field");
        await expect(pauseImageField).toBeVisible();
        await expect(pauseImageField).toContainText(
          "admin.streaming.default_pause_image",
        );
        await checkSettingsFileSelector(
          page,
          pauseImageField,
          "",
          "pause.jpg",
          true,
        );

        const cssField = page.getByTestId("css-file-field");
        await expect(cssField).toBeVisible();
        await expect(cssField).toContainText("admin.streaming.css_file");
        await checkSettingsFileSelector(
          page,
          cssField,
          "",
          "streaming.css",
          true,
        );
      });
    });

    test.describe("saving error", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/streaming_settings");
        await expect(page.getByTestId("save-button")).toBeEnabled();
        await page
          .locator("#join-parameters")
          .fill("foo=bar\nuserdata-bbb_hide_notifications");
      });

      test("shows validation errors", async ({ page }) => {
        await mockApiRequest(
          page,
          "POST",
          "streaming",
          validationErrors(
            {
              default_pause_image: [
                "The Default pause image must have a resolution of 1920x1080 pixels.",
              ],
              css_file: [
                "The CSS style file field must have one of the following extensions: css.",
              ],
              join_parameters: [
                "The foo parameter does not exist.",
                "The userdata-bbb_hide_notifications parameter is missing a value.",
              ],
            },
            "The Default pause image must have a resolution of 1920x1080 pixels. (and 3 more errors)",
          ),
        );

        await expect(page.getByTestId("save-button")).toContainText("app.save");
        await page.getByTestId("save-button").click();

        await expectToastAndClose(
          page,
          "The Default pause image must have a resolution of 1920x1080 pixels. (and 3 more errors)",
        );
        await expect(
          page.getByTestId("default-pause-image-field"),
        ).toContainText(
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );
        await expect(page.getByTestId("css-file-field")).toContainText(
          "The CSS style file field must have one of the following extensions: css.",
        );
        const joinParametersField = page.getByTestId("join-parameters-field");
        await expect(joinParametersField).toContainText(
          "The foo parameter does not exist.",
        );
        await expect(joinParametersField).toContainText(
          "The userdata-bbb_hide_notifications parameter is missing a value.",
        );
      });

      test("shows server error and removes validation errors", async ({
        page,
      }) => {
        await mockApiRequest(
          page,
          "POST",
          "streaming",
          validationErrors(
            {
              default_pause_image: [
                "The Default pause image must have a resolution of 1920x1080 pixels.",
              ],
              css_file: [
                "The CSS style file field must have one of the following extensions: css.",
              ],
              join_parameters: [
                "The foo parameter does not exist.",
                "The userdata-bbb_hide_notifications parameter is missing a value.",
              ],
            },
            "The Default pause image must have a resolution of 1920x1080 pixels. (and 3 more errors)",
          ),
        );
        await page.getByTestId("save-button").click();
        await expectToastAndClose(
          page,
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );
        await expect(page.getByTestId("css-file-field")).toContainText(
          "The CSS style file field must have one of the following extensions: css.",
        );

        await mockApiRequest(page, "POST", "streaming", serverError());
        await page.getByTestId("save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(
          page.getByTestId("default-pause-image-field"),
        ).not.toContainText(
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );
        await expect(page.getByTestId("css-file-field")).not.toContainText(
          "The CSS style file field must have one of the following extensions: css.",
        );
        const joinParametersField = page.getByTestId("join-parameters-field");
        await expect(joinParametersField).not.toContainText(
          "The foo parameter does not exist.",
        );
        await expect(joinParametersField).not.toContainText(
          "The userdata-bbb_hide_notifications parameter is missing a value.",
        );
      });
    });

    test.describe("loading error", () => {
      test.beforeEach(async ({ page, getStreamingApiMock }) => {
        getStreamingApiMock.respondWith({
          status: 500,
          json: { message: "Internal server error" },
        });
        await page.goto("/admin/streaming_settings");
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Internal server error"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("disables all fields and the save button", async ({ page }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(
          page
            .getByTestId("default-pause-image-field")
            .getByTestId("file-input-input"),
        ).toBeDisabled();
        await expect(
          page.getByTestId("css-file-field").getByTestId("file-input-input"),
        ).toBeDisabled();
        await expect(
          page.getByTestId("join-parameters-field").locator("#join-parameters"),
        ).toBeDisabled();
        await expect(page.getByTestId("save-button")).toBeDisabled();
      });

      test("enables all fields after retry", async ({
        page,
        streamingResponse,
        getStreamingApiMock,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        getStreamingApiMock.respondWith({ json: streamingResponse });
        await page.getByTestId("loading-retry-button").click();

        await expect(page.getByTestId("overlay")).toHaveCount(0);
        await expect(
          page
            .getByTestId("default-pause-image-field")
            .getByTestId("file-input-input"),
        ).toBeEnabled();
        await expect(
          page.getByTestId("css-file-field").getByTestId("file-input-input"),
        ).toBeEnabled();
        await expect(
          page.getByTestId("join-parameters-field").locator("#join-parameters"),
        ).toBeEnabled();
        await expect(page.getByTestId("save-button")).toBeEnabled();
      });
    });
  });

  test.describe("room type settings table", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/streaming_settings");
      await expect(
        page.getByText("admin.streaming.room_types.title"),
      ).toBeVisible();
    });

    test("shows first page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);
      await expectActivePage(page, 0);
      for (const [tableRow, name, isStreaming, hasPauseImage] of [
        [rows.nth(0), "Exam", false, false],
        [rows.nth(1), "Lecture", true, false],
      ]) {
        const cells = tableRow.getByTestId("room-type-item-cell");
        await expect(cells).toHaveCount(4);
        await expect(cells.nth(0)).toHaveText(name);
        await expect(
          cells.nth(1).locator(isStreaming ? ".fa-check" : ".fa-times"),
        ).toBeVisible();
        await expect(
          cells.nth(2).locator(hasPauseImage ? ".fa-check" : ".fa-times"),
        ).toBeVisible();
      }
    });

    test("shows second page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await page.getByTestId("paginator-page").nth(1).click();
      await expectActivePage(page, 1);
      await expect(rows).toHaveCount(2);
      for (const [tableRow, name, isStreaming, hasPauseImage] of [
        [rows.nth(0), "Meeting", false, false],
        [rows.nth(1), "Seminar", true, false],
      ]) {
        const cells = tableRow.getByTestId("room-type-item-cell");
        await expect(cells).toHaveCount(4);
        await expect(cells.nth(0)).toHaveText(name);
        await expect(
          cells.nth(1).locator(isStreaming ? ".fa-check" : ".fa-times"),
        ).toBeVisible();
        await expect(
          cells.nth(2).locator(hasPauseImage ? ".fa-check" : ".fa-times"),
        ).toBeVisible();
      }
    });

    test("sorting by streaming enabled resets the pagination", async ({
      page,
    }) => {
      const rows = page.getByTestId("room-type-item");
      await page.getByTestId("paginator-page").nth(1).click();
      await expectActivePage(page, 1);

      await page.getByTestId("room-type-header-cell").nth(1).click();

      await expectActivePage(page, 0);
      await expect(
        rows.nth(0).getByTestId("room-type-item-cell").nth(0),
      ).toHaveText("Meeting");
      await expect(
        rows
          .nth(0)
          .getByTestId("room-type-item-cell")
          .nth(1)
          .locator(".fa-times"),
      ).toBeVisible();
      await expect(
        rows.nth(1).getByTestId("room-type-item-cell").nth(0),
      ).toHaveText("Exam");
      await expect(
        rows
          .nth(1)
          .getByTestId("room-type-item-cell")
          .nth(1)
          .locator(".fa-times"),
      ).toBeVisible();
    });

    test("shows streaming and pause image state of room types", async ({
      page,
      streamingResponse,
    }) => {
      streamingResponse.data.room_types[0].streaming_settings.enabled = false;
      streamingResponse.data.room_types[0].streaming_settings.default_pause_image =
        "https://example.com/lecture-pause.jpg";
      streamingResponse.data.room_types[2].streaming_settings.enabled = true;
      await page.reload();

      const rows = page.getByTestId("room-type-item");
      for (const [tableRow, name, isStreaming, hasPauseImage] of [
        [rows.nth(0), "Exam", true, false],
        [rows.nth(1), "Lecture", false, true],
      ]) {
        const cells = tableRow.getByTestId("room-type-item-cell");
        await expect(cells).toHaveCount(4);
        await expect(cells.nth(0)).toHaveText(name);
        await expect(
          cells.nth(1).locator(isStreaming ? ".fa-check" : ".fa-times"),
        ).toBeVisible();
        await expect(
          cells.nth(2).locator(hasPauseImage ? ".fa-check" : ".fa-times"),
        ).toBeVisible();
      }
    });
  });

  test.describe("edit room type settings", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/streaming_settings");
      await expect(page.getByTestId("room-type-item")).toHaveCount(2);
    });

    test("enable streaming and upload pause image", async ({
      page,
      getRoomTypeStreamingApiMock,
    }) => {
      const loadRequest = getRoomTypeStreamingApiMock.waitForNextRequest();
      const row = page.getByTestId("room-type-item").nth(0);
      const cells = row.getByTestId("room-type-item-cell");
      await expect(cells).toHaveCount(4);
      await expect(cells.nth(0)).toHaveText("Exam");
      await expect(cells.nth(1).locator(".fa-times")).toBeVisible();
      await expect(cells.nth(2).locator(".fa-times")).toBeVisible();
      await row
        .getByTestId("room-type-item-cell")
        .nth(3)
        .getByRole("button")
        .click();
      await loadRequest;

      const dialog = page.getByTestId(
        "streaming-room-type-settings-edit-dialog",
      );
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'admin.streaming.room_types.edit_dialog.title_{"name":"Exam"}',
      );

      await expect(dialog.getByTestId("streaming-enabled-field")).toHaveText(
        "admin.streaming.enabled",
      );
      await expect(dialog.locator("#streaming-enabled")).not.toBeChecked();
      await dialog.locator("#streaming-enabled").click();

      const pauseImageField = dialog.getByTestId(
        "streaming-default-pause-image-field",
      );
      await expect(pauseImageField).toBeVisible();
      await expect(pauseImageField).toContainText(
        "admin.streaming.default_pause_image",
      );
      await checkSettingsFileSelector(
        page,
        pauseImageField,
        "",
        "pause.jpg",
        true,
      );
      await pauseImageField.getByTestId("file-input-input").setInputFiles({
        name: "pause.jpg",
        mimeType: "image/jpeg",
        buffer: readFileSync("tests/Playwright/fixtures/files/pause.jpg"),
      });

      const postRoomTypeStreamingApiMock = await mockApiRequest(
        page,
        "POST",
        "roomTypes/3/streaming",
        { json: readFixture("roomTypeStreamingSettings.json"), hold: true },
      );
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
      await dialog.getByTestId("dialog-save-button").click();

      // Loading state
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(dialog.locator("#streaming-enabled")).toBeDisabled();
      await expect(pauseImageField.locator("input")).toBeDisabled();
      await expect(
        dialog.getByTestId("settings-file-cancel-button"),
      ).toBeDisabled();

      postRoomTypeStreamingApiMock.release();

      const requestFormData = await getRequestFormData(
        await postRoomTypeStreamingApiMock.waitForRequest(),
      );
      const pauseImage = requestFormData.get("default_pause_image");
      expect(pauseImage.name).toBe("pause.jpg");
      expect(pauseImage.type).toBe("image/jpeg");
      expect(Buffer.from(await pauseImage.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/pause.jpg"),
      );
      expect(requestFormData.get("enabled")).toBe("1");
    });

    test("table is reloaded after saving", async ({
      page,
      streamingResponse,
      getStreamingApiMock,
    }) => {
      const row = page.getByTestId("room-type-item").nth(0);
      await row
        .getByTestId("room-type-item-cell")
        .nth(3)
        .getByRole("button")
        .click();

      const dialog = page.getByTestId(
        "streaming-room-type-settings-edit-dialog",
      );
      await expect(dialog).toBeVisible();
      await dialog.locator("#streaming-enabled").click();

      await mockApiRequest(page, "POST", "roomTypes/3/streaming", {
        json: readFixture("roomTypeStreamingSettings.json"),
      });
      streamingResponse.data.room_types[2].streaming_settings.enabled = true;
      streamingResponse.data.room_types[2].streaming_settings.default_pause_image =
        "https://example.com/lecture-pause.jpg";
      const reloadRequest = getStreamingApiMock.waitForNextRequest();
      await dialog.getByTestId("dialog-save-button").click();

      await reloadRequest;
      const cells = row.getByTestId("room-type-item-cell");
      await expect(cells).toHaveCount(4);
      await expect(cells.nth(0)).toHaveText("Exam");
      await expect(cells.nth(1).locator(".fa-check")).toBeVisible();
      await expect(cells.nth(2).locator(".fa-check")).toBeVisible();
    });

    test("disable streaming and remove pause image", async ({
      page,
      streamingResponse,
      roomTypeStreamingResponse,
      getStreamingApiMock,
    }) => {
      roomTypeStreamingResponse.data.default_pause_image =
        "https://example.com/pause.jpg";
      roomTypeStreamingResponse.data.enabled = true;
      const row = page.getByTestId("room-type-item").nth(0);
      await row
        .getByTestId("room-type-item-cell")
        .nth(3)
        .getByRole("button")
        .click();

      const dialog = page.getByTestId(
        "streaming-room-type-settings-edit-dialog",
      );
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'admin.streaming.room_types.edit_dialog.title_{"name":"Exam"}',
      );

      await expect(dialog.getByTestId("streaming-enabled-field")).toHaveText(
        "admin.streaming.enabled",
      );
      await expect(dialog.locator("#streaming-enabled")).toBeChecked();
      await dialog.locator("#streaming-enabled").click();

      const pauseImageField = dialog.getByTestId(
        "streaming-default-pause-image-field",
      );
      await expect(pauseImageField).toBeVisible();
      await expect(pauseImageField).toContainText(
        "admin.streaming.default_pause_image",
      );
      await checkSettingsFileSelector(
        page,
        pauseImageField,
        "https://example.com/pause.jpg",
        "pause.jpg",
        true,
      );
      await dialog.getByTestId("settings-file-cancel-button").click();
      await dialog.getByTestId("settings-file-delete-button").click();

      const postRoomTypeStreamingApiMock = await mockApiRequest(
        page,
        "POST",
        "roomTypes/3/streaming",
        { json: readFixture("roomTypeStreamingSettings.json") },
      );
      streamingResponse.data.room_types[2].streaming_settings.enabled = false;
      streamingResponse.data.room_types[2].streaming_settings.default_pause_image =
        null;
      const reloadRequest = getStreamingApiMock.waitForNextRequest();
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
      await dialog.getByTestId("dialog-save-button").click();

      const requestFormData = await getRequestFormData(
        await postRoomTypeStreamingApiMock.waitForRequest(),
      );
      expect(requestFormData.get("default_pause_image")).toBe("");
      expect(requestFormData.get("enabled")).toBe("0");

      await reloadRequest;
      await expect(dialog).toBeHidden();
      const cells = row.getByTestId("room-type-item-cell");
      await expect(cells).toHaveCount(4);
      await expect(cells.nth(0)).toHaveText("Exam");
      await expect(cells.nth(1).locator(".fa-times")).toBeVisible();
      await expect(cells.nth(2).locator(".fa-times")).toBeVisible();
    });

    test.describe("saving error", () => {
      test.beforeEach(async ({ page }) => {
        await page
          .getByTestId("room-type-item")
          .nth(0)
          .getByTestId("room-type-item-cell")
          .nth(3)
          .getByRole("button")
          .click();

        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        await expect(dialog).toBeVisible();
        await expect(dialog.locator("#streaming-enabled")).not.toBeChecked();
        await dialog.locator("#streaming-enabled").click();
        await checkSettingsFileSelector(
          page,
          dialog.getByTestId("streaming-default-pause-image-field"),
          "",
          "pause.jpg",
          true,
        );
        await mockApiRequest(
          page,
          "POST",
          "roomTypes/3/streaming",
          validationErrors(
            {
              default_pause_image: [
                "The Default pause image must have a resolution of 1920x1080 pixels.",
              ],
            },
            "The Default pause image must have a resolution of 1920x1080 pixels.",
          ),
        );
        await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
        await dialog.getByTestId("dialog-save-button").click();
      });

      test("shows validation errors", async ({ page }) => {
        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        await expect(
          dialog.getByTestId("streaming-default-pause-image-field"),
        ).toContainText(
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );
      });

      test("shows server error and removes validation errors", async ({
        page,
      }) => {
        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        const pauseImageField = dialog.getByTestId(
          "streaming-default-pause-image-field",
        );
        await expect(pauseImageField).toContainText(
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );

        await mockApiRequest(
          page,
          "POST",
          "roomTypes/3/streaming",
          serverError(),
        );
        await dialog.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(pauseImageField).not.toContainText(
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );
      });
    });

    test.describe("loading error", () => {
      test.beforeEach(async ({ page, getRoomTypeStreamingApiMock }) => {
        getRoomTypeStreamingApiMock.respondWith({
          status: 500,
          json: { message: "Internal server error" },
        });
        await page
          .getByTestId("room-type-item")
          .nth(0)
          .getByTestId("room-type-item-cell")
          .nth(3)
          .getByRole("button")
          .click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Internal server error"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("hides fields and disables save button", async ({ page }) => {
        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        await expect(dialog).toBeVisible();
        await expect(dialog.getByTestId("loading-retry-button")).toBeVisible();
        await expect(dialog.getByTestId("streaming-enabled-field")).toHaveCount(
          0,
        );
        await expect(
          dialog.getByTestId("streaming-default-pause-image-field"),
        ).toHaveCount(0);
        await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      });

      test("shows fields after retry", async ({
        page,
        roomTypeStreamingResponse,
        getRoomTypeStreamingApiMock,
      }) => {
        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        await expect(dialog).toBeVisible();
        getRoomTypeStreamingApiMock.respondWith({
          json: roomTypeStreamingResponse,
        });
        await dialog.getByTestId("loading-retry-button").click();

        await expect(dialog.getByTestId("overlay")).toHaveCount(0);
        await expect(
          dialog.getByTestId("streaming-enabled-field"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("streaming-default-pause-image-field"),
        ).toBeVisible();
        await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
      });
    });
  });
});
