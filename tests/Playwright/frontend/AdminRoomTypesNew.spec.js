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
  holdApiRequest,
  mockApiRequest,
  serverError,
} from "../support/utils.js";

const test = mergeTests(
  roomTypeControllerTest,
  serverPoolControllerTest,
  roleControllerTest,
);

test.describe("Admin room types new", () => {
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
    await testVisitWithoutCurrentUser(page, "/admin/room_types/new");
  });

  test("visit with user without permission to add new room types", async ({
    page,
    currentUserResponse,
  }) => {
    currentUserResponse.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "serverPools.viewAny",
      "roomTypes.view",
      "roomTypes.update",
    ];

    await page.goto("/admin/room_types/new");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/room_types/);
    await expectToastAndClose(page, "app.flash.unauthorized");
  });

  test.describe("empty form", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types/new");
      await expect(page.locator("#room-type-name")).toBeVisible();
    });

    test("header buttons are hidden", async ({ page }) => {
      await expect(page.getByTestId("room-types-save-button")).toHaveText(
        "app.save",
      );
      await expect(
        page.getByTestId("room-types-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-types-edit-button")).toHaveCount(0);
      await expect(page.getByTestId("room-types-delete-button")).toHaveCount(0);
    });

    test("breadcrumbs stay the same when the name is changed", async ({
      page,
    }) => {
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.room_types.index",
        "admin.breadcrumbs.room_types.new",
      );

      const nameField = page.getByTestId("room-type-name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("app.model_name");
      await expect(nameField.locator("#room-type-name")).toHaveValue("");
      await nameField.locator("#room-type-name").fill("Exam 01");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.room_types.index",
        "admin.breadcrumbs.room_types.new",
      );
      await expect(
        page.getByTestId("preview-field").getByTestId("room-type-badge"),
      ).toHaveText("rooms.index.room_component.room_type:Exam 01");
    });

    test("description", async ({ page }) => {
      const field = page.getByTestId("description-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("app.description");
      await expect(field.locator("#description")).toHaveValue("");
      await field
        .locator("#description")
        .fill("Room type description for room type Exam 01");
      await expect(field.locator("#description")).toHaveValue(
        "Room type description for room type Exam 01",
      );
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
        await expect(buttons.nth(i)).not.toHaveClass(/opacity-80/);
        await expect(buttons.nth(i)).toHaveClass(
          i === 0 ? selected : notSelected,
        );
      }

      // Clear custom color and check that no color button is selected
      const customColor = colorField.locator("#custom-color");
      await expect(customColor).toHaveValue("#6366f1");
      await expect(customColor).toBeEnabled();
      await customColor.clear();
      for (let i = 0; i < 10; i++) {
        await expect(buttons.nth(i)).toHaveClass(notSelected);
      }

      // Set custom color and check that the matching color button is selected
      await customColor.fill("#ef4444");
      for (let i = 0; i < 10; i++) {
        await expect(buttons.nth(i)).toHaveClass(
          i === 7 ? selected : notSelected,
        );
      }
    });

    test("preview shows the selected color and the name", async ({ page }) => {
      const previewField = page.getByTestId("preview-field");
      await expect(previewField).toBeVisible();
      await expect(previewField).toContainText("admin.room_types.preview");

      await page.locator("#room-type-name").fill("Exam 01");
      await page.locator("#custom-color").fill("#ef4444");

      const badge = previewField.getByTestId("room-type-badge");
      await expect(badge).toHaveCSS("background-color", "rgb(239, 68, 68)");
      await expect(badge).toHaveText(
        "rooms.index.room_component.room_type:Exam 01",
      );
    });

    test("server pool options", async ({ page }) => {
      const content = page.locator(".multiselect__content");
      await expect(content).toBeHidden();

      const field = page.getByTestId("server-pool-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("app.server_pool");
      const dropdown = field.getByTestId("server-pool-dropdown");
      await expect(dropdown.locator(".multiselect__tags")).toContainText(
        "admin.room_types.select_server_pool",
      );
      await dropdown.locator(".multiselect__tags").click();

      await expect(content).toBeVisible();
      await expectMultiselectOptions(
        content,
        ["Test", "Production"],
        "admin.server_pools.no_data",
      );

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

      const maxParticipantsField = page.getByTestId("max-participants-field");
      await expect(maxParticipantsField).toBeVisible();
      await expect(maxParticipantsField).toContainText(
        "admin.room_types.max_participants",
      );
      await expect(
        maxParticipantsField.locator("#max-participants"),
      ).toHaveValue("");
      await maxParticipantsField.locator("#max-participants").fill("100");
      await expect(
        maxParticipantsField.getByTestId("clear-max-participants-button"),
      ).toBeVisible();
      await expect(
        maxParticipantsField.getByTestId("clear-max-participants-button"),
      ).toBeEnabled();

      const maxDurationField = page.getByTestId("max-duration-field");
      await expect(maxDurationField).toBeVisible();
      await expect(maxDurationField).toContainText(
        "admin.room_types.max_duration",
      );
      await expect(maxDurationField.locator("#max-duration")).toHaveValue("");
      await maxDurationField.locator("#max-duration").fill("120");
      await expect(
        maxDurationField.getByTestId("clear-max-duration-button"),
      ).toBeVisible();
      await expect(
        maxDurationField.getByTestId("clear-max-duration-button"),
      ).toBeEnabled();
    });

    test("default room settings are shown with the initial values", async ({
      page,
    }) => {
      await expect(
        page.getByText("admin.room_types.default_room_settings.title"),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "rooms.settings.general.title" }),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.settings.video_conference.title"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.settings.recordings.title"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.settings.restrictions.title"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.settings.participants.title"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.settings.advanced.title"),
      ).toBeVisible();

      const fields = [
        ["has-access-code", "rooms.settings.general.has_access_code", true],
        ["allow-guests", "rooms.settings.general.allow_guests", false],
        [
          "everyone-can-start",
          "rooms.settings.video_conference.everyone_can_start",
          false,
        ],
        [
          "mute-on-start",
          "rooms.settings.video_conference.mute_on_start",
          false,
        ],
        [
          "record-attendance",
          "rooms.settings.recordings.record_attendance",
          false,
        ],
        ["record", "rooms.settings.recordings.record_video_conference", false],
        [
          "auto-start-recording",
          "rooms.settings.recordings.auto_start_recording",
          false,
        ],
        [
          "disable-cam",
          "rooms.settings.restrictions.lock_settings_disable_cam",
          false,
        ],
        [
          "webcams-only-for-moderator",
          "rooms.settings.restrictions.webcams_only_for_moderator",
          false,
        ],
        [
          "disable-mic",
          "rooms.settings.restrictions.lock_settings_disable_mic",
          false,
        ],
        [
          "disable-public-chat",
          "rooms.settings.restrictions.lock_settings_disable_public_chat",
          false,
        ],
        [
          "disable-private-chat",
          "rooms.settings.restrictions.lock_settings_disable_private_chat",
          false,
        ],
        [
          "disable-note",
          "rooms.settings.restrictions.lock_settings_disable_note",
          false,
        ],
        [
          "hide-user-list",
          "rooms.settings.restrictions.lock_settings_hide_user_list",
          false,
        ],
        [
          "allow-membership",
          "rooms.settings.participants.allow_membership",
          false,
        ],
      ];
      for (const [field, text, value] of fields) {
        const fieldLocator = page.getByTestId(`${field}-field`);
        await expect(fieldLocator).toBeVisible();
        await expect(fieldLocator).toContainText(text);
        await roomTypeCheckDefaultRoomSettingCheckboxField(
          page,
          field,
          value,
          false,
          false,
        );
      }
    });

    test("default lobby setting", async ({ page }) => {
      const lobbyField = page.getByTestId("lobby-field");
      await expect(lobbyField).toBeVisible();
      await expect(lobbyField).toContainText(
        "rooms.settings.video_conference.lobby.title",
      );

      const disabledField = lobbyField.getByTestId("lobby-disabled-field");
      await expect(disabledField).toBeVisible();
      await expect(disabledField).toContainText("app.disabled");
      await expect(disabledField.locator("#lobby-disabled")).toBeChecked();
      await expect(disabledField.locator("#lobby-disabled")).toBeEnabled();

      const enabledField = lobbyField.getByTestId("lobby-enabled-field");
      await expect(enabledField).toBeVisible();
      await expect(enabledField).toContainText("app.enabled");
      await expect(enabledField.locator("#lobby-enabled")).not.toBeChecked();
      await expect(enabledField.locator("#lobby-enabled")).toBeEnabled();

      const onlyForGuestsField = lobbyField.getByTestId(
        "lobby-only-for-guests-field",
      );
      await expect(onlyForGuestsField).toBeVisible();
      await expect(onlyForGuestsField).toContainText(
        "rooms.settings.video_conference.lobby.only_for_guests_enabled",
      );
      await expect(
        onlyForGuestsField.locator("#lobby-only-for-guests"),
      ).not.toBeChecked();
      await expect(
        onlyForGuestsField.locator("#lobby-only-for-guests"),
      ).toBeEnabled();

      await expect(lobbyField.getByTestId("lobby-enforced")).toHaveText(
        "admin.room_types.default_room_settings.default",
      );
    });

    test("default role and visibility settings", async ({ page }) => {
      const roleField = page.getByTestId("default-role-field");
      await expect(roleField).toBeVisible();
      await expect(roleField).toContainText(
        "rooms.settings.participants.default_role.title",
      );
      await expect(roleField).toContainText(
        "rooms.settings.participants.default_role.only_logged_in",
      );
      const roleButtons = roleField.getByTestId("default-role-default-button");
      await expect(roleButtons).toHaveCount(2);
      await expect(roleButtons.nth(0)).toHaveText("rooms.roles.participant");
      await expect(roleButtons.nth(0)).toHaveAttribute("aria-pressed", "true");
      await expect(roleButtons.nth(1)).toHaveText("rooms.roles.moderator");
      await expect(roleButtons.nth(1)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(roleField.getByTestId("default-role-enforced")).toHaveText(
        "admin.room_types.default_room_settings.default",
      );

      const visibilityField = page.getByTestId("visibility-field");
      await expect(visibilityField).toBeVisible();
      await expect(visibilityField).toContainText(
        "rooms.settings.advanced.visibility",
      );
      const visibilityButtons = visibilityField.getByTestId(
        "visibility-default-button",
      );
      await expect(visibilityButtons).toHaveCount(2);
      await expect(visibilityButtons.nth(0)).toHaveText(
        "rooms.settings.advanced.visibility.private",
      );
      await expect(visibilityButtons.nth(0)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(visibilityButtons.nth(1)).toHaveText(
        "rooms.settings.advanced.visibility.public",
      );
      await expect(visibilityButtons.nth(1)).not.toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await visibilityButtons.nth(1).click();
      await expect(visibilityButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(
        visibilityField.getByTestId("visibility-enforced"),
      ).toHaveText("admin.room_types.default_room_settings.default");
    });

    test("bbb api parameters", async ({ page }) => {
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
      await expect(createField.locator("#create-parameters")).toHaveValue("");
      await createField
        .locator("#create-parameters")
        .fill("meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE");
      await expect(createField.locator("#create-parameters")).toHaveValue(
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE",
      );

      const joinField = page.getByTestId("join-parameters-field");
      await expect(joinField).toBeVisible();
      await expect(joinField).toContainText(
        "admin.room_types.bbb_api.join_parameters",
      );
      await expect(joinField).toContainText(
        "admin.room_types.bbb_api.join_parameters_description",
      );
      await expect(joinField.locator("#join-parameters")).toHaveValue("");
      await joinField
        .locator("#join-parameters")
        .fill("enforceLayout=PRESENTATION_ONLY");
      await expect(joinField.locator("#join-parameters")).toHaveValue(
        "enforceLayout=PRESENTATION_ONLY",
      );
    });
  });

  test.describe("save new room type", () => {
    test.beforeEach(async ({ page, roomTypeResponse, serverPoolsResponse }) => {
      Object.assign(roomTypeResponse.data, {
        id: 30,
        name: "Exam 01",
        description: "Room type description for room type Exam 01",
        color: "#ef4444",
        server_pool: serverPoolsResponse.data[1],
      });
      await mockApiRequest(page, "GET", "roomTypes/30", {
        json: roomTypeResponse,
      });

      await page.goto("/admin/room_types/new");
      await expect(page.locator("#room-type-name")).toBeVisible();

      await page.locator("#room-type-name").fill("Exam 01");
      await page
        .locator("#description")
        .fill("Room type description for room type Exam 01");
      await page.locator("#custom-color").fill("#ef4444");

      await page.getByTestId("server-pool-dropdown").click();
      await page.locator(".multiselect__option").nth(1).click();

      await page.locator("#max-participants").fill("100");
      await page.locator("#max-duration").fill("120");

      await page.locator("#allow-guests-default").click();
      await page.getByTestId("allow-guests-enforced").click();
      await page.locator("#mute-on-start-default").click();
      await page.getByTestId("mute-on-start-enforced").click();
      await page.locator("#lobby-only-for-guests").click();
      await page.getByTestId("lobby-enforced").click();
      await page.locator("#webcams-only-for-moderator-default").click();
      await page.getByTestId("disable-mic-enforced").click();
      await page.locator("#disable-public-chat-default").click();
      await page.locator("#disable-note-default").click();
      await page.getByTestId("disable-note-enforced").click();
      await page.locator("#hide-user-list-default").click();
      await page.getByTestId("allow-membership-enforced").click();
      await page.getByTestId("visibility-default-button").nth(1).click();

      await page
        .locator("#create-parameters")
        .fill(
          "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
        );
      await page
        .locator("#join-parameters")
        .fill(
          "enforceLayout=PRESENTATION_ONLY\nwebcamBackgroundURL=https://example.com/background.png\nexcludeFromDashboard=true\nuserdata-bbb_hide_presentation_on_join=true",
        );
    });

    test("shows the loading state while saving", async ({
      page,
      roomTypeResponse,
    }) => {
      const postRoomTypesApiMock = await mockApiRequest(
        page,
        "POST",
        "roomTypes",
        {
          status: 201,
          json: roomTypeResponse,
          hold: true,
        },
      );

      await expect(page.getByTestId("overlay")).toBeHidden();
      await page.getByTestId("room-types-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
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
        const elements = await input.all();
        expect(elements.length).toBeGreaterThan(0);
        for (const element of elements) {
          await expect(element).toBeDisabled();
        }
      }

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
      await expect(page.getByTestId("default-role-default-button")).toHaveCount(
        2,
      );
      await expect(page.getByTestId("visibility-default-button")).toHaveCount(
        2,
      );
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();
      await expect(
        page.getByTestId("clear-max-participants-button"),
      ).toBeVisible();
      await expect(page.getByTestId("clear-max-duration-button")).toBeVisible();

      postRoomTypesApiMock.release();
      await expect(page).toHaveURL(/\/admin\/room_types\/30$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("sends the entered data", async ({ page, roomTypeResponse }) => {
      const postRoomTypesApiMock = await mockApiRequest(
        page,
        "POST",
        "roomTypes",
        {
          status: 201,
          json: roomTypeResponse,
        },
      );

      await page.getByTestId("room-types-save-button").click();

      const expectedRequestBody = {
        ...roomTypeResponse.data,
        server_pool: roomTypeResponse.data.server_pool.id,
        roles: roomTypeResponse.data.roles.map((role) => role.id),
      };
      delete expectedRequestBody.id;
      delete expectedRequestBody.model_name;
      await expect(postRoomTypesApiMock).toHaveReceivedRequest({
        json: expectedRequestBody,
      });
      await expect(page).toHaveURL(/\/admin\/room_types\/30$/);
    });

    test("shows the new room type after saving", async ({
      page,
      roomTypeResponse,
    }) => {
      await mockApiRequest(page, "POST", "roomTypes", {
        status: 201,
        json: roomTypeResponse,
      });

      const roomTypeRequest = page.waitForRequest("**/api/v1/roomTypes/30");
      await page.getByTestId("room-types-save-button").click();
      await roomTypeRequest;

      await expect(page).toHaveURL(/\/admin\/room_types\/30$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.room_types.index",
        'admin.breadcrumbs.room_types.view_{"name":"Exam 01"}',
      );
    });
  });

  test.describe("restricted to roles", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types/new");
      await expect(page.locator("#room-type-name")).toBeVisible();
      const restrictField = page.getByTestId("restrict-field");
      await expect(restrictField).toContainText("admin.room_types.restrict");
      await expect(restrictField.locator("#restrict")).not.toBeChecked();
      await expect(restrictField.locator("#restrict")).toBeEnabled();
      await page.locator("#restrict").click();
    });

    test("shows the roles and the role options", async ({ page }) => {
      const content = page.locator(".multiselect__content");
      await expect(content).toBeHidden();
      const roleField = page.getByTestId("role-field");
      await expect(roleField).toBeVisible();
      const dropdown = roleField.getByTestId("role-dropdown");
      await expect(dropdown.locator(".multiselect__tags")).toContainText(
        "admin.roles.select_roles",
      );
      await expect(dropdown.getByTestId("role-chip")).toHaveCount(0);

      await dropdown.locator(".multiselect__tags").click();

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
    }) => {
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      await expect(content.getByTestId("previous-page-button")).toContainText(
        "app.previous_page",
      );
      await expect(content.getByTestId("previous-page-button")).toBeDisabled();
      await expect(content.getByTestId("next-page-button")).toContainText(
        "app.next_page",
      );
      await expect(content.getByTestId("next-page-button")).toBeEnabled();

      const release = await holdApiRequest(page, "roles*", {
        json: rolesSecondPageResponse,
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

    test("selects roles and closes the dropdown", async ({
      page,
      rolesSecondPageResponse,
    }) => {
      await mockApiRequest(page, "GET", "roles*", {
        json: rolesSecondPageResponse,
      });
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await content.getByTestId("next-page-button").click();
      await expect(
        content.locator(".multiselect__option").nth(0),
      ).toContainText("Dean");

      await content.locator(".multiselect__option").nth(0).click();
      await content.locator(".multiselect__option").nth(2).click();

      await expect(content).toBeVisible();
      await expectRoleChips(page, ["Dean", "Manager"]);

      // Close dropdown
      await page.locator(".multiselect__select").nth(1).click();
      await expect(content).toBeHidden();
    });

    test("saves the room type with the selected roles", async ({
      page,
      roomTypeResponse,
      serverPoolsResponse,
      rolesSecondPageResponse,
    }) => {
      Object.assign(roomTypeResponse.data, {
        id: 30,
        description: "",
        color: "#6366f1",
        server_pool: serverPoolsResponse.data[0],
        max_participants: null,
        max_duration: null,
        create_parameters: null,
        join_parameters: null,
        restrict: true,
        roles: [
          { id: 4, name: "Dean" },
          { id: 6, name: "Manager" },
        ],
        mute_on_start_default: false,
        mute_on_start_enforced: false,
        lock_settings_disable_cam_default: false,
        lock_settings_disable_cam_enforced: false,
        webcams_only_for_moderator_default: false,
        webcams_only_for_moderator_enforced: false,
        lock_settings_disable_mic_default: false,
        lock_settings_disable_mic_enforced: false,
        lock_settings_disable_private_chat_default: false,
        lock_settings_disable_private_chat_enforced: false,
        lock_settings_disable_public_chat_default: false,
        lock_settings_disable_public_chat_enforced: false,
        lock_settings_disable_note_default: false,
        lock_settings_disable_note_enforced: false,
        lock_settings_hide_user_list_default: false,
        lock_settings_hide_user_list_enforced: false,
        everyone_can_start_default: false,
        everyone_can_start_enforced: false,
        allow_membership_default: false,
        allow_membership_enforced: false,
        allow_guests_default: false,
        allow_guests_enforced: false,
        default_role_default: 1,
        default_role_enforced: false,
        lobby_default: 0,
        lobby_enforced: false,
        visibility_default: 0,
        visibility_enforced: false,
        record_attendance_default: false,
        record_attendance_enforced: false,
        record_default: false,
        record_enforced: false,
        auto_start_recording_default: false,
        auto_start_recording_enforced: false,
        has_access_code_default: true,
        has_access_code_enforced: false,
      });
      await mockApiRequest(page, "GET", "roomTypes/30", {
        json: roomTypeResponse,
      });

      await page.locator("#room-type-name").fill("Exam");
      await page.getByTestId("server-pool-dropdown").click();
      await page.locator(".multiselect__option").nth(0).click();
      await expect(
        page.getByTestId("server-pool-dropdown").locator(".multiselect__tags"),
      ).toContainText("Test");

      await mockApiRequest(page, "GET", "roles*", {
        json: rolesSecondPageResponse,
      });
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await content.getByTestId("next-page-button").click();
      await content.locator(".multiselect__option").nth(0).click();
      await content.locator(".multiselect__option").nth(2).click();
      await expectRoleChips(page, ["Dean", "Manager"]);
      await page.locator(".multiselect__select").nth(1).click();
      await expect(content).toBeHidden();

      const postRoomTypesApiMock = await mockApiRequest(
        page,
        "POST",
        "roomTypes",
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
      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();

      postRoomTypesApiMock.release();

      const expectedRequestBody = {
        ...roomTypeResponse.data,
        server_pool: roomTypeResponse.data.server_pool.id,
        roles: roomTypeResponse.data.roles.map((role) => role.id),
      };
      delete expectedRequestBody.id;
      delete expectedRequestBody.model_name;
      delete expectedRequestBody.description;
      expectedRequestBody.name = "Exam";
      await expect(postRoomTypesApiMock).toHaveReceivedRequest({
        json: expectedRequestBody,
      });

      await expect(page).toHaveURL(/\/admin\/room_types\/30$/);
      await expect(page.getByTestId("overlay")).toBeHidden();
    });
  });

  test.describe("save errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types/new");
      await expect(page.locator("#room-type-name")).toBeVisible();
      await page.locator("#restrict").click();
      await expect(page.getByTestId("role-field")).toBeVisible();
    });

    test("shows validation errors on 422", async ({
      page,
      roomTypeValidationErrorsResponse,
      roomTypeErrorFieldMessages,
    }) => {
      await mockApiRequest(page, "POST", "roomTypes", {
        status: 422,
        json: {
          message: "The name field is required. (and 29 more errors)",
          errors: roomTypeValidationErrorsResponse,
        },
      });

      await page.getByTestId("room-types-save-button").click();

      await expectToastAndClose(
        page,
        "The name field is required. (and 29 more errors)",
      );

      for (const [testId, messages] of roomTypeErrorFieldMessages) {
        for (const message of messages) {
          await expect(page.getByTestId(testId)).toContainText(message);
        }
      }
    });

    test("shows an error message on 500", async ({ page }) => {
      await mockApiRequest(page, "POST", "roomTypes", serverError());

      await page.getByTestId("room-types-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("hides the validation errors after the next save", async ({
      page,
      roomTypeValidationErrorsResponse,
      roomTypeErrorFieldMessages,
    }) => {
      await mockApiRequest(page, "POST", "roomTypes", {
        status: 422,
        json: {
          message: "The name field is required. (and 29 more errors)",
          errors: roomTypeValidationErrorsResponse,
        },
      });
      await page.getByTestId("room-types-save-button").click();
      await expectToastAndClose(
        page,
        "The name field is required. (and 29 more errors)",
      );
      await expect(page.getByTestId("room-type-name-field")).toContainText(
        "The name field is required.",
      );

      await mockApiRequest(page, "POST", "roomTypes", serverError());
      await page.getByTestId("room-types-save-button").click();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      for (const [testId, messages] of roomTypeErrorFieldMessages) {
        for (const message of messages) {
          await expect(page.getByTestId(testId)).not.toContainText(message);
        }
      }
    });

    test("redirects to the login page on 401", async ({ page }) => {
      await mockApiRequest(page, "POST", "roomTypes", { status: 401 });

      await page.getByTestId("room-types-save-button").click();

      await expectLoginRedirect(page, "/admin/room_types/new");
    });
  });

  test.describe("load roles errors", () => {
    test("disables the dropdown and saving while the roles are loading", async ({
      page,
    }) => {
      const release = await holdApiRequest(page, "roles*", serverError());
      await page.goto("/admin/room_types/new");
      await page.locator("#restrict").click();

      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      release();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test.describe("500 error", () => {
      test.beforeEach(async ({ page }) => {
        await mockApiRequest(page, "GET", "roles*", serverError());
        await page.goto("/admin/room_types/new");
        await page.locator("#restrict").click();
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("keeps the dropdown disabled and allows saving", async ({
        page,
      }) => {
        await expect(page.getByTestId("role-dropdown")).toHaveClass(
          /multiselect--disabled/,
        );
        await expect(page.getByTestId("roles-reload-button")).toBeVisible();
        await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
      });

      test("reloads the roles", async ({ page, rolesResponse }) => {
        await mockApiRequest(page, "GET", "roles*", {
          json: rolesResponse,
        });
        await page.getByTestId("roles-reload-button").click();

        await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
          /multiselect--disabled/,
        );
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
      await page.goto("/admin/room_types/new");
      await page.locator("#restrict").click();
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(5);

      await mockApiRequest(page, "GET", "roles*", serverError());
      await content.getByTestId("next-page-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("roles-reload-button")).toBeVisible();
      await expect(page.getByTestId("room-types-save-button")).toBeEnabled();
    });

    test("redirects to the login page on 401 when the roles are loaded", async ({
      page,
    }) => {
      await mockApiRequest(page, "GET", "roles*", { status: 401 });
      await page.goto("/admin/room_types/new");
      await page.locator("#restrict").click();

      await expectLoginRedirect(page, "/admin/room_types/new");
    });

    test("redirects to the login page on 401 when switching the page", async ({
      page,
    }) => {
      await page.goto("/admin/room_types/new");
      await page.locator("#restrict").click();
      await page.getByTestId("role-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(5);

      await mockApiRequest(page, "GET", "roles*", { status: 401 });
      await content.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/room_types/new");
    });
  });

  test.describe("load server pools errors", () => {
    test("disables the dropdown and saving while the server pools are loading", async ({
      page,
      getServerPoolsApiMock,
    }) => {
      getServerPoolsApiMock.respondWith({ ...serverError(), hold: true });
      await page.goto("/admin/room_types/new");

      await expect(page.getByTestId("room-types-save-button")).toBeDisabled();
      await expect(page.getByTestId("server-pool-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      getServerPoolsApiMock.release();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test.describe("500 error", () => {
      test.beforeEach(async ({ page, getServerPoolsApiMock }) => {
        getServerPoolsApiMock.respondWith(serverError());
        await page.goto("/admin/room_types/new");
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("keeps the dropdown disabled and disables saving", async ({
        page,
      }) => {
        await expect(page.getByTestId("server-pool-dropdown")).toHaveClass(
          /multiselect--disabled/,
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
      await page.goto("/admin/room_types/new");
      await page.getByTestId("server-pool-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content.locator(".multiselect__option")).toHaveCount(3);

      getServerPoolsApiMock.respondWith(serverError());
      await content.getByTestId("next-page-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("server-pool-dropdown")).toHaveClass(
        /multiselect--disabled/,
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

      await page.goto("/admin/room_types/new");

      await expectLoginRedirect(page, "/admin/room_types/new");
    });

    test("redirects to the login page on 401 when switching the page", async ({
      page,
      serverPoolsFirstPageResponse,
      getServerPoolsApiMock,
    }) => {
      getServerPoolsApiMock.respondWith({
        json: serverPoolsFirstPageResponse,
      });
      await page.goto("/admin/room_types/new");
      await page.getByTestId("server-pool-dropdown").click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      getServerPoolsApiMock.respondWith({ status: 401 });
      await content.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/room_types/new");
    });
  });
});
