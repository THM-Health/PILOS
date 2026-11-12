import { test } from "../support/fixtures/adminServerPools.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin server pools index server pool actions", () => {
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

    await page.goto("/admin/server_pools");
    await expect(page.getByTestId("server-pool-item")).toHaveCount(2);
    await expect(page.getByTestId("server-pools-delete-dialog")).toBeHidden();
  });

  test.describe("delete server pool", () => {
    test("dialog shows server pool", async ({ page }) => {
      await page
        .getByTestId("server-pool-item")
        .nth(0)
        .getByTestId("server-pools-delete-button")
        .click();

      const dialog = page.getByTestId("server-pools-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.server_pools.delete.title");
      await expect(dialog).toContainText(
        'admin.server_pools.delete.confirm_{"name":"Test"}',
      );
    });

    test("delete shows loading state and removes server pool", async ({
      page,
      serverPools,
    }) => {
      await page
        .getByTestId("server-pool-item")
        .nth(0)
        .getByTestId("server-pools-delete-button")
        .click();
      await expect(
        page.getByTestId("server-pools-delete-dialog"),
      ).toBeVisible();

      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/serverPools/1",
        { status: 204, hold: true },
      );
      serverPools.data = serverPools.data.filter(
        (serverPool) => serverPool.id !== 1,
      );
      Object.assign(serverPools.meta, { to: 1, total: 1, total_no_filter: 1 });

      const continueButton = page.getByTestId("dialog-continue-button");
      await expect(continueButton).toHaveText("app.yes");
      await continueButton.click();

      // Check loading
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(continueButton).toBeDisabled();

      deleteRequest.release();
      await nthRequest(deleteRequest);

      // Check that server pool was deleted and dialog is closed
      await expect(page.getByTestId("server-pool-item")).toHaveCount(1);
      await expect(page.getByTestId("server-pool-item")).toContainText(
        "Production",
      );
      await expect(page.getByTestId("server-pools-delete-dialog")).toBeHidden();
    });

    test("dialog can be opened for another server pool after deletion", async ({
      page,
      serverPools,
    }) => {
      await page
        .getByTestId("server-pool-item")
        .nth(0)
        .getByTestId("server-pools-delete-button")
        .click();
      await expect(
        page.getByTestId("server-pools-delete-dialog"),
      ).toBeVisible();

      await mockMethod(page, "DELETE", "**/api/v1/serverPools/1", {
        status: 204,
      });
      serverPools.data = serverPools.data.filter(
        (serverPool) => serverPool.id !== 1,
      );
      Object.assign(serverPools.meta, { to: 1, total: 1, total_no_filter: 1 });
      await page.getByTestId("dialog-continue-button").click();

      await expect(page.getByTestId("server-pools-delete-dialog")).toBeHidden();
      await expect(page.getByTestId("server-pool-item")).toHaveCount(1);

      // Reopen dialog for different server pool
      await page
        .getByTestId("server-pool-item")
        .nth(0)
        .getByTestId("server-pools-delete-button")
        .click();

      const dialog = page.getByTestId("server-pools-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.server_pools.delete.title");
      await expect(dialog).toContainText(
        'admin.server_pools.delete.confirm_{"name":"Production"}',
      );

      // Cancel delete of server pool
      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();
    });

    test.describe("with opened dialog", () => {
      test.beforeEach(async ({ page }) => {
        await page
          .getByTestId("server-pool-item")
          .nth(0)
          .getByTestId("server-pools-delete-button")
          .click();
        await expect(
          page.getByTestId("server-pools-delete-dialog"),
        ).toBeVisible();
      });

      test("room types attached (428) shows the room types", async ({
        page,
      }) => {
        await mockMethod(page, "DELETE", "**/api/v1/serverPools/1", {
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

        // Check that error is shown correctly
        const dialog = page.getByTestId("server-pools-delete-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          'admin.server_pools.delete.failed_{"count":2,"n":2}',
        );
        await expect(dialog).toContainText("Lecture");
        await expect(dialog).toContainText("Meeting");

        // Check that action buttons are hidden
        await expect(page.getByTestId("dialog-cancel-button")).toBeHidden();
        await expect(page.getByTestId("dialog-continue-button")).toBeHidden();
      });

      test("dialog with room types error can be closed", async ({ page }) => {
        await mockMethod(page, "DELETE", "**/api/v1/serverPools/1", {
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
            ],
          },
        });
        await page.getByTestId("dialog-continue-button").click();
        await expect(
          page.getByTestId("server-pools-delete-dialog"),
        ).toContainText("Lecture");

        await page.getByTestId("dialog-header-close-button").click();
        await expect(
          page.getByTestId("server-pools-delete-dialog"),
        ).toBeHidden();

        // Open dialog again, the error is not shown anymore
        await page
          .getByTestId("server-pool-item")
          .nth(0)
          .getByTestId("server-pools-delete-button")
          .click();
        const dialog = page.getByTestId("server-pools-delete-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          'admin.server_pools.delete.confirm_{"name":"Test"}',
        );
        await expect(dialog).not.toContainText("Lecture");
        await expect(page.getByTestId("dialog-continue-button")).toBeVisible();
      });

      test("server error (500) keeps dialog open", async ({ page }) => {
        await mockMethod(page, "DELETE", "**/api/v1/serverPools/1", {
          status: 500,
          json: { message: "Test" },
        });

        await page.getByTestId("dialog-continue-button").click();

        // Check that dialog is still open and that error message is shown
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(
          page.getByTestId("server-pools-delete-dialog"),
        ).toBeVisible();
      });

      test("server pool not found (404) reloads server pools and closes dialog", async ({
        page,
        serverPools,
      }) => {
        serverPools.data = serverPools.data.filter(
          (serverPool) => serverPool.id !== 1,
        );
        Object.assign(serverPools.meta, {
          to: 1,
          total: 1,
          total_no_filter: 1,
        });
        await mockMethod(page, "DELETE", "**/api/v1/serverPools/1", {
          status: 404,
          json: { message: "model_not_found", model: "server_pool", ids: [1] },
        });

        await page.getByTestId("dialog-continue-button").click();

        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.server_pool"}',
          'app.flash.model_not_found.details_{"ids":"1"}',
        ]);
        await expect(
          page.getByTestId("server-pools-delete-dialog"),
        ).toBeHidden();

        // Check that server pool is not in list anymore
        const items = page.getByTestId("server-pool-item");
        await expect(items).toHaveCount(1);
        await expect(items.nth(0)).toContainText("Production");
      });

      test("unauthenticated (401) redirects to login", async ({ page }) => {
        await mockMethod(page, "DELETE", "**/api/v1/serverPools/1", {
          status: 401,
        });

        await page.getByTestId("dialog-continue-button").click();

        await expectLoginRedirect(page, "/admin/server_pools");
      });
    });
  });

  test("open add new server pool page", async ({ page }) => {
    await page.getByTestId("server-pools-add-button").click();

    await expect(page).toHaveURL(/\/admin\/server_pools\/new/);
  });

  test("open edit server pool page", async ({ page }) => {
    await page
      .getByTestId("server-pool-item")
      .nth(0)
      .getByTestId("server-pools-edit-button")
      .click();

    await expect(page).toHaveURL(/\/admin\/server_pools\/1\/edit/);
  });

  test("open view server pool page", async ({ page }) => {
    await page
      .getByTestId("server-pool-item")
      .nth(0)
      .getByTestId("server-pools-view-button")
      .click();

    await expect(page).toHaveURL(/\/admin\/server_pools\/1$/);
  });
});
