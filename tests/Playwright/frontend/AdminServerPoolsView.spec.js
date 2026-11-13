import { mergeTests } from "@playwright/test";
import { test as serverPoolControllerTest } from "../support/fixtures/serverPoolController.js";
import { test as serverControllerTest } from "../support/fixtures/serverController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import { serverError, modelNotFound } from "../support/utils.js";

const test = mergeTests(serverPoolControllerTest, serverControllerTest);

test.use({ authenticated: true });

test.describe("Admin server pools view", () => {
  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "serverPools.viewAny",
      "serverPools.view",
    ];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/server_pools/1");
  });

  test("visit with user without permission to view server pools", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "serverPools.viewAny",
    ];

    await page.goto("/admin/server_pools/1");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/server_pools\/1/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test("loading state hides the buttons and shows the overlay", async ({
    page,
    serverPoolResponse,
    getServerPoolApiMock,
  }) => {
    getServerPoolApiMock.respondWith({ json: serverPoolResponse, hold: true });
    await page.goto("/admin/server_pools/1");

    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();
    await expect(page.getByTestId("overlay")).toBeVisible();
    for (const button of ["cancel-edit", "edit", "delete", "save"]) {
      await expect(
        page.getByTestId(`server-pools-${button}-button`),
      ).toHaveCount(0);
    }

    getServerPoolApiMock.release();

    await expect(page.getByTestId("name-field")).toBeVisible();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
    for (const button of ["cancel-edit", "edit", "delete", "save"]) {
      await expect(
        page.getByTestId(`server-pools-${button}-button`),
      ).toHaveCount(0);
    }
  });

  test.describe("view without update permission", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/server_pools/1");
      await expect(page.locator("#name")).toHaveValue("Test");
    });

    test("shows breadcrumbs", async ({ page }) => {
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.server_pools.index",
        'admin.breadcrumbs.server_pools.view_{"name":"Test"}',
      );
    });

    test("shows disabled name and description", async ({ page }) => {
      const nameField = page.getByTestId("name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("app.model_name");
      await expect(nameField.locator("#name")).toHaveValue("Test");
      await expect(nameField.locator("#name")).toBeDisabled();

      const descriptionField = page.getByTestId("description-field");
      await expect(descriptionField).toBeVisible();
      await expect(descriptionField).toContainText("app.description");
      await expect(descriptionField.locator("#description")).toHaveValue(
        "Pool for testing",
      );
      await expect(descriptionField.locator("#description")).toBeDisabled();
    });

    test("shows disabled servers without remove buttons", async ({ page }) => {
      const serverField = page.getByTestId("server-field");
      await expect(serverField).toBeVisible();
      await expect(serverField).toContainText("app.servers");

      const dropdown = serverField.getByTestId("server-dropdown");
      await expect(dropdown).toHaveClass(/multiselect--disabled/);
      const chips = dropdown.getByTestId("server-chip");
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Server 01");
      await expect(chips.nth(1)).toContainText("Server 02");
      await expect(chips.getByTestId("remove-server-button")).toHaveCount(0);
    });

    test("hides all action buttons", async ({ page }) => {
      for (const button of ["cancel-edit", "edit", "delete", "save"]) {
        await expect(
          page.getByTestId(`server-pools-${button}-button`),
        ).toHaveCount(0);
      }
    });
  });

  test("shows only the edit button with update permission", async ({
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

    await page.goto("/admin/server_pools/1");

    const editButton = page.getByTestId("server-pools-edit-button");
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
    await expect(editButton).toHaveText("app.edit");
    await expect(editButton).toHaveAttribute(
      "href",
      "/admin/server_pools/1/edit",
    );
    await expect(
      page.getByTestId("server-pools-cancel-edit-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("server-pools-delete-button")).toHaveCount(0);
    await expect(page.getByTestId("server-pools-save-button")).toHaveCount(0);
  });

  test("shows edit and delete buttons with delete permission", async ({
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
      "serverPools.delete",
    ];

    await page.goto("/admin/server_pools/1");

    const editButton = page.getByTestId("server-pools-edit-button");
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
    await expect(editButton).toHaveText("app.edit");
    await expect(editButton).toHaveAttribute(
      "href",
      "/admin/server_pools/1/edit",
    );
    const deleteButton = page.getByTestId("server-pools-delete-button");
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
    await expect(
      page.getByTestId("server-pools-cancel-edit-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("server-pools-save-button")).toHaveCount(0);
  });

  test.describe("open view errors", () => {
    test("server error shows overlay and can be retried", async ({
      page,
      serverPoolResponse,
      getServerPoolApiMock,
    }) => {
      getServerPoolApiMock.respondWith(serverError());

      await page.goto("/admin/server_pools/1");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getServerPoolApiMock.respondWith({
        json: serverPoolResponse,
      });
      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.locator("#name")).toHaveValue("Test");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(retryButton).toHaveCount(0);
    });

    test("404 redirects to the server pools index", async ({
      page,
      getServerPoolsApiMock,
      getServerPoolApiMock,
    }) => {
      getServerPoolApiMock.respondWith(modelNotFound("server_pool", [1]));

      const serverPoolsRequest = getServerPoolsApiMock.waitForNextRequest();
      await page.goto("/admin/server_pools/1");

      await expect(page).toHaveURL(/\/admin\/server_pools$/);
      await serverPoolsRequest;
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server_pool"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("401 redirects to the login page", async ({
      page,
      getServerPoolApiMock,
    }) => {
      getServerPoolApiMock.respondWith({
        status: 401,
      });

      await page.goto("/admin/server_pools/1");

      await expectLoginRedirect(page, "/admin/server_pools/1");
    });
  });
});
