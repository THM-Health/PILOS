import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  checkCompareRoomSettingField,
  checkDefaultRoomSettingField,
  checkRoomAuthErrors,
} from "../support/room.js";
import {
  interceptRoomViewRequests,
  interceptRoomSettingsRequest,
} from "../support/mocks.js";
import { holdRequest } from "../support/utils.js";

test.use({ authenticated: true });

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const ROOM_TYPES_URL = "**/api/v1/roomTypes*";
const ROOM_SETTINGS_URL = "**/api/v1/rooms/abc-def-123/settings";

// Rows for checkDefaultRoomSettingField: [field, value, enforced, isInfo]
// Rows for checkCompareRoomSettingField: [field, current, currentEnforced, new, newEnforced, isInfo]
const defMeeting = [
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
  ["visibility", "rooms.settings.advanced.visibility.public", false, true],
];

const defExam = [
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
  ["visibility", "rooms.settings.advanced.visibility.private", false, true],
];

const defSeminar = [
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
  ["visibility", "rooms.settings.advanced.visibility.private", true, true],
];

const cmpExamNoReset = [
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
  ["lock_settings_disable_private_chat", false, false, false, false, false],
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
];

const cmpExamReset = [
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
  ["lock_settings_disable_private_chat", false, false, true, false, false],
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
];

const cmpBackToMeeting = [
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
  ["lock_settings_disable_public_chat", false, false, false, false, false],
  ["lock_settings_disable_private_chat", true, false, true, false, false],
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
];

const cmpSeminar = [
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
  ["lock_settings_disable_public_chat", false, false, false, true, false],
  ["lock_settings_disable_private_chat", true, false, true, true, false],
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
];

const nxExam = [
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
  ["lock_settings_disable_private_chat", false, false, true, false, false],
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
];

const nxExamReset = [
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
  ["lock_settings_disable_private_chat", false, false, true, false, false],
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
];

const nxExam2 = [
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
  ["lock_settings_disable_public_chat", false, false, false, false, false],
  ["lock_settings_disable_private_chat", true, false, true, false, false],
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
];

const nxMeeting = [
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
  ["lock_settings_disable_public_chat", false, false, true, false, false],
  ["lock_settings_disable_private_chat", true, false, false, false, false],
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
];

async function mockRoomTypes(
  page,
  roomTypes = readFixture("roomTypesWithSettings.json"),
) {
  await page.route(ROOM_TYPES_URL, (route) =>
    route.fulfill({ status: 200, json: roomTypes }),
  );
}

async function mockRoomSettings(page, settings) {
  await page.route(ROOM_SETTINGS_URL, (route) =>
    route.fulfill({ status: 200, json: settings }),
  );
}

async function expectDefaultSettings(page, rows) {
  for (const row of rows) {
    await checkDefaultRoomSettingField(page, ...row);
  }
}

async function expectComparison(page, rows) {
  for (const row of rows) {
    await checkCompareRoomSettingField(page, ...row);
  }
}

const changeDialog = (page) => page.getByTestId("room-type-change-dialog");
const confirmationDialog = (page) =>
  page.getByTestId("room-type-change-confirmation-dialog");
const roomTypeOption = (page, index) =>
  changeDialog(page).getByTestId("room-type-select-option").nth(index);

async function openRoomSettings(page) {
  await page.goto("/rooms/abc-def-123#tab=settings");
  await expect(page.locator("#room-setting-room_type")).toHaveValue("Meeting");
}

async function openChangeDialog(page) {
  await page.getByTestId("room-type-change-button").click();
  await expect(changeDialog(page)).toBeVisible();
  await expect(
    changeDialog(page).getByTestId("room-type-select-option"),
  ).not.toHaveCount(0);
}

async function selectRoomType(page, index) {
  await openChangeDialog(page);
  await roomTypeOption(page, index).click();
  await changeDialog(page).getByTestId("dialog-save-button").click();
  await expect(confirmationDialog(page)).toBeVisible();
}

async function changeRoomType(page, index, resetClicks = 0) {
  await selectRoomType(page, index);
  for (let i = 0; i < resetClicks; i++) {
    await confirmationDialog(page).locator("#reset-to-defaults").click();
  }
  await confirmationDialog(page)
    .getByTestId("confirmation-dialog-save-button")
    .click();
  await expect(confirmationDialog(page)).toBeHidden();
  await expect(changeDialog(page)).toBeHidden();
}

