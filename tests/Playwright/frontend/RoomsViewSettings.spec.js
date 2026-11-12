import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomViewRequests,
  interceptRoomSettingsRequest,
  interceptRoomIndexRequests,
  interceptRoomFilesRequest,
} from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  checkRoomAuthErrorsLoadingTab,
} from "../support/room.js";
import { holdRequest, mockMethod } from "../support/utils.js";

const ROOM_URL = "**/api/v1/rooms/abc-def-123";
const SETTINGS_URL = "**/api/v1/rooms/abc-def-123/settings";
const TRANSFER_URL = "**/api/v1/rooms/abc-def-123/transfer";
const USER_SEARCH_URL = /\/api\/v1\/users\/search\?query=/;

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];
const ROOM_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const roomNotFoundResponse = {
  status: 404,
  json: { message: "model_not_found", model: "room", ids: ["abc-def-123"] },
};

const serverErrorResponse = { status: 500, json: { message: "Test" } };

async function expectRedirectToRoomIndex(page) {
  await expect(page).toHaveURL((url) => url.pathname === "/rooms");
}

async function confirmExpertModeDialog(page) {
  const dialog = page.getByTestId("room-settings-expert-mode-dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByTestId("dialog-continue-button").click();
  await expect(dialog).toBeHidden();
}

async function expectCheckbox(page, id, { checked, disabled, enforced }) {
  const group = page.getByTestId(`room-setting-${id}`);
  const input = page.locator(`#room-setting-${id}`);
  await expect(group).toBeVisible();
  await expect(input).toBeChecked({ checked });
  await expect(input).toBeEnabled({ enabled: !disabled });
  if (enforced !== undefined) {
    const icon = group.getByTestId("room-setting-enforced-icon");
    await expect(icon).toHaveCount(enforced ? 1 : 0);
  }
}

async function expectFixtureSettings(page, editable) {
  const state = (id, checked, enforcedByType = false) =>
    expectCheckbox(page, id, {
      checked,
      disabled: enforcedByType || !editable,
    });

  // General settings
  const roomType = page.locator("#room-setting-room_type");
  await expect(roomType).toHaveValue("Meeting");
  await expect(roomType)[editable ? "toBeEnabled" : "toBeDisabled"]();
  await expect(page.locator("#room-setting-name")).toHaveValue("Meeting One");
  await expect(page.locator("#room-setting-name"))[
    editable ? "toBeEnabled" : "toBeDisabled"
  ]();
  await expect(page.locator("#room-setting-access_code")).toHaveValue(
    "123456789",
  );
  await expect(page.locator("#room-setting-access_code"))[
    editable ? "toBeEnabled" : "toBeDisabled"
  ]();
  await state("allow_guests", true, true);

  // Video conference settings
  await state("everyone_can_start", false);
  await state("mute_on_start", true, true);
  await expect(page.locator("#room-setting-lobby-0")).not.toBeChecked();
  await expect(page.locator("#room-setting-lobby-0")).toBeDisabled();
  await expect(page.locator("#room-setting-lobby-1")).not.toBeChecked();
  await expect(page.locator("#room-setting-lobby-1")).toBeDisabled();
  await expect(page.locator("#room-setting-lobby-2")).toBeChecked();
  await expect(page.locator("#room-setting-lobby-2")).toBeDisabled();
  await expect(page.locator("#room-setting-welcome")).toHaveValue(
    "Welcome message",
  );
  await expect(page.locator("#room-setting-welcome"))[
    editable ? "toBeEnabled" : "toBeDisabled"
  ]();

  // Recording settings
  await state("record_attendance", false);
  await state("record", false);
  await state("auto_start_recording", false);

  // Restriction settings
  await state("lock_settings_disable_cam", false);
  await state("webcams_only_for_moderator", true);
  await state("lock_settings_disable_mic", false, true);
  await state("lock_settings_disable_public_chat", true);
  await state("lock_settings_disable_private_chat", false);
  await state("lock_settings_disable_note", true, true);
  await state("lock_settings_hide_user_list", true);

  // Participant settings
  await state("allow_membership", false, true);
  await expect(
    page.getByTestId("room-setting-default_role-button"),
  ).toHaveCount(2);
  await expectToggleButtons(
    page,
    page.getByTestId("room-setting-default_role-button"),
    [
      ["rooms.roles.participant", "true"],
      ["rooms.roles.moderator", "false"],
    ],
    editable,
  );

  // Advanced settings
  await expect(page.getByTestId("room-setting-visibility-button")).toHaveCount(
    2,
  );
  await expectToggleButtons(
    page,
    page.getByTestId("room-setting-visibility-button"),
    [
      ["rooms.settings.advanced.visibility.private", "false"],
      ["rooms.settings.advanced.visibility.public", "true"],
    ],
    editable,
  );
}

async function expectToggleButtons(page, buttons, expected, editable) {
  await expect(buttons).toHaveCount(expected.length);
  for (const [index, [text, pressed]] of expected.entries()) {
    const button = buttons.nth(index);
    await expect(button).toHaveText(text);
    await expect(button).toHaveAttribute("aria-pressed", pressed);
    if (editable !== undefined) {
      await expect(button)[editable ? "toBeEnabled" : "toBeDisabled"]();
    }
  }
}

async function mockRoom(page, changes = () => {}) {
  await page.route(ROOM_URL, async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    const room = readFixture("room.json");
    changes(room);
    await route.fulfill({ status: 200, json: room });
  });
}

