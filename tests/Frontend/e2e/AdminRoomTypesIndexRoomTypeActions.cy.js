import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin room types index room type actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRoomTypesIndexRequests();

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
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

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
          });
      });

    cy.get('[data-test="replacement-room-type-dropdown"]').click();
    cy.get('[data-test="replacement-room-type-dropdown-items"]').should(
      "be.visible",
    );
    cy.get('[data-test="replacement-room-type-dropdown-option"]')
      .eq(0)
      .should("have.text", "admin.room_types.delete.no_replacement")
      .and("have.attr", "aria-selected", "true")
      .click();

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

    // Check that room type was deleted
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .should("include.text", "Lecture");

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Meeting");

    // Check that dialog is closed
    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    // Reopen dialog for different room type
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .find('[data-test="room-types-delete-button"]')
      .click();

    // Check that replacement room types are loaded
    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="room-types-delete-dialog"]')
      .should("include.text", "admin.room_types.delete.title")
      .should(
        "include.text",
        'admin.room_types.delete.confirm_{"name":"Meeting"}',
      );
  });

  it("delete room type with replacement", function () {
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

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
          4,
        );

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(1)
          .should("have.text", "Lecture");

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(2)
          .should("have.text", "Meeting");

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(3)
          .should("have.text", "Seminar");

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(2)
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

    // Check that room type was deleted
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .should("include.text", "Lecture");

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Meeting");

    // Check that dialog is closed
    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");
  });

  it("delete room type errors", function () {
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

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
    cy.get('[data-test="replacement-room-type-dropdown-option"]').eq(2).click();

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

    // Check with 404 error
    cy.fixture("roomTypes.json").then((roomTypes) => {
      roomTypes.data = roomTypes.data.filter((roomType) => roomType.id !== 3);

      cy.intercept("GET", "api/v1/roomTypes", {
        statusCode: 200,
        body: roomTypes,
      }).as("roomTypesRequest");
    });

    cy.intercept("DELETE", "api/v1/roomTypes/3", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("deleteRoomTypeRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoomTypeRequest");

    // Check that room types get reloaded
    cy.wait("@roomTypesRequest");

    // Check that dialog is closed
    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Check that room type is not there anymore
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .should("include.text", "Lecture");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Meeting");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

    // Check that replacement room types are loaded
    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    // Check with 401 error
    cy.intercept("DELETE", "api/v1/roomTypes/1", {
      statusCode: 401,
    }).as("deleteRoomTypeRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoomTypeRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load replacement room types errors", function () {
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

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

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

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

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

    cy.wait("@replacementRoomTypesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("open add new room type page", function () {
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.interceptAdminRoomTypesNewRequests();

    cy.get('[data-test="room-types-add-button"]').click();

    cy.url().should("include", "/admin/room_types/new");
  });

  it("open edit room type page", function () {
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.interceptAdminRoomTypesViewRequests();

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-edit-button"]')
      .click();

    cy.url().should("include", "/admin/room_types/3/edit");
  });

  it("open view room type page", function () {
    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.interceptAdminRoomTypesViewRequests();

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-view-button"]')
      .click();

    cy.url().should("include", "/admin/room_types/3");
    cy.url().should("not.include", "/edit");
  });
});
