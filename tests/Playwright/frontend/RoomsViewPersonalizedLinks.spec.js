import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  holdRequest,
  expectActivePage,
  queryOf,
  mockMethod,
} from "../support/utils.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import {
  checkRoomAuthErrorsLoadingTab,
  selectFilter,
  selectSortType,
} from "../support/room.js";

const ROOM_PATH = "/api/v1/rooms/abc-def-123";
const LINKS_URL = "**/api/v1/rooms/abc-def-123/personalizedLinks*";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

function isLinksRequest(request) {
  return (
    request.method() === "GET" && request.url().includes("/personalizedLinks")
  );
}

function isRoomRequest(request) {
  const url = request.url();
  return (
    request.method() === "GET" &&
    url.includes("/api/v1/rooms/abc-def-123") &&
    !url.includes("/personalizedLinks") &&
    !url.includes("/files")
  );
}

/**
 * Changes for the personalized links fixture: one link per page.
 */
function onePerPage({ lastPage = 3, total, currentPage = 1, role } = {}) {
  return (links) => {
    links.data = links.data.slice(currentPage - 1, currentPage);
    if (role !== undefined) {
      links.data[0].role = role;
    }
    links.meta.current_page = currentPage;
    links.meta.last_page = lastPage;
    links.meta.per_page = 1;
    links.meta.from = currentPage;
    links.meta.to = currentPage;
    if (total !== undefined) {
      links.meta.total = total;
    }
  };
}

function noLinks(filtered) {
  return (links) => {
    links.data = [];
    links.meta.from = null;
    links.meta.to = null;
    links.meta.total = 0;
    if (!filtered) {
      links.meta.total_no_filter = 0;
    }
  };
}

async function mockRoom(page, changes = () => {}) {
  // Match the room path only (not /personalizedLinks, /files, …); query params are allowed
  await page.route(
    (url) => url.pathname === ROOM_PATH,
    async (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      const room = readFixture("room.json");
      changes(room);
      await route.fulfill({ status: 200, json: room });
    },
  );
}

async function mockRoomError(page, status, json) {
  return mockMethod(page, "GET", (url) => url.pathname === ROOM_PATH, {
    status,
    json,
  });
}

async function mockLinks(page, changes = () => {}) {
  const links = readFixture("roomPersonalizedLinks.json");
  changes(links);
  return mockMethod(page, "GET", LINKS_URL, { status: 200, json: links });
}

async function mockLinksError(page, status, json = {}) {
  return mockMethod(page, "GET", LINKS_URL, { status, json });
}

async function expectControls(page, enabled) {
  const search = page.getByTestId("room-personalized-links-search");
  const filterLabel = page
    .getByTestId("filter-dropdown")
    .locator(".p-select-label");
  const sortGroup = page.getByTestId("sorting-type-inputgroup");
  const sortLabel = sortGroup
    .getByTestId("sorting-type-dropdown")
    .locator(".p-select-label");
  const add = page.getByTestId("room-personalized-links-add-button");
  const reload = page.getByTestId("room-personalized-links-reload-button");

  if (enabled) {
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
    await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
    await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
    await expect(sortGroup.locator("button")).toBeEnabled();
    await expect(add).toBeEnabled();
    await expect(reload).toBeEnabled();
  } else {
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
    await expect(filterLabel).toHaveAttribute("aria-disabled", "true");
    await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
    await expect(sortGroup.locator("button")).toBeDisabled();
    await expect(add).toBeDisabled();
    await expect(reload).toBeDisabled();
  }
}

async function expectLinkButtons(item, { manage }) {
  await expect(
    item.getByTestId("room-personalized-links-copy-button"),
  ).toBeVisible();
  for (const name of ["delete", "edit"]) {
    const button = item.getByTestId(`room-personalized-links-${name}-button`);
    if (manage) {
      await expect(button).toBeVisible();
    } else {
      await expect(button).toHaveCount(0);
    }
  }
}

