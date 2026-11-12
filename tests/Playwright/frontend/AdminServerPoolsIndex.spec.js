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

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const isServerPoolsUrl = (url) => url.pathname === "/api/v1/serverPools";

const isServerPoolsRequest = (request) =>
  request.method() === "GET" && isServerPoolsUrl(new URL(request.url()));

const SERVER_ERROR_TEXTS = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

/**
 * Mock the server pools list with the fixture changed by `mutate`. Later mocks win.
 */
async function mockServerPools(page, mutate = () => {}) {
  const serverPools = readFixture("serverPools.json");
  mutate(serverPools);
  return mockMethod(page, "GET", isServerPoolsUrl, { json: serverPools });
}

/**
 * Show only one server pool per page.
 */
function onePage(serverPools, pageNumber, lastPage, meta = {}) {
  const index = pageNumber - 1;
  serverPools.data = serverPools.data.slice(index, index + 1);
  Object.assign(serverPools.meta, {
    current_page: pageNumber,
    from: pageNumber,
    last_page: lastPage,
    per_page: 1,
    to: pageNumber,
    ...meta,
  });
}

function mockServerPoolsError(page, status, body) {
  return page.route(
    (url) => isServerPoolsUrl(url),
    (route) => route.fulfill({ status, json: body }),
  );
}

async function requestServerPoolsAfter(page, action) {
  const request = page.waitForRequest(isServerPoolsRequest);
  await action();
  return queryOf(await request);
}

async function expectSearchDisabled(page, disabled) {
  const search = page.getByTestId("server-pool-search");
  await expect(search.locator("input")).toBeVisible();
  await expect(search.locator("button")).toBeVisible();
  if (disabled) {
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
  } else {
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
  }
}

async function expectSingleServerPool(page, name) {
  await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
  await expect(page.getByTestId("server-pool-item")).toContainText(name);
}

// there are two paginator components (first one for small devices, second one for larger devices)
const nextPageButton = (page) =>
  page.getByTestId("paginator-next-button").nth(1);

