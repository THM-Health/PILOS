import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  expectAdminBreadcrumbs,
  expectMultiselectOptions,
} from "../support/admin.js";
import { interceptAdminServerPoolsNewRequests } from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const isServersUrl = (url) => url.pathname === "/api/v1/servers";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

/**
 * Mock the servers list, two servers per page (page 1 by default).
 */
function mockServers(page, pageNumber = 1, options = {}) {
  const servers = readFixture("servers.json");
  const start = (pageNumber - 1) * 2;
  servers.data = servers.data.slice(start, start + 2);
  Object.assign(servers.meta, {
    current_page: pageNumber,
    from: start + 1,
    last_page: 2,
    per_page: 2,
    to: start + 2,
  });
  return mockMethod(page, "GET", isServersUrl, { json: servers, ...options });
}

function mockServersError(page, status, body) {
  return mockMethod(page, "GET", isServersUrl, { status, json: body });
}

function mockCreateServerPool(page, response) {
  return mockMethod(
    page,
    "POST",
    (url) => url.pathname === "/api/v1/serverPools",
    response,
  );
}

/**
 * Mocks the creation of a server pool (id 20) and the following request of the new server pool.
 */
async function mockCreatedServerPool(page, servers, options = {}) {
  const serverPool = readFixture("serverPool.json");
  serverPool.data.id = 20;
  serverPool.data.name = "Server Pool 1";
  serverPool.data.description = "Server Pool 1 description";
  serverPool.data.servers = servers;

  const createRequest = await mockCreateServerPool(page, {
    status: 201,
    json: serverPool,
    ...options,
  });
  await mockMethod(page, "GET", "**/api/v1/serverPools/20", {
    json: serverPool,
  });
  return createRequest;
}

async function expectServerChips(page, names) {
  const chips = page.getByTestId("server-dropdown").getByTestId("server-chip");
  await expect(chips).toHaveCount(names.length);
  for (const [index, name] of names.entries()) {
    await expect(chips.nth(index)).toContainText(name);
    await expect(
      chips.nth(index).getByTestId("remove-server-button"),
    ).toBeVisible();
  }
}

