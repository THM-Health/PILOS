import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  interceptAdminServerPoolsViewRequests,
  interceptAdminServerPoolsIndexRequests,
} from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const SERVER_POOL_URL = "**/api/v1/serverPools/1";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Expect the original server pool values (fixture) in the form, optionally disabled (view mode).
 */
async function expectOriginalValues(page, disabled) {
  const state = disabled ? "toBeDisabled" : "toBeEnabled";
  await expect(page.locator("#name")).toHaveValue("Test");
  await expect(page.locator("#name"))[state]();
  await expect(page.locator("#description")).toHaveValue("Pool for testing");
  await expect(page.locator("#description"))[state]();

  const dropdown = page.getByTestId("server-dropdown");
  const chips = dropdown.getByTestId("server-chip");
  await expect(chips).toHaveCount(2);
  await expect(dropdown).toHaveClass(
    disabled ? /multiselect--disabled/ : /^((?!multiselect--disabled).)*$/,
  );
  for (const [index, name] of ["Server 01", "Server 02"].entries()) {
    await expect(chips.nth(index)).toContainText(name);
    await expect(
      chips.nth(index).getByTestId("remove-server-button"),
    ).toHaveCount(disabled ? 0 : 1);
  }
}

test.describe("Admin server pools view", () => {
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

  test.describe("delete", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/server_pools/1");
      await expect(
        page.getByTestId("server-pools-delete-button"),
      ).toBeVisible();
      await expect(page.getByTestId("server-pools-delete-dialog")).toHaveCount(
        0,
      );

      await page.getByTestId("server-pools-delete-button").click();
    });

    test("dialog shows the server pool", async ({ page }) => {
      const dialog = page.getByTestId("server-pools-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.server_pools.delete.title");
      await expect(dialog).toContainText(
        'admin.server_pools.delete.confirm_{"name":"Test"}',
      );
    });

    test("delete the server pool and redirect to the index", async ({
      page,
    }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_POOL_URL, {
        status: 204,
        hold: true,
      });

      const serverPools = readFixture("serverPools.json");
      serverPools.data = serverPools.data.slice(1, 2);
      serverPools.meta.to = 1;
      serverPools.meta.total = 1;
      serverPools.meta.total_no_filter = 1;
      await mockMethod(page, "GET", "**/api/v1/serverPools*", {
        json: serverPools,
      });

      const dialog = page.getByTestId("server-pools-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();

      deleteRequest.release();
      await nthRequest(deleteRequest);

      // Check that redirect worked
      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
      await expect(dialog).toHaveCount(0);
    });

    test("server pool attached to room types (428) shows the room types", async ({
      page,
    }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_POOL_URL, {
        status: 428,
        json: {
          error: 428,
          message: "app.errors.server_pool_delete_failed",
          room_types: [
            {
              id: 1,
              name: "Lecture",
              description: null,
              color: "#80BA27",
              model_name: "RoomType",
              updated_at: "2021-01-12T14:35:11.000000Z",
            },
            {
              id: 2,
              name: "Meeting",
              description: null,
              color: "#4a5c66",
              model_name: "RoomType",
              updated_at: "2021-01-12T14:35:11.000000Z",
            },
          ],
        },
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      const dialog = page.getByTestId("server-pools-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'admin.server_pools.delete.failed_{"count":2,"n":2}',
      );
      await expect(dialog).toContainText("Lecture");
      await expect(dialog).toContainText("Meeting");

      // Action buttons are hidden
      await expect(page.getByTestId("dialog-cancel-button")).toHaveCount(0);
      await expect(page.getByTestId("dialog-continue-button")).toHaveCount(0);

      // Close dialog
      await page.getByTestId("dialog-header-close-button").click();
      await expect(dialog).toHaveCount(0);
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_POOL_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(
        page.getByTestId("server-pools-delete-dialog"),
      ).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("server pool not found (404) redirects to the index", async ({
      page,
    }) => {
      await interceptAdminServerPoolsIndexRequests(page);
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_POOL_URL, {
        status: 404,
        json: { message: "model_not_found", model: "server_pool", ids: [1] },
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await expect(page.getByTestId("server-pool-item").first()).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server_pool"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_POOL_URL, {
        status: 401,
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expectLoginRedirect(page, "/admin/server_pools/1");
    });
  });

  test.describe("switch between edit and view", () => {
    test("edit changes are discarded when switching to view", async ({
      page,
    }) => {
      await page.goto("/admin/server_pools/1/edit");
      await expectOriginalValues(page, false);

      await page.locator("#name").fill("Server Pool 1");
      await page.locator("#description").fill("Server Pool 1 description");

      const dropdown = page.getByTestId("server-dropdown");
      await dropdown.click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await page.locator(".multiselect__option").nth(2).click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      const chips = dropdown.getByTestId("server-chip");
      await expect(chips).toHaveCount(3);
      for (const [index, name] of [
        "Server 01",
        "Server 02",
        "Server 03",
      ].entries()) {
        await expect(chips.nth(index)).toContainText(name);
        await expect(
          chips.nth(index).getByTestId("remove-server-button"),
        ).toBeVisible();
      }

      // Close dropdown
      await page.locator(".multiselect__select").click();
      await expect(page.locator(".multiselect__content")).toHaveCount(0);

      await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();

      // Switch to view
      await page.getByTestId("server-pools-cancel-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);

      // Changes were not saved
      await expectOriginalValues(page, true);
      await expect(page.getByTestId("server-pools-save-button")).toHaveCount(0);
    });

    test("switch from view back to edit shows the original values", async ({
      page,
    }) => {
      await page.goto("/admin/server_pools/1");
      await expectOriginalValues(page, true);
      await expect(page.getByTestId("server-pools-save-button")).toHaveCount(0);

      await page.getByTestId("server-pools-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/server_pools\/1\/edit$/);

      await expectOriginalValues(page, false);
      await expect(page.getByTestId("server-pools-save-button")).toBeEnabled();
    });
  });
});
