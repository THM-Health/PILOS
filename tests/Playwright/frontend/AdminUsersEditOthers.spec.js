import { mergeTests } from "@playwright/test";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { test as sessionControllerTest } from "../support/fixtures/sessionController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptAdminUsersIndexRequests } from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  mockApiRequest,
  validationErrors,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(
  userControllerTest,
  roleControllerTest,
  timezonesTest,
  sessionControllerTest,
);

test.use({ authenticated: true });

test.describe("Admin users edit others", () => {
  test.beforeEach(async ({ currentUserResponse, configResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "users.create",
      "users.delete",
      "roles.viewAny",
    ];
    configResponse.data.auth.local = true;
  });

  test("view others tab and set the tab hash", async ({ page }) => {
    await page.goto("/admin/users/2/edit");

    await page.getByTestId("others-tab-button").click();

    await expect(page).toHaveURL(/\/admin\/users\/2\/edit#tab=others/);
    await expect(page.getByText("admin.users.bbb")).toBeVisible();

    const field = page.getByTestId("bbb-skip-check-audio-field");
    await expect(field).toBeVisible();
    await expect(field).toContainText("admin.users.skip_check_audio");
    await expect(field.locator("#bbb_skip_check_audio")).not.toBeChecked();
    await expect(field.locator("#bbb_skip_check_audio")).toBeEnabled();
  });

  test.describe("save changes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/2/edit#tab=others");
      await page.locator("#bbb_skip_check_audio").click();
    });

    test("loading state disables tabs, header buttons and form", async ({
      page,
      userResponse,
    }) => {
      userResponse.data.bbb_skip_check_audio = true;
      const postUserApiMock = await mockApiRequest(page, "POST", "users/2", {
        json: userResponse,
        hold: true,
      });

      await page.getByTestId("user-tab-others-save-button").click();
      await postUserApiMock.waitForRequest();

      for (const tab of ["base", "email", "security", "others"]) {
        await expect(page.getByTestId(`${tab}-tab-button`)).toBeDisabled();
      }

      await expect(page.getByTestId("users-cancel-edit-button")).toBeVisible();
      await expect(page.getByTestId("users-cancel-edit-button")).toBeDisabled();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeVisible();
      await expect(
        page.getByTestId("users-reset-password-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("users-delete-button")).toBeVisible();
      await expect(page.getByTestId("users-delete-button")).toBeDisabled();

      await expect(page.locator("#bbb_skip_check_audio")).toBeDisabled();
      await expect(
        page.getByTestId("user-tab-others-save-button"),
      ).toBeDisabled();

      postUserApiMock.release();
    });

    test("save changes and redirect to the user view", async ({
      page,
      userResponse,
    }) => {
      userResponse.data.bbb_skip_check_audio = true;
      const postUserApiMock = await mockApiRequest(page, "POST", "users/2", {
        json: userResponse,
      });

      const userRequest = page.waitForRequest(
        (request) =>
          request.method() === "GET" &&
          new URL(request.url()).pathname === "/api/v1/users/2",
      );
      await page.getByTestId("user-tab-others-save-button").click();

      const request = await postUserApiMock.waitForRequest();
      expect(request.postDataJSON()).toMatchObject({
        bbb_skip_check_audio: true,
      });

      await expect(page).toHaveURL(/\/admin\/users\/2#tab=others/);
      await expect(page).not.toHaveURL(/\/edit/);
      await userRequest;
    });

    test("validation error (422) is shown in the field", async ({ page }) => {
      await mockApiRequest(
        page,
        "POST",
        "users/2",
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

      await expectToastAndClose(
        page,
        "The bbb skip check audio field is required.",
      );
      await expect(page.locator("#bbb_skip_check_audio")).toBeChecked();
      await expect(
        page.getByTestId("bbb-skip-check-audio-field"),
      ).toContainText("The bbb skip check audio field is required.");
    });

    test("server error (500) shows a toast and hides previous field errors", async ({
      page,
    }) => {
      const postUserApiMock = await mockApiRequest(
        page,
        "POST",
        "users/2",
        validationErrors(
          {
            bbb_skip_check_audio: [
              "The bbb skip check audio field is required.",
            ],
          },
          "The bbb skip check audio field is required.",
        ),
      );
      const field = page.getByTestId("bbb-skip-check-audio-field");

      await page.getByTestId("user-tab-others-save-button").click();
      await expectToastAndClose(
        page,
        "The bbb skip check audio field is required.",
      );
      await expect(field).toContainText(
        "The bbb skip check audio field is required.",
      );
      expect(postUserApiMock.requests).toHaveLength(1);

      await mockApiRequest(page, "POST", "users/2", serverError());
      await page.getByTestId("user-tab-others-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(field).not.toContainText(
        "The bbb skip check audio field is required.",
      );
    });

    test("stale model (428) shows the stale dialog and reloads", async ({
      page,
      userResponse,
    }) => {
      userResponse.data.bbb_skip_check_audio = true;
      await mockApiRequest(page, "POST", "users/2", {
        status: 428,
        json: { message: "stale_model", new_model: userResponse.data },
      });

      await expect(page.getByTestId("stale-user-dialog")).toHaveCount(0);
      await page.getByTestId("user-tab-others-save-button").click();

      const dialog = page.getByTestId("stale-user-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'app.errors.stale_model_{"model":"app.model.user"}',
      );

      const userRequest = page.waitForRequest(
        (request) =>
          request.method() === "GET" &&
          new URL(request.url()).pathname === "/api/v1/users/2",
      );
      await page.getByTestId("stale-dialog-reload-button").click();

      await expect(page).toHaveURL(/\/admin\/users\/2/);
      await expect(page).not.toHaveURL(/\/edit/);
      await userRequest;
    });

    test("user not found (404) redirects to the users index", async ({
      page,
    }) => {
      await interceptAdminUsersIndexRequests(page);
      const usersRequest = page.waitForRequest(
        (request) =>
          request.method() === "GET" &&
          new URL(request.url()).pathname === "/api/v1/users",
      );
      await mockApiRequest(page, "POST", "users/2", modelNotFound("user", [2]));

      await page.getByTestId("user-tab-others-save-button").click();

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
      await mockApiRequest(page, "POST", "users/2", {
        status: 401,
        json: {},
      });

      await page.getByTestId("user-tab-others-save-button").click();

      await expectLoginRedirect(page, "/admin/users/2/edit");
    });
  });
});
