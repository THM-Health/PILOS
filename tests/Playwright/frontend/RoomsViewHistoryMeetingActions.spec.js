import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/roomsGeneralMisc.js";
import { mockMethod, nthRequest } from "../support/utils.js";
import { checkRoomAuthErrors } from "../support/room.js";

test.use({ authenticated: true });

test.describe("Rooms view history meeting actions", () => {
  test.describe("stats", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=history");
      await expect(page.getByTestId("room-history-item")).not.toHaveCount(0);
      await expect(
        page.getByTestId("room-history-statistic-dialog"),
      ).toHaveCount(0);
    });

    test("show stats", async ({ page }) => {
      const stats = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
        {
          path: "tests/Playwright/fixtures/roomHistoryStats.json",
          hold: true,
        },
      );

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-statistic-button")
        .click();

      const dialog = page.getByTestId("room-history-statistic-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'meetings.stats.modal_title_{"room":"Meeting One"}',
      );
      await expect(dialog).toContainText("06/18/2021, 09:12");
      await expect(dialog).toContainText("meetings.stats.no_breakout_support");

      // Check loading
      await expect(dialog.getByTestId("overlay")).toBeVisible();
      await nthRequest(stats);
      stats.release();

      // Check that overlay is hidden
      await expect(dialog.getByTestId("overlay")).toHaveCount(0);

      // Check that chart is displayed
      const canvas = dialog.getByTestId("chart").locator("> canvas");
      await expect(canvas).toBeVisible();
      await expect(canvas).toHaveAttribute("style", /display: block/);
      const pixelRatio = await page.evaluate(() => window.devicePixelRatio);
      await expect(canvas).toHaveAttribute("width", String(1163 * pixelRatio));
    });

    test("server error", async ({ page }) => {
      const stats = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
        {
          status: 500,
          json: { message: "Test" },
        },
      );

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-statistic-button")
        .click();
      await nthRequest(stats);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Close dialog
      await page.getByTestId("dialog-header-close-button").click();
      await expect(
        page.getByTestId("room-history-statistic-dialog"),
      ).toHaveCount(0);
    });

    test("feature disabled", async ({ page, roomHistory }) => {
      const stats = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
        {
          status: 468,
          json: { message: "The usage data is unavailable." },
        },
      );
      const historyCount = roomHistory.requests.length;

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-statistic-button")
        .click();
      await nthRequest(stats);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"The usage data is unavailable."}',
        'app.flash.server_error.error_code_{"statusCode":468}',
      ]);

      // Check if dialog is closed and meeting list is reloaded
      await expect(
        page.getByTestId("room-history-statistic-dialog"),
      ).toHaveCount(0);
      await nthRequest(roomHistory, historyCount + 1);
    });

    test("meeting not found", async ({ page, roomHistory }) => {
      const stats = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "meeting",
            ids: ["3a3e504a-d2c4-431c-8ca1-a62598e66761"],
          },
        },
      );
      const historyCount = roomHistory.requests.length;

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-statistic-button")
        .click();
      await nthRequest(stats);

      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.meeting"}',
        'app.flash.model_not_found.details_{"ids":"3a3e504a-d2c4-431c-8ca1-a62598e66761"}',
      ]);

      // Check if dialog is closed and meeting list is reloaded
      await expect(
        page.getByTestId("room-history-statistic-dialog"),
      ).toHaveCount(0);
      await nthRequest(roomHistory, historyCount + 1);
    });

    test("auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        (page) =>
          page
            .getByTestId("room-history-item")
            .nth(4)
            .getByTestId("room-history-statistic-button")
            .click(),
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
        "history",
      );
    });
  });

  test.describe("attendance", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=history");
      await expect(page.getByTestId("room-history-item")).not.toHaveCount(0);
      await expect(
        page.getByTestId("room-history-attendance-dialog"),
      ).toHaveCount(0);
    });

    test("loading", async ({ page }) => {
      const attendance = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
        {
          path: "tests/Playwright/fixtures/roomHistoryAttendance.json",
          hold: true,
        },
      );

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-attendance-button")
        .click();

      const dialog = page.getByTestId("room-history-attendance-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'meetings.stats.modal_title_{"room":"Meeting One"}',
      );
      await expect(dialog).toContainText(
        "06/18/2021, 09:12 - 06/18/2021, 09:15",
      );
      await expect(dialog).toContainText("meetings.stats.no_breakout_support");

      // Check loading
      await expect(dialog.getByTestId("overlay")).toBeVisible();
      await expect(dialog.locator(".fa-solid.fa-circle-notch")).toBeVisible();
      await nthRequest(attendance);
      attendance.release();

      // Check that overlay is hidden
      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(
        dialog.getByTestId("room-history-attendance-loading-icon"),
      ).toHaveCount(0);
    });

    test.describe("with attendance", () => {
      test.beforeEach(async ({ page }) => {
        await mockMethod(
          page,
          "GET",
          "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
          {
            path: "tests/Playwright/fixtures/roomHistoryAttendance.json",
          },
        );
        await page
          .getByTestId("room-history-item")
          .nth(4)
          .getByTestId("room-history-attendance-button")
          .click();
        await expect(
          page
            .getByTestId("room-history-attendance-dialog")
            .getByTestId("room-history-attendance-item"),
        ).toHaveCount(2);
      });

      test("show attendance", async ({ page }) => {
        const items = page
          .getByTestId("room-history-attendance-dialog")
          .getByTestId("room-history-attendance-item");

        const first = items
          .nth(0)
          .getByTestId("room-history-attendance-item-cell");
        await expect(first).toHaveCount(4);
        await expect(first.nth(0)).toHaveText("John Doe");
        await expect(first.nth(1)).toHaveText("---");
        await expect(first.nth(2)).toHaveText(
          'meetings.attendance.duration_minute_{"duration":4}',
        );
        await expect(first.nth(3)).toHaveText(
          '06/18/2021, 09:41 - 06/18/2021, 09:45 (meetings.attendance.duration_minute_{"duration":4})',
        );

        const second = items
          .nth(1)
          .getByTestId("room-history-attendance-item-cell");
        await expect(second).toHaveCount(4);
        await expect(second.nth(0)).toHaveText("Max Doe");
        await expect(second.nth(1)).toHaveText("max.doe@domain.tld");
        await expect(second.nth(2)).toHaveText(
          'meetings.attendance.duration_minute_{"duration":33}',
        );
        await expect(second.nth(3)).toHaveText(
          '06/18/2021, 09:13 - 06/18/2021, 09:42 (meetings.attendance.duration_minute_{"duration":28})' +
            '06/18/2021, 09:44 - 06/18/2021, 09:49 (meetings.attendance.duration_minute_{"duration":5})',
        );
      });

      test("search", async ({ page }) => {
        const dialog = page.getByTestId("room-history-attendance-dialog");
        const items = dialog.getByTestId("room-history-attendance-item");
        const search = dialog.getByTestId("room-history-attendance-search");

        await search.pressSequentially("Max");
        await expect(items).toHaveCount(1);
        await expect(items.nth(0)).toContainText("Max Doe");

        await search.pressSequentially("x");
        await expect(items).toHaveCount(0);
        await expect(
          dialog.getByText("meetings.attendance.no_data_filtered"),
        ).toBeVisible();

        // Clear search
        await search.clear();
        await expect(items).toHaveCount(2);
        await expect(items.nth(0)).toContainText("John Doe");
        await expect(items.nth(1)).toContainText("Max Doe");
      });

      test("download button", async ({ page, baseURL }) => {
        const download = page
          .getByTestId("room-history-attendance-dialog")
          .locator('a[data-test="room-history-attendance-download-button"]');
        await expect(download).toHaveAttribute(
          "href",
          `${baseURL}/download/attendance/3a3e504a-d2c4-431c-8ca1-a62598e66761`,
        );
        await expect(download).toHaveAttribute("target", "_blank");
      });
    });

    test("no attendance", async ({ page }) => {
      const attendance = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
        {
          status: 200,
          json: { data: [] },
        },
      );

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-attendance-button")
        .click();
      await nthRequest(attendance);

      const dialog = page.getByTestId("room-history-attendance-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("meetings.attendance.no_data");
      await expect(
        dialog.getByTestId("room-history-attendance-item"),
      ).toHaveCount(0);
    });

    test("close dialog", async ({ page }) => {
      await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
        {
          path: "tests/Playwright/fixtures/roomHistoryAttendance.json",
        },
      );
      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-attendance-button")
        .click();
      await expect(
        page.getByTestId("room-history-attendance-dialog"),
      ).toBeVisible();

      await page.getByTestId("dialog-header-close-button").click();
      await expect(
        page.getByTestId("room-history-attendance-dialog"),
      ).toHaveCount(0);
    });

    test("server error", async ({ page }) => {
      const attendance = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
        {
          status: 500,
          json: { message: "Test" },
        },
      );

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-attendance-button")
        .click();
      await nthRequest(attendance);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Close dialog
      await page.getByTestId("dialog-header-close-button").click();
      await expect(
        page.getByTestId("room-history-attendance-dialog"),
      ).toHaveCount(0);
    });

    for (const { name, status, message } of [
      {
        name: "meeting not ended",
        status: 469,
        message:
          "The attendance logs are not yet available for this meeting as it has not yet ended.",
      },
      {
        name: "attendance disabled",
        status: 470,
        message: "Attendance logging was not active at this meeting.",
      },
    ]) {
      test(name, async ({ page, roomHistory }) => {
        const attendance = await mockMethod(
          page,
          "GET",
          "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
          {
            status,
            json: { message },
          },
        );
        const historyCount = roomHistory.requests.length;

        await page
          .getByTestId("room-history-item")
          .nth(4)
          .getByTestId("room-history-attendance-button")
          .click();
        await nthRequest(attendance);

        await expectToastAndClose(page, [
          `app.flash.server_error.message_{"message":"${message}"}`,
          `app.flash.server_error.error_code_{"statusCode":${status}}`,
        ]);

        // Check if dialog is closed and meeting list is reloaded
        await expect(
          page.getByTestId("room-history-attendance-dialog"),
        ).toHaveCount(0);
        await nthRequest(roomHistory, historyCount + 1);
      });
    }

    test("meeting not found", async ({ page, roomHistory }) => {
      const attendance = await mockMethod(
        page,
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "meeting",
            ids: ["3a3e504a-d2c4-431c-8ca1-a62598e66761"],
          },
        },
      );
      const historyCount = roomHistory.requests.length;

      await page
        .getByTestId("room-history-item")
        .nth(4)
        .getByTestId("room-history-attendance-button")
        .click();
      await nthRequest(attendance);

      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.meeting"}',
        'app.flash.model_not_found.details_{"ids":"3a3e504a-d2c4-431c-8ca1-a62598e66761"}',
      ]);

      // Check if dialog is closed and meeting list is reloaded
      await expect(
        page.getByTestId("room-history-attendance-dialog"),
      ).toHaveCount(0);
      await nthRequest(roomHistory, historyCount + 1);
    });

    test("auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        (page) =>
          page
            .getByTestId("room-history-item")
            .nth(4)
            .getByTestId("room-history-attendance-button")
            .click(),
        "GET",
        "**/api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
        "history",
      );
    });
  });
});
