import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view personalized links token actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomPersonalizedLinksRequests();
  });

  it("add new token", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-links-add-button"]').click();
    cy.get('[data-test="room-personalized-links-add-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.tokens.add")
      .within(() => {
        cy.get('[data-test="firstname-field"]')
          .should("include.text", "app.firstname")
          .find("#firstname")
          .should("have.value", "")
          .type("Laura");

        cy.get('[data-test="lastname-field"]')
          .should("include.text", "app.lastname")
          .find("#lastname")
          .should("have.value", "")
          .type("Walter");

        // Check that role checkboxes are shown correctly
        cy.get('[data-test="participant-role-group"]')
          .should("include.text", "rooms.roles.participant")
          .find("#participant-role")
          .should("not.be.checked");

        cy.get('[data-test="moderator-role-group"]')
          .should("include.text", "rooms.roles.moderator")
          .find("#moderator-role")
          .should("not.be.checked");

        cy.get("#participant-role").click();
        cy.get("#participant-role").should("be.checked");

        // Add new personalized link
        const addTokenRequest = interceptIndefinitely(
          "POST",
          "/api/v1/rooms/abc-def-123/tokens/",
          {
            statusCode: 201,
            body: {
              data: {
                token:
                  "rwb8nyBvjtVDi3Wd3zM3ZBAJqHyNM18rtrzvPTiLmm2PK3sZGHSmwS0OscMRPtG8Vt13t2GW1KX6UOQQ7HkmjYGdd8qGJitsflt1",
                firstname: "Laura",
                lastname: "Walter",
                role: 1,
                expires: null,
                last_usage: null,
              },
            },
          },
          "addTokenRequest",
        );

        cy.fixture("roomTokens.json").then((roomTokens) => {
          roomTokens.data.push({
            token:
              "rwb8nyBvjtVDi3Wd3zM3ZBAJqHyNM18rtrzvPTiLmm2PK3sZGHSmwS0OscMRPtG8Vt13t2GW1KX6UOQQ7HkmjYGdd8qGJitsflt1",
            firstname: "Laura",
            lastname: "Walter",
            role: 1,
            expires: null,
            last_usage: null,
          });
          roomTokens.meta.per_page = 4;
          roomTokens.meta.to = 4;
          roomTokens.meta.total = 4;
          roomTokens.meta.total_no_filter = 4;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
            statusCode: 200,
            body: roomTokens,
          }).as("roomTokensRequest");
        });

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();

        // Check loading
        cy.get("#firstname").should("be.disabled");
        cy.get("#lastname").should("be.disabled");
        cy.get("#participant-role").should("be.disabled");
        cy.get("#moderator-role").should("be.disabled");

        cy.get('[data-test="dialog-save-button"]').should("be.disabled");
        cy.get('[data-test="dialog-cancel-button"]')
          .should("be.disabled")
          .and("include.text", "app.cancel")
          .then(() => {
            addTokenRequest.sendResponse();
          });
      });

    // Check that correct data was sent
    cy.wait("@addTokenRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        firstname: "Laura",
        lastname: "Walter",
        role: 1,
      });
    });
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );

    // Check that new token is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      4,
    );

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(3)
      .should("include.text", "Laura Walter")
      .and("include.text", "rooms.roles.participant")
      .and("not.include.text", "rooms.tokens.last_used_at")
      .and("not.include.text", "rooms.tokens.expires_at");
  });

  it("add new token errors", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-links-add-button"]').click();
    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "be.visible",
    );

    // Try to add new token with 422 error (missing firstname, lastname, role)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/tokens/", {
      statusCode: 422,
      body: {
        errors: {
          firstname: ["The firstname field is required."],
          lastname: ["The lastname field is required."],
          role: ["The role field is required."],
        },
      },
    }).as("addTokenRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addTokenRequest");

    // Check that dialog stays open and errors are shown
    cy.get('[data-test="room-personalized-links-add-dialog"]')
      .should("be.visible")
      .and("include.text", "The role field is required.")
      .within(() => {
        cy.get('[data-test="firstname-field"]').should(
          "include.text",
          "The firstname field is required.",
        );
        cy.get('[data-test="lastname-field"]').should(
          "include.text",
          "The lastname field is required.",
        );
      });

    // Try to add new token with 500 error
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/tokens/", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("addTokenRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addTokenRequest");

    // Check that dialog stays open and 422 errors are hidden
    cy.get('[data-test="room-personalized-links-add-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="firstname-field"]').should(
          "not.include.text",
          "The firstname field is required.",
        );
        cy.get('[data-test="lastname-field"]').should(
          "not.include.text",
          "The lastname field is required.",
        );
      });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-personalized-links-add-button"]').click();
        cy.get('[data-test="room-personalized-links-add-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').click();
      },
      "POST",
      "/api/v1/rooms/abc-def-123/tokens/",
      "tokens",
    );
  });

  it("edit token", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");
    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe")
      .and("include.text", "rooms.roles.participant");

    // Open edit dialog
    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "not.exist",
    );

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-edit-button"]')
      .click();

    cy.get('[data-test="room-personalized-links-edit-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.tokens.edit")
      .within(() => {
        cy.get('[data-test="firstname-field"]')
          .should("include.text", "app.firstname")
          .find("#firstname")
          .should("have.value", "John")
          .clear();

        cy.get("#firstname").type("Laura");

        cy.get('[data-test="lastname-field"]')
          .should("include.text", "app.lastname")
          .find("#lastname")
          .should("have.value", "Doe")
          .clear();

        cy.get("#lastname").type("Walter");

        // Check that role checkboxes are shown correctly
        cy.get('[data-test="participant-role-group"]')
          .should("include.text", "rooms.roles.participant")
          .find("#participant-role")
          .should("be.checked");

        cy.get('[data-test="moderator-role-group"]')
          .should("include.text", "rooms.roles.moderator")
          .find("#moderator-role")
          .should("not.be.checked");

        // Switch role to moderator
        cy.get("#moderator-role").click();
        cy.get("#moderator-role").should("be.checked");
        cy.get("#participant-role").should("not.be.checked");

        // Edit personalized link
        const editTokenRequest = interceptIndefinitely(
          "PUT",
          "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
          {
            statusCode: 200,
            body: {
              data: {
                token:
                  "1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
                firstname: "Laura",
                lastname: "Walter",
                role: 2,
                expires: "2021-10-17T12:21:19.000000Z",
                last_usage: "2021-09-17T14:36:11.000000Z",
              },
            },
          },
          "editTokenRequest",
        );

        cy.fixture("roomTokens.json").then((roomTokens) => {
          roomTokens.data[0].firstname = "Laura";
          roomTokens.data[0].lastname = "Walter";
          roomTokens.data[0].role = 2;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
            statusCode: 200,
            body: roomTokens,
          }).as("roomTokensRequest");
        });

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();

        // Check loading
        cy.get("#firstname").should("be.disabled");
        cy.get("#lastname").should("be.disabled");
        cy.get("#participant-role").should("be.disabled");
        cy.get("#moderator-role").should("be.disabled");

        cy.get('[data-test="dialog-save-button"]').should("be.disabled");
        cy.get('[data-test="dialog-cancel-button"]')
          .should("be.disabled")
          .and("include.text", "app.cancel")
          .then(() => {
            editTokenRequest.sendResponse();
          });
      });

    // Check that correct data was sent
    cy.wait("@editTokenRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        firstname: "Laura",
        lastname: "Walter",
        role: 2,
      });
    });

    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "not.exist",
    );

    // Check that edited token is shown
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "Laura Walter")
      .should("include.text", "rooms.roles.moderator")
      .should(
        "include.text",
        'rooms.tokens.last_used_at_{"date":"09/17/2021, 16:36"}',
      )
      .should(
        "include.text",
        'rooms.tokens.expires_at_{"date":"10/17/2021, 14:21"}',
      );
  });

  it("edit token errors", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .find('[data-test="room-personalized-links-edit-button"]')
      .click();

    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "be.visible",
    );

    // Check with 404 error (token not found / already deleted)
    cy.intercept(
      "PUT",
      "/api/v1/rooms/abc-def-123/tokens/hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus",
      {
        statusCode: 404,
        body: {
          message: "No query results for model",
        },
      },
    ).as("editTokenRequest");

    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 2);
      roomTokens.meta.to = 2;
      roomTokens.meta.total = 2;
      roomTokens.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editTokenRequest");
    cy.wait("@roomTokensRequest");

    // Check that token is not shown anymore and dialog is closed
    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      2,
    );

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.token_gone");

    // Open edit dialog again
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-edit-button"]')
      .click();

    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "be.visible",
    );

    // Try to edit token with 422 error (missing firstname, lastname, role)
    cy.intercept(
      "PUT",
      "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
      {
        statusCode: 422,
        body: {
          errors: {
            firstname: ["The firstname field is required."],
            lastname: ["The lastname field is required."],
            role: ["The selected role is invalid."],
          },
        },
      },
    ).as("editTokenRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editTokenRequest");

    // Check that dialog stays open and errors are shown
    cy.get('[data-test="room-personalized-links-edit-dialog"]')
      .should("be.visible")
      .and("include.text", "The selected role is invalid.")
      .within(() => {
        cy.get('[data-test="firstname-field"]').should(
          "include.text",
          "The firstname field is required.",
        );
        cy.get('[data-test="lastname-field"]').should(
          "include.text",
          "The lastname field is required.",
        );
      });

    // Try to edit token with 500 error
    cy.intercept(
      "PUT",
      "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("editTokenRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editTokenRequest");

    // Check that dialog stays open and 422 errors are hidden
    cy.get('[data-test="room-personalized-links-edit-dialog"]')
      .should("be.visible")
      .and("not.include.text", "The selected role is invalid.")
      .within(() => {
        cy.get('[data-test="firstname-field"]').should(
          "not.include.text",
          "The firstname field is required.",
        );
        cy.get('[data-test="lastname-field"]').should(
          "not.include.text",
          "The lastname field is required.",
        );
      });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "not.exist",
    );

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-personalized-link-item"]')
          .eq(0)
          .find('[data-test="room-personalized-links-edit-button"]')
          .click();
        cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').click();
      },
      "PUT",
      "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
      "tokens",
    );
  });

  it("delete token", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      3,
    );

    // Open delete personalized link dialog
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-delete-button"]')
      .click();
    cy.get('[data-test="room-personalized-links-delete-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.tokens.delete")
      .should(
        "include.text",
        'rooms.tokens.confirm_delete_{"firstname":"John","lastname":"Doe"}',
      );

    // Confirm delete of personalized link
    const deleteTokenRequest = interceptIndefinitely(
      "DELETE",
      "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
      {
        statusCode: 204,
      },
      "deleteTokenRequest",
    );

    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(1, 3);
      roomTokens.meta.to = 2;
      roomTokens.meta.total = 2;
      roomTokens.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    // Check loading
    cy.get('[data-test="dialog-continue-button"]').should("be.disabled");
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .and("be.disabled")
      .then(() => {
        deleteTokenRequest.sendResponse();
      });

    cy.wait("@deleteTokenRequest");

    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );

    // Check that token was deleted
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      2,
    );
  });

  it("delete token errors", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      3,
    );

    // Open delete personalized link dialog
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .find('[data-test="room-personalized-links-delete-button"]')
      .click();
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "be.visible",
    );

    // Check with 404 error (token not found / already deleted)
    cy.intercept(
      "DELETE",
      "/api/v1/rooms/abc-def-123/tokens/hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus",
      {
        statusCode: 404,
        body: {
          message: "No query results for model",
        },
      },
    ).as("deleteTokenRequest");

    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 2);
      roomTokens.meta.to = 2;
      roomTokens.meta.total = 2;
      roomTokens.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteTokenRequest");
    cy.wait("@roomTokensRequest");

    // Check that token is not shown anymore and dialog is closed
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      2,
    );

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.token_gone");

    // Open delete dialog again
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-delete-button"]')
      .click();
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "be.visible",
    );

    // Check with 500 error
    cy.intercept(
      "DELETE",
      "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("deleteTokenRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteTokenRequest");

    // Check that dialog stays open and error is shown
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "be.visible",
    );
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-personalized-link-item"]')
          .eq(0)
          .find('[data-test="room-personalized-links-delete-button"]')
          .click();
        cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="dialog-continue-button"]').click();
      },
      "DELETE",
      "/api/v1/rooms/abc-def-123/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
      "tokens",
    );
  });

  it("copy token", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-copy-button"]')
      .click();

    // Close dialog with copy and close button
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          Cypress.config("baseUrl") +
            "/rooms/abc-def-123/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
        );
      });
    });

    cy.checkToastMessage(
      'rooms.tokens.room_link_copied_{"firstname":"John","lastname":"Doe"}',
    );
  });
});
