import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roomStreamingControllerTest } from "../support/fixtures/roomStreamingController.js";
import { readFileSync } from "node:fs";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  mockApiRequest,
  getRequestFormData,
  arrayBufferToBase64,
  readFixture,
  modelNotFound,
  validationErrors,
} from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import { checkSettingsFileSelector } from "../support/admin.js";

const test = mergeTests(
  roomControllerTest,
  roomFileControllerTest,
  roomTypeControllerTest,
  userControllerTest,
  roomStreamingControllerTest,
);
test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });
test.use({ roomTypesFixtureName: "roomTypesWithSettings.json" });

test.use({ authenticated: true });

test.describe("Rooms view streaming config actions", () => {
  test.beforeEach(async ({ page, configResponse, roomResponse }) => {
    configResponse.data.general.hide_disabled_features = true;
    configResponse.data.streaming.enabled = true;
    roomResponse.data.type.features.streaming.enabled = true;

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

    test("enabled with url and pause image", async ({
      page,
      baseURL,
      roomStreamingConfigResponse,
    }) => {
      await page.getByTestId("dialog-cancel-button").click();
      Object.assign(roomStreamingConfigResponse.data, {
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

    test("room type default pause image", async ({
      page,
      baseURL,
      roomStreamingConfigResponse,
    }) => {
      await page.getByTestId("dialog-cancel-button").click();
      Object.assign(roomStreamingConfigResponse.data, {
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

    test("system default pause image", async ({
      page,
      baseURL,
      roomStreamingConfigResponse,
    }) => {
      await page.getByTestId("dialog-cancel-button").click();
      roomStreamingConfigResponse.data.system_default_pause_image =
        baseURL + "/system_pause_image.jpg";
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
      await mockApiRequest(page, "GET", "rooms/abc-def-123/streaming/config", {
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

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Internal server error"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("retry enables the form", async ({
      page,
      roomStreamingConfigResponse,
    }) => {
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Internal server error"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await mockApiRequest(page, "GET", "rooms/abc-def-123/streaming/config", {
        json: roomStreamingConfigResponse,
      });

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
    const getRoomStreamingConfigApiMock = await mockApiRequest(
      page,
      "GET",
      "rooms/abc-def-123/streaming/config",
      modelNotFound("room", ["abc-def-123"]),
    );

    await page.getByTestId("streaming-config-button").click();
    await getRoomStreamingConfigApiMock.waitForRequest();

    await expect(page).toHaveURL(
      (url) =>
        url.pathname.includes("/rooms") &&
        !url.pathname.includes("abc-def-123"),
    );
    await expectToastAndClose(page, [
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  test.describe("edit settings", () => {
    test("upload pause image shows loading state while saving", async ({
      page,
      roomStreamingConfigResponse,
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

      const postRoomStreamingConfigApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/streaming/config",
        { json: roomStreamingConfigResponse, hold: true },
      );

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

      postRoomStreamingConfigApiMock.release();
      await postRoomStreamingConfigApiMock.waitForRequest();
      await expect(dialog).toHaveCount(0);
    });

    test("upload pause image sends the new settings", async ({
      page,
      roomStreamingConfigResponse,
    }) => {
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

      const postRoomStreamingConfigApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/streaming/config",
        { json: roomStreamingConfigResponse },
      );
      await dialog.getByTestId("dialog-save-button").click();

      const requestFormData = await getRequestFormData(
        await postRoomStreamingConfigApiMock.waitForRequest(),
      );
      const uploadedPauseImage = requestFormData.get("pause_image");
      expect(uploadedPauseImage.name).toBe("pause.jpg");
      expect(uploadedPauseImage.type).toBe("image/jpeg");
      expect(arrayBufferToBase64(await uploadedPauseImage.arrayBuffer())).toBe(
        readFileSync("tests/Playwright/fixtures/files/pause.jpg", "base64"),
      );
      expect(requestFormData.get("enabled")).toBe("1");
      expect(requestFormData.get("url")).toBe(
        "rtmps://streaming.example.com/stream/bbb",
      );

      await expect(dialog).toHaveCount(0);
    });

    test.describe("with existing settings", () => {
      test.beforeEach(
        async ({ page, baseURL, roomStreamingConfigResponse }) => {
          await page.getByTestId("dialog-cancel-button").click();
          Object.assign(roomStreamingConfigResponse.data, {
            enabled: true,
            url: "rtmps://streaming.example.com/stream/bbb",
            pause_image: baseURL + "/pause_image.jpg",
          });
          await page.getByTestId("streaming-config-button").click();
        },
      );

      test("save without changes does not send the pause image", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-streaming-config-dialog");
        const postRoomStreamingConfigApiMock = await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/streaming/config",
          { json: readFixture("roomStreamingConfig.json") },
        );

        const saveButton = dialog.getByTestId("dialog-save-button");
        await expect(saveButton).toContainText("app.save");
        await saveButton.click();

        const requestFormData = await getRequestFormData(
          await postRoomStreamingConfigApiMock.waitForRequest(),
        );
        expect(requestFormData.has("pause_image")).toBe(false);
        expect(requestFormData.get("enabled")).toBe("1");
        expect(requestFormData.get("url")).toBe(
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

        const postRoomStreamingConfigApiMock = await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/streaming/config",
          { json: readFixture("roomStreamingConfig.json"), hold: true },
        );
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

        postRoomStreamingConfigApiMock.release();
        await postRoomStreamingConfigApiMock.waitForRequest();
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

        const postRoomStreamingConfigApiMock = await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/streaming/config",
          { json: readFixture("roomStreamingConfig.json") },
        );
        await dialog.getByTestId("dialog-save-button").click();

        const requestFormData = await getRequestFormData(
          await postRoomStreamingConfigApiMock.waitForRequest(),
        );
        expect(requestFormData.has("pause_image")).toBe(true);
        expect(requestFormData.get("pause_image")).toBe("");
        expect(requestFormData.get("enabled")).toBe("0");
        expect(requestFormData.get("url")).toBe("");

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
      const postRoomStreamingConfigApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/streaming/config",
        validationErrors(
          {
            url: ["The RTMP(S) URL must be a RTMP or RTMPS URL."],
            pause_image: [
              "The Pause image must not be greater than 5000 kilobytes.",
              "The Pause image must have a resolution of 1920x1080 pixels.",
            ],
          },
          "The RTMP(S) URL must be a RTMP or RTMPS URL. (and 2 more errors)",
        ),
      );

      const dialog = page.getByTestId("room-streaming-config-dialog");
      const saveButton = dialog.getByTestId("dialog-save-button");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();
      await postRoomStreamingConfigApiMock.waitForRequest();

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

      const postRoomStreamingConfigApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/streaming/config",
        validationErrors(
          {
            url: ["The RTMP(S) URL must be a RTMP or RTMPS URL."],
            pause_image: [
              "The Pause image must not be greater than 5000 kilobytes.",
            ],
          },
          "The RTMP(S) URL must be a RTMP or RTMPS URL.",
        ),
      );
      await saveButton.click();
      await postRoomStreamingConfigApiMock.waitForRequest();
      await expect(dialog.getByTestId("streaming-url-field")).toContainText(
        "The RTMP(S) URL must be a RTMP or RTMPS URL.",
      );

      const postRoomStreamingConfigApiMock2 = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/streaming/config",
        { status: 500, json: { message: "Internal server error" } },
      );
      await saveButton.click();
      await postRoomStreamingConfigApiMock2.waitForRequest();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Internal server error"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

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
      const postRoomStreamingConfigApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/streaming/config",
        modelNotFound("room", ["abc-def-123"]),
      );

      const saveButton = page
        .getByTestId("room-streaming-config-dialog")
        .getByTestId("dialog-save-button");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();
      await postRoomStreamingConfigApiMock.waitForRequest();

      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/rooms") &&
          !url.pathname.includes("abc-def-123"),
      );
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("permissions", () => {
    test("co-owner can edit", async ({ page, roomResponse }) => {
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      roomResponse.data.is_co_owner = true;

      await page.reload();
      await page.locator("#tab-streaming").click();
      await page.getByTestId("streaming-config-button").click();
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog).toBeVisible();

      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(dialog.locator("#streaming-enabled")).toBeEnabled();
      await expect(dialog.locator("#streaming-url")).toBeEnabled();
      await expect(
        dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("file-input-input"),
      ).toBeEnabled();
      await expect(dialog.getByTestId("dialog-save-button")).toHaveCount(1);
    });

    test("rooms.viewAll can only view", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = ["rooms.viewAll"];
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      await page.reload();
      await page.locator("#tab-streaming").click();
      await page.getByTestId("streaming-config-button").click();
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog).toBeVisible();

      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(dialog.locator("#streaming-enabled")).toBeDisabled();
      await expect(dialog.locator("#streaming-url")).toBeDisabled();
      await expect(
        dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("file-input-input"),
      ).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toHaveCount(0);
    });

    test("rooms.manage can edit", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUserResponse.data.permissions = permissions;
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = permissions;
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      await page.reload();
      await page.locator("#tab-streaming").click();
      await page.getByTestId("streaming-config-button").click();
      const dialog = page.getByTestId("room-streaming-config-dialog");
      await expect(dialog).toBeVisible();

      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(dialog.locator("#streaming-enabled")).toBeEnabled();
      await expect(dialog.locator("#streaming-url")).toBeEnabled();
      await expect(
        dialog
          .getByTestId("streaming-pause-image-field")
          .getByTestId("file-input-input"),
      ).toBeEnabled();
      await expect(dialog.getByTestId("dialog-save-button")).toHaveCount(1);
    });
  });
});
