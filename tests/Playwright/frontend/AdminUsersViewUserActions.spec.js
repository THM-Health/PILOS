import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/adminUsersOther.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockMethod,
  nthRequest,
  expectImageToMatchScreenshot,
} from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Admin users view user actions", () => {
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

  test.describe("delete user", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2");
      await expect(page.getByTestId("users-delete-button")).toBeVisible();
      await expect(page.getByTestId("users-delete-dialog")).toHaveCount(0);
      await page.getByTestId("users-delete-button").click();
    });

    test("dialog shows the user", async ({ page }) => {
      const dialog = page.getByTestId("users-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.delete.title");
      await expect(dialog).toContainText(
        'admin.users.delete.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("loading state, redirect to the index and removed user", async ({
      page,
      users,
    }) => {
      const dialog = page.getByTestId("users-delete-dialog");
      await expect(dialog).toBeVisible();

      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/users/2",
        {
          status: 204,
          hold: true,
        },
      );
      users.data = users.data.slice(0, 2);
      Object.assign(users.meta, { to: 2, total: 2, total_no_filter: 2 });

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(deleteRequest);

      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();

      deleteRequest.release();

      await expect(page).toHaveURL(/\/admin\/users(\?.*)?$/);
      await expect(page).not.toHaveURL(/\/admin\/users\/2/);
      await expect(page.getByTestId("user-item")).toHaveCount(2);
      await expect(page.getByTestId("users-delete-dialog")).toHaveCount(0);
    });

    test("server error keeps the dialog open", async ({ page }) => {
      await mockMethod(page, "DELETE", "**/api/v1/users/2", {
        status: 500,
        json: { message: "Test" },
      });

      await expect(page.getByTestId("users-delete-dialog")).toBeVisible();
      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("users-delete-dialog")).toBeVisible();
    });

    test("user not found redirects to the index", async ({ page }) => {
      await mockMethod(page, "DELETE", "**/api/v1/users/2", {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });

      await page.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL(/\/admin\/users(\?.*)?$/);
      await expect(page).not.toHaveURL(/\/admin\/users\/2/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("unauthenticated redirects to the login", async ({ page }) => {
      await mockMethod(page, "DELETE", "**/api/v1/users/2", { status: 401 });

      await expect(page.getByTestId("users-delete-dialog")).toBeVisible();
      await page.getByTestId("dialog-continue-button").click();

      await expectLoginRedirect(page, "/admin/users/2");
    });
  });

  test.describe("reset password", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2");
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(page.getByTestId("users-reset-password-dialog")).toHaveCount(
        0,
      );
      await page.getByTestId("users-reset-password-button").click();
    });

    test("dialog shows the user", async ({ page }) => {
      const dialog = page.getByTestId("users-reset-password-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.reset_password.title");
      await expect(dialog).toContainText(
        'admin.users.reset_password.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("loading state, success message and closed dialog", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("users-reset-password-dialog"),
      ).toBeVisible();

      const resetRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/users/2/resetPassword",
        {
          status: 204,
          hold: true,
        },
      );

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();
      await nthRequest(resetRequest);

      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();

      resetRequest.release();

      await expectToastAndClose(
        page,
        'admin.users.password_reset_success_{"mail":"LauraWRivera@domain.tld"}',
      );
      await expect(page.getByTestId("users-reset-password-dialog")).toHaveCount(
        0,
      );
    });

    test("server error keeps the dialog open", async ({ page }) => {
      await mockMethod(page, "POST", "**/api/v1/users/2/resetPassword", {
        status: 500,
        json: { message: "Test" },
      });

      await expect(
        page.getByTestId("users-reset-password-dialog"),
      ).toBeVisible();
      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(
        page.getByTestId("users-reset-password-dialog"),
      ).toBeVisible();
    });

    test("user not found redirects to the index", async ({ page }) => {
      await mockMethod(page, "POST", "**/api/v1/users/2/resetPassword", {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });

      await page.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL(/\/admin\/users(\?.*)?$/);
      await expect(page).not.toHaveURL(/\/admin\/users\/2/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("unauthenticated redirects to the login", async ({ page }) => {
      await mockMethod(page, "POST", "**/api/v1/users/2/resetPassword", {
        status: 401,
      });

      await expect(
        page.getByTestId("users-reset-password-dialog"),
      ).toBeVisible();
      await page.getByTestId("dialog-continue-button").click();

      await expectLoginRedirect(page, "/admin/users");
    });
  });

  test.describe("switch between edit and view", () => {
    test("base tab", async ({ page }) => {
      await page.goto("/admin/users/2/edit");

      // Change all fields
      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await page.locator("#firstname").fill("Juan");
      await expect(page.locator("#lastname")).toHaveValue("Rivera");
      await page.locator("#lastname").fill("Walter");

      await expect(page.getByTestId("upload-file-input")).toBeHidden();
      await page
        .getByTestId("upload-file-input")
        .setInputFiles("tests/Playwright/fixtures/files/profileImage.jpg");

      const cropDialog = page.getByTestId("crop-image-dialog");
      await expect(cropDialog).toBeVisible();
      await expect(cropDialog).toContainText("admin.users.image.crop");
      // The cropper is ready when the save button is enabled
      await expect(page.getByTestId("dialog-save-button")).toBeEnabled();

      await expect(page.getByTestId("dialog-save-button")).toHaveText(
        "admin.users.image.save",
      );
      await page.getByTestId("dialog-save-button").click();
      await expect(cropDialog).toHaveCount(0);

      const imageField = page.getByTestId("profile-image-field");
      await expect(
        imageField.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      const preview = imageField.getByTestId("profile-image-preview");
      await expect(preview).toBeVisible();
      await expectImageToMatchScreenshot(
        preview.locator("img"),
        "profile-image-preview.png",
      );
      await expect(imageField.getByTestId("upload-file-button")).toBeVisible();
      await expect(imageField.getByTestId("delete-image-button")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
      await expect(
        imageField.getByTestId("reset-file-upload-button"),
      ).toBeVisible();

      await expect(page.getByTestId("locale-dropdown")).toHaveText("English");
      await page.getByTestId("locale-dropdown").click();
      await page.getByTestId("locale-dropdown-option").nth(0).click();
      await expect(page.getByTestId("locale-dropdown-items")).toHaveCount(0);
      await expect(page.getByTestId("locale-dropdown")).toHaveText("Deutsch");

      await expect(page.getByTestId("timezone-dropdown")).toHaveText("UTC");
      await page.getByTestId("timezone-dropdown").click();
      await page.getByTestId("timezone-dropdown-option").nth(2).click();
      await expect(page.getByTestId("timezone-dropdown-items")).toHaveCount(0);
      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "Europe/Berlin",
      );

      const saveButton = page.getByTestId("user-tab-profile-save-button");
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();

      // Switch to view, changes are discarded
      await page.getByTestId("users-cancel-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=base/);
      await expect(page).not.toHaveURL(/\/edit/);

      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await expect(page.locator("#firstname")).toBeDisabled();
      await expect(page.locator("#lastname")).toHaveValue("Rivera");
      await expect(page.locator("#lastname")).toBeDisabled();
      await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toContainText("LR");
      await expect(page.getByTestId("locale-dropdown")).toHaveText("English");
      await expect(
        page.getByTestId("locale-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("timezone-dropdown")).toHaveText("UTC");
      await expect(
        page.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(saveButton).toHaveCount(0);

      // Switch to edit again, original values are shown
      await page.getByTestId("users-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=base/);

      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await expect(page.locator("#firstname")).toBeEnabled();
      await expect(page.locator("#lastname")).toHaveValue("Rivera");
      await expect(page.locator("#lastname")).toBeEnabled();
      await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toContainText("LR");
      await expect(page.getByTestId("locale-dropdown")).toHaveText("English");
      await expect(
        page.getByTestId("locale-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("timezone-dropdown")).toHaveText("UTC");
      await expect(
        page.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).not.toHaveAttribute("aria-disabled", "true");
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    test("email tab", async ({ page }) => {
      await page.goto("/admin/users/2/edit");
      await page.getByTestId("email-tab-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=email/);

      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await page.locator("#email").pressSequentially("e");

      const saveButton = page.getByTestId("user-tab-email-save-button");
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();

      // Switch to view, changes are discarded
      await page.getByTestId("users-cancel-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=email/);
      await expect(page).not.toHaveURL(/\/edit/);

      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await expect(page.locator("#email")).toBeDisabled();
      await expect(saveButton).toHaveCount(0);

      // Switch back to edit
      await page.getByTestId("users-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=email/);

      await expect(page.locator("#email")).toHaveValue(
        "LauraWRivera@domain.tld",
      );
      await expect(page.locator("#email")).toBeEnabled();
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    test("security tab", async ({ page }) => {
      await page.goto("/admin/users/2/edit");
      await page.getByTestId("security-tab-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=security/);

      const roleDropdown = page.getByTestId("role-dropdown");
      const chips = roleDropdown.getByTestId("role-chip");

      await expect(roleDropdown).not.toHaveClass(/multiselect--disabled/);
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Students");
      await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(
        0,
      );
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(
        chips.nth(1).getByTestId("remove-role-button"),
      ).toBeVisible();

      // Add a role
      await roleDropdown.click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await content.locator(".multiselect__option").nth(0).click();

      await expect(content).toBeVisible();
      await expect(chips).toHaveCount(3);
      await expect(chips.nth(0)).toContainText("Students");
      await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(
        0,
      );
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(
        chips.nth(1).getByTestId("remove-role-button"),
      ).toBeVisible();
      await expect(chips.nth(2)).toContainText("Superuser");
      await expect(
        chips.nth(2).getByTestId("remove-role-button"),
      ).toBeVisible();

      // Close dropdown
      await page.locator(".multiselect__select").click();
      await expect(content).toHaveCount(0);

      await page.locator("#new_password").fill("secretPassword123#");
      await page
        .locator("#new_password_confirmation")
        .fill("secretPassword123#");

      const rolesSaveButton = page.getByTestId("users-roles-save-button");
      const passwordSaveButton = page.getByTestId(
        "change-password-save-button",
      );
      await expect(rolesSaveButton).toBeVisible();
      await expect(rolesSaveButton).toBeEnabled();
      await expect(passwordSaveButton).toBeVisible();
      await expect(passwordSaveButton).toBeEnabled();

      // Switch to view, changes are discarded
      await page.getByTestId("users-cancel-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=security/);
      await expect(page).not.toHaveURL(/\/edit/);

      await expect(roleDropdown).toHaveClass(/multiselect--disabled/);
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Students");
      await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(
        0,
      );
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(chips.nth(1).getByTestId("remove-role-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("new-password-field")).toHaveCount(0);
      await expect(
        page.getByTestId("new-password-confirmation-field"),
      ).toHaveCount(0);
      await expect(rolesSaveButton).toHaveCount(0);
      await expect(passwordSaveButton).toHaveCount(0);

      // Switch back to edit
      await page.getByTestId("users-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=security/);

      await expect(roleDropdown).not.toHaveClass(/multiselect--disabled/);
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Students");
      await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(
        0,
      );
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(
        chips.nth(1).getByTestId("remove-role-button"),
      ).toBeVisible();
      await expect(page.locator("#new_password")).toHaveValue("");
      await expect(page.locator("#new_password_confirmation")).toHaveValue("");
      await expect(rolesSaveButton).toBeVisible();
      await expect(rolesSaveButton).toBeEnabled();
      await expect(passwordSaveButton).toBeVisible();
      await expect(passwordSaveButton).toBeEnabled();
    });

    test("others tab", async ({ page }) => {
      await page.goto("/admin/users/2/edit");
      await page.getByTestId("others-tab-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=others/);

      await page.locator("#bbb_skip_check_audio").click();

      const saveButton = page.getByTestId("user-tab-others-save-button");
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();

      // Switch to view, changes are discarded
      await page.getByTestId("users-cancel-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=others/);
      await expect(page).not.toHaveURL(/\/edit/);

      await expect(page.locator("#bbb_skip_check_audio")).not.toBeChecked();
      await expect(page.locator("#bbb_skip_check_audio")).toBeDisabled();
      await expect(saveButton).toHaveCount(0);

      // Switch back to edit
      await page.getByTestId("users-edit-button").click();
      await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=others/);

      await expect(page.locator("#bbb_skip_check_audio")).not.toBeChecked();
      await expect(page.locator("#bbb_skip_check_audio")).toBeEnabled();
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });
  });
});
