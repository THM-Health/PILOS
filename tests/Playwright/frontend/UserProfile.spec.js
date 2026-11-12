import { test } from "../support/fixtures/userProfile.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  expectLoginRedirect,
  testVisitWithoutCurrentUser,
} from "../support/general.js";
import { mockMethod } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("User profile", () => {
  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/profile");
  });

  test("open user profile from the navbar and show it after loading", async ({
    page,
    profileUser,
  }) => {
    await interceptRoomIndexRequests(page);

    const user = await mockMethod(page, "GET", "**/api/v1/users/1", {
      json: profileUser,
      hold: true,
    });

    await page.goto("/rooms");

    await page.getByTestId("navbar-user").click();
    const profileLink = page
      .getByTestId("submenu")
      .first()
      .getByTestId("navbar-user-profile");
    await expect(profileLink).toHaveText("app.profile");
    await profileLink.click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByTestId("user-profile")).toBeVisible();

    // Tabs are not shown while the user is loading
    await expect(page.getByTestId("overlay")).toBeVisible();
    await expect(page.getByTestId("base-tab-button")).toHaveCount(0);
    await expect(page.getByTestId("email-tab-button")).toHaveCount(0);
    await expect(page.getByTestId("security-tab-button")).toHaveCount(0);
    await expect(page.getByTestId("others-tab-button")).toHaveCount(0);

    user.release();

    await expect(page.getByTestId("overlay")).toBeHidden();
    await expect(page.getByTestId("base-tab-button")).toBeVisible();
    await expect(page.getByTestId("email-tab-button")).toBeVisible();
    await expect(page.getByTestId("security-tab-button")).toBeVisible();
    await expect(page.getByTestId("others-tab-button")).toBeVisible();
  });

  test("open user profile with invalid tab hash", async ({ page }) => {
    await page.goto("/profile#tab=invalid");

    // Base tab is shown
    await expect(page.locator("#firstname")).toBeVisible();

    // Invalid tab hash is cleared
    await expect(page).not.toHaveURL(/#tab=invalid/);
  });

  test("hide edit controls when external_image is true", async ({
    page,
    profileUser,
  }) => {
    profileUser.data.external_image = true;

    await page.goto("/profile");

    await expect(page.getByTestId("profile-image-field")).toBeVisible();
    await expect(page.getByTestId("upload-file-button")).toHaveCount(0);
    await expect(page.getByTestId("delete-image-button")).toHaveCount(0);
  });

  test.describe("loading errors", () => {
    test("show error and allow reload", async ({ page, profileUser }) => {
      await mockMethod(page, "GET", "**/api/v1/users/1", {
        status: 500,
        json: { message: "Test" },
      });

      await page.goto("/profile");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      await mockMethod(page, "GET", "**/api/v1/users/1", {
        json: profileUser,
      });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("base-tab-button")).toBeVisible();
    });

    test("401 error on reload redirects to login", async ({ page }) => {
      await page.goto("/profile");
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("base-tab-button")).toBeVisible();

      await mockMethod(page, "GET", "**/api/v1/users/1", { status: 401 });
      await page.reload();

      await expectLoginRedirect(page, "/profile");
    });
  });
});
