import { mergeTests } from "@playwright/test";
import { test as settingsControllerTest } from "../support/fixtures/settingsController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import { serverError } from "../support/utils.js";

const test = mergeTests(settingsControllerTest, timezonesTest);

test.describe("Admin settings general", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "settings.viewAny",
      "settings.update",
    ];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/settings");
  });

  test("visit with user without permission to view settings", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = ["admin.view"];

    await page.goto("/admin/settings");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/settings/);
  });

  test("loading state with view permission only", async ({
    page,
    currentUserResponse,
    settingsResponse,
    getSettingsApiMock,
  }) => {
    currentUserResponse.data.permissions = ["admin.view", "settings.viewAny"];
    getSettingsApiMock.respondWith({ json: settingsResponse, hold: true });

    await page.goto("/admin/settings");

    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();
    await expect(page.getByTestId("overlay")).toBeVisible();
    await expect(page.getByTestId("settings-save-button")).toHaveCount(0);

    getSettingsApiMock.release();

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expectAdminBreadcrumbs(page, "admin.breadcrumbs.settings");
    await expect(page.getByTestId("settings-save-button")).toHaveCount(0);
  });

  test("loading state with edit permission", async ({
    page,
    settingsResponse,
    getSettingsApiMock,
  }) => {
    getSettingsApiMock.respondWith({ json: settingsResponse, hold: true });

    await page.goto("/admin/settings");

    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();
    await expect(page.getByTestId("overlay")).toBeVisible();
    await expect(page.getByTestId("settings-save-button")).toBeDisabled();
    await expect(page.getByTestId("settings-save-button")).toContainText(
      "app.save",
    );

    getSettingsApiMock.release();

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expectAdminBreadcrumbs(page, "admin.breadcrumbs.settings");
  });

  test.describe("load settings errors", () => {
    test("server error shows toast, overlay and retry button", async ({
      page,
      getSettingsApiMock,
    }) => {
      getSettingsApiMock.respondWith(serverError());

      await page.goto("/admin/settings");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.getByTestId("loading-retry-button")).toHaveText(
        "app.reload",
      );
    });

    test("retry after server error loads the settings", async ({
      page,
      settingsResponse,
      getSettingsApiMock,
    }) => {
      getSettingsApiMock.respondWith(serverError());

      await page.goto("/admin/settings");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getSettingsApiMock.respondWith({ json: settingsResponse });
      await page.getByTestId("loading-retry-button").click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toBeHidden();
      await expect(page.getByTestId("settings-save-button")).toBeEnabled();
    });

    test("unauthenticated redirects to login", async ({
      page,
      getSettingsApiMock,
    }) => {
      getSettingsApiMock.respondWith({ status: 401 });

      await page.goto("/admin/settings");

      await expectLoginRedirect(page, "/admin/settings");
    });
  });

  test.describe("load timezones errors", () => {
    test("loading state and server error", async ({
      page,
      getTimezonesApiMock,
    }) => {
      getTimezonesApiMock.respondWith({ ...serverError(), hold: true });

      await page.goto("/admin/settings");

      // Check loading
      await expect(page.getByTestId("settings-save-button")).toBeDisabled();
      const dropdown = page.getByTestId("timezone-dropdown");
      await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );

      getTimezonesApiMock.release();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(dropdown).toHaveText("admin.settings.default_timezone");
      await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    test("reload timezones after error", async ({
      page,
      timezonesResponse,
      getTimezonesApiMock,
    }) => {
      getTimezonesApiMock.respondWith(serverError());

      await page.goto("/admin/settings");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getTimezonesApiMock.respondWith({ json: timezonesResponse });
      await page.getByTestId("timezone-reload-button").click();

      const dropdown = page.getByTestId("timezone-dropdown");
      await expect(dropdown).toHaveText("UTC");
      await expect(dropdown.locator(".p-select-label")).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );

      await dropdown.click();

      const options = page.getByTestId("timezone-dropdown-option");
      await expect(options).toHaveText([
        "America/New_York",
        "Australia/Sydney",
        "Europe/Berlin",
        "UTC",
      ]);
      await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");
    });

    test("unauthenticated redirects to login", async ({
      page,
      getTimezonesApiMock,
    }) => {
      getTimezonesApiMock.respondWith({ status: 401 });

      await page.goto("/admin/settings");

      await expectLoginRedirect(page, "/admin/settings");
    });
  });
});
