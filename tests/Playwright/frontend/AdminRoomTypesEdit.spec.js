import { mergeTests } from "@playwright/test";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as serverPoolControllerTest } from "../support/fixtures/serverPoolController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import {
  roomTypeCheckDefaultRoomSettingCheckboxField,
  expectAdminBreadcrumbs,
  expectRoleChips,
  expectMultiselectOptions,
} from "../support/admin.js";
import {
  mockApiRequest,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(
  roomTypeControllerTest,
  serverPoolControllerTest,
  roleControllerTest,
);

test.describe("Admin room types edit", () => {
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

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/room_types/3/edit");
  });

  test("visit with user without permission to edit room types", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = ["admin.view", "roomTypes.view"];

    await page.goto("/admin/room_types/3/edit");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/room_types\/3\/edit/);
  });

  test("check button visibility without delete permission", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
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
      roomTypeResponse,
      getServerPoolsApiMock,
      getRoomTypeApiMock,
    }) => {
      getRoomTypeApiMock.respondWith({ json: roomTypeResponse, hold: true });
      const serverPoolsRequest = getServerPoolsApiMock.waitForNextRequest();
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByText("admin.title").first()).toBeVisible();
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(
        page.getByTestId("room-types-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-types-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("room-types-delete-button")).toHaveCount(0);
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      getRoomTypeApiMock.release();
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
        const selected = /\bselected\b/;
        const notSelected = /^(?!.*\bselected\b)/;

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
          await expect(buttons.nth(i)).toHaveClass(notSelected);
        }

        // Set custom color and check that the matching color button is selected
        await customColor.fill("#06b6d4");
        for (let i = 0; i < 10; i++) {
          await expect(buttons.nth(i)).toHaveClass(
            i === 2 ? selected : notSelected,
          );
        }

        // Click on color button and check that the color button is selected
        await buttons.nth(7).click();
        for (let i = 0; i < 10; i++) {
          await expect(buttons.nth(i)).toHaveClass(
            i === 7 ? selected : notSelected,
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
        await expect(enforced).toHaveText(
          "admin.room_types.default_room_settings.enforced",
        );
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
        await expect(enforced).toHaveText(
          "admin.room_types.default_room_settings.default",
        );
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
        await expect(enforced).toHaveText(
          "admin.room_types.default_room_settings.default",
        );
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

      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/room_types/3/edit");
        await expect(page.locator("#room-type-name")).toHaveValue("Exam");

        // Change all settings
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
      });

      test("sends the changed data", async ({
        page,
        roomTypeResponse,
        roomTypeFieldsAfterEditingEverySetting,
      }) => {
        Object.assign(
          roomTypeResponse.data,
          roomTypeFieldsAfterEditingEverySetting,
        );
        const putRoomTypeApiMock = await mockApiRequest(
          page,
          "PUT",
          "roomTypes/3",
          {
            status: 201,
            json: roomTypeResponse,
          },
        );

        await page.getByTestId("room-types-save-button").click();

        await expect(putRoomTypeApiMock).toHaveReceivedRequest({
          json: {
            ...roomTypeResponse.data,
            server_pool: roomTypeResponse.data.server_pool.id,
            roles: roomTypeResponse.data.roles.map((role) => role.id),
          },
        });
      });

      test("shows the room type view after saving", async ({
        page,
        roomTypeResponse,
        roomTypeFieldsAfterEditingEverySetting,
      }) => {
        Object.assign(
          roomTypeResponse.data,
          roomTypeFieldsAfterEditingEverySetting,
        );
        await mockApiRequest(page, "PUT", "roomTypes/3", {
          status: 201,
          json: roomTypeResponse,
        });

        await page.getByTestId("room-types-save-button").click();

        await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
        await expectAdminBreadcrumbs(
          page,
          "admin.breadcrumbs.room_types.index",
          'admin.breadcrumbs.room_types.view_{"name":"Exam 01"}',
        );
        await expect(page.getByTestId("overlay")).toBeHidden();
      });

      test("disables the form while saving", async ({
        page,
        roomTypeResponse,
        roomTypeFieldsAfterEditingEverySetting,
      }) => {
        Object.assign(
          roomTypeResponse.data,
          roomTypeFieldsAfterEditingEverySetting,
        );
        const putRoomTypeApiMock = await mockApiRequest(
          page,
          "PUT",
          "roomTypes/3",
          {
            status: 201,
            json: roomTypeResponse,
            hold: true,
          },
        );
        await page.getByTestId("room-types-save-button").click();

        await expect(page.getByTestId("overlay")).toBeVisible();
        const inputs = [
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
        for (const input of inputs) {
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

        putRoomTypeApiMock.release();
        await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
      });
    });
  });

  test.describe("roles with restriction", () => {
    test.beforeEach(async ({ roomTypeResponse }) => {
      roomTypeResponse.data.restrict = true;
      roomTypeResponse.data.roles = [
        { id: 1, name: "Superuser" },
        { id: 2, name: "Staff" },
      ];
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

    test("loads the next page of roles", async ({
      page,
      rolesSecondPageResponse,
      getRolesApiMock,
    }) => {
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

      getRolesApiMock.respondWith({
        json: rolesSecondPageResponse,
        hold: true,
      });
      await content.getByTestId("next-page-button").click();

      // Check loading
      await expect(content.getByTestId("previous-page-button")).toBeDisabled();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      getRolesApiMock.release();

      await expect(content).toBeVisible();
      await expect(content.getByTestId("previous-page-button")).toBeEnabled();
      await expect(content.getByTestId("next-page-button")).toBeDisabled();
      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        "admin.roles.no_data",
      );
    });

    test("adds, removes and saves roles", async ({
      page,
      roomTypeResponse,
      rolesSecondPageResponse,
      getRolesApiMock,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await page.getByTestId("role-dropdown").click();
      getRolesApiMock.respondWith({
        json: rolesSecondPageResponse,
      });
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

      roomTypeResponse.data.roles = [
        { id: 2, name: "Staff" },
        { id: 6, name: "Manager" },
      ];
      const putRoomTypeApiMock = await mockApiRequest(
        page,
        "PUT",
        "roomTypes/3",
        {
          status: 201,
          json: roomTypeResponse,
          hold: true,
        },
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

      putRoomTypeApiMock.release();

      await expect(putRoomTypeApiMock).toHaveReceivedRequest({
        json: {
          ...roomTypeResponse.data,
          server_pool: roomTypeResponse.data.server_pool.id,
          roles: roomTypeResponse.data.roles.map((role) => role.id),
        },
      });

      await expect(page).toHaveURL(/\/admin\/room_types\/3$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });
  });

  test.describe("save errors", () => {
    test.beforeEach(async ({ page, roomTypeResponse }) => {
      roomTypeResponse.data.restrict = true;
      roomTypeResponse.data.roles = [
        { id: 1, name: "Superuser" },
        { id: 2, name: "Staff" },
      ];
      await page.goto("/admin/room_types/3/edit");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.room_types.index",
        'admin.breadcrumbs.room_types.edit_{"name":"Exam"}',
      );
    });

    test("shows validation errors on 422", async ({
      page,
      roomTypeValidationErrorsResponse,
      roomTypeErrorFieldMessages,
    }) => {
      await mockApiRequest(page, "PUT", "roomTypes/3", {
        status: 422,
        json: {
          message: "The name field is required. (and 39 more errors)",
          errors: roomTypeValidationErrorsResponse,
        },
      });

      await page.getByTestId("room-types-save-button").click();

      await expectToastAndClose(
        page,
        "The name field is required. (and 39 more errors)",
      );
      for (const [field, messages] of roomTypeErrorFieldMessages) {
        for (const message of messages) {
          await expect(page.getByTestId(field)).toContainText(message);
        }
      }
    });

    test("shows server error on 500 and hides validation errors", async ({
      page,
      roomTypeValidationErrorsResponse,
      roomTypeErrorFieldMessages,
    }) => {
      await mockApiRequest(page, "PUT", "roomTypes/3", {
        status: 422,
        json: {
          message: "The name field is required. (and 39 more errors)",
          errors: roomTypeValidationErrorsResponse,
        },
      });
      await page.getByTestId("room-types-save-button").click();
      await expectToastAndClose(
        page,
        "The name field is required. (and 39 more errors)",
      );
      await expect(page.getByTestId("room-type-name-field")).toContainText(
        "The name field is required.",
      );

      await mockApiRequest(page, "PUT", "roomTypes/3", serverError());
      await page.getByTestId("room-types-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      for (const [field, messages] of roomTypeErrorFieldMessages) {
        for (const message of messages) {
          await expect(page.getByTestId(field)).not.toContainText(message);
        }
      }
    });

    test.describe("stale model", () => {
      // the room type as another user saved it: all settings changed, restricted to the roles
      let staleRoomType;

      test.beforeEach(
        async ({
          page,
          roomTypeResponse,
          roomTypeFieldsAfterEditingEverySetting,
        }) => {
          staleRoomType = {
            ...roomTypeResponse.data,
            ...roomTypeFieldsAfterEditingEverySetting,
            restrict: true,
            roles: roomTypeResponse.data.roles,
          };
          await mockApiRequest(page, "PUT", "roomTypes/3", {
            status: 428,
            json: { new_model: staleRoomType, message: "stale_model" },
          });
          await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
          await page.getByTestId("room-types-save-button").click();
        },
      );

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

        await expect(page.locator("#room-type-name")).toHaveValue("Exam 01");
        await expect(page.locator("#description")).toHaveValue(
          "New room type description for room type Exam 01",
        );
        await expect(page.locator("#custom-color")).toHaveValue("#ef4444");
        await expect(
          page
            .getByTestId("server-pool-dropdown")
            .locator(".multiselect__tags"),
        ).toContainText("Production");
        await expect(page.locator("#restrict")).toBeChecked();
        await expectRoleChips(page, ["Superuser", "Staff"]);
        await expect(page.locator("#max-participants")).toHaveValue("50");
        await expect(page.locator("#max-duration")).toHaveValue("60 min.");

        // [field, default value, enforced]
        const settingFields = [
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
        for (const [field, value, enforced] of settingFields) {
          await roomTypeCheckDefaultRoomSettingCheckboxField(
            page,
            field,
            value,
            enforced,
            false,
          );
        }

        await expect(page.locator("#lobby-disabled")).toBeChecked();
        await expect(page.getByTestId("lobby-enforced")).toHaveText(
          "admin.room_types.default_room_settings.default",
        );

        const roleButton = page
          .getByTestId("default-role-default-button")
          .nth(1);
        await expect(roleButton).toHaveText("rooms.roles.moderator");
        await expect(roleButton).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("default-role-enforced")).toHaveText(
          "admin.room_types.default_room_settings.enforced",
        );

        const visibilityButton = page
          .getByTestId("visibility-default-button")
          .nth(0);
        await expect(visibilityButton).toHaveText(
          "rooms.settings.advanced.visibility.private",
        );
        await expect(visibilityButton).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("visibility-enforced")).toHaveText(
          "admin.room_types.default_room_settings.enforced",
        );

        await expect(page.locator("#create-parameters")).toHaveValue(
          "meetingLayout=PRESENTATION_FOCUS",
        );
        await expect(page.locator("#join-parameters")).toHaveValue(
          "enforceLayout=PRESENTATION_ONLY",
        );
      });

      test("shows the stale dialog again after a reload", async ({
        page,
        roomTypeResponse,
      }) => {
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
        await expect(page.locator("#room-type-name")).toHaveValue("Exam 01");

        await mockApiRequest(page, "PUT", "roomTypes/3", {
          status: 428,
          json: {
            new_model: { ...roomTypeResponse.data, name: "Exam 02" },
            message: "stale_model",
          },
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
        roomTypeResponse,
      }) => {
        // Reload to get the new model, then run into the stale error again
        await page.getByTestId("stale-dialog-reject-button").click();
        await expect(page.getByTestId("stale-room-type-dialog")).toBeHidden();
        await expect(page.locator("#room-type-name")).toHaveValue("Exam 01");

        await mockApiRequest(page, "PUT", "roomTypes/3", {
          status: 428,
          json: {
            new_model: { ...roomTypeResponse.data, name: "Exam 02" },
            message: "stale_model",
          },
        });
        await page.getByTestId("room-types-save-button").click();
        await expect(page.getByTestId("stale-room-type-dialog")).toBeVisible();

        Object.assign(roomTypeResponse.data, staleRoomType);
        const putRoomTypeApiMock = await mockApiRequest(
          page,
          "PUT",
          "roomTypes/3",
          {
            status: 200,
            json: roomTypeResponse,
          },
        );
        await page.getByTestId("stale-dialog-accept-button").click();

        await expect(putRoomTypeApiMock).toHaveReceivedRequest({
          json: {
            ...roomTypeResponse.data,
            server_pool: roomTypeResponse.data.server_pool.id,
            roles: roomTypeResponse.data.roles.map((role) => role.id),
          },
        });

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
      getRoomTypesApiMock,
    }) => {
      await mockApiRequest(
        page,
        "PUT",
        "roomTypes/3",
        modelNotFound("room_type", [3]),
      );

      const indexRequest = getRoomTypesApiMock.waitForNextRequest();
      await page.getByTestId("room-types-save-button").click();

      await expect(page).toHaveURL(/\/admin\/room_types$/);
      await indexRequest;
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room_type"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);
    });

    test("redirects to the login page if unauthenticated", async ({ page }) => {
      await mockApiRequest(page, "PUT", "roomTypes/3", { status: 401 });

      await page.getByTestId("room-types-save-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });

  test.describe("load room type errors", () => {
    test("shows the error and allows to reload on 500", async ({
      page,
      roomTypeResponse,
      getRoomTypeApiMock,
    }) => {
      getRoomTypeApiMock.respondWith(serverError());
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      getRoomTypeApiMock.respondWith({
        json: roomTypeResponse,
      });
      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(retryButton).toBeHidden();
    });

    test("redirects to the index page on 404", async ({
      page,
      getRoomTypesApiMock,
      getRoomTypeApiMock,
    }) => {
      getRoomTypeApiMock.respondWith(modelNotFound("room_type", [3]));

      const indexRequest = getRoomTypesApiMock.waitForNextRequest();
      await page.goto("/admin/room_types/3/edit");

      await expect(page).toHaveURL(/\/admin\/room_types$/);
      await indexRequest;
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room_type"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);
    });

    test("redirects to the login page on 401", async ({
      page,
      getRoomTypeApiMock,
    }) => {
      getRoomTypeApiMock.respondWith({ status: 401 });

      await page.goto("/admin/room_types/3/edit");

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });

  test.describe("load roles errors", () => {
    test.beforeEach(async ({ roomTypeResponse }) => {
      roomTypeResponse.data.restrict = true;
      roomTypeResponse.data.roles = [
        { id: 1, name: "Superuser" },
        { id: 2, name: "Staff" },
      ];
    });

    test("disables the dropdown and saving while the roles are loading", async ({
      page,
      getRolesApiMock,
    }) => {
      getRolesApiMock.respondWith({ ...serverError(), hold: true });
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      getRolesApiMock.release();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test.describe("500 error", () => {
      test.beforeEach(async ({ page, getRolesApiMock }) => {
        getRolesApiMock.respondWith(serverError());
        await page.goto("/admin/room_types/3/edit");
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("keeps the roles and allows saving", async ({ page }) => {
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );
        await expectRoleChips(page, ["Superuser", "Staff"]);
        await expect(page.getByTestId("roles-reload-button")).toBeVisible();
        await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
      });

      test("reloads the roles", async ({
        page,
        rolesResponse,
        getRolesApiMock,
      }) => {
        getRolesApiMock.respondWith({
          json: rolesResponse,
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
      getRolesApiMock,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(5);

      getRolesApiMock.respondWith(serverError());
      await content.getByTestId("next-page-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await expect(page.getByTestId("roles-reload-button")).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
    });

    test("redirects to the login page on 401 when the roles are loaded again", async ({
      page,
      getRolesApiMock,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expectRoleChips(page, ["Superuser", "Staff"]);

      getRolesApiMock.respondWith({ status: 401 });
      await page.locator("#restrict").click();
      await page.locator("#restrict").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });

    test("redirects to the login page on 401 when switching the page", async ({
      page,
      getRolesApiMock,
    }) => {
      await page.goto("/admin/room_types/3/edit");
      await expectRoleChips(page, ["Superuser", "Staff"]);
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      getRolesApiMock.respondWith({ status: 401 });
      await content.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });

  test.describe("load server pools errors", () => {
    test("disables the dropdown and saving while the server pools are loading", async ({
      page,
      getServerPoolsApiMock,
    }) => {
      getServerPoolsApiMock.respondWith({ ...serverError(), hold: true });
      await page.goto("/admin/room_types/3/edit");

      await expect(page.getByTestId("server-pool-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      getServerPoolsApiMock.release();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test.describe("500 error", () => {
      test.beforeEach(async ({ page, getServerPoolsApiMock }) => {
        getServerPoolsApiMock.respondWith(serverError());
        await page.goto("/admin/room_types/3/edit");
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
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

      test("reloads the server pools", async ({
        page,
        serverPoolsFirstPageResponse,
        getServerPoolsApiMock,
      }) => {
        getServerPoolsApiMock.respondWith({
          json: serverPoolsFirstPageResponse,
        });
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
      serverPoolsFirstPageResponse,
      getServerPoolsApiMock,
    }) => {
      getServerPoolsApiMock.respondWith({
        json: serverPoolsFirstPageResponse,
      });
      await page.goto("/admin/room_types/3/edit");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await page.getByTestId("server-pool-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(3);

      getServerPoolsApiMock.respondWith(serverError());
      await content.getByTestId("next-page-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
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
      getServerPoolsApiMock,
    }) => {
      getServerPoolsApiMock.respondWith({ status: 401 });

      await page.goto("/admin/room_types/3/edit");

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });

    test("redirects to the login page on 401 when switching the page", async ({
      page,
      serverPoolsFirstPageResponse,
      getServerPoolsApiMock,
    }) => {
      getServerPoolsApiMock.respondWith({
        json: serverPoolsFirstPageResponse,
      });
      await page.goto("/admin/room_types/3/edit");
      await page.getByTestId("server-pool-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      getServerPoolsApiMock.respondWith({ status: 401 });
      await content.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/room_types/3/edit");
    });
  });
});
