import { test } from "../support/fixtures/roomsSettingsStreaming.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  checkCompareRoomSettingField,
  checkDefaultRoomSettingField,
  checkRoomAuthErrors,
} from "../support/room.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.use({ authenticated: true });

test.describe("Rooms view settings room type actions", () => {
  test.describe("expert mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
    });

    test("loads room types with the room settings and shows the details", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toBeHidden();
      await expect(changeDialog).toBeHidden();

      const roomTypesRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await page.getByTestId("room-type-change-button").click();
      const request = await roomTypesRequest;
      expect(Object.fromEntries(new URL(request.url()).searchParams)).toEqual({
        with_room_settings: "1",
        with_features: "1",
        filter: "abc-def-123",
      });

      await expect(changeDialog).toBeVisible();
      await expect(changeDialog).toContainText("rooms.change_type.title");
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).toHaveText(["Lecture", "Meeting", "Exam", "Seminar"]);

      const details = changeDialog.getByTestId("room-type-details");
      await expect(details).toBeVisible();
      await expect(
        details.getByText("admin.room_types.missing_description"),
      ).toBeVisible();
      // Default room settings are hidden until opened
      await expect(
        details.getByText("rooms.settings.general.title"),
      ).toBeHidden();
    });

    test("shows the default settings of the current room type", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);

      const showDefaults = changeDialog.getByTestId(
        "show-default-settings-button",
      );
      await expect(showDefaults).toHaveText(
        "admin.room_types.default_room_settings.title",
      );
      await showDefaults.click();
      // Rows: [field, value, enforced, isInfo]
      for (const row of [
        ["has_access_code", true, false, false],
        ["allow_guests", true, true, false],
        ["everyone_can_start", false, false, false],
        ["mute_on_start", true, true, false],
        [
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          true,
        ],
        ["record_attendance", false, false, false],
        ["record", false, false, false],
        ["auto_start_recording", false, false, false],
        ["lock_settings_disable_cam", false, false, false],
        ["webcams_only_for_moderator", true, false, false],
        ["lock_settings_disable_mic", false, true, false],
        ["lock_settings_disable_public_chat", true, false, false],
        ["lock_settings_disable_private_chat", false, false, false],
        ["lock_settings_disable_note", true, true, false],
        ["lock_settings_hide_user_list", true, false, false],
        ["allow_membership", false, true, false],
        ["default_role", "rooms.roles.participant", false, true],
        [
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          true,
        ],
      ]) {
        await checkDefaultRoomSettingField(page, ...row);
      }
    });

    test("keeps the settings when saving the current room type", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);

      const saveButton = changeDialog.getByTestId("dialog-save-button");
      await expect(saveButton).toHaveText("app.save");
      await saveButton.click();

      await expect(changeDialog).toBeHidden();
      await expect(confirmationDialog).toBeHidden();
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toBeHidden();

      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
      await expect(page.locator("#room-setting-short_description")).toHaveValue(
        "Short description",
      );
      await expect(page.locator("#room-setting-welcome")).toHaveValue(
        "Welcome message",
      );

      // Expert settings: [field, disabled, checked]
      for (const [field, disabled, checked] of [
        ["allow_guests", true, true],
        ["everyone_can_start", false, false],
        ["mute_on_start", true, true],
        ["lobby-0", true, false],
        ["lobby-1", true, false],
        ["lobby-2", true, true],
        ["record_attendance", false, false],
        ["record", false, false],
        ["auto_start_recording", false, false],
        ["lock_settings_disable_cam", false, false],
        ["webcams_only_for_moderator", false, true],
        ["lock_settings_disable_mic", true, false],
        ["lock_settings_disable_public_chat", false, true],
        ["lock_settings_disable_private_chat", false, false],
        ["lock_settings_disable_note", true, true],
        ["lock_settings_hide_user_list", false, true],
        ["allow_membership", true, false],
      ]) {
        await expect(page.locator(`#room-setting-${field}`)).toBeEnabled({
          enabled: !disabled,
        });
        await expect(page.locator(`#room-setting-${field}`)).toBeChecked({
          checked,
        });
      }
      await expect(page.getByTestId("room-setting-lobby")).not.toContainText(
        "rooms.settings.video_conference.lobby.alert",
      );
      await expect(
        page.getByTestId("room-setting-default_role-button"),
      ).toHaveCount(2);
      await expect(
        page.getByTestId("room-setting-visibility-button"),
      ).toHaveCount(2);
      // Toggle buttons: [field, index, pressed, disabled]
      for (const [field, index, pressed, disabled] of [
        ["default_role", 0, true, false],
        ["default_role", 1, false, false],
        ["visibility", 0, false, false],
        ["visibility", 1, true, false],
      ]) {
        const button = page
          .getByTestId(`room-setting-${field}-button`)
          .nth(index);
        await expect(button).toHaveAttribute("aria-pressed", String(pressed));
        await expect(button).toBeEnabled({ enabled: !disabled });
      }
    });

    test("shows the default settings of another room type", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();

      await expect(page.getByTestId("room-type-details")).toContainText(
        "Room type description for room type Exam",
      );
      const showDefaults = page.getByTestId("show-default-settings-button");
      await expect(showDefaults).toHaveText(
        "admin.room_types.default_room_settings.title",
      );
      await showDefaults.click();
      // Rows: [field, value, enforced, isInfo]
      for (const row of [
        ["has_access_code", false, false, false],
        ["allow_guests", false, false, false],
        ["everyone_can_start", true, false, false],
        ["mute_on_start", false, false, false],
        ["lobby", "app.enabled", false, true],
        ["record_attendance", true, false, false],
        ["record", true, false, false],
        ["auto_start_recording", true, false, false],
        ["lock_settings_disable_cam", true, false, false],
        ["webcams_only_for_moderator", false, false, false],
        ["lock_settings_disable_mic", true, false, false],
        ["lock_settings_disable_public_chat", false, false, false],
        ["lock_settings_disable_private_chat", true, false, false],
        ["lock_settings_disable_note", false, false, false],
        ["lock_settings_hide_user_list", false, false, false],
        ["allow_membership", true, false, false],
        ["default_role", "rooms.roles.moderator", false, true],
        [
          "visibility",
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        ],
      ]) {
        await checkDefaultRoomSettingField(page, ...row);
      }

      await expect(confirmationDialog).toBeHidden();
    });

    test("shows the comparison of the room type change", async ({ page }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();

      await expect(confirmationDialog).toContainText("rooms.change_type.title");
      await expect(
        confirmationDialog.getByText("rooms.settings.general.title"),
      ).toBeVisible();

      for (const [field, label] of [
        ["has_access_code", "rooms.settings.general.has_access_code"],
        ["allow_guests", "rooms.settings.general.allow_guests"],
        [
          "everyone_can_start",
          "rooms.settings.video_conference.everyone_can_start",
        ],
        ["mute_on_start", "rooms.settings.video_conference.mute_on_start"],
        ["lobby", "rooms.settings.video_conference.lobby.title"],
        ["record_attendance", "rooms.settings.recordings.record_attendance"],
        ["record", "rooms.settings.recordings.record_video_conference"],
        [
          "auto_start_recording",
          "rooms.settings.recordings.auto_start_recording",
        ],
        [
          "lock_settings_disable_cam",
          "rooms.settings.restrictions.lock_settings_disable_cam",
        ],
        [
          "webcams_only_for_moderator",
          "rooms.settings.restrictions.webcams_only_for_moderator",
        ],
        [
          "lock_settings_disable_mic",
          "rooms.settings.restrictions.lock_settings_disable_mic",
        ],
        [
          "lock_settings_disable_public_chat",
          "rooms.settings.restrictions.lock_settings_disable_public_chat",
        ],
        [
          "lock_settings_disable_private_chat",
          "rooms.settings.restrictions.lock_settings_disable_private_chat",
        ],
        [
          "lock_settings_disable_note",
          "rooms.settings.restrictions.lock_settings_disable_note",
        ],
        [
          "lock_settings_hide_user_list",
          "rooms.settings.restrictions.lock_settings_hide_user_list",
        ],
        ["allow_membership", "rooms.settings.participants.allow_membership"],
        ["default_role", "rooms.settings.participants.default_role.title"],
        ["visibility", "rooms.settings.advanced.visibility.title"],
      ]) {
        await expect(
          confirmationDialog.getByTestId(`room-type-${field}-comparison`),
        ).toContainText(label);
      }

      for (const title of [
        "rooms.settings.video_conference.title",
        "rooms.settings.recordings.title",
        "rooms.settings.restrictions.title",
        "rooms.settings.participants.title",
        "rooms.settings.advanced.title",
      ]) {
        await expect(confirmationDialog.getByText(title)).toBeVisible();
      }

      // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
      for (const row of [
        ["has_access_code", true, false, true, false, false],
        ["allow_guests", true, true, true, false, false],
        ["everyone_can_start", false, false, false, false, false],
        ["mute_on_start", true, true, true, false, false],
        [
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          false,
          true,
        ],
        ["record_attendance", false, false, false, false, false],
        ["record", false, false, false, false, false],
        ["auto_start_recording", false, false, false, false, false],
        ["lock_settings_disable_cam", false, false, false, false, false],
        ["webcams_only_for_moderator", true, false, true, false, false],
        ["lock_settings_disable_mic", false, true, false, false, false],
        ["lock_settings_disable_public_chat", true, false, true, false, false],
        [
          "lock_settings_disable_private_chat",
          false,
          false,
          false,
          false,
          false,
        ],
        ["lock_settings_disable_note", true, true, true, false, false],
        ["lock_settings_hide_user_list", true, false, true, false, false],
        ["allow_membership", false, true, false, false, false],
        [
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.participant",
          false,
          true,
        ],
        [
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.public",
          false,
          true,
        ],
      ]) {
        await checkCompareRoomSettingField(page, ...row);
      }
    });

    test("updates the comparison when resetting to the defaults", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();

      await confirmationDialog.locator("#reset-to-defaults").click();
      // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
      for (const row of [
        ["has_access_code", true, false, true, false, false],
        ["allow_guests", true, true, false, false, false],
        ["everyone_can_start", false, false, true, false, false],
        ["mute_on_start", true, true, false, false, false],
        [
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "app.enabled",
          false,
          true,
        ],
        ["record_attendance", false, false, true, false, false],
        ["record", false, false, true, false, false],
        ["auto_start_recording", false, false, true, false, false],
        ["lock_settings_disable_cam", false, false, true, false, false],
        ["webcams_only_for_moderator", true, false, false, false, false],
        ["lock_settings_disable_mic", false, true, true, false, false],
        ["lock_settings_disable_public_chat", true, false, false, false, false],
        [
          "lock_settings_disable_private_chat",
          false,
          false,
          true,
          false,
          false,
        ],
        ["lock_settings_disable_note", true, true, false, false, false],
        ["lock_settings_hide_user_list", true, false, false, false, false],
        ["allow_membership", false, true, true, false, false],
        [
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.moderator",
          false,
          true,
        ],
        [
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        ],
      ]) {
        await checkCompareRoomSettingField(page, ...row);
      }
    });

    test("changes the room type and resets the settings to the defaults", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();
      await confirmationDialog.locator("#reset-to-defaults").click();
      await confirmationDialog
        .getByTestId("confirmation-dialog-save-button")
        .click();
      await expect(confirmationDialog).toBeHidden();
      await expect(changeDialog).toBeHidden();

      const message = page.getByTestId("room-unsaved-changes-message");
      await expect(message).toBeVisible();
      await expect(message).toContainText("rooms.settings.unsaved_changes");
      const messageSaveButton = message.getByTestId(
        "room-unsaved-changes-save-button",
      );
      await expect(messageSaveButton).toBeVisible();
      await expect(messageSaveButton).toHaveText("app.save");

      await expect(page.locator("#room-setting-room_type")).toHaveValue("Exam");
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
      await expect(page.locator("#room-setting-short_description")).toHaveValue(
        "Short description",
      );
      await expect(page.locator("#room-setting-welcome")).toHaveValue(
        "Welcome message",
      );

      // Expert settings: [field, disabled, checked]
      for (const [field, disabled, checked] of [
        ["allow_guests", false, false],
        ["everyone_can_start", false, true],
        ["mute_on_start", false, false],
        ["lobby-0", false, false],
        ["lobby-1", false, true],
        ["lobby-2", false, false],
        ["record_attendance", false, true],
        ["record", false, true],
        ["auto_start_recording", false, true],
        ["lock_settings_disable_cam", false, true],
        ["webcams_only_for_moderator", false, false],
        ["lock_settings_disable_mic", false, true],
        ["lock_settings_disable_public_chat", false, false],
        ["lock_settings_disable_private_chat", false, true],
        ["lock_settings_disable_note", false, false],
        ["lock_settings_hide_user_list", false, false],
        ["allow_membership", false, true],
      ]) {
        await expect(page.locator(`#room-setting-${field}`)).toBeEnabled({
          enabled: !disabled,
        });
        await expect(page.locator(`#room-setting-${field}`)).toBeChecked({
          checked,
        });
      }
      await expect(page.getByTestId("room-setting-lobby")).toContainText(
        "rooms.settings.video_conference.lobby.alert",
      );
      await expect(
        page.getByTestId("room-setting-default_role-button"),
      ).toHaveCount(2);
      await expect(
        page.getByTestId("room-setting-visibility-button"),
      ).toHaveCount(2);
      // Toggle buttons: [field, index, pressed, disabled]
      for (const [field, index, pressed, disabled] of [
        ["default_role", 0, false, false],
        ["default_role", 1, true, false],
        ["visibility", 0, true, false],
        ["visibility", 1, false, false],
      ]) {
        const button = page
          .getByTestId(`room-setting-${field}-button`)
          .nth(index);
        await expect(button).toHaveAttribute("aria-pressed", String(pressed));
        await expect(button).toBeEnabled({ enabled: !disabled });
      }
    });

    test("cancels changing the room type", async ({ page }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);

      const cancelButton = changeDialog.getByTestId("dialog-cancel-button");
      await expect(cancelButton).toHaveText("app.cancel");
      await cancelButton.click();
      await expect(changeDialog).toBeHidden();
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toBeHidden();
    });

    test("cancels confirming the room type change", async ({ page }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();
      await confirmationDialog.locator("#reset-to-defaults").click();
      await confirmationDialog
        .getByTestId("confirmation-dialog-save-button")
        .click();
      await expect(confirmationDialog).toBeHidden();
      await expect(changeDialog).toBeHidden();
      await expect(page.locator("#room-setting-room_type")).toHaveValue("Exam");

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(1).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();
      const cancelButton = confirmationDialog.getByTestId(
        "confirmation-dialog-cancel-button",
      );
      await expect(cancelButton).toHaveText("app.cancel");
      await cancelButton.click();

      await expect(confirmationDialog).toBeHidden();
      // The room type dialog stays open
      await expect(changeDialog).toBeVisible();
      await expect(changeDialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await changeDialog.getByTestId("dialog-cancel-button").click();
      await expect(changeDialog).toBeHidden();
      await expect(page.locator("#room-setting-room_type")).toHaveValue("Exam");
    });

    test("shows the confirmation again after cancelling it", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();
      await confirmationDialog
        .getByTestId("confirmation-dialog-cancel-button")
        .click();
      await expect(confirmationDialog).toBeHidden();

      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();
      // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
      for (const row of [
        ["has_access_code", true, false, true, false, false],
        ["allow_guests", true, true, true, false, false],
        ["everyone_can_start", false, false, false, false, false],
        ["mute_on_start", true, true, true, false, false],
        [
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          false,
          true,
        ],
        ["record_attendance", false, false, false, false, false],
        ["record", false, false, false, false, false],
        ["auto_start_recording", false, false, false, false, false],
        ["lock_settings_disable_cam", false, false, false, false, false],
        ["webcams_only_for_moderator", true, false, true, false, false],
        ["lock_settings_disable_mic", false, true, false, false, false],
        ["lock_settings_disable_public_chat", true, false, true, false, false],
        [
          "lock_settings_disable_private_chat",
          false,
          false,
          false,
          false,
          false,
        ],
        ["lock_settings_disable_note", true, true, true, false, false],
        ["lock_settings_hide_user_list", true, false, true, false, false],
        ["allow_membership", false, true, false, false, false],
        [
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.participant",
          false,
          true,
        ],
        [
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.public",
          false,
          true,
        ],
      ]) {
        await checkCompareRoomSettingField(page, ...row);
      }
    });

    test.describe("after changing to Exam", () => {
      test.beforeEach(async ({ page }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(2)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog.locator("#reset-to-defaults").click();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();
        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam",
        );
      });

      test("shows the comparison when changing back without resetting", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(1)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();

        // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
        for (const row of [
          ["has_access_code", true, false, true, false, false],
          ["allow_guests", false, false, true, true, false],
          ["everyone_can_start", true, false, true, false, false],
          ["mute_on_start", false, false, true, true, false],
          [
            "lobby",
            "app.enabled",
            false,
            "rooms.settings.video_conference.lobby.only_for_guests_enabled",
            true,
            true,
          ],
          ["record_attendance", true, false, true, false, false],
          ["record", true, false, true, false, false],
          ["auto_start_recording", true, false, true, false, false],
          ["lock_settings_disable_cam", true, false, true, false, false],
          ["webcams_only_for_moderator", false, false, false, false, false],
          ["lock_settings_disable_mic", true, false, false, true, false],
          [
            "lock_settings_disable_public_chat",
            false,
            false,
            false,
            false,
            false,
          ],
          [
            "lock_settings_disable_private_chat",
            true,
            false,
            true,
            false,
            false,
          ],
          ["lock_settings_disable_note", false, false, true, true, false],
          ["lock_settings_hide_user_list", false, false, false, false, false],
          ["allow_membership", true, false, false, true, false],
          [
            "default_role",
            "rooms.roles.moderator",
            false,
            "rooms.roles.moderator",
            false,
            true,
          ],
          [
            "visibility",
            "rooms.settings.advanced.visibility.private",
            false,
            "rooms.settings.advanced.visibility.private",
            false,
            true,
          ],
        ]) {
          await checkCompareRoomSettingField(page, ...row);
        }
      });

      test("changes back to the previous room type without resetting", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(1)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        const message = page.getByTestId("room-unsaved-changes-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText("rooms.settings.unsaved_changes");
        const messageSaveButton = message.getByTestId(
          "room-unsaved-changes-save-button",
        );
        await expect(messageSaveButton).toBeVisible();
        await expect(messageSaveButton).toHaveText("app.save");

        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Meeting",
        );
        await expect(page.locator("#room-setting-access_code")).toHaveValue(
          "123456789",
        );
        await expect(
          page.locator("#room-setting-short_description"),
        ).toHaveValue("Short description");
        await expect(page.locator("#room-setting-welcome")).toHaveValue(
          "Welcome message",
        );

        // Expert settings: [field, disabled, checked]
        for (const [field, disabled, checked] of [
          ["allow_guests", true, true],
          ["everyone_can_start", false, true],
          ["mute_on_start", true, true],
          ["lobby-0", true, false],
          ["lobby-1", true, false],
          ["lobby-2", true, true],
          ["record_attendance", false, true],
          ["record", false, true],
          ["auto_start_recording", false, true],
          ["lock_settings_disable_cam", false, true],
          ["webcams_only_for_moderator", false, false],
          ["lock_settings_disable_mic", true, false],
          ["lock_settings_disable_public_chat", false, false],
          ["lock_settings_disable_private_chat", false, true],
          ["lock_settings_disable_note", true, true],
          ["lock_settings_hide_user_list", false, false],
          ["allow_membership", true, false],
        ]) {
          await expect(page.locator(`#room-setting-${field}`)).toBeEnabled({
            enabled: !disabled,
          });
          await expect(page.locator(`#room-setting-${field}`)).toBeChecked({
            checked,
          });
        }
        await expect(page.getByTestId("room-setting-lobby")).not.toContainText(
          "rooms.settings.video_conference.lobby.alert",
        );
        await expect(
          page.getByTestId("room-setting-default_role-button"),
        ).toHaveCount(2);
        await expect(
          page.getByTestId("room-setting-visibility-button"),
        ).toHaveCount(2);
        // Toggle buttons: [field, index, pressed, disabled]
        for (const [field, index, pressed, disabled] of [
          ["default_role", 0, false, false],
          ["default_role", 1, true, false],
          ["visibility", 0, true, false],
          ["visibility", 1, false, false],
        ]) {
          const button = page
            .getByTestId(`room-setting-${field}-button`)
            .nth(index);
          await expect(button).toHaveAttribute("aria-pressed", String(pressed));
          await expect(button).toBeEnabled({ enabled: !disabled });
        }
      });
    });

    test.describe("after changing to Exam and back to Meeting", () => {
      test.beforeEach(async ({ page }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        // Change to Exam and reset the settings
        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(2)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog.locator("#reset-to-defaults").click();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        // Change back to Meeting without resetting
        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(1)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        const message = page.getByTestId("room-unsaved-changes-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText("rooms.settings.unsaved_changes");
        const messageSaveButton = message.getByTestId(
          "room-unsaved-changes-save-button",
        );
        await expect(messageSaveButton).toBeVisible();
        await expect(messageSaveButton).toHaveText("app.save");
      });

      test("shows the default settings of a room type with enforced settings", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(3)
          .click();
        await page.getByTestId("show-default-settings-button").click();
        // Rows: [field, value, enforced, isInfo]
        for (const row of [
          ["has_access_code", false, true, false],
          ["allow_guests", false, true, false],
          ["everyone_can_start", true, true, false],
          ["mute_on_start", false, false, false],
          ["lobby", "app.enabled", false, true],
          ["record_attendance", true, true, false],
          ["record", true, true, false],
          ["auto_start_recording", true, true, false],
          ["lock_settings_disable_cam", true, true, false],
          ["webcams_only_for_moderator", false, true, false],
          ["lock_settings_disable_mic", true, false, false],
          ["lock_settings_disable_public_chat", false, true, false],
          ["lock_settings_disable_private_chat", true, true, false],
          ["lock_settings_disable_note", false, false, false],
          ["lock_settings_hide_user_list", false, true, false],
          ["allow_membership", true, false, false],
          ["default_role", "rooms.roles.moderator", true, true],
          [
            "visibility",
            "rooms.settings.advanced.visibility.private",
            true,
            true,
          ],
        ]) {
          await checkDefaultRoomSettingField(page, ...row);
        }
      });

      test("shows the comparison with a room type with enforced settings", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(3)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();

        // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
        for (const row of [
          ["has_access_code", true, false, false, true, false],
          ["allow_guests", true, true, false, true, false],
          ["everyone_can_start", true, false, true, true, false],
          ["mute_on_start", true, true, true, false, false],
          [
            "lobby",
            "rooms.settings.video_conference.lobby.only_for_guests_enabled",
            true,
            "rooms.settings.video_conference.lobby.only_for_guests_enabled",
            false,
            true,
          ],
          ["record_attendance", true, false, true, true, false],
          ["record", true, false, true, true, false],
          ["auto_start_recording", true, false, true, true, false],
          ["lock_settings_disable_cam", true, false, true, true, false],
          ["webcams_only_for_moderator", false, false, false, true, false],
          ["lock_settings_disable_mic", false, true, false, false, false],
          [
            "lock_settings_disable_public_chat",
            false,
            false,
            false,
            true,
            false,
          ],
          [
            "lock_settings_disable_private_chat",
            true,
            false,
            true,
            true,
            false,
          ],
          ["lock_settings_disable_note", true, true, true, false, false],
          ["lock_settings_hide_user_list", false, false, false, true, false],
          ["allow_membership", false, true, false, false, false],
          [
            "default_role",
            "rooms.roles.moderator",
            false,
            "rooms.roles.moderator",
            true,
            true,
          ],
          [
            "visibility",
            "rooms.settings.advanced.visibility.private",
            false,
            "rooms.settings.advanced.visibility.private",
            true,
            true,
          ],
        ]) {
          await checkCompareRoomSettingField(page, ...row);
        }
      });

      test("changes to a room type with enforced settings", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(3)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        const message = page.getByTestId("room-unsaved-changes-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText("rooms.settings.unsaved_changes");
        const messageSaveButton = message.getByTestId(
          "room-unsaved-changes-save-button",
        );
        await expect(messageSaveButton).toBeVisible();
        await expect(messageSaveButton).toHaveText("app.save");

        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Seminar",
        );
        await expect(page.locator("#room-setting-access_code")).toHaveValue(
          "123456789",
        );
        const accessCode = page.getByTestId("room-setting-access_code");
        await expect(accessCode).toContainText(
          "rooms.settings.general.access_code_prohibited",
        );
        await expect(
          accessCode.getByTestId("room-setting-enforced-icon"),
        ).toBeAttached();
        await expect(
          page.locator("#room-setting-short_description"),
        ).toHaveValue("Short description");
        await expect(page.locator("#room-setting-welcome")).toHaveValue(
          "Welcome message",
        );

        // Expert settings: [field, disabled, checked]
        for (const [field, disabled, checked] of [
          ["allow_guests", true, false],
          ["everyone_can_start", true, true],
          ["mute_on_start", false, true],
          ["lobby-0", false, false],
          ["lobby-1", false, false],
          ["lobby-2", false, true],
          ["record_attendance", true, true],
          ["record", true, true],
          ["auto_start_recording", true, true],
          ["lock_settings_disable_cam", true, true],
          ["webcams_only_for_moderator", true, false],
          ["lock_settings_disable_mic", false, false],
          ["lock_settings_disable_public_chat", true, false],
          ["lock_settings_disable_private_chat", true, true],
          ["lock_settings_disable_note", false, true],
          ["lock_settings_hide_user_list", true, false],
          ["allow_membership", false, false],
        ]) {
          await expect(page.locator(`#room-setting-${field}`)).toBeEnabled({
            enabled: !disabled,
          });
          await expect(page.locator(`#room-setting-${field}`)).toBeChecked({
            checked,
          });
        }
        await expect(page.getByTestId("room-setting-lobby")).not.toContainText(
          "rooms.settings.video_conference.lobby.alert",
        );
        await expect(
          page.getByTestId("room-setting-default_role-button"),
        ).toHaveCount(2);
        await expect(
          page.getByTestId("room-setting-visibility-button"),
        ).toHaveCount(2);
        // Toggle buttons: [field, index, pressed, disabled]
        for (const [field, index, pressed, disabled] of [
          ["default_role", 0, false, true],
          ["default_role", 1, true, true],
          ["visibility", 0, true, true],
          ["visibility", 1, false, true],
        ]) {
          const button = page
            .getByTestId(`room-setting-${field}-button`)
            .nth(index);
          await expect(button).toHaveAttribute("aria-pressed", String(pressed));
          await expect(button).toBeEnabled({ enabled: !disabled });
        }
      });
    });
  });

  test.describe("features", () => {
    test("shows the streaming feature of the room types", async ({
      page,
      config,
      roomTypes,
    }) => {
      config.data.streaming.enabled = true;
      roomTypes.data[0].features.streaming.enabled = true;
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const details = changeDialog.getByTestId("room-type-details");

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await expect(changeDialog).toBeVisible();

      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/\bp-tag-secondary\b/);

      // Select other room type
      await changeDialog.getByTestId("room-type-select-option").nth(0).click();
      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/\bp-tag-success\b/);
    });

    test("shows the streaming feature if the current room type has it enabled", async ({
      page,
      config,
      roomTypes,
      roomSettings,
    }) => {
      config.data.streaming.enabled = true;
      roomTypes.data[1].features.streaming.enabled = true;
      roomSettings.data.room_type.features.streaming.enabled = true;
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const details = changeDialog.getByTestId("room-type-details");

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await expect(changeDialog).toBeHidden();
      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);

      await expect(changeDialog).toContainText("rooms.change_type.title");
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).toHaveText(["Lecture", "Meeting", "Exam", "Seminar"]);
      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/\bp-tag-success\b/);

      // Select other room type
      await changeDialog.getByTestId("room-type-select-option").nth(0).click();
      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/\bp-tag-secondary\b/);
    });

    test("hides the features if streaming is disabled", async ({
      page,
      config,
      roomTypes,
    }) => {
      config.data.streaming.enabled = false;
      roomTypes.data[0].features.streaming.enabled = true;
      const changeDialog = page.getByTestId("room-type-change-dialog");

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await expect(changeDialog.getByTestId("room-type-details")).toBeVisible();
      await expect(changeDialog.getByTestId("room-type-features")).toHaveCount(
        0,
      );

      // Select other room type
      await changeDialog.getByTestId("room-type-select-option").nth(0).click();
      await expect(changeDialog.getByTestId("room-type-details")).toBeVisible();
      await expect(changeDialog.getByTestId("room-type-features")).toHaveCount(
        0,
      );
    });

    test("shows disabled features if streaming is disabled and hiding disabled features is off", async ({
      page,
      config,
      roomTypes,
      roomSettings,
    }) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = false;
      roomSettings.data.room_type.features.streaming.enabled = true;
      roomTypes.data[0].features.streaming.enabled = true;
      roomTypes.data[1].features.streaming.enabled = true;
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const details = changeDialog.getByTestId("room-type-details");

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/\bp-tag-secondary\b/);

      // Select other room type
      await changeDialog.getByTestId("room-type-select-option").nth(0).click();
      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/\bp-tag-secondary\b/);
    });
  });

  test.describe("without expert mode", () => {
    test.beforeEach(async ({ page, roomTypes, roomSettings }) => {
      roomTypes.data[4] = { ...roomTypes.data[2] };
      roomTypes.data[4].id = 5;
      roomTypes.data[4].name = "Exam 2";
      roomTypes.data[4].everyone_can_start_default = false;
      roomTypes.data[4].allow_guests_default = true;

      roomSettings.data.expert_mode = false;
      roomSettings.data.welcome = "";

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
    });

    test("shows the comparison of the room type change", async ({ page }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await expect(page.locator("#room-setting-allow_guests")).toBeDisabled();
      await expect(page.locator("#room-setting-allow_guests")).toBeChecked();
      await changeDialog.getByTestId("dialog-save-button").click();

      await expect(confirmationDialog).toBeVisible();
      await expect(confirmationDialog).toContainText("rooms.change_type.title");
      // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
      for (const row of [
        ["has_access_code", true, false, true, false, false],
        ["allow_guests", true, true, true, false, false],
        ["everyone_can_start", false, false, true, false, false],
        ["mute_on_start", true, true, false, false, false],
        [
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "app.enabled",
          false,
          true,
        ],
        ["record_attendance", false, false, true, false, false],
        ["record", false, false, true, false, false],
        ["auto_start_recording", false, false, true, false, false],
        ["lock_settings_disable_cam", false, false, true, false, false],
        ["webcams_only_for_moderator", true, false, false, false, false],
        ["lock_settings_disable_mic", false, true, true, false, false],
        ["lock_settings_disable_public_chat", true, false, false, false, false],
        [
          "lock_settings_disable_private_chat",
          false,
          false,
          true,
          false,
          false,
        ],
        ["lock_settings_disable_note", true, true, false, false, false],
        ["lock_settings_hide_user_list", true, false, false, false, false],
        ["allow_membership", false, true, true, false, false],
        [
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.moderator",
          false,
          true,
        ],
        [
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        ],
      ]) {
        await checkCompareRoomSettingField(page, ...row);
      }
    });

    test("updates only the non-expert settings when resetting to the defaults", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();

      await confirmationDialog.locator("#reset-to-defaults").click();
      // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
      for (const row of [
        ["has_access_code", true, false, true, false, false],
        ["allow_guests", true, true, false, false, false],
        ["everyone_can_start", false, false, true, false, false],
        ["mute_on_start", true, true, false, false, false],
        [
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "app.enabled",
          false,
          true,
        ],
        ["record_attendance", false, false, true, false, false],
        ["record", false, false, true, false, false],
        ["auto_start_recording", false, false, true, false, false],
        ["lock_settings_disable_cam", false, false, true, false, false],
        ["webcams_only_for_moderator", true, false, false, false, false],
        ["lock_settings_disable_mic", false, true, true, false, false],
        ["lock_settings_disable_public_chat", true, false, false, false, false],
        [
          "lock_settings_disable_private_chat",
          false,
          false,
          true,
          false,
          false,
        ],
        ["lock_settings_disable_note", true, true, false, false, false],
        ["lock_settings_hide_user_list", true, false, false, false, false],
        ["allow_membership", false, true, true, false, false],
        [
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.moderator",
          false,
          true,
        ],
        [
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        ],
      ]) {
        await checkCompareRoomSettingField(page, ...row);
      }
    });

    test("changes the room type without the expert settings", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("room-type-select-option").nth(2).click();
      await changeDialog.getByTestId("dialog-save-button").click();
      await expect(confirmationDialog).toBeVisible();
      await confirmationDialog.locator("#reset-to-defaults").click();
      await confirmationDialog.locator("#reset-to-defaults").click();
      await confirmationDialog
        .getByTestId("confirmation-dialog-save-button")
        .click();
      await expect(confirmationDialog).toBeHidden();
      await expect(changeDialog).toBeHidden();

      const message = page.getByTestId("room-unsaved-changes-message");
      await expect(message).toBeVisible();
      await expect(message).toContainText("rooms.settings.unsaved_changes");
      await expect(
        message.getByTestId("room-unsaved-changes-save-button"),
      ).toHaveCount(0);

      await expect(page.locator("#room-setting-room_type")).toHaveValue("Exam");
      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting One",
      );
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
      await expect(page.locator("#room-setting-allow_guests")).toBeEnabled();
      await expect(page.locator("#room-setting-allow_guests")).toBeChecked();
      await expect(page.locator("#room-setting-short_description")).toHaveValue(
        "Short description",
      );
      for (const section of [
        "video_conference",
        "recordings",
        "restrictions",
        "participants",
        "advanced",
      ]) {
        await expect(
          page.getByText(`rooms.settings.${section}.title`),
        ).toHaveCount(0);
      }
    });

    test.describe("after changing to Exam", () => {
      test.beforeEach(async ({ page }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(2)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog.locator("#reset-to-defaults").click();
        await confirmationDialog.locator("#reset-to-defaults").click();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();
        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam",
        );
      });

      test("shows the comparison with a room type where only the defaults differ", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(4)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();

        await expect(confirmationDialog).toContainText(
          "rooms.change_type.title",
        );
        // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
        for (const row of [
          ["has_access_code", true, false, true, false, false],
          ["allow_guests", true, false, true, false, false],
          ["everyone_can_start", true, false, false, false, false],
          ["mute_on_start", false, false, false, false, false],
          ["lobby", "app.enabled", false, "app.enabled", false, true],
          ["record_attendance", true, false, true, false, false],
          ["record", true, false, true, false, false],
          ["auto_start_recording", true, false, true, false, false],
          ["lock_settings_disable_cam", true, false, true, false, false],
          ["webcams_only_for_moderator", false, false, false, false, false],
          ["lock_settings_disable_mic", true, false, true, false, false],
          [
            "lock_settings_disable_public_chat",
            false,
            false,
            false,
            false,
            false,
          ],
          [
            "lock_settings_disable_private_chat",
            true,
            false,
            true,
            false,
            false,
          ],
          ["lock_settings_disable_note", false, false, false, false, false],
          ["lock_settings_hide_user_list", false, false, false, false, false],
          ["allow_membership", true, false, true, false, false],
          [
            "default_role",
            "rooms.roles.moderator",
            false,
            "rooms.roles.moderator",
            false,
            true,
          ],
          [
            "visibility",
            "rooms.settings.advanced.visibility.private",
            false,
            "rooms.settings.advanced.visibility.private",
            false,
            true,
          ],
        ]) {
          await checkCompareRoomSettingField(page, ...row);
        }
      });

      test("changes to a room type where only the defaults differ", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(4)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        const message = page.getByTestId("room-unsaved-changes-message");
        await expect(message).toBeVisible();
        await expect(message).toContainText("rooms.settings.unsaved_changes");
        await expect(
          message.getByTestId("room-unsaved-changes-save-button"),
        ).toHaveCount(0);

        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam 2",
        );
        await expect(page.locator("#room-setting-name")).toHaveValue(
          "Meeting One",
        );
        await expect(page.locator("#room-setting-access_code")).toHaveValue(
          "123456789",
        );
        await expect(page.locator("#room-setting-allow_guests")).toBeEnabled();
        await expect(page.locator("#room-setting-allow_guests")).toBeChecked();
        await expect(
          page.locator("#room-setting-short_description"),
        ).toHaveValue("Short description");
        for (const section of [
          "video_conference",
          "recordings",
          "restrictions",
          "participants",
          "advanced",
        ]) {
          await expect(
            page.getByText(`rooms.settings.${section}.title`),
          ).toHaveCount(0);
        }
      });
    });

    test.describe("after changing to Exam and Exam 2", () => {
      test.beforeEach(async ({ page }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        // Change to Exam and reset the settings
        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(2)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog.locator("#reset-to-defaults").click();
        await confirmationDialog.locator("#reset-to-defaults").click();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        // Change to Exam 2 without resetting
        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(4)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();
        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam 2",
        );
      });

      test("shows the comparison when changing back to the original room type", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(1)
          .click();
        await expect(page.locator("#room-setting-allow_guests")).toBeEnabled();
        await expect(page.locator("#room-setting-allow_guests")).toBeChecked();
        await changeDialog.getByTestId("dialog-save-button").click();

        await expect(confirmationDialog).toBeVisible();
        await expect(confirmationDialog).toContainText(
          "rooms.change_type.title",
        );
        // Rows: [field, current, currentEnforced, new, newEnforced, isInfo]
        for (const row of [
          ["has_access_code", true, false, true, false, false],
          ["allow_guests", true, false, true, true, false],
          ["everyone_can_start", false, false, false, false, false],
          ["mute_on_start", false, false, true, true, false],
          [
            "lobby",
            "app.enabled",
            false,
            "rooms.settings.video_conference.lobby.only_for_guests_enabled",
            true,
            true,
          ],
          ["record_attendance", true, false, false, false, false],
          ["record", true, false, false, false, false],
          ["auto_start_recording", true, false, false, false, false],
          ["lock_settings_disable_cam", true, false, false, false, false],
          ["webcams_only_for_moderator", false, false, true, false, false],
          ["lock_settings_disable_mic", true, false, false, true, false],
          [
            "lock_settings_disable_public_chat",
            false,
            false,
            true,
            false,
            false,
          ],
          [
            "lock_settings_disable_private_chat",
            true,
            false,
            false,
            false,
            false,
          ],
          ["lock_settings_disable_note", false, false, true, true, false],
          ["lock_settings_hide_user_list", false, false, true, false, false],
          ["allow_membership", true, false, false, true, false],
          [
            "default_role",
            "rooms.roles.moderator",
            false,
            "rooms.roles.participant",
            false,
            true,
          ],
          [
            "visibility",
            "rooms.settings.advanced.visibility.private",
            false,
            "rooms.settings.advanced.visibility.public",
            false,
            true,
          ],
        ]) {
          await checkCompareRoomSettingField(page, ...row);
        }
      });

      test("hides the unsaved changes message when changing back to the original room type", async ({
        page,
      }) => {
        const changeDialog = page.getByTestId("room-type-change-dialog");
        const confirmationDialog = page.getByTestId(
          "room-type-change-confirmation-dialog",
        );

        await page.getByTestId("room-type-change-button").click();
        await expect(changeDialog).toBeVisible();
        await expect(
          changeDialog.getByTestId("room-type-select-option"),
        ).not.toHaveCount(0);
        await changeDialog
          .getByTestId("room-type-select-option")
          .nth(1)
          .click();
        await changeDialog.getByTestId("dialog-save-button").click();
        await expect(confirmationDialog).toBeVisible();
        await confirmationDialog
          .getByTestId("confirmation-dialog-save-button")
          .click();
        await expect(confirmationDialog).toBeHidden();
        await expect(changeDialog).toBeHidden();

        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Meeting",
        );
        await expect(
          page.getByTestId("room-unsaved-changes-message"),
        ).toBeHidden();
        await expect(page.locator("#room-setting-name")).toHaveValue(
          "Meeting One",
        );
        await expect(page.locator("#room-setting-access_code")).toHaveValue(
          "123456789",
        );
        await expect(page.locator("#room-setting-allow_guests")).toBeDisabled();
        await expect(page.locator("#room-setting-allow_guests")).toBeChecked();
        await expect(
          page.locator("#room-setting-short_description"),
        ).toHaveValue("Short description");
        for (const section of [
          "video_conference",
          "recordings",
          "restrictions",
          "participants",
          "advanced",
        ]) {
          await expect(
            page.getByText(`rooms.settings.${section}.title`),
          ).toHaveCount(0);
        }
      });
    });

    test("does not show the comparison when selecting the same room type", async ({
      page,
    }) => {
      const changeDialog = page.getByTestId("room-type-change-dialog");
      const confirmationDialog = page.getByTestId(
        "room-type-change-confirmation-dialog",
      );

      await page.getByTestId("room-type-change-button").click();
      await expect(changeDialog).toBeVisible();
      await expect(
        changeDialog.getByTestId("room-type-select-option"),
      ).not.toHaveCount(0);
      await changeDialog.getByTestId("dialog-save-button").click();

      await expect(changeDialog).toBeHidden();
      await expect(confirmationDialog).toBeHidden();
    });
  });

  test.describe("errors loading room types", () => {
    test("shows the loading error and allows to reload", async ({
      page,
      roomTypes,
    }) => {
      const failedRoomTypes = await mockMethod(
        page,
        "GET",
        "**/api/v1/roomTypes*",
        { status: 500, json: { message: "Test" }, hold: true },
      );

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      const dialog = page.getByTestId("room-type-change-dialog");
      await expect(dialog).toBeHidden();
      await page.getByTestId("room-type-change-button").click();

      // Check that dialog loading is shown correctly
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.change_type.title");
      await expect(dialog.getByTestId("overlay")).toBeVisible();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeVisible();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      failedRoomTypes.release();

      // Check error message
      const toast = page.locator(".p-toast-message");
      await expect(toast).toContainText(
        'app.flash.server_error.message_{"message":"Test"}',
      );
      await expect(toast).toContainText(
        'app.flash.server_error.error_code_{"statusCode":500}',
      );
      await expectToastAndClose(
        page,
        'app.flash.server_error.message_{"message":"Test"}',
      );

      // Check that dialog is shown correctly and reload button is visible
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.change_type.title");
      await expect(dialog).toContainText("rooms.room_types.loading_error");
      await expect(dialog.getByTestId("overlay")).toBeHidden();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeVisible();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeEnabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      // Reload with valid room types
      const validRoomTypes = await mockMethod(
        page,
        "GET",
        "**/api/v1/roomTypes*",
        { json: roomTypes },
      );
      const reloadButton = dialog.getByTestId("reload-room-types-button");
      await expect(reloadButton).toBeVisible();
      await reloadButton.click();
      await nthRequest(validRoomTypes);

      await expect(dialog.getByTestId("room-type-select-option")).toHaveText([
        "Lecture",
        "Meeting",
        "Exam",
        "Seminar",
      ]);

      // Close dialog
      await dialog.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();
    });

    test("handles auth errors when loading the room types", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );

      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-type-change-button").click();
        },
        "GET",
        "api/v1/roomTypes*",
        "settings",
      );
    });
  });
});
