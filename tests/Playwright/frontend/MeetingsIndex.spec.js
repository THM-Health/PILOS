import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/roomsIndexMeetingsMeetings.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { interceptRoomViewRequests } from "../support/mocks.js";
import { expectActivePage, holdRequest, queryOf } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Meetings index", () => {
  test.beforeEach(async ({ currentUser }) => {
    currentUser.data.permissions = ["rooms.viewAny", "meetings.viewAny"];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/meetings");
  });

  test("visit with user without permission to view meetings", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [];

    await page.goto("/meetings");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page).not.toHaveURL(/\/admin\/meetings/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "home.title",
    );
  });

  test.describe("loading", () => {
    test("loading state while meetings are loaded", async ({
      page,
      meetings,
    }) => {
      const release = await holdRequest(page, "**/api/v1/meetings*", {
        json: meetings.json,
      });

      await page.goto("/meetings");

      await expect(
        page.getByRole("heading", { name: "meetings.currently_running" }),
      ).toBeVisible();

      const search = page.getByTestId("meeting-search");
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.getByRole("button")).toBeDisabled();
      await expect(page.getByTestId("meetings-reload-button")).toBeDisabled();
      await expect(page.getByTestId("overlay")).toBeVisible();

      release();

      // Check that loading is over
      await expect(page.getByTestId("meeting-item")).toHaveCount(3);
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.getByRole("button")).toBeEnabled();
      await expect(page.getByTestId("meetings-reload-button")).toBeEnabled();
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("loading state during reload", async ({ page, meetings }) => {
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(3);

      const release = await holdRequest(page, "**/api/v1/meetings*", {
        json: meetings.json,
      });

      await page.getByTestId("meetings-reload-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();

      const search = page.getByTestId("meeting-search");
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.getByRole("button")).toBeDisabled();
      await expect(page.getByTestId("meetings-reload-button")).toBeDisabled();

      const firstItem = page.getByTestId("meeting-item").first();
      await expect(
        firstItem.locator('button[data-test="meeting-view-room-button"]'),
      ).toBeDisabled();

      release();

      // Check that overlay is hidden after reload
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.getByRole("button")).toBeEnabled();
      await expect(page.getByTestId("meetings-reload-button")).toBeEnabled();

      const viewButton = firstItem.locator(
        'a[data-test="meeting-view-room-button"]',
      );
      await expect(viewButton).toBeVisible();
      await expect(viewButton).toHaveAttribute("href", "/rooms/abc-def-123");
    });
  });

  test.describe("table", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(3);
    });

    test("header cells", async ({ page }) => {
      const headers = page.getByTestId("meeting-header-cell");
      await expect(headers).toHaveCount(9);

      await expect(headers.nth(0)).toHaveText("meetings.start");
      await expect(headers.nth(1)).toHaveText("rooms.name");
      await expect(headers.nth(2)).toHaveText("meetings.owner");
      await expect(headers.nth(3)).toHaveText("app.server");
      await expect(headers.nth(8)).toHaveText("app.actions");

      const iconHeaders = [
        [4, "fa-users", "meetings.participant_count"],
        [5, "fa-headphones", "meetings.listener_count"],
        [6, "fa-microphone", "meetings.voice_participant_count"],
        [7, "fa-video", "meetings.video_count"],
      ];
      for (const [index, icon, label] of iconHeaders) {
        const icons = headers.nth(index).locator(`.${icon}`);
        await expect(icons).toBeVisible();
        await expect(icons).toHaveAttribute("aria-hidden", "true");
        await expect(headers.nth(index).locator(".sr-only")).toHaveText(label);
      }
    });

    test("meeting with participants", async ({ page }) => {
      const cells = page
        .getByTestId("meeting-item")
        .nth(0)
        .getByTestId("meeting-item-cell");
      await expect(cells).toHaveCount(9);
      await expect(cells).toHaveText([
        "02/12/2021, 19:09",
        "Meeting One",
        "John Doe",
        "Server 01",
        "10",
        "5",
        "5",
        "3",
        "",
      ]);
      await expect(
        cells.nth(8).getByTestId("meeting-view-room-button"),
      ).toBeVisible();
      await expect(
        cells.nth(8).getByTestId("meeting-view-room-button"),
      ).toHaveAttribute("href", "/rooms/abc-def-123");
    });

    test("second meeting", async ({ page }) => {
      const cells = page
        .getByTestId("meeting-item")
        .nth(1)
        .getByTestId("meeting-item-cell");
      await expect(cells).toHaveCount(9);
      await expect(cells).toHaveText([
        "02/12/2021, 19:10",
        "Meeting Two",
        "Max Doe",
        "Server 02",
        "50",
        "30",
        "20",
        "10",
        "",
      ]);
      await expect(
        cells.nth(8).getByTestId("meeting-view-room-button"),
      ).toBeVisible();
      await expect(
        cells.nth(8).getByTestId("meeting-view-room-button"),
      ).toHaveAttribute("href", "/rooms/def-abc-123");
    });

    test("meeting without statistics", async ({ page }) => {
      const cells = page
        .getByTestId("meeting-item")
        .nth(2)
        .getByTestId("meeting-item-cell");
      await expect(cells).toHaveCount(9);
      await expect(cells.nth(0)).toHaveText("02/12/2021, 18:14");
      await expect(cells.nth(1)).toHaveText("Meeting Three");
      await expect(cells.nth(2)).toHaveText("John Doe");
      await expect(cells.nth(3)).toHaveText("Server 01");
      for (const index of [4, 5, 6, 7]) {
        await expect(cells.nth(index)).toContainText("---");
      }
      await expect(
        cells.nth(8).getByTestId("meeting-view-room-button"),
      ).toBeVisible();
      await expect(
        cells.nth(8).getByTestId("meeting-view-room-button"),
      ).toHaveAttribute("href", "/rooms/def-abc-456");
    });

    test("view room of meeting", async ({ page }) => {
      await interceptRoomViewRequests(page);

      const item = page.getByTestId("meeting-item").nth(0);
      await expect(item).toContainText("02/12/2021, 19:09");
      await expect(item).toContainText("Meeting One");
      await item.getByTestId("meeting-view-room-button").click();

      // Check that redirect worked
      await expect(page).toHaveURL(/\/rooms\/abc-def-123/);
      await expect(page).not.toHaveURL(/\/meetings/);
    });
  });

  test.describe("load errors", () => {
    test("initial load error with reload", async ({ page, meetings }) => {
      meetings.status = 500;
      meetings.json = { message: "Test" };

      await page.goto("/meetings");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Overlay is shown, components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("meeting-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.getByRole("button")).toBeEnabled();
      await expect(page.getByTestId("meetings-reload-button")).toBeEnabled();

      // Reload with correct data
      meetings.status = 200;
      meetings.showPage(1, 3);

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toBeHidden();

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:09");
      await expect(items.nth(0)).toContainText("Meeting One");
    });

    test("error on page change with reload", async ({ page, meetings }) => {
      meetings.showPage(1, 3);
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(1);

      // Switch to next page with general error
      meetings.status = 500;
      meetings.json = { message: "Test" };
      const request = page.waitForRequest("**/api/v1/meetings*");
      await page.getByTestId("paginator-next-button").nth(1).click();
      expect(queryOf(await request)).toMatchObject({ page: "2" });

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Overlay is shown, components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("meeting-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.getByRole("button")).toBeEnabled();
      await expect(page.getByTestId("meetings-reload-button")).toBeEnabled();

      // Reload with correct data, the page is reset
      meetings.status = 200;
      meetings.showPage(1, 3);
      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      const reloadRequest = page.waitForRequest("**/api/v1/meetings*");
      await retryButton.click();
      expect(queryOf(await reloadRequest)).toMatchObject({ page: "1" });

      await expect(page.getByTestId("overlay")).toBeHidden();

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:09");
      await expect(items.nth(0)).toContainText("Meeting One");
      await expectActivePage(page, 0);
    });

    test("unauthenticated on page change", async ({ page, meetings }) => {
      meetings.showPage(1, 3);
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(1);

      meetings.status = 401;
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectLoginRedirect(page, "/meetings");
    });

    test("unauthenticated on page load", async ({ page, meetings }) => {
      meetings.status = 401;
      await page.goto("/meetings");

      await expectLoginRedirect(page, "/meetings");
    });
  });

  test("load meetings page out of bounds", async ({ page, meetings }) => {
    meetings.showPage(1, 2, { total: 2 });
    await page.goto("/meetings");
    await expect(page.getByTestId("meeting-item")).toHaveCount(1);

    // Switch to next page but respond with no meetings on second page, then with both meetings on the first page
    const requests = [];
    await page.route("**/api/v1/meetings*", (route) => {
      requests.push(queryOf(route.request()));
      if (requests.length === 1) {
        meetings.show({
          slice: [0, 0],
          meta: {
            current_page: 2,
            from: null,
            per_page: 2,
            to: null,
            total: 2,
            total_no_filter: 2,
          },
        });
      } else {
        meetings.show({
          slice: [0, 2],
          meta: { per_page: 2, to: 2, total: 2, total_no_filter: 2 },
        });
      }
      return route.fallback();
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for page 2, then the page is reset
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[0]).toMatchObject({ page: "2" });
    expect(requests[1]).toMatchObject({ page: "1" });

    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("search", () => {
    test("initial request has no query", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/meetings*");
      await page.goto("/meetings");

      const query = queryOf(await request);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
      await expect(
        page.getByTestId("meeting-search").locator("input"),
      ).toHaveValue("");
    });

    test("no meetings found for search query", async ({ page, meetings }) => {
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(3);

      meetings.showNoneFound();

      const request = page.waitForRequest("**/api/v1/meetings*");
      const search = page.getByTestId("meeting-search");
      await search.locator("input").fill("Test");
      await search.getByRole("button").click();

      const query = queryOf(await request);
      expect(query.query).toBe("Test");
      expect(query).toMatchObject({ page: "1" });

      await expect(page.getByText("meetings.no_data_filtered")).toBeVisible();
      await expect(page.getByTestId("meeting-item")).toHaveCount(0);
    });

    test("no meetings available, search with enter", async ({
      page,
      meetings,
    }) => {
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(3);

      meetings.showNoneAvailable();

      const request = page.waitForRequest("**/api/v1/meetings*");
      const input = page.getByTestId("meeting-search").locator("input");
      await input.fill("Test2");
      await input.press("Enter");

      const query = queryOf(await request);
      expect(query.query).toBe("Test2");
      expect(query).toMatchObject({ page: "1" });

      await expect(
        page.getByText("meetings.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("meeting-item")).toHaveCount(0);
    });

    test.describe("with result on 2 pages", () => {
      test.beforeEach(async ({ page, meetings }) => {
        await page.goto("/meetings");
        await expect(page.getByTestId("meeting-item")).toHaveCount(3);

        meetings.showPage(1, 2, { total: 2 });

        const request = page.waitForRequest("**/api/v1/meetings*");
        const search = page.getByTestId("meeting-search");
        await search.locator("input").fill("Meeting");
        await search.getByRole("button").click();

        const query = queryOf(await request);
        expect(query.query).toBe("Meeting");
        expect(query).toMatchObject({ page: "1" });
      });

      test("shows result and pagination", async ({ page }) => {
        const items = page.getByTestId("meeting-item");
        await expect(items).toHaveCount(1);
        await expect(items.nth(0)).toContainText("02/12/2021, 19:09");
        await expect(items.nth(0)).toContainText("Meeting One");

        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same when changing the page", async ({
        page,
        meetings,
      }) => {
        meetings.showPage(2, 2, { total: 2 });

        const request = page.waitForRequest("**/api/v1/meetings*");
        // nth(1) needed because there are two paginator components (small and larger devices)
        await page.getByTestId("paginator-next-button").nth(1).click();

        const query = queryOf(await request);
        expect(query.query).toBe("Meeting");
        expect(query).toMatchObject({ page: "2" });

        await expect(
          page.getByTestId("meeting-search").locator("input"),
        ).toHaveValue("Meeting");
        await expectActivePage(page, 1);

        const items = page.getByTestId("meeting-item");
        await expect(items).toHaveCount(1);
        await expect(items.nth(0)).toContainText("02/12/2021, 19:10");
        await expect(items.nth(0)).toContainText("Meeting Two");
      });

      test("page is reset when the search query changes", async ({
        page,
        meetings,
      }) => {
        meetings.showPage(2, 2, { total: 2 });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        meetings.showPage(1, 2, { total: 2 });

        const request = page.waitForRequest("**/api/v1/meetings*");
        const search = page.getByTestId("meeting-search");
        await search.locator("input").fill("Meet");
        await search.getByRole("button").click();

        const query = queryOf(await request);
        expect(query.query).toBe("Meet");
        expect(query).toMatchObject({ page: "1" });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sorting", () => {
    test.beforeEach(async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/meetings*");
      await page.goto("/meetings");
      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "start",
        sort_direction: "asc",
      });
    });

    test("sortable columns and initial sorting", async ({ page }) => {
      const headers = page.getByTestId("meeting-header-cell");
      await expect(headers).toHaveCount(9);

      await expect(headers.nth(0)).toHaveText("meetings.start");
      await expect(headers.nth(0)).toHaveAttribute(
        "data-p-sortable-column",
        "true",
      );
      await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "true");

      const notSortable = [
        [1, "rooms.name"],
        [2, "meetings.owner"],
        [3, "app.server"],
        [8, "app.actions"],
      ];
      for (const [index, text] of notSortable) {
        await expect(headers.nth(index)).toHaveText(text);
        await expect(headers.nth(index)).not.toHaveAttribute(
          "data-p-sortable-column",
          "true",
        );
      }

      for (const index of [4, 5, 6, 7]) {
        await expect(headers.nth(index)).toHaveAttribute(
          "data-p-sortable-column",
          "true",
        );
        await expect(headers.nth(index)).toHaveAttribute(
          "data-p-sorted",
          "false",
        );
      }
    });

    test("change sort type", async ({ page, meetings }) => {
      meetings.showPage(1, 3);

      const headers = page.getByTestId("meeting-header-cell");
      const request = page.waitForRequest("**/api/v1/meetings*");
      await headers.nth(4).click();

      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "room.participant_count",
        sort_direction: "asc",
      });

      await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:09");
      await expect(items.nth(0)).toContainText("Meeting One");

      await expect(page.getByTestId("paginator-page")).toHaveCount(3);
      await expectActivePage(page, 0);
    });

    test("sorting stays the same when changing the page", async ({
      page,
      meetings,
    }) => {
      meetings.showPage(1, 3);
      const headers = page.getByTestId("meeting-header-cell");
      await headers.nth(4).click();
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");

      meetings.showPage(2, 3);

      const request = page.waitForRequest("**/api/v1/meetings*");
      await page.getByTestId("paginator-next-button").nth(1).click();

      expect(queryOf(await request)).toMatchObject({
        page: "2",
        sort_by: "room.participant_count",
        sort_direction: "asc",
      });

      await expectActivePage(page, 1);
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(4)).toHaveAttribute("aria-sort", "ascending");

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:10");
      await expect(items.nth(0)).toContainText("Meeting Two");
    });

    test("page is reset when the sorting direction changes", async ({
      page,
      meetings,
    }) => {
      meetings.showPage(1, 3);
      const headers = page.getByTestId("meeting-header-cell");
      await headers.nth(4).click();
      await expect(headers.nth(4)).toHaveAttribute("aria-sort", "ascending");

      meetings.showPage(2, 3);
      await page.getByTestId("paginator-next-button").nth(1).click();
      await expectActivePage(page, 1);

      meetings.showPage(1, 3);
      const request = page.waitForRequest("**/api/v1/meetings*");
      await headers.nth(4).click();

      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "room.participant_count",
        sort_direction: "desc",
      });

      await expectActivePage(page, 0);
      await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(4)).toHaveAttribute("aria-sort", "descending");

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:09");
      await expect(items.nth(0)).toContainText("Meeting One");
    });

    test("change sort type to listener count and change page", async ({
      page,
      meetings,
    }) => {
      meetings.showPage(1, 3);
      const headers = page.getByTestId("meeting-header-cell");
      await headers.nth(4).click();
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");

      const sortRequest = page.waitForRequest("**/api/v1/meetings*");
      await headers.nth(5).click();

      expect(queryOf(await sortRequest)).toMatchObject({
        page: "1",
        sort_by: "room.listener_count",
        sort_direction: "asc",
      });
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(5)).toHaveAttribute("aria-sort", "ascending");

      meetings.showPage(2, 3);
      const pageRequest = page.waitForRequest("**/api/v1/meetings*");
      await page.getByTestId("paginator-next-button").nth(1).click();

      expect(queryOf(await pageRequest)).toMatchObject({
        page: "2",
        sort_by: "room.listener_count",
        sort_direction: "asc",
      });

      await expectActivePage(page, 1);
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(5)).toHaveAttribute("aria-sort", "ascending");

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:10");
      await expect(items.nth(0)).toContainText("Meeting Two");
    });

    test("page is reset when the sort type changes", async ({
      page,
      meetings,
    }) => {
      meetings.showPage(1, 3);
      const headers = page.getByTestId("meeting-header-cell");
      await headers.nth(5).click();
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "true");

      meetings.showPage(2, 3);
      await page.getByTestId("paginator-next-button").nth(1).click();
      await expectActivePage(page, 1);

      meetings.showPage(1, 3);
      const request = page.waitForRequest("**/api/v1/meetings*");
      await headers.nth(6).click();

      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "room.voice_participant_count",
        sort_direction: "asc",
      });

      await expectActivePage(page, 0);
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(6)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(6)).toHaveAttribute("aria-sort", "ascending");
    });

    test("sort by video count", async ({ page }) => {
      const headers = page.getByTestId("meeting-header-cell");
      await headers.nth(6).click();
      await expect(headers.nth(6)).toHaveAttribute("data-p-sorted", "true");

      const request = page.waitForRequest("**/api/v1/meetings*");
      await headers.nth(7).click();

      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "room.video_count",
        sort_direction: "asc",
      });

      await expect(headers.nth(6)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(7)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(7)).toHaveAttribute("aria-sort", "ascending");
    });
  });

  test.describe("reload", () => {
    test.beforeEach(async ({ page, meetings }) => {
      meetings.showPage(1, 2, { total: 2 });
      await page.goto("/meetings");
      await expect(page.getByTestId("meeting-item")).toHaveCount(1);
    });

    test("reload first page", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/meetings*");
      await page.getByTestId("meetings-reload-button").click();
      expect(queryOf(await request)).toMatchObject({ page: "1" });

      await expectActivePage(page, 0);

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:09");
      await expect(items.nth(0)).toContainText("Meeting One");
    });

    test("reload keeps the current page", async ({ page, meetings }) => {
      meetings.showPage(2, 2, { total: 2 });
      await page.getByTestId("paginator-next-button").nth(1).click();
      await expectActivePage(page, 1);

      const request = page.waitForRequest("**/api/v1/meetings*");
      await page.getByTestId("meetings-reload-button").click();
      expect(queryOf(await request)).toMatchObject({ page: "2" });

      await expectActivePage(page, 1);

      const items = page.getByTestId("meeting-item");
      await expect(items).toHaveCount(1);
      await expect(items.nth(0)).toContainText("02/12/2021, 19:10");
      await expect(items.nth(0)).toContainText("Meeting Two");
    });
  });
});
