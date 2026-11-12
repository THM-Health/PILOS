import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  interceptAdminRoomTypesViewRequests,
  interceptAdminRoomTypesIndexRequests,
} from "../support/mocks.js";
import {
  roomTypeCheckDefaultRoomSettingCheckboxField,
  expectAdminBreadcrumbs,
  expectRoleChips,
  expectMultiselectOptions,
} from "../support/admin.js";
import { holdRequest } from "../support/utils.js";

const ENFORCED = "admin.room_types.default_room_settings.enforced";
const SELECTED = /\bselected\b/;
const NOT_SELECTED = /^(?!.*\bselected\b)/;
const DEFAULT = "admin.room_types.default_room_settings.default";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const serverError = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];
const modelNotFound = [
  'app.flash.model_not_found.title_{"model":"app.model.room_type"}',
  'app.flash.model_not_found.details_{"ids":"3"}',
];

/**
 * Values the room type gets after all settings were changed in the form (see `changeAllSettings`)
 * @type {object}
 */
const changedRoomTypeData = {
  name: "Exam 01",
  description: "New room type description for room type Exam 01",
  color: "#ef4444",
  server_pool: {
    id: 2,
    name: "Production",
    description: "Pool for production",
    servers_count: 1,
    model_name: "ServerPool",
    updated_at: "2020-12-21T13:43:21.000000Z",
  },
  max_participants: 50,
  max_duration: 60,
  create_parameters: "meetingLayout=PRESENTATION_FOCUS",
  join_parameters: "enforceLayout=PRESENTATION_ONLY",
  restrict: false,
  roles: [],
  mute_on_start_default: false,
  mute_on_start_enforced: false,
  lock_settings_disable_cam_default: true,
  lock_settings_disable_cam_enforced: true,
  webcams_only_for_moderator_default: false,
  webcams_only_for_moderator_enforced: true,
  lock_settings_disable_mic_default: true,
  lock_settings_disable_mic_enforced: false,
  lock_settings_disable_private_chat_default: true,
  lock_settings_disable_private_chat_enforced: true,
  lock_settings_disable_public_chat_default: false,
  lock_settings_disable_public_chat_enforced: true,
  lock_settings_disable_note_default: false,
  lock_settings_disable_note_enforced: false,
  lock_settings_hide_user_list_default: false,
  lock_settings_hide_user_list_enforced: true,
  everyone_can_start_default: true,
  everyone_can_start_enforced: true,
  allow_membership_default: true,
  allow_membership_enforced: false,
  allow_guests_default: false,
  allow_guests_enforced: false,
  default_role_default: 2,
  default_role_enforced: true,
  lobby_default: 0,
  lobby_enforced: false,
  visibility_default: 0,
  visibility_enforced: true,
  record_attendance_default: true,
  record_attendance_enforced: true,
  record_default: true,
  record_enforced: true,
  auto_start_recording_default: true,
  auto_start_recording_enforced: true,
  has_access_code_default: false,
  has_access_code_enforced: true,
};

const superuserAndStaff = [
  { id: 1, name: "Superuser" },
  { id: 2, name: "Staff" },
];

/**
 * @param {object} [changes]
 * @returns {object}
 */
function roomTypeWith(changes = {}) {
  const roomType = readFixture("roomType.json");
  Object.assign(roomType.data, changes);
  return roomType;
}

/**
 * The room type as it is sent to the backend (server pool and roles as ids)
 * @param {object} roomType
 * @returns {object}
 */
function toRequestBody(roomType) {
  const data = { ...roomType.data };
  data.server_pool = data.server_pool.id;
  if (data.roles.length > 0) {
    data.roles = data.roles.map((role) => role.id);
  }
  return data;
}

async function mockRoomTypeGet(page, response) {
  await page.route("**/api/v1/roomTypes/3", (route) =>
    route.request().method() === "GET"
      ? route.fulfill(response)
      : route.fallback(),
  );
}

async function mockRoomTypePut(page, response) {
  await page.route("**/api/v1/roomTypes/3", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill(response)
      : route.fallback(),
  );
}

async function mockRolesGet(page, response) {
  await page.route("**/api/v1/roles*", (route) =>
    route.request().method() === "GET"
      ? route.fulfill(response)
      : route.fallback(),
  );
}

async function mockServerPoolsGet(page, response) {
  await page.route("**/api/v1/serverPools*", (route) =>
    route.request().method() === "GET"
      ? route.fulfill(response)
      : route.fallback(),
  );
}

const settingFields = [
  "has-access-code",
  "allow-guests",
  "everyone-can-start",
  "mute-on-start",
  "record-attendance",
  "record",
  "auto-start-recording",
  "disable-cam",
  "webcams-only-for-moderator",
  "disable-mic",
  "disable-public-chat",
  "disable-private-chat",
  "disable-note",
  "hide-user-list",
  "allow-membership",
];

function allFormInputs(page) {
  return [
    page.locator("#room-type-name"),
    page.locator("#description"),
    page.locator("#custom-color"),
    page.locator("#restrict"),
    page.locator("#max-participants"),
    page.getByTestId("clear-max-participants-button"),
    page.locator("#max-duration"),
    page.getByTestId("clear-max-duration-button"),
    ...settingFields.flatMap((field) => [
      page.locator(`#${field}-default`),
      page.getByTestId(`${field}-enforced`),
    ]),
    page.locator("#lobby-disabled"),
    page.locator("#lobby-enabled"),
    page.locator("#lobby-only-for-guests"),
    page.getByTestId("lobby-enforced"),
    page.getByTestId("default-role-default-button"),
    page.getByTestId("default-role-enforced"),
    page.getByTestId("visibility-default-button"),
    page.getByTestId("visibility-enforced"),
  ];
}

