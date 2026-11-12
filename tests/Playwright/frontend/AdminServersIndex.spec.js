import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  holdRequest,
  expectActivePage,
  queryOf,
  mockMethod,
} from "../support/utils.js";

const SERVERS_PATH = "/api/v1/servers";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const isServersUrl = (url) => url.pathname === SERVERS_PATH;

const isServersRequest = (request) =>
  request.method() === "GET" && isServersUrl(new URL(request.url()));

/**
 * Mock the servers list with the fixture changed by `mutate`. Later mocks win.
 */
async function mockServers(page, mutate = () => {}) {
  const servers = readFixture("servers.json");
  mutate(servers);
  return mockMethod(page, "GET", isServersUrl, { json: servers });
}

/**
 * Show only one server per page.
 */
function onePage(servers, pageNumber, lastPage, meta = {}) {
  const index = pageNumber - 1;
  servers.data = servers.data.slice(index, index + 1);
  Object.assign(servers.meta, {
    current_page: pageNumber,
    from: pageNumber,
    last_page: lastPage,
    per_page: 1,
    to: pageNumber,
    ...meta,
  });
}

function mockServersError(page, status, body) {
  return page.route(
    (url) => isServersUrl(url),
    (route) => route.fulfill({ status, json: body }),
  );
}

async function requestServersAfter(page, action) {
  const request = page.waitForRequest(isServersRequest);
  await action();
  return queryOf(await request);
}

const SERVER_ERROR_TEXTS = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

async function expectSearchDisabled(page, disabled) {
  const search = page.getByTestId("server-search");
  await expect(search.locator("input")).toBeVisible();
  await expect(search.locator("button")).toBeVisible();
  if (disabled) {
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
    await expect(
      page.getByTestId("servers-reload-usage-button"),
    ).toBeDisabled();
    await expect(
      page.getByTestId("servers-reload-no-usage-button"),
    ).toBeDisabled();
  } else {
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
    await expect(page.getByTestId("servers-reload-usage-button")).toBeEnabled();
    await expect(
      page.getByTestId("servers-reload-no-usage-button"),
    ).toBeEnabled();
  }
}

async function expectSingleServer(page, name) {
  await expect(page.getByTestId("server-item")).toHaveCount(1);
  await expect(page.getByTestId("server-item")).toContainText(name);
}

// there are two paginator components (first one for small devices, second one for larger devices)
const nextPageButton = (page) =>
  page.getByTestId("paginator-next-button").nth(1);