async function expectUnsavedChangesMessage(page, withSaveButton) {
  const message = page.getByTestId("room-unsaved-changes-message");
  await expect(message).toBeVisible();
  await expect(message).toContainText("rooms.settings.unsaved_changes");
  const saveButton = message.getByTestId("room-unsaved-changes-save-button");
  if (withSaveButton) {
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toHaveText("app.save");
  } else {
    await expect(saveButton).toHaveCount(0);
  }
}

async function expectCheckbox(page, field, disabled, checked) {
  const input = page.locator(`#room-setting-${field}`);
  if (disabled) {
    await expect(input).toBeDisabled();
  } else {
    await expect(input).toBeEnabled();
  }
  await expect(input).toBeChecked({ checked });
}

async function expectButtons(page, field, buttons) {
  const locator = page.getByTestId(`room-setting-${field}-button`);
  await expect(locator).toHaveCount(buttons.length);
  for (const [index, [pressed, disabled]] of buttons.entries()) {
    await expect(locator.nth(index)).toHaveAttribute(
      "aria-pressed",
      String(pressed),
    );
    if (disabled) {
      await expect(locator.nth(index)).toBeDisabled();
    } else {
      await expect(locator.nth(index)).toBeEnabled();
    }
  }
}

async function expectExpertSettings(page, state) {
  const { lobby, defaultRole, visibility, lobbyAlert, ...checkboxes } = state;

  for (const [field, [disabled, checked]] of Object.entries(checkboxes)) {
    await expectCheckbox(page, field, disabled, checked);
  }

  const lobbySetting = page.getByTestId("room-setting-lobby");
  if (lobbyAlert) {
    await expect(lobbySetting).toContainText(
      "rooms.settings.video_conference.lobby.alert",
    );
  } else {
    await expect(lobbySetting).not.toContainText(
      "rooms.settings.video_conference.lobby.alert",
    );
  }
  for (const [index, [disabled, checked]] of lobby.entries()) {
    await expectCheckbox(page, `lobby-${index}`, disabled, checked);
  }

  await expectButtons(page, "default_role", defaultRole);
  await expectButtons(page, "visibility", visibility);
}

const enabled = (checked) => [false, checked];
const disabled = (checked) => [true, checked];

const meetingState = {
  allow_guests: disabled(true),
  everyone_can_start: enabled(false),
  mute_on_start: disabled(true),
  lobbyAlert: false,
  lobby: [disabled(false), disabled(false), disabled(true)],
  record_attendance: enabled(false),
  record: enabled(false),
  auto_start_recording: enabled(false),
  lock_settings_disable_cam: enabled(false),
  webcams_only_for_moderator: enabled(true),
  lock_settings_disable_mic: disabled(false),
  lock_settings_disable_public_chat: enabled(true),
  lock_settings_disable_private_chat: enabled(false),
  lock_settings_disable_note: disabled(true),
  lock_settings_hide_user_list: enabled(true),
  allow_membership: disabled(false),
  defaultRole: [
    [true, false],
    [false, false],
  ],
  visibility: [
    [false, false],
    [true, false],
  ],
};

const examState = {
  allow_guests: enabled(false),
  everyone_can_start: enabled(true),
  mute_on_start: enabled(false),
  lobbyAlert: true,
  lobby: [enabled(false), enabled(true), enabled(false)],
  record_attendance: enabled(true),
  record: enabled(true),
  auto_start_recording: enabled(true),
  lock_settings_disable_cam: enabled(true),
  webcams_only_for_moderator: enabled(false),
  lock_settings_disable_mic: enabled(true),
  lock_settings_disable_public_chat: enabled(false),
  lock_settings_disable_private_chat: enabled(true),
  lock_settings_disable_note: enabled(false),
  lock_settings_hide_user_list: enabled(false),
  allow_membership: enabled(true),
  defaultRole: [
    [false, false],
    [true, false],
  ],
  visibility: [
    [true, false],
    [false, false],
  ],
};

const meetingAfterExamState = {
  allow_guests: disabled(true),
  everyone_can_start: enabled(true),
  mute_on_start: disabled(true),
  lobbyAlert: false,
  lobby: [disabled(false), disabled(false), disabled(true)],
  record_attendance: enabled(true),
  record: enabled(true),
  auto_start_recording: enabled(true),
  lock_settings_disable_cam: enabled(true),
  webcams_only_for_moderator: enabled(false),
  lock_settings_disable_mic: disabled(false),
  lock_settings_disable_public_chat: enabled(false),
  lock_settings_disable_private_chat: enabled(true),
  lock_settings_disable_note: disabled(true),
  lock_settings_hide_user_list: enabled(false),
  allow_membership: disabled(false),
  defaultRole: [
    [false, false],
    [true, false],
  ],
  visibility: [
    [true, false],
    [false, false],
  ],
};

