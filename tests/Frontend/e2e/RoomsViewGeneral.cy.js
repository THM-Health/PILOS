import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Room View general", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("room view as guest", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("not.exist");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("not.exist");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Check that correct tab is shown
    cy.contains("rooms.files.title").should("be.visible");

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should("not.exist");

    // Test reloading the room
    cy.fixture("room.json").then((room) => {
      room.data.name = "Meeting Two";
      room.data.owner.id = 2;
      room.data.owner.name = "Max Doe";
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.description = "<p>Test</p>";
      room.data.access_code = null;
      room.data.current_user = null;

      const reloadRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123",
        {
          statusCode: 200,
          body: room,
        },
        "roomRequest",
      );

      // Trigger reload
      cy.get('[data-test="reload-room-button"]').click();
      cy.get('[data-test="reload-room-button"]')
        .should("be.disabled")
        .then(() => {
          reloadRequest.sendResponse();
        });
    });

    cy.title().should("eq", "Meeting Two - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting Two").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains(
      'rooms.index.room_component.running_since_{"date":"08/21/2023, 04:18"}',
    ).should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");
  });

  it("room view with access code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access code input is shown correctly
    cy.get('[data-test="room-access-code-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Meeting One").should("be.visible");
        cy.contains("Max Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );
        cy.contains("rooms.require_access_code").should("be.visible");

        // Try to submit invalid access code
        cy.get("#access-code").type("987654321");
      });

    // Intercept first request to respond with error
    const errorRoomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123",
      {
        statusCode: 401,
        body: {
          message: "invalid_code",
        },
      },
      "roomRequest",
    );

    cy.get('[data-test="room-login-button"]').click();

    // Intercept second request (reload room) and send response of the first request
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      })
        .as("roomRequest")
        .then(() => {
          errorRoomRequest.sendResponse();
        });
    });

    // Wait for first request and check if access code gets set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("987654321");
    });

    // Wait for second request and check if access code gets reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    // Intercept first request to respond with error
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 429,
      body: {
        limit: "room_auth",
        retry_after: 5,
      },
    }).as("roomRequest");

    cy.clock();

    cy.get('[data-test="room-login-button"]').click();

    // Wait for first request and check if access code gets set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("987654321");
    });

    // Check if input and buttons are disabled
    cy.get("#access-code").should("be.disabled");
    cy.get('[data-test="room-login-button"]').should("be.disabled");
    cy.get('[data-test="reload-room-button"]').should("be.disabled");

    // Check countdown
    for (let i = 5; i > 0; i--) {
      // Check if countdown message is updated
      cy.contains('rooms.auth_throttled_{"try_again":' + i + "}").should(
        "be.visible",
      );

      // Tick clock 1 sec forward
      cy.tick(1000);
    }

    // restore the clock
    cy.clock().then((clock) => {
      clock.restore();
    });

    // Check toast message
    cy.checkToastMessage("app.flash.too_many_requests");

    // Check if input and buttons are enabled again
    cy.get("#access-code").should("not.be.disabled");
    cy.get('[data-test="room-login-button"]').should("not.be.disabled");
    cy.get('[data-test="reload-room-button"]').should("not.be.disabled");

    // Clear access code input
    cy.get("#access-code").clear();

    // Submit correct access code
    cy.get('[data-test="room-access-code-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.get("#access-code").type("123456789");
      });

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    cy.get('[data-test="room-access-code-overlay"]').should("not.exist");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("be.visible");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Check that the correct tab is shown
    cy.contains("rooms.description.title").should("be.visible");

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should("not.exist");

    // Reload with invalid access code
    const errorReloadRoomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123",
      {
        statusCode: 401,
        body: {
          message: "invalid_code",
        },
      },
      "roomRequest",
    );

    cy.get('[data-test="reload-room-button"]').click();

    // Intercept second request (reload room) and send response of the first request
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      })
        .as("roomRequest")
        .then(() => {
          errorReloadRoomRequest.sendResponse();
        });
    });

    // Check that access code header is set for the first request
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });
    // Check that access code header is reset for the second request (reload room)
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
  });

  it("room view as member", function () {
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T08:20:28.000000Z",
      };
      room.data.allow_membership = true;
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains(
      'rooms.index.room_component.last_ran_till_{"date":"08/21/2023, 10:20"}',
    ).should("be.visible");

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("be.visible");
    cy.get('[data-test="room-favorites-button"]').should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("not.exist");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Check that correct tab is shown
    cy.contains("rooms.files.title").should("be.visible");

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should("not.exist");
  });

  it("room view as moderator", function () {
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_moderator = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("be.visible");
    cy.get('[data-test="room-favorites-button"]').should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("not.exist");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Check that correct tab is shown
    cy.contains("rooms.files.title").should("be.visible");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should(
      "have.value",
      Cypress.config("baseUrl") + "/rooms/abc-def-123",
    );
    cy.get("#invitationCode").should("have.value", "508-307-005");

    cy.get('[data-test="room-copy-invitation-button"]').click();

    cy.checkToastMessage("rooms.invitation.copied");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          'rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\nrooms.invitation.link: ' +
            Cypress.config("baseUrl") +
            "/rooms/abc-def-123\nrooms.invitation.code: 508-307-005",
        );
      });
    });
  });

  it("room view as co-owner", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains(
      'rooms.index.room_component.running_since_{"date":"08/21/2023, 10:18"}',
    ).should("be.visible");

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("be.visible");
    cy.get('[data-test="room-favorites-button"]').should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("be.visible");
    cy.get("#tab-tokens").should("be.visible");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("be.visible");
    cy.get("#tab-settings").should("be.visible");

    // Check that correct tab is shown
    cy.contains("rooms.description.title").should("be.visible");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should("include.value", "/rooms/abc-def-123");
    cy.get("#invitationCode").should("have.value", "508-307-005");
  });

  it("room view as owner", function () {
    cy.fixture("room.json").then((room) => {
      room.data.short_description = "Room short description";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("Room short description").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("be.visible");
    cy.get("#tab-tokens").should("be.visible");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("be.visible");
    cy.get("#tab-settings").should("be.visible");

    // Check that correct tab is shown
    cy.contains("rooms.description.title").should("be.visible");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should("include.value", "/rooms/abc-def-123");
    cy.get("#invitationCode").should("have.value", "508-307-005");
  });

  it("room view with token (participant)", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that header for token is set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("not.exist");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("not.exist");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Check that correct tab is shown
    cy.contains("rooms.files.title").should("be.visible");

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should("not.exist");

    // Reload with invalid token
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");
    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("room view with token (moderator)", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_moderator = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that header for token is set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("not.exist");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("not.exist");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Check that correct tab is shown
    cy.contains("rooms.files.title").should("be.visible");

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should("not.exist");
  });

  it("room view with rooms.viewAll permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.allow_membership = true;

      room.data.current_user.permissions = ["rooms.viewAll"];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("be.visible");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("be.visible");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("be.visible");
    cy.get("#tab-tokens").should("be.visible");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("be.visible");
    cy.get("#tab-settings").should("be.visible");

    // Check that correct tab is shown
    cy.contains("rooms.description.title").should("be.visible");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should("include.value", "/rooms/abc-def-123");
    cy.get("#invitationCode").should("have.value", "508-307-005");
  });

  it("room view streaming enabled", function () {
    // Enable streaming
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.type.features.streaming.enabled = true;
      room.data.allow_membership = true;
      room.data.current_user.permissions = ["rooms.viewAll"];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that tabs are shown correctly
    cy.get("#tab-streaming")
      .should("be.visible")
      .should("have.attr", "data-feature-disabled", "false");
  });

  it("room view streaming disabled", function () {
    // Enable streaming
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.type.features.streaming.enabled = false;
      room.data.allow_membership = true;
      room.data.current_user.permissions = ["rooms.viewAll"];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that tabs are shown correctly
    cy.get("#tab-streaming").should("not.exist");

    // Show disabled features
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    cy.reload();

    // Check that tabs are shown correctly
    cy.get("#tab-streaming")
      .should("exist")
      .should("have.attr", "data-feature-disabled", "true");

    cy.get('[data-test="room-feature-disabled-dialog"]').should("not.exist");

    cy.get("#tab-streaming").click();

    cy.get('[data-test="room-feature-disabled-dialog"]')
      .should("be.visible")
      .and(
        "include.text",
        'rooms.feature_disabled_roomtype_{"name":"rooms.streaming.title"}',
      );
    cy.get('[data-test="dialog-close-button"]').click();

    // Disable system wide
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    cy.reload();
    // Check that tabs are shown correctly
    cy.get("#tab-streaming")
      .should("exist")
      .should("have.attr", "data-feature-disabled", "true");

    cy.get('[data-test="room-feature-disabled-dialog"]').should("not.exist");

    cy.get("#tab-streaming").click();

    cy.get('[data-test="room-feature-disabled-dialog"]')
      .should("be.visible")
      .and(
        "include.text",
        'rooms.feature_disabled_system_{"name":"rooms.streaming.title"}',
      );
    cy.get('[data-test="dialog-close-button"]').click();
  });

  it("membership button", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    // Test join membership
    const joinMembershipRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/membership",
      {
        statusCode: 204,
      },
      "joinMembershipRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-join-membership-button"]').click();
    cy.get('[data-test="room-join-membership-button"]')
      .should("be.disabled")
      .then(() => {
        joinMembershipRequest.sendResponse();
      });

    cy.wait("@joinMembershipRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("be.visible");

    // Test end membership
    const endMembershipRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/rooms/abc-def-123/membership",
      {
        statusCode: 204,
      },
      "endMembershipRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();
    cy.get('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        endMembershipRequest.sendResponse();
      });

    cy.wait("@endMembershipRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
    cy.get("#access-code").should("have.value", "123-456-789");
  });

  it("membership button errors", function () {
    // Join membership errors
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    // Test join membership with general error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 500,
      body: {
        message: "Test join membership error",
      },
    }).as("joinMembershipRequest");

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait("@joinMembershipRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test join membership error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test join membership with invalid code
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("membershipRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-join-membership-button"]').click();

    // Wait for membership request and check that access code is still set
    cy.wait("@membershipRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });
    // Wait for room request and check that access code is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    // Visit room page again
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");

    // Test join membership with membership not available
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 403,
      body: {
        message:
          "Membership failed! Membership for this room is currently not available.",
      },
    }).as("membershipRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait("@membershipRequest");
    cy.wait("@roomRequest");

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Membership failed! Membership for this room is currently not available."}',
      'app.flash.server_error.error_code_{"statusCode":403}',
    ]);

    cy.get('[data-test="room-join-membership-button"]').should("not.exist");

    // Reload room with allow membership enabled
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Test join membership with 401 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 401,
    }).as("joinMembershipRequest");

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.description = "<p>Test</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait("@joinMembershipRequest");
    cy.wait("@roomRequest");

    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");

    cy.contains("auth.login").should("be.visible");

    // Reload room with user being a member of the room
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // End membership errors

    // Test end membership with general error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 500,
      body: {
        message: "Test end membership error",
      },
    }).as("endMembershipRequest");

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@endMembershipRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test end membership error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close end membership dialog
    cy.get('[data-test="end-membership-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="end-membership-dialog"]').should("not.exist");

    // Test end membership with 401 error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 401,
    }).as("endMembershipRequest");

    // Check with 401 errors but room has an access code
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;
      room.data.allow_membership = true;
      room.data.description = "<p>Test</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@endMembershipRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    cy.wait("@roomRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");

    cy.contains("auth.login").should("be.visible");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
  });

  it("trigger favorites button", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Test add room to favorites
    const addToFavoritesRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/favorites",
      {
        statusCode: 204,
      },
      "addFavoritesRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
      room.data.is_favorite = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-favorites-button"]')
      .should("have.attr", "aria-label", "rooms.favorites.add")
      .click();
    cy.get('[data-test="room-favorites-button"]')
      .should("be.disabled")
      .then(() => {
        addToFavoritesRequest.sendResponse();
      });

    cy.wait("@addFavoritesRequest");
    cy.wait("@roomRequest");

    // Check that button is changed to remove from favorites
    cy.get('[data-test="room-favorites-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.favorites.remove",
    );

    // Test remove room from favorites
    const deleteFromFavorites = interceptIndefinitely(
      "DELETE",
      "api/v1/rooms/abc-def-123/favorites",
      {
        statusCode: 204,
      },
      "deleteFavoritesRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-favorites-button"]').click();
    cy.get('[data-test="room-favorites-button"]')
      .should("be.disabled")
      .then(() => {
        deleteFromFavorites.sendResponse();
      });

    cy.wait("@deleteFavoritesRequest");
    cy.wait("@roomRequest");

    // Check that button is changed to add to favorites
    cy.get('[data-test="room-favorites-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.favorites.add",
    );
  });

  it("trigger favorites button errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Test add room to favorites with general error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 500,
      body: {
        message: "Test add favorite error",
      },
    }).as("addFavoritesRequest");

    cy.get('[data-test="room-favorites-button"]').click();

    cy.wait("@addFavoritesRequest");
    cy.wait("@roomRequest");

    // Check that error message is shown and button stayed the same
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test add favorite error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test add to favorites with unauthenticated error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 401,
    }).as("addFavoritesRequest");

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.description = "<p>Test</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-favorites-button"]')
      .should("have.attr", "aria-label", "rooms.favorites.add")
      .click();

    cy.wait("@addFavoritesRequest");
    cy.wait("@roomRequest");

    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");

    cy.contains("auth.login").should("be.visible");

    // Reload room but room is already in favorites
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
      room.data.is_favorite = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Test remove room from favorites with general error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 500,
      body: {
        message: "Test remove favorite error",
      },
    }).as("deleteFavoritesRequest");

    cy.get('[data-test="room-favorites-button"]')
      .should("have.attr", "aria-label", "rooms.favorites.remove")
      .click();

    cy.wait("@deleteFavoritesRequest");
    cy.wait("@roomRequest");

    // Check that error message is shown and button stayed the same
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test remove favorite error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test remove from favorites with unauthenticated error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 401,
    }).as("deleteFavoritesRequest");

    // Check with 401 errors but room has an access code
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;
      room.data.allow_membership = true;
      room.data.description = "<p>Test</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-favorites-button"]')
      .should("have.attr", "aria-label", "rooms.favorites.remove")
      .click();

    cy.wait("@deleteFavoritesRequest");
    cy.wait("@roomRequest");

    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");
  });

  it("visit with guest forbidden", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequest");

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");
    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Get reload button and reload without error
    const reloadRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123",
      { fixture: "room.json" },
      "roomRequest",
    );
    cy.get('[data-test="reload-room-button"]').click();
    cy.get('[data-test="reload-room-button"]')
      .should("be.disabled")
      .then(() => {
        reloadRequest.sendResponse();
      });

    cy.wait("@roomRequest");
    cy.contains("Meeting One").should("be.visible");
  });

  it("visit with token as authenticated user", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.is_member = true;
      room.data.is_moderator = true;
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Check that error message is shown and user is redirected to the home page
    cy.checkToastMessage("app.flash.guests_only");
    cy.url().should(
      "not.include",
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );
  });

  it("visit with invalid token", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("roomRequest");

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Check that error message is shown
    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("visit with general error", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    });

    cy.visit("/rooms/abc-def-123");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="no-room-overlay"]').should("be.visible");

    // Get reload button and reload without error
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.get('[data-test="reload-button"]')
      .eq(0)
      .should("have.text", "app.reload")
      .click();

    cy.wait("@roomRequest");
    cy.contains("Meeting One").should("be.visible");

    // Check that overlay is hidden
    cy.get('[data-test="no-room-overlay"]').should("not.exist");
  });

  it("visit with room not found", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 404,
      body: {
        message: "No query results for model [App\\Room] abc-def-123",
      },
    });

    cy.visit("/rooms/abc-def-123");

    cy.url()
      .should("include", "/404")
      .should("not.include", "/rooms/abc-def-123");
  });

  it("reload with errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");
    cy.contains("Meeting One").should("be.visible");

    // Test reload with guests forbidden
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");
    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Test reload with general error
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test reload with room not found
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 404,
      body: {
        message: "No query results for model [App\\Room] abc-def-123",
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    cy.url()
      .should("include", "/404")
      .should("not.include", "/rooms/abc-def-123");
  });

  it("logged in status change", function () {
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("be.visible");
    cy.get("#tab-tokens").should("be.visible");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("be.visible");
    cy.get("#tab-settings").should("be.visible");

    // Change current user to guest
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("not.exist");
    cy.get("#tab-members").should("not.exist");
    cy.get("#tab-tokens").should("not.exist");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("not.exist");
    cy.get("#tab-settings").should("not.exist");

    // Change current user to co_owner
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_co_owner = true;
      room.data.current_user = {
        id: 2,
        firstname: "Max",
        lastname: "Doe",
        user_locale: "en",
        permissions: ["rooms.create"],
        model_name: "User",
        room_limit: -1,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    // Check that tabs are shown correctly
    cy.get("#tab-description").should("be.visible");
    cy.get("#tab-members").should("be.visible");
    cy.get("#tab-tokens").should("be.visible");
    cy.get("#tab-files").should("be.visible");
    cy.get("#tab-recordings").should("be.visible");
    cy.get("#tab-history").should("be.visible");
    cy.get("#tab-settings").should("be.visible");
  });
});