const LINKS = [
  {
    name: "John Doe",
    role: "rooms.roles.participant",
    lastUsed:
      'rooms.personalized_links.last_used_at_{"date":"09/17/2021, 16:36"}',
    expires: 'rooms.personalized_links.expires_at_{"date":"10/17/2021, 14:21"}',
  },
  { name: "Max Doe", role: "rooms.roles.moderator" },
  {
    name: "Tammy Law",
    role: "rooms.roles.moderator",
    lastUsed:
      'rooms.personalized_links.last_used_at_{"date":"10/03/2021, 19:24"}',
    expires: 'rooms.personalized_links.expires_at_{"date":"10/20/2021, 11:17"}',
  },
];

// There are two paginator components, the first one for small devices and the second one for larger devices

test.describe("Rooms view personalized links", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await mockRoom(page);
    await interceptRoomFilesRequest(page);
    await mockLinks(page);
  });

  test.describe("load personalized links", () => {
    test("shows the loading state", async ({ page }) => {
      const release = await holdRequest(page, LINKS_URL, {
        json: readFixture("roomPersonalizedLinks.json"),
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-tokens").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=tokens/);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectControls(page, false);

      release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectControls(page, true);
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );
    });

    for (const [index, link] of LINKS.entries()) {
      test(`shows ${link.name}`, async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=tokens");

        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(3);
        const item = page.getByTestId("room-personalized-link-item").nth(index);
        await expect(item).toContainText(link.name);
        await expect(item).toContainText(link.role);
        if (link.lastUsed) {
          await expect(item).toContainText(link.lastUsed);
          await expect(item).toContainText(link.expires);
        } else {
          await expect(item).not.toContainText(
            "rooms.personalized_links.last_used_at",
          );
          await expect(item).not.toContainText(
            "rooms.personalized_links.expires_at",
          );
        }
      });
    }
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
    }) => {
      await mockLinksError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=tokens");

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
      await expectControls(page, true);
    });

    test("reloads the personalized links after a server error", async ({
      page,
    }) => {
      await mockLinksError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await mockLinks(page, onePerPage({ lastPage: 3 }));

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        1,
      );
      await expect(
        page.getByTestId("room-personalized-link-item").first(),
      ).toContainText("John Doe");
    });

    test.describe("on changing the page", () => {
      test.beforeEach(async ({ page }) => {
        await mockLinks(page, onePerPage({ lastPage: 3 }));
        await page.goto("/rooms/abc-def-123#tab=tokens");
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);

        await mockLinksError(page, 500, { message: "Test" });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, SERVER_ERROR_TOAST);
      });

      test("shows the overlay and the error on a server error", async ({
        page,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );
        await expectControls(page, true);
      });

      test("reloads the first page", async ({ page }) => {
        await mockLinks(page, onePerPage({ lastPage: 3 }));

        const linksRequest = page.waitForRequest(isLinksRequest);
        await expect(page.getByTestId("overlay")).toBeVisible();
        await page.getByTestId("loading-retry-button").click();

        expect(queryOf(await linksRequest)).toMatchObject({ page: "1" });

        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("John Doe");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectActivePage(page, 0);
      });
    });

    test.describe("on changing the page with an unauthenticated error", () => {
      test.beforeEach(async ({ page }) => {
        await mockLinks(page, onePerPage({ lastPage: 3 }));
        await page.goto("/rooms/abc-def-123#tab=tokens");
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);

        await mockLinksError(page, 401);
      });

      test("asks for the guest name if the room has no access code", async ({
        page,
      }) => {
        await mockRoom(page, (room) => {
          room.data.current_user = null;
        });

        const roomRequest = page.waitForRequest(isRoomRequest);
        await page.getByTestId("paginator-next-button").nth(1).click();
        await roomRequest;

        // Enter guest name
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await page.locator("#participant-name").fill("Max Doe");

        const checkRequest = page.waitForRequest(
          (request) =>
            request.method() === "POST" &&
            request.url().endsWith("/api/v1/participantName/check"),
        );
        await page.route("**/api/v1/participantName/check", (route) =>
          route.fulfill({ status: 204 }),
        );
        await page.getByTestId("room-login-button").click();
        await checkRequest;

        await expect(page.getByTestId("room-access-overlay")).toBeHidden();

        // Check that the files tab is shown
        await expect(page).not.toHaveURL(/#tab=tokens/);

        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("shows the access code overlay if the room has an access code", async ({
        page,
      }) => {
        await mockRoom(page, (room) => {
          room.data.current_user = null;
          room.data.authenticated = false;
        });

        const roomRequest = page.waitForRequest(isRoomRequest);
        await page.getByTestId("paginator-next-button").nth(1).click();
        await roomRequest;

        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("shows an error if guests are forbidden", async ({ page }) => {
        await mockRoomError(page, 403, { message: "guests_not_allowed" });

        const roomRequest = page.waitForRequest(isRoomRequest);
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
    }) => {
      await mockLinks(page, onePerPage({ lastPage: 3 }));
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        1,
      );

      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
      });
      await mockLinksError(page, 403, {
        message: "This action is unauthorized.",
      });

      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectToastAndClose(page, "app.flash.unauthorized");
      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123#tab=files"),
      );
    });

    test("handles auth errors when loading the tab", async ({ page }) => {
      await checkRoomAuthErrorsLoadingTab(
        page,
        "GET",
        "api/v1/rooms/abc-def-123/personalizedLinks*",
        "tokens",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockLinksError(page, 404, {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      });

      await page.goto("/rooms/abc-def-123#tab=tokens");

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
  }) => {
    await mockLinks(page, onePerPage({ lastPage: 2, total: 2, role: 3 }));

    await page.goto("/rooms/abc-def-123#tab=tokens");
    await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
      1,
    );

    // The second page is empty, the following request (first page) returns the links
    const requests = [];
    await page.route(LINKS_URL, (route) => {
      requests.push(queryOf(route.request()));
      const links = readFixture("roomPersonalizedLinks.json");
      if (requests.length === 1) {
        links.data = [];
        links.meta.current_page = 2;
        links.meta.from = null;
        links.meta.per_page = 2;
        links.meta.to = null;
        links.meta.total = 2;
        links.meta.total_no_filter = 2;
      } else {
        links.data = links.data.slice(0, 2);
        links.meta.per_page = 2;
        links.meta.to = 2;
        links.meta.total = 2;
        links.meta.total_no_filter = 2;
      }
      return route.fulfill({ json: links });
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for the second page, then the page is reset
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[0]).toMatchObject({ page: "2" });
    expect(requests[1]).toMatchObject({ page: "1" });

    await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
      2,
    );
  });

  test.describe("permissions", () => {
    test("rooms.viewAll only allows to copy the links", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll"];
      });

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(3);
      await expect(
        page.getByTestId("room-personalized-links-add-button"),
      ).toHaveCount(0);

      for (let index = 0; index < 3; index++) {
        await expectLinkButtons(items.nth(index), { manage: false });
      }
    });

    test("co-owner can add, edit and delete links", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
        room.data.is_co_owner = true;
      });

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(3);
      await expect(
        page.getByTestId("room-personalized-links-add-button"),
      ).toBeVisible();

      for (let index = 0; index < 3; index++) {
        await expectLinkButtons(items.nth(index), { manage: true });
      }
    });

    test("rooms.manage can add, edit and delete links", async ({
      page,
      currentUser,
    }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUser.data.permissions = permissions;
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = permissions;
      });

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(3);
      await expect(
        page.getByTestId("room-personalized-links-add-button"),
      ).toBeVisible();

      for (let index = 0; index < 3; index++) {
        await expectLinkButtons(items.nth(index), { manage: true });
      }
    });
  });

  test.describe("search", () => {
    const searchInput = (page) =>
      page.getByTestId("room-personalized-links-search").locator("input");
    const searchButton = (page) =>
      page.getByTestId("room-personalized-links-search").locator("button");

    test("loads the personalized links without a search query", async ({
      page,
    }) => {
      const linksRequest = page.waitForRequest(isLinksRequest);

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const query = queryOf(await linksRequest);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no links match the search query", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );

      await mockLinks(page, noLinks(true));
      const linksRequest = page.waitForRequest(isLinksRequest);

      await searchInput(page).fill("Test");
      await searchButton(page).click();

      expect(queryOf(await linksRequest)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("app.filter_no_results")).toBeVisible();
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        0,
      );
    });

    test("shows a message if there are no links in the room", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );

      await mockLinks(page, noLinks(false));
      const linksRequest = page.waitForRequest(isLinksRequest);

      await searchInput(page).fill("Test2");
      await searchInput(page).press("Enter");

      expect(queryOf(await linksRequest)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(
        page.getByText("rooms.personalized_links.nodata"),
      ).toBeVisible();
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        0,
      );
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=tokens");
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(3);

        await mockLinks(page, onePerPage({ lastPage: 2, total: 2 }));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await searchInput(page).fill("Doe");
        await searchButton(page).click();

        expect(queryOf(await linksRequest)).toMatchObject({
          query: "Doe",
          page: "1",
        });

        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
      });

      test("shows the links of the search", async ({ page }) => {
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("John Doe");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keeps the search query when changing the page", async ({
        page,
      }) => {
        await mockLinks(
          page,
          onePerPage({ lastPage: 2, total: 2, currentPage: 2 }),
        );
        const linksRequest = page.waitForRequest(isLinksRequest);

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await linksRequest)).toMatchObject({
          query: "Doe",
          page: "2",
        });

        await expect(searchInput(page)).toHaveValue("Doe");
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("Max Doe");
      });

      test("resets the page when changing the search query", async ({
        page,
      }) => {
        await mockLinks(
          page,
          onePerPage({ lastPage: 2, total: 2, currentPage: 2 }),
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("Max Doe");

        await mockLinks(page, onePerPage({ lastPage: 2, total: 2 }));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await searchInput(page).fill("Do");
        await searchButton(page).click();

        expect(queryOf(await linksRequest)).toMatchObject({
          query: "Do",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter", () => {
    test("loads the personalized links without a filter", async ({ page }) => {
      const linksRequest = page.waitForRequest(isLinksRequest);

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const query = queryOf(await linksRequest);
      expect(query.filter).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows the filter options", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );

      await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);

      const dropdown = page.getByTestId("filter-dropdown");
      await expect(dropdown).toHaveText("rooms.personalized_links.filter.all");
      await dropdown.click();

      await expect(page.getByTestId("filter-dropdown-items")).toBeVisible();

      const options = page.getByTestId("filter-dropdown-option");
      await expect(options).toHaveText([
        "rooms.personalized_links.filter.all",
        "rooms.personalized_links.filter.participant_role",
        "rooms.personalized_links.filter.moderator_role",
      ]);
      await expect(options.first()).toHaveAttribute("aria-selected", "true");
    });

    test.describe("after loading", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=tokens");
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(3);
      });

      test("shows a message if no links match the filter", async ({ page }) => {
        await mockLinks(page, noLinks(true));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await selectFilter(page, 1);

        expect(queryOf(await linksRequest)).toMatchObject({
          filter: "participant_role",
          page: "1",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.personalized_links.filter.participant_role",
        );
        await expect(page.getByText("app.filter_no_results")).toBeVisible();
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(0);
        await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);
      });

      test("shows a message if there are no links in the room", async ({
        page,
      }) => {
        await mockLinks(page, noLinks(false));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await selectFilter(page, 2);

        expect(queryOf(await linksRequest)).toMatchObject({
          filter: "moderator_role",
          page: "1",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.personalized_links.filter.moderator_role",
        );
        await expect(
          page.getByText("rooms.personalized_links.nodata"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(0);
        await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);
      });

      test.describe("with multiple pages", () => {
        test.beforeEach(async ({ page }) => {
          await mockLinks(page, onePerPage({ lastPage: 2, total: 2 }));
          const linksRequest = page.waitForRequest(isLinksRequest);

          await selectFilter(page, 1);

          expect(queryOf(await linksRequest)).toMatchObject({
            filter: "participant_role",
            page: "1",
          });

          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(1);
        });

        test("shows the filtered links", async ({ page }) => {
          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.personalized_links.filter.participant_role",
          );
          await expect(
            page.getByTestId("room-personalized-link-item").first(),
          ).toContainText("John Doe");
          await expect(page.getByTestId("paginator-page")).toHaveCount(2);
          await expectActivePage(page, 0);
        });

        test("keeps the filter when changing the page", async ({ page }) => {
          await mockLinks(
            page,
            onePerPage({ lastPage: 2, total: 2, currentPage: 2, role: 1 }),
          );
          const linksRequest = page.waitForRequest(isLinksRequest);

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(queryOf(await linksRequest)).toMatchObject({
            filter: "participant_role",
            page: "2",
          });

          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.personalized_links.filter.participant_role",
          );
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(1);
          await expect(
            page.getByTestId("room-personalized-link-item").first(),
          ).toContainText("Max Doe");
        });

        test("resets the filter and the page when selecting all", async ({
          page,
        }) => {
          await mockLinks(
            page,
            onePerPage({ lastPage: 2, total: 2, currentPage: 2, role: 1 }),
          );
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-personalized-link-item").first(),
          ).toContainText("Max Doe");

          await mockLinks(page, onePerPage({ lastPage: 2, total: 2 }));
          const linksRequest = page.waitForRequest(isLinksRequest);

          await selectFilter(page, 0);

          const query = queryOf(await linksRequest);
          expect(query.filter).toBeUndefined();
          expect(query).toMatchObject({ page: "1" });

          await expectActivePage(page, 0);
          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.personalized_links.filter.all",
          );
        });
      });
    });
  });

  test.describe("sort", () => {
    test("loads the personalized links sorted by lastname", async ({
      page,
    }) => {
      const linksRequest = page.waitForRequest(isLinksRequest);

      await page.goto("/rooms/abc-def-123#tab=tokens");

      expect(queryOf(await linksRequest)).toMatchObject({
        sort_by: "lastname",
        sort_direction: "asc",
        page: "1",
      });
    });

    test("shows the sorting options", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );

      await expect(page.getByTestId("sorting-type-dropdown-items")).toHaveCount(
        0,
      );

      const dropdown = page.getByTestId("sorting-type-dropdown");
      await expect(dropdown).toHaveText("app.lastname");
      await dropdown.click();

      await expect(
        page.getByTestId("sorting-type-dropdown-items"),
      ).toBeVisible();

      const options = page.getByTestId("sorting-type-dropdown-option");
      await expect(options).toHaveText([
        "app.firstname",
        "app.lastname",
        "rooms.personalized_links.last_usage",
      ]);
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    });

    test.describe("after loading", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=tokens");
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(3);

        await mockLinks(page, onePerPage({ lastPage: 3 }));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await selectSortType(page, 0);

        expect(queryOf(await linksRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "asc",
          page: "1",
        });

        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
      });

      test("shows the links of the selected sorting type", async ({ page }) => {
        await expect(
          page.getByTestId("sorting-type-dropdown-items"),
        ).toHaveCount(0);
        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "app.firstname",
        );
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("John Doe");
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test("keeps the sorting when changing the page", async ({ page }) => {
        await mockLinks(page, onePerPage({ lastPage: 3, currentPage: 2 }));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await linksRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "asc",
          page: "2",
        });

        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "app.firstname",
        );
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("Max Doe");
      });

      test("resets the page when changing the sorting direction", async ({
        page,
      }) => {
        await mockLinks(page, onePerPage({ lastPage: 3, currentPage: 2 }));
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        await mockLinks(page, onePerPage({ lastPage: 3 }));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();

        expect(queryOf(await linksRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "desc",
          page: "1",
        });

        await expectActivePage(page, 0);
      });

      test("keeps the sorting direction when changing the page", async ({
        page,
      }) => {
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);

        await mockLinks(page, onePerPage({ lastPage: 3, currentPage: 2 }));
        const linksRequest = page.waitForRequest(
          (request) => isLinksRequest(request) && queryOf(request).page === "2",
        );

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await linksRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "desc",
          page: "2",
        });

        await expectActivePage(page, 1);
      });

      test("resets the page when changing the sorting type", async ({
        page,
      }) => {
        // The direction was changed before, the sorting type is then sorted descending
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);

        await mockLinks(page, onePerPage({ lastPage: 3, currentPage: 2 }));
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        await mockLinks(page, onePerPage({ lastPage: 3 }));
        const linksRequest = page.waitForRequest(isLinksRequest);

        await selectSortType(page, 2);

        expect(queryOf(await linksRequest)).toMatchObject({
          sort_by: "last_usage",
          sort_direction: "desc",
          page: "1",
        });

        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "rooms.personalized_links.last_usage",
        );
        await expectActivePage(page, 0);
      });
    });
  });
});
