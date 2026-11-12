import { expect, expectToastAndClose } from "../support/test.js";
import { test, showServersPage } from "../support/fixtures/adminServers.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  expectActivePage,
  holdRequest,
  mockMethod,
  nthRequest,
  queryOf,
  readFixture,
} from "../support/utils.js";

test.describe("Admin servers index server actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(({ currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
      "servers.update",
      "servers.create",
      "servers.delete",
    ];
  });

  test.describe("delete server", () => {
    test.beforeEach(async ({ page, servers }) => {
      servers.data[3].status = -1;
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
      await expect(page.getByTestId("servers-delete-dialog")).toHaveCount(0);
    });

    test("dialog shows the server name and can be cancelled", async ({
      page,
    }) => {
      const dialog = page.getByTestId("servers-delete-dialog");
      await page
        .getByTestId("server-item")
        .nth(3)
        .getByTestId("servers-delete-button")
        .click();
      await expect(dialog).toBeVisible();

      await expect(dialog).toContainText("admin.servers.delete.title");
      await expect(dialog).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 04"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId("server-item")).toHaveCount(5);
    });

    test("confirm deletes the server and reloads the list", async ({
      page,
      servers,
    }) => {
      const dialog = page.getByTestId("servers-delete-dialog");
      await page
        .getByTestId("server-item")
        .nth(3)
        .getByTestId("servers-delete-button")
        .click();
      await expect(dialog).toBeVisible();

      const deleteMock = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/4",
        { status: 204, hold: true },
      );
      servers.data = servers.data.filter((server) => server.id !== 4);
      servers.meta.to = 4;
      servers.meta.total = 4;
      servers.meta.total_no_filter = 4;

      await page.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();

      const reload = page.waitForRequest(/\/api\/v1\/servers\?/);
      await nthRequest(deleteMock);
      deleteMock.release();
      await reload;

      // Check that server was deleted and the dialog is closed
      await expect(page.getByTestId("server-item")).toHaveCount(4);
      await expect(dialog).toHaveCount(0);
    });

    test("dialog of another server shows its name after a delete", async ({
      page,
      servers,
    }) => {
      const dialog = page.getByTestId("servers-delete-dialog");
      await page
        .getByTestId("server-item")
        .nth(3)
        .getByTestId("servers-delete-button")
        .click();
      await expect(dialog).toBeVisible();

      await mockMethod(page, "DELETE", "**/api/v1/servers/4", { status: 204 });
      servers.data = servers.data.filter((server) => server.id !== 4);
      servers.meta.to = 4;
      servers.meta.total = 4;
      servers.meta.total_no_filter = 4;

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();
      await expect(page.getByTestId("server-item")).toHaveCount(4);
      await expect(dialog).toHaveCount(0);

      await page
        .getByTestId("server-item")
        .nth(2)
        .getByTestId("servers-delete-button")
        .click();
      await expect(dialog).toBeVisible();

      await expect(dialog).toContainText("admin.servers.delete.title");
      await expect(dialog).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 03"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);
    });
  });

  test.describe("delete server errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
      await expect(page.getByTestId("servers-delete-dialog")).toHaveCount(0);
      await page
        .getByTestId("server-item")
        .nth(2)
        .getByTestId("servers-delete-button")
        .click();
      await expect(page.getByTestId("servers-delete-dialog")).toBeVisible();
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const deleteMock = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/3",
        { status: 500, json: { message: "Test" } },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);

      await expect(page.getByTestId("servers-delete-dialog")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("server not found (404) reloads the list and closes the dialog", async ({
      page,
      servers,
    }) => {
      servers.data = servers.data.filter((server) => server.id !== 3);
      servers.meta.to = 4;
      servers.meta.total = 4;
      servers.meta.total_no_filter = 4;
      servers.data[2].status = -1;
      const deleteMock = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/3",
        {
          status: 404,
          json: { message: "model_not_found", model: "server", ids: [3] },
        },
      );

      const reload = page.waitForRequest(/\/api\/v1\/servers\?/);
      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);
      await reload;

      await expect(page.getByTestId("servers-delete-dialog")).toHaveCount(0);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);

      // Check that server is not in list anymore
      await expect(page.getByTestId("server-item")).toHaveCount(4);

      // The dialog can be opened for a different server
      await page
        .getByTestId("server-item")
        .nth(2)
        .getByTestId("servers-delete-button")
        .click();
      await expect(page.getByTestId("servers-delete-dialog")).toBeVisible();
      await expect(page.getByTestId("servers-delete-dialog")).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 04"}',
      );
      await page.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("servers-delete-dialog")).toHaveCount(0);
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      const deleteMock = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/3",
        { status: 401 },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);

      await expectLoginRedirect(page, "/admin/servers");
    });
  });

  test.describe("reload servers", () => {
    test("initial load does not update the usage", async ({ page }) => {
      const request = page.waitForRequest(/\/api\/v1\/servers\?/);
      await page.goto("/admin/servers");

      expect(queryOf(await request)).toMatchObject({
        update_usage: "0",
        page: "1",
      });
      const cells = page
        .getByTestId("server-item")
        .first()
        .getByTestId("server-item-cell");
      await expect(cells.nth(4)).toHaveText("2");
      await expect(cells.nth(5)).toHaveText("10");
      await expect(cells.nth(6)).toHaveText("5");
    });

    test("reload with usage shows the loading state and the new usage", async ({
      page,
    }) => {
      await page.goto("/admin/servers");
      const cells = page
        .getByTestId("server-item")
        .first()
        .getByTestId("server-item-cell");
      await expect(cells.nth(4)).toHaveText("2");
      await expect(cells.nth(5)).toHaveText("10");
      await expect(cells.nth(6)).toHaveText("5");

      const reloadedServers = readFixture("servers.json");
      showServersPage(reloadedServers, 1, {
        usage: { meeting_count: 3, participant_count: 50, video_count: 6 },
      });
      const release = await holdRequest(page, /\/api\/v1\/servers\?/, {
        json: reloadedServers,
      });

      const request = page.waitForRequest(/\/api\/v1\/servers\?/);
      await page.getByTestId("servers-reload-usage-button").click();

      // Check loading state during reload
      const search = page.getByTestId("server-search").first();
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("button")).toBeDisabled();
      await expect(
        page.getByTestId("servers-reload-usage-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("servers-reload-no-usage-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("servers-add-button")).toBeVisible();
      await expect(page.getByTestId("servers-add-button")).toBeEnabled();

      const item = page.getByTestId("server-item").nth(2);
      for (const button of ["view", "edit", "delete"]) {
        const locator = item.getByTestId(`servers-${button}-button`);
        await expect(locator).toBeVisible();
        await expect(locator).toBeDisabled();
      }

      release();

      expect(queryOf(await request)).toMatchObject({
        update_usage: "1",
        page: "1",
      });
      await expect(cells.nth(4)).toHaveText("3");
      await expect(cells.nth(5)).toHaveText("50");
      await expect(cells.nth(6)).toHaveText("6");
    });

    test.describe("on page 2", () => {
      test.beforeEach(async ({ page, servers }) => {
        showServersPage(servers, 1);
        await page.goto("/admin/servers");
        const cells = page
          .getByTestId("server-item")
          .first()
          .getByTestId("server-item-cell");
        await expect(cells.nth(4)).toHaveText("2");
        await expect(cells.nth(5)).toHaveText("10");
        await expect(cells.nth(6)).toHaveText("5");

        showServersPage(servers, 2);
        const request = page.waitForRequest(/\/api\/v1\/servers\?/);
        // there are two paginator components (first one for small devices, second one for larger devices)
        await page.getByTestId("paginator-next-button").nth(1).click();

        // Changing the page does not update the usage
        expect(queryOf(await request)).toMatchObject({
          update_usage: "0",
          page: "2",
        });
        await expect(cells.nth(4)).toHaveText("10");
        await expect(cells.nth(5)).toHaveText("50");
        await expect(cells.nth(6)).toHaveText("5");
        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 1);
      });

      test("reload with usage keeps the page", async ({ page, servers }) => {
        showServersPage(servers, 2, {
          usage: { meeting_count: 6, participant_count: 60, video_count: 10 },
        });

        const request = page.waitForRequest(/\/api\/v1\/servers\?/);
        await page.getByTestId("servers-reload-usage-button").click();

        expect(queryOf(await request)).toMatchObject({
          update_usage: "1",
          page: "2",
        });
        const cells = page
          .getByTestId("server-item")
          .first()
          .getByTestId("server-item-cell");
        await expect(cells.nth(4)).toHaveText("6");
        await expect(cells.nth(5)).toHaveText("60");
        await expect(cells.nth(6)).toHaveText("10");
        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 1);
      });

      test("reload without usage keeps the page", async ({ page }) => {
        const request = page.waitForRequest(/\/api\/v1\/servers\?/);
        await page.getByTestId("servers-reload-no-usage-button").click();

        expect(queryOf(await request)).toMatchObject({
          update_usage: "0",
          page: "2",
        });
        const cells = page
          .getByTestId("server-item")
          .first()
          .getByTestId("server-item-cell");
        await expect(cells.nth(4)).toHaveText("10");
        await expect(cells.nth(5)).toHaveText("50");
        await expect(cells.nth(6)).toHaveText("5");
        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 1);
      });
    });
  });

  test.describe("navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
    });

    test("open add new server page", async ({ page }) => {
      await page.getByTestId("servers-add-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/new/);
    });

    test("open edit server page", async ({ page }) => {
      await page
        .getByTestId("server-item")
        .first()
        .getByTestId("servers-edit-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/servers\/1\/edit/);
    });

    test("open view server page", async ({ page }) => {
      await page
        .getByTestId("server-item")
        .first()
        .getByTestId("servers-view-button")
        .click();

      await expect(page).toHaveURL(/\/admin\/servers\/1$/);
    });
  });
});
