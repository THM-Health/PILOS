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
const MEMBERS_URL = "**/api/v1/rooms/abc-def-123/member*";

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

const MEMBERS = [
  {
    name: "Laura Rivera",
    initials: "LR",
    email: "LauraWRivera@domain.tld",
    role: "rooms.roles.participant",
  },
  {
    name: "Juan Walter",
    initials: "JW",
    email: "JuanMWalter@domain.tld",
    role: "rooms.roles.moderator",
  },
  {
    name: "Tammy Law",
    // has a profile image, so no initials are shown
    email: "TammyGLaw@domain.tld",
    role: "rooms.roles.co_owner",
  },
];

const CURRENT_USER_MEMBER = {
  id: 1,
  firstname: "John",
  lastname: "Doe",
  email: "JohnDoe@domain.tld",
  role: 3,
  image: null,
};

function isRoomRequest(request) {
  const url = request.url();
  return (
    request.method() === "GET" &&
    url.includes("/api/v1/rooms/abc-def-123") &&
    !url.includes("/member") &&
    !url.includes("/auth")
  );
}

function isMembersRequest(request) {
  return request.method() === "GET" && request.url().includes("/member");
}

function onePerPage({ lastPage = 3, total, currentPage = 1, role } = {}) {
  return (members) => {
    members.data = members.data.slice(currentPage - 1, currentPage);
    if (role !== undefined) {
      members.data[0].role = role;
    }
    members.meta.current_page = currentPage;
    members.meta.last_page = lastPage;
    members.meta.per_page = 1;
    members.meta.from = currentPage;
    members.meta.to = currentPage;
    members.meta.total = total ?? lastPage;
    members.meta.total_no_filter = total ?? lastPage;
  };
}

function secondPageLauraWalter(role = 1) {
  return (members) => {
    members.data = [
      {
        id: 10,
        firstname: "Laura",
        lastname: "Walter",
        email: "LauraMWalter@domain.tld",
        role,
        image: null,
      },
    ];
    members.meta.current_page = 2;
    members.meta.last_page = 2;
    members.meta.per_page = 1;
    members.meta.from = 2;
    members.meta.to = 2;
    members.meta.total = 2;
    members.meta.total_no_filter = 2;
  };
}

function noMembers(filtered) {
  return (members) => {
    members.data = [];
    members.meta.from = null;
    members.meta.to = null;
    members.meta.total = 0;
    if (!filtered) {
      members.meta.total_no_filter = 0;
    }
  };
}

