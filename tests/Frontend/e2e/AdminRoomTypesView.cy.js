import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin room types view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRoomTypesViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "roomTypes.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/room_types/3");
  });

  it("visit with user without permission to view room types", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types/3");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/room_types/3");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check roomTypeView shown correctly", function () {
    const roomTypeRequest = interceptIndefinitely(
      "GET",
      "api/v1/roomTypes/3",
      { fixture: "roomType.json" },
      "roomTypeRequest",
    );

    cy.visit("/admin/room_types/3");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="room-types-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-delete-button"]').should("not.exist");
    cy.get('[data-test="room-types-save-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        roomTypeRequest.sendResponse();
      });

    cy.wait("@roomTypeRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that buttons are still hidden
    cy.get('[data-test="room-types-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-delete-button"]').should("not.exist");
    cy.get('[data-test="room-types-save-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.room_types.index")
      .should(
        "include.text",
        'admin.breakcrumbs.room_types.view_{"name":"Exam"}',
      );

    // Check that room type data is shown correctly
    cy.get('[data-test="room-type-name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#room-type-name")
          .should("have.value", "Exam")
          .and("be.disabled");
      });

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description")
          .should("have.value", "Room type description for room type Exam")
          .and("be.disabled");
      });

    cy.get('[data-test="color-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.color")
      .and("include.text", "admin.room_types.custom_color")
      .within(() => {
        cy.get('[data-test="color-button"]').should("have.length", 10);

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("have.attr", "role", "button")
            .and(
              "have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and("not.have.class", "selected");
        }

        cy.get("#custom-color")
          .should("have.value", "#4a5c66")
          .and("be.disabled");
      });

    cy.get('[data-test="preview-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.preview")
      .within(() => {
        cy.get('[data-test="room-type-badge"]')
          .should("have.css", "background-color", "rgb(74, 92, 102)")
          .and("have.text", "Exam");
      });

    cy.get('[data-test="server-pool-field"]')
      .should("be.visible")
      .and("include.text", "app.server_pool")
      .within(() => {
        cy.get('[data-test="server-pool-dropdown"]')
          .should("have.class", "multiselect--disabled")
          .find(".multiselect__tags")
          .should("have.text", "Test");
      });

    cy.get('[data-test="restrict-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.restrict")
      .within(() => {
        cy.get("#restrict").should("not.be.checked").and("be.disabled");
      });

    cy.get('[data-test="role-field"]').should("not.exist");

    cy.get('[data-test="max-participants-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.max_participants")
      .within(() => {
        cy.get("#max-participants")
          .should("have.value", "100")
          .and("be.disabled");
        cy.get('[data-test="clear-max-participants-button"]')
          .should("be.visible")
          .and("be.disabled");
      });

    cy.get('[data-test="max-duration-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.max_duration")
      .within(() => {
        cy.get("#max-duration")
          .should("have.value", "120 min.")
          .and("be.disabled");

        cy.get('[data-test="clear-max-duration-button"]')
          .should("be.visible")
          .and("be.disabled");
      });

    // Check default and enforced settings
    cy.contains("admin.room_types.default_room_settings.title").should(
      "be.visible",
    );
    cy.contains("rooms.settings.general.title").should("be.visible");

    cy.get('[data-test="has-access-code-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.general.has_access_code")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "has-access-code",
          true,
          false,
          true,
        );
      });

    cy.get('[data-test="allow-guests-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.general.allow_guests")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "allow-guests",
          true,
          true,
          true,
        );
      });

    cy.contains("rooms.settings.video_conference.title").should("be.visible");

    cy.get('[data-test="everyone-can-start-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.everyone_can_start")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "everyone-can-start",
          false,
          false,
          true,
        );
      });

    cy.get('[data-test="mute-on-start-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.mute_on_start")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "mute-on-start",
          true,
          true,
          true,
        );
      });

    cy.get('[data-test="lobby-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.lobby.title")
      .within(() => {
        cy.get('[data-test="lobby-disabled-field"]')
          .should("be.visible")
          .and("include.text", "app.disabled")
          .within(() => {
            cy.get("#lobby-disabled")
              .should("not.be.checked")
              .and("be.disabled");
          });

        cy.get('[data-test="lobby-enabled-field"]')
          .should("be.visible")
          .and("include.text", "app.enabled")
          .within(() => {
            cy.get("#lobby-enabled")
              .should("not.be.checked")
              .and("be.disabled");
          });

        cy.get('[data-test="lobby-only-for-guests-field"]')
          .should("be.visible")
          .and(
            "include.text",
            "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          )
          .within(() => {
            cy.get("#lobby-only-for-guests")
              .should("be.checked")
              .and("be.disabled");
          });

        cy.get('[data-test="lobby-enforced"]')
          .should(
            "have.text",
            "admin.room_types.default_room_settings.enforced",
          )
          .and("be.disabled");
      });

    cy.contains("rooms.settings.recordings.title").should("be.visible");

    cy.get('[data-test="record-attendance-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.record_attendance")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "record-attendance",
          false,
          false,
          true,
        );
      });

    cy.get('[data-test="record-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.record_video_conference")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "record",
          false,
          false,
          true,
        );
      });

    cy.get('[data-test="record-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.record_video_conference")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "record",
          false,
          false,
          true,
        );
      });

    cy.get('[data-test="auto-start-recording-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.recordings.auto_start_recording")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "auto-start-recording",
          false,
          false,
          true,
        );
      });

    cy.contains("rooms.settings.restrictions.title").should("be.visible");

    cy.get('[data-test="disable-cam-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_cam",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "disable-cam",
          false,
          false,
          true,
        );
      });

    cy.get('[data-test="webcams-only-for-moderator-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.webcams_only_for_moderator",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "webcams-only-for-moderator",
          true,
          false,
          true,
        );
      });

    cy.get('[data-test="disable-mic-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_mic",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "disable-mic",
          false,
          true,
          true,
        );
      });

    cy.get('[data-test="disable-public-chat-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_public_chat",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "disable-public-chat",
          true,
          false,
          true,
        );
      });

    cy.get('[data-test="disable-private-chat-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_private_chat",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "disable-private-chat",
          false,
          false,
          true,
        );
      });

    cy.get('[data-test="disable-note-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_note",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "disable-note",
          true,
          true,
          true,
        );
      });

    cy.get('[data-test="hide-user-list-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_hide_user_list",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "hide-user-list",
          true,
          false,
          true,
        );
      });

    cy.contains("rooms.settings.participants.title").should("be.visible");

    cy.get('[data-test="allow-membership-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.participants.allow_membership")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "allow-membership",
          false,
          true,
          true,
        );
      });

    cy.get('[data-test="default-role-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.participants.default_role.title")
      .and(
        "include.text",
        "rooms.settings.participants.default_role.only_logged_in",
      )
      .within(() => {
        cy.get('[data-test="default-role-default-button"]').should(
          "have.length",
          2,
        );

        cy.get('[data-test="default-role-default-button"]')
          .eq(0)
          .should("have.text", "rooms.roles.participant")
          .should("have.attr", "aria-pressed", "true")
          .and("be.disabled");

        cy.get('[data-test="default-role-default-button"]')
          .eq(1)
          .should("have.text", "rooms.roles.moderator")
          .and("not.have.attr", "aria-pressed", "true")
          .and("be.disabled");

        cy.get('[data-test="default-role-enforced"]')
          .should("have.text", "admin.room_types.default_room_settings.default")
          .and("be.disabled");
      });

    cy.contains("rooms.settings.advanced.title").should("be.visible");

    cy.get('[data-test="visibility-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.advanced.visibility")
      .within(() => {
        cy.get('[data-test="visibility-default-button"]').should(
          "have.length",
          2,
        );

        cy.get('[data-test="visibility-default-button"]')
          .eq(0)
          .should("have.text", "rooms.settings.advanced.visibility.private")
          .and("not.have.attr", "aria-pressed", "true")
          .and("be.disabled");

        cy.get('[data-test="visibility-default-button"]')
          .eq(1)
          .should("have.text", "rooms.settings.advanced.visibility.public")
          .and("have.attr", "aria-pressed", "true")
          .and("be.disabled");

        cy.get('[data-test="visibility-enforced"]')
          .should("have.text", "admin.room_types.default_room_settings.default")
          .and("be.disabled");
      });

    // Check other settings
    cy.contains("admin.room_types.bbb_api.title").should("be.visible");

    cy.get('[data-test="create-parameters-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.bbb_api.create_parameters")
      .and(
        "include.text",
        "admin.room_types.bbb_api.create_parameters_description",
      )
      .within(() => {
        cy.get("#create-parameters")
          .should(
            "have.value",
            "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
          )
          .and("be.disabled");
      });
  });

  it("check restrictions shown correctly", function () {
    cy.fixture("roomType.json").then((roomType) => {
      roomType.data.restrict = true;
      roomType.data.roles = [
        {
          id: 1,
          name: "Superuser",
        },
        {
          id: 2,
          name: "Staff",
        },
      ];

      cy.intercept("GET", "api/v1/roomTypes/3", {
        statusCode: 200,
        body: roomType,
      });
    });

    cy.visit("/admin/room_types/3");

    cy.get('[data-test="restrict-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.restrict")
      .within(() => {
        cy.get("#restrict").should("be.checked").and("be.disabled");
      });

    cy.get('[data-test="role-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]')
          .should("have.class", "multiselect--disabled")
          .within(() => {
            cy.get('[data-test="role-chip"]').should("have.length", 2);
            cy.get('[data-test="role-chip"]')
              .eq(0)
              .should("include.text", "Superuser")
              .find('[data-test="remove-server-button"]')
              .should("not.exist");
            cy.get('[data-test="role-chip"]')
              .eq(1)
              .should("include.text", "Staff")
              .find('[data-test="remove-server-button"]')
              .should("not.exist");
          });
      });
  });

  it("open view errors", function () {
    cy.intercept("GET", "api/v1/roomTypes/3", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomTypeRequest");

    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/roomTypes/3", {
      statusCode: 200,
      fixture: "roomType.json",
    }).as("roomTypeRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@roomTypeRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload with 404 error
    cy.interceptAdminRoomTypesIndexRequests();

    cy.intercept("GET", "api/v1/roomTypes/3", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("roomTypeRequest");

    cy.reload();

    cy.wait("@roomTypeRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/room_types/3");
    cy.url().should("include", "/admin/room_types");

    cy.wait("@roomTypesRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/roomTypes/3", {
      statusCode: 401,
    }).as("roomTypeRequest");

    cy.visit("admin/room_types/3");

    cy.wait("@roomTypeRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/3");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    cy.get('[data-test="room-types-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-edit-button"]')
      .should("be.visible")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/room_types/3/edit");
    cy.get('[data-test="room-types-delete-button"]').should("not.exist");
    cy.get('[data-test="room-types-save-button"]').should("not.exist");
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
        "roomTypes.create",
        "roomTypes.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    cy.get('[data-test="room-types-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/room_types/3/edit");
    cy.get('[data-test="room-types-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="room-types-save-button"]').should("not.exist");
  });
});
