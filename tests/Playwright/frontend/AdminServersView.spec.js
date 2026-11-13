import { test } from "../support/fixtures/serverController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import { serverError, modelNotFound } from "../support/utils.js";

test.describe("Admin servers view", () => {
  test.use({ authenticated: true });

  test.beforeEach(({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
    ];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers/1");
  });

  test("visit with user without permission to view servers", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = ["admin.view", "servers.viewAny"];

    await page.goto("/admin/servers/1");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/servers\/1/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test("loading state hides the buttons and shows the overlay", async ({
    page,
    serverResponse,
    getServerApiMock,
  }) => {
    getServerApiMock.respondWith({
      json: serverResponse,
      hold: true,
    });
    await page.goto("/admin/servers/1");

    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();
    await expect(page.getByTestId("overlay")).toBeVisible();
    for (const testId of [
      "servers-cancel-edit-button",
      "servers-edit-button",
      "servers-delete-button",
      "servers-save-button",
      "servers-panic-button",
    ]) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }

    getServerApiMock.release();

    await expect(page.getByTestId("name-field")).toBeVisible();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
    for (const testId of [
      "servers-cancel-edit-button",
      "servers-edit-button",
      "servers-delete-button",
      "servers-save-button",
      "servers-panic-button",
    ]) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }
  });

  test.describe("server enabled", () => {
    test.beforeEach(async ({ page, serverForm }) => {
      await page.goto("/admin/servers/1");
      await expect(serverForm.name).toHaveValue("Server 01");
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

    test("shows disabled strength rating", async ({ page, serverForm }) => {
      const field = page.getByTestId("strength-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.servers.strength");
      await expect(field).toContainText("admin.servers.strength_description");
      await expect(field.getByTestId("strength-rating")).toHaveClass(
        /p-disabled/,
      );

      await expect(serverForm.strengthOptions).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
    });

    test("shows status and connection status", async ({ page }) => {
      const statusField = page.getByTestId("status-field");
      await expect(statusField).toBeVisible();
      await expect(statusField).toContainText("admin.servers.status");
      const dropdown = statusField.getByTestId("status-dropdown");
      await expect(dropdown).toHaveText("admin.servers.enabled");
      await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );

      const connectionField = page.getByTestId("connection-status-field");
      await expect(connectionField).toBeVisible();
      await expect(connectionField).toContainText("admin.servers.connection");
      await expect(connectionField.locator("#connectionStatus")).toHaveValue(
        "admin.servers.online",
      );
      await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
      const testButton = connectionField.getByTestId(
        "servers-test-connection-button",
      );
      await expect(testButton).toBeVisible();
      await expect(testButton).toHaveText("admin.servers.test_connection");
      await expect(testButton).toBeEnabled();
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
      for (const testId of [
        "servers-cancel-edit-button",
        "servers-edit-button",
        "servers-delete-button",
        "servers-save-button",
        "servers-panic-button",
      ]) {
        await expect(page.getByTestId(testId)).toHaveCount(0);
      }
    });
  });

  test("server draining", async ({ page, serverResponse }) => {
    serverResponse.data.status = 0;
    await page.goto("/admin/servers/1");

    const statusField = page.getByTestId("status-field");
    await expect(statusField).toBeVisible();
    await expect(statusField).toContainText("admin.servers.status");
    const dropdown = statusField.getByTestId("status-dropdown");
    await expect(dropdown).toHaveText("admin.servers.draining");
    await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    const connectionField = page.getByTestId("connection-status-field");
    await expect(connectionField).toBeVisible();
    await expect(connectionField).toContainText("admin.servers.connection");
    await expect(connectionField.locator("#connectionStatus")).toHaveValue(
      "admin.servers.online",
    );
    await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
    const testButton = connectionField.getByTestId(
      "servers-test-connection-button",
    );
    await expect(testButton).toBeVisible();
    await expect(testButton).toHaveText("admin.servers.test_connection");
    await expect(testButton).toBeEnabled();

    for (const testId of [
      "servers-cancel-edit-button",
      "servers-edit-button",
      "servers-delete-button",
      "servers-save-button",
      "servers-panic-button",
    ]) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }

    await expect(page.getByTestId("meeting-count-field")).toBeVisible();
    await expect(page.getByTestId("own-meeting-count-field")).toBeVisible();
    await expect(page.getByTestId("participant-count-field")).toBeVisible();
    await expect(page.getByTestId("video-count-field")).toBeVisible();
  });

  test("server disabled", async ({ page, serverResponse }) => {
    serverResponse.data.status = -1;
    serverResponse.data.connection_status = null;
    await page.goto("/admin/servers/1");

    const statusField = page.getByTestId("status-field");
    await expect(statusField).toBeVisible();
    await expect(statusField).toContainText("admin.servers.status");
    const dropdown = statusField.getByTestId("status-dropdown");
    await expect(dropdown).toHaveText("admin.servers.disabled");
    await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    const connectionField = page.getByTestId("connection-status-field");
    await expect(connectionField).toBeVisible();
    await expect(connectionField).toContainText("admin.servers.connection");
    await expect(connectionField.locator("#connectionStatus")).toHaveValue(
      "admin.servers.unknown",
    );
    await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
    const testButton = connectionField.getByTestId(
      "servers-test-connection-button",
    );
    await expect(testButton).toBeVisible();
    await expect(testButton).toHaveText("admin.servers.test_connection");
    await expect(testButton).toBeEnabled();

    for (const testId of [
      "servers-cancel-edit-button",
      "servers-edit-button",
      "servers-delete-button",
      "servers-save-button",
      "servers-panic-button",
    ]) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }

    await expect(page.getByTestId("meeting-count-field")).toHaveCount(0);
    await expect(page.getByTestId("own-meeting-count-field")).toHaveCount(0);
    await expect(page.getByTestId("participant-count-field")).toHaveCount(0);
    await expect(page.getByTestId("video-count-field")).toHaveCount(0);
  });

  test.describe("connection status always online", () => {
    test("not checked shows the real connection status", async ({
      page,
      serverForm,
    }) => {
      await page.goto("/admin/servers/1");

      const field = page.getByTestId("connection-status-always-online-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.servers.connection_status_always_online",
      );
      await expect(field).toContainText(
        "admin.servers.connection_status_always_online_description",
      );
      await expect(serverForm.alwaysOnline).toBeDisabled();
      await expect(serverForm.alwaysOnline).not.toBeChecked();

      const connectionField = page.getByTestId("connection-status-field");
      await expect(connectionField).toBeVisible();
      await expect(connectionField).toContainText("admin.servers.connection");
      await expect(connectionField.locator("#connectionStatus")).toHaveValue(
        "admin.servers.online",
      );
      await expect(connectionField.locator("#connectionStatus")).toBeDisabled();
    });

    test("checked shows connection status unknown", async ({
      page,
      serverResponse,
      serverForm,
    }) => {
      serverResponse.data.connection_status_always_online = true;
      await page.goto("/admin/servers/1");

      const field = page.getByTestId("connection-status-always-online-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.servers.connection_status_always_online",
      );
      await expect(field).toContainText(
        "admin.servers.connection_status_always_online_description",
      );
      await expect(serverForm.alwaysOnline).toBeDisabled();
      await expect(serverForm.alwaysOnline).toBeChecked();

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
    test.beforeEach(({ currentUserResponse }) => {
      currentUserResponse.data.permissions.push("servers.update");
    });

    for (const [name, status, panic, deletable] of [
      ["enabled", 1, true, false],
      ["draining", 0, true, false],
      ["disabled", -1, false, false],
    ]) {
      test(`server ${name}`, async ({ page, serverResponse, serverForm }) => {
        serverResponse.data.status = status;
        await page.goto("/admin/servers/1");

        const editButton = page.getByTestId("servers-edit-button");
        await expect(editButton).toBeVisible();
        await expect(
          page.getByTestId("servers-cancel-edit-button"),
        ).toHaveCount(0);
        await expect(editButton).toBeEnabled();
        await expect(editButton).toHaveText("app.edit");
        await expect(editButton).toHaveAttribute(
          "href",
          "/admin/servers/1/edit",
        );
        const deleteButton = page.getByTestId("servers-delete-button");
        if (deletable) {
          await expect(deleteButton).toBeVisible();
          await expect(deleteButton).toBeEnabled();
        } else {
          await expect(deleteButton).toHaveCount(0);
        }
        await expect(serverForm.saveButton).toHaveCount(0);

        await expect(serverForm.testConnectionButton).toBeVisible();
        await expect(serverForm.testConnectionButton).toHaveText(
          "admin.servers.test_connection",
        );
        await expect(serverForm.testConnectionButton).toBeEnabled();

        const panicButton = page.getByTestId("servers-panic-button");
        if (panic) {
          await expect(panicButton).toBeVisible();
          await expect(panicButton).toBeEnabled();
          await expect(panicButton).toContainText("admin.servers.panic");
        } else {
          await expect(panicButton).toHaveCount(0);
        }
      });
    }
  });

  test.describe("button visibility with delete permission", () => {
    test.beforeEach(({ currentUserResponse }) => {
      currentUserResponse.data.permissions.push(
        "servers.update",
        "servers.create",
        "servers.delete",
      );
    });

    for (const [name, status, panic, deletable] of [
      ["enabled", 1, true, false],
      ["draining", 0, true, false],
      ["disabled", -1, false, true],
    ]) {
      test(`server ${name}`, async ({ page, serverResponse, serverForm }) => {
        serverResponse.data.status = status;
        await page.goto("/admin/servers/1");

        const editButton = page.getByTestId("servers-edit-button");
        await expect(editButton).toBeVisible();
        await expect(
          page.getByTestId("servers-cancel-edit-button"),
        ).toHaveCount(0);
        await expect(editButton).toBeEnabled();
        await expect(editButton).toHaveText("app.edit");
        await expect(editButton).toHaveAttribute(
          "href",
          "/admin/servers/1/edit",
        );
        const deleteButton = page.getByTestId("servers-delete-button");
        if (deletable) {
          await expect(deleteButton).toBeVisible();
          await expect(deleteButton).toBeEnabled();
        } else {
          await expect(deleteButton).toHaveCount(0);
        }
        await expect(serverForm.saveButton).toHaveCount(0);

        await expect(serverForm.testConnectionButton).toBeVisible();
        await expect(serverForm.testConnectionButton).toHaveText(
          "admin.servers.test_connection",
        );
        await expect(serverForm.testConnectionButton).toBeEnabled();

        const panicButton = page.getByTestId("servers-panic-button");
        if (panic) {
          await expect(panicButton).toBeVisible();
          await expect(panicButton).toBeEnabled();
          await expect(panicButton).toContainText("admin.servers.panic");
        } else {
          await expect(panicButton).toHaveCount(0);
        }
      });
    }
  });

  test.describe("open view errors", () => {
    test("server error shows overlay and can be retried", async ({
      page,
      serverResponse,
      serverForm,
      getServerApiMock,
    }) => {
      getServerApiMock.respondWith(serverError());

      await page.goto("/admin/servers/1");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      getServerApiMock.respondWith({ json: serverResponse });
      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(serverForm.name).toHaveValue("Server 01");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(retryButton).toHaveCount(0);
    });

    test("404 redirects to the servers index", async ({
      page,
      getServersApiMock,
      getServerApiMock,
    }) => {
      getServerApiMock.respondWith(modelNotFound("server", [1]));

      const serversRequest = getServersApiMock.waitForNextRequest();
      await page.goto("/admin/servers/1");

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await serversRequest;
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("401 redirects to the login page", async ({
      page,
      getServerApiMock,
    }) => {
      getServerApiMock.respondWith({ status: 401 });

      await page.goto("/admin/servers/1");

      await expectLoginRedirect(page, "/admin/servers/1");
    });
  });
});