async function expectChangedSettingsShown(page, { restrict = false } = {}) {
  await expect(page.locator("#room-type-name")).toHaveValue("Exam 01");
  await expect(page.locator("#description")).toHaveValue(
    "New room type description for room type Exam 01",
  );
  await expect(page.locator("#custom-color")).toHaveValue("#ef4444");
  await expect(
    page.getByTestId("server-pool-dropdown").locator(".multiselect__tags"),
  ).toContainText("Production");
  if (restrict) {
    await expect(page.locator("#restrict")).toBeChecked();
    await expectRoleChips(page, ["Superuser", "Staff"]);
  } else {
    await expect(page.locator("#restrict")).not.toBeChecked();
  }
  await expect(page.locator("#max-participants")).toHaveValue("50");
  await expect(page.locator("#max-duration")).toHaveValue("60 min.");

  const expected = [
    ["has-access-code", false, true],
    ["allow-guests", false, false],
    ["everyone-can-start", true, true],
    ["mute-on-start", false, false],
    ["record-attendance", true, true],
    ["record", true, true],
    ["auto-start-recording", true, true],
    ["disable-cam", true, true],
    ["webcams-only-for-moderator", false, true],
    ["disable-mic", true, false],
    ["disable-public-chat", false, true],
    ["disable-private-chat", true, true],
    ["disable-note", false, false],
    ["hide-user-list", false, true],
    ["allow-membership", true, false],
  ];
  for (const [field, value, enforced] of expected) {
    await roomTypeCheckDefaultRoomSettingCheckboxField(
      page,
      field,
      value,
      enforced,
      false,
    );
  }

  await expect(page.locator("#lobby-disabled")).toBeChecked();
  await expect(page.getByTestId("lobby-enforced")).toHaveText(DEFAULT);

  const roleButton = page.getByTestId("default-role-default-button").nth(1);
  await expect(roleButton).toHaveText("rooms.roles.moderator");
  await expect(roleButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("default-role-enforced")).toHaveText(ENFORCED);

  const visibilityButton = page.getByTestId("visibility-default-button").nth(0);
  await expect(visibilityButton).toHaveText(
    "rooms.settings.advanced.visibility.private",
  );
  await expect(visibilityButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("visibility-enforced")).toHaveText(ENFORCED);

  await expect(page.locator("#create-parameters")).toHaveValue(
    "meetingLayout=PRESENTATION_FOCUS",
  );
  await expect(page.locator("#join-parameters")).toHaveValue(
    "enforceLayout=PRESENTATION_ONLY",
  );
}

