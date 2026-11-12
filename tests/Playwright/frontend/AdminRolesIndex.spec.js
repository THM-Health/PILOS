import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { holdRequest, expectActivePage, queryOf } from "../support/utils.js";

const ROLES_PATH = "/api/v1/roles";

const readRoles = () =>
  JSON.parse(readFileSync("tests/Playwright/fixtures/roles.json", "utf8"));

const isRolesRequest = (request) =>
  request.method() === "GET" && new URL(request.url()).pathname === ROLES_PATH;

/**
 * Answer GET requests of the roles list, later mocks win.
 */
async function mockRoles(page, { status = 200, json = readRoles() } = {}) {
  await page.route(
    (url) => url.pathname === ROLES_PATH,
    (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status, json })
        : route.fallback(),
  );
}

/**
 * Roles response with only the given roles of the fixture
 */
function rolesPage(slice, meta = {}) {
  const roles = readRoles();
  roles.data = roles.data.slice(...slice);
  Object.assign(roles.meta, meta);
  return roles;
}

const noRolesFound = () =>
  rolesPage([0, 0], { from: null, per_page: 1, to: null, total: 0 });

const serverError = { message: "Test" };
const serverErrorTexts = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

async function expectRolesRequestAfter(page, action) {
  const request = page.waitForRequest(isRolesRequest);
  await action();
  return queryOf(await request);
}