test.describe("Admin servers index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = ["admin.view", "servers.viewAny"];
    await mockServers(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers");
  });

  test("visit with user without permission to view servers", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view"];

    await page.goto("/admin/servers");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/servers/);
  });

  test.describe("load servers", () => {
    test("loading state", async ({ page }) => {
      const release = await holdRequest(page, isServersUrl, {
        json: readFixture("servers.json"),
      });

      await page.goto("/admin/servers");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expectSearchDisabled(page, true);
      await expect(
        page.getByTestId("servers-reload-usage-button"),
      ).toContainText("admin.servers.reload");
      await expect(page.getByTestId("servers-add-button")).toHaveCount(0);
      await expect(page.getByText("admin.servers.usage_info")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = page.waitForResponse((r) =>
        isServersRequest(r.request()),
      );
      release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectSearchDisabled(page, false);
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
    test("error on initial load", async ({ page }) => {
      await mockServersError(page, 500, { message: "Test" });

      await page.goto("/admin/servers");

      await expectToastAndClose(page, SERVER_ERROR_TEXTS);

      // Check that overlay is shown and the components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectSearchDisabled(page, false);
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
    });

    test("reload after error on initial load", async ({ page }) => {
      await mockServersError(page, 500, { message: "Test" });
      await page.goto("/admin/servers");
      await expectToastAndClose(page, SERVER_ERROR_TEXTS);

      await mockServers(page, (servers) => onePage(servers, 1, 5));

      const query = await requestServersAfter(page, () =>
        page.getByTestId("loading-retry-button").click(),
      );

      // Check that update usage is set correctly when reloading servers
      expect(query.update_usage).toBe("0");

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
      await expectSingleServer(page, "Server 01");
    });

    test.describe("error when changing the page", () => {
      test.beforeEach(async ({ page }) => {
        await mockServers(page, (servers) => onePage(servers, 1, 5));
        await page.goto("/admin/servers");
        await expectSingleServer(page, "Server 01");
      });

      test("shows error and overlay", async ({ page }) => {
        await mockServersError(page, 500, { message: "Test" });

        const query = await requestServersAfter(page, () =>
          nextPageButton(page).click(),
        );
        expect(query.page).toBe("2");

        await expectToastAndClose(page, SERVER_ERROR_TEXTS);

        await expect(page.getByTestId("overlay")).toBeVisible();
        await expectSearchDisabled(page, false);
        await expect(page.getByTestId("loading-retry-button")).toContainText(
          "app.reload",
        );
      });

      test("reload resets to the first page", async ({ page }) => {
        await mockServersError(page, 500, { message: "Test" });
        await nextPageButton(page).click();
        await expectToastAndClose(page, SERVER_ERROR_TEXTS);

        await mockServers(page, (servers) => onePage(servers, 1, 5));

        const query = await requestServersAfter(page, () =>
          page.getByTestId("loading-retry-button").click(),
        );
        expect(query).toMatchObject({ update_usage: "0", page: "1" });

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectSingleServer(page, "Server 01");
        await expectActivePage(page, 0);
      });

      test("unauthenticated redirects to login", async ({ page }) => {
        await mockServersError(page, 401);

        await nextPageButton(page).click();

        await expectLoginRedirect(page, "/admin/servers");
      });
    });

    test("unauthenticated on initial load redirects to login", async ({
      page,
    }) => {
      await mockServersError(page, 401);

      await page.goto("/admin/servers");

      await expectLoginRedirect(page, "/admin/servers");
    });
  });

  test("load servers page out of bounds", async ({ page }) => {
    await mockServers(page, (servers) => onePage(servers, 1, 2, { total: 2 }));
    await page.goto("/admin/servers");
    await expectSingleServer(page, "Server 01");

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
    const release = await holdRequest(page, isServersUrl, {
      json: emptyServers,
    });

    const secondPageRequest = page.waitForRequest(isServersRequest);
    await nextPageButton(page).click();

    // The page is still the same on the first request
    expect(queryOf(await secondPageRequest).page).toBe("2");

    await mockServers(page, (servers) => {
      servers.data = servers.data.slice(0, 2);
      Object.assign(servers.meta, {
        per_page: 2,
        to: 2,
        total: 2,
        total_no_filter: 2,
      });
    });

    // The second request resets the page
    const resetRequest = page.waitForRequest(
      (request) => isServersRequest(request) && queryOf(request).page === "1",
    );
    release();
    await resetRequest;

    await expect(page.getByTestId("server-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("server search", () => {
    test("initial request has no query", async ({ page }) => {
      const request = page.waitForRequest(isServersRequest);
      await page.goto("/admin/servers");

      const query = queryOf(await request);
      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1", update_usage: "0" });
      await expect(
        page.getByTestId("server-search").locator("input"),
      ).toHaveValue("");
    });

    test("no servers found for search query", async ({ page }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);

      await mockServers(page, (servers) => {
        servers.data = [];
        Object.assign(servers.meta, {
          from: null,
          per_page: 1,
          to: null,
          total: 0,
        });
      });

      await page.getByTestId("server-search").locator("input").fill("Test");
      const query = await requestServersAfter(page, () =>
        page.getByTestId("server-search").locator("button").click(),
      );

      expect(query.query).toBe("Test");
      expect(query).toMatchObject({ page: "1", update_usage: "0" });

      await expect(
        page.getByText("admin.servers.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("server-item")).toHaveCount(0);
    });

    test("no servers available, search with enter", async ({ page }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);

      await mockServers(page, (servers) => {
        servers.data = [];
        Object.assign(servers.meta, {
          from: null,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
        });
      });

      const input = page.getByTestId("server-search").locator("input");
      await input.fill("Test2");
      const query = await requestServersAfter(page, () => input.press("Enter"));

      expect(query.query).toBe("Test2");
      expect(query).toMatchObject({ page: "1", update_usage: "0" });

      await expect(
        page.getByText("admin.servers.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("server-item")).toHaveCount(0);
    });

    test.describe("with two pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/servers");
        await expect(page.getByTestId("server-item")).toHaveCount(5);

        await mockServers(page, (servers) =>
          onePage(servers, 1, 2, { total: 2 }),
        );
        await page.getByTestId("server-search").locator("input").fill("Server");
        await requestServersAfter(page, () =>
          page.getByTestId("server-search").locator("button").click(),
        );
        await expectSingleServer(page, "Server 01");
      });

      test("shows the result with pagination", async ({ page }) => {
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same when changing the page", async ({
        page,
      }) => {
        await mockServers(page, (servers) => {
          servers.data = servers.data.slice(1, 2);
          Object.assign(servers.meta, {
            current_page: 2,
            from: 2,
            last_page: 2,
            per_page: 1,
            to: 2,
            total: 2,
          });
        });

        const query = await requestServersAfter(page, () =>
          nextPageButton(page).click(),
        );

        expect(query.query).toBe("Server");
        expect(query).toMatchObject({ page: "2", update_usage: "0" });

        await expect(
          page.getByTestId("server-search").locator("input"),
        ).toHaveValue("Server");
        await expectSingleServer(page, "Server 02");
        await expectActivePage(page, 1);
      });

      test("changing the search query resets the page", async ({ page }) => {
        await mockServers(page, (servers) => {
          servers.data = servers.data.slice(1, 2);
          Object.assign(servers.meta, {
            current_page: 2,
            from: 2,
            last_page: 2,
            per_page: 1,
            to: 2,
            total: 2,
          });
        });
        await nextPageButton(page).click();
        await expectActivePage(page, 1);

        await mockServers(page, (servers) =>
          onePage(servers, 1, 2, { total: 2 }),
        );
        const input = page.getByTestId("server-search").locator("input");
        await input.fill("Se");
        const query = await requestServersAfter(page, () =>
          page.getByTestId("server-search").locator("button").click(),
        );

        expect(query.query).toBe("Se");
        expect(query).toMatchObject({ page: "1", update_usage: "0" });
        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sort servers", () => {
    test.beforeEach(async ({ currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
      ];
    });

    test("default sorting and sortable columns", async ({ page }) => {
      const request = page.waitForRequest(isServersRequest);
      await page.goto("/admin/servers");

      expect(queryOf(await request)).toMatchObject({
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
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/servers");
        await expect(page.getByTestId("server-item")).toHaveCount(5);

        await mockServers(page, (servers) => onePage(servers, 1, 5));
        const query = await requestServersAfter(page, () =>
          page.getByTestId("server-header-cell").nth(1).click(),
        );
        expect(query).toMatchObject({
          page: "1",
          sort_by: "status",
          sort_direction: "asc",
        });
        await expectSingleServer(page, "Server 01");
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
      }) => {
        await mockServers(page, (servers) => onePage(servers, 2, 5));

        const query = await requestServersAfter(page, () =>
          nextPageButton(page).click(),
        );

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
        await expectSingleServer(page, "Server 02");
      });

      test("changing the direction resets the page", async ({ page }) => {
        await mockServers(page, (servers) => onePage(servers, 2, 5));
        await nextPageButton(page).click();
        await expectActivePage(page, 1);

        await mockServers(page, (servers) => onePage(servers, 1, 5));
        const query = await requestServersAfter(page, () =>
          page.getByTestId("server-header-cell").nth(1).click(),
        );

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
        await expectSingleServer(page, "Server 01");
      });

      test("changing the column resets the sorting of the previous one", async ({
        page,
      }) => {
        const query = await requestServersAfter(page, () =>
          page.getByTestId("server-header-cell").nth(3).click(),
        );

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
    }) => {
      await mockServers(page, (servers) => onePage(servers, 1, 5));
      await page.goto("/admin/servers");
      await expectSingleServer(page, "Server 01");

      await requestServersAfter(page, () =>
        page.getByTestId("server-header-cell").nth(3).click(),
      );

      await mockServers(page, (servers) => onePage(servers, 2, 5));
      const query = await requestServersAfter(page, () =>
        nextPageButton(page).click(),
      );

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
      await expectSingleServer(page, "Server 02");
    });

    test("changing the sorting resets the page", async ({ page }) => {
      await mockServers(page, (servers) => onePage(servers, 1, 5));
      await page.goto("/admin/servers");
      await expectSingleServer(page, "Server 01");
      await mockServers(page, (servers) => onePage(servers, 2, 5));
      await nextPageButton(page).click();
      await expectActivePage(page, 1);

      await mockServers(page, (servers) => onePage(servers, 1, 5));
      const query = await requestServersAfter(page, () =>
        page.getByTestId("server-header-cell").nth(4).click(),
      );

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

    test("sort by participant and video count", async ({ page }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
      const headers = page.getByTestId("server-header-cell");

      await mockServers(page, (servers) => onePage(servers, 1, 5));
      await headers.nth(4).click();
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "true");

      let query = await requestServersAfter(page, () => headers.nth(5).click());
      expect(query).toMatchObject({
        page: "1",
        sort_by: "participant_count",
        sort_direction: "asc",
      });
      await expect(headers.nth(4)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(5)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(5)).toHaveAttribute("aria-sort", "ascending");

      query = await requestServersAfter(page, () => headers.nth(6).click());
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
      test(`with ${set.title}`, async ({ page, currentUser }) => {
        currentUser.data.permissions = [
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
