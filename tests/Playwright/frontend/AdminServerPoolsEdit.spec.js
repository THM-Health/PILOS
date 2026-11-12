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
import {
  interceptAdminServerPoolsViewRequests,
  interceptAdminServerPoolsIndexRequests,
} from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const SERVER_POOL_URL = "**/api/v1/serverPools/1";
const isServersUrl = (url) => url.pathname === "/api/v1/servers";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const modelNotFoundToast = [
  'app.flash.model_not_found.title_{"model":"app.model.server_pool"}',
  'app.flash.model_not_found.details_{"ids":"1"}',
];

const staleDialogTexts = [
  "app.errors.stale_error",
  'app.errors.stale_model_{"model":"app.model.server_pool"}',
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

function mockServerPool(page, method, response) {
  return mockMethod(page, method, SERVER_POOL_URL, response);
}

/**
 * Server pool fixture as the backend returns it after the pool was changed.
 */
function updatedServerPool(serverCount = 1) {
  const serverPool = readFixture("serverPool.json");
  serverPool.data.name = "Server Pool 1";
  serverPool.data.description = "Server Pool 1 description";
  serverPool.data.servers = serverPool.data.servers.slice(0, serverCount);
  return serverPool;
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

test.describe("Admin server pools edit", () => {
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
    await interceptAdminServerPoolsViewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/server_pools/1");
  });

  test("visit with user without permission to edit server pools", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "serverPools.viewAny",
      "serverPools.view",
    ];

    await page.goto("/admin/server_pools/1/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/server_pools\/1\/edit/);
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test("shows loading state while the server pool is loading", async ({
    page,
  }) => {
    await mockServers(page);
    const serverPoolRequest = await mockServerPool(page, "GET", {
      hold: true,
      json: readFixture("serverPool.json"),
    });

    await page.goto("/admin/server_pools/1/edit");
    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();

    await expect(page.getByTestId("overlay")).toBeVisible();
    await expect(
      page.getByTestId("server-pools-cancel-edit-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("server-pools-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("server-pools-delete-button")).toHaveCount(0);
    await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

    serverPoolRequest.release();

    await expect(page.locator("#name")).toHaveValue("Test");
    await expect(page.getByTestId("overlay")).toBeHidden();
  });

  test("shows buttons and breadcrumbs", async ({ page }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();

    const cancelButton = page.getByTestId("server-pools-cancel-edit-button");
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveJSProperty("tagName", "A");
    await expect(cancelButton).toContainText("app.cancel_editing");
    await expect(cancelButton).toHaveAttribute("href", "/admin/server_pools/1");
    await expect(page.getByTestId("server-pools-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("server-pools-delete-button")).toBeEnabled();
    await expect(page.getByTestId("server-pools-save-button")).toContainText(
      "app.save",
    );

    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.server_pools.index",
      'admin.breadcrumbs.server_pools.edit_{"name":"Test"}',
    );
  });

  test("breadcrumbs stay the same while changing the form", async ({
    page,
  }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");

    const nameField = page.getByTestId("name-field");
    await expect(nameField).toContainText("app.model_name");
    await expect(nameField.locator("#name")).toHaveValue("Test");
    await nameField.locator("#name").fill("Server Pool 1");

    const descriptionField = page.getByTestId("description-field");
    await expect(descriptionField).toContainText("app.description");
    await expect(descriptionField.locator("#description")).toHaveValue(
      "Pool for testing",
    );
    await descriptionField
      .locator("#description")
      .fill("Server Pool 1 description");

    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.server_pools.index",
      'admin.breadcrumbs.server_pools.edit_{"name":"Test"}',
    );
  });

  test("shows selected servers and the options of the first page", async ({
    page,
  }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");

    await expect(page.getByTestId("server-field")).toBeVisible();
    await expect(page.locator(".multiselect__content")).toHaveCount(0);
    await expectServerChips(page, ["Server 01", "Server 02"]);

    await page.getByTestId("server-dropdown").click();

    const content = page.locator(".multiselect__content");
    await expect(content).toBeVisible();
    await expectMultiselectOptions(
      content,
      ["Server 01", "Server 02"],
      "admin.servers.no_data",
    );
  });

  test("switch to the next page of servers", async ({ page }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");
    await page.getByTestId("server-dropdown").click();

    const content = page.locator(".multiselect__content");
    const previousButton = content.getByTestId("previous-page-button");
    const nextButton = content.getByTestId("next-page-button");
    await expect(content).toBeVisible();
    await expect(previousButton).toContainText("app.previous_page");
    await expect(previousButton).toBeDisabled();
    await expect(nextButton).toContainText("app.next_page");
    await expect(nextButton).toBeEnabled();

    await mockServers(page, 2);
    await nextButton.click();

    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeDisabled();
    await expectMultiselectOptions(
      content,
      ["Server 03", "Server 04"],
      "admin.servers.no_data",
    );
  });

  test("shows loading state while switching the page of servers", async ({
    page,
  }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");
    await page.getByTestId("server-dropdown").click();

    const content = page.locator(".multiselect__content");
    await expect(content).toBeVisible();

    const serversRequest = await mockServers(page, 2, { hold: true });
    await content.getByTestId("next-page-button").click();

    await expect(content.getByTestId("previous-page-button")).toBeDisabled();
    await expect(content.getByTestId("next-page-button")).toBeDisabled();
    await expect(page.getByTestId("server-dropdown")).toHaveClass(
      /multiselect--disabled/,
    );
    await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

    serversRequest.release();

    await expect(content.getByTestId("previous-page-button")).toBeEnabled();
    await expect(page.getByTestId("server-dropdown")).not.toHaveClass(
      /multiselect--disabled/,
    );
  });

  test("select servers from the next page and remove one", async ({ page }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");
    await page.getByTestId("server-dropdown").click();

    await mockServers(page, 2);
    const content = page.locator(".multiselect__content");
    await content.getByTestId("next-page-button").click();
    await expect(content.getByTestId("next-page-button")).toBeDisabled();

    await content.locator(".multiselect__option").nth(0).click();
    await content.locator(".multiselect__option").nth(1).click();

    await expect(content).toBeVisible();
    await expectServerChips(page, [
      "Server 01",
      "Server 02",
      "Server 03",
      "Server 04",
    ]);

    await page
      .getByTestId("server-dropdown")
      .getByTestId("server-chip")
      .nth(1)
      .getByTestId("remove-server-button")
      .click();

    await expect(content).toHaveCount(0);
    await expectServerChips(page, ["Server 01", "Server 03", "Server 04"]);
  });

  test("save changes", async ({ page }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");

    await page.locator("#name").fill("Server Pool 1");
    await page.locator("#description").fill("Server Pool 1 description");

    await page.getByTestId("server-dropdown").click();
    await mockServers(page, 2);
    const content = page.locator(".multiselect__content");
    await content.getByTestId("next-page-button").click();
    await expect(content.getByTestId("next-page-button")).toBeDisabled();
    await content.locator(".multiselect__option").nth(0).click();
    await content.locator(".multiselect__option").nth(1).click();
    await page
      .getByTestId("server-dropdown")
      .getByTestId("server-chip")
      .nth(1)
      .getByTestId("remove-server-button")
      .click();
    await expect(content).toHaveCount(0);

    const serverPool = updatedServerPool();
    serverPool.data.servers = readFixture("servers.json").data.filter(
      (server) => server.id !== 2,
    );
    const saveRequest = await mockServerPool(page, "PUT", {
      json: serverPool,
    });
    await mockServerPool(page, "GET", { json: serverPool });

    await page.getByTestId("server-pools-save-button").click();

    const request = await nthRequest(saveRequest);
    expect(request.postDataJSON()).toEqual({
      ...serverPool.data,
      servers: [1, 3, 4],
    });

    await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);
    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.server_pools.index",
      'admin.breadcrumbs.server_pools.view_{"name":"Server Pool 1"}',
    );
  });

  test("shows loading state while saving", async ({ page }) => {
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");
    await expect(page.getByTestId("overlay")).toBeHidden();

    const serverPool = updatedServerPool();
    const saveRequest = await mockServerPool(page, "PUT", {
      hold: true,
      json: serverPool,
    });
    await mockServerPool(page, "GET", { json: serverPool });

    await page.getByTestId("server-pools-save-button").click();

    await expect(page.getByTestId("overlay")).toBeVisible();
    await expect(page.locator("#name")).toBeDisabled();
    await expect(page.locator("#description")).toBeDisabled();
    await expect(page.getByTestId("server-dropdown")).toHaveClass(
      /multiselect--disabled/,
    );
    const cancelButton = page.getByTestId("server-pools-cancel-edit-button");
    await expect(cancelButton).toHaveJSProperty("tagName", "BUTTON");
    await expect(cancelButton).toBeDisabled();
    await expect(page.getByTestId("server-pools-delete-button")).toBeDisabled();
    await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

    saveRequest.release();

    await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page }) => {
      await mockServers(page);
      await page.goto("/admin/server_pools/1/edit");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
        'admin.breadcrumbs.server_pools.edit_{"name":"Test"}',
      );

      await page.locator("#name").clear();
      await page.locator("#description").fill("Server Pool 1 description");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await page.locator(".multiselect__option").nth(0).click();
      await page.locator(".multiselect__select").click();
      await expect(page.locator(".multiselect__content")).toHaveCount(0);
    });

    test("422 error shows validation errors", async ({ page }) => {
      await mockServerPool(page, "PUT", {
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
      await mockServerPool(page, "PUT", {
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
      await mockServerPool(page, "PUT", {
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

    test.describe("stale error (428)", () => {
      test.beforeEach(async ({ page }) => {
        await page.locator("#name").fill("Server Pool 1");
        await mockServerPool(page, "PUT", {
          status: 428,
          json: {
            new_model: updatedServerPool().data,
            message: "stale_model",
          },
        });

        await expect(page.getByTestId("stale-server-pool-dialog")).toHaveCount(
          0,
        );
        await page.getByTestId("server-pools-save-button").click();
      });

      test("shows stale dialog", async ({ page }) => {
        const dialog = page.getByTestId("stale-server-pool-dialog");
        await expect(dialog).toBeVisible();
        for (const text of staleDialogTexts) {
          await expect(dialog).toContainText(text);
        }
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("reload shows the new data", async ({ page }) => {
        await page.getByTestId("stale-dialog-reject-button").click();

        await expect(page.getByTestId("stale-server-pool-dialog")).toBeHidden();
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.server_pools.index",
          'admin.breadcrumbs.server_pools.edit_{"name":"Server Pool 1"}',
        );
        await expect(page.locator("#name")).toHaveValue("Server Pool 1");
        await expect(page.locator("#description")).toHaveValue(
          "Server Pool 1 description",
        );
        await expectServerChips(page, ["Server 01"]);
      });

      test("reload and a second stale error shows the dialog again", async ({
        page,
      }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-server-pool-dialog")).toBeHidden();
        await expect(page.locator("#name")).toHaveValue("Server Pool 1");

        await page.getByTestId("server-pools-save-button").click();

        const dialog = page.getByTestId("stale-server-pool-dialog");
        await expect(dialog).toBeVisible();
        for (const text of staleDialogTexts) {
          await expect(dialog).toContainText(text);
        }
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      for (const reloadFirst of [false, true]) {
        test(`overwrite saves the ${reloadFirst ? "reloaded" : "edited"} data`, async ({
          page,
        }) => {
          if (reloadFirst) {
            await page.getByTestId("stale-dialog-reject-button").click();
            await expect(page.locator("#name")).toHaveValue("Server Pool 1");
            await page.getByTestId("server-pools-save-button").click();
            await expect(
              page.getByTestId("stale-server-pool-dialog"),
            ).toBeVisible();
          }

          const serverPool = updatedServerPool();
          const saveRequest = await mockServerPool(page, "PUT", {
            json: serverPool,
          });
          await mockServerPool(page, "GET", { json: serverPool });

          await page.getByTestId("stale-dialog-accept-button").click();

          // The edited form deselected "Server 01", the reloaded one has only "Server 01"
          const request = await nthRequest(saveRequest);
          expect(request.postDataJSON()).toEqual({
            ...serverPool.data,
            servers: [reloadFirst ? 1 : 2],
          });

          await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);
          await expectAdminBreadcrumbs(
            page,
            "admin.breadcrumbs.server_pools.index",
            'admin.breadcrumbs.server_pools.view_{"name":"Server Pool 1"}',
          );
        });
      }
    });

    test("404 error redirects to the index page", async ({ page }) => {
      await interceptAdminServerPoolsIndexRequests(page);
      await mockServerPool(page, "PUT", {
        status: 404,
        json: { message: "model_not_found", model: "server_pool", ids: [1] },
      });

      await page.getByTestId("server-pools-save-button").click();

      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await expectToastAndClose(page, modelNotFoundToast);
    });

    test("401 error redirects to the login page", async ({ page }) => {
      await mockServerPool(page, "PUT", { status: 401 });

      await page.getByTestId("server-pools-save-button").click();

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });
  });

  test("check button visibility without delete permission", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "serverPools.viewAny",
      "serverPools.view",
      "serverPools.update",
      "serverPools.create",
    ];
    await mockServers(page);

    await page.goto("/admin/server_pools/1/edit");

    const cancelButton = page.getByTestId("server-pools-cancel-edit-button");
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText("app.cancel_editing");
    await expect(cancelButton).toHaveAttribute("href", "/admin/server_pools/1");
    await expect(page.getByTestId("server-pools-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("server-pools-delete-button")).toHaveCount(0);
    await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();
    await expect(page.getByTestId("server-pools-save-button")).toContainText(
      "app.save",
    );
  });

  test.describe("load server pool errors", () => {
    test("500 error shows overlay and retry loads the server pool", async ({
      page,
    }) => {
      await mockServers(page);
      await mockServerPool(page, "GET", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/server_pools/1/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, serverErrorToast);

      await mockServerPool(page, "GET", {
        json: readFixture("serverPool.json"),
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);
      await expect(page.locator("#name")).toHaveValue("Test");
    });

    test("404 error redirects to the index page", async ({ page }) => {
      await mockServers(page);
      await interceptAdminServerPoolsIndexRequests(page);
      await mockServerPool(page, "GET", {
        status: 404,
        json: { message: "model_not_found", model: "server_pool", ids: [1] },
      });

      await page.goto("/admin/server_pools/1/edit");

      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await expectToastAndClose(page, modelNotFoundToast);
    });

    test("401 error redirects to the login page", async ({ page }) => {
      await mockServers(page);
      await mockServerPool(page, "GET", { status: 401 });

      await page.goto("/admin/server_pools/1/edit");

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });
  });

  test.describe("load servers errors", () => {
    test("500 error disables the form until the servers are reloaded", async ({
      page,
    }) => {
      const serversRequest = await mockServers(page, 1, {
        hold: true,
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/server_pools/1/edit");

      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      serversRequest.release();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

      await mockServers(page);
      await page.getByTestId("servers-reload-button").click();

      await expect(page.getByTestId("server-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();
      await expect(page.getByTestId("servers-reload-button")).toHaveCount(0);

      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expect(page.locator(".multiselect__option")).toHaveCount(4);
    });

    test("500 error when switching pages", async ({ page }) => {
      await mockServers(page);
      await page.goto("/admin/server_pools/1/edit");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__option")).toHaveCount(4);

      await mockServersError(page, 500, { message: "Test" });
      await page.getByTestId("next-page-button").click();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
    });

    test("401 error redirects to the login page", async ({ page }) => {
      await mockServersError(page, 401);

      await page.goto("/admin/server_pools/1/edit");

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });

    test("401 error when switching pages redirects to the login page", async ({
      page,
    }) => {
      await mockServers(page);
      await page.goto("/admin/server_pools/1/edit");
      await page.getByTestId("server-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      await mockServersError(page, 401);
      await page.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });
  });
});
