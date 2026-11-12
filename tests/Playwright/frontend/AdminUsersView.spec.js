import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/adminUsersOther.js";
import {
  expectLoginRedirect,
  testVisitWithoutCurrentUser,
} from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin users view", () => {
  test.beforeEach(async ({ currentUser, config }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.create",
      "roles.viewAny",
    ];
    config.data.auth.local = true;
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/users/");
  });

  test("visit with user without permission to view users", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.create",
      "roles.viewAny",
    ];

    await page.goto("/admin/users/2");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/users\/2/);
  });

  test.describe("view user", () => {
    test("loading state hides buttons and tabs", async ({ page, user }) => {
      const userRequest = await mockMethod(page, "GET", "**/api/v1/users/2", {
        hold: true,
        json: user,
      });

      await page.goto("/admin/users/2");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();

      for (const id of [
        "users-cancel-edit-button",
        "users-edit-button",
        "users-reset-password-button",
        "users-delete-button",
        "user-tab-profile-save-button",
        "base-tab-button",
        "email-tab-button",
        "security-tab-button",
        "others-tab-button",
      ]) {
        await expect(page.getByTestId(id)).toHaveCount(0);
      }

      userRequest.release();
      await expect(page.getByTestId("base-tab-button")).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("without update permission no action buttons are shown", async ({
      page,
    }) => {
      await page.goto("/admin/users/2");

      for (const id of ["base", "email", "security", "others"]) {
        await expect(page.getByTestId(`${id}-tab-button`)).toBeVisible();
      }
      await expect(page.getByTestId("overlay")).toBeHidden();

      for (const id of [
        "users-cancel-edit-button",
        "users-edit-button",
        "users-reset-password-button",
        "users-delete-button",
        "user-tab-profile-save-button",
      ]) {
        await expect(page.getByTestId(id)).toHaveCount(0);
      }
    });

    test("breadcrumbs", async ({ page }) => {
      await page.goto("/admin/users/2");

      const breadcrumbs = page.getByTestId("admin-breadcrumb");
      await expect(breadcrumbs).toBeVisible();
      await expect(breadcrumbs).toContainText("admin.breadcrumbs.users.index");
      await expect(breadcrumbs).toContainText(
        'admin.breadcrumbs.users.view_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("base tab shows disabled user data", async ({ page }) => {
      await page.goto("/admin/users/2");

      const firstname = page.getByTestId("firstname-field");
      await expect(firstname).toBeVisible();
      await expect(firstname).toContainText("app.firstname");
      await expect(firstname.locator("#firstname")).toHaveValue("Laura");
      await expect(firstname.locator("#firstname")).toBeDisabled();

      const lastname = page.getByTestId("lastname-field");
      await expect(lastname).toBeVisible();
      await expect(lastname).toContainText("app.lastname");
      await expect(lastname.locator("#lastname")).toHaveValue("Rivera");
      await expect(lastname.locator("#lastname")).toBeDisabled();

      const authenticator = page.getByTestId("authenticator-field");
      await expect(authenticator).toBeVisible();
      await expect(authenticator).toContainText(
        "admin.users.authenticator.title",
      );
      await expect(authenticator.locator("#authenticator")).toHaveValue(
        "admin.users.authenticator.local",
      );
      await expect(authenticator.locator("#authenticator")).toBeDisabled();

      const locale = page.getByTestId("locale-field");
      await expect(locale).toBeVisible();
      await expect(locale).toContainText("admin.users.user_locale");
      await expect(
        locale.getByTestId("locale-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      const timezone = page.getByTestId("timezone-field");
      await expect(timezone).toBeVisible();
      await expect(timezone).toContainText("admin.users.timezone");
      await expect(
        timezone.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
    });

    test("base tab hides profile image buttons and save button", async ({
      page,
    }) => {
      await page.goto("/admin/users/2");

      const image = page.getByTestId("profile-image-field");
      await expect(image).toBeVisible();
      await expect(image).toContainText("admin.users.image.title");
      for (const id of [
        "reset-file-upload-button",
        "delete-image-button",
        "undo-delete-button",
        "upload-file-input",
      ]) {
        await expect(image.getByTestId(id)).toHaveCount(0);
      }

      await expect(
        page.getByTestId("user-tab-profile-save-button"),
      ).toHaveCount(0);
    });

    test("email tab shows disabled email", async ({ page }) => {
      await page.goto("/admin/users/2");
      await page.getByTestId("email-tab-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=email/);

      await expect(
        page.getByTestId("email-tab-current-password-field"),
      ).toHaveCount(0);

      const email = page.getByTestId("email-field");
      await expect(email).toBeVisible();
      await expect(email).toContainText("app.email");
      await expect(email.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await expect(email.locator("#email")).toBeDisabled();

      await expect(page.getByTestId("user-tab-email-save-button")).toHaveCount(
        0,
      );
    });

    test("security tab shows disabled roles and no password fields", async ({
      page,
    }) => {
      await page.goto("/admin/users/2");
      await page.getByTestId("security-tab-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=security/);

      const roles = page.getByTestId("roles-field");
      await expect(roles).toBeVisible();
      await expect(roles).toContainText("app.roles");

      const dropdown = roles.getByTestId("role-dropdown");
      await expect(dropdown).toHaveClass(/multiselect--disabled/);
      const chips = dropdown.getByTestId("role-chip");
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Students");
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(chips.getByTestId("remove-role-button")).toHaveCount(0);

      for (const id of [
        "users-roles-save-button",
        "security-tab-current-password-field",
        "new-password-field",
        "new-password-confirmation-field",
        "change-password-save-button",
        "session-panel",
      ]) {
        await expect(page.getByTestId(id)).toHaveCount(0);
      }
    });

    test("others tab shows disabled audio check setting", async ({ page }) => {
      await page.goto("/admin/users/2");
      await page.getByTestId("others-tab-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=others/);

      const field = page.getByTestId("bbb-skip-check-audio-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.users.skip_check_audio");
      await expect(field.locator("#bbb_skip_check_audio")).not.toBeChecked();
      await expect(field.locator("#bbb_skip_check_audio")).toBeDisabled();

      await expect(page.getByTestId("user-tab-others-save-button")).toHaveCount(
        0,
      );
    });
  });

  test.describe("ldap user", () => {
    test.beforeEach(async ({ page, user }) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "lwr";

      await page.goto("/admin/users/2");
      await expect(page.locator("#firstname")).toBeVisible();
    });

    test("base tab shows disabled data with external id", async ({ page }) => {
      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await expect(page.locator("#firstname")).toBeDisabled();
      await expect(page.locator("#lastname")).toHaveValue("Rivera");
      await expect(page.locator("#lastname")).toBeDisabled();
      await expect(page.locator("#authenticator")).toHaveValue(
        "admin.users.authenticator.ldap",
      );
      await expect(page.locator("#authenticator")).toBeDisabled();

      const externalId = page.getByTestId("external-user-id-field");
      await expect(externalId).toContainText("auth.external_user_id");
      await expect(externalId.locator("#external-user-id")).toHaveValue("lwr");
      await expect(externalId.locator("#external-user-id")).toBeDisabled();

      for (const id of [
        "reset-file-upload-button",
        "delete-image-button",
        "undo-delete-button",
        "upload-file-input",
        "user-tab-profile-save-button",
      ]) {
        await expect(page.getByTestId(id)).toHaveCount(0);
      }

      await expect(
        page.getByTestId("locale-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
    });

    test("email tab is disabled", async ({ page }) => {
      await page.getByTestId("email-tab-button").click();

      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await expect(page.locator("#email")).toBeDisabled();
    });

    test("security tab shows disabled roles", async ({ page }) => {
      await page.getByTestId("security-tab-button").click();

      const dropdown = page.getByTestId("role-dropdown");
      await expect(dropdown).toContainText("Students");
      await expect(dropdown).toContainText("Staff");
      await expect(dropdown).toHaveClass(/multiselect--disabled/);
    });

    test("others tab is disabled", async ({ page }) => {
      await page.getByTestId("others-tab-button").click();

      await expect(page.locator("#bbb_skip_check_audio")).not.toBeChecked();
      await expect(page.locator("#bbb_skip_check_audio")).toBeDisabled();
    });
  });

  test.describe("button visibility", () => {
    test("with update permission", async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "roles.viewAny",
      ];

      await page.goto("/admin/users/2");

      const editButton = page.getByTestId("users-edit-button");
      await expect(editButton).toBeVisible();
      await expect(editButton).toBeEnabled();
      await expect(editButton).toContainText("app.edit");
      await expect(editButton).toHaveAttribute(
        "href",
        "/admin/users/2/edit#tab=base",
      );
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("users-cancel-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("users-delete-button")).toHaveCount(0);
    });

    test("with delete permission", async ({ page, currentUser }) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "roles.viewAny",
      ];

      await page.goto("/admin/users/2");

      const editButton = page.getByTestId("users-edit-button");
      await expect(editButton).toBeVisible();
      await expect(editButton).toBeEnabled();
      await expect(editButton).toContainText("app.edit");
      await expect(editButton).toHaveAttribute(
        "href",
        "/admin/users/2/edit#tab=base",
      );
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("users-delete-button")).toBeVisible();
      await expect(page.getByTestId("users-delete-button")).toBeEnabled();
      await expect(page.getByTestId("users-cancel-edit-button")).toHaveCount(0);
    });

    test.describe("viewing a superuser", () => {
      test.beforeEach(async ({ currentUser, user }) => {
        currentUser.data.permissions = [
          "admin.view",
          "users.viewAny",
          "users.view",
          "users.create",
          "users.update",
          "users.delete",
          "roles.viewAny",
        ];

        user.data.superuser = true;
        user.data.roles.push({
          id: 1,
          name: "Superuser",
          automatic: true,
          superuser: true,
        });
      });

      test("as superuser all buttons are shown", async ({ page }) => {
        await page.goto("/admin/users/2");

        const editButton = page.getByTestId("users-edit-button");
        await expect(editButton).toBeVisible();
        await expect(editButton).toBeEnabled();
        await expect(editButton).toContainText("app.edit");
        await expect(editButton).toHaveAttribute(
          "href",
          "/admin/users/2/edit#tab=base",
        );
        await expect(
          page.getByTestId("users-reset-password-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("users-reset-password-button"),
        ).toBeEnabled();
        await expect(page.getByTestId("users-delete-button")).toBeVisible();
        await expect(page.getByTestId("users-delete-button")).toBeEnabled();
        await expect(page.getByTestId("users-cancel-edit-button")).toHaveCount(
          0,
        );
      });

      test("as non superuser no action buttons are shown", async ({
        page,
        currentUser,
      }) => {
        currentUser.data.superuser = false;

        await page.goto("/admin/users/2");

        // Wait for the user to be rendered before checking for absence
        await expect(page.getByTestId("base-tab-button")).toBeVisible();
        await expect(page.getByTestId("overlay")).toBeHidden();

        for (const id of [
          "users-cancel-edit-button",
          "users-edit-button",
          "users-reset-password-button",
          "users-delete-button",
        ]) {
          await expect(page.getByTestId(id)).toHaveCount(0);
        }
      });
    });

    test("non superuser sees all buttons for a normal user", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "roles.viewAny",
      ];

      await page.goto("/admin/users/2");

      const editButton = page.getByTestId("users-edit-button");
      await expect(editButton).toBeVisible();
      await expect(editButton).toBeEnabled();
      await expect(editButton).toContainText("app.edit");
      await expect(editButton).toHaveAttribute(
        "href",
        "/admin/users/2/edit#tab=base",
      );
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("users-delete-button")).toBeVisible();
      await expect(page.getByTestId("users-delete-button")).toBeEnabled();
      await expect(page.getByTestId("users-cancel-edit-button")).toHaveCount(0);
    });
  });

  test("visit with invalid tab hash", async ({ page, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.create",
      "users.update",
      "roles.viewAny",
    ];

    await page.goto("/admin/users/2#tab=invalid");

    // Check that base tab is shown
    await expect(page.locator("#firstname")).toBeVisible();

    // Check that edit button contains base tab as hash parameter
    await expect(page.getByTestId("users-edit-button")).toHaveAttribute(
      "href",
      "/admin/users/2/edit#tab=base",
    );

    // Check that invalid tab is cleared
    await expect(page).not.toHaveURL(/#tab=invalid/);
  });

  test.describe("errors", () => {
    test("server error shows overlay with retry that loads the user", async ({
      page,
      user,
    }) => {
      await mockMethod(page, "GET", "**/api/v1/users/2", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/users/2");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      await mockMethod(page, "GET", "**/api/v1/users/2", {
        json: user,
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toBeHidden();
    });

    test("404 error redirects to users index", async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/users/2", {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });

      await page.goto("/admin/users/2");

      await expect(page).toHaveURL(/\/admin\/users$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/users/2", { status: 401 });

      await page.goto("/admin/users/2");

      await expectLoginRedirect(page, "/admin/users/2");
    });

    test.describe("timezones", () => {
      test("server error disables the dropdown and allows reload", async ({
        page,
        timezones,
      }) => {
        const timezonesRequest = await mockMethod(
          page,
          "GET",
          "**/api/v1/getTimezones",
          {
            hold: true,
            status: 500,
            json: { message: "Test" },
          },
        );

        await page.goto("/admin/users/2");

        // Check loading
        const dropdown = page.getByTestId("timezone-dropdown");
        await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
          "aria-disabled",
          "true",
        );

        timezonesRequest.release();
        await nthRequest(timezonesRequest);

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        await expect(dropdown).toHaveText("admin.users.timezone");
        await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
          "aria-disabled",
          "true",
        );

        // Reload timezones without error
        const reload = await mockMethod(page, "GET", "**/api/v1/getTimezones", {
          json: timezones,
        });
        await page.getByTestId("timezone-reload-button").click();
        await nthRequest(reload);

        await expect(dropdown).toHaveText("UTC");
        await expect(dropdown.locator(".p-select-label")).toHaveAttribute(
          "aria-disabled",
          "true",
        );
        await expect(page.getByTestId("timezone-reload-button")).toHaveCount(0);
      });

      test("401 error redirects to login", async ({ page }) => {
        await mockMethod(page, "GET", "**/api/v1/getTimezones", {
          status: 401,
        });

        await page.goto("/admin/users/2");

        await expectLoginRedirect(page, "/admin/users/2");
      });
    });
  });
});
