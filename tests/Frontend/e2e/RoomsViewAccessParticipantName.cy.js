import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms View access participant name", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("rooms view with participant name errors", function () {
    // Check as guest user (room does not require an access code)
    cy.intercept("GET", "api/v1/currentUser", {});

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.first_and_lastname").should("be.visible");
        cy.get("#participant-name").should("be.visible").and("have.value", "");
        cy.contains("rooms.remember_participant_name").should("be.visible");
        cy.get("#remember-participant-name").and("not.be.checked");
      });

    // Check that access code input is not shown
    cy.get('[data-test="access-code-field"]').should("not.exist");

    // Check with 422 error
    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 422,
      body: {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      },
    }).as("checkParticipantNameRequest");

    cy.get("#participant-name").type('<script>alert("HI");</script>');

    // Click login button
    cy.get('[data-test="room-login-button"]')
      .should("have.text", "rooms.continue_as_guest")
      .click();

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: '<script>alert("HI");</script>',
      });
    });

    // Check that access overlay is still shown and error message is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"]')
      .contains('Name contains the following non-permitted characters: <>";')
      .should("be.visible");

    // Check with 500 error
    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("checkParticipantNameRequest");

    cy.get("#participant-name").clear();
    cy.get("#participant-name").type("Laura Rivera");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "Laura Rivera",
      });
    });

    // Check that access overlay stays open and error message is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check as guest user (room requires an access code)
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.first_and_lastname").should("be.visible");
        cy.get("#participant-name").should("be.visible").and("have.value", "");
        cy.contains("rooms.remember_participant_name").should("be.visible");
        cy.get("#remember-participant-name").and("not.be.checked");
      });

    // Check that access code input is shown
    cy.get('[data-test="access-code-field"]').should("be.visible");

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 422,
      body: {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      },
    }).as("checkParticipantNameRequest");

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 422,
      body: {
        message: "The Access code field is required.",
        errors: {
          access_code: ["The Access code field is required."],
        },
      },
    }).as("roomAuthRequest");

    cy.get("#participant-name").type('<script>alert("HI");</script>');

    // Click login button
    cy.get('[data-test="room-login-button"]')
      .should("have.text", "rooms.continue_as_guest")
      .click();

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: '<script>alert("HI");</script>',
      });
    });

    // Check that access code overlay is still shown and error message is still there
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"]')
      .contains('Name contains the following non-permitted characters: <>";')
      .should("be.visible");

    // Check that room auth request was not sent and access code error is not shown
    cy.get("@roomAuthRequest").should("be.null");

    cy.get('[data-test="access-code-field"]')
      .contains("The Access code field is required.")
      .should("not.exist");
  });

  it("rooms view with invalid remembered participant name in localStorage", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.localStorage.setItem(
        "pilos_guest_name",
        '<script>alert("HI");</script>',
      );
    });

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 422,
      body: {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      },
    }).as("checkParticipantNameRequest");

    cy.visit("/rooms/abc-def-123");

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: '<script>alert("HI");</script>',
      });
    });
    cy.wait("@roomRequest");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", '<script>alert("HI");</script>');
        cy.contains(
          'Name contains the following non-permitted characters: <>";',
        ).should("be.visible");
      });

    // Check that localStorage was cleared
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("unexpectedRoomAuthRequest");

    // Reinitializing with an access code
    cy.window().then((win) => {
      win.location.hash = "accessCode=123456789";
    });

    cy.wait("@roomRequest");

    cy.get("@unexpectedRoomAuthRequest").should("be.null");
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#participant-name").should(
      "have.value",
      '<script>alert("HI");</script>',
    );
    cy.get("#access-code").should("have.value", "123-456-789");

    cy.window().then((win) => {
      win.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("checkParticipantNameRequest");

    cy.reload();

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "Laura Rivera",
      });
    });
    cy.wait("@roomRequest");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Laura Rivera");
      });

    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.eq(
        "Laura Rivera",
      );
    });

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 204,
    }).as("checkParticipantNameRequest");

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash = "accessCode=123456789";
    });

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "Laura Rivera",
      });
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "123456789",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    cy.get('[data-test="room-access-overlay"]').should("not.exist");
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
  });

  it("rooms view with remembered participant name after logout", function () {
    cy.interceptRoomFilesRequest();

    cy.window().then((win) => {
      win.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    const checkParticipantNameRequest = interceptIndefinitely(
      "POST",
      "api/v1/participantName/check",
      {
        statusCode: 204,
      },
      "checkParticipantNameRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    cy.checkToastMessage("rooms.require_access_code");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#participant-name")
      .should("have.value", "")
      .and("be.disabled")
      .then(() => {
        checkParticipantNameRequest.sendResponse();
      });

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "Laura Rivera",
      });
    });

    cy.get("#participant-name")
      .should("have.value", "Laura Rivera")
      .and("not.be.disabled");
    cy.get("#remember-participant-name").should("be.checked");
    cy.get('[data-test="access-code-field"]').should("be.visible");
  });

  it("change participant name as guest", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Enter guest name
    cy.get("#participant-name").type("Laura Rivera");

    const checkParticipantNameRequest = interceptIndefinitely(
      "POST",
      "api/v1/participantName/check",
      {
        statusCode: 204,
      },
      "checkParticipantNameRequest",
    );

    cy.get('[data-test="room-login-button"]')
      .should("have.text", "rooms.continue_as_guest")
      .click();

    // Check loading
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="room-login-button"]')
          .should("be.disabled")
          .then(() => {
            checkParticipantNameRequest.sendResponse();
          });
      });

    cy.wait("@checkParticipantNameRequest");

    // Check that room access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Check that name was not set in local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Open change name dialog
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .and("have.text", "rooms.change_participant_name")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .and("contain.text", "rooms.change_participant_name")
      .within(() => {
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.first_and_lastname").should("be.visible");

            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "Laura Rivera");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("not.be.checked");
          });

        // Check buttons
        cy.get('[data-test="dialog-cancel-button"]')
          .should("be.visible")
          .and("have.text", "app.cancel");
        cy.get('[data-test="dialog-save-button"]')
          .should("be.visible")
          .and("have.text", "app.save");

        // Change participant name
        cy.get("#participant-name").clear();
        cy.get("#participant-name").type("Max Doe");

        // Cancel
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Check that dialog was closed
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    // Check that participant name is still the same
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");

    // Check that name was not set in local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Open dialog again and change name
    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .and("contain.text", "rooms.change_participant_name")
      .within(() => {
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.first_and_lastname").should("be.visible");

            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "Laura Rivera");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("not.be.checked");
          });

        // Change participant name
        cy.get("#participant-name").clear();
        cy.get("#participant-name").type("Max Doe");

        cy.intercept("POST", "api/v1/participantName/check", {
          statusCode: 204,
        }).as("checkParticipantNameRequest");

        // Save
        cy.get('[data-test="dialog-save-button"]').click();
      });

    cy.wait("@checkParticipantNameRequest");

    // Check that dialog was closed
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    // Check that name was not set in local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Check that participant name is updated
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");

    // Open dialog again and check that input is prefilled with the current name
    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Max Doe");
        cy.get("#remember-participant-name").and("not.be.checked");
      });

    // Reload room with guest name set in localStorage
    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.reload();

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Open change name dialog and change name
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "Laura Rivera");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("be.checked");
          });

        // Change participant name
        cy.get("#participant-name").clear();
        cy.get("#participant-name").type("Max Doe");

        // Save
        cy.get('[data-test="dialog-save-button"]').click();
      });

    cy.wait("@checkParticipantNameRequest");

    // Check that dialog was closed
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    // Check that name saved in localStorage was updated
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.eq("Max Doe");
    });

    // Check that participant name is updated
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");

    // Open dialog again and check that input is prefilled with the current name
    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Max Doe");
        cy.get("#remember-participant-name").and("be.checked");
      });
  });

  it("change remember participant name as guest", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Enter guest name
    cy.get("#participant-name").type("Laura Rivera");

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 204,
    }).as("checkParticipantNameRequest");

    cy.get('[data-test="room-login-button"]')
      .should("have.text", "rooms.continue_as_guest")
      .click();

    cy.wait("@checkParticipantNameRequest");

    // Check that room access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Check that name was not set in local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Open change name dialog
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .and("have.text", "rooms.change_participant_name")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]').within(() => {
      cy.get('[data-test="participant-name-field"]')
        .should("be.visible")
        .within(() => {
          cy.contains("rooms.first_and_lastname").should("be.visible");

          cy.get("#participant-name")
            .should("be.visible")
            .and("have.value", "Laura Rivera");
          cy.contains("rooms.remember_participant_name").should("be.visible");
          cy.get("#remember-participant-name").and("not.be.checked");
        });

      // Change remember participant name checkbox
      cy.get("#remember-participant-name").check();

      // Save
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait("@checkParticipantNameRequest");

    // Check that dialog was closed
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    // Check that participant name is still the same
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");

    // Check that name was set in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.equal(
        "Laura Rivera",
      );
    });

    // Open dialog again and change remember participant name again
    cy.get('[data-test="change-participant-name-button"]').click();

    cy.get('[data-test="room-change-participant-name-dialog"]').within(() => {
      cy.get('[data-test="participant-name-field"]')
        .should("be.visible")
        .within(() => {
          cy.contains("rooms.first_and_lastname").should("be.visible");

          cy.get("#participant-name")
            .should("be.visible")
            .and("have.value", "Laura Rivera");
          cy.contains("rooms.remember_participant_name").should("be.visible");
          cy.get("#remember-participant-name").and("be.checked");
        });

      // Change remember participant name checkbox
      cy.get("#remember-participant-name").uncheck();

      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait("@checkParticipantNameRequest");

    // Check that dialog was closed
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    // Check that name was removed from localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Check that participant name is the same
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");

    // Open dialog again and check that input is prefilled with the current name and remember state is correct
    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Laura Rivera");
        cy.get("#remember-participant-name").and("not.be.checked");
      });

    // Reload room with guest name set in localStorage
    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.reload();

    cy.wait("@checkParticipantNameRequest");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Open change name dialog and change remember participant name
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="change-participant-name-button"]').click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "Laura Rivera");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("be.checked");
          });

        // Change remember participant name checkbox
        cy.get("#remember-participant-name").uncheck();

        // Save
        cy.get('[data-test="dialog-save-button"]').click();
      });

    cy.wait("@checkParticipantNameRequest");

    // Check that dialog was closed
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    // Check that name was removed from localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Check that participant name stays the same
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");

    // Open dialog again and check that input is prefilled with the current name
    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Laura Rivera");
        cy.get("#remember-participant-name").and("not.be.checked");
      });
  });

  it("change participant name with errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@checkParticipantNameRequest");
    cy.wait("@roomRequest");

    // Check that room access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Open change name dialog
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "be.visible",
    );

    // Change name with 422 error
    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 422,
      body: {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      },
    }).as("checkParticipantNameRequest");

    cy.get('[data-test="participant-name-field"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Laura Rivera");
        cy.contains("rooms.remember_participant_name").should("be.visible");
        cy.get("#remember-participant-name").and("be.checked");
      });

    cy.get("#participant-name").clear();
    cy.get("#participant-name").type('<script>alert("HI");</script>');

    // Try to save invalid name
    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: '<script>alert("HI");</script>',
      });
    });

    // Check that dialog stays open and error message is shown
    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="participant-name-field"]')
          .contains(
            'Name contains the following non-permitted characters: <>";',
          )
          .should("be.visible");

        // Cancel
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Check that participant name is still the same
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");

    // Check that name in localStorage is still the same
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.eq(
        "Laura Rivera",
      );
    });

    // Open dialog again and check that the current participant name is shown again
    cy.get('[data-test="change-participant-name-button"]')
      .should("be.visible")
      .click();

    cy.get('[data-test="room-change-participant-name-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#participant-name")
          .should("be.visible")
          .and("have.value", "Laura Rivera");
        cy.get("#remember-participant-name").and("be.checked");
      });

    // Check with 500 error
    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("checkParticipantNameRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@checkParticipantNameRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "Laura Rivera",
      });
    });

    // Check dialog stays open and error message is shown
    cy.get('[data-test="room-change-participant-name-dialog"]').should(
      "be.visible",
    );

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
  });
});
