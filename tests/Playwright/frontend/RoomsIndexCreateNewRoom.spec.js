import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomIndexRequests,
  interceptRoomViewRequests,
} from "../support/mocks.js";
import { expectLoginRedirect } from "../support/general.js";
import { checkDefaultRoomSettingField } from "../support/room.js";
import { mockMethod, nthRequest, queryOf } from "../support/utils.js";

const ROOMS_URL = "**/api/v1/rooms";
const ROOM_TYPES_URL = "**/api/v1/roomTypes*";
const ROOMS_LIST_URL = (url) => url.pathname === "/api/v1/rooms";

const CREATED_ROOM = {
  status: 201,
  json: {
    data: {
      id: "abc-def-123",
      owner: { id: 1, name: "John Doe" },
      type: { id: 2, name: "Meeting", color: "#4a5c66" },
    },
  },
};

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const ROOM_TYPE_NAMES = ["Lecture", "Meeting", "Exam", "Seminar"];

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Mock the room list with the rooms fixture, changed by `mutate`.
 */
async function mockRooms(page, mutate = () => {}) {
  const rooms = readFixture("rooms.json");
  mutate(rooms);
  await page.route(ROOMS_LIST_URL, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: rooms })
      : route.fallback(),
  );
}

function noRooms(rooms) {
  rooms.data = [];
  rooms.meta.total = 0;
  rooms.meta.total_no_filter = 0;
  rooms.meta.total_own = 0;
}

/**
 * Mock the room types with the fixture, changed by `mutate`.
 */
function mockRoomTypes(page, fixture, mutate = () => {}) {
  const roomTypes = readFixture(fixture);
  mutate(roomTypes);
  return mockMethod(page, "GET", ROOM_TYPES_URL, { json: roomTypes });
}

