import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view recordings recording actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequests();
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

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("recordingView").returns(true);
    });

    const viewRecordingRequest = interceptIndefinitely(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/1",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "viewRecordingRequest",
    );

    // Check if the dialog is open
    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .and("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20 - 08/17/2022, 11:40")
      .within(() => {
        cy.get('[data-test="notes-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.notes");
        cy.get('[data-test="podcast-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.podcast");
        cy.get('[data-test="presentation-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.presentation");
        cy.get('[data-test="screenshare-button"]')
          .should("be.visible")
          .and("include.text", "rooms.recordings.format_types.screenshare");
        cy.get('[data-test="notes-button"]').click();

        // Check loading
        cy.get('[data-test="overlay"]').should("be.visible");
        cy.get('[data-test="dialog-close-button"]')
          .should("have.text", "app.close")
          .should("be.disabled")
          .then(() => {
            viewRecordingRequest.sendResponse();
          });
      });

    cy.wait("@viewRecordingRequest");

    cy.get("@recordingView")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");

    // Check that dialog stayed open and close it
    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="dialog-close-button"]')
      .should("have.text", "app.close")
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]').should("not.exist");
  });

  it("view recording with access code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
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

    cy.visit("/rooms/abc-def-123#tab=recordings");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("recordingView").returns(true);
    });

    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/2",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
    ).as("viewRecordingRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="podcast-button"]')
      .click();

    cy.wait("@viewRecordingRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    cy.get("@recordingView")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");

    // Check that dialog stayed open and close it
    cy.get('[data-test="room-recordings-view-dialog"]').should("be.visible");
  });

  it("view recording with access code errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
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

    cy.visit("/rooms/abc-def-123#tab=recordings");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Check with invalid_code error
    cy.intercept(
      "GET",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/2",
      {
        statusCode: 401,
        body: {
          message: "invalid_code",
        },
      },
    ).as("viewRecordingRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="podcast-button"]')
      .click();

    cy.wait("@viewRecordingRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Check require_code error
    cy.intercept(
      "GET",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/2",
      {
        statusCode: 403,
        body: {
          message: "require_code",
        },
      },
    ).as("viewRecordingRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="podcast-button"]')
      .click();

    cy.wait("@viewRecordingRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");
  });

  it("view recording with token", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
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

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR#tab=recordings",
    );

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("recordingView").returns(true);
    });

    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/3",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
    ).as("viewRecordingRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="presentation-button"]')
      .click();

    cy.wait("@viewRecordingRequest").then((interception) => {
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.get("@recordingView")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");
  });

  it("view recording with token errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
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

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR#tab=recordings",
    );

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    // Check with invalid_code error
    cy.intercept(
      "GET",
      "api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/3",
      {
        statusCode: 401,
        body: {
          message: "invalid_token",
        },
      },
    ).as("viewRecordingRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="presentation-button"]')
      .click();

    cy.wait("@viewRecordingRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("view recording with errors", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    // Check with browser blocking window.open
    cy.window().then((win) => {
      cy.stub(win, "open").as("recordingView").returns(false);
    });

    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775/formats/4",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
    ).as("viewRecordingRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="screenshare-button"]')
      .click();

    cy.wait("@viewRecordingRequest");

    cy.get("@recordingView")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");

    // Check toast message is shown (browser is blocking download)
    cy.checkToastMessage("app.flash.popup_blocked");

    // Check that dialog stayed open
    cy.get('[data-test="room-recordings-view-dialog"]').should("be.visible");

    // Check with 404 error (recording not found / already deleted)
    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775/formats/4",
      {
        statusCode: 404,
        body: {
          message: "No query results for model",
        },
      },
    ).as("viewRecordingRequest");

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

    // Click on view recording button
    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="screenshare-button"]')
      .click();

    cy.wait("@viewRecordingRequest");
    cy.wait("@roomRecordingsRequest");

    // Check that error message is shown and that recording is not shown anymore
    cy.checkToastMessage("rooms.flash.recording_gone");
    cy.get('[data-test="room-recording-item"]').should("have.length", 3);
    cy.get('[data-test="room-recordings-view-dialog"]').should("not.exist");

    // Check with 500 error
    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/1",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("viewRecordingRequest");

    // Click on view recording button
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('[data-test="room-recordings-view-button"]')
      .click();

    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="notes-button"]')
      .click();

    cy.wait("@viewRecordingRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dialog stayed open
    cy.get('[data-test="room-recordings-view-dialog"]').should("be.visible");

    // Check 403 error
    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035/formats/1",
      {
        statusCode: 403,
        body: {
          message: "This action is unauthorized.",
        },
      },
    ).as("viewRecordingRequest");

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

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("reloadRoomRequest");
    });

    // Click on view recording button
    cy.get('[data-test="room-recordings-view-dialog"]')
      .should("be.visible")
      .find('[data-test="notes-button"]')
      .click();

    cy.wait("@viewRecordingRequest");
    cy.wait("@reloadRoomRequest");
    cy.wait("@roomRecordingsRequest");

    cy.checkToastMessage("rooms.flash.recording_forbidden");
    cy.contains("auth.login").should("be.visible");

    // Check that recordings are shown correctly
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
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
  });

  it("check download recording buttons", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .find('a[data-test="room-recordings-download-button"]')
      .should(
        "have.attr",
        "href",
        Cypress.config("baseUrl") +
          "/download/recording/" +
          "e0cfa18c5fd75a42bd7947d8549321b03abf1daf-1660728035",
      )
      .and("have.attr", "target", "_blank");

    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .find('a[data-test="room-recordings-download-button"]')
      .should(
        "have.attr",
        "href",
        Cypress.config("baseUrl") +
          "/download/recording/" +
          "0baf06ec8480e8de73e007ae1ee3028e4c0ecb3c-1660723200",
      )
      .and("have.attr", "target", "_blank");

    cy.get('[data-test="room-recording-item"]')
      .eq(2)
      .find('a[data-test="room-recordings-download-button"]')
      .should(
        "have.attr",
        "href",
        Cypress.config("baseUrl") +
          "/download/recording/" +
          "66bcb180bb1aeb037cb4e5625af3625c6c740224-1660811975",
      )
      .and("have.attr", "target", "_blank");

    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .find('a[data-test="room-recordings-download-button"]')
      .should(
        "have.attr",
        "href",
        Cypress.config("baseUrl") +
          "/download/recording/" +
          "f9569db6d5e8fb2fd2f57d367d5482b36837b9d8-1663666775",
      )
      .and("have.attr", "target", "_blank");
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
          message: "No query results for model",
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
            format: "notes",
            disabled: true,
          },
          {
            id: 2,
            format: "podcast",
            disabled: true,
          },
          {
            id: 3,
            format: "presentation",
            disabled: true,
          },
          {
            id: 4,
            format: "screenshare",
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
          message: "No query results for model",
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
  });
});
