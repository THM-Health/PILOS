import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms View access", function () {
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

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

        // Check that access code input is not shown
        cy.get('[data-test="access-code-field"]').should("not.exist");

        // Enter guest name
        cy.get("#participant-name").type("Laura Rivera");

        cy.get('[data-test="room-login-button"]')
          .should("have.text", "rooms.continue_as_guest")
          .click();
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

    // Reload page
    cy.reload();

    // Check that access overlay is shown
    cy.title().should("eq", "Meeting Two - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check that header is shown
        cy.contains("Meeting Two").should("be.visible");
        cy.contains("Max Doe").should("be.visible");
        cy.contains(
          'rooms.index.room_component.running_since_{"date":"08/21/2023, 04:18"}',
        ).should("be.visible");

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

        // Check that access code input is not shown
        cy.get('[data-test="access-code-field"]').should("not.exist");
      });

    // Check that name is still not set in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });
  });

  it("rooms view as guest with remember me enabled", function () {
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

        // Check that access code input is not shown
        cy.get('[data-test="access-code-field"]').should("not.exist");

        // Enter guest name
        cy.get("#participant-name").type("Laura Rivera");

        // Check remember me
        cy.get("#remember-participant-name").check();

        cy.get('[data-test="room-login-button"]')
          .should("have.text", "rooms.continue_as_guest")
          .click();
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

    // Check that name was set in the local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.eq(
        "Laura Rivera",
      );
    });

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

    // Reload page
    cy.reload();

    // Check that room is still shown with the same guest name
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

    // Check that name is still set in the local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.eq(
        "Laura Rivera",
      );
    });

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

    cy.visit("/rooms/abc-def-123#accessCode=123456789");
    cy.reload();

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

    cy.visit("/rooms/abc-def-123#accessCode=123-456-789");
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

    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    cy.reload();

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

        // Try to submit with invalid access code
        cy.get("#access-code").type("987654321");
      });

    // Check with invalid_code error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("roomAuthRequest");

    cy.get('[data-test="room-login-button"]').click();

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

    cy.get('[data-test="room-login-button"]').click();

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

  it("room view with personalized link (participant)", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    // Intercept room auth request
    const roomAuthRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/auth",
      {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      },
      "roomAuthRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.get("[data-test='room-loading-spinner']")
      .should("be.visible")
      .then(() => {
        roomAuthRequest.sendResponse();
      });

    cy.title().should("eq", "Meeting One - PILOS Test");

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    // Check that room auth token is set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that sessionStorage was set
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that personalized link was removed from url
    cy.url().should("not.include", "#personalizedLink");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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

    // Reload page with personalizedLink set in sessionStorage
    cy.log("Reload page with personalizedLink set in sessionStorage");
    cy.reload();
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    // Check that room auth token is set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that sessionStorage is still set
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
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
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_personalized_link",
      },
    }).as("roomAuthRequest");

    cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
      statusCode: 401,
      body: {
        message: "invalid_auth_token",
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_invalid");
    cy.contains("rooms.invalid_personalized_link").should("be.visible");
  });

  it("room view with personalized link (moderator)", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    // Intercept room auth request
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_moderator = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.title().should("eq", "Meeting One - PILOS Test");

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    // Check that header for token is set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that sessionStorage was set
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that personalized link was removed from url
    cy.url().should("not.include", "#personalizedLink");

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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

  it("room view with personalized link legacy route", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    // Intercept room auth request
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_moderator = false;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with personalized link (legacy personalized link route)
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.title().should("eq", "Meeting One - PILOS Test");

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    // Check that header for token is set
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that sessionStorage was set
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that personalized link is not visible in the url
    cy.url().should("not.include", "#personalizedLink");
    cy.url().should(
      "not.include",
      "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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

  it("room auth with personalized link errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    // 401 invalid personalize link
    // Intercept room auth request
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_personalized_link",
      },
    }).as("roomAuthRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123")).to
        .be.null;
    });

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_invalid");
    cy.contains("rooms.invalid_personalized_link").should("be.visible");

    // Reload and check with 422 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 422,
      body: {
        message: "The Access token field is required.",
        errors: {
          personalized_link_token: ["The Access token field is required."],
        },
      },
    }).as("roomAuthRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123")).to
        .be.null;
    });

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_invalid");
    cy.contains("rooms.invalid_personalized_link").should("be.visible");

    // Check with guests only error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 420,
      body: {
        message: "guests_only",
      },
    }).as("roomAuthRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123")).to
        .be.null;
    });

    cy.checkToastMessage("app.flash.guests_only");
    cy.url()
      .should("not.include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    // Check with 500 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomAuthRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123")).to
        .be.null;
    });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that reload button is shown
    cy.get('[data-test="reload-button"]').should("be.visible");

    // Click reload button and make sure auth request is sent again
    // Reload with valid auth request and room request
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-button"]').click();

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that room is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check with 404 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("roomAuthRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    // Check that redirect to 404 page worked and error message is shown
    cy.url().should("include", "/404").and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("room view with personalized link errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    // Check with 401 invalid token error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
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

    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 401,
        body: {
          message: "invalid_personalized_link",
        },
      }).as("roomAuthRequest");

      roomRequest.sendResponse();
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that error message is shown
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

    cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
      statusCode: 420,
      body: {
        message: "guests_only",
      },
    }).as("roomRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.checkToastMessage("app.flash.guests_only");
    cy.url()
      .should("not.include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    // Check with 500 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRequest");

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that reload button is shown
    cy.get('[data-test="reload-button"]').should("be.visible");

    // Intercept room auth request with different token
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "differentToken",
          type: 1,
        },
      },
    }).as("differentRoomAuthRequest");

    // Click reload button and make sure room request is sent again with same auth token
    // Reload with valid room request
    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    //  Check that room is shown correctly
    cy.contains("Meeting One").should("be.visible");
    cy.contains("John Doe").should("be.visible");
    cy.contains("rooms.index.room_component.never_started").should(
      "be.visible",
    );

    // Check that room auth request was not sent again
    cy.get("@differentRoomAuthRequest").should("be.null");
  });

  it("visit with personalized link as authenticated user", function () {
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

    // Visit room with personalized link
    cy.visit(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    // Check that error message is shown and user is redirected to the home page
    cy.checkToastMessage("app.flash.guests_only");
    cy.url().should(
      "not.include",
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );
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

  it("reload with personalized link errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    // Check with 401 invalid token error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 201,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check with invalid token error
    cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
      statusCode: 401,
      body: {
        message: "invalid_auth_token",
      },
    }).as("roomRequest");

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_personalized_link",
      },
    }).as("roomAuthRequest");

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    cy.wait("@roomAuthRequest");

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that error message is shown
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

    cy.fixture("room.json").then((room) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
      statusCode: 420,
      body: {
        message: "guests_only",
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.guests_only");
    cy.url()
      .should("not.include", "/rooms")
      .and("not.include", "rooms/abc-def-123");
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

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        // Check that login button is shown
        cy.get('[data-test="room-login-as-user-button"]').should("be.visible");

        // Check that guest name input is shown and enter name
        cy.get("#participant-name").should("be.visible").type("Max Doe");

        // Check that access code input is hidden
        cy.get('[data-test="access-code-field"]').should("not.exist");

        // Login
        cy.get('[data-test="room-login-button"]').click();
      });

    cy.window().then((win) => {
      expect(win.localStorage.getItem("pilos_guest_name")).to.be.null;
    });

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

    cy.get('[data-test="room-login-button"]')
      .should("have.text", "rooms.continue_as_guest")
      .click();

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

        // Save
        cy.get('[data-test="dialog-save-button"]').click();
      });

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

    cy.get('[data-test="room-login-button"]')
      .should("have.text", "rooms.continue_as_guest")
      .click();

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

  it("saved access parameter priority", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.is_member = true;
      room.data.username = "Max Doe";

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.window().then((win) => {
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789");
      win.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Visit with all possible saved access parameters set
    cy.visit(
      "/rooms/abc-def-123#accessCode=987654321&personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
    );

    // Check that room access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check that auth was called with personalized link from hash
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
    cy.contains("Laura Rivera").should("not.exist");

    //Check that sessionStorage value for personalized link was updated to the value from hash
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

      // Reset to previous value
      win.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Reload without personalized link in hash
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
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

    cy.visit("/rooms/abc-def-123#accessCode=987654321");
    cy.reload();

    // Check that auth was called with access code from hash
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");
    cy.contains("Max Doe").should("not.exist");

    // Check that sessionStorage value for access code was updated to the value from hash
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      // Reset access code to previous value
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789");
    });

    // Reload without access code in hash
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.is_member = true;
      room.data.username = "Max Doe";

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.visit("/rooms/abc-def-123");
    cy.reload();

    // Check that auth was called with personalized link from sessionStorage
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
    cy.contains("Laura Rivera").should("not.exist");
  });
});
