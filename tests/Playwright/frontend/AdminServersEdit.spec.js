import { test } from "../support/fixtures/serverController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  mockApiRequest,
  serverError,
  modelNotFound,
} from "../support/utils.js";

test.describe("Admin servers edit", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
      "servers.update",
      "servers.create",
      "servers.delete",
    ];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers/1/edit");
  });

  test("visit with user without permission to edit servers", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
    ];

    await page.goto("/admin/servers/1/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/servers\/1\/edit/);
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test("shows loading state while the server is loading", async ({
    page,
    serverResponse,
  }) => {
    serverResponse.data.status = -1;
    const getServerApiMock = await mockApiRequest(page, "GET", "servers/1", {
      hold: true,
      json: serverResponse,
    });

    await page.goto("/admin/servers/1/edit");
    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();

    await expect(page.getByTestId("overlay")).toBeVisible();
    await expect(page.getByTestId("servers-cancel-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("servers-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("servers-delete-button")).toHaveCount(0);
    await expect(page.getByTestId("servers-save-button")).toBeDisabled();

    getServerApiMock.release();

    await expect(page.getByTestId("overlay")).toBeHidden();
  });

  test("shows buttons and breadcrumbs", async ({ page, serverResponse }) => {
    serverResponse.data.status = -1;

    await page.goto("/admin/servers/1/edit");

    await expect(page.getByTestId("overlay")).toBeHidden();

    const cancelButton = page.getByTestId("servers-cancel-edit-button");
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText("app.cancel_editing");
    await expect(cancelButton).toHaveAttribute("href", "/admin/servers/1");
    await expect(page.getByTestId("servers-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("servers-delete-button")).toBeVisible();
    await expect(page.getByTestId("servers-delete-button")).toBeEnabled();
    await expect(page.getByTestId("servers-save-button")).toBeVisible();
    await expect(page.getByTestId("servers-save-button")).toBeEnabled();
    await expect(page.getByTestId("servers-save-button")).toContainText(
      "app.save",
    );

    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.servers.index",
      'admin.breadcrumbs.servers.edit_{"name":"Server 01"}',
    );
  });

  test("shows the form fields with the current values", async ({
    page,
    serverForm,
  }) => {
    await page.goto("/admin/servers/1/edit");

    const nameField = page.getByTestId("name-field");
    await expect(nameField).toContainText("app.model_name");
    await expect(nameField.locator("#name")).toHaveValue("Server 01");

    const descriptionField = page.getByTestId("description-field");
    await expect(descriptionField).toContainText("app.description");
    await expect(descriptionField.locator("#description")).toHaveValue(
      "Testserver 01",
    );

    const versionField = page.getByTestId("version-field");
    await expect(versionField).toContainText("admin.servers.version");
    await expect(versionField.locator("#version")).toHaveValue("2.4.5");
    await expect(versionField.locator("#version")).toBeDisabled();

    const baseUrlField = page.getByTestId("base-url-field");
    await expect(baseUrlField).toContainText("admin.servers.base_url");
    await expect(baseUrlField.locator("#base_url")).toHaveValue(
      "https://localhost/bigbluebutton",
    );

    const secretField = page.getByTestId("secret-field");
    await expect(secretField).toContainText("admin.servers.secret");
    await expect(secretField.locator("#secret")).toHaveValue("123456789");

    const strengthField = page.getByTestId("strength-field");
    await expect(strengthField).toContainText("admin.servers.strength");
    await expect(strengthField).toContainText(
      "admin.servers.strength_description",
    );
    await expect(serverForm.strengthRating).not.toHaveClass(/p-disabled/);
    await expect(serverForm.strengthOptions).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
        "data-p-active",
        i < 2 ? "true" : "false",
      );
    }

    const statusField = page.getByTestId("status-field");
    await expect(statusField).toContainText("admin.servers.status");
    await expect(serverForm.statusDropdown).toContainText(
      "admin.servers.enabled",
    );
    await expect(
      serverForm.statusDropdown.locator(".p-select-label"),
    ).not.toHaveAttribute("aria-disabled", "true");

    const alwaysOnlineField = page.getByTestId(
      "connection-status-always-online-field",
    );
    await expect(alwaysOnlineField).toContainText(
      "admin.servers.connection_status_always_online",
    );
    await expect(alwaysOnlineField).toContainText(
      "admin.servers.connection_status_always_online_description",
    );
    await expect(
      alwaysOnlineField.locator("#connection-status-always-online"),
    ).not.toBeChecked();

    const connectionField = page.getByTestId("connection-status-field");
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

  test("hides the usage fields and the panic button", async ({ page }) => {
    await page.goto("/admin/servers/1/edit");

    await expect(page.getByTestId("name-field")).toBeVisible();

    for (const testId of [
      "meeting-count-field",
      "own-meeting-count-field",
      "participant-count-field",
      "video-count-field",
      "servers-panic-button",
    ]) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }
  });

  test("breadcrumbs stay the same while changing the form", async ({
    page,
    serverForm,
  }) => {
    await page.goto("/admin/servers/1/edit");

    await expect(serverForm.name).toHaveValue("Server 01");
    await serverForm.name.fill("Server 02");

    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.servers.index",
      'admin.breadcrumbs.servers.edit_{"name":"Server 01"}',
    );
  });

  test("change the strength", async ({ page, serverForm }) => {
    await page.goto("/admin/servers/1/edit");

    await expect(serverForm.strengthOptions).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
        "data-p-active",
        i < 2 ? "true" : "false",
      );
    }

    await serverForm.selectStrength(6);

    await expect(serverForm.strengthOptions).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
        "data-p-active",
        i < 6 ? "true" : "false",
      );
    }
  });

  test("change the status", async ({ page, serverResponse, serverForm }) => {
    serverResponse.data.status = -1;

    await page.goto("/admin/servers/1/edit");

    await expect(serverForm.statusDropdown).toHaveText(
      "admin.servers.disabled",
    );
    await expect(
      serverForm.statusDropdown.locator(".p-select-label"),
    ).not.toHaveAttribute("aria-disabled", "true");
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
    await expect(serverForm.statusDropdown).toHaveText("admin.servers.enabled");
  });

  test("toggle connection status always online", async ({
    page,
    serverForm,
  }) => {
    await page.goto("/admin/servers/1/edit");

    await expect(serverForm.alwaysOnline).not.toBeChecked();

    await serverForm.alwaysOnline.click();

    await expect(serverForm.alwaysOnline).toBeChecked();
  });

  test.describe("save changes", () => {
    const newValues = {
      name: "Server 02",
      description: "Testserver 02 for testing purposes",
      base_url: "https://localhost/bigbluebutton2",
      secret: "Secret123456789",
      strength: 6,
      connection_status_always_online: true,
      status: 1,
    };

    test.beforeEach(async ({ page, serverResponse, serverForm }) => {
      serverResponse.data.status = -1;
      await page.goto("/admin/servers/1/edit");
      await expect(page.getByTestId("overlay")).toBeHidden();

      await serverForm.fillTextFields({
        name: newValues.name,
        description: newValues.description,
        baseUrl: newValues.base_url,
        secret: newValues.secret,
      });
      await serverForm.selectStrength(6);
      await serverForm.selectStatus(0);
      await serverForm.alwaysOnline.click();
    });

    test("sends the changes and redirects to the server view", async ({
      page,
      serverResponse,
    }) => {
      Object.assign(serverResponse.data, newValues);
      const putServerApiMock = await mockApiRequest(page, "PUT", "servers/1", {
        json: serverResponse,
      });

      await page.getByTestId("servers-save-button").click();

      const request = await putServerApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual(serverResponse.data);

      await expect(page).toHaveURL(/\/admin\/servers\/1$/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.servers.index",
        'admin.breadcrumbs.servers.view_{"name":"Server 02"}',
      );

      // Server is enabled and therefore cannot be deleted
      await expect(page.getByTestId("servers-edit-button")).toBeVisible();
      await expect(page.getByTestId("servers-delete-button")).toHaveCount(0);
    });

    test("disables the form while saving", async ({
      page,
      serverResponse,
      serverForm,
    }) => {
      Object.assign(serverResponse.data, newValues);
      const putServerApiMock = await mockApiRequest(page, "PUT", "servers/1", {
        hold: true,
        json: serverResponse,
      });

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("servers-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("servers-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();

      for (const field of [
        serverForm.name,
        serverForm.description,
        serverForm.version,
        serverForm.baseUrl,
        serverForm.secret,
        serverForm.connectionStatus,
      ]) {
        await expect(field).toBeDisabled();
      }
      await expect(serverForm.strengthRating).toHaveClass(/p-disabled/);
      await expect(
        serverForm.statusDropdown.locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(serverForm.alwaysOnline).toBeChecked();
      await expect(serverForm.alwaysOnline).toBeDisabled();
      await expect(
        page.getByTestId("servers-cancel-edit-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("servers-cancel-edit-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("servers-delete-button")).toBeVisible();
      await expect(page.getByTestId("servers-delete-button")).toBeDisabled();
      await expect(serverForm.testConnectionButton).toBeDisabled();
      await expect(serverForm.saveButton).toBeDisabled();

      putServerApiMock.release();

      await expect(page).toHaveURL(/\/admin\/servers\/1$/);
    });
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/servers/1/edit");
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.servers.index",
        'admin.breadcrumbs.servers.edit_{"name":"Server 01"}',
      );
    });

    test("validation errors (422)", async ({ page }) => {
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
        [
          "connection_status_always_online",
          "connection-status-always-online-field",
          "The connection status always online field is required.",
        ],
      ];
      const putServerApiMock = await mockApiRequest(page, "PUT", "servers/1", {
        status: 422,
        json: {
          message,
          errors: Object.fromEntries(
            fieldErrors.map(([field, , error]) => [field, [error]]),
          ),
        },
      });

      await page.getByTestId("servers-save-button").click();
      await putServerApiMock.waitForRequest();

      await expectToastAndClose(page, message);
      for (const [, testId, error] of fieldErrors) {
        await expect(page.getByTestId(testId)).toContainText(error);
      }
    });

    test("server error (500) hides previous validation errors", async ({
      page,
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
        [
          "connection_status_always_online",
          "connection-status-always-online-field",
          "The connection status always online field is required.",
        ],
      ];
      const putServerApiMock = await mockApiRequest(page, "PUT", "servers/1", {
        status: 422,
        json: {
          message: "The name field is required.",
          errors: Object.fromEntries(
            fieldErrors.map(([field, , error]) => [field, [error]]),
          ),
        },
      });
      await page.getByTestId("servers-save-button").click();
      await putServerApiMock.waitForRequest();
      await expectToastAndClose(page, "The name field is required.");
      await expect(page.getByTestId("name-field")).toContainText(
        "The name field is required.",
      );

      await mockApiRequest(page, "PUT", "servers/1", serverError());
      await page.getByTestId("servers-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      for (const [, testId, error] of fieldErrors) {
        await expect(page.getByTestId(testId)).not.toContainText(error);
      }
    });

    test.describe("stale error (428)", () => {
      const staleValues = {
        name: "Server 03",
        description: "Testserver 03 for testing purposes",
        base_url: "https://localhost/bigbluebutton3",
        secret: "Secret987654321",
        strength: 5,
        status: 1,
        connection_status_always_online: true,
      };

      test.beforeEach(async ({ page, serverResponse }) => {
        await mockApiRequest(page, "PUT", "servers/1", {
          status: 428,
          json: {
            new_model: { ...serverResponse.data, ...staleValues },
            message: "stale_model",
          },
        });

        await expect(page.getByTestId("stale-server-dialog")).toHaveCount(0);
        await page.getByTestId("servers-save-button").click();
      });

      test("shows stale dialog", async ({ page }) => {
        const dialog = page.getByTestId("stale-server-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.server"}',
        );
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("reload shows the new data of the server", async ({
        page,
        serverForm,
      }) => {
        await page.getByTestId("stale-dialog-reject-button").click();

        await expect(page.getByTestId("stale-server-dialog")).toBeHidden();
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.servers.index",
          'admin.breadcrumbs.servers.edit_{"name":"Server 03"}',
        );
        await expect(serverForm.name).toHaveValue(staleValues.name);
        await expect(serverForm.description).toHaveValue(
          staleValues.description,
        );
        await expect(serverForm.baseUrl).toHaveValue(staleValues.base_url);
        await expect(serverForm.secret).toHaveValue(staleValues.secret);
        await expect(serverForm.strengthOptions).toHaveCount(10);
        for (let i = 0; i < 10; i++) {
          await expect(serverForm.strengthOptions.nth(i)).toHaveAttribute(
            "data-p-active",
            i < staleValues.strength ? "true" : "false",
          );
        }
        await expect(serverForm.statusDropdown).toContainText(
          "admin.servers.enabled",
        );
        await expect(serverForm.alwaysOnline).toBeChecked();
      });

      test("a second stale error shows the dialog again", async ({
        page,
        serverResponse,
      }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-server-dialog")).toBeHidden();

        await mockApiRequest(page, "PUT", "servers/1", {
          status: 428,
          json: {
            new_model: {
              ...serverResponse.data,
              name: "Server 04",
              status: 10,
              connection_status_always_online: false,
            },
            message: "stale_model",
          },
        });
        await page.getByTestId("servers-save-button").click();

        const dialog = page.getByTestId("stale-server-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.server"}',
        );
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("overwrite sends the data of the server again and redirects", async ({
        page,
        serverResponse,
      }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-server-dialog")).toBeHidden();

        await mockApiRequest(page, "PUT", "servers/1", {
          status: 428,
          json: {
            new_model: { ...serverResponse.data, name: "Server 04" },
            message: "stale_model",
          },
        });
        await page.getByTestId("servers-save-button").click();
        await expect(page.getByTestId("stale-server-dialog")).toBeVisible();

        Object.assign(serverResponse.data, staleValues);
        const putServerApiMock = await mockApiRequest(
          page,
          "PUT",
          "servers/1",
          {
            json: serverResponse,
          },
        );

        await page.getByTestId("stale-dialog-accept-button").click();

        const request = await putServerApiMock.waitForRequest();
        expect(request.postDataJSON()).toEqual(serverResponse.data);

        await expect(page).toHaveURL(/\/admin\/servers\/1$/);
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.servers.index",
          'admin.breadcrumbs.servers.view_{"name":"Server 03"}',
        );
      });
    });

    test("model not found (404) redirects to the servers index", async ({
      page,
    }) => {
      const putServerApiMock = await mockApiRequest(
        page,
        "PUT",
        "servers/1",
        modelNotFound("server", [1]),
      );

      await page.getByTestId("servers-save-button").click();
      await putServerApiMock.waitForRequest();

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const putServerApiMock = await mockApiRequest(page, "PUT", "servers/1", {
        status: 401,
      });

      await page.getByTestId("servers-save-button").click();
      await putServerApiMock.waitForRequest();

      await expectLoginRedirect(page, "/admin/servers/1/edit");
    });
  });

  test.describe("buttons without delete permission", () => {
    test.beforeEach(({ currentUserResponse }) => {
      currentUserResponse.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
        "servers.update",
        "servers.create",
      ];
    });

    for (const [name, status] of [
      ["enabled", 1],
      ["draining", 0],
      ["disabled", -1],
    ]) {
      test(`server ${name}`, async ({ page, serverResponse, serverForm }) => {
        serverResponse.data.status = status;

        await page.goto("/admin/servers/1/edit");

        const cancelButton = page.getByTestId("servers-cancel-edit-button");
        await expect(cancelButton).toBeVisible();
        await expect(cancelButton).toBeEnabled();
        await expect(cancelButton).toContainText("app.cancel_editing");
        await expect(cancelButton).toHaveAttribute("href", "/admin/servers/1");
        await expect(page.getByTestId("servers-edit-button")).toHaveCount(0);
        await expect(page.getByTestId("servers-delete-button")).toHaveCount(0);
        await expect(serverForm.saveButton).toBeVisible();
        await expect(serverForm.saveButton).toBeEnabled();
        await expect(serverForm.saveButton).toContainText("app.save");

        await expect(serverForm.testConnectionButton).toBeVisible();
        await expect(serverForm.testConnectionButton).toHaveText(
          "admin.servers.test_connection",
        );
        await expect(serverForm.testConnectionButton).toBeEnabled();
        await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
      });
    }
  });

  test.describe("load server errors", () => {
    test("server error (500) shows the overlay and allows to reload", async ({
      page,
      serverResponse,
      serverForm,
    }) => {
      await mockApiRequest(page, "GET", "servers/1", serverError());

      await page.goto("/admin/servers/1/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await mockApiRequest(page, "GET", "servers/1", { json: serverResponse });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(serverForm.name).toHaveValue("Server 01");
    });

    test("model not found (404) redirects to the servers index", async ({
      page,
    }) => {
      await mockApiRequest(
        page,
        "GET",
        "servers/1",
        modelNotFound("server", [1]),
      );

      await page.goto("/admin/servers/1/edit");

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.server"}',
        'app.flash.model_not_found.details_{"ids":"1"}',
      ]);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      await mockApiRequest(page, "GET", "servers/1", { status: 401 });

      await page.goto("/admin/servers/1/edit");

      await expectLoginRedirect(page, "/admin/servers/1/edit");
    });
  });
});
