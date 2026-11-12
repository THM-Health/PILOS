import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { holdRequest, expectActivePage, queryOf } from "../support/utils.js";

const USERS_PATH = "/api/v1/users";
const ROLES_PATH = "/api/v1/roles";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const isUsersRequest = (request) =>
  request.method() === "GET" && new URL(request.url()).pathname === USERS_PATH;

const isRolesRequest = (request) =>
  request.method() === "GET" && new URL(request.url()).pathname === ROLES_PATH;

function onePage(users, pageNumber, lastPage, meta = {}) {
  const index = pageNumber - 1;
  users.data = users.data.slice(index, index + 1);
  Object.assign(users.meta, {
    current_page: pageNumber,
    from: pageNumber,
    last_page: lastPage,
    per_page: 1,
    to: pageNumber,
    ...meta,
  });
}

function noUsersFound(users) {
  users.data = [];
  Object.assign(users.meta, {
    from: null,
    per_page: 1,
    to: null,
    total: 0,
  });
}

function noUsersAvailable(users) {
  noUsersFound(users);
  users.meta.total_no_filter = 0;
}

async function mockUsers(page, mutate = () => {}) {
  const users = readFixture("users.json");
  mutate(users);
  await page.route(
    (url) => url.pathname === USERS_PATH,
    (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      return route.fulfill({ json: users });
    },
  );
}

function mockUsersError(page, status, body) {
  return page.route(
    (url) => url.pathname === USERS_PATH,
    (route) => route.fulfill({ status, json: body }),
  );
}

async function mockRoles(page, body = readFixture("roles.json")) {
  await page.route(
    (url) => url.pathname === ROLES_PATH,
    (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      return route.fulfill({ json: body });
    },
  );
}

function mockRolesError(page, status, body) {
  return page.route(
    (url) => url.pathname === ROLES_PATH,
    (route) => route.fulfill({ status, json: body }),
  );
}

const secondRolesPage = {
  data: [
    {
      id: 4,
      name: "Dean",
      default: false,
      updated_at: "2021-01-08T15:51:08.000000Z",
      model_name: "Role",
      room_limit: 20,
    },
    {
      id: 5,
      name: "Faculty",
      default: false,
      updated_at: "2021-03-19T09:12:44.000000Z",
      model_name: "Role",
      room_limit: 20,
    },
    {
      id: 6,
      name: "Manager",
      default: false,
      updated_at: "2021-05-22T11:55:21.000000Z",
      model_name: "Role",
      room_limit: -1,
    },
  ],
  meta: {
    current_page: 2,
    from: 4,
    last_page: 2,
    per_page: 3,
    to: 6,
    total: 6,
  },
};

async function requestUsersAfter(page, action) {
  const request = page.waitForRequest(isUsersRequest);
  await action();
  return queryOf(await request);
}

async function requestRolesAfter(page, action) {
  const request = page.waitForRequest(isRolesRequest);
  await action();
  return queryOf(await request);
}

// there are two paginator components (first one for small devices, second one for larger devices)

async function expectSingleUser(page, name) {
  await expect(page.getByTestId("user-item")).toHaveCount(1);
  await expect(page.getByTestId("user-item")).toContainText(name);
}

async function expectFiltersDisabled(page, disabled) {
  if (disabled) {
    await expect(
      page.getByTestId("user-search").locator("input"),
    ).toBeDisabled();
    await expect(
      page.getByTestId("user-search").locator("button"),
    ).toBeDisabled();
    await expect(page.getByTestId("role-dropdown")).toHaveClass(
      /multiselect--disabled/,
    );
  } else {
    await expect(
      page.getByTestId("user-search").locator("input"),
    ).toBeEnabled();
    await expect(
      page.getByTestId("user-search").locator("button"),
    ).toBeEnabled();
    await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
      /multiselect--disabled/,
    );
  }
  await expect(page.getByTestId("user-search").locator("input")).toBeVisible();
  await expect(page.getByTestId("user-search").locator("button")).toBeVisible();
  await expect(
    page.getByTestId("role-dropdown").locator(".multiselect__tags"),
  ).toContainText("admin.users.role_filter");
}

async function expectRoleOptions(page, names) {
  await expect(page.locator(".multiselect__content")).toBeVisible();
  const options = page.locator(".multiselect__option");
  await expect(options).toHaveCount(5);
  for (const [index, name] of names.entries()) {
    await expect(options.nth(index)).toContainText(name);
    await expect(options.nth(index)).toBeVisible();
  }
  await expect(options.nth(3)).toContainText(
    "No elements found. Consider changing the search query.",
  );
  await expect(options.nth(3)).toBeHidden();
  await expect(options.nth(4)).toContainText("admin.roles.no_data");
  await expect(options.nth(4)).toBeHidden();
}

async function openRoleDropdown(page) {
  await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
    /multiselect--disabled/,
  );
  await page.getByTestId("role-dropdown").click();
}

