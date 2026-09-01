import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe.skip("Rooms view personalized links actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomPersonalizedLinksRequests();
  });

  it("add new personalized link", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-links-add-button"]').click();
    cy.get('[data-test="room-personalized-links-add-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.personalized_links.add")
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
        const addLinkRequest = interceptIndefinitely(
          "POST",
          "/api/v1/rooms/abc-def-123/personalizedLinks/",
          {
            statusCode: 201,
            body: {
              data: {
                id: 4,
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
          "addLinkRequest",
        );

        cy.fixture("roomPersonalizedLinks.json").then(
          (roomPersonalizedLinks) => {
            roomPersonalizedLinks.data.push({
              id: 4,
              token:
                "rwb8nyBvjtVDi3Wd3zM3ZBAJqHyNM18rtrzvPTiLmm2PK3sZGHSmwS0OscMRPtG8Vt13t2GW1KX6UOQQ7HkmjYGdd8qGJitsflt1",
              firstname: "Laura",
              lastname: "Walter",
              role: 1,
              expires: null,
              last_usage: null,
            });
            roomPersonalizedLinks.meta.per_page = 4;
            roomPersonalizedLinks.meta.to = 4;
            roomPersonalizedLinks.meta.total = 4;
            roomPersonalizedLinks.meta.total_no_filter = 4;

            cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
              statusCode: 200,
              body: roomPersonalizedLinks,
            }).as("roomPersonalizedLinksRequest");
          },
        );

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
            addLinkRequest.sendResponse();
          });
      });

    // Check that correct data was sent
    cy.wait("@addLinkRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        firstname: "Laura",
        lastname: "Walter",
        role: 1,
      });
    });
    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );

    // Check that new personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      4,
    );

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(3)
      .should("include.text", "Laura Walter")
      .and("include.text", "rooms.roles.participant")
      .and("not.include.text", "rooms.personalized_links.last_used_at")
      .and("not.include.text", "rooms.personalized_links.expires_at");
  });

  it("add new personalized link errors", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-links-add-button"]').click();
    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "be.visible",
    );

    // Try to add new personalized link with 422 error (missing firstname, lastname, role)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/personalizedLinks/", {
      statusCode: 422,
      body: {
        message: "The firstname field is required. (and 2 more errors)",
        errors: {
          firstname: ["The firstname field is required."],
          lastname: ["The lastname field is required."],
          role: ["The role field is required."],
        },
      },
    }).as("addLinkRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addLinkRequest");

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

    // Try to add new personalized link with 500 error
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/personalizedLinks/", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("addLinkRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addLinkRequest");

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
      "/api/v1/rooms/abc-def-123/personalizedLinks/",
      "tokens",
    );

    // Reload room page
    cy.interceptRoomViewRequests();
    cy.reload();
    cy.get("#tab-tokens").should("be.visible").click();
    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Test add personalized link with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/personalizedLinks/", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("addLinkRequest");

    cy.get('[data-test="room-personalized-links-add-button"]').click();
    cy.get('[data-test="room-personalized-links-add-dialog"]').should(
      "be.visible",
    );
    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addLinkRequest");

    // Check that redirect to room index page works and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("edit personalized link", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");
    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

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
      .and("include.text", "rooms.personalized_links.edit")
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
        const editLinkRequest = interceptIndefinitely(
          "PUT",
          "/api/v1/rooms/abc-def-123/personalizedLinks/1",
          {
            statusCode: 200,
            body: {
              data: {
                id: 1,
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
          "editLinkRequest",
        );

        cy.fixture("roomPersonalizedLinks.json").then(
          (roomPersonalizedLinks) => {
            roomPersonalizedLinks.data[0].firstname = "Laura";
            roomPersonalizedLinks.data[0].lastname = "Walter";
            roomPersonalizedLinks.data[0].role = 2;

            cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
              statusCode: 200,
              body: roomPersonalizedLinks,
            }).as("roomPersonalizedLinksRequest");
          },
        );

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
            editLinkRequest.sendResponse();
          });
      });

    // Check that correct data was sent
    cy.wait("@editLinkRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        firstname: "Laura",
        lastname: "Walter",
        role: 2,
      });
    });

    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "not.exist",
    );

    // Check that edited personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "Laura Walter")
      .should("include.text", "rooms.roles.moderator")
      .should(
        "include.text",
        'rooms.personalized_links.last_used_at_{"date":"09/17/2021, 16:36"}',
      )
      .should(
        "include.text",
        'rooms.personalized_links.expires_at_{"date":"10/17/2021, 14:21"}',
      );
  });

  it("edit personalized link errors", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .find('[data-test="room-personalized-links-edit-button"]')
      .click();

    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "be.visible",
    );

    // Check with 404 error (personalized link not found / already deleted)
    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/personalizedLinks/3", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room_personalized_link",
        ids: [3],
      },
    }).as("editLinkRequest");

    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 2);
      roomPersonalizedLinks.meta.to = 2;
      roomPersonalizedLinks.meta.total = 2;
      roomPersonalizedLinks.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editLinkRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that personalized link is not shown anymore and dialog is closed
    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      2,
    );

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_gone");

    // Open edit dialog again
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-edit-button"]')
      .click();

    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "be.visible",
    );

    // Try to edit personalized link with 422 error (missing firstname, lastname, role)
    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/personalizedLinks/1", {
      statusCode: 422,
      body: {
        message: "The firstname field is required. (and 2 more errors)",
        errors: {
          firstname: ["The firstname field is required."],
          lastname: ["The lastname field is required."],
          role: ["The selected role is invalid."],
        },
      },
    }).as("editLinkRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editLinkRequest");

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

    // Try to edit personalized link with 500 error
    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/personalizedLinks/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("editLinkRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editLinkRequest");

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
      "/api/v1/rooms/abc-def-123/personalizedLinks/1",
      "tokens",
    );

    // Reload room page
    cy.interceptRoomViewRequests();
    cy.reload();
    cy.get("#tab-tokens").should("be.visible").click();
    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Test edit personalized link with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/personalizedLinks/1", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("editLinkRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-edit-button"]')
      .click();
    cy.get('[data-test="room-personalized-links-edit-dialog"]').should(
      "be.visible",
    );
    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editLinkRequest");

    // Check that redirect to room index page works and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("delete personalized link", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

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
      .and("include.text", "rooms.personalized_links.delete")
      .should(
        "include.text",
        'rooms.personalized_links.confirm_delete_{"firstname":"John","lastname":"Doe"}',
      );

    // Confirm delete of personalized link
    const deleteLinkRequest = interceptIndefinitely(
      "DELETE",
      "/api/v1/rooms/abc-def-123/personalizedLinks/1",
      {
        statusCode: 204,
      },
      "deleteLinkRequest",
    );

    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(1, 3);
      roomPersonalizedLinks.meta.to = 2;
      roomPersonalizedLinks.meta.total = 2;
      roomPersonalizedLinks.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
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
        deleteLinkRequest.sendResponse();
      });

    cy.wait("@deleteLinkRequest");

    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );

    // Check that personalized link was deleted
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      2,
    );
  });

  it("delete personalized link errors", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

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

    // Check with 404 error (personalized link not found / already deleted)
    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/personalizedLinks/3", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room_personalized_link",
        ids: [3],
      },
    }).as("deleteLinkRequest");

    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 2);
      roomPersonalizedLinks.meta.to = 2;
      roomPersonalizedLinks.meta.total = 2;
      roomPersonalizedLinks.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteLinkRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that personalized link is not shown anymore and dialog is closed
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      2,
    );

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_gone");

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
    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/personalizedLinks/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteLinkRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteLinkRequest");

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
      "/api/v1/rooms/abc-def-123/personalizedLinks/1",
      "tokens",
    );

    // Reload room page
    cy.interceptRoomViewRequests();
    cy.reload();
    cy.get("#tab-tokens").should("be.visible").click();
    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Test delete personalized link with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/personalizedLinks/1", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("deleteLinkRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-delete-button"]')
      .click();
    cy.get('[data-test="room-personalized-links-delete-dialog"]').should(
      "be.visible",
    );
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteLinkRequest");

    // Check that redirect to room index page works and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "/rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("copy personalized link", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .find('[data-test="room-personalized-links-copy-button"]')
      .click();

    // Check clipboard content
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(
          Cypress.config("baseUrl") +
            "/rooms/abc-def-123#personalizedLink=1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
        );
      });
    });

    cy.checkToastMessage(
      'rooms.personalized_links.room_link_copied_{"firstname":"John","lastname":"Doe"}',
    );
  });
});
