import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/adminUsersEdit.js";
import { interceptAdminUsersIndexRequests } from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import { expectMultiselectOptions } from "../support/admin.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin users edit security", () => {
  test.beforeEach(async ({ currentUser, config }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "users.delete",
      "roles.viewAny",
    ];
    config.data.auth.local = true;
  });

  test("open security tab sets the tab hash", async ({ page }) => {
    await page.goto("/admin/users/2/edit");
    await page.getByTestId("security-tab-button").click();

    await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=security/);
    await expect(
      page.getByText("admin.users.roles_and_permissions"),
    ).toBeVisible();
  });

  test("view with local user", async ({ page }) => {
    await page.goto("/admin/users/2/edit#tab=security");

    const rolesField = page.getByTestId("roles-field");
    await expect(rolesField).toBeVisible();
    await expect(rolesField).toContainText("app.roles");

    const chips = rolesField
      .getByTestId("role-dropdown")
      .getByTestId("role-chip");
    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).toContainText("Students");
    await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(0);
    await expect(chips.nth(1)).toContainText("Staff");
    await expect(chips.nth(1).getByTestId("remove-role-button")).toBeVisible();

    await expect(
      page.getByTestId("security-tab-current-password-field"),
    ).toHaveCount(0);

    const password = page.getByTestId("new-password-field");
    await expect(password).toBeVisible();
    await expect(password).toContainText("auth.new_password");
    await expect(password.locator("#new_password")).toHaveValue("");

    const confirmation = page.getByTestId("new-password-confirmation-field");
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText("auth.new_password_confirmation");
    await expect(
      confirmation.locator("#new_password_confirmation"),
    ).toHaveValue("");

    await expect(page.getByTestId("session-panel")).toHaveCount(0);
  });

  test("view with external user", async ({ page, user }) => {
    user.data.authenticator = "ldap";
    user.data.external_id = "lwr";

    await page.goto("/admin/users/2/edit#tab=security");

    // Role select is shown and enabled (after roles are loaded)
    const rolesField = page.getByTestId("roles-field");
    await expect(rolesField).toBeVisible();
    await expect(rolesField).toContainText("app.roles");
    await expect(page.getByTestId("role-chip")).toHaveCount(2);
    await expect(page.getByTestId("users-roles-save-button")).toBeEnabled();
    await expect(rolesField.getByTestId("role-dropdown")).not.toHaveClass(
      /multiselect--disabled/,
    );

    // Password fields are hidden
    await expect(
      page.getByTestId("security-tab-current-password-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("new-password-field")).toHaveCount(0);
    await expect(
      page.getByTestId("new-password-confirmation-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("change-password-save-button")).toHaveCount(
      0,
    );

    await expect(page.getByTestId("session-panel")).toHaveCount(0);
  });

  test.describe("roles", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2/edit#tab=security");
      await expect(page.getByTestId("role-chip")).toHaveCount(2);
    });

    test("role options", async ({ page }) => {
      await page.getByTestId("role-dropdown").click();

      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await expectMultiselectOptions(
        content,
        ["Superuser", "Staff", "Students"],
        "admin.roles.no_data",
      );

      const options = content.locator(".multiselect__option");
      await expect(options.nth(0)).toContainText("admin.roles.superuser");
      await expect(options.nth(0)).not.toContainText("admin.roles.automatic");
      await expect(options.nth(0)).not.toHaveClass(
        /multiselect__option--disabled/,
      );

      await expect(options.nth(1)).not.toContainText("admin.roles.superuser");
      await expect(options.nth(1)).not.toContainText("admin.roles.automatic");
      await expect(options.nth(1)).not.toHaveClass(
        /multiselect__option--disabled/,
      );
      await expect(options.nth(1)).toHaveClass(/multiselect__option--selected/);

      await expect(options.nth(2)).toContainText("admin.roles.automatic");
      await expect(options.nth(2)).not.toContainText("admin.roles.superuser");
      await expect(options.nth(2)).toHaveClass(/multiselect__option--disabled/);
    });

    test("superuser role is disabled for users that are not superusers", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];
      await page.reload();
      await expect(page.getByTestId("role-chip")).toHaveCount(2);

      await page.getByTestId("role-dropdown").click();

      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await expectMultiselectOptions(
        content,
        ["Superuser", "Staff", "Students"],
        "admin.roles.no_data",
      );

      const options = content.locator(".multiselect__option");
      await expect(options.nth(0)).toContainText("admin.roles.superuser");
      await expect(options.nth(0)).not.toContainText("admin.roles.automatic");
      await expect(options.nth(0)).toHaveClass(/multiselect__option--disabled/);

      await expect(options.nth(1)).not.toContainText("admin.roles.superuser");
      await expect(options.nth(1)).not.toContainText("admin.roles.automatic");
      await expect(options.nth(1)).not.toHaveClass(
        /multiselect__option--disabled/,
      );
      await expect(options.nth(1)).toHaveClass(/multiselect__option--selected/);

      await expect(options.nth(2)).toContainText("admin.roles.automatic");
      await expect(options.nth(2)).not.toContainText("admin.roles.superuser");
      await expect(options.nth(2)).toHaveClass(/multiselect__option--disabled/);
    });

    test("roles pagination and loading state", async ({
      page,
      secondRolesPage,
    }) => {
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      const previous = content.getByTestId("previous-page-button");
      const next = content.getByTestId("next-page-button");
      await expect(previous).toContainText("app.previous_page");
      await expect(previous).toBeDisabled();
      await expect(next).toContainText("app.next_page");
      await expect(next).toBeEnabled();

      const rolesRequest = await mockMethod(page, "GET", "**/api/v1/roles*", {
        json: secondRolesPage,
        hold: true,
      });
      await next.click();

      // Check loading
      await expect(previous).toBeDisabled();
      await expect(next).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-roles-save-button")).toBeDisabled();

      rolesRequest.release();
      await nthRequest(rolesRequest);

      await expect(page.getByTestId("users-roles-save-button")).toBeEnabled();
      await expect(previous).toBeEnabled();
      await expect(next).toBeDisabled();
      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        "admin.roles.no_data",
      );

      const options = content.locator(".multiselect__option");
      for (let index = 0; index < 3; index++) {
        await expect(options.nth(index)).not.toContainText(
          "admin.roles.superuser",
        );
        await expect(options.nth(index)).not.toContainText(
          "admin.roles.automatic",
        );
        await expect(options.nth(index)).not.toHaveClass(
          /multiselect__option--disabled/,
        );
      }
    });

    test("select and remove roles", async ({ page, secondRolesPage }) => {
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await content.locator(".multiselect__option").nth(0).click();

      await mockMethod(page, "GET", "**/api/v1/roles*", {
        json: secondRolesPage,
      });
      await content.getByTestId("next-page-button").click();
      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        "admin.roles.no_data",
      );

      await content.locator(".multiselect__option").nth(0).click();
      await content.locator(".multiselect__option").nth(2).click();

      await expect(content).toBeVisible();
      const chips = page.getByTestId("role-dropdown").getByTestId("role-chip");
      await expect(chips).toHaveCount(5);
      await expect(chips.nth(0)).toContainText("Students");
      await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(
        0,
      );
      for (const [index, name] of [
        "Staff",
        "Superuser",
        "Dean",
        "Manager",
      ].entries()) {
        await expect(chips.nth(index + 1)).toContainText(name);
        await expect(
          chips.nth(index + 1).getByTestId("remove-role-button"),
        ).toBeVisible();
      }

      await chips.nth(1).getByTestId("remove-role-button").click();

      // Dropdown is closed
      await expect(content).toHaveCount(0);
      await expect(chips).toHaveCount(4);
      await expect(chips.nth(1)).toContainText("Superuser");
    });

    test("save roles", async ({ page, user, secondRolesPage }) => {
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await content.locator(".multiselect__option").nth(0).click();

      await mockMethod(page, "GET", "**/api/v1/roles*", {
        json: secondRolesPage,
      });
      await content.getByTestId("next-page-button").click();
      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        "admin.roles.no_data",
      );
      await content.locator(".multiselect__option").nth(0).click();
      await content.locator(".multiselect__option").nth(2).click();

      await page
        .getByTestId("role-chip")
        .nth(1)
        .getByTestId("remove-role-button")
        .click();
      await expect(content).toHaveCount(0);

      user.data.roles = [
        { id: 1, name: "Superuser", automatic: false, superuser: true },
        { id: 3, name: "Students", automatic: true, superuser: false },
        { id: 4, name: "Dean", automatic: false, superuser: false },
        { id: 6, name: "Manager", automatic: false, superuser: false },
      ];
      const saveRequest = await mockMethod(page, "PUT", "**/api/v1/users/2", {
        json: user,
        hold: true,
      });

      await expect(page.getByTestId("users-roles-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("users-roles-save-button").click();

      // Check loading
      await expect(page.getByTestId("base-tab-button")).toBeDisabled();
      await expect(page.getByTestId("email-tab-button")).toBeDisabled();
      await expect(page.getByTestId("security-tab-button")).toBeDisabled();
      await expect(page.getByTestId("others-tab-button")).toBeDisabled();

      await expect(page.getByTestId("users-cancel-edit-button")).toBeDisabled();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("users-delete-button")).toBeDisabled();

      await expect(page.locator("#new_password")).toBeDisabled();
      await expect(page.locator("#new_password_confirmation")).toBeDisabled();
      await expect(
        page.getByTestId("change-password-save-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-roles-save-button")).toBeDisabled();

      saveRequest.release();

      expect((await nthRequest(saveRequest)).postDataJSON()).toMatchObject({
        roles: [3, 1, 4, 6],
      });

      // Redirect to user view
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=security/);
      await expect(page).not.toHaveURL(/\/edit/);
    });
  });

  test.describe("save roles errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2/edit#tab=security");
      await expect(page.getByTestId("role-chip")).toHaveCount(2);
    });

    test("422 error shows messages at the field", async ({ page }) => {
      const save = await mockMethod(page, "PUT", "**/api/v1/users/2", {
        status: 422,
        json: {
          message: "The roles field is required.",
          errors: { roles: ["The roles field is required."] },
        },
      });
      await page.getByTestId("users-roles-save-button").click();
      await nthRequest(save);

      await expectToastAndClose(page, "The roles field is required.");
      await expect(page.getByTestId("roles-field")).toContainText(
        "The roles field is required.",
      );
    });

    test("500 error hides previous 422 messages", async ({ page }) => {
      await mockMethod(page, "PUT", "**/api/v1/users/2", {
        status: 422,
        json: {
          message: "The roles field is required.",
          errors: { roles: ["The roles field is required."] },
        },
      });
      await page.getByTestId("users-roles-save-button").click();
      await expectToastAndClose(page, "The roles field is required.");
      await expect(page.getByTestId("roles-field")).toContainText(
        "The roles field is required.",
      );

      await mockMethod(page, "PUT", "**/api/v1/users/2", {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("users-roles-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("roles-field")).not.toContainText(
        "The roles field is required.",
      );
    });

    test("428 error shows stale dialog and reloads", async ({ page, user }) => {
      user.data.roles = [
        { id: 3, name: "Students", automatic: true },
        { id: 4, name: "Dean", automatic: false },
        { id: 6, name: "Manager", automatic: false },
      ];
      user.data.user_locale = "de";
      user.data.timezone = "Europe/Berlin";

      const save = await mockMethod(page, "PUT", "**/api/v1/users/2", {
        status: 428,
        json: { message: "stale_model", new_model: user.data },
      });

      await expect(page.getByTestId("stale-user-dialog")).toHaveCount(0);
      await page.getByTestId("users-roles-save-button").click();
      await nthRequest(save);

      const dialog = page.getByTestId("stale-user-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'app.errors.stale_model_{"model":"app.model.user"}',
      );

      await page.getByTestId("stale-dialog-reload-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/2/);
      await expect(page).not.toHaveURL(/\/edit/);
    });

    test("404 error redirects to users index", async ({ page }) => {
      await interceptAdminUsersIndexRequests(page);
      const save = await mockMethod(page, "PUT", "**/api/v1/users/2", {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });
      await page.getByTestId("users-roles-save-button").click();
      await nthRequest(save);

      await expect(page).not.toHaveURL(/\/admin\/users\/2\/edit/);
      await expect(page).toHaveURL(/\/admin\/users/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("401 error redirects to login", async ({ page }) => {
      const save = await mockMethod(page, "PUT", "**/api/v1/users/2", {
        status: 401,
      });
      await page.getByTestId("users-roles-save-button").click();
      await nthRequest(save);

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });

  test.describe("change password", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2/edit#tab=security");
      await expect(page.getByTestId("role-chip")).toHaveCount(2);
    });

    test("change password and loading state", async ({ page, user }) => {
      await page.locator("#new_password").fill("secretPassword123#");
      await page
        .locator("#new_password_confirmation")
        .fill("secretPassword123#");

      const save = await mockMethod(page, "PUT", "**/api/v1/users/2/password", {
        json: user,
        hold: true,
      });

      await expect(page.getByTestId("change-password-save-button")).toHaveText(
        "auth.change_password",
      );
      await page.getByTestId("change-password-save-button").click();

      // Check loading
      await expect(page.getByTestId("base-tab-button")).toBeDisabled();
      await expect(page.getByTestId("email-tab-button")).toBeDisabled();
      await expect(page.getByTestId("security-tab-button")).toBeDisabled();
      await expect(page.getByTestId("others-tab-button")).toBeDisabled();

      await expect(page.getByTestId("users-cancel-edit-button")).toBeDisabled();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("users-delete-button")).toBeDisabled();

      await expect(page.locator("#new_password")).toBeDisabled();
      await expect(page.locator("#new_password_confirmation")).toBeDisabled();
      await expect(
        page.getByTestId("change-password-save-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-roles-save-button")).toBeDisabled();

      save.release();

      expect((await nthRequest(save)).postDataJSON()).toEqual({
        new_password: "secretPassword123#",
        new_password_confirmation: "secretPassword123#",
      });

      await expectToastAndClose(page, "auth.flash.password_changed");

      // Redirect to user view
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=security/);
      await expect(page).not.toHaveURL(/\/edit/);
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId("new-password-field").locator("input").fill(" ");
        await page
          .getByTestId("new-password-confirmation-field")
          .locator("input")
          .fill(" ");
      });

      test("422 error shows messages at the fields", async ({ page }) => {
        const save = await mockMethod(
          page,
          "PUT",
          "**/api/v1/users/2/password",
          {
            status: 422,
            json: {
              message: "The New password field is required. (and 1 more error)",
              errors: {
                new_password: ["The New password field is required."],
                new_password_confirmation: [
                  "The New password confirmation field is required.",
                ],
              },
            },
          },
        );
        await page.getByTestId("change-password-save-button").click();
        await nthRequest(save);

        await expectToastAndClose(
          page,
          "The New password field is required. (and 1 more error)",
        );
        await expect(page.getByTestId("new-password-field")).toContainText(
          "The New password field is required.",
        );
        await expect(
          page.getByTestId("new-password-confirmation-field"),
        ).toContainText("The New password confirmation field is required.");
      });

      test("500 error hides previous 422 messages", async ({ page }) => {
        await mockMethod(page, "PUT", "**/api/v1/users/2/password", {
          status: 422,
          json: {
            message: "The New password field is required. (and 1 more error)",
            errors: {
              new_password: ["The New password field is required."],
              new_password_confirmation: [
                "The New password confirmation field is required.",
              ],
            },
          },
        });
        await page.getByTestId("change-password-save-button").click();
        await expectToastAndClose(
          page,
          "The New password field is required. (and 1 more error)",
        );
        await expect(page.getByTestId("new-password-field")).toContainText(
          "The New password field is required.",
        );

        // Fields are cleared after a failed request
        const password = page
          .getByTestId("new-password-field")
          .locator("input");
        const confirmation = page
          .getByTestId("new-password-confirmation-field")
          .locator("input");
        await expect(password).toHaveValue("");
        await password.fill("newSecretPassword123#");
        await expect(confirmation).toHaveValue("");
        await confirmation.fill("newSecretPassword123#");

        await mockMethod(page, "PUT", "**/api/v1/users/2/password", {
          status: 500,
          json: { message: "Test" },
        });
        await page.getByTestId("change-password-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(page.getByTestId("new-password-field")).not.toContainText(
          "The New password field is required.",
        );
        await expect(
          page.getByTestId("new-password-confirmation-field"),
        ).not.toContainText("The New password confirmation field is required.");
      });

      test("404 error redirects to users index", async ({ page }) => {
        await interceptAdminUsersIndexRequests(page);
        const save = await mockMethod(
          page,
          "PUT",
          "**/api/v1/users/2/password",
          {
            status: 404,
            json: { message: "model_not_found", model: "user", ids: [2] },
          },
        );
        await page.getByTestId("change-password-save-button").click();
        await nthRequest(save);

        await expect(page).not.toHaveURL(/\/admin\/users\/2\/edit/);
        await expect(page).toHaveURL(/\/admin\/users/);
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.user"}',
          'app.flash.model_not_found.details_{"ids":"2"}',
        ]);
      });

      test("401 error redirects to login", async ({ page }) => {
        const save = await mockMethod(
          page,
          "PUT",
          "**/api/v1/users/2/password",
          {
            status: 401,
          },
        );
        await page.getByTestId("change-password-save-button").click();
        await nthRequest(save);

        await expectLoginRedirect(page, "/admin/users/2/edit");
      });
    });
  });

  test.describe("load roles errors", () => {
    test("500 error and reload", async ({ page, roles }) => {
      const rolesRequest = await mockMethod(page, "GET", "**/api/v1/roles*", {
        status: 500,
        json: { message: "Test" },
        hold: true,
      });

      await page.goto("/admin/users/2/edit#tab=security");

      // Check loading
      await expect(page.getByTestId("users-roles-save-button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      rolesRequest.release();
      await nthRequest(rolesRequest);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-roles-save-button")).toBeDisabled();

      // Reload roles without errors
      const reloaded = await mockMethod(page, "GET", "**/api/v1/roles*", {
        json: roles,
      });
      await page.getByTestId("roles-reload-button").click();
      await nthRequest(reloaded);

      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-roles-save-button")).toBeEnabled();
      await expect(page.getByTestId("roles-reload-button")).toHaveCount(0);

      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expect(page.locator(".multiselect__option")).toHaveCount(5);
    });

    test("500 error when switching pages", async ({ page }) => {
      await page.goto("/admin/users/2/edit#tab=security");
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      const roles = await mockMethod(page, "GET", "**/api/v1/roles*", {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("next-page-button").click();
      await nthRequest(roles);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-roles-save-button")).toBeDisabled();
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/roles*", { status: 401 });

      await page.goto("/admin/users/2/edit#tab=security");

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });

    test("401 error when switching pages redirects to login", async ({
      page,
    }) => {
      await page.goto("/admin/users/2/edit#tab=security");
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      await mockMethod(page, "GET", "**/api/v1/roles*", { status: 401 });
      await page.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });
});
