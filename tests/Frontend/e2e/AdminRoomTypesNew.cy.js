import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin room types new", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRoomTypesNewRequests();

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
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/room_types/new");
  });

  it("visit with user without permission to add new room types", function () {
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

    cy.visit("/admin/room_types/new");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/room_types");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("add new room type", function () {
    cy.visit("/admin/room_types/new");

    // Check that header buttons are hidden
    cy.get('[data-test="room-types-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-delete-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.room_types.index")
      .should("include.text", "admin.breakcrumbs.room_types.new");

    cy.get('[data-test="room-type-name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#room-type-name").should("have.value", "").type("Exam 01");
      });

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.room_types.index")
      .should("include.text", "admin.breakcrumbs.room_types.new");

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description")
          .should("have.value", "")
          .type("Room type description for room type Exam 01");
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
              "not.have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and(i === 0 ? "have.class" : "not.have.class", "selected");
        }

        // Clear custom color and check that color buttons are not selected
        cy.get("#custom-color")
          .should("have.value", "#6366f1")
          .and("not.be.disabled")
          .clear();

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("not.have.class", "selected");
        }

        // Set custom color and check that color buttons is selected
        cy.get("#custom-color").type("#ef4444");

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should(i === 7 ? "have.class" : "not.have.class", "selected");
        }
      });

    cy.get('[data-test="preview-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.preview")
      .within(() => {
        cy.get('[data-test="room-type-badge"]')
          .should("have.css", "background-color", "rgb(239, 68, 68)")
          .and("have.text", "Exam 01");
      });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-pool-field"]')
      .should("be.visible")
      .and("include.text", "app.server_pool")
      .within(() => {
        cy.get('[data-test="server-pool-dropdown"]').within(() => {
          cy.get(".multiselect__tags")
            .should("include.text", "admin.room_types.select_server_pool")
            .click();
        });
      });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 4);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Test")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Production")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");

    cy.get(".multiselect__option")
      .eq(3)
      .should("include.text", "admin.server_pools.no_data")
      .and("not.be.visible");

    cy.get(".multiselect__option").eq(1).click();

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-pool-dropdown"]').within(() => {
      cy.get(".multiselect__tags").should("include.text", "Production");
    });

    cy.get('[data-test="restrict-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.restrict")
      .within(() => {
        cy.get("#restrict").should("not.be.checked").and("not.be.disabled");
      });

    cy.get('[data-test="role-field"]').should("not.exist");

    cy.get('[data-test="max-participants-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.max_participants")
      .within(() => {
        cy.get("#max-participants").should("have.value", "").type("100");
        cy.get('[data-test="clear-max-participants-button"]')
          .should("be.visible")
          .and("not.be.disabled");
      });

    cy.get('[data-test="max-duration-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.max_duration")
      .within(() => {
        cy.get("#max-duration").should("have.value", "").type("120");
        cy.get('[data-test="clear-max-duration-button"]')
          .should("be.visible")
          .and("not.be.disabled");
      });

    // Change default and enforced values
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
          false,
        );
      });

    cy.get('[data-test="allow-guests-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.general.allow_guests")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "allow-guests",
          false,
          false,
          false,
        );
      });

    cy.get("#allow-guests-default").click();
    cy.get('[data-test="allow-guests-enforced"]').click();

    cy.contains("rooms.settings.video_conference.title").should("be.visible");

    cy.get('[data-test="everyone-can-start-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.everyone_can_start")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "everyone-can-start",
          false,
          false,
          false,
        );
      });

    cy.get('[data-test="mute-on-start-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.mute_on_start")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "mute-on-start",
          false,
          false,
          false,
        );
      });

    cy.get("#mute-on-start-default").click();
    cy.get('[data-test="mute-on-start-enforced"]').click();

    cy.get('[data-test="lobby-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.video_conference.lobby.title")
      .within(() => {
        cy.get('[data-test="lobby-disabled-field"]')
          .should("be.visible")
          .and("include.text", "app.disabled")
          .within(() => {
            cy.get("#lobby-disabled")
              .should("be.checked")
              .and("not.be.disabled");
          });

        cy.get('[data-test="lobby-enabled-field"]')
          .should("be.visible")
          .and("include.text", "app.enabled")
          .within(() => {
            cy.get("#lobby-enabled")
              .should("not.be.checked")
              .and("not.be.disabled");
          });

        cy.get('[data-test="lobby-only-for-guests-field"]')
          .should("be.visible")
          .and(
            "include.text",
            "rooms.settings.video_conference.lobby.only_for_guests_enabled",
          )
          .within(() => {
            cy.get("#lobby-only-for-guests")
              .should("not.be.checked")
              .and("not.be.disabled");
          });

        cy.get("#lobby-only-for-guests").click();

        cy.get('[data-test="lobby-enforced"]')
          .should("have.text", "admin.room_types.default_room_settings.default")
          .click();
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
          false,
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
          false,
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
          false,
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
          false,
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
          false,
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
          false,
          false,
          false,
        );
      });

    cy.get("#webcams-only-for-moderator-default").click();

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
          false,
          false,
        );
      });

    cy.get('[data-test="disable-mic-enforced"]').click();

    cy.get('[data-test="disable-public-chat-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_disable_public_chat",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "disable-public-chat",
          false,
          false,
          false,
        );
      });

    cy.get("#disable-public-chat-default").click();

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
          false,
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
          false,
          false,
          false,
        );
      });

    cy.get("#disable-note-default").click();
    cy.get('[data-test="disable-note-enforced"]').click();

    cy.get('[data-test="hide-user-list-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "rooms.settings.restrictions.lock_settings_hide_user_list",
      )
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "hide-user-list",
          false,
          false,
          false,
        );
      });

    cy.get("#hide-user-list-default").click();

    cy.contains("rooms.settings.participants.title").should("be.visible");

    cy.get('[data-test="allow-membership-field"]')
      .should("be.visible")
      .and("include.text", "rooms.settings.participants.allow_membership")
      .within(() => {
        cy.roomTypeCheckDefaultRoomSettingCheckboxField(
          "allow-membership",
          false,
          false,
          false,
        );
      });

    cy.get('[data-test="allow-membership-enforced"]').click();

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
          .should("have.attr", "aria-pressed", "true");

        cy.get('[data-test="default-role-default-button"]')
          .eq(1)
          .should("have.text", "rooms.roles.moderator")
          .should("not.have.attr", "aria-pressed", "true");

        cy.get('[data-test="default-role-enforced"]').should(
          "have.text",
          "admin.room_types.default_room_settings.default",
        );
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
          .should("have.attr", "aria-pressed", "true");

        cy.get('[data-test="visibility-default-button"]')
          .eq(1)
          .should("have.text", "rooms.settings.advanced.visibility.public")
          .should("not.have.attr", "aria-pressed", "true")
          .click();

        cy.get('[data-test="visibility-enforced"]').should(
          "have.text",
          "admin.room_types.default_room_settings.default",
        );
      });

    // Change other settings
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
          .should("have.value", "")
          .type(
            "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
          );
      });

    // Add new room type
    cy.fixture("roomType.json").then((roomType) => {
      roomType.data.id = 30;
      roomType.data.name = "Exam 01";
      roomType.data.description = "Room type description for room type Exam 01";
      roomType.data.color = "#ef4444";
      roomType.data.server_pool = {
        id: 2,
        name: "Production",
        description: "Pool for production",
        servers_count: 1,
        model_name: "ServerPool",
        updated_at: "2020-12-21T13:43:21.000000Z",
      };

      const newRoomTypeRequest = interceptIndefinitely(
        "POST",
        "api/v1/roomTypes",
        {
          statusCode: 201,
          body: roomType,
        },
        "newRoomTypeRequest",
      );

      cy.intercept("GET", "api/v1/roomTypes/30", {
        statusCode: 200,
        body: roomType,
      }).as("roomTypeRequest");

      cy.get('[data-test="overlay"]').should("not.exist");

      cy.get('[data-test="room-types-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get("#room-type-name").should("be.disabled");
      cy.get("#description").should("be.disabled");
      for (let i = 0; i < 10; i++) {
        cy.get('[data-test="color-button"]')
          .eq(i)
          .should("have.attr", "role", "button")
          .and(
            "have.class",
            "pointer-events-none cursor-not-allowed opacity-80",
          );
      }
      cy.get("#custom-color").should("be.disabled");
      cy.get('[data-test="server-pool-dropdown"]').should(
        "have.class",
        "multiselect--disabled",
      );

      cy.get("#restrict").should("be.disabled");

      cy.get("#max-participants").should("be.disabled");
      cy.get('[data-test="clear-max-participants-button"]')
        .should("be.visible")
        .and("be.disabled");
      cy.get("#max-duration").should("be.disabled");
      cy.get('[data-test="clear-max-duration-button"]')
        .should("be.visible")
        .and("be.disabled");

      cy.get("#has-access-code-default").should("be.disabled");
      cy.get('[data-test="has-access-code-enforced"]').should("be.disabled");
      cy.get("#allow-guests-default").should("be.disabled");
      cy.get('[data-test="allow-guests-enforced"]').should("be.disabled");
      cy.get("#everyone-can-start-default").should("be.disabled");
      cy.get('[data-test="everyone-can-start-enforced"]').should("be.disabled");
      cy.get("#mute-on-start-default").should("be.disabled");
      cy.get('[data-test="mute-on-start-enforced"]').should("be.disabled");
      cy.get("#lobby-disabled").should("be.disabled");
      cy.get("#lobby-enabled").should("be.disabled");
      cy.get("#lobby-only-for-guests").should("be.disabled");
      cy.get('[data-test="lobby-enforced"]').should("be.disabled");
      cy.get("#record-attendance-default").should("be.disabled");
      cy.get('[data-test="record-attendance-enforced"]').should("be.disabled");
      cy.get("#record-default").should("be.disabled");
      cy.get('[data-test="record-enforced"]').should("be.disabled");
      cy.get("#auto-start-recording-default").should("be.disabled");
      cy.get('[data-test="auto-start-recording-enforced"]').should(
        "be.disabled",
      );
      cy.get("#disable-cam-default").should("be.disabled");
      cy.get('[data-test="disable-cam-enforced"]').should("be.disabled");
      cy.get("#webcams-only-for-moderator-default").should("be.disabled");
      cy.get('[data-test="webcams-only-for-moderator-enforced"]').should(
        "be.disabled",
      );
      cy.get("#disable-mic-default").should("be.disabled");
      cy.get('[data-test="disable-mic-enforced"]').should("be.disabled");
      cy.get("#disable-public-chat-default").should("be.disabled");
      cy.get('[data-test="disable-public-chat-enforced"]').should(
        "be.disabled",
      );
      cy.get("#disable-private-chat-default").should("be.disabled");
      cy.get('[data-test="disable-private-chat-enforced"]').should(
        "be.disabled",
      );
      cy.get("#disable-note-default").should("be.disabled");
      cy.get('[data-test="disable-note-enforced"]').should("be.disabled");
      cy.get("#hide-user-list-default").should("be.disabled");
      cy.get('[data-test="hide-user-list-enforced"]').should("be.disabled");
      cy.get("#allow-membership-default").should("be.disabled");
      cy.get('[data-test="allow-membership-enforced"]').should("be.disabled");
      cy.get('[data-test="default-role-default-button"]').should(
        "have.length",
        2,
      );
      cy.get('[data-test="default-role-default-button"]')
        .eq(0)
        .should("be.disabled");
      cy.get('[data-test="default-role-default-button"]')
        .eq(1)
        .should("be.disabled");
      cy.get('[data-test="default-role-enforced"]').should("be.disabled");
      cy.get('[data-test="visibility-default-button"]').should(
        "have.length",
        2,
      );
      cy.get('[data-test="visibility-default-button"]')
        .eq(0)
        .should("be.disabled");
      cy.get('[data-test="visibility-default-button"]')
        .eq(1)
        .should("be.disabled");
      cy.get('[data-test="visibility-enforced"]').should("be.disabled");

      cy.get('[data-test="room-types-save-button"]')
        .should("be.disabled")
        .then(() => {
          newRoomTypeRequest.sendResponse();
        });

      const roomTypeRequestData = { ...roomType.data };
      roomTypeRequestData.server_pool = roomTypeRequestData.server_pool.id;
      delete roomTypeRequestData.id;
      delete roomTypeRequestData.model_name;

      cy.wait("@newRoomTypeRequest").then((interception) => {
        expect(interception.request.body).to.eql(roomTypeRequestData);
      });
    });

    cy.wait("@roomTypeRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that room type page is shown
    cy.url().should("include", "/admin/room_types/30");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.room_types.index")
      .should(
        "include.text",
        'admin.breakcrumbs.room_types.view_{"name":"Exam 01"}',
      );
  });

  it("add new room type with restrictions", function () {
    cy.visit("/admin/room_types/new");

    // Check that header buttons are hidden
    cy.get('[data-test="room-types-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-edit-button"]').should("not.exist");
    cy.get('[data-test="room-types-delete-button"]').should("not.exist");

    cy.get("#room-type-name").should("have.value", "").type("Exam");

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-pool-dropdown"]').click();
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(0).click();

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-pool-dropdown"]').within(() => {
      cy.get(".multiselect__tags").should("include.text", "Test");
    });

    cy.get('[data-test="restrict-field"]')
      .should("be.visible")
      .and("include.text", "admin.room_types.restrict")
      .within(() => {
        cy.get("#restrict")
          .should("not.be.checked")
          .and("not.be.disabled")
          .click();
      });

    // Check role setting and change it
    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="role-field"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="role-dropdown"]').within(() => {
          cy.get(".multiselect__tags")
            .should("include.text", "admin.roles.select_roles")
            .click();
          cy.get('[data-test="role-chip"]').should("have.length", 0);
        });
      });

    // Check if correct options are shown
    cy.get(".multiselect__content")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get(".multiselect__option").should("have.length", 5);
        cy.get(".multiselect__option")
          .eq(0)
          .should("include.text", "Superuser")
          .and("include.text", "admin.roles.superuser")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(1)
          .should("include.text", "Staff")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(2)
          .should("include.text", "Students")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(3)
          .should(
            "include.text",
            "No elements found. Consider changing the search query.",
          )
          .and("not.be.visible");
        cy.get(".multiselect__option")
          .eq(4)
          .should("include.text", "admin.roles.no_data")
          .and("not.be.visible");
      });

    // Switch to next page
    const userRoleRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles*",
      {
        statusCode: 200,
        body: {
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
        },
      },
      "userRoleRequest",
    );

    cy.get(".multiselect__content")
      .eq(1)

      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]')
          .should("include.text", "app.previous_page")
          .and("be.disabled");
        cy.get('[data-test="next-page-button"]')
          .should("include.text", "app.next_page")
          .and("not.be.disabled");

        cy.get('[data-test="next-page-button"]').click();

        // Check loading
        cy.get('[data-test="previous-page-button"]').should("be.disabled");
        cy.get('[data-test="next-page-button"]').should("be.disabled");
      });

    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="room-types-save-button"]')
      .should("be.disabled")
      .then(() => {
        userRoleRequest.sendResponse();
      });

    cy.wait("@userRoleRequest");

    cy.get(".multiselect__content")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]').should("not.be.disabled");
        cy.get('[data-test="next-page-button"]').should("be.disabled");

        cy.get(".multiselect__option").should("have.length", 5);
        cy.get(".multiselect__option")
          .eq(0)
          .should("include.text", "Dean")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(1)
          .should("include.text", "Faculty")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(2)
          .should("include.text", "Manager")
          .and("be.visible");
        cy.get(".multiselect__option")
          .eq(3)
          .should(
            "include.text",
            "No elements found. Consider changing the search query.",
          )
          .and("not.be.visible");
        cy.get(".multiselect__option")
          .eq(4)
          .should("include.text", "admin.roles.no_data")
          .and("not.be.visible");

        // Select roles
        cy.get(".multiselect__option").eq(0).click();
        cy.get(".multiselect__option").eq(2).click();
      });

    // Check that roles are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 2);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("include.text", "Dean")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .should("include.text", "Manager")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
    });

    // Close dialog
    cy.get(".multiselect__select").eq(1).click();

    // Check that dialog is closed
    cy.get(".multiselect__content").should("not.be.visible");

    // Add new room type
    cy.fixture("roomType.json").then((roomType) => {
      roomType.data.id = 30;
      roomType.data.description = "";
      roomType.data.color = "#6366f1";
      roomType.data.server_pool = {
        id: 1,
        name: "Test",
        description: "Pool for testing",
        servers_count: 2,
        model_name: "ServerPool",
        updated_at: "2020-12-21T13:43:21.000000Z",
      };
      roomType.data.max_participants = null;
      roomType.data.max_duration = null;
      roomType.data.create_parameters = null;
      roomType.data.restrict = true;
      roomType.data.roles = [
        {
          id: 4,
          name: "Dean",
        },
        {
          id: 6,
          name: "Manager",
        },
      ];
      roomType.data.mute_on_start_default = false;
      roomType.data.mute_on_start_enforced = false;
      roomType.data.lock_settings_disable_cam_default = false;
      roomType.data.lock_settings_disable_cam_enforced = false;
      roomType.data.webcams_only_for_moderator_default = false;
      roomType.data.webcams_only_for_moderator_enforced = false;
      roomType.data.lock_settings_disable_mic_default = false;
      roomType.data.lock_settings_disable_mic_enforced = false;
      roomType.data.lock_settings_disable_private_chat_default = false;
      roomType.data.lock_settings_disable_private_chat_enforced = false;
      roomType.data.lock_settings_disable_public_chat_default = false;
      roomType.data.lock_settings_disable_public_chat_enforced = false;
      roomType.data.lock_settings_disable_note_default = false;
      roomType.data.lock_settings_disable_note_enforced = false;
      roomType.data.lock_settings_hide_user_list_default = false;
      roomType.data.lock_settings_hide_user_list_enforced = false;
      roomType.data.everyone_can_start_default = false;
      roomType.data.everyone_can_start_enforced = false;
      roomType.data.allow_membership_default = false;
      roomType.data.allow_membership_enforced = false;
      roomType.data.allow_guests_default = false;
      roomType.data.allow_guests_enforced = false;
      roomType.data.default_role_default = 1;
      roomType.data.default_role_enforced = false;
      roomType.data.lobby_default = 0;
      roomType.data.lobby_enforced = false;
      roomType.data.visibility_default = 0;
      roomType.data.visibility_enforced = false;
      roomType.data.record_attendance_default = false;
      roomType.data.record_attendance_enforced = false;
      roomType.data.record_default = false;
      roomType.data.record_enforced = false;
      roomType.data.auto_start_recording_default = false;
      roomType.data.auto_start_recording_enforced = false;
      roomType.data.has_access_code_default = true;
      roomType.data.has_access_code_enforced = false;

      const newRoomTypeRequest = interceptIndefinitely(
        "POST",
        "api/v1/roomTypes",
        {
          statusCode: 201,
          body: roomType,
        },
        "newRoomTypeRequest",
      );

      cy.intercept("GET", "api/v1/roomTypes/30", {
        statusCode: 200,
        body: roomType,
      }).as("roomTypeRequest");

      cy.get('[data-test="overlay"]').should("not.exist");

      cy.get('[data-test="room-types-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");

      cy.get("#restrict").should("be.disabled");
      cy.get('[data-test="role-dropdown"]').should(
        "have.class",
        "multiselect--disabled",
      );

      cy.get('[data-test="room-types-save-button"]')
        .should("be.disabled")
        .then(() => {
          newRoomTypeRequest.sendResponse();
        });

      const roomTypeRequestData = { ...roomType.data };
      roomTypeRequestData.server_pool = roomTypeRequestData.server_pool.id;
      delete roomTypeRequestData.id;
      delete roomTypeRequestData.model_name;
      delete roomTypeRequestData.description;
      roomTypeRequestData.roles = roomTypeRequestData.roles.map(
        (role) => role.id,
      );

      cy.wait("@newRoomTypeRequest").then((interception) => {
        expect(interception.request.body).to.eql(roomTypeRequestData);
      });
    });

    cy.wait("@roomTypeRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that room type page is shown
    cy.url().should("include", "/admin/room_types/30");
  });

  it("add new room type errors", function () {
    cy.visit("/admin/room_types/new");

    cy.get("#restrict").click();

    // Check with 422 error
    cy.intercept("POST", "api/v1/roomTypes", {
      statusCode: 422,
      body: {
        message: "The given data was invalid.",
        errors: {
          name: ["The name field is required."],
          description: ["The description field is required."],
          color: ["The color field is required."],
          server_pool: ["The server pool field is required."],
          max_participants: ["The max participants field is required."],
          max_duration: ["The max duration field is required."],
          create_parameters: ["The create parameters field is required."],
          roles: ["The roles field is required."],
          has_access_code_default: [
            "The has access code default field is required.",
          ],
          has_access_code_enforced: [
            "The has access code enforced field is required.",
          ],
          allow_guests_default: ["The allow guests default field is required."],
          allow_guests_enforced: [
            "The allow guests enforced field is required.",
          ],
          everyone_can_start_default: [
            "The everyone can start default field is required.",
          ],
          everyone_can_start_enforced: [
            "The everyone can start enforced field is required.",
          ],
          mute_on_start_default: [
            "The mute on start default field is required.",
          ],
          mute_on_start_enforced: [
            "The mute on start enforced field is required.",
          ],
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
          default_role_enforced: [
            "The default role enforced field is required.",
          ],
          visibility_default: ["The visibility default field is required."],
          visibility_enforced: ["The visibility enforced field is required."],
        },
      },
    }).as("newRoomTypeRequest");

    cy.get('[data-test="room-types-save-button"]').click();

    cy.wait("@newRoomTypeRequest");

    // Check error messages
    cy.get('[data-test="room-type-name-field"]').should(
      "include.text",
      "The name field is required.",
    );
    cy.get('[data-test="description-field"]').should(
      "include.text",
      "The description field is required.",
    );
    cy.get('[data-test="color-field"]').should(
      "include.text",
      "The color field is required.",
    );
    cy.get('[data-test="server-pool-field"]').should(
      "include.text",
      "The server pool field is required.",
    );
    cy.get('[data-test="max-participants-field"]').should(
      "include.text",
      "The max participants field is required.",
    );
    cy.get('[data-test="max-duration-field"]').should(
      "include.text",
      "The max duration field is required.",
    );
    cy.get('[data-test="create-parameters-field"]').should(
      "include.text",
      "The create parameters field is required.",
    );
    cy.get('[data-test="role-field"]').should(
      "include.text",
      "The roles field is required.",
    );
    cy.get('[data-test="has-access-code-field"]')
      .should("include.text", "The has access code default field is required.")
      .and("include.text", "The has access code enforced field is required.");
    cy.get('[data-test="allow-guests-field"]')
      .should("include.text", "The allow guests default field is required.")
      .and("include.text", "The allow guests enforced field is required.");
    cy.get('[data-test="everyone-can-start-field"]')
      .should(
        "include.text",
        "The everyone can start default field is required.",
      )
      .and(
        "include.text",
        "The everyone can start enforced field is required.",
      );
    cy.get('[data-test="mute-on-start-field"]')
      .should("include.text", "The mute on start default field is required.")
      .and("include.text", "The mute on start enforced field is required.");
    cy.get('[data-test="lobby-field"]')
      .should("include.text", "The lobby default field is required.")
      .and("include.text", "The lobby enforced field is required.");
    cy.get('[data-test="record-attendance-field"]')
      .should(
        "include.text",
        "The record attendance default field is required.",
      )
      .and("include.text", "The record attendance enforced field is required.");
    cy.get('[data-test="record-field"]')
      .should("include.text", "The record default field is required.")
      .and("include.text", "The record enforced field is required.");
    cy.get('[data-test="auto-start-recording-field"]')
      .should(
        "include.text",
        "The auto start recording default field is required.",
      )
      .and(
        "include.text",
        "The auto start recording enforced field is required.",
      );
    cy.get('[data-test="disable-cam-field"]')
      .should(
        "include.text",
        "The lock settings disable cam default field is required.",
      )
      .and(
        "include.text",
        "The lock settings disable cam enforced field is required.",
      );
    cy.get('[data-test="webcams-only-for-moderator-field"]')
      .should(
        "include.text",
        "The webcams only for moderator default field is required.",
      )
      .and(
        "include.text",
        "The webcams only for moderator enforced field is required.",
      );
    cy.get('[data-test="disable-mic-field"]')
      .should(
        "include.text",
        "The lock settings disable mic default field is required.",
      )
      .and(
        "include.text",
        "The lock settings disable mic enforced field is required.",
      );
    cy.get('[data-test="disable-public-chat-field"]')
      .should(
        "include.text",
        "The lock settings disable public chat default field is required.",
      )
      .and(
        "include.text",
        "The lock settings disable public chat enforced field is required.",
      );
    cy.get('[data-test="disable-private-chat-field"]')
      .should(
        "include.text",
        "The lock settings disable private chat default field is required.",
      )
      .and(
        "include.text",
        "The lock settings disable private chat enforced field is required.",
      );
    cy.get('[data-test="disable-note-field"]')
      .should(
        "include.text",
        "The lock settings disable note default field is required.",
      )
      .and(
        "include.text",
        "The lock settings disable note enforced field is required.",
      );
    cy.get('[data-test="hide-user-list-field"]')
      .should(
        "include.text",
        "The lock settings hide user list default field is required.",
      )
      .and(
        "include.text",
        "The lock settings hide user list enforced field is required.",
      );
    cy.get('[data-test="allow-membership-field"]')
      .should("include.text", "The allow membership default field is required.")
      .and("include.text", "The allow membership enforced field is required.");
    cy.get('[data-test="default-role-field"]')
      .should("include.text", "The default role default field is required.")
      .and("include.text", "The default role enforced field is required.");
    cy.get('[data-test="visibility-field"]')
      .should("include.text", "The visibility default field is required.")
      .and("include.text", "The visibility enforced field is required.");

    // Check with 500 error
    cy.intercept("POST", "api/v1/roomTypes", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("newRoomTypeRequest");

    cy.get('[data-test="room-types-save-button"]').click();

    cy.wait("@newRoomTypeRequest");

    // Check error message
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="room-type-name-field"]').should(
      "not.include.text",
      "The name field is required.",
    );
    cy.get('[data-test="description-field"]').should(
      "not.include.text",
      "The description field is required.",
    );
    cy.get('[data-test="color-field"]').should(
      "not.include.text",
      "The color field is required.",
    );
    cy.get('[data-test="server-pool-field"]').should(
      "not.include.text",
      "The server pool field is required.",
    );
    cy.get('[data-test="max-participants-field"]').should(
      "not.include.text",
      "The max participants field is required.",
    );
    cy.get('[data-test="max-duration-field"]').should(
      "not.include.text",
      "The max duration field is required.",
    );
    cy.get('[data-test="create-parameters-field"]').should(
      "not.include.text",
      "The create parameters field is required.",
    );
    cy.get('[data-test="role-field"]').should(
      "not.include.text",
      "The roles field is required.",
    );
    cy.get('[data-test="has-access-code-field"]')
      .should(
        "not.include.text",
        "The has access code default field is required.",
      )
      .and(
        "not.include.text",
        "The has access code enforced field is required.",
      );
    cy.get('[data-test="allow-guests-field"]')
      .should("not.include.text", "The allow guests default field is required.")
      .and("not.include.text", "The allow guests enforced field is required.");
    cy.get('[data-test="everyone-can-start-field"]')
      .should(
        "not.include.text",
        "The everyone can start default field is required.",
      )
      .and(
        "not.include.text",
        "The everyone can start enforced field is required.",
      );
    cy.get('[data-test="mute-on-start-field"]')
      .should(
        "not.include.text",
        "The mute on start default field is required.",
      )
      .and("not.include.text", "The mute on start enforced field is required.");
    cy.get('[data-test="lobby-field"]')
      .should("not.include.text", "The lobby default field is required.")
      .and("not.include.text", "The lobby enforced field is required.");
    cy.get('[data-test="record-attendance-field"]')
      .should(
        "not.include.text",
        "The record attendance default field is required.",
      )
      .and(
        "not.include.text",
        "The record attendance enforced field is required.",
      );
    cy.get('[data-test="record-field"]')
      .should("not.include.text", "The record default field is required.")
      .and("not.include.text", "The record enforced field is required.");
    cy.get('[data-test="auto-start-recording-field"]')
      .should(
        "not.include.text",
        "The auto start recording default field is required.",
      )
      .and(
        "not.include.text",
        "The auto start recording enforced field is required.",
      );
    cy.get('[data-test="disable-cam-field"]')
      .should(
        "not.include.text",
        "The lock settings disable cam default field is required.",
      )
      .and(
        "not.include.text",
        "The lock settings disable cam enforced field is required.",
      );
    cy.get('[data-test="webcams-only-for-moderator-field"]')
      .should(
        "not.include.text",
        "The webcams only for moderator default field is required.",
      )
      .and(
        "not.include.text",
        "The webcams only for moderator enforced field is required.",
      );
    cy.get('[data-test="disable-mic-field"]')
      .should(
        "not.include.text",
        "The lock settings disable mic default field is required.",
      )
      .and(
        "not.include.text",
        "The lock settings disable mic enforced field is required.",
      );
    cy.get('[data-test="disable-public-chat-field"]')
      .should(
        "not.include.text",
        "The lock settings disable public chat default field is required.",
      )
      .and(
        "not.include.text",
        "The lock settings disable public chat enforced field is required.",
      );
    cy.get('[data-test="disable-private-chat-field"]')
      .should(
        "not.include.text",
        "The lock settings disable private chat default field is required.",
      )
      .and(
        "not.include.text",
        "The lock settings disable private chat enforced field is required.",
      );
    cy.get('[data-test="disable-note-field"]')
      .should(
        "not.include.text",
        "The lock settings disable note default field is required.",
      )
      .and(
        "not.include.text",
        "The lock settings disable note enforced field is required.",
      );
    cy.get('[data-test="hide-user-list-field"]')
      .should(
        "not.include.text",
        "The lock settings hide user list default field is required.",
      )
      .and(
        "not.include.text",
        "The lock settings hide user list enforced field is required.",
      );
    cy.get('[data-test="allow-membership-field"]')
      .should(
        "not.include.text",
        "The allow membership default field is required.",
      )
      .and(
        "not.include.text",
        "The allow membership enforced field is required.",
      );
    cy.get('[data-test="default-role-field"]')
      .should("not.include.text", "The default role default field is required.")
      .and("not.include.text", "The default role enforced field is required.");
    cy.get('[data-test="visibility-field"]')
      .should("not.include.text", "The visibility default field is required.")
      .and("not.include.text", "The visibility enforced field is required.");

    // Check with 401 error
    cy.intercept("POST", "api/v1/roomTypes", {
      statusCode: 401,
    }).as("newRoomTypeRequest");

    cy.get('[data-test="room-types-save-button"]').click();

    cy.wait("@newRoomTypeRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load roles errors", function () {
    // Check with 500 error
    const rolesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "rolesRequest",
    );

    cy.visit("/admin/room_types/new");

    cy.get("#restrict").click();

    // Check loading
    cy.get('[data-test="room-types-save-button"]').should("be.disabled");

    cy.get('[data-test="role-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .then(() => {
        rolesRequest.sendResponse();
      });

    cy.wait("@rolesRequest");

    // Check error message
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="room-types-save-button"]').should("not.be.disabled");

    // Reload roles without errors
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.get('[data-test="roles-reload-button"]').click();

    cy.wait("@rolesRequest");

    cy.get('[data-test="role-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="room-types-save-button"]').should("not.be.disabled");

    cy.get('[data-test="roles-reload-button"]').should("not.exist");

    cy.get('[data-test="role-dropdown"]').click();

    cy.get(".multiselect__content")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get(".multiselect__option").should("have.length", 5);
      });

    // Check with 500 error when switching pages
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("rolesRequest");

    cy.get(".multiselect__content")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="next-page-button"]').click();
      });

    cy.wait("@rolesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="roles-reload-button"]').should("be.visible");

    cy.get('[data-test="room-types-save-button"]').should("not.be.disabled");

    // Check with 401 error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.get("#restrict").click();
    cy.get("#restrict").click();

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/new");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit new page again with roles
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.visit("/admin/room_types/new");

    cy.get("#restrict").click();

    cy.wait("@rolesRequest");

    cy.get('[data-test="role-dropdown"]').click();

    // Check with 401 error when switching pages
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.get(".multiselect__content")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="next-page-button"]').click();
      });

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load server pools errors", function () {
    // Check with 500 error
    const serverPoolRequest = interceptIndefinitely(
      "GET",
      "api/v1/serverPools*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "serverPoolsRequest",
    );

    cy.visit("/admin/room_types/new");

    // Check loading
    cy.get('[data-test="room-types-save-button"]').should("be.disabled");

    cy.get('[data-test="server-pool-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .then(() => {
        serverPoolRequest.sendResponse();
      });

    cy.wait("@serverPoolsRequest");

    // Check error message
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="server-pool-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="room-types-save-button"]').should("be.disabled");

    // Reload server pools without errors
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pools-reload-button"]').click();

    cy.wait("@serverPoolsRequest");

    cy.get('[data-test="server-pool-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="room-types-save-button"]').should("not.be.disabled");

    cy.get('[data-test="server-pools-reload-button"]').should("not.exist");

    cy.get('[data-test="server-pool-dropdown"]').click();

    cy.get(".multiselect__content")
      .eq(0)
      .should("be.visible")
      .within(() => {
        cy.get(".multiselect__option").should("have.length", 3);
      });

    // Check with 500 error when switching pages
    cy.intercept("GET", "api/v1/serverPools*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverPoolsRequest");

    cy.get(".multiselect__content")
      .eq(0)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="next-page-button"]').click();
      });

    cy.wait("@serverPoolsRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="server-pool-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="server-pools-reload-button"]').should("be.visible");

    cy.get('[data-test="room-types-save-button"]').should("be.disabled");

    // Check with 401 error
    cy.intercept("GET", "api/v1/serverPools*", {
      statusCode: 401,
    }).as("serverPoolsRequest");

    cy.reload();

    cy.wait("@serverPoolsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/new");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit new page again with server pools
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.visit("/admin/room_types/new");

    cy.wait("@serverPoolsRequest");

    cy.get('[data-test="server-pool-dropdown"]').click();

    // Check with 401 error when switching pages
    cy.intercept("GET", "api/v1/serverPools*", {
      statusCode: 401,
    }).as("serverPoolsRequest");

    cy.get(".multiselect__content")
      .eq(0)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="next-page-button"]').click();
      });

    cy.wait("@serverPoolsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
