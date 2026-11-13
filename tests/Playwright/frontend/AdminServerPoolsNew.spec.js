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
} from "../support/utils.js";

const test = mergeTests(serverPoolControllerTest, serverControllerTest);

test.use({ authenticated: true });

test.describe("Admin server pools new", () => {
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
    await testVisitWithoutCurrentUser(page, "/admin/server_pools/new");
  });

  test("visit with user without permission to add new server pools", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
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

    test("shows the server options", async ({ serverSelect }) => {
      await expect(serverSelect.field).toContainText("app.servers");
      await expect(serverSelect.content).toHaveCount(0);

      await expect(
        serverSelect.dropdown.locator(".multiselect__tags"),
      ).toContainText("admin.server_pools.select_servers");
      await serverSelect.dropdown.locator(".multiselect__tags").click();
      await expect(serverSelect.chips).toHaveCount(0);

      await expect(serverSelect.content).toBeVisible();
      await expectMultiselectOptions(
        serverSelect.content,
        ["Server 01", "Server 02", "Server 03", "Server 04", "Server 05"],
        "admin.servers.no_data",
      );
    });

    test("select servers and remove one", async ({ serverSelect }) => {
      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();

      await serverSelect.selectOption(1);
      await expect(serverSelect.content).toBeVisible();
      await expect(serverSelect.chips).toContainText(["Server 02"]);
      await expect(serverSelect.visibleRemoveButtons).toHaveCount(1);

      await serverSelect.selectOption(2);
      await expect(serverSelect.content).toBeVisible();
      await expect(serverSelect.chips).toContainText([
        "Server 02",
        "Server 03",
      ]);
      await expect(serverSelect.visibleRemoveButtons).toHaveCount(2);

      await serverSelect.removeServer(1);

      await expect(serverSelect.content).toHaveCount(0);
    });

    test("add new server pool with 1 server", async ({
      page,
      createdServerPoolResponse,
      serverSelect,
    }) => {
      await page.locator("#name").fill("Server Pool 1");
      await page.locator("#description").fill("Server Pool 1 description");

      await serverSelect.open();
      await serverSelect.selectOption(1);
      await serverSelect.close();
      await expect(serverSelect.content).toHaveCount(0);

      createdServerPoolResponse.data.servers = readFixture(
        "serverPool.json",
      ).data.servers.slice(1, 2);
      const postServerPoolsApiMock = await mockApiRequest(
        page,
        "POST",
        "serverPools",
        {
          status: 201,
          json: createdServerPoolResponse,
        },
      );

      await page.getByTestId("server-pools-save-button").click();

      const request = await postServerPoolsApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual({
        name: "Server Pool 1",
        description: "Server Pool 1 description",
        servers: [2],
      });

      await expect(page).toHaveURL(/\/admin\/server_pools\/20$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("shows loading state while saving", async ({
      page,
      createdServerPoolResponse,
    }) => {
      await expect(page.getByTestId("overlay")).toBeHidden();

      await page.locator("#name").fill("Server Pool 1");
      const postServerPoolsApiMock = await mockApiRequest(
        page,
        "POST",
        "serverPools",
        {
          status: 201,
          json: createdServerPoolResponse,
          hold: true,
        },
      );

      await page.getByTestId("server-pools-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#name")).toBeDisabled();
      await expect(page.locator("#description")).toBeDisabled();
      await expect(page.getByTestId("server-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

      postServerPoolsApiMock.release();

      await expect(page).toHaveURL(/\/admin\/server_pools\/20$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });
  });

  test.describe("several pages of servers", () => {
    test.beforeEach(async ({ page, serverSelect, getServersApiMock }) => {
      getServersApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 2,
        perPage: 2,
      });
      await page.goto("/admin/server_pools/new");
      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();
    });

    test("shows the options of the first page", async ({ serverSelect }) => {
      await expect(serverSelect.previousPageButton).toContainText(
        "app.previous_page",
      );
      await expect(serverSelect.previousPageButton).toBeDisabled();
      await expect(serverSelect.nextPageButton).toContainText("app.next_page");
      await expect(serverSelect.nextPageButton).toBeEnabled();
      await expectMultiselectOptions(
        serverSelect.content,
        ["Server 01", "Server 02"],
        "admin.servers.no_data",
      );
    });

    test("selecting a server keeps the dropdown open", async ({
      serverSelect,
    }) => {
      await serverSelect.selectOption(0);

      await expect(serverSelect.content).toBeVisible();
      await expect(serverSelect.chips).toContainText(["Server 01"]);
      await expect(serverSelect.visibleRemoveButtons).toHaveCount(1);
    });

    test("shows loading state while switching the page", async ({
      page,
      serversResponse,
      serverSelect,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 2,
        perPage: 2,
      });
      getServersApiMock.respondWith({
        json: serversResponse,
        hold: true,
      });

      await serverSelect.showNextPage();

      await expect(serverSelect.previousPageButton).toBeDisabled();
      await expect(serverSelect.nextPageButton).toBeDisabled();
      await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();

      getServersApiMock.release();

      await expect(serverSelect.dropdown).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(serverSelect.previousPageButton).toBeEnabled();
      await expect(serverSelect.nextPageButton).toBeDisabled();
      await expectMultiselectOptions(
        serverSelect.content,
        ["Server 03", "Server 04"],
        "admin.servers.no_data",
      );
    });

    test("add new server pool with servers of several pages", async ({
      page,
      createdServerPoolResponse,
      serverSelect,
      getServersApiMock,
    }) => {
      await page.locator("#name").fill("Server Pool 1");
      await page.locator("#description").fill("Server Pool 1 description");

      // Focusing the inputs closes the dropdown
      await expect(serverSelect.content).toHaveCount(0);
      await serverSelect.open();
      await serverSelect.selectOption(0);
      await expect(serverSelect.content).toBeVisible();

      getServersApiMock.respondWithPage({
        currentPage: 2,
        lastPage: 2,
        perPage: 2,
      });
      await serverSelect.showNextPage();
      await expect(serverSelect.nextPageButton).toBeDisabled();
      await serverSelect.selectOption(1);

      await expect(serverSelect.content).toBeVisible();
      await expect(serverSelect.chips).toContainText([
        "Server 01",
        "Server 04",
      ]);
      await expect(serverSelect.visibleRemoveButtons).toHaveCount(2);

      await serverSelect.close();
      await expect(serverSelect.content).toHaveCount(0);

      createdServerPoolResponse.data.servers = readFixture(
        "servers.json",
      ).data.filter((server) => server.id === 1 || server.id === 4);
      const postServerPoolsApiMock = await mockApiRequest(
        page,
        "POST",
        "serverPools",
        {
          status: 201,
          json: createdServerPoolResponse,
        },
      );

      await page.getByTestId("server-pools-save-button").click();

      const request = await postServerPoolsApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual({
        name: "Server Pool 1",
        description: "Server Pool 1 description",
        servers: [1, 4],
      });

      await expect(page).toHaveURL(/\/admin\/server_pools\/20$/);
    });
  });

  test.describe("add new server pool errors", () => {
    test.beforeEach(async ({ page, serverSelect }) => {
      await page.goto("/admin/server_pools/new");

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
        "POST",
        "serverPools",
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
        "POST",
        "serverPools",
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
      await mockApiRequest(page, "POST", "serverPools", serverError());
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

    test("401 error redirects to the login page", async ({ page }) => {
      await page.locator("#name").fill("Server Pool 1");
      await mockApiRequest(page, "POST", "serverPools", { status: 401 });

      await page.getByTestId("server-pools-save-button").click();

      await expectLoginRedirect(page, "/admin/server_pools/new");
    });
  });

  test.describe("load servers errors", () => {
    test("shows loading state while loading servers", async ({
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
      getServersApiMock.respondWith({
        json: serversResponse,
        hold: true,
      });

      await page.goto("/admin/server_pools/new");

      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
      await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);

      getServersApiMock.release();

      await expect(serverSelect.dropdown).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();
    });

    test.describe("500 error when loading", () => {
      test.beforeEach(async ({ page, getServersApiMock }) => {
        getServersApiMock.respondWith(serverError());
        await page.goto("/admin/server_pools/new");
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("keeps the form disabled", async ({ page, serverSelect }) => {
        await expect(serverSelect.reloadButton).toBeVisible();
        await expect(serverSelect.dropdown).toHaveClass(
          /multiselect--disabled/,
        );
        await expect(
          page.getByTestId("server-pools-save-button"),
        ).toBeDisabled();
      });

      test("reload servers without errors", async ({
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
        getServersApiMock.respondWith({
          json: serversResponse,
        });

        await serverSelect.reloadButton.click();

        await expect(serverSelect.reloadButton).toHaveCount(0);
        await expect(serverSelect.dropdown).not.toHaveClass(
          /multiselect--disabled/,
        );
        await expect(
          page.getByTestId("server-pools-save-button"),
        ).toBeEnabled();

        await serverSelect.open();
        await expect(serverSelect.content).toBeVisible();
        await expect(serverSelect.options).toHaveCount(4);
      });

      test("401 error when reloading redirects to the login page", async ({
        page,
        getServersApiMock,
      }) => {
        getServersApiMock.respondWith({ status: 401 });

        await page.reload();

        await expectLoginRedirect(page, "/admin/server_pools/new");
      });
    });

    test("500 error when switching pages disables the form", async ({
      page,
      serverSelect,
      getServersApiMock,
    }) => {
      getServersApiMock.respondWithPage({
        currentPage: 1,
        lastPage: 2,
        perPage: 2,
      });
      await page.goto("/admin/server_pools/new");
      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();

      getServersApiMock.respondWith(serverError());
      await serverSelect.showNextPage();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(serverSelect.dropdown).toHaveClass(/multiselect--disabled/);
      await expect(page.getByTestId("server-pools-save-button")).toBeDisabled();
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
      await page.goto("/admin/server_pools/new");
      await serverSelect.open();
      await expect(serverSelect.content).toBeVisible();

      getServersApiMock.respondWith({ status: 401 });
      await serverSelect.showNextPage();

      await expectLoginRedirect(page, "/admin/server_pools/new");
    });
  });
});
