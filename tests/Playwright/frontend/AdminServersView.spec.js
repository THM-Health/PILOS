import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  interceptAdminServersViewRequests,
  interceptAdminServersIndexRequests,
} from "../support/mocks.js";
import { holdRequest } from "../support/utils.js";

const SERVER_URL = "**/api/v1/servers/1";

const readServer = () =>
  JSON.parse(readFileSync("tests/Playwright/fixtures/server.json", "utf8"));

/**
 * Mocks the server request with the fixture, changed by the given values.
 */
async function mockServer(page, changes) {
  const server = readServer();
  Object.assign(server.data, changes);
  await page.route(SERVER_URL, (route) => route.fulfill({ json: server }));
}

/**
 * Check the read only status and connection status fields.
 */
async function expectStatusFields(page, status, connectionStatus) {
  const statusField = page.getByTestId("status-field");
  await expect(statusField).toBeVisible();
  await expect(statusField).toContainText("admin.servers.status");
  const dropdown = statusField.getByTestId("status-dropdown");
  await expect(dropdown).toHaveText(status);
  await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  const connectionField = page.getByTestId("connection-status-field");
  await expect(connectionField).toBeVisible();
  await expect(connectionField).toContainText("admin.servers.connection");
  await expect(connectionField.locator("#connectionStatus")).toHaveValue(
    connectionStatus,
  );
  await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
  const testButton = connectionField.getByTestId(
    "servers-test-connection-button",
  );
  await expect(testButton).toBeVisible();
  await expect(testButton).toHaveText("admin.servers.test_connection");
  await expect(testButton).toBeEnabled();
}

/**
 * Check the buttons of the view page for a user with update permission.
 */
async function expectUpdateButtons(page, { panic, deletable }) {
  const editButton = page.getByTestId("servers-edit-button");
  await expect(editButton).toBeVisible();
  await expect(page.getByTestId("servers-cancel-edit-button")).toHaveCount(0);
  await expect(editButton).toBeEnabled();
  await expect(editButton).toHaveText("app.edit");
  await expect(editButton).toHaveAttribute("href", "/admin/servers/1/edit");
  const deleteButton = page.getByTestId("servers-delete-button");
  if (deletable) {
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
  } else {
    await expect(deleteButton).toHaveCount(0);
  }
  await expect(page.getByTestId("servers-save-button")).toHaveCount(0);

  const testButton = page.getByTestId("servers-test-connection-button");
  await expect(testButton).toBeVisible();
  await expect(testButton).toHaveText("admin.servers.test_connection");
  await expect(testButton).toBeEnabled();

  const panicButton = page.getByTestId("servers-panic-button");
  if (panic) {
    await expect(panicButton).toBeVisible();
    await expect(panicButton).toBeEnabled();
    await expect(panicButton).toContainText("admin.servers.panic");
  } else {
    await expect(panicButton).toHaveCount(0);
  }
}

/**
 * Check that no action buttons are shown (user without update permission).
 */
async function expectNoActionButtons(page) {
  await expect(page.getByTestId("servers-cancel-edit-button")).toHaveCount(0);
  await expect(page.getByTestId("servers-edit-button")).toHaveCount(0);
  await expect(page.getByTestId("servers-delete-button")).toHaveCount(0);
  await expect(page.getByTestId("servers-save-button")).toHaveCount(0);
  await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
}

