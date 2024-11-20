import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view recordings", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomRecordingsRequests();
  });

  it("load recordings", function () {
    const roomRecordingsRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123/recordings*",
      { fixture: "roomRecordings.json" },
      "roomRecordingsRequest",
    );

    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-recordings").click();

    cy.url().should("include", "/rooms/abc-def-123#tab=recordings");

    //Check loading
    cy.get('[data-test="overlay"]').should("be.visible");

    cy.get('[data-test="room-recordings-search"]').within(() => {
      cy.get("input").should("be.disabled");
      cy.get("button").should("be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get("button").should("be.disabled");
    });

    cy.get('[data-test="room-recordings-reload-button"]')
      .should("be.disabled")
      .then(() => {
        roomRecordingsRequest.sendResponse();
      });

    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    //Check that loading is done
    cy.get('[data-test="room-recordings-search"]').within(() => {
      cy.get("input").should("not.be.disabled");
      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "false");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "false");
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-recordings-reload-button"]').should(
      "not.be.disabled",
    );

    // Check recordings
    cy.get('[data-test="room-recording-item"]').should("have.length", 4);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20")
      .and("include.text", "20 app.time_formats.minutes")
      .and("include.text", "rooms.recordings.access_types.everyone")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          0,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          4,
        );
        cy.get('[data-test="recording-format-enabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.notes");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(1)
          .should("include.text", "rooms.recordings.format_types.podcast");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(2)
          .should("include.text", "rooms.recordings.format_types.presentation");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(3)
          .should("include.text", "rooms.recordings.format_types.screenshare");
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .should("include.text", "Recording 2")
      .and("include.text", "08/17/2022, 10:00")
      .and(
        "include.text",
        "1 app.time_formats.hour, 0 app.time_formats.minutes",
      )
      .and("include.text", "rooms.recordings.access_types.participant")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          4,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          0,
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
        cy.get('[data-test="recording-format-disabled"]')
          .eq(3)
          .should("include.text", "rooms.recordings.format_types.screenshare");
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(2)
      .should("include.text", "Recording 3")
      .and("include.text", "08/18/2022, 10:39")
      .and("include.text", "1 app.time_formats.hour, 1 app.time_formats.minute")
      .and("include.text", "rooms.recordings.access_types.moderator")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-disabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.notes");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.podcast");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(1)
          .should("include.text", "rooms.recordings.format_types.presentation");
        cy.get('[data-test="recording-format-disabled"]')
          .eq(1)
          .should("include.text", "rooms.recordings.format_types.screenshare");
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .should("include.text", "Recording 4")
      .and("include.text", "09/20/2022, 11:39")
      .and("include.text", "1 app.time_formats.minute")
      .and("include.text", "rooms.recordings.access_types.owner")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.notes");
        cy.get('[data-test="recording-format-disabled"]')
          .eq(0)
          .should("include.text", "rooms.recordings.format_types.podcast");
        cy.get('[data-test="recording-format-disabled"]')
          .eq(1)
          .should("include.text", "rooms.recordings.format_types.presentation");
        cy.get('[data-test="recording-format-enabled"]')
          .eq(1)
          .should("include.text", "rooms.recordings.format_types.screenshare");
      });

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .and("include.text", "rooms.recordings.retention_period.unlimited");
  });

  it("load recordings with access code", function () {
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

    cy.wait("@roomRecordingsRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    cy.url().should("include", "/rooms/abc-def-123#tab=recordings");

    // Check that recordings are shown correctly
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);

    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20")
      .and("include.text", "20 app.time_formats.minutes")
      .and("not.include.text", "rooms.recordings.access_types.everyone")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should("not.exist");
        cy.get('[data-test="recording-format-enabled"]').should("not.exist");
      });

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .and("include.text", "rooms.recordings.retention_period.unlimited");
  });

  it("load recordings with access code errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("roomRecordingsRequest");

    cy.visit("/rooms/abc-def-123#tab=recordings");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room1) => {
      room1.data.owner = { id: 2, name: "Max Doe" };

      const firstRoomRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123",
        {
          statusCode: 200,
          body: room1,
        },
        "roomRequest",
      );

      cy.get('[data-test="room-login-button"]').click();

      cy.fixture("room.json").then((room2) => {
        room2.data.owner = { id: 2, name: "Max Doe" };
        room2.data.authenticated = false;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room2,
        })
          .as("roomRequest")
          .then(() => {
            firstRoomRequest.sendResponse();
          });
      });
    });

    cy.wait("@roomRequest");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    cy.wait("@roomRequest").then((interception) => {
      // Check that access code header is reset
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    // Test require_code
    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      statusCode: 403,
      body: {
        message: "require_code",
      },
    }).as("roomRecordingsRequest");

    cy.fixture("room.json").then((room1) => {
      room1.data.owner = { id: 2, name: "Max Doe" };

      const firstRoomRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123",
        {
          statusCode: 200,
          body: room1,
        },
        "roomRequest",
      );

      cy.get('[data-test="room-login-button"]').click();

      cy.fixture("room.json").then((room2) => {
        room2.data.owner = { id: 2, name: "Max Doe" };
        room2.data.authenticated = false;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room2,
        })
          .as("roomRequest")
          .then(() => {
            firstRoomRequest.sendResponse();
          });
      });
    });

    cy.wait("@roomRequest");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");
  });

  it("load recordings with token", function () {
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

    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR#tab=recordings",
    );

    cy.wait("@roomRequest");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.contains("rooms.recordings.title").should("be.visible");

    // Check that recordings are shown correctly
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);

    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 05:20")
      .and("include.text", "20 app.time_formats.minutes")
      .and("not.include.text", "rooms.recordings.access_types.everyone")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should("not.exist");
        cy.get('[data-test="recording-format-enabled"]').should("not.exist");
      });

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .and("include.text", "rooms.recordings.retention_period.unlimited");
  });

  it("load recordings with token errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("roomRecordingsRequest");

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR#tab=recordings",
    );

    cy.wait("@roomRequest");

    cy.wait("@roomRecordingsRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("load recordings errors", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRecordingsRequest");

    cy.visit("/rooms/abc-def-123#tab=recordings");
    cy.wait("@roomRecordingsRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-recordings-search"]').within(() => {
      cy.get("input").should("not.be.disabled");
      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-recordings-reload-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 3;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomRecordingsRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if recording is shown and contains the correct data
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRecordingsRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomRecordingsRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-recordings-search"]').within(() => {
      cy.get("input").should("not.be.disabled");
      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-recordings-reload-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 3;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="overlay"]').should("be.visible");
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check if recording is shown and contains the correct data
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1");

    // Check that reload button does not exist
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("load recordings page out of range", function () {
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest");

    // Switch to next page but respond with no room members on second page
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = [];
      roomRecordings.meta.current_page = 2;
      roomRecordings.meta.from = null;
      roomRecordings.meta.per_page = 2;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 2;
      roomRecordings.meta.total_no_filter = 2;

      const emptyRoomRecordingsRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/recordings*",
        {
          statusCode: 200,
          body: roomRecordings,
        },
        "roomRecordingsRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("roomRecordings.json").then((roomRecordings) => {
        roomRecordings.data = roomRecordings.data.slice(0, 2);
        roomRecordings.meta.per_page = 2;
        roomRecordings.meta.to = 2;
        roomRecordings.meta.total = 2;
        roomRecordings.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
          statusCode: 200,
          body: roomRecordings,
        })
          .as("roomRecordingsRequest")
          .then(() => {
            emptyRoomRecordingsRequest.sendResponse();
          });
      });
    });

    // Wait for first room recordings request and check that page is still the same
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second room recordings request and check that page is reset
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });
  });

  it("view with different permissions", function () {
    cy.fixture("config.json").then((config) => {
      config.data.recording.recording_retention_period = 365;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Check view for guest
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
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

    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 05:20")
      .and("include.text", "20 app.time_formats.minutes")
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

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .should(
        "include.text",
        'rooms.recordings.retention_period.days_{"days":365}',
      );

    // Check view with rooms.viewAll permission
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

    cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
      fixture: "roomRecordings.json",
    }).as("roomRecordingsRequest");

    cy.reload();

    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recording-item"]').should("have.length", 4);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20")
      .and("include.text", "20 app.time_formats.minutes")
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

    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .should("include.text", "Recording 2")
      .and("include.text", "08/17/2022, 10:00")
      .and(
        "include.text",
        "1 app.time_formats.hour, 0 app.time_formats.minutes",
      )
      .and("not.include.text", "rooms.recordings.access_types.participant")
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

    cy.get('[data-test="room-recording-item"]')
      .eq(2)
      .should("include.text", "Recording 3")
      .and("include.text", "08/18/2022, 10:39")
      .and("include.text", "1 app.time_formats.hour, 1 app.time_formats.minute")
      .and("not.include.text", "rooms.recordings.access_types.moderator")
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

    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .should("include.text", "Recording 4")
      .and("include.text", "09/20/2022, 11:39")
      .and("include.text", "1 app.time_formats.minute")
      .and("not.include.text", "rooms.recordings.access_types.owner")
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

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .should(
        "include.text",
        'rooms.recordings.retention_period.days_{"days":365}',
      );

    // Check for co_owner
    cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recording-item"]').should("have.length", 4);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20")
      .and("include.text", "20 app.time_formats.minutes")
      .and("include.text", "rooms.recordings.access_types.everyone")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          0,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          4,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .should("include.text", "Recording 2")
      .and("include.text", "08/17/2022, 10:00")
      .and(
        "include.text",
        "1 app.time_formats.hour, 0 app.time_formats.minutes",
      )
      .and("include.text", "rooms.recordings.access_types.participant")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          4,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          0,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(2)
      .should("include.text", "Recording 3")
      .and("include.text", "08/18/2022, 10:39")
      .and("include.text", "1 app.time_formats.hour, 1 app.time_formats.minute")
      .and("include.text", "rooms.recordings.access_types.moderator")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          2,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .should("include.text", "Recording 4")
      .and("include.text", "09/20/2022, 11:39")
      .and("include.text", "1 app.time_formats.minute")
      .and("include.text", "rooms.recordings.access_types.owner")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          2,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .should(
        "include.text",
        'rooms.recordings.retention_period.days_{"days":365}',
      );

    // Check view with rooms.manage permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll", "rooms.manage"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = ["rooms.viewAll", "rooms.manage"];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.wait("@roomRecordingsRequest");

    cy.get('[data-test="room-recording-item"]').should("have.length", 4);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1")
      .and("include.text", "08/17/2022, 11:20")
      .and("include.text", "20 app.time_formats.minutes")
      .and("include.text", "rooms.recordings.access_types.everyone")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          0,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          4,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(1)
      .should("include.text", "Recording 2")
      .and("include.text", "08/17/2022, 10:00")
      .and(
        "include.text",
        "1 app.time_formats.hour, 0 app.time_formats.minutes",
      )
      .and("include.text", "rooms.recordings.access_types.participant")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          4,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          0,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(2)
      .should("include.text", "Recording 3")
      .and("include.text", "08/18/2022, 10:39")
      .and("include.text", "1 app.time_formats.hour, 1 app.time_formats.minute")
      .and("include.text", "rooms.recordings.access_types.moderator")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          2,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-recording-item"]')
      .eq(3)
      .should("include.text", "Recording 4")
      .and("include.text", "09/20/2022, 11:39")
      .and("include.text", "1 app.time_formats.minute")
      .and("include.text", "rooms.recordings.access_types.owner")
      .within(() => {
        cy.get('[data-test="recording-format-disabled"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="recording-format-enabled"]').should(
          "have.length",
          2,
        );
        // Check button visibility
        cy.get('[data-test="room-recordings-view-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-download-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-recordings-delete-button"]').should(
          "be.visible",
        );
      });

    // Check if retention period message is shown correctly
    cy.get('[data-test="retention-period-message"]')
      .should("be.visible")
      .and("include.text", "rooms.recordings.retention_period.title")
      .should(
        "include.text",
        'rooms.recordings.retention_period.days_{"days":365}',
      );
  });

  it("search recordings", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query.search).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no recordings found for this search query
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = [];
      roomRecordings.meta.from = null;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="room-recordings-search"] > input').type("Test");
    cy.get('[data-test="room-recordings-search"] > button').click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Test",
        page: "1",
      });
    });

    // Check if correct message is shown and no recordings are displayed
    cy.get('[data-test="room-recording-item"]').should("have.length", 0);
    cy.contains("app.filter_no_result").should("be.visible");

    // Check with no recordings in room
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = [];
      roomRecordings.meta.from = null;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 0;
      roomRecordings.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="room-recordings-search"] > input').clear();
    cy.get('[data-test="room-recordings-search"]').type("Test2");
    cy.get('[data-test="room-recordings-search"] > input').type("{enter}");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Test2",
        page: "1",
      });
    });

    // Check if correct message is shown and no recordings are displayed
    cy.get('[data-test="room-recording-item"]').should("have.length", 0);
    cy.contains("rooms.recordings.nodata").should("be.visible");

    // Check with 2 recordings on 2 pages
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="room-recordings-search"] > input').clear();
    cy.get('[data-test="room-recordings-search"]').type("Recording");
    cy.get('[data-test="room-recordings-search"] > button').click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Recording",
        page: "1",
      });
    });

    // Check if correct recordings are shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(1, 2);
      roomRecordings.meta.current_page = 2;
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.from = 2;
      roomRecordings.meta.to = 2;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if search query stays the same after changing the page
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Recording",
        page: "2",
      });
    });

    cy.get("[data-test=room-recordings-search] > input").should(
      "have.value",
      "Recording",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check if correct recordings are shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 2");

    // Change search query and make sure that the page is reset
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="room-recordings-search"] > input').clear();
    cy.get('[data-test="room-recordings-search"]').type("Record");
    cy.get('[data-test="room-recordings-search"] > button').click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Record",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("filter recordings", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown-items"]').should("not.exist");

    // Check that correct filter is displayed
    cy.get('[data-test="filter-dropdown"]')
      .should("have.text", "rooms.recordings.filter.all")
      .click();

    cy.get('[data-test="filter-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        // check that filter options are shown correctly

        cy.get("[data-test=filter-dropdown-option]").should("have.length", 5);

        cy.get("[data-test=filter-dropdown-option]")
          .eq(0)
          .should("have.text", "rooms.recordings.filter.all");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(0)
          .should("have.attr", "aria-selected", "true");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(1)
          .should("have.text", "rooms.recordings.filter.everyone_access");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(2)
          .should("have.text", "rooms.recordings.filter.participant_access");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(3)
          .should("have.text", "rooms.recordings.filter.moderator_access");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(4)
          .should("have.text", "rooms.recordings.filter.owner_access");
      });

    // Change filter and respond with no recordings found for this filter
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = [];
      roomRecordings.meta.from = null;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get("[data-test=filter-dropdown-option]").eq(1).click();

    // Check that correct filter is sent with request and correct filter is displayed
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "everyone_access",
        page: "1",
      });
    });

    // Check if correct message is shown and no recordings are displayed
    cy.get('[data-test="filter-dropdown"]').should(
      "have.text",
      "rooms.recordings.filter.everyone_access",
    );

    cy.get('[data-test="room-recording-item"]').should("have.length", 0);
    cy.contains("app.filter_no_result").should("be.visible");

    // Change filter again and respond with no recordings in room
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = [];
      roomRecordings.meta.from = null;
      roomRecordings.meta.to = null;
      roomRecordings.meta.total = 0;
      roomRecordings.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(2).click();

    // Check that correct filter is sent with request and correct filter is displayed
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_access",
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown"]').should(
      "have.text",
      "rooms.recordings.filter.participant_access",
    );

    // Check if correct message is shown and no recordings are displayed
    cy.get('[data-test="room-recording-item"]').should("have.length", 0);
    cy.contains("rooms.recordings.nodata").should("be.visible");

    // Change filter again and respond with 2 recordings on 2 pages
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(3).click();

    // Check that correct filter is sent with request and correct filter is displayed
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "moderator_access",
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown"]').should(
      "have.text",
      "rooms.recordings.filter.moderator_access",
    );

    // Check if correct recordings are shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(1, 2);
      roomRecordings.meta.current_page = 2;
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.from = 2;
      roomRecordings.meta.to = 2;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if filter stays the same after changing the page
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "moderator_access",
        page: "2",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.recordings.filter.moderator_access",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check if correct recordings are shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 2");

    // Change filter again and make sure that the page is reset
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 2;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;
      roomRecordings.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(4).click();

    // Check that filter and page were reset
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "owner_access",
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown"]').should(
      "have.text",
      "rooms.recordings.filter.owner_access",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Reset filter
    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(0).click();

    // Check that filter and page were reset
    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown"]').should(
      "have.text",
      "rooms.recordings.filter.all",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("sort recordings", function () {
    cy.visit("/rooms/abc-def-123#tab=recordings");

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "desc",
        page: "1",
      });
    });

    cy.get('[data-test="sorting-type-dropdown-items"]').should("not.exist");

    // Check that correct sorting type is displayed
    cy.get('[data-test="sorting-type-dropdown"]')
      .should("have.text", "rooms.recordings.sort.start")
      .click();

    cy.get('[data-test="sorting-type-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get("[data-test=sorting-type-dropdown-option]").should(
          "have.length",
          2,
        );
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(0)
          .should("have.text", "rooms.recordings.sort.description");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(1)
          .should("have.text", "rooms.recordings.sort.start");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(1)
          .should("have.attr", "aria-selected", "true");

        // Change sorting type and respond with 4 recordings on 4 different pages
        cy.fixture("roomRecordings.json").then((roomRecordings) => {
          roomRecordings.data = roomRecordings.data.slice(0, 1);
          roomRecordings.meta.last_page = 4;
          roomRecordings.meta.per_page = 1;
          roomRecordings.meta.to = 1;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
            statusCode: 200,
            body: roomRecordings,
          }).as("roomRecordingsRequest");
        });

        cy.get("[data-test=sorting-type-dropdown-option]").eq(0).click();
      });

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "description",
        sort_direction: "desc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown-items]").should("not.exist");

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.recordings.sort.description",
    );

    // Check if correct recordings are shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 1");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(1, 2);
      roomRecordings.meta.current_page = 2;
      roomRecordings.meta.last_page = 4;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.from = 2;
      roomRecordings.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "description",
        sort_direction: "desc",
        page: "2",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.recordings.sort.description",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check if correct recordings are shown
    cy.get('[data-test="room-recording-item"]').should("have.length", 1);
    cy.get('[data-test="room-recording-item"]')
      .eq(0)
      .should("include.text", "Recording 2");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 4;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').find("button").click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "description",
        sort_direction: "asc",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(1, 2);
      roomRecordings.meta.current_page = 2;
      roomRecordings.meta.last_page = 4;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.from = 2;
      roomRecordings.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "description",
        sort_direction: "asc",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Change sorting type and make sure that the page is reset
    cy.fixture("roomRecordings.json").then((roomRecordings) => {
      roomRecordings.data = roomRecordings.data.slice(0, 1);
      roomRecordings.meta.last_page = 4;
      roomRecordings.meta.per_page = 1;
      roomRecordings.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        statusCode: 200,
        body: roomRecordings,
      }).as("roomRecordingsRequest");
    });

    cy.get("[data-test=sorting-type-dropdown]").click();
    cy.get("[data-test=sorting-type-dropdown-option]").eq(1).click();

    cy.wait("@roomRecordingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "asc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.recordings.sort.start",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });
});
