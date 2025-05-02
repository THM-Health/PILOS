import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view settings", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomSettingsRequest();
  });

  it("load settings", function () {
    cy.fixture("roomSettings.json").then((roomSettings) => {
      roomSettings.data.expert_mode = false;
      roomSettings.data.welcome = "";

      const roomSettingsRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/settings",
        {
          statusCode: 200,
          body: roomSettings,
        },
        "roomSettingsRequest",
      );

      cy.visit("/rooms/abc-def-123");

      cy.get("#tab-settings").click();

      cy.url().should("include", "/rooms/abc-def-123#tab=settings");

      // Check loading

      // Check that overlay is shown
      cy.get('[data-test="overlay"]').should("be.visible");

      // Check that buttons are disabled
      cy.get('[data-test="room-delete-button"]')
        .should("have.text", "rooms.modals.delete.title")
        .and("be.disabled");

      cy.get('[data-test="room-transfer-ownership-button"]')
        .should("have.text", "rooms.modals.transfer_ownership.title")
        .and("be.disabled");

      cy.get('[data-test="room-settings-expert-mode-button"]')
        .should("have.text", "rooms.settings.expert_mode.activate")
        .and("be.disabled");

      cy.get('[data-test="room-settings-save-button"]')
        .should("have.text", "app.save")
        .and("be.disabled")
        .then(() => {
          roomSettingsRequest.sendResponse();
        });
    });

    cy.wait("@roomSettingsRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // General settings
    cy.contains("rooms.settings.general.title").should("be.visible");
    cy.get('[data-test="room-setting-room_type"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.general.type")
      .find("#room-setting-room_type")
      .should("have.value", "Meeting");

    cy.get('[data-test="room-setting-name"]')
      .should("be.visible")
      .and("include.text", "rooms.name")
      .find("#room-setting-name")
      .should("have.value", "Meeting One");

    cy.get('[data-test="room-setting-access_code"]')
      .should("be.visible")
      .and("include.text", "rooms.access_code")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-access_code").should("have.value", "123456789");
      });

    cy.get('[data-test="room-setting-allow_guests"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.general.access_by_guests")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("be.visible");
        cy.get("#room-setting-allow_guests")
          .should("be.disabled")
          .and("be.checked");
      });

    cy.get('[data-test="room-setting-short_description"]')
      .should("be.visible")
      .should("include.text", "rooms.settings.general.short_description")
      .should(
        "include.text",
        'rooms.settings.general.chars_{"chars":"17 / 300"}',
      )
      .find("#room-setting-short_description")
      .should("have.value", "Short description");

    // Check other settings hidden
    // Video conference settings
    cy.contains("rooms.settings.video_conference.title").should("not.exist");

    // Recording settings
    cy.contains("rooms.settings.recordings.title").should("not.exist");

    // Restriction settings
    cy.contains("rooms.settings.restrictions.title").should("not.exist");

    // Participant settings
    cy.contains("rooms.settings.participants.title").should("not.exist");

    // Advanced settings
    cy.contains("rooms.settings.advanced.title").should("not.exist");

    // Activate expert mode
    cy.get('[data-test="room-settings-expert-mode-button"]').click();
    cy.get('[data-test="room-settings-expert-mode-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.expert_mode.activate")
      .and("include.text", "rooms.settings.expert_mode.warning.activate")
      .find('[data-test="dialog-continue-button"]')
      .click();

    // Check that expert mode is activated
    cy.get('[data-test="room-settings-expert-mode-button"]').should(
      "have.text",
      "rooms.settings.expert_mode.deactivate",
    );

    // Check other settings visible
    // Video conference settings
    cy.contains("rooms.settings.video_conference.title").should("be.visible");

    cy.get('[data-test="room-setting-everyone_can_start"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.everyone_can_start")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-everyone_can_start")
          .should("not.be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-mute_on_start"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.mute_on_start")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("be.visible");
        cy.get("#room-setting-mute_on_start")
          .should("be.disabled")
          .and("be.checked");
      });

    cy.get('[data-test="room-setting-lobby"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.lobby.title")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("be.visible");
        cy.get("#room-setting-lobby-0")
          .should("be.disabled")
          .and("not.be.checked");
        cy.get("#room-setting-lobby-1")
          .should("be.disabled")
          .and("not.be.checked");
        cy.get("#room-setting-lobby-2").should("be.disabled").and("be.checked");
      });

    cy.get('[data-test="room-setting-welcome"]')
      .should("be.visible")
      .should("include.text", "rooms.settings.video_conference.welcome_message")
      .should(
        "include.text",
        'rooms.settings.general.chars_{"chars":"0 / 500"}',
      )
      .find("#room-setting-welcome")
      .should("have.value", "");

    // Recording settings
    cy.contains("rooms.settings.recordings.title").should("be.visible");

    cy.get('[data-test="room-setting-record_attendance"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.record_attendance")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-record_attendance")
          .should("not.be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-record"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.record_video_conference")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-record")
          .should("not.be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-auto_start_recording"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.auto_start_recording")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-auto_start_recording")
          .should("not.be.disabled")
          .and("not.be.checked");
      });

    // Restriction settings
    cy.contains("rooms.settings.restrictions.title").should("be.visible");

    cy.get('[data-test="room-setting-lock_settings_disable_cam"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_cam",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-lock_settings_disable_cam")
          .should("not.be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-webcams_only_for_moderator"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.webcams_only_for_moderator",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-webcams_only_for_moderator")
          .should("not.be.disabled")
          .and("be.checked");
      });

    cy.get('[data-test="room-setting-lock_settings_disable_mic"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_mic",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("be.visible");
        cy.get("#room-setting-lock_settings_disable_mic")
          .should("be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-lock_settings_disable_public_chat"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_public_chat",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-lock_settings_disable_public_chat")
          .should("not.be.disabled")
          .and("be.checked");
      });

    cy.get('[data-test="room-setting-lock_settings_disable_private_chat"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_private_chat",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-lock_settings_disable_private_chat")
          .should("not.be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-lock_settings_disable_note"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_note",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("be.visible");
        cy.get("#room-setting-lock_settings_disable_note")
          .should("be.disabled")
          .and("be.checked");
      });

    cy.get('[data-test="room-setting-lock_settings_hide_user_list"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_hide_user_list",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get("#room-setting-lock_settings_hide_user_list")
          .should("not.be.disabled")
          .and("be.checked");
      });

    // Participant settings
    cy.contains("rooms.settings.participants.title").should("be.visible");

    cy.get('[data-test="room-setting-allow_membership"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.participants.allow_membership")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("be.visible");
        cy.get("#room-setting-allow_membership")
          .should("be.disabled")
          .and("not.be.checked");
      });

    cy.get('[data-test="room-setting-default_role"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.participants.default_role.title")
      .and(
        "include.text",
        "rooms.settings.participants.default_role.only_logged_in",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get('[data-test="room-setting-default_role-button"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="room-setting-default_role-button"]')
          .eq(0)
          .should("have.text", "rooms.roles.participant")
          .and("have.attr", "aria-pressed", "true");
        cy.get('[data-test="room-setting-default_role-button"]')
          .eq(1)
          .should("have.text", "rooms.roles.moderator")
          .and("have.attr", "aria-pressed", "false");
      });

    // Advanced settings
    cy.contains("rooms.settings.advanced.title").should("be.visible");

    cy.get('[data-test="room-setting-visibility"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.advanced.visibility.title")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
        cy.get('[data-test="room-setting-visibility-button"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="room-setting-visibility-button"]')
          .eq(0)
          .should("have.text", "rooms.settings.advanced.visibility.private")
          .and("have.attr", "aria-pressed", "false");
        cy.get('[data-test="room-setting-visibility-button"]')
          .eq(1)
          .should("have.text", "rooms.settings.advanced.visibility.public")
          .and("have.attr", "aria-pressed", "true");
      });
  });

  it("load settings errors", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomRequest");

    cy.get('[data-test="overlay"]').should("be.visible");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="room-delete-button"]').should("be.disabled");
    cy.get('[data-test="room-transfer-ownership-button"]').should(
      "be.disabled",
    );
    cy.get('[data-test="room-settings-expert-mode-button"]').should(
      "be.disabled",
    );
    cy.get('[data-test="room-settings-save-button"]').should("be.disabled");

    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload");

    cy.checkRoomAuthErrorsLoadingTab(
      "GET",
      "api/v1/rooms/abc-def-123/settings",
      "settings",
    );
  });

  it("load settings with different permissions", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
      fixture: "roomSettings.json",
    }).as("roomSettingsRequest");

    // Check with co_owner
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomRequest");
    cy.wait("@roomSettingsRequest");

    // Check that delete and transfer ownership buttons are hidden but other buttons are shown
    cy.get('[data-test="room-settings-expert-mode-button"]')
      .should("have.text", "rooms.settings.expert_mode.deactivate")
      .and("not.be.disabled");

    cy.get('[data-test="room-delete-button"]').should("not.exist");

    cy.get('[data-test="room-transfer-ownership-button"]').should("not.exist");

    cy.get('[data-test="room-settings-save-button"]')
      .should("have.text", "app.save")
      .and("not.be.disabled");

    // General settings
    cy.get("#room-setting-room_type")
      .should("have.value", "Meeting")
      .and("not.be.disabled");
    cy.get('[data-test="room-type-change-button"]').should("not.be.disabled");
    cy.get("#room-setting-name")
      .should("have.value", "Meeting One")
      .and("not.be.disabled");
    cy.get("#room-setting-access_code")
      .should("have.value", "123456789")
      .and("not.be.disabled");
    cy.get('[data-test="generate-access-code-button"]').should(
      "not.be.disabled",
    );
    cy.get('[data-test="clear-access-code-button"]').should("not.be.disabled");
    cy.get("#room-setting-allow_guests")
      .should("be.checked")
      .and("be.disabled");

    // Video conference settings
    cy.get("#room-setting-everyone_can_start")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-mute_on_start")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lobby-0").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-lobby-1").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-lobby-2").should("be.checked").and("be.disabled");
    cy.get("#room-setting-welcome")
      .should("have.value", "Welcome message")
      .and("not.be.disabled");

    // Recording settings
    cy.get("#room-setting-record_attendance")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-record")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-auto_start_recording")
      .should("not.be.checked")
      .and("not.be.disabled");

    // Restriction settings
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("be.checked")
      .and("not.be.disabled");

    // Participant settings
    cy.get("#room-setting-allow_membership")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]').should(
      "have.length",
      2,
    );
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.text", "rooms.roles.participant")
      .and("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.text", "rooms.roles.moderator")
      .and("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    // Advanced settings
    cy.get('[data-test="room-setting-visibility-button"]').should(
      "have.length",
      2,
    );
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.text", "rooms.settings.advanced.visibility.private")
      .and("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.text", "rooms.settings.advanced.visibility.public")
      .and("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    // Check with rooms.viewAll permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = ["rooms.viewAll"];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");
    cy.wait("@roomSettingsRequest");

    // Check that buttons are hidden
    cy.get('[data-test="room-settings-expert-mode-button"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-delete-button"]').should("not.exist");
    cy.get('[data-test="room-transfer-ownership-button"]').should("not.exist");
    cy.get('[data-test="room-settings-save-button"]').should("not.exist");

    // General settings
    cy.get("#room-setting-room_type")
      .should("have.value", "Meeting")
      .and("be.disabled");
    cy.get('[data-test="room-type-change-button"]').should("not.exist");
    cy.get("#room-setting-name")
      .should("have.value", "Meeting One")
      .and("be.disabled");
    cy.get("#room-setting-access_code")
      .should("have.value", "123456789")
      .and("be.disabled");
    cy.get('[data-test="generate-access-code-button"]').should("not.exist");
    cy.get('[data-test="clear-access-code-button"]').should("not.exist");
    cy.get("#room-setting-allow_guests")
      .should("be.checked")
      .and("be.disabled");

    // Video conference settings
    cy.get("#room-setting-everyone_can_start")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-mute_on_start")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lobby-0").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-lobby-1").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-lobby-2").should("be.checked").and("be.disabled");
    cy.get("#room-setting-welcome")
      .should("have.value", "Welcome message")
      .and("be.disabled");

    // Recording settings
    cy.get("#room-setting-record_attendance")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-record").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-auto_start_recording")
      .should("not.be.checked")
      .and("be.disabled");

    // Restriction settings#
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("be.checked")
      .and("be.disabled");

    // Participant settings
    cy.get("#room-setting-allow_membership")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]').should(
      "have.length",
      2,
    );
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.text", "rooms.roles.participant")
      .and("have.attr", "aria-pressed", "true")
      .and("be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.text", "rooms.roles.moderator")
      .and("have.attr", "aria-pressed", "false")
      .and("be.disabled");

    // Advanced settings
    cy.get('[data-test="room-setting-visibility-button"]').should(
      "have.length",
      2,
    );
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.text", "rooms.settings.advanced.visibility.private")
      .and("have.attr", "aria-pressed", "false")
      .and("be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.text", "rooms.settings.advanced.visibility.public")
      .and("have.attr", "aria-pressed", "true")
      .and("be.disabled");

    // Check with rooms.manage permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");
    cy.wait("@roomSettingsRequest");

    // Check that delete and transfer ownership buttons are hidden but other buttons are shown
    cy.get('[data-test="room-settings-expert-mode-button"]')
      .should("have.text", "rooms.settings.expert_mode.deactivate")
      .and("not.be.disabled");

    cy.get('[data-test="room-delete-button"]').should("not.be.disabled");

    cy.get('[data-test="room-transfer-ownership-button"]').should(
      "not.be.disabled",
    );

    cy.get('[data-test="room-settings-save-button"]')
      .should("have.text", "app.save")
      .and("not.be.disabled");

    // General settings
    cy.get("#room-setting-room_type")
      .should("have.value", "Meeting")
      .and("not.be.disabled");
    cy.get('[data-test="room-type-change-button"]').should("not.be.disabled");
    cy.get("#room-setting-name")
      .should("have.value", "Meeting One")
      .and("not.be.disabled");
    cy.get("#room-setting-access_code")
      .should("have.value", "123456789")
      .and("not.be.disabled");
    cy.get('[data-test="generate-access-code-button"]').should(
      "not.be.disabled",
    );
    cy.get('[data-test="clear-access-code-button"]').should("not.be.disabled");
    cy.get("#room-setting-allow_guests")
      .should("be.checked")
      .and("be.disabled");

    // Video conference settings
    cy.get("#room-setting-everyone_can_start")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-mute_on_start")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lobby-0").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-lobby-1").should("not.be.checked").and("be.disabled");
    cy.get("#room-setting-lobby-2").should("be.checked").and("be.disabled");
    cy.get("#room-setting-welcome")
      .should("have.value", "Welcome message")
      .and("not.be.disabled");

    // Recording settings
    cy.get("#room-setting-record_attendance")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-record")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-auto_start_recording")
      .should("not.be.checked")
      .and("not.be.disabled");

    // Restriction settings
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("be.checked")
      .and("be.disabled");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("be.checked")
      .and("not.be.disabled");

    // Participant settings
    cy.get("#room-setting-allow_membership")
      .should("not.be.checked")
      .and("be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]').should(
      "have.length",
      2,
    );
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.text", "rooms.roles.participant")
      .and("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.text", "rooms.roles.moderator")
      .and("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    // Advanced settings
    cy.get('[data-test="room-setting-visibility-button"]').should(
      "have.length",
      2,
    );
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.text", "rooms.settings.advanced.visibility.private")
      .and("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.text", "rooms.settings.advanced.visibility.public")
      .and("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");
  });

  it("change settings", function () {
    cy.fixture("roomTypesWithSettings.json").then((roomTypes) => {
      cy.fixture("roomSettings.json").then((roomSettings) => {
        roomSettings.data.room_type = roomTypes.data[0];

        cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
          statusCode: 200,
          body: roomSettings,
        }).as("roomSettingsRequest");
      });
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get('[data-test="room-unsaved-changes-message"]').should("not.exist");

    // Change settings
    cy.get("#room-setting-name").clear();
    cy.get("#room-setting-name").type("Meeting Two");

    // Check that settings changed message is shown after changing settings
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.unsaved_changes")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("be.visible")
      .and("have.text", "app.save");

    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get("#room-setting-access_code")
      .should("have.value", "")
      .and(
        "have.attr",
        "placeholder",
        "rooms.settings.general.unprotected_placeholder",
      );
    cy.get('[data-test="clear-access-code-button"]').should("not.exist");
    cy.get('[data-test="generate-access-code-button"]').click();
    cy.get("#room-setting-access_code")
      .should("not.have.value", "")
      .then((accessCodeInput) => {
        const newAccessCodeValue = accessCodeInput[0].value;

        cy.get("#room-setting-allow_guests").click();
        cy.get("#room-setting-short_description").clear();
        cy.get("#room-setting-short_description").type("Short description two");

        cy.get("#room-setting-everyone_can_start").click();
        cy.get("#room-setting-mute_on_start").click();
        cy.get("#room-setting-lobby-0").click();
        cy.get("#room-setting-welcome").type("Welcome message");

        cy.get("#room-setting-record_attendance").click();
        cy.get("#room-setting-record").click();
        cy.get("#room-setting-auto_start_recording").click();

        cy.get("#room-setting-lock_settings_disable_cam").click();
        cy.get("#room-setting-webcams_only_for_moderator").click();
        cy.get("#room-setting-lock_settings_disable_mic").click();
        cy.get("#room-setting-lock_settings_disable_public_chat").click();
        cy.get("#room-setting-lock_settings_disable_private_chat").click();
        cy.get("#room-setting-lock_settings_disable_note").click();
        cy.get("#room-setting-lock_settings_hide_user_list").click();

        cy.get("#room-setting-allow_membership").click();
        cy.get('[data-test="room-setting-default_role-button"]').eq(1).click();

        cy.get('[data-test="room-setting-visibility-button"]').eq(0).click();

        // Deactivate expert mode and activate again
        cy.get('[data-test="room-settings-expert-mode-button"]').click();
        cy.get('[data-test="room-settings-expert-mode-dialog"]')
          .should("be.visible")
          .find('[data-test="dialog-continue-button"]')
          .click();

        cy.get('[data-test="room-settings-expert-mode-button"]').click();
        cy.get('[data-test="room-settings-expert-mode-dialog"]')
          .should("be.visible")
          .find('[data-test="dialog-continue-button"]')
          .click();

        // Check that expert settings are reset to the default values and change settings again
        cy.get("#room-setting-name").should("have.value", "Meeting Two");
        cy.get("#room-setting-access_code").should(
          "have.value",
          newAccessCodeValue,
        );
        cy.get("#room-setting-allow_guests").should("not.be.checked");
        cy.get("#room-setting-short_description").should(
          "have.value",
          "Short description two",
        );

        cy.get("#room-setting-everyone_can_start")
          .should("not.be.checked")
          .click();
        cy.get("#room-setting-mute_on_start").should("be.checked").click();
        cy.get("#room-setting-lobby-2").should("be.checked");
        cy.get("#room-setting-lobby-0").should("not.be.checked").click();
        cy.get("#room-setting-welcome")
          .should("have.value", "")
          .type("Welcome message");

        cy.get("#room-setting-record_attendance")
          .should("not.be.checked")
          .click();
        cy.get("#room-setting-record").should("not.be.checked").click();
        cy.get("#room-setting-auto_start_recording")
          .should("not.be.checked")
          .click();

        cy.get("#room-setting-lock_settings_disable_cam")
          .should("not.be.checked")
          .click();
        cy.get("#room-setting-webcams_only_for_moderator")
          .should("be.checked")
          .click();
        cy.get("#room-setting-lock_settings_disable_mic")
          .should("not.be.checked")
          .click();
        cy.get("#room-setting-lock_settings_disable_public_chat")
          .should("be.checked")
          .click();
        cy.get("#room-setting-lock_settings_disable_private_chat")
          .should("not.be.checked")
          .click();
        cy.get("#room-setting-lock_settings_disable_note")
          .should("be.checked")
          .click();
        cy.get("#room-setting-lock_settings_hide_user_list")
          .should("be.checked")
          .click();

        cy.get("#room-setting-allow_membership")
          .should("not.be.checked")
          .click();
        cy.get('[data-test="room-setting-default_role-button"]')
          .eq(0)
          .should("have.attr", "aria-pressed", "true");
        cy.get('[data-test="room-setting-default_role-button"]')
          .eq(1)
          .should("have.attr", "aria-pressed", "false")
          .click();

        cy.get('[data-test="room-setting-visibility-button"]')
          .eq(1)
          .should("have.attr", "aria-pressed", "true");
        cy.get('[data-test="room-setting-visibility-button"]')
          .eq(0)
          .should("have.attr", "aria-pressed", "false")
          .click();

        // Save settings
        cy.fixture("roomTypesWithSettings.json").then((roomTypes) => {
          cy.fixture("roomSettings.json").then((roomSettings) => {
            roomSettings.data.name = "Meeting Two";
            roomSettings.data.access_code = newAccessCodeValue;
            roomSettings.data.allow_guests = false;
            roomSettings.data.short_description = "Short description two";
            roomSettings.data.everyone_can_start = true;
            roomSettings.data.mute_on_start = false;
            roomSettings.data.record_attendance = true;
            roomSettings.data.record = true;
            roomSettings.data.auto_start_recording = true;
            roomSettings.data.lobby = 0;
            roomSettings.data.lock_settings_disable_cam = true;
            roomSettings.data.webcams_only_for_moderator = false;
            roomSettings.data.lock_settings_disable_mic = true;
            roomSettings.data.lock_settings_disable_public_chat = false;
            roomSettings.data.lock_settings_disable_private_chat = true;
            roomSettings.data.lock_settings_disable_note = false;
            roomSettings.data.lock_settings_hide_user_list = false;
            roomSettings.data.allow_membership = true;
            roomSettings.data.default_role = 2;
            roomSettings.data.visibility = 0;
            roomSettings.data.room_type = roomTypes.data[0];

            const saveRoomSettingsRequest = interceptIndefinitely(
              "PUT",
              "api/v1/rooms/abc-def-123",
              {
                statusCode: 200,
                body: roomSettings,
              },
              "roomSettingsSaveRequest",
            );

            // Save settings by clicking on the save button inside the settings changed message
            cy.scrollTo("top");
            cy.get('[data-test="room-unsaved-changes-message"]')
              .should("be.visible")
              .find('[data-test="room-unsaved-changes-save-button"]')
              .should("be.visible")
              .click({ scrollBehavior: false });

            // Check loading
            cy.get('[data-test="overlay"]').should("be.visible");
            // Check that overlay is shown
            cy.get('[data-test="overlay"]').should("be.visible");

            // Check that buttons are disabled
            cy.scrollTo("top");
            cy.get('[data-test="room-unsaved-changes-save-button"]').should(
              "be.disabled",
            );
            cy.get('[data-test="room-delete-button"]').should("be.disabled");
            cy.get('[data-test="room-transfer-ownership-button"]').should(
              "be.disabled",
            );
            cy.get('[data-test="room-settings-expert-mode-button"]').should(
              "be.disabled",
            );
            cy.get('[data-test="room-settings-save-button"]')
              .should("be.disabled")
              .then(() => {
                saveRoomSettingsRequest.sendResponse();
              });

            cy.wait("@roomSettingsSaveRequest").then((interception) => {
              expect(interception.request.body).to.eql({
                name: "Meeting Two",
                expert_mode: true,
                access_code: parseInt(newAccessCodeValue),
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
            });
          });
        });

        // Check that overlay is hidden
        cy.get('[data-test="overlay"]').should("not.exist");

        // Check that settings changed message is hidden
        cy.get('[data-test="room-unsaved-changes-message"]').should(
          "not.exist",
        );

        // Check that buttons are enabled
        cy.get('[data-test="room-delete-button"]').should("not.be.disabled");
        cy.get('[data-test="room-transfer-ownership-button"]').should(
          "not.be.disabled",
        );
        cy.get('[data-test="room-settings-expert-mode-button"]').should(
          "not.be.disabled",
        );
        cy.get('[data-test="room-settings-save-button"]').should(
          "not.be.disabled",
        );

        // Check that settings are shown correctly
        cy.get("#room-setting-name").should("have.value", "Meeting Two");
        cy.get("#room-setting-access_code").should(
          "have.value",
          newAccessCodeValue,
        );
        cy.get("#room-setting-allow_guests").should("not.be.checked");
        cy.get("#room-setting-short_description").should(
          "have.value",
          "Short description two",
        );

        cy.get("#room-setting-everyone_can_start").should("be.checked");
        cy.get("#room-setting-mute_on_start").should("not.be.checked");
        cy.get("#room-setting-lobby-0").should("be.checked");
        cy.get("#room-setting-welcome").should("have.value", "Welcome message");

        cy.get("#room-setting-record_attendance").should("be.checked");
        cy.get("#room-setting-record").should("be.checked");
        cy.get("#room-setting-auto_start_recording").should("be.checked");

        cy.get("#room-setting-lock_settings_disable_cam").should("be.checked");
        cy.get("#room-setting-webcams_only_for_moderator").should(
          "not.be.checked",
        );
        cy.get("#room-setting-lock_settings_disable_mic").should("be.checked");
        cy.get("#room-setting-lock_settings_disable_public_chat").should(
          "not.be.checked",
        );
        cy.get("#room-setting-lock_settings_disable_private_chat").should(
          "be.checked",
        );
        cy.get("#room-setting-lock_settings_disable_note").should(
          "not.be.checked",
        );
        cy.get("#room-setting-lock_settings_hide_user_list").should(
          "not.be.checked",
        );

        cy.get("#room-setting-allow_membership").should("be.checked");
        cy.get('[data-test="room-setting-default_role-button"]')
          .eq(1)
          .should("have.attr", "aria-pressed", "true");

        cy.get('[data-test="room-setting-visibility-button"]')
          .eq(0)
          .should("have.attr", "aria-pressed", "true");
      });

    // Deactivate expert mode and change settings again
    cy.get('[data-test="room-settings-expert-mode-button"]').click();
    cy.get('[data-test="room-settings-expert-mode-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.get("#room-setting-name").clear();
    cy.get("#room-setting-name").type("Meeting Three");

    // Check that settings changed message is shown but button
    // is hidden because normal save button is visible without scrolling
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("not.exist");

    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get("#room-setting-access_code").should("have.value", "");
    cy.get("#room-setting-allow_guests").click();
    cy.get("#room-setting-short_description").clear();

    // Save settings
    cy.fixture("roomTypesWithSettings.json").then(() => {
      cy.fixture("roomSettings.json").then((roomSettings) => {
        roomSettings.data.name = "Meeting Three";
        roomSettings.data.expert_mode = false;
        roomSettings.data.welcome = "";
        roomSettings.data.access_code = null;
        roomSettings.data.allow_guests = true;
        roomSettings.data.short_description = null;

        cy.intercept("PUT", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: roomSettings,
        }).as("roomSettingsSaveRequest");

        cy.get('[data-test="room-settings-save-button"]').click();
      });
    });

    cy.wait("@roomSettingsSaveRequest").then((interception) => {
      expect(interception.request.body).to.eql({
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
    });

    // Check that settings are shown correctly
    cy.get("#room-setting-name").should("have.value", "Meeting Three");
    cy.get("#room-setting-access_code").should("have.value", "");
    cy.get("#room-setting-allow_guests").should("be.checked");

    cy.get('[data-test="room-settings-expert-mode-button"]').should(
      "have.text",
      "rooms.settings.expert_mode.activate",
    );
  });

  it("change settings errors", function () {
    cy.fixture("roomTypesWithSettings.json").then((roomTypes) => {
      cy.fixture("roomSettings.json").then((roomSettings) => {
        roomSettings.data.room_type = roomTypes.data[0];
        roomSettings.data.room_type.has_access_code_enforced = true;
        roomSettings.data.access_code = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
          statusCode: 200,
          body: roomSettings,
        }).as("roomSettingsRequest");
      });
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    // Check that access code setting is shown correctly
    cy.get('[data-test="room-setting-access_code"]')
      .should("be.visible")
      .and("include.text", "rooms.access_code")
      .and("include.text", "rooms.settings.general.access_code_enforced")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]');
        cy.get("#room-setting-access_code").should("have.value", "");
      });

    // Save settings and respond with 422 errors
    cy.intercept("PUT", "api/v1/rooms/abc-def-123", {
      statusCode: 422,
      body: {
        errors: {
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
          lock_settings_hide_user_list: [
            "The Hide user list field is required.",
          ],
          allow_membership: ["The Allow membership field is required."],
          default_role: ["The Default role field is required."],
          visibility: ["The Visibility field is required."],
        },
      },
    }).as("roomSettingsSaveRequest");

    cy.get('[data-test="room-settings-save-button"]').click();

    // Check that error messages are set
    cy.get('[data-test="room-setting-access_code"]').should(
      "include.text",
      "The room requires an access code because of its room type.",
    );
    cy.get('[data-test="room-setting-everyone_can_start"]').should(
      "include.text",
      "The Everyone can start field is required.",
    );
    cy.get('[data-test="room-setting-mute_on_start"]').should(
      "include.text",
      "The Mute on start field is required.",
    );
    cy.get('[data-test="room-setting-lobby"]').should(
      "include.text",
      "The Lobby field is required.",
    );
    cy.get('[data-test="room-setting-welcome"]').should(
      "include.text",
      "The Welcome message may not be greater than 250 characters.",
    );
    cy.get('[data-test="room-setting-record_attendance"]').should(
      "include.text",
      "The Record attendance field is required.",
    );
    cy.get('[data-test="room-setting-record"]').should(
      "include.text",
      "The Record field is required.",
    );
    cy.get('[data-test="room-setting-auto_start_recording"]').should(
      "include.text",
      "The Auto start recording field is required.",
    );
    cy.get('[data-test="room-setting-lock_settings_disable_cam"]').should(
      "include.text",
      "The Disable cam field is required.",
    );
    cy.get('[data-test="room-setting-webcams_only_for_moderator"]').should(
      "include.text",
      "The Webcams only for moderator field is required.",
    );
    cy.get('[data-test="room-setting-lock_settings_disable_mic"]').should(
      "include.text",
      "The Disable mic field is required.",
    );
    cy.get(
      '[data-test="room-setting-lock_settings_disable_public_chat"]',
    ).should("include.text", "The Disable public chat field is required.");
    cy.get(
      '[data-test="room-setting-lock_settings_disable_private_chat"]',
    ).should("include.text", "The Disable private chat field is required.");
    cy.get('[data-test="room-setting-lock_settings_disable_note"]').should(
      "include.text",
      "The Disable note field is required.",
    );
    cy.get('[data-test="room-setting-lock_settings_hide_user_list"]').should(
      "include.text",
      "The Hide user list field is required.",
    );
    cy.get('[data-test="room-setting-allow_membership"]').should(
      "include.text",
      "The Allow membership field is required.",
    );
    cy.get('[data-test="room-setting-default_role"]').should(
      "include.text",
      "The Default role field is required.",
    );
    cy.get('[data-test="room-setting-visibility"]').should(
      "include.text",
      "The Visibility field is required.",
    );

    // Generate new access code
    cy.get('[data-test="generate-access-code-button"]').click();

    // Save settings without error
    cy.fixture("roomTypesWithSettings.json").then((roomTypes) => {
      cy.fixture("roomSettings.json").then((roomSettings) => {
        roomSettings.data.welcome = "";
        roomSettings.data.room_type = roomTypes.data[0];
        roomSettings.data.room_type.has_access_code_enforced = true;
        roomSettings.data.room_type.has_access_code_default = false;

        cy.intercept("PUT", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: roomSettings,
        }).as("roomSettingsSaveRequest");

        cy.get('[data-test="room-settings-save-button"]').click();
      });
    });

    cy.wait("@roomSettingsSaveRequest");

    // Check that access code is shown correctly
    cy.get('[data-test="room-setting-access_code"]')
      .should("be.visible")
      .and("include.text", "rooms.access_code")
      .and("include.text", "rooms.settings.general.access_code_prohibited")
      .and(
        "not.include.text",
        "The room requires an access code because of its room type.",
      )
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]');
        cy.get("#room-setting-access_code").should("have.value", "123456789");
      });

    // Check that 422 error messages are hidden
    cy.get('[data-test="room-setting-everyone_can_start"]').should(
      "not.include.text",
      "The Everyone can start field is required.",
    );
    cy.get('[data-test="room-setting-mute_on_start"]').should(
      "not.include.text",
      "The Mute on start field is required.",
    );
    cy.get('[data-test="room-setting-lobby"]').should(
      "not.include.text",
      "The Lobby field is required.",
    );
    cy.get('[data-test="room-setting-welcome"]').should(
      "not.include.text",
      "The Welcome message may not be greater than 250 characters.",
    );
    cy.get('[data-test="room-setting-record_attendance"]').should(
      "not.include.text",
      "The Record attendance field is required.",
    );
    cy.get('[data-test="room-setting-record"]').should(
      "not.include.text",
      "The Record field is required.",
    );
    cy.get('[data-test="room-setting-auto_start_recording"]').should(
      "not.include.text",
      "The Auto start recording field is required.",
    );
    cy.get('[data-test="room-setting-lock_settings_disable_cam"]').should(
      "not.include.text",
      "The Disable cam field is required.",
    );
    cy.get('[data-test="room-setting-webcams_only_for_moderator"]').should(
      "not.include.text",
      "The Webcams only for moderator field is required.",
    );
    cy.get('[data-test="room-setting-lock_settings_disable_mic"]').should(
      "not.include.text",
      "The Disable mic field is required.",
    );
    cy.get(
      '[data-test="room-setting-lock_settings_disable_public_chat"]',
    ).should("not.include.text", "The Disable public chat field is required.");
    cy.get(
      '[data-test="room-setting-lock_settings_disable_private_chat"]',
    ).should("not.include.text", "The Disable private chat field is required.");
    cy.get('[data-test="room-setting-lock_settings_disable_note"]').should(
      "not.include.text",
      "The Disable note field is required.",
    );
    cy.get('[data-test="room-setting-lock_settings_hide_user_list"]').should(
      "not.include.text",
      "The Hide user list field is required.",
    );
    cy.get('[data-test="room-setting-allow_membership"]').should(
      "not.include.text",
      "The Allow membership field is required.",
    );
    cy.get('[data-test="room-setting-default_role"]').should(
      "not.include.text",
      "The Default role field is required.",
    );
    cy.get('[data-test="room-setting-visibility"]').should(
      "not.include.text",
      "The Visibility field is required.",
    );

    // Disable expert mode
    cy.get('[data-test="room-settings-expert-mode-button"]').click();
    cy.get('[data-test="room-settings-expert-mode-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .click();

    // Save settings and respond with 422 errors
    cy.intercept("PUT", "api/v1/rooms/abc-def-123", {
      statusCode: 422,
      body: {
        errors: {
          access_code: [
            "The room requires an access code because of its room type.",
          ],
          room_type: ["The room type is invalid."],
          name: ["The Name may not be greater than 50 characters. "],
          short_description: [
            "The Short description may not be greater than 300 characters.",
          ],
          allow_guests: ["The Allow guests field is required."],
        },
      },
    }).as("roomSettingsSaveRequest");

    cy.get('[data-test="room-settings-save-button"]').click();

    cy.wait("@roomSettingsSaveRequest");

    // Check that error messages are set
    cy.get('[data-test="room-setting-access_code"]').should(
      "include.text",
      "The room requires an access code because of its room type.",
    );
    cy.get('[data-test="room-setting-room_type"]').should(
      "include.text",
      "The room type is invalid.",
    );
    cy.get('[data-test="room-setting-name"]').should(
      "include.text",
      "The Name may not be greater than 50 characters.",
    );
    cy.get('[data-test="room-setting-short_description"]').should(
      "include.text",
      "The Short description may not be greater than 300 characters.",
    );
    cy.get('[data-test="room-setting-allow_guests"]').should(
      "include.text",
      "The Allow guests field is required.",
    );

    // Save settings and respond with 500 error
    cy.intercept("PUT", "api/v1/rooms/abc-def-123", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomSettingsSaveRequest");

    cy.get('[data-test="room-settings-save-button"]').click();

    cy.wait("@roomSettingsSaveRequest");

    // Check that 422 error messages are hidden
    cy.get('[data-test="room-setting-access_code"]').should(
      "not.include.text",
      "The room requires an access code because of its room type.",
    );
    cy.get('[data-test="room-setting-room_type"]').should(
      "not.include.text",
      "The room type is invalid.",
    );
    cy.get('[data-test="room-setting-name"]').should(
      "not.include.text",
      "The Name may not be greater than 50 characters.",
    );
    cy.get('[data-test="room-setting-short_description"]').should(
      "not.include.text",
      "The Short description may not be greater than 300 characters.",
    );
    cy.get('[data-test="room-setting-allow_guests"]').should(
      "not.include.text",
      "The Allow guests field is required.",
    );

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-settings-save-button"]').click();
      },
      "PUT",
      "api/v1/rooms/abc-def-123",
      "settings",
    );
  });

  it("delete room", function () {
    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("[data-test=room-delete-dialog]").should("not.exist");
    cy.get('[data-test="room-delete-button"]')
      .should("have.text", "rooms.modals.delete.title")
      .click();
    cy.get("[data-test=room-delete-dialog]").should("be.visible");

    // Cancel delete of room
    cy.get("[data-test=room-delete-dialog]")
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .click();
    cy.get("[data-test=room-delete-dialog]").should("not.exist");

    // Open dialog again and check that dialog shows correct data
    cy.get('[data-test="room-delete-button"]').click();
    cy.get("[data-test=room-delete-dialog]")
      .should("be.visible")
      .should("include.text", "rooms.modals.delete.title")
      .should(
        "include.text",
        'rooms.modals.delete.confirm_{"name":"Meeting One"}',
      );

    // Confirm delete of room
    const deleteRoomRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/rooms/abc-def-123",
      {
        statusCode: 204,
      },
      "roomDeleteRequest",
    );

    cy.interceptRoomIndexRequests();

    cy.get("[data-test=room-delete-dialog]")
      .find('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();
    cy.get("[data-test=room-delete-dialog]")
      .find('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        deleteRoomRequest.sendResponse();
      });

    cy.wait("@roomDeleteRequest");

    cy.url().should("include", "/rooms").and("not.include", "/abc-def-123");
  });

  it("delete room errors", function () {
    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("[data-test=room-delete-dialog]").should("not.exist");
    cy.get('[data-test="room-delete-button"]')
      .should("have.text", "rooms.modals.delete.title")
      .click();
    cy.get("[data-test=room-delete-dialog]").should("be.visible");

    // Check with 404 error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123", {
      statusCode: 404,
    }).as("roomDeleteRequest");

    cy.get("[data-test=room-delete-dialog]")
      .find('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    cy.wait("@roomDeleteRequest");

    cy.checkToastMessage([
      "app.flash.server_error.empty_message",
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Check that modal stays open
    cy.get("[data-test=room-delete-dialog]").should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomDeleteRequest");

    cy.get("[data-test=room-delete-dialog]")
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.wait("@roomDeleteRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that modal stays open
    cy.get("[data-test=room-delete-dialog]").should("be.visible");

    cy.get("[data-test=dialog-cancel-button]").click();

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-delete-button"]').click();
        cy.get("[data-test=room-delete-dialog]")
          .should("be.visible")
          .find('[data-test="dialog-continue-button"]')
          .click();
      },
      "DELETE",
      "api/v1/rooms/abc-def-123",
      "settings",
    );
  });

  it("transfer ownership", function () {
    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("[data-test=room-transfer-ownership-dialog]").should("not.exist");
    cy.get('[data-test="room-transfer-ownership-button"]')
      .should("have.text", "rooms.modals.transfer_ownership.title")
      .click();

    // Check that dialog is shown correctly and cancel transfer
    cy.get("[data-test=room-transfer-ownership-dialog]")
      .should("be.visible")
      .and("include.text", "rooms.modals.transfer_ownership.title")
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .click();

    cy.get("[data-test=room-transfer-ownership-dialog]").should("not.exist");
    cy.get('[data-test="room-transfer-ownership-button"]').click();

    cy.get("[data-test=room-transfer-ownership-dialog]")
      .should("be.visible")
      .within(() => {
        // Check autofocus
        cy.get(".multiselect__content").should("be.visible");

        // Start typing and respond with too many results
        cy.intercept("GET", "/api/v1/users/search?query=*", {
          statusCode: 204,
        }).as("userSearchRequest");

        // Check prompt
        cy.get('[data-test="new-owner-dropdown"]').should(
          "include.text",
          "rooms.members.modals.add.no_options",
        );

        // Check placeholder and type in input
        cy.get('[data-test="new-owner-dropdown"]')
          .find("input")
          .should("have.attr", "placeholder", "app.user_name")
          .click();

        cy.get('[data-test="new-owner-dropdown"]').find("input").type("L");

        cy.wait("@userSearchRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            query: "L",
          });
        });

        // Check if correct options are shown
        cy.get(".multiselect__content").should("be.visible");
        cy.get(".multiselect__option").should("have.length", 2);
        cy.get(".multiselect__option")
          .eq(0)
          .should("include.text", "rooms.members.modals.add.too_many_results")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(1)
          .should("include.text", "rooms.members.modals.add.no_options")
          .and("not.be.visible");

        cy.intercept("GET", "/api/v1/users/search?query=*", {
          statusCode: 200,
          body: {
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
          },
        }).as("userSearchRequest");

        cy.get('[data-test="new-owner-dropdown"]').find("input").type("aura");

        cy.wait("@userSearchRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            query: "La",
          });
        });
        cy.wait("@userSearchRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            query: "Lau",
          });
        });
        cy.wait("@userSearchRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            query: "Laur",
          });
        });

        cy.wait("@userSearchRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            query: "Laura",
          });
        });

        // Check if correct options are shown
        cy.get(".multiselect__content").should("be.visible");
        cy.get(".multiselect__option").should("have.length", 5);
        cy.get(".multiselect__option")
          .eq(0)
          .should("include.text", "Laura Rivera")
          .and("include.text", "LauraWRivera@domain.tld")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(1)
          .should("include.text", "Laura Walter")
          .and("include.text", "LauraMWalter@domain.tld")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(2)
          .should("include.text", "John Doe")
          .and("include.text", "JohnDoe@domain.tld")
          .and("be.visible")
          .and("have.class", "multiselect__option--disabled");
        cy.get(".multiselect__option")
          .eq(3)
          .should("include.text", "rooms.members.modals.add.no_result")
          .and("not.be.visible");
        cy.get(".multiselect__option")
          .eq(4)
          .should("include.text", "rooms.members.modals.add.no_options")
          .and("not.be.visible");

        // Select new owner
        cy.get(".multiselect__option").eq(1).click();
        cy.get(".multiselect__content").should("not.be.visible");

        // Check that role checkboxes and labels are shown correctly
        cy.get('[data-test="participant-role-group"]').within(() => {
          cy.contains("rooms.roles.participant");
          cy.get("#participant-role").should("not.be.checked");
        });

        cy.get('[data-test="moderator-role-group"]').within(() => {
          cy.contains("rooms.roles.moderator");
          cy.get("#moderator-role").should("not.be.checked");
        });

        cy.get('[data-test="co-owner-role-group"]').within(() => {
          cy.contains("rooms.roles.co_owner");
          cy.get("#co-owner-role").should("be.checked");
        });

        cy.get('[data-test="no-role-group"]').within(() => {
          cy.contains("rooms.roles.no_role");
          cy.get("#no-role").should("not.be.checked");
        });

        // Select new role
        cy.get("#participant-role").click();

        cy.contains("rooms.modals.transfer_ownership.warning");

        // Transfer ownership with role selected
        const transferOwnershipRequest = interceptIndefinitely(
          "POST",
          "api/v1/rooms/abc-def-123/transfer",
          {
            statusCode: 204,
          },
          "transferOwnershipRequest",
        );

        cy.interceptRoomFilesRequest();

        cy.fixture("room.json").then((room) => {
          room.data.owner = { id: 10, name: "Laura Walter" };
          room.data.is_member = true;

          cy.intercept("GET", "api/v1/rooms/abc-def-123", {
            statusCode: 200,
            body: room,
          }).as("roomRequest");
        });

        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="new-owner-dropdown"]')
          .find("input")
          .should("be.disabled");

        cy.get("#participant-role").should("be.disabled");
        cy.get("#moderator-role").should("be.disabled");
        cy.get("#co-owner-role").should("be.disabled");
        cy.get("#no-role").should("be.disabled");

        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            transferOwnershipRequest.sendResponse();
          });
      });

    cy.wait("@transferOwnershipRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        user: 10,
        role: 1,
      });
    });

    cy.wait("@roomRequest");

    cy.contains("Laura Walter").should("be.visible");

    cy.wait("@roomFilesRequest");

    cy.url().should("not.include", "#tab=settings");
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Reload page with user as owner
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.reload();

    cy.wait("@roomRequest");

    cy.get("#tab-settings").click();

    // Transfer ownership with no role selected
    cy.get('[data-test="room-transfer-ownership-button"]').click();

    cy.get("[data-test=room-transfer-ownership-dialog]").should("be.visible");

    cy.get('[data-test="new-owner-dropdown"]').click();
    cy.get('[data-test="new-owner-dropdown"]').find("input").type("L");

    cy.wait("@userSearchRequest");

    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Laura Rivera")
      .and("include.text", "LauraWRivera@domain.tld")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Laura Walter")
      .and("include.text", "LauraMWalter@domain.tld")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "John Doe")
      .and("include.text", "JohnDoe@domain.tld")
      .and("be.visible")
      .and("have.class", "multiselect__option--disabled");
    cy.get(".multiselect__option")
      .eq(3)
      .should("include.text", "rooms.members.modals.add.no_result")
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "rooms.members.modals.add.no_options")
      .and("not.be.visible");

    // Select new owner
    cy.get(".multiselect__option").eq(1).click();
    cy.get(".multiselect__content").should("not.be.visible");

    cy.get("#no-role").click();

    // Transfer ownership with no role selected
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 10, name: "Laura Walter" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@transferOwnershipRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        user: 10,
      });
    });

    cy.wait("@roomRequest");

    cy.contains("Laura Walter").should("be.visible");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
  });

  it("transfer ownership errors", function () {
    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get('[data-test="room-transfer-ownership-button"]').click();

    cy.get("[data-test=room-transfer-ownership-dialog]").should("be.visible");

    // Test 500 error on user search
    cy.intercept("GET", "/api/v1/users/search?query=*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("userSearchRequest");

    cy.get('[data-test="new-owner-dropdown"]').click();
    cy.get('[data-test="new-owner-dropdown"]').find("input").type("L");

    cy.wait("@userSearchRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dialog is still open
    cy.get("[data-test=room-transfer-ownership-dialog]").should("be.visible");

    cy.get('[data-test="dialog-cancel-button"]').click();

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-transfer-ownership-button"]').click();
        cy.get('[data-test="room-transfer-ownership-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="new-owner-dropdown"]').click();
        cy.get('[data-test="new-owner-dropdown"]').find("input").type("L");
      },
      "GET",
      "/api/v1/users/search?query=*",
      "settings",
    );

    // Reload page to check other errors
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.reload();
    cy.get("#tab-settings").click();

    cy.wait("@roomRequest");

    cy.get('[data-test="room-transfer-ownership-button"]').click();

    cy.get("[data-test=room-transfer-ownership-dialog]").should("be.visible");

    cy.intercept("GET", "/api/v1/users/search?query=*", {
      statusCode: 200,
      body: {
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
        ],
      },
    }).as("userSearchRequest");

    cy.get('[data-test="new-owner-dropdown"]').click();
    cy.get('[data-test="new-owner-dropdown"]').find("input").type("L");

    cy.wait("@userSearchRequest");

    // Select new owner
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(1).click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Transfer ownership with 422 error (role missing)
    cy.intercept("POST", "api/v1/rooms/abc-def-123/transfer", {
      statusCode: 422,
      body: {
        errors: {
          role: ["The selected role is invalid."],
        },
      },
    }).as("transferOwnershipRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@transferOwnershipRequest");

    // Check that error message is shown
    cy.get('[data-test="room-transfer-ownership-dialog"]')
      .should("be.visible")
      .and("include.text", "The selected role is invalid.");

    // Select other role
    cy.get("#moderator-role").click();

    // Transfer ownership with 422 error (user can not own rooms)
    cy.intercept("POST", "api/v1/rooms/abc-def-123/transfer", {
      statusCode: 422,
      body: {
        errors: {
          user: ["The selected user can not own rooms."],
        },
      },
    }).as("transferOwnershipRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@transferOwnershipRequest");

    // Check that error message is shown
    cy.get('[data-test="room-transfer-ownership-dialog"]')
      .should("be.visible")
      .and("include.text", "The selected user can not own rooms.")
      .and("not.include.text", "The selected role is invalid.");

    // Transfer ownership with 500 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/transfer", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("transferOwnershipRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@transferOwnershipRequest");

    // Check that dialog stays open and 422 error message is hidden
    cy.get('[data-test="room-transfer-ownership-dialog"]')
      .should("be.visible")
      .and("not.include.text", "The selected user can not own rooms.");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-transfer-ownership-button"]').click();
        cy.get('[data-test="room-transfer-ownership-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="dialog-continue-button"]').click();
      },
      "POST",
      "api/v1/rooms/abc-def-123/transfer",
      "settings",
    );
  });
});
