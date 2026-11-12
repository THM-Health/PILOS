import { test } from "../support/fixtures/userProfile.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockMethod,
  nthRequest,
  parseFormData,
  expectImageToMatchScreenshot,
  IMAGE_SNAPSHOT_OPTIONS,
} from "../support/utils.js";

test.use({ authenticated: true });

test.describe("User profile base", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/locale/de", (route) =>
      route.fulfill({
        json: {
          data: {},
          meta: {
            dateTimeFormat: {
              dateShort: { year: "numeric", month: "2-digit", day: "2-digit" },
              dateLong: { year: "numeric", month: "short", day: "2-digit" },
              time: { hour: "2-digit", minute: "2-digit", hour12: false },
              datetimeShort: {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              },
              datetimeLong: {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              },
            },
          },
        },
      }),
    );
  });

  test("view base data", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.locator(".p-panel-title", { hasText: "admin.users.base_data" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("default-profile-image-preview").first(),
    ).toContainText("JD");

    const firstname = page.getByTestId("firstname-field");
    await expect(firstname).toBeVisible();
    await expect(firstname).toContainText("app.firstname");
    await expect(firstname.locator("#firstname")).toHaveValue("John");

    const lastname = page.getByTestId("lastname-field");
    await expect(lastname).toBeVisible();
    await expect(lastname).toContainText("app.lastname");
    await expect(lastname.locator("#lastname")).toHaveValue("Doe");

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
    await page.goto("/profile");

    const imageField = page.getByTestId("profile-image-field");
    await expect(imageField).toBeVisible();
    await expect(imageField).toContainText("admin.users.image.title");
    await expect(
      imageField.getByTestId("default-profile-image-preview"),
    ).toContainText("JD");
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

  test("typing a name changes the default image preview", async ({ page }) => {
    await page.goto("/profile");

    await page.locator("#firstname").fill("Laura");
    await page.locator("#lastname").fill("Rivera");

    await expect(
      page
        .getByTestId("profile-image-field")
        .getByTestId("default-profile-image-preview"),
    ).toContainText("LR");
  });

  test("upload button opens the file chooser", async ({ page }) => {
    await page.goto("/profile");

    const fileChooser = page.waitForEvent("filechooser");
    await page.getByTestId("upload-file-button").click();
    await fileChooser;

    await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);
    await expect(page.getByTestId("upload-file-input")).toBeHidden();
  });

  test.describe("upload image", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile");
      await expect(page.locator("#firstname")).toHaveValue("John");
      await page.locator("#firstname").fill("Laura");
      await page.locator("#lastname").fill("Rivera");
      await page
        .getByTestId("upload-file-input")
        .setInputFiles("tests/Playwright/fixtures/files/profileImage.jpg");
    });

    test("shows the crop dialog", async ({ page }) => {
      const dialog = page.getByTestId("crop-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.image.crop");
      // The cropper is ready when the save button is enabled
      await expect(page.getByTestId("dialog-save-button")).toHaveText(
        "admin.users.image.save",
      );
      await expect(page.getByTestId("dialog-save-button")).toBeEnabled();
    });

    test("zooms and moves the image with the keyboard", async ({ page }) => {
      await expect(page.getByTestId("dialog-save-button")).toBeEnabled();

      const cropper = page.getByRole("application");
      await expect(cropper).toHaveAttribute(
        "aria-label",
        "admin.users.image.aria_instructions",
      );

      // Zoom into the image
      await page.getByRole("slider").focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("image-zoom-display")).toHaveText("120%");

      // Move the image
      await cropper.focus();
      for (const key of [
        "ArrowRight",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowDown",
        "ArrowUp",
      ]) {
        await page.keyboard.press(key);
      }

      await page.getByTestId("dialog-save-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);

      const image = page
        .getByTestId("profile-image-field")
        .getByTestId("profile-image-preview")
        .locator("img");
      await expectImageToMatchScreenshot(
        image,
        "profile-image-preview-moved-zoomed.png",
      );
    });

    test("zooms the image with the plus and minus keys", async ({ page }) => {
      await expect(page.getByTestId("dialog-save-button")).toBeEnabled();

      const cropper = page.getByRole("application");
      await expect(cropper).toBeFocused();
      await page.keyboard.press("+");
      await page.keyboard.press("+");
      await expect(page.getByTestId("image-zoom-display")).toHaveText("120%");
      await page.keyboard.press("-");
      await page.keyboard.press("-");
      await expect(page.getByTestId("image-zoom-display")).toHaveText("100%");
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
    });

    test("reset the upload and upload again", async ({ page }) => {
      await page.getByTestId("dialog-save-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);

      const imageField = page.getByTestId("profile-image-field");
      const reset = imageField.getByTestId("reset-file-upload-button");
      await expect(reset).toHaveText("app.cancel");
      await reset.click();

      await expect(
        imageField.getByTestId("default-profile-image-preview"),
      ).toContainText("LR");
      await expect(imageField.getByTestId("profile-image-preview")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("upload-file-button")).toBeVisible();
      await expect(imageField.getByTestId("delete-image-button")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
      await expect(reset).toHaveCount(0);

      await imageField
        .getByTestId("upload-file-input")
        .setInputFiles("tests/Playwright/fixtures/files/profileImage.jpg");

      const dialog = page.getByTestId("crop-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.image.crop");
      await expect(page.getByTestId("dialog-save-button")).toBeEnabled();

      await page.getByTestId("dialog-save-button").click();
      await expect(dialog).toHaveCount(0);

      await expect(
        imageField.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      const image = imageField
        .getByTestId("profile-image-preview")
        .locator("img");
      await expectImageToMatchScreenshot(image, "profile-image-preview.png");
      await expect(imageField.getByTestId("upload-file-button")).toBeVisible();
      await expect(imageField.getByTestId("delete-image-button")).toHaveCount(
        0,
      );
      await expect(imageField.getByTestId("undo-delete-button")).toHaveCount(0);
      await expect(reset).toBeVisible();
    });
  });

  test.describe("image cropper errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile");
      await expect(page.locator("#firstname")).toHaveValue("John");
      await page.getByTestId("upload-file-input").setInputFiles({
        name: "invalid.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("This is an invalid image"),
      });
    });

    test("shows an error and disables saving for an invalid image", async ({
      page,
    }) => {
      const dialog = page.getByTestId("crop-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.image.crop");
      await expect(dialog).toContainText("admin.users.image.cropper_error");

      // The image cropper and zoom slider are hidden
      await expect(dialog.getByRole("application")).toHaveCount(0);
      await expect(dialog.getByTestId("image-zoom")).toHaveCount(0);
      await expect(dialog.getByTestId("image-zoom-display")).toHaveCount(0);

      await expect(page.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toBeFocused();
      await expect(page.getByTestId("dialog-cancel-button")).toBeEnabled();
    });

    test("allows to upload a valid image after closing the dialog", async ({
      page,
    }) => {
      await page.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);

      await page
        .getByTestId("profile-image-field")
        .getByTestId("upload-file-input")
        .setInputFiles("tests/Playwright/fixtures/files/profileImage.jpg");

      const dialog = page.getByTestId("crop-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.users.image.crop");
      await expect(dialog).not.toContainText("admin.users.image.cropper_error");
      await expect(dialog.locator("img").first()).toHaveAttribute("src", /.+/);

      // The image cropper and zoom slider are visible
      await expect(dialog.getByRole("application")).toBeVisible();
      await expect(dialog.getByTestId("image-zoom")).toBeVisible();
      await expect(dialog.getByTestId("image-zoom-display")).toHaveText("100%");

      await expect(page.getByTestId("dialog-save-button")).toBeEnabled();
      await expect(page.getByTestId("dialog-cancel-button")).toBeEnabled();
    });
  });

  test("change locale", async ({ page }) => {
    await page.goto("/profile");

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
    await page.goto("/profile");

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
    let currentUserMock;

    test.beforeEach(async ({ page, baseURL, profileUser, currentUser }) => {
      savedUser = structuredClone(profileUser);
      savedUser.data.firstname = "Laura";
      savedUser.data.lastname = "Rivera";
      savedUser.data.user_locale = "de";
      savedUser.data.timezone = "Europe/Berlin";
      savedUser.data.image = baseURL + "/test.jpg";
      savedUser.data.updated_at = "2024-09-13T14:22:26.000000Z";

      const updatedCurrentUser = structuredClone(currentUser);
      updatedCurrentUser.data.firstname = "Laura";
      updatedCurrentUser.data.lastname = "Rivera";
      updatedCurrentUser.data.user_locale = "de";
      currentUserMock = await mockMethod(page, "GET", "**/api/v1/currentUser", {
        json: updatedCurrentUser,
      });

      await page.goto("/profile");
      await expect(page.locator("#firstname")).toHaveValue("John");

      await page.locator("#firstname").fill("Laura");
      await page.locator("#lastname").fill("Rivera");

      await page.getByTestId("locale-dropdown").click();
      await page.getByTestId("locale-dropdown-option").nth(0).click();
      await page.getByTestId("timezone-dropdown").click();
      await page.getByTestId("timezone-dropdown-option").nth(2).click();

      await page
        .getByTestId("upload-file-input")
        .setInputFiles("tests/Playwright/fixtures/files/profileImage.jpg");
      await page.getByTestId("dialog-save-button").click();
      await expect(page.getByTestId("crop-image-dialog")).toHaveCount(0);
    });

    test("loading state while saving", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        json: savedUser,
        hold: true,
      });

      const saveButton = page.getByTestId("user-tab-profile-save-button");
      await expect(saveButton).toHaveText("app.save");
      await saveButton.click();
      await nthRequest(save);

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
      await expect(page.locator("#firstname")).toBeEnabled();
    });

    test("sends the changes", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        json: savedUser,
      });

      await page.getByTestId("user-tab-profile-save-button").click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("user_locale")).toEqual("de");
      expect(formData.get("timezone")).toEqual("Europe/Berlin");
      expect(formData.get("firstname")).toEqual("Laura");
      expect(formData.get("lastname")).toEqual("Rivera");
      expect(formData.get("_method")).toEqual("PUT");
      expect(formData.get("updated_at")).toEqual("2024-09-13T14:20:26.000000Z");

      const uploadedFile = formData.get("image");
      expect(uploadedFile.name).toEqual("image.jpg");
      expect(uploadedFile.type).toEqual("image/jpeg");
      expect(Buffer.from(await uploadedFile.arrayBuffer())).toMatchSnapshot(
        "profile-image-preview.jpg",
        IMAGE_SNAPSHOT_OPTIONS,
      );
    });

    test("shows the saved changes", async ({ page, baseURL }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        json: savedUser,
      });

      await page.getByTestId("user-tab-profile-save-button").click();
      await nthRequest(save);
      await nthRequest(currentUserMock, 2);

      await expect(page.locator("#firstname")).toHaveValue("Laura");
      await expect(page.locator("#firstname")).toBeEnabled();
      await expect(page.locator("#lastname")).toHaveValue("Rivera");
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

      const locale = page.getByTestId("locale-dropdown");
      await expect(locale).toHaveText("Deutsch");
      await expect(locale.locator(".p-select-label")).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );

      const timezone = page.getByTestId("timezone-dropdown");
      await expect(timezone).toHaveText("Europe/Berlin");
      await expect(timezone.locator(".p-select-label")).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test.describe("existing profile image", () => {
    test.beforeEach(async ({ page, baseURL, profileUser }) => {
      profileUser.data.image = baseURL + "/test.jpg";
      profileUser.data.updated_at = "2024-09-13T14:22:26.000000Z";

      await page.goto("/profile");
      await expect(page.getByTestId("profile-image-preview")).toBeVisible();
    });

    test("delete the profile image", async ({ page }) => {
      const deleteButton = page.getByTestId("delete-image-button");
      await expect(deleteButton).toHaveText("admin.users.image.delete");
      await deleteButton.click();

      await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toContainText("JD");

      await expect(page.getByTestId("upload-file-button")).toHaveCount(0);
      await expect(page.getByTestId("reset-file-upload-button")).toHaveCount(0);
      await expect(deleteButton).toHaveCount(0);
    });

    test("undo delete of the profile image", async ({ page, baseURL }) => {
      await page.getByTestId("delete-image-button").click();

      const undoButton = page.getByTestId("undo-delete-button");
      await expect(undoButton).toHaveText("app.undo_delete");
      await undoButton.click();

      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("profile-image-preview").locator("img"),
      ).toHaveAttribute("src", baseURL + "/test.jpg");
    });

    test("save after deleting the profile image", async ({
      page,
      profileUser,
      currentUser,
    }) => {
      const savedUser = structuredClone(profileUser);
      savedUser.data.image = null;
      savedUser.data.updated_at = "2024-09-13T14:24:26.000000Z";
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        json: savedUser,
      });
      const currentUserMock = await mockMethod(
        page,
        "GET",
        "**/api/v1/currentUser",
        { json: currentUser },
      );

      await page.getByTestId("delete-image-button").click();
      await page.getByTestId("user-tab-profile-save-button").click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("user_locale")).toEqual("en");
      expect(formData.get("timezone")).toEqual("UTC");
      expect(formData.get("firstname")).toEqual("John");
      expect(formData.get("lastname")).toEqual("Doe");
      expect(formData.get("_method")).toEqual("PUT");
      expect(formData.get("updated_at")).toEqual("2024-09-13T14:22:26.000000Z");
      expect(formData.get("image")).toEqual("");
      await nthRequest(currentUserMock);

      await expect(page.getByTestId("delete-image-button")).toHaveCount(0);
      await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
      await expect(
        page.getByTestId("default-profile-image-preview"),
      ).toContainText("JD");
    });
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile");
      await expect(page.locator("#firstname")).toHaveValue("John");
    });

    test("422 validation errors", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
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
      await nthRequest(save);

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

    test("500 error", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("user-tab-profile-save-button").click();
      await nthRequest(save);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("500 error hides previous validation errors", async ({ page }) => {
      const validation = await mockMethod(page, "POST", "**/api/v1/users/1", {
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
      await nthRequest(validation);
      await expectToastAndClose(
        page,
        "The firstname field is required. (and 3 more errors)",
      );
      await expect(page.getByTestId("firstname-field")).toContainText(
        "The firstname field is required.",
      );

      const failing = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("user-tab-profile-save-button").click();
      await nthRequest(failing);
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

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

    test.describe("428 stale error", () => {
      test.beforeEach(async ({ page, profileUser }) => {
        const newModel = structuredClone(profileUser.data);
        newModel.firstname = "Laura";
        newModel.lastname = "Rivera";
        newModel.user_locale = "de";
        newModel.timezone = "Europe/Berlin";

        const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
          status: 428,
          json: { message: "stale_model", new_model: newModel },
        });

        await expect(page.getByTestId("stale-user-dialog")).toHaveCount(0);
        await page.getByTestId("user-tab-profile-save-button").click();
        await nthRequest(save);
      });

      test("shows the stale dialog", async ({ page }) => {
        await expect(page.getByTestId("stale-user-dialog")).toContainText(
          'app.errors.stale_model_{"model":"app.model.user"}',
        );
      });

      test("reload shows the new data", async ({ page }) => {
        await expect(page.getByTestId("stale-user-dialog")).toBeVisible();
        await page.getByTestId("stale-dialog-reload-button").click();

        await expect(page.locator("#firstname")).toHaveValue("Laura");
        await expect(page.locator("#firstname")).toBeEnabled();
        await expect(page.locator("#lastname")).toHaveValue("Rivera");
        await expect(page.locator("#lastname")).toBeEnabled();
        await expect(page.locator("#authenticator")).toHaveValue(
          "admin.users.authenticator.local",
        );
        await expect(page.locator("#authenticator")).toBeDisabled();

        await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
        await expect(
          page.getByTestId("default-profile-image-preview"),
        ).toContainText("LR");

        await expect(page.getByTestId("locale-dropdown")).toHaveText("Deutsch");
        await expect(page.getByTestId("timezone-dropdown")).toHaveText(
          "Europe/Berlin",
        );
      });
    });

    test("401 error redirects to login", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 401,
      });

      await page.getByTestId("user-tab-profile-save-button").click();
      await nthRequest(save);

      await expectLoginRedirect(page, "/profile");
    });
  });

  test("view without users.updateOwnAttributes permission", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [];

    await page.goto("/profile");

    await expect(page.locator("#firstname")).toHaveValue("John");
    await expect(page.locator("#firstname")).toBeDisabled();
    await expect(page.locator("#lastname")).toHaveValue("Doe");
    await expect(page.locator("#lastname")).toBeDisabled();
    await expect(page.locator("#authenticator")).toHaveValue(
      "admin.users.authenticator.local",
    );
    await expect(page.locator("#authenticator")).toBeDisabled();

    await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
    await expect(
      page.getByTestId("default-profile-image-preview"),
    ).toContainText("JD");

    await expect(page.getByTestId("upload-file-button")).toBeVisible();
    await expect(page.getByTestId("reset-file-upload-button")).toHaveCount(0);
    await expect(page.getByTestId("delete-image-button")).toHaveCount(0);
    await expect(page.getByTestId("undo-delete-button")).toHaveCount(0);

    const locale = page.getByTestId("locale-dropdown");
    await expect(locale).toHaveText("English");
    await expect(locale.locator(".p-select-label")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const timezone = page.getByTestId("timezone-dropdown");
    await expect(timezone).toHaveText("UTC");
    await expect(timezone.locator(".p-select-label")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("view as external user", async ({ page, profileUser }) => {
    profileUser.data.authenticator = "ldap";
    profileUser.data.external_id = "jdo";

    await page.goto("/profile");

    await expect(page.locator("#firstname")).toHaveValue("John");
    await expect(page.locator("#firstname")).toBeDisabled();
    await expect(page.locator("#lastname")).toHaveValue("Doe");
    await expect(page.locator("#lastname")).toBeDisabled();
    await expect(page.locator("#authenticator")).toHaveValue(
      "admin.users.authenticator.ldap",
    );
    await expect(page.locator("#authenticator")).toBeDisabled();

    const externalId = page.getByTestId("external-user-id-field");
    await expect(externalId).toContainText("auth.external_user_id");
    await expect(externalId.locator("#external-user-id")).toHaveValue("jdo");
    await expect(externalId.locator("#external-user-id")).toBeDisabled();

    await expect(page.getByTestId("profile-image-preview")).toHaveCount(0);
    await expect(
      page.getByTestId("default-profile-image-preview"),
    ).toContainText("JD");

    await expect(page.getByTestId("upload-file-button")).toBeVisible();
    await expect(page.getByTestId("reset-file-upload-button")).toHaveCount(0);
    await expect(page.getByTestId("delete-image-button")).toHaveCount(0);
    await expect(page.getByTestId("undo-delete-button")).toHaveCount(0);

    const locale = page.getByTestId("locale-dropdown");
    await expect(locale).toHaveText("English");
    await expect(locale.locator(".p-select-label")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const timezone = page.getByTestId("timezone-dropdown");
    await expect(timezone).toHaveText("UTC");
    await expect(timezone.locator(".p-select-label")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test.describe("load timezones error", () => {
    test("loading state", async ({ page }) => {
      const timezones = await mockMethod(
        page,
        "GET",
        "**/api/v1/getTimezones",
        {
          status: 500,
          json: { message: "Test" },
          hold: true,
        },
      );

      await page.goto("/profile");

      await expect(
        page.getByTestId("user-tab-profile-save-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("timezone-dropdown")).toBeVisible();
      await expect(
        page.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      timezones.release();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("error shows a reload button and keeps the dropdown disabled", async ({
      page,
    }) => {
      await mockMethod(page, "GET", "**/api/v1/getTimezones", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/profile");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("timezone-reload-button")).toBeVisible();
      const timezone = page.getByTestId("timezone-dropdown");
      await expect(timezone).toHaveText("admin.users.timezone");
      await expect(timezone.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    test("reload timezones without error", async ({ page, timezones }) => {
      await mockMethod(page, "GET", "**/api/v1/getTimezones", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/profile");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      const reload = await mockMethod(page, "GET", "**/api/v1/getTimezones", {
        json: timezones,
      });
      await page.getByTestId("timezone-reload-button").click();
      await nthRequest(reload);

      const timezone = page.getByTestId("timezone-dropdown");
      await expect(timezone).toHaveText("UTC");
      await expect(timezone.locator(".p-select-label")).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );

      await timezone.click();
      const options = page.getByTestId("timezone-dropdown-option");
      await expect(options).toHaveText([
        "America/New_York",
        "Australia/Sydney",
        "Europe/Berlin",
        "UTC",
      ]);
      await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");
    });

    test("401 error redirects to login", async ({ page }) => {
      const timezones = await mockMethod(
        page,
        "GET",
        "**/api/v1/getTimezones",
        {
          status: 401,
        },
      );

      await page.goto("/profile");
      await nthRequest(timezones);

      await expectLoginRedirect(page, "/profile");
    });
  });
});
