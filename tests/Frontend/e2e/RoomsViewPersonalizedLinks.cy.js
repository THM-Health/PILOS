import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view personalized links", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomPersonalizedLinksRequests();
  });

  it("load personalized links", function () {
    const roomTokensRequest = interceptIndefinitely(
      "GET",
      "/api/v1/rooms/abc-def-123/tokens*",
      { fixture: "roomTokens.json" },
      "roomTokensRequest",
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
        roomTokensRequest.sendResponse();
      });

    cy.wait("@roomTokensRequest");

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
        'rooms.tokens.last_used_at_{"date":"09/17/2021, 16:36"}',
      )
      .should(
        "include.text",
        'rooms.tokens.expires_at_{"date":"10/17/2021, 14:21"}',
      )
      .should("include.text", "rooms.roles.participant");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(1)
      .should("include.text", "Max Doe")
      .should("not.include.text", "rooms.tokens.last_used_at")
      .should("not.include.text", "rooms.tokens.expires_at")
      .should("include.text", "rooms.roles.moderator");

    cy.get('[data-test="room-personalized-link-item"]')
      .eq(2)
      .should("include.text", "Tammy Law")
      .should(
        "include.text",
        'rooms.tokens.last_used_at_{"date":"10/03/2021, 19:24"}',
      )
      .should(
        "include.text",
        'rooms.tokens.expires_at_{"date":"10/20/2021, 11:17"}',
      )
      .should("include.text", "rooms.roles.moderator");
  });

  it("load personalized links errors", function () {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomTokensRequest");

    cy.visit("/rooms/abc-def-123#tab=tokens");
    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

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

    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomTokensRequest");

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
    cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomTokensRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomTokensRequest");

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

    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomTokensRequest").then((interception) => {
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
    cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
      statusCode: 401,
    }).as("roomTokensRequest");

    cy.interceptRoomFilesRequest();
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomTokensRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that file tab is shown
    cy.wait("@roomFilesRequest");
    cy.url().should("not.include", "#tab=tokens");
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user and personalized links
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-tokens").click();

    // 401 error but room has an access code
    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
      statusCode: 401,
    }).as("roomTokensRequest");

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomTokensRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // 401 error but guests are forbidden
    // Reload with logged in user and personalized links
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-tokens").click();

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
      statusCode: 401,
    }).as("roomTokensRequest");

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomTokensRequest");

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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
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
    cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("roomTokensRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomTokensRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");
    cy.wait("@roomTokensRequest");

    // Check that file tab is shown
    cy.wait("@roomFilesRequest");

    cy.url().should("not.include", "#tab=tokens");
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthorized");

    // Check auth errors when loading tokens/personalized links
    cy.checkRoomAuthErrorsLoadingTab(
      "GET",
      "api/v1/rooms/abc-def-123/tokens*",
      "tokens",
    );
  });

  it("load personalized links page out of range", function () {
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.data[0].role = 3;
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomTokensRequest");

    // Switch to next page but respond with no room personalized links on second page
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = [];
      roomTokens.meta.current_page = 2;
      roomTokens.meta.from = null;
      roomTokens.meta.per_page = 2;
      roomTokens.meta.to = null;
      roomTokens.meta.total = 2;
      roomTokens.meta.total_no_filter = 2;

      const emptyroomTokensRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/tokens*",
        {
          statusCode: 200,
          body: roomTokens,
        },
        "roomTokensRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("roomTokens.json").then((roomTokens) => {
        roomTokens.data = roomTokens.data.slice(0, 2);
        roomTokens.meta.per_page = 2;
        roomTokens.meta.to = 2;
        roomTokens.meta.total = 2;
        roomTokens.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
          statusCode: 200,
          body: roomTokens,
        })
          .as("roomTokensRequest")
          .then(() => {
            emptyroomTokensRequest.sendResponse();
          });
      });
    });

    // Wait for first room request and check that page is still the same
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second room request and check that page is reset
    cy.wait("@roomTokensRequest").then((interception) => {
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
    cy.wait("@roomTokensRequest");

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
    cy.wait("@roomTokensRequest");

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
    cy.wait("@roomTokensRequest");

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

    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query.search).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no personalized links found for this search query
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = [];
      roomTokens.meta.from = null;
      roomTokens.meta.to = null;
      roomTokens.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').type("Test");
    cy.get('[data-test="room-personalized-links-search"] > button').click();

    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Test",
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = [];
      roomTokens.meta.from = null;
      roomTokens.meta.to = null;
      roomTokens.meta.total = 0;
      roomTokens.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').clear();
    cy.get('[data-test="room-personalized-links-search"]').type("Test2");
    cy.get('[data-test="room-personalized-links-search"] > input').type(
      "{enter}",
    );

    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Test2",
        page: "1",
      });
    });

    // Check if correct message is shown and no personalized links are displayed
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.contains("rooms.tokens.nodata").should("be.visible");

    // Check with 2 personalized links on 2 pages
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').clear();
    cy.get('[data-test="room-personalized-links-search"]').type("Doe");
    cy.get('[data-test="room-personalized-links-search"] > button').click();

    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Doe",
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(1, 2);
      roomTokens.meta.current_page = 2;
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.from = 2;
      roomTokens.meta.to = 2;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Doe",
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="room-personalized-links-search"] > input').clear();
    cy.get('[data-test="room-personalized-links-search"]').type("Do");
    cy.get('[data-test="room-personalized-links-search"] > button').click();

    // Check that personalized-links are loaded with the page reset to the first page
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Do",
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

    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get('[data-test="filter-dropdown-items"]').should("not.exist");

    // Check that correct filter is displayed
    cy.get('[data-test="filter-dropdown"]')
      .should("have.text", "rooms.tokens.filter.all")
      .click();

    cy.get('[data-test="filter-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        // check that filter options are shown correctly

        cy.get("[data-test=filter-dropdown-option]").should("have.length", 3);

        cy.get("[data-test=filter-dropdown-option]")
          .eq(0)
          .should("have.text", "rooms.tokens.filter.all");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(0)
          .should("have.attr", "aria-selected", "true");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(1)
          .should("have.text", "rooms.tokens.filter.participant_role");
        cy.get("[data-test=filter-dropdown-option]")
          .eq(2)
          .should("have.text", "rooms.tokens.filter.moderator_role");
      });

    // Change filter and respond with no personalized links found for this filter
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = [];
      roomTokens.meta.from = null;
      roomTokens.meta.to = null;
      roomTokens.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get("[data-test=filter-dropdown-option]").eq(1).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_role",
        page: "1",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.tokens.filter.participant_role",
    );

    // Check if correct message is shown and no personalized links are displayed
    cy.contains("app.filter_no_results").should("be.visible");
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.get("[data-test=filter-dropdown-items]").should("have.length", 0);

    // Change filter again and respond with no personalized links in room
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = [];
      roomTokens.meta.from = null;
      roomTokens.meta.to = null;
      roomTokens.meta.total = 0;
      roomTokens.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(2).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "moderator_role",
        page: "1",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.tokens.filter.moderator_role",
    );

    // Check if correct message is shown and no personalized links are displayed
    cy.contains("rooms.tokens.nodata").should("be.visible");
    cy.get('[data-test="room-personalized-link-item"]').should(
      "have.length",
      0,
    );
    cy.get("[data-test=filter-dropdown-items]").should("have.length", 0);

    // Change filter again and respond with 2 personalized links on 2 pages
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(1).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_role",
        page: "1",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.tokens.filter.participant_role",
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(1, 2);
      roomTokens.data[0].role = 1;
      roomTokens.meta.current_page = 2;
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.from = 2;
      roomTokens.meta.to = 2;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that the filter stayed the same after changing the page
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter: "participant_role",
        page: "2",
      });
    });

    cy.get("[data-test=filter-dropdown]").should(
      "have.text",
      "rooms.tokens.filter.participant_role",
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 2;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;
      roomTokens.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get("[data-test=filter-dropdown]").click();
    cy.get("[data-test=filter-dropdown-option]").eq(0).click();

    // Check that filter and page were reset
    cy.wait("@roomTokensRequest").then((interception) => {
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
      "rooms.tokens.filter.all",
    );
  });

  it("sort personalized links", function () {
    cy.visit("/rooms/abc-def-123#tab=tokens");

    cy.wait("@roomTokensRequest").then((interception) => {
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
          .should("have.text", "rooms.tokens.last_usage");

        // Change sorting type and respond with 3 personalized links on 3 different pages
        cy.fixture("roomTokens.json").then((roomTokens) => {
          roomTokens.data = roomTokens.data.slice(0, 1);
          roomTokens.meta.last_page = 3;
          roomTokens.meta.per_page = 1;
          roomTokens.meta.to = 1;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
            statusCode: 200,
            body: roomTokens,
          }).as("roomTokensRequest");
        });

        cy.get("[data-test=sorting-type-dropdown-option]").eq(0).click();
      });

    cy.wait("@roomTokensRequest").then((interception) => {
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(1, 2);
      roomTokens.meta.current_page = 2;
      roomTokens.meta.from = 2;
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomTokensRequest").then((interception) => {
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').find("button").click();

    cy.wait("@roomTokensRequest").then((interception) => {
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(1, 2);
      roomTokens.meta.current_page = 2;
      roomTokens.meta.from = 2;
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomTokensRequest").then((interception) => {
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
    cy.fixture("roomTokens.json").then((roomTokens) => {
      roomTokens.data = roomTokens.data.slice(0, 1);
      roomTokens.meta.last_page = 3;
      roomTokens.meta.per_page = 1;
      roomTokens.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
        statusCode: 200,
        body: roomTokens,
      }).as("roomTokensRequest");
    });

    cy.get("[data-test=sorting-type-dropdown]").click();
    cy.get("[data-test=sorting-type-dropdown-option]").eq(2).click();

    // Check that personalized links are loaded with the page reset to the first page
    cy.wait("@roomTokensRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "last_usage",
        sort_direction: "desc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.tokens.last_usage",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });
});