test.describe("Rooms index create new room", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUser }) => {
    currentUser.data.permissions = ["rooms.create"];
    await interceptRoomIndexRequests(page);
  });

  test("button to create new room hidden", async ({ page, currentUser }) => {
    currentUser.data.permissions = [];

    await page.goto("/rooms");

    // Wait until the rooms are rendered
    await expect(page.getByTestId("room-card")).toHaveCount(3);
    // Room create button is hidden for user that does not have the permission to create rooms
    await expect(page.getByTestId("room-create-button")).toHaveCount(0);
    // Room limit tag does not exist
    await expect(page.getByText("rooms.room_limit")).toHaveCount(0);
  });

  test.describe("create dialog", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);
    });

    test("dialog and room limit hidden initially", async ({ page }) => {
      await expect(page.getByTestId("room-create-button")).toHaveText(
        "rooms.create.title",
      );
      await expect(page.getByTestId("room-create-dialog")).toHaveCount(0);
      await expect(page.getByText("rooms.room_limit")).toHaveCount(0);
    });

    test("open dialog and load room types", async ({ page }) => {
      const roomTypes = await mockRoomTypes(page, "roomTypesWithSettings.json");

      await page.getByTestId("room-create-button").click();

      const request = await nthRequest(roomTypes);
      expect(queryOf(request)).toEqual({
        with_room_settings: "1",
        with_features: "1",
        filter: "own",
      });

      const dialog = page.getByTestId("room-create-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("rooms.create.title")).toBeVisible();
      await expect(dialog.locator("#room-name")).toHaveValue("");
      // No room type selected
      await expect(dialog.getByTestId("room-type-details")).toHaveCount(0);

      const options = dialog.getByTestId("room-type-select-option");
      await expect(options).toHaveText(ROOM_TYPE_NAMES);
    });

    test("cancel resets the dialog", async ({ page }) => {
      await page.getByTestId("room-create-button").click();

      const dialog = page.getByTestId("room-create-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId("room-type-details")).toHaveCount(0);

      await dialog.locator("#room-name").fill("New Room");
      await dialog.getByTestId("room-type-select-option").nth(0).click();
      await expect(dialog.getByTestId("room-type-details")).toBeVisible();

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);

      // Reopen: selected values were reset
      await page.getByTestId("room-create-button").click();
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("#room-name")).toHaveValue("");
      await expect(dialog.getByTestId("room-type-select-option")).toHaveCount(
        4,
      );
      await expect(dialog.getByTestId("room-type-details")).toHaveCount(0);
    });
  });

  test.describe("room type details", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomTypes(page, "roomTypesWithSettings.json");
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);
      await page.getByTestId("room-create-button").click();
      await page
        .getByTestId("room-create-dialog")
        .getByTestId("room-type-select-option")
        .nth(1)
        .click();
    });

    test("show details of the selected room type", async ({ page }) => {
      const details = page.getByTestId("room-type-details");
      await expect(details).toBeVisible();
      await expect(
        details.getByText("admin.room_types.missing_description"),
      ).toBeVisible();
      // Default room settings exist but are hidden
      await expect(
        details.getByText("rooms.settings.general.title"),
      ).toHaveCount(1);
      await expect(
        details.getByText("rooms.settings.general.title"),
      ).toBeHidden();
    });

    test("show default room settings of the selected room type", async ({
      page,
    }) => {
      const details = page.getByTestId("room-type-details");
      const showSettings = details.getByTestId("show-default-settings-button");
      await expect(showSettings).toHaveText(
        "admin.room_types.default_room_settings.title",
      );
      await showSettings.click();
      await expect(
        details.getByText("rooms.settings.general.title"),
      ).toBeVisible();

      const settings = [
        // [field, label, value, enforced, isInfo]
        ["has_access_code", "general.has_access_code", true, false, false],
        ["allow_guests", "general.allow_guests", true, true, false],
        [
          "everyone_can_start",
          "video_conference.everyone_can_start",
          false,
          false,
          false,
        ],
        ["mute_on_start", "video_conference.mute_on_start", true, true, false],
        [
          "lobby",
          "video_conference.lobby.title",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          true,
        ],
        [
          "record_attendance",
          "recordings.record_attendance",
          false,
          false,
          false,
        ],
        ["record", "recordings.record_video_conference", false, false, false],
        [
          "auto_start_recording",
          "recordings.auto_start_recording",
          false,
          false,
          false,
        ],
        [
          "lock_settings_disable_cam",
          "restrictions.lock_settings_disable_cam",
          false,
          false,
          false,
        ],
        [
          "webcams_only_for_moderator",
          "restrictions.webcams_only_for_moderator",
          true,
          false,
          false,
        ],
        [
          "lock_settings_disable_mic",
          "restrictions.lock_settings_disable_mic",
          false,
          true,
          false,
        ],
        [
          "lock_settings_disable_public_chat",
          "restrictions.lock_settings_disable_public_chat",
          true,
          false,
          false,
        ],
        [
          "lock_settings_disable_private_chat",
          "restrictions.lock_settings_disable_private_chat",
          false,
          false,
          false,
        ],
        [
          "lock_settings_disable_note",
          "restrictions.lock_settings_disable_note",
          true,
          true,
          false,
        ],
        [
          "lock_settings_hide_user_list",
          "restrictions.lock_settings_hide_user_list",
          true,
          false,
          false,
        ],
        [
          "allow_membership",
          "participants.allow_membership",
          false,
          true,
          false,
        ],
        [
          "default_role",
          "participants.default_role.title",
          "rooms.roles.participant",
          false,
          true,
        ],
        [
          "visibility",
          "advanced.visibility.title",
          "rooms.settings.advanced.visibility.public",
          false,
          true,
        ],
      ];

      for (const [field, label, value, enforced, isInfo] of settings) {
        await expect(
          details.getByTestId(`room-type-${field}-setting`),
        ).toContainText(`rooms.settings.${label}`);
        await checkDefaultRoomSettingField(
          page,
          field,
          value,
          enforced,
          isInfo,
        );
      }

      // Section titles
      for (const title of [
        "video_conference",
        "recordings",
        "participants",
        "advanced",
      ]) {
        await expect(
          details.getByText(`rooms.settings.${title}.title`),
        ).toBeVisible();
      }
    });
  });

  test.describe("room type features", () => {
    function mockStreaming(
      page,
      config,
      { configEnabled, hideDisabled = true },
    ) {
      config.data.streaming.enabled = configEnabled;
      config.data.general.hide_disabled_features = hideDisabled;
      return mockRoomTypes(page, "roomTypesWithSettings.json", (roomTypes) => {
        roomTypes.data[0].features.streaming.enabled = true;
      });
    }

    async function openDialogAndSelect(page, index) {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);
      await page.getByTestId("room-create-button").click();
      const dialog = page.getByTestId("room-create-dialog");
      await expect(dialog.getByTestId("room-type-details")).toHaveCount(0);
      await dialog.getByTestId("room-type-select-option").nth(index).click();
      await expect(dialog.getByTestId("room-type-details")).toBeVisible();
      return dialog;
    }

    test("features enabled", async ({ page, config }) => {
      await mockStreaming(page, config, { configEnabled: true });

      const dialog = await openDialogAndSelect(page, 0);

      // Streaming is enabled for the room type
      const features = dialog.getByTestId("room-type-features");
      await expect(features).toBeVisible();
      await expect(features).toContainText("rooms.room_types.features.title");
      await expect(
        dialog.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/p-tag-success/);

      // Streaming is disabled for the other room type
      await dialog.getByTestId("room-type-select-option").nth(1).click();
      await expect(features).toBeVisible();
      await expect(features).toContainText("rooms.room_types.features.title");
      await expect(
        dialog.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/p-tag-secondary/);
    });

    test("features hidden if disabled", async ({ page, config }) => {
      await mockStreaming(page, config, { configEnabled: false });

      const dialog = await openDialogAndSelect(page, 0);

      await expect(dialog.getByTestId("room-type-features")).toHaveCount(0);
    });

    test("disabled features shown if configured", async ({ page, config }) => {
      await mockStreaming(page, config, {
        configEnabled: false,
        hideDisabled: false,
      });

      const dialog = await openDialogAndSelect(page, 0);

      const features = dialog.getByTestId("room-type-features");
      await expect(features).toBeVisible();
      await expect(features).toContainText("rooms.room_types.features.title");
      await expect(
        dialog.getByTestId("room-type-feature-streaming"),
      ).toHaveClass(/p-tag-secondary/);
    });
  });

  test.describe("create room", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomTypes(page, "roomTypesWithSettings.json");
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);
      await page.getByTestId("room-create-button").click();
    });

    test("loading state while creating and redirect to the room", async ({
      page,
    }) => {
      await interceptRoomViewRequests(page);
      const createRoom = await mockMethod(page, "POST", ROOMS_URL, {
        ...CREATED_ROOM,
        hold: true,
      });

      const dialog = page.getByTestId("room-create-dialog");
      await dialog.locator("#room-name").fill("New Room");
      await dialog.getByTestId("room-type-select-option").nth(1).click();
      await dialog.getByTestId("dialog-save-button").click();

      // Loading
      await expect(dialog.locator("#room-name")).toBeDisabled();
      await expect(dialog.locator(".p-listbox-list")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      createRoom.release();

      const request = await nthRequest(createRoom);
      expect(request.postDataJSON()).toEqual({
        name: "New Room",
        room_type: 2,
      });

      await expect(page).toHaveURL((url) =>
        url.href.includes("/rooms/abc-def-123"),
      );
    });

    test("422 errors are shown and replaced, room types are not reloaded", async ({
      page,
    }) => {
      const roomTypes = await mockRoomTypes(page, "roomTypes.json", (types) => {
        const invalidType = structuredClone(types.data[0]);
        invalidType.id = 999;
        invalidType.name = "Invalid Type";
        types.data.unshift(invalidType);
      });
      // Reload the page so that the dialog requests the room types with the invalid type
      await page.reload();
      await expect(page.getByTestId("room-card")).toHaveCount(3);
      await page.getByTestId("room-create-button").click();
      const dialog = page.getByTestId("room-create-dialog");
      await expect(dialog.getByTestId("room-type-select-option")).toHaveCount(
        5,
      );
      const roomTypesCount = roomTypes.requests.length;

      // Create new room without room type
      await mockMethod(page, "POST", ROOMS_URL, {
        status: 422,
        json: {
          message: "The Room type field is required.",
          errors: { room_type: ["The Room type field is required."] },
        },
      });
      await dialog.locator("#room-name").fill("New Room");
      await dialog.getByTestId("dialog-save-button").click();

      await expect(dialog).toContainText("The Room type field is required.");
      // Room types are not reloaded on form errors
      expect(roomTypes.requests).toHaveLength(roomTypesCount);

      // Create new room with invalid room type
      await mockMethod(page, "POST", ROOMS_URL, {
        status: 422,
        json: {
          message: "The selected Room type is invalid.",
          errors: { room_type: ["The selected Room type is invalid."] },
        },
      });
      await dialog.getByTestId("room-type-select-option").nth(0).click();
      await expect(
        dialog.locator('[data-test="room-type-details"] > h3'),
      ).toContainText("Invalid Type");
      // The reloaded list has no invalid type anymore
      const reloadedRoomTypes = await mockRoomTypes(page, "roomTypes.json");
      await dialog.getByTestId("dialog-save-button").click();

      // New error is shown, old error is gone
      await expect(dialog).toContainText("The selected Room type is invalid.");
      await expect(dialog).not.toContainText(
        "The Room type field is required.",
      );
      // Room types are reloaded and the selection is reset
      await nthRequest(reloadedRoomTypes);
      await expect(dialog.getByTestId("room-type-select-option")).toHaveCount(
        4,
      );
      await expect(dialog.getByTestId("room-type-details")).toHaveCount(0);
    });

    test("422 name error replaces previous errors", async ({ page }) => {
      const dialog = page.getByTestId("room-create-dialog");

      await mockMethod(page, "POST", ROOMS_URL, {
        status: 422,
        json: {
          message: "The selected Room type is invalid.",
          errors: { room_type: ["The selected Room type is invalid."] },
        },
      });
      await dialog.locator("#room-name").fill("New Room");
      await dialog.getByTestId("room-type-select-option").nth(0).click();
      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toContainText("The selected Room type is invalid.");

      await mockMethod(page, "POST", ROOMS_URL, {
        status: 422,
        json: {
          message: "The Name field is required.",
          errors: { name: ["The Name field is required."] },
        },
      });
      await dialog.locator("#room-name").clear();
      await dialog.getByTestId("room-type-select-option").nth(0).click();
      await dialog.getByTestId("dialog-save-button").click();

      await expect(dialog).toContainText("The Name field is required.");
      await expect(dialog).not.toContainText(
        "The selected Room type is invalid.",
      );
    });

    test("500 error", async ({ page }) => {
      const dialog = page.getByTestId("room-create-dialog");

      // Previous 422 error is hidden by the next request
      await mockMethod(page, "POST", ROOMS_URL, {
        status: 422,
        json: {
          message: "The Name field is required.",
          errors: { name: ["The Name field is required."] },
        },
      });
      await dialog.getByTestId("room-type-select-option").nth(0).click();
      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toContainText("The Name field is required.");

      await mockMethod(page, "POST", ROOMS_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await dialog.locator("#room-name").fill("New Room");
      await dialog.getByTestId("dialog-save-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(dialog).toBeVisible();
      await expect(dialog).not.toContainText("The Name field is required.");
    });

    test("403 error closes the dialog and removes the create button", async ({
      page,
      currentUser,
    }) => {
      const dialog = page.getByTestId("room-create-dialog");
      await mockMethod(page, "POST", ROOMS_URL, { status: 403 });
      currentUser.data.permissions = [];

      await dialog.getByTestId("dialog-save-button").click();

      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId("room-create-button")).toHaveCount(0);
      await expectToastAndClose(page, "rooms.flash.no_new_room");
    });

    test("401 error redirects to login", async ({ page }) => {
      const dialog = page.getByTestId("room-create-dialog");
      await mockMethod(page, "POST", ROOMS_URL, { status: 401 });

      await dialog.locator("#room-name").fill("New Room");
      await dialog.getByTestId("room-type-select-option").nth(0).click();
      await dialog.getByTestId("dialog-save-button").click();

      await expectLoginRedirect(page, "/rooms");
    });
  });

  test.describe("room limit", () => {
    test.beforeEach(async ({ page, currentUser }) => {
      currentUser.data.room_limit = 1;
      await mockRooms(page, noRooms);
    });

    test("limit reached when visiting", async ({ page }) => {
      // The user already has a room
      await mockRooms(page, (rooms) => {
        noRooms(rooms);
        rooms.meta.total_own = 1;
      });
      await page.goto("/rooms");

      await expect(
        page.getByText('rooms.room_limit_{"has":1,"max":1}'),
      ).toBeVisible();
      await expect(page.getByTestId("room-create-button")).toBeDisabled();
    });

    test("room limit is shown", async ({ page }) => {
      await page.goto("/rooms");

      await expect(
        page.getByText('rooms.room_limit_{"has":0,"max":1}'),
      ).toBeVisible();
      await expect(page.getByTestId("room-create-button")).toBeEnabled();
    });

    test.describe("limit reached on creation", () => {
      test.beforeEach(async ({ page }) => {
        await mockMethod(page, "POST", ROOMS_URL, {
          status: 463,
          json: { message: "Test" },
        });
        await mockRoomTypes(page, "roomTypes.json");
        await page.goto("/rooms");
        await expect(
          page.getByText('rooms.room_limit_{"has":0,"max":1}'),
        ).toBeVisible();

        await page.getByTestId("room-create-button").click();
        const dialog = page.getByTestId("room-create-dialog");
        await dialog.locator("#room-name").fill("New Room");
        await dialog.getByTestId("room-type-select-option").nth(0).click();

        // Change the response so that the room limit gets reached
        await mockRooms(page, (rooms) => {
          rooms.data = rooms.data.slice(0, 1);
          rooms.meta.last_page = 3;
          rooms.meta.per_page = 1;
          rooms.meta.to = 1;
        });

        await dialog.getByTestId("dialog-save-button").click();

        await expect(dialog).toHaveCount(0);
        await expectToastAndClose(page, "Test");
      });

      test("limit is updated and button disabled", async ({ page }) => {
        await expect(page.getByTestId("room-create-button")).toBeDisabled();
        await expect(
          page.getByText('rooms.room_limit_{"has":1,"max":1}'),
        ).toBeVisible();
      });

      test("limit stays the same on the next page", async ({ page }) => {
        await mockRooms(page, (rooms) => {
          rooms.data = rooms.data.slice(1, 2);
          rooms.meta.current_page = 2;
          rooms.meta.from = 2;
          rooms.meta.last_page = 3;
          rooms.meta.per_page = 1;
          rooms.meta.to = 2;
        });

        // two paginator components (first one for small devices, second one for larger devices)
        await page.getByTestId("paginator-next-button").nth(1).click();

        await expect(page.getByTestId("room-card")).toContainText(
          "Meeting Two",
        );
        await expect(page.getByTestId("room-create-button")).toBeDisabled();
        await expect(
          page.getByText('rooms.room_limit_{"has":1,"max":1}'),
        ).toBeVisible();
      });

      test("limit is independent of the search query", async ({ page }) => {
        await mockRooms(page, (rooms) => {
          rooms.data = [];
          rooms.meta.total = 0;
          rooms.meta.total_no_filter = 0;
        });

        const search = page.getByTestId("room-search").locator("input");
        await search.fill("Test");
        await search.press("Enter");

        await expect(page.getByTestId("room-card")).toHaveCount(0);
        await expect(page.getByTestId("room-create-button")).toBeDisabled();
        await expect(
          page.getByText('rooms.room_limit_{"has":1,"max":1}'),
        ).toBeVisible();
      });
    });
  });

  test.describe("errors loading room types", () => {
    test("500 error: loading state, toast and reload", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      const failing = await mockMethod(page, "GET", ROOM_TYPES_URL, {
        status: 500,
        json: { message: "Test" },
        hold: true,
      });

      await page.getByTestId("room-create-button").click();

      // Loading
      const dialog = page.getByTestId("room-create-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.create.title");
      await expect(dialog.getByTestId("overlay")).toBeVisible();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      failing.release();
      await nthRequest(failing);

      await expectToastAndClose(page, SERVER_ERROR_TOAST);

      // Dialog after the error
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("#room-name")).toBeEnabled();
      await expect(dialog.getByTestId("overlay")).toHaveCount(0);
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeEnabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      // Reload with valid room types
      await mockRoomTypes(page, "roomTypesWithSettings.json");
      await dialog.getByTestId("reload-room-types-button").click();

      await expect(dialog.getByTestId("room-type-select-option")).toHaveText(
        ROOM_TYPE_NAMES,
      );
    });

    test("401 error redirects to login", async ({ page }) => {
      await page.goto("/rooms");
      await expect(page.getByTestId("room-card")).toHaveCount(3);

      await mockMethod(page, "GET", ROOM_TYPES_URL, { status: 401 });
      await page.getByTestId("room-create-button").click();

      await expectLoginRedirect(page, "/rooms");
    });
  });
});
