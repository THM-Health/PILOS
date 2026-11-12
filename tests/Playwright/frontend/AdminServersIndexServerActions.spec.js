import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import { interceptAdminServersViewRequests } from "../support/mocks.js";
import {
  expectActivePage,
  holdRequest,
  mockMethod,
  nthRequest,
  queryOf,
} from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const isServersUrl = (url) => url.pathname === "/api/v1/servers";

const isServersRequest = (request) =>
  request.method() === "GET" && isServersUrl(new URL(request.url()));

const isDeleteUrl = (id) => (url) => url.pathname === `/api/v1/servers/${id}`;

/**
 * Mock the servers list with the fixture changed by `mutate`. Later mocks win.
 */
async function mockServers(page, mutate = () => {}) {
  const servers = readFixture("servers.json");
  mutate(servers);
  return mockMethod(page, "GET", isServersUrl, { json: servers });
}

/**
 * Remove the server from the list and fix the meta data.
 */
function removeServer(servers, id) {
  servers.data = servers.data.filter((server) => server.id !== id);
  servers.meta.to = 4;
  servers.meta.total = 4;
  servers.meta.total_no_filter = 4;
}

/**
 * Show only one server per page (5 pages).
 */
function onePage(servers, pageNumber, usage = {}) {
  const index = pageNumber - 1;
  servers.data = servers.data.slice(index, index + 1);
  Object.assign(servers.data[0], usage);
  Object.assign(servers.meta, {
    current_page: pageNumber,
    from: pageNumber,
    last_page: 5,
    per_page: 1,
    to: pageNumber,
  });
}

const serverItem = (page, index) => page.getByTestId("server-item").nth(index);

async function expectUsage(page, [meetings, participants, videos]) {
  const cells = serverItem(page, 0).getByTestId("server-item-cell");
  await expect(cells.nth(4)).toHaveText(meetings);
  await expect(cells.nth(5)).toHaveText(participants);
  await expect(cells.nth(6)).toHaveText(videos);
}

const dialog = (page) => page.getByTestId("servers-delete-dialog");

async function openDeleteDialog(page, index) {
  await serverItem(page, index).getByTestId("servers-delete-button").click();
  await expect(dialog(page)).toBeVisible();
}

