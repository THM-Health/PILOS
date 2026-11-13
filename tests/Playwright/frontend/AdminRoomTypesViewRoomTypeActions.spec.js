import { mergeTests } from "@playwright/test";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as serverPoolControllerTest } from "../support/fixtures/serverPoolController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { expectLoginRedirect } from "../support/general.js";
import {
  roomTypeCheckDefaultRoomSettingCheckboxField,
  expectRoleChips,
} from "../support/admin.js";
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

test.describe("Admin room types view room type actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "serverPools.viewAny",
      "roomTypes.view",
      "roomTypes.update",
      "roomTypes.create",
      "roomTypes.delete",
    ];
  });

  test.describe("delete room type", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types/3");
      await expect(page.getByTestId("room-types-delete-button")).toBeVisible();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
    });

    test("opens dialog with default replacement room type", async ({
      page,
    }) => {
      const replacementRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await page.getByTestId("room-types-delete-button").click();
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

      await expect(
        page.getByTestId("replacement-room-type-dropdown-items"),
      ).toBeHidden();
      await page.getByTestId("replacement-room-type-dropdown").click();
      await expect(
        page.getByTestId("replacement-room-type-dropdown-items"),
      ).toBeVisible();
      const firstOption = page
        .getByTestId("replacement-room-type-dropdown-option")
        .first();
      await expect(firstOption).toHaveText(
        "admin.room_types.delete.no_replacement",
      );
      await expect(firstOption).toHaveAttribute("aria-selected", "true");
      await firstOption.click();
      await expect(
        page.getByTestId("replacement-room-type-dropdown-items"),
      ).toBeHidden();
    });

    test("delete without replacement", async ({
      page,
      getRoomTypesApiMock,
    }) => {
      await page.getByTestId("room-types-delete-button").click();
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

      const roomTypesRequest = page.waitForRequest("**/api/v1/roomTypes*");
      deleteRoomTypeApiMock.release();
      await expect(deleteRoomTypeApiMock).toHaveReceivedRequest({
        json: {
          replacement_room_type: null,
        },
      });
      await roomTypesRequest;

      await expect(page).toHaveURL(/\/admin\/room_types$/);
    });

    test("delete with replacement", async ({ page, getRoomTypesApiMock }) => {
      await page.getByTestId("room-types-delete-button").click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeVisible();

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

      const roomTypesRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      await expect(deleteRoomTypeApiMock).toHaveReceivedRequest({
        json: {
          replacement_room_type: 2,
        },
      });
      await roomTypesRequest;
      await expect(page).toHaveURL(/\/admin\/room_types$/);
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
        await page.getByTestId("room-types-delete-button").click();
        await expect(
          page.getByTestId("room-types-delete-dialog"),
        ).toBeVisible();
      });

      test("replacement room type required (422)", async ({ page }) => {
        await mockApiRequest(page, "DELETE", "roomTypes/3", validationError);

        await page.getByTestId("dialog-continue-button").click();

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
        await expect(
          page.getByTestId("room-types-delete-dialog"),
        ).toBeVisible();
        await expect(
          page.getByTestId("replacement-room-type-field"),
        ).not.toContainText(requiredMessage);
      });

      test("room type not found (404) redirects to index", async ({ page }) => {
        await mockApiRequest(
          page,
          "DELETE",
          "roomTypes/3",
          modelNotFound("room_type", [3]),
        );

        await page.getByTestId("dialog-continue-button").click();

        await expect(page).toHaveURL(/\/admin\/room_types$/);
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room_type"}',
          'app.flash.model_not_found.details_{"ids":"3"}',
        ]);
      });

      test("unauthenticated (401) redirects to login", async ({ page }) => {
        await mockApiRequest(page, "DELETE", "roomTypes/3", {
          status: 401,
        });

        await page.getByTestId("dialog-continue-button").click();

        await expectLoginRedirect(page, "/admin/room_types/3");
      });
    });
  });

  test.describe("load replacement room types errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types/3");
      await expect(page.getByTestId("room-types-delete-button")).toBeVisible();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
    });

    test("server error (500) disables dropdown and can be reloaded", async ({
      page,
      getRoomTypesApiMock,
    }) => {
      const releaseRequest = await holdApiRequest(
        page,
        "roomTypes*",
        serverError(),
      );
      await page.getByTestId("room-types-delete-button").click();

      // Check loading
      const dropdownLabel = page
        .getByTestId("replacement-room-type-dropdown")
        .locator(".p-select-label");
      await expect(dropdownLabel).toHaveAttribute("aria-disabled", "true");
      releaseRequest();

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

      // Close dialog
      await page.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("room-types-delete-dialog")).toBeHidden();
    });

    test("unauthenticated (401) redirects to login", async ({ page }) => {
      await mockApiRequest(page, "GET", "roomTypes*", { status: 401 });

      await page.getByTestId("room-types-delete-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3");
    });
  });

  test.describe("switch between edit and view", () => {
    // [field, default value, enforced] of the room type fixture
    const settingFields = [
      ["has-access-code", true, false],
      ["allow-guests", true, true],
      ["everyone-can-start", false, false],
      ["mute-on-start", true, true],
      ["record-attendance", false, false],
      ["record", false, false],
      ["auto-start-recording", false, false],
      ["disable-cam", false, false],
      ["webcams-only-for-moderator", true, false],
      ["disable-mic", false, true],
      ["disable-public-chat", true, false],
      ["disable-private-chat", false, false],
      ["disable-note", true, true],
      ["hide-user-list", true, false],
      ["allow-membership", false, true],
    ];

    test.beforeEach(async ({ roomTypeResponse }) => {
      roomTypeResponse.data.restrict = true;
      roomTypeResponse.data.roles = [
        { id: 1, name: "Superuser" },
        { id: 2, name: "Staff" },
      ];
    });

    test("edit page shows the room type", async ({ page }) => {
      await page.goto("/admin/room_types/3/edit");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");

      await expect(page.locator("#room-type-name")).toBeEnabled();
      await expect(page.locator("#description")).toHaveValue(
        "Room type description for room type Exam",
      );
      await expect(page.locator("#description")).toBeEnabled();
      await expect(page.locator("#custom-color")).toHaveValue("#4a5c66");
      await expect(page.locator("#custom-color")).toBeEnabled();

      const serverPools = page.getByTestId("server-pool-dropdown");
      await expect(serverPools.locator(".multiselect__tags")).toContainText(
        "Test",
      );
      await expect(serverPools).not.toHaveClass(/multiselect--disabled/);
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expectRoleChips(page, ["Superuser", "Staff"]);

      await expect(page.locator("#restrict")).toBeChecked();
      await expect(page.locator("#restrict")).toBeEnabled();
      await expect(page.locator("#max-participants")).toHaveValue("100");
      await expect(page.locator("#max-participants")).toBeEnabled();
      await expect(page.locator("#max-duration")).toHaveValue("120 min.");
      await expect(page.locator("#max-duration")).toBeEnabled();

      for (const [field, value, enforced] of settingFields) {
        await roomTypeCheckDefaultRoomSettingCheckboxField(
          page,
          field,
          value,
          enforced,
          false,
        );
      }

      await expect(page.locator("#lobby-disabled")).not.toBeChecked();
      await expect(page.locator("#lobby-disabled")).toBeEnabled();
      await expect(page.locator("#lobby-enabled")).not.toBeChecked();
      await expect(page.locator("#lobby-enabled")).toBeEnabled();
      await expect(page.locator("#lobby-only-for-guests")).toBeChecked();
      await expect(page.locator("#lobby-only-for-guests")).toBeEnabled();

      const defaultRoleButtons = page.getByTestId(
        "default-role-default-button",
      );
      await expect(defaultRoleButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(0)).toBeEnabled();
      await expect(defaultRoleButtons.nth(1)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(1)).toBeEnabled();

      const visibilityButtons = page.getByTestId("visibility-default-button");
      await expect(visibilityButtons.nth(0)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeEnabled();
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(1)).toBeEnabled();

      await expect(page.locator("#create-parameters")).toHaveValue(
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      );
      await expect(page.locator("#create-parameters")).toBeEnabled();

      await expect(page.getByTestId("room-types-save-button")).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeEnabled();

      await page.getByTestId("server-pool-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expect(page.locator(".multiselect__option")).toHaveCount(4);
    });

    test("cancel edit discards changes and switches to view", async ({
      page,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");

      // Change values
      await page.locator("#room-type-name").fill("Exam 01");
      await page
        .locator("#description")
        .fill("New room type description for room type Exam 01");
      await page.locator("#custom-color").fill("#ef4444");
      await page.getByTestId("server-pool-dropdown").click();
      await page.locator(".multiselect__option").nth(1).click();
      await page.locator("#restrict").click();
      await expect(page.getByTestId("role-field")).toBeHidden();
      await page.locator("#max-participants").fill("50");
      await page.locator("#max-duration").fill("60");
      for (const [field] of settingFields) {
        await page.locator(`#${field}-default`).click();
        await page.getByTestId(`${field}-enforced`).click();
      }
      await page.locator("#lobby-disabled").click();
      await page.getByTestId("lobby-enforced").click();
      await page.getByTestId("default-role-default-button").nth(1).click();
      await page.getByTestId("default-role-enforced").click();
      await page.getByTestId("visibility-default-button").nth(0).click();
      await page.getByTestId("visibility-enforced").click();
      await page
        .locator("#create-parameters")
        .fill("meetingLayout=PRESENTATION_FOCUS");

      await expect(page.getByTestId("room-types-save-button")).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeEnabled();

      const roomTypeRequest = page.waitForRequest("**/api/v1/roomTypes/3");
      await page.getByTestId("room-types-cancel-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
      await roomTypeRequest;

      // Check that the unchanged room type is shown read-only
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expect(page.locator("#room-type-name")).toBeDisabled();
      await expect(page.locator("#description")).toHaveValue(
        "Room type description for room type Exam",
      );
      await expect(page.locator("#description")).toBeDisabled();
      await expect(page.locator("#custom-color")).toHaveValue("#4a5c66");
      await expect(page.locator("#custom-color")).toBeDisabled();

      const serverPools = page.getByTestId("server-pool-dropdown");
      await expect(serverPools.locator(".multiselect__tags")).toContainText(
        "Test",
      );
      await expect(serverPools).toHaveClass(/multiselect--disabled/);
      const roles = page.getByTestId("role-dropdown");
      await expect(roles).toHaveClass(/multiselect--disabled/);
      const chips = roles.getByTestId("role-chip");
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Superuser");
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(roles.getByTestId("remove-role-button")).toHaveCount(0);

      await expect(page.locator("#restrict")).toBeChecked();
      await expect(page.locator("#restrict")).toBeDisabled();
      await expect(page.locator("#max-participants")).toHaveValue("100");
      await expect(page.locator("#max-participants")).toBeDisabled();
      await expect(page.locator("#max-duration")).toHaveValue("120 min.");
      await expect(page.locator("#max-duration")).toBeDisabled();

      for (const [field, value, enforced] of settingFields) {
        await roomTypeCheckDefaultRoomSettingCheckboxField(
          page,
          field,
          value,
          enforced,
          true,
        );
      }

      await expect(page.locator("#lobby-disabled")).not.toBeChecked();
      await expect(page.locator("#lobby-disabled")).toBeDisabled();
      await expect(page.locator("#lobby-enabled")).not.toBeChecked();
      await expect(page.locator("#lobby-enabled")).toBeDisabled();
      await expect(page.locator("#lobby-only-for-guests")).toBeChecked();
      await expect(page.locator("#lobby-only-for-guests")).toBeDisabled();

      const defaultRoleButtons = page.getByTestId(
        "default-role-default-button",
      );
      await expect(defaultRoleButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(0)).toBeDisabled();
      await expect(defaultRoleButtons.nth(1)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(1)).toBeDisabled();

      const visibilityButtons = page.getByTestId("visibility-default-button");
      await expect(visibilityButtons.nth(0)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeDisabled();
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(1)).toBeDisabled();

      await expect(page.locator("#create-parameters")).toHaveValue(
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      );
      await expect(page.locator("#create-parameters")).toBeDisabled();

      await expect(page.getByTestId("room-types-save-button")).toHaveCount(0);
    });

    test("view page shows the room type read-only", async ({ page }) => {
      await page.goto("/admin/room_types/3");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");

      await expect(page.locator("#room-type-name")).toBeDisabled();
      await expect(page.locator("#description")).toHaveValue(
        "Room type description for room type Exam",
      );
      await expect(page.locator("#description")).toBeDisabled();
      await expect(page.locator("#custom-color")).toHaveValue("#4a5c66");
      await expect(page.locator("#custom-color")).toBeDisabled();

      const serverPools = page.getByTestId("server-pool-dropdown");
      await expect(serverPools.locator(".multiselect__tags")).toContainText(
        "Test",
      );
      await expect(serverPools).toHaveClass(/multiselect--disabled/);
      const roles = page.getByTestId("role-dropdown");
      await expect(roles).toHaveClass(/multiselect--disabled/);
      const chips = roles.getByTestId("role-chip");
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Superuser");
      await expect(chips.nth(1)).toContainText("Staff");
      await expect(roles.getByTestId("remove-role-button")).toHaveCount(0);

      await expect(page.locator("#restrict")).toBeChecked();
      await expect(page.locator("#restrict")).toBeDisabled();
      await expect(page.locator("#max-participants")).toHaveValue("100");
      await expect(page.locator("#max-participants")).toBeDisabled();
      await expect(page.locator("#max-duration")).toHaveValue("120 min.");
      await expect(page.locator("#max-duration")).toBeDisabled();

      for (const [field, value, enforced] of settingFields) {
        await roomTypeCheckDefaultRoomSettingCheckboxField(
          page,
          field,
          value,
          enforced,
          true,
        );
      }

      await expect(page.locator("#lobby-disabled")).not.toBeChecked();
      await expect(page.locator("#lobby-disabled")).toBeDisabled();
      await expect(page.locator("#lobby-enabled")).not.toBeChecked();
      await expect(page.locator("#lobby-enabled")).toBeDisabled();
      await expect(page.locator("#lobby-only-for-guests")).toBeChecked();
      await expect(page.locator("#lobby-only-for-guests")).toBeDisabled();

      const defaultRoleButtons = page.getByTestId(
        "default-role-default-button",
      );
      await expect(defaultRoleButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(0)).toBeDisabled();
      await expect(defaultRoleButtons.nth(1)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(1)).toBeDisabled();

      const visibilityButtons = page.getByTestId("visibility-default-button");
      await expect(visibilityButtons.nth(0)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeDisabled();
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(1)).toBeDisabled();

      await expect(page.locator("#create-parameters")).toHaveValue(
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      );
      await expect(page.locator("#create-parameters")).toBeDisabled();

      await expect(page.getByTestId("room-types-save-button")).toHaveCount(0);
    });

    test("switch from view to edit", async ({ page }) => {
      await page.goto("/admin/room_types/3");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");

      await page.getByTestId("room-types-edit-button").click();

      await expect(page).toHaveURL(/\/admin\/room_types\/3\/edit$/);

      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expect(page.locator("#room-type-name")).toBeEnabled();
      await expect(page.locator("#description")).toHaveValue(
        "Room type description for room type Exam",
      );
      await expect(page.locator("#description")).toBeEnabled();
      await expect(page.locator("#custom-color")).toHaveValue("#4a5c66");
      await expect(page.locator("#custom-color")).toBeEnabled();

      const serverPools = page.getByTestId("server-pool-dropdown");
      await expect(serverPools.locator(".multiselect__tags")).toContainText(
        "Test",
      );
      await expect(serverPools).not.toHaveClass(/multiselect--disabled/);
      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expectRoleChips(page, ["Superuser", "Staff"]);

      await expect(page.locator("#restrict")).toBeChecked();
      await expect(page.locator("#restrict")).toBeEnabled();
      await expect(page.locator("#max-participants")).toHaveValue("100");
      await expect(page.locator("#max-participants")).toBeEnabled();
      await expect(page.locator("#max-duration")).toHaveValue("120 min.");
      await expect(page.locator("#max-duration")).toBeEnabled();

      for (const [field, value, enforced] of settingFields) {
        await roomTypeCheckDefaultRoomSettingCheckboxField(
          page,
          field,
          value,
          enforced,
          false,
        );
      }

      await expect(page.locator("#lobby-disabled")).not.toBeChecked();
      await expect(page.locator("#lobby-disabled")).toBeEnabled();
      await expect(page.locator("#lobby-enabled")).not.toBeChecked();
      await expect(page.locator("#lobby-enabled")).toBeEnabled();
      await expect(page.locator("#lobby-only-for-guests")).toBeChecked();
      await expect(page.locator("#lobby-only-for-guests")).toBeEnabled();

      const defaultRoleButtons = page.getByTestId(
        "default-role-default-button",
      );
      await expect(defaultRoleButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(0)).toBeEnabled();
      await expect(defaultRoleButtons.nth(1)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(defaultRoleButtons.nth(1)).toBeEnabled();

      const visibilityButtons = page.getByTestId("visibility-default-button");
      await expect(visibilityButtons.nth(0)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeEnabled();
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(1)).toBeEnabled();

      await expect(page.locator("#create-parameters")).toHaveValue(
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      );
      await expect(page.locator("#create-parameters")).toBeEnabled();

      await expect(page.getByTestId("room-types-save-button")).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
    });
  });
});
