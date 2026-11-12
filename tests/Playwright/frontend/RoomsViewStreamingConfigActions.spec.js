import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  mockMethod,
  nthRequest,
  parseFormData,
  _arrayBufferToBase64,
} from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import { checkSettingsFileSelector } from "../support/admin.js";

const ROOM_URL = "**/api/v1/rooms/abc-def-123";
const CONFIG_URL = "**/api/v1/rooms/abc-def-123/streaming/config";
const STATUS_URL = "**/api/v1/rooms/abc-def-123/streaming/status";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Internal server error"}',
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

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Mock the room request with the room fixture (streaming enabled for the room type), `mutate` changes the fixture.
 */
function mockRoom(page, mutate = () => {}) {
  const room = readFixture("room.json");
  room.data.type.features.streaming.enabled = true;
  mutate(room);
  return mockMethod(page, "GET", ROOM_URL, { json: room });
}

/**
 * Mock the streaming config the dialog loads, `data` overrides the defaults of the fixture.
 */
function mockConfig(page, data = {}) {
  const config = readFixture("roomStreamingConfig.json");
  Object.assign(config.data, data);
  return mockMethod(page, "GET", CONFIG_URL, { json: config });
}

test.describe("Rooms view streaming config actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, config }) => {
    config.data.general.hide_disabled_features = true;
    config.data.streaming.enabled = true;

    await mockRoom(page);
    await mockMethod(page, "GET", STATUS_URL, {
      json: readFixture("roomStreamingStatus.json"),
    });
    await mockConfig(page);

    await page.goto("/rooms/abc-def-123");
    await page.locator("#tab-streaming").click();
    await page.getByTestId("streaming-config-button").click();
  });

  test.describe("load", () => {
    test("default settings", async ({ page }) => {
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(dialog.locator("#streaming-enabled")).toBeEnabled();

      await expect(dialog.locator("#streaming-enabled")).not.toBeChecked();
      await expect(dialog.locator("#streaming-url")).toHaveValue("");

      const field = dialog.getByTestId("streaming-pause-image-field");
      await expect(field.getByTestId("file-input-button")).toHaveText(
        "app.browse",
      );
      await expect(
        field.getByTestId("streaming-pause-image-preview"),
      ).toHaveCount(0);
      await expect(
        field.getByTestId("streaming-pause-image-room-type-preview"),
      ).toHaveCount(0);
      await expect(
        field.getByTestId("streaming-pause-image-system-preview"),
      ).toHaveCount(0);
      await expect(
        field.getByTestId("settings-file-delete-button"),
      ).toHaveCount(0);
    });

    test("enabled with url and pause image", async ({ page, baseURL }) => {
      await page.getByTestId("dialog-cancel-button").click();
      await mockConfig(page, {
        enabled: true,
        url: "rtmps://streaming.example.com/stream/bbb",
        pause_image: baseURL + "/pause_image.jpg",
        room_type_default_pause_image: baseURL + "/room_type_pause_image.jpg",
        system_default_pause_image: baseURL + "/system_pause_image.jpg",
      });
      await page.getByTestId("streaming-config-button").click();

      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog.locator("#streaming-enabled")).toBeChecked();
      await expect(dialog.locator("#streaming-url")).toHaveValue(
        "rtmps://streaming.example.com/stream/bbb",
      );

      const field = dialog.getByTestId("streaming-pause-image-field");
      await expect(
        field.getByTestId("streaming-pause-image-preview"),
      ).toHaveAttribute("src", baseURL + "/pause_image.jpg");
      await expect(
        field.getByTestId("streaming-pause-image-room-type-preview"),
      ).toHaveCount(0);
      await expect(
        field.getByTestId("streaming-pause-image-system-preview"),
      ).toHaveCount(0);
      await expect(field.getByTestId("file-input-button")).toHaveText(
        "app.browse",
      );
      await expect(
        field.getByTestId("settings-file-delete-button"),
      ).toHaveCount(1);
    });

    test("room type default pause image", async ({ page, baseURL }) => {
      await page.getByTestId("dialog-cancel-button").click();
      await mockConfig(page, {
        room_type_default_pause_image: baseURL + "/room_type_pause_image.jpg",
        system_default_pause_image: baseURL + "/system_pause_image.jpg",
      });
      await page.getByTestId("streaming-config-button").click();

      const field = page
        .getByTestId("room-streaming-config-dialog")
        .getByTestId("streaming-pause-image-field");
      await expect(
        field.getByTestId("streaming-pause-image-room-type-preview"),
      ).toHaveAttribute("src", baseURL + "/room_type_pause_image.jpg");
      await expect(
        field.getByTestId("streaming-pause-image-preview"),
      ).toHaveCount(0);
      await expect(
        field.getByTestId("streaming-pause-image-system-preview"),
      ).toHaveCount(0);
    });

    test("system default pause image", async ({ page, baseURL }) => {
      await page.getByTestId("dialog-cancel-button").click();
      await mockConfig(page, {
        system_default_pause_image: baseURL + "/system_pause_image.jpg",
      });
      await page.getByTestId("streaming-config-button").click();

      const field = page
        .getByTestId("room-streaming-config-dialog")
        .getByTestId("streaming-pause-image-field");
      await expect(
        field.getByTestId("streaming-pause-image-system-preview"),
      ).toHaveAttribute("src", baseURL + "/system_pause_image.jpg");
      await expect(
        field.getByTestId("streaming-pause-image-preview"),
      ).toHaveCount(0);
      await expect(
        field.getByTestId("streaming-pause-image-room-type-preview"),
      ).toHaveCount(0);
    });
  });

  test.describe("load with error", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId("dialog-cancel-button").click();
      await mockMethod(page, "GET", CONFIG_URL, {
        status: 500,
        json: { message: "Internal server error" },
      });
      await page.getByTestId("streaming-config-button").click();
    });

    test("server error disables the form and shows the error", async ({
      page,
    }) => {
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog).toBeVisible();

      await expect(dialog.locator("#streaming-enabled")).toBeDisabled();
      await expect(dialog.locator("#streaming-url")).toBeDisabled();
      await expect(
        dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("file-input-input"),
      ).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(dialog.getByTestId("overlay")).toBeVisible();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("retry enables the form", async ({ page }) => {
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await mockConfig(page);

      const dialog = page.getByTestId("room-streaming-config-dialog");
      await dialog.getByTestId("loading-retry-button").click();

      await expect(dialog.locator("#streaming-enabled")).toBeEnabled();
      await expect(dialog.locator("#streaming-url")).toBeEnabled();
      await expect(
        dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("file-input-input"),
      ).toBeEnabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
    });
  });

  test("load with room not found redirects to the room index", async ({
    page,
  }) => {
    await page.getByTestId("dialog-cancel-button").click();
    await interceptRoomIndexRequests(page);
    const configMock = await mockMethod(page, "GET", CONFIG_URL, {
      status: 404,
      json: ROOM_NOT_FOUND,
    });

    await page.getByTestId("streaming-config-button").click();
    await nthRequest(configMock);

    await expect(page).toHaveURL(
      (url) =>
        url.pathname.includes("/rooms") &&
        !url.pathname.includes("abc-def-123"),
    );
    await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
  });

  test.describe("edit settings", () => {
    test("upload pause image shows loading state while saving", async ({
      page,
    }) => {
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog.locator("#streaming-enabled")).not.toBeChecked();
      await expect(dialog.locator("#streaming-url")).toHaveValue("");
      await dialog.locator("#streaming-enabled").check();
      await dialog
        .locator("#streaming-url")
        .fill("rtmps://streaming.example.com/stream/bbb");
      const field = dialog.getByTestId("streaming-pause-image-field");
      await checkSettingsFileSelector(page, field, "", "pause.jpg", true);

      const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
        json: readFixture("roomStreamingConfig.json"),
        hold: true,
      });

      const saveButton = dialog.getByTestId("dialog-save-button");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.locator("#streaming-enabled")).toBeDisabled();
      await expect(dialog.locator("#streaming-url")).toBeDisabled();
      await expect(field.getByTestId("file-input-input")).toBeDisabled();
      await expect(
        field.getByTestId("settings-file-cancel-button"),
      ).toBeDisabled();
      await expect(saveButton).toBeDisabled();

      saveMock.release();
      await nthRequest(saveMock);
      await expect(dialog).toHaveCount(0);
    });

    test("upload pause image sends the new settings", async ({ page }) => {
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await dialog.locator("#streaming-enabled").check();
      await dialog
        .locator("#streaming-url")
        .fill("rtmps://streaming.example.com/stream/bbb");
      await checkSettingsFileSelector(
        page,
        dialog.getByTestId("streaming-pause-image-field"),
        "",
        "pause.jpg",
        true,
      );
      // Files selected by path are sent without content while the request is intercepted, so use a buffer
      await dialog.getByTestId("file-input-input").setInputFiles({
        name: "pause.jpg",
        mimeType: "image/jpeg",
        buffer: readFileSync("tests/Playwright/fixtures/files/pause.jpg"),
      });

      const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
        json: readFixture("roomStreamingConfig.json"),
      });
      await dialog.getByTestId("dialog-save-button").click();

      const formData = await parseFormData(await nthRequest(saveMock));
      const uploadedPauseImage = formData.get("pause_image");
      expect(uploadedPauseImage.name).toBe("pause.jpg");
      expect(uploadedPauseImage.type).toBe("image/jpeg");
      expect(_arrayBufferToBase64(await uploadedPauseImage.arrayBuffer())).toBe(
        readFileSync("tests/Playwright/fixtures/files/pause.jpg", "base64"),
      );
      expect(formData.get("enabled")).toBe("1");
      expect(formData.get("url")).toBe(
        "rtmps://streaming.example.com/stream/bbb",
      );

      await expect(dialog).toHaveCount(0);
    });

    test.describe("with existing settings", () => {
      test.beforeEach(async ({ page, baseURL }) => {
        await page.getByTestId("dialog-cancel-button").click();
        await mockConfig(page, {
          enabled: true,
          url: "rtmps://streaming.example.com/stream/bbb",
          pause_image: baseURL + "/pause_image.jpg",
        });
        await page.getByTestId("streaming-config-button").click();
      });

      test("save without changes does not send the pause image", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-streaming-config-dialog");
        const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
          json: readFixture("roomStreamingConfig.json"),
        });

        const saveButton = dialog.getByTestId("dialog-save-button");
        await expect(saveButton).toContainText("app.save");
        await saveButton.click();

        const formData = await parseFormData(await nthRequest(saveMock));
        expect(formData.has("pause_image")).toBe(false);
        expect(formData.get("enabled")).toBe("1");
        expect(formData.get("url")).toBe(
          "rtmps://streaming.example.com/stream/bbb",
        );

        await expect(dialog).toHaveCount(0);
      });

      test("delete everything shows loading state while saving", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-streaming-config-dialog");
        await expect(dialog.locator("#streaming-url")).toHaveValue(
          "rtmps://streaming.example.com/stream/bbb",
        );
        await dialog.locator("#streaming-enabled").uncheck();
        await dialog.locator("#streaming-url").clear();
        const field = dialog.getByTestId("streaming-pause-image-field");
        await field.getByTestId("settings-file-delete-button").click();

        const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
          json: readFixture("roomStreamingConfig.json"),
          hold: true,
        });
        const saveButton = dialog.getByTestId("dialog-save-button");
        await expect(saveButton).toContainText("app.save");
        await saveButton.click();

        await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
        await expect(dialog.locator("#streaming-enabled")).toBeDisabled();
        await expect(dialog.locator("#streaming-url")).toBeDisabled();
        await expect(
          field.getByTestId("settings-file-undo-delete-button"),
        ).toBeDisabled();
        await expect(saveButton).toBeDisabled();

        saveMock.release();
        await nthRequest(saveMock);
        await expect(dialog).toHaveCount(0);
      });

      test("delete everything sends the empty settings", async ({ page }) => {
        const dialog = page.getByTestId("room-streaming-config-dialog");
        await dialog.locator("#streaming-enabled").uncheck();
        await dialog.locator("#streaming-url").clear();
        await dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("settings-file-delete-button")
          .click();

        const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
          json: readFixture("roomStreamingConfig.json"),
        });
        await dialog.getByTestId("dialog-save-button").click();

        const formData = await parseFormData(await nthRequest(saveMock));
        expect(formData.has("pause_image")).toBe(true);
        expect(formData.get("pause_image")).toBe("");
        expect(formData.get("enabled")).toBe("0");
        expect(formData.get("url")).toBe("");

        await expect(dialog).toHaveCount(0);
      });
    });
  });

  test.describe("edit settings errors", () => {
    test.beforeEach(async ({ page }) => {
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await dialog.locator("#streaming-enabled").check();
      await dialog
        .locator("#streaming-url")
        .fill("http://streaming.example.com/stream/bbb");
      await checkSettingsFileSelector(
        page,
        dialog.getByTestId("streaming-pause-image-field"),
        "",
        "pause.jpg",
        true,
      );
    });

    test("validation errors are shown and the dialog stays open", async ({
      page,
    }) => {
      const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
        status: 422,
        json: {
          message:
            "The RTMP(S) URL must be a RTMP or RTMPS URL. (and 2 more errors)",
          errors: {
            url: ["The RTMP(S) URL must be a RTMP or RTMPS URL."],
            pause_image: [
              "The Pause image must not be greater than 5000 kilobytes.",
              "The Pause image must have a resolution of 1920x1080 pixels.",
            ],
          },
        },
      });

      const dialog = page.getByTestId("room-streaming-config-dialog");
      const saveButton = dialog.getByTestId("dialog-save-button");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();
      await nthRequest(saveMock);

      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId("streaming-url-field")).toContainText(
        "The RTMP(S) URL must be a RTMP or RTMPS URL.",
      );
      const pauseImageField = dialog.getByTestId("streaming-pause-image-field");
      await expect(pauseImageField).toContainText(
        "The Pause image must not be greater than 5000 kilobytes.",
      );
      await expect(pauseImageField).toContainText(
        "The Pause image must have a resolution of 1920x1080 pixels.",
      );
    });

    test("server error is shown and removes the validation errors", async ({
      page,
    }) => {
      const dialog = page.getByTestId("room-streaming-config-dialog");
      const saveButton = dialog.getByTestId("dialog-save-button");

      const validationMock = await mockMethod(page, "POST", CONFIG_URL, {
        status: 422,
        json: {
          message: "The RTMP(S) URL must be a RTMP or RTMPS URL.",
          errors: {
            url: ["The RTMP(S) URL must be a RTMP or RTMPS URL."],
            pause_image: [
              "The Pause image must not be greater than 5000 kilobytes.",
            ],
          },
        },
      });
      await saveButton.click();
      await nthRequest(validationMock);
      await expect(dialog.getByTestId("streaming-url-field")).toContainText(
        "The RTMP(S) URL must be a RTMP or RTMPS URL.",
      );

      const errorMock = await mockMethod(page, "POST", CONFIG_URL, {
        status: 500,
        json: { message: "Internal server error" },
      });
      await saveButton.click();
      await nthRequest(errorMock);
      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId("streaming-url-field")).not.toContainText(
        "The RTMP(S) URL must be a RTMP or RTMPS URL.",
      );
      await expect(
        dialog.getByTestId("streaming-pause-image-field"),
      ).not.toContainText(
        "The Pause image must not be greater than 5000 kilobytes.",
      );
    });

    test("room not found redirects to the room index", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      const saveMock = await mockMethod(page, "POST", CONFIG_URL, {
        status: 404,
        json: ROOM_NOT_FOUND,
      });

      const saveButton = page
        .getByTestId("room-streaming-config-dialog")
        .getByTestId("dialog-save-button");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();
      await nthRequest(saveMock);

      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/rooms") &&
          !url.pathname.includes("abc-def-123"),
      );
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("permissions", () => {
    const openDialog = async (page) => {
      await page.reload();
      await page.locator("#tab-streaming").click();
      await page.getByTestId("streaming-config-button").click();
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog).toBeVisible();
      return dialog;
    };

    const expectEditable = async (dialog, editable) => {
      const state = editable ? "toBeEnabled" : "toBeDisabled";
      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(dialog.locator("#streaming-enabled"))[state]();
      await expect(dialog.locator("#streaming-url"))[state]();
      await expect(
        dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("file-input-input"),
      )[state]();
      await expect(dialog.getByTestId("dialog-save-button")).toHaveCount(
        editable ? 1 : 0,
      );
    };

    test("co-owner can edit", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
        room.data.is_co_owner = true;
      });
      await expectEditable(await openDialog(page), true);
    });

    test("rooms.viewAll can only view", async ({ page, currentUser }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll"];
        room.data.last_meeting = {
          start: "2023-08-21T08:18:28.000000Z",
          end: null,
        };
      });
      await expectEditable(await openDialog(page), false);
    });

    test("rooms.manage can edit", async ({ page, currentUser }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUser.data.permissions = permissions;
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = permissions;
        room.data.last_meeting = {
          start: "2023-08-21T08:18:28.000000Z",
          end: null,
        };
      });
      await expectEditable(await openDialog(page), true);
    });
  });
});