test.describe("Admin server pools new", () => {
  test.use({ authenticated: true });

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
    await interceptAdminServerPoolsNewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/server_pools/new");
  });

  test("visit with user without permission to add new server pools", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "serverPools.viewAny",
      "serverPools.view",
      "serverPools.update",
    ];

    await page.goto("/admin/server_pools/new");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/users/);
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test.describe("new server pool form", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/server_pools/new");
      await expect(page.getByTestId("name-field")).toBeVisible();
    });

    test("header buttons are hidden and breadcrumbs are shown", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("server-pools-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("server-pools-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("server-pools-delete-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("server-pools-save-button")).toHaveText(
        "app.save",
      );

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
        "admin.breadcrumbs.server_pools.new",
      );
    });

    test("breadcrumbs stay the same while changing the form", async ({
      page,
    }) => {
      const nameField = page.getByTestId("name-field");
      await expect(nameField).toContainText("app.model_name");
      await expect(nameField.locator("#name")).toHaveValue("");
      await nameField.locator("#name").fill("Server Pool 1");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
        "admin.breadcrumbs.server_pools.new",
      );

      const descriptionField = page.getByTestId("description-field");
      await expect(descriptionField).toContainText("app.description");
      await expect(descriptionField.locator("#description")).toHaveValue("");
      await descriptionField
        .locator("#description")
        .fill("Server Pool 1 description");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
        "admin.breadcrumbs.server_pools.new",
      );
    });

    test("shows the server options", async ({ page }) => {
      const serverField = page.getByTestId("server-field");
      await expect(serverField).toContainText("app.servers");
      await expect(page.locator(".multiselect__content")).toHaveCount(0);

      const dropdown = serverField.getByTestId("server-dropdown");
      await expect(dropdown.locator(".multiselect__tags")).toContainText(
        "admin.server_pools.select_servers",
      );
      await dropdown.locator(".multiselect__tags").click();
      await expect(dropdown.getByTestId("server-chip")).toHaveCount(0);

      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await expectMultiselectOptions(
        content,
        ["Server 01", "Server 02", "Server 03", "Server 04", "Server 05"],
        "admin.servers.no_data",
      );
    });

    test("select servers and remove one", async ({ page }) => {
      await page.getByTestId("server-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      await content.locator(".multiselect__option").nth(1).click();
      await expect(content).toBeVisible();
      await expectServerChips(page, ["Server 02"]);

      await content.locator(".multiselect__option").nth(2).click();
      await expect(content).toBeVisible();
      await expectServerChips(page, ["Server 02", "Server 03"]);

      await page
        .getByTestId("server-dropdown")
        .getByTestId("server-chip")
        .nth(1)
        .getByTestId("remove-server-button")
        .click();

      await expect(content).toHaveCount(0);
    });

    test("add new server pool with 1 server", async ({ page }) => {
      await page.locator("#name").fill("Server Pool 1");
      await page.locator("#description").fill("Server Pool 1 description");

      await page.getByTestId("server-dropdown").click();
      await page.locator(".multiselect__option").nth(1).click();
      await page.locator(".multiselect__select").click();
      await expect(page.locator(".multiselect__content")).toHaveCount(0);

      const servers = readFixture("serverPool.json").data.servers.slice(1, 2);
      const createRequest = await mockCreatedServerPool(page, servers);

      await page.getByTestId("server-pools-save-button").click();

      const request = await nthRequest(createRequest);
      expect(request.postDataJSON()).toEqual({
        name: "Server Pool 1",
        description: "Server Pool 1 description",
        servers: [2],
      });

      await expect(page).toHaveURL(/\/admin\/server_pools\/20$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("shows loading state while saving", async ({ page }) => {
      await expect(page.getByTestId("overlay")).toBeHidden();

      await page.locator("#name").fill("Server Pool 1");
      const createRequest = await mockCreatedServerPool(page, [], {
        hold: true,
      });

      await page.getByTestId("server-pools-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#description")).toBeDisabled();
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

      createRequest.release();

      await expect(page).toHaveURL(/\/admin\/server_pools\/20$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });
  });

  test.describe("several pages of servers", () => {
    test.beforeEach(async ({ page }) => {
      await mockServers(page);
      await page.goto("/admin/server_pools/new");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
    });

    test("shows the options of the first page", async ({ page }) => {
      const content = page.locator(".multiselect__content");
      await expect(content.getByTestId("previous-page-button")).toContainText(
        "app.previous_page",
      );
      await expect(content.getByTestId("previous-page-button")).toBeDisabled();
      await expect(content.getByTestId("next-page-button")).toContainText(
        "app.next_page",
      );
      await expect(content.getByTestId("next-page-button")).toBeEnabled();
      await expectMultiselectOptions(
        content,
        ["Server 01", "Server 02"],
        "admin.servers.no_data",
      );
    });

    test("selecting a server keeps the dropdown open", async ({ page }) => {
      const content = page.locator(".multiselect__content");
      await content.locator(".multiselect__option").nth(0).click();

      await expect(content).toBeVisible();
      await expectServerChips(page, ["Server 01"]);
    });

    test("shows loading state while switching the page", async ({ page }) => {
      const content = page.locator(".multiselect__content");
      const serversRequest = await mockServers(page, 2, { hold: true });

      await content.getByTestId("next-page-button").click();

      await expect(content.getByTestId("previous-page-button")).toBeDisabled();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

      serversRequest.release();

      await expect(page.getByTestId("server-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(content.getByTestId("previous-page-button")).toBeEnabled();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await expectMultiselectOptions(
        content,
        ["Server 03", "Server 04"],
        "admin.servers.no_data",
      );
    });

    test("add new server pool with servers of several pages", async ({
      page,
    }) => {
      await page.locator("#name").fill("Server Pool 1");
      await page.locator("#description").fill("Server Pool 1 description");

      // Focusing the inputs closes the dropdown
      const content = page.locator(".multiselect__content");
      await expect(content).toHaveCount(0);
      await page.getByTestId("server-dropdown").click();
      await content.locator(".multiselect__option").nth(0).click();
      await expect(content).toBeVisible();

      await mockServers(page, 2);
      await content.getByTestId("next-page-button").click();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await content.locator(".multiselect__option").nth(1).click();

      await expect(content).toBeVisible();
      await expectServerChips(page, ["Server 01", "Server 04"]);

      await page.locator(".multiselect__select").click();
      await expect(content).toHaveCount(0);

      const allServers = readFixture("servers.json").data;
      const createRequest = await mockCreatedServerPool(
        page,
        allServers.filter((server) => server.id === 1 || server.id === 4),
      );

      await page.getByTestId("server-pools-save-button").click();

      const request = await nthRequest(createRequest);
      expect(request.postDataJSON()).toEqual({
        name: "Server Pool 1",
        description: "Server Pool 1 description",
        servers: [1, 4],
      });

      await expect(page).toHaveURL(/\/admin\/server_pools\/20$/);
    });
  });

  test.describe("add new server pool errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/server_pools/new");

      await page.locator("#description").fill("Server Pool 1 description");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await page.locator(".multiselect__option").nth(0).click();
      await page.locator(".multiselect__select").click();
      await expect(page.locator(".multiselect__content")).toHaveCount(0);
    });

    test("422 error shows validation errors", async ({ page }) => {
      await mockCreateServerPool(page, {
        status: 422,
        json: {
          message: "The Name field is required. (and 2 more errors)",
          errors: {
            name: ["The Name field is required."],
            description: [
              "The Description must not be greater than 255 characters.",
            ],
            servers: ["The server with the ID 1 could not be found."],
          },
        },
      });

      await page.getByTestId("server-pools-save-button").click();

      await expectToastAndClose(
        page,
        "The Name field is required. (and 2 more errors)",
      );
      await expect(page.getByTestId("name-field")).toContainText(
        "The Name field is required.",
      );
      await expect(page.getByTestId("description-field")).toContainText(
        "The Description must not be greater than 255 characters.",
      );
      await expect(page.getByTestId("server-field")).toContainText(
        "The server with the ID 1 could not be found.",
      );
    });

    test("500 error shows toast and hides previous validation errors", async ({
      page,
    }) => {
      await mockCreateServerPool(page, {
        status: 422,
        json: {
          message: "The Name field is required. (and 2 more errors)",
          errors: {
            name: ["The Name field is required."],
            description: [
              "The Description must not be greater than 255 characters.",
            ],
            servers: ["The server with the ID 1 could not be found."],
          },
        },
      });
      await page.getByTestId("server-pools-save-button").click();
      await expectToastAndClose(
        page,
        "The Name field is required. (and 2 more errors)",
      );
      await expect(page.getByTestId("name-field")).toContainText(
        "The Name field is required.",
      );

      await page.locator("#name").fill("Server Pool 1");
      await mockCreateServerPool(page, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("server-pools-save-button").click();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("name-field")).not.toContainText(
        "The Name field is required.",
      );
      await expect(page.getByTestId("description-field")).not.toContainText(
        "The Description must not be greater than 255 characters.",
      );
      await expect(page.getByTestId("server-field")).not.toContainText(
        "The server with the ID 1 could not be found.",
      );
    });

    test("401 error redirects to the login page", async ({ page }) => {
      await page.locator("#name").fill("Server Pool 1");
      await mockCreateServerPool(page, { status: 401 });

      await page.getByTestId("server-pools-save-button").click();

      await expectLoginRedirect(page, "/admin/server_pools/new");
    });
  });

  test.describe("load servers errors", () => {
    test("shows loading state while loading servers", async ({ page }) => {
      const serversRequest = await mockServers(page, 1, { hold: true });

      await page.goto("/admin/server_pools/new");

      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      serversRequest.release();

      await expect(page.getByTestId("server-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();
    });

    test.describe("500 error when loading", () => {
      test.beforeEach(async ({ page }) => {
        await mockServersError(page, 500, { message: "Test" });
        await page.goto("/admin/server_pools/new");
        await expectToastAndClose(page, serverErrorToast);
      });

      test("keeps the form disabled", async ({ page }) => {
        await expect(page.getByTestId("servers-reload-button")).toBeVisible();
        await expect(page.getByTestId("server-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );
        await expect(
          page.getByTestId("server-pools-save-button"),
        ).toBeDisabled();
      });

      test("reload servers without errors", async ({ page }) => {
        await mockServers(page);

        await page.getByTestId("servers-reload-button").click();

        await expect(page.getByTestId("servers-reload-button")).toHaveCount(0);
        await expect(page.getByTestId("server-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
        await expect(
          page.getByTestId("server-pools-save-button"),
        ).toBeEnabled();

        await page.getByTestId("server-dropdown").click();
        await expect(page.locator(".multiselect__content")).toBeVisible();
        await expect(page.locator(".multiselect__option")).toHaveCount(4);
      });

      test("401 error when reloading redirects to the login page", async ({
        page,
      }) => {
        await mockServersError(page, 401);

        await page.reload();

        await expectLoginRedirect(page, "/admin/server_pools/new");
      });
    });

    test("500 error when switching pages disables the form", async ({
      page,
    }) => {
      await mockServers(page);
      await page.goto("/admin/server_pools/new");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      await mockServersError(page, 500, { message: "Test" });
      await page.getByTestId("next-page-button").click();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
    });

    test("401 error when switching pages redirects to the login page", async ({
      page,
    }) => {
      await mockServers(page);
      await page.goto("/admin/server_pools/new");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      await mockServersError(page, 401);
      await page.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/server_pools/new");
    });
  });
});
