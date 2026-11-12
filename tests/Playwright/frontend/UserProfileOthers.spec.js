import { test } from "../support/fixtures/userProfile.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("User profile others", () => {
  test("view others tab", async ({ page }) => {
    await page.goto("/profile");

    await page.getByTestId("others-tab-button").click();
    await expect(page).toHaveURL(/\/profile#tab=others/);

    await expect(page.getByText("admin.users.bbb")).toBeVisible();

    const field = page.getByTestId("bbb-skip-check-audio-field");
    await expect(field).toBeVisible();
    await expect(field).toContainText("admin.users.skip_check_audio");
    await expect(field.locator("#bbb_skip_check_audio")).not.toBeChecked();
  });

  test("save changes", async ({ page, profileUser }) => {
    const user = structuredClone(profileUser);
    user.data.bbb_skip_check_audio = true;
    const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
      status: 200,
      json: user,
      hold: true,
    });

    await page.goto("/profile#tab=others");
    await page.locator("#bbb_skip_check_audio").click();
    await page.getByTestId("user-tab-others-save-button").click();

    // Check loading
    await expect(page.locator("#bbb_skip_check_audio")).toBeDisabled();
    await expect(
      page.getByTestId("user-tab-others-save-button"),
    ).toBeDisabled();

    save.release();

    const request = await nthRequest(save);
    expect(request.postDataJSON()).toMatchObject({
      bbb_skip_check_audio: true,
    });

    // Check that the changes are shown
    await expect(page.locator("#bbb_skip_check_audio")).toBeChecked();
  });

  test.describe("save changes errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile#tab=others");
      await expect(page.locator("#bbb_skip_check_audio")).toBeVisible();
    });

    test("422 error", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 422,
        json: {
          message: "The bbb skip check audio field is required.",
          errors: {
            bbb_skip_check_audio: [
              "The bbb skip check audio field is required.",
            ],
          },
        },
      });

      await page.getByTestId("user-tab-others-save-button").click();
      await nthRequest(save);

      await expect(page.locator("#bbb_skip_check_audio")).not.toBeChecked();
      await expectToastAndClose(
        page,
        "The bbb skip check audio field is required.",
      );
      await expect(
        page.getByTestId("bbb-skip-check-audio-field"),
      ).toContainText("The bbb skip check audio field is required.");
    });

    test("500 error hides previous validation errors", async ({ page }) => {
      const validation = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 422,
        json: {
          message: "The bbb skip check audio field is required.",
          errors: {
            bbb_skip_check_audio: [
              "The bbb skip check audio field is required.",
            ],
          },
        },
      });

      await page.getByTestId("user-tab-others-save-button").click();
      await nthRequest(validation);
      await expectToastAndClose(
        page,
        "The bbb skip check audio field is required.",
      );
      await expect(
        page.getByTestId("bbb-skip-check-audio-field"),
      ).toContainText("The bbb skip check audio field is required.");

      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 500,
        json: { message: "Test" },
      });

      await page.getByTestId("user-tab-others-save-button").click();
      await nthRequest(save);

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(
        page.getByTestId("bbb-skip-check-audio-field"),
      ).not.toContainText("The bbb skip check audio field is required.");
    });

    test("428 stale error", async ({ page, profileUser }) => {
      const newModel = structuredClone(profileUser.data);
      newModel.bbb_skip_check_audio = true;
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 428,
        json: { message: "stale_model", new_model: newModel },
      });

      await expect(page.getByTestId("stale-user-dialog")).toHaveCount(0);
      await page.getByTestId("user-tab-others-save-button").click();
      await nthRequest(save);

      await expect(page.getByTestId("stale-user-dialog")).toContainText(
        'app.errors.stale_model_{"model":"app.model.user"}',
      );

      await page.getByTestId("stale-dialog-reload-button").click();

      // Check that the changes are shown
      await expect(page.locator("#bbb_skip_check_audio")).toBeChecked();
    });

    test("401 error redirects to login", async ({ page }) => {
      const save = await mockMethod(page, "POST", "**/api/v1/users/1", {
        status: 401,
      });

      await page.getByTestId("user-tab-others-save-button").click();
      await nthRequest(save);

      await expectLoginRedirect(page, "/profile");
    });
  });
});
