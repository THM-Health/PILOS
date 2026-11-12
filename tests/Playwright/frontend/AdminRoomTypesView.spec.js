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
} from "../support/admin.js";
import { holdRequest } from "../support/utils.js";

const ROOM_TYPE_FIXTURE = "tests/Playwright/fixtures/roomType.json";

/**
 * Mocks the GET request of the room type (overrides the default mock).
 * @param {import("@playwright/test").Page} page
 * @param {object} response - options for `route.fulfill()`
 */
async function mockRoomTypeGet(page, response) {
  await page.route("**/api/v1/roomTypes/3", (route) => route.fulfill(response));
}

test.describe("Admin room types view", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = ["admin.view", "roomTypes.view"];
    await interceptAdminRoomTypesViewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/room_types/3");
  });

  test("visit with user without permission to view room types", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = ["admin.view"];

    await page.goto("/admin/room_types/3");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/room_types\/3/);
  });

  test("shows loading state and hides buttons while loading and without permissions", async ({
    page,
  }) => {
    const release = await holdRequest(page, "**/api/v1/roomTypes/3", {
      path: ROOM_TYPE_FIXTURE,
    });

    await page.goto("/admin/room_types/3");
    await expect(
      page.getByRole("heading", { name: "admin.title" }),
    ).toBeVisible();

    const buttons = [
      "room-types-cancel-edit-button",
      "room-types-edit-button",
      "room-types-delete-button",
      "room-types-save-button",
    ];

    // Check loading
    await expect(page.getByTestId("overlay")).toBeVisible();
    for (const button of buttons) {
      await expect(page.getByTestId(button)).toHaveCount(0);
    }

    release();

    // Check that loading is done
    await expect(page.locator("#room-type-name")).toHaveValue("Exam");
    await expect(page.getByTestId("overlay")).toHaveCount(0);

    // Check that buttons are still hidden
    for (const button of buttons) {
      await expect(page.getByTestId(button)).toHaveCount(0);
    }
  });

  test.describe("room type loaded", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types/3");
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
    });

    test("shows the breadcrumbs", async ({ page }) => {
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.room_types.index",
        'admin.breadcrumbs.room_types.view_{"name":"Exam"}',
      );
    });

    test("shows the general room type data read-only", async ({ page }) => {
      const nameField = page.getByTestId("room-type-name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("app.model_name");
      await expect(nameField.locator("#room-type-name")).toHaveValue("Exam");
      await expect(nameField.locator("#room-type-name")).toBeDisabled();

      const descriptionField = page.getByTestId("description-field");
      await expect(descriptionField).toBeVisible();
      await expect(descriptionField).toContainText("app.description");
      await expect(descriptionField.locator("#description")).toHaveValue(
        "Room type description for room type Exam",
      );
      await expect(descriptionField.locator("#description")).toBeDisabled();
    });

    test("shows the color selection read-only", async ({ page }) => {
      const colorField = page.getByTestId("color-field");
      await expect(colorField).toBeVisible();
      await expect(colorField).toContainText("admin.room_types.color");
      await expect(colorField).toContainText("admin.room_types.custom_color");

      const colorButtons = colorField.getByTestId("color-button");
      await expect(colorButtons).toHaveCount(10);
      for (const button of await colorButtons.all()) {
        await expect(button).toHaveAttribute("role", "button");
        await expect(button).toHaveClass(/pointer-events-none/);
        await expect(button).toHaveClass(/opacity-80/);
        await expect(button).not.toHaveClass(/cursor-pointer/);
        await expect(button).not.toHaveClass(/selected/);
      }

      await expect(colorField.locator("#custom-color")).toHaveValue("#4a5c66");
      await expect(colorField.locator("#custom-color")).toBeDisabled();
    });

    test("shows the preview", async ({ page }) => {
      const previewField = page.getByTestId("preview-field");
      await expect(previewField).toBeVisible();
      await expect(previewField).toContainText("admin.room_types.preview");

      const badge = previewField.getByTestId("room-type-badge");
      await expect(badge).toHaveCSS("background-color", "rgb(74, 92, 102)");
      await expect(badge).toHaveText(
        "rooms.index.room_component.room_type:Exam",
      );
    });

    test("shows the server pool, restriction and limits read-only", async ({
      page,
    }) => {
      const serverPoolField = page.getByTestId("server-pool-field");
      await expect(serverPoolField).toBeVisible();
      await expect(serverPoolField).toContainText("app.server_pool");
      const serverPoolDropdown = serverPoolField.getByTestId(
        "server-pool-dropdown",
      );
      await expect(serverPoolDropdown).toHaveClass(/multiselect--disabled/);
      await expect(serverPoolDropdown.locator(".multiselect__tags")).toHaveText(
        "Test",
      );

      const restrictField = page.getByTestId("restrict-field");
      await expect(restrictField).toBeVisible();
      await expect(restrictField).toContainText("admin.room_types.restrict");
      await expect(restrictField.locator("#restrict")).not.toBeChecked();
      await expect(restrictField.locator("#restrict")).toBeDisabled();

      await expect(page.getByTestId("role-field")).toHaveCount(0);

      const maxParticipantsField = page.getByTestId("max-participants-field");
      await expect(maxParticipantsField).toBeVisible();
      await expect(maxParticipantsField).toContainText(
        "admin.room_types.max_participants",
      );
      await expect(
        maxParticipantsField.locator("#max-participants"),
      ).toHaveValue("100");
      await expect(
        maxParticipantsField.locator("#max-participants"),
      ).toBeDisabled();
      const clearMaxParticipants = maxParticipantsField.getByTestId(
        "clear-max-participants-button",
      );
      await expect(clearMaxParticipants).toBeVisible();
      await expect(clearMaxParticipants).toBeDisabled();

      const maxDurationField = page.getByTestId("max-duration-field");
      await expect(maxDurationField).toBeVisible();
      await expect(maxDurationField).toContainText(
        "admin.room_types.max_duration",
      );
      await expect(maxDurationField.locator("#max-duration")).toHaveValue(
        "120 min.",
      );
      await expect(maxDurationField.locator("#max-duration")).toBeDisabled();
      const clearMaxDuration = maxDurationField.getByTestId(
        "clear-max-duration-button",
      );
      await expect(clearMaxDuration).toBeVisible();
      await expect(clearMaxDuration).toBeDisabled();
    });

    test("shows the default and enforced room settings read-only", async ({
      page,
    }) => {
      await expect(
        page.getByText("admin.room_types.default_room_settings.title", {
          exact: true,
        }),
      ).toBeVisible();

      // [section title, [field, label, value, enforced]]
      const sections = [
        [
          "rooms.settings.general.title",
          [
            ["has-access-code", "has_access_code", true, false],
            ["allow-guests", "allow_guests", true, true],
          ],
        ],
        [
          "rooms.settings.video_conference.title",
          [
            ["everyone-can-start", "everyone_can_start", false, false],
            ["mute-on-start", "mute_on_start", true, true],
          ],
        ],
        [
          "rooms.settings.recordings.title",
          [
            ["record-attendance", "record_attendance", false, false],
            ["record", "record_video_conference", false, false],
            ["auto-start-recording", "auto_start_recording", false, false],
          ],
        ],
        [
          "rooms.settings.restrictions.title",
          [
            ["disable-cam", "lock_settings_disable_cam", false, false],
            [
              "webcams-only-for-moderator",
              "webcams_only_for_moderator",
              true,
              false,
            ],
            ["disable-mic", "lock_settings_disable_mic", false, true],
            [
              "disable-public-chat",
              "lock_settings_disable_public_chat",
              true,
              false,
            ],
            [
              "disable-private-chat",
              "lock_settings_disable_private_chat",
              false,
              false,
            ],
            ["disable-note", "lock_settings_disable_note", true, true],
            ["hide-user-list", "lock_settings_hide_user_list", true, false],
          ],
        ],
        [
          "rooms.settings.participants.title",
          [["allow-membership", "allow_membership", false, true]],
        ],
      ];

      for (const [title, fields] of sections) {
        await expect(page.getByRole("heading", { name: title })).toBeVisible();

        const labelPrefix = title.replace(/\.title$/, "");
        for (const [field, label, value, enforced] of fields) {
          const fieldContainer = page.getByTestId(field + "-field");
          await expect(fieldContainer).toBeVisible();
          await expect(fieldContainer).toContainText(`${labelPrefix}.${label}`);
          await roomTypeCheckDefaultRoomSettingCheckboxField(
            fieldContainer,
            field,
            value,
            enforced,
            true,
          );
        }
      }
    });

    test("shows the lobby setting read-only", async ({ page }) => {
      const lobbyField = page.getByTestId("lobby-field");
      await expect(lobbyField).toBeVisible();
      await expect(lobbyField).toContainText(
        "rooms.settings.video_conference.lobby.title",
      );

      const disabledField = lobbyField.getByTestId("lobby-disabled-field");
      await expect(disabledField).toBeVisible();
      await expect(disabledField).toContainText("app.disabled");
      await expect(disabledField.locator("#lobby-disabled")).not.toBeChecked();
      await expect(disabledField.locator("#lobby-disabled")).toBeDisabled();

      const enabledField = lobbyField.getByTestId("lobby-enabled-field");
      await expect(enabledField).toBeVisible();
      await expect(enabledField).toContainText("app.enabled");
      await expect(enabledField.locator("#lobby-enabled")).not.toBeChecked();
      await expect(enabledField.locator("#lobby-enabled")).toBeDisabled();

      const onlyForGuestsField = lobbyField.getByTestId(
        "lobby-only-for-guests-field",
      );
      await expect(onlyForGuestsField).toBeVisible();
      await expect(onlyForGuestsField).toContainText(
        "rooms.settings.video_conference.lobby.only_for_guests_enabled",
      );
      await expect(
        onlyForGuestsField.locator("#lobby-only-for-guests"),
      ).toBeChecked();
      await expect(
        onlyForGuestsField.locator("#lobby-only-for-guests"),
      ).toBeDisabled();

      const enforced = lobbyField.getByTestId("lobby-enforced");
      await expect(enforced).toHaveText(
        "admin.room_types.default_room_settings.enforced",
      );
      await expect(enforced).toBeDisabled();
    });

    test("shows the default role setting read-only", async ({ page }) => {
      const roleField = page.getByTestId("default-role-field");
      await expect(roleField).toBeVisible();
      await expect(roleField).toContainText(
        "rooms.settings.participants.default_role.title",
      );
      await expect(roleField).toContainText(
        "rooms.settings.participants.default_role.only_logged_in",
      );

      const buttons = roleField.getByTestId("default-role-default-button");
      await expect(buttons).toHaveCount(2);

      await expect(buttons.nth(0)).toHaveText("rooms.roles.participant");
      await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "true");
      await expect(buttons.nth(0)).toBeDisabled();

      await expect(buttons.nth(1)).toHaveText("rooms.roles.moderator");
      await expect(buttons.nth(1)).not.toHaveAttribute("aria-pressed", "true");
      await expect(buttons.nth(1)).toBeDisabled();

      const enforced = roleField.getByTestId("default-role-enforced");
      await expect(enforced).toHaveText(
        "admin.room_types.default_room_settings.default",
      );
      await expect(enforced).toBeDisabled();
    });

    test("shows the visibility setting read-only", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "rooms.settings.advanced.title" }),
      ).toBeVisible();

      const visibilityField = page.getByTestId("visibility-field");
      await expect(visibilityField).toBeVisible();
      await expect(visibilityField).toContainText(
        "rooms.settings.advanced.visibility",
      );

      const buttons = visibilityField.getByTestId("visibility-default-button");
      await expect(buttons).toHaveCount(2);

      await expect(buttons.nth(0)).toHaveText(
        "rooms.settings.advanced.visibility.private",
      );
      await expect(buttons.nth(0)).not.toHaveAttribute("aria-pressed", "true");
      await expect(buttons.nth(0)).toBeDisabled();

      await expect(buttons.nth(1)).toHaveText(
        "rooms.settings.advanced.visibility.public",
      );
      await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
      await expect(buttons.nth(1)).toBeDisabled();

      const enforced = visibilityField.getByTestId("visibility-enforced");
      await expect(enforced).toHaveText(
        "admin.room_types.default_room_settings.default",
      );
      await expect(enforced).toBeDisabled();
    });

    test("shows the BBB api parameters read-only", async ({ page }) => {
      await expect(
        page.getByText("admin.room_types.bbb_api.title", { exact: true }),
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
      await expect(createField.locator("#create-parameters")).toBeDisabled();

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
      await expect(joinField.locator("#join-parameters")).toBeDisabled();
    });
  });

  test("shows restriction and roles read-only", async ({ page }) => {
    const roomType = JSON.parse(readFileSync(ROOM_TYPE_FIXTURE, "utf8"));
    roomType.data.restrict = true;
    roomType.data.roles = [
      { id: 1, name: "Superuser" },
      { id: 2, name: "Staff" },
    ];
    await mockRoomTypeGet(page, { json: roomType });

    await page.goto("/admin/room_types/3");

    const restrictField = page.getByTestId("restrict-field");
    await expect(restrictField).toBeVisible();
    await expect(restrictField).toContainText("admin.room_types.restrict");
    await expect(restrictField.locator("#restrict")).toBeChecked();
    await expect(restrictField.locator("#restrict")).toBeDisabled();

    const roleField = page.getByTestId("role-field");
    await expect(roleField).toBeVisible();
    await expect(roleField).toContainText("app.roles");

    const roleDropdown = roleField.getByTestId("role-dropdown");
    await expect(roleDropdown).toHaveClass(/multiselect--disabled/);

    const chips = roleDropdown.getByTestId("role-chip");
    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).toContainText("Superuser");
    await expect(chips.nth(1)).toContainText("Staff");
    await expect(chips.getByTestId("remove-server-button")).toHaveCount(0);
  });

  test.describe("load errors", () => {
    test("shows the error and allows to reload on 500", async ({ page }) => {
      await mockRoomTypeGet(page, { status: 500, json: { message: "Test" } });
      await page.goto("/admin/room_types/3");

      // Check that overlay is shown
      await expect(page.getByTestId("overlay")).toBeVisible();

      // Check that error message is shown
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Reload with correct data
      await mockRoomTypeGet(page, { path: ROOM_TYPE_FIXTURE });

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
      await retryButton.click();

      // Check that overlay is not shown anymore
      await expect(page.locator("#room-type-name")).toHaveValue("Exam");
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(retryButton).toHaveCount(0);
    });

    test("redirects to the index page on 404", async ({ page }) => {
      await interceptAdminRoomTypesIndexRequests(page);
      await mockRoomTypeGet(page, {
        status: 404,
        json: { message: "model_not_found", model: "room_type", ids: [3] },
      });

      await page.goto("/admin/room_types/3");

      // Check that redirect worked
      await expect(page).toHaveURL(/\/admin\/room_types$/);

      // Check that error message is shown
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room_type"}',
        'app.flash.model_not_found.details_{"ids":"3"}',
      ]);
    });

    test("redirects to the login page on 401", async ({ page }) => {
      await mockRoomTypeGet(page, { status: 401 });

      await page.goto("/admin/room_types/3");

      await expectLoginRedirect(page, "/admin/room_types/3");
    });
  });

  test("shows only the edit button with update permission", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "roles.viewAny",
      "serverPools.viewAny",
      "roomTypes.view",
      "roomTypes.update",
    ];

    await page.goto("/admin/room_types/3");

    const editButton = page.getByTestId("room-types-edit-button");
    await expect(editButton).toBeVisible();
    await expect(editButton).toHaveText("app.edit");
    await expect(editButton).toHaveAttribute(
      "href",
      "/admin/room_types/3/edit",
    );
    await expect(page.getByTestId("room-types-cancel-edit-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-types-delete-button")).toHaveCount(0);
    await expect(page.getByTestId("room-types-save-button")).toHaveCount(0);
  });

  test("shows edit and delete buttons with delete permission", async ({
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
      "roomTypes.delete",
    ];

    await page.goto("/admin/room_types/3");

    const editButton = page.getByTestId("room-types-edit-button");
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
    await expect(editButton).toHaveText("app.edit");
    await expect(editButton).toHaveAttribute(
      "href",
      "/admin/room_types/3/edit",
    );
    await expect(page.getByTestId("room-types-delete-button")).toBeVisible();
    await expect(page.getByTestId("room-types-delete-button")).toBeEnabled();
    await expect(page.getByTestId("room-types-cancel-edit-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-types-save-button")).toHaveCount(0);
  });
});
