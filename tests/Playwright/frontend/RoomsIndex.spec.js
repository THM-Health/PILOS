import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { holdRequest, expectActivePage, queryOf } from "../support/utils.js";

const ROOMS_PATH = "/api/v1/rooms";
const ROOM_TYPES_PATH = "/api/v1/roomTypes";
const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const readRooms = () =>
  JSON.parse(readFileSync("tests/Playwright/fixtures/rooms.json", "utf8"));

const isRoomsRequest = (request) =>
  request.method() === "GET" && new URL(request.url()).pathname === ROOMS_PATH;

function onePage(rooms, pageNumber, lastPage) {
  const index = pageNumber - 1;
  rooms.data = rooms.data.slice(index, index + 1);
  rooms.meta.current_page = pageNumber;
  rooms.meta.from = pageNumber;
  rooms.meta.last_page = lastPage;
  rooms.meta.per_page = 1;
  rooms.meta.to = pageNumber;
}

function noRoomsFound(rooms) {
  rooms.data = [];
  rooms.meta.from = null;
  rooms.meta.per_page = 1;
  rooms.meta.to = null;
  rooms.meta.total = 0;
}

function noRoomsAvailable(rooms) {
  noRoomsFound(rooms);
  rooms.meta.total_no_filter = 0;
}

async function mockRooms(page, mutate = () => {}) {
  const rooms = readRooms();
  mutate(rooms);
  await page.route(
    (url) => url.pathname === ROOMS_PATH,
    (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      return route.fulfill({ json: rooms });
    },
  );
}

function mockRoomsError(page, status, body) {
  return page.route(
    (url) => url.pathname === ROOMS_PATH,
    (route) => route.fulfill({ status, json: body }),
  );
}

function mockFavorite(page, method, roomId, response) {
  return page.route(`**/api/v1/rooms/${roomId}/favorites`, (route) => {
    if (route.request().method() !== method) {
      return route.fallback();
    }
    return route.fulfill(response);
  });
}

async function requestRoomsAfter(page, action) {
  const request = page.waitForRequest(isRoomsRequest);
  await action();
  return queryOf(await request);
}

async function expectSingleRoom(page, name) {
  await expect(page.getByTestId("room-card")).toHaveCount(1);
  await expect(page.getByTestId("room-card")).toContainText(name);
}

async function expectControlsDisabled(page, disabled) {
  const search = page.getByTestId("room-search");
  const labels = [
    page.getByTestId("room-type-dropdown").locator(".p-select-label"),
    page.getByTestId("sorting-type-dropdown").locator(".p-select-label"),
  ];

  if (disabled) {
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
    await expect(page.getByTestId("only-favorites-button")).toBeDisabled();
    for (const label of labels) {
      await expect(label).toHaveAttribute("aria-disabled", "true");
    }
  } else {
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
    await expect(page.getByTestId("only-favorites-button")).toBeEnabled();
    for (const label of labels) {
      await expect(label).not.toHaveAttribute("aria-disabled", "true");
    }
  }
}

async function expectFilterButtons(page, pressed) {
  const buttons = page.getByTestId("rooms-filter-button");
  await expect(buttons).toHaveCount(3);
  const texts = [
    "rooms.index.show_own",
    "rooms.index.show_shared",
    "rooms.index.show_public",
  ];
  for (let i = 0; i < 3; i++) {
    await expect(buttons.nth(i)).toHaveText(texts[i]);
    await expect(buttons.nth(i)).toHaveAttribute(
      "aria-pressed",
      String(pressed[i]),
    );
  }
}

async function selectDropdownOption(page, dropdown, index) {
  await page.getByTestId(`${dropdown}-dropdown`).click();
  await page.getByTestId(`${dropdown}-dropdown-option`).nth(index).click();
}

