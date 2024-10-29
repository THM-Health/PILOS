describe("Rooms view recordings actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequest();
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

    cy.intercept(
      "GET",
      "/api/v1/rooms/abc-def-123/recordings/1abc123/formats/1",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
    ).as("viewRecordingRequest");

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
      "/api/v1/rooms/abc-def-123/recordings/1abc123/formats/2",
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
      "api/v1/rooms/abc-def-123/recordings/1abc123/formats/2",
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
      "api/v1/rooms/abc-def-123/recordings/1abc123/formats/2",
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
      "/api/v1/rooms/abc-def-123/recordings/1abc123/formats/3",
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
      "api/v1/rooms/abc-def-123/recordings/1abc123/formats/3",
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
      "/api/v1/rooms/abc-def-123/recordings/x123xyz/formats/4",
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
      "/api/v1/rooms/abc-def-123/recordings/x123xyz/formats/4",
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
      "/api/v1/rooms/abc-def-123/recordings/1abc123/formats/1",
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
      "/api/v1/rooms/abc-def-123/recordings/1abc123/formats/1",
      {
        statusCode: 403,
        body: {
          message: "This action is unauthorized",
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
    cy.get('[data-test="room-recording-item"').should("have.length", 1);
    cy.get('[data-test="room-recording-item"')
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

  // ToDo following tests need to be specified more clearly
  // ToDo download recording

  // ToDo delete recording
  // ToDo delete recording with errors

  // ToDo edit recording
  // ToDo edit recording with errors
});
