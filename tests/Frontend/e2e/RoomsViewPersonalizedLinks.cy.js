import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view personalized links", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomPersonalizedLinksRequests();
  });

  it("load personalized links", function () {
    const roomPersonalizedLinksRequest = interceptIndefinitely(
      "GET",
      "/api/v1/rooms/abc-def-123/personalizedLinks*",
      { fixture: "roomPersonalizedLinks.json" },
      "roomPersonalizedLinksRequest",
    );

    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-tokens").click();

    cy.url().should("include", "/rooms/abc-def-123#tab=tokens");

    // Check loading
    cy.get('[data-test="overlay"]').should("be.visible");

    cy.get('[data-test="room-personalized-links-search"]').within(() => {
      cy.get("input").should("be.disabled");
      cy.get("button").should("be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get("button").should("be.disabled");
    });

    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "be.disabled",
    );

    cy.get('[data-test="room-personalized-links-reload-button"]')
      .should("be.disabled")
      .then(() => {
        roomPersonalizedLinksRequest.sendResponse();
      });

    cy.wait("@roomPersonalizedLinksRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    // Check loading is done
    cy.get('[data-test="room-personalized-links-search"]').within(() => {
      cy.get("input").should("not.be.disabled");
      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "not.be.disabled",
    );

    cy.get('[data-test="room-personalized-links-reload-button"]').should(
      "not.be.disabled",
    );

    // Check list of personalized links
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      3,
    );

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe")
      .should(
        "include.text",
        'rooms.personalized_links.last_used_at_{"date":"09/17/2021, 16:36"}',
      )
      .should(
        "include.text",
        'rooms.personalized_links.expires_at_{"date":"10/17/2021, 14:21"}',
      )
      .should("include.text", "rooms.roles.participant");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(1)
      .should("include.text", "Max Doe")
      .should("not.include.text", "rooms.personalized_links.last_used_at")
      .should("not.include.text", "rooms.personalized_links.expires_at")
      .should("include.text", "rooms.roles.moderator");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .should("include.text", "Tammy Law")
      .should(
        "include.text",
        'rooms.personalized_links.last_used_at_{"date":"10/03/2021, 19:24"}',
      )
      .should(
        "include.text",
        'rooms.personalized_links.expires_at_{"date":"10/20/2021, 11:17"}',
      )
      .should("include.text", "rooms.roles.moderator");
  });

  it("load personalized links errors", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomPersonalizedLinksRequest");

    cy.visit("/rooms/abc-def-123#tab=tokens");
    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-personalized-links-search"]').within(() => {
      cy.get("input").should("not.be.disabled");
      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "not.be.disabled",
    );

    cy.get('[data-test="room-personalized-links-reload-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check if personalized link is shown and contains the correct data
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe");

    // Check that reload button does not exist
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomPersonalizedLinksRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-personalized-links-search"]').within(() => {
      cy.get("input").should("not.be.disabled");
      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="filter-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "not.be.disabled",
    );

    cy.get('[data-test="room-personalized-links-reload-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check if personalized link is shown and contains the correct data
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe");

    // Check that reload button does not exist
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // 401 error room that has no access code
    cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
      statusCode: 401,
    }).as("roomPersonalizedLinksRequest");

    cy.interceptRoomFilesRequest();
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomPersonalizedLinksRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Enter guest name
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get("#participant-name").type("Max Doe");
    cy.get('[data-test="room-login-button"]').click();
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check that file tab is shown
    cy.wait("@roomFilesRequest");

    cy.url().should("not.include", "#tab=tokens");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user and personalized links
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-tokens").click();

    // 401 error but room has an access code
    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
      statusCode: 401,
    }).as("roomPersonalizedLinksRequest");

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomPersonalizedLinksRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // 401 error but guests are forbidden
    // Reload with logged in user and personalized links
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-tokens").click();

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
      statusCode: 401,
    }).as("roomPersonalizedLinksRequest");

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomPersonalizedLinksRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user and personalized links
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-tokens").click();

    // respond with 403 error
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // 403 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("roomPersonalizedLinksRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that file tab is shown
    cy.wait("@roomFilesRequest");

    cy.url().should("not.include", "#tab=tokens");
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthorized");

    // Check auth errors when loading personalized links
    cy.checkRoomAuthErrorsLoadingTab(
      "GET",
      "api/v1/rooms/abc-def-123/personalizedLinks*",
      "tokens",
    );

    // Reload room page
    cy.interceptRoomViewRequests();
    cy.reload();

    cy.wait("@roomRequest");

    // Check with 404 error (room not found)
    cy.interceptRoomIndexRequests();

    cy.intercept(
      {
        method: "GET",
        url: "api/v1/rooms/abc-def-123/personalizedLinks*",
      },
      {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      },
    ).as("roomPersonalizedLinksRequest");

    cy.get("#tab-tokens").click();

    cy.wait("@roomPersonalizedLinksRequest");

    // Check that redirect to room index page worked and error message is shown
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("load personalized links page out of range", function () {
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.data[0].role = 3;
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomPersonalizedLinksRequest");

    // Switch to next page but respond with no room personalized links on second page
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = [];
      roomPersonalizedLinks.meta.current_page = 2;
      roomPersonalizedLinks.meta.from = null;
      roomPersonalizedLinks.meta.per_page = 2;
      roomPersonalizedLinks.meta.to = null;
      roomPersonalizedLinks.meta.total = 2;
      roomPersonalizedLinks.meta.total_no_filter = 2;

      const emptyroomPersonalizedLinksRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/personalizedLinks*",
        {
          statusCode: 200,
          body: roomPersonalizedLinks,
        },
        "roomPersonalizedLinksRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
        roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 2);
        roomPersonalizedLinks.meta.per_page = 2;
        roomPersonalizedLinks.meta.to = 2;
        roomPersonalizedLinks.meta.total = 2;
        roomPersonalizedLinks.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
          statusCode: 200,
          body: roomPersonalizedLinks,
        })
          .as("roomPersonalizedLinksRequest")
          .then(() => {
            emptyroomPersonalizedLinksRequest.sendResponse();
          });
      });
    });

    // Wait for first room request and check that page is still the same
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second room request and check that page is reset
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });
  });

  it("view with different permissions", function () {
    // Check with rooms.viewAll permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = ["rooms.viewAll"];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that add button is hidden
    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "not.exist",
    );

    // Check button visibility for personalized links
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      3,
    );

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    // Check for co-owner
    cy.fixture("room").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that add button is shown
    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "be.visible",
    );

    // Check button visibility for personalized links
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    // Check with rooms.manage permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("room").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");
    cy.wait("@roomPersonalizedLinksRequest");

    // Check that add button is shown
    cy.get('[data-test="room-personalized-links-add-button"]').should(
      "be.visible",
    );

    // Check button visibility for personalized links
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="room-personalized-links-delete-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-edit-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-personalized-links-copy-button"]').should(
          "be.visible",
        );
      });
  });

  it("search personalized links", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query.query).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no personalized links found for this search query
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = [];
      roomPersonalizedLinks.meta.from = null;
      roomPersonalizedLinks.meta.to = null;
      roomPersonalizedLinks.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').type("Test");
    cy.get('[data-test="room-personalized-links-search"] > button').click();

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Test",
        page: "1",
      });
    });

    // Check if correct message is shown and no personalized links are displayed
    cy.get('[data-test="room-perzonalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.contains("app.filter_no_results").should("be.visible");

    // Check with no personalized links in room
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = [];
      roomPersonalizedLinks.meta.from = null;
      roomPersonalizedLinks.meta.to = null;
      roomPersonalizedLinks.meta.total = 0;
      roomPersonalizedLinks.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').clear();
    cy.get('[data-test="room-personalized-links-search"]').type("Test2");
    cy.get('[data-test="room-personalized-links-search"] > input').type(
      "{enter}",
    );

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Test2",
        page: "1",
      });
    });

    // Check if correct message is shown and no personalized links are displayed
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.contains("rooms.personalized_links.nodata").should("be.visible");

    // Check with 2 personalized links on 2 pages
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').clear();
    cy.get('[data-test="room-personalized-links-search"]').type("Doe");
    cy.get('[data-test="room-personalized-links-search"] > button').click();

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Doe",
        page: "1",
      });
    });

    // Check that correct personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(1, 2);
      roomPersonalizedLinks.meta.current_page = 2;
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.from = 2;
      roomPersonalizedLinks.meta.to = 2;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Doe",
        page: "2",
      });
    });

    cy.get('[data-test="room-personalized-links-search"] > input').should(
      "have.value",
      "Doe",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "Max Doe");

    // Change search query and make sure that the page is reset
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').clear();
    cy.get('[data-test="room-personalized-links-search"]').type("Do");
    cy.get('[data-test="room-personalized-links-search"] > button').click();

    // Check that personalized-links are loaded with the page reset to the first page
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Do",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("filter personalized links", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown-items"]').should("not.exist");

    // Check that correct filter is displayed
    cy.get('[data-test="filter-dropdown"]')
      .should("have.text", "rooms.personalized_links.filter.all")
      .click();

    cy.get('[data-test="filter-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        // check that filter options are shown correctly

        cy.get("[data-test=filter-dropdown-option]").should("have.length", 3);

        cy.get("[data-test=filter-dropdown-option]")
          .eq(0)
          .should("have.text", "rooms.personalized_links.filter.all");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(0)
          .should("have.attr", "aria-selected", "true");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(1)
          .should(
            "have.text",
            "rooms.personalized_links.filter.participant_role",
          );
        cy.get("[data-test=filter-dropdown-option]")
          .eq(2)
          .should(
            "have.text",
            "rooms.personalized_links.filter.moderator_role",
          );
      });

    // Change filter and respond with no personalized links found for this filter
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = [];
      roomPersonalizedLinks.meta.from = null;
      roomPersonalizedLinks.meta.to = null;
      roomPersonalizedLinks.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get("[data-test=filter-dropdown-option]").eq(1).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_role",
        page: "1",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.personalized_links.filter.participant_role",
    );

    // Check if correct message is shown and no personalized links are displayed
    cy.contains("app.filter_no_results").should("be.visible");
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.get("[data-test=filter-dropdown-items]").should("have.length", 0);

    // Change filter again and respond with no personalized links in room
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = [];
      roomPersonalizedLinks.meta.from = null;
      roomPersonalizedLinks.meta.to = null;
      roomPersonalizedLinks.meta.total = 0;
      roomPersonalizedLinks.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(2).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "moderator_role",
        page: "1",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.personalized_links.filter.moderator_role",
    );

    // Check if correct message is shown and no personalized links are displayed
    cy.contains("rooms.personalized_links.nodata").should("be.visible");
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.get("[data-test=filter-dropdown-items]").should("have.length", 0);

    // Change filter again and respond with 2 personalized links on 2 pages
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(1).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_role",
        page: "1",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.personalized_links.filter.participant_role",
    );

    // Check that correct personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(1, 2);
      roomPersonalizedLinks.data[0].role = 1;
      roomPersonalizedLinks.meta.current_page = 2;
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.from = 2;
      roomPersonalizedLinks.meta.to = 2;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that the filter stayed the same after changing the page
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_role",
        page: "2",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.personalized_links.filter.participant_role",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "Max Doe");

    // Change filter again (reset filter) and make sure that the page is reset
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 2;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;
      roomPersonalizedLinks.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(0).click();

    // Check that filter and page were reset
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.personalized_links.filter.all",
    );
  });

  it("sort personalized links", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "lastname",
        sort_direction: "asc",
        page: "1",
      });
    });

    cy.get('[data-test="sorting-type-dropdown-items"]').should("not.exist");

    // Check that correct sorting type is displayed
    cy.get('[data-test="sorting-type-dropdown"]')
      .should("have.text", "app.lastname")
      .click();

    cy.get('[data-test="sorting-type-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get("[data-test=sorting-type-dropdown-option]").should(
          "have.length",
          3,
        );
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(0)
          .should("have.text", "app.firstname");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(1)
          .should("have.text", "app.lastname");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(1)
          .should("have.attr", "aria-selected", "true");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(2)
          .should("have.text", "rooms.personalized_links.last_usage");

        // Change sorting type and respond with 3 personalized links on 3 different pages
        cy.fixture("roomPersonalizedLinks.json").then(
          (roomPersonalizedLinks) => {
            roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
            roomPersonalizedLinks.meta.last_page = 3;
            roomPersonalizedLinks.meta.per_page = 1;
            roomPersonalizedLinks.meta.to = 1;

            cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
              statusCode: 200,
              body: roomPersonalizedLinks,
            }).as("roomPersonalizedLinksRequest");
          },
        );

        cy.get("[data-test=sorting-type-dropdown-option]").eq(0).click();
      });

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "firstname",
        sort_direction: "asc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown-items]").should("not.exist");

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "app.firstname",
    );

    // Check that correct personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "John Doe");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(1, 2);
      roomPersonalizedLinks.meta.current_page = 2;
      roomPersonalizedLinks.meta.from = 2;
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "firstname",
        sort_direction: "asc",
        page: "2",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "app.firstname",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct personalized link is shown
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      1,
    );
    cy.get('[data-test="room-personalized-link-item"]')
      .eq(0)
      .should("include.text", "Max Doe");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').find("button").click();

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "firstname",
        sort_direction: "desc",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(1, 2);
      roomPersonalizedLinks.meta.current_page = 2;
      roomPersonalizedLinks.meta.from = 2;
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "firstname",
        sort_direction: "desc",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Change sorting type and make sure that the page is reset
    cy.fixture("roomPersonalizedLinks.json").then((roomPersonalizedLinks) => {
      roomPersonalizedLinks.data = roomPersonalizedLinks.data.slice(0, 1);
      roomPersonalizedLinks.meta.last_page = 3;
      roomPersonalizedLinks.meta.per_page = 1;
      roomPersonalizedLinks.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/personalizedLinks*", {
        statusCode: 200,
        body: roomPersonalizedLinks,
      }).as("roomPersonalizedLinksRequest");
    });

    cy.get("[data-test=sorting-type-dropdown]").click();
    cy.get("[data-test=sorting-type-dropdown-option]").eq(2).click();

    // Check that personalized links are loaded with the page reset to the first page
    cy.wait("@roomPersonalizedLinksRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "last_usage",
        sort_direction: "desc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.personalized_links.last_usage",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });
});
