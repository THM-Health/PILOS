import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view meetings", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("join running meeting", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/join*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "joinRequest",
    );

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Check that room join dialog is closed and click on join button
    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-join-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.join")
      .click();

    // Test loading
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]').should("be.disabled");
      });
    cy.get('[data-test="room-join-button"]')
      .should("be.disabled")
      .then(() => {
        cy.wait("@preJoinRequest");
        joinRequest.sendResponse();
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting with attendance logging", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/join*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "joinRequest",
    );

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-join-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.join")
      .click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.recording_attendance_info").should("be.visible");
        cy.contains("rooms.recording_attendance_accept").should("be.visible");
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            cy.wait("@preJoinRequest");
            joinRequest.sendResponse();
          });
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: true,
        consent_record: false,
        consent_record_video: false,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting with streaming", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: true,
          },
        },
      },
    }).as("preJoinRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/join*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "joinRequest",
    );

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-join-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.join")
      .click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.streaming_info").should("be.visible");
        cy.contains("rooms.streaming_accept").should("be.visible");
        cy.get("#streaming-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            cy.wait("@preJoinRequest");
            joinRequest.sendResponse();
          });
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false,
        consent_streaming: true,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting with recording", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/join*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "joinRequest",
    );

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-join-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.join")
      .click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.recording_info").should("be.visible");
        cy.contains("rooms.recording_accept").should("be.visible");
        cy.contains("rooms.recording_video_accept").should("be.visible");

        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            cy.wait("@preJoinRequest");
            joinRequest.sendResponse();
          });
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting with recording without video", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.record = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("joinRequest");

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-button"]').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    cy.wait("@preJoinRequest");

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: false,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting guests", function () {
    cy.intercept("GET", "api/v1/currentUser", {});

    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    cy.get('[data-test="room-join-button"]').click();

    cy.wait("@preJoinRequest");

    // Test with valid name
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.first_and_lastname")
      .within(() => {
        cy.get("#guest-name").type("John Doe");
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();

        cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
          statusCode: 200,
          body: {
            url: "https://example.org/?foo=a&bar=b",
          },
        }).as("joinRequest");

        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "John Doe",
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting guests errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});

    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 422,
      body: {
        message: "The given data was invalid",
        errors: {
          name: [
            "The name contains the following non-permitted characters: 123!",
          ],
        },
      },
    }).as("joinRequest");

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Test with invalid name
    cy.get('[data-test="room-join-button"]').click();

    cy.wait("@preJoinRequest");

    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#guest-name").type("John Doe 123!");
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "John Doe 123!",
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
    });

    // Check if error message is shown
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .and(
        "include.text",
        "The name contains the following non-permitted characters: 123!",
      );

    cy.get("#guest-name").should("have.value", "John Doe 123!");

    // Test 500 error
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("joinRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@joinRequest");

    // Check that room join dialog stays open and 422 error messages are hidden
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .and(
        "not.include.text",
        "The name contains the following non-permitted characters: 123!",
      );

    // Check if error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
  });

  it("join running meeting with access code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-button"]').click();

    cy.wait("@preJoinRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Try to join the meeting
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();

        cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
          statusCode: 200,
          body: {
            url: "https://example.org/?foo=a&bar=b",
          },
        }).as("joinRequest");

        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting access code errors", function () {
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.visit("/rooms/abc-def-123");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    // Test invalid_code
    // Intercept join request with error response and room request for reload (not authenticated anymore)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("joinRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();

    // Check that header is set correctly
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    // Intercept room request for reload (after entering access code)
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();
    cy.wait("@roomRequest");

    // Test require_code
    // Intercept join request with error response and room request for reload (not authenticated anymore)
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 403,
      body: {
        message: "require_code",
      },
    }).as("joinRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();

    // Check that header is set correctly
    cy.wait("@joinRequest").then((interception) => {
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

  it("join running meeting token", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("joinRequest");

    cy.interceptRoomFilesRequest();

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();
    cy.wait("@preJoinRequest").then((interception) => {
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@joinRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: null,
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("join running meeting token errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("joinRequest");

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();

    cy.wait("@joinRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("join meeting errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    // Test guests not allowed
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("joinRequest");

    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-button"]')
      .should("have.text", "rooms.join")
      .click();

    cy.wait("@joinRequest");

    // Check if error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Reload room
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Join meeting errors room settings changed and because of that the agreements are missing
    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/join*",
      {
        statusCode: 422,
        body: {
          message:
            "The consent record attendance must be accepted. (and 1 more error)",
          errors: {
            consent_record_attendance: [
              "The consent record attendance must be accepted.",
            ],
            consent_record: ["The consent record must be accepted."],
          },
        },
      },
      "joinRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-join-button"]').click();
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        // Make sure that checkboxes for agreements are not shown
        cy.contains("rooms.recording_info").should("not.exist");
        cy.contains("rooms.recording_accept").should("not.exist");
        cy.contains("rooms.recording_video_accept").should("not.exist");

        cy.get("#record-agreement").should("not.exist");
        cy.get("#record-video-agreement").should("not.exist");

        cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
          statusCode: 200,
          body: {
            data: {
              features: {
                recording: true,
                attendance_recording: true,
                streaming: false,
              },
            },
          },
        }).as("preJoinRequest");

        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            joinRequest.sendResponse();
          });

        cy.wait("@joinRequest");

        // Check that checkboxes for agreements are shown
        cy.contains("rooms.recording_info").should("be.visible");
        cy.contains("rooms.recording_accept").should("be.visible");
        cy.contains("rooms.recording_video_accept").should("be.visible");

        // Check if error messages are shown
        cy.contains("The consent record attendance must be accepted.").should(
          "be.visible",
        );
        cy.contains("The consent record must be accepted.").should(
          "be.visible",
        );

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Join meeting errors missing agreements
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 422,
      body: {
        message: "The consent record attendance must be accepted.",
        errors: {
          consent_record_attendance: [
            "The consent record attendance must be accepted.",
          ],
        },
      },
    }).as("joinRequest");

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-join-button"]').click();
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check if error messages are reset
        cy.contains("The consent record attendance must be accepted.").should(
          "not.exist",
        );
        cy.contains("The consent record must be accepted.").should("not.exist");

        // Check if checkboxes are required
        cy.get("#record-agreement")
          .should("not.be.checked")
          .should("have.attr", "required", "required")
          .click();
        cy.get("#record-video-agreement").should("not.be.checked");

        // Check attendance agreement is not shown
        cy.get("#record-attendance-agreement").should("not.exist");

        cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
          statusCode: 200,
          body: {
            data: {
              features: {
                recording: true,
                attendance_recording: true,
                streaming: false,
              },
            },
          },
        });

        // Try to join meeting
        cy.get('[data-test="dialog-continue-button"]').click();

        cy.wait("@joinRequest");

        // Check if error messages are shown
        cy.contains("The consent record attendance must be accepted.").should(
          "be.visible",
        );

        // Agree to consent record attendance
        cy.get("#record-attendance-agreement")
          .should("not.be.checked")
          .should("have.attr", "required", "required")
          .click();
      });

    // Test general errors
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("joinRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@joinRequest");

    // Check that room join dialog stays open and 422 error messages are hidden
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .and(
        "not.include.text",
        "The consent record attendance must be accepted.",
      )
      .and("not.include.text", "The consent record must be accepted.");

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test meeting error room closed
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
      statusCode: 460,
      body: {
        message: "Joining failed! The room is currently closed.",
      },
    }).as("joinRequest");

    // Intercept reload request
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    // Try to join meeting
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@joinRequest");
    cy.wait("@roomRequest");

    // Check if error message is shown and button has switched to start room
    cy.checkToastMessage("app.errors.not_running");

    cy.get('[data-test="room-join-button"]').should("not.exist");
    cy.get('[data-test="room-start-button"]').should(
      "have.text",
      "rooms.start",
    );
  });

  it("join meeting load requirements errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Test guests not allowed
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("preJoinRequest");

    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();

    cy.wait("@preJoinRequest");

    // Check if error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Reload room
    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Test general errors
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("preJoinRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();
    cy.wait("@preJoinRequest");

    // Check that room join dialog stays open
    cy.get('[data-test="room-join-dialog"]').should("be.visible");

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test invalid_code
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("preJoinRequest");

    // Try again
    cy.get('[data-test="loading-retry-button"]').click();

    // Check error message
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    // Check dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");

    // Reload
    cy.visit("/rooms/abc-def-123");

    // Test require_code
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 403,
      body: {
        message: "require_code",
      },
    }).as("preJoinRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();
    cy.wait("@preJoinRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    // Check dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");

    // Reload
    cy.visit("/rooms/abc-def-123");

    // Test invalid_token
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("preJoinRequest");

    // Try to join meeting
    cy.get('[data-test="room-join-button"]').click();
    cy.wait("@preJoinRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    // Check dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");
  });

  it("start meeting", function () {
    const startRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/start*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "startRequest",
    );

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preStartRequest");

    cy.visit("/rooms/abc-def-123");

    // Check that room join dialog is closed and click on start button
    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-start-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.start")
      .click();

    // Test loading
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]').should("be.disabled");
      });
    cy.get('[data-test="room-start-button"]')
      .should("be.disabled")
      .then(() => {
        cy.wait("@preStartRequest");
        startRequest.sendResponse();
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting with attendance logging", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/start*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "startRequest",
    );

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-start-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.start")
      .click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.recording_attendance_info").should("be.visible");
        cy.contains("rooms.recording_attendance_accept").should("be.visible");
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            joinRequest.sendResponse();
          });
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: true,
        consent_record: false,
        consent_record_video: false,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting with streaming", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/start*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "startRequest",
    );

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: true,
          },
        },
      },
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-start-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.start")
      .click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.streaming_info").should("be.visible");
        cy.contains("rooms.streaming_accept").should("be.visible");
        cy.get("#streaming-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            joinRequest.sendResponse();
          });
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false,
        consent_streaming: true,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting with recording", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    const joinRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/start*",
      {
        statusCode: 200,
        body: {
          url: "https://example.org/?foo=a&bar=b",
        },
      },
      "startRequest",
    );

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-start-button"]')
      .should("not.be.disabled")
      .and("have.text", "rooms.start")
      .click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.recording_info").should("be.visible");
        cy.contains("rooms.recording_accept").should("be.visible");
        cy.contains("rooms.recording_video_accept").should("be.visible");

        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();

        // Check loading
        cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            joinRequest.sendResponse();
          });
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting with recording without video", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("startRequest");

    cy.visit("/rooms/abc-def-123");

    cy.get('[data-test="room-start-button"]').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: false,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting guests", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    });

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Test with invalid name
    cy.get('[data-test="room-start-button"]').click();

    // Test with valid name
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#guest-name").type("John Doe");
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();

        cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
          statusCode: 200,
          body: {
            url: "https://example.org/?foo=a&bar=b",
          },
        }).as("startRequest");

        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "John Doe",
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting guests errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    });

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 422,
      body: {
        message: "The given data was invalid",
        errors: {
          name: [
            "The name contains the following non-permitted characters: 123!",
          ],
        },
      },
    }).as("startRequest");

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Test with invalid name
    cy.get('[data-test="room-start-button"]').click();
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("rooms.first_and_lastname");
        cy.get("#guest-name").type("John Doe 123!");
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "John Doe 123!",
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
    });

    // Check if error message is shown
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .contains(
        "The name contains the following non-permitted characters: 123!",
      );

    cy.get("#guest-name").should("have.value", "John Doe 123!");

    // Test 500 error
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("startRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@startRequest");

    // Check that room join dialog stays open and 422 error messages are hidden
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .and(
        "not.include.text",
        "The name contains the following non-permitted characters: 123!",
      );

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
  });

  it("start meeting with access code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    });

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.record_attendance = true;
      room.data.record = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    cy.get('[data-test="room-start-button"]').click();

    // Try to start the meeting
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();

        cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
          statusCode: 200,
          body: {
            url: "https://example.org/?foo=a&bar=b",
          },
        }).as("startRequest");

        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: "",
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting access code errors", function () {
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    cy.visit("/rooms/abc-def-123");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.record_attendance = true;
      room.data.record = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    // Test invalid_code
    // Intercept start request with error response and room request for reload (not authenticated anymore)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("startRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();

    // Check that header is set correctly
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    // Intercept room request for reload (after entering access code)
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();
    cy.wait("@roomRequest");

    // Test require_code
    // Intercept start request with error response and room request for reload (not authenticated anymore)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 403,
      body: {
        message: "require_code",
      },
    }).as("startRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();

    // Check that header is set correctly
    cy.wait("@startRequest").then((interception) => {
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

  it("start meeting token", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: true,
            streaming: false,
          },
        },
      },
    });

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("startRequest");

    cy.interceptRoomFilesRequest();

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get("#record-attendance-agreement").should("not.be.checked").click();
        cy.get("#record-agreement").should("not.be.checked").click();
        cy.get("#record-video-agreement").should("not.be.checked").click();
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    // Check that correct query is sent
    cy.wait("@startRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        name: null,
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true,
        consent_streaming: false,
      });
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting token errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          from: null,
        },
      },
    });
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("startRequest");

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();

    cy.wait("@startRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("start meeting errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: false,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    // Test guests not allowed
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("startRequest");

    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Try to start meeting
    cy.get('[data-test="room-start-button"]')
      .should("have.text", "rooms.start")
      .click();

    cy.wait("@startRequest");

    // Check if error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    // Reload room
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Start meeting errors room settings changed and because of that the agreements are missing
    const startRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/start*",
      {
        statusCode: 422,
        body: {
          message:
            "The consent record attendance must be accepted. (and 1 more error)",
          errors: {
            consent_record_attendance: [
              "The consent record attendance must be accepted.",
            ],
            consent_record: ["The consent record must be accepted."],
          },
        },
      },
      "startRequest",
    );

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-start-button"]').click();

    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        // Make sure that checkboxes for agreements are not shown
        cy.contains("rooms.recording_info").should("not.exist");
        cy.contains("rooms.recording_accept").should("not.exist");
        cy.contains("rooms.recording_video_accept").should("not.exist");

        cy.get("#record-agreement").should("not.exist");
        cy.get("#record-video-agreement").should("not.exist");

        cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
          statusCode: 200,
          body: {
            data: {
              features: {
                recording: true,
                attendance_recording: true,
                streaming: false,
              },
            },
          },
        });

        cy.get('[data-test="dialog-continue-button"]')
          .should("be.disabled")
          .then(() => {
            startRequest.sendResponse();
          });

        cy.wait("@startRequest");

        // Check that checkboxes for agreements are shown
        cy.contains("rooms.recording_info").should("be.visible");
        cy.contains("rooms.recording_accept").should("be.visible");
        cy.contains("rooms.recording_video_accept").should("be.visible");

        cy.get("#record-agreement").should("not.be.checked");
        cy.get("#record-video-agreement").should("not.be.checked");
        cy.get('[data-test="dialog-continue-button"]').should(
          "not.be.disabled",
        );

        // Check if error messages are shown
        cy.contains("The consent record attendance must be accepted.").should(
          "be.visible",
        );
        cy.contains("The consent record must be accepted.").should(
          "be.visible",
        );

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    cy.get('[data-test="room-join-dialog"]').should("not.exist");

    // Start meeting errors missing agreements
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 422,
      body: {
        message: "The consent record attendance must be accepted.",
        errors: {
          consent_record_attendance: [
            "The consent record attendance must be accepted.",
          ],
        },
      },
    }).as("startRequest");

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    });

    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    cy.get('[data-test="room-start-button"]').click();

    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check if error messages are reset
        cy.contains("The consent record attendance must be accepted.").should(
          "not.exist",
        );
        cy.contains("The consent record must be accepted.").should("not.exist");

        // Check if checkboxes are required
        cy.get("#record-agreement")
          .should("not.be.checked")
          .should("have.attr", "required", "required")
          .click();
        cy.get("#record-video-agreement").should("not.be.checked");

        // Check attendance agreement is not shown
        cy.get("#record-attendance-agreement").should("not.exist");

        cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
          statusCode: 200,
          body: {
            data: {
              features: {
                recording: true,
                attendance_recording: true,
                streaming: false,
              },
            },
          },
        });

        // Try to start meeting
        cy.get('[data-test="dialog-continue-button"]').click();

        cy.wait("@startRequest");

        // Check if error messages are shown
        cy.contains("The consent record attendance must be accepted.").should(
          "be.visible",
        );

        // Agree to consent record attendance
        cy.get("#record-attendance-agreement")
          .should("not.be.checked")
          .should("have.attr", "required", "required")
          .click();
      });

    // Test general errors
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("startRequest");

    // Try to start meeting
    cy.get('[data-test="room-join-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@startRequest");

    // Check that room join dialog stays open and 422 error messages are hidden
    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .and(
        "not.include.text",
        "The consent record attendance must be accepted.",
      )
      .and("not.include.text", "The consent record must be accepted.");

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test start forbidden
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("startRequest");

    cy.fixture("room.json").then((room) => {
      room.data.can_start = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Try to start meeting
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@startRequest");
    cy.wait("@roomRequest");

    // Check that room join dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");
    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.start_forbidden");

    // Check that start room button does not exist anymore
    cy.get('[data-test="room-start-button"]').should("not.exist");
    cy.contains("rooms.not_running").should("be.visible");

    // Reload room with permission to start room
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Test room already running
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/start*", {
      statusCode: 474,
      body: {
        message: "The room could not be started because it is already running.",
      },
    }).as("startRequest");

    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-start-button"]').click();
    cy.get('[data-test="room-join-dialog"]').should("be.visible");
    cy.contains("rooms.not_running").should("not.exist");

    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/join", {
      statusCode: 200,
      body: {
        data: {
          features: {
            recording: true,
            attendance_recording: false,
            streaming: false,
          },
        },
      },
    }).as("preJoinRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@startRequest");
    cy.wait("@roomRequest");
    cy.wait("@preJoinRequest");

    cy.get('[data-test="room-join-button"]').should("have.text", "rooms.join");
    cy.get('[data-test="room-start-button"]').should("not.exist");

    cy.get('[data-test="room-join-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("app.errors.room_already_running");

        // Check if join request gets send when clicking on continue button
        cy.intercept("POST", "/api/v1/rooms/abc-def-123/join*", {
          statusCode: 200,
          body: {
            url: "https://example.org/?foo=a&bar=b",
          },
        }).as("joinRequest");

        cy.get('[data-test="dialog-continue-button"]').click();
      });
    cy.wait("@joinRequest");

    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("start meeting load requirements errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T08:18:20.000000Z",
      };
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Test guests not allowed
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("preStartRequest");

    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();

    cy.wait("@preStartRequest");

    // Check if error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Reload room
    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Test general errors
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("preStartRequest");

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();
    cy.wait("@preStartRequest");

    // Check that room join dialog stays open
    cy.get('[data-test="room-join-dialog"]').should("be.visible");

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test invalid_code
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("preStartRequest");

    // Try again
    cy.get('[data-test="loading-retry-button"]').click();

    // Check error message
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    // Check dialog is closed
    cy.get('[data-test="room-start-dialog"]').should("not.exist");

    // Reload
    cy.visit("/rooms/abc-def-123");

    // Test require_code
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 403,
      body: {
        message: "require_code",
      },
    }).as("preStartRequest");

    // Try to join meeting
    cy.get('[data-test="room-start-button"]').click();
    cy.wait("@preStartRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    // Check dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");

    // Reload
    cy.visit("/rooms/abc-def-123");

    // Test invalid_token
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("preStartRequest");

    // Try to join meeting
    cy.get('[data-test="room-start-button"]').click();
    cy.wait("@preStartRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    // Check dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");

    // Reload
    cy.visit("/rooms/abc-def-123");

    // Test missing permissions
    cy.intercept("OPTIONS", "api/v1/rooms/abc-def-123/start", {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("preStartRequest");

    // Try to start meeting
    cy.get('[data-test="room-start-button"]').click();
    cy.wait("@preStartRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.start_forbidden");

    // Check dialog is closed
    cy.get('[data-test="room-join-dialog"]').should("not.exist");
  });
});
