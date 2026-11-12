import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptAdminUsersViewRequests,
  interceptAdminUsersIndexRequests,
} from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  mockMethod,
  nthRequest,
  parseFormData,
  _arrayBufferToBase64,
} from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));
const readBase64 = (name) =>
  readFileSync(`tests/Playwright/fixtures/files/${name}`).toString("base64");

const USER_URL = "**/api/v1/users/2";
const TIMEZONES_URL = "**/api/v1/getTimezones";
const IMAGE = "tests/Playwright/fixtures/files/profileImage.jpg";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const editBreadcrumb =
  'admin.breadcrumbs.users.edit_{"firstname":"Laura","lastname":"Rivera"}';
const viewBreadcrumbJuanWalter =
  'admin.breadcrumbs.users.view_{"firstname":"Juan","lastname":"Walter"}';

test.use({ authenticated: true });

test.describe("Admin users edit base", () => {
  test.beforeEach(async ({ page, currentUser, config }) => {
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
    await interceptAdminUsersViewRequests(page);
  });

  test("view base data", async ({ page }) => {
    await page.goto("/admin/users/2/edit");

    await expect(page.getByTestId("base-tab-button")).toContainText(
      "admin.users.base_data",
    );
    await expect(
      page.getByRole("tabpanel", { name: "admin.users.base_data" }),
    ).toBeVisible();
    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.users.index",
      editBreadcrumb,
    );

    const firstname = page.getByTestId("firstname-field");
    await expect(firstname).toBeVisible();
    await expect(firstname).toContainText("app.firstname");
    await expect(firstname.locator("#firstname")).toHaveValue("Laura");
    await expect(firstname.locator("#firstname")).toBeEnabled();

    const lastname = page.getByTestId("lastname-field");
    await expect(lastname).toBeVisible();
    await expect(lastname).toContainText("app.lastname");
    await expect(lastname.locator("#lastname")).toHaveValue("Rivera");
    await expect(lastname.locator("#lastname")).toBeEnabled();

    const authenticator = page.getByTestId("authenticator-field");
    await expect(authenticator).toBeVisible();
    await expect(authenticator).toContainText(
      "admin.users.authenticator.title",
    );
    await expect(authenticator.locator("#authenticator")).toHaveValue(
      "admin.users.authenticator.local",
    );
    await expect(authenticator.locator("#authenticator")).toBeDisabled();
  });

  test("view profile image", async ({ page }) => {
    await page.goto("/admin/users/2/edit");

    const imageField = page.getByTestId("profile-image-field");
    await expect(imageField).toBeVisible();
    await expect(imageField).toContainText("admin.users.image.title");
    await expect(
      imageField.getByTestId("default-profile-image-preview"),
    ).toContainText("LR");
    await expect(imageField.getByTestId("profile-image-preview")).toHaveCount(
      0,
    );
    await expect(imageField.getByTestId("upload-file-button")).toHaveText(
      "admin.users.image.upload",
    );
    await expect(
      imageField.getByTestId("reset-file-upload-button"),
    ).toHaveCount(0);
    await expect(imageField.getByTestId("delete-image-button")).toHaveCount(0);
    await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
  });

  test("typing a name does not change the breadcrumbs or the preview", async ({
    page,
  }) => {
    await page.goto("/admin/users/2/edit");
    await expectAdminBreadcrumbs(page, editBreadcrumb);

    await page.locator("#firstname").fill("Juan");
    await page.locator("#lastname").fill("Walter");

    await expectAdminBreadcrumbs(
      page,
      "admin.breadcrumbs.users.index",
      editBreadcrumb,
    );
    await expect(
      page
        .getByTestId("profile-image-field")
        .getByTestId("default-profile-image-preview"),
    ).toContainText("JW");
  });

  test("upload button opens the file chooser", async ({ page }) => {
    await page.goto("/admin/users/2/edit");

    const fileChooser = page.waitForEvent("filechooser");
    await page.getByTestId("upload-file-button").click();
    await fileChooser;

    await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);
    await expect(page.getByTestId("upload-file-input")).toBeHidden();
  });

  test.describe("upload image", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2/edit");
      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await page.getByTestId("upload-file-input").setInputFiles(IMAGE);
    });

    test("crop dialog shows the selected image", async ({ page }) => {
      const dialog = page.getByTestId("crop-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.image.crop");
      await expect(page.getByTestId("dialog-save-button")).toHaveText(
        "admin.users.image.save",
      );

      await expect
        .poll(() => dialog.locator("img").first().getAttribute("src"))
        .toContain(readBase64("profileImage.jpg"));
    });

    test("save crop shows the preview", async ({ page }) => {
      await expect(page.getByTestId("crop-image-dialog")).toBeVisible();
      await page.getByTestId("dialog-save-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);

      const imageField = page.getByTestId("profile-image-field");
      await expect(
        imageField.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      const preview = imageField.getByTestId("profile-image-preview");
      await expect(preview).toBeVisible();
      await expect
        .poll(() => preview.locator("img").getAttribute("src"))
        .toEqual(
          "data:image/jpeg;base64," + readBase64("profileImagePreview.jpg"),
        );

      await expect(imageField.getByTestId("upload-file-button")).toBeVisible();
      await expect(imageField.getByTestId("delete-image-button")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
      await expect(
        imageField.getByTestId("reset-file-upload-button"),
      ).toBeVisible();
    });

    test("reset the upload and upload again", async ({ page }) => {
      await page.locator("#firstname").fill("Juan");
      await page.locator("#lastname").fill("Walter");
      await page.getByTestId("dialog-save-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);

      const imageField = page.getByTestId("profile-image-field");
      const reset = imageField.getByTestId("reset-file-upload-button");
      await expect(reset).toHaveText("app.cancel");
      await reset.click();

      await expect(
        imageField.getByTestId("default-profile-image-preview"),
      ).toContainText("JW");
      await expect(imageField.getByTestId("profile-image-preview")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("upload-file-button")).toBeVisible();
      await expect(imageField.getByTestId("delete-image-button")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
      await expect(reset).toHaveCount(0);

      await imageField.getByTestId("upload-file-input").setInputFiles(IMAGE);

      const dialog = page.getByTestId("crop-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.image.crop");
      await expect
        .poll(() => dialog.locator("img").first().getAttribute("src"))
        .toContain(readBase64("profileImage.jpg"));

      await page.getByTestId("dialog-save-button").click();
      await expect(dialog).toHaveCount(0);

      await expect(
        imageField.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          imageField
            .getByTestId("profile-image-preview")
            .locator("img")
            .getAttribute("src"),
        )
        .toEqual(
          "data:image/jpeg;base64," + readBase64("profileImagePreview.jpg"),
        );
      await expect(imageField.getByTestId("upload-file-button")).toBeVisible();
      await expect(imageField.getByTestId("delete-image-button")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
      await expect(reset).toBeVisible();
    });
  });

  test("change locale", async ({ page }) => {
    await page.goto("/admin/users/2/edit");

    await expect(page.getByTestId("locale-dropdown-items")).toHaveCount(0);
    const field = page.getByTestId("locale-field");
    await expect(field).toBeVisible();
    await expect(field).toContainText("admin.users.user_locale");
    await expect(field.getByTestId("locale-dropdown")).toHaveText("English");
    await field.getByTestId("locale-dropdown").click();

    const items = page.getByTestId("locale-dropdown-items");
    await expect(items).toBeVisible();
    const options = items.getByTestId("locale-dropdown-option");
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText("Deutsch");
    await expect(options.nth(1)).toHaveText("English");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(options.nth(2)).toHaveText("Français");

    await options.nth(0).click();

    await expect(items).toHaveCount(0);
    await expect(page.getByTestId("locale-dropdown")).toHaveText("Deutsch");
  });

  test("change timezone", async ({ page }) => {
    await page.goto("/admin/users/2/edit");

    await expect(page.getByTestId("timezone-dropdown-items")).toHaveCount(0);
    const field = page.getByTestId("timezone-field");
    await expect(field).toBeVisible();
    await expect(field).toContainText("admin.users.timezone");
    await expect(field.getByTestId("timezone-dropdown")).toHaveText("UTC");
    await field.getByTestId("timezone-dropdown").click();

    const items = page.getByTestId("timezone-dropdown-items");
    await expect(items).toBeVisible();
    const options = items.getByTestId("timezone-dropdown-option");
    await expect(options).toHaveText([
      "America/New_York",
      "Australia/Sydney",
      "Europe/Berlin",
      "UTC",
    ]);
    await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");

    await options.nth(2).click();

    await expect(items).toHaveCount(0);
    await expect(page.getByTestId("timezone-dropdown")).toHaveText(
      "Europe/Berlin",
    );
  });

  test.describe("save changes", () => {
    let savedUser;

    test.beforeEach(async ({ page, baseURL }) => {
      savedUser = readFixture("userDataUser.json");
      savedUser.data.firstname = "Juan";
      savedUser.data.lastname = "Walter";
      savedUser.data.user_locale = "de";
      savedUser.data.timezone = "Europe/Berlin";
      savedUser.data.image = baseURL + "/test.jpg";
      savedUser.data.updated_at = "2024-09-13T14:22:26.000000Z";

      await page.goto("/admin/users/2/edit");
      await expect(page.locator("#firstname")).toHaveValue("Laura");

      await page.locator("#firstname").fill("Juan");
      await page.locator("#lastname").fill("Walter");

      await page.getByTestId("locale-dropdown").click();
      await page.getByTestId("locale-dropdown-option").nth(0).click();
      await page.getByTestId("timezone-dropdown").click();
      await page.getByTestId("timezone-dropdown-option").nth(2).click();

      await page.getByTestId("upload-file-input").setInputFiles(IMAGE);
      await page.getByTestId("dialog-save-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);
    });

    test("loading state while saving", async ({ page }) => {
      const save = await mockMethod(page, "POST", USER_URL, {
        json: savedUser,
        hold: true,
      });
      await mockMethod(page, "GET", USER_URL, { json: savedUser });

      const saveButton = page.getByTestId("user-tab-profile-save-button");
      await expect(saveButton).toHaveText("app.save");
      await saveButton.click();
      await nthRequest(save);

      for (const tab of ["base", "email", "security", "others"]) {
        await expect(page.getByTestId(`${tab}-tab-button`)).toBeDisabled();
      }

      await expect(page.getByTestId("users-cancel-edit-button")).toBeDisabled();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("users-delete-button")).toBeDisabled();

      await expect(page.locator("#firstname")).toBeDisabled();
      await expect(page.locator("#lastname")).toBeDisabled();
      await expect(page.locator("#authenticator")).toBeDisabled();

      await expect(page.getByTestId("upload-file-button")).toBeDisabled();
      await expect(page.getByTestId("reset-file-upload-button")).toBeDisabled();

      await expect(
        page.getByTestId("locale-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      await expect(saveButton).toBeDisabled();

      save.release();
      await expect(page).toHaveURL(/\/admin\/users\/2#tab=base/);
    });

    test("sends the changes and redirects to the view page", async ({
      page,
    }) => {
      const save = await mockMethod(page, "POST", USER_URL, {
        json: savedUser,
      });
      await mockMethod(page, "GET", USER_URL, { json: savedUser });

      await page.getByTestId("user-tab-profile-save-button").click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("user_locale")).toEqual("de");
      expect(formData.get("timezone")).toEqual("Europe/Berlin");
      expect(formData.get("firstname")).toEqual("Juan");
      expect(formData.get("lastname")).toEqual("Walter");
      expect(formData.get("_method")).toEqual("PUT");
      expect(formData.get("updated_at")).toEqual("2024-09-13T14:20:26.000000Z");

      const uploadedFile = formData.get("image");
      expect(uploadedFile.name).toEqual("image.jpg");
      expect(uploadedFile.type).toEqual("image/jpeg");
      expect(_arrayBufferToBase64(await uploadedFile.arrayBuffer())).toEqual(
        readBase64("profileImagePreview.jpg"),
      );

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=base/);
      await expect(page).not.toHaveURL(/\/edit/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        viewBreadcrumbJuanWalter,
      );
    });
  });

  test.describe("saved user", () => {
    let savedUser;

    test.beforeEach(async ({ page, baseURL }) => {
      savedUser = readFixture("userDataUser.json");
      savedUser.data.firstname = "Juan";
      savedUser.data.lastname = "Walter";
      savedUser.data.user_locale = "de";
      savedUser.data.timezone = "Europe/Berlin";
      savedUser.data.image = baseURL + "/test.jpg";
      savedUser.data.updated_at = "2024-09-13T14:22:26.000000Z";
      await mockMethod(page, "GET", USER_URL, { json: savedUser });

      await page.goto("/admin/users/2/edit");
      await expect(page.locator("#firstname")).toHaveValue("Juan");
    });

    test("edit page shows the saved changes", async ({ page, baseURL }) => {
      await expect(page.locator("#firstname")).toBeEnabled();
      await expect(page.locator("#lastname")).toHaveValue("Walter");
      await expect(page.locator("#lastname")).toBeEnabled();
      await expect(page.locator("#authenticator")).toHaveValue(
        "admin.users.authenticator.local",
      );
      await expect(page.locator("#authenticator")).toBeDisabled();

      await expect(page.getByTestId("upload-file-button")).toBeVisible();
      await expect(page.getByTestId("reset-file-upload-button")).toHaveCount(0);
      await expect(page.getByTestId("delete-image-button")).toBeVisible();
      await expect(page.getByTestId("undo-delete-button")).toHaveCount(0);

      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("profile-image-preview").locator("img"),
      ).toHaveAttribute("src", baseURL + "/test.jpg");

      for (const name of ["locale", "timezone"]) {
        const dropdown = page.getByTestId(`${name}-dropdown`);
        await expect(dropdown).toHaveText(
          name === "locale" ? "Deutsch" : "Europe/Berlin",
        );
        await expect(dropdown.locator(".p-select-label")).not.toHaveAttribute(
          "aria-disabled",
          "true",
        );
      }
    });

    test("delete and undo delete of the profile image", async ({
      page,
      baseURL,
    }) => {
      await expect(page.getByTestId("delete-image-button")).toHaveText(
        "admin.users.image.delete",
      );
      await page.getByTestId("delete-image-button").click();

      await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toContainText("JW");

      await expect(page.getByTestId("upload-file-button")).toHaveCount(0);
      await expect(page.getByTestId("reset-file-upload-button")).toHaveCount(0);
      await expect(page.getByTestId("delete-image-button")).toHaveCount(0);

      await expect(page.getByTestId("undo-delete-button")).toHaveText(
        "app.undo_delete",
      );
      await page.getByTestId("undo-delete-button").click();

      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("profile-image-preview").locator("img"),
      ).toHaveAttribute("src", baseURL + "/test.jpg");
    });

    test("save with deleted profile image", async ({ page }) => {
      await page.getByTestId("delete-image-button").click();

      const userWithoutImage = structuredClone(savedUser);
      userWithoutImage.data.image = null;
      userWithoutImage.data.updated_at = "2024-09-13T14:24:26.000000Z";
      const save = await mockMethod(page, "POST", USER_URL, {
        json: userWithoutImage,
      });
      await mockMethod(page, "GET", USER_URL, { json: userWithoutImage });

      await page.getByTestId("user-tab-profile-save-button").click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("user_locale")).toEqual("de");
      expect(formData.get("timezone")).toEqual("Europe/Berlin");
      expect(formData.get("firstname")).toEqual("Juan");
      expect(formData.get("lastname")).toEqual("Walter");
      expect(formData.get("_method")).toEqual("PUT");
      expect(formData.get("updated_at")).toEqual("2024-09-13T14:22:26.000000Z");
      expect(formData.get("image")).toEqual("");

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=base/);
      await expect(page).not.toHaveURL(/\/edit/);
    });
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2/edit");
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        editBreadcrumb,
      );
    });

    test("validation errors (422)", async ({ page }) => {
      await mockMethod(page, "POST", USER_URL, {
        status: 422,
        json: {
          message: "The firstname field is required. (and 3 more errors)",
          errors: {
            firstname: ["The firstname field is required."],
            lastname: ["The lastname field is required."],
            user_locale: ["The user locale field is required."],
            timezone: ["The timezone field is required."],
          },
        },
      });

      await page.getByTestId("user-tab-profile-save-button").click();

      await expectToastAndClose(
        page,
        "The firstname field is required. (and 3 more errors)",
      );
      await expect(page.getByTestId("firstname-field")).toContainText(
        "The firstname field is required.",
      );
      await expect(page.getByTestId("lastname-field")).toContainText(
        "The lastname field is required.",
      );
      await expect(page.getByTestId("locale-field")).toContainText(
        "The user locale field is required.",
      );
      await expect(page.getByTestId("timezone-field")).toContainText(
        "The timezone field is required.",
      );
    });

    test("server error (500) hides previous validation errors", async ({
      page,
    }) => {
      await mockMethod(page, "POST", USER_URL, {
        status: 422,
        json: {
          message: "The firstname field is required. (and 3 more errors)",
          errors: {
            firstname: ["The firstname field is required."],
            lastname: ["The lastname field is required."],
            user_locale: ["The user locale field is required."],
            timezone: ["The timezone field is required."],
          },
        },
      });
      await page.getByTestId("user-tab-profile-save-button").click();
      await expectToastAndClose(
        page,
        "The firstname field is required. (and 3 more errors)",
      );
      await expect(page.getByTestId("firstname-field")).toContainText(
        "The firstname field is required.",
      );

      await mockMethod(page, "POST", USER_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("user-tab-profile-save-button").click();

      await expectToastAndClose(page, serverErrorToast);

      await expect(page.getByTestId("firstname-field")).not.toContainText(
        "The firstname field is required.",
      );
      await expect(page.getByTestId("lastname-field")).not.toContainText(
        "The lastname field is required.",
      );
      await expect(page.getByTestId("locale-field")).not.toContainText(
        "The user locale field is required.",
      );
      await expect(page.getByTestId("timezone-field")).not.toContainText(
        "The timezone field is required.",
      );
    });

    test("server error (500)", async ({ page }) => {
      await mockMethod(page, "POST", USER_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("user-tab-profile-save-button").click();

      await expectToastAndClose(page, serverErrorToast);
      await expect(page.getByTestId("firstname-field")).toBeVisible();
    });

    test("stale model (428) shows the stale dialog and reloads", async ({
      page,
    }) => {
      const user = readFixture("userDataUser.json");
      user.data.firstname = "Juan";
      user.data.lastname = "Walter";
      user.data.user_locale = "de";
      user.data.timezone = "Europe/Berlin";

      await mockMethod(page, "POST", USER_URL, {
        status: 428,
        json: { message: "stale_model", new_model: user.data },
      });
      await mockMethod(page, "GET", USER_URL, { json: user });

      await expect(page.getByTestId("stale-user-dialog")).toHaveCount(0);
      await page.getByTestId("user-tab-profile-save-button").click();

      const dialog = page.getByTestId("stale-user-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'app.errors.stale_model_{"model":"app.model.user"}',
      );

      await page.getByTestId("stale-dialog-reload-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/2/);
      await expect(page).not.toHaveURL(/\/edit/);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        viewBreadcrumbJuanWalter,
      );
    });

    test("user not found (404) redirects to the users index", async ({
      page,
    }) => {
      await interceptAdminUsersIndexRequests(page);
      const usersRequest = page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === "/api/v1/users" &&
          request.method() === "GET",
      );
      await mockMethod(page, "POST", USER_URL, {
        status: 404,
        json: { message: "model_not_found", model: "user", ids: [2] },
      });

      await page.getByTestId("user-tab-profile-save-button").click();

      await expect(page).not.toHaveURL(/\/admin\/users\/2\/edit/);
      await expect(page).toHaveURL(/\/admin\/users/);
      await usersRequest;

      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.user"}',
        'app.flash.model_not_found.details_{"ids":"2"}',
      ]);
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      await mockMethod(page, "POST", USER_URL, { status: 401, json: {} });

      await page.getByTestId("user-tab-profile-save-button").click();

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });

  test("view as external user", async ({ page }) => {
    const user = readFixture("userDataUser.json");
    user.data.authenticator = "ldap";
    user.data.external_id = "lwr";
    await mockMethod(page, "GET", USER_URL, { json: user });

    await page.goto("/admin/users/2/edit");

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

    await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
    await expect(
      page.getByTestId("default-profile-image-preview"),
    ).toContainText("LR");

    await expect(page.getByTestId("upload-file-button")).toBeVisible();
    await expect(page.getByTestId("reset-file-upload-button")).toHaveCount(0);
    await expect(page.getByTestId("delete-image-button")).toHaveCount(0);
    await expect(page.getByTestId("undo-delete-button")).toHaveCount(0);

    for (const [name, text] of [
      ["locale", "English"],
      ["timezone", "UTC"],
    ]) {
      const dropdown = page.getByTestId(`${name}-dropdown`);
      await expect(dropdown).toHaveText(text);
      await expect(dropdown.locator(".p-select-label")).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );
    }
  });

  test.describe("load timezones error", () => {
    test("loading state and server error (500)", async ({ page }) => {
      const timezones = await mockMethod(page, "GET", TIMEZONES_URL, {
        status: 500,
        json: { message: "Test" },
        hold: true,
      });

      await page.goto("/admin/users/2/edit");
      await nthRequest(timezones);

      await expect(
        page.getByTestId("user-tab-profile-save-button"),
      ).toBeDisabled();
      const label = page
        .getByTestId("timezone-dropdown")
        .locator(".p-select-label");
      await expect(label).toHaveAttribute("aria-disabled", "true");

      timezones.release();

      await expectToastAndClose(page, serverErrorToast);

      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "admin.users.timezone",
      );
      await expect(label).toHaveAttribute("aria-disabled", "true");
    });

    test("reload timezones", async ({ page }) => {
      await mockMethod(page, "GET", TIMEZONES_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/admin/users/2/edit");
      await expectToastAndClose(page, serverErrorToast);

      await mockMethod(page, "GET", TIMEZONES_URL, {
        path: "tests/Playwright/fixtures/timezones.json",
      });
      await page.getByTestId("timezone-reload-button").click();

      const dropdown = page.getByTestId("timezone-dropdown");
      await expect(dropdown).toHaveText("UTC");
      await expect(dropdown.locator(".p-select-label")).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );

      await dropdown.click();

      const options = page.getByTestId("timezone-dropdown-option");
      await expect(options).toHaveText([
        "America/New_York",
        "Australia/Sydney",
        "Europe/Berlin",
        "UTC",
      ]);
      await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");
    });

    test("unauthenticated (401) redirects to the login page", async ({
      page,
    }) => {
      await mockMethod(page, "GET", TIMEZONES_URL, { status: 401, json: {} });

      await page.goto("/admin/users/2/edit");

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });
});
