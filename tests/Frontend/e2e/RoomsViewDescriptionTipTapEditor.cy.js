import { selectTiptapContent } from "../support/utils/tiptapHelper.js";

describe("Rooms view description TipTap Editor", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("add image", function () {
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    // Open editor and open dialog to add image
    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    cy.get('[data-test="tip-tap-image-dialog"]').should("not.exist");
    cy.get('[data-test="tip-tap-image-button"]')
      .should("have.class", "p-button-secondary")
      .click();

    // Check that dialog is shown and cancel adding image
    cy.get('[data-test="tip-tap-image-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.description.modals.image.new")
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .click();

    cy.get('[data-test="tip-tap-image-dialog"]').should("not.exist");

    // Open dialog again
    cy.get('[data-test="tip-tap-image-button"]')
      .should("have.class", "p-button-secondary")
      .click();

    cy.get('[data-test="tip-tap-image-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.description.modals.image.new")
      .within(() => {
        // Check that dialog is shown correctly and try to add image
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .should("be.disabled");
        cy.get('[data-test="tip-tap-image-delete-button"]').should("not.exist");
        cy.get('[data-test="src-field"]')
          .should("be.visible")
          .and("include.text", "rooms.description.modals.image.src")
          .within(() => {
            // Type in invalid src
            cy.get("#src")
              .should("have.value", "")
              .type("http://localhost/test.jpg");
          });
        // Check that error message is shown and save button is disabled
        cy.contains("rooms.description.modals.image.invalid_src").should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");
        // Change src to valid value
        cy.get("#src").clear();
        cy.get("#src").type("https://localhost/test.jpg");
        // Check that error message is hidden and save button is enabled
        cy.contains("rooms.description.modals.image.invalid_src").should(
          "not.exist",
        );
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .should("not.be.disabled");
        cy.get('[data-test="width-field"]')
          .should("be.visible")
          .and("include.text", "rooms.description.modals.image.width")
          .within(() => {
            cy.get("#width").should("have.value", "").type("250px");
          });
        cy.get('[data-test="alt-field"]')
          .should("be.visible")
          .and("include.text", "rooms.description.modals.image.alt")
          .within(() => {
            cy.get("#alt").should("have.value", "").type("Test image");
          });

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();
      });

    cy.get('[data-test="tip-tap-image-dialog"]').should("not.exist");

    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("img")
          .should("be.visible")
          .and("have.attr", "src", "https://localhost/test.jpg")
          .and("have.attr", "alt", "Test image")
          .and("have.css", "width", "250px");
      });
  });

  it("edit image", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description =
        '<img src="https://localhost/test.jpg" width="250px" alt="Test image"><p>Room description</p>';

      cy.intercept("GET", "/api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("img")
          .should("be.visible")
          .and("have.attr", "src", "https://localhost/test.jpg")
          .and("have.attr", "alt", "Test image")
          .and("have.css", "width", "250px")
          .click();
      });

    cy.get('[data-test="tip-tap-image-button"]')
      .should("have.class", "p-button-primary")
      .click();

    // Check that dialog contains the correct data and change it
    cy.get('[data-test="tip-tap-image-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.description.modals.image.edit")
      .within(() => {
        // Change to invalid src
        cy.get("#src")
          .should("have.value", "https://localhost/test.jpg")
          .clear();
        cy.get("#src").type("http://localhost/test2.jpg");

        // Check that error message is shown and save button is disabled
        cy.contains("rooms.description.modals.image.invalid_src").should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");

        // Change src back to valid value
        cy.get("#src").clear();
        cy.get("#src").type("https://localhost/test2.jpg");
        // Check that error message is hidden and save button is enabled
        cy.contains("rooms.description.modals.image.invalid_src").should(
          "not.exist",
        );
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .should("not.be.disabled");

        cy.get("#width").should("have.value", "250px").clear();
        cy.get("#width").type("300px");
        cy.get("#alt").should("have.value", "Test image").clear();
        cy.get("#alt").type("Test image 2");

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();
      });

    cy.get('[data-test="tip-tap-image-dialog"]').should("not.exist");
    // Check that the image has been changed
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("img")
          .should("be.visible")
          .and("have.attr", "src", "https://localhost/test2.jpg")
          .and("have.attr", "alt", "Test image 2")
          .and("have.css", "width", "300px");
      });
  });

  it("delete image", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description =
        '<img src="https://localhost/test.jpg" width="250px" alt="Test image"><p>Room description</p>';

      cy.intercept("GET", "/api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("img")
          .should("be.visible")
          .and("have.attr", "src", "https://localhost/test.jpg")
          .and("have.attr", "alt", "Test image")
          .and("have.css", "width", "250px")
          .click();
      });

    cy.get('[data-test="tip-tap-image-button"]')
      .should("have.class", "p-button-primary")
      .click();

    // Check that dialog contains the correct data and delete image
    cy.get('[data-test="tip-tap-image-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.description.modals.image.edit")
      .within(() => {
        cy.get('[data-test="tip-tap-image-delete-button"]')
          .should("have.text", "app.delete")
          .click();
      });

    cy.get('[data-test="tip-tap-image-dialog"]').should("not.exist");

    // Check that the image has been deleted
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("img").should("not.exist");
      });
  });

  it("add link", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "/api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-edit-button"]').click();
    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    // Check that correct data is displayed
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("a").should("not.exist");
        cy.get("p").should("have.text", "Room description").and("be.visible");
      });

    selectTiptapContent();

    cy.get('[data-test="tip-tap-link-dialog"]').should("not.exist");
    cy.get('[data-test="tip-tap-link-button"]')
      .should("have.class", "p-button-secondary")
      .click();

    // Check that dialog is shown and cancel adding link
    cy.get('[data-test="tip-tap-link-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.description.modals.link.new")
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .click();

    cy.get('[data-test="tip-tap-link-dialog"]').should("not.exist");

    // Open dialog again
    selectTiptapContent();

    cy.get('[data-test="tip-tap-link-button"]')
      .should("have.class", "p-button-secondary")
      .click();

    cy.get('[data-test="tip-tap-link-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.description.modals.link.new")
      .within(() => {
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .should("be.disabled");
        cy.get('[data-test="tip-tap-link-delete-button"]').should("not.exist");
        cy.get('[data-test="url-field"]')
          .should("be.visible")
          .and("include.text", "rooms.description.modals.link.url")
          .within(() => {
            // Type in invalid url
            cy.get("#url").should("have.value", "").type("invalid");
          });
        // Check that error message is shown and save button is disabled
        cy.contains("rooms.description.modals.link.invalid_url").should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");

        // Change url to valid value
        cy.get("#url").clear();
        cy.get("#url").type("https://example.org/?foo=a&bar=b");

        // Check that error message is hidden and save button is enabled
        cy.contains("rooms.description.modals.link.invalid_url").should(
          "not.exist",
        );
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .should("not.be.disabled")
          .click();
      });

    cy.get('[data-test="tip-tap-link-dialog"]').should("not.exist");

    // Check that the link has been added
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("a")
          .should("be.visible")
          .and("have.attr", "href", "https://example.org/?foo=a&bar=b")
          .and("have.text", "Room description");
      });

    cy.window().should((win) => {
      const selection = win.getSelection();
      const selectedText = selection.toString();
      expect(selectedText).to.eq("Room description");
    });
  });

  it("edit link", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description =
        '<a href="https://example.org/?foo=a&bar=b">Test Link</a>';

      cy.intercept("GET", "/api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-edit-button"]').click();
    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("a")
          .should("be.visible")
          .and("have.attr", "href", "https://example.org/?foo=a&bar=b")
          .and("have.text", "Test Link");
      });

    // Check that button is already active before selection
    cy.get('[data-test="tip-tap-link-button"]').should(
      "have.class",
      "p-button-primary",
    );

    selectTiptapContent();

    cy.get('[data-test="tip-tap-link-button"]')
      .should("have.class", "p-button-primary")
      .click();

    // Check that dialog contains the correct data and change it
    cy.get('[data-test="tip-tap-link-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.description.modals.link.edit")
      .within(() => {
        // Change to invalid url
        cy.get("#url")
          .should("have.value", "https://example.org/?foo=a&bar=b")
          .clear();
        cy.get("#url").type("invalid");

        // Check that error message is shown and save button is disabled
        cy.contains("rooms.description.modals.link.invalid_url").should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");

        // Change url back to valid value
        cy.get("#url").clear();
        cy.get("#url").type("https://example.org/");

        // Check that error message is hidden and save button is enabled
        cy.contains("rooms.description.modals.link.invalid_url").should(
          "not.exist",
        );
        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .should("not.be.disabled")
          .click();
      });

    cy.get('[data-test="tip-tap-link-dialog"]').should("not.exist");

    cy.window().should((win) => {
      const selection = win.getSelection();
      const selectedText = selection.toString();
      expect(selectedText).to.eq("Test Link");
    });

    // Check that the link has been changed
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("a")
          .should("be.visible")
          .and("have.attr", "href", "https://example.org/")
          .and("have.text", "Test Link")
          .click();
      });
  });

  it("delete link", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description =
        '<a href="https://example.org/?foo=a&bar=b">Test Link</a>';

      cy.intercept("GET", "/api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-edit-button"]').click();
    cy.get('[data-test="room-description-edit-button"]').should("not.exist");

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");
    cy.get(".tiptap")
      .should("be.visible")
      .and("have.focus")
      .within(() => {
        cy.get("a")
          .should("be.visible")
          .and("have.text", "Test Link")
          .and("have.attr", "href", "https://example.org/?foo=a&bar=b");
      });

    selectTiptapContent();

    cy.get('[data-test="tip-tap-link-button"]')
      .should("have.class", "p-button-primary")
      .click();

    // Check that dialog contains the correct data and delete link
    cy.get('[data-test="tip-tap-link-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.description.modals.link.edit")
      .within(() => {
        cy.get('[data-test="tip-tap-link-delete-button"]')
          .should("have.text", "app.delete")
          .click();
      });

    cy.get('[data-test="tip-tap-link-dialog"]').should("not.exist");

    cy.window().should((win) => {
      const selection = win.getSelection();
      const selectedText = selection.toString();
      expect(selectedText).to.eq("Test Link");
    });

    // Check that the link has been deleted
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("a").should("not.exist");
        cy.get("p").should("have.text", "Test Link");
      });
  });

  it("change source code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Room description</p>";

      cy.intercept("GET", "/api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.get('[data-test="room-description-edit-button"]').click();

    cy.get('[data-test="tip-tap-editor"]').should("be.visible");

    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description");
      });

    cy.get('[data-test="tip-tap-source-dialog"]').should("not.exist");
    cy.get('[data-test="tip-tap-source-button"]').click();

    // Check that dialog is shown and cancel changing source code
    cy.get('[data-test="tip-tap-source-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.description.modals.source_code.title")
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .click();

    cy.get('[data-test="tip-tap-source-dialog"]').should("not.exist");

    // Open dialog again
    cy.get('[data-test="tip-tap-source-button"]').click();

    cy.get('[data-test="tip-tap-source-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.description.modals.source_code.title")
      .within(() => {
        cy.get('[data-test="source-textarea"]').should(
          "have.value",
          "<p>Room description</p>",
        );
        cy.get('[data-test="source-textarea"]').type(
          "<h1>Additional room description</h1>",
        );

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();
      });

    cy.get('[data-test="tip-tap-source-dialog"]').should("not.exist");

    // Check that the source code has been changed
    cy.get(".tiptap")
      .should("be.visible")
      .within(() => {
        cy.get("p").should("have.text", "Room description");
        cy.get("h1").should("have.text", "Additional room description");
      });
  });
});
