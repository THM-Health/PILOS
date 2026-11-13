import { mergeTests } from "@playwright/test";
import { test as serverPoolControllerTest } from "../support/fixtures/serverPoolController.js";
import { test as serverControllerTest } from "../support/fixtures/serverController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  expectAdminBreadcrumbs,
  expectMultiselectOptions,
} from "../support/admin.js";
import {
  mockApiRequest,
  readFixture,
  validationErrors,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(serverPoolControllerTest, serverControllerTest);

test.use({ authenticated: true });

test.describe("Admin server pools edit", () => {
  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "serverPools.viewAny",
      "serverPools.view",
      "serverPools.update",
      "serverPools.create",
      "serverPools.delete",
    ];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/server_pools/1");
  });

  test("visit with user without permission to edit server pools", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
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
    serverPoolResponse,
  }) => {
    const getServerPoolApiMock = await mockApiRequest(
      page,
      "GET",
      "serverPools/1",
      { hold: true, json: serverPoolResponse },
    );

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

    getServerPoolApiMock.release();

    await expect(page.locator("#name")).toHaveValue("Test");
    await expect(page.getByTestId("overlay")).toBeHidden();
  });

  test("shows buttons and breadcrumbs", async ({ page }) => {
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
    serverSelect,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      perPage: 2,
    });

    await page.goto("/admin/server_pools/1/edit");

    await expect(serverSelect.field).toBeVisible();
    await expect(serverSelect.content).toHaveCount(0);
    await expect(serverSelect.chips).toContainText(["Server 01", "Server 02"]);
    await expect(serverSelect.visibleRemoveButtons).toHaveCount(2);

    await serverSelect.open();

    await expect(serverSelect.content).toBeVisible();
    await expectMultiselectOptions(
      serverSelect.content,
      ["Server 01", "Server 02"],
      "admin.servers.no_data",
    );
  });

  test("switch to the next page of servers", async ({
    page,
    serverSelect,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      perPage: 2,
    });

    await page.goto("/admin/server_pools/1/edit");
    await serverSelect.open();

    await expect(serverSelect.content).toBeVisible();
    await expect(serverSelect.previousPageButton).toContainText(
      "app.previous_page",
    );
    await expect(serverSelect.previousPageButton).toBeDisabled();
    await expect(serverSelect.nextPageButton).toContainText("app.next_page");
    await expect(serverSelect.nextPageButton).toBeEnabled();

    getServersApiMock.respondWithPage({
      currentPage: 2,
      lastPage: 2,
      perPage: 2,
    });
    await serverSelect.showNextPage();

    await expect(serverSelect.previousPageButton).toBeEnabled();
    await expect(serverSelect.nextPageButton).toBeDisabled();
    await expectMultiselectOptions(
      serverSelect.content,
      ["Server 03", "Server 04"],
      "admin.servers.no_data",
    );
  });

  test("shows loading state while switching the page of servers", async ({
    page,
    serversResponse,
    serverSelect,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      perPage: 2,
    });

    await page.goto("/admin/server_pools/1/edit");
    await serverSelect.open();
    await expect(serverSelect.content).toBeVisible();

    getServersApiMock.respondWithPage({
      currentPage: 2,
      lastPage: 2,
      perPage: 2,
    });
    getServersApiMock.respondWith({ json: serversResponse, hold: true });
    await serverSelect.showNextPage();

    await expect(serverSelect.previousPageButton).toBeDisabled();
    await expect(serverSelect.nextPageButton).toBeDisabled();
    await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);
    await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

    getServersApiMock.release();

    await expect(serverSelect.previousPageButton).toBeEnabled();
    await expect(serverSelect.dropdown).not.toHaveClass(
      /multiselect--disabled/,
    );
  });

  test("select servers from the next page and remove one", async ({
    page,
    serverSelect,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      perPage: 2,
    });

    await page.goto("/admin/server_pools/1/edit");
    await serverSelect.open();

    getServersApiMock.respondWithPage({
      currentPage: 2,
      lastPage: 2,
      perPage: 2,
    });
    await serverSelect.showNextPage();
    await expect(serverSelect.nextPageButton).toBeDisabled();

    await serverSelect.selectOption(0);
    await serverSelect.selectOption(1);

    await expect(serverSelect.content).toBeVisible();
    await expect(serverSelect.chips).toContainText([
      "Server 01",
      "Server 02",
      "Server 03",
      "Server 04",
    ]);
    await expect(serverSelect.visibleRemoveButtons).toHaveCount(4);

    await serverSelect.removeServer(1);

    await expect(serverSelect.content).toHaveCount(0);
    await expect(serverSelect.chips).toContainText([
      "Server 01",
      "Server 03",
      "Server 04",
    ]);
    await expect(serverSelect.visibleRemoveButtons).toHaveCount(3);
  });

  test("save changes", async ({
    page,
    serverPoolResponse,
    serverSelect,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      perPage: 2,
    });

    await page.goto("/admin/server_pools/1/edit");

    await page.locator("#name").fill("Server Pool 1");
    await page.locator("#description").fill("Server Pool 1 description");

    await serverSelect.open();
    getServersApiMock.respondWithPage({
      currentPage: 2,
      lastPage: 2,
      perPage: 2,
    });
    await serverSelect.showNextPage();
    await expect(serverSelect.nextPageButton).toBeDisabled();
    await serverSelect.selectOption(0);
    await serverSelect.selectOption(1);
    await serverSelect.removeServer(1);
    await expect(serverSelect.content).toHaveCount(0);

    serverPoolResponse.data.name = "Server Pool 1";
    serverPoolResponse.data.description = "Server Pool 1 description";
    serverPoolResponse.data.servers = readFixture("servers.json").data.filter(
      (server) => server.id !== 2,
    );
    const putServerPoolApiMock = await mockApiRequest(
      page,
      "PUT",
      "serverPools/1",
      {
        json: serverPoolResponse,
      },
    );

    await page.getByTestId("server-pools-save-button").click();

    const request = await putServerPoolApiMock.waitForRequest();
    expect(request.postDataJSON()).toEqual({
      ...serverPoolResponse.data,
      servers: [1, 3, 4],
    });

    await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);
    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.server_pools.index",
      'admin.breadcrumbs.server_pools.view_{"name":"Server Pool 1"}',
    );
  });

  test("shows loading state while saving", async ({
    page,
    serverPoolResponse,
    getServersApiMock,
  }) => {
    getServersApiMock.respondWithPage({
      currentPage: 1,
      lastPage: 2,
      perPage: 2,
    });

    await page.goto("/admin/server_pools/1/edit");
    await expect(page.getByTestId("overlay")).toBeHidden();

    serverPoolResponse.data.name = "Server Pool 1";
    serverPoolResponse.data.description = "Server Pool 1 description";
    serverPoolResponse.data.servers = serverPoolResponse.data.servers.slice(
      0,
      1,
    );
    const putServerPoolApiMock = await mockApiRequest(
      page,
      "PUT",
      "serverPools/1",
      {
        hold: true,
        json: serverPoolResponse,
      },
    );

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

    putServerPoolApiMock.release();

    await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page, serverSelect, getServersApiMock }) => {
      getServersApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 2,
        perPage: 2,
      });
      await page.goto("/admin/server_pools/1/edit");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
        'admin.breadcrumbs.server_pools.edit_{"name":"Test"}',
      );

      await page.locator("#name").clear();
      await page.locator("#description").fill("Server Pool 1 description");
      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();
      await serverSelect.selectOption(0);
      await serverSelect.close();
      await expect(serverSelect.content).toHaveCount(0);
    });

    test("422 error shows validation errors", async ({ page }) => {
      await mockApiRequest(
        page,
        "PUT",
        "serverPools/1",
        validationErrors(
          {
            name: ["The Name field is required."],
            description: [
              "The Description must not be greater than 255 characters.",
            ],
            servers: ["The server with the ID 1 could not be found."],
          },
          "The Name field is required. (and 2 more errors)",
        ),
      );

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
      await mockApiRequest(
        page,
        "PUT",
        "serverPools/1",
        validationErrors(
          {
            name: ["The Name field is required."],
            description: [
              "The Description must not be greater than 255 characters.",
            ],
            servers: ["The server with the ID 1 could not be found."],
          },
          "The Name field is required. (and 2 more errors)",
        ),
      );
      await page.getByTestId("server-pools-save-button").click();
      await expectToastAndClose(
        page,
        "The Name field is required. (and 2 more errors)",
      );
      await expect(page.getByTestId("name-field")).toContainText(
        "The Name field is required.",
      );

      await page.locator("#name").fill("Server Pool 1");
      await mockApiRequest(page, "PUT", "serverPools/1", serverError());
      await page.getByTestId("server-pools-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
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
      test.beforeEach(async ({ page, serverPoolResponse }) => {
        await page.locator("#name").fill("Server Pool 1");
        serverPoolResponse.data.name = "Server Pool 1";
        serverPoolResponse.data.description = "Server Pool 1 description";
        serverPoolResponse.data.servers = serverPoolResponse.data.servers.slice(
          0,
          1,
        );
        await mockApiRequest(page, "PUT", "serverPools/1", {
          status: 428,
          json: {
            new_model: serverPoolResponse.data,
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
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.server_pool"}',
        );
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("reload shows the new data", async ({ page, serverSelect }) => {
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
        await expect(serverSelect.chips).toContainText(["Server 01"]);
        await expect(serverSelect.visibleRemoveButtons).toHaveCount(1);
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
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.server_pool"}',
        );
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
          serverPoolResponse,
        }) => {
          if (reloadFirst) {
            await page.getByTestId("stale-dialog-reject-button").click();
            await expect(page.locator("#name")).toHaveValue("Server Pool 1");
            await page.getByTestId("server-pools-save-button").click();
            await expect(
              page.getByTestId("stale-server-pool-dialog"),
            ).toBeVisible();
          }

          const putServerPoolApiMock = await mockApiRequest(
            page,
            "PUT",
            "serverPools/1",
            { json: serverPoolResponse },
          );

          await page.getByTestId("stale-dialog-accept-button").click();

          // The edited form deselected "Server 01", the reloaded one has only "Server 01"
          const request = await putServerPoolApiMock.waitForRequest();
          expect(request.postDataJSON()).toEqual({
            ...serverPoolResponse.data,
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
      await mockApiRequest(
        page,
        "PUT",
        "serverPools/1",
        modelNotFound("server_pool", [1]),
      );

      await page.getByTestId("server-pools-save-button").click();

      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server_pool"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("401 error redirects to the login page", async ({ page }) => {
      await mockApiRequest(page, "PUT", "serverPools/1", {
        status: 401,
      });

      await page.getByTestId("server-pools-save-button").click();

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });
  });

  test("check button visibility without delete permission", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "serverPools.viewAny",
      "serverPools.view",
      "serverPools.update",
      "serverPools.create",
    ];

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
      serverPoolResponse,
    }) => {
      await mockApiRequest(page, "GET", "serverPools/1", serverError());

      await page.goto("/admin/server_pools/1/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await mockApiRequest(page, "GET", "serverPools/1", {
        json: serverPoolResponse,
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toHaveCount(0);
      await expect(page.locator("#name")).toHaveValue("Test");
    });

    test("404 error redirects to the index page", async ({ page }) => {
      await mockApiRequest(
        page,
        "GET",
        "serverPools/1",
        modelNotFound("server_pool", [1]),
      );

      await page.goto("/admin/server_pools/1/edit");

      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server_pool"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("401 error redirects to the login page", async ({ page }) => {
      await mockApiRequest(page, "GET", "serverPools/1", {
        status: 401,
      });

      await page.goto("/admin/server_pools/1/edit");

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });
  });

  test.describe("load servers errors", () => {
    test("500 error disables the form until the servers are reloaded", async ({
      page,
      serversResponse,
      serverSelect,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 2,
        perPage: 2,
      });
      getServersApiMock.respondWith(serverError({ hold: true }));

      await page.goto("/admin/server_pools/1/edit");

      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
      await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);

      getServersApiMock.release();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

      getServersApiMock.respondWith({ json: serversResponse });
      await serverSelect.reloadButton.click();

      await expect(serverSelect.dropdown).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();
      await expect(serverSelect.reloadButton).toHaveCount(0);

      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();
      await expect(serverSelect.options).toHaveCount(4);
    });

    test("500 error when switching pages", async ({
      page,
      serverSelect,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 2,
        perPage: 2,
      });
      await page.goto("/admin/server_pools/1/edit");
      await serverSelect.open();
      await expect(serverSelect.options).toHaveCount(4);

      getServersApiMock.respondWith(serverError());
      await serverSelect.showNextPage();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
    });

    test("401 error redirects to the login page", async ({
      page,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWith({ status: 401 });

      await page.goto("/admin/server_pools/1/edit");

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });

    test("401 error when switching pages redirects to the login page", async ({
      page,
      serverSelect,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 2,
        perPage: 2,
      });
      await page.goto("/admin/server_pools/1/edit");
      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();

      getServersApiMock.respondWith({ status: 401 });
      await serverSelect.showNextPage();

      await expectLoginRedirect(page, "/admin/server_pools/1/edit");
    });
  });
});
