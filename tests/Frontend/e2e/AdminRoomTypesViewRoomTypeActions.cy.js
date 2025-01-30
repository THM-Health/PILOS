import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin room types view room type actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRoomTypesViewRequests();

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

  it("delete room type without replacement", function () {
    cy.intercept("GET", "api/v1/roomTypes", {
      fixture: "roomTypes.json",
    }).as("roomTypesRequest");

    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-types-delete-button"]').click();

    // Check that replacement room types are loaded
    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="room-types-delete-dialog"]')
      .should("include.text", "admin.room_types.delete.title")
      .should("include.text", 'admin.room_types.delete.confirm_{"name":"Exam"}')
      .within(() => {
        cy.get('[data-test="replacement-room-type-field"]')
          .should("be.visible")
          .and("include.text", "admin.room_types.delete.replacement")
          .and("include.text", "admin.room_types.delete.replacement_info")
          .within(() => {
            cy.get('[data-test="replacement-room-type-dropdown"]').should(
              "have.text",
              "admin.room_types.delete.no_replacement",
            );

            cy.get('[data-test="replacement-room-type-dropdown"]').within(
              () => {
                cy.get(".p-select-label").should(
                  "not.have.attr",
                  "aria-disabled",
                  "true",
                );
              },
            );
          });
      });

    // Confirm delete of room type
    const deleteRoomTypeRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/roomTypes/3",
      { statusCode: 204 },
      "deleteRoomTypeRequest",
    );

    cy.fixture("roomTypes.json").then((roomTypes) => {
      roomTypes.data = roomTypes.data.filter((roomType) => roomType.id !== 3);

      cy.intercept("GET", "api/v1/roomTypes", {
        statusCode: 200,
        body: roomTypes,
      }).as("roomTypesRequest");
    });

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    // Check loading
    cy.get('[data-test="replacement-room-type-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .and("be.disabled");

    cy.get('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        deleteRoomTypeRequest.sendResponse();
      });

    cy.wait("@deleteRoomTypeRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        replacement_room_type: null,
      });
    });
    cy.wait("@roomTypesRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/room_types/3");
    cy.url().should("include", "/admin/room_types");
  });

  it("delete room type with replacement", function () {
    cy.intercept("GET", "api/v1/roomTypes", {
      fixture: "roomTypes.json",
    }).as("roomTypesRequest");

    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-types-delete-button"]').click();

    // Check that replacement room types are loaded
    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="replacement-room-type-dropdown-items"]').should(
      "not.exist",
    );

    cy.get('[data-test="room-types-delete-dialog"]')
      .should("include.text", 'admin.room_types.delete.confirm_{"name":"Exam"}')
      .within(() => {
        cy.get('[data-test="replacement-room-type-field"]')
          .should("be.visible")
          .within(() => {
            cy.get('[data-test="replacement-room-type-dropdown"]')
              .should("have.text", "admin.room_types.delete.no_replacement")
              .click();
          });
      });

    // Check that replacement room types are shown correctly
    cy.get('[data-test="replacement-room-type-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test = "replacement-room-type-dropdown-option"]').should(
          "have.length",
          3,
        );

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(0)
          .should("have.text", "Lecture");

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(1)
          .should("have.text", "Meeting");

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(2)
          .should("have.text", "Seminar");

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(1)
          .click();
      });

    cy.get('[data-test="replacement-room-type-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="replacement-room-type-dropdown"]').should(
      "have.text",
      "Meeting",
    );

    // Confirm delete of room type
    cy.intercept("DELETE", "api/v1/roomTypes/3", {
      statusCode: 204,
    }).as("deleteRoomTypeRequest");

    cy.fixture("roomTypes.json").then((roomTypes) => {
      roomTypes.data = roomTypes.data.filter((roomType) => roomType.id !== 3);

      cy.intercept("GET", "api/v1/roomTypes", {
        statusCode: 200,
        body: roomTypes,
      }).as("roomTypesRequest");
    });

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    // Check that replacement room type was sent correctly
    cy.wait("@deleteRoomTypeRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        replacement_room_type: 2,
      });
    });
    cy.wait("@roomTypesRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/room_types/3");
    cy.url().should("include", "/admin/room_types");
  });

  it("delete room type errors", function () {
    cy.intercept("GET", "api/v1/roomTypes", {
      fixture: "roomTypes.json",
    }).as("roomTypesRequest");

    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-types-delete-button"]').click();

    // Check that replacement room types are loaded
    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    // Check with 422 error (replacement room type needed)
    cy.intercept("DELETE", "api/v1/roomTypes/3", {
      statusCode: 422,
      body: {
        message:
          "Replacement room type required! Rooms are still assigned to this room type.",
        errors: {
          replacement_room_type: [
            "Replacement room type required! Rooms are still assigned to this room type.",
          ],
        },
      },
    }).as("deleteRoomTypeRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoomTypeRequest");

    // Check that dialog stays open and error message is shown
    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");
    cy.get('[data-test="replacement-room-type-field"]').should(
      "include.text",
      "Replacement room type required! Rooms are still assigned to this room type.",
    );

    // Select replacement room type
    cy.get('[data-test="replacement-room-type-dropdown"]').click();
    cy.get('[data-test="replacement-room-type-dropdown-option"]').eq(1).click();

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/roomTypes/3", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteRoomTypeRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoomTypeRequest");

    // Check that dialog is still open and that error message is shown
    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error message is hidden
    cy.get('[data-test="replacement-room-type-field"]').should(
      "not.include.text",
      "Replacement room type required! Rooms are still assigned to this room type.",
    );

    // Check with 401 error
    cy.intercept("DELETE", "api/v1/roomTypes/3", {
      statusCode: 401,
    }).as("deleteRoomTypeRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoomTypeRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/3");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load replacement room types errors", function () {
    cy.visit("/admin/room_types/3");

    cy.wait("@roomTypeRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    // Check with 500 error
    const replacementRoomTypesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roomTypes*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "replacementRoomTypesRequest",
    );

    cy.get('[data-test="room-types-delete-button"]').click();

    // Check loading
    cy.get('[data-test="replacement-room-type-dropdown"]').within(() => {
      cy.get(".p-select-label")
        .should("have.attr", "aria-disabled", "true")
        .then(() => {
          replacementRoomTypesRequest.sendResponse();
        });
    });

    cy.wait("@replacementRoomTypesRequest");

    // Check that dialog is still open and that error message is shown
    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dropdown is disabled
    cy.get('[data-test="replacement-room-type-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    // Reload with correct data
    cy.intercept("GET", "api/v1/roomTypes*", {
      statusCode: 200,
      fixture: "roomTypes.json",
    }).as("replacementRoomTypesRequest");

    cy.get('[data-test="replacement-room-types-reload-button"]')
      .should("be.visible")
      .click();

    cy.wait("@replacementRoomTypesRequest");

    // Check that dropdown is enabled again
    cy.get('[data-test="replacement-room-type-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="replacement-room-types-reload-button"]').should(
      "not.exist",
    );

    // Close dialog and open again with 401 error
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.intercept("GET", "api/v1/roomTypes*", {
      statusCode: 401,
    }).as("replacementRoomTypesRequest");

    cy.get('[data-test="room-types-delete-button"]').click();

    cy.wait("@replacementRoomTypesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types/3");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("switch between edit and view", function () {
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
      }).as("roomTypeRequest");
    });

    cy.visit("/admin/room_types/3/edit");

    cy.wait("@roomTypeRequest");
    cy.wait("@serverPoolsRequest");
    cy.wait("@rolesRequest");

    // Check values and change them
    cy.get("#room-type-name").should("have.value", "Exam").clear();
    cy.get("#room-type-name").type("Exam 01");

    cy.get("#description")
      .should("have.value", "Room type description for room type Exam")
      .clear();
    cy.get("#description").type(
      "New room type description for room type Exam 01",
    );

    cy.get("#custom-color").should("have.value", "#4a5c66").clear();
    cy.get("#custom-color").type("#ef4444");

    cy.get('[data-test="server-pool-dropdown"]').within(() => {
      cy.get(".multiselect__tags").should("include.text", "Test");
    });
    cy.get('[data-test="server-pool-dropdown"]').click();
    cy.get(".multiselect__content")
      .eq(0)
      .should("be.visible")
      .within(() => {
        cy.get(".multiselect__option").should("have.length", 4);

        cy.get(".multiselect__option").eq(1).click();
      });

    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 2);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("include.text", "Superuser")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .should("include.text", "Staff")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
    });

    cy.get("#restrict").should("be.checked").click();

    cy.get('[data-test="role-field"]').should("not.exist");

    cy.get("#max-participants").should("have.value", "100").clear();
    cy.get("#max-participants").type("50");

    cy.get("#max-duration").should("have.value", "120 min.").clear();
    cy.get("#max-duration").type("60");
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "has-access-code",
      true,
      false,
      false,
    );
    cy.get("#has-access-code-default").click();
    cy.get('[data-test="has-access-code-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "allow-guests",
      true,
      true,
      false,
    );
    cy.get("#allow-guests-default").click();
    cy.get('[data-test="allow-guests-enforced"]').click();

    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "everyone-can-start",
      false,
      false,
      false,
    );
    cy.get("#everyone-can-start-default").click();
    cy.get('[data-test="everyone-can-start-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "mute-on-start",
      true,
      true,
      false,
    );
    cy.get("#mute-on-start-default").click();
    cy.get('[data-test="mute-on-start-enforced"]').click();
    cy.get("#lobby-only-for-guests").should("be.checked");
    cy.get("#lobby-disabled").click();
    cy.get('[data-test="lobby-enforced"]').click();

    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "record-attendance",
      false,
      false,
      false,
    );
    cy.get("#record-attendance-default").click();
    cy.get('[data-test="record-attendance-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "record",
      false,
      false,
      false,
    );

    cy.get("#record-default").click();
    cy.get('[data-test="record-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "auto-start-recording",
      false,
      false,
      false,
    );
    cy.get("#auto-start-recording-default").click();
    cy.get('[data-test="auto-start-recording-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-cam",
      false,
      false,
      false,
    );
    cy.get("#disable-cam-default").click();
    cy.get('[data-test="disable-cam-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "webcams-only-for-moderator",
      true,
      false,
      false,
    );
    cy.get("#webcams-only-for-moderator-default").click();
    cy.get('[data-test="webcams-only-for-moderator-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-mic",
      false,
      true,
      false,
    );
    cy.get("#disable-mic-default").click();
    cy.get('[data-test="disable-mic-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-public-chat",
      true,
      false,
      false,
    );
    cy.get("#disable-public-chat-default").click();
    cy.get('[data-test="disable-public-chat-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-private-chat",
      false,
      false,
      false,
    );
    cy.get("#disable-private-chat-default").click();
    cy.get('[data-test="disable-private-chat-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-note",
      true,
      true,
      false,
    );
    cy.get("#disable-note-default").click();
    cy.get('[data-test="disable-note-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "hide-user-list",
      true,
      false,
      false,
    );
    cy.get("#hide-user-list-default").click();
    cy.get('[data-test="hide-user-list-enforced"]').click();
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "allow-membership",
      false,
      true,
      false,
    );
    cy.get("#allow-membership-default").click();
    cy.get('[data-test="allow-membership-enforced"]').click();

    cy.get('[data-test="default-role-default-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true");

    cy.get('[data-test="default-role-default-button"]').eq(1).click();
    cy.get('[data-test="default-role-enforced"]').click();
    cy.get('[data-test="visibility-default-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true");
    cy.get('[data-test="visibility-default-button"]').eq(0).click();
    cy.get('[data-test="visibility-enforced"]').click();

    cy.get("#create-parameters")
      .should(
        "have.value",
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      )
      .clear();

    cy.get("#create-parameters").type("meetingLayout=PRESENTATION_FOCUS");

    // Check that save button is shown
    cy.get('[data-test="room-types-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="room-types-cancel-edit-button"]').click();

    // Check if redirect worked
    cy.url().should("include", "/admin/room_types/3");
    cy.url().should("not.include", "/edit");

    cy.wait("@roomTypeRequest");

    // Check that changes were not saved
    cy.get("#room-type-name").should("have.value", "Exam").and("be.disabled");
    cy.get("#description")
      .should("have.value", "Room type description for room type Exam")
      .and("be.disabled");
    cy.get("#custom-color").should("have.value", "#4a5c66").and("be.disabled");
    cy.get('[data-test="server-pool-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .within(() => {
        cy.get(".multiselect__tags").should("include.text", "Test");
      });

    cy.get('[data-test="role-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="role-chip"]').should("have.length", 2);
        cy.get('[data-test="role-chip"]')
          .eq(0)
          .should("include.text", "Superuser")
          .find('[data-test="remove-role-button"]')
          .should("not.exist");

        cy.get('[data-test="role-chip"]')
          .eq(1)
          .should("include.text", "Staff")
          .find('[data-test="remove-role-button"]')
          .should("not.exist");
      });
    cy.get("#restrict").should("be.checked").and("be.disabled");
    cy.get("#max-participants").should("have.value", "100").and("be.disabled");
    cy.get("#max-duration").should("have.value", "120 min.").and("be.disabled");

    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "has-access-code",
      true,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "allow-guests",
      true,
      true,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "everyone-can-start",
      false,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "mute-on-start",
      true,
      true,
      true,
    );
    cy.get("#lobby-disabled").should("not.be.checked").and("be.disabled");
    cy.get("#lobby-enabled").should("not.be.checked").and("be.disabled");
    cy.get("#lobby-only-for-guests").should("be.checked").and("be.disabled");
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "record-attendance",
      false,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "record",
      false,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "auto-start-recording",
      false,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-cam",
      false,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "webcams-only-for-moderator",
      true,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-mic",
      false,
      true,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-public-chat",
      true,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-private-chat",
      false,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-note",
      true,
      true,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "hide-user-list",
      true,
      false,
      true,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "allow-membership",
      false,
      true,
      true,
    );

    cy.get('[data-test="default-role-default-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true")
      .and("be.disabled");

    cy.get('[data-test="default-role-default-button"]')
      .eq(1)
      .should("not.have.attr", "aria-pressed", "true")
      .and("be.disabled");

    cy.get('[data-test="visibility-default-button"]')
      .eq(0)
      .should("not.have.attr", "aria-pressed", "true")
      .and("be.disabled");

    cy.get('[data-test="visibility-default-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true")
      .and("be.disabled");

    cy.get("#create-parameters")
      .should(
        "have.value",
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      )
      .and("be.disabled");

    // Check that save button is not visible
    cy.get('[data-test="room-types-save-button"]').should("not.exist");

    // Switch back to edit page
    cy.get('[data-test="room-types-edit-button"]').click();

    // Check if redirect worked
    cy.url().should("include", "/admin/room_types/3/edit");

    cy.wait("@roomTypeRequest");
    cy.wait("@serverPoolsRequest");
    cy.wait("@rolesRequest");

    // Check that original values are shown
    cy.get("#room-type-name")
      .should("have.value", "Exam")
      .and("not.be.disabled");
    cy.get("#description")
      .should("have.value", "Room type description for room type Exam")
      .and("not.be.disabled");
    cy.get("#custom-color")
      .should("have.value", "#4a5c66")
      .and("not.be.disabled");
    cy.get('[data-test="server-pool-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .within(() => {
        cy.get(".multiselect__tags").should("include.text", "Test");
      });

    cy.get('[data-test="role-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="role-chip"]').should("have.length", 2);
        cy.get('[data-test="role-chip"]')
          .eq(0)
          .should("include.text", "Superuser")
          .find('[data-test="remove-role-button"]')
          .should("be.visible");

        cy.get('[data-test="role-chip"]')
          .eq(1)
          .should("include.text", "Staff")
          .find('[data-test="remove-role-button"]')
          .should("be.visible");
      });
    cy.get("#restrict").should("be.checked").and("not.be.disabled");
    cy.get("#max-participants")
      .should("have.value", "100")
      .and("not.be.disabled");
    cy.get("#max-duration")
      .should("have.value", "120 min.")
      .and("not.be.disabled");

    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "has-access-code",
      true,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "allow-guests",
      true,
      true,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "everyone-can-start",
      false,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "mute-on-start",
      true,
      true,
      false,
    );
    cy.get("#lobby-disabled").should("not.be.checked").and("not.be.disabled");
    cy.get("#lobby-enabled").should("not.be.checked").and("not.be.disabled");
    cy.get("#lobby-only-for-guests")
      .should("be.checked")
      .and("not.be.disabled");
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "record-attendance",
      false,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "record",
      false,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "auto-start-recording",
      false,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-cam",
      false,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "webcams-only-for-moderator",
      true,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-mic",
      false,
      true,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-public-chat",
      true,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-private-chat",
      false,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "disable-note",
      true,
      true,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "hide-user-list",
      true,
      false,
      false,
    );
    cy.roomTypeCheckDefaultRoomSettingCheckboxField(
      "allow-membership",
      false,
      true,
      false,
    );

    cy.get('[data-test="default-role-default-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    cy.get('[data-test="default-role-default-button"]')
      .eq(1)
      .should("not.have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    cy.get('[data-test="visibility-default-button"]')
      .eq(0)
      .should("not.have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    cy.get('[data-test="visibility-default-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "true")
      .and("not.be.disabled");

    cy.get("#create-parameters")
      .should(
        "have.value",
        "meetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds",
      )
      .and("not.be.disabled");

    // Check that save button is shown
    cy.get('[data-test="room-types-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });
});