async function expectUserActions(page, index, expected) {
  const row = page.getByTestId("user-item").nth(index);
  const view = row.getByTestId("users-view-button");
  const edit = row.getByTestId("users-edit-button");

  if (expected.view) {
    await expect(view).toBeVisible();
    await expect(view).toHaveAttribute("href", expected.view);
  } else {
    await expect(view).toHaveCount(0);
  }
  if (expected.edit) {
    await expect(edit).toBeVisible();
    await expect(edit).toHaveAttribute("href", expected.edit);
  } else {
    await expect(edit).toHaveCount(0);
  }
  for (const [testId, shown] of [
    ["users-delete-button", expected.delete],
    ["users-reset-password-button", expected.reset],
  ]) {
    if (shown) {
      await expect(row.getByTestId(testId)).toBeVisible();
    } else {
      await expect(row.getByTestId(testId)).toHaveCount(0);
    }
  }
}

const viewOf = (id) => `/admin/users/${id}`;
const editOf = (id) => `/admin/users/${id}/edit`;

test.describe("Admin users index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, config, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "roles.viewAny",
    ];
    config.data.auth.local = true;

    await mockUsers(page);
    await mockRoles(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/users");
  });

  test("visit with user without permission to view users", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view"];

    await page.goto("/admin/users");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test.describe("load users", () => {
    test("loading state", async ({ page }) => {
      const release = await holdRequest(
        page,
        (url) => url.pathname === USERS_PATH,
        { json: readFixture("users.json") },
      );

      await page.goto("/admin/users");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expectFiltersDisabled(page, true);
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("users-add-button")).toHaveCount(0);

      const request = page.waitForResponse((response) =>
        isUsersRequest(response.request()),
      );
      release();
      await request;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectFiltersDisabled(page, false);
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-add-button")).toHaveCount(0);
    });

    test("breadcrumb", async ({ page }) => {
      await page.goto("/admin/users");

      await expect(page.getByTestId("admin-breadcrumb")).toContainText(
        "admin.breadcrumbs.users.index",
      );
    });

    test("headers", async ({ page }) => {
      await page.goto("/admin/users");

      const headers = [
        "app.id",
        "admin.users.image.title_short",
        "app.firstname",
        "app.lastname",
        "admin.users.email",
        "admin.users.authenticator.title",
        "admin.users.last_login.title",
        "app.roles",
        "app.actions",
      ];
      await expect(page.getByTestId("user-header-cell")).toHaveCount(
        headers.length,
      );
      for (const [index, text] of headers.entries()) {
        await expect(
          page.getByTestId("user-header-cell").nth(index),
        ).toHaveText(text);
      }
    });

    const expectedUsers = [
      {
        index: 0,
        id: "1",
        avatar: "img",
        firstname: "John",
        lastname: "Doe",
        email: "JohnDoe@domain.tld",
        authenticator: "admin.users.authenticator.local",
        lastLogin: "01/01/2020, 02:00",
        roles: "Superuser",
      },
      {
        index: 1,
        id: "2",
        avatar: "LR",
        firstname: "Laura",
        lastname: "Rivera",
        email: "LauraWRivera@domain.tld",
        authenticator: "admin.users.authenticator.local",
        lastLogin: "admin.users.last_login.unknown",
        roles: "StudentsStaff",
      },
      {
        index: 2,
        id: "3",
        avatar: "JW",
        firstname: "Juan",
        lastname: "Walter",
        email: "JuanMWalter@domain.tld",
        authenticator: "admin.users.authenticator.ldap",
        lastLogin: "admin.users.last_login.unknown",
        roles: "Students",
      },
      {
        index: 3,
        id: "100",
        avatar: "MD",
        firstname: "Max",
        lastname: "Doe",
        email: "MaxDoe@domain.tld",
        authenticator: "admin.users.authenticator.local",
        lastLogin: "admin.users.last_login.unknown",
        roles: "Superuser",
      },
    ];

    for (const user of expectedUsers) {
      test(`user ${user.id} is displayed correctly`, async ({ page }) => {
        await page.goto("/admin/users");

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        const cells = page
          .getByTestId("user-item")
          .nth(user.index)
          .getByTestId("user-item-cell");
        await expect(cells).toHaveCount(9);

        await expect(cells.nth(0)).toHaveText(user.id);
        if (user.avatar === "img") {
          await expect(cells.nth(1).locator("img")).toHaveAttribute(
            "src",
            "test.jpg",
          );
        } else {
          await expect(cells.nth(1)).toContainText(user.avatar);
        }
        await expect(cells.nth(2)).toHaveText(user.firstname);
        await expect(cells.nth(3)).toHaveText(user.lastname);
        await expect(cells.nth(4)).toHaveText(user.email);
        await expect(cells.nth(5)).toHaveText(user.authenticator);
        await expect(cells.nth(6)).toHaveText(user.lastLogin);
        await expect(cells.nth(7)).toHaveText(user.roles);
      });
    }

    test("only view and edit button of the current user are shown", async ({
      page,
    }) => {
      await page.goto("/admin/users");

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
      await expectUserActions(page, 1, {});
      await expectUserActions(page, 2, {});
      await expectUserActions(page, 3, {});
    });
  });

  test.describe("load users errors", () => {
    test("error on initial load can be retried", async ({ page }) => {
      await mockUsersError(page, 500, { message: "Test" });

      await page.goto("/admin/users");

      await expectToastAndClose(page, [
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);

      // Check that overlay is shown and components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectFiltersDisabled(page, false);

      await mockUsers(page, (users) => onePage(users, 1, 3));

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await requestUsersAfter(page, () => retryButton.click());

      // Check that overlay gets hidden
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      await expectSingleUser(page, "John");
    });

    test.describe("error on page change", () => {
      test.beforeEach(async ({ page }) => {
        await mockUsers(page, (users) => onePage(users, 1, 3));
        await page.goto("/admin/users");
        await expectSingleUser(page, "John");

        await mockUsersError(page, 500, { message: "Test" });
        const query = await requestUsersAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query.page).toBe("2");
      });

      test("shows error and components are not disabled", async ({ page }) => {
        await expectToastAndClose(page, [
          `app.flash.server_error.message_{"message":"${"Test"}"}`,
          `app.flash.server_error.error_code_{"statusCode":${500}}`,
        ]);

        await expect(page.getByTestId("overlay")).toBeVisible();
        await expectFiltersDisabled(page, false);
      });

      test("retry reloads the first page", async ({ page }) => {
        await expectToastAndClose(page, [
          `app.flash.server_error.message_{"message":"${"Test"}"}`,
          `app.flash.server_error.error_code_{"statusCode":${500}}`,
        ]);

        await mockUsers(page, (users) => onePage(users, 1, 4));

        const retryButton = page.getByTestId("loading-retry-button");
        await expect(retryButton).toContainText("app.reload");
        const query = await requestUsersAfter(page, () => retryButton.click());
        expect(query.page).toBe("1");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(retryButton).toHaveCount(0);

        await expectSingleUser(page, "John");
        await expect(page.getByTestId("paginator-page")).toHaveCount(4);
        await expectActivePage(page, 0);
      });

      test("redirects to login on 401", async ({ page }) => {
        await expectToastAndClose(page, [
          `app.flash.server_error.message_{"message":"${"Test"}"}`,
          `app.flash.server_error.error_code_{"statusCode":${500}}`,
        ]);

        await mockUsersError(page, 401);
        await requestUsersAfter(page, () =>
          page.getByTestId("loading-retry-button").click(),
        );

        await expectLoginRedirect(page, "/admin/users");
      });
    });

    test("redirects to login on 401 when changing the page", async ({
      page,
    }) => {
      await mockUsers(page, (users) => onePage(users, 1, 3));
      await page.goto("/admin/users");
      await expectSingleUser(page, "John");

      await mockUsersError(page, 401);
      await requestUsersAfter(page, () =>
        page.getByTestId("paginator-next-button").nth(1).click(),
      );

      await expectLoginRedirect(page, "/admin/users");
    });

    test("redirects to login on 401 when loading the page", async ({
      page,
    }) => {
      await mockUsersError(page, 401);

      await page.goto("/admin/users");

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test("load users page out of bounds", async ({ page }) => {
    await mockUsers(page, (users) =>
      onePage(users, 1, 2, { total: 2, current_page: 1 }),
    );

    await page.goto("/admin/users");
    await expectSingleUser(page, "John");

    // Switch to next page but respond with no users on the second page, afterwards the first page is loaded
    const users = readFixture("users.json");
    const emptyPage = readFixture("users.json");
    emptyPage.data = [];
    Object.assign(emptyPage.meta, {
      current_page: 2,
      from: null,
      per_page: 2,
      to: null,
      total: 2,
      total_no_filter: 2,
    });
    users.data = users.data.slice(0, 2);
    Object.assign(users.meta, {
      per_page: 2,
      to: 2,
      total: 2,
      total_no_filter: 2,
    });

    const pages = [];
    await page.route(
      (url) => url.pathname === USERS_PATH,
      (route) => {
        pages.push(queryOf(route.request()).page);
        return route.fulfill({ json: pages.length === 1 ? emptyPage : users });
      },
    );

    await page.getByTestId("paginator-next-button").nth(1).click();

    // The first request is for page 2, the second one for the reset page 1
    await expect.poll(() => pages).toEqual(["2", "1"]);

    await expect(page.getByTestId("user-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("load roles errors", () => {
    test("roles are disabled while loading", async ({ page }) => {
      const release = await holdRequest(
        page,
        (url) => url.pathname === ROLES_PATH,
        { status: 500, json: { message: "Test" } },
      );

      await page.goto("/admin/users");

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      release();

      await expectToastAndClose(page, [
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
    });

    test("reload roles after error", async ({ page }) => {
      await mockRolesError(page, 500, { message: "Test" });

      await page.goto("/admin/users");

      await expectToastAndClose(page, [
        `app.flash.server_error.message_{"message":"${"Test"}"}`,
        `app.flash.server_error.error_code_{"statusCode":${500}}`,
      ]);
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      await mockRoles(page);
      await requestRolesAfter(page, () =>
        page.getByTestId("roles-reload-button").click(),
      );

      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
      await openRoleDropdown(page);
      await expectRoleOptions(page, ["Superuser", "Staff", "Students"]);
    });

    test.describe("error on role page change", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(4);

        await openRoleDropdown(page);
        await expectRoleOptions(page, ["Superuser", "Staff", "Students"]);
      });

      test("closes and disables the dropdown", async ({ page }) => {
        await mockRolesError(page, 500, { message: "Test" });

        await requestRolesAfter(page, () =>
          page
            .locator(".multiselect__content")
            .getByTestId("next-page-button")
            .click(),
        );

        await expectToastAndClose(page, [
          `app.flash.server_error.message_{"message":"${"Test"}"}`,
          `app.flash.server_error.error_code_{"statusCode":${500}}`,
        ]);

        await expect(page.locator(".multiselect__content")).toBeHidden();
        await expect(
          page.getByTestId("role-dropdown").locator(".multiselect__tags"),
        ).toContainText("admin.users.role_filter");
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );
      });

      test("reload roles after error", async ({ page }) => {
        await mockRolesError(page, 500, { message: "Test" });
        await requestRolesAfter(page, () =>
          page
            .locator(".multiselect__content")
            .getByTestId("next-page-button")
            .click(),
        );
        await expectToastAndClose(page, [
          `app.flash.server_error.message_{"message":"${"Test"}"}`,
          `app.flash.server_error.error_code_{"statusCode":${500}}`,
        ]);
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );

        await mockRoles(page);
        await requestRolesAfter(page, () =>
          page.getByTestId("roles-reload-button").click(),
        );

        await expect(
          page.getByTestId("role-dropdown").locator(".multiselect__tags"),
        ).toContainText("admin.users.role_filter");
        await openRoleDropdown(page);
        await expectRoleOptions(page, ["Superuser", "Staff", "Students"]);
      });

      test("redirects to login on 401", async ({ page }) => {
        await mockRolesError(page, 401);

        await requestRolesAfter(page, () =>
          page
            .locator(".multiselect__content")
            .getByTestId("next-page-button")
            .click(),
        );

        await expectLoginRedirect(page, "/admin/users");
      });
    });

    test("redirects to login on 401 when loading the roles", async ({
      page,
    }) => {
      await mockRolesError(page, 401);

      await page.goto("/admin/users");

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("user search", () => {
    test("initial request has no search query", async ({ page }) => {
      const request = page.waitForRequest(isUsersRequest);
      await page.goto("/admin/users");
      const query = queryOf(await request);

      expect(query.query).toBeUndefined();
      expect(query.page).toBe("1");
      await expect(
        page.getByTestId("user-search").locator("input"),
      ).toHaveValue("");
    });

    test("search with button, no users found", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);

      await mockUsers(page, noUsersFound);

      await page.getByTestId("user-search").locator("input").fill("Test");
      const query = await requestUsersAfter(page, () =>
        page.getByTestId("user-search").locator("button").click(),
      );
      expect(query.query).toBe("Test");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.users.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("user-item")).toHaveCount(0);
    });

    test("search with enter, no users available", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);

      await mockUsers(page, noUsersAvailable);

      await page.getByTestId("user-search").locator("input").fill("Test2");
      const query = await requestUsersAfter(page, () =>
        page.getByTestId("user-search").locator("input").press("Enter"),
      );
      expect(query.query).toBe("Test2");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.users.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("admin.users.no_data_filtered")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("user-item")).toHaveCount(0);
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(4);

        await mockUsers(page, (users) => onePage(users, 1, 2, { total: 2 }));
        await page.getByTestId("user-search").locator("input").fill("e");
        const query = await requestUsersAfter(page, () =>
          page.getByTestId("user-search").locator("button").click(),
        );
        expect(query.query).toBe("e");
        expect(query.page).toBe("1");

        await expectSingleUser(page, "John");
      });

      test("shows pagination", async ({ page }) => {
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same after changing the page", async ({
        page,
      }) => {
        await mockUsers(page, (users) => onePage(users, 2, 2, { total: 2 }));

        const query = await requestUsersAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query.query).toBe("e");
        expect(query.page).toBe("2");

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("user-search").locator("input"),
        ).toHaveValue("e");
        await expectSingleUser(page, "Laura");
      });

      test("changing the search query resets the page", async ({ page }) => {
        await mockUsers(page, (users) => onePage(users, 2, 2, { total: 2 }));
        await requestUsersAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);
        await expectSingleUser(page, "Laura");

        await mockUsers(page, (users) => onePage(users, 1, 2, { total: 2 }));
        await page.getByTestId("user-search").locator("input").fill("o");
        const query = await requestUsersAfter(page, () =>
          page.getByTestId("user-search").locator("button").click(),
        );
        expect(query.query).toBe("o");
        expect(query.page).toBe("1");

        await expectActivePage(page, 0);
        await expectSingleUser(page, "John");
      });
    });
  });

  test.describe("filter users", () => {
    test("initial request has no role filter", async ({ page }) => {
      const request = page.waitForRequest(isUsersRequest);
      await page.goto("/admin/users");
      const query = queryOf(await request);

      expect(query.role).toBeUndefined();
      expect(query.page).toBe("1");

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.locator(".multiselect__content")).toBeHidden();
      await expect(page.getByTestId("clear-roles-button")).toHaveCount(0);
    });

    test("shows the roles as options", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);

      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
      await openRoleDropdown(page);

      await expectRoleOptions(page, ["Superuser", "Staff", "Students"]);
    });

    test("filter by role, no users found", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await openRoleDropdown(page);
      await expectRoleOptions(page, ["Superuser", "Staff", "Students"]);

      await mockUsers(page, noUsersFound);
      const query = await requestUsersAfter(page, () =>
        page.locator(".multiselect__option").nth(1).click(),
      );
      expect(query.role).toBe("2");
      expect(query.page).toBe("1");

      await expect(page.locator(".multiselect__content")).toBeHidden();
      await expect(
        page.getByText("admin.users.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("user-item")).toHaveCount(0);

      // Check that the role is shown and can be cleared
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("Staff");
      await expect(page.getByTestId("clear-roles-button")).toBeVisible();
    });

    test("filter by another role, no users available", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await openRoleDropdown(page);
      await mockUsers(page, noUsersFound);
      await requestUsersAfter(page, () =>
        page.locator(".multiselect__option").nth(1).click(),
      );
      await expect(
        page.getByText("admin.users.no_data_filtered"),
      ).toBeVisible();

      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__tags")
        .click();
      await expect(page.getByTestId("clear-roles-button")).toBeVisible();

      await mockUsers(page, noUsersAvailable);
      const query = await requestUsersAfter(page, () =>
        page.locator(".multiselect__option").nth(2).click(),
      );
      expect(query.role).toBe("3");
      expect(query.page).toBe("1");

      await expect(page.locator(".multiselect__content")).toBeHidden();
      await expect(
        page.getByText("admin.users.no_data", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("admin.users.no_data_filtered")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("user-item")).toHaveCount(0);
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("Students");
      await expect(page.getByTestId("clear-roles-button")).toBeVisible();
    });

    test.describe("with multiple role pages", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await openRoleDropdown(page);
        await expectRoleOptions(page, ["Superuser", "Staff", "Students"]);
      });

      test("loading state of the role pagination", async ({ page }) => {
        await expect(
          page
            .locator(".multiselect__content")
            .getByTestId("previous-page-button"),
        ).toContainText("app.previous_page");
        await expect(
          page
            .locator(".multiselect__content")
            .getByTestId("previous-page-button"),
        ).toBeDisabled();
        await expect(
          page.locator(".multiselect__content").getByTestId("next-page-button"),
        ).toContainText("app.next_page");
        await expect(
          page.locator(".multiselect__content").getByTestId("next-page-button"),
        ).toBeEnabled();

        const release = await holdRequest(
          page,
          (url) => url.pathname === ROLES_PATH,
          { json: secondRolesPage },
        );
        await page
          .locator(".multiselect__content")
          .getByTestId("next-page-button")
          .click();

        // Check loading
        await expect(
          page
            .locator(".multiselect__content")
            .getByTestId("previous-page-button"),
        ).toBeDisabled();
        await expect(
          page.locator(".multiselect__content").getByTestId("next-page-button"),
        ).toBeDisabled();

        const response = page.waitForResponse((r) =>
          isRolesRequest(r.request()),
        );
        release();
        await response;

        await expect(page.locator(".multiselect__content")).toBeVisible();
        await expect(
          page
            .locator(".multiselect__content")
            .getByTestId("previous-page-button"),
        ).toBeEnabled();
        await expect(
          page.locator(".multiselect__content").getByTestId("next-page-button"),
        ).toBeDisabled();
      });

      test("shows the roles of the next page", async ({ page }) => {
        await mockRoles(page, secondRolesPage);
        await requestRolesAfter(page, () =>
          page
            .locator(".multiselect__content")
            .getByTestId("next-page-button")
            .click(),
        );

        await expectRoleOptions(page, ["Dean", "Faculty", "Manager"]);
      });

      test.describe("with role of the next page selected", () => {
        test.beforeEach(async ({ page }) => {
          await mockRoles(page, secondRolesPage);
          await requestRolesAfter(page, () =>
            page
              .locator(".multiselect__content")
              .getByTestId("next-page-button")
              .click(),
          );
          await expectRoleOptions(page, ["Dean", "Faculty", "Manager"]);

          await mockUsers(page, (users) => {
            onePage(users, 1, 4);
            users.data[0].roles = [{ id: 4, name: "Dean", automatic: false }];
          });
          const query = await requestUsersAfter(page, () =>
            page.locator(".multiselect__option").nth(0).click(),
          );
          expect(query.role).toBe("4");
          expect(query.page).toBe("1");

          await expect(page.locator(".multiselect__content")).toBeHidden();
          await expectSingleUser(page, "John");
        });

        test("shows role and pagination", async ({ page }) => {
          await expect(
            page.getByTestId("role-dropdown").locator(".multiselect__tags"),
          ).toContainText("Dean");
          await expect(page.getByTestId("clear-roles-button")).toBeVisible();

          await expect(page.getByTestId("paginator-page")).toHaveCount(4);
          await expectActivePage(page, 0);
        });

        test("role stays the same after changing the page", async ({
          page,
        }) => {
          await mockUsers(page, (users) => onePage(users, 2, 4));

          const query = await requestUsersAfter(page, () =>
            page.getByTestId("paginator-next-button").nth(1).click(),
          );
          expect(query.role).toBe("4");
          expect(query.page).toBe("2");

          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("role-dropdown").locator(".multiselect__tags"),
          ).toContainText("Dean");
          await expect(page.getByTestId("clear-roles-button")).toBeVisible();
          await expectSingleUser(page, "Laura");
        });

        test("clearing the role resets the page", async ({ page }) => {
          await mockUsers(page, (users) => onePage(users, 2, 4));
          await requestUsersAfter(page, () =>
            page.getByTestId("paginator-next-button").nth(1).click(),
          );
          await expectActivePage(page, 1);
          await expectSingleUser(page, "Laura");

          await mockUsers(page, (users) => onePage(users, 1, 4));
          const query = await requestUsersAfter(page, () =>
            page.getByTestId("clear-roles-button").click(),
          );
          expect(query.role).toBeUndefined();
          expect(query.page).toBe("1");

          await expectActivePage(page, 0);
          await expect(
            page.getByTestId("role-dropdown").locator(".multiselect__tags"),
          ).toContainText("admin.users.role_filter");
          await expect(page.getByTestId("clear-roles-button")).toHaveCount(0);
        });
      });
    });
  });

  test.describe("sort users", () => {
    const sortedColumns = [
      { index: 2, text: "app.firstname", field: "firstname" },
      { index: 3, text: "app.lastname", field: "lastname" },
      { index: 4, text: "admin.users.email", field: "email" },
      {
        index: 5,
        text: "admin.users.authenticator.title",
        field: "authenticator",
      },
    ];

    test("initial sorting", async ({ page }) => {
      const request = page.waitForRequest(isUsersRequest);
      await page.goto("/admin/users");
      const query = queryOf(await request);

      expect(query.page).toBe("1");
      expect(query.sort_by).toBe("id");
      expect(query.sort_direction).toBe("asc");

      // Check that correct columns are sortable and correct sorting type is shown
      const headers = [
        ["app.id", true, true],
        ["admin.users.image.title_short", false],
        ["app.firstname", true, false],
        ["app.lastname", true, false],
        ["admin.users.email", true, false],
        ["admin.users.authenticator.title", true, false],
        ["admin.users.last_login.title", true, false],
        ["app.roles", false],
        ["app.actions", false],
      ];
      await expect(page.getByTestId("user-header-cell")).toHaveCount(
        headers.length,
      );
      for (const [index, [text, sortable, sorted]] of headers.entries()) {
        const cell = page.getByTestId("user-header-cell").nth(index);
        await expect(cell).toHaveText(text);
        if (sortable) {
          await expect(cell).toHaveAttribute("data-p-sortable-column", "true");
          await expect(cell).toHaveAttribute("data-p-sorted", String(sorted));
        } else {
          await expect(cell).not.toHaveAttribute(
            "data-p-sortable-column",
            "true",
          );
        }
      }
    });

    test.describe("with multiple pages", () => {
      test.beforeEach(async ({ page }) => {
        await mockUsers(page, (users) => onePage(users, 1, 4));
        await page.goto("/admin/users");
        await expectSingleUser(page, "John");
      });

      for (const column of sortedColumns) {
        test(`sort by ${column.field}`, async ({ page }) => {
          const query = await requestUsersAfter(page, () =>
            page.getByTestId("user-header-cell").nth(column.index).click(),
          );
          expect(query.page).toBe("1");
          expect(query.sort_by).toBe(column.field);
          expect(query.sort_direction).toBe("asc");

          // Check that sorting is correct
          await expect(
            page.getByTestId("user-header-cell").nth(0),
          ).toHaveAttribute("data-p-sorted", "false");
          await expect(
            page.getByTestId("user-header-cell").nth(column.index),
          ).toHaveAttribute("data-p-sorted", "true");
          await expect(
            page.getByTestId("user-header-cell").nth(column.index),
          ).toHaveAttribute("aria-sort", "ascending");

          await expectSingleUser(page, "John");
          await expect(page.getByTestId("paginator-page")).toHaveCount(4);
          await expectActivePage(page, 0);
        });
      }

      test("sorting stays the same after changing the page", async ({
        page,
      }) => {
        await requestUsersAfter(page, () =>
          page.getByTestId("user-header-cell").nth(2).click(),
        );
        await expect(
          page.getByTestId("user-header-cell").nth(2),
        ).toHaveAttribute("data-p-sorted", "true");

        await mockUsers(page, (users) => onePage(users, 2, 4));
        const query = await requestUsersAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(query.sort_by).toBe("firstname");
        expect(query.sort_direction).toBe("asc");
        expect(query.page).toBe("2");

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("user-header-cell").nth(2),
        ).toHaveAttribute("data-p-sorted", "true");
        await expect(
          page.getByTestId("user-header-cell").nth(2),
        ).toHaveAttribute("aria-sort", "ascending");
        await expectSingleUser(page, "Laura");
      });

      test("changing the sort direction resets the page", async ({ page }) => {
        await requestUsersAfter(page, () =>
          page.getByTestId("user-header-cell").nth(2).click(),
        );
        await mockUsers(page, (users) => onePage(users, 2, 4));
        await requestUsersAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        await expectActivePage(page, 1);
        await expectSingleUser(page, "Laura");

        await mockUsers(page, (users) => onePage(users, 1, 4));
        const query = await requestUsersAfter(page, () =>
          page.getByTestId("user-header-cell").nth(2).click(),
        );
        expect(query.sort_by).toBe("firstname");
        expect(query.sort_direction).toBe("desc");
        expect(query.page).toBe("1");

        await expectActivePage(page, 0);
        await expect(
          page.getByTestId("user-header-cell").nth(2),
        ).toHaveAttribute("data-p-sorted", "true");
        await expect(
          page.getByTestId("user-header-cell").nth(2),
        ).toHaveAttribute("aria-sort", "descending");
        await expectSingleUser(page, "John");
      });

      test("changing the sort column resets the page", async ({ page }) => {
        await requestUsersAfter(page, () =>
          page.getByTestId("user-header-cell").nth(3).click(),
        );
        await mockUsers(page, (users) => onePage(users, 2, 4));
        const pageQuery = await requestUsersAfter(page, () =>
          page.getByTestId("paginator-next-button").nth(1).click(),
        );
        expect(pageQuery.sort_by).toBe("lastname");
        expect(pageQuery.sort_direction).toBe("asc");
        expect(pageQuery.page).toBe("2");

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("user-header-cell").nth(3),
        ).toHaveAttribute("aria-sort", "ascending");
        await expectSingleUser(page, "Laura");

        await mockUsers(page, (users) => onePage(users, 1, 4));
        const query = await requestUsersAfter(page, () =>
          page.getByTestId("user-header-cell").nth(4).click(),
        );
        expect(query.sort_by).toBe("email");
        expect(query.sort_direction).toBe("asc");
        expect(query.page).toBe("1");

        await expectActivePage(page, 0);
        await expect(
          page.getByTestId("user-header-cell").nth(3),
        ).toHaveAttribute("data-p-sorted", "false");
        await expect(
          page.getByTestId("user-header-cell").nth(4),
        ).toHaveAttribute("data-p-sorted", "true");
        await expect(
          page.getByTestId("user-header-cell").nth(4),
        ).toHaveAttribute("aria-sort", "ascending");
        await expectSingleUser(page, "John");
      });
    });
  });

  test.describe("button visibility", () => {
    test("with view permission", async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "roles.viewAny",
      ];

      const request = page.waitForRequest(isUsersRequest);
      await page.goto("/admin/users");
      await request;

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
      await expectUserActions(page, 1, { view: viewOf(2) });
      await expectUserActions(page, 2, { view: viewOf(3) });
      await expectUserActions(page, 3, { view: viewOf(100) });
      await expect(page.getByTestId("users-add-button")).toHaveCount(0);
    });

    test.describe("with update permission", () => {
      test.beforeEach(async ({ currentUser }) => {
        currentUser.data.permissions = [
          "admin.view",
          "users.viewAny",
          "users.view",
          "users.update",
          "roles.viewAny",
        ];
      });

      test("local users enabled", async ({ page }) => {
        await page.goto("/admin/users");

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
        await expectUserActions(page, 1, {
          view: viewOf(2),
          edit: editOf(2),
          reset: true,
        });
        await expectUserActions(page, 2, { view: viewOf(3), edit: editOf(3) });
        await expectUserActions(page, 3, {
          view: viewOf(100),
          edit: editOf(100),
          reset: true,
        });
        await expect(page.getByTestId("users-add-button")).toHaveCount(0);
      });

      test("local users disabled", async ({ page, config }) => {
        // Reset password button should not be visible
        config.data.auth.local = false;

        await page.goto("/admin/users");

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
        await expectUserActions(page, 1, { view: viewOf(2), edit: editOf(2) });
        await expectUserActions(page, 2, { view: viewOf(3), edit: editOf(3) });
        await expectUserActions(page, 3, {
          view: viewOf(100),
          edit: editOf(100),
        });
        await expect(page.getByTestId("users-add-button")).toHaveCount(0);
      });
    });

    test.describe("with add permission", () => {
      test.beforeEach(async ({ currentUser }) => {
        currentUser.data.permissions = [
          "admin.view",
          "users.viewAny",
          "users.view",
          "users.update",
          "users.create",
          "roles.viewAny",
        ];
      });

      test("local users enabled", async ({ page }) => {
        const request = page.waitForRequest(isUsersRequest);
        await page.goto("/admin/users");
        await request;

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await expect(page.getByTestId("users-add-button")).toBeVisible();
        await expect(page.getByTestId("users-add-button")).toHaveAttribute(
          "href",
          "/admin/users/new",
        );
        await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
        await expectUserActions(page, 1, {
          view: viewOf(2),
          edit: editOf(2),
          reset: true,
        });
        await expectUserActions(page, 2, { view: viewOf(3), edit: editOf(3) });
        await expectUserActions(page, 3, {
          view: viewOf(100),
          edit: editOf(100),
          reset: true,
        });
      });

      test("local users disabled", async ({ page, config }) => {
        // Neither the add button nor the reset password button should be visible
        config.data.auth.local = false;

        await page.goto("/admin/users");

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await expect(page.getByTestId("users-add-button")).toHaveCount(0);
        await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
        await expectUserActions(page, 1, { view: viewOf(2), edit: editOf(2) });
        await expectUserActions(page, 2, { view: viewOf(3), edit: editOf(3) });
        await expectUserActions(page, 3, {
          view: viewOf(100),
          edit: editOf(100),
        });
      });
    });

    test("with delete permission", async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];

      const request = page.waitForRequest(isUsersRequest);
      await page.goto("/admin/users");
      await request;

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-add-button")).toBeVisible();
      // Check that delete button for current user does not exist
      await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
      await expectUserActions(page, 1, {
        view: viewOf(2),
        edit: editOf(2),
        delete: true,
        reset: true,
      });
      await expectUserActions(page, 2, {
        view: viewOf(3),
        edit: editOf(3),
        delete: true,
      });
      await expectUserActions(page, 3, {
        view: viewOf(100),
        edit: editOf(100),
        delete: true,
        reset: true,
      });
    });

    test("for user that is no superuser", async ({ page, currentUser }) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];

      const request = page.waitForRequest(isUsersRequest);
      await page.goto("/admin/users");
      await request;

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-add-button")).toBeVisible();
      // Check that delete button for current user does not exist
      await expectUserActions(page, 0, { view: viewOf(1), edit: editOf(1) });
      await expectUserActions(page, 1, {
        view: viewOf(2),
        edit: editOf(2),
        delete: true,
        reset: true,
      });
      await expectUserActions(page, 2, {
        view: viewOf(3),
        edit: editOf(3),
        delete: true,
      });
      // Superusers can not be changed by other users
      await expectUserActions(page, 3, { view: viewOf(100) });
    });
  });

  test.describe("loading state during reload", () => {
    test.beforeEach(async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];

      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
    });

    test("components are disabled while reloading", async ({ page }) => {
      const release = await holdRequest(
        page,
        (url) => url.pathname === USERS_PATH,
        { json: readFixture("users.json") },
      );

      // Trigger reload by triggering search
      await page.getByTestId("user-search").locator("button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectFiltersDisabled(page, true);
      await expect(page.getByTestId("users-add-button")).toBeEnabled();

      const row = page.getByTestId("user-item").nth(1);
      await expect(
        row.locator('button[data-test="users-view-button"]'),
      ).toBeDisabled();
      await expect(
        row.locator('button[data-test="users-edit-button"]'),
      ).toBeDisabled();
      await expect(row.getByTestId("users-delete-button")).toBeDisabled();
      await expect(
        row.getByTestId("users-reset-password-button"),
      ).toBeDisabled();

      const response = page.waitForResponse((r) => isUsersRequest(r.request()));
      release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectFiltersDisabled(page, false);
      await expect(page.getByTestId("users-add-button")).toBeEnabled();

      await expect(
        row.locator('a[data-test="users-view-button"]'),
      ).toHaveAttribute("href", "/admin/users/2");
      await expect(
        row.locator('a[data-test="users-edit-button"]'),
      ).toHaveAttribute("href", "/admin/users/2/edit");
      await expect(row.getByTestId("users-delete-button")).toBeEnabled();
      await expect(
        row.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
    });
  });
});
