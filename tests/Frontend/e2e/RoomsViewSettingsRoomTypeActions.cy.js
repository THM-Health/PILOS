import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view settings room type actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomSettingsRequest();
  });

  it("change room type with expert mode enabled", function () {
    cy.intercept("GET", "api/v1/roomTypes*", {
      fixture: "roomTypesWithSettings.json",
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get('[data-test="room-unsaved-changes-message"]').should("not.exist");
    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        // Check that the room types are shown correctly
        cy.get('[data-test="room-type-select-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="room-type-select-option"]')
          .eq(0)
          .should("have.text", "Lecture");
        cy.get('[data-test="room-type-select-option"]')
          .eq(1)
          .should("have.text", "Meeting");
        cy.get('[data-test="room-type-select-option"]')
          .eq(2)
          .should("have.text", "Exam");
        cy.get('[data-test="room-type-select-option"]')
          .eq(3)
          .should("have.text", "Seminar");

        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            cy.contains("admin.room_types.missing_description").should(
              "be.visible",
            );
            // Check that default room settings are hidden
            cy.contains("rooms.settings.general.title").should(
              "not.be.visible",
            );

            // Open default settings
            cy.get('[data-test="show-default-settings-button"]')
              .should(
                "have.text",
                "admin.room_types.default_room_settings.title",
              )
              .click();
            // Check that default room settings are shown correctly
            cy.checkDefaultRoomSettingField(
              "has_access_code",
              true,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField("allow_guests", true, true, false);
            cy.checkDefaultRoomSettingField(
              "everyone_can_start",
              false,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField("mute_on_start", true, true, false);
            cy.checkDefaultRoomSettingField(
              "lobby",
              "rooms.settings.video_conference.lobby.only_for_guests_enabled",
              true,
              true,
            );
            cy.checkDefaultRoomSettingField(
              "record_attendance",
              false,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField("record", false, false, false);
            cy.checkDefaultRoomSettingField(
              "auto_start_recording",
              false,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "lock_settings_disable_cam",
              false,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "webcams_only_for_moderator",
              true,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "lock_settings_disable_mic",
              false,
              true,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "lock_settings_disable_public_chat",
              true,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "lock_settings_disable_private_chat",
              false,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "lock_settings_disable_note",
              true,
              true,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "lock_settings_hide_user_list",
              true,
              false,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "allow_membership",
              false,
              true,
              false,
            );
            cy.checkDefaultRoomSettingField(
              "default_role",
              "rooms.roles.participant",
              false,
              true,
            );
            cy.checkDefaultRoomSettingField(
              "visibility",
              "rooms.settings.advanced.visibility.public",
              false,
              true,
            );
          });

        // Change room type
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();
      });

    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");

    // Check that settings did not change
    cy.get('[data-test="room-unsaved-changes-message"]').should("not.exist");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get("#room-setting-allow_guests")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );
    cy.get("#room-setting-everyone_can_start")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-mute_on_start")
      .should("be.disabled")
      .and("be.checked");

    cy.get("#room-setting-lobby-0").should("be.disabled").and("not.be.checked");
    cy.get("#room-setting-lobby-1").should("be.disabled").and("not.be.checked");
    cy.get("#room-setting-lobby-2").should("be.disabled").and("be.checked");

    cy.get("#room-setting-welcome").should("have.value", "Welcome message");
    cy.get("#room-setting-record_attendance")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-record")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-auto_start_recording")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-allow_membership")
      .should("be.disabled")
      .and("not.be.checked");

    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    // Change to another room type and reset default settings
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");
    cy.get('[data-test="room-type-select-option"]').eq(2).click();

    // Check that default settings are shown correctly
    cy.get('[data-test="room-type-details"]').should(
      "include.text",
      "Room type description for room type Exam",
    );
    cy.get('[data-test="show-default-settings-button"]')
      .should("have.text", "admin.room_types.default_room_settings.title")
      .click();

    // Check that default room settings are shown correctly
    cy.checkDefaultRoomSettingField("has_access_code", false, false, false);
    cy.checkDefaultRoomSettingField("allow_guests", false, false, false);
    cy.checkDefaultRoomSettingField("everyone_can_start", true, false, false);
    cy.checkDefaultRoomSettingField("mute_on_start", false, false, false);
    cy.checkDefaultRoomSettingField("lobby", "app.enabled", false, true);
    cy.checkDefaultRoomSettingField("record_attendance", true, false, false);
    cy.checkDefaultRoomSettingField("record", true, false, false);
    cy.checkDefaultRoomSettingField("auto_start_recording", true, false, false);
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_cam",
      true,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "webcams_only_for_moderator",
      false,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_mic",
      true,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_public_chat",
      false,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_private_chat",
      true,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_note",
      false,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_hide_user_list",
      false,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField("allow_membership", true, false, false);
    cy.checkDefaultRoomSettingField(
      "default_role",
      "rooms.roles.moderator",
      false,
      true,
    );
    cy.checkDefaultRoomSettingField(
      "visibility",
      "rooms.settings.advanced.visibility.private",
      false,
      true,
    );

    // Change room type
    cy.get('[data-test="room-type-change-confirmation-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    // Check that comparison is shown correctly
    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        cy.contains("rooms.settings.general.title").should("be.visible");

        cy.get('[data-test="room-type-has_access_code-comparison"]').should(
          "include.text",
          "rooms.settings.general.has_access_code",
        );
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );

        cy.get('[data-test="room-type-allow_guests-comparison"]').should(
          "include.text",
          "rooms.settings.general.allow_guests",
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          true,
          true,
          false,
          false,
        );

        // Check that other settings exist and are shown correctly
        cy.contains("rooms.settings.video_conference.title");

        cy.get('[data-test="room-type-everyone_can_start-comparison"]').should(
          "include.text",
          "rooms.settings.video_conference.everyone_can_start",
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          false,
          false,
          false,
          false,
          false,
        );

        cy.get('[data-test="room-type-mute_on_start-comparison"]').should(
          "include.text",
          "rooms.settings.video_conference.mute_on_start",
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          true,
          true,
          true,
          false,
          false,
        );

        cy.get('[data-test="room-type-lobby-comparison"]').should(
          "include.text",
          "rooms.settings.video_conference.lobby.title",
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          false,
          true,
        );

        cy.contains("rooms.settings.recordings.title");

        cy.get('[data-test="room-type-record_attendance-comparison"]').should(
          "include.text",
          "rooms.settings.recordings.record_attendance",
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          false,
          false,
          false,
          false,
          false,
        );

        cy.get('[data-test="room-type-record-comparison"]').should(
          "include.text",
          "rooms.settings.recordings.record_video_conference",
        );
        cy.checkCompareRoomSettingField(
          "record",
          false,
          false,
          false,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-auto_start_recording-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.recordings.auto_start_recording",
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          false,
          false,
          false,
          false,
          false,
        );

        cy.contains("rooms.settings.restrictions.title");

        cy.get(
          '[data-test="room-type-lock_settings_disable_cam-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.lock_settings_disable_cam",
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          false,
          false,
          false,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-webcams_only_for_moderator-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.webcams_only_for_moderator",
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          true,
          false,
          true,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-lock_settings_disable_mic-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.lock_settings_disable_mic",
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          false,
          true,
          false,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-lock_settings_disable_public_chat-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.lock_settings_disable_public_chat",
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          true,
          false,
          true,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-lock_settings_disable_private_chat-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.lock_settings_disable_private_chat",
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          false,
          false,
          false,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-lock_settings_disable_note-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.lock_settings_disable_note",
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          true,
          true,
          true,
          false,
          false,
        );

        cy.get(
          '[data-test="room-type-lock_settings_hide_user_list-comparison"]',
        ).should(
          "include.text",
          "rooms.settings.restrictions.lock_settings_hide_user_list",
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          true,
          false,
          true,
          false,
          false,
        );

        cy.contains("rooms.settings.participants.title");

        cy.get('[data-test="room-type-allow_membership-comparison"]').should(
          "include.text",
          "rooms.settings.participants.allow_membership",
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          false,
          true,
          false,
          false,
          false,
        );

        cy.get('[data-test="room-type-default_role-comparison"]').should(
          "include.text",
          "rooms.settings.participants.default_role.title",
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.participant",
          false,
          true,
        );

        cy.contains("rooms.settings.advanced.title");

        cy.get('[data-test="room-type-visibility-comparison"]').should(
          "include.text",
          "rooms.settings.advanced.visibility.title",
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.public",
          false,
          true,
        );

        // Check reset to defaults
        cy.get("#reset-to-defaults").click();

        // Check that fields were updated
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "app.enabled",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          false,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          false,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.moderator",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        );

        // Save changes
        cy.get('[data-test="confirmation-dialog-save-button"]').click();
      });

    // Check that settings were updated and settings changed message is shown
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.unsaved_changes")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("be.visible")
      .and("have.text", "app.save");

    cy.get("#room-setting-room_type").should("have.value", "Exam");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get("#room-setting-allow_guests")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );
    cy.get("#room-setting-everyone_can_start")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-mute_on_start")
      .should("not.be.disabled")
      .and("not.be.checked");

    cy.get('[data-test="room-setting-lobby"]').should(
      "include.text",
      "rooms.settings.video_conference.lobby.alert",
    );
    cy.get("#room-setting-lobby-0")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lobby-1").should("not.be.disabled").and("be.checked");
    cy.get("#room-setting-lobby-2")
      .should("not.be.disabled")
      .and("not.be.checked");

    cy.get("#room-setting-welcome").should("have.value", "Welcome message");
    cy.get("#room-setting-record_attendance")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-record").should("not.be.disabled").and("be.checked");
    cy.get("#room-setting-auto_start_recording")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-allow_membership")
      .should("not.be.disabled")
      .and("be.checked");

    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    // Open dialog and cancel changing the room type
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");

    cy.get('[data-test="room-type-change-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .click();

    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");

    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");

    cy.get('[data-test="room-type-select-option"]').eq(1).click();

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    // Cancel confirming the room type
    cy.get('[data-test="room-type-change-confirmation-dialog"]').should(
      "be.visible",
    );
    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .find('[data-test="confirmation-dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .click();

    cy.get('[data-test="room-type-change-confirmation-dialog"]').should(
      "not.exist",
    );

    // Change room type back without resetting to defaults
    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    // Check that comparison is shown correctly
    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          false,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          false,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "app.enabled",
          false,
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          true,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          false,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          true,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.moderator",
          false,
          "rooms.roles.moderator",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.private",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        );

        // Save changes
        cy.get('[data-test="confirmation-dialog-save-button"]').click();
      });

    // Check that settings were updated and settings changed message is shown
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.unsaved_changes")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("be.visible")
      .and("have.text", "app.save");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get("#room-setting-allow_guests")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );
    cy.get("#room-setting-everyone_can_start")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-mute_on_start")
      .should("be.disabled")
      .and("be.checked");

    cy.get('[data-test="room-setting-lobby"]').should(
      "not.include.text",
      "rooms.settings.video_conference.lobby.alert",
    );
    cy.get("#room-setting-lobby-0").should("be.disabled").and("not.be.checked");
    cy.get("#room-setting-lobby-1").should("be.disabled").and("not.be.checked");
    cy.get("#room-setting-lobby-2").should("be.disabled").and("be.checked");

    cy.get("#room-setting-welcome").should("have.value", "Welcome message");
    cy.get("#room-setting-record_attendance")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-record").should("not.be.disabled").and("be.checked");
    cy.get("#room-setting-auto_start_recording")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-allow_membership")
      .should("be.disabled")
      .and("not.be.checked");

    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "false")
      .and("not.be.disabled");

    // Change room type again
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");
    cy.get('[data-test="room-type-select-option"]').eq(3).click();

    // Check that default settings are shown correctly
    cy.get('[data-test="show-default-settings-button"]').click();

    // Check that default room settings are shown correctly
    cy.checkDefaultRoomSettingField("has_access_code", false, true, false);
    cy.checkDefaultRoomSettingField("allow_guests", false, true, false);
    cy.checkDefaultRoomSettingField("everyone_can_start", true, true, false);
    cy.checkDefaultRoomSettingField("mute_on_start", false, false, false);
    cy.checkDefaultRoomSettingField("lobby", "app.enabled", false, true);
    cy.checkDefaultRoomSettingField("record_attendance", true, true, false);
    cy.checkDefaultRoomSettingField("record", true, true, false);
    cy.checkDefaultRoomSettingField("auto_start_recording", true, true, false);
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_cam",
      true,
      true,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "webcams_only_for_moderator",
      false,
      true,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_mic",
      true,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_public_chat",
      false,
      true,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_private_chat",
      true,
      true,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_disable_note",
      false,
      false,
      false,
    );
    cy.checkDefaultRoomSettingField(
      "lock_settings_hide_user_list",
      false,
      true,
      false,
    );
    cy.checkDefaultRoomSettingField("allow_membership", true, false, false);
    cy.checkDefaultRoomSettingField(
      "default_role",
      "rooms.roles.moderator",
      true,
      true,
    );
    cy.checkDefaultRoomSettingField(
      "visibility",
      "rooms.settings.advanced.visibility.private",
      true,
      true,
    );

    // Change room type
    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    // Check that comparison is shown correctly
    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          true,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          true,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          false,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          false,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          false,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          true,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          false,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          false,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.moderator",
          false,
          "rooms.roles.moderator",
          true,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.private",
          false,
          "rooms.settings.advanced.visibility.private",
          true,
          true,
        );

        // Save changes
        cy.get('[data-test="confirmation-dialog-save-button"]').click();
      });

    // Check that settings were updated and settings changed message is shown
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.unsaved_changes")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("be.visible")
      .and("have.text", "app.save");

    cy.get("#room-setting-room_type").should("have.value", "Seminar");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get('[data-test="room-setting-access_code"]')
      .should("include.text", "rooms.settings.general.access_code_prohibited")
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]');
      });
    cy.get("#room-setting-allow_guests")
      .should("be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );
    cy.get("#room-setting-everyone_can_start")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-mute_on_start")
      .should("not.be.disabled")
      .and("be.checked");

    cy.get('[data-test="room-setting-lobby"]').should(
      "not.include.text",
      "rooms.settings.video_conference.lobby.alert",
    );
    cy.get("#room-setting-lobby-0")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lobby-1")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lobby-2").should("not.be.disabled").and("be.checked");

    cy.get("#room-setting-welcome").should("have.value", "Welcome message");
    cy.get("#room-setting-record_attendance")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-record").should("be.disabled").and("be.checked");
    cy.get("#room-setting-auto_start_recording")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_cam")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-webcams_only_for_moderator")
      .should("be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_mic")
      .should("not.be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_public_chat")
      .should("be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-lock_settings_disable_private_chat")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_disable_note")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-lock_settings_hide_user_list")
      .should("be.disabled")
      .and("not.be.checked");
    cy.get("#room-setting-allow_membership")
      .should("not.be.disabled")
      .and("not.be.checked");

    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "false")
      .and("be.disabled");
    cy.get('[data-test="room-setting-default_role-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true")
      .and("be.disabled");

    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true")
      .and("be.disabled");
    cy.get('[data-test="room-setting-visibility-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "false")
      .and("be.disabled");
  });

  it("change room type with features enabled", function () {
    // Enable streaming
    cy.fixture("config.json").then((config) => {
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("roomTypesWithSettings.json").then((config) => {
      config.data[0].features.streaming.enabled = true;

      cy.intercept("GET", "api/v1/roomTypes*", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is shown
            cy.get('[data-test="room-type-features"]')
              .should("be.visible")
              .should("contain.text", "rooms.room_types.features.title");

            // Check that the streaming state of the room type is shown correctly
            cy.get('[data-test="room-type-feature-streaming"]').should(
              "have.class",
              "p-tag-secondary",
            );
          });

        // Select other room type
        cy.get('[data-test="room-type-select-option"]').eq(0).click();
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is shown
            cy.get('[data-test="room-type-features"]')
              .should("be.visible")
              .should("contain.text", "rooms.room_types.features.title");

            // Check that the streaming state of the room type is shown correctly
            cy.get('[data-test="room-type-feature-streaming"]').should(
              "have.class",
              "p-tag-success",
            );
          });
      });

    // Reload with current room type features enabled
    cy.fixture("roomTypesWithSettings.json").then((config) => {
      config.data[1].features.streaming.enabled = true;

      cy.intercept("GET", "api/v1/roomTypes*", {
        statusCode: 200,
        body: config,
      });
    });
    cy.fixture("roomSettings.json").then((settings) => {
      settings.data.room_type.features.streaming.enabled = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
        statusCode: 200,
        body: settings,
      }).as("roomSettingsRequest");
    });
    cy.reload();
    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        // Check that the room types are shown correctly
        cy.get('[data-test="room-type-select-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="room-type-select-option"]')
          .eq(0)
          .should("have.text", "Lecture");
        cy.get('[data-test="room-type-select-option"]')
          .eq(1)
          .should("have.text", "Meeting");
        cy.get('[data-test="room-type-select-option"]')
          .eq(2)
          .should("have.text", "Exam");
        cy.get('[data-test="room-type-select-option"]')
          .eq(3)
          .should("have.text", "Seminar");

        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is shown
            cy.get('[data-test="room-type-features"]')
              .should("be.visible")
              .should("contain.text", "rooms.room_types.features.title");

            // Check that the streaming state of the room type is shown correctly
            cy.get('[data-test="room-type-feature-streaming"]').should(
              "have.class",
              "p-tag-success",
            );
          });

        // Select other room type
        cy.get('[data-test="room-type-select-option"]').eq(0).click();
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is shown
            cy.get('[data-test="room-type-features"]')
              .should("be.visible")
              .should("contain.text", "rooms.room_types.features.title");

            // Check that the streaming state of the room type is shown correctly
            cy.get('[data-test="room-type-feature-streaming"]').should(
              "have.class",
              "p-tag-secondary",
            );
          });
      });
  });

  it("change room type with features disabled", function () {
    // Disable streaming
    cy.fixture("config.json").then((config) => {
      config.data.streaming.enabled = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("roomTypesWithSettings.json").then((config) => {
      config.data[0].features.streaming.enabled = true;

      cy.intercept("GET", "api/v1/roomTypes*", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is hidden
            cy.get('[data-test="room-type-features"]').should("not.exist");
          });

        // Select other room type
        cy.get('[data-test="room-type-select-option"]').eq(0).click();
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is hidden
            cy.get('[data-test="room-type-features"]').should("not.exist");
          });
      });
  });

  it("change room type with features disabled and show disabled features", function () {
    // Disable streaming, show disabled features
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("roomSettings.json").then((settings) => {
      settings.data.room_type.features.streaming.enabled = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
        statusCode: 200,
        body: settings,
      }).as("roomSettingsRequest");
    });

    cy.fixture("roomTypesWithSettings.json").then((config) => {
      config.data[0].features.streaming.enabled = true;
      config.data[1].features.streaming.enabled = true;

      cy.intercept("GET", "api/v1/roomTypes*", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is shown
            cy.get('[data-test="room-type-features"]')
              .should("be.visible")
              .should("contain.text", "rooms.room_types.features.title");

            // Check that the streaming state of the room type is shown correctly
            cy.get('[data-test="room-type-feature-streaming"]').should(
              "have.class",
              "p-tag-secondary",
            );
          });

        // Select other room type
        cy.get('[data-test="room-type-select-option"]').eq(0).click();
        // Check that room type details are shown correctly
        cy.get('[data-test="room-type-details"]')
          .should("be.visible")
          .within(() => {
            // Check features section is shown
            cy.get('[data-test="room-type-features"]')
              .should("be.visible")
              .should("contain.text", "rooms.room_types.features.title");

            // Check that the streaming state of the room type is shown correctly
            cy.get('[data-test="room-type-feature-streaming"]').should(
              "have.class",
              "p-tag-secondary",
            );
          });
      });
  });

  it("change room type no expert", function () {
    cy.fixture("roomTypesWithSettings.json").then((roomTypes) => {
      roomTypes.data[4] = { ...roomTypes.data[2] };
      roomTypes.data[4].id = 5;
      roomTypes.data[4].name = "Exam 2";
      roomTypes.data[4].everyone_can_start_default = false;
      roomTypes.data[4].allow_guests_default = true;

      cy.intercept("GET", "api/v1/roomTypes*", {
        statusCode: 200,
        body: roomTypes,
      });
    });

    cy.fixture("roomSettings.json").then((roomSettings) => {
      roomSettings.data.expert_mode = false;
      roomSettings.data.welcome = "";

      cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
        statusCode: 200,
        body: roomSettings,
      }).as("roomSettingsRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get("#room-setting-access_code").should("have.value", "123456789");

    // Change to another room type and reset default settings
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");
    cy.get('[data-test="room-type-select-option"]').eq(2).click();
    cy.get("#room-setting-allow_guests")
      .should("be.disabled")
      .and("be.checked");

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        // Check that fields were updated
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "app.enabled",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          false,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          false,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.moderator",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        );

        // Trigger reset to defaults
        cy.get("#reset-to-defaults").click();

        // Check that only non-expert settings were updated
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          "app.enabled",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          false,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          true,
          true,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          false,
          true,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.participant",
          false,
          "rooms.roles.moderator",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.public",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        );

        // Trigger reset to defaults again
        cy.get("#reset-to-defaults").click();

        // Save changes
        cy.get('[data-test="confirmation-dialog-save-button"]').click();
      });

    // Check that settings were updated and settings changed message is shown
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.unsaved_changes")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("not.exist");

    // Check that settings where changed
    cy.get("#room-setting-room_type").should("have.value", "Exam");
    cy.get("#room-setting-name").should("have.value", "Meeting One");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get("#room-setting-allow_guests")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );

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

    // Change room type again to a room where only default settings of the room type change
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");
    cy.get('[data-test="room-type-select-option"]').eq(4).click();
    cy.get('[data-test="dialog-save-button"]').click();

    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        // Check that fields were updated
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "app.enabled",
          false,
          "app.enabled",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.moderator",
          false,
          "rooms.roles.moderator",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.private",
          false,
          "rooms.settings.advanced.visibility.private",
          false,
          true,
        );

        // Save changes
        cy.get('[data-test="confirmation-dialog-save-button"]').click();
      });

    // Check that settings were updated and settings changed message is shown
    cy.get('[data-test="room-unsaved-changes-message"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.unsaved_changes")
      .find('[data-test="room-unsaved-changes-save-button"]')
      .should("not.exist");

    // Check that settings where changed
    cy.get("#room-setting-room_type").should("have.value", "Exam 2");
    cy.get("#room-setting-name").should("have.value", "Meeting One");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get("#room-setting-allow_guests")
      .should("not.be.disabled")
      .and("be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );

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

    // Change room type again and check that comparison is shown correctly
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");
    cy.get('[data-test="room-type-select-option"]').eq(1).click();
    cy.get("#room-setting-allow_guests")
      .should("not.be.disabled")
      .and("be.checked");

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    cy.get('[data-test="room-type-change-confirmation-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        // Check that fields were updated
        cy.checkCompareRoomSettingField(
          "has_access_code",
          true,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_guests",
          true,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "everyone_can_start",
          false,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "mute_on_start",
          false,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lobby",
          "app.enabled",
          false,
          "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          true,
          true,
        );
        cy.checkCompareRoomSettingField(
          "record_attendance",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "record",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "auto_start_recording",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_cam",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "webcams_only_for_moderator",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_mic",
          true,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_public_chat",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_private_chat",
          true,
          false,
          false,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_disable_note",
          false,
          false,
          true,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "lock_settings_hide_user_list",
          false,
          false,
          true,
          false,
          false,
        );
        cy.checkCompareRoomSettingField(
          "allow_membership",
          true,
          false,
          false,
          true,
          false,
        );
        cy.checkCompareRoomSettingField(
          "default_role",
          "rooms.roles.moderator",
          false,
          "rooms.roles.participant",
          false,
          true,
        );
        cy.checkCompareRoomSettingField(
          "visibility",
          "rooms.settings.advanced.visibility.private",
          false,
          "rooms.settings.advanced.visibility.public",
          false,
          true,
        );

        // Save changes
        cy.get('[data-test="confirmation-dialog-save-button"]').click();
      });

    // Check that settings were updated and settings changed message is hidden because there are no unsaved changes
    cy.get('[data-test="room-unsaved-changes-message"]').should("not.exist");

    // Check that settings where changed
    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get("#room-setting-name").should("have.value", "Meeting One");
    cy.get("#room-setting-access_code").should("have.value", "123456789");
    cy.get("#room-setting-allow_guests")
      .should("be.disabled")
      .and("be.checked");
    cy.get("#room-setting-short_description").should(
      "have.value",
      "Short description",
    );

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

    // Change to same room type again and check that comparison is not shown
    cy.get('[data-test="room-type-change-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("be.visible");

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    cy.get('[data-test="room-type-change-confirmation-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");
  });

  it("errors loading room types", function () {
    // Check with 500 error
    const roomTypesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roomTypes*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "roomTypesRequest",
    );

    cy.visit("/rooms/abc-def-123#tab=settings");

    cy.wait("@roomSettingsRequest");

    cy.get("#room-setting-room_type").should("have.value", "Meeting");
    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");
    cy.get('[data-test="room-type-change-button"]').click();

    // Check that dialog loading is shown correctly
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .within(() => {
        cy.get('[data-test="overlay"]').should("be.visible");
        cy.get('[data-test="dialog-cancel-button"]')
          .should("be.visible")
          .and("be.disabled");
        cy.get('[data-test="dialog-save-button"]')
          .should("be.visible")
          .and("be.disabled")
          .then(() => {
            roomTypesRequest.sendResponse();
          });
      });

    cy.wait("@roomTypesRequest");
    // Check error message
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dialog is shown correctly and reload button is visible
    cy.get('[data-test="room-type-change-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.change_type.title")
      .and("include.text", "rooms.room_types.loading_error")
      .within(() => {
        cy.get('[data-test="overlay"]').should("not.exist");
        cy.get('[data-test="dialog-cancel-button"]')
          .should("be.visible")
          .and("not.be.disabled");
        cy.get('[data-test="dialog-save-button"]')
          .should("be.visible")
          .and("be.disabled");

        // Reload with valid room types
        cy.intercept("GET", "api/v1/roomTypes*", {
          fixture: "roomTypesWithSettings.json",
        }).as("roomTypesRequest");
        cy.get('[data-test="reload-room-types-button"]')
          .should("be.visible")
          .click();

        cy.wait("@roomTypesRequest");

        // Check that dialog is shown correctly
        // Check that the room types are shown correctly
        cy.get('[data-test="room-type-select-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="room-type-select-option"]')
          .eq(0)
          .should("have.text", "Lecture");
        cy.get('[data-test="room-type-select-option"]')
          .eq(1)
          .should("have.text", "Meeting");
        cy.get('[data-test="room-type-select-option"]')
          .eq(2)
          .should("have.text", "Exam");
        cy.get('[data-test="room-type-select-option"]')
          .eq(3)
          .should("have.text", "Seminar");
      });

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-type-change-dialog"]').should("not.exist");

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-type-change-button"]').click();
      },
      "GET",
      "api/v1/roomTypes*",
      "settings",
    );
  });
});
