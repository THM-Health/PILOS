import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { checkSettingsFileSelector } from "../support/admin.js";
import {
  mockMethod,
  nthRequest,
  parseFormData,
  expectActivePage,
} from "../support/utils.js";

const FILES_DIR = "tests/Playwright/fixtures/files/";
const PAUSE_IMAGE_ERROR =
  "The Default pause image must have a resolution of 1920x1080 pixels.";
const CSS_ERROR =
  "The CSS style file field must have one of the following extensions: css.";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Mock GET api/v1/streaming with the fixture changed by `mutate`. Later mocks win.
 */
function mockStreaming(page, mutate = () => {}) {
  const settings = readFixture("streaming.json");
  mutate(settings.data);
  return mockMethod(page, "GET", "**/api/v1/streaming", { json: settings });
}

/**
 * Mock GET api/v1/roomTypes/3/streaming with the fixture changed by `mutate`.
 */
function mockRoomTypeSettings(page, mutate = () => {}) {
  const settings = readFixture("roomTypeStreamingSettings.json");
  mutate(settings.data);
  return mockMethod(page, "GET", "**/api/v1/roomTypes/3/streaming", {
    json: settings,
  });
}

async function expectUploadedFile(formData, key, fileName, type) {
  const file = formData.get(key);
  expect(file.name).toBe(fileName);
  expect(file.type).toBe(type);
  expect(Buffer.from(await file.arrayBuffer())).toEqual(
    readFileSync(FILES_DIR + fileName),
  );
}

// Files selected by path are sent without content while the request is intercepted, so the content is set as buffer.
const FILE_MIME_TYPES = { jpg: "image/jpeg", css: "text/css" };
const fixtureFile = (fileName) => ({
  name: fileName,
  mimeType: FILE_MIME_TYPES[fileName.split(".").pop()],
  buffer: readFileSync(FILES_DIR + fileName),
});

function expectRoomTypeRow(row, name, streamingEnabled, hasPauseImage) {
  const cells = row.getByTestId("room-type-item-cell");
  return Promise.all([
    expect(cells).toHaveCount(4),
    expect(cells.nth(0)).toHaveText(name),
    expect(
      cells.nth(1).locator(streamingEnabled ? ".fa-check" : ".fa-times"),
    ).toBeVisible(),
    expect(
      cells.nth(2).locator(hasPauseImage ? ".fa-check" : ".fa-times"),
    ).toBeVisible(),
  ]);
}

