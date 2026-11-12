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
import { mockMethod, nthRequest } from "../support/utils.js";

const SERVER_URL = "**/api/v1/servers/1";

const readServer = () =>
  JSON.parse(readFileSync("tests/Playwright/fixtures/server.json", "utf8"));

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const modelNotFoundToast = [
  'app.flash.model_not_found.title_{"model":"app.model.server"}',
  'app.flash.model_not_found.details_{"ids":"1"}',
];

const staleDialogTexts = [
  "app.errors.stale_error",
  'app.errors.stale_model_{"model":"app.model.server"}',
];

const requiredErrors = {
  "name-field": "The name field is required.",
  "description-field": "The description field is required.",
  "base-url-field": "The base url field is required.",
  "secret-field": "The secret field is required.",
  "strength-field": "The strength field is required.",
  "status-field": "The status field is required.",
  "connection-status-always-online-field":
    "The connection status always online field is required.",
};

/**
 * Server fixture as the backend returns it after the server was changed.
 */
function changedServer(changes) {
  const server = readServer();
  Object.assign(server.data, changes);
  return server;
}

function mockServer(page, method, response) {
  return mockMethod(page, method, SERVER_URL, response);
}

async function expectStrength(page, active) {
  const options = page.getByTestId("strength-rating-option");
  await expect(options).toHaveCount(10);
  for (let i = 0; i < 10; i++) {
    await expect(options.nth(i)).toHaveAttribute(
      "data-p-active",
      i < active ? "true" : "false",
    );
  }
}

async function expectFormValues(page, values) {
  await expect(page.locator("#name")).toHaveValue(values.name);
  await expect(page.locator("#description")).toHaveValue(values.description);
  await expect(page.locator("#base_url")).toHaveValue(values.base_url);
  await expect(page.locator("#secret")).toHaveValue(values.secret);
  await expectStrength(page, values.strength);
  await expect(page.getByTestId("status-dropdown")).toContainText(
    values.status,
  );
  if (values.alwaysOnline) {
    await expect(
      page.locator("#connection-status-always-online"),
    ).toBeChecked();
  } else {
    await expect(
      page.locator("#connection-status-always-online"),
    ).not.toBeChecked();
  }
}

/**
 * Check the buttons that are shown on the edit page of a server that cannot be deleted.
 */
async function expectButtonsWithoutDelete(page) {
  const cancelButton = page.getByTestId("servers-cancel-edit-button");
  await expect(cancelButton).toBeVisible();
  await expect(cancelButton).toBeEnabled();
  await expect(cancelButton).toContainText("app.cancel_editing");
  await expect(cancelButton).toHaveAttribute("href", "/admin/servers/1");
  await expect(page.getByTestId("servers-edit-button")).toHaveCount(0);
  await expect(page.getByTestId("servers-delete-button")).toHaveCount(0);
  const saveButton = page.getByTestId("servers-save-button");
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();
  await expect(saveButton).toContainText("app.save");

  const testButton = page.getByTestId("servers-test-connection-button");
  await expect(testButton).toBeVisible();
  await expect(testButton).toHaveText("admin.servers.test_connection");
  await expect(testButton).toBeEnabled();
  await expect(page.getByTestId("servers-panic-button")).toHaveCount(0);
}

