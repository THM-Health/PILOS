import { mergeTests } from "@playwright/test";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as roomMemberControllerTest } from "../support/fixtures/roomMemberController.js";
import { test as roomPersonalizedLinkControllerTest } from "../support/fixtures/roomPersonalizedLinkController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  expectActivePage,
  getRequestQuery,
  readFixture,
  serverError,
  forbidden,
  modelNotFound,
} from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  checkRoomAuthErrorsLoadingTab,
  selectFilter,
  selectSortType,
} from "../support/room.js";

const test = mergeTests(
  roomControllerTest,
  roomFileControllerTest,
  roomMemberControllerTest,
  roomPersonalizedLinkControllerTest,
  participantNameCheckTest,
);
test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

test.use({ authenticated: true });

// There are two paginator components, the first one for small devices and the second one for larger devices

test.describe("Rooms view members", () => {
  test.describe("load members", () => {
    test("shows the loading state", async ({
      page,
      roomMembersResponse,
      getRoomMembersApiMock,
    }) => {
      getRoomMembersApiMock.respondWith({
        json: roomMembersResponse,
        hold: true,
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-members").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=members/);

      await expect(page.getByTestId("overlay")).toBeVisible();

      const search = page.getByTestId("room-members-search");
      const filterLabel = page
        .getByTestId("filter-dropdown")
        .locator(".p-select-label");
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");
      const addButton = page.getByTestId("room-members-add-button");
      const reloadButton = page.getByTestId("room-members-reload-button");

      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(filterLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeDisabled();
      await expect(addButton).toBeDisabled();
      await expect(reloadButton).toBeDisabled();

      getRoomMembersApiMock.release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(addButton).toBeEnabled();
      await expect(reloadButton).toBeEnabled();
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);
    });

    test("shows Laura Rivera", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=members");

      await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      const item = page.getByTestId("room-member-item").nth(0);
      await expect(item).toContainText("LR");
      await expect(item).toContainText("Laura Rivera");
      await expect(item).toContainText("LauraWRivera@domain.tld");
      await expect(item).toContainText("rooms.roles.participant");
    });

    test("shows Juan Walter", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=members");

      await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      const item = page.getByTestId("room-member-item").nth(1);
      await expect(item).toContainText("JW");
      await expect(item).toContainText("Juan Walter");
      await expect(item).toContainText("JuanMWalter@domain.tld");
      await expect(item).toContainText("rooms.roles.moderator");
    });

    test("shows Tammy Law", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=members");

      await expect(page.getByTestId("room-member-item")).toHaveCount(3);
      // has a profile image, so no initials are shown
      const item = page.getByTestId("room-member-item").nth(2);
      await expect(item).toContainText("Tammy Law");
      await expect(item).toContainText("TammyGLaw@domain.tld");
      await expect(item).toContainText("rooms.roles.co_owner");
    });

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
      getRoomMembersApiMock,
    }) => {
      getRoomMembersApiMock.respondWith(serverError());

      await page.goto("/rooms/abc-def-123#tab=members");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );

      const search = page.getByTestId("room-members-search");
      const filterLabel = page
        .getByTestId("filter-dropdown")
        .locator(".p-select-label");
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");

      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(page.getByTestId("room-members-add-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-members-reload-button"),
      ).toBeEnabled();
    });

    test("reloads the members after a server error", async ({
      page,
      roomMembersResponse,
      getRoomMembersApiMock,
    }) => {
      roomMembersResponse.meta.per_page = 1;
      roomMembersResponse.meta.last_page = 3;
      getRoomMembersApiMock.respondWith(serverError());

      await page.goto("/rooms/abc-def-123#tab=members");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getRoomMembersApiMock.respondWithDefault();

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
      test.beforeEach(
        async ({ page, roomMembersResponse, getRoomMembersApiMock }) => {
          roomMembersResponse.meta.per_page = 1;
          roomMembersResponse.meta.last_page = 3;
          await page.goto("/rooms/abc-def-123#tab=members");
          await expect(page.getByTestId("room-member-item")).toHaveCount(1);

          getRoomMembersApiMock.respondWith(serverError());
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectToastAndClose(page, [
            'app.flash.server_error.message_{"message":"Test"}',
            'app.flash.server_error.error_code_{"statusCode":500}',
          ]);
        },
      );

      test("shows the overlay and the error on a server error", async ({
        page,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );

        const search = page.getByTestId("room-members-search");
        const filterLabel = page
          .getByTestId("filter-dropdown")
          .locator(".p-select-label");
        const sortGroup = page.getByTestId("sorting-type-inputgroup");
        const sortLabel = sortGroup
          .getByTestId("sorting-type-dropdown")
          .locator(".p-select-label");

        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();
        await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
        await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
        await expect(sortGroup.locator("button")).toBeEnabled();
        await expect(page.getByTestId("room-members-add-button")).toBeEnabled();
        await expect(
          page.getByTestId("room-members-reload-button"),
        ).toBeEnabled();
      });

      test("reloads the first page", async ({
        page,
        getRoomMembersApiMock,
      }) => {
        getRoomMembersApiMock.respondWithDefault();

        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );
        await expect(page.getByTestId("overlay")).toBeVisible();
        await page.getByTestId("loading-retry-button").click();

        expect(getRequestQuery(await membersRequest)).toMatchObject({
          page: "1",
        });

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
      test.beforeEach(
        async ({ page, roomMembersResponse, getRoomMembersApiMock }) => {
          roomMembersResponse.meta.per_page = 1;
          roomMembersResponse.meta.last_page = 3;
          await page.goto("/rooms/abc-def-123#tab=members");
          await expect(page.getByTestId("room-member-item")).toHaveCount(1);

          getRoomMembersApiMock.respondWith({ status: 401, json: {} });
        },
      );

      test("asks for the guest name if the room has no access code", async ({
        page,
        roomResponse,
        postParticipantNameCheckApiMock,
      }) => {
        roomResponse.data.current_user = null;

        const roomRequest = page.waitForRequest(
          /\/api\/v1\/rooms\/abc-def-123(\?.*)?$/,
        );
        await page.getByTestId("paginator-next-button").nth(1).click();
        await roomRequest;

        // Enter guest name
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await page.locator("#participant-name").fill("Max Doe");

        const postParticipantNameCheckRequestsAfterChange =
          postParticipantNameCheckApiMock.respondWith({ status: 204 });
        await page.getByTestId("room-login-button").click();
        await postParticipantNameCheckRequestsAfterChange.waitForRequest();

        await expect(page.getByTestId("room-access-overlay")).toBeHidden();

        // Check that the files tab is shown
        await expect(page).not.toHaveURL(/#tab=members/);

        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("shows the access code overlay if the room has an access code", async ({
        page,
        roomResponse,
      }) => {
        roomResponse.data.current_user = null;
        roomResponse.data.authenticated = false;

        const roomRequest = page.waitForRequest(
          /\/api\/v1\/rooms\/abc-def-123(\?.*)?$/,
        );
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

        const roomRequest = page.waitForRequest(
          /\/api\/v1\/rooms\/abc-def-123(\?.*)?$/,
        );
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
      roomResponse,
      roomMembersResponse,
      getRoomMembersApiMock,
    }) => {
      roomMembersResponse.meta.per_page = 1;
      roomMembersResponse.meta.last_page = 3;
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(1);

      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      getRoomMembersApiMock.respondWith(
        forbidden("This action is unauthorized."),
      );

      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectToastAndClose(page, "app.flash.unauthorized");
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=files/);
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
      getRoomMembersApiMock,
    }) => {
      await interceptRoomIndexRequests(page);
      getRoomMembersApiMock.respondWith(modelNotFound("room", ["abc-def-123"]));

      await page.goto("/rooms/abc-def-123#tab=members");

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
    roomMembersResponse,
  }) => {
    roomMembersResponse.data[0].role = 3;
    roomMembersResponse.meta.per_page = 1;
    roomMembersResponse.meta.last_page = 2;
    roomMembersResponse.meta.total = 2;
    roomMembersResponse.meta.total_no_filter = 2;

    await page.goto("/rooms/abc-def-123#tab=members");
    await expect(page.getByTestId("room-member-item")).toHaveCount(1);

    // The second page is empty, the following request (first page) returns the members
    const requests = [];
    await page.route("**/api/v1/rooms/abc-def-123/member*", (route) => {
      requests.push(getRequestQuery(route.request()));
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
    test("loads the members without a search query", async ({ page }) => {
      const membersRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/member?*",
      );

      await page.goto("/rooms/abc-def-123#tab=members");

      const query = getRequestQuery(await membersRequest);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no members match the search query", async ({
      page,
      roomMembersResponse,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      roomMembersResponse.data = [];
      roomMembersResponse.meta.total = 0;
      const membersRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/member?*",
      );

      await page
        .getByTestId("room-members-search")
        .locator("input")
        .fill("Test");
      await page.getByTestId("room-members-search").locator("button").click();

      expect(getRequestQuery(await membersRequest)).toMatchObject({
        query: "Test",
        page: "1",
      });

      await expect(page.getByText("app.filter_no_results")).toBeVisible();
      await expect(page.getByTestId("room-member-item")).toHaveCount(0);
    });

    test("shows a message if there are no members in the room", async ({
      page,
      roomMembersResponse,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=members");
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      roomMembersResponse.data = [];
      roomMembersResponse.meta.total = 0;
      roomMembersResponse.meta.total_no_filter = 0;
      const membersRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/member?*",
      );

      await page
        .getByTestId("room-members-search")
        .locator("input")
        .fill("Test2");
      await page
        .getByTestId("room-members-search")
        .locator("input")
        .press("Enter");

      expect(getRequestQuery(await membersRequest)).toMatchObject({
        query: "Test2",
        page: "1",
      });

      await expect(page.getByText("rooms.members.nodata")).toBeVisible();
      await expect(page.getByTestId("room-member-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page, roomMembersResponse }) => {
        await page.goto("/rooms/abc-def-123#tab=members");
        await expect(page.getByTestId("room-member-item")).toHaveCount(3);

        roomMembersResponse.data = [
          roomMembersResponse.data[0],
          {
            id: 10,
            firstname: "Laura",
            lastname: "Walter",
            email: "LauraMWalter@domain.tld",
            role: 1,
            image: null,
          },
        ];
        roomMembersResponse.meta.per_page = 1;
        roomMembersResponse.meta.last_page = 2;
        roomMembersResponse.meta.total = 2;
        roomMembersResponse.meta.total_no_filter = 2;
        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );

        await page
          .getByTestId("room-members-search")
          .locator("input")
          .fill("Laura");
        await page.getByTestId("room-members-search").locator("button").click();

        expect(getRequestQuery(await membersRequest)).toMatchObject({
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
        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(getRequestQuery(await membersRequest)).toMatchObject({
          query: "Laura",
          page: "2",
        });

        await expect(
          page.getByTestId("room-members-search").locator("input"),
        ).toHaveValue("Laura");
        await expectActivePage(page, 1);
        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Walter");
      });

      test("resets the page when changing the search query", async ({
        page,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-member-item").first(),
        ).toContainText("Laura Walter");

        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );

        await page
          .getByTestId("room-members-search")
          .locator("input")
          .fill("Laur");
        await page.getByTestId("room-members-search").locator("button").click();

        expect(getRequestQuery(await membersRequest)).toMatchObject({
          query: "Laur",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter", () => {
    test("loads the members without a filter", async ({ page }) => {
      const membersRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/member?*",
      );

      await page.goto("/rooms/abc-def-123#tab=members");

      const query = getRequestQuery(await membersRequest);
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
        roomMembersResponse,
      }) => {
        roomMembersResponse.data = [];
        roomMembersResponse.meta.total = 0;
        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );

        await selectFilter(page, 1);

        expect(getRequestQuery(await membersRequest)).toMatchObject({
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
        roomMembersResponse,
      }) => {
        roomMembersResponse.data = [];
        roomMembersResponse.meta.total = 0;
        roomMembersResponse.meta.total_no_filter = 0;
        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );

        await selectFilter(page, 2);

        expect(getRequestQuery(await membersRequest)).toMatchObject({
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
        test.beforeEach(async ({ page, roomMembersResponse }) => {
          roomMembersResponse.data = [
            { ...roomMembersResponse.data[0], role: 3 },
            {
              id: 10,
              firstname: "Laura",
              lastname: "Walter",
              email: "LauraMWalter@domain.tld",
              role: 3,
              image: null,
            },
          ];
          roomMembersResponse.meta.per_page = 1;
          roomMembersResponse.meta.last_page = 2;
          roomMembersResponse.meta.total = 2;
          roomMembersResponse.meta.total_no_filter = 2;
          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await selectFilter(page, 3);

          expect(getRequestQuery(await membersRequest)).toMatchObject({
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
          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(getRequestQuery(await membersRequest)).toMatchObject({
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
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-member-item").first(),
          ).toContainText("Laura Walter");

          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await selectFilter(page, 0);

          const query = getRequestQuery(await membersRequest);
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
      const membersRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/member?*",
      );

      await page.goto("/rooms/abc-def-123#tab=members");

      expect(getRequestQuery(await membersRequest)).toMatchObject({
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

      test("changes the sorting type", async ({
        page,
        roomMembersResponse,
      }) => {
        roomMembersResponse.meta.per_page = 1;
        roomMembersResponse.meta.last_page = 3;
        const membersRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/member?*",
        );

        await selectSortType(page, 0);

        expect(getRequestQuery(await membersRequest)).toMatchObject({
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
        test.beforeEach(async ({ page, roomMembersResponse }) => {
          roomMembersResponse.meta.per_page = 1;
          roomMembersResponse.meta.last_page = 3;
          await selectSortType(page, 0);
          await expect(page.getByTestId("sorting-type-dropdown")).toHaveText(
            "app.firstname",
          );
          await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        });

        test("keeps the sorting when changing the page", async ({ page }) => {
          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(getRequestQuery(await membersRequest)).toMatchObject({
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
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();

          expect(getRequestQuery(await membersRequest)).toMatchObject({
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
          await expectActivePage(page, 0);

          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(getRequestQuery(await membersRequest)).toMatchObject({
            sort_by: "firstname",
            sort_direction: "desc",
            page: "2",
          });

          await expectActivePage(page, 1);
        });

        test("resets the page when changing the sorting type", async ({
          page,
        }) => {
          await page
            .getByTestId("sorting-type-inputgroup")
            .locator("button")
            .click();

          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);

          const membersRequest = page.waitForRequest(
            "**/api/v1/rooms/abc-def-123/member?*",
          );

          await selectSortType(page, 1);

          expect(getRequestQuery(await membersRequest)).toMatchObject({
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
      test.beforeEach(async ({ page, roomResponse, roomMembersResponse }) => {
        roomResponse.data.owner = { id: 2, name: "Max Doe" };
        roomResponse.data.is_member = true;
        roomResponse.data.is_co_owner = true;
        roomMembersResponse.data.unshift({
          id: 1,
          firstname: "John",
          lastname: "Doe",
          email: "JohnDoe@domain.tld",
          role: 3,
          image: null,
        });
        roomMembersResponse.meta.per_page = 4;
        roomMembersResponse.meta.total = 4;
        roomMembersResponse.meta.total_no_filter = 4;

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
        await expect(item.getByTestId("room-members-edit-button")).toHaveCount(
          0,
        );
        await expect(
          item.getByTestId("room-members-delete-button"),
        ).toHaveCount(0);

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
          await expect(
            item.getByTestId("room-members-edit-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-members-delete-button"),
          ).toBeVisible();
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
        roomMembersResponse,
      }) => {
        roomMembersResponse.data = [roomMembersResponse.data[0]];
        roomMembersResponse.meta.total = 1;
        roomMembersResponse.meta.total_no_filter = 1;

        await page.getByTestId("room-members-reload-button").click();

        await expect(page.getByTestId("room-member-item")).toHaveCount(1);
        await expect(
          page.getByTestId("room-members-select-all-checkbox"),
        ).toHaveCount(0);
      });
    });

    test.describe("with rooms.viewAll permission", () => {
      test.beforeEach(async ({ page, currentUserResponse, roomResponse }) => {
        currentUserResponse.data.permissions = ["rooms.viewAll"];
        roomResponse.data.owner = { id: 2, name: "Max Doe" };
        roomResponse.data.current_user.permissions = ["rooms.viewAll"];

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
          await expect(
            item.getByTestId("room-members-edit-button"),
          ).toHaveCount(0);
          await expect(
            item.getByTestId("room-members-delete-button"),
          ).toHaveCount(0);
        });
      }
    });

    test.describe("with rooms.manage permission", () => {
      test.beforeEach(async ({ page, currentUserResponse, roomResponse }) => {
        const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
        currentUserResponse.data.permissions = permissions;
        roomResponse.data.owner = { id: 2, name: "Max Doe" };
        roomResponse.data.current_user.permissions = permissions;

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
          await expect(
            item.getByTestId("room-members-edit-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("room-members-delete-button"),
          ).toBeVisible();
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
