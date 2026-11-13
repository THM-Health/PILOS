import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roomStreamingControllerTest } from "../support/fixtures/roomStreamingController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  checkRoomAuthErrorsLoadingTab,
} from "../support/room.js";
import {
  mockApiRequest,
  readFixture,
  serverError,
  modelNotFound,
  validationErrors,
} from "../support/utils.js";

const test = mergeTests(
  roomControllerTest,
  roomFileControllerTest,
  roomTypeControllerTest,
  userControllerTest,
  roomStreamingControllerTest,
);
test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });
test.use({ roomTypesFixtureName: "roomTypesWithSettings.json" });

test.use({ authenticated: true });

test.describe("Rooms view settings", () => {
  test.describe("load settings", () => {
    test("show loading state while the settings are loading", async ({
      page,
      roomSettingsResponse,
    }) => {
      const getRoomSettingsApiMock = await mockApiRequest(
        page,
        "GET",
        "rooms/abc-def-123/settings",
        { json: roomSettingsResponse, hold: true },
      );

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-settings").click();

      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123#tab=settings"),
      );

      await expect(page.getByTestId("overlay")).toBeVisible();

      const deleteButton = page.getByTestId("room-delete-button");
      await expect(deleteButton).toHaveText("rooms.modals.delete.title");
      await expect(deleteButton).toBeDisabled();

      const transferButton = page.getByTestId("room-transfer-ownership-button");
      await expect(transferButton).toHaveText(
        "rooms.modals.transfer_ownership.title",
      );
      await expect(transferButton).toBeDisabled();

      const expertModeButton = page.getByTestId(
        "room-settings-expert-mode-button",
      );
      await expect(expertModeButton).toHaveText(
        "rooms.settings.expert_mode.activate",
      );
      await expect(expertModeButton).toBeDisabled();

      const saveButton = page.getByTestId("room-settings-save-button");
      await expect(saveButton).toHaveText("app.save");
      await expect(saveButton).toBeDisabled();

      getRoomSettingsApiMock.release();

      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test.describe("without expert mode", () => {
      test.beforeEach(async ({ page, roomSettingsResponse }) => {
        roomSettingsResponse.data.expert_mode = false;
        roomSettingsResponse.data.welcome = "";

        await page.goto("/rooms/abc-def-123#tab=settings");
        await expect(page.getByTestId("overlay")).toHaveCount(0);
        await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);
      });

      test("show general settings", async ({ page }) => {
        await expect(
          page.getByText("rooms.settings.general.title"),
        ).toBeVisible();

        const roomType = page.getByTestId("room-setting-room_type");
        await expect(roomType).toBeVisible();
        await expect(roomType).toContainText("rooms.settings.general.type");
        await expect(roomType.locator("#room-setting-room_type")).toHaveValue(
          "Meeting",
        );

        const name = page.getByTestId("room-setting-name");
        await expect(name).toBeVisible();
        await expect(name).toContainText("rooms.name");
        await expect(name.locator("#room-setting-name")).toHaveValue(
          "Meeting One",
        );

        const accessCode = page.getByTestId("room-setting-access_code");
        await expect(accessCode).toBeVisible();
        await expect(accessCode).toContainText("rooms.access_code");
        await expect(
          accessCode.getByTestId("room-setting-enforced-icon"),
        ).toHaveCount(0);
        await expect(
          accessCode.locator("#room-setting-access_code"),
        ).toHaveValue("123456789");
        await expect(
          accessCode.getByTestId("clear-access-code-button"),
        ).toBeVisible();
        await expect(
          accessCode.getByTestId("generate-access-code-button"),
        ).toBeVisible();

        const allowGuests = page.getByTestId("room-setting-allow_guests");
        await expect(allowGuests).toBeVisible();
        await expect(allowGuests).toContainText(
          "rooms.settings.general.access_by_guests",
        );
        await expect(
          allowGuests.getByTestId("room-setting-enforced-icon"),
        ).toBeVisible();
        await expect(
          allowGuests.locator("#room-setting-allow_guests"),
        ).toBeDisabled();
        await expect(
          allowGuests.locator("#room-setting-allow_guests"),
        ).toBeChecked();

        const shortDescription = page.getByTestId(
          "room-setting-short_description",
        );
        await expect(shortDescription).toBeVisible();
        await expect(shortDescription).toContainText(
          "rooms.settings.general.short_description",
        );
        await expect(shortDescription).toContainText(
          'app.char_counter_{"chars":17,"max":300}',
        );
        await expect(
          shortDescription.locator("#room-setting-short_description"),
        ).toHaveValue("Short description");
      });

      test("hide expert settings", async ({ page }) => {
        await expect(
          page.getByText("rooms.settings.general.title"),
        ).toBeVisible();

        for (const title of [
          "video_conference",
          "recordings",
          "restrictions",
          "participants",
          "advanced",
        ]) {
          await expect(
            page.getByText(`rooms.settings.${title}.title`),
          ).toHaveCount(0);
        }
      });

      test("activate expert mode", async ({ page }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();

        const dialog = page.getByTestId("room-settings-expert-mode-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          "rooms.settings.expert_mode.activate",
        );
        await expect(dialog).toContainText(
          "rooms.settings.expert_mode.warning.activate",
        );
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(
          page.getByTestId("room-settings-expert-mode-button"),
        ).toHaveText("rooms.settings.expert_mode.deactivate");

        for (const title of [
          "video_conference",
          "recordings",
          "restrictions",
          "participants",
          "advanced",
        ]) {
          await expect(
            page.getByText(`rooms.settings.${title}.title`),
          ).toBeVisible();
        }
      });

      test("show video conference settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await expect(
          page.getByText("rooms.settings.video_conference.title"),
        ).toBeVisible();

        const everyoneCanStart = page.getByTestId(
          "room-setting-everyone_can_start",
        );
        await expect(everyoneCanStart).toBeVisible();
        await expect(everyoneCanStart).toContainText(
          "rooms.settings.video_conference.everyone_can_start",
        );
        await expect(
          everyoneCanStart.locator("#room-setting-everyone_can_start"),
        ).not.toBeChecked();
        await expect(
          everyoneCanStart.locator("#room-setting-everyone_can_start"),
        ).toBeEnabled();
        await expect(
          everyoneCanStart.getByTestId("room-setting-enforced-icon"),
        ).toHaveCount(0);

        const muteOnStart = page.getByTestId("room-setting-mute_on_start");
        await expect(muteOnStart).toBeVisible();
        await expect(muteOnStart).toContainText(
          "rooms.settings.video_conference.mute_on_start",
        );
        await expect(
          muteOnStart.locator("#room-setting-mute_on_start"),
        ).toBeChecked();
        await expect(
          muteOnStart.locator("#room-setting-mute_on_start"),
        ).toBeDisabled();
        await expect(
          muteOnStart.getByTestId("room-setting-enforced-icon"),
        ).toHaveCount(1);

        const lobby = page.getByTestId("room-setting-lobby");
        await expect(lobby).toBeVisible();
        await expect(lobby).toContainText(
          "rooms.settings.video_conference.lobby.title",
        );
        await expect(
          lobby.getByTestId("room-setting-enforced-icon"),
        ).toBeVisible();
        await expect(page.locator("#room-setting-lobby-0")).toBeDisabled();
        await expect(page.locator("#room-setting-lobby-0")).not.toBeChecked();
        await expect(page.locator("#room-setting-lobby-1")).toBeDisabled();
        await expect(page.locator("#room-setting-lobby-1")).not.toBeChecked();
        await expect(page.locator("#room-setting-lobby-2")).toBeDisabled();
        await expect(page.locator("#room-setting-lobby-2")).toBeChecked();

        const welcome = page.getByTestId("room-setting-welcome");
        await expect(welcome).toBeVisible();
        await expect(welcome).toContainText(
          "rooms.settings.video_conference.welcome_message",
        );
        await expect(welcome).toContainText(
          'app.char_counter_{"chars":0,"max":500}',
        );
        await expect(welcome.locator("#room-setting-welcome")).toHaveValue("");
      });

      test("show recording settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await expect(
          page.getByText("rooms.settings.recordings.title"),
        ).toBeVisible();

        for (const [id, text] of [
          ["record_attendance", "record_attendance"],
          ["record", "record_video_conference"],
          ["auto_start_recording", "auto_start_recording"],
        ]) {
          const setting = page.getByTestId(`room-setting-${id}`);
          await expect(setting).toContainText(
            `rooms.settings.recordings.${text}`,
          );
          await expect(
            setting.locator(`#room-setting-${id}`),
          ).not.toBeChecked();
          await expect(setting.locator(`#room-setting-${id}`)).toBeEnabled();
          await expect(
            setting.getByTestId("room-setting-enforced-icon"),
          ).toHaveCount(0);
        }
      });

      test("show restriction settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await expect(
          page.getByText("rooms.settings.restrictions.title"),
        ).toBeVisible();

        for (const [id, checked, enforced] of [
          ["lock_settings_disable_cam", false, false],
          ["webcams_only_for_moderator", true, false],
          ["lock_settings_disable_mic", false, true],
          ["lock_settings_disable_public_chat", true, false],
          ["lock_settings_disable_private_chat", false, false],
          ["lock_settings_disable_note", true, true],
          ["lock_settings_hide_user_list", true, false],
        ]) {
          const setting = page.getByTestId(`room-setting-${id}`);
          await expect(setting).toContainText(
            `rooms.settings.restrictions.${id}`,
          );
          await expect(setting.locator(`#room-setting-${id}`)).toBeChecked({
            checked,
          });
          await expect(setting.locator(`#room-setting-${id}`)).toBeEnabled({
            enabled: !enforced,
          });
          await expect(
            setting.getByTestId("room-setting-enforced-icon"),
          ).toHaveCount(enforced ? 1 : 0);
        }
      });

      test("show participant settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await expect(
          page.getByText("rooms.settings.participants.title"),
        ).toBeVisible();

        const allowMembership = page.getByTestId(
          "room-setting-allow_membership",
        );
        await expect(allowMembership).toContainText(
          "rooms.settings.participants.allow_membership",
        );
        await expect(
          allowMembership.locator("#room-setting-allow_membership"),
        ).not.toBeChecked();
        await expect(
          allowMembership.locator("#room-setting-allow_membership"),
        ).toBeDisabled();
        await expect(
          allowMembership.getByTestId("room-setting-enforced-icon"),
        ).toHaveCount(1);

        const defaultRole = page.getByTestId("room-setting-default_role");
        await expect(defaultRole).toBeVisible();
        await expect(defaultRole).toContainText(
          "rooms.settings.participants.default_role.title",
        );
        await expect(defaultRole).toContainText(
          "rooms.settings.participants.default_role.only_logged_in",
        );
        await expect(
          defaultRole.getByTestId("room-setting-enforced-icon"),
        ).toHaveCount(0);
        const roleButtons = page.getByTestId(
          "room-setting-default_role-button",
        );
        await expect(roleButtons).toHaveText([
          "rooms.roles.participant",
          "rooms.roles.moderator",
        ]);
        await expect(roleButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(roleButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
      });

      test("show advanced settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await expect(
          page.getByText("rooms.settings.advanced.title"),
        ).toBeVisible();

        const visibility = page.getByTestId("room-setting-visibility");
        await expect(visibility).toBeVisible();
        await expect(visibility).toContainText(
          "rooms.settings.advanced.visibility.title",
        );
        await expect(
          visibility.getByTestId("room-setting-enforced-icon"),
        ).toHaveCount(0);
        const visibilityButtons = page.getByTestId(
          "room-setting-visibility-button",
        );
        await expect(visibilityButtons).toHaveText([
          "rooms.settings.advanced.visibility.private",
          "rooms.settings.advanced.visibility.public",
        ]);
        await expect(visibilityButtons.nth(0)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await expect(visibilityButtons.nth(1)).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });
    });
  });

  test.describe("load settings errors", () => {
    test("show error and keep buttons disabled on server error", async ({
      page,
    }) => {
      await mockApiRequest(
        page,
        "GET",
        "rooms/abc-def-123/settings",
        serverError(),
      );

      await page.goto("/rooms/abc-def-123#tab=settings");

      await expect(page.getByTestId("overlay")).toBeVisible();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await expect(page.getByTestId("room-delete-button")).toBeDisabled();
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("room-settings-save-button"),
      ).toBeDisabled();

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
    });

    test("handle auth errors", async ({ page }) => {
      await checkRoomAuthErrorsLoadingTab(
        page,
        "GET",
        "api/v1/rooms/abc-def-123/settings",
        "settings",
      );
    });

    test("redirect to room index if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockApiRequest(
        page,
        "GET",
        "rooms/abc-def-123/settings",
        modelNotFound("room", ["abc-def-123"]),
      );

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-settings").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("load settings with different permissions", () => {
    test("as co-owner", async ({ page, roomResponse }) => {
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      roomResponse.data.is_co_owner = true;

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toHaveText("rooms.settings.expert_mode.deactivate");
      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("room-delete-button")).toHaveCount(0);
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-settings-save-button")).toHaveText(
        "app.save",
      );
      await expect(page.getByTestId("room-settings-save-button")).toBeEnabled();

      await expect(page.getByTestId("room-type-change-button")).toBeEnabled();
      await expect(
        page.getByTestId("generate-access-code-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("clear-access-code-button")).toBeEnabled();

      // General settings
      for (const [id, value] of [
        ["room_type", "Meeting"],
        ["name", "Meeting One"],
        ["access_code", "123456789"],
        ["welcome", "Welcome message"],
      ]) {
        await expect(page.locator(`#room-setting-${id}`)).toHaveValue(value);
        await expect(page.locator(`#room-setting-${id}`)).toBeEnabled();
      }

      // Checkboxes, the ones that are enforced by the room type are disabled
      for (const [id, checked, enforced] of [
        ["allow_guests", true, true],
        ["everyone_can_start", false, false],
        ["mute_on_start", true, true],
        ["record_attendance", false, false],
        ["record", false, false],
        ["auto_start_recording", false, false],
        ["lock_settings_disable_cam", false, false],
        ["webcams_only_for_moderator", true, false],
        ["lock_settings_disable_mic", false, true],
        ["lock_settings_disable_public_chat", true, false],
        ["lock_settings_disable_private_chat", false, false],
        ["lock_settings_disable_note", true, true],
        ["lock_settings_hide_user_list", true, false],
        ["allow_membership", false, true],
      ]) {
        await expect(page.getByTestId(`room-setting-${id}`)).toBeVisible();
        await expect(page.locator(`#room-setting-${id}`)).toBeChecked({
          checked,
        });
        await expect(page.locator(`#room-setting-${id}`)).toBeEnabled({
          enabled: !enforced,
        });
      }
      for (const [index, checked] of [false, false, true].entries()) {
        await expect(page.locator(`#room-setting-lobby-${index}`)).toBeChecked({
          checked,
        });
        await expect(
          page.locator(`#room-setting-lobby-${index}`),
        ).toBeDisabled();
      }

      // Toggle buttons
      const roleButtons = page.getByTestId("room-setting-default_role-button");
      await expect(roleButtons).toHaveText([
        "rooms.roles.participant",
        "rooms.roles.moderator",
      ]);
      await expect(roleButtons.nth(0)).toHaveAttribute("aria-pressed", "true");
      await expect(roleButtons.nth(1)).toHaveAttribute("aria-pressed", "false");
      await expect(roleButtons.nth(0)).toBeEnabled();
      await expect(roleButtons.nth(1)).toBeEnabled();

      const visibilityButtons = page.getByTestId(
        "room-setting-visibility-button",
      );
      await expect(visibilityButtons).toHaveText([
        "rooms.settings.advanced.visibility.private",
        "rooms.settings.advanced.visibility.public",
      ]);
      await expect(visibilityButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeEnabled();
      await expect(visibilityButtons.nth(1)).toBeEnabled();
    });

    test("with rooms.viewAll permission", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = ["rooms.viewAll"];

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-delete-button")).toHaveCount(0);
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-settings-save-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-type-change-button")).toHaveCount(0);
      await expect(page.getByTestId("generate-access-code-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("clear-access-code-button")).toHaveCount(0);

      // General settings
      for (const [id, value] of [
        ["room_type", "Meeting"],
        ["name", "Meeting One"],
        ["access_code", "123456789"],
        ["welcome", "Welcome message"],
      ]) {
        await expect(page.locator(`#room-setting-${id}`)).toHaveValue(value);
        await expect(page.locator(`#room-setting-${id}`)).toBeDisabled();
      }

      // Checkboxes, all are disabled
      for (const [id, checked] of [
        ["allow_guests", true],
        ["everyone_can_start", false],
        ["mute_on_start", true],
        ["record_attendance", false],
        ["record", false],
        ["auto_start_recording", false],
        ["lock_settings_disable_cam", false],
        ["webcams_only_for_moderator", true],
        ["lock_settings_disable_mic", false],
        ["lock_settings_disable_public_chat", true],
        ["lock_settings_disable_private_chat", false],
        ["lock_settings_disable_note", true],
        ["lock_settings_hide_user_list", true],
        ["allow_membership", false],
      ]) {
        await expect(page.getByTestId(`room-setting-${id}`)).toBeVisible();
        await expect(page.locator(`#room-setting-${id}`)).toBeChecked({
          checked,
        });
        await expect(page.locator(`#room-setting-${id}`)).toBeDisabled();
      }
      for (const [index, checked] of [false, false, true].entries()) {
        await expect(page.locator(`#room-setting-lobby-${index}`)).toBeChecked({
          checked,
        });
        await expect(
          page.locator(`#room-setting-lobby-${index}`),
        ).toBeDisabled();
      }

      // Toggle buttons
      const roleButtons = page.getByTestId("room-setting-default_role-button");
      await expect(roleButtons).toHaveText([
        "rooms.roles.participant",
        "rooms.roles.moderator",
      ]);
      await expect(roleButtons.nth(0)).toHaveAttribute("aria-pressed", "true");
      await expect(roleButtons.nth(1)).toHaveAttribute("aria-pressed", "false");
      await expect(roleButtons.nth(0)).toBeDisabled();
      await expect(roleButtons.nth(1)).toBeDisabled();

      const visibilityButtons = page.getByTestId(
        "room-setting-visibility-button",
      );
      await expect(visibilityButtons).toHaveText([
        "rooms.settings.advanced.visibility.private",
        "rooms.settings.advanced.visibility.public",
      ]);
      await expect(visibilityButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeDisabled();
      await expect(visibilityButtons.nth(1)).toBeDisabled();
    });

    test("with rooms.manage permission", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUserResponse.data.permissions = permissions;
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = permissions;

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toHaveText("rooms.settings.expert_mode.deactivate");
      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("room-delete-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("room-settings-save-button")).toHaveText(
        "app.save",
      );
      await expect(page.getByTestId("room-settings-save-button")).toBeEnabled();

      await expect(page.getByTestId("room-type-change-button")).toBeEnabled();
      await expect(
        page.getByTestId("generate-access-code-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("clear-access-code-button")).toBeEnabled();

      // General settings
      for (const [id, value] of [
        ["room_type", "Meeting"],
        ["name", "Meeting One"],
        ["access_code", "123456789"],
        ["welcome", "Welcome message"],
      ]) {
        await expect(page.locator(`#room-setting-${id}`)).toHaveValue(value);
        await expect(page.locator(`#room-setting-${id}`)).toBeEnabled();
      }

      // Checkboxes, the ones that are enforced by the room type are disabled
      for (const [id, checked, enforced] of [
        ["allow_guests", true, true],
        ["everyone_can_start", false, false],
        ["mute_on_start", true, true],
        ["record_attendance", false, false],
        ["record", false, false],
        ["auto_start_recording", false, false],
        ["lock_settings_disable_cam", false, false],
        ["webcams_only_for_moderator", true, false],
        ["lock_settings_disable_mic", false, true],
        ["lock_settings_disable_public_chat", true, false],
        ["lock_settings_disable_private_chat", false, false],
        ["lock_settings_disable_note", true, true],
        ["lock_settings_hide_user_list", true, false],
        ["allow_membership", false, true],
      ]) {
        await expect(page.getByTestId(`room-setting-${id}`)).toBeVisible();
        await expect(page.locator(`#room-setting-${id}`)).toBeChecked({
          checked,
        });
        await expect(page.locator(`#room-setting-${id}`)).toBeEnabled({
          enabled: !enforced,
        });
      }
      for (const [index, checked] of [false, false, true].entries()) {
        await expect(page.locator(`#room-setting-lobby-${index}`)).toBeChecked({
          checked,
        });
        await expect(
          page.locator(`#room-setting-lobby-${index}`),
        ).toBeDisabled();
      }

      // Toggle buttons
      const roleButtons = page.getByTestId("room-setting-default_role-button");
      await expect(roleButtons).toHaveText([
        "rooms.roles.participant",
        "rooms.roles.moderator",
      ]);
      await expect(roleButtons.nth(0)).toHaveAttribute("aria-pressed", "true");
      await expect(roleButtons.nth(1)).toHaveAttribute("aria-pressed", "false");
      await expect(roleButtons.nth(0)).toBeEnabled();
      await expect(roleButtons.nth(1)).toBeEnabled();

      const visibilityButtons = page.getByTestId(
        "room-setting-visibility-button",
      );
      await expect(visibilityButtons).toHaveText([
        "rooms.settings.advanced.visibility.private",
        "rooms.settings.advanced.visibility.public",
      ]);
      await expect(visibilityButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(0)).toBeEnabled();
      await expect(visibilityButtons.nth(1)).toBeEnabled();
    });
  });

  test.describe("change settings", () => {
    test.beforeEach(async ({ roomSettingsResponse }) => {
      roomSettingsResponse.data.room_type = readFixture(
        "roomTypesWithSettings.json",
      ).data[0];
    });

    test("show unsaved changes message after changing a setting", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toHaveCount(0);

      await page.locator("#room-setting-name").clear();
      await page.locator("#room-setting-name").fill("Meeting Two");

      const message = page.getByTestId("room-unsaved-changes-message");
      await expect(message).toBeVisible();
      await expect(message).toContainText("rooms.settings.unsaved_changes");
    });

    test("show save button inside the unsaved changes message if the save button is out of view", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await page.locator("#room-setting-name").fill("Meeting Two");
      await page.evaluate(() => window.scrollTo(0, 0));

      const saveButton = page
        .getByTestId("room-unsaved-changes-message")
        .getByTestId("room-unsaved-changes-save-button");
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toHaveText("app.save");
    });

    test("change access code", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      const accessCode = page.locator("#room-setting-access_code");
      await page.getByTestId("clear-access-code-button").click();
      await expect(accessCode).toHaveValue("");
      await expect(accessCode).toHaveAttribute(
        "placeholder",
        "rooms.settings.general.unprotected_placeholder",
      );
      await expect(page.getByTestId("clear-access-code-button")).toHaveCount(0);

      await page.getByTestId("generate-access-code-button").click();
      await expect(accessCode).not.toHaveValue("");
      await expect(page.getByTestId("clear-access-code-button")).toBeVisible();
    });

    test("expert mode toggle resets expert settings to the room type defaults", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      // Change general settings
      await page.locator("#room-setting-name").fill("Meeting Two");
      await page.getByTestId("clear-access-code-button").click();
      await page.getByTestId("generate-access-code-button").click();
      await expect(page.locator("#room-setting-access_code")).not.toHaveValue(
        "",
      );
      const newAccessCode = await page
        .locator("#room-setting-access_code")
        .inputValue();
      await page.locator("#room-setting-allow_guests").click();
      await page
        .locator("#room-setting-short_description")
        .fill("Short description two");

      // Change all expert settings that are not enforced by the room type
      await page.locator("#room-setting-everyone_can_start").click();
      await page.locator("#room-setting-mute_on_start").click();
      await page.locator("#room-setting-lobby-0").click();
      await page.locator("#room-setting-welcome").fill("Welcome message");
      await page.locator("#room-setting-record_attendance").click();
      await page.locator("#room-setting-record").click();
      await page.locator("#room-setting-auto_start_recording").click();
      await page.locator("#room-setting-lock_settings_disable_cam").click();
      await page.locator("#room-setting-webcams_only_for_moderator").click();
      await page.locator("#room-setting-lock_settings_disable_mic").click();
      await page
        .locator("#room-setting-lock_settings_disable_public_chat")
        .click();
      await page
        .locator("#room-setting-lock_settings_disable_private_chat")
        .click();
      await page.locator("#room-setting-lock_settings_disable_note").click();
      await page.locator("#room-setting-lock_settings_hide_user_list").click();
      await page.locator("#room-setting-allow_membership").click();
      await page.getByTestId("room-setting-default_role-button").nth(1).click();
      await page.getByTestId("room-setting-visibility-button").nth(0).click();

      // Deactivate expert mode and activate again
      const expertModeDialog = page.getByTestId(
        "room-settings-expert-mode-dialog",
      );
      await page.getByTestId("room-settings-expert-mode-button").click();
      await expect(expertModeDialog).toBeVisible();
      await expertModeDialog.getByTestId("dialog-continue-button").click();
      await expect(expertModeDialog).toBeHidden();
      await page.getByTestId("room-settings-expert-mode-button").click();
      await expect(expertModeDialog).toBeVisible();
      await expertModeDialog.getByTestId("dialog-continue-button").click();
      await expect(expertModeDialog).toBeHidden();

      // General settings are kept
      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting Two",
      );
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        newAccessCode,
      );
      await expect(
        page.locator("#room-setting-allow_guests"),
      ).not.toBeChecked();
      await expect(page.locator("#room-setting-short_description")).toHaveValue(
        "Short description two",
      );

      // Expert settings are reset to the defaults
      for (const [id, checked] of [
        ["everyone_can_start", false],
        ["mute_on_start", true],
        ["record_attendance", false],
        ["record", false],
        ["auto_start_recording", false],
        ["lock_settings_disable_cam", false],
        ["webcams_only_for_moderator", true],
        ["lock_settings_disable_mic", false],
        ["lock_settings_disable_public_chat", true],
        ["lock_settings_disable_private_chat", false],
        ["lock_settings_disable_note", true],
        ["lock_settings_hide_user_list", true],
        ["allow_membership", false],
      ]) {
        await expect(page.locator(`#room-setting-${id}`)).toBeChecked({
          checked,
        });
      }
      await expect(page.locator("#room-setting-lobby-0")).not.toBeChecked();
      await expect(page.locator("#room-setting-lobby-2")).toBeChecked();
      await expect(page.locator("#room-setting-welcome")).toHaveValue("");
      await expect(
        page.getByTestId("room-setting-default_role-button").nth(0),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByTestId("room-setting-default_role-button").nth(1),
      ).toHaveAttribute("aria-pressed", "false");
      await expect(
        page.getByTestId("room-setting-visibility-button").nth(1),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByTestId("room-setting-visibility-button").nth(0),
      ).toHaveAttribute("aria-pressed", "false");
    });

    test("save changed settings", async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await page.locator("#room-setting-name").fill("Meeting Two");
      await page.getByTestId("clear-access-code-button").click();
      await page.getByTestId("generate-access-code-button").click();
      await expect(page.locator("#room-setting-access_code")).not.toHaveValue(
        "",
      );
      const newAccessCode = await page
        .locator("#room-setting-access_code")
        .inputValue();
      await page.locator("#room-setting-allow_guests").click();
      await page
        .locator("#room-setting-short_description")
        .fill("Short description two");

      // Change all expert settings that are not enforced by the room type
      await page.locator("#room-setting-everyone_can_start").click();
      await page.locator("#room-setting-mute_on_start").click();
      await page.locator("#room-setting-lobby-0").click();
      await page.locator("#room-setting-welcome").fill("Welcome message");
      await page.locator("#room-setting-record_attendance").click();
      await page.locator("#room-setting-record").click();
      await page.locator("#room-setting-auto_start_recording").click();
      await page.locator("#room-setting-lock_settings_disable_cam").click();
      await page.locator("#room-setting-webcams_only_for_moderator").click();
      await page.locator("#room-setting-lock_settings_disable_mic").click();
      await page
        .locator("#room-setting-lock_settings_disable_public_chat")
        .click();
      await page
        .locator("#room-setting-lock_settings_disable_private_chat")
        .click();
      await page.locator("#room-setting-lock_settings_disable_note").click();
      await page.locator("#room-setting-lock_settings_hide_user_list").click();
      await page.locator("#room-setting-allow_membership").click();
      await page.getByTestId("room-setting-default_role-button").nth(1).click();
      await page.getByTestId("room-setting-visibility-button").nth(0).click();

      const savedSettings = readFixture("roomSettings.json");
      Object.assign(savedSettings.data, {
        name: "Meeting Two",
        access_code: newAccessCode,
        allow_guests: false,
        short_description: "Short description two",
        everyone_can_start: true,
        mute_on_start: false,
        record_attendance: true,
        record: true,
        auto_start_recording: true,
        lobby: 0,
        lock_settings_disable_cam: true,
        webcams_only_for_moderator: false,
        lock_settings_disable_mic: true,
        lock_settings_disable_public_chat: false,
        lock_settings_disable_private_chat: true,
        lock_settings_disable_note: false,
        lock_settings_hide_user_list: false,
        allow_membership: true,
        default_role: 2,
        visibility: 0,
        room_type: readFixture("roomTypesWithSettings.json").data[0],
      });
      const putRoomApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123",
        {
          json: savedSettings,
        },
      );

      await page.getByTestId("room-settings-save-button").click();

      await expect(putRoomApiMock).toHaveReceivedRequest({
        json: {
          name: "Meeting Two",
          expert_mode: true,
          access_code: newAccessCode,
          allow_guests: false,
          short_description: "Short description two",
          everyone_can_start: true,
          mute_on_start: false,
          record_attendance: true,
          record: true,
          auto_start_recording: true,
          lobby: 0,
          lock_settings_disable_cam: true,
          webcams_only_for_moderator: false,
          lock_settings_disable_mic: true,
          lock_settings_disable_public_chat: false,
          lock_settings_disable_private_chat: true,
          lock_settings_disable_note: false,
          lock_settings_hide_user_list: false,
          allow_membership: true,
          default_role: 2,
          visibility: 0,
          room_type: 1,
          welcome: "Welcome message",
        },
      });

      // Check that settings are shown correctly
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting Two",
      );
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        newAccessCode,
      );
      await expect(
        page.locator("#room-setting-allow_guests"),
      ).not.toBeChecked();
      await expect(page.locator("#room-setting-short_description")).toHaveValue(
        "Short description two",
      );
      for (const [id, checked] of [
        ["everyone_can_start", true],
        ["mute_on_start", false],
        ["record_attendance", true],
        ["record", true],
        ["auto_start_recording", true],
        ["lock_settings_disable_cam", true],
        ["webcams_only_for_moderator", false],
        ["lock_settings_disable_mic", true],
        ["lock_settings_disable_public_chat", false],
        ["lock_settings_disable_private_chat", true],
        ["lock_settings_disable_note", false],
        ["lock_settings_hide_user_list", false],
        ["allow_membership", true],
      ]) {
        await expect(page.locator(`#room-setting-${id}`)).toBeChecked({
          checked,
        });
      }
      await expect(page.locator("#room-setting-lobby-0")).toBeChecked();
      await expect(page.locator("#room-setting-welcome")).toHaveValue(
        "Welcome message",
      );
      await expect(
        page.getByTestId("room-setting-default_role-button").nth(1),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByTestId("room-setting-visibility-button").nth(0),
      ).toHaveAttribute("aria-pressed", "true");
    });

    test("show loading state while saving using the unsaved changes message", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await page.locator("#room-setting-name").fill("Meeting Two");
      await page.evaluate(() => window.scrollTo(0, 0));

      const savedSettings = readFixture("roomSettings.json");
      savedSettings.data.name = "Meeting Two";
      savedSettings.data.room_type = readFixture(
        "roomTypesWithSettings.json",
      ).data[0];
      const putRoomApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123",
        {
          json: savedSettings,
          hold: true,
        },
      );

      await page
        .getByTestId("room-unsaved-changes-message")
        .getByTestId("room-unsaved-changes-save-button")
        .click();

      // Check that overlay is shown and buttons are disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(
        page.getByTestId("room-unsaved-changes-save-button"),
      ).toBeDisabled();
      await expect(page.getByTestId("room-delete-button")).toBeDisabled();
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("room-settings-save-button"),
      ).toBeDisabled();

      putRoomApiMock.release();

      // Check that overlay and message are hidden and buttons are enabled
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-delete-button")).toBeEnabled();
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toBeEnabled();
      await expect(
        page.getByTestId("room-settings-expert-mode-button"),
      ).toBeEnabled();
      await expect(page.getByTestId("room-settings-save-button")).toBeEnabled();
      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting Two",
      );
    });

    test.describe("without expert mode", () => {
      test.beforeEach(async ({ page, roomSettingsResponse }) => {
        roomSettingsResponse.data.allow_guests = false;

        await page.goto("/rooms/abc-def-123#tab=settings");
        await expect(page.getByTestId("overlay")).toHaveCount(0);
        await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);
      });

      test("hide save button inside the unsaved changes message if the save button is visible", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await page.locator("#room-setting-name").fill("Meeting Three");

        const message = page.getByTestId("room-unsaved-changes-message");
        await expect(message).toBeVisible();
        await expect(
          message.getByTestId("room-unsaved-changes-save-button"),
        ).toHaveCount(0);
      });

      test("save settings with deactivated expert mode", async ({ page }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        const expertModeDialog = page.getByTestId(
          "room-settings-expert-mode-dialog",
        );
        await expect(expertModeDialog).toBeVisible();
        await expertModeDialog.getByTestId("dialog-continue-button").click();
        await expect(expertModeDialog).toBeHidden();

        await page.locator("#room-setting-name").fill("Meeting Three");
        await page.getByTestId("clear-access-code-button").click();
        await expect(page.locator("#room-setting-access_code")).toHaveValue("");
        await page.locator("#room-setting-allow_guests").click();
        await page.locator("#room-setting-short_description").clear();

        const savedSettings = readFixture("roomSettings.json");
        Object.assign(savedSettings.data, {
          name: "Meeting Three",
          expert_mode: false,
          welcome: "",
          access_code: null,
          allow_guests: true,
          short_description: null,
          room_type: readFixture("roomTypesWithSettings.json").data[0],
        });
        const putRoomApiMock = await mockApiRequest(
          page,
          "PUT",
          "rooms/abc-def-123",
          { json: savedSettings },
        );

        await page.getByTestId("room-settings-save-button").click();

        await expect(putRoomApiMock).toHaveReceivedRequest({
          json: {
            name: "Meeting Three",
            expert_mode: false,
            access_code: null,
            allow_guests: true,
            short_description: "",
            everyone_can_start: false,
            mute_on_start: true,
            record_attendance: false,
            record: false,
            auto_start_recording: false,
            lobby: 2,
            lock_settings_disable_cam: false,
            webcams_only_for_moderator: true,
            lock_settings_disable_mic: false,
            lock_settings_disable_public_chat: true,
            lock_settings_disable_private_chat: false,
            lock_settings_disable_note: true,
            lock_settings_hide_user_list: true,
            allow_membership: false,
            default_role: 1,
            visibility: 1,
            room_type: 1,
            welcome: "",
          },
        });

        await expect(page.locator("#room-setting-name")).toHaveValue(
          "Meeting Three",
        );
        await expect(page.locator("#room-setting-access_code")).toHaveValue("");
        await expect(page.locator("#room-setting-allow_guests")).toBeChecked();
        await expect(
          page.getByTestId("room-settings-expert-mode-button"),
        ).toHaveText("rooms.settings.expert_mode.activate");
      });
    });

    test("save settings with GL3 access code", async ({
      page,
      roomSettingsResponse,
    }) => {
      roomSettingsResponse.data.room_type =
        readFixture("roomSettings.json").data.room_type;
      roomSettingsResponse.data.access_code = "012abc";

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "012abc",
      );
      await expect(page.locator("#room-setting-access_code")).toBeEnabled();

      await page.locator("#room-setting-name").fill("Meeting Two");

      const savedSettings = readFixture("roomSettings.json");
      savedSettings.data.name = "Meeting Two";
      savedSettings.data.access_code = "012abc";
      const putRoomApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123",
        {
          json: savedSettings,
        },
      );

      await page.getByTestId("room-settings-save-button").click();

      await expect(putRoomApiMock).toHaveReceivedRequest({
        json: {
          name: "Meeting Two",
          expert_mode: true,
          welcome: "Welcome message",
          short_description: "Short description",
          access_code: "012abc",
          room_type: 2,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_hide_user_list: true,
          everyone_can_start: false,
          allow_membership: false,
          allow_guests: true,
          default_role: 1,
          lobby: 2,
          visibility: 1,
          record_attendance: false,
          record: false,
          auto_start_recording: false,
        },
      });

      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting Two",
      );
    });
  });

  test.describe("change settings errors", () => {
    test.beforeEach(async ({ page, roomSettingsResponse }) => {
      roomSettingsResponse.data.room_type = readFixture(
        "roomTypesWithSettings.json",
      ).data[0];
      roomSettingsResponse.data.room_type.has_access_code_enforced = true;
      roomSettingsResponse.data.access_code = null;

      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);
    });

    test("show access code as enforced", async ({ page }) => {
      const accessCode = page.getByTestId("room-setting-access_code");
      await expect(accessCode).toBeVisible();
      await expect(accessCode).toContainText("rooms.access_code");
      await expect(accessCode).toContainText(
        "rooms.settings.general.access_code_enforced",
      );
      await expect(
        accessCode.getByTestId("room-setting-enforced-icon"),
      ).toBeVisible();
      await expect(accessCode.locator("#room-setting-access_code")).toHaveValue(
        "",
      );

      await expect(
        accessCode.getByTestId("clear-access-code-button"),
      ).toHaveCount(0);
      await expect(
        accessCode.getByTestId("generate-access-code-button"),
      ).toBeVisible();
    });

    test("show 422 errors with expert mode", async ({ page }) => {
      const roomSettingsValidationErrorsResponse = {
        access_code: [
          "The room requires an access code because of its room type.",
        ],
        welcome: [
          "The Welcome message may not be greater than 250 characters.",
        ],
        everyone_can_start: ["The Everyone can start field is required."],
        mute_on_start: ["The Mute on start field is required."],
        record_attendance: ["The Record attendance field is required."],
        record: ["The Record field is required."],
        auto_start_recording: ["The Auto start recording field is required."],
        lobby: ["The Lobby field is required."],
        lock_settings_disable_cam: ["The Disable cam field is required."],
        webcams_only_for_moderator: [
          "The Webcams only for moderator field is required.",
        ],
        lock_settings_disable_mic: ["The Disable mic field is required."],
        lock_settings_disable_public_chat: [
          "The Disable public chat field is required.",
        ],
        lock_settings_disable_private_chat: [
          "The Disable private chat field is required.",
        ],
        lock_settings_disable_note: ["The Disable note field is required."],
        lock_settings_hide_user_list: ["The Hide user list field is required."],
        allow_membership: ["The Allow membership field is required."],
        default_role: ["The Default role field is required."],
        visibility: ["The Visibility field is required."],
      };
      await mockApiRequest(page, "PUT", "rooms/abc-def-123", {
        status: 422,
        json: {
          message:
            "The room requires an access code because of its room type. (and 17 more errors)",
          errors: roomSettingsValidationErrorsResponse,
        },
      });

      await page.getByTestId("room-settings-save-button").click();

      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 17 more errors)",
      );
      for (const [field, messages] of Object.entries(
        roomSettingsValidationErrorsResponse,
      )) {
        await expect(page.getByTestId(`room-setting-${field}`)).toContainText(
          messages[0].trim(),
        );
      }
    });

    test("show 422 errors without expert mode", async ({ page }) => {
      await page.getByTestId("room-settings-expert-mode-button").click();
      const expertModeDialog = page.getByTestId(
        "room-settings-expert-mode-dialog",
      );
      await expect(expertModeDialog).toBeVisible();
      await expertModeDialog.getByTestId("dialog-continue-button").click();
      await expect(expertModeDialog).toBeHidden();

      const roomSettingsValidationErrorsResponse = {
        access_code: [
          "The room requires an access code because of its room type.",
        ],
        room_type: ["The room type is invalid."],
        name: ["The Name may not be greater than 50 characters. "],
        short_description: [
          "The Short description may not be greater than 300 characters.",
        ],
        allow_guests: ["The Allow guests field is required."],
      };
      await mockApiRequest(page, "PUT", "rooms/abc-def-123", {
        status: 422,
        json: {
          message:
            "The room requires an access code because of its room type. (and 4 more errors)",
          errors: roomSettingsValidationErrorsResponse,
        },
      });

      await page.getByTestId("room-settings-save-button").click();

      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 4 more errors)",
      );
      for (const [field, messages] of Object.entries(
        roomSettingsValidationErrorsResponse,
      )) {
        await expect(page.getByTestId(`room-setting-${field}`)).toContainText(
          messages[0].trim(),
        );
      }
    });

    test("hide 422 errors and show access code as prohibited after successful save", async ({
      page,
    }) => {
      const roomSettingsValidationErrorsResponse = {
        access_code: [
          "The room requires an access code because of its room type.",
        ],
        welcome: [
          "The Welcome message may not be greater than 250 characters.",
        ],
        everyone_can_start: ["The Everyone can start field is required."],
        mute_on_start: ["The Mute on start field is required."],
        record_attendance: ["The Record attendance field is required."],
        record: ["The Record field is required."],
        auto_start_recording: ["The Auto start recording field is required."],
        lobby: ["The Lobby field is required."],
        lock_settings_disable_cam: ["The Disable cam field is required."],
        webcams_only_for_moderator: [
          "The Webcams only for moderator field is required.",
        ],
        lock_settings_disable_mic: ["The Disable mic field is required."],
        lock_settings_disable_public_chat: [
          "The Disable public chat field is required.",
        ],
        lock_settings_disable_private_chat: [
          "The Disable private chat field is required.",
        ],
        lock_settings_disable_note: ["The Disable note field is required."],
        lock_settings_hide_user_list: ["The Hide user list field is required."],
        allow_membership: ["The Allow membership field is required."],
        default_role: ["The Default role field is required."],
        visibility: ["The Visibility field is required."],
      };
      await mockApiRequest(page, "PUT", "rooms/abc-def-123", {
        status: 422,
        json: {
          message:
            "The room requires an access code because of its room type. (and 17 more errors)",
          errors: roomSettingsValidationErrorsResponse,
        },
      });
      await page.getByTestId("room-settings-save-button").click();
      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 17 more errors)",
      );
      for (const [field, messages] of Object.entries(
        roomSettingsValidationErrorsResponse,
      )) {
        await expect(page.getByTestId(`room-setting-${field}`)).toContainText(
          messages[0].trim(),
        );
      }

      // Generate new access code
      await page.getByTestId("generate-access-code-button").click();

      // Save settings without error
      const savedSettings = readFixture("roomSettings.json");
      savedSettings.data.welcome = "";
      savedSettings.data.room_type = readFixture(
        "roomTypesWithSettings.json",
      ).data[0];
      savedSettings.data.room_type.has_access_code_enforced = true;
      savedSettings.data.room_type.has_access_code_default = false;
      await mockApiRequest(page, "PUT", "rooms/abc-def-123", {
        json: savedSettings,
      });

      await page.getByTestId("room-settings-save-button").click();

      // Check that access code is shown correctly
      const accessCode = page.getByTestId("room-setting-access_code");
      await expect(accessCode).toContainText(
        "rooms.settings.general.access_code_prohibited",
      );
      await expect(accessCode).toContainText("rooms.access_code");
      await expect(accessCode).not.toContainText(
        "The room requires an access code because of its room type.",
      );
      await expect(
        accessCode.getByTestId("room-setting-enforced-icon"),
      ).toBeVisible();
      await expect(accessCode.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
      await expect(
        accessCode.getByTestId("clear-access-code-button"),
      ).toBeVisible();
      await expect(
        accessCode.getByTestId("generate-access-code-button"),
      ).toHaveCount(0);

      await accessCode.getByTestId("clear-access-code-button").click();
      await expect(accessCode.locator("#room-setting-access_code")).toHaveValue(
        "",
      );
      await expect(
        accessCode.getByTestId("clear-access-code-button"),
      ).toHaveCount(0);
      await expect(
        accessCode.getByTestId("generate-access-code-button"),
      ).toHaveCount(0);

      // Check that 422 error messages are hidden
      for (const [field, messages] of Object.entries(
        roomSettingsValidationErrorsResponse,
      )) {
        await expect(
          page.getByTestId(`room-setting-${field}`),
        ).not.toContainText(messages[0].trim());
      }
    });

    test("hide 422 errors after a server error", async ({ page }) => {
      await page.getByTestId("room-settings-expert-mode-button").click();
      const expertModeDialog = page.getByTestId(
        "room-settings-expert-mode-dialog",
      );
      await expect(expertModeDialog).toBeVisible();
      await expertModeDialog.getByTestId("dialog-continue-button").click();
      await expect(expertModeDialog).toBeHidden();

      const roomSettingsValidationErrorsResponse = {
        access_code: [
          "The room requires an access code because of its room type.",
        ],
        room_type: ["The room type is invalid."],
        name: ["The Name may not be greater than 50 characters. "],
        short_description: [
          "The Short description may not be greater than 300 characters.",
        ],
        allow_guests: ["The Allow guests field is required."],
      };
      await mockApiRequest(page, "PUT", "rooms/abc-def-123", {
        status: 422,
        json: {
          message:
            "The room requires an access code because of its room type. (and 4 more errors)",
          errors: roomSettingsValidationErrorsResponse,
        },
      });
      await page.getByTestId("room-settings-save-button").click();
      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 4 more errors)",
      );
      for (const [field, messages] of Object.entries(
        roomSettingsValidationErrorsResponse,
      )) {
        await expect(page.getByTestId(`room-setting-${field}`)).toContainText(
          messages[0].trim(),
        );
      }

      await mockApiRequest(page, "PUT", "rooms/abc-def-123", serverError());
      await page.getByTestId("room-settings-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      for (const [field, messages] of Object.entries(
        roomSettingsValidationErrorsResponse,
      )) {
        await expect(
          page.getByTestId(`room-setting-${field}`),
        ).not.toContainText(messages[0].trim());
      }
    });

    test("handle auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-settings-save-button").click();
        },
        "PUT",
        "api/v1/rooms/abc-def-123",
        "settings",
      );
    });

    test("redirect to room index if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123",
        modelNotFound("room", ["abc-def-123"]),
      );

      await page.getByTestId("room-settings-save-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("delete room", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(page.getByTestId("room-delete-dialog")).toHaveCount(0);
      await expect(page.getByTestId("room-delete-button")).toHaveText(
        "rooms.modals.delete.title",
      );
      await page.getByTestId("room-delete-button").click();
      await expect(page.getByTestId("room-delete-dialog")).toBeVisible();
    });

    test("cancel delete", async ({ page }) => {
      const dialog = page.getByTestId("room-delete-dialog");

      const cancelButton = dialog.getByTestId("dialog-cancel-button");
      await expect(cancelButton).toHaveText("app.no");
      await cancelButton.click();
      await expect(dialog).toHaveCount(0);
    });

    test("show confirmation with room name", async ({ page }) => {
      const dialog = page.getByTestId("room-delete-dialog");

      await expect(dialog).toContainText("rooms.modals.delete.title");
      await expect(dialog).toContainText(
        'rooms.modals.delete.confirm_{"name":"Meeting One"}',
      );
    });

    test("delete room", async ({ page }) => {
      const dialog = page.getByTestId("room-delete-dialog");
      await interceptRoomIndexRequests(page);
      const deleteRoomApiMock = await mockApiRequest(
        page,
        "DELETE",
        "rooms/abc-def-123",
        { status: 204, hold: true },
      );

      const continueButton = dialog.getByTestId("dialog-continue-button");
      await expect(continueButton).toHaveText("app.yes");
      await continueButton.click();
      await expect(continueButton).toBeDisabled();

      deleteRoomApiMock.release();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
    });

    test("redirect to room index if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockApiRequest(
        page,
        "DELETE",
        "rooms/abc-def-123",
        modelNotFound("room", ["abc-def-123"]),
      );

      await page
        .getByTestId("room-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });

    test("keep dialog open on server error", async ({ page }) => {
      await mockApiRequest(page, "DELETE", "rooms/abc-def-123", serverError());

      await page
        .getByTestId("room-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("room-delete-dialog")).toBeVisible();
    });

    test("handle auth errors", async ({ page }) => {
      await page.getByTestId("dialog-cancel-button").click();

      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-delete-button").click();
          await expect(page.getByTestId("room-delete-dialog")).toBeVisible();
          await page
            .getByTestId("room-delete-dialog")
            .getByTestId("dialog-continue-button")
            .click();
        },
        "DELETE",
        "api/v1/rooms/abc-def-123",
        "settings",
      );
    });
  });

  test.describe("transfer ownership", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123#tab=settings");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);

      await expect(
        page.getByTestId("room-transfer-ownership-dialog"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toHaveText("rooms.modals.transfer_ownership.title");
    });

    test("open and cancel dialog", async ({ page }) => {
      const dialog = page.getByTestId("room-transfer-ownership-dialog");

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        "rooms.modals.transfer_ownership.title",
      );

      const cancelButton = dialog.getByTestId("dialog-cancel-button");
      await expect(cancelButton).toHaveText("app.cancel");
      await cancelButton.click();
      await expect(dialog).toHaveCount(0);

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();
    });

    test("show too many results while searching", async ({
      page,
      userSearchResponse,
    }) => {
      userSearchResponse.status = 204;
      userSearchResponse.json = undefined;
      const dialog = page.getByTestId("room-transfer-ownership-dialog");
      const dropdown = page.getByTestId("new-owner-dropdown");
      const options = dialog.locator(".multiselect__option");

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();

      // Check autofocus
      await expect(dialog.locator(".multiselect__content")).toBeVisible();

      // Check prompt
      await expect(dropdown).toContainText(
        "rooms.members.modals.add.no_options",
      );

      // Check placeholder and type in input
      const input = dropdown.locator("input");
      await expect(input).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.add.placeholder",
      );
      await input.click();

      const search = page.waitForRequest(
        /\/api\/v1\/users\/search\?query=L(&|$)/,
      );
      await input.pressSequentially("L");
      await search;

      await expect(dialog.locator(".multiselect__content")).toBeVisible();
      await expect(options).toHaveCount(2);
      await expect(options.nth(0)).toContainText(
        "rooms.members.modals.add.too_many_results",
      );
      await expect(options.nth(0)).toBeVisible();
      await expect(options.nth(1)).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(options.nth(1)).toBeHidden();
    });

    test("show search results", async ({ page }) => {
      const dialog = page.getByTestId("room-transfer-ownership-dialog");
      const options = dialog.locator(".multiselect__option");

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();

      const input = page.getByTestId("new-owner-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("L");
      const search = page.waitForRequest(
        /\/api\/v1\/users\/search\?query=Laura(&|$)/,
      );
      await input.pressSequentially("aura");
      await search;

      await expect(dialog.locator(".multiselect__content")).toBeVisible();
      await expect(options).toHaveCount(5);
      await expect(options.nth(0)).toContainText("Laura Rivera");
      await expect(options.nth(0)).toContainText("LauraWRivera@domain.tld");
      await expect(options.nth(0)).toBeVisible();
      await expect(options.nth(1)).toContainText("Laura Walter");
      await expect(options.nth(1)).toContainText("LauraMWalter@domain.tld");
      await expect(options.nth(1)).toBeVisible();
      await expect(options.nth(2)).toContainText("John Doe");
      await expect(options.nth(2)).toContainText("JohnDoe@domain.tld");
      await expect(options.nth(2)).toBeVisible();
      await expect(options.nth(2)).toHaveClass(/multiselect__option--disabled/);
      await expect(options.nth(3)).toContainText(
        "rooms.members.modals.add.no_result",
      );
      await expect(options.nth(3)).toBeHidden();
      await expect(options.nth(4)).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(options.nth(4)).toBeHidden();
    });

    test("show role selection after selecting a new owner", async ({
      page,
    }) => {
      const dialog = page.getByTestId("room-transfer-ownership-dialog");
      const dropdown = page.getByTestId("new-owner-dropdown");

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();
      await dropdown.click();
      const search = page.waitForRequest(
        /\/api\/v1\/users\/search\?query=L(&|$)/,
      );
      await dropdown.locator("input").pressSequentially("L");
      await search;
      await expect(dialog.locator(".multiselect__content")).toBeVisible();
      await dialog.locator(".multiselect__option").nth(1).click();
      await expect(dialog.locator(".multiselect__content")).toHaveCount(0);

      const participant = page.getByTestId("participant-role-group");
      await expect(participant).toContainText("rooms.roles.participant");
      await expect(participant.locator("#participant-role")).not.toBeChecked();

      const moderator = page.getByTestId("moderator-role-group");
      await expect(moderator).toContainText("rooms.roles.moderator");
      await expect(moderator.locator("#moderator-role")).not.toBeChecked();

      const coOwner = page.getByTestId("co-owner-role-group");
      await expect(coOwner).toContainText("rooms.roles.co_owner");
      await expect(coOwner.locator("#co-owner-role")).toBeChecked();

      const noRole = page.getByTestId("no-role-group");
      await expect(noRole).toContainText("rooms.roles.no_role");
      await expect(noRole.locator("#no-role")).not.toBeChecked();

      await page.locator("#participant-role").click();
      await expect(
        page.getByText("rooms.modals.transfer_ownership.warning"),
      ).toBeVisible();
    });

    test("transfer ownership with a role", async ({ page, roomResponse }) => {
      const dialog = page.getByTestId("room-transfer-ownership-dialog");
      const dropdown = page.getByTestId("new-owner-dropdown");

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();
      await dropdown.click();
      const search = page.waitForRequest(
        /\/api\/v1\/users\/search\?query=L(&|$)/,
      );
      await dropdown.locator("input").pressSequentially("L");
      await search;
      await expect(dialog.locator(".multiselect__content")).toBeVisible();
      await dialog.locator(".multiselect__option").nth(1).click();
      await expect(dialog.locator(".multiselect__content")).toHaveCount(0);
      await page.locator("#participant-role").click();

      const postRoomTransferApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/transfer",
        { status: 204, hold: true },
      );
      roomResponse.data.owner = { id: 10, name: "Laura Walter" };
      roomResponse.data.is_member = true;

      await dialog.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(dropdown.locator("input")).toBeDisabled();
      await expect(page.locator("#participant-role")).toBeDisabled();
      await expect(page.locator("#moderator-role")).toBeDisabled();
      await expect(page.locator("#co-owner-role")).toBeDisabled();
      await expect(page.locator("#no-role")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-continue-button")).toBeDisabled();

      postRoomTransferApiMock.release();

      await expect(postRoomTransferApiMock).toHaveReceivedRequest({
        json: {
          user: 10,
          role: 1,
        },
      });

      await expect(page.getByText("Laura Walter")).toBeVisible();
      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123#tab=files"),
      );
    });

    test("transfer ownership without a role", async ({
      page,
      roomResponse,
    }) => {
      const dialog = page.getByTestId("room-transfer-ownership-dialog");
      const dropdown = page.getByTestId("new-owner-dropdown");

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();
      await dropdown.click();
      const search = page.waitForRequest(
        /\/api\/v1\/users\/search\?query=L(&|$)/,
      );
      await dropdown.locator("input").pressSequentially("L");
      await search;
      await expect(dialog.locator(".multiselect__content")).toBeVisible();
      await dialog.locator(".multiselect__option").nth(1).click();
      await expect(dialog.locator(".multiselect__content")).toHaveCount(0);
      await page.locator("#no-role").click();

      const postRoomTransferApiMock = await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/transfer",
        { status: 204 },
      );
      roomResponse.data.owner = { id: 10, name: "Laura Walter" };
      roomResponse.data.authenticated = false;

      await dialog.getByTestId("dialog-continue-button").click();

      await expect(postRoomTransferApiMock).toHaveReceivedRequest({
        json: {
          user: 10,
        },
      });

      await expect(page.getByText("Laura Walter")).toBeVisible();

      // Check that access code overlay is shown
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("show email only hints if search by name is disabled", async ({
      page,
      configResponse,
    }) => {
      const dialog = page.getByTestId("room-transfer-ownership-dialog");
      const dropdown = page.getByTestId("new-owner-dropdown");

      configResponse.data.user.search_by_name = false;
      await page.reload();
      await expect(page.locator("#room-setting-name")).toBeVisible();

      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog).toBeVisible();

      // Check autofocus
      await expect(dialog.locator(".multiselect__content")).toBeVisible();

      // Check prompt
      await expect(dropdown).toContainText(
        "rooms.members.modals.add.no_options_email_only",
      );

      // Check placeholder
      await expect(dropdown.locator("input")).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.add.placeholder_email_only",
      );
    });

    test.describe("errors", () => {
      test("show server error on user search and keep dialog open", async ({
        page,
        userSearchResponse,
      }) => {
        userSearchResponse.status = 500;
        userSearchResponse.json = { message: "Test" };
        const dialog = page.getByTestId("room-transfer-ownership-dialog");
        const dropdown = page.getByTestId("new-owner-dropdown");

        await page.getByTestId("room-transfer-ownership-button").click();
        await expect(dialog).toBeVisible();

        await dropdown.click();
        const search = page.waitForRequest(
          /\/api\/v1\/users\/search\?query=L(&|$)/,
        );
        await dropdown.locator("input").pressSequentially("L");
        await search;

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(dialog).toBeVisible();
      });

      test("handle auth errors on user search", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            const dialog = page.getByTestId("room-transfer-ownership-dialog");
            const dropdown = page.getByTestId("new-owner-dropdown");

            await page.getByTestId("room-transfer-ownership-button").click();
            await expect(dialog).toBeVisible();
            await dropdown.click();
            await dropdown.locator("input").pressSequentially("L");
          },
          "GET",
          "**/api/v1/users/search?query=*",
          "settings",
        );
      });

      test.describe("with selected new owner", () => {
        test.beforeEach(async ({ page, userSearchResponse }) => {
          userSearchResponse.json.data = userSearchResponse.json.data.slice(
            0,
            2,
          );
          const dialog = page.getByTestId("room-transfer-ownership-dialog");
          const dropdown = page.getByTestId("new-owner-dropdown");

          await page.getByTestId("room-transfer-ownership-button").click();
          await expect(dialog).toBeVisible();
          await dropdown.click();
          const search = page.waitForRequest(
            /\/api\/v1\/users\/search\?query=L(&|$)/,
          );
          await dropdown.locator("input").pressSequentially("L");
          await search;
          await expect(dialog.locator(".multiselect__content")).toBeVisible();
          await dialog.locator(".multiselect__option").nth(1).click();
          await expect(dialog.locator(".multiselect__content")).toHaveCount(0);
        });

        test("show 422 error if the role is missing", async ({ page }) => {
          const dialog = page.getByTestId("room-transfer-ownership-dialog");
          await mockApiRequest(
            page,
            "POST",
            "rooms/abc-def-123/transfer",
            validationErrors(
              { role: ["The selected role is invalid."] },
              "The selected role is invalid.",
            ),
          );

          await dialog.getByTestId("dialog-continue-button").click();

          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText("The selected role is invalid.");
        });

        test("replace 422 errors with the errors of the next request", async ({
          page,
        }) => {
          const dialog = page.getByTestId("room-transfer-ownership-dialog");
          await mockApiRequest(
            page,
            "POST",
            "rooms/abc-def-123/transfer",
            validationErrors(
              { role: ["The selected role is invalid."] },
              "The selected role is invalid.",
            ),
          );
          await dialog.getByTestId("dialog-continue-button").click();
          await expect(dialog).toContainText("The selected role is invalid.");

          // Select other role
          await page.locator("#moderator-role").click();

          await mockApiRequest(
            page,
            "POST",
            "rooms/abc-def-123/transfer",
            validationErrors(
              { user: ["The selected user can not own rooms."] },
              "The selected user can not own rooms.",
            ),
          );
          await dialog.getByTestId("dialog-continue-button").click();

          await expect(dialog).toContainText(
            "The selected user can not own rooms.",
          );
          await expect(dialog).not.toContainText(
            "The selected role is invalid.",
          );
        });

        test("show server error, keep dialog open and hide 422 errors", async ({
          page,
        }) => {
          const dialog = page.getByTestId("room-transfer-ownership-dialog");
          await mockApiRequest(
            page,
            "POST",
            "rooms/abc-def-123/transfer",
            validationErrors(
              { user: ["The selected user can not own rooms."] },
              "The selected user can not own rooms.",
            ),
          );
          await dialog.getByTestId("dialog-continue-button").click();
          await expect(dialog).toContainText(
            "The selected user can not own rooms.",
          );

          await mockApiRequest(
            page,
            "POST",
            "rooms/abc-def-123/transfer",
            serverError(),
          );
          await dialog.getByTestId("dialog-continue-button").click();

          await expectToastAndClose(page, [
            'app.flash.server_error.message_{"message":"Test"}',
            'app.flash.server_error.error_code_{"statusCode":500}',
          ]);
          await expect(dialog).toBeVisible();
          await expect(dialog).not.toContainText(
            "The selected user can not own rooms.",
          );
        });
      });

      test("handle auth errors on transfer", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            const dialog = page.getByTestId("room-transfer-ownership-dialog");

            await page.getByTestId("room-transfer-ownership-button").click();
            await expect(dialog).toBeVisible();
            await dialog.getByTestId("dialog-continue-button").click();
          },
          "POST",
          "api/v1/rooms/abc-def-123/transfer",
          "settings",
        );
      });

      test("redirect to room index if the room is not found", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-transfer-ownership-dialog");
        await interceptRoomIndexRequests(page);
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/transfer",
          modelNotFound("room", ["abc-def-123"]),
        );

        await page.getByTestId("room-transfer-ownership-button").click();
        await expect(dialog).toBeVisible();
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(page).toHaveURL((url) => url.pathname === "/rooms");
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });
});
