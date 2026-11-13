import { test } from "../support/fixtures/serverController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  expectActivePage,
  getRequestQuery,
  readFixture,
  serverError,
} from "../support/utils.js";

test.describe("Admin servers index", () => {
  test.use({ authenticated: true });

  test.beforeEach(({ currentUserResponse }) => {
    currentUserResponse.data.permissions = ["admin.view", "servers.viewAny"];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers");
  });

  test("visit with user without permission to view servers", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = ["admin.view"];

    await page.goto("/admin/servers");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/servers/);
  });

  test.describe("load servers", () => {
    test("loading state", async ({
      page,
      serversResponse,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWith({ json: serversResponse, hold: true });

      await page.goto("/admin/servers");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      const search = page.getByTestId("server-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(
        page.getByTestId("servers-reload-usage-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("servers-reload-no-usage-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("servers-reload-usage-button"),
      ).toContainText("admin.servers.reload");
      await expect(page.getByTestId("servers-add-button")).toHaveCount(0);
      await expect(page.getByText("admin.servers.usage_info")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = getServersApiMock.waitForNextResponse();
      getServersApiMock.release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(
        page.getByTestId("servers-reload-usage-button"),
      ).toBeEnabled();
      await expect(
        page.getByTestId("servers-reload-no-usage-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("servers-add-button")).toHaveCount(0);
      await expect(page.getByText("admin.servers.usage_info")).toBeVisible();
      await expect(page.getByTestId("server-item")).toHaveCount(5);
    });

    test("breadcrumb", async ({ page }) => {
      await page.goto("/admin/servers");

      await expectAdminBreadcrumbs(page, "admin.breadcrumbs.servers.index");
    });

    test("headers", async ({ page }) => {
      await page.goto("/admin/servers");

      const headers = [
        "app.model_name",
        "admin.servers.status",
        "admin.servers.connection",
        "admin.servers.version",
        "admin.servers.meeting_count",
        "admin.servers.participant_count",
        "admin.servers.video_count",
      ];
      await expect(page.getByTestId("server-header-cell")).toHaveCount(
        headers.length,
      );
      for (const [index, text] of headers.entries()) {
        await expect(
          page.getByTestId("server-header-cell").nth(index),
        ).toHaveText(text);
      }
    });

    const none = " --- ";
    const expectedServers = [
      {
        index: 0,
        name: "Server 01",
        status: ["admin.servers.enabled", "fa-play"],
        connection: ["admin.servers.online", "fa-check"],
        version: "2.4.5",
        meetings: "2",
        participants: "10",
        videos: "5",
      },
      {
        index: 1,
        name: "Server 02",
        status: ["admin.servers.enabled", "fa-play"],
        connection: ["admin.servers.faulty", "fa-triangle-exclamation"],
        version: none,
        meetings: "10",
        participants: "50",
        videos: "5",
      },
      {
        index: 2,
        name: "Server 03",
        status: ["admin.servers.disabled", "fa-stop"],
        connection: null,
        version: none,
        meetings: none,
        participants: none,
        videos: none,
      },
      {
        index: 3,
        name: "Server 04",
        status: ["admin.servers.draining", "fa-pause"],
        connection: ["admin.servers.offline", "fa-xmark"],
        version: none,
        meetings: none,
        participants: none,
        videos: none,
      },
      {
        index: 4,
        name: "Server 05",
        status: ["admin.servers.enabled", "fa-play"],
        connection: ["admin.servers.always_online", "fa-check"],
        version: none,
        meetings: none,
        participants: none,
        videos: none,
      },
    ];

    for (const server of expectedServers) {
      test(`${server.name} is displayed correctly`, async ({ page }) => {
        await page.goto("/admin/servers");

        await expect(page.getByTestId("server-item")).toHaveCount(5);
        const cells = page
          .getByTestId("server-item")
          .nth(server.index)
          .getByTestId("server-item-cell");
        await expect(cells).toHaveCount(7);

        await expect(cells.nth(0)).toHaveText(server.name);

        const status = cells.nth(1).locator("span").first();
        await expect(status).toHaveAttribute("aria-label", server.status[0]);
        await expect(status.locator(".p-tag-icon")).toHaveClass(
          new RegExp(server.status[1]),
        );

        if (server.connection) {
          const connection = cells.nth(2).locator("span").first();
          await expect(connection).toHaveAttribute(
            "aria-label",
            server.connection[0],
          );
          await expect(connection.locator(".p-tag-icon")).toHaveClass(
            new RegExp(server.connection[1]),
          );
          // Only the always online server shows the (empty) always online details
          if (server.name === "Server 05") {
            await expect(connection).toContainText("()");
          } else {
            await expect(connection).not.toContainText("()");
          }
        } else {
          await expect(cells.nth(2)).toHaveText(none);
        }

        await expect(cells.nth(3)).toHaveText(server.version);
        await expect(cells.nth(4)).toHaveText(server.meetings);
        await expect(cells.nth(5)).toHaveText(server.participants);
        await expect(cells.nth(6)).toHaveText(server.videos);
      });
    }
  });

  test.describe("load servers errors", () => {
    test("error on initial load", async ({ page, getServersApiMock }) => {
      getServersApiMock.respondWith(serverError());

      await page.goto("/admin/servers");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that overlay is shown and the components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("server-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(
        page.getByTestId("servers-reload-usage-button"),
      ).toBeEnabled();
      await expect(
        page.getByTestId("servers-reload-no-usage-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
    });

    test("reload after error on initial load", async ({
      page,
      serversResponse,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWith(serverError());
      await page.goto("/admin/servers");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
      getServersApiMock.respondWith({
        json: serversResponse,
      });

      const request = getServersApiMock.waitForNextRequest();
      await page.getByTestId("loading-retry-button").click();
      const query = getRequestQuery(await request);

      // Check that update usage is set correctly when reloading servers
      expect(query.update_usage).toBe("0");

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
      await expect(page.getByTestId("server-item")).toHaveCount(1);
      await expect(page.getByTestId("server-item")).toContainText("Server 01");
    });

    test.describe("error when changing the page", () => {
      test.beforeEach(async ({ page, getServersApiMock }) => {
        getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
        await page.goto("/admin/servers");
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 01",
        );
      });

      test("shows error and overlay", async ({ page, getServersApiMock }) => {
        getServersApiMock.respondWith(serverError());

        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = getRequestQuery(await request);
        expect(query.page).toBe("2");

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(page.getByTestId("overlay")).toBeVisible();
        const search = page.getByTestId("server-search");
        await expect(search.locator("input")).toBeVisible();
        await expect(search.locator("button")).toBeVisible();
        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();
        await expect(
          page.getByTestId("servers-reload-usage-button"),
        ).toBeEnabled();
        await expect(
          page.getByTestId("servers-reload-no-usage-button"),
        ).toBeEnabled();
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );
      });

      test("reload resets to the first page", async ({
        page,
        serversResponse,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWith(serverError());
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
        getServersApiMock.respondWith({
          json: serversResponse,
        });

        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("loading-retry-button").click();
        const query = getRequestQuery(await request);
        expect(query).toMatchObject({ update_usage: "0", page: "1" });

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 01",
        );
        await expectActivePage(page, 0);
      });

      test("unauthenticated redirects to login", async ({
        page,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWith({ status: 401 });

        await page.getByTestId("paginator-next-button").nth(1).click();

        await expectLoginRedirect(page, "/admin/servers");
      });
    });

    test("unauthenticated on initial load redirects to login", async ({
      page,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWith({ status: 401 });

      await page.goto("/admin/servers");

      await expectLoginRedirect(page, "/admin/servers");
    });
  });

  test("load servers page out of bounds", async ({
    page,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      meta: { total: 2 },
    });
    await page.goto("/admin/servers");
    await expect(page.getByTestId("server-item")).toHaveCount(1);
    await expect(page.getByTestId("server-item")).toContainText("Server 01");

    // Switch to next page but respond with no servers on second page
    const emptyServers = readFixture("servers.json");
    emptyServers.data = [];
    Object.assign(emptyServers.meta, {
      current_page: 2,
      from: null,
      per_page: 2,
      to: null,
      total: 2,
      total_no_filter: 2,
    });
    getServersApiMock.respondWith({ json: emptyServers, hold: true });

    const secondPageRequest = getServersApiMock.waitForNextRequest();
    await page.getByTestId("paginator-next-button").nth(1).click();

    // The page is still the same on the first request
    expect(getRequestQuery(await secondPageRequest).page).toBe("2");

    const twoServers = readFixture("servers.json");
    twoServers.data = twoServers.data.slice(0, 2);
    Object.assign(twoServers.meta, {
      per_page: 2,
      to: 2,
      total: 2,
      total_no_filter: 2,
    });
    getServersApiMock.respondWith({
      json: twoServers,
    });

    // The second request resets the page
    const resetRequest = getServersApiMock.waitForNextRequest();
    getServersApiMock.release();
    await resetRequest;

    await expect(page.getByTestId("server-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("server search", () => {
    test("initial request has no query", async ({
      page,
      getServersApiMock,
    }) => {
      const request = getServersApiMock.waitForNextRequest();
      await page.goto("/admin/servers");

      const query = getRequestQuery(await request);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1", update_usage: "0" });
      await expect(
        page.getByTestId("server-search").locator("input"),
      ).toHaveValue("");
    });

    test("no servers found for search query", async ({
      page,
      serversResponse,
      getServersApiMock,
    }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);

      serversResponse.data = [];
      Object.assign(serversResponse.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
      });

      await page.getByTestId("server-search").locator("input").fill("Test");
      const request = getServersApiMock.waitForNextRequest();
      await page.getByTestId("server-search").locator("button").click();
      const query = getRequestQuery(await request);

      expect(query.query).toBe("Test");
      expect(query).toMatchObject({ page: "1", update_usage: "0" });

      await expect(
        page.getByText("admin.servers.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("server-item")).toHaveCount(0);
    });

    test("no servers available, search with enter", async ({
      page,
      serversResponse,
      getServersApiMock,
    }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);

      serversResponse.data = [];
      Object.assign(serversResponse.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
        total_no_filter: 0,
      });

      const input = page.getByTestId("server-search").locator("input");
      await input.fill("Test2");
      const request = getServersApiMock.waitForNextRequest();
      await input.press("Enter");
      const query = getRequestQuery(await request);

      expect(query.query).toBe("Test2");
      expect(query).toMatchObject({ page: "1", update_usage: "0" });

      await expect(
        page.getByText("admin.servers.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("server-item")).toHaveCount(0);
    });

    test.describe("with two pages", () => {
      test.beforeEach(async ({ page, getServersApiMock }) => {
        await page.goto("/admin/servers");
        await expect(page.getByTestId("server-item")).toHaveCount(5);

        getServersApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 2,
          meta: { total: 2 },
        });
        await page.getByTestId("server-search").locator("input").fill("Server");
        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("server-search").locator("button").click();
        await request;
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 01",
        );
      });

      test("shows the result with pagination", async ({ page }) => {
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same when changing the page", async ({
        page,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 2,
          meta: { total: 2 },
        });

        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = getRequestQuery(await request);

        expect(query.query).toBe("Server");
        expect(query).toMatchObject({ page: "2", update_usage: "0" });

        await expect(
          page.getByTestId("server-search").locator("input"),
        ).toHaveValue("Server");
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 02",
        );
        await expectActivePage(page, 1);
      });

      test("changing the search query resets the page", async ({
        page,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 2,
          meta: { total: 2 },
        });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        getServersApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 2,
          meta: { total: 2 },
        });
        const input = page.getByTestId("server-search").locator("input");
        await input.fill("Se");
        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("server-search").locator("button").click();
        const query = getRequestQuery(await request);

        expect(query.query).toBe("Se");
        expect(query).toMatchObject({ page: "1", update_usage: "0" });
        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sort servers", () => {
    test.beforeEach(({ currentUserResponse }) => {
      currentUserResponse.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
      ];
    });

    test("default sorting and sortable columns", async ({
      page,
      getServersApiMock,
    }) => {
      const request = getServersApiMock.waitForNextRequest();
      await page.goto("/admin/servers");

      expect(getRequestQuery(await request)).toMatchObject({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });

      const headers = page.getByTestId("server-header-cell");
      await expect(headers).toHaveCount(8);

      const columns = [
        ["app.model_name", true, "true"],
        ["admin.servers.status", true, "false"],
        ["admin.servers.connection", false],
        ["admin.servers.version", true, "false"],
        ["admin.servers.meeting_count", true, "false"],
        ["admin.servers.participant_count", true],
        ["admin.servers.video_count", true],
        ["app.actions", false],
      ];
      for (const [index, [text, sortable, sorted]] of columns.entries()) {
        const header = headers.nth(index);
        await expect(header).toHaveText(text);
        if (sortable) {
          await expect(header).toHaveAttribute(
            "data-p-sortable-column",
            "true",
          );
        } else {
          await expect(header).not.toHaveAttribute(
            "data-p-sortable-column",
            "true",
          );
        }
        if (sorted) {
          await expect(header).toHaveAttribute("data-p-sorted", sorted);
        }
      }
    });

    test.describe("sorted by status", () => {
      test.beforeEach(async ({ page, getServersApiMock }) => {
        await page.goto("/admin/servers");
        await expect(page.getByTestId("server-item")).toHaveCount(5);

        getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("server-header-cell").nth(1).click();
        const query = getRequestQuery(await request);
        expect(query).toMatchObject({
          page: "1",
          sort_by: "status",
          sort_direction: "asc",
        });
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 01",
        );
      });

      test("changes the sorting and shows the pagination", async ({ page }) => {
        const headers = page.getByTestId("server-header-cell");
        await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "false");
        await expect(headers.nth(1)).toHaveAttribute("data-p-sorted", "true");

        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 0);
      });

      test("sorting stays the same when changing the page", async ({
        page,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWithPage({ currentPage: 2, lastPage: 5 });

        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = getRequestQuery(await request);

        expect(query).toMatchObject({
          page: "2",
          sort_by: "status",
          sort_direction: "asc",
        });
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("server-header-cell").nth(1),
        ).toHaveAttribute("data-p-sorted", "true");
        await expect(
          page.getByTestId("server-header-cell").nth(1),
        ).toHaveAttribute("aria-sort", "ascending");
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 02",
        );
      });

      test("changing the direction resets the page", async ({
        page,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWithPage({ currentPage: 2, lastPage: 5 });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("server-header-cell").nth(1).click();
        const query = getRequestQuery(await request);

        expect(query).toMatchObject({
          page: "1",
          sort_by: "status",
          sort_direction: "desc",
        });
        await expectActivePage(page, 0);
        await expect(
          page.getByTestId("server-header-cell").nth(1),
        ).toHaveAttribute("data-p-sorted", "true");
        await expect(
          page.getByTestId("server-header-cell").nth(1),
        ).toHaveAttribute("aria-sort", "descending");
        await expect(page.getByTestId("server-item")).toHaveCount(1);
        await expect(page.getByTestId("server-item")).toContainText(
          "Server 01",
        );
      });

      test("changing the column resets the sorting of the previous one", async ({
        page,
        getServersApiMock,
      }) => {
        const request = getServersApiMock.waitForNextRequest();
        await page.getByTestId("server-header-cell").nth(3).click();
        const query = getRequestQuery(await request);

        expect(query).toMatchObject({
          page: "1",
          sort_by: "version",
          sort_direction: "asc",
        });
        const headers = page.getByTestId("server-header-cell");
        await expect(headers.nth(1)).toHaveAttribute("data-p-sorted", "false");
        await expect(headers.nth(3)).toHaveAttribute("data-p-sorted", "true");
        await expect(headers.nth(3)).toHaveAttribute("aria-sort", "ascending");
      });
    });

    test("sorting by version stays the same when changing the page", async ({
      page,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(1);
      await expect(page.getByTestId("server-item")).toContainText("Server 01");

      const sortRequest = getServersApiMock.waitForNextRequest();
      await page.getByTestId("server-header-cell").nth(3).click();
      await sortRequest;

      getServersApiMock.respondWithPage({ currentPage: 2, lastPage: 5 });
      const request = getServersApiMock.waitForNextRequest();
      await page.getByTestId("paginator-next-button").nth(1).click();
      const query = getRequestQuery(await request);

      expect(query).toMatchObject({
        page: "2",
        sort_by: "version",
        sort_direction: "asc",
      });
      await expectActivePage(page, 1);
      await expect(
        page.getByTestId("server-header-cell").nth(3),
      ).toHaveAttribute("data-p-sorted", "true");
      await expect(
        page.getByTestId("server-header-cell").nth(3),
      ).toHaveAttribute("aria-sort", "ascending");
      await expect(page.getByTestId("server-item")).toHaveCount(1);
      await expect(page.getByTestId("server-item")).toContainText("Server 02");
    });

    test("changing the sorting resets the page", async ({
      page,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(1);
      await expect(page.getByTestId("server-item")).toContainText("Server 01");
      getServersApiMock.respondWithPage({ currentPage: 2, lastPage: 5 });
      await page.getByTestId("paginator-next-button").nth(1).click();
      await expectActivePage(page, 1);

      getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
      const request = getServersApiMock.waitForNextRequest();
      await page.getByTestId("server-header-cell").nth(4).click();
      const query = getRequestQuery(await request);

      expect(query).toMatchObject({
        page: "1",
        sort_by: "meeting_count",
        sort_direction: "asc",
      });
      await expectActivePage(page, 0);
      const headers = page.getByTestId("server-header-cell");
      await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(4)).toHaveAttribute("aria-sort", "ascending");
    });

    test("sort by participant and video count", async ({
      page,
      getServersApiMock,
    }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
      const headers = page.getByTestId("server-header-cell");

      getServersApiMock.respondWithPage({ currentPage: 1, lastPage: 5 });
      await headers.nth(4).click();
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");

      const participantRequest = getServersApiMock.waitForNextRequest();
      await headers.nth(5).click();
      let query = getRequestQuery(await participantRequest);
      expect(query).toMatchObject({
        page: "1",
        sort_by: "participant_count",
        sort_direction: "asc",
      });
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(5)).toHaveAttribute("aria-sort", "ascending");

      const videoRequest = getServersApiMock.waitForNextRequest();
      await headers.nth(6).click();
      query = getRequestQuery(await videoRequest);
      expect(query).toMatchObject({
        page: "1",
        sort_by: "video_count",
        sort_direction: "asc",
      });
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(6)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(6)).toHaveAttribute("aria-sort", "ascending");
    });
  });

  test.describe("button visibility", () => {
    const permissionSets = [
      {
        title: "view permission",
        permissions: ["servers.view"],
        add: false,
        view: true,
        edit: false,
        deleteOnThird: false,
      },
      {
        title: "update permission",
        permissions: ["servers.view", "servers.update"],
        add: false,
        view: true,
        edit: true,
        deleteOnThird: false,
      },
      {
        title: "add permission",
        permissions: ["servers.view", "servers.update", "servers.create"],
        add: true,
        view: true,
        edit: true,
        deleteOnThird: false,
      },
      {
        title: "delete permission",
        permissions: [
          "servers.view",
          "servers.update",
          "servers.create",
          "servers.delete",
        ],
        add: true,
        view: true,
        edit: true,
        deleteOnThird: true,
      },
    ];

    for (const set of permissionSets) {
      test(`with ${set.title}`, async ({ page, currentUserResponse }) => {
        currentUserResponse.data.permissions = [
          "admin.view",
          "servers.viewAny",
          ...set.permissions,
        ];

        await page.goto("/admin/servers");
        await expect(page.getByTestId("server-item")).toHaveCount(5);

        const addButton = page.getByTestId("servers-add-button");
        if (set.add) {
          await expect(addButton).toBeVisible();
          await expect(addButton).toBeEnabled();
          await expect(addButton).toHaveAttribute("href", "/admin/servers/new");
        } else {
          await expect(addButton).toHaveCount(0);
        }

        for (const index of [0, 1, 2, 3]) {
          const row = page.getByTestId("server-item").nth(index);
          const id = index + 1;

          const view = row.getByTestId("servers-view-button");
          await expect(view).toBeVisible();
          await expect(view).toBeEnabled();
          await expect(view).toHaveAttribute("href", `/admin/servers/${id}`);

          const edit = row.getByTestId("servers-edit-button");
          if (set.edit) {
            await expect(edit).toBeVisible();
            await expect(edit).toBeEnabled();
            await expect(edit).toHaveAttribute(
              "href",
              `/admin/servers/${id}/edit`,
            );
          } else {
            await expect(edit).toHaveCount(0);
          }

          // The delete button is only shown for the disabled server (third one)
          const deleteButton = row.getByTestId("servers-delete-button");
          if (set.deleteOnThird && index === 2) {
            await expect(deleteButton).toBeVisible();
          } else {
            await expect(deleteButton).toHaveCount(0);
          }
        }
      });
    }
  });
});