async function mockSettings(page, changes = () => {}) {
  const settings = readFixture("roomSettings.json");
  changes(settings);
  return mockMethod(page, "GET", SETTINGS_URL, { status: 200, json: settings });
}

async function openSettings(page) {
  await page.goto("/rooms/abc-def-123");
  await page.locator("#tab-settings").click();
  await expect(page).toHaveURL((url) =>
    url.href.includes("/rooms/abc-def-123#tab=settings"),
  );
  // Wait until the settings are loaded and rendered
  await expect(page.getByTestId("overlay")).toHaveCount(0);
  await expect(page.locator("#room-setting-name")).toHaveValue(/.+/);
}

function waitForRoomRequest(page, method) {
  return page.waitForRequest(
    (request) =>
      request.method() === method &&
      /\/api\/v1\/rooms\/abc-def-123(\?|$)/.test(request.url()),
  );
}

async function holdMethod(page, method, url, response) {
  const { release } = await mockMethod(page, method, url, {
    ...response,
    hold: true,
  });
  return release;
}

test.describe("Rooms view settings", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomViewRequests(page);
    await interceptRoomSettingsRequest(page);
  });

  test.describe("load settings", () => {
    test("show loading state while the settings are loading", async ({
      page,
    }) => {
      const release = await holdRequest(page, SETTINGS_URL, {
        json: readFixture("roomSettings.json"),
      });
      await interceptRoomFilesRequest(page);

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

      release();

      await expect(page.getByTestId("overlay")).toHaveCount(0);
    });

    test.describe("without expert mode", () => {
      test.beforeEach(async ({ page }) => {
        await mockSettings(page, (settings) => {
          settings.data.expert_mode = false;
          settings.data.welcome = "";
        });
        await openSettings(page);
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
        await confirmExpertModeDialog(page);

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
        await expectCheckbox(page, "everyone_can_start", {
          checked: false,
          disabled: false,
          enforced: false,
        });

        const muteOnStart = page.getByTestId("room-setting-mute_on_start");
        await expect(muteOnStart).toBeVisible();
        await expect(muteOnStart).toContainText(
          "rooms.settings.video_conference.mute_on_start",
        );
        await expectCheckbox(page, "mute_on_start", {
          checked: true,
          disabled: true,
          enforced: true,
        });

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
        await confirmExpertModeDialog(page);

        await expect(
          page.getByText("rooms.settings.recordings.title"),
        ).toBeVisible();

        for (const [id, text] of [
          ["record_attendance", "record_attendance"],
          ["record", "record_video_conference"],
          ["auto_start_recording", "auto_start_recording"],
        ]) {
          await expect(page.getByTestId(`room-setting-${id}`)).toContainText(
            `rooms.settings.recordings.${text}`,
          );
          await expectCheckbox(page, id, {
            checked: false,
            disabled: false,
            enforced: false,
          });
        }
      });

      test("show restriction settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        await confirmExpertModeDialog(page);

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
          await expect(page.getByTestId(`room-setting-${id}`)).toContainText(
            `rooms.settings.restrictions.${id}`,
          );
          await expectCheckbox(page, id, {
            checked,
            disabled: enforced,
            enforced,
          });
        }
      });

      test("show participant settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        await confirmExpertModeDialog(page);

        await expect(
          page.getByText("rooms.settings.participants.title"),
        ).toBeVisible();

        const allowMembership = page.getByTestId(
          "room-setting-allow_membership",
        );
        await expect(allowMembership).toContainText(
          "rooms.settings.participants.allow_membership",
        );
        await expectCheckbox(page, "allow_membership", {
          checked: false,
          disabled: true,
          enforced: true,
        });

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
        await expectToggleButtons(
          page,
          page.getByTestId("room-setting-default_role-button"),
          [
            ["rooms.roles.participant", "true"],
            ["rooms.roles.moderator", "false"],
          ],
        );
      });

      test("show advanced settings after activating expert mode", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        await confirmExpertModeDialog(page);

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
        await expectToggleButtons(
          page,
          page.getByTestId("room-setting-visibility-button"),
          [
            ["rooms.settings.advanced.visibility.private", "false"],
            ["rooms.settings.advanced.visibility.public", "true"],
          ],
        );
      });
    });
  });

  test.describe("load settings errors", () => {
    test("show error and keep buttons disabled on server error", async ({
      page,
    }) => {
      await mockMethod(page, "GET", SETTINGS_URL, serverErrorResponse);

      await page.goto("/rooms/abc-def-123#tab=settings");

      await expect(page.getByTestId("overlay")).toBeVisible();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

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
      await interceptRoomFilesRequest(page);
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "GET", SETTINGS_URL, roomNotFoundResponse);

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-settings").click();

      await expectRedirectToRoomIndex(page);
      await expectToastAndClose(page, ROOM_NOT_FOUND_TOAST);
    });
  });

  test.describe("load settings with different permissions", () => {
    test("as co-owner", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
        room.data.is_co_owner = true;
      });

      await openSettings(page);

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

      await expectFixtureSettings(page, true);
    });

    test("with rooms.viewAll permission", async ({ page, currentUser }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll"];
      });

      await openSettings(page);

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

      await expectFixtureSettings(page, false);
    });

    test("with rooms.manage permission", async ({ page, currentUser }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUser.data.permissions = permissions;
      await mockRoom(page, (room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = permissions;
      });

      await openSettings(page);

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

      await expectFixtureSettings(page, true);
    });
  });

  test.describe("change settings", () => {
    const saveUrl = ROOM_URL;

    const expectedBodyAllChanged = (accessCode) => ({
      name: "Meeting Two",
      expert_mode: true,
      access_code: accessCode,
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
    });

    /**
     * Change all settings that are not enforced by the room type to a different value than the default.
     */
    async function changeExpertSettings(page) {
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
    }

    test.beforeEach(async ({ page }) => {
      const roomTypes = readFixture("roomTypesWithSettings.json");
      await mockSettings(page, (settings) => {
        settings.data.room_type = roomTypes.data[0];
      });
    });

    test("show unsaved changes message after changing a setting", async ({
      page,
    }) => {
      await openSettings(page);

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
      await openSettings(page);

      await page.locator("#room-setting-name").fill("Meeting Two");
      await page.evaluate(() => window.scrollTo(0, 0));

      const saveButton = page
        .getByTestId("room-unsaved-changes-message")
        .getByTestId("room-unsaved-changes-save-button");
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toHaveText("app.save");
    });

    test("change access code", async ({ page }) => {
      await openSettings(page);

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
      await openSettings(page);

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

      await changeExpertSettings(page);

      // Deactivate expert mode and activate again
      await page.getByTestId("room-settings-expert-mode-button").click();
      await confirmExpertModeDialog(page);
      await page.getByTestId("room-settings-expert-mode-button").click();
      await confirmExpertModeDialog(page);

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
      await openSettings(page);

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
      await changeExpertSettings(page);

      const roomTypes = readFixture("roomTypesWithSettings.json");
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
        room_type: roomTypes.data[0],
      });
      await mockMethod(page, "PUT", saveUrl, { json: savedSettings });

      const saveRequest = waitForRoomRequest(page, "PUT");
      await page.getByTestId("room-settings-save-button").click();

      expect((await saveRequest).postDataJSON()).toEqual(
        expectedBodyAllChanged(newAccessCode),
      );

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
      await openSettings(page);

      await page.locator("#room-setting-name").fill("Meeting Two");
      await page.evaluate(() => window.scrollTo(0, 0));

      const savedSettings = readFixture("roomSettings.json");
      savedSettings.data.name = "Meeting Two";
      savedSettings.data.room_type = readFixture(
        "roomTypesWithSettings.json",
      ).data[0];
      const release = await holdMethod(page, "PUT", saveUrl, {
        json: savedSettings,
      });

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

      release();

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
      test.beforeEach(async ({ page }) => {
        const roomTypes = readFixture("roomTypesWithSettings.json");
        await mockSettings(page, (settings) => {
          settings.data.room_type = roomTypes.data[0];
          settings.data.allow_guests = false;
        });
        await openSettings(page);
      });

      test("hide save button inside the unsaved changes message if the save button is visible", async ({
        page,
      }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        await confirmExpertModeDialog(page);

        await page.locator("#room-setting-name").fill("Meeting Three");

        const message = page.getByTestId("room-unsaved-changes-message");
        await expect(message).toBeVisible();
        await expect(
          message.getByTestId("room-unsaved-changes-save-button"),
        ).toHaveCount(0);
      });

      test("save settings with deactivated expert mode", async ({ page }) => {
        await page.getByTestId("room-settings-expert-mode-button").click();
        await confirmExpertModeDialog(page);

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
        await mockMethod(page, "PUT", saveUrl, { json: savedSettings });

        const saveRequest = waitForRoomRequest(page, "PUT");
        await page.getByTestId("room-settings-save-button").click();

        expect((await saveRequest).postDataJSON()).toEqual({
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

    test("save settings with GL3 access code", async ({ page }) => {
      await mockSettings(page, (settings) => {
        settings.data.access_code = "012abc";
      });
      await openSettings(page);

      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "012abc",
      );
      await expect(page.locator("#room-setting-access_code")).toBeEnabled();

      await page.locator("#room-setting-name").fill("Meeting Two");

      const savedSettings = readFixture("roomSettings.json");
      savedSettings.data.name = "Meeting Two";
      savedSettings.data.access_code = "012abc";
      await mockMethod(page, "PUT", saveUrl, { json: savedSettings });

      const saveRequest = waitForRoomRequest(page, "PUT");
      await page.getByTestId("room-settings-save-button").click();

      expect((await saveRequest).postDataJSON()).toEqual({
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
      });

      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting Two",
      );
    });
  });

  test.describe("change settings errors", () => {
    const expertErrors = {
      access_code: [
        "The room requires an access code because of its room type.",
      ],
      welcome: ["The Welcome message may not be greater than 250 characters."],
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

    const generalErrors = {
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

    const expertErrorResponse = {
      status: 422,
      json: {
        message:
          "The room requires an access code because of its room type. (and 17 more errors)",
        errors: expertErrors,
      },
    };

    const generalErrorResponse = {
      status: 422,
      json: {
        message:
          "The room requires an access code because of its room type. (and 4 more errors)",
        errors: generalErrors,
      },
    };

    async function expectFieldErrors(page, errors, visible) {
      for (const [field, messages] of Object.entries(errors)) {
        const group = page.getByTestId(`room-setting-${field}`);
        if (visible) {
          await expect(group).toContainText(messages[0].trim());
        } else {
          await expect(group).not.toContainText(messages[0].trim());
        }
      }
    }

    test.beforeEach(async ({ page }) => {
      const roomTypes = readFixture("roomTypesWithSettings.json");
      await mockSettings(page, (settings) => {
        settings.data.room_type = roomTypes.data[0];
        settings.data.room_type.has_access_code_enforced = true;
        settings.data.access_code = null;
      });
      await openSettings(page);
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
      await mockMethod(page, "PUT", ROOM_URL, expertErrorResponse);

      await page.getByTestId("room-settings-save-button").click();

      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 17 more errors)",
      );
      await expectFieldErrors(page, expertErrors, true);
    });

    test("show 422 errors without expert mode", async ({ page }) => {
      await page.getByTestId("room-settings-expert-mode-button").click();
      await confirmExpertModeDialog(page);

      await mockMethod(page, "PUT", ROOM_URL, generalErrorResponse);

      await page.getByTestId("room-settings-save-button").click();

      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 4 more errors)",
      );
      await expectFieldErrors(page, generalErrors, true);
    });

    test("hide 422 errors and show access code as prohibited after successful save", async ({
      page,
    }) => {
      await mockMethod(page, "PUT", ROOM_URL, expertErrorResponse);
      await page.getByTestId("room-settings-save-button").click();
      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 17 more errors)",
      );
      await expectFieldErrors(page, expertErrors, true);

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
      await mockMethod(page, "PUT", ROOM_URL, { json: savedSettings });

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
      await expectFieldErrors(page, expertErrors, false);
    });

    test("hide 422 errors after a server error", async ({ page }) => {
      await page.getByTestId("room-settings-expert-mode-button").click();
      await confirmExpertModeDialog(page);

      await mockMethod(page, "PUT", ROOM_URL, generalErrorResponse);
      await page.getByTestId("room-settings-save-button").click();
      await expectToastAndClose(
        page,
        "The room requires an access code because of its room type. (and 4 more errors)",
      );
      await expectFieldErrors(page, generalErrors, true);

      await mockMethod(page, "PUT", ROOM_URL, serverErrorResponse);
      await page.getByTestId("room-settings-save-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expectFieldErrors(page, generalErrors, false);
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
      await mockMethod(page, "PUT", ROOM_URL, roomNotFoundResponse);

      await page.getByTestId("room-settings-save-button").click();

      await expectRedirectToRoomIndex(page);
      await expectToastAndClose(page, ROOM_NOT_FOUND_TOAST);
    });
  });

  test.describe("delete room", () => {
    const dialog = (page) => page.getByTestId("room-delete-dialog");

    test.beforeEach(async ({ page }) => {
      await openSettings(page);
      await expect(dialog(page)).toHaveCount(0);
      await expect(page.getByTestId("room-delete-button")).toHaveText(
        "rooms.modals.delete.title",
      );
      await page.getByTestId("room-delete-button").click();
      await expect(dialog(page)).toBeVisible();
    });

    test("cancel delete", async ({ page }) => {
      const cancelButton = dialog(page).getByTestId("dialog-cancel-button");
      await expect(cancelButton).toHaveText("app.no");
      await cancelButton.click();
      await expect(dialog(page)).toHaveCount(0);
    });

    test("show confirmation with room name", async ({ page }) => {
      await expect(dialog(page)).toContainText("rooms.modals.delete.title");
      await expect(dialog(page)).toContainText(
        'rooms.modals.delete.confirm_{"name":"Meeting One"}',
      );
    });

    test("delete room", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      const release = await holdMethod(page, "DELETE", ROOM_URL, {
        status: 204,
      });

      const continueButton = dialog(page).getByTestId("dialog-continue-button");
      await expect(continueButton).toHaveText("app.yes");
      await continueButton.click();
      await expect(continueButton).toBeDisabled();

      release();

      await expectRedirectToRoomIndex(page);
    });

    test("redirect to room index if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "DELETE", ROOM_URL, roomNotFoundResponse);

      await dialog(page).getByTestId("dialog-continue-button").click();

      await expectRedirectToRoomIndex(page);
      await expectToastAndClose(page, ROOM_NOT_FOUND_TOAST);
    });

    test("keep dialog open on server error", async ({ page }) => {
      await mockMethod(page, "DELETE", ROOM_URL, serverErrorResponse);

      await dialog(page).getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(dialog(page)).toBeVisible();
    });

    test("handle auth errors", async ({ page }) => {
      await page.getByTestId("dialog-cancel-button").click();

      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-delete-button").click();
          await expect(dialog(page)).toBeVisible();
          await dialog(page).getByTestId("dialog-continue-button").click();
        },
        "DELETE",
        "api/v1/rooms/abc-def-123",
        "settings",
      );
    });
  });

  test.describe("transfer ownership", () => {
    const dialog = (page) => page.getByTestId("room-transfer-ownership-dialog");
    const dropdown = (page) => page.getByTestId("new-owner-dropdown");
    const options = (page) => dialog(page).locator(".multiselect__option");

    const searchUsers = {
      data: [
        {
          id: 5,
          firstname: "Laura",
          lastname: "Rivera",
          email: "LauraWRivera@domain.tld",
          image: null,
        },
        {
          id: 10,
          firstname: "Laura",
          lastname: "Walter",
          email: "LauraMWalter@domain.tld",
          image: null,
        },
        {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          email: "JohnDoe@domain.tld",
          image: null,
        },
      ],
    };

    async function openDialog(page) {
      await page.getByTestId("room-transfer-ownership-button").click();
      await expect(dialog(page)).toBeVisible();
    }

    function waitForUserSearch(page, query) {
      return page.waitForRequest(
        (request) =>
          USER_SEARCH_URL.test(request.url()) &&
          new URL(request.url()).searchParams.get("query") === query,
      );
    }

    async function searchAndSelectNewOwner(page) {
      await dropdown(page).click();
      const search = waitForUserSearch(page, "L");
      await dropdown(page).locator("input").pressSequentially("L");
      await search;

      await expect(dialog(page).locator(".multiselect__content")).toBeVisible();
      await options(page).nth(1).click();
      await expect(dialog(page).locator(".multiselect__content")).toHaveCount(
        0,
      );
    }

    async function expectUserOptions(page) {
      await expect(dialog(page).locator(".multiselect__content")).toBeVisible();
      await expect(options(page)).toHaveCount(5);
      await expect(options(page).nth(0)).toContainText("Laura Rivera");
      await expect(options(page).nth(0)).toContainText(
        "LauraWRivera@domain.tld",
      );
      await expect(options(page).nth(0)).toBeVisible();
      await expect(options(page).nth(1)).toContainText("Laura Walter");
      await expect(options(page).nth(1)).toContainText(
        "LauraMWalter@domain.tld",
      );
      await expect(options(page).nth(1)).toBeVisible();
      await expect(options(page).nth(2)).toContainText("John Doe");
      await expect(options(page).nth(2)).toContainText("JohnDoe@domain.tld");
      await expect(options(page).nth(2)).toBeVisible();
      await expect(options(page).nth(2)).toHaveClass(
        /multiselect__option--disabled/,
      );
      await expect(options(page).nth(3)).toContainText(
        "rooms.members.modals.add.no_result",
      );
      await expect(options(page).nth(3)).toBeHidden();
      await expect(options(page).nth(4)).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(options(page).nth(4)).toBeHidden();
    }

    test.beforeEach(async ({ page }) => {
      await openSettings(page);
      await expect(dialog(page)).toHaveCount(0);
      await expect(
        page.getByTestId("room-transfer-ownership-button"),
      ).toHaveText("rooms.modals.transfer_ownership.title");
    });

    test("open and cancel dialog", async ({ page }) => {
      await openDialog(page);
      await expect(dialog(page)).toContainText(
        "rooms.modals.transfer_ownership.title",
      );

      const cancelButton = dialog(page).getByTestId("dialog-cancel-button");
      await expect(cancelButton).toHaveText("app.cancel");
      await cancelButton.click();
      await expect(dialog(page)).toHaveCount(0);

      await openDialog(page);
    });

    test("show too many results while searching", async ({ page }) => {
      await page.route(USER_SEARCH_URL, (route) =>
        route.fulfill({ status: 204 }),
      );
      await openDialog(page);

      // Check autofocus
      await expect(dialog(page).locator(".multiselect__content")).toBeVisible();

      // Check prompt
      await expect(dropdown(page)).toContainText(
        "rooms.members.modals.add.no_options",
      );

      // Check placeholder and type in input
      const input = dropdown(page).locator("input");
      await expect(input).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.add.placeholder",
      );
      await input.click();

      const search = waitForUserSearch(page, "L");
      await input.pressSequentially("L");
      await search;

      await expect(dialog(page).locator(".multiselect__content")).toBeVisible();
      await expect(options(page)).toHaveCount(2);
      await expect(options(page).nth(0)).toContainText(
        "rooms.members.modals.add.too_many_results",
      );
      await expect(options(page).nth(0)).toBeVisible();
      await expect(options(page).nth(1)).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(options(page).nth(1)).toBeHidden();
    });

    test("show search results", async ({ page }) => {
      await page.route(USER_SEARCH_URL, (route) =>
        route.fulfill({ json: searchUsers }),
      );
      await openDialog(page);

      const input = dropdown(page).locator("input");
      await input.click();
      await input.pressSequentially("L");
      const search = waitForUserSearch(page, "Laura");
      await input.pressSequentially("aura");
      await search;

      await expectUserOptions(page);
    });

    test("show role selection after selecting a new owner", async ({
      page,
    }) => {
      await page.route(USER_SEARCH_URL, (route) =>
        route.fulfill({ json: searchUsers }),
      );
      await openDialog(page);
      await searchAndSelectNewOwner(page);

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

    test("transfer ownership with a role", async ({ page }) => {
      await page.route(USER_SEARCH_URL, (route) =>
        route.fulfill({ json: searchUsers }),
      );
      await interceptRoomFilesRequest(page);
      await openDialog(page);
      await searchAndSelectNewOwner(page);
      await page.locator("#participant-role").click();

      const release = await holdMethod(page, "POST", TRANSFER_URL, {
        status: 204,
      });
      await mockRoom(page, (room) => {
        room.data.owner = { id: 10, name: "Laura Walter" };
        room.data.is_member = true;
      });

      const transferRequest = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          TRANSFER_URL.endsWith(new URL(request.url()).pathname),
      );
      await dialog(page).getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(dropdown(page).locator("input")).toBeDisabled();
      await expect(page.locator("#participant-role")).toBeDisabled();
      await expect(page.locator("#moderator-role")).toBeDisabled();
      await expect(page.locator("#co-owner-role")).toBeDisabled();
      await expect(page.locator("#no-role")).toBeDisabled();
      await expect(
        dialog(page).getByTestId("dialog-cancel-button"),
      ).toBeDisabled();
      await expect(
        dialog(page).getByTestId("dialog-continue-button"),
      ).toBeDisabled();

      release();

      expect((await transferRequest).postDataJSON()).toEqual({
        user: 10,
        role: 1,
      });

      await expect(page.getByText("Laura Walter")).toBeVisible();
      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123#tab=files"),
      );
    });

    test("transfer ownership without a role", async ({ page }) => {
      await page.route(USER_SEARCH_URL, (route) =>
        route.fulfill({ json: searchUsers }),
      );
      await interceptRoomFilesRequest(page);
      await openDialog(page);
      await searchAndSelectNewOwner(page);
      await page.locator("#no-role").click();

      await mockMethod(page, "POST", TRANSFER_URL, { status: 204 });
      await mockRoom(page, (room) => {
        room.data.owner = { id: 10, name: "Laura Walter" };
        room.data.authenticated = false;
      });

      const transferRequest = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          new URL(request.url()).pathname ===
            "/api/v1/rooms/abc-def-123/transfer",
      );
      await dialog(page).getByTestId("dialog-continue-button").click();

      expect((await transferRequest).postDataJSON()).toEqual({ user: 10 });

      await expect(page.getByText("Laura Walter")).toBeVisible();

      // Check that access code overlay is shown
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("show email only hints if search by name is disabled", async ({
      page,
      config,
    }) => {
      config.data.user.search_by_name = false;
      await page.reload();
      await expect(page.locator("#room-setting-name")).toBeVisible();

      await openDialog(page);

      // Check autofocus
      await expect(dialog(page).locator(".multiselect__content")).toBeVisible();

      // Check prompt
      await expect(dropdown(page)).toContainText(
        "rooms.members.modals.add.no_options_email_only",
      );

      // Check placeholder
      await expect(dropdown(page).locator("input")).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.add.placeholder_email_only",
      );
    });

    test.describe("errors", () => {
      test("show server error on user search and keep dialog open", async ({
        page,
      }) => {
        await page.route(USER_SEARCH_URL, (route) =>
          route.fulfill(serverErrorResponse),
        );
        await openDialog(page);

        await dropdown(page).click();
        const search = waitForUserSearch(page, "L");
        await dropdown(page).locator("input").pressSequentially("L");
        await search;

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
        await expect(dialog(page)).toBeVisible();
      });

      test("handle auth errors on user search", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page.getByTestId("room-transfer-ownership-button").click();
            await expect(dialog(page)).toBeVisible();
            await dropdown(page).click();
            await dropdown(page).locator("input").pressSequentially("L");
          },
          "GET",
          "**/api/v1/users/search?query=*",
          "settings",
        );
      });

      test.describe("with selected new owner", () => {
        test.beforeEach(async ({ page }) => {
          await page.route(USER_SEARCH_URL, (route) =>
            route.fulfill({ json: { data: searchUsers.data.slice(0, 2) } }),
          );
          await openDialog(page);
          await searchAndSelectNewOwner(page);
        });

        test("show 422 error if the role is missing", async ({ page }) => {
          await mockMethod(page, "POST", TRANSFER_URL, {
            status: 422,
            json: {
              message: "The selected role is invalid.",
              errors: { role: ["The selected role is invalid."] },
            },
          });

          await dialog(page).getByTestId("dialog-continue-button").click();

          await expect(dialog(page)).toBeVisible();
          await expect(dialog(page)).toContainText(
            "The selected role is invalid.",
          );
        });

        test("replace 422 errors with the errors of the next request", async ({
          page,
        }) => {
          await mockMethod(page, "POST", TRANSFER_URL, {
            status: 422,
            json: {
              message: "The selected role is invalid.",
              errors: { role: ["The selected role is invalid."] },
            },
          });
          await dialog(page).getByTestId("dialog-continue-button").click();
          await expect(dialog(page)).toContainText(
            "The selected role is invalid.",
          );

          // Select other role
          await page.locator("#moderator-role").click();

          await mockMethod(page, "POST", TRANSFER_URL, {
            status: 422,
            json: {
              message: "The selected user can not own rooms.",
              errors: { user: ["The selected user can not own rooms."] },
            },
          });
          await dialog(page).getByTestId("dialog-continue-button").click();

          await expect(dialog(page)).toContainText(
            "The selected user can not own rooms.",
          );
          await expect(dialog(page)).not.toContainText(
            "The selected role is invalid.",
          );
        });

        test("show server error, keep dialog open and hide 422 errors", async ({
          page,
        }) => {
          await mockMethod(page, "POST", TRANSFER_URL, {
            status: 422,
            json: {
              message: "The selected user can not own rooms.",
              errors: { user: ["The selected user can not own rooms."] },
            },
          });
          await dialog(page).getByTestId("dialog-continue-button").click();
          await expect(dialog(page)).toContainText(
            "The selected user can not own rooms.",
          );

          await mockMethod(page, "POST", TRANSFER_URL, serverErrorResponse);
          await dialog(page).getByTestId("dialog-continue-button").click();

          await expectToastAndClose(page, SERVER_ERROR_TOAST);
          await expect(dialog(page)).toBeVisible();
          await expect(dialog(page)).not.toContainText(
            "The selected user can not own rooms.",
          );
        });
      });

      test("handle auth errors on transfer", async ({ page }) => {
        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page.getByTestId("room-transfer-ownership-button").click();
            await expect(dialog(page)).toBeVisible();
            await dialog(page).getByTestId("dialog-continue-button").click();
          },
          "POST",
          "api/v1/rooms/abc-def-123/transfer",
          "settings",
        );
      });

      test("redirect to room index if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);
        await mockMethod(page, "POST", TRANSFER_URL, roomNotFoundResponse);

        await openDialog(page);
        await dialog(page).getByTestId("dialog-continue-button").click();

        await expectRedirectToRoomIndex(page);
        await expectToastAndClose(page, ROOM_NOT_FOUND_TOAST);
      });
    });
  });
});
