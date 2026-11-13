import { mergeTests } from "@playwright/test";
import { test as userProfileTest } from "../support/fixtures/userProfile.js";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { test as sessionControllerTest } from "../support/fixtures/sessionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockApiRequest,
  validationErrors,
  serverError,
} from "../support/utils.js";

const test = mergeTests(
  userProfileTest,
  userControllerTest,
  timezonesTest,
  sessionControllerTest,
);

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

  test("save changes", async ({ page, profileUserResponse }) => {
    const user = structuredClone(profileUserResponse);
    user.data.bbb_skip_check_audio = true;
    const postUserApiMock = await mockApiRequest(page, "POST", "users/1", {
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

    postUserApiMock.release();

    const request = await postUserApiMock.waitForRequest();
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
      const postUserApiMock = await mockApiRequest(
        page,
        "POST",
        "users/1",
        validationErrors(
          {
            bbb_skip_check_audio: [
              "The bbb skip check audio field is required.",
            ],
          },
          "The bbb skip check audio field is required.",
        ),
      );

      await page.getByTestId("user-tab-others-save-button").click();
      await postUserApiMock.waitForRequest();

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
      const postUserApiMock = await mockApiRequest(
        page,
        "POST",
        "users/1",
        validationErrors(
          {
            bbb_skip_check_audio: [
              "The bbb skip check audio field is required.",
            ],
          },
          "The bbb skip check audio field is required.",
        ),
      );

      await page.getByTestId("user-tab-others-save-button").click();
      await postUserApiMock.waitForRequest();
      await expectToastAndClose(
        page,
        "The bbb skip check audio field is required.",
      );
      await expect(
        page.getByTestId("bbb-skip-check-audio-field"),
      ).toContainText("The bbb skip check audio field is required.");

      const postUserApiMock2 = await mockApiRequest(
        page,
        "POST",
        "users/1",
        serverError(),
      );

      await page.getByTestId("user-tab-others-save-button").click();
      await postUserApiMock2.waitForRequest();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(
        page.getByTestId("bbb-skip-check-audio-field"),
      ).not.toContainText("The bbb skip check audio field is required.");
    });

    test("428 stale error", async ({ page, profileUserResponse }) => {
      const newModel = structuredClone(profileUserResponse.data);
      newModel.bbb_skip_check_audio = true;
      const postUserApiMock = await mockApiRequest(page, "POST", "users/1", {
        status: 428,
        json: { message: "stale_model", new_model: newModel },
      });

      await expect(page.getByTestId("stale-user-dialog")).toHaveCount(0);
      await page.getByTestId("user-tab-others-save-button").click();
      await postUserApiMock.waitForRequest();

      await expect(page.getByTestId("stale-user-dialog")).toContainText(
        'app.errors.stale_model_{"model":"app.model.user"}',
      );

      await page.getByTestId("stale-dialog-reload-button").click();

      // Check that the changes are shown
      await expect(page.locator("#bbb_skip_check_audio")).toBeChecked();
    });

    test("401 error redirects to login", async ({ page }) => {
      const postUserApiMock = await mockApiRequest(page, "POST", "users/1", {
        status: 401,
      });

      await page.getByTestId("user-tab-others-save-button").click();
      await postUserApiMock.waitForRequest();

      await expectLoginRedirect(page, "/profile");
    });
  });
});
