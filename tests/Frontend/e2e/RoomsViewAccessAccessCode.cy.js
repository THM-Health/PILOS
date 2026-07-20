import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms View access access code", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("room view with access code as logged in user", function () {
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

    // Check that access code overlay is shown correctly
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check header is shown
        cy.contains("Meeting One").should("be.visible");
        cy.contains("Max Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Check that login button is hidden
        cy.get('[data-test="room-login-as-user-button"]').should("not.exist");

        // Check that participant name input is hidden
        cy.get('[data-test="participant-name-field"]').should("not.exist");

        // Check that access code input is shown
        cy.get('[data-test="access-code-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.access_code").should("be.visible");
            cy.get("#access-code").should("be.visible").and("have.value", "");
          });

        // Try to submit with correct access code
        cy.get("#access-code").type("123456789");
      });

    const roomAuthRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/auth",
      {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 0,
          },
        },
      },
      "roomAuthRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    // Check loading
    cy.get("[data-test='reload-room-button']").should("be.disabled");
    cy.get('[data-test="room-login-button"]')
      .should("be.disabled")
      .then(() => {
        roomAuthRequest.sendResponse();
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

    //  Check that access code was set in sessionStorage
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is hidden
    cy.contains("rooms.name_in_video_conference").should("not.exist");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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

    // Reload with access code set in sessionStorage
    cy.log("Reload with access code set in sessionStorage");
    cy.reload();

    // Check that new auth request was sent with the stored access code
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

    // Check that access overlay is not shown
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

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

    // Reload without access code set in sessionStorage but accessCode hash
    cy.log(
      "Reload without access code set in sessionStorage but accessCode hash",
    );
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    cy.reloadWithHash("accessCode=123456789");

    // Check that new auth request was sent with the access code from the hash
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

    // Check that sessionStorage is set
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    // Check that access code is removed from the hash
    cy.url().should("not.contain", "#accessCode");

    // Check that access overlay is not shown
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

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

    // Reload without access code set in sessionStorage and try with valid access code again
    cy.log(
      "Reload without access code set in sessionStorage and try with valid access code again",
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

    cy.window().then((win) => {
      win.sessionStorage.removeItem("roomAccessCode_abc-def-123");
    });

    cy.reload();

    cy.wait("@roomRequest");

    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Try to submit with correct access code
        cy.get("#access-code").type("123456789");
      });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

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

    // Reload with invalid access code
    const errorReloadRoomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123*",
      {
        statusCode: 401,
        body: {
          message: "invalid_auth_token",
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
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
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });
    // Check that access code header is reset for the second request (reload room)
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.not.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Retry with valid access code but no access code needed anymore
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Try to submit with correct access code
        cy.get("#access-code").type("123456789");
      });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 204,
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "123456789",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.get('[data-test="room-access-overlay"]').should("not.exist");
  });

  it("room view with access code as guest", function () {
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

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check that header is shown
        cy.contains("Meeting One").should("be.visible");
        cy.contains("John Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Check that login button is shown
        cy.get('[data-test="room-login-as-user-button"]')
          .should("be.visible")
          .and("have.text", "auth.offer_login")
          .and("have.attr", "href", "/login?redirect=/rooms/abc-def-123");

        // Check that participant name input is shown
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.first_and_lastname").should("be.visible");
            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("not.be.checked");
          });

        // Check that access code input is shown
        cy.get('[data-test="access-code-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.access_code").should("be.visible");
            cy.get("#access-code").should("be.visible").and("have.value", "");
          });

        // Enter guest name
        cy.get("#participant-name").type("Laura Rivera");

        // Enter access code
        cy.get("#access-code").type("123456789");
      });

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 204,
    }).as("checkParticipantNameRequest");

    const roomAuthRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/auth",
      {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 0,
          },
        },
      },
      "roomAuthRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Test</p>";
      room.data.current_user = null;
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@checkParticipantNameRequest");

    // Check loading
    cy.get("[data-test='reload-room-button']").should("be.disabled");
    cy.get('[data-test="room-login-button"]')
      .should("be.disabled")
      .then(() => {
        roomAuthRequest.sendResponse();
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

    //  Check that access code was set in sessionStorage
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

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

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("not.exist");

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

    // Reload with access code provided through hash params
    cy.log("Reload with access code provided through hash params");
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    cy.fixture("room.json").then((room) => {
      room.data.authenticated = false;
      room.data.current_user = null;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reloadWithHash("accessCode=123456789");

    cy.wait("@roomRequest");

    // Check that access overlay is shown and access code is prefilled
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check that header is shown
        cy.contains("Meeting One").should("be.visible");
        cy.contains("John Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Check that login button is shown
        cy.get('[data-test="room-login-as-user-button"]')
          .should("be.visible")
          .and("have.text", "auth.offer_login")
          .and("have.attr", "href", "/login?redirect=/rooms/abc-def-123");

        // Check that participant name input is shown
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.first_and_lastname").should("be.visible");
            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("not.be.checked");
          });

        // Check that access code input is shown
        cy.get('[data-test="access-code-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.access_code").should("be.visible");
            cy.get("#access-code")
              .should("be.visible")
              .and("have.value", "123-456-789");
          });
      });

    // Reload with access code set in sessionStorage
    cy.log("Reload with access code set in sessionStorage");
    cy.fixture("room.json").then((room) => {
      room.data.authenticated = false;
      room.data.current_user = null;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");

    // Check that access overlay is shown and access code is prefilled
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check that header is shown
        cy.contains("Meeting One").should("be.visible");
        cy.contains("John Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Check that login button is shown
        cy.get('[data-test="room-login-as-user-button"]')
          .should("be.visible")
          .and("have.text", "auth.offer_login")
          .and("have.attr", "href", "/login?redirect=/rooms/abc-def-123");

        // Check that participant name input is shown
        cy.get('[data-test="participant-name-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.first_and_lastname").should("be.visible");
            cy.get("#participant-name")
              .should("be.visible")
              .and("have.value", "");
            cy.contains("rooms.remember_participant_name").should("be.visible");
            cy.get("#remember-participant-name").and("not.be.checked");
          });

        // Check that access code input is shown
        cy.get('[data-test="access-code-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.access_code").should("be.visible");
            cy.get("#access-code")
              .should("be.visible")
              .and("have.value", "123-456-789");
          });
      });

    // Reload without access code set in sessionStorage but saved guestName
    cy.log(
      "Reload without access code set in sessionStorage but saved guestName",
    );
    cy.fixture("room.json").then((room) => {
      room.data.authenticated = false;
      room.data.current_user = null;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    const checkParticipantNameRequest = interceptIndefinitely(
      "POST",
      "api/v1/participantName/check",
      {
        statusCode: 204,
      },
      "checkParticipantNameRequest",
    );

    cy.window().then((win) => {
      win.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      win.sessionStorage.clear();
    });

    cy.reload();

    // Check loading
    cy.get('[data-test="room-loading-spinner"]')
      .should("be.visible")
      .then(() => {
        checkParticipantNameRequest.sendResponse();
      });

    cy.wait("@checkParticipantNameRequest");

    cy.wait("@roomRequest");

    // Check that access overlay is shown and guest name is prefilled
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check that header is shown
        cy.contains("Meeting One").should("be.visible");
        cy.contains("John Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Check that login button is shown
        cy.get('[data-test="room-login-as-user-button"]')
          .should("be.visible")
          .and("have.text", "auth.offer_login")
          .and("have.attr", "href", "/login?redirect=/rooms/abc-def-123");

        // Check that participant name input is shown
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

        // Check that access code input is shown
        cy.get('[data-test="access-code-field"]')
          .should("be.visible")
          .within(() => {
            cy.contains("rooms.access_code").should("be.visible");
            cy.get("#access-code").should("be.visible").and("have.value", "");
          });
      });

    // Reload with access code set in sessionStorage and saved guestName
    cy.log("Reload with access code set in sessionStorage and saved guestName");

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
      room.data.description = "<p>Test</p>";
      room.data.current_user = null;
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.window().then((win) => {
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789");
    });

    cy.reload();

    cy.wait("@checkParticipantNameRequest");

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

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should("be.visible");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("not.exist");
    cy.get('[data-test="room-favorites-button"]').should("not.exist");

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
  });

  it("room view with legacy access code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.legacy_code = true;
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
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Meeting One").should("be.visible");
        cy.contains("Max Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Submit valid access code
        cy.get("#access-code").type("012abc");
      });

    // Intercept room auth request
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
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "012abc",
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
  });

  it("room auth with access code errors", function () {
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

    // Check that access overlay is shown correctly
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Meeting One").should("be.visible");
        cy.contains("Max Doe").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );
        // Try to submit without access code
      });

    // Check with 422 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 422,
      body: {
        message: "The Access code field is required.",
        errors: {
          access_code: ["The Access code field is required."],
        },
      },
    }).as("roomAuthRequest");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.contains("The Access code field is required.").should("be.visible");
      });

    // Check with invalid_code error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("roomAuthRequest");

    // Intercept room request (reload room)
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

    // Try to submit with invalid access code
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.get("#access-code").type("987654321");
      });

    cy.get('[data-test="room-login-button"]').click();

    // Wait for room auth request and check if access code is set
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    // Wait for room request
    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.get("#access-code").should("have.value", "987-654-321");
      });

    // Reload with invalid access code set in session storage
    cy.window().then((win) => {
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "987654321");
    });

    cy.reload();

    // Wait for room auth request and check if access code is set
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    // Wait for room request
    cy.wait("@roomRequest");

    // Check that invalid access code in session storage was cleared
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.get("#access-code").should("have.value", "987-654-321");
      });

    // Intercept room auth request and respond with rate limit error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 429,
      body: {
        limit: "room_auth",
        retry_after: 5,
      },
    }).as("roomAuthRequest");

    cy.clock();

    cy.get('[data-test="room-login-button"]').click();

    // Wait for room auth request
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
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

    // Check with 500 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomAuthRequest");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that access overlay is still shown and not disabled
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#access-code").should("not.be.disabled");
    cy.get('[data-test="room-login-button"]').should("not.be.disabled");

    // Check with guests not allowed
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomAuthRequest");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    // Check if error message is shown
    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Check that access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check with 404 error (room not found) as authenticated user
    cy.interceptRoomIndexRequests();
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("roomAuthRequest");

    cy.reload();

    cy.wait("@roomRequest");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest");

    // Check that redirect to room index page worked
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "/rooms/abc-def-123");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);

    // Check with 404 error (room not found) as guest
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get("#participant-name").type("Max Doe");

    cy.intercept("POST", "api/v1/participantName/check", {
      statusCode: 204,
    }).as("checkParticipantNameRequest");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@checkParticipantNameRequest");
    cy.wait("@roomAuthRequest");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

    // Check that redirect to 404 page worked
    cy.url().should("include", "/404").and("not.include", "/rooms/abc-def-123");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("room view with access code errors", function () {
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
    cy.get("#access-code").type("123456789");

    // Check with invalid token error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    const roomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123*",
      {
        statusCode: 401,
        body: {
          message: "invalid_auth_token",
        },
      },
      "roomRequest",
    );

    cy.get('[data-test="room-login-button"]').click();

    // Wait for room auth request and check if access code is set
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "123456789",
        type: 0,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    cy.fixture("room.json")
      .then((room) => {
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
      })
      .then(() => {
        roomRequest.sendResponse();
      });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Check with 500 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRequest");

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "123456789",
        type: 0,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that access code overlay is still shown and not disabled
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#access-code").should("not.be.disabled");
    cy.get('[data-test="room-login-button"]').should("not.be.disabled");
  });

  it("reload with access code errors", function () {
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
    cy.get("#access-code").type("123456789");

    // Check with invalid token error
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
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = true;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    // Test reload with invalid token error
    const roomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123*",
      {
        statusCode: 401,
        body: {
          message: "invalid_auth_token",
        },
      },
      "roomRequest",
    );

    cy.get('[data-test="reload-room-button"]').click();

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
          roomRequest.sendResponse();
        });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Revisit as a member with a saved access code and check that a later reload requiring the code resets saved access parameters
    cy.log(
      "Revisit as a member with a saved access code and check that a later reload requiring the code resets saved access parameters",
    );
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
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = true;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

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

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    cy.get('[data-test="room-access-overlay"]').should("not.exist");
    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("be.visible");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    cy.checkToastMessage("rooms.require_access_code");

    cy.contains("rooms.flash.access_code_invalid").should("not.exist");
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#access-code").should("have.value", "");
  });
});
