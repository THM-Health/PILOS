import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view recordings recording actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequests();

    cy.window().then((win) => {
      win.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });
  });

  it("view recording", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    // Click on view recording button
    cy.get('[data-test="room-recordings-view-dialog"]').should("not.exist");
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    // Check if the dialog is open and links are shown correctly
    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .and("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20 - 08/17/2022, 11:40")
      .within(() => {
        cy.get('[data-test="notes-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.notes")
          .and(
            "have.attr",
            "href",
            "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/1",
          )
          .and("have.attr", "rel", "opener")
          .and("have.attr", "target", "_blank");
        cy.get('[data-test="podcast-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.podcast")
          .and(
            "have.attr",
            "href",
            "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/2",
          )
          .and("have.attr", "rel", "opener")
          .and("have.attr", "target", "_blank");
        cy.get('[data-test="presentation-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.presentation")
          .and(
            "have.attr",
            "href",
            "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/3",
          )
          .and("have.attr", "rel", "opener")
          .and("have.attr", "target", "_blank");
        cy.get('[data-test="screenshare-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.screenshare")
          .and(
            "have.attr",
            "href",
            "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/4",
          )
          .and("have.attr", "rel", "opener")
          .and("have.attr", "target", "_blank");
      });
  });

  it("view recording with access code", function () {
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
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.visit("/rooms/abc-def-123#accessCode=123456789&tab=recordings");

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    // Check that links are shown correctly in the dialog
    cy.get('[data-test="notes-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.notes")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/1?room_auth_token=roomAuthToken&room_auth_token_type=0",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
    cy.get('[data-test="podcast-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.podcast")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/2?room_auth_token=roomAuthToken&room_auth_token_type=0",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
    cy.get('[data-test="presentation-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.presentation")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/3?room_auth_token=roomAuthToken&room_auth_token_type=0",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
    cy.get('[data-test="screenshare-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.screenshare")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/4?room_auth_token=roomAuthToken&room_auth_token_type=0",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
  });

  it("view recording with access code errors", function () {
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
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.visit("/rooms/abc-def-123#accessCode=123456789&tab=recordings");

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Check with invalid_auth_token error
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then(($window) => {
      const message = {
        type: "invalid_auth_token",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that room auth token is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Reload (without setting room auth token)
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Check require_code error
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then(($window) => {
      const message = {
        type: "require_code",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that room auth token is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.require_access_code");

    cy.contains("rooms.flash.access_code_invalid").should("not.exist");
    cy.get("#access-code").should("have.value", "");
  });

  it("view recording with personalized link", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
    );

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    // Check that links are shown correctly in the dialog
    cy.get('[data-test="notes-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.notes")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/1?room_auth_token=roomAuthToken&room_auth_token_type=1",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
    cy.get('[data-test="podcast-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.podcast")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/2?room_auth_token=roomAuthToken&room_auth_token_type=1",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
    cy.get('[data-test="presentation-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.presentation")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/3?room_auth_token=roomAuthToken&room_auth_token_type=1",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
    cy.get('[data-test="screenshare-button"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.format_types.screenshare")
      .and(
        "have.attr",
        "href",
        "https://example.com/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/4?room_auth_token=roomAuthToken&room_auth_token_type=1",
      )
      .and("have.attr", "rel", "opener")
      .and("have.attr", "target", "_blank");
  });

  it("view recording with personalized link errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.total = 1;
      roomRecordings.meta.total_no_filter = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&tab=recordings",
    );

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Check with invalid_auth_token error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_personalized_link",
      },
    }).as("roomAuthRequest");

    cy.window().then(($window) => {
      const message = {
        type: "invalid_auth_token",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    cy.wait("@roomAuthRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_invalid");

    cy.contains("rooms.invalid_personalized_link").should("be.visible");

    // Check with guests only error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.reload();

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    cy.window().then(($window) => {
      const message = {
        type: "guests_only",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that the error message is shown
    cy.checkToastMessage("app.flash.guests_only");

    // Check that redirected to home page
    cy.url()
      .should("not.include", "/rooms/abc-def-123")
      .and("not.include", "/rooms");
  });

  it("view recording with errors", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    // Check with file_not_found error (recording not found / already deleted)
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 3);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.window().then(($window) => {
      const message = {
        type: "file_not_found",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check recordings are reloaded
    cy.wait("@roomRecordingsRequest");

    // Check that error message is shown and that recording is not shown anymore
    cy.checkToastMessage("rooms.flash.recording_gone");
    cy.get('[data-test="room-recording-item"]').should("have.length", 3);
    cy.get('[data-test="room-recordings-view-dialog"]').should("not.exist");

    // Check with not_found error (not found / already deleted)
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 2);
      roomRecordings.meta.to = 2;
      roomRecordings.meta.total = 2;
      roomRecordings.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.window().then(($window) => {
      const message = {
        type: "not_found",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check recordings are reloaded
    cy.wait("@roomRecordingsRequest");

    // Check that error message is shown and that recording is not shown anymore
    cy.checkToastMessage("rooms.flash.recording_gone");
    cy.get('[data-test="room-recording-item"]').should("have.length", 2);
    cy.get('[data-test="room-recordings-view-dialog"]').should("not.exist");

    // Check forbidden error
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 2);
      roomRecordings.meta.total = 2;
      roomRecordings.meta.total_no_filter = 2;
      roomRecordings.meta.to = 2;

      cy.intercept("api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      const reloadRoomRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123",
        {
          statusCode: 200,
          body: room,
        },
        "reloadRoomRequest",
      );

      cy.window().then(($window) => {
        const message = {
          type: "forbidden",
        };
        $window.postMessage(message, Cypress.config("baseUrl"));
      });

      // Check that recordings are reloaded (because of error handling)
      cy.wait("@roomRecordingsRequest");

      cy.checkToastMessage("rooms.flash.recording_forbidden");
      cy.get('[data-test="room-recording-item"]').should("have.length", 2);

      // Check that rest of the page is not yet updated
      cy.contains("auth.login").should("not.exist");

      cy.fixture("roomRecordings.json").then((roomRecordings) => {
        roomRecordings.data = roomRecordings.data.slice(0, 1);
        roomRecordings.meta.total = 1;
        roomRecordings.meta.total_no_filter = 1;
        roomRecordings.meta.to = 1;

        cy.intercept("api/v1/rooms/abc-def-123/recordings*", {
          statusCode: 200,
          body: roomRecordings,
        })
          .as("roomRecordingsRequest")
          .then(() => {
            reloadRoomRequest.sendResponse();
          });
      });
    });

    // Check that room and recordings are reloaded (because of changes in the room (current_user))
    cy.wait("@reloadRoomRequest");

    // Enter guest name
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#participant-name").type("Max Doe");
    cy.get('[data-test="room-login-button"]').click();
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    cy.wait("@roomRecordingsRequest");

    // Check that recording list was updated again
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);

    // Check that recording details and buttons are shown correctly
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("not.include.text", "rooms.recordings.access_types.everyone")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should("not.exist");
        cy.get('[data-test="recording-format-enabled"]').should("not.exist");
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should("not.exist");
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "not.exist",
        );
      });

    // Check that the rest of the page is updated
    cy.contains("auth.login").should("be.visible");

    // Check guests not allowed error
    cy.window().then(($window) => {
      const message = {
        type: "guests_not_allowed",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequests();

    cy.reload();

    cy.wait("@roomRecordingsRequest");

    // Check with no message
    // Intercept recordings request again to check that it is not reloaded
    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      fixture: "roomRecordings.json",
    }).as("reloadRoomRecordingsRequest");

    cy.window().then(($window) => {
      $window.postMessage(null, Cypress.config("baseUrl"));
    });

    // Check that recordings are still there and toast message is not shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 4);

    cy.get(".p-toast-message").should("not.exist");

    cy.get("@reloadRoomRecordingsRequest").should("be.null");

    // Check with missing type
    cy.window().then(($window) => {
      const message = {};

      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that recordings are still there and toast message is not shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 4);

    cy.get(".p-toast-message").should("not.exist");

    cy.get("@reloadRoomRecordingsRequest").should("be.null");

    cy.window().then(($window) => {
      const message = {
        type: null,
      };

      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that recordings are still there and toast message is not shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 4);

    cy.get(".p-toast-message").should("not.exist");

    cy.get("@reloadRoomRecordingsRequest").should("be.null");

    // Check with different base_url
    cy.fixture("config.json").then((config) => {
      config.data.room.file_terms_of_use = "Test terms of use";
      config.data.general.base_url = "";

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.interceptRoomRecordingsRequests();

    cy.reload();

    cy.wait("@roomRecordingsRequest");

    // Intercept recordings request again to check that it is not reloaded
    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      fixture: "roomRecordings.json",
    }).as("reloadRoomRecordingsRequest");

    cy.window().then(($window) => {
      const message = {
        type: "file_not_found",
      };
      $window.postMessage(message, Cypress.config("baseUrl"));
    });

    // Check that recordings are still there and toast message is not shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 4);

    cy.get(".p-toast-message").should("not.exist");

    cy.get("@reloadRoomRecordingsRequest").should("be.null");
  });

  it("delete recording", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recording-item"]').should("have.length", 4);

    cy.get('[data-test="room-recordings-delete-dialog"]').should("not.exist");
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-delete-button"]')
      .click();
    cy.get('[data-test="room-recordings-delete-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.modals.delete.title")
      .and("include.text", "rooms.recordings.modals.delete.confirm");

    const deleteRecordingRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
      {
        statusCode: 204,
      },
      "deleteRecordingRequest",
    );

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(1, 4);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="room-recordings-delete-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    // Check loading
    cy.get('[data-test="room-recordings-delete-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .should("be.disabled");

    cy.get('[data-test="room-recordings-delete-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .should("be.disabled")
      .then(() => {
        deleteRecordingRequest.sendResponse();
      });

    cy.wait("@deleteRecordingRequest");
    cy.wait("@roomRecordingsRequest");

    // Check that recording was deleted
    cy.get('[data-test="room-recording-item"]').should("have.length", 3);

    // Check that dialog is closed
    cy.get('[data-test="room-recordings-delete-dialog"]').should("not.exist");
  });

  it("delete recording errors", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    // Check with 404 error (recording not found / already deleted)
    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .find('[data-test="room-recordings-delete-button"]')
      .click();

    cy.intercept(
      "DELETE",
      "api/v1/rooms/abc-def-123/recordings/f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775",
      {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "recording",
          ids: ["f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775"],
        },
      },
    ).as("deleteRecordingRequest");

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 3);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomFilesRequest");
    });

    cy.get('[data-test="room-recordings-delete-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.wait("@deleteRecordingRequest");
    cy.wait("@roomFilesRequest");

    // Check that recording is not shown anymore and dialog is closed
    cy.get('[data-test="room-recordings-delete-dialog"]').should("not.exist");
    cy.get('[data-test="room-recording-item"]').should("have.length", 3);

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.recording_gone");

    // Check with 500 error
    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .find('[data-test="room-recordings-delete-button"]')
      .click();

    cy.intercept(
      "DELETE",
      "api/v1/rooms/abc-def-123/recordings/0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("deleteRecordingRequest");

    cy.get('[data-test="room-recordings-delete-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.wait("@deleteRecordingRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dialog stayed open and close it
    cy.get('[data-test="room-recordings-delete-dialog"]').should("be.visible");
    cy.get('[data-test="room-recordings-delete-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .click();

    cy.get('[data-test="room-recordings-delete-dialog"]').should("not.exist");

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-recording-item"]')
          .eq(0)
          .find('[data-test="room-recordings-delete-button"]')
          .click();
        cy.get('[data-test="room-recordings-delete-dialog"]')
          .should("be.visible")
          .find('[data-test="dialog-continue-button"]')
          .click();
      },
      "DELETE",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
      "recordings",
    );

    // Reload room
    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequests();

    cy.reload();
    cy.get("#tab-recordings").should("be.visible").click();

    // Check with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept(
      "DELETE",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
      {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      },
    ).as("deleteRecordingRequest");

    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-delete-button"]')
      .click();

    cy.get('[data-test="room-recordings-delete-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.wait("@deleteRecordingRequest");

    // Check that redirect to room index page worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("edit recording", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recordings-edit-dialog"]').should("not.exist");
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-edit-button"]')
      .click();

    cy.get('[data-test="room-recordings-edit-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.modals.edit.title")
      .and("include.text", "08/17/2022, 11:20 - 08/17/2022, 11:40")
      .within(() => {
        cy.get('[data-test="description-field"]')
          .should("include.text", "rooms.recordings.description")
          .find("#description")
          .should("be.visible")
          .should("have.value", "Recording 1")
          .type(" Test");

        cy.get('[data-test="available-formats-field"]')
          .should("include.text", "rooms.recordings.available_formats")
          .within(() => {
            cy.get('[data-test="format-1-field"]')
              .should("include.text", "rooms.recordings.format_types.notes")
              .find("#format-1")
              .should("be.checked")
              .click();

            cy.get('[data-test="format-2-field"]')
              .should("include.text", "rooms.recordings.format_types.podcast")
              .find("#format-2")
              .should("be.checked")
              .click();

            cy.get('[data-test="format-3-field"]')
              .should(
                "include.text",
                "rooms.recordings.format_types.presentation",
              )
              .find("#format-3")
              .should("be.checked")
              .click();

            cy.get('[data-test="format-4-field"]')
              .should(
                "include.text",
                "rooms.recordings.format_types.screenshare",
              )
              .find("#format-4")
              .should("be.checked");
          });

        cy.get('[data-test="access-field"]')
          .should("include.text", "rooms.recordings.access")
          .within(() => {
            cy.get('[data-test="access-0-field"]')
              .should("include.text", "rooms.recordings.access_types.everyone")
              .find("#access-0")
              .should("be.checked");

            cy.get('[data-test="access-1-field"]')
              .should(
                "include.text",
                "rooms.recordings.access_types.participant",
              )
              .find("#access-1")
              .should("not.be.checked");

            cy.get('[data-test="access-2-field"]')
              .should("include.text", "rooms.recordings.access_types.moderator")
              .find("#access-2")
              .should("not.be.checked");

            cy.get('[data-test="access-3-field"]')
              .should("include.text", "rooms.recordings.access_types.owner")
              .find("#access-3")
              .should("not.be.checked")
              .click();
          });

        const editRecordingRequest = interceptIndefinitely(
          "PUT",
          "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
          {
            statusCode: 204,
          },
          "editRecordingRequest",
        );

        cy.fixture("roomRecordings.json").then((roomRecordings) => {
          roomRecordings.data[0].description = "Recording 1 Test";
          roomRecordings.data[0].access = 3;
          roomRecordings.data[0].formats[0].disabled = true;
          roomRecordings.data[0].formats[1].disabled = true;
          roomRecordings.data[0].formats[2].disabled = true;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
            statusCode: 200,
            body: roomRecordings,
          }).as("roomRecordingsRequest");
        });

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();

        // Check loading
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");

        cy.get("#description").should("be.disabled");
        cy.get("#format-1").should("be.disabled");
        cy.get("#format-2").should("be.disabled");
        cy.get("#format-3").should("be.disabled");
        cy.get("#format-4").should("be.disabled");
        cy.get("#access-0").should("be.disabled");
        cy.get("#access-1").should("be.disabled");
        cy.get("#access-2").should("be.disabled");
        cy.get("#access-3").should("be.disabled");

        cy.get('[data-test="dialog-cancel-button"]')
          .should("have.text", "app.cancel")
          .should("be.disabled")
          .then(() => {
            editRecordingRequest.sendResponse();
          });
      });
    cy.wait("@editRecordingRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        description: "Recording 1 Test",
        access: 3,
        formats: [
          {
            id: 1,
            disabled: true,
          },
          {
            id: 2,
            disabled: true,
          },
          {
            id: 3,
            disabled: true,
          },
          {
            id: 4,
            disabled: false,
          },
        ],
      });
    });

    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recordings-edit-dialog"]').should("not.exist");

    // Check that recording settings were updated
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1 Test")
      .and("include.text", "08/17/2022, 11:20")
      .and("include.text", "20 app.time_formats.minutes")
      .and("include.text", "rooms.recordings.access_types.owner")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          3,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          1,
        );
        cy.get('[data-test="recording-format-disabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.notes");
        cy.get('[data-test="recording-format-disabled"]')
          .eq(1)
          .should("include.text", "rooms.recordings.format_types.podcast");
        cy.get('[data-test="recording-format-disabled"]')
          .eq(2)
          .should("include.text", "rooms.recordings.format_types.presentation");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.screenshare");
      });
  });

  it("edit recording errors", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    // Check with 404 error (recording not found / already deleted)
    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .find('[data-test="room-recordings-edit-button"]')
      .click();

    cy.intercept(
      "PUT",
      "api/v1/rooms/abc-def-123/recordings/f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775",
      {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "recording",
          ids: ["f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775"],
        },
      },
    ).as("editRecordingRequest");

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 3);
      roomRecordings.meta.to = 3;
      roomRecordings.meta.total = 3;
      roomRecordings.meta.total_no_filter = 3;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="room-recordings-edit-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editRecordingRequest");
    cy.wait("@roomRecordingsRequest");

    // Check that recording is not shown anymore and dialog is closed
    cy.get('[data-test="room-recordings-edit-dialog"]').should("not.exist");
    cy.get('[data-test="room-recording-item"]').should("have.length", 3);

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.recording_gone");

    // Check with 422 error
    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .find('[data-test="room-recordings-edit-button"]')
      .click();

    cy.intercept(
      "PUT",
      "api/v1/rooms/abc-def-123/recordings/0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
      {
        statusCode: 422,
        body: {
          message: "Validation failed",
          errors: {
            description: ["The description field is required."],
            access: ["The access field is required."],
            formats: ["The formats field is required."],
          },
        },
      },
    ).as("editRecordingRequest");

    cy.get('[data-test="room-recordings-edit-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editRecordingRequest");

    // Check that dialog stayed open and error messages are shown
    cy.get('[data-test="room-recordings-edit-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="description-field"]').should(
          "include.text",
          "The description field is required.",
        );
        cy.get('[data-test="available-formats-field"]').should(
          "include.text",
          "The formats field is required.",
        );
        cy.get('[data-test="access-field"]').should(
          "include.text",
          "The access field is required.",
        );
      });

    // Check with 500 error
    cy.intercept(
      "PUT",
      "api/v1/rooms/abc-def-123/recordings/0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("editRecordingRequest");

    cy.get('[data-test="room-recordings-edit-dialog"]')
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editRecordingRequest");

    // Check that dialog stays open and 422 error messages are hidden
    cy.get('[data-test="room-recordings-edit-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="description-field"]').should(
          "not.include.text",
          "The description field is required.",
        );
        cy.get('[data-test="available-formats-field"]').should(
          "not.include.text",
          "The formats field is required.",
        );
        cy.get('[data-test="access-field"]').should(
          "not.include.text",
          "The access field is required.",
        );
      });

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="room-recordings-edit-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .click();

    cy.get('[data-test="room-recordings-edit-dialog"]').should("not.exist");

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-recording-item"]')
          .eq(0)
          .find('[data-test="room-recordings-edit-button"]')
          .click();
        cy.get('[data-test="room-recordings-edit-dialog"]')
          .should("be.visible")
          .find('[data-test="dialog-save-button"]')
          .click();
      },
      "PUT",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
      "recordings",
    );

    // Reload room
    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequests();

    cy.reload();
    cy.get("#tab-recordings").should("be.visible").click();

    cy.wait("@roomRecordingsRequest");

    // Check with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept(
      "PUT",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
      {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      },
    ).as("editRecordingRequest");

    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-edit-button"]')
      .click();

    cy.get('[data-test="room-recordings-edit-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editRecordingRequest");

    // Check that redirect to room index page worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });
});
