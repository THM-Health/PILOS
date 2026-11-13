import { mergeTests } from "@playwright/test";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { test as sessionControllerTest } from "../support/fixtures/sessionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectMultiselectOptions } from "../support/admin.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  expectActivePage,
  holdApiRequest,
  mockApiRequest,
  getRequestQuery,
  serverError,
} from "../support/utils.js";

const test = mergeTests(
  userControllerTest,
  roleControllerTest,
  timezonesTest,
  sessionControllerTest,
);

test.use({ authenticated: true });

test.describe("Admin users index", () => {
  test.beforeEach(async ({ currentUserResponse, configResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "users.viewAny",
      "roles.viewAny",
    ];
    configResponse.data.auth.local = true;
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/users");
  });

  test("visit with user without permission to view users", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = ["admin.view"];

    await page.goto("/admin/users");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test.describe("load users", () => {
    test("loading state", async ({ page, usersResponse, getUsersApiMock }) => {
      getUsersApiMock.respondWith({ json: usersResponse, hold: true });

      await page.goto("/admin/users");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      const search = page.getByTestId("user-search");
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("users-add-button")).toHaveCount(0);

      const response = page.waitForResponse("**/api/v1/users*");
      getUsersApiMock.release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
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
      const [john, ...others] = await page.getByTestId("user-item").all();

      await expect(john.getByTestId("users-view-button")).toBeVisible();
      await expect(john.getByTestId("users-view-button")).toHaveAttribute(
        "href",
        "/admin/users/1",
      );
      await expect(john.getByTestId("users-edit-button")).toBeVisible();
      await expect(john.getByTestId("users-edit-button")).toHaveAttribute(
        "href",
        "/admin/users/1/edit",
      );
      await expect(john.getByTestId("users-delete-button")).toHaveCount(0);
      await expect(john.getByTestId("users-reset-password-button")).toHaveCount(
        0,
      );

      for (const row of others) {
        await expect(row.getByTestId("users-view-button")).toHaveCount(0);
        await expect(row.getByTestId("users-edit-button")).toHaveCount(0);
        await expect(row.getByTestId("users-delete-button")).toHaveCount(0);
        await expect(
          row.getByTestId("users-reset-password-button"),
        ).toHaveCount(0);
      }
    });
  });

  test.describe("load users errors", () => {
    test("error on initial load can be retried", async ({
      page,
      usersResponse,
      getUsersApiMock,
    }) => {
      getUsersApiMock.respondWith(serverError());

      await page.goto("/admin/users");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that overlay is shown and components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("user-search");
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");

      getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 3 });
      const getUsersRequestsAfterChange = getUsersApiMock.respondWith({
        json: usersResponse,
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toContainText("app.reload");
      await retryButton.click();
      await getUsersRequestsAfterChange.waitForRequest();

      // Check that overlay gets hidden
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);

      await expect(page.getByTestId("user-item")).toHaveCount(1);
      await expect(page.getByTestId("user-item")).toContainText("John");
    });

    test.describe("error on page change", () => {
      test.beforeEach(async ({ page, getUsersApiMock }) => {
        getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 3 });
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");

        const getUsersRequestsAfterChange =
          getUsersApiMock.respondWith(serverError());
        await page.getByTestId("paginator-next-button").nth(1).click();
        expect(
          getRequestQuery(await getUsersRequestsAfterChange.waitForRequest())
            .page,
        ).toBe("2");
      });

      test("shows error and components are not disabled", async ({ page }) => {
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(page.getByTestId("overlay")).toBeVisible();
        const search = page.getByTestId("user-search");
        await expect(search.locator("input")).toBeEnabled();
        await expect(search.locator("button")).toBeEnabled();
        await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
        await expect(search.locator("input")).toBeVisible();
        await expect(search.locator("button")).toBeVisible();
        await expect(
          page.getByTestId("role-dropdown").locator(".multiselect__tags"),
        ).toContainText("admin.users.role_filter");
      });

      test("retry reloads the first page", async ({
        page,
        usersResponse,
        getUsersApiMock,
      }) => {
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 4 });
        const getUsersRequestsAfterChange = getUsersApiMock.respondWith({
          json: usersResponse,
        });

        const retryButton = page.getByTestId("loading-retry-button");
        await expect(retryButton).toContainText("app.reload");
        await retryButton.click();
        expect(
          getRequestQuery(await getUsersRequestsAfterChange.waitForRequest())
            .page,
        ).toBe("1");

        await expect(page.getByTestId("overlay")).toBeHidden();
        await expect(retryButton).toHaveCount(0);

        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");
        await expect(page.getByTestId("paginator-page")).toHaveCount(4);
        await expectActivePage(page, 0);
      });

      test("redirects to login on 401", async ({ page, getUsersApiMock }) => {
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        const getUsersRequestsAfterChange = getUsersApiMock.respondWith({
          status: 401,
        });
        await page.getByTestId("loading-retry-button").click();
        await getUsersRequestsAfterChange.waitForRequest();

        await expectLoginRedirect(page, "/admin/users");
      });
    });

    test("redirects to login on 401 when changing the page", async ({
      page,
      getUsersApiMock,
    }) => {
      getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 3 });
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(1);
      await expect(page.getByTestId("user-item")).toContainText("John");

      const getUsersRequestsAfterChange = getUsersApiMock.respondWith({
        status: 401,
      });
      await page.getByTestId("paginator-next-button").nth(1).click();
      await getUsersRequestsAfterChange.waitForRequest();

      await expectLoginRedirect(page, "/admin/users");
    });

    test("redirects to login on 401 when loading the page", async ({
      page,
      getUsersApiMock,
    }) => {
      getUsersApiMock.respondWith({ status: 401 });

      await page.goto("/admin/users");

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test("load users page out of bounds", async ({
    page,
    usersResponse,
    getUsersApiMock,
  }) => {
    // The first page with all users and an empty second page
    const firstPage = structuredClone(usersResponse);
    firstPage.data = firstPage.data.slice(0, 2);
    Object.assign(firstPage.meta, {
      per_page: 2,
      to: 2,
      total: 2,
      total_no_filter: 2,
    });
    const emptyPage = structuredClone(firstPage);
    emptyPage.data = [];
    Object.assign(emptyPage.meta, { current_page: 2, from: null, to: null });

    getUsersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      meta: { total: 2 },
    });
    await page.goto("/admin/users");
    await expect(page.getByTestId("user-item")).toHaveCount(1);
    await expect(page.getByTestId("user-item")).toContainText("John");

    // Switch to next page but respond with no users on the second page, afterwards the first page is loaded
    const pages = [];
    await page.route("**/api/v1/users*", (route) => {
      pages.push(getRequestQuery(route.request()).page);
      return route.fulfill({
        json: pages.length === 1 ? emptyPage : firstPage,
      });
    });

    await page.getByTestId("paginator-next-button").nth(1).click();

    // The first request is for page 2, the second one for the reset page 1
    await expect.poll(() => pages).toEqual(["2", "1"]);

    await expect(page.getByTestId("user-item")).toHaveCount(2);
    await expect(page.getByTestId("paginator-page")).toHaveCount(1);
    await expectActivePage(page, 0);
  });

  test.describe("load roles errors", () => {
    test("roles are disabled while loading", async ({ page }) => {
      const release = await holdApiRequest(page, "roles*", serverError());

      await page.goto("/admin/users");

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      release();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
    });

    test("reload roles after error", async ({ page, rolesResponse }) => {
      await mockApiRequest(page, "GET", "roles*", serverError());

      await page.goto("/admin/users");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      const getRolesApiMock = await mockApiRequest(page, "GET", "roles*", {
        json: rolesResponse,
      });
      await page.getByTestId("roles-reload-button").click();
      await getRolesApiMock.waitForRequest();

      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expectMultiselectOptions(
        page.locator(".multiselect__content"),
        ["Superuser", "Staff", "Students"],
        "admin.roles.no_data",
      );
    });

    test.describe("error on role page change", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(4);

        await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
        await page.getByTestId("role-dropdown").click();
        await expect(page.locator(".multiselect__content")).toBeVisible();
        await expectMultiselectOptions(
          page.locator(".multiselect__content"),
          ["Superuser", "Staff", "Students"],
          "admin.roles.no_data",
        );
      });

      test("closes and disables the dropdown", async ({ page }) => {
        const getRolesApiMock = await mockApiRequest(
          page,
          "GET",
          "roles*",
          serverError(),
        );

        await page
          .locator(".multiselect__content")
          .getByTestId("next-page-button")
          .click();
        await getRolesApiMock.waitForRequest();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(page.locator(".multiselect__content")).toBeHidden();
        await expect(
          page.getByTestId("role-dropdown").locator(".multiselect__tags"),
        ).toContainText("admin.users.role_filter");
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );
      });

      test("reload roles after error", async ({ page, rolesResponse }) => {
        const getRolesApiMock = await mockApiRequest(
          page,
          "GET",
          "roles*",
          serverError(),
        );
        await page
          .locator(".multiselect__content")
          .getByTestId("next-page-button")
          .click();
        await getRolesApiMock.waitForRequest();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );

        const getRolesApiMock2 = await mockApiRequest(page, "GET", "roles*", {
          json: rolesResponse,
        });
        await page.getByTestId("roles-reload-button").click();
        await getRolesApiMock2.waitForRequest();

        await expect(
          page.getByTestId("role-dropdown").locator(".multiselect__tags"),
        ).toContainText("admin.users.role_filter");
        await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
        await page.getByTestId("role-dropdown").click();
        await expect(page.locator(".multiselect__content")).toBeVisible();
        await expectMultiselectOptions(
          page.locator(".multiselect__content"),
          ["Superuser", "Staff", "Students"],
          "admin.roles.no_data",
        );
      });

      test("redirects to login on 401", async ({ page }) => {
        const getRolesApiMock = await mockApiRequest(page, "GET", "roles*", {
          status: 401,
        });

        await page
          .locator(".multiselect__content")
          .getByTestId("next-page-button")
          .click();
        await getRolesApiMock.waitForRequest();

        await expectLoginRedirect(page, "/admin/users");
      });
    });

    test("redirects to login on 401 when loading the roles", async ({
      page,
    }) => {
      await mockApiRequest(page, "GET", "roles*", { status: 401 });

      await page.goto("/admin/users");

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("user search", () => {
    test("initial request has no search query", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/users*");
      await page.goto("/admin/users");
      const query = getRequestQuery(await request);

      expect(query.query).toBeUndefined();
      expect(query.page).toBe("1");
      await expect(
        page.getByTestId("user-search").locator("input"),
      ).toHaveValue("");
    });

    test("search with button, no users found", async ({
      page,
      usersResponse,
    }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);

      usersResponse.data = [];
      Object.assign(usersResponse.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
      });

      await page.getByTestId("user-search").locator("input").fill("Test");
      const request = page.waitForRequest("**/api/v1/users*");
      await page.getByTestId("user-search").locator("button").click();
      const query = getRequestQuery(await request);
      expect(query.query).toBe("Test");
      expect(query.page).toBe("1");

      await expect(
        page.getByText("admin.users.no_data_filtered"),
      ).toBeVisible();
      await expect(page.getByTestId("user-item")).toHaveCount(0);
    });

    test("search with enter, no users available", async ({
      page,
      usersResponse,
    }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);

      usersResponse.data = [];
      Object.assign(usersResponse.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
        total_no_filter: 0,
      });

      await page.getByTestId("user-search").locator("input").fill("Test2");
      const request = page.waitForRequest("**/api/v1/users*");
      await page.getByTestId("user-search").locator("input").press("Enter");
      const query = getRequestQuery(await request);
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
      test.beforeEach(async ({ page, getUsersApiMock }) => {
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(4);

        getUsersApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 2,
          meta: { total: 2 },
        });
        await page.getByTestId("user-search").locator("input").fill("e");
        const request = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-search").locator("button").click();
        const query = getRequestQuery(await request);
        expect(query.query).toBe("e");
        expect(query.page).toBe("1");

        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");
      });

      test("shows pagination", async ({ page }) => {
        await expect(page.getByTestId("paginator-page")).toHaveCount(2);
        await expectActivePage(page, 0);
      });

      test("search query stays the same after changing the page", async ({
        page,
        getUsersApiMock,
      }) => {
        getUsersApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 2,
          meta: { total: 2 },
        });

        const request = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = getRequestQuery(await request);
        expect(query.query).toBe("e");
        expect(query.page).toBe("2");

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("user-search").locator("input"),
        ).toHaveValue("e");
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("Laura");
      });

      test("changing the search query resets the page", async ({
        page,
        getUsersApiMock,
      }) => {
        getUsersApiMock.respondWithPage({
          currentPage: 2,
          lastPage: 2,
          meta: { total: 2 },
        });
        const nextPageRequest = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        await nextPageRequest;
        await expectActivePage(page, 1);
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("Laura");

        getUsersApiMock.respondWithPage({
          currentPage: 1,
          lastPage: 2,
          meta: { total: 2 },
        });
        await page.getByTestId("user-search").locator("input").fill("o");
        const request = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-search").locator("button").click();
        const query = getRequestQuery(await request);
        expect(query.query).toBe("o");
        expect(query.page).toBe("1");

        await expectActivePage(page, 0);
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");
      });
    });
  });

  test.describe("filter users", () => {
    test("initial request has no role filter", async ({ page }) => {
      const request = page.waitForRequest("**/api/v1/users*");
      await page.goto("/admin/users");
      const query = getRequestQuery(await request);

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
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await page.getByTestId("role-dropdown").click();

      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expectMultiselectOptions(
        page.locator(".multiselect__content"),
        ["Superuser", "Staff", "Students"],
        "admin.roles.no_data",
      );
    });

    test("filter by role, no users found", async ({ page, usersResponse }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expectMultiselectOptions(
        page.locator(".multiselect__content"),
        ["Superuser", "Staff", "Students"],
        "admin.roles.no_data",
      );

      usersResponse.data = [];
      Object.assign(usersResponse.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
      });
      const request = page.waitForRequest("**/api/v1/users*");
      await page.locator(".multiselect__option").nth(1).click();
      const query = getRequestQuery(await request);
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

    test("filter by another role, no users available", async ({
      page,
      usersResponse,
    }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await page.getByTestId("role-dropdown").click();

      usersResponse.data = [];
      Object.assign(usersResponse.meta, {
        from: null,
        per_page: 1,
        to: null,
        total: 0,
      });
      const firstRequest = page.waitForRequest("**/api/v1/users*");
      await page.locator(".multiselect__option").nth(1).click();
      await firstRequest;
      await expect(
        page.getByText("admin.users.no_data_filtered"),
      ).toBeVisible();

      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__tags")
        .click();
      await expect(page.getByTestId("clear-roles-button")).toBeVisible();

      usersResponse.meta.total_no_filter = 0;
      const request = page.waitForRequest("**/api/v1/users*");
      await page.locator(".multiselect__option").nth(2).click();
      const query = getRequestQuery(await request);
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
        await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
        await page.getByTestId("role-dropdown").click();
        await expect(page.locator(".multiselect__content")).toBeVisible();
        await expectMultiselectOptions(
          page.locator(".multiselect__content"),
          ["Superuser", "Staff", "Students"],
          "admin.roles.no_data",
        );
      });

      test("loading state of the role pagination", async ({
        page,
        rolesSecondPageResponse,
      }) => {
        const content = page.locator(".multiselect__content");
        await expect(content.getByTestId("previous-page-button")).toContainText(
          "app.previous_page",
        );
        await expect(
          content.getByTestId("previous-page-button"),
        ).toBeDisabled();
        await expect(content.getByTestId("next-page-button")).toContainText(
          "app.next_page",
        );
        await expect(content.getByTestId("next-page-button")).toBeEnabled();

        const release = await holdApiRequest(page, "roles*", {
          json: rolesSecondPageResponse,
        });
        await content.getByTestId("next-page-button").click();

        // Check loading
        await expect(
          content.getByTestId("previous-page-button"),
        ).toBeDisabled();
        await expect(content.getByTestId("next-page-button")).toBeDisabled();

        const response = page.waitForResponse("**/api/v1/roles*");
        release();
        await response;

        await expect(content).toBeVisible();
        await expect(content.getByTestId("previous-page-button")).toBeEnabled();
        await expect(content.getByTestId("next-page-button")).toBeDisabled();
      });

      test("shows the roles of the next page", async ({
        page,
        rolesSecondPageResponse,
      }) => {
        const getRolesApiMock = await mockApiRequest(page, "GET", "roles*", {
          json: rolesSecondPageResponse,
        });
        await page
          .locator(".multiselect__content")
          .getByTestId("next-page-button")
          .click();
        await getRolesApiMock.waitForRequest();

        await expect(page.locator(".multiselect__content")).toBeVisible();
        await expectMultiselectOptions(
          page.locator(".multiselect__content"),
          ["Dean", "Faculty", "Manager"],
          "admin.roles.no_data",
        );
      });

      test.describe("with role of the next page selected", () => {
        test.beforeEach(
          async ({
            page,
            rolesSecondPageResponse,
            usersResponse,
            getUsersApiMock,
          }) => {
            const getRolesApiMock = await mockApiRequest(
              page,
              "GET",
              "roles*",
              {
                json: rolesSecondPageResponse,
              },
            );
            await page
              .locator(".multiselect__content")
              .getByTestId("next-page-button")
              .click();
            await getRolesApiMock.waitForRequest();
            await expect(page.locator(".multiselect__content")).toBeVisible();
            await expectMultiselectOptions(
              page.locator(".multiselect__content"),
              ["Dean", "Faculty", "Manager"],
              "admin.roles.no_data",
            );

            getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 4 });
            usersResponse.data[0].roles = [
              { id: 4, name: "Dean", automatic: false },
            ];
            const request = page.waitForRequest("**/api/v1/users*");
            await page.locator(".multiselect__option").nth(0).click();
            const query = getRequestQuery(await request);
            expect(query.role).toBe("4");
            expect(query.page).toBe("1");

            await expect(page.locator(".multiselect__content")).toBeHidden();
            await expect(page.getByTestId("user-item")).toHaveCount(1);
            await expect(page.getByTestId("user-item")).toContainText("John");
          },
        );

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
          getUsersApiMock,
        }) => {
          getUsersApiMock.respondWithPage({ currentPage: 2, lastPage: 4 });

          const request = page.waitForRequest("**/api/v1/users*");
          await page.getByTestId("paginator-next-button").nth(1).click();
          const query = getRequestQuery(await request);
          expect(query.role).toBe("4");
          expect(query.page).toBe("2");

          await expectActivePage(page, 1);
          await expect(
            page.getByTestId("role-dropdown").locator(".multiselect__tags"),
          ).toContainText("Dean");
          await expect(page.getByTestId("clear-roles-button")).toBeVisible();
          await expect(page.getByTestId("user-item")).toHaveCount(1);
          await expect(page.getByTestId("user-item")).toContainText("Laura");
        });

        test("clearing the role resets the page", async ({
          page,
          getUsersApiMock,
        }) => {
          getUsersApiMock.respondWithPage({ currentPage: 2, lastPage: 4 });
          const nextPageRequest = page.waitForRequest("**/api/v1/users*");
          await page.getByTestId("paginator-next-button").nth(1).click();
          await nextPageRequest;
          await expectActivePage(page, 1);
          await expect(page.getByTestId("user-item")).toHaveCount(1);
          await expect(page.getByTestId("user-item")).toContainText("Laura");

          getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 4 });
          const request = page.waitForRequest("**/api/v1/users*");
          await page.getByTestId("clear-roles-button").click();
          const query = getRequestQuery(await request);
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
      const request = page.waitForRequest("**/api/v1/users*");
      await page.goto("/admin/users");
      const query = getRequestQuery(await request);

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
      test.beforeEach(async ({ page, getUsersApiMock }) => {
        getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 4 });
        await page.goto("/admin/users");
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");
      });

      for (const column of sortedColumns) {
        test(`sort by ${column.field}`, async ({ page }) => {
          const request = page.waitForRequest("**/api/v1/users*");
          await page.getByTestId("user-header-cell").nth(column.index).click();
          const query = getRequestQuery(await request);
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

          await expect(page.getByTestId("user-item")).toHaveCount(1);
          await expect(page.getByTestId("user-item")).toContainText("John");
          await expect(page.getByTestId("paginator-page")).toHaveCount(4);
          await expectActivePage(page, 0);
        });
      }

      test("sorting stays the same after changing the page", async ({
        page,
        getUsersApiMock,
      }) => {
        const sortRequest = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-header-cell").nth(2).click();
        await sortRequest;
        await expect(
          page.getByTestId("user-header-cell").nth(2),
        ).toHaveAttribute("data-p-sorted", "true");

        getUsersApiMock.respondWithPage({ currentPage: 2, lastPage: 4 });
        const request = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        const query = getRequestQuery(await request);
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
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("Laura");
      });

      test("changing the sort direction resets the page", async ({
        page,
        getUsersApiMock,
      }) => {
        const sortRequest = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-header-cell").nth(2).click();
        await sortRequest;
        getUsersApiMock.respondWithPage({ currentPage: 2, lastPage: 4 });
        const nextPageRequest = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        await nextPageRequest;
        await expectActivePage(page, 1);
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("Laura");

        getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 4 });
        const request = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-header-cell").nth(2).click();
        const query = getRequestQuery(await request);
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
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");
      });

      test("changing the sort column resets the page", async ({
        page,
        getUsersApiMock,
      }) => {
        const sortRequest = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-header-cell").nth(3).click();
        await sortRequest;
        getUsersApiMock.respondWithPage({ currentPage: 2, lastPage: 4 });
        const pageRequest = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("paginator-next-button").nth(1).click();
        const pageQuery = getRequestQuery(await pageRequest);
        expect(pageQuery.sort_by).toBe("lastname");
        expect(pageQuery.sort_direction).toBe("asc");
        expect(pageQuery.page).toBe("2");

        await expectActivePage(page, 1);
        await expect(
          page.getByTestId("user-header-cell").nth(3),
        ).toHaveAttribute("aria-sort", "ascending");
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("Laura");

        getUsersApiMock.respondWithPage({ currentPage: 1, lastPage: 4 });
        const request = page.waitForRequest("**/api/v1/users*");
        await page.getByTestId("user-header-cell").nth(4).click();
        const query = getRequestQuery(await request);
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
        await expect(page.getByTestId("user-item")).toHaveCount(1);
        await expect(page.getByTestId("user-item")).toContainText("John");
      });
    });
  });

  test.describe("button visibility", () => {
    test("with view permission", async ({ page, currentUserResponse }) => {
      currentUserResponse.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "roles.viewAny",
      ];

      const request = page.waitForRequest("**/api/v1/users*");
      await page.goto("/admin/users");
      await request;

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      const [john, laura, juan, max] = await page
        .getByTestId("user-item")
        .all();

      for (const [row, id] of [
        [john, 1],
        [laura, 2],
        [juan, 3],
        [max, 100],
      ]) {
        await expect(row.getByTestId("users-view-button")).toBeVisible();
        await expect(row.getByTestId("users-view-button")).toHaveAttribute(
          "href",
          `/admin/users/${id}`,
        );
        await expect(row.getByTestId("users-delete-button")).toHaveCount(0);
        await expect(
          row.getByTestId("users-reset-password-button"),
        ).toHaveCount(0);
      }
      await expect(john.getByTestId("users-edit-button")).toBeVisible();
      await expect(john.getByTestId("users-edit-button")).toHaveAttribute(
        "href",
        "/admin/users/1/edit",
      );
      for (const row of [laura, juan, max]) {
        await expect(row.getByTestId("users-edit-button")).toHaveCount(0);
      }
      await expect(page.getByTestId("users-add-button")).toHaveCount(0);
    });

    test.describe("with update permission", () => {
      test.beforeEach(async ({ currentUserResponse }) => {
        currentUserResponse.data.permissions = [
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
        const [john, laura, juan, max] = await page
          .getByTestId("user-item")
          .all();

        for (const [row, id] of [
          [john, 1],
          [laura, 2],
          [juan, 3],
          [max, 100],
        ]) {
          await expect(row.getByTestId("users-view-button")).toBeVisible();
          await expect(row.getByTestId("users-view-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}`,
          );
          await expect(row.getByTestId("users-edit-button")).toBeVisible();
          await expect(row.getByTestId("users-edit-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}/edit`,
          );
          await expect(row.getByTestId("users-delete-button")).toHaveCount(0);
        }
        // Reset password is only available for local users that are not the current user
        for (const row of [john, juan]) {
          await expect(
            row.getByTestId("users-reset-password-button"),
          ).toHaveCount(0);
        }
        for (const row of [laura, max]) {
          await expect(
            row.getByTestId("users-reset-password-button"),
          ).toBeVisible();
        }
        await expect(page.getByTestId("users-add-button")).toHaveCount(0);
      });

      test("local users disabled", async ({ page, configResponse }) => {
        // Reset password button should not be visible
        configResponse.data.auth.local = false;

        await page.goto("/admin/users");

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        const rows = await page.getByTestId("user-item").all();

        for (const [index, id] of [1, 2, 3, 100].entries()) {
          const row = rows[index];
          await expect(row.getByTestId("users-view-button")).toBeVisible();
          await expect(row.getByTestId("users-view-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}`,
          );
          await expect(row.getByTestId("users-edit-button")).toBeVisible();
          await expect(row.getByTestId("users-edit-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}/edit`,
          );
          await expect(row.getByTestId("users-delete-button")).toHaveCount(0);
          await expect(
            row.getByTestId("users-reset-password-button"),
          ).toHaveCount(0);
        }
        await expect(page.getByTestId("users-add-button")).toHaveCount(0);
      });
    });

    test.describe("with add permission", () => {
      test.beforeEach(async ({ currentUserResponse }) => {
        currentUserResponse.data.permissions = [
          "admin.view",
          "users.viewAny",
          "users.view",
          "users.update",
          "users.create",
          "roles.viewAny",
        ];
      });

      test("local users enabled", async ({ page }) => {
        const request = page.waitForRequest("**/api/v1/users*");
        await page.goto("/admin/users");
        await request;

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await expect(page.getByTestId("users-add-button")).toBeVisible();
        await expect(page.getByTestId("users-add-button")).toHaveAttribute(
          "href",
          "/admin/users/new",
        );
        const [john, laura, juan, max] = await page
          .getByTestId("user-item")
          .all();

        for (const [row, id] of [
          [john, 1],
          [laura, 2],
          [juan, 3],
          [max, 100],
        ]) {
          await expect(row.getByTestId("users-view-button")).toBeVisible();
          await expect(row.getByTestId("users-view-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}`,
          );
          await expect(row.getByTestId("users-edit-button")).toBeVisible();
          await expect(row.getByTestId("users-edit-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}/edit`,
          );
          await expect(row.getByTestId("users-delete-button")).toHaveCount(0);
        }
        for (const row of [john, juan]) {
          await expect(
            row.getByTestId("users-reset-password-button"),
          ).toHaveCount(0);
        }
        for (const row of [laura, max]) {
          await expect(
            row.getByTestId("users-reset-password-button"),
          ).toBeVisible();
        }
      });

      test("local users disabled", async ({ page, configResponse }) => {
        // Neither the add button nor the reset password button should be visible
        configResponse.data.auth.local = false;

        await page.goto("/admin/users");

        await expect(page.getByTestId("user-item")).toHaveCount(4);
        await expect(page.getByTestId("users-add-button")).toHaveCount(0);
        const rows = await page.getByTestId("user-item").all();

        for (const [index, id] of [1, 2, 3, 100].entries()) {
          const row = rows[index];
          await expect(row.getByTestId("users-view-button")).toBeVisible();
          await expect(row.getByTestId("users-view-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}`,
          );
          await expect(row.getByTestId("users-edit-button")).toBeVisible();
          await expect(row.getByTestId("users-edit-button")).toHaveAttribute(
            "href",
            `/admin/users/${id}/edit`,
          );
          await expect(row.getByTestId("users-delete-button")).toHaveCount(0);
          await expect(
            row.getByTestId("users-reset-password-button"),
          ).toHaveCount(0);
        }
      });
    });

    test("with delete permission", async ({ page, currentUserResponse }) => {
      currentUserResponse.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];

      const request = page.waitForRequest("**/api/v1/users*");
      await page.goto("/admin/users");
      await request;

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-add-button")).toBeVisible();
      const [john, laura, juan, max] = await page
        .getByTestId("user-item")
        .all();

      for (const [row, id] of [
        [john, 1],
        [laura, 2],
        [juan, 3],
        [max, 100],
      ]) {
        await expect(row.getByTestId("users-view-button")).toBeVisible();
        await expect(row.getByTestId("users-view-button")).toHaveAttribute(
          "href",
          `/admin/users/${id}`,
        );
        await expect(row.getByTestId("users-edit-button")).toBeVisible();
        await expect(row.getByTestId("users-edit-button")).toHaveAttribute(
          "href",
          `/admin/users/${id}/edit`,
        );
      }
      // Check that delete button for current user does not exist
      await expect(john.getByTestId("users-delete-button")).toHaveCount(0);
      await expect(john.getByTestId("users-reset-password-button")).toHaveCount(
        0,
      );
      for (const row of [laura, juan, max]) {
        await expect(row.getByTestId("users-delete-button")).toBeVisible();
      }
      for (const row of [laura, max]) {
        await expect(
          row.getByTestId("users-reset-password-button"),
        ).toBeVisible();
      }
      await expect(juan.getByTestId("users-reset-password-button")).toHaveCount(
        0,
      );
    });

    test("for user that is no superuser", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.superuser = false;
      currentUserResponse.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];

      const request = page.waitForRequest("**/api/v1/users*");
      await page.goto("/admin/users");
      await request;

      await expect(page.getByTestId("user-item")).toHaveCount(4);
      await expect(page.getByTestId("users-add-button")).toBeVisible();
      const [john, laura, juan, max] = await page
        .getByTestId("user-item")
        .all();

      for (const [row, id] of [
        [john, 1],
        [laura, 2],
        [juan, 3],
        [max, 100],
      ]) {
        await expect(row.getByTestId("users-view-button")).toBeVisible();
        await expect(row.getByTestId("users-view-button")).toHaveAttribute(
          "href",
          `/admin/users/${id}`,
        );
      }
      for (const row of [john, laura, juan]) {
        await expect(row.getByTestId("users-edit-button")).toBeVisible();
      }
      await expect(john.getByTestId("users-edit-button")).toHaveAttribute(
        "href",
        "/admin/users/1/edit",
      );
      await expect(laura.getByTestId("users-edit-button")).toHaveAttribute(
        "href",
        "/admin/users/2/edit",
      );
      await expect(juan.getByTestId("users-edit-button")).toHaveAttribute(
        "href",
        "/admin/users/3/edit",
      );
      // Check that delete button for current user does not exist
      await expect(john.getByTestId("users-delete-button")).toHaveCount(0);
      await expect(john.getByTestId("users-reset-password-button")).toHaveCount(
        0,
      );
      for (const row of [laura, juan]) {
        await expect(row.getByTestId("users-delete-button")).toBeVisible();
      }
      await expect(
        laura.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(juan.getByTestId("users-reset-password-button")).toHaveCount(
        0,
      );
      // Superusers can not be changed by other users
      await expect(max.getByTestId("users-edit-button")).toHaveCount(0);
      await expect(max.getByTestId("users-delete-button")).toHaveCount(0);
      await expect(max.getByTestId("users-reset-password-button")).toHaveCount(
        0,
      );
    });
  });

  test.describe("loading state during reload", () => {
    test.beforeEach(async ({ page, currentUserResponse }) => {
      currentUserResponse.data.permissions = [
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

    test("components are disabled while reloading", async ({
      page,
      usersResponse,
      getUsersApiMock,
    }) => {
      getUsersApiMock.respondWith({ json: usersResponse, hold: true });

      // Trigger reload by triggering search
      await page.getByTestId("user-search").locator("button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("user-search");
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
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

      const response = page.waitForResponse("**/api/v1/users*");
      getUsersApiMock.release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(
        page.getByTestId("role-dropdown").locator(".multiselect__tags"),
      ).toContainText("admin.users.role_filter");
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