async function changeAllSettings(page) {
  await page.locator("#room-type-name").fill("Exam 01");
  await page
    .locator("#description")
    .fill("New room type description for room type Exam 01");
  await page.getByTestId("color-button").nth(7).click();

  await page.getByTestId("server-pool-dropdown").click();
  await page.locator(".multiselect__option").nth(1).click();

  await page.locator("#max-participants").fill("50");
  await page.locator("#max-duration").fill("60");

  for (const field of settingFields) {
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
  await page
    .locator("#join-parameters")
    .fill("enforceLayout=PRESENTATION_ONLY");
}

test.describe("Admin room types edit", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "serverPools.viewAny",
      "roomTypes.view",
      "roomTypes.update",
      "roomTypes.create",
      "roomTypes.delete",
    ];
    await interceptAdminRoomTypesViewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/room_types/3/edit");
  });

  test("visit with user without permission to edit room types", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view", "roomTypes.view"];

    await page.goto("/admin/room_types/3/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/room_types\/3\/edit/);
  });

  test("check button visibility without delete permission", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "serverPools.viewAny",
      "roomTypes.view",
      "roomTypes.update",
      "roomTypes.create",
    ];

    await page.goto("/admin/room_types/3/edit");

    const cancelButton = page.getByTestId("room-types-cancel-edit-button");
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText("app.cancel_editing");
    await expect(cancelButton).toHaveAttribute("href", "/admin/room_types/3");
    await expect(page.getByTestId("room-types-edit-button")).toHaveCount(0);
    await expect(page.getByTestId("room-types-delete-button")).toHaveCount(0);
    const saveButton = page.getByTestId("room-types-save-button");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    await expect(saveButton).toContainText("app.save");
  });

  test.describe("edit room type", () => {
    test("shows loading state while the room type is loaded", async ({
      page,
    }) => {
      const release = await holdRequest(page, "**/api/v1/roomTypes/3", {
        path: "tests/Playwright/fixtures/roomType.json",
      });
      const serverPoolsRequest = page.waitForRequest("**/api/v1/serverPools*");
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByText("admin.title").first()).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(
        page.getByTestId("room-types-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-types-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("room-types-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      release();
      await serverPoolsRequest;
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");

      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test.describe("loaded", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/room_types/3/edit");
        await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      });

      test("shows buttons and breadcrumbs", async ({ page }) => {
        const cancelButton = page.getByTestId("room-types-cancel-edit-button");
        await expect(cancelButton).toBeVisible();
        await expect(cancelButton).toHaveJSProperty("tagName", "A");
        await expect(cancelButton).toContainText("app.cancel_editing");
        await expect(cancelButton).toHaveAttribute(
          "href",
          "/admin/room_types/3",
        );
        await expect(page.getByTestId("room-types-edit-button")).toHaveCount(0);
        await expect(
          page.getByTestId("room-types-delete-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-types-delete-button"),
        ).toBeEnabled();
        const saveButton = page.getByTestId("room-types-save-button");
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();
        await expect(saveButton).toContainText("app.save");

        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.room_types.index",
          'admin.breadcrumbs.room_types.edit_{"name":"Exam"}',
        );
      });

      test("shows name, description and preview", async ({ page }) => {
        const nameField = page.getByTestId("room-type-name-field");
        await expect(nameField).toBeVisible();
        await expect(nameField).toContainText("app.model_name");

        const descriptionField = page.getByTestId("description-field");
        await expect(descriptionField).toBeVisible();
        await expect(descriptionField).toContainText("app.description");
        await expect(descriptionField.locator("#description")).toHaveValue(
          "Room type description for room type Exam",
        );

        const previewField = page.getByTestId("preview-field");
        await expect(previewField).toBeVisible();
        await expect(previewField).toContainText("admin.room_types.preview");
      });

      test("changing the name does not change the breadcrumbs", async ({
        page,
      }) => {
        await page.locator("#room-type-name").fill("Exam 01");

        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.room_types.index",
          'admin.breadcrumbs.room_types.edit_{"name":"Exam"}',
        );
        await expect(
          page.getByTestId("preview-field").getByTestId("room-type-badge"),
        ).toHaveText("rooms.index.room_component.room_type:Exam 01");
      });

      test("color selection", async ({ page }) => {
        const colorField = page.getByTestId("color-field");
        await expect(colorField).toBeVisible();
        await expect(colorField).toContainText("admin.room_types.color");
        await expect(colorField).toContainText("admin.room_types.custom_color");

        const buttons = colorField.getByTestId("color-button");
        await expect(buttons).toHaveCount(10);
        for (let i = 0; i < 10; i++) {
          await expect(buttons.nth(i)).toHaveAttribute("role", "button");
          await expect(buttons.nth(i)).toHaveClass(/cursor-pointer/);
          await expect(buttons.nth(i)).not.toHaveClass(/pointer-events-none/);
          await expect(buttons.nth(i)).not.toHaveClass(/\bselected\b/);
        }

        // Clear custom color and check that no color button is selected
        const customColor = colorField.locator("#custom-color");
        await expect(customColor).toHaveValue("#4a5c66");
        await expect(customColor).toBeEnabled();
        await customColor.clear();
        for (let i = 0; i < 10; i++) {
          await expect(buttons.nth(i)).toHaveClass(NOT_SELECTED);
        }

        // Set custom color and check that the matching color button is selected
        await customColor.fill("#06b6d4");
        for (let i = 0; i < 10; i++) {
          await expect(buttons.nth(i)).toHaveClass(
            i === 2 ? SELECTED : NOT_SELECTED,
          );
        }

        // Click on color button and check that the color button is selected
        await buttons.nth(7).click();
        for (let i = 0; i < 10; i++) {
          await expect(buttons.nth(i)).toHaveClass(
            i === 7 ? SELECTED : NOT_SELECTED,
          );
        }
        await expect(customColor).toHaveValue("#ef4444");

        await expect(
          page.getByTestId("preview-field").getByTestId("room-type-badge"),
        ).toHaveCSS("background-color", "rgb(239, 68, 68)");
      });

      test("server pool options", async ({ page }) => {
        const content = page.locator(".multiselect__content");
        await expect(content).toBeHidden();

        const field = page.getByTestId("server-pool-field");
        await expect(field).toBeVisible();
        await expect(field).toContainText("app.server_pool");
        const dropdown = field.getByTestId("server-pool-dropdown");
        await expect(dropdown.locator(".multiselect__tags")).toContainText(
          "Test",
        );
        await dropdown.locator(".multiselect__tags").click();

        await expect(content).toBeVisible();
        await expectMultiselectOptions(
          content,
          ["Test", "Production"],
          "admin.server_pools.no_data",
        );
        await expect(
          content.locator(".multiselect__option").nth(0),
        ).toHaveClass(/multiselect__option--selected/);

        await content.locator(".multiselect__option").nth(1).click();

        await expect(content).toBeHidden();
        await expect(dropdown.locator(".multiselect__tags")).toContainText(
          "Production",
        );
      });

      test("restrict, max participants and max duration", async ({ page }) => {
        const restrictField = page.getByTestId("restrict-field");
        await expect(restrictField).toBeVisible();
        await expect(restrictField).toContainText("admin.room_types.restrict");
        await expect(restrictField.locator("#restrict")).not.toBeChecked();
        await expect(restrictField.locator("#restrict")).toBeEnabled();

        await expect(page.getByTestId("role-field")).toHaveCount(0);

        const participantsField = page.getByTestId("max-participants-field");
        await expect(participantsField).toBeVisible();
        await expect(participantsField).toContainText(
          "admin.room_types.max_participants",
        );
        await expect(
          participantsField.locator("#max-participants"),
        ).toHaveValue("100");
        await participantsField.locator("#max-participants").fill("50");
        await expect(
          participantsField.locator("#max-participants"),
        ).toHaveValue("50");
        const clearParticipants = participantsField.getByTestId(
          "clear-max-participants-button",
        );
        await expect(clearParticipants).toBeVisible();
        await expect(clearParticipants).toBeEnabled();

        const durationField = page.getByTestId("max-duration-field");
        await expect(durationField).toBeVisible();
        await expect(durationField).toContainText(
          "admin.room_types.max_duration",
        );
        await expect(durationField.locator("#max-duration")).toHaveValue(
          "120 min.",
        );
        await durationField.locator("#max-duration").fill("60");
        await expect(durationField.locator("#max-duration")).toHaveValue("60");
        const clearDuration = durationField.getByTestId(
          "clear-max-duration-button",
        );
        await expect(clearDuration).toBeVisible();
        await expect(clearDuration).toBeEnabled();
      });

      test("shows the default room settings", async ({ page }) => {
        await expect(
          page.getByText("admin.room_types.default_room_settings.title"),
        ).toBeVisible();

        const checkboxFields = [
          [
            "General",
            "rooms.settings.general.title",
            [
              [
                "has-access-code",
                "rooms.settings.general.has_access_code",
                true,
                false,
              ],
              [
                "allow-guests",
                "rooms.settings.general.allow_guests",
                true,
                true,
              ],
            ],
          ],
          [
            "Video conference",
            "rooms.settings.video_conference.title",
            [
              [
                "everyone-can-start",
                "rooms.settings.video_conference.everyone_can_start",
                false,
                false,
              ],
              [
                "mute-on-start",
                "rooms.settings.video_conference.mute_on_start",
                true,
                true,
              ],
            ],
          ],
          [
            "Recordings",
            "rooms.settings.recordings.title",
            [
              [
                "record-attendance",
                "rooms.settings.recordings.record_attendance",
                false,
                false,
              ],
              [
                "record",
                "rooms.settings.recordings.record_video_conference",
                false,
                false,
              ],
              [
                "auto-start-recording",
                "rooms.settings.recordings.auto_start_recording",
                false,
                false,
              ],
            ],
          ],
          [
            "Restrictions",
            "rooms.settings.restrictions.title",
            [
              [
                "disable-cam",
                "rooms.settings.restrictions.lock_settings_disable_cam",
                false,
                false,
              ],
              [
                "webcams-only-for-moderator",
                "rooms.settings.restrictions.webcams_only_for_moderator",
                true,
                false,
              ],
              [
                "disable-mic",
                "rooms.settings.restrictions.lock_settings_disable_mic",
                false,
                true,
              ],
              [
                "disable-public-chat",
                "rooms.settings.restrictions.lock_settings_disable_public_chat",
                true,
                false,
              ],
              [
                "disable-private-chat",
                "rooms.settings.restrictions.lock_settings_disable_private_chat",
                false,
                false,
              ],
              [
                "disable-note",
                "rooms.settings.restrictions.lock_settings_disable_note",
                true,
                true,
              ],
              [
                "hide-user-list",
                "rooms.settings.restrictions.lock_settings_hide_user_list",
                true,
                false,
              ],
            ],
          ],
          [
            "Participants",
            "rooms.settings.participants.title",
            [
              [
                "allow-membership",
                "rooms.settings.participants.allow_membership",
                false,
                true,
              ],
            ],
          ],
        ];

        for (const [, title, fields] of checkboxFields) {
          await expect(
            page.getByRole("heading", { name: title, exact: true }),
          ).toBeVisible();
          for (const [field, label, value, enforced] of fields) {
            const fieldLocator = page.getByTestId(`${field}-field`);
            await expect(fieldLocator).toBeVisible();
            await expect(fieldLocator).toContainText(label);
            await roomTypeCheckDefaultRoomSettingCheckboxField(
              page,
              field,
              value,
              enforced,
              false,
            );
          }
        }
      });

      test("shows the lobby setting", async ({ page }) => {
        const lobbyField = page.getByTestId("lobby-field");
        await expect(lobbyField).toBeVisible();
        await expect(lobbyField).toContainText(
          "rooms.settings.video_conference.lobby.title",
        );

        const disabledField = lobbyField.getByTestId("lobby-disabled-field");
        await expect(disabledField).toBeVisible();
        await expect(disabledField).toContainText("app.disabled");
        await expect(
          disabledField.locator("#lobby-disabled"),
        ).not.toBeChecked();
        await expect(disabledField.locator("#lobby-disabled")).toBeEnabled();

        const enabledField = lobbyField.getByTestId("lobby-enabled-field");
        await expect(enabledField).toBeVisible();
        await expect(enabledField).toContainText("app.enabled");
        await expect(enabledField.locator("#lobby-enabled")).not.toBeChecked();
        await expect(enabledField.locator("#lobby-enabled")).toBeEnabled();

        const guestsField = lobbyField.getByTestId(
          "lobby-only-for-guests-field",
        );
        await expect(guestsField).toBeVisible();
        await expect(guestsField).toContainText(
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
        );
        await expect(
          guestsField.locator("#lobby-only-for-guests"),
        ).toBeChecked();
        await expect(
          guestsField.locator("#lobby-only-for-guests"),
        ).toBeEnabled();

        const enforced = lobbyField.getByTestId("lobby-enforced");
        await expect(enforced).toHaveText(ENFORCED);
        await expect(enforced).toBeEnabled();
      });

      test("shows the default role setting", async ({ page }) => {
        const field = page.getByTestId("default-role-field");
        await expect(field).toBeVisible();
        await expect(field).toContainText(
          "rooms.settings.participants.default_role.title",
        );
        await expect(field).toContainText(
          "rooms.settings.participants.default_role.only_logged_in",
        );

        const buttons = field.getByTestId("default-role-default-button");
        await expect(buttons).toHaveCount(2);
        await expect(buttons.nth(0)).toHaveText("rooms.roles.participant");
        await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "true");
        await expect(buttons.nth(0)).toBeEnabled();
        await expect(buttons.nth(1)).toHaveText("rooms.roles.moderator");
        await expect(buttons.nth(1)).not.toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(buttons.nth(1)).toBeEnabled();

        const enforced = field.getByTestId("default-role-enforced");
        await expect(enforced).toHaveText(DEFAULT);
        await expect(enforced).toBeEnabled();
      });

      test("shows the visibility setting", async ({ page }) => {
        await expect(
          page.getByText("rooms.settings.advanced.title", { exact: true }),
        ).toBeVisible();

        const field = page.getByTestId("visibility-field");
        await expect(field).toBeVisible();
        await expect(field).toContainText("rooms.settings.advanced.visibility");

        const buttons = field.getByTestId("visibility-default-button");
        await expect(buttons).toHaveCount(2);
        await expect(buttons.nth(0)).toHaveText(
          "rooms.settings.advanced.visibility.private",
        );
        await expect(buttons.nth(0)).not.toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(buttons.nth(0)).toBeEnabled();
        await expect(buttons.nth(1)).toHaveText(
          "rooms.settings.advanced.visibility.public",
        );
        await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
        await expect(buttons.nth(1)).toBeEnabled();

        const enforced = field.getByTestId("visibility-enforced");
        await expect(enforced).toHaveText(DEFAULT);
        await expect(enforced).toBeEnabled();
      });

      test("shows the bbb api parameters", async ({ page }) => {
        await expect(
          page.getByText("admin.room_types.bbb_api.title"),
        ).toBeVisible();

        const createField = page.getByTestId("create-parameters-field");
        await expect(createField).toBeVisible();
        await expect(createField).toContainText(
          "admin.room_types.bbb_api.create_parameters",
        );
        await expect(createField).toContainText(
          "admin.room_types.bbb_api.create_parameters_description",
        );
        await expect(createField.locator("#create-parameters")).toHaveValue(
          "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
        );

        const joinField = page.getByTestId("join-parameters-field");
        await expect(joinField).toBeVisible();
        await expect(joinField).toContainText(
          "admin.room_types.bbb_api.join_parameters",
        );
        await expect(joinField).toContainText(
          "admin.room_types.bbb_api.join_parameters_description",
        );
        await expect(joinField.locator("#join-parameters")).toHaveValue(
          "enforceLayout=PRESENTATION_ONLY\nwebcamBackgroundURL=https://example.com/background.png\nexcludeFromDashboard=true\nuserdata-bbb_hide_presentation_on_join=true",
        );
      });
    });

    test.describe("saving", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/room_types/3/edit");
        await expect(page.locator("#room-type-name")).toHaveValue("Exam");
        await changeAllSettings(page);
      });

      test("sends the changed data", async ({ page }) => {
        const roomType = roomTypeWith(changedRoomTypeData);
        await mockRoomTypePut(page, { status: 201, json: roomType });
        await mockRoomTypeGet(page, { json: roomType });

        const saveRequest = page.waitForRequest(
          (request) =>
            request.method() === "PUT" &&
            request.url().includes("/api/v1/roomTypes/3"),
        );
        await page.getByTestId("room-types-save-button").click();

        expect((await saveRequest).postDataJSON()).toEqual(
          toRequestBody(roomType),
        );
      });

      test("shows the room type view after saving", async ({ page }) => {
        const roomType = roomTypeWith(changedRoomTypeData);
        await mockRoomTypePut(page, { status: 201, json: roomType });
        await mockRoomTypeGet(page, { json: roomType });

        await page.getByTestId("room-types-save-button").click();

        await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.room_types.index",
          'admin.breadcrumbs.room_types.view_{"name":"Exam 01"}',
        );
        await expect(page.getByTestId("overlay")).toBeHidden();
      });

      test("disables the form while saving", async ({ page }) => {
        const roomType = roomTypeWith(changedRoomTypeData);
        let releaseSave;
        const gate = new Promise((resolve) => (releaseSave = resolve));
        await page.route("**/api/v1/roomTypes/3", async (route) => {
          if (route.request().method() !== "PUT") {
            return route.fulfill({ json: roomType });
          }
          await gate;
          await route.fulfill({ status: 201, json: roomType });
        });
        await page.getByTestId("room-types-save-button").click();

        await expect(page.getByTestId("overlay")).toBeVisible();
        for (const input of allFormInputs(page)) {
          await expect(input.first()).toBeDisabled();
        }
        await expect(
          page.getByTestId("default-role-default-button"),
        ).toHaveCount(2);
        for (const index of [0, 1]) {
          await expect(
            page.getByTestId("default-role-default-button").nth(index),
          ).toBeDisabled();
          await expect(
            page.getByTestId("visibility-default-button").nth(index),
          ).toBeDisabled();
        }
        await expect(page.getByTestId("visibility-default-button")).toHaveCount(
          2,
        );

        const colorButtons = page.getByTestId("color-button");
        await expect(colorButtons).toHaveCount(10);
        for (let i = 0; i < 10; i++) {
          await expect(colorButtons.nth(i)).toHaveAttribute("role", "button");
          await expect(colorButtons.nth(i)).toHaveClass(
            /pointer-events-none opacity-80/,
          );
          await expect(colorButtons.nth(i)).not.toHaveClass(/cursor-pointer/);
        }
        await expect(page.getByTestId("server-pool-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );

        const cancelButton = page.locator(
          'button[data-test="room-types-cancel-edit-button"]',
        );
        await expect(cancelButton).toBeVisible();
        await expect(cancelButton).toBeDisabled();
        await expect(
          page.getByTestId("room-types-delete-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-types-delete-button"),
        ).toBeDisabled();
        await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

        releaseSave();
        await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
      });
    });
  });

  test.describe("roles with restriction", () => {
    const restrictedRoomType = () =>
      roomTypeWith({ restrict: true, roles: superuserAndStaff });

    const secondRolesPage = {
      data: [
        {
          id: 4,
          name: "Dean",
          default: false,
          updated_at: "2021-01-08T15:51:08.000000Z",
          model_name: "Role",
          room_limit: 20,
        },
        {
          id: 5,
          name: "Faculty",
          default: false,
          updated_at: "2021-03-19T09:12:44.000000Z",
          model_name: "Role",
          room_limit: 20,
        },
        {
          id: 6,
          name: "Manager",
          default: false,
          updated_at: "2021-05-22T11:55:21.000000Z",
          model_name: "Role",
          room_limit: -1,
        },
      ],
      meta: {
        current_page: 2,
        from: 4,
        last_page: 2,
        per_page: 3,
        to: 6,
        total: 6,
      },
    };

    test.beforeEach(async ({ page }) => {
      await mockRoomTypeGet(page, { json: restrictedRoomType() });
    });

    test("shows the roles and the role options", async ({ page }) => {
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("restrict-field")).toContainText(
        "admin.room_types.restrict",
      );
      await expect(page.locator("#restrict")).toBeChecked();
      await expect(page.locator("#restrict")).toBeEnabled();

      const content = page.locator(".multiselect__content");
      await expect(page.getByTestId("role-field")).toBeVisible();
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await expect(content).toBeHidden();

      await page.getByTestId("role-dropdown").click();

      await expect(content).toBeVisible();
      await expectMultiselectOptions(
        content,
        ["Superuser", "Staff", "Students"],
        "admin.roles.no_data",
      );
      await expect(
        content.locator(".multiselect__option").nth(0),
      ).toContainText("admin.roles.superuser");
    });

    test("loads the next page of roles", async ({ page }) => {
      await page.goto("/admin/room_types/3/edit");
      await page.getByTestId("role-dropdown").click();

      const content = page.locator(".multiselect__content");
      await expect(content.getByTestId("previous-page-button")).toContainText(
        "app.previous_page",
      );
      await expect(content.getByTestId("previous-page-button")).toBeDisabled();
      await expect(content.getByTestId("next-page-button")).toContainText(
        "app.next_page",
      );
      await expect(content.getByTestId("next-page-button")).toBeEnabled();

      const release = await holdRequest(page, "**/api/v1/roles*", {
        json: secondRolesPage,
      });
      await content.getByTestId("next-page-button").click();

      // Check loading
      await expect(content.getByTestId("previous-page-button")).toBeDisabled();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      release();

      await expect(content).toBeVisible();
      await expect(content.getByTestId("previous-page-button")).toBeEnabled();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        "admin.roles.no_data",
      );
    });

    test("adds, removes and saves roles", async ({ page }) => {
      await page.goto("/admin/room_types/3/edit");
      await page.getByTestId("role-dropdown").click();
      await mockRolesGet(page, { json: secondRolesPage });
      const content = page.locator(".multiselect__content");
      await content.getByTestId("next-page-button").click();
      await content.locator(".multiselect__option").nth(0).click();
      await content.locator(".multiselect__option").nth(2).click();
      await expect(content).toBeVisible();
      await expectRoleChips(page, ["Superuser", "Staff", "Dean", "Manager"]);

      // Remove roles
      const chips = page.getByTestId("role-dropdown").getByTestId("role-chip");
      await chips.nth(0).getByTestId("remove-role-button").click();
      await chips.nth(1).getByTestId("remove-role-button").click();
      await expectRoleChips(page, ["Staff", "Manager"]);

      const roomType = roomTypeWith({
        restrict: true,
        roles: [
          { id: 2, name: "Staff" },
          { id: 6, name: "Manager" },
        ],
      });
      let releaseSave;
      const gate = new Promise((resolve) => (releaseSave = resolve));
      await page.route("**/api/v1/roomTypes/3", async (route) => {
        if (route.request().method() !== "PUT") {
          return route.fulfill({ json: roomType });
        }
        await gate;
        await route.fulfill({ status: 201, json: roomType });
      });

      const saveRequest = page.waitForRequest(
        (request) =>
          request.method() === "PUT" &&
          request.url().includes("/api/v1/roomTypes/3"),
      );
      await expect(page.getByTestId("overlay")).toBeHidden();
      await page.getByTestId("room-types-save-button").click();

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#restrict")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(
        page.locator('button[data-test="room-types-cancel-edit-button"]'),
      ).toBeDisabled();
      await expect(page.getByTestId("room-types-delete-button")).toBeDisabled();
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      releaseSave();

      expect((await saveRequest).postDataJSON()).toEqual(
        toRequestBody(roomType),
      );

      await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });
  });

  test.describe("save errors", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomTypeGet(page, {
        json: roomTypeWith({ restrict: true, roles: superuserAndStaff }),
      });
      await page.goto("/admin/room_types/3/edit");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.room_types.index",
        'admin.breadcrumbs.room_types.edit_{"name":"Exam"}',
      );
    });

    const validationErrors = {
      name: ["The name field is required."],
      description: ["The description field is required."],
      color: ["The color field is required."],
      server_pool: ["The server pool field is required."],
      max_participants: ["The max participants field is required."],
      max_duration: ["The max duration field is required."],
      create_parameters: ["The create parameters field is required."],
      join_parameters: ["The join parameters field is required."],
      roles: ["The roles field is required."],
      has_access_code_default: [
        "The has access code default field is required.",
      ],
      has_access_code_enforced: [
        "The has access code enforced field is required.",
      ],
      allow_guests_default: ["The allow guests default field is required."],
      allow_guests_enforced: ["The allow guests enforced field is required."],
      everyone_can_start_default: [
        "The everyone can start default field is required.",
      ],
      everyone_can_start_enforced: [
        "The everyone can start enforced field is required.",
      ],
      mute_on_start_default: ["The mute on start default field is required."],
      mute_on_start_enforced: ["The mute on start enforced field is required."],
      lobby_default: ["The lobby default field is required."],
      lobby_enforced: ["The lobby enforced field is required."],
      record_attendance_default: [
        "The record attendance default field is required.",
      ],
      record_attendance_enforced: [
        "The record attendance enforced field is required.",
      ],
      record_default: ["The record default field is required."],
      record_enforced: ["The record enforced field is required."],
      auto_start_recording_default: [
        "The auto start recording default field is required.",
      ],
      auto_start_recording_enforced: [
        "The auto start recording enforced field is required.",
      ],
      lock_settings_disable_cam_default: [
        "The lock settings disable cam default field is required.",
      ],
      lock_settings_disable_cam_enforced: [
        "The lock settings disable cam enforced field is required.",
      ],
      webcams_only_for_moderator_default: [
        "The webcams only for moderator default field is required.",
      ],
      webcams_only_for_moderator_enforced: [
        "The webcams only for moderator enforced field is required.",
      ],
      lock_settings_disable_mic_default: [
        "The lock settings disable mic default field is required.",
      ],
      lock_settings_disable_mic_enforced: [
        "The lock settings disable mic enforced field is required.",
      ],
      lock_settings_disable_public_chat_default: [
        "The lock settings disable public chat default field is required.",
      ],
      lock_settings_disable_public_chat_enforced: [
        "The lock settings disable public chat enforced field is required.",
      ],
      lock_settings_disable_private_chat_default: [
        "The lock settings disable private chat default field is required.",
      ],
      lock_settings_disable_private_chat_enforced: [
        "The lock settings disable private chat enforced field is required.",
      ],
      lock_settings_disable_note_default: [
        "The lock settings disable note default field is required.",
      ],
      lock_settings_disable_note_enforced: [
        "The lock settings disable note enforced field is required.",
      ],
      lock_settings_hide_user_list_default: [
        "The lock settings hide user list default field is required.",
      ],
      lock_settings_hide_user_list_enforced: [
        "The lock settings hide user list enforced field is required.",
      ],
      allow_membership_default: [
        "The allow membership default field is required.",
      ],
      allow_membership_enforced: [
        "The allow membership enforced field is required.",
      ],
      default_role_default: ["The default role default field is required."],
      default_role_enforced: ["The default role enforced field is required."],
      visibility_default: ["The visibility default field is required."],
      visibility_enforced: ["The visibility enforced field is required."],
    };

    /** [field test id, error messages that must be shown inside the field] */
    const fieldErrors = [
      ["room-type-name-field", ["The name field is required."]],
      ["description-field", ["The description field is required."]],
      ["color-field", ["The color field is required."]],
      ["server-pool-field", ["The server pool field is required."]],
      ["max-participants-field", ["The max participants field is required."]],
      ["max-duration-field", ["The max duration field is required."]],
      ["create-parameters-field", ["The create parameters field is required."]],
      ["join-parameters-field", ["The join parameters field is required."]],
      ["role-field", ["The roles field is required."]],
      [
        "has-access-code-field",
        [
          "The has access code default field is required.",
          "The has access code enforced field is required.",
        ],
      ],
      [
        "allow-guests-field",
        [
          "The allow guests default field is required.",
          "The allow guests enforced field is required.",
        ],
      ],
      [
        "everyone-can-start-field",
        [
          "The everyone can start default field is required.",
          "The everyone can start enforced field is required.",
        ],
      ],
      [
        "mute-on-start-field",
        [
          "The mute on start default field is required.",
          "The mute on start enforced field is required.",
        ],
      ],
      [
        "lobby-field",
        [
          "The lobby default field is required.",
          "The lobby enforced field is required.",
        ],
      ],
      [
        "record-attendance-field",
        [
          "The record attendance default field is required.",
          "The record attendance enforced field is required.",
        ],
      ],
      [
        "record-field",
        [
          "The record default field is required.",
          "The record enforced field is required.",
        ],
      ],
      [
        "auto-start-recording-field",
        [
          "The auto start recording default field is required.",
          "The auto start recording enforced field is required.",
        ],
      ],
      [
        "disable-cam-field",
        [
          "The lock settings disable cam default field is required.",
          "The lock settings disable cam enforced field is required.",
        ],
      ],
      [
        "webcams-only-for-moderator-field",
        [
          "The webcams only for moderator default field is required.",
          "The webcams only for moderator enforced field is required.",
        ],
      ],
      [
        "disable-mic-field",
        [
          "The lock settings disable mic default field is required.",
          "The lock settings disable mic enforced field is required.",
        ],
      ],
      [
        "disable-public-chat-field",
        [
          "The lock settings disable public chat default field is required.",
          "The lock settings disable public chat enforced field is required.",
        ],
      ],
      [
        "disable-private-chat-field",
        [
          "The lock settings disable private chat default field is required.",
          "The lock settings disable private chat enforced field is required.",
        ],
      ],
      [
        "disable-note-field",
        [
          "The lock settings disable note default field is required.",
          "The lock settings disable note enforced field is required.",
        ],
      ],
      [
        "hide-user-list-field",
        [
          "The lock settings hide user list default field is required.",
          "The lock settings hide user list enforced field is required.",
        ],
      ],
      [
        "allow-membership-field",
        [
          "The allow membership default field is required.",
          "The allow membership enforced field is required.",
        ],
      ],
      [
        "default-role-field",
        [
          "The default role default field is required.",
          "The default role enforced field is required.",
        ],
      ],
      [
        "visibility-field",
        [
          "The visibility default field is required.",
          "The visibility enforced field is required.",
        ],
      ],
    ];

    const mock422 = (page) =>
      mockRoomTypePut(page, {
        status: 422,
        json: {
          message: "The name field is required. (and 39 more errors)",
          errors: validationErrors,
        },
      });

    test("shows validation errors on 422", async ({ page }) => {
      await mock422(page);

      await page.getByTestId("room-types-save-button").click();

      await expectToastAndClose(
        page,
        "The name field is required. (and 39 more errors)",
      );
      for (const [field, messages] of fieldErrors) {
        for (const message of messages) {
          await expect(page.getByTestId(field)).toContainText(message);
        }
      }
    });

    test("shows server error on 500 and hides validation errors", async ({
      page,
    }) => {
      await mock422(page);
      await page.getByTestId("room-types-save-button").click();
      await expectToastAndClose(
        page,
        "The name field is required. (and 39 more errors)",
      );
      await expect(page.getByTestId("room-type-name-field")).toContainText(
        "The name field is required.",
      );

      await mockRoomTypePut(page, { status: 500, json: { message: "Test" } });
      await page.getByTestId("room-types-save-button").click();

      await expectToastAndClose(page, serverError);
      for (const [field, messages] of fieldErrors) {
        for (const message of messages) {
          await expect(page.getByTestId(field)).not.toContainText(message);
        }
      }
    });

    test.describe("stale model", () => {
      const staleRoomType = () =>
        roomTypeWith({
          ...changedRoomTypeData,
          restrict: true,
          roles: superuserAndStaff,
        });

      test.beforeEach(async ({ page }) => {
        await mockRoomTypePut(page, {
          status: 428,
          json: { new_model: staleRoomType().data, message: "stale_model" },
        });
        await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
        await page.getByTestId("room-types-save-button").click();
      });

      test("shows the stale dialog", async ({ page }) => {
        const dialog = page.getByTestId("stale-room-type-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.room_type"}',
        );
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toBeVisible();
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("reload shows the new model", async ({ page }) => {
        await page.getByTestId("stale-dialog-reject-button").click();

        await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.room_types.index",
          'admin.breadcrumbs.room_types.edit_{"name":"Exam 01"}',
        );
        await expectChangedSettingsShown(page, { restrict: true });
      });

      test("shows the stale dialog again after a reload", async ({ page }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
        await expect(page.locator("#room-type-name")).toHaveValue("Exam 01");

        const newer = roomTypeWith({ name: "Exam 02", restrict: true });
        newer.data.roles = superuserAndStaff;
        await mockRoomTypePut(page, {
          status: 428,
          json: { new_model: newer.data, message: "stale_model" },
        });
        await page.getByTestId("room-types-save-button").click();

        const dialog = page.getByTestId("stale-room-type-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("app.errors.stale_error");
        await expect(dialog).toContainText(
          'app.errors.stale_model_{"model":"app.model.room_type"}',
        );
        await expect(
          dialog.getByTestId("stale-dialog-reject-button"),
        ).toHaveText("app.reload");
        await expect(
          dialog.getByTestId("stale-dialog-accept-button"),
        ).toHaveText("app.overwrite");
      });

      test("overwrite sends the current form data and shows the view", async ({
        page,
      }) => {
        // Reload to get the new model, then run into the stale error again
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
        await expect(page.locator("#room-type-name")).toHaveValue("Exam 01");

        const newer = roomTypeWith({ name: "Exam 02", restrict: true });
        newer.data.roles = superuserAndStaff;
        await mockRoomTypePut(page, {
          status: 428,
          json: { new_model: newer.data, message: "stale_model" },
        });
        await page.getByTestId("room-types-save-button").click();
        await expect(page.getByTestId("stale-room-type-dialog")).toBeVisible();

        const roomType = staleRoomType();
        await mockRoomTypePut(page, { status: 200, json: roomType });
        await mockRoomTypeGet(page, { json: roomType });

        const saveRequest = page.waitForRequest(
          (request) =>
            request.method() === "PUT" &&
            request.url().includes("/api/v1/roomTypes/3"),
        );
        await page.getByTestId("stale-dialog-accept-button").click();

        expect((await saveRequest).postDataJSON()).toEqual(
          toRequestBody(roomType),
        );

        await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.room_types.index",
          'admin.breadcrumbs.room_types.view_{"name":"Exam 01"}',
        );
      });
    });

    test("redirects to the index page if the room type was deleted", async ({
      page,
    }) => {
      await interceptAdminRoomTypesIndexRequests(page);
      await mockRoomTypePut(page, {
        status: 404,
        json: { message: "model_not_found", model: "room_type", ids: [3] },
      });

      const indexRequest = page.waitForRequest(/\/api\/v1\/roomTypes(\?|$)/);
      await page.getByTestId("room-types-save-button").click();

      await expect(page).toHaveURL(/\/admin\/room_types$/);
      await indexRequest;
      await expectToastAndClose(page, modelNotFound);
    });

    test("redirects to the login page if unauthenticated", async ({ page }) => {
      await mockRoomTypePut(page, { status: 401 });

      await page.getByTestId("room-types-save-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });

  test.describe("load room type errors", () => {
    test("shows the error and allows to reload on 500", async ({ page }) => {
      await mockRoomTypeGet(page, { status: 500, json: { message: "Test" } });
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, serverError);

      // Reload with correct data
      await mockRoomTypeGet(page, {
        path: "tests/Playwright/fixtures/roomType.json",
      });
      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toBeHidden();
    });

    test("redirects to the index page on 404", async ({ page }) => {
      await interceptAdminRoomTypesIndexRequests(page);
      await mockRoomTypeGet(page, {
        status: 404,
        json: { message: "model_not_found", model: "room_type", ids: [3] },
      });

      const indexRequest = page.waitForRequest(/\/api\/v1\/roomTypes(\?|$)/);
      await page.goto("/admin/room_types/3/edit");

      await expect(page).toHaveURL(/\/admin\/room_types$/);
      await indexRequest;
      await expectToastAndClose(page, modelNotFound);
    });

    test("redirects to the login page on 401", async ({ page }) => {
      await mockRoomTypeGet(page, { status: 401 });

      await page.goto("/admin/room_types/3/edit");

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });

  test.describe("load roles errors", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomTypeGet(page, {
        json: roomTypeWith({ restrict: true, roles: superuserAndStaff }),
      });
    });

    test("disables the dropdown and saving while the roles are loading", async ({
      page,
    }) => {
      const release = await holdRequest(page, "**/api/v1/roles*", {
        status: 500,
        json: { message: "Test" },
      });
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      release();
      await expectToastAndClose(page, serverError);
    });

    test.describe("500 error", () => {
      test.beforeEach(async ({ page }) => {
        await mockRolesGet(page, { status: 500, json: { message: "Test" } });
        await page.goto("/admin/room_types/3/edit");
        await expectToastAndClose(page, serverError);
      });

      test("keeps the roles and allows saving", async ({ page }) => {
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );
        await expectRoleChips(page, ["Superuser", "Staff"]);
        await expect(page.getByTestId("roles-reload-button")).toBeVisible();
        await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
      });

      test("reloads the roles", async ({ page }) => {
        await mockRolesGet(page, {
          path: "tests/Playwright/fixtures/roles.json",
        });
        await page.getByTestId("roles-reload-button").click();

        await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
        await expectRoleChips(page, ["Superuser", "Staff"]);
        await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
        await expect(page.getByTestId("roles-reload-button")).toBeHidden();

        await page.getByTestId("role-dropdown").click();
        const content = page.locator(".multiselect__content");
        await expect(content).toBeVisible();
        await expect(content.locator(".multiselect__option")).toHaveCount(5);
      });
    });

    test("shows an error if switching the page fails with 500", async ({
      page,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(5);

      await mockRolesGet(page, { status: 500, json: { message: "Test" } });
      await content.getByTestId("next-page-button").click();

      await expectToastAndClose(page, serverError);
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await expect(page.getByTestId("roles-reload-button")).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
    });

    test("redirects to the login page on 401 when the roles are loaded again", async ({
      page,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expectRoleChips(page, ["Superuser", "Staff"]);

      await mockRolesGet(page, { status: 401 });
      await page.locator("#restrict").click();
      await page.locator("#restrict").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });

    test("redirects to the login page on 401 when switching the page", async ({
      page,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      await mockRolesGet(page, { status: 401 });
      await content.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });

  test.describe("load server pools errors", () => {
    const firstServerPoolPage = () => {
      const serverPools = readFixture("serverPools.json");
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;
      return serverPools;
    };

    test("disables the dropdown and saving while the server pools are loading", async ({
      page,
    }) => {
      const release = await holdRequest(page, "**/api/v1/serverPools*", {
        status: 500,
        json: { message: "Test" },
      });
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("server-pool-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      release();
      await expectToastAndClose(page, serverError);
    });

    test.describe("500 error", () => {
      test.beforeEach(async ({ page }) => {
        await mockServerPoolsGet(page, {
          status: 500,
          json: { message: "Test" },
        });
        await page.goto("/admin/room_types/3/edit");
        await expectToastAndClose(page, serverError);
      });

      test("keeps the server pool and disables saving", async ({ page }) => {
        const dropdown = page.getByTestId("server-pool-dropdown");
        await expect(dropdown).toHaveClass(/multiselect--disabled/);
        await expect(dropdown.locator(".multiselect__tags")).toContainText(
          "Test",
        );
        await expect(
          page.getByTestId("server-pools-reload-button"),
        ).toBeVisible();
        await expect(page.getByTestId("room-types-save-button")).toBeDisabled();
      });

      test("reloads the server pools", async ({ page }) => {
        await mockServerPoolsGet(page, { json: firstServerPoolPage() });
        await page.getByTestId("server-pools-reload-button").click();

        const dropdown = page.getByTestId("server-pool-dropdown");
        await expect(dropdown).not.toHaveClass(/multiselect--disabled/);
        await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
        await expect(
          page.getByTestId("server-pools-reload-button"),
        ).toBeHidden();

        await dropdown.click();
        const content = page.locator(".multiselect__content");
        await expect(content).toBeVisible();
        await expect(content.locator(".multiselect__option")).toHaveCount(3);
      });
    });

    test("shows an error if switching the page fails with 500", async ({
      page,
    }) => {
      await mockServerPoolsGet(page, { json: firstServerPoolPage() });
      await page.goto("/admin/room_types/3/edit");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await page.getByTestId("server-pool-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(3);

      await mockServerPoolsGet(page, {
        status: 500,
        json: { message: "Test" },
      });
      await content.getByTestId("next-page-button").click();

      await expectToastAndClose(page, serverError);
      const dropdown = page.getByTestId("server-pool-dropdown");
      await expect(dropdown).toHaveClass(/multiselect--disabled/);
      await expect(dropdown.locator(".multiselect__tags")).toContainText(
        "Test",
      );
      await expect(
        page.getByTestId("server-pools-reload-button"),
      ).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();
    });

    test("redirects to the login page on 401 when loading the server pools", async ({
      page,
    }) => {
      await mockServerPoolsGet(page, { status: 401 });

      await page.goto("/admin/room_types/3/edit");

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });

    test("redirects to the login page on 401 when switching the page", async ({
      page,
    }) => {
      await mockServerPoolsGet(page, { json: firstServerPoolPage() });
      await page.goto("/admin/room_types/3/edit");
      await page.getByTestId("server-pool-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      await mockServerPoolsGet(page, { status: 401 });
      await content.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });
});
