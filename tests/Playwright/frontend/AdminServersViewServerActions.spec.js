import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  interceptAdminServersViewRequests,
  interceptAdminServersIndexRequests,
} from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const SERVER_URL = "**/api/v1/servers/1";
const CHECK_URL = "**/api/v1/servers/check";
const PANIC_URL = "**/api/v1/servers/1/panic";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.server"}',
  'app.flash.model_not_found.details_{"ids":"1"}',
];

const MODEL_NOT_FOUND_RESPONSE = {
  status: 404,
  json: { message: "model_not_found", model: "server", ids: [1] },
};

const CHECK_BODY = {
  base_url: "https://localhost/bigbluebutton",
  secret: "123456789",
};

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Expect the original server values (fixture) in the form, optionally disabled (view mode).
 */
async function expectOriginalValues(page, disabled) {
  const state = disabled ? "toBeDisabled" : "toBeEnabled";
  for (const [id, value] of [
    ["#name", "Server 01"],
    ["#description", "Testserver 01"],
    ["#base_url", "https://localhost/bigbluebutton"],
    ["#secret", "123456789"],
  ]) {
    await expect(page.locator(id)).toHaveValue(value);
    await expect(page.locator(id))[state]();
  }

  const options = page.getByTestId("strength-rating-option");
  await expect(options).toHaveCount(10);
  for (let i = 0; i < 10; i++) {
    await expect(options.nth(i)).toHaveAttribute(
      "data-p-active",
      i < 2 ? "true" : "false",
    );
  }

  const strength = page.getByTestId("strength-rating");
  const statusDropdown = page.getByTestId("status-dropdown");
  await expect(statusDropdown).toContainText("admin.servers.enabled");
  if (disabled) {
    await expect(strength).toHaveClass(/p-disabled/);
    await expect(statusDropdown.locator(".p-select-label")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  } else {
    await expect(strength).not.toHaveClass(/p-disabled/);
    await expect(statusDropdown.locator(".p-select-label")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
}

async function expectStatisticFieldsHidden(page) {
  await expect(page.getByTestId("meeting-count-field")).toHaveCount(0);
  await expect(page.getByTestId("own-meeting-count-field")).toHaveCount(0);
  await expect(page.getByTestId("participant-count-field")).toHaveCount(0);
  await expect(page.getByTestId("video-count-field")).toHaveCount(0);
}

test.describe("Admin servers view server actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
      "servers.update",
      "servers.create",
      "servers.delete",
    ];
    await interceptAdminServersViewRequests(page);
  });

  test.describe("delete", () => {
    test.beforeEach(async ({ page }) => {
      const server = readFixture("server.json");
      server.data.status = -1;
      await mockMethod(page, "GET", SERVER_URL, { json: server });

      await page.goto("/admin/servers/1");
      await expect(page.getByTestId("servers-delete-button")).toBeVisible();
      await expect(page.getByTestId("servers-delete-dialog")).toHaveCount(0);

      await page.getByTestId("servers-delete-button").click();
    });

    test("dialog shows the server", async ({ page }) => {
      const dialog = page.getByTestId("servers-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.servers.delete.title");
      await expect(dialog).toContainText(
        'admin.servers.delete.confirm_{"name":"Server 01"}',
      );
    });

    test("delete the server and redirect to the index", async ({ page }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_URL, {
        status: 204,
        hold: true,
      });

      const servers = readFixture("servers.json");
      servers.data = servers.data.slice(1, 4);
      servers.meta.to = 3;
      servers.meta.total = 3;
      servers.meta.total_no_filter = 3;
      await mockMethod(page, "GET", "**/api/v1/servers*", { json: servers });

      const dialog = page.getByTestId("servers-delete-dialog");
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

      // Check that redirect worked and the server was deleted
      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expect(page.getByTestId("server-item")).toHaveCount(3);
      await expect(dialog).toHaveCount(0);
    });

    test("server error (500) keeps the dialog open", async ({ page }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(page.getByTestId("servers-delete-dialog")).toBeVisible();
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("server not found (404) redirects to the index", async ({ page }) => {
      await interceptAdminServersIndexRequests(page);
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        SERVER_URL,
        MODEL_NOT_FOUND_RESPONSE,
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expect(page.getByTestId("server-item").first()).toBeVisible();
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const deleteRequest = await mockMethod(page, "DELETE", SERVER_URL, {
        status: 401,
      });

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expectLoginRedirect(page, "/admin/servers/1");
    });
  });

  test.describe("check connection", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers/1");

      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.online",
      );
      await expect(page.locator("#connectionStatus")).toBeDisabled();
    });

    test("offline (connection failed)", async ({ page }) => {
      const checkRequest = await mockMethod(page, "POST", CHECK_URL, {
        json: { connection_ok: false, secret_ok: false },
        hold: true,
      });

      const button = page.getByTestId("servers-test-connection-button");
      await expect(button).toBeVisible();
      await expect(button).toHaveText("admin.servers.test_connection");
      await expect(button).toBeEnabled();
      await button.click();

      // Check loading
      await expect(button).toBeDisabled();

      checkRequest.release();
      const request = await nthRequest(checkRequest);
      expect(request.postDataJSON()).toEqual(CHECK_BODY);

      await expect(button).toBeEnabled();
      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.offline",
      );
      await expect(page.locator("#connectionStatus")).toBeDisabled();
      await expect(page.getByTestId("connection-status-field")).toContainText(
        "admin.servers.offline_reason.connection",
      );
    });

    test("offline (wrong secret)", async ({ page }) => {
      const checkRequest = await mockMethod(page, "POST", CHECK_URL, {
        json: { connection_ok: true, secret_ok: false },
      });

      await page.getByTestId("servers-test-connection-button").click();

      const request = await nthRequest(checkRequest);
      expect(request.postDataJSON()).toEqual(CHECK_BODY);

      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.offline",
      );
      await expect(page.locator("#connectionStatus")).toBeDisabled();
      await expect(page.getByTestId("connection-status-field")).toContainText(
        "admin.servers.offline_reason.secret",
      );
    });

    test("online after a failed check", async ({ page }) => {
      await mockMethod(page, "POST", CHECK_URL, {
        json: { connection_ok: false, secret_ok: false },
      });
      await page.getByTestId("servers-test-connection-button").click();
      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.offline",
      );

      const checkRequest = await mockMethod(page, "POST", CHECK_URL, {
        json: { connection_ok: true, secret_ok: true },
      });
      await page.getByTestId("servers-test-connection-button").click();

      const request = await nthRequest(checkRequest);
      expect(request.postDataJSON()).toEqual(CHECK_BODY);

      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.online",
      );
      await expect(page.locator("#connectionStatus")).toBeDisabled();
      await expect(
        page.getByTestId("connection-status-field"),
      ).not.toContainText("admin.servers.offline_reason");
    });

    test("server error (500) sets the status to unknown", async ({ page }) => {
      const checkRequest = await mockMethod(page, "POST", CHECK_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("servers-test-connection-button").click();
      await nthRequest(checkRequest);

      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.unknown",
      );
      await expect(page.locator("#connectionStatus")).toBeDisabled();
      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const checkRequest = await mockMethod(page, "POST", CHECK_URL, {
        status: 401,
      });

      await page.getByTestId("servers-test-connection-button").click();
      await nthRequest(checkRequest);

      await expectLoginRedirect(page, "/admin/servers/1");
    });
  });

  test.describe("panic", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers/1");
      await expect(page.getByTestId("servers-panic-button")).toBeVisible();
    });

    test("panic disables the server", async ({ page }) => {
      const panicRequest = await mockMethod(page, "POST", PANIC_URL, {
        json: { total: 5, success: 3 },
        hold: true,
      });

      const server = readFixture("server.json");
      Object.assign(server.data, {
        status: -1,
        connection_status: null,
        participant_count: null,
        listener_count: null,
        voice_participant_count: null,
        video_count: null,
        meeting_count: null,
        own_meeting_count: 0,
        version: null,
      });
      await mockMethod(page, "GET", SERVER_URL, { json: server });

      const button = page.getByTestId("servers-panic-button");
      await button.click();

      // Check loading
      await expect(button).toBeDisabled();

      panicRequest.release();
      await nthRequest(panicRequest);

      await expectToastAndClose(page, [
        'admin.servers.flash.panic.description_meetings_total_{"count":5,"n":5} admin.servers.flash.panic.description_meetings_successful_{"count":3,"n":3}',
        "admin.servers.flash.panic.title",
      ]);

      // Check that the server is updated
      await expect(page.getByTestId("status-dropdown")).toHaveText(
        "admin.servers.disabled",
      );
      await expect(page.locator("#connectionStatus")).toHaveValue(
        "admin.servers.unknown",
      );
      await expect(page.locator("#connectionStatus")).toBeDisabled();
      await expectStatisticFieldsHidden(page);

      // Check that panic button is hidden (missing permissions)
      await expect(button).toHaveCount(0);
    });

    test("server error (500)", async ({ page }) => {
      const panicRequest = await mockMethod(page, "POST", PANIC_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("servers-panic-button").click();
      await nthRequest(panicRequest);

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const panicRequest = await mockMethod(page, "POST", PANIC_URL, {
        status: 401,
      });

      await page.getByTestId("servers-panic-button").click();
      await nthRequest(panicRequest);

      await expectLoginRedirect(page, "/admin/servers/1");
    });

    test("server not found (404) redirects to the index", async ({ page }) => {
      await interceptAdminServersIndexRequests(page);
      const panicRequest = await mockMethod(
        page,
        "POST",
        PANIC_URL,
        MODEL_NOT_FOUND_RESPONSE,
      );

      await page.getByTestId("servers-panic-button").click();
      await nthRequest(panicRequest);

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expect(page.getByTestId("server-item").first()).toBeVisible();
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("switch between edit and view", () => {
    test("edit mode shows the form with changed values", async ({ page }) => {
      await page.goto("/admin/servers/1/edit");
      await expectOriginalValues(page, false);

      await page.locator("#name").fill("Server 02");
      await page
        .locator("#description")
        .fill("Testserver 02 for testing purposes");
      await page.locator("#base_url").fill("https://localhost/bigbluebutton2");
      await page.locator("#secret").fill("Secret123456789");
      await expect(page.getByTestId("strength-rating")).not.toHaveClass(
        /p-disabled/,
      );
      const options = page.getByTestId("strength-rating-option");
      for (let i = 0; i < 10; i++) {
        await expect(options.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await options.nth(5).click();

      await expect(page.getByTestId("status-dropdown")).toContainText(
        "admin.servers.enabled",
      );
      await expect(
        page.getByTestId("status-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("status-dropdown-items")).toHaveCount(0);
      await page.getByTestId("status-dropdown").click();
      await expect(page.getByTestId("status-dropdown-items")).toBeVisible();
      await page.getByTestId("status-dropdown-option").nth(2).click();

      await expectStatisticFieldsHidden(page);
      await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
      await expect(page.getByTestId("servers-save-button")).toBeVisible();
      await expect(page.getByTestId("servers-save-button")).toBeEnabled();
    });

    test("cancel switches to the view without saving the changes", async ({
      page,
    }) => {
      await page.goto("/admin/servers/1/edit");
      await expectOriginalValues(page, false);

      await page.locator("#name").fill("Server 02");
      await page.locator("#description").fill("Other description");
      await page.locator("#base_url").fill("https://localhost/bigbluebutton2");
      await page.locator("#secret").fill("Secret123456789");
      await page.getByTestId("strength-rating-option").nth(5).click();

      await page.getByTestId("servers-cancel-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/1$/);

      // Check that changes were not saved
      await expectOriginalValues(page, true);

      // Check that other fields and panic button are shown
      for (const [id, value] of [
        ["#meetingCount", "3"],
        ["#ownMeetingCount", "2"],
        ["#participantCount", "14"],
        ["#videoCount", "7"],
      ]) {
        await expect(page.locator(id)).toHaveValue(value);
        await expect(page.locator(id)).toBeVisible();
        await expect(page.locator(id)).toBeDisabled();
      }
      await expect(page.getByTestId("servers-panic-button")).toBeVisible();

      // Check that save button is hidden
      await expect(page.getByTestId("servers-save-button")).toHaveCount(0);
    });

    test("switch from the view to the edit mode", async ({ page }) => {
      await page.goto("/admin/servers/1");
      await expectOriginalValues(page, true);

      await page.getByTestId("servers-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/1\/edit$/);

      await expectOriginalValues(page, false);
      await expectStatisticFieldsHidden(page);
      await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
      await expect(page.getByTestId("servers-save-button")).toBeVisible();
      await expect(page.getByTestId("servers-save-button")).toBeEnabled();
    });
  });
});
