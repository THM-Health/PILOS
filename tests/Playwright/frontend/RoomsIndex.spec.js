import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  expectActivePage,
  holdApiRequest,
  mockApiRequest,
  getRequestQuery,
  readFixture,
  modelNotFound,
  serverError,
} from "../support/utils.js";

const test = mergeTests(roomControllerTest, roomTypeControllerTest);

test.use({ authenticated: true });

test.describe("Rooms index", () => {
  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/rooms");
  });

  test.describe("list of rooms", () => {
    test("loading state", async ({ page, roomsResponse, getRoomsApiMock }) => {
      getRoomsApiMock.respondWith({ json: roomsResponse, hold: true });

      await page.goto("/rooms");

      // Room skeletons are shown, general overlay is hidden
      await expect(page.getByTestId("room-skeletons")).toBeVisible();
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      // Room search field
      const search = page.getByTestId("room-search");
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();

      // Room filter buttons
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(filterButtons.nth(i)).toBeDisabled();
      }

      await expect(page.getByTestId("only-favorites-button")).toBeDisabled();
      await expect(
        page.getByTestId("room-type-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("filter-button")).toBeHidden();
      await expect(
        page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      getRoomsApiMock.release();

      await expect(page.getByTestId("room-card")).toHaveCount(3);
    });

    test("components are enabled after loading", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      const search = page.getByTestId("room-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("only-favorites-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(filterButtons.nth(i)).toBeEnabled();
      }
      await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(0);
      await expect(page.getByTestId("filter-button")).toBeHidden();
      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
    });

    test("loading state with rooms.viewAll permission", async ({
      page,
      currentUserResponse,
      roomsResponse,
      getRoomsApiMock,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      getRoomsApiMock.respondWith({ json: roomsResponse, hold: true });

      await page.goto("/rooms");

      await expect(page.getByTestId("room-skeletons")).toBeVisible();
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      const search = page.getByTestId("room-search");
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();

      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(filterButtons.nth(i)).toBeDisabled();
      }
      await expect(page.getByTestId("rooms-filter-all-button")).toBeDisabled();
      await expect(page.getByTestId("only-favorites-button")).toBeDisabled();
      await expect(
        page.getByTestId("room-type-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("filter-button")).toBeHidden();
      await expect(
        page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      getRoomsApiMock.release();

      await expect(page.getByTestId("room-card")).toHaveCount(3);
    });

    test("components are enabled after loading with rooms.viewAll permission", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      const search = page.getByTestId("room-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("only-favorites-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(filterButtons.nth(i)).toBeEnabled();
      }
      await expect(page.getByTestId("rooms-filter-all-button")).toBeEnabled();
      await expect(page.getByTestId("filter-button")).toBeHidden();
      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
    });

    test("room cards show the room data", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      // Meeting Three: ran till, no short description, not a favorite
      const roomThree = page.getByTestId("room-card").nth(2);
      await expect(roomThree).toContainText("Meeting Three");
      await expect(roomThree).toContainText("John Doe");
      await expect(roomThree).toContainText(
        'rooms.index.room_component.last_ran_till_{"date":"08/21/2023, 10:20"}',
      );
      await expect(roomThree.locator("a").first()).toHaveAttribute(
        "href",
        "/rooms/def-abc-456",
      );
      await expect(roomThree.getByTestId("room-info-button")).toHaveCount(0);
      await expect(
        roomThree.getByTestId("room-favorites-button"),
      ).toBeVisible();
      await expect(
        roomThree.getByTestId("room-favorites-button"),
      ).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting Three"}',
      );

      // Meeting Two: running, favorite
      const roomTwo = page.getByTestId("room-card").nth(1);
      await expect(roomTwo).toContainText("Meeting Two");
      await expect(roomTwo).toContainText("John Doe");
      await expect(roomTwo).toContainText(
        'rooms.index.room_component.running_since_{"date":"08/21/2023, 10:18"}',
      );
      await expect(roomTwo.locator("a").first()).toHaveAttribute(
        "href",
        "/rooms/def-abc-123",
      );
      await expect(roomTwo.getByTestId("room-info-button")).toHaveCount(0);
      await expect(roomTwo.getByTestId("room-favorites-button")).toBeVisible();
      await expect(
        roomTwo.getByTestId("room-favorites-button"),
      ).toHaveAttribute(
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting Two"}',
      );

      // Meeting One: never started, short description
      const roomOne = page.getByTestId("room-card").nth(0);
      await expect(roomOne).toContainText("Meeting One");
      await expect(roomOne).toContainText("John Doe");
      await expect(roomOne).toContainText(
        "rooms.index.room_component.never_started",
      );
      await expect(roomOne.locator("a").first()).toHaveAttribute(
        "href",
        "/rooms/abc-def-123",
      );
      await expect(roomOne.getByTestId("room-favorites-button")).toBeVisible();
      await expect(
        roomOne.getByTestId("room-favorites-button"),
      ).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting One"}',
      );
      await expect(roomOne.getByTestId("room-info-button")).toBeVisible();
    });

    test("open room info dialog and continue to room view", async ({
      page,
      getRoomApiMock,
    }) => {
      getRoomApiMock.respondWith({
        json: readFixture("room.json"),
      });
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
      await page
        .getByTestId("room-card")
        .nth(0)
        .getByTestId("room-info-button")
        .click();
      const dialog = page.getByTestId("room-info-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Meeting One").first()).toBeVisible();
      await expect(dialog.getByText("John Doe").first()).toBeVisible();
      await expect(
        dialog.getByText("Room short description").first(),
      ).toBeVisible();
      await expect(
        dialog.getByText("rooms.index.room_component.never_started").first(),
      ).toBeVisible();

      // Open room view
      await dialog.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123"),
      );
    });

    test("click on room card to open room view", async ({
      page,
      getRoomApiMock,
    }) => {
      getRoomApiMock.respondWith({
        json: readFixture("room.json"),
        hold: true,
      });
      await page.goto("/rooms");

      // Click on room card to open room view
      await page.getByTestId("room-card").nth(0).click();

      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123"),
      );

      await expect(page.getByTestId("no-room-overlay")).toBeVisible();
      getRoomApiMock.release();
      await expect(page.getByTestId("no-room-overlay")).toBeHidden();
    });
  });

  test.describe("sorting", () => {
    test.beforeEach(async ({ getRoomsApiMock }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
    });

    test("initial request and sorting options", async ({
      page,
      getRoomsApiMock,
    }) => {
      const request = getRoomsApiMock.waitForNextRequest();
      await page.goto("/rooms");
      expect(getRequestQuery(await request)).toMatchObject({
        sort_by: "last_started",
        page: "1",
      });

      // Check that correct sorting type is displayed
      const dropdown = page.getByTestId("sorting-type-dropdown");
      await expect(dropdown).toHaveText("rooms.index.sorting.last_started");
      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );

      await dropdown.click();

      const items = page.getByTestId("sorting-type-dropdown-items");
      await expect(items).toBeVisible();
      const options = items.getByTestId("sorting-type-dropdown-option");
      await expect(options).toHaveCount(3);
      await expect(options.nth(0)).toContainText(
        "rooms.index.sorting.last_started",
      );
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
      await expect(options.nth(1)).toContainText("rooms.index.sorting.alpha");
      await expect(options.nth(2)).toContainText(
        "rooms.index.sorting.room_type",
      );
    });

    test("change sorting", async ({ page, getRoomsApiMock }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);

      const request = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("sorting-type-dropdown").click();
      await page.getByTestId("sorting-type-dropdown-option").nth(1).click();
      expect(getRequestQuery(await request)).toMatchObject({
        sort_by: "alpha",
        page: "1",
      });

      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "rooms.index.sorting.alpha",
      );

      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting One");
      await expect(page.getByTestId("paginator-page")).toHaveCount(3);
      await expectActivePage(page, 0);
    });

    test("keep sorting when changing the page", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      const sortRequest = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("sorting-type-dropdown").click();
      await page.getByTestId("sorting-type-dropdown-option").nth(1).click();
      await sortRequest;

      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      const request = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();
      expect(getRequestQuery(await request)).toMatchObject({
        sort_by: "alpha",
        page: "2",
      });

      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "rooms.index.sorting.alpha",
      );
      await expectActivePage(page, 1);
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting Two");
    });

    test("reset page when changing sorting", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);

      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      const pageRequest = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();
      await pageRequest;
      await expectActivePage(page, 1);

      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      const request = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("sorting-type-dropdown").click();
      await page.getByTestId("sorting-type-dropdown-option").nth(2).click();
      expect(getRequestQuery(await request)).toMatchObject({
        sort_by: "room_type",
        page: "1",
      });

      await expectActivePage(page, 0);
    });
  });

  test.describe("search", () => {
    test("initial request has no search query", async ({
      page,
      getRoomsApiMock,
    }) => {
      const request = getRoomsApiMock.waitForNextRequest();
      await page.goto("/rooms");
      const query = getRequestQuery(await request);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("no rooms found for the search query", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      getRoomsApiMock.respondWithNoSearchResults();
      await page.getByTestId("room-search").locator("input").fill("Test");
      const request = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("room-search").locator("button").click();
      expect(getRequestQuery(await request)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("rooms.no_rooms_found")).toBeVisible();
      await expect(page.getByTestId("room-card")).toHaveCount(0);
    });

    test("no rooms available, search with enter", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      getRoomsApiMock.respondWithNoItems();
      const input = page.getByTestId("room-search").locator("input");
      await input.fill("Test2");
      const request = getRoomsApiMock.waitForNextRequest();
      await input.press("Enter");
      expect(getRequestQuery(await request)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(page.getByTestId("room-card")).toHaveCount(0);
    });

    test.describe("with 2 rooms on 2 pages", () => {
      test.beforeEach(async ({ page, getRoomsApiMock }) => {
        await page.goto("/rooms");
        await expect(page.getByTestId("room-card")).toHaveCount(3);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 2,
          meta: { total: 2 },
        });
        await page.getByTestId("room-search").locator("input").fill("Meeting");
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("room-search").locator("button").click();
        expect(getRequestQuery(await request)).toMatchObject({
          query: "Meeting",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keep search query when changing the page", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 2,
          meta: { total: 2 },
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await request)).toMatchObject({
          query: "Meeting",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-search").locator("input"),
        ).toHaveValue("Meeting");
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Two",
        );
      });

      test("reset page when changing the search query", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 2,
          meta: { total: 2 },
        });
        const pageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await pageRequest;
        await expectActivePage(page, 1);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 2,
          meta: { total: 2 },
        });
        const input = page.getByTestId("room-search").locator("input");
        await input.clear();
        await input.fill("Meet");
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("room-search").locator("button").click();
        expect(getRequestQuery(await request)).toMatchObject({
          query: "Meet",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter room type", () => {
    test("initial request and room type options", async ({
      page,
      getRoomsApiMock,
    }) => {
      const request = getRoomsApiMock.waitForNextRequest();
      await page.goto("/rooms");
      const query = getRequestQuery(await request);
      expect(query.room_type).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });

      const dropdown = page.getByTestId("room-type-dropdown");
      await expect(dropdown).toHaveText("rooms.room_types.all");
      await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(0);

      await dropdown.click();

      const items = page.getByTestId("room-type-dropdown-items");
      await expect(items).toBeVisible();
      const options = items.getByTestId("room-type-dropdown-option");
      await expect(options).toHaveCount(5);
      await expect(options.nth(0)).toHaveText("rooms.room_types.all");
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
      await expect(options.nth(1)).toHaveText("Lecture");
      await expect(options.nth(2)).toHaveText("Meeting");
      await expect(options.nth(3)).toHaveText("Exam");
      await expect(options.nth(4)).toHaveText("Seminar");
    });

    test("no rooms found for the room type", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      getRoomsApiMock.respondWithNoSearchResults();
      const request = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("room-type-dropdown").click();
      await page.getByTestId("room-type-dropdown-option").nth(2).click();
      expect(getRequestQuery(await request)).toMatchObject({
        room_type: "2",
        page: "1",
      });

      await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(0);
      await expect(page.getByText("rooms.no_rooms_found")).toBeVisible();
      await expect(page.getByTestId("room-type-dropdown")).toHaveText(
        "Meeting",
      );
    });

    test("no rooms available for the room type", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      getRoomsApiMock.respondWithNoItems();
      const request = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("room-type-dropdown").click();
      await page.getByTestId("room-type-dropdown-option").nth(3).click();
      expect(getRequestQuery(await request)).toMatchObject({
        room_type: "3",
        page: "1",
      });

      await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(0);
      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(page.getByTestId("room-type-dropdown")).toHaveText("Exam");
    });

    test.describe("with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page, getRoomsApiMock }) => {
        await page.goto("/rooms");
        await expect(page.getByTestId("room-card")).toHaveCount(3);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("room-type-dropdown").click();
        await page.getByTestId("room-type-dropdown-option").nth(4).click();
        expect(getRequestQuery(await request)).toMatchObject({
          room_type: "4",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("room-type-dropdown")).toHaveText(
          "Seminar",
        );
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep room type when changing the page", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await request)).toMatchObject({
          room_type: "4",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-type-dropdown")).toHaveText(
          "Seminar",
        );
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Two",
        );
      });

      test("reset page when changing the room type", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const pageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await pageRequest;
        await expectActivePage(page, 1);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("room-type-dropdown").click();
        await page.getByTestId("room-type-dropdown-option").nth(1).click();
        expect(getRequestQuery(await request)).toMatchObject({
          room_type: "1",
          page: "1",
        });

        await expectActivePage(page, 0);
      });

      test("reset to all room types", async ({ page, getRoomsApiMock }) => {
        getRoomsApiMock.respondWithDefault();
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("room-type-dropdown").click();
        await page.getByTestId("room-type-dropdown-option").nth(0).click();
        expect(getRequestQuery(await request).room_type).toBeUndefined();

        await expect(page.getByTestId("room-card")).toHaveCount(3);
      });
    });
  });

  test.describe("filter without viewAll permission", () => {
    test("initial filters", async ({ page, getRoomsApiMock }) => {
      const request = getRoomsApiMock.waitForNextRequest();
      await page.goto("/rooms");
      expect(getRequestQuery(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(0);
    });

    test("no rooms available for the filter combination", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      getRoomsApiMock.respondWithNoItems();
      const request = getRoomsApiMock.waitForNextRequest();
      await filterButtons.nth(1).click();
      expect(getRequestQuery(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "0",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    test.describe("with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page, getRoomsApiMock }) => {
        await page.goto("/rooms");
        const filterButtons = page.getByTestId("rooms-filter-button");
        await expect(filterButtons).toHaveText([
          "rooms.index.show_own",
          "rooms.index.show_shared",
          "rooms.index.show_public",
        ]);
        await expect(filterButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(2)).toHaveAttribute(
          "aria-pressed",
          "false",
        );

        getRoomsApiMock.respondWithDefault();
        const sharedRequest = getRoomsApiMock.waitForNextRequest();
        await filterButtons.nth(1).click();
        await sharedRequest;
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "false",
        );

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await filterButtons.nth(2).click();
        expect(getRequestQuery(await request)).toMatchObject({
          filter_own: "1",
          filter_shared: "0",
          filter_public: "1",
          filter_all: "0",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        const filterButtons = page.getByTestId("rooms-filter-button");
        await expect(filterButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await expect(filterButtons.nth(2)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep filters when changing the page", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await request)).toMatchObject({
          filter_own: "1",
          filter_shared: "0",
          filter_public: "1",
          filter_all: "0",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Two",
        );
        const filterButtons = page.getByTestId("rooms-filter-button");
        await expect(filterButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await expect(filterButtons.nth(2)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });

      test("reset page when changing the filters", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const pageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await pageRequest;
        await expectActivePage(page, 1);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const filterButtons = page.getByTestId("rooms-filter-button");
        const request = getRoomsApiMock.waitForNextRequest();
        await filterButtons.nth(0).click();
        expect(getRequestQuery(await request)).toMatchObject({
          filter_own: "0",
          filter_shared: "0",
          filter_public: "1",
          filter_all: "0",
          page: "1",
        });

        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        await expect(filterButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await expect(filterButtons.nth(2)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });
    });
  });

  test.describe("filter with viewAll permission", () => {
    test.beforeEach(async ({ currentUserResponse }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
    });

    test("initial filters", async ({ page, getRoomsApiMock }) => {
      const request = getRoomsApiMock.waitForNextRequest();
      await page.goto("/rooms");
      expect(getRequestQuery(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      const allButton = page.getByTestId("rooms-filter-all-button");
      await expect(allButton).toHaveText("rooms.index.show_all");
      await expect(allButton).toHaveAttribute("aria-pressed", "false");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    test("filter all hides the other filter buttons", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      getRoomsApiMock.respondWithNoItems();
      const allButton = page.getByTestId("rooms-filter-all-button");
      const request = getRoomsApiMock.waitForNextRequest();
      await allButton.click();
      expect(getRequestQuery(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "1",
        page: "1",
      });

      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(allButton).toHaveText("rooms.index.show_all");
      await expect(allButton).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
    });

    test("trigger filter all again restores the other filter buttons", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      getRoomsApiMock.respondWithNoItems();
      const allButton = page.getByTestId("rooms-filter-all-button");
      const allRequest = getRoomsApiMock.waitForNextRequest();
      await allButton.click();
      await allRequest;
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);

      getRoomsApiMock.respondWithDefault();
      const request = getRoomsApiMock.waitForNextRequest();
      await allButton.click();
      expect(getRequestQuery(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      await expect(allButton).toHaveText("rooms.index.show_all");
      await expect(allButton).toHaveAttribute("aria-pressed", "false");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    test("trigger filter button", async ({ page, getRoomsApiMock }) => {
      await page.goto("/rooms");
      const filterButtons = page.getByTestId("rooms-filter-button");
      await expect(filterButtons).toHaveText([
        "rooms.index.show_own",
        "rooms.index.show_shared",
        "rooms.index.show_public",
      ]);
      await expect(filterButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(filterButtons.nth(2)).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      const request = getRoomsApiMock.waitForNextRequest();
      await filterButtons.nth(2).click();
      expect(getRequestQuery(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "1",
        filter_all: "0",
        page: "1",
      });
    });

    test.describe("filter all with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page, getRoomsApiMock }) => {
        await page.goto("/rooms");
        const filterButtons = page.getByTestId("rooms-filter-button");
        await expect(filterButtons).toHaveText([
          "rooms.index.show_own",
          "rooms.index.show_shared",
          "rooms.index.show_public",
        ]);
        await expect(filterButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(2)).toHaveAttribute(
          "aria-pressed",
          "false",
        );

        const publicRequest = getRoomsApiMock.waitForNextRequest();
        await filterButtons.nth(2).click();
        await publicRequest;

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("rooms-filter-all-button").click();
        expect(getRequestQuery(await request)).toMatchObject({
          filter_own: "1",
          filter_shared: "1",
          filter_public: "1",
          filter_all: "1",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        await expect(
          page.getByTestId("rooms-filter-all-button"),
        ).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep filter all when changing the page", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await request)).toMatchObject({
          filter_own: "1",
          filter_shared: "1",
          filter_public: "1",
          filter_all: "1",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Two",
        );
        await expect(
          page.getByTestId("rooms-filter-all-button"),
        ).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
      });

      test("reset page and restore filter buttons when disabling filter all", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const pageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await pageRequest;
        await expectActivePage(page, 1);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const allButton = page.getByTestId("rooms-filter-all-button");
        const request = getRoomsApiMock.waitForNextRequest();
        await allButton.click();
        expect(getRequestQuery(await request)).toMatchObject({
          filter_own: "1",
          filter_shared: "1",
          filter_public: "1",
          filter_all: "0",
          page: "1",
        });

        await expectActivePage(page, 0);
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        await expect(allButton).toHaveAttribute("aria-pressed", "false");

        // The other filter buttons are shown again and still have the same state
        const filterButtons = page.getByTestId("rooms-filter-button");
        await expect(filterButtons).toHaveText([
          "rooms.index.show_own",
          "rooms.index.show_shared",
          "rooms.index.show_public",
        ]);
        await expect(filterButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(filterButtons.nth(2)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });
    });
  });

  test.describe("show favorites", () => {
    test.beforeEach(async ({ currentUserResponse }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
    });

    test("initial request and filter options", async ({
      page,
      getRoomsApiMock,
    }) => {
      const request = getRoomsApiMock.waitForNextRequest();
      await page.goto("/rooms");
      expect(getRequestQuery(await request)).toMatchObject({
        only_favorites: "0",
        page: "1",
      });

      await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();
    });

    test("no favorites", async ({ page, getRoomsApiMock }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();

      getRoomsApiMock.respondWithNoItems();
      const favoritesButton = page.getByTestId("only-favorites-button");
      await expect(favoritesButton).toHaveText("rooms.index.only_favorites");
      const request = getRoomsApiMock.waitForNextRequest();
      await favoritesButton.click();
      expect(getRequestQuery(await request)).toMatchObject({
        only_favorites: "1",
        page: "1",
      });

      await expect(page.getByText("rooms.index.no_favorites")).toBeVisible();
      await expect(page.getByTestId("room-card")).toHaveCount(0);
      await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(0);
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
    });

    test("disable only favorites shows the filter options again", async ({
      page,
      getRoomsApiMock,
    }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();

      getRoomsApiMock.respondWithNoItems();
      const favoritesButton = page.getByTestId("only-favorites-button");
      const favoritesRequest = getRoomsApiMock.waitForNextRequest();
      await favoritesButton.click();
      await favoritesRequest;
      await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(0);
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);

      getRoomsApiMock.respondWithDefault();
      const request = getRoomsApiMock.waitForNextRequest();
      await favoritesButton.click();
      expect(getRequestQuery(await request)).toMatchObject({
        only_favorites: "0",
        page: "1",
      });

      await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();
    });

    test.describe("with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page, getRoomsApiMock }) => {
        await page.goto("/rooms");
        await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
        await expect(page.getByTestId("room-type-dropdown")).toBeVisible();

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("only-favorites-button").click();
        expect(getRequestQuery(await request)).toMatchObject({
          only_favorites: "1",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
        await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep only favorites when changing the page", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await request)).toMatchObject({
          only_favorites: "1",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
        await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Two",
        );
      });

      test("reset page when disabling only favorites", async ({
        page,
        getRoomsApiMock,
      }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 3,
        });
        const pageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        await pageRequest;
        await expectActivePage(page, 1);

        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("only-favorites-button").click();
        expect(getRequestQuery(await request)).toMatchObject({
          only_favorites: "0",
          page: "1",
        });

        await expectActivePage(page, 0);
        await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
        await expect(page.getByTestId("room-type-dropdown")).toBeVisible();
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting One",
        );
      });
    });
  });

  test.describe("trigger favorites button", () => {
    test("add room to favorites from the room card", async ({
      page,
      getRoomsApiMock,
      roomsResponse,
    }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      const favoritesButton = page
        .getByTestId("room-card")
        .nth(0)
        .getByTestId("room-favorites-button");
      await expect(favoritesButton).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting One"}',
      );

      const postRoomFavoritesApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/favorites",
        { status: 204, hold: true },
      );
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      roomsResponse.data[0].is_favorite = true;

      await favoritesButton.click();
      await postRoomFavoritesApiMock.waitForRequest();
      await expect(favoritesButton).toBeDisabled();

      const roomsRequest = getRoomsApiMock.waitForNextRequest();
      postRoomFavoritesApiMock.release();
      expect(getRequestQuery(await roomsRequest)).toMatchObject({ page: "1" });

      await expect(favoritesButton).toHaveAttribute(
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting One"}',
      );
    });

    test("remove room from favorites from the room card", async ({
      page,
      getRoomsApiMock,
      roomsResponse,
    }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      const pageRequest = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();
      await pageRequest;
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting Two");

      const favoritesButton = page
        .getByTestId("room-card")
        .nth(0)
        .getByTestId("room-favorites-button");
      await expect(favoritesButton).toHaveAttribute(
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting Two"}',
      );

      const deleteRoomFavoritesApiMock = await mockApiRequest(
        page,
        "DELETE",
        "rooms/def-abc-123/favorites",
        { status: 204, hold: true },
      );
      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      roomsResponse.data[0].is_favorite = false;
      roomsResponse.data[0].short_description = "Room short descriptions";

      await favoritesButton.click();
      await deleteRoomFavoritesApiMock.waitForRequest();
      await expect(favoritesButton).toBeDisabled();

      const roomsRequest = getRoomsApiMock.waitForNextRequest();
      deleteRoomFavoritesApiMock.release();
      // Check that page stayed the same
      expect(getRequestQuery(await roomsRequest)).toMatchObject({ page: "2" });

      await expect(favoritesButton).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting Two"}',
      );
    });

    test("add room to favorites from the room info dialog", async ({
      page,
      getRoomsApiMock,
      roomsResponse,
    }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      roomsResponse.data[0].is_favorite = false;
      roomsResponse.data[0].short_description = "Room short descriptions";
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      roomsResponse.data[0].is_favorite = false;
      roomsResponse.data[0].short_description = "Room short descriptions";
      const pageRequest = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();
      await pageRequest;
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting Two");

      const postRoomFavoritesApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/def-abc-123/favorites",
        { status: 204 },
      );
      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      roomsResponse.data[0].short_description = "Room short descriptions";

      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
      await page
        .getByTestId("room-card")
        .nth(0)
        .getByTestId("room-info-button")
        .click();
      const dialog = page.getByTestId("room-info-dialog");
      await expect(dialog).toBeVisible();
      const roomsRequest = getRoomsApiMock.waitForNextRequest();
      const button = dialog.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting Two"}',
      );
      await button.click();

      await postRoomFavoritesApiMock.waitForRequest();
      expect(getRequestQuery(await roomsRequest)).toMatchObject({ page: "2" });

      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
    });

    test("remove room from favorites from the room info dialog", async ({
      page,
      getRoomsApiMock,
      roomsResponse,
    }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      roomsResponse.data[0].short_description = "Room short descriptions";
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      roomsResponse.data[0].short_description = "Room short descriptions";
      const pageRequest = getRoomsApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();
      await pageRequest;
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting Two");

      const deleteRoomFavoritesApiMock = await mockApiRequest(
        page,
        "DELETE",
        "rooms/def-abc-123/favorites",
        { status: 204 },
      );
      getRoomsApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 3,
      });
      roomsResponse.data[0].is_favorite = false;
      roomsResponse.data[0].short_description = "Room short descriptions";

      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
      await page
        .getByTestId("room-card")
        .nth(0)
        .getByTestId("room-info-button")
        .click();
      const dialog = page.getByTestId("room-info-dialog");
      await expect(dialog).toBeVisible();
      const roomsRequest = getRoomsApiMock.waitForNextRequest();
      const button = dialog.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute(
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting Two"}',
      );
      await button.click();

      await deleteRoomFavoritesApiMock.waitForRequest();
      expect(getRequestQuery(await roomsRequest)).toMatchObject({ page: "2" });
      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);

      // The reopened dialog shows the new state
      await page
        .getByTestId("room-card")
        .nth(0)
        .getByTestId("room-info-button")
        .click();
      const reopenedDialog = page.getByTestId("room-info-dialog");
      await expect(reopenedDialog).toBeVisible();
      await expect(
        reopenedDialog.getByTestId("room-favorites-button"),
      ).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting Two"}',
      );
      await reopenedDialog.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
    });

    test.describe("only favorites are shown", () => {
      // 4 favorites on 2 pages with 2 rooms per page
      test.beforeEach(async ({ page, getRoomsApiMock, roomsResponse }) => {
        getRoomsApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 3,
        });
        await page.goto("/rooms");
        await expect(page.getByTestId("room-card")).toHaveCount(1);

        getRoomsApiMock.respondWithSlice({
          slice: [0, 2],
          meta: {
            last_page: 2,
            per_page: 2,
            to: 2,
            total: 4,
            total_no_filter: 4,
          },
        });
        roomsResponse.data[0].is_favorite = true;
        const request = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("only-favorites-button").click();
        expect(getRequestQuery(await request)).toMatchObject({
          only_favorites: "1",
          page: "1",
        });
        await expect(page.getByTestId("room-card")).toHaveCount(2);
      });

      test("remove first room from favorites stays on the page", async ({
        page,
        getRoomsApiMock,
        roomsResponse,
      }) => {
        // Second page with Meeting Three and Meeting Four
        getRoomsApiMock.respondWithSlice({
          slice: [2, 3],
          meta: {
            current_page: 2,
            from: 3,
            last_page: 2,
            per_page: 2,
            to: 4,
            total: 4,
            total_no_filter: 4,
          },
        });
        roomsResponse.data[0].is_favorite = true;
        roomsResponse.data.push({
          id: "abc-def-456",
          name: "Meeting Four",
          owner: { id: 1, name: "John Doe" },
          last_meeting: null,
          type: { id: 2, name: "Meeting", color: "#4a5c66" },
          is_favorite: true,
          short_description: null,
        });
        const secondPageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await secondPageRequest)).toMatchObject({
          only_favorites: "1",
          page: "2",
        });
        await expect(page.getByTestId("room-card")).toHaveCount(2);

        roomsResponse.data = [roomsResponse.data[1]];
        roomsResponse.meta.current_page = 2;
        roomsResponse.meta.from = 3;
        roomsResponse.meta.last_page = 2;
        roomsResponse.meta.per_page = 2;
        roomsResponse.meta.to = 3;
        roomsResponse.meta.total = 3;
        roomsResponse.meta.total_no_filter = 3;
        const deleteRoomFavoritesApiMock = await mockApiRequest(
          page,
          "DELETE",
          "rooms/def-abc-456/favorites",
          { status: 204 },
        );

        const roomsRequest = getRoomsApiMock.waitForNextRequest();
        await page
          .getByTestId("room-card")
          .nth(0)
          .getByTestId("room-favorites-button")
          .click();

        await deleteRoomFavoritesApiMock.waitForRequest();
        expect(getRequestQuery(await roomsRequest)).toMatchObject({
          page: "2",
        });
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Four",
        );
      });

      test("reset page when the page is empty after removing a favorite", async ({
        page,
        getRoomsApiMock,
        roomsResponse,
      }) => {
        // Second page with Meeting Four
        getRoomsApiMock.respondWithSlice({
          slice: [0, 0],
          meta: {
            current_page: 2,
            from: 3,
            last_page: 2,
            per_page: 2,
            to: 4,
            total: 4,
            total_no_filter: 4,
          },
        });
        roomsResponse.data.push({
          id: "abc-def-456",
          name: "Meeting Four",
          owner: { id: 1, name: "John Doe" },
          last_meeting: null,
          type: { id: 2, name: "Meeting", color: "#4a5c66" },
          is_favorite: true,
          short_description: null,
        });
        const secondPageRequest = getRoomsApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(getRequestQuery(await secondPageRequest)).toMatchObject({
          only_favorites: "1",
          page: "2",
        });
        await expect(page.getByTestId("room-card")).toHaveCount(1);
        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Four",
        );

        // Respond with no rooms on the second page and with 2 rooms on the first page
        await page.route("**/api/v1/rooms*", (route) => {
          if (route.request().method() === "GET") {
            if (getRequestQuery(route.request()).page === "2") {
              getRoomsApiMock.respondWithSlice({
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
              getRoomsApiMock.respondWithSlice({
                slice: [0, 2],
                meta: {
                  per_page: 2,
                  to: 2,
                  total: 2,
                  total_no_filter: 2,
                },
              });
              roomsResponse.data[0].is_favorite = true;
            }
          }
          return route.fallback();
        });
        const deleteRoomFavoritesApiMock = await mockApiRequest(
          page,
          "DELETE",
          "rooms/abc-def-456/favorites",
          { status: 204 },
        );

        const loadedBefore = getRoomsApiMock.requests.length;
        await page
          .getByTestId("room-card")
          .nth(0)
          .getByTestId("room-favorites-button")
          .click();

        await deleteRoomFavoritesApiMock.waitForRequest();
        // First room request still has the second page, second one is reset to the first page
        expect(
          getRequestQuery(
            await getRoomsApiMock.waitForRequest(loadedBefore + 1),
          ),
        ).toMatchObject({ page: "2" });
        expect(
          getRequestQuery(
            await getRoomsApiMock.waitForRequest(loadedBefore + 2),
          ),
        ).toMatchObject({ page: "1" });

        await expect(page.getByTestId("room-card")).toHaveCount(2);
        await expectActivePage(page, 0);
      });
    });

    test.describe("errors", () => {
      for (const origin of ["room card", "room info dialog"]) {
        for (const action of ["add", "remove"]) {
          test.describe(`${action} favorite from ${origin}`, () => {
            const method = action === "add" ? "POST" : "DELETE";
            const label =
              action === "add"
                ? 'rooms.favorites.add_for_{"room":"Meeting One"}'
                : 'rooms.favorites.remove_for_{"room":"Meeting One"}';

            test.beforeEach(
              async ({ page, getRoomsApiMock, roomsResponse }) => {
                getRoomsApiMock.respondWithPage({
                  currentPage: 1,
                  lastPage: 3,
                });
                roomsResponse.data[0].is_favorite = action === "remove";
                roomsResponse.data[0].short_description =
                  "Room short descriptions";
                await page.goto("/rooms");
                await expect(page.getByTestId("room-card")).toHaveCount(1);

                // The button that triggers the request
                let button = page
                  .getByTestId("room-card")
                  .nth(0)
                  .getByTestId("room-favorites-button");
                if (origin === "room info dialog") {
                  await expect(
                    page.getByTestId("room-info-dialog"),
                  ).toHaveCount(0);
                  await page
                    .getByTestId("room-card")
                    .nth(0)
                    .getByTestId("room-info-button")
                    .click();
                  const dialog = page.getByTestId("room-info-dialog");
                  await expect(dialog).toBeVisible();
                  button = dialog.getByTestId("room-favorites-button");
                }
                await expect(button).toHaveAttribute("aria-label", label);
              },
            );

            test("general error", async ({ page, getRoomsApiMock }) => {
              const roomFavoriteApiMock = await mockApiRequest(
                page,
                method,
                "rooms/abc-def-123/favorites",
                {
                  status: 500,
                  json: { message: `Test ${action} favorite error` },
                },
              );

              const roomsRequest = getRoomsApiMock.waitForNextRequest();
              await (
                origin === "room card"
                  ? page
                      .getByTestId("room-card")
                      .nth(0)
                      .getByTestId("room-favorites-button")
                  : page
                      .getByTestId("room-info-dialog")
                      .getByTestId("room-favorites-button")
              ).click();
              await roomFavoriteApiMock.waitForRequest();
              await roomsRequest;

              await expectToastAndClose(page, [
                `app.flash.server_error.message_{"message":"Test ${action} favorite error"}`,
                'app.flash.server_error.error_code_{"statusCode":500}',
              ]);

              if (origin === "room card") {
                // Button stayed the same
                await expect(
                  page
                    .getByTestId("room-card")
                    .nth(0)
                    .getByTestId("room-favorites-button"),
                ).toHaveAttribute("aria-label", label);
              }
            });

            test("unauthenticated error", async ({ page, getRoomsApiMock }) => {
              const roomFavoriteApiMock = await mockApiRequest(
                page,
                method,
                "rooms/abc-def-123/favorites",
                { status: 401 },
              );

              const roomsRequest = getRoomsApiMock.waitForNextRequest();
              await (
                origin === "room card"
                  ? page
                      .getByTestId("room-card")
                      .nth(0)
                      .getByTestId("room-favorites-button")
                  : page
                      .getByTestId("room-info-dialog")
                      .getByTestId("room-favorites-button")
              ).click();
              await roomFavoriteApiMock.waitForRequest();
              await roomsRequest;

              await expectLoginRedirect(page, "/rooms");
            });

            test("room not found error", async ({ page, getRoomsApiMock }) => {
              const roomFavoriteApiMock = await mockApiRequest(
                page,
                method,
                "rooms/abc-def-123/favorites",
                modelNotFound("room", ["abc-def-123"]),
              );

              const roomsRequest = getRoomsApiMock.waitForNextRequest();
              await (
                origin === "room card"
                  ? page
                      .getByTestId("room-card")
                      .nth(0)
                      .getByTestId("room-favorites-button")
                  : page
                      .getByTestId("room-info-dialog")
                      .getByTestId("room-favorites-button")
              ).click();
              await roomFavoriteApiMock.waitForRequest();

              // Check that rooms are reloaded
              expect(getRequestQuery(await roomsRequest)).toMatchObject({
                page: "1",
              });

              await expectToastAndClose(page, [
                'app.flash.model_not_found.title_{"model":"app.model.room"}',
                'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
              ]);
            });
          });
        }
      }
    });
  });

  test.describe("error loading rooms", () => {
    test("error on initial load and reload", async ({
      page,
      getRoomsApiMock,
    }) => {
      getRoomsApiMock.respondWith({ status: 500, json: { message: "Test" } });
      await page.goto("/rooms");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("room-skeletons")).toBeVisible();
      const search = page.getByTestId("room-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("only-favorites-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");

      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });

      const reloadButton = page.getByTestId("reload-button");
      await expect(reloadButton).toContainText("app.reload");
      await reloadButton.click();

      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting One");
      await expect(page.getByTestId("reload-button")).toHaveCount(0);
    });

    test("error when changing the page and reload", async ({
      page,
      getRoomsApiMock,
    }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting One");

      getRoomsApiMock.respondWith({ status: 500, json: { message: "Test" } });
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("room-skeletons")).toBeVisible();
      const search = page.getByTestId("room-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("only-favorites-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");

      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });

      const reloadButton = page.getByTestId("reload-button");
      await expect(reloadButton).toContainText("app.reload");
      const request = getRoomsApiMock.waitForNextRequest();
      await reloadButton.click();
      expect(getRequestQuery(await request)).toMatchObject({ page: "1" });

      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting One");
      await expect(page.getByTestId("reload-button")).toHaveCount(0);
      await expectActivePage(page, 0);
    });

    test("unauthenticated error when changing the page", async ({
      page,
      getRoomsApiMock,
    }) => {
      getRoomsApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 3,
      });
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await expect(page.getByTestId("room-card")).toContainText("Meeting One");

      getRoomsApiMock.respondWith({ status: 401, json: {} });
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectLoginRedirect(page, "/rooms");
    });

    test("unauthenticated error on initial load", async ({
      page,
      getRoomsApiMock,
    }) => {
      getRoomsApiMock.respondWith({ status: 401, json: {} });
      await page.goto("/rooms");

      await expect(page).toHaveURL((url) => url.href.includes("/login"));
      await expectToastAndClose(page, "app.flash.unauthenticated");
    });
  });

  test.describe("error loading room types", () => {
    test("error loading room types", async ({ page }) => {
      const release = await holdApiRequest(page, "roomTypes*", serverError());

      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      // Check loading
      const dropdown = page.getByTestId("room-type-dropdown");
      await expect(dropdown).toBeVisible();
      await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );

      release();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that the room type select is replaced by the error message with a reload button
      const inputGroup = page.getByTestId("room-type-inputgroup");
      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
      await expect(inputGroup).toContainText("rooms.room_types.loading_error");
      await expect(inputGroup.getByRole("button")).toBeVisible();
    });

    test("reload room types", async ({ page, getRoomTypesApiMock }) => {
      getRoomTypesApiMock.status = 500;
      getRoomTypesApiMock.json = { message: "Test" };
      await page.goto("/rooms");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      const inputGroup = page.getByTestId("room-type-inputgroup");
      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
      await expect(inputGroup).toContainText("rooms.room_types.loading_error");

      const release = await holdApiRequest(page, "roomTypes*", {
        json: readFixture("roomTypes.json"),
      });

      const reloadButton = inputGroup.getByRole("button");
      await reloadButton.click();
      // Check that button is disabled after click
      await expect(reloadButton).toBeDisabled();

      // Send correct response and check that reload button does not exist after reload
      release();
      await expect(inputGroup.getByRole("button")).toHaveCount(0);

      // Check that dropdown exists and error message is not shown after correct response
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();
      await expect(inputGroup).not.toContainText(
        "rooms.room_types.loading_error",
      );
    });

    test("unauthenticated error", async ({ page, getRoomTypesApiMock }) => {
      getRoomTypesApiMock.status = 401;
      getRoomTypesApiMock.json = {};

      await page.goto("/rooms");

      await expectLoginRedirect(page, "/rooms");
    });
  });
});
