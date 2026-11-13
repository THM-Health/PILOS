import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  expectActivePage,
  getRequestQuery,
  readFixture,
  forbidden,
} from "../support/utils.js";

import {
  checkRoomAuthErrorsLoadingTab,
  selectSortType,
} from "../support/room.js";

const test = mergeTests(
  roomControllerTest,
  participantNameCheckTest,
  roomFileControllerTest,
  roomTypeControllerTest,
);

test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

test.describe("Rooms view history", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(Date.UTC(2021, 5, 25));
  });

  test.describe("load history", () => {
    test("shows the loading state", async ({
      page,
      getRoomMeetingsApiMock,
    }) => {
      getRoomMeetingsApiMock.respondWith({
        json: readFixture("roomHistory.json"),
        hold: true,
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-history").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=history/);

      await expect(page.getByTestId("overlay")).toBeVisible();
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");
      const reload = page.getByTestId("room-history-reload-button");
      await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeDisabled();
      await expect(reload).toBeDisabled();

      getRoomMeetingsApiMock.release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(reload).toBeEnabled();
      await expect(page.getByTestId("room-history-item")).toHaveCount(5);
    });

    const items = [
      {
        date: "06/22/2021, 13:05",
        duration:
          "2 app.time_formats.days, 12 app.time_formats.hours, 54 app.time_formats.minutes",
        statistic: false,
        attendance: false,
      },
      {
        date: "06/23/2021, 12:04",
        duration: "1 app.time_formats.minute",
        statistic: false,
        attendance: false,
      },
      {
        date: "07/22/2021, 11:45",
        duration: "1 app.time_formats.minute",
        statistic: false,
        attendance: true,
      },
      {
        date: "06/22/2020, 10:51",
        duration: "10 app.time_formats.seconds",
        statistic: true,
        attendance: false,
      },
      {
        date: "06/18/2021, 09:12",
        duration: "3 app.time_formats.minutes",
        statistic: true,
        attendance: true,
      },
    ];

    for (const [index, meeting] of items.entries()) {
      test(`shows meeting ${index + 1} with its date, duration and actions`, async ({
        page,
      }) => {
        await page.goto("/rooms/abc-def-123#tab=history");

        await expect(page.getByTestId("room-history-item")).toHaveCount(5);
        const item = page.getByTestId("room-history-item").nth(index);
        await expect(item).toContainText(meeting.date);
        await expect(item).toContainText(meeting.duration);

        const statistic = item.getByTestId("room-history-statistic-button");
        const attendance = item.getByTestId("room-history-attendance-button");
        if (meeting.statistic) {
          await expect(statistic).toBeVisible();
        } else {
          await expect(statistic).toHaveCount(0);
        }
        if (meeting.attendance) {
          await expect(attendance).toBeVisible();
        } else {
          await expect(attendance).toHaveCount(0);
        }
      });
    }

    test("shows the retention period message for unlimited retention", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=history");

      await expect(page.getByTestId("room-history-item")).toHaveCount(5);
      const message = page.getByTestId("retention-period-message");
      await expect(message).toContainText("meetings.retention_period");
      await expect(message).toContainText(
        "meetings.stats.retention_period_unlimited",
      );
      await expect(message).toContainText(
        "meetings.attendance.retention_period_unlimited",
      );
    });

    test("shows a message if there is no history after reloading", async ({
      page,
      roomMeetingsResponse,
      getRoomMeetingsApiMock,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=history");
      await expect(page.getByTestId("room-history-item")).toHaveCount(5);

      roomMeetingsResponse.data = [];
      roomMeetingsResponse.meta.from = null;
      roomMeetingsResponse.meta.to = null;
      roomMeetingsResponse.meta.total = 0;
      const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
      await page.getByTestId("room-history-reload-button").click();
      await historyRequest;

      await expect(page.getByTestId("room-history-item")).toHaveCount(0);
      await expect(page.getByText("meetings.no_historical_data")).toBeVisible();
    });
  });

  test.describe("retention period", () => {
    test("shows the configured retention period of the statistics and the attendance", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.recording.meeting_usage_retention_period = 30;
      configResponse.data.recording.attendance_retention_period = 30;

      await page.goto("/rooms/abc-def-123#tab=history");

      const message = page.getByTestId("retention-period-message");
      await expect(message).toContainText("meetings.retention_period");
      await expect(message).toContainText(
        'meetings.stats.retention_period_{"days":30}',
      );
      await expect(message).toContainText(
        'meetings.attendance.retention_period_{"days":30}',
      );
    });

    test("hides the statistics retention period if the meeting usage is disabled", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.recording.meeting_usage_enabled = false;
      configResponse.data.recording.meeting_usage_retention_period = 30;
      configResponse.data.recording.attendance_retention_period = 30;

      await page.goto("/rooms/abc-def-123#tab=history");

      const message = page.getByTestId("retention-period-message");
      await expect(message).toContainText("meetings.retention_period");
      await expect(message).toContainText(
        'meetings.attendance.retention_period_{"days":30}',
      );
      await expect(message).not.toContainText(
        "meetings.stats.retention_period",
      );
    });
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
      getRoomMeetingsApiMock,
    }) => {
      getRoomMeetingsApiMock.respondWith({
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/rooms/abc-def-123#tab=history");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(
        page.getByTestId("room-history-reload-button"),
      ).toBeEnabled();
    });

    test("reloads the history after a server error", async ({
      page,
      getRoomMeetingsApiMock,
    }) => {
      getRoomMeetingsApiMock.respondWith({
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/rooms/abc-def-123#tab=history");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getRoomMeetingsApiMock.respondWithPage({ lastPage: 5 });

      await page.getByTestId("loading-retry-button").click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("room-history-item")).toHaveCount(1);
      await expect(page.getByTestId("room-history-item").first()).toContainText(
        "06/22/2021, 13:05",
      );
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
    });

    test.describe("on changing the page", () => {
      test.beforeEach(async ({ page, getRoomMeetingsApiMock }) => {
        getRoomMeetingsApiMock.respondWithPage({ lastPage: 5 });
        await page.goto("/rooms/abc-def-123#tab=history");
        await expect(page.getByTestId("room-history-item")).toHaveCount(1);

        getRoomMeetingsApiMock.respondWith({
          status: 500,
          json: { message: "Test" },
        });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("shows the overlay and the error on a server error", async ({
        page,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );
        const sortGroup = page.getByTestId("sorting-type-inputgroup");
        const sortLabel = sortGroup
          .getByTestId("sorting-type-dropdown")
          .locator(".p-select-label");
        await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
        await expect(sortGroup.locator("button")).toBeEnabled();
        await expect(
          page.getByTestId("room-history-reload-button"),
        ).toBeEnabled();
      });

      test("reloads the first page", async ({
        page,
        getRoomMeetingsApiMock,
      }) => {
        getRoomMeetingsApiMock.respondWithPage({ lastPage: 5 });

        const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
        await page.getByTestId("loading-retry-button").click();

        expect(getRequestQuery(await historyRequest)).toMatchObject({
          page: "1",
        });

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("room-history-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-history-item").first(),
        ).toContainText("06/22/2021, 13:05");
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectActivePage(page, 0);
      });
    });

    test.describe("on changing the page with an unauthenticated error", () => {
      test.beforeEach(async ({ page, getRoomMeetingsApiMock }) => {
        getRoomMeetingsApiMock.respondWithPage({ lastPage: 3 });
        await page.goto("/rooms/abc-def-123#tab=history");
        await expect(page.getByTestId("room-history-item")).toHaveCount(1);

        getRoomMeetingsApiMock.respondWith({ status: 401, json: undefined });
      });

      test("asks for the guest name if the room has no access code", async ({
        page,
        roomResponse,
        postParticipantNameCheckApiMock,
        getRoomApiMock,
        getRoomFilesApiMock,
      }) => {
        roomResponse.data.current_user = null;

        const filesRequest = getRoomFilesApiMock.waitForNextRequest();
        const roomRequest = getRoomApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await roomRequest;

        // Enter guest name
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await page.locator("#participant-name").fill("Max Doe");

        const checkRequest =
          postParticipantNameCheckApiMock.waitForNextRequest();
        postParticipantNameCheckApiMock.respondWith({ status: 204 });
        await page.getByTestId("room-login-button").click();
        await checkRequest;

        await expect(page.getByTestId("room-access-overlay")).toBeHidden();

        // Check that the files tab is shown
        await filesRequest;
        await expect(page).toHaveURL(
          (url) => !url.href.includes("#tab=history"),
        );

        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("shows the access code overlay if the room has an access code", async ({
        page,
        roomResponse,
        getRoomApiMock,
      }) => {
        roomResponse.data.current_user = null;
        roomResponse.data.authenticated = false;

        const roomRequest = getRoomApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await roomRequest;

        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("shows an error if guests are forbidden", async ({
        page,
        getRoomApiMock,
      }) => {
        getRoomApiMock.respondWith(forbidden("guests_not_allowed"));

        const roomRequest = getRoomApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await roomRequest;

        await expect(
          page.getByText("rooms.only_used_by_authenticated_users").first(),
        ).toBeVisible();
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });
    });

    test("redirects to the files tab on a forbidden error when changing the page", async ({
      page,
      getRoomMeetingsApiMock,
      roomResponse,
      getRoomFilesApiMock,
    }) => {
      getRoomMeetingsApiMock.respondWithPage({ lastPage: 3 });
      await page.goto("/rooms/abc-def-123#tab=history");
      await expect(page.getByTestId("room-history-item")).toHaveCount(1);

      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      getRoomMeetingsApiMock.respondWith({
        status: 403,
        json: { message: "This action is unauthorized." },
      });

      const filesRequest = getRoomFilesApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectToastAndClose(page, "app.flash.unauthorized");
      await filesRequest;
      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123#tab=files"),
      );
    });

    test("handles auth errors when loading the tab", async ({ page }) => {
      await checkRoomAuthErrorsLoadingTab(
        page,
        "GET",
        "api/v1/rooms/abc-def-123/meetings*",
        "history",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
      getRoomMeetingsApiMock,
    }) => {
      await page.goto("/rooms/abc-def-123");
      await expect(page.locator("#tab-history")).toBeVisible();

      getRoomMeetingsApiMock.respondWith({
        status: 404,
        json: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      });

      await page.locator("#tab-history").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
    getRoomMeetingsApiMock,
    roomMeetingsResponse,
  }) => {
    getRoomMeetingsApiMock.respondWithPage({
      lastPage: 2,
      total: 2,
    });
    roomMeetingsResponse.data[0].role = 3;

    await page.goto("/rooms/abc-def-123#tab=history");
    await expect(page.getByTestId("room-history-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the meetings
    const emptyPage = readFixture("roomHistory.json");
    emptyPage.data = [];
    emptyPage.meta.current_page = 2;
    emptyPage.meta.from = null;
    emptyPage.meta.per_page = 2;
    emptyPage.meta.to = null;
    emptyPage.meta.total = 2;
    emptyPage.meta.total_no_filter = 2;
    const firstPage = readFixture("roomHistory.json");
    firstPage.data = firstPage.data.slice(0, 2);
    firstPage.meta.per_page = 2;
    firstPage.meta.to = 2;
    firstPage.meta.total = 2;
    firstPage.meta.total_no_filter = 2;
    const roomMeetingsRequestsAfterChange =
      getRoomMeetingsApiMock.respondWithSequence([
        { json: emptyPage },
        { json: firstPage },
      ]);

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for the second page, then the page is reset
    await expect(roomMeetingsRequestsAfterChange).toHaveReceivedRequest(
      { query: { page: "2" } },
      { nth: 1 },
    );
    await expect(roomMeetingsRequestsAfterChange).toHaveReceivedRequest(
      { query: { page: "1" } },
      { nth: 2 },
    );

    await expect(page.getByTestId("room-history-item")).toHaveCount(2);
  });

  test.describe("sort history", () => {
    test("loads the history sorted by start descending", async ({
      page,
      getRoomMeetingsApiMock,
    }) => {
      const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();

      await page.goto("/rooms/abc-def-123#tab=history");

      expect(getRequestQuery(await historyRequest)).toMatchObject({
        sort_by: "start",
        sort_direction: "desc",
        page: "1",
      });
    });

    test("shows the available sorting types", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=history");
      await expect(page.getByTestId("room-history-item")).toHaveCount(5);

      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "meetings.start",
      );
      await page.getByTestId("sorting-type-dropdown").click();

      await expect(
        page.getByTestId("sorting-type-dropdown-items"),
      ).toBeVisible();
      const options = page.getByTestId("sorting-type-dropdown-option");
      await expect(options).toHaveCount(1);
      await expect(options.first()).toHaveText("meetings.start");
      await expect(options.first()).toHaveAttribute("aria-selected", "true");
    });

    test("reloads the history when selecting the sorting type", async ({
      page,
      getRoomMeetingsApiMock,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=history");
      await expect(page.getByTestId("room-history-item")).toHaveCount(5);

      getRoomMeetingsApiMock.respondWithPage({ lastPage: 5 });
      const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
      await selectSortType(page, 0);

      expect(getRequestQuery(await historyRequest)).toMatchObject({
        sort_by: "start",
        sort_direction: "desc",
        page: "1",
      });

      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "meetings.start",
      );

      await expect(page.getByTestId("room-history-item")).toHaveCount(1);
      await expect(page.getByTestId("room-history-item").first()).toContainText(
        "06/22/2021, 13:05",
      );
      await expect(page.getByTestId("paginator-page")).toHaveCount(5);
      await expectActivePage(page, 0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page, getRoomMeetingsApiMock }) => {
        getRoomMeetingsApiMock.respondWithPage({ lastPage: 5 });
        await page.goto("/rooms/abc-def-123#tab=history");
        await expect(page.getByTestId("room-history-item")).toHaveCount(1);
        await expectActivePage(page, 0);
      });

      test("loads the next page", async ({ page, getRoomMeetingsApiMock }) => {
        getRoomMeetingsApiMock.respondWithPage({
          lastPage: 3,
          currentPage: 2,
        });
        const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
        // there are two paginator components, the first one for small devices and the second one for larger devices
        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(getRequestQuery(await historyRequest)).toMatchObject({
          sort_by: "start",
          sort_direction: "desc",
          page: "2",
        });

        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "meetings.start",
        );
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-history-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-history-item").first(),
        ).toContainText("06/23/2021, 12:04");
      });

      test("resets the page when changing the sorting direction", async ({
        page,
        getRoomMeetingsApiMock,
      }) => {
        getRoomMeetingsApiMock.respondWithPage({
          lastPage: 3,
          currentPage: 2,
        });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        getRoomMeetingsApiMock.respondWithPage({ lastPage: 3 });
        const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();

        expect(getRequestQuery(await historyRequest)).toMatchObject({
          sort_by: "start",
          sort_direction: "asc",
          page: "1",
        });
        await expectActivePage(page, 0);
      });

      test.describe("with ascending direction", () => {
        test.beforeEach(async ({ page, getRoomMeetingsApiMock }) => {
          getRoomMeetingsApiMock.respondWithPage({ lastPage: 3 });
          const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();
          expect(getRequestQuery(await historyRequest)).toMatchObject({
            sort_direction: "asc",
          });
          await expectActivePage(page, 0);
        });

        test("keeps the sorting direction when loading the next page", async ({
          page,
          getRoomMeetingsApiMock,
        }) => {
          getRoomMeetingsApiMock.respondWithPage({
            lastPage: 3,
            currentPage: 2,
          });
          const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(getRequestQuery(await historyRequest)).toMatchObject({
            sort_by: "start",
            sort_direction: "asc",
            page: "2",
          });
          await expectActivePage(page, 1);
        });

        test("resets the page when selecting the sorting type again", async ({
          page,
          getRoomMeetingsApiMock,
        }) => {
          getRoomMeetingsApiMock.respondWithPage({
            lastPage: 3,
            currentPage: 2,
          });
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          getRoomMeetingsApiMock.respondWithPage({ lastPage: 3 });
          const historyRequest = getRoomMeetingsApiMock.waitForNextRequest();
          await selectSortType(page, 0);

          expect(getRequestQuery(await historyRequest)).toMatchObject({
            sort_by: "start",
            sort_direction: "asc",
            page: "1",
          });
          await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
            "meetings.start",
          );
          await expectActivePage(page, 0);
        });
      });
    });
  });
});
