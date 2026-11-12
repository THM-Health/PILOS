import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/adminServers.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin servers new", () => {
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

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers/new");
  });

  test("visit with user without permission to add new servers", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
      "servers.update",
    ];

    await page.goto("/admin/servers/new");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/servers/);
  });

  test.describe("form", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers/new");
      await expect(page.getByTestId("name-field")).toBeVisible();
    });

    test("initial state", async ({ page, serverForm }) => {
      // Header buttons are hidden
      await expect(page.getByTestId("servers-cancel-edit-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("servers-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("servers-delete-button")).toHaveCount(0);

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.servers.index",
        "admin.breadcrumbs.servers.new",
      );

      const name = page.getByTestId("name-field");
      await expect(name).toContainText("app.model_name");
      await expect(name.locator("#name")).toHaveValue("");

      const description = page.getByTestId("description-field");
      await expect(description).toContainText("app.description");
      await expect(description.locator("#description")).toHaveValue("");

      const version = page.getByTestId("version-field");
      await expect(version).toContainText("admin.servers.version");
      await expect(version.locator("#version")).toHaveValue("---");
      await expect(version.locator("#version")).toBeDisabled();

      const baseUrl = page.getByTestId("base-url-field");
      await expect(baseUrl).toContainText("admin.servers.base_url");
      await expect(baseUrl.locator("#base_url")).toHaveValue("");

      const secret = page.getByTestId("secret-field");
      await expect(secret).toContainText("admin.servers.secret");
      await expect(secret.locator("#secret")).toHaveValue("");

      const strength = page.getByTestId("strength-field");
      await expect(strength).toContainText("admin.servers.strength");
      await expect(strength).toContainText(
        "admin.servers.strength_description",
      );
      await expect(strength.getByTestId("strength-rating")).not.toHaveClass(
        /p-disabled/,
      );

      const status = page.getByTestId("status-field");
      await expect(status).toContainText("admin.servers.status");
      await expect(status.getByTestId("status-dropdown")).not.toContainText(
        "admin.servers",
      );
      await expect(
        status.getByTestId("status-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");

      const connection = page.getByTestId("connection-status-field");
      await expect(connection).toContainText("admin.servers.connection");
      await expect(connection.locator("#connectionStatus")).toHaveValue(
        "admin.servers.unknown",
      );
      await expect(connection.locator("#connectionStatus")).toBeDisabled();
      const testConnection = connection.getByTestId(
        "servers-test-connection-button",
      );
      await expect(testConnection).toHaveText("admin.servers.test_connection");
      await expect(testConnection).toBeEnabled();

      await expect(serverForm.saveButton).toHaveText("app.save");
    });

    test("fields that only exist for existing servers are hidden", async ({
      page,
    }) => {
      await expect(page.getByTestId("meeting-count-field")).toHaveCount(0);
      await expect(page.getByTestId("own-meeting-count-field")).toHaveCount(0);
      await expect(page.getByTestId("participant-count-field")).toHaveCount(0);
      await expect(page.getByTestId("video-count-field")).toHaveCount(0);

      // Panic button is hidden (missing permissions)
      await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
    });

    test("breadcrumbs stay the same while typing", async ({
      page,
      serverForm,
    }) => {
      await serverForm.name.fill("Server 01");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.servers.index",
        "admin.breadcrumbs.servers.new",
      );
    });

    test("select strength", async ({ serverForm }) => {
      await expect(serverForm.strengthOptions).toHaveCount(10);

      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          "false",
        );
      }

      await serverForm.selectStrength(6);

      for (let i = 0; i < 10; i++) {
        await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
          "data-p-active",
          i < 6 ? "true" : "false",
        );
      }
    });

    test("select status", async ({ serverForm }) => {
      await expect(serverForm.statusItems).toHaveCount(0);
      await serverForm.statusDropdown.click();
      await expect(serverForm.statusItems).toBeVisible();

      await expect(serverForm.statusOptions).toHaveCount(3);
      await expect(serverForm.statusOptions.nth(0)).toHaveText(
        "admin.servers.enabled",
      );
      await expect(serverForm.statusOptions.nth(1)).toHaveText(
        "admin.servers.draining",
      );
      await expect(serverForm.statusOptions.nth(2)).toHaveText(
        "admin.servers.disabled",
      );

      await serverForm.statusOptions.nth(0).click();

      await expect(serverForm.statusItems).toHaveCount(0);
      await expect(serverForm.statusDropdown).toHaveText(
        "admin.servers.enabled",
      );
    });

    test.describe("save", () => {
      test.beforeEach(async ({ server, serverForm }) => {
        // The server as the backend returns it after it was created
        server.data.id = 30;
        server.data.description = "Testserver 01 for testing purposes";
        server.data.secret = "Secret123456789";
        server.data.strength = 6;

        await serverForm.fillTextFields({
          name: "Server 01",
          description: "Testserver 01 for testing purposes",
          baseUrl: "https://localhost/bigbluebutton",
          secret: "Secret123456789",
        });
        await serverForm.selectStrength(6);
        await serverForm.selectStatus(0);
      });

      test("loading state disables the form", async ({
        page,
        server,
        serverForm,
      }) => {
        const newServerRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          { status: 201, json: server, hold: true },
        );
        await mockMethod(page, "GET", "**/api/v1/servers/30", { json: server });

        await expect(page.getByTestId("overlay")).toBeHidden();
        await serverForm.saveButton.click();
        await nthRequest(newServerRequest);

        await expect(page.getByTestId("overlay")).toBeVisible();

        await expect(serverForm.name).toBeDisabled();
        await expect(serverForm.description).toBeDisabled();
        await expect(serverForm.version).toBeDisabled();
        await expect(serverForm.baseUrl).toBeDisabled();
        await expect(serverForm.secret).toBeDisabled();
        await expect(serverForm.strengthRating).toHaveClass(/p-disabled/);
        await expect(
          serverForm.statusDropdown.locator(".p-select-label"),
        ).toHaveAttribute("aria-disabled", "true");
        await expect(serverForm.connectionStatus).toBeDisabled();
        await expect(serverForm.testConnectionButton).toBeDisabled();
        await expect(serverForm.saveButton).toBeDisabled();

        newServerRequest.release();
        await expect(page).toHaveURL(/\/admin\/servers\/30$/);
      });

      test("save new server and redirect to the server view", async ({
        page,
        server,
        serverForm,
      }) => {
        const newServerRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          { status: 201, json: server },
        );
        const serverRequest = await mockMethod(
          page,
          "GET",
          "**/api/v1/servers/30",
          { json: server },
        );

        await serverForm.saveButton.click();

        const request = await nthRequest(newServerRequest);
        expect(request.postDataJSON()).toEqual({
          base_url: "https://localhost/bigbluebutton",
          description: "Testserver 01 for testing purposes",
          connection_status_always_online: false,
          id: null,
          name: "Server 01",
          secret: "Secret123456789",
          status: 1,
          strength: 6,
        });

        await nthRequest(serverRequest);

        await expect(page).toHaveURL(/\/admin\/servers\/30$/);
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.servers.index",
          'admin.breadcrumbs.servers.view_{"name":"Server 01"}',
        );
      });

      test("validation errors (422)", async ({ page, serverForm }) => {
        const message = "The name field is required. (and 5 more errors)";
        const fieldErrors = [
          ["name", "name-field", "The name field is required."],
          [
            "description",
            "description-field",
            "The description field is required.",
          ],
          ["base_url", "base-url-field", "The base url field is required."],
          ["secret", "secret-field", "The secret field is required."],
          ["strength", "strength-field", "The strength field is required."],
          ["status", "status-field", "The status field is required."],
        ];
        const newServerRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          {
            status: 422,
            json: {
              message,
              errors: Object.fromEntries(
                fieldErrors.map(([field, , error]) => [field, [error]]),
              ),
            },
          },
        );

        await serverForm.saveButton.click();
        await nthRequest(newServerRequest);

        await expectToastAndClose(page, message);
        for (const [, testId, error] of fieldErrors) {
          await expect(page.getByTestId(testId)).toContainText(error);
        }
      });

      test("server error (500) hides previous validation errors", async ({
        page,
        serverForm,
      }) => {
        const fieldErrors = [
          ["name", "name-field", "The name field is required."],
          [
            "description",
            "description-field",
            "The description field is required.",
          ],
          ["base_url", "base-url-field", "The base url field is required."],
          ["secret", "secret-field", "The secret field is required."],
          ["strength", "strength-field", "The strength field is required."],
          ["status", "status-field", "The status field is required."],
        ];
        const validationRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          {
            status: 422,
            json: {
              message: "The name field is required. (and 5 more errors)",
              errors: Object.fromEntries(
                fieldErrors.map(([field, , error]) => [field, [error]]),
              ),
            },
          },
        );
        await serverForm.saveButton.click();
        await nthRequest(validationRequest);
        await expectToastAndClose(
          page,
          "The name field is required. (and 5 more errors)",
        );
        await expect(page.getByTestId("name-field")).toContainText(
          "The name field is required.",
        );

        const errorRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          { status: 500, json: { message: "Test" } },
        );
        await serverForm.saveButton.click();
        await nthRequest(errorRequest);

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        for (const [, testId, error] of fieldErrors) {
          await expect(page.getByTestId(testId)).not.toContainText(error);
        }
      });

      test("not found (404) redirects to the servers index", async ({
        page,
        serverForm,
      }) => {
        const newServerRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          { status: 404, json: { message: "No query results for model" } },
        );

        await serverForm.saveButton.click();
        await nthRequest(newServerRequest);

        await expect(page).toHaveURL(/\/admin\/servers$/);
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"No query results for model"}',
          'app.flash.server_error.error_code_{"statusCode":404}',
        ]);
      });

      test("unauthenticated (401) redirects to the login", async ({
        page,
        serverForm,
      }) => {
        const newServerRequest = await mockMethod(
          page,
          "POST",
          "**/api/v1/servers",
          { status: 401 },
        );

        await serverForm.saveButton.click();
        await nthRequest(newServerRequest);

        await expectLoginRedirect(page, "/admin/servers/new");
      });
    });
  });
});
