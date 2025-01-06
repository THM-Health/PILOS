import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";
import {
  clearTiptapContent,
  selectTiptapContent,
} from "../support/utils/tiptapHelper.js";
describe("Rooms view description", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("view with different permissions", function () {
    // Check view for guest
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.contains("rooms.description.title").should("be.visible");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

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
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

    // Check for co_owner
    cy.intercept("GET", "api/v1/currentUser", {
      fixture: "currentUser.json",
    });

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      room.data.is_co_owner = true;
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="room-description-edit-button"]')
      .should("have.text", "app.edit")
      .and("not.be.disabled");

    // Check with rooms.manage permission
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
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="room-description-edit-button"]')
      .should("have.text", "app.edit")
      .and("not.be.disabled");
  });

  it("edit description", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="tip-tap-editor"]').should("not.exist");
    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="room-description-edit-button"]').should("not.exist");
    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    // Check that editor shows the correct description
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    clearTiptapContent();

    // Cancel editing
    cy.get('[data-test="room-description-cancel-edit-button"]')
      .should("have.text", "app.cancel_editing")
      .click();
    cy.get('[data-test="room-description-cancel-edit-button"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");

    // Open editor again and check that description stayed the same
    cy.get('[data-test="room-description-edit-button"]').click();
    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    // Edit description
    clearTiptapContent();
    cy.get(".tiptap").type("New test description");

    // Save description
    const saveDescriptionRequest = interceptIndefinitely(
      "PUT",
      "api/v1/rooms/abc-def-123/description",
      {
        statusCode: 204,
      },
      "saveDescriptionRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>New test description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-description-save-button"]').click();

    // Check loading
    cy.get('[data-test="overlay"]').should("be.visible");
    cy.get('[data-test="room-description-cancel-edit-button"]').should(
      "be.disabled",
    );
    cy.get('[data-test="room-description-save-button"]')
      .should("be.disabled")
      .then(() => {
        saveDescriptionRequest.sendResponse();
      });

    cy.wait("@saveDescriptionRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        description: "<p>New test description</p>",
      });
    });
    cy.wait("@roomRequest");

    // Check that editor is closed and new description is shown
    cy.get('[data-test="room-description-cancel-edit-button"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p")
          .should("have.text", "New test description")
          .and("be.visible");
      });
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");
    cy.get('[data-test="room-description-edit-button"]').should("be.visible");

    // Check with different description with different options
    cy.get('[data-test="room-description-edit-button"]').click();
    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("p")
          .should("have.text", "New test description")
          .and("be.visible");
      });

    selectTiptapContent();

    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]').should(
      "have.length",
      0,
    );

    cy.get('[data-test="tip-tap-text-type-dropdown"]').click();

    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]').should(
      "have.length",
      4,
    );
    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]')
      .eq(0)
      .should("have.text", "rooms.description.heading1")
      .should("be.visible");
    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]')
      .eq(1)
      .should("have.text", "rooms.description.heading2")
      .should("be.visible");
    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]')
      .eq(2)
      .should("have.text", "rooms.description.heading3")
      .should("be.visible");
    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]')
      .eq(3)
      .should("have.text", "rooms.description.paragraph")
      .should("be.visible");

    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]').eq(0).click();
    cy.get('[data-test="tip-tap-menu-dropdown-item-button"]').should(
      "have.length",
      0,
    );

    // Check that description was changed correctly
    cy.get(".tiptap")
      .should("be.visible")
      .should("have.focus")
      .within(() => {
        cy.get("h1")
          .should("have.text", "New test description")
          .and("be.visible");
        cy.get("p").should("not.exist");
      });

    cy.window().should((win) => {
      const selection = win.getSelection();
      const selectedText = selection.toString();
      expect(selectedText).to.eq("New test description");
    });

    cy.get('[data-test="tip-tap-bold-button"]')
      .should("be.visible")
      .and("have.class", "p-button-secondary")
      .and("have.attr", "data-p-severity", "secondary")
      .click();

    cy.window().should((win) => {
      const selection = win.getSelection();
      const selectedText = selection.toString();
      expect(selectedText).to.eq("New test description");
    });

    cy.get('[data-test="tip-tap-bold-button"]')
      .should("be.visible")
      .and("have.class", "p-button-primary")
      .and("have.attr", "data-p-severity", "primary");

    // Check that description was changed correctly
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("h1")
          .find("strong")
          .should("have.text", "New test description")
          .and("be.visible");
        cy.get("p").should("not.exist");
      });

    // Save description
    cy.intercept("PUT", "api/v1/rooms/abc-def-123/description", {
      statusCode: 204,
    }).as("saveDescriptionRequest");

    cy.fixture("room.json").then((room) => {
      room.data.description = "<h1><strong>New test description</strong></h1>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-description-save-button"]').click();

    cy.wait("@saveDescriptionRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        description: "<h1><strong>New test description</strong></h1>",
      });
    });
    cy.wait("@roomRequest");

    // Check that editor is closed and new description is shown
    cy.get('[data-test="room-description-cancel-edit-button"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("h1")
          .find("strong")
          .should("have.text", "New test description")
          .and("be.visible");
        cy.get("p").should("not.exist");
      });
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");
    cy.get('[data-test="room-description-edit-button"]').should("be.visible");
  });

  it("edit description errors", function () {
    cy.visit("/rooms/abc-def-123");

    cy.contains("rooms.description.missing").should("be.visible");
    cy.get('[data-test="room-description-viewer"]').should("not.exist");

    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    // Check saving with 422 error
    cy.intercept("PUT", "api/v1/rooms/abc-def-123/description", {
      statusCode: 422,
      body: {
        message: "The Description must not be greater than 65000 characters",
        errors: {
          description: [
            "The Description must not be greater than 65000 characters.",
          ],
        },
      },
    }).as("saveDescriptionRequest");

    cy.get('[data-test="room-description-save-button"]').click();

    cy.wait("@saveDescriptionRequest");

    cy.contains(
      "The Description must not be greater than 65000 characters.",
    ).should("be.visible");

    // Check saving with 500 error
    cy.intercept("PUT", "api/v1/rooms/abc-def-123/description", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveDescriptionRequest");

    cy.get('[data-test="room-description-save-button"]').click();

    cy.wait("@saveDescriptionRequest");

    // Check that 422 error message is hidden
    cy.contains(
      "The Description must not be greater than 65000 characters.",
    ).should("not.exist");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Cancel editing
    cy.get('[data-test="room-description-cancel-edit-button"]').click();

    cy.get('[data-test="room-description-cancel-edit-button"]').should(
      "not.exist",
    );
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");

    // Check with auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-description-edit-button"]').click();
        cy.get('[data-test="tip-tap-editor"]').should("be.visible");
        cy.get('[data-test="room-description-save-button"]').click();
      },
      "PUT",
      "api/v1/rooms/abc-def-123/description",
      "description",
    );
  });

  it("description changes", function () {
    cy.visit("/rooms/abc-def-123");

    cy.contains("rooms.description.missing").should("be.visible");
    cy.get('[data-test="room-description-viewer"]').should("not.exist");
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");

    // Click on reload room button and check that description is changed
    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.contains("rooms.description.missing").should("not.exist");
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");

    // Open editor
    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="room-description-viewer"]').should("not.exist");
    cy.contains("rooms.description.missing").should("not.exist");

    // Reload room with different description
    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Changed room description</p>";

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    // Check that description inside the editor stays the same
    cy.get('[data-test="tip-tap-editor"]').should("be.visible");
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    cy.get('[data-test="room-description-viewer"]').should("not.exist");
    cy.contains("rooms.description.missing").should("not.exist");

    // Cancel editing and check that new description is shown
    cy.get('[data-test="room-description-cancel-edit-button"]').click();

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("p")
          .should("have.text", "Changed room description")
          .and("be.visible");
      });
    cy.get('[data-test="tip-tap-editor"]').should("not.exist");
  });

  it("open external link", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description =
        '<a href="https://example.org/?foo=a&bar=b">Test Link</a>';

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer-confirm-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("a").should("have.text", "Test Link").click();
      });

    // Check that modal is shown
    cy.get('[data-test="room-description-viewer-confirm-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.description.external_link_warning.title")
      .should(
        "include.text",
        'rooms.description.external_link_warning.description_{"link":"https://example.org/?foo=a&bar=b"}',
      )
      .within(() => {
        // Cancel opening link
        cy.get('[data-test="confirm-dialog-reject-button"]')
          .should("have.text", "app.cancel")
          .click();
      });

    cy.get('[data-test="room-description-viewer-confirm-dialog"]').should(
      "not.exist",
    );

    // Click on link again and confirm opening link
    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        cy.get("a").should("have.text", "Test Link").click();
      });

    cy.window().then((win) => {
      cy.stub(win, "open").as("openExternalLink").returns(true);
    });

    cy.get('[data-test="room-description-viewer-confirm-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.description.external_link_warning.title")
      .should(
        "include.text",
        'rooms.description.external_link_warning.description_{"link":"https://example.org/?foo=a&bar=b"}',
      )
      .within(() => {
        cy.get('[data-test="confirm-dialog-accept-button"]')
          .should("have.text", "app.continue")
          .click();
      });

    cy.get("@openExternalLink")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");
  });

  it("sanitize html", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description =
        "" +
        '<script>alert("XSS Code")</script>' +
        '<a href="https://example.org/?foo=a&bar=b">Test Link</a>' +
        '<p style="text-align: center; color: rgb(255, 0, 0); background-color: rgb(0, 255, 0);" >Content with valid style</p>' +
        '<p style="text-align: justify; color: rgba(255, 0, 0, 0); background-color: rgba(0, 255, 0, 0);">Content with invalid style values</p>' +
        '<p style="text-align: center; color: rgb(0, 0, 255); background-color: rgb(255, 255, 0); position: absolute" >Content with invalid style attributes</p>' +
        '<img src="http://example.org/demo.png" width="250px"  alt="Image text"/>' +
        "<button>Button</button>";
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-viewer"]')
      .should("be.visible")
      .within(() => {
        // Check that dangerous code is removed
        // Check that HTML attributes that are not allowed are removed
        cy.get("script").should("not.exist");

        // Check that HTML tags that are not allowed are removed
        cy.get("button").should("not.exist");

        // Check that src that is not allowed is removed
        cy.get("img").should("not.exist");

        // Check that allowed style attributes are shown
        cy.get("p")
          .contains("Content with valid style")
          .should("be.visible")
          .and(
            "have.attr",
            "style",
            "text-align: center; color: rgb(255, 0, 0); background-color: rgb(0, 255, 0);",
          );

        // Check that allowed style attributes are removed when they contain values that are not allowed
        cy.get("p")
          .contains("Content with invalid style values")
          .should("be.visible")
          .and("have.attr", "style", "");

        // Check that style attributes that are not allowed are removed
        cy.get("p")
          .contains("Content with invalid style attributes")
          .should("be.visible")
          .and(
            "have.attr",
            "style",
            "text-align: center; color: rgb(0, 0, 255); background-color: rgb(255, 255, 0);",
          );

        // Check that other code is shown
        cy.get("a")
          .contains("Test Link")
          .should("be.visible")
          .should("have.attr", "href", "https://example.org/?foo=a&bar=b");
      });
  });
});
