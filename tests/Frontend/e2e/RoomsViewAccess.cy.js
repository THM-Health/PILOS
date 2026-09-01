import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe.skip("Rooms View access", function () {
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

        // Check loading state
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
    cy.window().should((win) => {
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
    cy.window().should((win) => {
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

        cy.intercept("POST", "api/v1/participantName/check", {
          statusCode: 204,
        }).as("checkParticipantNameRequest");

        cy.get('[data-test="room-login-button"]')
          .should("have.text", "rooms.continue_as_guest")
          .click();
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

    // Check that name was set in the local storage
    cy.window().should((win) => {
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
    cy.window().should((win) => {
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

        cy.intercept("POST", "api/v1/participantName/check", {
          statusCode: 204,
        }).as("checkParticipantNameRequest");

        // Check that access code input is hidden
        cy.get('[data-test="access-code-field"]').should("not.exist");

        // Login
        cy.get('[data-test="room-login-button"]').click();
      });

    cy.wait("@checkParticipantNameRequest");

    cy.window().should((win) => {
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
});
