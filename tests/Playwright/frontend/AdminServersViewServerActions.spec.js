import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/adminServers.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.describe("Admin servers view server actions", () => {
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

  test.describe("delete", () => {
    test.beforeEach(async ({ page, server }) => {
      server.data.status = -1;

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

    test("delete the server and redirect to the index", async ({
      page,
      servers,
    }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/1",
        { status: 204, hold: true },
      );

      servers.data = servers.data.slice(1, 4);
      servers.meta.to = 3;
      servers.meta.total = 3;
      servers.meta.total_no_filter = 3;

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
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/1",
        { status: 500, json: { message: "Test" } },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(page.getByTestId("servers-delete-dialog")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("server not found (404) redirects to the index", async ({ page }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/1",
        {
          status: 404,
          json: { message: "model_not_found", model: "server", ids: [1] },
        },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expect(page.getByTestId("server-item").first()).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/servers/1",
        { status: 401 },
      );

      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expectLoginRedirect(page, "/admin/servers/1");
    });
  });

  test.describe("check connection", () => {
    test.beforeEach(async ({ page, serverForm }) => {
      await page.goto("/admin/servers/1");

      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.online",
      );
      await expect(serverForm.connectionStatus).toBeDisabled();
    });

    test("offline (connection failed)", async ({ page, serverForm }) => {
      const checkRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/check",
        { json: { connection_ok: false, secret_ok: false }, hold: true },
      );

      const button = serverForm.testConnectionButton;
      await expect(button).toBeVisible();
      await expect(button).toHaveText("admin.servers.test_connection");
      await expect(button).toBeEnabled();
      await button.click();

      // Check loading
      await expect(button).toBeDisabled();

      checkRequest.release();
      const request = await nthRequest(checkRequest);
      expect(request.postDataJSON()).toEqual({
        base_url: "https://localhost/bigbluebutton",
        secret: "123456789",
      });

      await expect(button).toBeEnabled();
      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.offline",
      );
      await expect(serverForm.connectionStatus).toBeDisabled();
      await expect(page.getByTestId("connection-status-field")).toContainText(
        "admin.servers.offline_reason.connection",
      );
    });

    test("offline (wrong secret)", async ({ page, serverForm }) => {
      const checkRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/check",
        { json: { connection_ok: true, secret_ok: false } },
      );

      await serverForm.testConnectionButton.click();

      const request = await nthRequest(checkRequest);
      expect(request.postDataJSON()).toEqual({
        base_url: "https://localhost/bigbluebutton",
        secret: "123456789",
      });

      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.offline",
      );
      await expect(serverForm.connectionStatus).toBeDisabled();
      await expect(page.getByTestId("connection-status-field")).toContainText(
        "admin.servers.offline_reason.secret",
      );
    });

    test("online after a failed check", async ({ page, serverForm }) => {
      await mockMethod(page, "POST", "**/api/v1/servers/check", {
        json: { connection_ok: false, secret_ok: false },
      });
      await serverForm.testConnectionButton.click();
      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.offline",
      );

      const checkRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/check",
        { json: { connection_ok: true, secret_ok: true } },
      );
      await serverForm.testConnectionButton.click();

      const request = await nthRequest(checkRequest);
      expect(request.postDataJSON()).toEqual({
        base_url: "https://localhost/bigbluebutton",
        secret: "123456789",
      });

      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.online",
      );
      await expect(serverForm.connectionStatus).toBeDisabled();
      await expect(
        page.getByTestId("connection-status-field"),
      ).not.toContainText("admin.servers.offline_reason");
    });

    test("server error (500) sets the status to unknown", async ({
      page,
      serverForm,
    }) => {
      const checkRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/check",
        { status: 500, json: { message: "Test" } },
      );

      await serverForm.testConnectionButton.click();
      await nthRequest(checkRequest);

      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.unknown",
      );
      await expect(serverForm.connectionStatus).toBeDisabled();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("unauthenticated (401) redirects to the login", async ({
      page,
      serverForm,
    }) => {
      const checkRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/check",
        { status: 401 },
      );

      await serverForm.testConnectionButton.click();
      await nthRequest(checkRequest);

      await expectLoginRedirect(page, "/admin/servers/1");
    });
  });

  test.describe("panic", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers/1");
      await expect(page.getByTestId("servers-panic-button")).toBeVisible();
    });

    test("panic disables the server", async ({ page, server, serverForm }) => {
      const panicRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/1/panic",
        { json: { total: 5, success: 3 }, hold: true },
      );

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
      await expect(serverForm.statusDropdown).toHaveText(
        "admin.servers.disabled",
      );
      await expect(serverForm.connectionStatus).toHaveValue(
        "admin.servers.unknown",
      );
      await expect(serverForm.connectionStatus).toBeDisabled();

      for (const testId of [
        "meeting-count-field",
        "own-meeting-count-field",
        "participant-count-field",
        "video-count-field",
      ]) {
        await expect(page.getByTestId(testId)).toHaveCount(0);
      }

      // Check that panic button is hidden (missing permissions)
      await expect(button).toHaveCount(0);
    });

    test("server error (500)", async ({ page }) => {
      const panicRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/1/panic",
        { status: 500, json: { message: "Test" } },
      );

      await page.getByTestId("servers-panic-button").click();
      await nthRequest(panicRequest);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const panicRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/1/panic",
        { status: 401 },
      );

      await page.getByTestId("servers-panic-button").click();
      await nthRequest(panicRequest);

      await expectLoginRedirect(page, "/admin/servers/1");
    });

    test("server not found (404) redirects to the index", async ({ page }) => {
      const panicRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/servers/1/panic",
        {
          status: 404,
          json: { message: "model_not_found", model: "server", ids: [1] },
        },
      );

      await page.getByTestId("servers-panic-button").click();
      await nthRequest(panicRequest);

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expect(page.getByTestId("server-item").first()).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });
  });

  test.describe("switch between edit and view", () => {
    test("edit mode shows the form with changed values", async ({
      page,
      serverForm,
    }) => {
      await page.goto("/admin/servers/1/edit");

      for (const [field, value] of [
        [serverForm.name, "Server 01"],
        [serverForm.description, "Testserver 01"],
        [serverForm.baseUrl, "https://localhost/bigbluebutton"],
        [serverForm.secret, "123456789"],
      ]) {
        await expect(field).toHaveValue(value);
        await expect(field).toBeEnabled();
      }
      await expect(serverForm.strengthOptions).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await expect(serverForm.statusDropdown).toContainText(
        "admin.servers.enabled",
      );
      await expect(serverForm.strengthRating).not.toHaveClass(/p-disabled/);
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");

      await serverForm.fillTextFields({
        name: "Server 02",
        description: "Testserver 02 for testing purposes",
        baseUrl: "https://localhost/bigbluebutton2",
        secret: "Secret123456789",
      });
      await expect(serverForm.strengthRating).not.toHaveClass(/p-disabled/);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await serverForm.selectStrength(6);

      await expect(serverForm.statusDropdown).toContainText(
        "admin.servers.enabled",
      );
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(serverForm.statusItems).toHaveCount(0);
      await serverForm.statusDropdown.click();
      await expect(serverForm.statusItems).toBeVisible();
      await serverForm.statusOptions.nth(2).click();

      for (const testId of [
        "meeting-count-field",
        "own-meeting-count-field",
        "participant-count-field",
        "video-count-field",
      ]) {
        await expect(page.getByTestId(testId)).toHaveCount(0);
      }
      await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
      await expect(serverForm.saveButton).toBeVisible();
      await expect(serverForm.saveButton).toBeEnabled();
    });

    test("cancel switches to the view without saving the changes", async ({
      page,
      serverForm,
    }) => {
      await page.goto("/admin/servers/1/edit");

      for (const [field, value] of [
        [serverForm.name, "Server 01"],
        [serverForm.description, "Testserver 01"],
        [serverForm.baseUrl, "https://localhost/bigbluebutton"],
        [serverForm.secret, "123456789"],
      ]) {
        await expect(field).toHaveValue(value);
        await expect(field).toBeEnabled();
      }
      await expect(serverForm.strengthOptions).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await expect(serverForm.statusDropdown).toContainText(
        "admin.servers.enabled",
      );
      await expect(serverForm.strengthRating).not.toHaveClass(/p-disabled/);
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");

      await serverForm.fillTextFields({
        name: "Server 02",
        description: "Other description",
        baseUrl: "https://localhost/bigbluebutton2",
        secret: "Secret123456789",
      });
      await serverForm.selectStrength(6);

      await page.getByTestId("servers-cancel-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/1$/);

      // Check that changes were not saved

      for (const [field, value] of [
        [serverForm.name, "Server 01"],
        [serverForm.description, "Testserver 01"],
        [serverForm.baseUrl, "https://localhost/bigbluebutton"],
        [serverForm.secret, "123456789"],
      ]) {
        await expect(field).toHaveValue(value);
        await expect(field).toBeDisabled();
      }
      await expect(serverForm.strengthOptions).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await expect(serverForm.statusDropdown).toContainText(
        "admin.servers.enabled",
      );
      await expect(serverForm.strengthRating).toHaveClass(/p-disabled/);
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

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
      await expect(serverForm.saveButton).toHaveCount(0);
    });

    test("switch from the view to the edit mode", async ({
      page,
      serverForm,
    }) => {
      await page.goto("/admin/servers/1");

      for (const [field, value] of [
        [serverForm.name, "Server 01"],
        [serverForm.description, "Testserver 01"],
        [serverForm.baseUrl, "https://localhost/bigbluebutton"],
        [serverForm.secret, "123456789"],
      ]) {
        await expect(field).toHaveValue(value);
        await expect(field).toBeDisabled();
      }
      await expect(serverForm.strengthOptions).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await expect(serverForm.statusDropdown).toContainText(
        "admin.servers.enabled",
      );
      await expect(serverForm.strengthRating).toHaveClass(/p-disabled/);
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      await page.getByTestId("servers-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/servers\/1\/edit$/);

      for (const [field, value] of [
        [serverForm.name, "Server 01"],
        [serverForm.description, "Testserver 01"],
        [serverForm.baseUrl, "https://localhost/bigbluebutton"],
        [serverForm.secret, "123456789"],
      ]) {
        await expect(field).toHaveValue(value);
        await expect(field).toBeEnabled();
      }
      await expect(serverForm.strengthOptions).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 2 ? "true" : "false",
        );
      }
      await expect(serverForm.statusDropdown).toContainText(
        "admin.servers.enabled",
      );
      await expect(serverForm.strengthRating).not.toHaveClass(/p-disabled/);
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");

      for (const testId of [
        "meeting-count-field",
        "own-meeting-count-field",
        "participant-count-field",
        "video-count-field",
      ]) {
        await expect(page.getByTestId(testId)).toHaveCount(0);
      }
      await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
      await expect(serverForm.saveButton).toBeVisible();
      await expect(serverForm.saveButton).toBeEnabled();
    });
  });
});