async function mockRoom(page, changes = {}) {
  // Match the room path only (not /member, /auth, …); query params are allowed
  await page.route(
    (url) => url.pathname === ROOM_PATH,
    async (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      const room = readFixture("room.json");
      if (typeof changes === "function") {
        changes(room);
      } else {
        Object.assign(room.data, changes);
      }
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

async function mockMembers(page, changes = () => {}) {
  const members = readFixture("roomMembers.json");
  changes(members);
  return mockMethod(page, "GET", MEMBERS_URL, { status: 200, json: members });
}

async function mockMembersError(page, status, json = {}) {
  return mockMethod(page, "GET", MEMBERS_URL, { status, json });
}

async function expectControls(page, enabled) {
  const search = page.getByTestId("room-members-search");
  const filterLabel = page
    .getByTestId("filter-dropdown")
    .locator(".p-select-label");
  const sortGroup = page.getByTestId("sorting-type-inputgroup");
  const sortLabel = sortGroup
    .getByTestId("sorting-type-dropdown")
    .locator(".p-select-label");
  const add = page.getByTestId("room-members-add-button");
  const reload = page.getByTestId("room-members-reload-button");

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

// There are two paginator components, the first one for small devices and the second one for larger devices

async function expectMemberButtons(item, visible) {
  const edit = item.getByTestId("room-members-edit-button");
  const remove = item.getByTestId("room-members-delete-button");
  if (visible) {
    await expect(edit).toBeVisible();
    await expect(remove).toBeVisible();
  } else {
    await expect(edit).toHaveCount(0);
    await expect(remove).toHaveCount(0);
  }
}

test.describe("Rooms view members", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await mockRoom(page);
    await interceptRoomFilesRequest(page);
    await mockMembers(page);
  });

  test.describe("load members", () => {
    test("shows the loading state", async ({ page }) => {
      const release = await holdRequest(page, MEMBERS_URL, {
        json: readFixture("roomMembers.json"),
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-members").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=members/);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectControls(page, false);

      release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectControls(page, true);
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);
    });

    for (const [index, member] of MEMBERS.entries()) {
      test(`shows ${member.name}`, async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=members");

        await expect(page.getByTestId("room-member-item")).toHaveCount(3);
        const item = page.getByTestId("room-member-item").nth(index);
        await expect(item).toContainText(member.initials ?? "");
        await expect(item).toContainText(member.name);
        await expect(item).toContainText(member.email);
        await expect(item).toContainText(member.role);
      });
    }

    test("shows the profile image of a member", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=members");

      await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      await expect(
        page.getByTestId("room-member-item").nth(2).locator("img"),
      ).toHaveAttribute("src", "test.jpg");
    });
  });

  test.describe("load errors", () => {
    test("shows the overlay and the error on a server error", async ({
      page,
    }) => {
      await mockMembersError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=members");

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
      await expectControls(page, true);
    });

    test("reloads the members after a server error", async ({ page }) => {
      await mockMembersError(page, 500, { message: "Test" });

      await page.goto("/rooms/abc-def-123#tab=members");
      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      await mockMembers(page, onePerPage({ lastPage: 3 }));

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      await expect(page.getByTestId("room-member-item")).toHaveCount(1);
      await expect(page.getByTestId("room-member-item").first()).toContainText(
        "Laura Rivera",
      );
    });

    test.describe("on changing the page", () => {
      test.beforeEach(async ({ page }) => {
        await mockMembers(page, onePerPage({ lastPage: 3 }));
        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(1);

        await mockMembersError(page, 500, { message: "Test" });
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
        await mockMembers(page, onePerPage({ lastPage: 3 }));

        const membersRequest = page.waitForRequest(isMembersRequest);
        await expect(page.getByTestId("overlay")).toBeVisible();
        await page.getByTestId("loading-retry-button").click();

        expect(queryOf(await membersRequest)).toMatchObject({ page: "1" });

        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Rivera");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectActivePage(page, 0);
      });
    });

    test.describe("on changing the page with an unauthenticated error", () => {
      test.beforeEach(async ({ page }) => {
        await mockMembers(page, onePerPage({ lastPage: 3 }));
        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(1);

        await mockMembersError(page, 401);
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
        await expect(page).toHaveURL(
          (url) => !url.href.includes("#tab=members"),
        );

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
      await mockMembers(page, onePerPage({ lastPage: 3 }));
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(1);

      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
      });
      await mockMembersError(page, 403, {
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
        "api/v1/rooms/abc-def-123/member*",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMembersError(page, 404, {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      });

      await page.goto("/rooms/abc-def-123#tab=members");

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
  }) => {
    await mockMembers(page, (members) => {
      onePerPage({ lastPage: 2, total: 2, role: 3 })(members);
    });

    await page.goto("/rooms/abc-def-123#tab=members");
    await expect(page.getByTestId("room-member-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the members
    const requests = [];
    await page.route(MEMBERS_URL, (route) => {
      requests.push(queryOf(route.request()));
      const members = readFixture("roomMembers.json");
      if (requests.length === 1) {
        members.data = [];
        members.meta.current_page = 2;
        members.meta.from = null;
        members.meta.per_page = 2;
        members.meta.to = null;
        members.meta.total = 2;
        members.meta.total_no_filter = 2;
      } else {
        members.data = members.data.slice(0, 2);
        members.meta.per_page = 2;
        members.meta.to = 2;
        members.meta.total = 2;
        members.meta.total_no_filter = 2;
      }
      return route.fulfill({ json: members });
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for the second page, then the page is reset
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[0]).toMatchObject({ page: "2" });
    expect(requests[1]).toMatchObject({ page: "1" });

    await expect(page.getByTestId("room-member-item")).toHaveCount(2);
  });

  test.describe("search", () => {
    const searchInput = (page) =>
      page.getByTestId("room-members-search").locator("input");
    const searchButton = (page) =>
      page.getByTestId("room-members-search").locator("button");

    test("loads the members without a search query", async ({ page }) => {
      const membersRequest = page.waitForRequest(isMembersRequest);

      await page.goto("/rooms/abc-def-123#tab=members");

      const query = queryOf(await membersRequest);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no members match the search query", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      await mockMembers(page, noMembers(true));
      const membersRequest = page.waitForRequest(isMembersRequest);

      await searchInput(page).fill("Test");
      await searchButton(page).click();

      expect(queryOf(await membersRequest)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("app.filter_no_results")).toBeVisible();
      await expect(page.getByTestId("room-member-item")).toHaveCount(0);
    });

    test("shows a message if there are no members in the room", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      await mockMembers(page, noMembers(false));
      const membersRequest = page.waitForRequest(isMembersRequest);

      await searchInput(page).fill("Test2");
      await searchInput(page).press("Enter");

      expect(queryOf(await membersRequest)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(page.getByText("rooms.members.nodata")).toBeVisible();
      await expect(page.getByTestId("room-member-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(3);

        await mockMembers(page, onePerPage({ lastPage: 2, total: 2 }));
        const membersRequest = page.waitForRequest(isMembersRequest);

        await searchInput(page).fill("Laura");
        await searchButton(page).click();

        expect(queryOf(await membersRequest)).toMatchObject({
          query: "Laura",
          page: "1",
        });

        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
      });

      test("shows the members of the search", async ({ page }) => {
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Rivera");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keeps the search query when changing the page", async ({
        page,
      }) => {
        await mockMembers(page, secondPageLauraWalter(1));
        const membersRequest = page.waitForRequest(isMembersRequest);

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await membersRequest)).toMatchObject({
          query: "Laura",
          page: "2",
        });

        await expect(searchInput(page)).toHaveValue("Laura");
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Walter");
      });

      test("resets the page when changing the search query", async ({
        page,
      }) => {
        await mockMembers(page, secondPageLauraWalter(1));
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Walter");

        await mockMembers(page, onePerPage({ lastPage: 2, total: 2 }));
        const membersRequest = page.waitForRequest(isMembersRequest);

        await searchInput(page).fill("Laur");
        await searchButton(page).click();

        expect(queryOf(await membersRequest)).toMatchObject({
          query: "Laur",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter", () => {
    test("loads the members without a filter", async ({ page }) => {
      const membersRequest = page.waitForRequest(isMembersRequest);

      await page.goto("/rooms/abc-def-123#tab=members");

      const query = queryOf(await membersRequest);
      expect(query.filter).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows the filter options", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);

      const dropdown = page.getByTestId("filter-dropdown");
      await expect(dropdown).toHaveText("rooms.members.filter.all");
      await dropdown.click();

      await expect(page.getByTestId("filter-dropdown-items")).toBeVisible();

      const options = page.getByTestId("filter-dropdown-option");
      await expect(options).toHaveText([
        "rooms.members.filter.all",
        "rooms.members.filter.participant_role",
        "rooms.members.filter.moderator_role",
        "rooms.members.filter.co_owner_role",
      ]);
      await expect(options.first()).toHaveAttribute("aria-selected", "true");
    });

    test.describe("after loading", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      });

      test("shows a message if no members match the filter", async ({
        page,
      }) => {
        await mockMembers(page, noMembers(true));
        const membersRequest = page.waitForRequest(isMembersRequest);

        await selectFilter(page, 1);

        expect(queryOf(await membersRequest)).toMatchObject({
          filter: "participant_role",
          page: "1",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.members.filter.participant_role",
        );
        await expect(page.getByText("app.filter_no_results")).toBeVisible();
        await expect(page.getByTestId("room-member-item")).toHaveCount(0);
        await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);
      });

      test("shows a message if there are no members in the room", async ({
        page,
      }) => {
        await mockMembers(page, noMembers(false));
        const membersRequest = page.waitForRequest(isMembersRequest);

        await selectFilter(page, 2);

        expect(queryOf(await membersRequest)).toMatchObject({
          filter: "moderator_role",
          page: "1",
        });

        await expect(page.getByTestId("filter-dropdown")).toHaveText(
          "rooms.members.filter.moderator_role",
        );
        await expect(page.getByText("rooms.members.nodata")).toBeVisible();
        await expect(page.getByTestId("room-member-item")).toHaveCount(0);
        await expect(page.getByTestId("filter-dropdown-items")).toHaveCount(0);
      });

      test.describe("with multiple pages", () => {
        test.beforeEach(async ({ page }) => {
          await mockMembers(
            page,
            onePerPage({ lastPage: 2, total: 2, role: 3 }),
          );
          const membersRequest = page.waitForRequest(isMembersRequest);

          await selectFilter(page, 3);

          expect(queryOf(await membersRequest)).toMatchObject({
            filter: "co_owner_role",
            page: "1",
          });

          await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        });

        test("shows the filtered members", async ({ page }) => {
          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.members.filter.co_owner_role",
          );
          await expect(
            page.getByTestId("room-member-item").first(),
          ).toContainText("Laura Rivera");
          await expect(page.getByTestId("paginator-page")).toHaveCount(2);
          await expectActivePage(page, 0);
        });

        test("keeps the filter when changing the page", async ({ page }) => {
          await mockMembers(page, secondPageLauraWalter(3));
          const membersRequest = page.waitForRequest(isMembersRequest);

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(queryOf(await membersRequest)).toMatchObject({
            filter: "co_owner_role",
            page: "2",
          });

          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.members.filter.co_owner_role",
          );
          await expectActivePage(page, 1);
          await expect(page.getByTestId("room-member-item")).toHaveCount(1);
          await expect(
            page.getByTestId("room-member-item").first(),
          ).toContainText("Laura Walter");
        });

        test("resets the filter and the page", async ({ page }) => {
          await mockMembers(page, secondPageLauraWalter(3));
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-member-item").first(),
          ).toContainText("Laura Walter");

          await mockMembers(page, onePerPage({ lastPage: 2, total: 2 }));
          const membersRequest = page.waitForRequest(isMembersRequest);

          await selectFilter(page, 0);

          const query = queryOf(await membersRequest);
          expect(query.filter).toBeUndefined();
          expect(query).toMatchObject({ page: "1" });

          await expectActivePage(page, 0);
          await expect(page.getByTestId("filter-dropdown")).toHaveText(
            "rooms.members.filter.all",
          );
        });
      });
    });
  });

  test.describe("sort", () => {
    test("loads the members sorted by lastname", async ({ page }) => {
      const membersRequest = page.waitForRequest(isMembersRequest);

      await page.goto("/rooms/abc-def-123#tab=members");

      expect(queryOf(await membersRequest)).toMatchObject({
        sort_by: "lastname",
        sort_direction: "asc",
        page: "1",
      });
    });

    test("shows the sorting options", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

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
      await expect(options).toHaveText(["app.firstname", "app.lastname"]);
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    });

    test.describe("after loading", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      });

      test("changes the sorting type", async ({ page }) => {
        await mockMembers(page, onePerPage({ lastPage: 3 }));
        const membersRequest = page.waitForRequest(isMembersRequest);

        await selectSortType(page, 0);

        expect(queryOf(await membersRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "asc",
          page: "1",
        });

        await expect(
          page.getByTestId("sorting-type-dropdown-items"),
        ).toHaveCount(0);
        await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
          "app.firstname",
        );
        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Rivera");
        await expect(page.getByTestId("paginator-page")).toHaveCount(3);
        await expectActivePage(page, 0);
      });

      test.describe("sorted by firstname", () => {
        test.beforeEach(async ({ page }) => {
          await mockMembers(page, onePerPage({ lastPage: 3 }));
          await selectSortType(page, 0);
          await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
            "app.firstname",
          );
          await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        });

        test("keeps the sorting when changing the page", async ({ page }) => {
          await mockMembers(page, onePerPage({ currentPage: 2, lastPage: 3 }));
          const membersRequest = page.waitForRequest(isMembersRequest);

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(queryOf(await membersRequest)).toMatchObject({
            sort_by: "firstname",
            sort_direction: "asc",
            page: "2",
          });

          await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
            "app.firstname",
          );
          await expectActivePage(page, 1);
          await expect(page.getByTestId("room-member-item")).toHaveCount(1);
          await expect(
            page.getByTestId("room-member-item").first(),
          ).toContainText("Juan Walter");
        });

        test("resets the page when changing the sorting direction", async ({
          page,
        }) => {
          await mockMembers(page, onePerPage({ currentPage: 2, lastPage: 3 }));
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          await mockMembers(page, onePerPage({ lastPage: 3 }));
          const membersRequest = page.waitForRequest(isMembersRequest);

          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();

          expect(queryOf(await membersRequest)).toMatchObject({
            sort_by: "firstname",
            sort_direction: "desc",
            page: "1",
          });

          await expectActivePage(page, 0);
        });

        test("keeps the sorting direction when changing the page", async ({
          page,
        }) => {
          await mockMembers(page, onePerPage({ lastPage: 3 }));
          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();
          await expectActivePage(page, 0);

          await mockMembers(page, onePerPage({ currentPage: 2, lastPage: 3 }));
          const membersRequest = page.waitForRequest(isMembersRequest);

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(queryOf(await membersRequest)).toMatchObject({
            sort_by: "firstname",
            sort_direction: "desc",
            page: "2",
          });

          await expectActivePage(page, 1);
        });

        test("resets the page when changing the sorting type", async ({
          page,
        }) => {
          await mockMembers(page, onePerPage({ lastPage: 3 }));
          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();

          await mockMembers(page, onePerPage({ currentPage: 2, lastPage: 3 }));
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          await mockMembers(page, onePerPage({ lastPage: 3 }));
          const membersRequest = page.waitForRequest(isMembersRequest);

          await selectSortType(page, 1);

          expect(queryOf(await membersRequest)).toMatchObject({
            sort_by: "lastname",
            sort_direction: "desc",
            page: "1",
          });

          await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
            "app.lastname",
          );
          await expectActivePage(page, 0);
        });
      });
    });
  });

  test.describe("permissions", () => {
    test.describe("as co-owner", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.is_member = true;
          room.data.is_co_owner = true;
        });
        await mockMembers(page, (members) => {
          members.data.unshift(CURRENT_USER_MEMBER);
          members.meta.per_page = 4;
          members.meta.to = 4;
          members.meta.total = 4;
          members.meta.total_no_filter = 4;
        });

        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(4);
      });

      test("shows the add menu and the select all checkbox", async ({
        page,
      }) => {
        await expect(page.getByTestId("room-members-add-button")).toBeVisible();
        await page.getByTestId("room-members-add-button").click();
        await expect(page.locator("#overlay_menu_0")).toBeVisible();
        await expect(page.locator("#overlay_menu_0")).toHaveText(
          "rooms.members.add_single_user",
        );
        await expect(page.locator("#overlay_menu_1")).toBeVisible();
        await expect(page.locator("#overlay_menu_1")).toHaveText(
          "rooms.members.bulk_import_users",
        );

        await expect(
          page.getByTestId("room-members-select-all-checkbox"),
        ).toBeVisible();
      });

      test("shows the current user without edit and delete buttons", async ({
        page,
      }) => {
        const item = page.getByTestId("room-member-item").first();

        await expect(item).toContainText("JD");
        await expect(item).toContainText("John Doe");
        await expect(item).toContainText("JohnDoe@domain.tld");
        await expect(item).toContainText("rooms.roles.co_owner");
        await expectMemberButtons(item, false);

        // Check that the checkbox of the current user (co_owner) is disabled
        await expect(item.locator("input")).toBeDisabled();
        await expect(item.locator("input")).not.toBeChecked();
      });

      for (const index of [1, 2, 3]) {
        test(`shows the checkbox and the buttons of member ${index}`, async ({
          page,
        }) => {
          const item = page.getByTestId("room-member-item").nth(index);

          await expect(item.locator("input")).toBeEnabled();
          await expectMemberButtons(item, true);
        });
      }

      test("does not select the current user when selecting all members", async ({
        page,
      }) => {
        await page.getByTestId("room-members-select-all-checkbox").click();

        const items = page.getByTestId("room-member-item");
        await expect(items.first().locator("input")).toBeDisabled();
        await expect(items.first().locator("input")).not.toBeChecked();

        for (const index of [1, 2, 3]) {
          await expect(items.nth(index).locator("input")).toBeChecked();
        }

        await expect(
          page.getByTestId("room-members-bulk-edit-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-members-bulk-delete-button"),
        ).toBeVisible();
      });

      test("opens the bulk edit dialog for the selected members", async ({
        page,
      }) => {
        await page.getByTestId("room-members-select-all-checkbox").click();
        await page.getByTestId("room-members-bulk-edit-button").click();

        const dialog = page.getByTestId("room-members-bulk-edit-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          'rooms.members.modals.edit.title_bulk_{"count":3,"n":3}',
        );
        await dialog.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toBeHidden();
      });

      test("hides the select all checkbox if only the current user is a member", async ({
        page,
      }) => {
        await mockMembers(page, (members) => {
          members.data = [CURRENT_USER_MEMBER];
          members.meta.to = 1;
          members.meta.total = 1;
          members.meta.total_no_filter = 1;
        });

        await page.getByTestId("room-members-reload-button").click();

        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-members-select-all-checkbox"),
        ).toHaveCount(0);
      });
    });

    test.describe("with rooms.viewAll permission", () => {
      test.beforeEach(async ({ page, currentUser }) => {
        currentUser.data.permissions = ["rooms.viewAll"];
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.current_user.permissions = ["rooms.viewAll"];
        });

        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      });

      test("hides the add button and the select all checkbox", async ({
        page,
      }) => {
        await expect(page.getByTestId("room-members-add-button")).toHaveCount(
          0,
        );
        await expect(
          page.getByTestId("room-members-select-all-checkbox"),
        ).toHaveCount(0);
      });

      for (const index of [0, 1, 2]) {
        test(`hides the checkbox and the buttons of member ${index}`, async ({
          page,
        }) => {
          const item = page.getByTestId("room-member-item").nth(index);

          await expect(item.locator("input")).toHaveCount(0);
          await expectMemberButtons(item, false);
        });
      }
    });

    test.describe("with rooms.manage permission", () => {
      test.beforeEach(async ({ page, currentUser }) => {
        const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
        currentUser.data.permissions = permissions;
        await mockRoom(page, (room) => {
          room.data.owner = { id: 2, name: "Max Doe" };
          room.data.current_user.permissions = permissions;
        });

        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      });

      test("shows the add menu and the select all checkbox", async ({
        page,
      }) => {
        await expect(page.getByTestId("room-members-add-button")).toBeVisible();
        await page.getByTestId("room-members-add-button").click();
        await expect(page.locator("#overlay_menu_0")).toBeVisible();
        await expect(page.locator("#overlay_menu_0")).toHaveText(
          "rooms.members.add_single_user",
        );
        await expect(page.locator("#overlay_menu_1")).toBeVisible();
        await expect(page.locator("#overlay_menu_1")).toHaveText(
          "rooms.members.bulk_import_users",
        );

        await expect(
          page.getByTestId("room-members-select-all-checkbox"),
        ).toBeVisible();
      });

      for (const index of [0, 1, 2]) {
        test(`shows the checkbox and the buttons of member ${index}`, async ({
          page,
        }) => {
          const item = page.getByTestId("room-member-item").nth(index);

          await expect(item.locator("input")).toBeEnabled();
          await expectMemberButtons(item, true);
        });
      }

      test("shows the bulk buttons after selecting all members", async ({
        page,
      }) => {
        await page.getByTestId("room-members-select-all-checkbox").click();

        for (const index of [0, 1, 2]) {
          await expect(
            page.getByTestId("room-member-item").nth(index).locator("input"),
          ).toBeChecked();
        }

        await expect(
          page.getByTestId("room-members-bulk-edit-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-members-bulk-delete-button"),
        ).toBeVisible();
      });
    });
  });
});
