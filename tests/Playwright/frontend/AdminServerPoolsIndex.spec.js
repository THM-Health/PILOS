import { test } from "../support/fixtures/adminServerPools.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  expectActivePage,
  queryOf,
  mockMethod,
  readFixture,
} from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin server pools index", () => {
  test.beforeEach(async ({ currentUser }) => {
    currentUser.data.permissions = ["admin.view", "serverPools.viewAny"];
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
    test("loading state", async ({ page, serverPools }) => {
      const serverPoolsRequest = await mockMethod(
        page,
        "GET",
        "**/api/v1/serverPools*",
        { json: serverPools, hold: true },
      );

      await page.goto("/admin/server_pools");

      const search = page.getByTestId("server-pool-search");
      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(page.getByTestId("server-pools-add-button")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = page.waitForResponse("**/api/v1/serverPools*");
      serverPoolsRequest.release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
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
      await mockMethod(page, "GET", "**/api/v1/serverPools*", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/server_pools");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that overlay is shown and the components are not disabled
      const search = page.getByTestId("server-pool-search");
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("loading-retry-button")).toContainText(
        "app.reload",
      );
    });

    test("reload after error on initial load", async ({
      page,
      serverPools,
      showServerPoolsPage,
    }) => {
      await mockMethod(page, "GET", "**/api/v1/serverPools*", {
        status: 500,
        json: { message: "Test" },
      });
      await page.goto("/admin/server_pools");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      showServerPoolsPage(1);
      await mockMethod(page, "GET", "**/api/v1/serverPools*", {
        json: serverPools,
      });

      const request = page.waitForRequest("**/api/v1/serverPools*");
      await page.getByTestId("loading-retry-button").click();
      await request;

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
      await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
      await expect(page.getByTestId("server-pool-item")).toContainText("Test");
    });

    test.describe("error when changing the page", () => {
      test.beforeEach(async ({ page, showServerPoolsPage }) => {
        showServerPoolsPage(1);
        await page.goto("/admin/server_pools");
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Test",
        );
      });

      test("shows error and overlay", async ({ page }) => {
        await mockMethod(page, "GET", "**/api/v1/serverPools*", {
          status: 500,
          json: { message: "Test" },
        });

        const request = page.waitForRequest("**/api/v1/serverPools*");
        // there are two paginator components (first one for small devices, second one for larger devices)
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(queryOf(await request).page).toBe("2");

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        const search = page.getByTestId("server-pool-search");
        await expect(page.getByTestId("overlay")).toBeVisible();
        await expect(search.locator("input")).toBeVisible();
        await expect(search.locator("button")).toBeVisible();
        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();
      });

      test("reload resets to the first page", async ({ page, serverPools }) => {
        await mockMethod(page, "GET", "**/api/v1/serverPools*", {
          status: 500,
          json: { message: "Test" },
        });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await mockMethod(page, "GET", "**/api/v1/serverPools*", {
          json: serverPools,
        });

        const request = page.waitForRequest("**/api/v1/serverPools*");
        await page.getByTestId("loading-retry-button").click();
        expect(queryOf(await request).page).toBe("1");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Test",
        );
        await expectActivePage(page, 0);
      });

      test("unauthenticated redirects to login", async ({ page }) => {
        await mockMethod(page, "GET", "**/api/v1/serverPools*", {
          status: 401,
          json: { message: "Test" },
        });

        await page.getByTestId("paginator-next-button").nth(1).click();

        await expectLoginRedirect(page, "/admin/server_pools");
      });
    });

    test("unauthenticated on initial load redirects to login", async ({
      page,
    }) => {
      await mockMethod(page, "GET", "**/api/v1/serverPools*", {
        status: 401,
        json: { message: "Test" },
      });

      await page.goto("/admin/server_pools");

      await expectLoginRedirect(page, "/admin/server_pools");
    });
  });

  test("load server pools page out of bounds", async ({
    page,
    showServerPoolsPage,
  }) => {
    showServerPoolsPage(1);
    await page.goto("/admin/server_pools");
    await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
    await expect(page.getByTestId("server-pool-item")).toContainText("Test");

    // Switch to next page but respond with no server pools on second page
    const emptyServerPools = readFixture("serverPools.json");
    emptyServerPools.data = [];
    Object.assign(emptyServerPools.meta, {
      current_page: 2,
      from: null,
      per_page: 2,
      to: null,
    });
    const emptyPageRequest = await mockMethod(
      page,
      "GET",
      "**/api/v1/serverPools*",
      { json: emptyServerPools, hold: true },
    );

    const secondPageRequest = page.waitForRequest("**/api/v1/serverPools*");
    await page.getByTestId("paginator-next-button").nth(1).click();

    // The page is still the same on the first request
    expect(queryOf(await secondPageRequest).page).toBe("2");

    await mockMethod(page, "GET", "**/api/v1/serverPools*", {
      json: readFixture("serverPools.json"),
    });

    // The second request resets the page
    const resetRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/serverPools") &&
        queryOf(request).page === "1",
    );
    emptyPageRequest.release();
    await resetRequest;

    await expect(page.getByTestId("server-pool-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("server pool search", () => {
    test("initial request has no query", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/serverPools*");
      await page.goto("/admin/server_pools");

      const query = queryOf(await request);
      expect(query.query).toBeUndefined();
      expect(query.page).toBe("1");
      await expect(
        page.getByTestId("server-pool-search").locator("input"),
      ).toHaveValue("");
    });

    test("no server pools found for search query", async ({
      page,
      serverPools,
    }) => {
      await page.goto("/admin/server_pools");
      await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

      serverPools.data = [];
      Object.assign(serverPools.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
      });

      const search = page.getByTestId("server-pool-search");
      await search.locator("input").fill("Test");
      const request = page.waitForRequest("**/api/v1/serverPools*");
      await search.locator("button").click();
      const query = queryOf(await request);

      expect(query.query).toBe("Test");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.server_pools.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("server-pool-item")).toHaveCount(0);
    });

    test("no server pools available, search with enter", async ({
      page,
      serverPools,
    }) => {
      await page.goto("/admin/server_pools");
      await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

      serverPools.data = [];
      Object.assign(serverPools.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
        total_no_filter: 0,
      });

      const input = page.getByTestId("server-pool-search").locator("input");
      await input.fill("Test2");
      const request = page.waitForRequest("**/api/v1/serverPools*");
      await input.press("Enter");
      const query = queryOf(await request);

      expect(query.query).toBe("Test2");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.server_pools.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("server-pool-item")).toHaveCount(0);
    });

    test.describe("with two pages", () => {
      test.beforeEach(async ({ page, showServerPoolsPage }) => {
        await page.goto("/admin/server_pools");
        await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

        showServerPoolsPage(1);
        const search = page.getByTestId("server-pool-search");
        await search.locator("input").fill("T");
        const request = page.waitForRequest("**/api/v1/serverPools*");
        await search.locator("button").click();
        await request;
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Test",
        );
      });

      test("shows the result with pagination", async ({ page }) => {
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same when changing the page", async ({
        page,
        showServerPoolsPage,
      }) => {
        showServerPoolsPage(2);

        const request = page.waitForRequest("**/api/v1/serverPools*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = queryOf(await request);

        expect(query.query).toBe("T");
        expect(query.page).toBe("2");
        await expect(
          page.getByTestId("server-pool-search").locator("input"),
        ).toHaveValue("T");
        await expectActivePage(page, 1);
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Production",
        );
      });

      test("changing the search query resets the page", async ({
        page,
        showServerPoolsPage,
      }) => {
        showServerPoolsPage(2);
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Production",
        );
        await expectActivePage(page, 1);

        showServerPoolsPage(1);
        const search = page.getByTestId("server-pool-search");
        await search.locator("input").fill("Te");
        const request = page.waitForRequest("**/api/v1/serverPools*");
        await search.locator("button").click();
        const query = queryOf(await request);

        expect(query.query).toBe("Te");
        expect(query.page).toBe("1");
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Test",
        );
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
      const request = page.waitForRequest("**/api/v1/serverPools*");
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
      test.beforeEach(async ({ page, showServerPoolsPage }) => {
        await page.goto("/admin/server_pools");
        await expect(page.getByTestId("server-pool-item")).toHaveCount(2);

        showServerPoolsPage(1);
        const request = page.waitForRequest("**/api/v1/serverPools*");
        await page.getByTestId("server-pool-header-cell").nth(1).click();
        expect(queryOf(await request)).toMatchObject({
          page: "1",
          sort_by: "servers_count",
          sort_direction: "asc",
        });
      });

      test("shows sorting, result and pagination", async ({ page }) => {
        const headers = page.getByTestId("server-pool-header-cell");
        await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "false");
        await expect(headers.nth(1)).toHaveAttribute("data-p-sorted", "true");

        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Test",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("sorting stays the same when changing the page", async ({
        page,
        showServerPoolsPage,
      }) => {
        showServerPoolsPage(2);
        const request = page.waitForRequest("**/api/v1/serverPools*");
        await page.getByTestId("paginator-next-button").nth(1).click();

        expect(queryOf(await request)).toMatchObject({
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
        await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
        await expect(page.getByTestId("server-pool-item")).toContainText(
          "Production",
        );
      });

      test.describe("descending", () => {
        test.beforeEach(async ({ page, showServerPoolsPage }) => {
          showServerPoolsPage(2);
          await page.getByTestId("paginator-next-button").nth(1).click();
          await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
          await expect(page.getByTestId("server-pool-item")).toContainText(
            "Production",
          );
          await expectActivePage(page, 1);

          showServerPoolsPage(1);
          const request = page.waitForRequest("**/api/v1/serverPools*");
          await page.getByTestId("server-pool-header-cell").nth(1).click();

          // Changing the sort direction resets the page
          expect(queryOf(await request)).toMatchObject({
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
          await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
          await expect(page.getByTestId("server-pool-item")).toContainText(
            "Test",
          );
        });

        test("sorting stays the same when changing the page", async ({
          page,
          showServerPoolsPage,
        }) => {
          showServerPoolsPage(2);
          const request = page.waitForRequest("**/api/v1/serverPools*");
          await page.getByTestId("paginator-next-button").nth(1).click();

          expect(queryOf(await request)).toMatchObject({
            page: "2",
            sort_by: "servers_count",
            sort_direction: "desc",
          });
          await expectActivePage(page, 1);
          const header = page.getByTestId("server-pool-header-cell").nth(1);
          await expect(header).toHaveAttribute("data-p-sorted", "true");
          await expect(header).toHaveAttribute("aria-sort", "descending");
          await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
          await expect(page.getByTestId("server-pool-item")).toContainText(
            "Production",
          );
        });

        test("changing the sorted column resets the page", async ({
          page,
          showServerPoolsPage,
        }) => {
          showServerPoolsPage(1);
          const request = page.waitForRequest("**/api/v1/serverPools*");
          await page.getByTestId("server-pool-header-cell").nth(0).click();

          expect(queryOf(await request)).toMatchObject({
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
      serverPools,
    }) => {
      const serverPoolsRequest = await mockMethod(
        page,
        "GET",
        "**/api/v1/serverPools*",
        { json: serverPools, hold: true },
      );

      // Trigger reload by triggering search
      const search = page.getByTestId("server-pool-search");
      await search.locator("button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
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

      const response = page.waitForResponse("**/api/v1/serverPools*");
      serverPoolsRequest.release();
      await response;

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
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