async function expectSearchDisabled(page, disabled) {
  const search = page.getByTestId("role-search");
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

async function expectRoleActions(page, index, { view, edit, remove }) {
  const row = page.getByTestId("role-item").nth(index);
  await expect(row.getByTestId("roles-view-button")).toBeVisible();
  await expect(row.getByTestId("roles-view-button")).toHaveAttribute(
    "href",
    view,
  );
  if (edit) {
    await expect(row.getByTestId("roles-edit-button")).toBeVisible();
    await expect(row.getByTestId("roles-edit-button")).toHaveAttribute(
      "href",
      edit,
    );
  } else {
    await expect(row.getByTestId("roles-edit-button")).toHaveCount(0);
  }
  if (remove) {
    await expect(row.getByTestId("roles-delete-button")).toBeVisible();
  } else {
    await expect(row.getByTestId("roles-delete-button")).toHaveCount(0);
  }
}

// Two paginator components exist (small devices, larger devices), the second one is used (nth(1))
test.describe("Admin roles index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = ["admin.view", "roles.viewAny"];
    await mockRoles(page);
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
    test("loading state", async ({ page }) => {
      const release = await holdRequest(
        page,
        (url) => url.pathname === ROLES_PATH,
        { json: readRoles() },
      );

      await page.goto("/admin/roles");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expectSearchDisabled(page, true);
      await expect(page.getByTestId("roles-add-button")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = page.waitForResponse((r) => isRolesRequest(r.request()));
      release();
      await response;

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectSearchDisabled(page, false);
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
    test("error on initial load can be retried", async ({ page }) => {
      await mockRoles(page, { status: 500, json: serverError });

      await page.goto("/admin/roles");

      await expectToastAndClose(page, serverErrorTexts);

      // Overlay is shown, but the search is not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectSearchDisabled(page, false);

      await mockRoles(page);

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

        await mockRoles(page, { status: 500, json: serverError });
      });

      test("error is shown and loading can be retried", async ({ page }) => {
        const query = await expectRolesRequestAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query).toMatchObject({ page: "2" });

        await expectToastAndClose(page, serverErrorTexts);

        await expect(page.getByTestId("overlay")).toBeVisible();
        await expectSearchDisabled(page, false);
        await expect(page.getByTestId("loading-retry-button")).toBeVisible();
      });

      test("retry resets to the first page", async ({ page }) => {
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectToastAndClose(page, serverErrorTexts);

        await mockRoles(page, {
          json: rolesPage([0, 1], { last_page: 1, per_page: 1, to: 1 }),
        });

        const retryButton = page.getByTestId("loading-retry-button");
        await expect(retryButton).toHaveText("app.reload");
        const query = await expectRolesRequestAfter(page, () =>
          retryButton.click(),
        );
        expect(query).toMatchObject({ page: "1" });

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
        await mockRoles(page, { status: 401, json: {} });

        await page.getByTestId("paginator-next-button").nth(1).click();

        await expectLoginRedirect(page, "/admin/roles");
      });
    });

    test("401 on visit redirects to login", async ({ page }) => {
      await mockRoles(page, { status: 401, json: {} });

      await page.goto("/admin/roles");

      await expectLoginRedirect(page, "/admin/roles");
    });
  });

  test("page out of bounds is reset to the first page", async ({ page }) => {
    await mockRoles(page, {
      json: rolesPage([0, 1], {
        last_page: 2,
        per_page: 1,
        to: 1,
        total: 2,
      }),
    });

    await page.goto("/admin/roles");
    await expect(page.getByTestId("role-item")).toHaveCount(1);

    // Page 2 is empty, afterwards the page is reset to page 1
    const emptyPage = rolesPage([0, 0], {
      current_page: 2,
      last_page: 1,
      from: null,
      per_page: 2,
      to: null,
      total: 2,
      total_no_filter: 2,
    });
    const resetPage = rolesPage([0, 2], {
      per_page: 2,
      to: 2,
      total: 2,
      total_no_filter: 2,
    });
    const queries = [];
    await page.route(
      (url) => url.pathname === ROLES_PATH,
      (route) => {
        queries.push(queryOf(route.request()));
        return route.fulfill({
          json: queries.length === 1 ? emptyPage : resetPage,
        });
      },
    );

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
      const request = page.waitForRequest(isRolesRequest);
      await page.goto("/admin/roles");
      const query = queryOf(await request);

      expect(query.query).toBeUndefined();
      expect(query).toMatchObject({ page: "1" });
      await expect(
        page.getByTestId("role-search").locator("input"),
      ).toHaveValue("");
    });

    test("no roles found for search query", async ({ page }) => {
      await page.goto("/admin/roles");
      await expect(page.getByTestId("role-item")).toHaveCount(3);

      await mockRoles(page, { json: noRolesFound() });

      await page.getByTestId("role-search").locator("input").fill("Test");
      const query = await expectRolesRequestAfter(page, () =>
        page.getByTestId("role-search").locator("button").click(),
      );
      expect(query).toMatchObject({ query: "Test", page: "1" });

      await expect(
        page.getByText("admin.roles.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("role-item")).toHaveCount(0);
    });

    test("no roles available, search with enter key", async ({ page }) => {
      await page.goto("/admin/roles");
      await expect(page.getByTestId("role-item")).toHaveCount(3);

      const noRoles = noRolesFound();
      noRoles.meta.total_no_filter = 0;
      await mockRoles(page, { json: noRoles });

      const input = page.getByTestId("role-search").locator("input");
      await input.fill("Test2");
      const query = await expectRolesRequestAfter(page, () =>
        input.press("Enter"),
      );
      expect(query).toMatchObject({ query: "Test2", page: "1" });

      await expect(
        page.getByText("admin.roles.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("role-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/roles");
        await expect(page.getByTestId("role-item")).toHaveCount(3);

        await mockRoles(page, {
          json: rolesPage([0, 1], {
            last_page: 2,
            per_page: 1,
            to: 1,
            total: 2,
          }),
        });

        await page.getByTestId("role-search").locator("input").fill("e");
        const query = await expectRolesRequestAfter(page, () =>
          page.getByTestId("role-search").locator("button").click(),
        );
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

      test("search query stays after changing the page", async ({ page }) => {
        await mockRoles(page, {
          json: rolesPage([1, 2], {
            current_page: 2,
            from: 2,
            last_page: 2,
            per_page: 1,
            to: 2,
            total: 2,
          }),
        });

        const query = await expectRolesRequestAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
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

      test("page is reset when the search query changes", async ({ page }) => {
        await mockRoles(page, {
          json: rolesPage([1, 2], {
            current_page: 2,
            from: 2,
            last_page: 2,
            per_page: 1,
            to: 2,
            total: 2,
          }),
        });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        await mockRoles(page, {
          json: rolesPage([0, 1], {
            last_page: 2,
            per_page: 1,
            to: 1,
            total: 2,
          }),
        });

        const input = page.getByTestId("role-search").locator("input");
        await input.fill("o");
        const query = await expectRolesRequestAfter(page, () =>
          page.getByTestId("role-search").locator("button").click(),
        );
        expect(query).toMatchObject({ query: "o", page: "1" });

        await expectActivePage(page, 0);
      });
    });
  });

  test.describe("sort roles", () => {
    const sortedPage = (rolesSlice, meta) =>
      rolesPage(rolesSlice, { last_page: 3, per_page: 1, ...meta });

    test.beforeEach(async ({ currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
      ];
    });

    test("initial sorting and sortable columns", async ({ page }) => {
      const request = page.waitForRequest(isRolesRequest);
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
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/roles");
        await expect(page.getByTestId("role-item")).toHaveCount(3);

        await mockRoles(page, {
          json: sortedPage([0, 1], { to: 1 }),
        });
      });

      test("change sorting direction", async ({ page }) => {
        const header = page.getByTestId("role-header-cell").nth(0);
        const query = await expectRolesRequestAfter(page, () => header.click());
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

      test("sorting stays after changing the page", async ({ page }) => {
        const header = page.getByTestId("role-header-cell").nth(0);
        await header.click();
        await expect(header).toHaveAttribute("aria-sort", "descending");

        await mockRoles(page, {
          json: sortedPage([1, 2], { current_page: 2, from: 2, to: 2 }),
        });

        const query = await expectRolesRequestAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
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

      test("page is reset when the sorting changes", async ({ page }) => {
        const header = page.getByTestId("role-header-cell").nth(0);
        await header.click();
        await expect(header).toHaveAttribute("aria-sort", "descending");

        await mockRoles(page, {
          json: sortedPage([1, 2], { current_page: 2, from: 2, to: 2 }),
        });
        await page.getByTestId("paginator-next-button").nth(1).click();
        await expectActivePage(page, 1);

        await mockRoles(page, { json: sortedPage([0, 1], { to: 1 }) });
        const query = await expectRolesRequestAfter(page, () => header.click());
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
          await expectRoleActions(page, index, {
            view: `/admin/roles/${id}`,
            edit: testCase.edit ? `/admin/roles/${id}/edit` : null,
            remove: testCase.deletable[index],
          });
        }
      });
    }
  });

  test("loading state during reload", async ({ page, currentUser }) => {
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

    const release = await holdRequest(
      page,
      (url) => url.pathname === ROLES_PATH,
      { json: readRoles() },
    );

    // Trigger reload by triggering search
    await page.getByTestId("role-search").locator("button").click();

    await expect(page.getByTestId("overlay")).toBeVisible();
    await expectSearchDisabled(page, true);
    await expect(page.getByTestId("roles-add-button")).toBeEnabled();

    const row = page.getByTestId("role-item").nth(1);
    await expect(
      row.locator('button[data-test="roles-view-button"]'),
    ).toBeDisabled();
    await expect(
      row.locator('button[data-test="roles-edit-button"]'),
    ).toBeDisabled();
    await expect(row.getByTestId("roles-delete-button")).toBeDisabled();

    const response = page.waitForResponse((r) => isRolesRequest(r.request()));
    release();
    await response;

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expectSearchDisabled(page, false);
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
