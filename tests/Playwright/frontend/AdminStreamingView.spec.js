import { mergeTests } from "@playwright/test";
import { test as streamingControllerTest } from "../support/fixtures/streamingController.js";
import { test as roomTypeStreamingControllerTest } from "../support/fixtures/roomTypeStreamingController.js";
import { expect } from "../support/test.js";
import { checkSettingsFileSelectorOnlyView } from "../support/admin.js";

const test = mergeTests(
  streamingControllerTest,
  roomTypeStreamingControllerTest,
);

test.describe("Admin streaming settings with view permission", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ configResponse, currentUserResponse }) => {
    configResponse.data.streaming.enabled = true;
    currentUserResponse.data.permissions = ["admin.view", "streaming.viewAny"];
  });

  test("redirects to 404 with streaming disabled", async ({
    page,
    configResponse,
  }) => {
    configResponse.data.streaming.enabled = false;

    await page.goto("/admin/streaming_settings");
    await expect(page).toHaveURL(/\/404/);
  });

  test("shows empty general settings read-only", async ({ page }) => {
    await page.goto("/admin/streaming_settings");
    await expect(page.getByText("admin.streaming.general.title")).toBeVisible();

    const pauseImageField = page.getByTestId("default-pause-image-field");
    await expect(pauseImageField).toBeVisible();
    await expect(pauseImageField).toContainText(
      "admin.streaming.default_pause_image",
    );
    await checkSettingsFileSelectorOnlyView(pauseImageField, "");

    const cssFileField = page.getByTestId("css-file-field");
    await expect(cssFileField).toBeVisible();
    await expect(cssFileField).toContainText("admin.streaming.css_file");
    await checkSettingsFileSelectorOnlyView(cssFileField, "");

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
    ).toBeDisabled();
  });

  test("shows configured general settings read-only", async ({
    page,
    streamingResponse,
  }) => {
    const joinParameters =
      "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
    streamingResponse.data.default_pause_image =
      "https://example.com/image.png";
    streamingResponse.data.css_file = "https://example.com/streaming.css";
    streamingResponse.data.join_parameters = joinParameters;

    await page.goto("/admin/streaming_settings");
    await expect(page.getByText("admin.streaming.general.title")).toBeVisible();

    const pauseImageField = page.getByTestId("default-pause-image-field");
    await expect(pauseImageField).toBeVisible();
    await expect(pauseImageField).toContainText(
      "admin.streaming.default_pause_image",
    );
    await checkSettingsFileSelectorOnlyView(
      pauseImageField,
      "https://example.com/image.png",
    );

    const cssFileField = page.getByTestId("css-file-field");
    await expect(cssFileField).toBeVisible();
    await expect(cssFileField).toContainText("admin.streaming.css_file");
    await checkSettingsFileSelectorOnlyView(
      cssFileField,
      "https://example.com/streaming.css",
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
      joinParameters,
    );
    await expect(
      joinParametersField.locator("#join-parameters"),
    ).toBeDisabled();
  });

  test.describe("room type table", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/streaming_settings");
      await expect(
        page.getByText("admin.streaming.room_types.title"),
      ).toBeVisible();
    });

    test("shows first page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);
      await expect(page.getByTestId("paginator-page").nth(0)).toHaveAttribute(
        "data-p-active",
        "true",
      );

      for (const [tableRow, name, isStreaming, hasPauseImage] of [
        [rows.nth(0), "Exam", false, false],
        [rows.nth(1), "Lecture", true, false],
      ]) {
        const cells = tableRow.getByTestId("room-type-item-cell");
        await expect(cells).toHaveCount(3);
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
      await expect(rows).toHaveCount(2);

      await page.getByTestId("paginator-page").nth(1).click();

      await expect(page.getByTestId("paginator-page").nth(1)).toHaveAttribute(
        "data-p-active",
        "true",
      );
      const cells = rows.nth(0).getByTestId("room-type-item-cell");
      await expect(cells).toHaveCount(3);
      await expect(cells.nth(0)).toHaveText("Meeting");
      await expect(cells.nth(1).locator(".fa-times")).toBeVisible();
      await expect(cells.nth(2).locator(".fa-times")).toBeVisible();
    });

    test("sorting resets pagination to first page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);

      await page.getByTestId("paginator-page").nth(1).click();
      await expect(page.getByTestId("paginator-page").nth(1)).toHaveAttribute(
        "data-p-active",
        "true",
      );
      const cells = rows.nth(0).getByTestId("room-type-item-cell");
      await expect(cells).toHaveCount(3);
      await expect(cells.nth(0)).toHaveText("Meeting");
      await expect(cells.nth(1).locator(".fa-times")).toBeVisible();
      await expect(cells.nth(2).locator(".fa-times")).toBeVisible();

      await page.getByTestId("room-type-header-cell").nth(1).click();

      await expect(page.getByTestId("paginator-page").nth(0)).toHaveAttribute(
        "data-p-active",
        "true",
      );
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

    test("shows changed streaming and pause image state after reload", async ({
      page,
      streamingResponse,
    }) => {
      streamingResponse.data.room_types[0].streaming_settings.enabled = false;
      streamingResponse.data.room_types[0].streaming_settings.default_pause_image =
        "https://example.com/lecture-pause.jpg";
      streamingResponse.data.room_types[2].streaming_settings.enabled = true;

      await page.reload();

      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);
      for (const [tableRow, name, isStreaming, hasPauseImage] of [
        [rows.nth(0), "Exam", true, false],
        [rows.nth(1), "Lecture", false, true],
      ]) {
        const cells = tableRow.getByTestId("room-type-item-cell");
        await expect(cells).toHaveCount(3);
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
});