test.describe("Admin server pools index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = ["admin.view", "serverPools.viewAny"];
    await mockServerPools(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/server_pools");
  });

  test("visit with user without permission to view server pools", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view"];

    await page.goto("/admin/server_pools");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/server_pools/);
  });

  test.describe("load server pools", () => {
    test("loading state", async ({ page }) => {
      const release = await holdRequest(page, isServerPoolsUrl, {
        json: readFixture("serverPools.json"),
      });

      await page.goto("/admin/server_pools");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expectSearchDisabled(page, true);
      await expect(page.getByTestId("server-pools-add-button")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = page.waitForResponse((r) =>
        isServerPoolsRequest(r.request()),
      );
      release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectSearchDisabled(page, false);
      await expect(page.getByTestId("server-pools-add-button")).toHaveCount(0);
      await expect(page.getByTestId("server-pool-item")).toHaveCount(2);
    });

    test("breadcrumb", async ({ page }) => {
      await page.goto("/admin/server_pools");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
      );
    });

    test("headers", async ({ page }) => {
      await page.goto("/admin/server_pools");

      const headers = ["app.model_name", "admin.server_pools.server_count"];
      await expect(page.getByTestId("server-pool-header-cell")).toHaveCount(
        headers.length,
      );
      for (const [index, text] of headers.entries()) {
        await expect(
          page.getByTestId("server-pool-header-cell").nth(index),
        ).toHaveText(text);
      }
    });

    test("server pools are displayed correctly", async ({ page }) => {
      await page.goto("/admin/server_pools");

      const items = page.getByTestId("server-pool-item");
      await expect(items).toHaveCount(2);

      const expected = [
        { name: "Test", servers: "2" },
        { name: "Production", servers: "1" },
      ];
      for (const [index, { name, servers }] of expected.entries()) {
        const cells = items.nth(index).getByTestId("server-pool-item-cell");
        await expect(cells.nth(0)).toHaveText(name);
        await expect(cells.nth(1)).toHaveText(servers);
      }
    });
  });

  test.describe("load server pools errors", () => {
    test("error on initial load", async ({ page }) => {
      await mockServerPoolsError(page, 500, { message: "Test" });

      await page.goto("/admin/server_pools");

      await expectToastAndClose(page, SERVER_ERROR_TEXTS);

      // Check that overlay is shown and the components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectSearchDisabled(page, false);
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
    });

    test("reload after error on initial load", async ({ page }) => {
      await mockServerPoolsError(page, 500, { message: "Test" });
      await page.goto("/admin/server_pools");
      await expectToastAndClose(page, SERVER_ERROR_TEXTS);

      await mockServerPools(page, (serverPools) => onePage(serverPools, 1, 2));

      await requestServerPoolsAfter(page, () =>
        page.getByTestId("loading-retry-button").click(),
      );

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
      await expectSingleServerPool(page, "Test");
    });

    test.describe("error when changing the page", () => {
      test.beforeEach(async ({ page }) => {
        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 1, 2),
        );
        await page.goto("/admin/server_pools");
        await expectSingleServerPool(page, "Test");
      });

      test("shows error and overlay", async ({ page }) => {
        await mockServerPoolsError(page, 500, { message: "Test" });

        const query = await requestServerPoolsAfter(page, () =>
          nextPageButton(page).click(),
        );
        expect(query.page).toBe("2");

        await expectToastAndClose(page, SERVER_ERROR_TEXTS);

        await expect(page.getByTestId("overlay")).toBeVisible();
        await expectSearchDisabled(page, false);
      });

      test("reload resets to the first page", async ({ page }) => {
        await mockServerPoolsError(page, 500, { message: "Test" });
        await nextPageButton(page).click();
        await expectToastAndClose(page, SERVER_ERROR_TEXTS);

        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 1, 2),
        );

        const query = await requestServerPoolsAfter(page, () =>
          page.getByTestId("loading-retry-button").click(),
        );
        expect(query.page).toBe("1");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expectSingleServerPool(page, "Test");
        await expectActivePage(page, 0);
      });

      test("unauthenticated redirects to login", async ({ page }) => {
        await mockServerPoolsError(page, 401, { message: "Test" });

        await nextPageButton(page).click();

        await expectLoginRedirect(page, "/admin/server_pools");
      });
    });

    test("unauthenticated on initial load redirects to login", async ({
      page,
    }) => {
      await mockServerPoolsError(page, 401, { message: "Test" });

      await page.goto("/admin/server_pools");

      await expectLoginRedirect(page, "/admin/server_pools");
    });
  });

  test("load server pools page out of bounds", async ({ page }) => {
    await mockServerPools(page, (serverPools) => onePage(serverPools, 1, 2));
    await page.goto("/admin/server_pools");
    await expectSingleServerPool(page, "Test");

    // Switch to next page but respond with no server pools on second page
    const emptyServerPools = readFixture("serverPools.json");
    emptyServerPools.data = [];
    Object.assign(emptyServerPools.meta, {
      current_page: 2,
      from: null,
      per_page: 2,
      to: null,
    });
    const release = await holdRequest(page, isServerPoolsUrl, {
      json: emptyServerPools,
    });

    const secondPageRequest = page.waitForRequest(isServerPoolsRequest);
    await nextPageButton(page).click();

    // The page is still the same on the first request
    expect(queryOf(await secondPageRequest).page).toBe("2");

    await mockServerPools(page);

    // The second request resets the page
    const resetRequest = page.waitForRequest(
      (request) =>
        isServerPoolsRequest(request) && queryOf(request).page === "1",
    );
    release();
    await resetRequest;

    await expect(page.getByTestId("server-pool-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("server pool search", () => {
    test("initial request has no query", async ({ page }) => {
      const request = page.waitForRequest(isServerPoolsRequest);
      await page.goto("/admin/server_pools");

      const query = queryOf(await request);
      expect(query.query).toBeUndefined();
      expect(query.page).toBe("1");
      await expect(
        page.getByTestId("server-pool-search").locator("input"),
      ).toHaveValue("");
    });

    test("no server pools found for search query", async ({ page }) => {
      await page.goto("/admin/server_pools");
      await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

      await mockServerPools(page, (serverPools) => {
        serverPools.data = [];
        Object.assign(serverPools.meta, {
          from: null,
          per_page: 1,
          to: null,
          total: 0,
        });
      });

      await page
        .getByTestId("server-pool-search")
        .locator("input")
        .fill("Test");
      const query = await requestServerPoolsAfter(page, () =>
        page.getByTestId("server-pool-search").locator("button").click(),
      );

      expect(query.query).toBe("Test");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.server_pools.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("server-pool-item")).toHaveCount(0);
    });

    test("no server pools available, search with enter", async ({ page }) => {
      await page.goto("/admin/server_pools");
      await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

      await mockServerPools(page, (serverPools) => {
        serverPools.data = [];
        Object.assign(serverPools.meta, {
          from: null,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
        });
      });

      const input = page.getByTestId("server-pool-search").locator("input");
      await input.fill("Test2");
      const query = await requestServerPoolsAfter(page, () =>
        input.press("Enter"),
      );

      expect(query.query).toBe("Test2");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.server_pools.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("server-pool-item")).toHaveCount(0);
    });

    test.describe("with two pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/server_pools");
        await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 1, 2),
        );
        await page.getByTestId("server-pool-search").locator("input").fill("T");
        await requestServerPoolsAfter(page, () =>
          page.getByTestId("server-pool-search").locator("button").click(),
        );
        await expectSingleServerPool(page, "Test");
      });

      test("shows the result with pagination", async ({ page }) => {
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same when changing the page", async ({
        page,
      }) => {
        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 2, 2),
        );

        const query = await requestServerPoolsAfter(page, () =>
          nextPageButton(page).click(),
        );

        expect(query.query).toBe("T");
        expect(query.page).toBe("2");
        await expect(
          page.getByTestId("server-pool-search").locator("input"),
        ).toHaveValue("T");
        await expectActivePage(page, 1);
        await expectSingleServerPool(page, "Production");
      });

      test("changing the search query resets the page", async ({ page }) => {
        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 2, 2),
        );
        await nextPageButton(page).click();
        await expectSingleServerPool(page, "Production");
        await expectActivePage(page, 1);

        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 1, 2),
        );
        await page
          .getByTestId("server-pool-search")
          .locator("input")
          .fill("Te");
        const query = await requestServerPoolsAfter(page, () =>
          page.getByTestId("server-pool-search").locator("button").click(),
        );

        expect(query.query).toBe("Te");
        expect(query.page).toBe("1");
        await expectSingleServerPool(page, "Test");
        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sort server pools", () => {
    test.beforeEach(async ({ currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "serverPools.viewAny",
        "serverPools.view",
      ];
    });

    test("initial sorting and sortable columns", async ({ page }) => {
      const request = page.waitForRequest(isServerPoolsRequest);
      await page.goto("/admin/server_pools");

      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });

      const headers = page.getByTestId("server-pool-header-cell");
      await expect(headers).toHaveCount(3);
      await expect(headers.nth(0)).toHaveText("app.model_name");
      await expect(headers.nth(0)).toHaveAttribute(
        "data-p-sortable-column",
        "true",
      );
      await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(1)).toHaveText(
        "admin.server_pools.server_count",
      );
      await expect(headers.nth(1)).toHaveAttribute(
        "data-p-sortable-column",
        "true",
      );
      await expect(headers.nth(1)).toHaveAttribute("data-p-sorted", "false");
      await expect(headers.nth(2)).toHaveText("app.actions");
      await expect(headers.nth(2)).not.toHaveAttribute(
        "data-p-sortable-column",
        "true",
      );
    });

    test.describe("sorted by server count", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/server_pools");
        await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 1, 2),
        );
        const query = await requestServerPoolsAfter(page, () =>
          page.getByTestId("server-pool-header-cell").nth(1).click(),
        );
        expect(query).toMatchObject({
          page: "1",
          sort_by: "servers_count",
          sort_direction: "asc",
        });
      });

      test("shows sorting, result and pagination", async ({ page }) => {
        const headers = page.getByTestId("server-pool-header-cell");
        await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "false");
        await expect(headers.nth(1)).toHaveAttribute("data-p-sorted", "true");

        await expectSingleServerPool(page, "Test");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("sorting stays the same when changing the page", async ({
        page,
      }) => {
        await mockServerPools(page, (serverPools) =>
          onePage(serverPools, 2, 2),
        );
        const query = await requestServerPoolsAfter(page, () =>
          nextPageButton(page).click(),
        );

        expect(query).toMatchObject({
          page: "2",
          sort_by: "servers_count",
          sort_direction: "asc",
        });
        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("server-pool-header-cell").nth(1),
        ).toHaveAttribute("data-p-sorted", "true");
        await expect(
          page.getByTestId("server-pool-header-cell").nth(1),
        ).toHaveAttribute("aria-sort", "ascending");
        await expectSingleServerPool(page, "Production");
      });

      test.describe("descending", () => {
        test.beforeEach(async ({ page }) => {
          await mockServerPools(page, (serverPools) =>
            onePage(serverPools, 2, 2),
          );
          await nextPageButton(page).click();
          await expectSingleServerPool(page, "Production");
          await expectActivePage(page, 1);

          await mockServerPools(page, (serverPools) =>
            onePage(serverPools, 1, 2),
          );
          const query = await requestServerPoolsAfter(page, () =>
            page.getByTestId("server-pool-header-cell").nth(1).click(),
          );

          // Changing the sort direction resets the page
          expect(query).toMatchObject({
            page: "1",
            sort_by: "servers_count",
            sort_direction: "desc",
          });
        });

        test("shows sorting and resets page", async ({ page }) => {
          await expectActivePage(page, 0);
          const header = page.getByTestId("server-pool-header-cell").nth(1);
          await expect(header).toHaveAttribute("data-p-sorted", "true");
          await expect(header).toHaveAttribute("aria-sort", "descending");
          await expectSingleServerPool(page, "Test");
        });

        test("sorting stays the same when changing the page", async ({
          page,
        }) => {
          await mockServerPools(page, (serverPools) =>
            onePage(serverPools, 2, 2),
          );
          const query = await requestServerPoolsAfter(page, () =>
            nextPageButton(page).click(),
          );

          expect(query).toMatchObject({
            page: "2",
            sort_by: "servers_count",
            sort_direction: "desc",
          });
          await expectActivePage(page, 1);
          const header = page.getByTestId("server-pool-header-cell").nth(1);
          await expect(header).toHaveAttribute("data-p-sorted", "true");
          await expect(header).toHaveAttribute("aria-sort", "descending");
          await expectSingleServerPool(page, "Production");
        });

        test("changing the sorted column resets the page", async ({ page }) => {
          await mockServerPools(page, (serverPools) =>
            onePage(serverPools, 1, 2),
          );
          const query = await requestServerPoolsAfter(page, () =>
            page.getByTestId("server-pool-header-cell").nth(0).click(),
          );

          expect(query).toMatchObject({
            page: "1",
            sort_by: "name",
            sort_direction: "asc",
          });
          await expectActivePage(page, 0);
          const headers = page.getByTestId("server-pool-header-cell");
          await expect(headers.nth(1)).toHaveAttribute(
            "data-p-sorted",
            "false",
          );
          await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "true");
          await expect(headers.nth(0)).toHaveAttribute(
            "aria-sort",
            "ascending",
          );
        });
      });
    });
  });

  test.describe("button visibility", () => {
    const permissionSets = [
      {
        name: "view permission",
        permissions: ["serverPools.view"],
        add: false,
        edit: false,
        delete: false,
      },
      {
        name: "update permission",
        permissions: [
          "servers.viewAny",
          "serverPools.view",
          "serverPools.update",
        ],
        add: false,
        edit: true,
        delete: false,
      },
      {
        name: "add permission",
        permissions: [
          "servers.viewAny",
          "serverPools.view",
          "serverPools.update",
          "serverPools.create",
        ],
        add: true,
        edit: true,
        delete: false,
      },
      {
        name: "delete permission",
        permissions: [
          "servers.viewAny",
          "serverPools.view",
          "serverPools.update",
          "serverPools.create",
          "serverPools.delete",
        ],
        add: true,
        edit: true,
        delete: true,
      },
    ];

    for (const set of permissionSets) {
      test(`with ${set.name}`, async ({ page, currentUser }) => {
        currentUser.data.permissions.push(...set.permissions);

        await page.goto("/admin/server_pools");

        await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

        if (set.add) {
          await expect(
            page.getByTestId("server-pools-add-button"),
          ).toBeVisible();
          await expect(
            page.getByTestId("server-pools-add-button"),
          ).toHaveAttribute("href", "/admin/server_pools/new");
        } else {
          await expect(page.getByTestId("server-pools-add-button")).toHaveCount(
            0,
          );
        }

        for (const id of [1, 2]) {
          const item = page.getByTestId("server-pool-item").nth(id - 1);

          await expect(
            item.getByTestId("server-pools-view-button"),
          ).toBeVisible();
          await expect(
            item.getByTestId("server-pools-view-button"),
          ).toHaveAttribute("href", `/admin/server_pools/${id}`);

          if (set.edit) {
            await expect(
              item.getByTestId("server-pools-edit-button"),
            ).toBeVisible();
            await expect(
              item.getByTestId("server-pools-edit-button"),
            ).toHaveAttribute("href", `/admin/server_pools/${id}/edit`);
          } else {
            await expect(
              item.getByTestId("server-pools-edit-button"),
            ).toHaveCount(0);
          }

          if (set.delete) {
            await expect(
              item.getByTestId("server-pools-delete-button"),
            ).toBeVisible();
          } else {
            await expect(
              item.getByTestId("server-pools-delete-button"),
            ).toHaveCount(0);
          }
        }
      });
    }
  });

  test.describe("loading state during reload", () => {
    test.beforeEach(async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.update",
        "serverPools.create",
        "serverPools.delete",
      ];
      await page.goto("/admin/server_pools");
      await expect(page.getByTestId("server-pool-item")).toHaveCount(2);
    });

    test("buttons are disabled while reloading and enabled afterwards", async ({
      page,
    }) => {
      const release = await holdRequest(page, isServerPoolsUrl, {
        json: readFixture("serverPools.json"),
      });

      // Trigger reload by triggering search
      await page.getByTestId("server-pool-search").locator("button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectSearchDisabled(page, true);
      await expect(page.getByTestId("server-pools-add-button")).toBeVisible();
      await expect(page.getByTestId("server-pools-add-button")).toBeEnabled();

      const firstItem = page.getByTestId("server-pool-item").first();
      await expect(
        firstItem.locator('button[data-test="server-pools-view-button"]'),
      ).toBeDisabled();
      await expect(
        firstItem.locator('button[data-test="server-pools-edit-button"]'),
      ).toBeDisabled();
      await expect(
        firstItem.getByTestId("server-pools-delete-button"),
      ).toBeDisabled();

      const response = page.waitForResponse((r) =>
        isServerPoolsRequest(r.request()),
      );
      release();
      await response;

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectSearchDisabled(page, false);
      await expect(page.getByTestId("server-pools-add-button")).toBeEnabled();

      await expect(
        firstItem.locator('a[data-test="server-pools-view-button"]'),
      ).toHaveAttribute("href", "/admin/server_pools/1");
      await expect(
        firstItem.locator('a[data-test="server-pools-edit-button"]'),
      ).toHaveAttribute("href", "/admin/server_pools/1/edit");
      await expect(
        firstItem.getByTestId("server-pools-delete-button"),
      ).toBeEnabled();
    });
  });
});
