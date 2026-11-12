import { readFileSync } from "node:fs";
import { test, expect } from "../support/test.js";
import { checkSettingsFileSelectorOnlyView } from "../support/admin.js";
import { mockMethod } from "../support/utils.js";

/**
 * Mock GET api/v1/streaming with the fixture changed by `mutate`. Later mocks win.
 */
function mockStreaming(page, mutate = () => {}) {
  const settings = JSON.parse(
    readFileSync("tests/Playwright/fixtures/streaming.json", "utf8"),
  );
  mutate(settings.data);
  return mockMethod(page, "GET", "**/api/v1/streaming", { json: settings });
}

function expectRoomTypeRow(row, name, streamingEnabled, hasPauseImage) {
  const cells = row.getByTestId("room-type-item-cell");
  return Promise.all([
    expect(cells).toHaveCount(3),
    expect(cells.nth(0)).toHaveText(name),
    expect(
      cells.nth(1).locator(streamingEnabled ? ".fa-check" : ".fa-times"),
    ).toBeVisible(),
    expect(
      cells.nth(2).locator(hasPauseImage ? ".fa-check" : ".fa-times"),
    ).toBeVisible(),
  ]);
}

test.describe("Admin streaming settings with view permission", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, config, currentUser }) => {
    config.data.streaming.enabled = true;
    currentUser.data.permissions = ["admin.view", "streaming.viewAny"];
    await mockStreaming(page);
  });

  test("redirects to 404 with streaming disabled", async ({ page, config }) => {
    config.data.streaming.enabled = false;

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

  test("shows configured general settings read-only", async ({ page }) => {
    const joinParameters =
      "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";
    await mockStreaming(page, (settings) => {
      settings.default_pause_image = "https://example.com/image.png";
      settings.css_file = "https://example.com/streaming.css";
      settings.join_parameters = joinParameters;
    });

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

      await expectRoomTypeRow(rows.nth(0), "Exam", false, false);
      await expectRoomTypeRow(rows.nth(1), "Lecture", true, false);
    });

    test("shows second page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);

      await page.getByTestId("paginator-page").nth(1).click();

      await expect(page.getByTestId("paginator-page").nth(1)).toHaveAttribute(
        "data-p-active",
        "true",
      );
      await expectRoomTypeRow(rows.nth(0), "Meeting", false, false);
    });

    test("sorting resets pagination to first page", async ({ page }) => {
      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);

      await page.getByTestId("paginator-page").nth(1).click();
      await expect(page.getByTestId("paginator-page").nth(1)).toHaveAttribute(
        "data-p-active",
        "true",
      );
      await expectRoomTypeRow(rows.nth(0), "Meeting", false, false);

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
    }) => {
      await mockStreaming(page, (settings) => {
        settings.room_types[0].streaming_settings.enabled = false;
        settings.room_types[0].streaming_settings.default_pause_image =
          "https://example.com/lecture-pause.jpg";
        settings.room_types[2].streaming_settings.enabled = true;
      });

      await page.reload();

      const rows = page.getByTestId("room-type-item");
      await expect(rows).toHaveCount(2);
      await expectRoomTypeRow(rows.nth(0), "Exam", true, false);
      await expectRoomTypeRow(rows.nth(1), "Lecture", false, true);
    });
  });
});
