import { test } from "../support/fixtures/adminRoles.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  mockMethod,
  expectActivePage,
  queryOf,
  readFixture,
} from "../support/utils.js";

// Two paginator components exist (small devices, larger devices), the second one is used (nth(1))
test.describe("Admin roles index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUser }) => {
    currentUser.data.permissions = ["admin.view", "roles.viewAny"];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/roles");
  });

  test("visit with user without permission to view roles", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view"];

    await page.goto("/admin/roles");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/roles/);
  });

  test.describe("load roles", () => {
    test("loading state", async ({ page, roles }) => {
      const rolesRequest = await mockMethod(page, "GET", "**/api/v1/roles*", {
        json: roles,
        hold: true,
      });

      await page.goto("/admin/roles");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();

      const search = page.getByTestId("role-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(page.getByTestId("roles-add-button")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = page.waitForResponse("**/api/v1/roles?*");
      rolesRequest.release();
      await response;

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("role-item")).toHaveCount(3);
      await expect(page.getByTestId("roles-add-button")).toHaveCount(0);
    });

    test("breadcrumb", async ({ page }) => {
      await page.goto("/admin/roles");

      await expect(page.getByTestId("admin-breadcrumb")).toBeVisible();
      await expect(page.getByTestId("admin-breadcrumb")).toContainText(
        "admin.breadcrumbs.roles.index",
      );
    });

    test("table headers", async ({ page }) => {
      await page.goto("/admin/roles");

      await expect(page.getByTestId("role-header-cell")).toHaveCount(1);
      await expect(page.getByTestId("role-header-cell").nth(0)).toHaveText(
        "app.model_name",
      );
    });

    test("roles are displayed", async ({ page }) => {
      await page.goto("/admin/roles");

      const items = page.getByTestId("role-item");
      await expect(items).toHaveCount(3);

      const cell = (index) => items.nth(index).getByTestId("role-item-cell");
      await expect(cell(0)).toContainText("Superuser");
      await expect(cell(0)).toContainText("admin.roles.superuser");
      await expect(cell(1)).toContainText("Staff");
      await expect(cell(1)).not.toContainText("admin.roles.superuser");
      await expect(cell(2)).toContainText("Students");
      await expect(cell(2)).not.toContainText("admin.roles.superuser");
    });
  });

  test.describe("load roles errors", () => {
    test("error on initial load can be retried", async ({ page, roles }) => {
      await mockMethod(page, "GET", "**/api/v1/roles*", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/roles");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Overlay is shown, but the search is not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("role-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();

      await mockMethod(page, "GET", "**/api/v1/roles*", { json: roles });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      const items = page.getByTestId("role-item");
      await expect(items).toHaveCount(3);
      await expect(items.nth(0)).toContainText("Superuser");
      await expect(items.nth(0)).toContainText("admin.roles.superuser");
      await expect(items.nth(1)).toContainText("Staff");
      await expect(items.nth(2)).toContainText("Students");
    });

    test.describe("error on page change", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/roles");
        await expect(page.getByTestId("role-item")).toHaveCount(3);

        await mockMethod(page, "GET", "**/api/v1/roles*", {
          status: 500,
          json: { message: "Test" },
        });
      });

      test("error is shown and loading can be retried", async ({ page }) => {
        const request = page.waitForRequest("**/api/v1/roles?*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(queryOf(await request)).toMatchObject({ page: "2" });

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(page.getByTestId("overlay")).toBeVisible();
        const search = page.getByTestId("role-search");
        await expect(search.locator("input")).toBeVisible();
        await expect(search.locator("button")).toBeVisible();
        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();

        await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      });

      test("retry resets to the first page", async ({ page, roles }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        roles.data = roles.data.slice(0, 1);
        Object.assign(roles.meta, { last_page: 1, per_page: 1, to: 1 });
        await mockMethod(page, "GET", "**/api/v1/roles*", { json: roles });

        const retryButton = page.getByTestId("loading-retry-button");
        await expect(retryButton).toHaveText("app.reload");
        const request = page.waitForRequest("**/api/v1/roles?*");
        await retryButton.click();
        expect(queryOf(await request)).toMatchObject({ page: "1" });

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(retryButton).toHaveCount(0);

        await expect(page.getByTestId("role-item")).toHaveCount(1);
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "Superuser",
        );
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "admin.roles.superuser",
        );
        await expectActivePage(page, 0);
      });

      test("401 on page change redirects to login", async ({ page }) => {
        await mockMethod(page, "GET", "**/api/v1/roles*", {
          status: 401,
          json: {},
        });

        await page.getByTestId("paginator-next-button").nth(1).click();

        await expectLoginRedirect(page, "/admin/roles");
      });
    });

    test("401 on visit redirects to login", async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/roles*", {
        status: 401,
        json: {},
      });

      await page.goto("/admin/roles");

      await expectLoginRedirect(page, "/admin/roles");
    });
  });

  test("page out of bounds is reset to the first page", async ({
    page,
    roles,
  }) => {
    const all = readFixture("roles.json");
    roles.data = all.data.slice(0, 1);
    roles.meta = { ...all.meta, last_page: 2, per_page: 1, to: 1, total: 2 };

    await page.goto("/admin/roles");
    await expect(page.getByTestId("role-item")).toHaveCount(1);

    // Page 2 is empty, afterwards the page is reset to page 1
    const emptyPage = {
      data: [],
      meta: {
        ...all.meta,
        current_page: 2,
        last_page: 1,
        from: null,
        per_page: 2,
        to: null,
        total: 2,
        total_no_filter: 2,
      },
    };
    const resetPage = {
      data: all.data.slice(0, 2),
      meta: { ...all.meta, per_page: 2, to: 2, total: 2, total_no_filter: 2 },
    };
    const queries = [];
    await page.route("**/api/v1/roles?*", (route) => {
      queries.push(queryOf(route.request()));
      return route.fulfill({
        json: queries.length === 1 ? emptyPage : resetPage,
      });
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    await expect.poll(() => queries.length).toBe(2);
    expect(queries[0]).toMatchObject({ page: "2" });
    expect(queries[1]).toMatchObject({ page: "1" });

    await expect(page.getByTestId("role-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("role search", () => {
    test("initial request has no query", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/roles?*");
      await page.goto("/admin/roles");
      const query = queryOf(await request);

      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
      await expect(
        page.getByTestId("role-search").locator("input"),
      ).toHaveValue("");
    });

    test("no roles found for search query", async ({ page, roles }) => {
      await page.goto("/admin/roles");
      await expect(page.getByTestId("role-item")).toHaveCount(3);

      roles.data = [];
      Object.assign(roles.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
      });

      await page.getByTestId("role-search").locator("input").fill("Test");
      const request = page.waitForRequest("**/api/v1/roles?*");
      await page.getByTestId("role-search").locator("button").click();
      const query = queryOf(await request);
      expect(query).toMatchObject({ query: "Test", page: "1" });

      await expect(
        page.getByText("admin.roles.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("role-item")).toHaveCount(0);
    });

    test("no roles available, search with enter key", async ({
      page,
      roles,
    }) => {
      await page.goto("/admin/roles");
      await expect(page.getByTestId("role-item")).toHaveCount(3);

      roles.data = [];
      Object.assign(roles.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
        total_no_filter: 0,
      });

      const input = page.getByTestId("role-search").locator("input");
      await input.fill("Test2");
      const request = page.waitForRequest("**/api/v1/roles?*");
      await input.press("Enter");
      const query = queryOf(await request);
      expect(query).toMatchObject({ query: "Test2", page: "1" });

      await expect(
        page.getByText("admin.roles.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("role-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page, roles }) => {
        await page.goto("/admin/roles");
        await expect(page.getByTestId("role-item")).toHaveCount(3);

        roles.data = roles.data.slice(0, 1);
        Object.assign(roles.meta, {
          last_page: 2,
          per_page: 1,
          to: 1,
          total: 2,
        });

        await page.getByTestId("role-search").locator("input").fill("e");
        const request = page.waitForRequest("**/api/v1/roles?*");
        await page.getByTestId("role-search").locator("button").click();
        const query = queryOf(await request);
        expect(query).toMatchObject({ query: "e", page: "1" });
      });

      test("shows matching roles and pagination", async ({ page }) => {
        await expect(page.getByTestId("role-item")).toHaveCount(1);
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "Superuser",
        );
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "admin.roles.superuser",
        );
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays after changing the page", async ({
        page,
        roles,
      }) => {
        const all = readFixture("roles.json");
        roles.data = all.data.slice(1, 2);
        roles.meta = {
          ...all.meta,
          current_page: 2,
          from: 2,
          last_page: 2,
          per_page: 1,
          to: 2,
          total: 2,
        };

        const request = page.waitForRequest("**/api/v1/roles?*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = queryOf(await request);
        expect(query).toMatchObject({ query: "e", page: "2" });

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("role-search").locator("input"),
        ).toHaveValue("e");
        await expect(page.getByTestId("role-item")).toHaveCount(1);
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "Staff",
        );
      });

      test("page is reset when the search query changes", async ({
        page,
        roles,
      }) => {
        const all = readFixture("roles.json");
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        roles.data = all.data.slice(1, 2);
        roles.meta = {
          ...all.meta,
          current_page: 2,
          from: 2,
          last_page: 2,
          per_page: 1,
          to: 2,
          total: 2,
        };
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        roles.data = all.data.slice(0, 1);
        roles.meta = {
          ...all.meta,
          last_page: 2,
          per_page: 1,
          to: 1,
          total: 2,
        };

        const input = page.getByTestId("role-search").locator("input");
        await input.fill("o");
        const request = page.waitForRequest("**/api/v1/roles?*");
        await page.getByTestId("role-search").locator("button").click();
        const query = queryOf(await request);
        expect(query).toMatchObject({ query: "o", page: "1" });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sort roles", () => {
    test.beforeEach(async ({ currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
      ];
    });

    test("initial sorting and sortable columns", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/roles?*");
      await page.goto("/admin/roles");
      expect(queryOf(await request)).toMatchObject({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });

      const headers = page.getByTestId("role-header-cell");
      await expect(headers).toHaveCount(2);
      await expect(headers.nth(0)).toHaveText("app.model_name");
      await expect(headers.nth(0)).toHaveAttribute(
        "data-p-sortable-column",
        "true",
      );
      await expect(headers.nth(0)).toHaveAttribute("data-p-sorted", "true");
      await expect(headers.nth(0)).toHaveAttribute("aria-sort", "ascending");
      await expect(headers.nth(1)).toHaveText("app.actions");
      await expect(headers.nth(1)).not.toHaveAttribute(
        "data-p-sortable-column",
        "true",
      );
    });

    test.describe("after loading", () => {
      test.beforeEach(async ({ page, roles }) => {
        await page.goto("/admin/roles");
        await expect(page.getByTestId("role-item")).toHaveCount(3);

        roles.data = roles.data.slice(0, 1);
        Object.assign(roles.meta, { last_page: 3, per_page: 1, to: 1 });
      });

      test("change sorting direction", async ({ page }) => {
        const header = page.getByTestId("role-header-cell").nth(0);
        const request = page.waitForRequest("**/api/v1/roles?*");
        await header.click();
        const query = queryOf(await request);
        expect(query).toMatchObject({
          page: "1",
          sort_by: "name",
          sort_direction: "desc",
        });

        await expect(header).toHaveAttribute("data-p-sorted", "true");
        await expect(header).toHaveAttribute("aria-sort", "descending");
        await expect(page.getByTestId("role-item")).toHaveCount(1);
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "Superuser",
        );
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "admin.roles.superuser",
        );
        await expectActivePage(page, 0);
      });

      test("sorting stays after changing the page", async ({ page, roles }) => {
        const header = page.getByTestId("role-header-cell").nth(0);
        await header.click();
        await expect(header).toHaveAttribute("aria-sort", "descending");

        const all = readFixture("roles.json");
        roles.data = all.data.slice(1, 2);
        roles.meta = {
          ...all.meta,
          last_page: 3,
          per_page: 1,
          current_page: 2,
          from: 2,
          to: 2,
        };

        const request = page.waitForRequest("**/api/v1/roles?*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = queryOf(await request);
        expect(query).toMatchObject({
          page: "2",
          sort_by: "name",
          sort_direction: "desc",
        });

        await expectActivePage(page, 1);
        await expect(header).toHaveAttribute("data-p-sorted", "true");
        await expect(header).toHaveAttribute("aria-sort", "descending");
        await expect(page.getByTestId("role-item")).toHaveCount(1);
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "Staff",
        );
      });

      test("page is reset when the sorting changes", async ({
        page,
        roles,
      }) => {
        const header = page.getByTestId("role-header-cell").nth(0);
        await header.click();
        await expect(header).toHaveAttribute("aria-sort", "descending");

        const all = readFixture("roles.json");
        roles.data = all.data.slice(1, 2);
        roles.meta = {
          ...all.meta,
          last_page: 3,
          per_page: 1,
          current_page: 2,
          from: 2,
          to: 2,
        };
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        roles.data = all.data.slice(0, 1);
        roles.meta = { ...all.meta, last_page: 3, per_page: 1, to: 1 };
        const request = page.waitForRequest("**/api/v1/roles?*");
        await header.click();
        const query = queryOf(await request);
        expect(query).toMatchObject({
          page: "1",
          sort_by: "name",
          sort_direction: "asc",
        });

        await expectActivePage(page, 0);
        await expect(header).toHaveAttribute("data-p-sorted", "true");
        await expect(header).toHaveAttribute("aria-sort", "ascending");
        await expect(page.getByTestId("role-item")).toHaveCount(1);
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "Superuser",
        );
        await expect(page.getByTestId("role-item").nth(0)).toContainText(
          "admin.roles.superuser",
        );
      });
    });
  });

  test.describe("button visibility", () => {
    const view = ["admin.view", "roles.viewAny", "roles.view"];
    const update = [...view, "roles.update"];
    const create = [...update, "roles.create"];
    const remove = [...create, "roles.delete"];

    // Superuser role (id 1) can never be deleted, not even by a superuser
    const cases = [
      {
        name: "view permission",
        permissions: view,
        superuser: true,
        add: false,
        edit: false,
        deletable: [false, false, false],
      },
      {
        name: "update permission",
        permissions: update,
        superuser: true,
        add: false,
        edit: true,
        deletable: [false, false, false],
      },
      {
        name: "add permission",
        permissions: create,
        superuser: true,
        add: true,
        edit: true,
        deletable: [false, false, false],
      },
      {
        name: "delete permission",
        permissions: remove,
        superuser: true,
        add: true,
        edit: true,
        deletable: [false, true, true],
      },
      {
        name: "delete permission as user that is no superuser",
        permissions: remove,
        superuser: false,
        add: true,
        edit: true,
        deletable: [false, true, true],
      },
    ];

    for (const testCase of cases) {
      test(`with ${testCase.name}`, async ({ page, currentUser }) => {
        currentUser.data.superuser = testCase.superuser;
        currentUser.data.permissions = testCase.permissions;

        await page.goto("/admin/roles");

        await expect(page.getByTestId("role-item")).toHaveCount(3);

        if (testCase.add) {
          await expect(page.getByTestId("roles-add-button")).toBeVisible();
          await expect(page.getByTestId("roles-add-button")).toHaveAttribute(
            "href",
            "/admin/roles/new",
          );
        } else {
          await expect(page.getByTestId("roles-add-button")).toHaveCount(0);
        }

        for (const index of [0, 1, 2]) {
          const id = index + 1;
          const row = page.getByTestId("role-item").nth(index);
          await expect(row.getByTestId("roles-view-button")).toBeVisible();
          await expect(row.getByTestId("roles-view-button")).toHaveAttribute(
            "href",
            `/admin/roles/${id}`,
          );
          if (testCase.edit) {
            await expect(row.getByTestId("roles-edit-button")).toBeVisible();
            await expect(row.getByTestId("roles-edit-button")).toHaveAttribute(
              "href",
              `/admin/roles/${id}/edit`,
            );
          } else {
            await expect(row.getByTestId("roles-edit-button")).toHaveCount(0);
          }
          if (testCase.deletable[index]) {
            await expect(row.getByTestId("roles-delete-button")).toBeVisible();
          } else {
            await expect(row.getByTestId("roles-delete-button")).toHaveCount(0);
          }
        }
      });
    }
  });

  test("loading state during reload", async ({ page, currentUser, roles }) => {
    currentUser.data.superuser = false;
    currentUser.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "roles.view",
      "roles.update",
      "roles.create",
      "roles.delete",
    ];

    await page.goto("/admin/roles");
    await expect(page.getByTestId("role-item")).toHaveCount(3);

    const rolesRequest = await mockMethod(page, "GET", "**/api/v1/roles*", {
      json: roles,
      hold: true,
    });

    // Trigger reload by triggering search
    await page.getByTestId("role-search").locator("button").click();

    await expect(page.getByTestId("overlay")).toBeVisible();
    const search = page.getByTestId("role-search");
    await expect(search.locator("input")).toBeVisible();
    await expect(search.locator("button")).toBeVisible();
    await expect(search.locator("input")).toBeDisabled();
    await expect(search.locator("button")).toBeDisabled();
    await expect(page.getByTestId("roles-add-button")).toBeEnabled();

    const row = page.getByTestId("role-item").nth(1);
    await expect(
      row.locator('button[data-test="roles-view-button"]'),
    ).toBeDisabled();
    await expect(
      row.locator('button[data-test="roles-edit-button"]'),
    ).toBeDisabled();
    await expect(row.getByTestId("roles-delete-button")).toBeDisabled();

    const response = page.waitForResponse("**/api/v1/roles?*");
    rolesRequest.release();
    await response;

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expect(search.locator("input")).toBeVisible();
    await expect(search.locator("button")).toBeVisible();
    await expect(search.locator("input")).toBeEnabled();
    await expect(search.locator("button")).toBeEnabled();
    await expect(page.getByTestId("roles-add-button")).toBeEnabled();

    await expect(row.locator('a[data-test="roles-view-button"]')).toBeVisible();
    await expect(
      row.locator('a[data-test="roles-view-button"]'),
    ).toHaveAttribute("href", "/admin/roles/2");
    await expect(row.locator('a[data-test="roles-edit-button"]')).toBeVisible();
    await expect(
      row.locator('a[data-test="roles-edit-button"]'),
    ).toHaveAttribute("href", "/admin/roles/2/edit");
    await expect(row.getByTestId("roles-delete-button")).toBeEnabled();
  });
});
