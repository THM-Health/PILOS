import { mergeTests } from "@playwright/test";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as serverPoolControllerTest } from "../support/fixtures/serverPoolController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  holdApiRequest,
  mockApiRequest,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(
  roomTypeControllerTest,
  serverPoolControllerTest,
  roleControllerTest,
);

test.describe("Admin room types index room type actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "serverPools.viewAny",
      "roomTypes.view",
      "roomTypes.update",
      "roomTypes.create",
      "roomTypes.delete",
    ];

    await page.goto("/admin/room_types");
    await expect(page.getByTestId("room-type-item")).toHaveCount(2);
    await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
  });

  test.describe("delete room type", () => {
    test("dialog shows room type and default replacement", async ({ page }) => {
      const replacementRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();
      await replacementRequest;

      const dialog = page.getByTestId("room-types-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.room_types.delete.title");
      await expect(dialog).toContainText(
        'admin.room_types.delete.confirm_{"name":"Exam"}',
      );

      const field = dialog.getByTestId("replacement-room-type-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.room_types.delete.replacement");
      await expect(field).toContainText(
        "admin.room_types.delete.replacement_info",
      );
      await expect(
        field.getByTestId("replacement-room-type-dropdown"),
      ).toHaveText("admin.room_types.delete.no_replacement");
    });

    test("no replacement is selected by default", async ({ page }) => {
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeVisible();

      const items = page.getByTestId("replacement-room-type-dropdown-items");
      await expect(items).toBeHidden();
      await page.getByTestId("replacement-room-type-dropdown").click();
      await expect(items).toBeVisible();

      const firstOption = page
        .getByTestId("replacement-room-type-dropdown-option")
        .first();
      await expect(firstOption).toHaveText(
        "admin.room_types.delete.no_replacement",
      );
      await expect(firstOption).toHaveAttribute("aria-selected", "true");
      await firstOption.click();
      await expect(items).toBeHidden();
    });

    test("delete without replacement", async ({
      page,
      getRoomTypesApiMock,
    }) => {
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeVisible();

      const deleteRoomTypeApiMock = await mockApiRequest(
        page,
        "DELETE",
        "roomTypes/3",
        {
          status: 204,
          hold: true,
        },
      );
      getRoomTypesApiMock.json.data = getRoomTypesApiMock.json.data.filter(
        (roomType) => roomType.id !== 3,
      );

      const continueButton = page.getByTestId("dialog-continue-button");
      await expect(continueButton).toHaveText("app.yes");
      await continueButton.click();

      // Check loading
      await expect(
        page
          .getByTestId("replacement-room-type-dropdown")
          .locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(continueButton).toBeDisabled();

      deleteRoomTypeApiMock.release();
      await expect(deleteRoomTypeApiMock).toHaveReceivedRequest({
        json: {
          replacement_room_type: null,
        },
      });

      // Check that room type was deleted and dialog is closed
      const items = page.getByTestId("room-type-item");
      await expect(items).toHaveCount(2);
      await expect(items.nth(0)).toContainText("Lecture");
      await expect(items.nth(1)).toContainText("Meeting");
      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
    });

    test("dialog can be opened for another room type after deletion", async ({
      page,
      getRoomTypesApiMock,
    }) => {
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeVisible();

      await mockApiRequest(page, "DELETE", "roomTypes/3", {
        status: 204,
      });
      getRoomTypesApiMock.json.data = getRoomTypesApiMock.json.data.filter(
        (roomType) => roomType.id !== 3,
      );
      await page.getByTestId("dialog-continue-button").click();

      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
      await expect(page.getByTestId("room-type-item")).toHaveCount(2);
      await expect(page.getByTestId("room-type-item").nth(0)).toContainText(
        "Lecture",
      );

      // Reopen dialog for different room type
      const replacementRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await page
        .getByTestId("room-type-item")
        .nth(1)
        .getByTestId("room-types-delete-button")
        .click();
      await replacementRequest;

      const dialog = page.getByTestId("room-types-delete-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("admin.room_types.delete.title");
      await expect(dialog).toContainText(
        'admin.room_types.delete.confirm_{"name":"Meeting"}',
      );
    });

    test("delete with replacement", async ({ page, getRoomTypesApiMock }) => {
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeVisible();
      await expect(page.getByTestId("room-types-delete-dialog")).toContainText(
        'admin.room_types.delete.confirm_{"name":"Exam"}',
      );

      // Check that replacement room types are shown correctly
      await page.getByTestId("replacement-room-type-dropdown").click();
      const items = page.getByTestId("replacement-room-type-dropdown-items");
      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "replacement-room-type-dropdown-option",
      );
      await expect(options).toHaveCount(4);
      await expect(options.nth(1)).toHaveText("Lecture");
      await expect(options.nth(2)).toHaveText("Meeting");
      await expect(options.nth(3)).toHaveText("Seminar");
      await options.nth(2).click();

      await expect(items).toBeHidden();
      await expect(
        page.getByTestId("replacement-room-type-dropdown"),
      ).toHaveText("Meeting");

      // Confirm delete of room type
      const deleteRoomTypeApiMock = await mockApiRequest(
        page,
        "DELETE",
        "roomTypes/3",
        {
          status: 204,
        },
      );
      getRoomTypesApiMock.json.data = getRoomTypesApiMock.json.data.filter(
        (roomType) => roomType.id !== 3,
      );

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      await expect(deleteRoomTypeApiMock).toHaveReceivedRequest({
        json: {
          replacement_room_type: 2,
        },
      });

      // Check that room type was deleted and dialog is closed
      const roomTypeItems = page.getByTestId("room-type-item");
      await expect(roomTypeItems).toHaveCount(2);
      await expect(roomTypeItems.nth(0)).toContainText("Lecture");
      await expect(roomTypeItems.nth(1)).toContainText("Meeting");
      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
    });

    test.describe("with opened dialog", () => {
      const requiredMessage =
        "Replacement room type required! Rooms are still assigned to this room type.";
      const validationError = {
        status: 422,
        json: {
          message: requiredMessage,
          errors: { replacement_room_type: [requiredMessage] },
        },
      };

      test.beforeEach(async ({ page }) => {
        await page
          .getByTestId("room-type-item")
          .nth(0)
          .getByTestId("room-types-delete-button")
          .click();
        await expect(
          page.getByTestId("room-types-delete-dialog"),
        ).toBeVisible();
      });

      test("replacement room type required (422)", async ({ page }) => {
        await mockApiRequest(page, "DELETE", "roomTypes/3", validationError);

        await page.getByTestId("dialog-continue-button").click();

        // Check that dialog stays open and error message is shown
        await expect(
          page.getByTestId("room-types-delete-dialog"),
        ).toBeVisible();
        await expect(
          page.getByTestId("replacement-room-type-field"),
        ).toContainText(requiredMessage);
      });

      test("server error (500) keeps dialog open and hides validation error", async ({
        page,
      }) => {
        await mockApiRequest(page, "DELETE", "roomTypes/3", validationError);
        await page.getByTestId("dialog-continue-button").click();
        await expect(
          page.getByTestId("replacement-room-type-field"),
        ).toContainText(requiredMessage);

        // Select replacement room type
        await page.getByTestId("replacement-room-type-dropdown").click();
        await page
          .getByTestId("replacement-room-type-dropdown-option")
          .nth(2)
          .click();

        await mockApiRequest(page, "DELETE", "roomTypes/3", serverError());
        await page.getByTestId("dialog-continue-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        // Check that dialog is still open and that the 422 error message is hidden
        await expect(
          page.getByTestId("room-types-delete-dialog"),
        ).toBeVisible();
        await expect(
          page.getByTestId("replacement-room-type-field"),
        ).not.toContainText(requiredMessage);
      });

      test("room type not found (404) reloads room types and closes dialog", async ({
        page,
        getRoomTypesApiMock,
      }) => {
        getRoomTypesApiMock.json.data = getRoomTypesApiMock.json.data.filter(
          (roomType) => roomType.id !== 3,
        );
        await mockApiRequest(
          page,
          "DELETE",
          "roomTypes/3",
          modelNotFound("room_type", [3]),
        );

        await page.getByTestId("dialog-continue-button").click();

        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room_type"}',
          'app.flash.model_not_found.details_{"ids":"3"}',
        ]);
        await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();

        // Check that room type is not there anymore
        const items = page.getByTestId("room-type-item");
        await expect(items).toHaveCount(2);
        await expect(items.nth(0)).toContainText("Lecture");
        await expect(items.nth(1)).toContainText("Meeting");
      });

      test("unauthenticated (401) redirects to login", async ({ page }) => {
        await mockApiRequest(page, "DELETE", "roomTypes/3", {
          status: 401,
        });

        await page.getByTestId("dialog-continue-button").click();

        await expectLoginRedirect(page, "/admin/room_types");
      });
    });
  });

  test.describe("load replacement room types errors", () => {
    test("server error (500) disables dropdown and can be reloaded", async ({
      page,
      getRoomTypesApiMock,
    }) => {
      const releaseRequest = await holdApiRequest(
        page,
        "roomTypes*",
        serverError(),
      );
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();

      // Check loading
      const dropdownLabel = page
        .getByTestId("replacement-room-type-dropdown")
        .locator(".p-select-label");
      await expect(dropdownLabel).toHaveAttribute("aria-disabled", "true");
      releaseRequest();

      // Check that dialog is still open and that error message is shown
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("room-types-delete-dialog")).toBeVisible();
      await expect(dropdownLabel).toHaveAttribute("aria-disabled", "true");

      // Reload with correct data
      await mockApiRequest(page, "GET", "roomTypes*", {
        json: getRoomTypesApiMock.json,
      });
      const reloadButton = page.getByTestId(
        "replacement-room-types-reload-button",
      );
      await expect(reloadButton).toBeVisible();
      const reloadRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await reloadButton.click();
      await reloadRequest;

      await expect(dropdownLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(reloadButton).toBeHidden();

      // Dialog can be closed again
      await page.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
    });

    test("unauthenticated (401) redirects to login", async ({ page }) => {
      await mockApiRequest(page, "GET", "roomTypes*", { status: 401 });

      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();

      await expectLoginRedirect(page, "/admin/room_types");
    });
  });

  test("open add new room type page", async ({ page }) => {
    await page.getByTestId("room-types-add-button").click();

    await expect(page).toHaveURL(/\/admin\/room_types\/new$/);
  });

  test("open edit room type page", async ({ page }) => {
    await page
      .getByTestId("room-type-item")
      .nth(0)
      .getByTestId("room-types-edit-button")
      .click();

    await expect(page).toHaveURL(/\/admin\/room_types\/3\/edit$/);
  });

  test("open view room type page", async ({ page }) => {
    await page
      .getByTestId("room-type-item")
      .nth(0)
      .getByTestId("room-types-view-button")
      .click();

    await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
  });
});
