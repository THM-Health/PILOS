import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Room View general", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
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

    // Check that participant name input is hidden
    cy.get('[data-test="participant-name-field"]').should("not.exist");
    cy.contains("rooms.name_in_video_conference").should("not.exist");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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

    // Check that participant name input is hidden
    cy.get('[data-test="participant-name-field"]').should("not.exist");
    cy.contains("rooms.name_in_video_conference").should("not.exist");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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
    cy.get('[data-test="room-share-button"]').should("exist");
  });

  it("share room", function () {
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.name = 'Meeting One <script>alert("XSS")</script>';
      room.data.short_description = "Room short description";
      room.data.allow_membership = true;
      room.data.legacy_code = false;
      room.data.access_code = "508307005";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.title().should(
      "eq",
      'Meeting One <script>alert("XSS")</script> - PILOS Test',
    );

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should(
      "have.value",
      Cypress.config("baseUrl") + "/rooms/abc-def-123#accessCode=508307005",
    );
    cy.get("#invitationCode").should("have.value", "508-307-005");

    // Copy invitation message
    cy.get('[data-test="room-copy-invitation-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_message");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          `rooms.invitation.room_{"roomname":"Meeting One <script>alert(\\"XSS\\")</script>","platform":"PILOS Test"}\nrooms.invitation.link: ${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005\nrooms.invitation.code: 508-307-005`,
        );
      });

      win.navigator.clipboard.read().then((clipboardItems) => {
        const clipboardItem = clipboardItems[0];
        expect(clipboardItem.types).to.include("text/plain");
        expect(clipboardItem.types).to.include("text/html");

        // Check plaintext
        clipboardItem
          .getType("text/plain")
          .then((b) => b.text())
          .then((text) => {
            expect(text).to.eq(
              `rooms.invitation.room_{"roomname":"Meeting One <script>alert(\\"XSS\\")</script>","platform":"PILOS Test"}\nrooms.invitation.link: ${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005\nrooms.invitation.code: 508-307-005`,
            );
          });

        // Check html
        clipboardItem
          .getType("text/html")
          .then((b) => b.text())
          .then((text) => {
            expect(text).to.contain(
              `<p>rooms.invitation.room_{"roomname":"Meeting One &lt;script&gt;alert(\\"XSS\\")&lt;/script&gt;","platform":"PILOS Test"}<br>rooms.invitation.link: <a href="${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005">${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005</a><br>rooms.invitation.code: 508-307-005</p>`,
            );
          });
      });
    });

    // Copy room link
    cy.get('[data-test="room-share-button"]').click();
    cy.get('[data-test="room-invitation-copy-link-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_url");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          `${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005`,
        );
      });

      win.navigator.clipboard.read().then((clipboardItems) => {
        const clipboardItem = clipboardItems[0];
        expect(clipboardItem.types).to.include("text/plain");
        expect(clipboardItem.types).to.include("text/html");

        // Check plaintext
        clipboardItem
          .getType("text/plain")
          .then((b) => b.text())
          .then((text) => {
            expect(text).to.eq(
              `${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005`,
            );
          });

        // Check html
        clipboardItem
          .getType("text/html")
          .then((b) => b.text())
          .then((text) => {
            expect(text).to.contain(
              `<a href="${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005">${Cypress.config("baseUrl")}/rooms/abc-def-123#accessCode=508307005</a>`,
            );
          });
      });
    });

    // Copy room access code
    cy.get('[data-test="room-share-button"]').click();
    cy.get('[data-test="room-invitation-copy-code-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_code");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("508-307-005");
      });
    });

    // Reload with legacy numeric access code
    cy.fixture("room.json").then((room) => {
      room.data.short_description = "Room short description";
      room.data.allow_membership = true;
      room.data.legacy_code = true;
      room.data.access_code = "012345";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should(
      "have.value",
      Cypress.config("baseUrl") + "/rooms/abc-def-123#accessCode=012345",
    );
    cy.get("#invitationCode").should("have.value", "012345");

    // Copy invitation message
    cy.get('[data-test="room-copy-invitation-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_message");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          'rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\nrooms.invitation.link: ' +
            Cypress.config("baseUrl") +
            "/rooms/abc-def-123#accessCode=012345\nrooms.invitation.code: 012345",
        );
      });
    });

    // Copy room access code
    cy.get('[data-test="room-share-button"]').click();
    cy.get('[data-test="room-invitation-copy-code-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_code");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("012345");
      });
    });

    // Reload with legacy alphanumeric access code
    cy.fixture("room.json").then((room) => {
      room.data.short_description = "Room short description";
      room.data.allow_membership = true;
      room.data.legacy_code = true;
      room.data.access_code = "012abc";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should(
      "have.value",
      Cypress.config("baseUrl") + "/rooms/abc-def-123#accessCode=012abc",
    );
    cy.get("#invitationCode").should("have.value", "012abc");

    // Copy invitation message
    cy.get('[data-test="room-copy-invitation-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_message");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          'rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\nrooms.invitation.link: ' +
            Cypress.config("baseUrl") +
            "/rooms/abc-def-123#accessCode=012abc\nrooms.invitation.code: 012abc",
        );
      });
    });

    // Copy room access code
    cy.get('[data-test="room-share-button"]').click();
    cy.get('[data-test="room-invitation-copy-code-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_code");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("012abc");
      });
    });

    // Reload without access code
    cy.fixture("room.json").then((room) => {
      room.data.short_description = "Room short description";
      room.data.allow_membership = true;
      room.data.legacy_code = false;
      room.data.access_code = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get("#invitationLink").should(
      "have.value",
      Cypress.config("baseUrl") + "/rooms/abc-def-123",
    );
    cy.get("#invitationCode").should("not.exist");

    // Copy invitation message
    cy.get('[data-test="room-copy-invitation-button"]').click();
    cy.checkToastMessage("rooms.invitation.copied_message");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          'rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\nrooms.invitation.link: ' +
            Cypress.config("baseUrl") +
            "/rooms/abc-def-123",
        );
      });

      win.navigator.clipboard.read().then((clipboardItems) => {
        const clipboardItem = clipboardItems[0];
        expect(clipboardItem.types).to.include("text/plain");
        expect(clipboardItem.types).to.include("text/html");

        // Check plaintext
        clipboardItem
          .getType("text/plain")
          .then((b) => b.text())
          .then((text) => {
            expect(text).to.eq(
              `rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\nrooms.invitation.link: ${Cypress.config("baseUrl")}/rooms/abc-def-123`,
            );
          });

        // Check html
        clipboardItem
          .getType("text/html")
          .then((b) => b.text())
          .then((text) => {
            expect(text).to.contain(
              `<p>rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}<br>rooms.invitation.link: <a href="${Cypress.config("baseUrl")}/rooms/abc-def-123">${Cypress.config("baseUrl")}/rooms/abc-def-123</a></p>`,
            );
          });
      });
    });

    // Copy room access code should be missing
    cy.get('[data-test="room-share-button"]').click();
    cy.get('[data-test="room-invitation-copy-code-button"]').should(
      "not.exist",
    );

    // Focus on close button
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get('[data-test="popover-close-button"]').should("have.focus");
    cy.get('[data-test="popover-close-button"]').click();
    cy.get("#invitationLink").should("not.exist");

    // Focus should be back on the share button
    cy.get('[data-test="room-share-button"]').should("have.focus");
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

    // Check that participant name is hidden
    cy.contains("rooms.name_in_video_conference").should("not.exist");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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
    cy.get('[data-test="room-share-button"]').should("exist");
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

    // Check that participant name is hidden
    cy.contains("rooms.name_in_video_conference").should("not.exist");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

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
    cy.get('[data-test="room-share-button"]').should("exist");
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
    cy.get('[data-test="room-share-button"]').should("exist");
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#access-code").type("123456789");

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

    cy.wait("@roomAuthRequest");

    cy.wait("@roomRequest");

    // Test join membership
    const joinMembershipRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/membership*",
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
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
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.get('[data-test="room-join-membership-button"]').should("not.exist");
    cy.get('[data-test="room-end-membership-button"]').should("be.visible");

    // Test end membership
    const endMembershipRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/rooms/abc-def-123/membership*",
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
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#access-code").should("have.value", "123-456-789");

    // Check that no error message is shown even though room request returned authenticated false again
    cy.get(".p-toast-message").should("not.exist");
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#access-code").type("123456789");

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

    cy.wait("@roomAuthRequest");

    cy.wait("@roomRequest");

    // Test join membership with general error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership*", {
      statusCode: 500,
      body: {
        message: "Test join membership error",
      },
    }).as("joinMembershipRequest");

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait("@joinMembershipRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check if error message is shown and close it
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test join membership error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test join membership with invalid token (type code)
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership*", {
      statusCode: 401,
      body: {
        message: "invalid_auth_token",
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-join-membership-button"]').click();

    // Wait for membership request and check that access code is still set
    cy.wait("@membershipRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });
    // Wait for room request and check that access code is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    // Check if error message is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomAuthRequest");

    cy.wait("@roomRequest");

    // Test join membership with membership not available
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership*", {
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Test join membership with 401 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership*", {
      statusCode: 401,
    }).as("joinMembershipRequest");

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.description = "<p>Test</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
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

    // Visit room page again
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

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Check join membership with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept("POST", "api/v1/rooms/abc-def-123/membership*", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("joinMembershipRequest");

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait("@joinMembershipRequest");

    // Check that redirect worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);

    // Reload room with user being a member of the room
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
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@endMembershipRequest").then((interception) => {
      expect(interception.request.query.room_auth_token).to.be.undefined;
      expect(interception.request.query.room_auth_token_type).to.be.undefined;
    });

    cy.wait("@roomRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");

    cy.contains("auth.login").should("be.visible");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Reload room with user being a member of the room
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

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Check end membership with 404 error (room not found)
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/membership", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("endMembershipRequest");

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should("be.visible");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@endMembershipRequest");

    // Check that redirect worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
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
      .should(
        "have.attr",
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting One"}',
      )
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
      'rooms.favorites.remove_for_{"room":"Meeting One"}',
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
      'rooms.favorites.add_for_{"room":"Meeting One"}',
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
      .should(
        "have.attr",
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting One"}',
      )
      .click();

    cy.wait("@addFavoritesRequest");
    cy.wait("@roomRequest");

    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");

    cy.contains("auth.login").should("be.visible");

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

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Test add to favorites with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept("POST", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("addFavoritesRequest");

    cy.get('[data-test="room-favorites-button"]').click();

    cy.wait("@addFavoritesRequest");

    // Check that redirect worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);

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
      .should(
        "have.attr",
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting One"}',
      )
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
      .should(
        "have.attr",
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting One"}',
      )
      .click();

    cy.wait("@deleteFavoritesRequest");
    cy.wait("@roomRequest");

    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Reload room but room is already not in favorites
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

    cy.reload();

    cy.wait("@roomRequest");

    // Test remove from favorites with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("deleteFavoritesRequest");

    cy.get('[data-test="room-favorites-button"]')
      .should(
        "have.attr",
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting One"}',
      )
      .click();

    cy.wait("@deleteFavoritesRequest");

    // Check that redirect worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
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

    // Get login button and check if redirect is correctly set
    cy.get('a[data-test="login-room-button"]').should(
      "have.attr",
      "href",
      "/login?redirect=/rooms/abc-def-123",
    );
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
    // Try with logged in user
    cy.interceptRoomIndexRequests();

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    });

    cy.visit("/rooms/abc-def-123");

    // Check redirect to room index page
    cy.url()
      .should("include", "/rooms")
      .should("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);

    // Try with guest
    cy.intercept("GET", "api/v1/currentUser", {});

    cy.visit("/rooms/abc-def-123");

    // Check redirect to 404 page
    cy.url()
      .should("include", "/404")
      .should("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("auto-reload", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("config.json").then((config) => {
      config.data.room.refresh_rate = 60;
      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.clock();
    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");
    cy.contains("Meeting One").should("be.visible");

    // Wait more than 60 seconds (due to reload randomness) for a auto-reload
    cy.tick(100000);
    cy.get("@roomRequest.all").should("have.length", 2);
  });

  it("auto-reload disabled on error", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("config.json").then((config) => {
      config.data.room.refresh_rate = 60;
      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequest");

    cy.clock();
    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Wait more than 60 seconds (due to reload randomness) for no auto-reload
    cy.tick(100000);
    cy.get("@roomRequest.all").should("have.length", 1);
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

    // Reload page successfully
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");

      cy.reload();
    });

    cy.wait("@roomRequest");

    // Test reload with room not found and guest user
    cy.interceptRoomIndexRequests();

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Check redirect to 404 page worked
    cy.url()
      .should("include", "/404")
      .should("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);

    // Test reload with room not found and authenticated user
    cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");
    cy.contains("Meeting One").should("be.visible");

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("roomRequest");

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Check redirect to room index page worked
    cy.url()
      .should("include", "/rooms")
      .should("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("displays meeting ended reason", function () {
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123?reason=Meeting+ended+by+John+Doe");
    cy.wait("@roomRequest");

    // Reason message should be shown
    cy.get('[data-test="room-meeting-ended-reason"]')
      .should("be.visible")
      .should("have.text", "Meeting ended by John Doe");

    // Close reason message
    cy.get('[data-test="room-meeting-ended-reason"] button').click();

    // Check that reason message is removed
    cy.get('[data-test="room-meeting-ended-reason"]').should("not.exist");

    // Check reason message is removed from URL
    cy.url().should("not.include", "reason");
  });

  it("displays bbb error messages", function () {
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.fixture("en.json").then((locale) => {
      locale.data = {
        rooms: {
          bbb_error_message: {
            guestDeniedAccess: "Guest access denied",
            maxParticipantsReached: "Maximum participants reached",
          },
        },
      };
      cy.intercept("GET", "api/v1/locale/en", {
        statusCode: 200,
        body: locale,
      });
    });

    // Simulate BBB errors
    let errors = encodeURIComponent(
      JSON.stringify([
        { key: "guestDeniedAccess" },
        { key: "maxParticipantsReached" },
        { key: "unknown_error" },
      ]),
    );
    cy.visit(`/rooms/abc-def-123?errors=${errors}`);
    cy.wait("@roomRequest");

    // Check only two error messages are shown
    cy.get('[data-test="room-meeting-bbb-error"]').should("have.length", 2);

    cy.get('[data-test="room-meeting-bbb-error"]')
      .eq(0)
      .should("contain.text", "Guest access denied");
    cy.get('[data-test="room-meeting-bbb-error"]')
      .eq(1)
      .should("contain.text", "Maximum participants reached");

    // Close first error message
    cy.get('[data-test="room-meeting-bbb-error"]').eq(0).find("button").click();

    // Check only one error message is shown
    cy.get('[data-test="room-meeting-bbb-error"]').should("have.length", 1);
    cy.get('[data-test="room-meeting-bbb-error"]')
      .eq(0)
      .should("contain.text", "Maximum participants reached");

    // Check url is updated (closed and invalid error removed)
    cy.url().should("include", "[{%22key%22:%22maxParticipantsReached%22}]");

    // Close last error message
    cy.get('[data-test="room-meeting-bbb-error"]').eq(0).find("button").click();

    // Check no error messages are shown
    cy.get('[data-test="room-meeting-bbb-error"]').should("not.exist");

    // Check url is updated (no errors)
    cy.url().should("not.include", "errors");
  });

  it("hide room owner if not provided", function () {
    cy.interceptRoomFilesRequest();
    cy.fixture("room.json").then((room) => {
      delete room.data.owner;
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room
    cy.visit("/rooms/abc-def-123");
    cy.wait("@roomRequest");

    // room itself will be loaded
    cy.contains("Meeting One").should("be.visible");

    // room should not contain owner name
    cy.contains("John Doe").should("not.exist");
  });
});