test.describe("Admin streaming settings with edit permission", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, config, currentUser }) => {
    config.data.streaming.enabled = true;
    currentUser.data.permissions = [
      "admin.view",
      "streaming.viewAny",
      "streaming.update",
    ];
    await mockStreaming(page);
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

    test("show saved settings", async ({ page }) => {
      await mockStreaming(page, (data) => {
        data.default_pause_image = "https://example.com/image.png";
        data.css_file = "https://example.com/streaming.css";
        data.join_parameters =
          "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
      });
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
      const joinParameters =
        "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";

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
          .setInputFiles(fixtureFile("pause.jpg"));
        await page
          .getByTestId("css-file-field")
          .getByTestId("file-input-input")
          .setInputFiles(fixtureFile("streaming.css"));
        await page.locator("#join-parameters").fill(joinParameters);
      });

      test("shows loading state while saving", async ({ page }) => {
        const saveRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/streaming",
          { json: readFixture("streaming.json"), hold: true },
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

        saveRequest.release();
        await expect(page.getByTestId("overlay")).toHaveCount(0);
        await expect(page.getByTestId("save-button")).toBeEnabled();
      });

      test("saves uploaded files and join parameters", async ({ page }) => {
        const saveRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/streaming",
          { json: readFixture("streaming.json") },
        );

        await page.getByTestId("save-button").click();

        const formData = await parseFormData(await nthRequest(saveRequest));
        await expectUploadedFile(
          formData,
          "default_pause_image",
          "pause.jpg",
          "image/jpeg",
        );
        await expectUploadedFile(
          formData,
          "css_file",
          "streaming.css",
          "text/css",
        );
        expect(formData.get("join_parameters")).toBe(
          "userdata-bbb_hide_nav_bar=true\r\nuserdata-bbb_hide_notifications=true",
        );
      });

      test("shows saved files after saving", async ({ page }) => {
        const settings = readFixture("streaming.json");
        settings.data.default_pause_image = "https://example.com/pause.jpg";
        settings.data.css_file = "https://example.com/streaming.css";
        settings.data.join_parameters = joinParameters;
        await mockMethod(page, "POST", "**/api/v1/streaming", {
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
      test.beforeEach(async ({ page }) => {
        await mockStreaming(page, (data) => {
          data.default_pause_image = "https://example.com/pause.jpg";
          data.css_file = "https://example.com/streaming.css";
          data.join_parameters =
            "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
        });
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
        const saveRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/streaming",
          { json: settings },
        );

        await page.getByTestId("save-button").click();

        const formData = await parseFormData(await nthRequest(saveRequest));
        expect(formData.get("default_pause_image")).toBe("");
        expect(formData.get("css_file")).toBe("");
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
        const saveRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/streaming",
          { json: settings },
        );
        await page.getByTestId("save-button").click();
        await nthRequest(saveRequest);
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
        await mockMethod(page, "POST", "**/api/v1/streaming", {
          status: 422,
          json: {
            message: `${PAUSE_IMAGE_ERROR} (and 3 more errors)`,
            errors: {
              default_pause_image: [PAUSE_IMAGE_ERROR],
              css_file: [CSS_ERROR],
              join_parameters: [
                "The foo parameter does not exist.",
                "The userdata-bbb_hide_notifications parameter is missing a value.",
              ],
            },
          },
        });

        await expect(page.getByTestId("save-button")).toContainText("app.save");
        await page.getByTestId("save-button").click();

        await expectToastAndClose(
          page,
          `${PAUSE_IMAGE_ERROR} (and 3 more errors)`,
        );
        await expect(
          page.getByTestId("default-pause-image-field"),
        ).toContainText(PAUSE_IMAGE_ERROR);
        await expect(page.getByTestId("css-file-field")).toContainText(
          CSS_ERROR,
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
        await mockMethod(page, "POST", "**/api/v1/streaming", {
          status: 422,
          json: {
            message: `${PAUSE_IMAGE_ERROR} (and 3 more errors)`,
            errors: {
              default_pause_image: [PAUSE_IMAGE_ERROR],
              css_file: [CSS_ERROR],
              join_parameters: [
                "The foo parameter does not exist.",
                "The userdata-bbb_hide_notifications parameter is missing a value.",
              ],
            },
          },
        });
        await page.getByTestId("save-button").click();
        await expectToastAndClose(page, PAUSE_IMAGE_ERROR);
        await expect(page.getByTestId("css-file-field")).toContainText(
          CSS_ERROR,
        );

        await mockMethod(page, "POST", "**/api/v1/streaming", {
          status: 500,
          json: { message: "Test" },
        });
        await page.getByTestId("save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(
          page.getByTestId("default-pause-image-field"),
        ).not.toContainText(PAUSE_IMAGE_ERROR);
        await expect(page.getByTestId("css-file-field")).not.toContainText(
          CSS_ERROR,
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
      test.beforeEach(async ({ page }) => {
        await mockMethod(page, "GET", "**/api/v1/streaming", {
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

      test("enables all fields after retry", async ({ page }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await mockStreaming(page);
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
      await expectRoomTypeRow(rows.nth(0), "Exam", false, false);
      await expectRoomTypeRow(rows.nth(1), "Lecture", true, false);
    });

    test("shows second page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await page.getByTestId("paginator-page").nth(1).click();
      await expectActivePage(page, 1);
      await expect(rows).toHaveCount(2);
      await expectRoomTypeRow(rows.nth(0), "Meeting", false, false);
      await expectRoomTypeRow(rows.nth(1), "Seminar", true, false);
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
    }) => {
      await mockStreaming(page, (data) => {
        data.room_types[0].streaming_settings.enabled = false;
        data.room_types[0].streaming_settings.default_pause_image =
          "https://example.com/lecture-pause.jpg";
        data.room_types[2].streaming_settings.enabled = true;
      });
      await page.reload();

      const rows = page.getByTestId("room-type-item");
      await expectRoomTypeRow(rows.nth(0), "Exam", true, false);
      await expectRoomTypeRow(rows.nth(1), "Lecture", false, true);
    });
  });

  test.describe("edit room type settings", () => {
    const dialogTitle =
      'admin.streaming.room_types.edit_dialog.title_{"name":"Exam"}';

    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/streaming_settings");
      await expect(page.getByTestId("room-type-item")).toHaveCount(2);
    });

    test("enable streaming and upload pause image", async ({ page }) => {
      const loadRequest = await mockRoomTypeSettings(page);
      const row = page.getByTestId("room-type-item").nth(0);
      await expectRoomTypeRow(row, "Exam", false, false);
      await row
        .getByTestId("room-type-item-cell")
        .nth(3)
        .getByRole("button")
        .click();
      await nthRequest(loadRequest);

      const dialog = page.getByTestId(
        "streaming-room-type-settings-edit-dialog",
      );
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(dialogTitle);

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
      await pauseImageField
        .getByTestId("file-input-input")
        .setInputFiles(fixtureFile("pause.jpg"));

      const saveRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/roomTypes/3/streaming",
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

      saveRequest.release();

      const formData = await parseFormData(await nthRequest(saveRequest));
      await expectUploadedFile(
        formData,
        "default_pause_image",
        "pause.jpg",
        "image/jpeg",
      );
      expect(formData.get("enabled")).toBe("1");
    });

    test("table is reloaded after saving", async ({ page }) => {
      await mockRoomTypeSettings(page);
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

      await mockMethod(page, "POST", "**/api/v1/roomTypes/3/streaming", {
        json: readFixture("roomTypeStreamingSettings.json"),
      });
      const reloadRequest = await mockStreaming(page, (data) => {
        data.room_types[2].streaming_settings.enabled = true;
        data.room_types[2].streaming_settings.default_pause_image =
          "https://example.com/lecture-pause.jpg";
      });
      await dialog.getByTestId("dialog-save-button").click();

      await nthRequest(reloadRequest);
      await expectRoomTypeRow(row, "Exam", true, true);
    });

    test("disable streaming and remove pause image", async ({ page }) => {
      await mockRoomTypeSettings(page, (data) => {
        data.default_pause_image = "https://example.com/pause.jpg";
        data.enabled = true;
      });
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
      await expect(dialog).toContainText(dialogTitle);

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

      const saveRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/roomTypes/3/streaming",
        { json: readFixture("roomTypeStreamingSettings.json") },
      );
      const reloadRequest = await mockStreaming(page, (data) => {
        data.room_types[2].streaming_settings.enabled = false;
        data.room_types[2].streaming_settings.default_pause_image = null;
      });
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
      await dialog.getByTestId("dialog-save-button").click();

      const formData = await parseFormData(await nthRequest(saveRequest));
      expect(formData.get("default_pause_image")).toBe("");
      expect(formData.get("enabled")).toBe("0");

      await nthRequest(reloadRequest);
      await expect(dialog).toBeHidden();
      await expectRoomTypeRow(row, "Exam", false, false);
    });

    test.describe("saving error", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoomTypeSettings(page);
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
        await mockMethod(page, "POST", "**/api/v1/roomTypes/3/streaming", {
          status: 422,
          json: {
            message: PAUSE_IMAGE_ERROR,
            errors: { default_pause_image: [PAUSE_IMAGE_ERROR] },
          },
        });
        await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
        await dialog.getByTestId("dialog-save-button").click();
      });

      test("shows validation errors", async ({ page }) => {
        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        await expect(
          dialog.getByTestId("streaming-default-pause-image-field"),
        ).toContainText(PAUSE_IMAGE_ERROR);
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
        await expect(pauseImageField).toContainText(PAUSE_IMAGE_ERROR);

        await mockMethod(page, "POST", "**/api/v1/roomTypes/3/streaming", {
          status: 500,
          json: { message: "Test" },
        });
        await dialog.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(pauseImageField).not.toContainText(PAUSE_IMAGE_ERROR);
      });
    });

    test.describe("loading error", () => {
      test.beforeEach(async ({ page }) => {
        await mockMethod(page, "GET", "**/api/v1/roomTypes/3/streaming", {
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

      test("shows fields after retry", async ({ page }) => {
        const dialog = page.getByTestId(
          "streaming-room-type-settings-edit-dialog",
        );
        await expect(dialog).toBeVisible();
        await mockRoomTypeSettings(page);
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