// there are two paginator components (first one for small devices, second one for larger devices)
const nextPageButton = (page) =>
  page.getByTestId("paginator-next-button").nth(1);

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
    test.beforeEach(async ({ page }) => {
      await mockServers(page, (servers) => {
        servers.data[3].status = -1;
      });
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
      await expect(dialog(page)).toHaveCount(0);
    });

    test("dialog shows the server name and can be cancelled", async ({
      page,
    }) => {
      await openDeleteDialog(page, 3);

      await expect(dialog(page)).toContainText("admin.servers.delete.title");
      await expect(dialog(page)).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 04"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog(page)).toHaveCount(0);
      await expect(page.getByTestId("server-item")).toHaveCount(5);
    });

    test("confirm deletes the server and reloads the list", async ({
      page,
    }) => {
      await openDeleteDialog(page, 3);

      const deleteMock = await mockMethod(page, "DELETE", isDeleteUrl(4), {
        status: 204,
        hold: true,
      });
      await mockServers(page, (servers) => removeServer(servers, 4));

      await page.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();

      const reload = page.waitForRequest(isServersRequest);
      await nthRequest(deleteMock);
      deleteMock.release();
      await reload;

      // Check that server was deleted and the dialog is closed
      await expect(page.getByTestId("server-item")).toHaveCount(4);
      await expect(dialog(page)).toHaveCount(0);
    });

    test("dialog of another server shows its name after a delete", async ({
      page,
    }) => {
      await openDeleteDialog(page, 3);

      await mockMethod(page, "DELETE", isDeleteUrl(4), { status: 204 });
      await mockServers(page, (servers) => removeServer(servers, 4));

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();
      await expect(page.getByTestId("server-item")).toHaveCount(4);
      await expect(dialog(page)).toHaveCount(0);

      await openDeleteDialog(page, 2);

      await expect(dialog(page)).toContainText("admin.servers.delete.title");
      await expect(dialog(page)).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 03"}',
      );

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog(page)).toHaveCount(0);
    });
  });

  test.describe("delete server errors", () => {
    test.beforeEach(async ({ page }) => {
      await mockServers(page);
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
      await expect(dialog(page)).toHaveCount(0);
      await openDeleteDialog(page, 2);
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const deleteMock = await mockMethod(page, "DELETE", isDeleteUrl(3), {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);

      await expect(dialog(page)).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("server not found (404) reloads the list and closes the dialog", async ({
      page,
    }) => {
      await mockServers(page, (servers) => {
        removeServer(servers, 3);
        servers.data[2].status = -1;
      });
      const deleteMock = await mockMethod(page, "DELETE", isDeleteUrl(3), {
        status: 404,
        json: { message: "model_not_found", model: "server", ids: [3] },
      });

      const reload = page.waitForRequest(isServersRequest);
      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);
      await reload;

      await expect(dialog(page)).toHaveCount(0);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);

      // Check that server is not in list anymore
      await expect(page.getByTestId("server-item")).toHaveCount(4);

      // The dialog can be opened for a different server
      await openDeleteDialog(page, 2);
      await expect(dialog(page)).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 04"}',
      );
      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog(page)).toHaveCount(0);
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      const deleteMock = await mockMethod(page, "DELETE", isDeleteUrl(3), {
        status: 401,
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteMock);

      await expectLoginRedirect(page, "/admin/servers");
    });
  });

  test.describe("reload servers", () => {
    test.beforeEach(async ({ page }) => {
      await mockServers(page);
    });

    test("initial load does not update the usage", async ({ page }) => {
      const request = page.waitForRequest(isServersRequest);
      await page.goto("/admin/servers");

      expect(queryOf(await request)).toMatchObject({
        update_usage: "0",
        page: "1",
      });
      await expectUsage(page, ["2", "10", "5"]);
    });

    test("reload with usage shows the loading state and the new usage", async ({
      page,
    }) => {
      await page.goto("/admin/servers");
      await expectUsage(page, ["2", "10", "5"]);

      const release = await holdRequest(page, isServersUrl, {
        json: (() => {
          const servers = readFixture("servers.json");
          onePage(servers, 1, {
            meeting_count: 3,
            participant_count: 50,
            video_count: 6,
          });
          return servers;
        })(),
      });

      const request = page.waitForRequest(isServersRequest);
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

      const item = serverItem(page, 2);
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
      await expectUsage(page, ["3", "50", "6"]);
    });

    test.describe("on page 2", () => {
      test.beforeEach(async ({ page }) => {
        await mockServers(page, (servers) => onePage(servers, 1));
        await page.goto("/admin/servers");
        await expectUsage(page, ["2", "10", "5"]);

        await mockServers(page, (servers) => onePage(servers, 2));
        const request = page.waitForRequest(isServersRequest);
        await nextPageButton(page).click();

        // Changing the page does not update the usage
        expect(queryOf(await request)).toMatchObject({
          update_usage: "0",
          page: "2",
        });
        await expectUsage(page, ["10", "50", "5"]);
        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 1);
      });

      test("reload with usage keeps the page", async ({ page }) => {
        await mockServers(page, (servers) =>
          onePage(servers, 2, {
            meeting_count: 6,
            participant_count: 60,
            video_count: 10,
          }),
        );

        const request = page.waitForRequest(isServersRequest);
        await page.getByTestId("servers-reload-usage-button").click();

        expect(queryOf(await request)).toMatchObject({
          update_usage: "1",
          page: "2",
        });
        await expectUsage(page, ["6", "60", "10"]);
        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 1);
      });

      test("reload without usage keeps the page", async ({ page }) => {
        const request = page.waitForRequest(isServersRequest);
        await page.getByTestId("servers-reload-no-usage-button").click();

        expect(queryOf(await request)).toMatchObject({
          update_usage: "0",
          page: "2",
        });
        await expectUsage(page, ["10", "50", "5"]);
        await expect(page.getByTestId("paginator-page")).toHaveCount(5);
        await expectActivePage(page, 1);
      });
    });
  });

  test.describe("navigation", () => {
    test.beforeEach(async ({ page }) => {
      await mockServers(page);
      await page.goto("/admin/servers");
      await expect(page.getByTestId("server-item")).toHaveCount(5);
    });

    test("open add new server page", async ({ page }) => {
      await page.getByTestId("servers-add-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/new/);
    });

    test("open edit server page", async ({ page }) => {
      await interceptAdminServersViewRequests(page);

      await serverItem(page, 0).getByTestId("servers-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/1\/edit/);
    });

    test("open view server page", async ({ page }) => {
      await interceptAdminServersViewRequests(page);

      await serverItem(page, 0).getByTestId("servers-view-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/1$/);
    });
  });
});