test.describe("Admin servers edit", () => {
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

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/servers/1/edit");
  });

  test("visit with user without permission to edit servers", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "servers.viewAny",
      "servers.view",
    ];

    await page.goto("/admin/servers/1/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    await expect(page).not.toHaveURL(/\/admin\/servers\/1\/edit/);
    await expect(page.locator("h1")).toContainText("home.title");
  });

  test("shows loading state while the server is loading", async ({ page }) => {
    const server = await mockServer(page, "GET", {
      hold: true,
      json: changedServer({ status: -1 }),
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

    server.release();

    await expect(page.getByTestId("overlay")).toBeHidden();
  });

  test("shows buttons and breadcrumbs", async ({ page }) => {
    await mockServer(page, "GET", { json: changedServer({ status: -1 }) });

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

  test("shows the form fields with the current values", async ({ page }) => {
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
    await expect(page.getByTestId("strength-rating")).not.toHaveClass(
      /p-disabled/,
    );
    await expectStrength(page, 2);

    const statusField = page.getByTestId("status-field");
    await expect(statusField).toContainText("admin.servers.status");
    await expect(page.getByTestId("status-dropdown")).toContainText(
      "admin.servers.enabled",
    );
    await expect(
      page.getByTestId("status-dropdown").locator(".p-select-label"),
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
  }) => {
    await page.goto("/admin/servers/1/edit");

    await expect(page.locator("#name")).toHaveValue("Server 01");
    await page.locator("#name").fill("Server 02");

    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.servers.index",
      'admin.breadcrumbs.servers.edit_{"name":"Server 01"}',
    );
  });

  test("change the strength", async ({ page }) => {
    await page.goto("/admin/servers/1/edit");

    await expectStrength(page, 2);

    await page.getByTestId("strength-rating-option").nth(5).click();

    await expectStrength(page, 6);
  });

  test("change the status", async ({ page }) => {
    await mockServer(page, "GET", { json: changedServer({ status: -1 }) });

    await page.goto("/admin/servers/1/edit");

    const dropdown = page.getByTestId("status-dropdown");
    await expect(dropdown).toHaveText("admin.servers.disabled");
    await expect(dropdown.locator(".p-select-label")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(page.getByTestId("status-dropdown-items")).toHaveCount(0);

    await dropdown.click();

    const items = page.getByTestId("status-dropdown-items");
    await expect(items).toBeVisible();
    const options = items.getByTestId("status-dropdown-option");
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText("admin.servers.enabled");
    await expect(options.nth(1)).toHaveText("admin.servers.draining");
    await expect(options.nth(2)).toHaveText("admin.servers.disabled");

    await options.nth(0).click();

    await expect(items).toHaveCount(0);
    await expect(dropdown).toHaveText("admin.servers.enabled");
  });

  test("toggle connection status always online", async ({ page }) => {
    await page.goto("/admin/servers/1/edit");

    const checkbox = page.locator("#connection-status-always-online");
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();

    await expect(checkbox).toBeChecked();
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

    test.beforeEach(async ({ page }) => {
      await mockServer(page, "GET", { json: changedServer({ status: -1 }) });
      await page.goto("/admin/servers/1/edit");
      await expect(page.getByTestId("overlay")).toBeHidden();

      await page.locator("#name").fill("Server 02");
      await page.locator("#description").fill(newValues.description);
      await page.locator("#base_url").fill(newValues.base_url);
      await page.locator("#secret").fill(newValues.secret);
      await page.getByTestId("strength-rating-option").nth(5).click();
      await page.getByTestId("status-dropdown").click();
      await page.getByTestId("status-dropdown-option").nth(0).click();
      await page.locator("#connection-status-always-online").click();
    });

    test("sends the changes and redirects to the server view", async ({
      page,
    }) => {
      const server = changedServer(newValues);
      const saveRequest = await mockServer(page, "PUT", { json: server });
      await mockServer(page, "GET", { json: server });

      await page.getByTestId("servers-save-button").click();

      const request = await nthRequest(saveRequest);
      expect(request.postDataJSON()).toEqual(server.data);

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

    test("disables the form while saving", async ({ page }) => {
      const server = changedServer(newValues);
      const saveRequest = await mockServer(page, "PUT", {
        hold: true,
        json: server,
      });
      await mockServer(page, "GET", { json: server });

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("servers-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("servers-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();

      for (const id of [
        "#name",
        "#description",
        "#version",
        "#base_url",
        "#secret",
        "#connectionStatus",
      ]) {
        await expect(page.locator(id)).toBeDisabled();
      }
      await expect(page.getByTestId("strength-rating")).toHaveClass(
        /p-disabled/,
      );
      await expect(
        page.getByTestId("status-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(
        page.locator("#connection-status-always-online"),
      ).toBeChecked();
      await expect(
        page.locator("#connection-status-always-online"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("servers-cancel-edit-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("servers-cancel-edit-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("servers-delete-button")).toBeVisible();
      await expect(page.getByTestId("servers-delete-button")).toBeDisabled();
      await expect(
        page.getByTestId("servers-test-connection-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("servers-save-button")).toBeDisabled();

      saveRequest.release();

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
      const saveRequest = await mockServer(page, "PUT", {
        status: 422,
        json: {
          message,
          errors: Object.fromEntries(
            Object.entries({
              name: requiredErrors["name-field"],
              description: requiredErrors["description-field"],
              base_url: requiredErrors["base-url-field"],
              secret: requiredErrors["secret-field"],
              strength: requiredErrors["strength-field"],
              status: requiredErrors["status-field"],
              connection_status_always_online:
                requiredErrors["connection-status-always-online-field"],
            }).map(([key, error]) => [key, [error]]),
          ),
        },
      });

      await page.getByTestId("servers-save-button").click();
      await nthRequest(saveRequest);

      await expectToastAndClose(page, message);
      for (const [testId, error] of Object.entries(requiredErrors)) {
        await expect(page.getByTestId(testId)).toContainText(error);
      }
    });

    test("server error (500) hides previous validation errors", async ({
      page,
    }) => {
      const saveRequest = await mockServer(page, "PUT", {
        status: 422,
        json: {
          message: "The name field is required.",
          errors: Object.fromEntries(
            Object.entries(requiredErrors).map(([testId, error]) => [
              {
                "name-field": "name",
                "description-field": "description",
                "base-url-field": "base_url",
                "secret-field": "secret",
                "strength-field": "strength",
                "status-field": "status",
                "connection-status-always-online-field":
                  "connection_status_always_online",
              }[testId],
              [error],
            ]),
          ),
        },
      });
      await page.getByTestId("servers-save-button").click();
      await nthRequest(saveRequest);
      await expectToastAndClose(page, "The name field is required.");
      await expect(page.getByTestId("name-field")).toContainText(
        requiredErrors["name-field"],
      );

      await mockServer(page, "PUT", { status: 500, json: { message: "Test" } });
      await page.getByTestId("servers-save-button").click();

      await expectToastAndClose(page, serverErrorToast);
      for (const [testId, error] of Object.entries(requiredErrors)) {
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

      test.beforeEach(async ({ page }) => {
        await mockServer(page, "PUT", {
          status: 428,
          json: {
            new_model: changedServer(staleValues).data,
            message: "stale_model",
          },
        });

        await expect(page.getByTestId("stale-server-dialog")).toHaveCount(0);
        await page.getByTestId("servers-save-button").click();
      });

      test("shows stale dialog", async ({ page }) => {
        const dialog = page.getByTestId("stale-server-dialog");
        await expect(dialog).toBeVisible();
        for (const text of staleDialogTexts) {
          await expect(dialog).toContainText(text);
        }
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

      test("reload shows the new data of the server", async ({ page }) => {
        await page.getByTestId("stale-dialog-reject-button").click();

        await expect(page.getByTestId("stale-server-dialog")).toBeHidden();
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.servers.index",
          'admin.breadcrumbs.servers.edit_{"name":"Server 03"}',
        );
        await expectFormValues(page, {
          ...staleValues,
          status: "admin.servers.enabled",
          alwaysOnline: true,
        });
      });

      test("a second stale error shows the dialog again", async ({ page }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-server-dialog")).toBeHidden();

        await mockServer(page, "PUT", {
          status: 428,
          json: {
            new_model: changedServer({
              name: "Server 04",
              status: 10,
              connection_status_always_online: false,
            }).data,
            message: "stale_model",
          },
        });
        await page.getByTestId("servers-save-button").click();

        const dialog = page.getByTestId("stale-server-dialog");
        await expect(dialog).toBeVisible();
        for (const text of staleDialogTexts) {
          await expect(dialog).toContainText(text);
        }
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("overwrite sends the data of the server again and redirects", async ({
        page,
      }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-server-dialog")).toBeHidden();

        await mockServer(page, "PUT", {
          status: 428,
          json: {
            new_model: changedServer({ name: "Server 04" }).data,
            message: "stale_model",
          },
        });
        await page.getByTestId("servers-save-button").click();
        await expect(page.getByTestId("stale-server-dialog")).toBeVisible();

        const server = changedServer(staleValues);
        const saveRequest = await mockServer(page, "PUT", { json: server });
        await mockServer(page, "GET", { json: server });

        await page.getByTestId("stale-dialog-accept-button").click();

        const request = await nthRequest(saveRequest);
        expect(request.postDataJSON()).toEqual(server.data);

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
      await interceptAdminServersIndexRequests(page);
      const saveRequest = await mockServer(page, "PUT", {
        status: 404,
        json: { message: "model_not_found", model: "server", ids: [1] },
      });

      await page.getByTestId("servers-save-button").click();
      await nthRequest(saveRequest);

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expectToastAndClose(page, modelNotFoundToast);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      const saveRequest = await mockServer(page, "PUT", { status: 401 });

      await page.getByTestId("servers-save-button").click();
      await nthRequest(saveRequest);

      await expectLoginRedirect(page, "/admin/servers/1/edit");
    });
  });

  test.describe("buttons without delete permission", () => {
    test.beforeEach(({ currentUser }) => {
      currentUser.data.permissions = [
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
      test(`server ${name}`, async ({ page }) => {
        await mockServer(page, "GET", { json: changedServer({ status }) });

        await page.goto("/admin/servers/1/edit");

        await expectButtonsWithoutDelete(page);
      });
    }
  });

  test.describe("load server errors", () => {
    test("server error (500) shows the overlay and allows to reload", async ({
      page,
    }) => {
      await mockServer(page, "GET", { status: 500, json: { message: "Test" } });

      await page.goto("/admin/servers/1/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, serverErrorToast);

      await mockServer(page, "GET", { json: readServer() });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.locator("#name")).toHaveValue("Server 01");
    });

    test("model not found (404) redirects to the servers index", async ({
      page,
    }) => {
      await interceptAdminServersIndexRequests(page);
      await mockServer(page, "GET", {
        status: 404,
        json: { message: "model_not_found", model: "server", ids: [1] },
      });

      await page.goto("/admin/servers/1/edit");

      await expect(page).toHaveURL(/\/admin\/servers$/);
      await expectToastAndClose(page, modelNotFoundToast);
    });

    test("unauthenticated (401) redirects to the login", async ({ page }) => {
      await mockServer(page, "GET", { status: 401 });

      await page.goto("/admin/servers/1/edit");

      await expectLoginRedirect(page, "/admin/servers/1/edit");
    });
  });
});