test.describe("Admin servers view", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
    ];
    await interceptAdminServersViewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers/1");
  });

  test("visit with user without permission to view servers", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view", "servers.viewAny"];

    await page.goto("/admin/servers/1");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/servers\/1/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test("loading state hides the buttons and shows the overlay", async ({
    page,
  }) => {
    const release = await holdRequest(page, SERVER_URL, {
      path: "tests/Playwright/fixtures/server.json",
    });
    await page.goto("/admin/servers/1");

    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();
    await expect(page.getByTestId("overlay")).toBeVisible();
    await expectNoActionButtons(page);

    release();

    await expect(page.getByTestId("name-field")).toBeVisible();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
    await expectNoActionButtons(page);
  });

  test.describe("server enabled", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers/1");
      await expect(page.locator("#name")).toHaveValue("Server 01");
    });

    test("shows breadcrumbs", async ({ page }) => {
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.servers.index",
        'admin.breadcrumbs.servers.view_{"name":"Server 01"}',
      );
    });

    test("shows disabled text fields", async ({ page }) => {
      const fields = [
        ["name", "app.model_name", "Server 01"],
        ["description", "app.description", "Testserver 01"],
        ["version", "admin.servers.version", "2.4.5"],
        [
          "base-url",
          "admin.servers.base_url",
          "https://localhost/bigbluebutton",
          "base_url",
        ],
        ["secret", "admin.servers.secret", "123456789"],
      ];
      for (const [testId, label, value, inputId = testId] of fields) {
        const field = page.getByTestId(`${testId}-field`);
        await expect(field).toBeVisible();
        await expect(field).toContainText(label);
        await expect(field.locator(`#${inputId}`)).toHaveValue(value);
        await expect(field.locator(`#${inputId}`)).toBeDisabled();
      }
    });

    test("shows disabled strength rating", async ({ page }) => {
      const field = page.getByTestId("strength-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.servers.strength");
      await expect(field).toContainText("admin.servers.strength_description");
      await expect(field.getByTestId("strength-rating")).toHaveClass(
        /p-disabled/,
      );

      const options = field.getByTestId("strength-rating-option");
      await expect(options).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(options.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
    });

    test("shows status and connection status", async ({ page }) => {
      await expectStatusFields(
        page,
        "admin.servers.enabled",
        "admin.servers.online",
      );
    });

    test("shows usage counts", async ({ page }) => {
      const fields = [
        [
          "meeting-count",
          "admin.servers.meeting_count",
          "meetingCount",
          "3",
          "admin.servers.meeting_description",
        ],
        [
          "own-meeting-count",
          "admin.servers.own_meeting_count",
          "ownMeetingCount",
          "2",
          "admin.servers.own_meeting_description",
        ],
        [
          "participant-count",
          "admin.servers.participant_count",
          "participantCount",
          "14",
        ],
        ["video-count", "admin.servers.video_count", "videoCount", "7"],
      ];
      for (const [testId, label, inputId, value, description] of fields) {
        const field = page.getByTestId(`${testId}-field`);
        await expect(field).toBeVisible();
        await expect(field).toContainText(label);
        if (description) {
          await expect(field).toContainText(description);
        }
        await expect(field.locator(`#${inputId}`)).toHaveValue(value);
        await expect(field.locator(`#${inputId}`)).toBeDisabled();
      }
    });

    test("hides action buttons without permissions", async ({ page }) => {
      await expectNoActionButtons(page);
    });
  });

  test("server draining", async ({ page }) => {
    await mockServer(page, { status: 0 });
    await page.goto("/admin/servers/1");

    await expectStatusFields(
      page,
      "admin.servers.draining",
      "admin.servers.online",
    );
    await expectNoActionButtons(page);

    await expect(page.getByTestId("meeting-count-field")).toBeVisible();
    await expect(page.getByTestId("own-meeting-count-field")).toBeVisible();
    await expect(page.getByTestId("participant-count-field")).toBeVisible();
    await expect(page.getByTestId("video-count-field")).toBeVisible();
  });

  test("server disabled", async ({ page }) => {
    await mockServer(page, { status: -1, connection_status: null });
    await page.goto("/admin/servers/1");

    await expectStatusFields(
      page,
      "admin.servers.disabled",
      "admin.servers.unknown",
    );
    await expectNoActionButtons(page);

    await expect(page.getByTestId("meeting-count-field")).toHaveCount(0);
    await expect(page.getByTestId("own-meeting-count-field")).toHaveCount(0);
    await expect(page.getByTestId("participant-count-field")).toHaveCount(0);
    await expect(page.getByTestId("video-count-field")).toHaveCount(0);
  });

  test.describe("connection status always online", () => {
    const expectAlwaysOnlineTexts = async (page) => {
      const field = page.getByTestId("connection-status-always-online-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.servers.connection_status_always_online",
      );
      await expect(field).toContainText(
        "admin.servers.connection_status_always_online_description",
      );
      await expect(
        field.locator("#connection-status-always-online"),
      ).toBeDisabled();
      return field.locator("#connection-status-always-online");
    };

    test("not checked shows the real connection status", async ({ page }) => {
      await page.goto("/admin/servers/1");

      const checkbox = await expectAlwaysOnlineTexts(page);
      await expect(checkbox).not.toBeChecked();

      const connectionField = page.getByTestId("connection-status-field");
      await expect(connectionField).toBeVisible();
      await expect(connectionField).toContainText("admin.servers.connection");
      await expect(connectionField.locator("#connectionStatus")).toHaveValue(
        "admin.servers.online",
      );
      await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
    });

    test("checked shows connection status unknown", async ({ page }) => {
      await mockServer(page, { connection_status_always_online: true });
      await page.goto("/admin/servers/1");

      const checkbox = await expectAlwaysOnlineTexts(page);
      await expect(checkbox).toBeChecked();

      const connectionField = page.getByTestId("connection-status-field");
      await expect(connectionField).toBeVisible();
      await expect(connectionField).toContainText("admin.servers.connection");
      await expect(connectionField.locator("#connectionStatus")).toHaveValue(
        "admin.servers.unknown",
      );
      await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
    });
  });

  test.describe("button visibility with update permission", () => {
    test.beforeEach(({ currentUser }) => {
      currentUser.data.permissions.push("servers.update");
    });

    test("server enabled", async ({ page }) => {
      await page.goto("/admin/servers/1");
      await expectUpdateButtons(page, { panic: true, deletable: false });
    });

    test("server draining", async ({ page }) => {
      await mockServer(page, { status: 0 });
      await page.goto("/admin/servers/1");
      await expectUpdateButtons(page, { panic: true, deletable: false });
    });

    test("server disabled", async ({ page }) => {
      await mockServer(page, { status: -1 });
      await page.goto("/admin/servers/1");
      await expectUpdateButtons(page, { panic: false, deletable: false });
    });
  });

  test.describe("button visibility with delete permission", () => {
    test.beforeEach(({ currentUser }) => {
      currentUser.data.permissions.push(
        "servers.update",
        "servers.create",
        "servers.delete",
      );
    });

    test("server enabled", async ({ page }) => {
      await page.goto("/admin/servers/1");
      await expectUpdateButtons(page, { panic: true, deletable: false });
    });

    test("server draining", async ({ page }) => {
      await mockServer(page, { status: 0 });
      await page.goto("/admin/servers/1");
      await expectUpdateButtons(page, { panic: true, deletable: false });
    });

    test("server disabled", async ({ page }) => {
      await mockServer(page, { status: -1 });
      await page.goto("/admin/servers/1");
      await expectUpdateButtons(page, { panic: false, deletable: true });
    });
  });

  test.describe("open view errors", () => {
    test("server error shows overlay and can be retried", async ({ page }) => {
      let failing = true;
      await page.route(SERVER_URL, (route) =>
        failing
          ? route.fulfill({ status: 500, json: { message: "Test" } })
          : route.fulfill({ path: "tests/Playwright/fixtures/server.json" }),
      );

      await page.goto("/admin/servers/1");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      failing = false;
      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.locator("#name")).toHaveValue("Server 01");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(retryButton).toHaveCount(0);
    });

    test("404 redirects to the servers index", async ({ page }) => {
      await interceptAdminServersIndexRequests(page);
      await page.route(SERVER_URL, (route) =>
        route.fulfill({
          status: 404,
          json: { message: "model_not_found", model: "server", ids: [1] },
        }),
      );

      const serversRequest = page.waitForRequest(/\/api\/v1\/servers\?/);
      await page.goto("/admin/servers/1");

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await serversRequest;
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("401 redirects to the login page", async ({ page }) => {
      await page.route(SERVER_URL, (route) => route.fulfill({ status: 401 }));

      await page.goto("/admin/servers/1");

      await expectLoginRedirect(page, "/admin/servers/1");
    });
  });
});