async function openRoomInfoDialog(page) {
  await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
  await page
    .getByTestId("room-card")
    .nth(0)
    .getByTestId("room-info-button")
    .click();
  const dialog = page.getByTestId("room-info-dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Rooms index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomIndexRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/rooms");
  });

  test.describe("list of rooms", () => {
    test("loading state", async ({ page }) => {
      const release = await holdRequest(
        page,
        (url) => url.pathname === ROOMS_PATH,
        { path: "tests/Playwright/fixtures/rooms.json" },
      );

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

      release();

      await expect(page.getByTestId("room-card")).toHaveCount(3);
    });

    test("components are enabled after loading", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      await expectControlsDisabled(page, false);
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
      currentUser,
    }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      const release = await holdRequest(
        page,
        (url) => url.pathname === ROOMS_PATH,
        { path: "tests/Playwright/fixtures/rooms.json" },
      );

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

      release();

      await expect(page.getByTestId("room-card")).toHaveCount(3);
    });

    test("components are enabled after loading with rooms.viewAll permission", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toHaveCount(0);

      await expectControlsDisabled(page, false);
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
    }) => {
      await page.route("**/api/v1/rooms/abc-def-123", (route) =>
        route.fulfill({ path: "tests/Playwright/fixtures/room.json" }),
      );
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      const dialog = await openRoomInfoDialog(page);
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

    test("click on room card to open room view", async ({ page }) => {
      const release = await holdRequest(page, "**/api/v1/rooms/abc-def-123", {
        path: "tests/Playwright/fixtures/room.json",
      });
      await page.goto("/rooms");

      // Click on room card to open room view
      await page.getByTestId("room-card").nth(0).click();

      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123"),
      );

      await expect(page.getByTestId("no-room-overlay")).toBeVisible();
      release();
      await expect(page.getByTestId("no-room-overlay")).toBeHidden();
    });
  });

  test.describe("sorting", () => {
    test.beforeEach(async ({ page }) => {
      await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
    });

    test("initial request and sorting options", async ({ page }) => {
      const request = page.waitForRequest(isRoomsRequest);
      await page.goto("/rooms");
      expect(queryOf(await request)).toMatchObject({
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

    test("change sorting", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);

      const query = await requestRoomsAfter(page, () =>
        selectDropdownOption(page, "sorting-type", 1),
      );
      expect(query).toMatchObject({ sort_by: "alpha", page: "1" });

      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "rooms.index.sorting.alpha",
      );

      await expectSingleRoom(page, "Meeting One");
      await expect(page.getByTestId("paginator-page")).toHaveCount(3);
      await expectActivePage(page, 0);
    });

    test("keep sorting when changing the page", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);
      await requestRoomsAfter(page, () =>
        selectDropdownOption(page, "sorting-type", 1),
      );

      await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
      const query = await requestRoomsAfter(page, () =>
        page.getByTestId("paginator-next-button").nth(1).click(),
      );
      expect(query).toMatchObject({ sort_by: "alpha", page: "2" });

      await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
        "rooms.index.sorting.alpha",
      );
      await expectActivePage(page, 1);
      await expectSingleRoom(page, "Meeting Two");
    });

    test("reset page when changing sorting", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);

      await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
      await requestRoomsAfter(page, () =>
        page.getByTestId("paginator-next-button").nth(1).click(),
      );
      await expectActivePage(page, 1);

      await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
      const query = await requestRoomsAfter(page, () =>
        selectDropdownOption(page, "sorting-type", 2),
      );
      expect(query).toMatchObject({ sort_by: "room_type", page: "1" });

      await expectActivePage(page, 0);
    });
  });

  test.describe("search", () => {
    const searchInput = (page) =>
      page.getByTestId("room-search").locator("input");
    const searchButton = (page) =>
      page.getByTestId("room-search").locator("button");

    test("initial request has no search query", async ({ page }) => {
      const request = page.waitForRequest(isRoomsRequest);
      await page.goto("/rooms");
      const query = queryOf(await request);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("no rooms found for the search query", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await mockRooms(page, noRoomsFound);
      await searchInput(page).fill("Test");
      const query = await requestRoomsAfter(page, () =>
        searchButton(page).click(),
      );
      expect(query).toMatchObject({ query: "Test", page: "1" });

      await expect(page.getByText("rooms.no_rooms_found")).toBeVisible();
      await expect(page.getByTestId("room-card")).toHaveCount(0);
    });

    test("no rooms available, search with enter", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await mockRooms(page, noRoomsAvailable);
      await searchInput(page).fill("Test2");
      const query = await requestRoomsAfter(page, () =>
        searchInput(page).press("Enter"),
      );
      expect(query).toMatchObject({ query: "Test2", page: "1" });

      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(page.getByTestId("room-card")).toHaveCount(0);
    });

    test.describe("with 2 rooms on 2 pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms");
        await expect(page.getByTestId("room-card")).toHaveCount(3);

        await mockRooms(page, (rooms) => {
          onePage(rooms, 1, 2);
          rooms.meta.total = 2;
        });
        await searchInput(page).fill("Meeting");
        const query = await requestRoomsAfter(page, () =>
          searchButton(page).click(),
        );
        expect(query).toMatchObject({ query: "Meeting", page: "1" });
      });

      test("show first page", async ({ page }) => {
        await expectSingleRoom(page, "Meeting One");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keep search query when changing the page", async ({ page }) => {
        await mockRooms(page, (rooms) => {
          onePage(rooms, 2, 2);
          rooms.meta.total = 2;
        });
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({ query: "Meeting", page: "2" });

        await expectActivePage(page, 1);
        await expect(searchInput(page)).toHaveValue("Meeting");
        await expectSingleRoom(page, "Meeting Two");
      });

      test("reset page when changing the search query", async ({ page }) => {
        await mockRooms(page, (rooms) => {
          onePage(rooms, 2, 2);
          rooms.meta.total = 2;
        });
        await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);

        await mockRooms(page, (rooms) => {
          onePage(rooms, 1, 2);
          rooms.meta.total = 2;
        });
        await searchInput(page).clear();
        await searchInput(page).fill("Meet");
        const query = await requestRoomsAfter(page, () =>
          searchButton(page).click(),
        );
        expect(query).toMatchObject({ query: "Meet", page: "1" });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter room type", () => {
    test("initial request and room type options", async ({ page }) => {
      const request = page.waitForRequest(isRoomsRequest);
      await page.goto("/rooms");
      const query = queryOf(await request);
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

    test("no rooms found for the room type", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await mockRooms(page, noRoomsFound);
      const query = await requestRoomsAfter(page, () =>
        selectDropdownOption(page, "room-type", 2),
      );
      expect(query).toMatchObject({ room_type: "2", page: "1" });

      await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(0);
      await expect(page.getByText("rooms.no_rooms_found")).toBeVisible();
      await expect(page.getByTestId("room-type-dropdown")).toHaveText(
        "Meeting",
      );
    });

    test("no rooms available for the room type", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await mockRooms(page, noRoomsAvailable);
      const query = await requestRoomsAfter(page, () =>
        selectDropdownOption(page, "room-type", 3),
      );
      expect(query).toMatchObject({ room_type: "3", page: "1" });

      await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(0);
      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(page.getByTestId("room-type-dropdown")).toHaveText("Exam");
    });

    test.describe("with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms");
        await expect(page.getByTestId("room-card")).toHaveCount(3);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          selectDropdownOption(page, "room-type", 4),
        );
        expect(query).toMatchObject({ room_type: "4", page: "1" });
      });

      test("show first page", async ({ page }) => {
        await expect(page.getByTestId("room-type-dropdown-items")).toHaveCount(
          0,
        );
        await expect(page.getByTestId("room-type-dropdown")).toHaveText(
          "Seminar",
        );
        await expectSingleRoom(page, "Meeting One");
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep room type when changing the page", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({ room_type: "4", page: "2" });

        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-type-dropdown")).toHaveText(
          "Seminar",
        );
        await expectSingleRoom(page, "Meeting Two");
      });

      test("reset page when changing the room type", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          selectDropdownOption(page, "room-type", 1),
        );
        expect(query).toMatchObject({ room_type: "1", page: "1" });

        await expectActivePage(page, 0);
      });

      test("reset to all room types", async ({ page }) => {
        await mockRooms(page);
        const query = await requestRoomsAfter(page, () =>
          selectDropdownOption(page, "room-type", 0),
        );
        expect(query.room_type).toBeUndefined();

        await expect(page.getByTestId("room-card")).toHaveCount(3);
      });
    });
  });

  test.describe("filter without viewAll permission", () => {
    test("initial filters", async ({ page }) => {
      const request = page.waitForRequest(isRoomsRequest);
      await page.goto("/rooms");
      expect(queryOf(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      await expectFilterButtons(page, [true, true, false]);
      await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(0);
    });

    test("no rooms available for the filter combination", async ({ page }) => {
      await page.goto("/rooms");
      await expectFilterButtons(page, [true, true, false]);

      await mockRooms(page, noRoomsAvailable);
      const query = await requestRoomsAfter(page, () =>
        page.getByTestId("rooms-filter-button").nth(1).click(),
      );
      expect(query).toMatchObject({
        filter_own: "1",
        filter_shared: "0",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expectFilterButtons(page, [true, false, false]);
    });

    test.describe("with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms");
        await expectFilterButtons(page, [true, true, false]);

        await mockRooms(page);
        await requestRoomsAfter(page, () =>
          page.getByTestId("rooms-filter-button").nth(1).click(),
        );
        await expectFilterButtons(page, [true, false, false]);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("rooms-filter-button").nth(2).click(),
        );
        expect(query).toMatchObject({
          filter_own: "1",
          filter_shared: "0",
          filter_public: "1",
          filter_all: "0",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expectSingleRoom(page, "Meeting One");
        await expectFilterButtons(page, [true, false, true]);
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep filters when changing the page", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({
          filter_own: "1",
          filter_shared: "0",
          filter_public: "1",
          filter_all: "0",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expectSingleRoom(page, "Meeting Two");
        await expectFilterButtons(page, [true, false, true]);
      });

      test("reset page when changing the filters", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("rooms-filter-button").nth(0).click(),
        );
        expect(query).toMatchObject({
          filter_own: "0",
          filter_shared: "0",
          filter_public: "1",
          filter_all: "0",
          page: "1",
        });

        await expectSingleRoom(page, "Meeting One");
        await expectFilterButtons(page, [false, false, true]);
      });
    });
  });

  test.describe("filter with viewAll permission", () => {
    test.beforeEach(async ({ currentUser }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
    });

    const allButton = (page) => page.getByTestId("rooms-filter-all-button");

    test("initial filters", async ({ page }) => {
      const request = page.waitForRequest(isRoomsRequest);
      await page.goto("/rooms");
      expect(queryOf(await request)).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      await expect(allButton(page)).toHaveText("rooms.index.show_all");
      await expect(allButton(page)).toHaveAttribute("aria-pressed", "false");
      await expectFilterButtons(page, [true, true, false]);
    });

    test("filter all hides the other filter buttons", async ({ page }) => {
      await page.goto("/rooms");
      await expectFilterButtons(page, [true, true, false]);

      await mockRooms(page, noRoomsAvailable);
      const query = await requestRoomsAfter(page, () =>
        allButton(page).click(),
      );
      expect(query).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "1",
        page: "1",
      });

      await expect(page.getByText("rooms.no_rooms_available")).toBeVisible();
      await expect(allButton(page)).toHaveText("rooms.index.show_all");
      await expect(allButton(page)).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
    });

    test("trigger filter all again restores the other filter buttons", async ({
      page,
    }) => {
      await page.goto("/rooms");
      await expectFilterButtons(page, [true, true, false]);

      await mockRooms(page, noRoomsAvailable);
      await requestRoomsAfter(page, () => allButton(page).click());
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);

      await mockRooms(page);
      const query = await requestRoomsAfter(page, () =>
        allButton(page).click(),
      );
      expect(query).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });

      await expect(allButton(page)).toHaveText("rooms.index.show_all");
      await expect(allButton(page)).toHaveAttribute("aria-pressed", "false");
      await expectFilterButtons(page, [true, true, false]);
    });

    test("trigger filter button", async ({ page }) => {
      await page.goto("/rooms");
      await expectFilterButtons(page, [true, true, false]);

      const query = await requestRoomsAfter(page, () =>
        page.getByTestId("rooms-filter-button").nth(2).click(),
      );
      expect(query).toMatchObject({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "1",
        filter_all: "0",
        page: "1",
      });
    });

    test.describe("filter all with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms");
        await expectFilterButtons(page, [true, true, false]);

        await requestRoomsAfter(page, () =>
          page.getByTestId("rooms-filter-button").nth(2).click(),
        );

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          allButton(page).click(),
        );
        expect(query).toMatchObject({
          filter_own: "1",
          filter_shared: "1",
          filter_public: "1",
          filter_all: "1",
          page: "1",
        });
      });

      test("show first page", async ({ page }) => {
        await expectSingleRoom(page, "Meeting One");
        await expect(allButton(page)).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep filter all when changing the page", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({
          filter_own: "1",
          filter_shared: "1",
          filter_public: "1",
          filter_all: "1",
          page: "2",
        });

        await expectActivePage(page, 1);
        await expectSingleRoom(page, "Meeting Two");
        await expect(allButton(page)).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
      });

      test("reset page and restore filter buttons when disabling filter all", async ({
        page,
      }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          allButton(page).click(),
        );
        expect(query).toMatchObject({
          filter_own: "1",
          filter_shared: "1",
          filter_public: "1",
          filter_all: "0",
          page: "1",
        });

        await expectActivePage(page, 0);
        await expectSingleRoom(page, "Meeting One");
        await expect(allButton(page)).toHaveAttribute("aria-pressed", "false");

        // The other filter buttons are shown again and still have the same state
        await expectFilterButtons(page, [true, true, true]);
      });
    });
  });

  test.describe("show favorites", () => {
    test.beforeEach(async ({ currentUser }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
    });

    const favoritesButton = (page) => page.getByTestId("only-favorites-button");

    async function expectFilterOptionsVisible(page) {
      await expect(page.getByTestId("rooms-filter-all-button")).toBeVisible();
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(3);
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();
    }

    async function expectFilterOptionsHidden(page) {
      await expect(page.getByTestId("rooms-filter-all-button")).toHaveCount(0);
      await expect(page.getByTestId("rooms-filter-button")).toHaveCount(0);
      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
    }

    test("initial request and filter options", async ({ page }) => {
      const request = page.waitForRequest(isRoomsRequest);
      await page.goto("/rooms");
      expect(queryOf(await request)).toMatchObject({
        only_favorites: "0",
        page: "1",
      });

      await expectFilterOptionsVisible(page);
    });

    test("no favorites", async ({ page }) => {
      await page.goto("/rooms");
      await expectFilterOptionsVisible(page);

      await mockRooms(page, noRoomsAvailable);
      await expect(favoritesButton(page)).toHaveText(
        "rooms.index.only_favorites",
      );
      const query = await requestRoomsAfter(page, () =>
        favoritesButton(page).click(),
      );
      expect(query).toMatchObject({ only_favorites: "1", page: "1" });

      await expect(page.getByText("rooms.index.no_favorites")).toBeVisible();
      await expect(page.getByTestId("room-card")).toHaveCount(0);
      await expectFilterOptionsHidden(page);
    });

    test("disable only favorites shows the filter options again", async ({
      page,
    }) => {
      await page.goto("/rooms");
      await expectFilterOptionsVisible(page);

      await mockRooms(page, noRoomsAvailable);
      await requestRoomsAfter(page, () => favoritesButton(page).click());
      await expectFilterOptionsHidden(page);

      await mockRooms(page);
      const query = await requestRoomsAfter(page, () =>
        favoritesButton(page).click(),
      );
      expect(query).toMatchObject({ only_favorites: "0", page: "1" });

      await expectFilterOptionsVisible(page);
    });

    test.describe("with 3 rooms on 3 pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms");
        await expectFilterOptionsVisible(page);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          favoritesButton(page).click(),
        );
        expect(query).toMatchObject({ only_favorites: "1", page: "1" });
      });

      test("show first page", async ({ page }) => {
        await expectFilterOptionsHidden(page);
        await expectSingleRoom(page, "Meeting One");
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keep only favorites when changing the page", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({ only_favorites: "1", page: "2" });

        await expectActivePage(page, 1);
        await expectFilterOptionsHidden(page);
        await expectSingleRoom(page, "Meeting Two");
      });

      test("reset page when disabling only favorites", async ({ page }) => {
        await mockRooms(page, (rooms) => onePage(rooms, 2, 3));
        await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);

        await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
        const query = await requestRoomsAfter(page, () =>
          favoritesButton(page).click(),
        );
        expect(query).toMatchObject({ only_favorites: "0", page: "1" });

        await expectActivePage(page, 0);
        await expectFilterOptionsVisible(page);
        await expectSingleRoom(page, "Meeting One");
      });
    });
  });

  test.describe("trigger favorites button", () => {
    const favoritesButtonOfCard = (page) =>
      page.getByTestId("room-card").nth(0).getByTestId("room-favorites-button");

    const addLabel = (name) => `rooms.favorites.add_for_{"room":"${name}"}`;
    const removeLabel = (name) =>
      `rooms.favorites.remove_for_{"room":"${name}"}`;

    /**
     * Visit the rooms, 3 rooms on 3 pages. Optionally continue to the second page
     */
    async function visitRooms(page, { secondPage = false, mutate } = {}) {
      await mockRooms(page, (rooms) => {
        onePage(rooms, 1, 3);
        mutate?.(rooms, 1);
      });
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(1);

      if (secondPage) {
        await mockRooms(page, (rooms) => {
          onePage(rooms, 2, 3);
          mutate?.(rooms, 2);
        });
        await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectSingleRoom(page, "Meeting Two");
      }
    }

    test("add room to favorites from the room card", async ({ page }) => {
      await visitRooms(page);
      await expect(favoritesButtonOfCard(page)).toHaveAttribute(
        "aria-label",
        addLabel("Meeting One"),
      );

      const release = await holdRequest(
        page,
        "**/api/v1/rooms/abc-def-123/favorites",
        { status: 204 },
      );
      await mockRooms(page, (rooms) => {
        onePage(rooms, 1, 3);
        rooms.data[0].is_favorite = true;
      });

      const favoriteRequest = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          request.url().endsWith("/rooms/abc-def-123/favorites"),
      );
      await favoritesButtonOfCard(page).click();
      await expect(favoritesButtonOfCard(page)).toBeDisabled();

      const roomsRequest = page.waitForRequest(isRoomsRequest);
      release();
      await favoriteRequest;
      expect(queryOf(await roomsRequest)).toMatchObject({ page: "1" });

      await expect(favoritesButtonOfCard(page)).toHaveAttribute(
        "aria-label",
        removeLabel("Meeting One"),
      );
    });

    test("remove room from favorites from the room card", async ({ page }) => {
      await visitRooms(page, { secondPage: true });
      await expect(favoritesButtonOfCard(page)).toHaveAttribute(
        "aria-label",
        removeLabel("Meeting Two"),
      );

      const release = await holdRequest(
        page,
        "**/api/v1/rooms/def-abc-123/favorites",
        { status: 204 },
      );
      await mockRooms(page, (rooms) => {
        onePage(rooms, 2, 3);
        rooms.data[0].is_favorite = false;
        rooms.data[0].short_description = "Room short descriptions";
      });

      const favoriteRequest = page.waitForRequest(
        (request) =>
          request.method() === "DELETE" &&
          request.url().endsWith("/rooms/def-abc-123/favorites"),
      );
      await favoritesButtonOfCard(page).click();
      await expect(favoritesButtonOfCard(page)).toBeDisabled();

      const roomsRequest = page.waitForRequest(isRoomsRequest);
      release();
      await favoriteRequest;
      // Check that page stayed the same
      expect(queryOf(await roomsRequest)).toMatchObject({ page: "2" });

      await expect(favoritesButtonOfCard(page)).toHaveAttribute(
        "aria-label",
        addLabel("Meeting Two"),
      );
    });

    test("add room to favorites from the room info dialog", async ({
      page,
    }) => {
      await visitRooms(page, {
        secondPage: true,
        mutate: (rooms) => {
          rooms.data[0].is_favorite = false;
          rooms.data[0].short_description = "Room short descriptions";
        },
      });

      await mockFavorite(page, "POST", "def-abc-123", { status: 204 });
      await mockRooms(page, (rooms) => {
        onePage(rooms, 2, 3);
        rooms.data[0].short_description = "Room short descriptions";
      });

      const dialog = await openRoomInfoDialog(page);
      const favoriteRequest = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          request.url().endsWith("/rooms/def-abc-123/favorites"),
      );
      const roomsRequest = page.waitForRequest(isRoomsRequest);
      const button = dialog.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute(
        "aria-label",
        addLabel("Meeting Two"),
      );
      await button.click();

      await favoriteRequest;
      expect(queryOf(await roomsRequest)).toMatchObject({ page: "2" });

      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
    });

    test("remove room from favorites from the room info dialog", async ({
      page,
    }) => {
      await visitRooms(page, {
        secondPage: true,
        mutate: (rooms) => {
          rooms.data[0].short_description = "Room short descriptions";
        },
      });

      await mockFavorite(page, "DELETE", "def-abc-123", { status: 204 });
      await mockRooms(page, (rooms) => {
        onePage(rooms, 2, 3);
        rooms.data[0].is_favorite = false;
        rooms.data[0].short_description = "Room short descriptions";
      });

      const dialog = await openRoomInfoDialog(page);
      const favoriteRequest = page.waitForRequest(
        (request) =>
          request.method() === "DELETE" &&
          request.url().endsWith("/rooms/def-abc-123/favorites"),
      );
      const roomsRequest = page.waitForRequest(isRoomsRequest);
      const button = dialog.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute(
        "aria-label",
        removeLabel("Meeting Two"),
      );
      await button.click();

      await favoriteRequest;
      expect(queryOf(await roomsRequest)).toMatchObject({ page: "2" });
      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);

      // The reopened dialog shows the new state
      const reopenedDialog = await openRoomInfoDialog(page);
      await expect(
        reopenedDialog.getByTestId("room-favorites-button"),
      ).toHaveAttribute("aria-label", addLabel("Meeting Two"));
      await reopenedDialog.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("room-info-dialog")).toHaveCount(0);
    });

    test.describe("only favorites are shown", () => {
      /**
       * Show only favorites, 4 rooms on 2 pages with 2 rooms per page, and continue to the second page.
       * @param {import("@playwright/test").Page} page
       * @param {object[]} secondPageRooms - rooms on the second page
       */
      async function showFavoritesSecondPage(page, secondPageRooms) {
        await visitRooms(page);

        await mockRooms(page, (rooms) => {
          rooms.data = rooms.data.slice(0, 2);
          rooms.data[0].is_favorite = true;
          rooms.meta.last_page = 2;
          rooms.meta.per_page = 2;
          rooms.meta.to = 2;
          rooms.meta.total = 4;
          rooms.meta.total_no_filter = 4;
        });
        const query = await requestRoomsAfter(page, () =>
          page.getByTestId("only-favorites-button").click(),
        );
        expect(query).toMatchObject({ only_favorites: "1", page: "1" });
        await expect(page.getByTestId("room-card")).toHaveCount(2);

        await mockRooms(page, (rooms) => {
          rooms.data = secondPageRooms(rooms);
          rooms.meta.current_page = 2;
          rooms.meta.from = 3;
          rooms.meta.last_page = 2;
          rooms.meta.per_page = 2;
          rooms.meta.to = 4;
          rooms.meta.total = 4;
          rooms.meta.total_no_filter = 4;
        });
        const secondQuery = await requestRoomsAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(secondQuery).toMatchObject({ only_favorites: "1", page: "2" });
      }

      const meetingFour = {
        id: "abc-def-456",
        name: "Meeting Four",
        owner: { id: 1, name: "John Doe" },
        last_meeting: null,
        type: { id: 2, name: "Meeting", color: "#4a5c66" },
        is_favorite: true,
        short_description: null,
      };

      test("remove first room from favorites stays on the page", async ({
        page,
      }) => {
        await showFavoritesSecondPage(page, (rooms) => {
          const meetingThree = rooms.data[2];
          meetingThree.is_favorite = true;
          return [meetingThree, meetingFour];
        });
        await expect(page.getByTestId("room-card")).toHaveCount(2);

        await mockRooms(page, (rooms) => {
          rooms.data = [meetingFour];
          rooms.meta.current_page = 2;
          rooms.meta.from = 3;
          rooms.meta.last_page = 2;
          rooms.meta.per_page = 2;
        });
        await mockFavorite(page, "DELETE", "def-abc-456", { status: 204 });

        const favoriteRequest = page.waitForRequest(
          (request) =>
            request.method() === "DELETE" &&
            request.url().endsWith("/rooms/def-abc-456/favorites"),
        );
        const roomsRequest = page.waitForRequest(isRoomsRequest);
        await page
          .getByTestId("room-card")
          .nth(0)
          .getByTestId("room-favorites-button")
          .click();

        await favoriteRequest;
        expect(queryOf(await roomsRequest)).toMatchObject({ page: "2" });
        await expectSingleRoom(page, "Meeting Four");
      });

      test("reset page when the page is empty after removing a favorite", async ({
        page,
      }) => {
        await showFavoritesSecondPage(page, () => [meetingFour]);
        await expectSingleRoom(page, "Meeting Four");

        // Respond with no rooms on the second page and with 2 rooms on the first page
        await page.route(
          (url) => url.pathname === ROOMS_PATH,
          (route) => {
            const rooms = readRooms();
            const requestedPage = new URL(
              route.request().url(),
            ).searchParams.get("page");
            if (requestedPage === "2") {
              rooms.data = [];
              rooms.meta.current_page = 2;
              rooms.meta.from = null;
              rooms.meta.per_page = 2;
              rooms.meta.to = null;
              rooms.meta.total = 2;
              rooms.meta.total_no_filter = 2;
            } else {
              rooms.data = rooms.data.slice(0, 2);
              rooms.data[0].is_favorite = true;
              rooms.meta.per_page = 2;
              rooms.meta.to = 2;
              rooms.meta.total = 2;
              rooms.meta.total_no_filter = 2;
            }
            return route.fulfill({ json: rooms });
          },
        );
        await mockFavorite(page, "DELETE", "abc-def-456", { status: 204 });

        const favoriteRequest = page.waitForRequest(
          (request) =>
            request.method() === "DELETE" &&
            request.url().endsWith("/rooms/abc-def-456/favorites"),
        );
        // First room request still has the second page, second one is reset to the first page
        const secondPageRequest = page.waitForRequest(
          (request) => isRoomsRequest(request) && queryOf(request).page === "2",
        );
        const firstPageRequest = page.waitForRequest(
          (request) => isRoomsRequest(request) && queryOf(request).page === "1",
        );
        await page
          .getByTestId("room-card")
          .nth(0)
          .getByTestId("room-favorites-button")
          .click();

        await favoriteRequest;
        await secondPageRequest;
        await firstPageRequest;

        await expect(page.getByTestId("room-card")).toHaveCount(2);
        await expectActivePage(page, 0);
      });
    });

    test.describe("errors", () => {
      for (const origin of ["room card", "room info dialog"]) {
        for (const action of ["add", "remove"]) {
          test.describe(`${action} favorite from ${origin}`, () => {
            const method = action === "add" ? "POST" : "DELETE";
            const label = () =>
              action === "add"
                ? addLabel("Meeting One")
                : removeLabel("Meeting One");

            test.beforeEach(async ({ page }) => {
              await mockRooms(page, (rooms) => {
                onePage(rooms, 1, 3);
                rooms.data[0].is_favorite = action === "remove";
                rooms.data[0].short_description = "Room short descriptions";
              });
              await page.goto("/rooms");
              await expect(page.getByTestId("room-card")).toHaveCount(1);
            });

            /**
             * Click the favorite button and wait for the favorite request and the reload of the rooms
             */
            async function triggerFavorite(page) {
              let button = favoritesButtonOfCard(page);
              if (origin === "room info dialog") {
                button = (await openRoomInfoDialog(page)).getByTestId(
                  "room-favorites-button",
                );
              }
              await expect(button).toHaveAttribute("aria-label", label());

              const favoriteRequest = page.waitForRequest(
                (request) =>
                  request.method() === method &&
                  request.url().endsWith("/rooms/abc-def-123/favorites"),
              );
              const roomsRequest = page.waitForRequest(isRoomsRequest);
              await button.click();
              await favoriteRequest;
              return queryOf(await roomsRequest);
            }

            test("general error", async ({ page }) => {
              await mockFavorite(page, method, "abc-def-123", {
                status: 500,
                json: { message: `Test ${action} favorite error` },
              });

              await triggerFavorite(page);

              await expectToastAndClose(page, [
                `app.flash.server_error.message_{"message":"${`Test ${action} favorite error`}"}`,
                `app.flash.server_error.error_code_{"statusCode":${500}}`,
              ]);

              if (origin === "room card") {
                // Button stayed the same
                await expect(favoritesButtonOfCard(page)).toHaveAttribute(
                  "aria-label",
                  label(),
                );
              }
            });

            test("unauthenticated error", async ({ page }) => {
              await mockFavorite(page, method, "abc-def-123", { status: 401 });

              await triggerFavorite(page);

              await expectLoginRedirect(page, "/rooms");
            });

            test("room not found error", async ({ page }) => {
              await mockFavorite(page, method, "abc-def-123", {
                status: 404,
                json: {
                  message: "model_not_found",
                  model: "room",
                  ids: ["abc-def-123"],
                },
              });

              // Check that rooms are reloaded
              expect(await triggerFavorite(page)).toMatchObject({ page: "1" });

              await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
            });
          });
        }
      }
    });
  });

  test.describe("error loading rooms", () => {
    const expectErrorState = async (page) => {
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("room-skeletons")).toBeVisible();
      await expectControlsDisabled(page, false);
    };

    test("error on initial load and reload", async ({ page }) => {
      await mockRoomsError(page, 500, { message: "Test" });
      await page.goto("/rooms");

      await expectToastAndClose(page, [
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);
      await expectErrorState(page);

      await mockRooms(page, (rooms) => onePage(rooms, 1, 3));

      const reloadButton = page.getByTestId("reload-button");
      await expect(reloadButton).toContainText("app.reload");
      await reloadButton.click();

      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expectSingleRoom(page, "Meeting One");
      await expect(page.getByTestId("reload-button")).toHaveCount(0);
    });

    test("error when changing the page and reload", async ({ page }) => {
      await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
      await page.goto("/rooms");
      await expectSingleRoom(page, "Meeting One");

      await mockRoomsError(page, 500, { message: "Test" });
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectToastAndClose(page, [
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);
      await expectErrorState(page);

      await mockRooms(page, (rooms) => onePage(rooms, 1, 3));

      const reloadButton = page.getByTestId("reload-button");
      await expect(reloadButton).toContainText("app.reload");
      const query = await requestRoomsAfter(page, () => reloadButton.click());
      expect(query).toMatchObject({ page: "1" });

      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("room-skeletons")).toHaveCount(0);
      await expectSingleRoom(page, "Meeting One");
      await expect(page.getByTestId("reload-button")).toHaveCount(0);
      await expectActivePage(page, 0);
    });

    test("unauthenticated error when changing the page", async ({ page }) => {
      await mockRooms(page, (rooms) => onePage(rooms, 1, 3));
      await page.goto("/rooms");
      await expectSingleRoom(page, "Meeting One");

      await mockRoomsError(page, 401, {});
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectLoginRedirect(page, "/rooms");
    });

    test("unauthenticated error on initial load", async ({ page }) => {
      await mockRoomsError(page, 401, {});
      await page.goto("/rooms");

      await expect(page).toHaveURL((url) => url.href.includes("/login"));
      await expectToastAndClose(page, "app.flash.unauthenticated");
    });
  });

  test.describe("error loading room types", () => {
    const roomTypesRequest = (url) => url.pathname === ROOM_TYPES_PATH;
    const inputGroup = (page) => page.getByTestId("room-type-inputgroup");

    test("error loading room types", async ({ page }) => {
      const release = await holdRequest(page, roomTypesRequest, {
        status: 500,
        json: { message: "Test" },
      });

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
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);

      // Check that the room type select is replaced by the error message with a reload button
      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
      await expect(inputGroup(page)).toContainText(
        "rooms.room_types.loading_error",
      );
      await expect(inputGroup(page).getByRole("button")).toBeVisible();
    });

    test("reload room types", async ({ page }) => {
      await page.route(roomTypesRequest, (route) =>
        route.fulfill({ status: 500, json: { message: "Test" } }),
      );
      await page.goto("/rooms");
      await expectToastAndClose(page, [
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);

      await expect(page.getByTestId("room-type-dropdown")).toHaveCount(0);
      await expect(inputGroup(page)).toContainText(
        "rooms.room_types.loading_error",
      );

      const release = await holdRequest(page, roomTypesRequest, {
        path: "tests/Playwright/fixtures/roomTypes.json",
      });

      const reloadButton = inputGroup(page).getByRole("button");
      await reloadButton.click();
      // Check that button is disabled after click
      await expect(reloadButton).toBeDisabled();

      // Send correct response and check that reload button does not exist after reload
      release();
      await expect(inputGroup(page).getByRole("button")).toHaveCount(0);

      // Check that dropdown exists and error message is not shown after correct response
      await expect(page.getByTestId("room-type-dropdown")).toBeVisible();
      await expect(inputGroup(page)).not.toContainText(
        "rooms.room_types.loading_error",
      );
    });

    test("unauthenticated error", async ({ page }) => {
      await page.route(roomTypesRequest, (route) =>
        route.fulfill({ status: 401 }),
      );

      await page.goto("/rooms");

      await expectLoginRedirect(page, "/rooms");
    });
  });
});