const seminarState = {
  allow_guests: disabled(false),
  everyone_can_start: disabled(true),
  mute_on_start: enabled(true),
  lobbyAlert: false,
  lobby: [enabled(false), enabled(false), enabled(true)],
  record_attendance: disabled(true),
  record: disabled(true),
  auto_start_recording: disabled(true),
  lock_settings_disable_cam: disabled(true),
  webcams_only_for_moderator: disabled(false),
  lock_settings_disable_mic: enabled(false),
  lock_settings_disable_public_chat: disabled(false),
  lock_settings_disable_private_chat: disabled(true),
  lock_settings_disable_note: enabled(true),
  lock_settings_hide_user_list: disabled(false),
  allow_membership: enabled(false),
  defaultRole: [
    [false, true],
    [true, true],
  ],
  visibility: [
    [true, true],
    [false, true],
  ],
};

async function expectNonExpertSettingsHidden(page) {
  for (const section of [
    "video_conference",
    "recordings",
    "restrictions",
    "participants",
    "advanced",
  ]) {
    await expect(page.getByText(`rooms.settings.${section}.title`)).toHaveCount(
      0,
    );
  }
}

async function expectRoomTypeOptions(page) {
  await expect(
    changeDialog(page).getByTestId("room-type-select-option"),
  ).toHaveText(["Lecture", "Meeting", "Exam", "Seminar"]);
}

