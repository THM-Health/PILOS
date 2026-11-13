import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
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
  roomTypeControllerTest,
);
test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

test.use({ authenticated: true });

// There are two paginator components, the first one for small devices and the second one for larger devices

test.describe("Rooms view personalized links", () => {
  test.describe("load personalized links", () => {
    test("shows the loading state", async ({
      page,
      personalizedLinksResponse,
      getRoomPersonalizedLinksApiMock,
    }) => {
      getRoomPersonalizedLinksApiMock.respondWith({
        json: personalizedLinksResponse,
        hold: true,
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-tokens").click();
      await expect(page).toHaveURL(/\/rooms\/abc-def-123#tab=tokens/);

      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("room-personalized-links-search");
      const filterLabel = page
        .getByTestId("filter-dropdown")
        .locator(".p-select-label");
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");
      const addButton = page.getByTestId("room-personalized-links-add-button");
      const reloadButton = page.getByTestId(
        "room-personalized-links-reload-button",
      );
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(filterLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeDisabled();
      await expect(addButton).toBeDisabled();
      await expect(reloadButton).toBeDisabled();

      getRoomPersonalizedLinksApiMock.release();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(addButton).toBeEnabled();
      await expect(reloadButton).toBeEnabled();
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );
    });

    for (const [index, link] of [
      {
        name: "John Doe",
        role: "rooms.roles.participant",
        lastUsed:
          'rooms.personalized_links.last_used_at_{"date":"09/17/2021, 16:36"}',
        expires:
          'rooms.personalized_links.expires_at_{"date":"10/17/2021, 14:21"}',
      },
      { name: "Max Doe", role: "rooms.roles.moderator" },
      {
        name: "Tammy Law",
        role: "rooms.roles.moderator",
        lastUsed:
          'rooms.personalized_links.last_used_at_{"date":"10/03/2021, 19:24"}',
        expires:
          'rooms.personalized_links.expires_at_{"date":"10/20/2021, 11:17"}',
      },
    ].entries()) {
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
      getRoomPersonalizedLinksApiMock,
    }) => {
      getRoomPersonalizedLinksApiMock.respondWith(serverError());

      await page.goto("/rooms/abc-def-123#tab=tokens");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
      const search = page.getByTestId("room-personalized-links-search");
      const filterLabel = page
        .getByTestId("filter-dropdown")
        .locator(".p-select-label");
      const sortGroup = page.getByTestId("sorting-type-inputgroup");
      const sortLabel = sortGroup
        .getByTestId("sorting-type-dropdown")
        .locator(".p-select-label");
      const addButton = page.getByTestId("room-personalized-links-add-button");
      const reloadButton = page.getByTestId(
        "room-personalized-links-reload-button",
      );
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(sortGroup.locator("button")).toBeEnabled();
      await expect(addButton).toBeEnabled();
      await expect(reloadButton).toBeEnabled();
    });

    test("reloads the personalized links after a server error", async ({
      page,
      personalizedLinksResponse,
      getRoomPersonalizedLinksApiMock,
    }) => {
      getRoomPersonalizedLinksApiMock.respondWith(serverError());

      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      personalizedLinksResponse.meta.per_page = 1;
      personalizedLinksResponse.meta.last_page = 3;
      getRoomPersonalizedLinksApiMock.respondWithDefault();

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
      test.beforeEach(
        async ({
          page,
          personalizedLinksResponse,
          getRoomPersonalizedLinksApiMock,
        }) => {
          personalizedLinksResponse.meta.per_page = 1;
          personalizedLinksResponse.meta.last_page = 3;
          await page.goto("/rooms/abc-def-123#tab=tokens");
          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(1);

          getRoomPersonalizedLinksApiMock.respondWith(serverError());
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
        const search = page.getByTestId("room-personalized-links-search");
        const filterLabel = page
          .getByTestId("filter-dropdown")
          .locator(".p-select-label");
        const sortGroup = page.getByTestId("sorting-type-inputgroup");
        const sortLabel = sortGroup
          .getByTestId("sorting-type-dropdown")
          .locator(".p-select-label");
        const addButton = page.getByTestId(
          "room-personalized-links-add-button",
        );
        const reloadButton = page.getByTestId(
          "room-personalized-links-reload-button",
        );
        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();
        await expect(filterLabel).not.toHaveAttribute("aria-disabled", "true");
        await expect(sortLabel).not.toHaveAttribute("aria-disabled", "true");
        await expect(sortGroup.locator("button")).toBeEnabled();
        await expect(addButton).toBeEnabled();
        await expect(reloadButton).toBeEnabled();
      });

      test("reloads the first page", async ({
        page,
        getRoomPersonalizedLinksApiMock,
      }) => {
        getRoomPersonalizedLinksApiMock.respondWithDefault();

        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();
        await expect(page.getByTestId("overlay")).toBeVisible();
        await page.getByTestId("loading-retry-button").click();

        expect(getRequestQuery(await linksRequest)).toMatchObject({
          page: "1",
        });

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
      test.beforeEach(
        async ({
          page,
          personalizedLinksResponse,
          getRoomPersonalizedLinksApiMock,
        }) => {
          personalizedLinksResponse.meta.per_page = 1;
          personalizedLinksResponse.meta.last_page = 3;
          await page.goto("/rooms/abc-def-123#tab=tokens");
          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(1);

          getRoomPersonalizedLinksApiMock.respondWith({
            status: 401,
            json: {},
          });
        },
      );

      test("asks for the guest name if the room has no access code", async ({
        page,
        roomResponse,
        postParticipantNameCheckApiMock,
        getRoomApiMock,
      }) => {
        roomResponse.data.current_user = null;

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
        await expect(page).not.toHaveURL(/#tab=tokens/);

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
      roomResponse,
      personalizedLinksResponse,
      getRoomPersonalizedLinksApiMock,
    }) => {
      personalizedLinksResponse.meta.per_page = 1;
      personalizedLinksResponse.meta.last_page = 3;
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        1,
      );

      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      getRoomPersonalizedLinksApiMock.respondWith(
        forbidden("This action is unauthorized."),
      );

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
      getRoomPersonalizedLinksApiMock,
    }) => {
      getRoomPersonalizedLinksApiMock.respondWith(
        modelNotFound("room", ["abc-def-123"]),
      );

      await page.goto("/rooms/abc-def-123#tab=tokens");

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test("resets the page if the requested page is out of range", async ({
    page,
    personalizedLinksResponse,
    getRoomPersonalizedLinksApiMock,
  }) => {
    personalizedLinksResponse.meta.per_page = 1;
    personalizedLinksResponse.meta.last_page = 2;
    personalizedLinksResponse.meta.total = 2;
    personalizedLinksResponse.data[0].role = 3;

    await page.goto("/rooms/abc-def-123#tab=tokens");
    await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
      1,
    );

    // The second page is empty, the following request (first page) returns the links
    const emptyPage = readFixture("roomPersonalizedLinks.json");
    emptyPage.data = [];
    Object.assign(emptyPage.meta, {
      current_page: 2,
      from: null,
      per_page: 2,
      to: null,
      total: 2,
      total_no_filter: 2,
    });
    const firstPage = readFixture("roomPersonalizedLinks.json");
    firstPage.data = firstPage.data.slice(0, 2);
    Object.assign(firstPage.meta, {
      per_page: 2,
      to: 2,
      total: 2,
      total_no_filter: 2,
    });
    const linksRequestsAfterChange =
      getRoomPersonalizedLinksApiMock.respondWithSequence([
        { json: emptyPage },
        { json: firstPage },
      ]);

    await page.getByTestId("paginator-next-button").nth(1).click();

    // First request is for the second page, then the page is reset
    await expect(linksRequestsAfterChange).toHaveReceivedRequest(
      { query: { page: "2" } },
      { nth: 1 },
    );
    await expect(linksRequestsAfterChange).toHaveReceivedRequest(
      { query: { page: "1" } },
      { nth: 2 },
    );

    await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
      2,
    );
  });

  test.describe("permissions", () => {
    test("rooms.viewAll only allows to copy the links", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = ["rooms.viewAll"];

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(3);
      await expect(
        page.getByTestId("room-personalized-links-add-button"),
      ).toHaveCount(0);

      for (let index = 0; index < 3; index++) {
        await expect(
          items.nth(index).getByTestId("room-personalized-links-copy-button"),
        ).toBeVisible();
        await expect(
          items.nth(index).getByTestId("room-personalized-links-delete-button"),
        ).toHaveCount(0);
        await expect(
          items.nth(index).getByTestId("room-personalized-links-edit-button"),
        ).toHaveCount(0);
      }
    });

    test("co-owner can add, edit and delete links", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      roomResponse.data.is_co_owner = true;

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(3);
      await expect(
        page.getByTestId("room-personalized-links-add-button"),
      ).toBeVisible();

      for (let index = 0; index < 3; index++) {
        await expect(
          items.nth(index).getByTestId("room-personalized-links-copy-button"),
        ).toBeVisible();
        await expect(
          items.nth(index).getByTestId("room-personalized-links-delete-button"),
        ).toBeVisible();
        await expect(
          items.nth(index).getByTestId("room-personalized-links-edit-button"),
        ).toBeVisible();
      }
    });

    test("rooms.manage can add, edit and delete links", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUserResponse.data.permissions = permissions;
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = permissions;

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(3);
      await expect(
        page.getByTestId("room-personalized-links-add-button"),
      ).toBeVisible();

      for (let index = 0; index < 3; index++) {
        await expect(
          items.nth(index).getByTestId("room-personalized-links-copy-button"),
        ).toBeVisible();
        await expect(
          items.nth(index).getByTestId("room-personalized-links-delete-button"),
        ).toBeVisible();
        await expect(
          items.nth(index).getByTestId("room-personalized-links-edit-button"),
        ).toBeVisible();
      }
    });
  });

  test.describe("search", () => {
    test("loads the personalized links without a search query", async ({
      page,
      getRoomPersonalizedLinksApiMock,
    }) => {
      const linksRequest = getRoomPersonalizedLinksApiMock.waitForNextRequest();

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const query = getRequestQuery(await linksRequest);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
    });

    test("shows a message if no links match the search query", async ({
      page,
      personalizedLinksResponse,
      getRoomPersonalizedLinksApiMock,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );

      personalizedLinksResponse.data = [];
      personalizedLinksResponse.meta.total = 0;
      const linksRequest = getRoomPersonalizedLinksApiMock.waitForNextRequest();

      await page
        .getByTestId("room-personalized-links-search")
        .locator("input")
        .fill("Test");
      await page
        .getByTestId("room-personalized-links-search")
        .locator("button")
        .click();

      expect(getRequestQuery(await linksRequest)).toMatchObject({
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
      personalizedLinksResponse,
      getRoomPersonalizedLinksApiMock,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=tokens");
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        3,
      );

      personalizedLinksResponse.data = [];
      personalizedLinksResponse.meta.total = 0;
      personalizedLinksResponse.meta.total_no_filter = 0;
      const linksRequest = getRoomPersonalizedLinksApiMock.waitForNextRequest();

      await page
        .getByTestId("room-personalized-links-search")
        .locator("input")
        .fill("Test2");
      await page
        .getByTestId("room-personalized-links-search")
        .locator("input")
        .press("Enter");

      expect(getRequestQuery(await linksRequest)).toMatchObject({
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
      test.beforeEach(
        async ({
          page,
          personalizedLinksResponse,
          getRoomPersonalizedLinksApiMock,
        }) => {
          await page.goto("/rooms/abc-def-123#tab=tokens");
          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(3);

          personalizedLinksResponse.meta.per_page = 1;
          personalizedLinksResponse.meta.last_page = 2;
          personalizedLinksResponse.meta.total = 2;
          const linksRequest =
            getRoomPersonalizedLinksApiMock.waitForNextRequest();

          await page
            .getByTestId("room-personalized-links-search")
            .locator("input")
            .fill("Doe");
          await page
            .getByTestId("room-personalized-links-search")
            .locator("button")
            .click();

          expect(getRequestQuery(await linksRequest)).toMatchObject({
            query: "Doe",
            page: "1",
          });

          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(1);
        },
      );

      test("shows the links of the search", async ({ page }) => {
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("John Doe");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("keeps the search query when changing the page", async ({
        page,
        getRoomPersonalizedLinksApiMock,
      }) => {
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(getRequestQuery(await linksRequest)).toMatchObject({
          query: "Doe",
          page: "2",
        });

        await expect(
          page.getByTestId("room-personalized-links-search").locator("input"),
        ).toHaveValue("Doe");
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
        personalizedLinksResponse,
        getRoomPersonalizedLinksApiMock,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("room-personalized-link-item").first(),
        ).toContainText("Max Doe");

        personalizedLinksResponse.meta.per_page = 1;
        personalizedLinksResponse.meta.last_page = 2;
        personalizedLinksResponse.meta.total = 2;
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await page
          .getByTestId("room-personalized-links-search")
          .locator("input")
          .fill("Do");
        await page
          .getByTestId("room-personalized-links-search")
          .locator("button")
          .click();

        expect(getRequestQuery(await linksRequest)).toMatchObject({
          query: "Do",
          page: "1",
        });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("filter", () => {
    test("loads the personalized links without a filter", async ({
      page,
      getRoomPersonalizedLinksApiMock,
    }) => {
      const linksRequest = getRoomPersonalizedLinksApiMock.waitForNextRequest();

      await page.goto("/rooms/abc-def-123#tab=tokens");

      const query = getRequestQuery(await linksRequest);
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

      test("shows a message if no links match the filter", async ({
        page,
        personalizedLinksResponse,
        getRoomPersonalizedLinksApiMock,
      }) => {
        personalizedLinksResponse.data = [];
        personalizedLinksResponse.meta.total = 0;
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await selectFilter(page, 1);

        expect(getRequestQuery(await linksRequest)).toMatchObject({
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
        personalizedLinksResponse,
        getRoomPersonalizedLinksApiMock,
      }) => {
        personalizedLinksResponse.data = [];
        personalizedLinksResponse.meta.total = 0;
        personalizedLinksResponse.meta.total_no_filter = 0;
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await selectFilter(page, 2);

        expect(getRequestQuery(await linksRequest)).toMatchObject({
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
        test.beforeEach(
          async ({
            page,
            personalizedLinksResponse,
            getRoomPersonalizedLinksApiMock,
          }) => {
            personalizedLinksResponse.meta.per_page = 1;
            personalizedLinksResponse.meta.last_page = 2;
            personalizedLinksResponse.meta.total = 2;
            const linksRequest =
              getRoomPersonalizedLinksApiMock.waitForNextRequest();

            await selectFilter(page, 1);

            expect(getRequestQuery(await linksRequest)).toMatchObject({
              filter: "participant_role",
              page: "1",
            });

            await expect(
              page.getByTestId("room-personalized-link-item"),
            ).toHaveCount(1);
          },
        );

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

        test("keeps the filter when changing the page", async ({
          page,
          personalizedLinksResponse,
          getRoomPersonalizedLinksApiMock,
        }) => {
          personalizedLinksResponse.data[1].role = 1;
          const linksRequest =
            getRoomPersonalizedLinksApiMock.waitForNextRequest();

          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(getRequestQuery(await linksRequest)).toMatchObject({
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
          personalizedLinksResponse,
          getRoomPersonalizedLinksApiMock,
        }) => {
          personalizedLinksResponse.data[1].role = 1;
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("room-personalized-link-item").first(),
          ).toContainText("Max Doe");

          personalizedLinksResponse.meta.per_page = 1;
          personalizedLinksResponse.meta.last_page = 2;
          personalizedLinksResponse.meta.total = 2;
          const linksRequest =
            getRoomPersonalizedLinksApiMock.waitForNextRequest();

          await selectFilter(page, 0);

          const query = getRequestQuery(await linksRequest);
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
      getRoomPersonalizedLinksApiMock,
    }) => {
      const linksRequest = getRoomPersonalizedLinksApiMock.waitForNextRequest();

      await page.goto("/rooms/abc-def-123#tab=tokens");

      expect(getRequestQuery(await linksRequest)).toMatchObject({
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
      test.beforeEach(
        async ({
          page,
          personalizedLinksResponse,
          getRoomPersonalizedLinksApiMock,
        }) => {
          await page.goto("/rooms/abc-def-123#tab=tokens");
          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(3);

          personalizedLinksResponse.meta.per_page = 1;
          personalizedLinksResponse.meta.last_page = 3;
          const linksRequest =
            getRoomPersonalizedLinksApiMock.waitForNextRequest();

          await selectSortType(page, 0);

          expect(getRequestQuery(await linksRequest)).toMatchObject({
            sort_by: "firstname",
            sort_direction: "asc",
            page: "1",
          });

          await expect(
            page.getByTestId("room-personalized-link-item"),
          ).toHaveCount(1);
        },
      );

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

      test("keeps the sorting when changing the page", async ({
        page,
        getRoomPersonalizedLinksApiMock,
      }) => {
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(getRequestQuery(await linksRequest)).toMatchObject({
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
        personalizedLinksResponse,
        getRoomPersonalizedLinksApiMock,
      }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        personalizedLinksResponse.meta.per_page = 1;
        personalizedLinksResponse.meta.last_page = 3;
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();

        expect(getRequestQuery(await linksRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "desc",
          page: "1",
        });

        await expectActivePage(page, 0);
      });

      test("keeps the sorting direction when changing the page", async ({
        page,
        getRoomPersonalizedLinksApiMock,
      }) => {
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(getRequestQuery(await linksRequest)).toMatchObject({
          sort_by: "firstname",
          sort_direction: "desc",
          page: "2",
        });

        await expectActivePage(page, 1);
      });

      test("resets the page when changing the sorting type", async ({
        page,
        personalizedLinksResponse,
        getRoomPersonalizedLinksApiMock,
      }) => {
        // The direction was changed before, the sorting type is then sorted descending
        await page
          .getByTestId("sorting-type-inputgroup")
          .locator("button")
          .click();
        await expect(
          page.getByTestId("room-personalized-link-item"),
        ).toHaveCount(1);
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        personalizedLinksResponse.meta.per_page = 1;
        personalizedLinksResponse.meta.last_page = 3;
        const linksRequest =
          getRoomPersonalizedLinksApiMock.waitForNextRequest();

        await selectSortType(page, 2);

        expect(getRequestQuery(await linksRequest)).toMatchObject({
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