test.describe("Rooms view settings room type actions", () => {
  test.beforeEach(async ({ page }) => {
    await interceptRoomViewRequests(page);
    await interceptRoomSettingsRequest(page);
    await mockRoomTypes(page);
  });

  test.describe("expert mode", () => {
    test("loads room types with the room settings and shows the details", async ({
      page,
    }) => {
      await openRoomSettings(page);
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toBeHidden();
      await expect(changeDialog(page)).toBeHidden();

      const roomTypesRequest = page.waitForRequest(ROOM_TYPES_URL);
      await page.getByTestId("room-type-change-button").click();
      const request = await roomTypesRequest;
      expect(Object.fromEntries(new URL(request.url()).searchParams)).toEqual({
        with_room_settings: "1",
        with_features: "1",
        filter: "abc-def-123",
      });

      await expect(changeDialog(page)).toBeVisible();
      await expect(changeDialog(page)).toContainText("rooms.change_type.title");
      await expectRoomTypeOptions(page);

      const details = changeDialog(page).getByTestId("room-type-details");
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
      await openRoomSettings(page);
      await openChangeDialog(page);

      const showDefaults = changeDialog(page).getByTestId(
        "show-default-settings-button",
      );
      await expect(showDefaults).toHaveText(
        "admin.room_types.default_room_settings.title",
      );
      await showDefaults.click();
      await expectDefaultSettings(page, defMeeting);
    });

    test("keeps the settings when saving the current room type", async ({
      page,
    }) => {
      await openRoomSettings(page);
      await openChangeDialog(page);

      const saveButton = changeDialog(page).getByTestId("dialog-save-button");
      await expect(saveButton).toHaveText("app.save");
      await saveButton.click();

      await expect(changeDialog(page)).toBeHidden();
      await expect(confirmationDialog(page)).toBeHidden();
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
      await expectExpertSettings(page, meetingState);
    });

    test("shows the default settings of another room type", async ({
      page,
    }) => {
      await openRoomSettings(page);
      await openChangeDialog(page);
      await roomTypeOption(page, 2).click();

      await expect(page.getByTestId("room-type-details")).toContainText(
        "Room type description for room type Exam",
      );
      const showDefaults = page.getByTestId("show-default-settings-button");
      await expect(showDefaults).toHaveText(
        "admin.room_types.default_room_settings.title",
      );
      await showDefaults.click();
      await expectDefaultSettings(page, defExam);

      await expect(confirmationDialog(page)).toBeHidden();
    });

    test("shows the comparison of the room type change", async ({ page }) => {
      await openRoomSettings(page);
      await selectRoomType(page, 2);

      const dialog = confirmationDialog(page);
      await expect(dialog).toContainText("rooms.change_type.title");
      await expect(
        dialog.getByText("rooms.settings.general.title"),
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
          dialog.getByTestId(`room-type-${field}-comparison`),
        ).toContainText(label);
      }

      for (const title of [
        "rooms.settings.video_conference.title",
        "rooms.settings.recordings.title",
        "rooms.settings.restrictions.title",
        "rooms.settings.participants.title",
        "rooms.settings.advanced.title",
      ]) {
        await expect(dialog.getByText(title)).toBeVisible();
      }

      await expectComparison(page, cmpExamNoReset);
    });

    test("updates the comparison when resetting to the defaults", async ({
      page,
    }) => {
      await openRoomSettings(page);
      await selectRoomType(page, 2);

      await confirmationDialog(page).locator("#reset-to-defaults").click();
      await expectComparison(page, cmpExamReset);
    });

    test("changes the room type and resets the settings to the defaults", async ({
      page,
    }) => {
      await openRoomSettings(page);
      await changeRoomType(page, 2, 1);

      await expectUnsavedChangesMessage(page, true);

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
      await expectExpertSettings(page, examState);
    });

    test("cancels changing the room type", async ({ page }) => {
      await openRoomSettings(page);
      await openChangeDialog(page);

      const cancelButton = changeDialog(page).getByTestId(
        "dialog-cancel-button",
      );
      await expect(cancelButton).toHaveText("app.cancel");
      await cancelButton.click();

      await expect(changeDialog(page)).toBeHidden();
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        "Meeting",
      );
      await expect(
        page.getByTestId("room-unsaved-changes-message"),
      ).toBeHidden();
    });

    test("cancels confirming the room type change", async ({ page }) => {
      await openRoomSettings(page);
      await changeRoomType(page, 2, 1);
      await expect(page.locator("#room-setting-room_type")).toHaveValue("Exam");

      await selectRoomType(page, 1);
      const cancelButton = confirmationDialog(page).getByTestId(
        "confirmation-dialog-cancel-button",
      );
      await expect(cancelButton).toHaveText("app.cancel");
      await cancelButton.click();

      await expect(confirmationDialog(page)).toBeHidden();
      // The room type dialog stays open
      await expect(changeDialog(page)).toBeVisible();
      await expect(
        changeDialog(page).getByTestId("dialog-save-button"),
      ).toHaveText("app.save");
      await changeDialog(page).getByTestId("dialog-cancel-button").click();
      await expect(changeDialog(page)).toBeHidden();
      await expect(page.locator("#room-setting-room_type")).toHaveValue("Exam");
    });

    test("shows the confirmation again after cancelling it", async ({
      page,
    }) => {
      await openRoomSettings(page);
      await selectRoomType(page, 2);
      await confirmationDialog(page)
        .getByTestId("confirmation-dialog-cancel-button")
        .click();
      await expect(confirmationDialog(page)).toBeHidden();

      await changeDialog(page).getByTestId("dialog-save-button").click();
      await expect(confirmationDialog(page)).toBeVisible();
      await expectComparison(page, cmpExamNoReset);
    });

    test.describe("after changing to Exam", () => {
      test.beforeEach(async ({ page }) => {
        await openRoomSettings(page);
        await changeRoomType(page, 2, 1);
        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam",
        );
      });

      test("shows the comparison when changing back without resetting", async ({
        page,
      }) => {
        await selectRoomType(page, 1);
        await expectComparison(page, cmpBackToMeeting);
      });

      test("changes back to the previous room type without resetting", async ({
        page,
      }) => {
        await changeRoomType(page, 1);

        await expectUnsavedChangesMessage(page, true);

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
        await expectExpertSettings(page, meetingAfterExamState);
      });
    });

    test.describe("after changing to Exam and back to Meeting", () => {
      test.beforeEach(async ({ page }) => {
        await openRoomSettings(page);
        await changeRoomType(page, 2, 1);
        await changeRoomType(page, 1);
        await expectUnsavedChangesMessage(page, true);
      });

      test("shows the default settings of a room type with enforced settings", async ({
        page,
      }) => {
        await openChangeDialog(page);
        await roomTypeOption(page, 3).click();
        await page.getByTestId("show-default-settings-button").click();
        await expectDefaultSettings(page, defSeminar);
      });

      test("shows the comparison with a room type with enforced settings", async ({
        page,
      }) => {
        await selectRoomType(page, 3);
        await expectComparison(page, cmpSeminar);
      });

      test("changes to a room type with enforced settings", async ({
        page,
      }) => {
        await changeRoomType(page, 3);

        await expectUnsavedChangesMessage(page, true);

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
        await expectExpertSettings(page, seminarState);
      });
    });
  });

  test.describe("features", () => {
    const withStreaming = (roomTypes, ...indexes) => {
      for (const index of indexes) {
        roomTypes.data[index].features.streaming.enabled = true;
      }
      return roomTypes;
    };

    const expectStreamingFeature = async (page, tagClass) => {
      const details = changeDialog(page).getByTestId("room-type-details");
      await expect(details).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toBeVisible();
      await expect(details.getByTestId("room-type-features")).toContainText(
        "rooms.room_types.features.title",
      );
      await expect(
        details.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(new RegExp(`\\b${tagClass}\\b`));
    };

    const expectNoFeatures = async (page) => {
      await expect(
        changeDialog(page).getByTestId("room-type-details"),
      ).toBeVisible();
      await expect(
        changeDialog(page).getByTestId("room-type-features"),
      ).toHaveCount(0);
    };

    test("shows the streaming feature of the room types", async ({
      page,
      config,
    }) => {
      config.data.streaming.enabled = true;
      await mockRoomTypes(
        page,
        withStreaming(readFixture("roomTypesWithSettings.json"), 0),
      );

      await openRoomSettings(page);
      await openChangeDialog(page);
      await expect(changeDialog(page)).toBeVisible();

      await expectStreamingFeature(page, "p-tag-secondary");

      // Select other room type
      await roomTypeOption(page, 0).click();
      await expectStreamingFeature(page, "p-tag-success");
    });

    test("shows the streaming feature if the current room type has it enabled", async ({
      page,
      config,
    }) => {
      config.data.streaming.enabled = true;
      await mockRoomTypes(
        page,
        withStreaming(readFixture("roomTypesWithSettings.json"), 1),
      );
      const settings = readFixture("roomSettings.json");
      settings.data.room_type.features.streaming.enabled = true;
      await mockRoomSettings(page, settings);

      await openRoomSettings(page);
      await expect(changeDialog(page)).toBeHidden();
      await openChangeDialog(page);

      await expect(changeDialog(page)).toContainText("rooms.change_type.title");
      await expectRoomTypeOptions(page);
      await expectStreamingFeature(page, "p-tag-success");

      // Select other room type
      await roomTypeOption(page, 0).click();
      await expectStreamingFeature(page, "p-tag-secondary");
    });

    test("hides the features if streaming is disabled", async ({
      page,
      config,
    }) => {
      config.data.streaming.enabled = false;
      await mockRoomTypes(
        page,
        withStreaming(readFixture("roomTypesWithSettings.json"), 0),
      );

      await openRoomSettings(page);
      await openChangeDialog(page);
      await expectNoFeatures(page);

      // Select other room type
      await roomTypeOption(page, 0).click();
      await expectNoFeatures(page);
    });

    test("shows disabled features if streaming is disabled and hiding disabled features is off", async ({
      page,
      config,
    }) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = false;
      const settings = readFixture("roomSettings.json");
      settings.data.room_type.features.streaming.enabled = true;
      await mockRoomSettings(page, settings);
      await mockRoomTypes(
        page,
        withStreaming(readFixture("roomTypesWithSettings.json"), 0, 1),
      );

      await openRoomSettings(page);
      await openChangeDialog(page);
      await expectStreamingFeature(page, "p-tag-secondary");

      // Select other room type
      await roomTypeOption(page, 0).click();
      await expectStreamingFeature(page, "p-tag-secondary");
    });
  });

  test.describe("without expert mode", () => {
    test.beforeEach(async ({ page }) => {
      const roomTypes = readFixture("roomTypesWithSettings.json");
      roomTypes.data[4] = { ...roomTypes.data[2] };
      roomTypes.data[4].id = 5;
      roomTypes.data[4].name = "Exam 2";
      roomTypes.data[4].everyone_can_start_default = false;
      roomTypes.data[4].allow_guests_default = true;
      await mockRoomTypes(page, roomTypes);

      const roomSettings = readFixture("roomSettings.json");
      roomSettings.data.expert_mode = false;
      roomSettings.data.welcome = "";
      await mockRoomSettings(page, roomSettings);

      await openRoomSettings(page);
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
    });

    const expectBaseSettings = async (page, roomType, allowGuests) => {
      await expect(page.locator("#room-setting-room_type")).toHaveValue(
        roomType,
      );
      await expect(page.locator("#room-setting-name")).toHaveValue(
        "Meeting One",
      );
      await expect(page.locator("#room-setting-access_code")).toHaveValue(
        "123456789",
      );
      await expectCheckbox(page, "allow_guests", ...allowGuests);
      await expect(page.locator("#room-setting-short_description")).toHaveValue(
        "Short description",
      );
      await expectNonExpertSettingsHidden(page);
    };

    test("shows the comparison of the room type change", async ({ page }) => {
      await openChangeDialog(page);
      await roomTypeOption(page, 2).click();
      await expectCheckbox(page, "allow_guests", true, true);
      await changeDialog(page).getByTestId("dialog-save-button").click();

      await expect(confirmationDialog(page)).toBeVisible();
      await expect(confirmationDialog(page)).toContainText(
        "rooms.change_type.title",
      );
      await expectComparison(page, nxExam);
    });

    test("updates only the non-expert settings when resetting to the defaults", async ({
      page,
    }) => {
      await selectRoomType(page, 2);
      await confirmationDialog(page).locator("#reset-to-defaults").click();
      await expectComparison(page, nxExamReset);
    });

    test("changes the room type without the expert settings", async ({
      page,
    }) => {
      await changeRoomType(page, 2, 2);

      await expectUnsavedChangesMessage(page, false);
      await expectBaseSettings(page, "Exam", [false, true]);
    });

    test.describe("after changing to Exam", () => {
      test.beforeEach(async ({ page }) => {
        await changeRoomType(page, 2, 2);
        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam",
        );
      });

      test("shows the comparison with a room type where only the defaults differ", async ({
        page,
      }) => {
        await selectRoomType(page, 4);
        await expect(confirmationDialog(page)).toContainText(
          "rooms.change_type.title",
        );
        await expectComparison(page, nxExam2);
      });

      test("changes to a room type where only the defaults differ", async ({
        page,
      }) => {
        await changeRoomType(page, 4);

        await expectUnsavedChangesMessage(page, false);
        await expectBaseSettings(page, "Exam 2", [false, true]);
      });
    });

    test.describe("after changing to Exam and Exam 2", () => {
      test.beforeEach(async ({ page }) => {
        await changeRoomType(page, 2, 2);
        await changeRoomType(page, 4);
        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Exam 2",
        );
      });

      test("shows the comparison when changing back to the original room type", async ({
        page,
      }) => {
        await openChangeDialog(page);
        await roomTypeOption(page, 1).click();
        await expectCheckbox(page, "allow_guests", false, true);
        await changeDialog(page).getByTestId("dialog-save-button").click();

        await expect(confirmationDialog(page)).toBeVisible();
        await expect(confirmationDialog(page)).toContainText(
          "rooms.change_type.title",
        );
        await expectComparison(page, nxMeeting);
      });

      test("hides the unsaved changes message when changing back to the original room type", async ({
        page,
      }) => {
        await changeRoomType(page, 1);

        await expect(page.locator("#room-setting-room_type")).toHaveValue(
          "Meeting",
        );
        await expect(
          page.getByTestId("room-unsaved-changes-message"),
        ).toBeHidden();
        await expectBaseSettings(page, "Meeting", [true, true]);
      });
    });

    test("does not show the comparison when selecting the same room type", async ({
      page,
    }) => {
      await openChangeDialog(page);
      await changeDialog(page).getByTestId("dialog-save-button").click();

      await expect(changeDialog(page)).toBeHidden();
      await expect(confirmationDialog(page)).toBeHidden();
    });
  });

  test.describe("errors loading room types", () => {
    test("shows the loading error and allows to reload", async ({ page }) => {
      const release = await holdRequest(page, ROOM_TYPES_URL, {
        status: 500,
        json: { message: "Test" },
      });

      await openRoomSettings(page);
      await expect(changeDialog(page)).toBeHidden();
      await page.getByTestId("room-type-change-button").click();

      // Check that dialog loading is shown correctly
      const dialog = changeDialog(page);
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.change_type.title");
      await expect(dialog.getByTestId("overlay")).toBeVisible();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeVisible();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      release();

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
      await mockRoomTypes(page);
      const roomTypesRequest = page.waitForRequest(ROOM_TYPES_URL);
      const reloadButton = dialog.getByTestId("reload-room-types-button");
      await expect(reloadButton).toBeVisible();
      await reloadButton.click();
      await roomTypesRequest;

      await expectRoomTypeOptions(page);

      // Close dialog
      await dialog.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();
    });

    test("handles auth errors when loading the room types", async ({
      page,
    }) => {
      await openRoomSettings(page);

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
