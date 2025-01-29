import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin servers view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServersViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
        "servers.update",
        "servers.create",
        "servers.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that  is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/servers/new");
  });

  it("visit with user without permission to add new servers", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
        "servers.update",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/servers/new");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/users");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("add new server", function () {
    cy.visit("/admin/servers/new");

    // Check that header buttons are hidden
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should("include.text", "admin.breakcrumbs.servers.new");

    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "").type("Server 01");
      });

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should("include.text", "admin.breakcrumbs.servers.new");

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description")
          .should("have.value", "")
          .type("Testserver 01 for testing purposes");
      });

    cy.get('[data-test="version-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.version")
      .within(() => {
        cy.get("#version").should("have.value", "---").and("be.disabled");
      });

    cy.get('[data-test="base-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.base_url")
      .within(() => {
        cy.get("#base_url")
          .should("have.value", "")
          .type("https://localhost/bigbluebutton");
      });

    cy.get('[data-test="secret-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.secret")
      .within(() => {
        cy.get("#secret").should("have.value", "").type("Secret123456789");
      });

    cy.get('[data-test="strength-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.strength")
      .and("include.text", "admin.servers.strength_description")
      .within(() => {
        cy.get('[data-test="strength-rating"]').should(
          "not.have.class",
          "p-disabled",
        );

        cy.get('[data-test="strength-rating-option"]').should(
          "have.length",
          10,
        );

        // Check that correct options are active
        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="strength-rating-option"]')
            .eq(i)
            .should("have.attr", "data-p-active", "false");
        }

        // Click on one of the options
        cy.get('[data-test="strength-rating-option"]').eq(5).click();

        // Check that correct options are active
        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="strength-rating-option"]')
            .eq(i)
            .should("have.attr", "data-p-active", i < 6 ? "true" : "false");
        }
      });

    cy.get('[data-test="status-dropdown-items"]').should("not.exist");
    cy.get('[data-test="status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.status")
      .within(() => {
        cy.get('[data-test="status-dropdown"]')
          .should("not.include.text", "admin.servers")
          .within(() => {
            cy.get(".p-select-label").should(
              "not.have.attr",
              "aria-disabled",
              "true",
            );
          });

        cy.get('[data-test="status-dropdown"]').click();
      });

    cy.get('[data-test="status-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="status-dropdown-option"]').should("have.length", 3);

        cy.get('[data-test="status-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.servers.enabled");
        cy.get('[data-test="status-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.servers.draining");
        cy.get('[data-test="status-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.servers.disabled");

        cy.get('[data-test="status-dropdown-option"]').eq(0).click();
      });

    cy.get('[data-test="status-dropdown-items"]').should("not.exist");
    cy.get('[data-test="status-dropdown"]').should(
      "have.text",
      "admin.servers.enabled",
    );

    cy.get('[data-test="health-status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.connection")
      .within(() => {
        cy.get("#healthStatus")
          .should("have.value", "admin.servers.unknown")
          .and("be.disabled");
        cy.get('[data-test="servers-test-connection-button"]')
          .should("be.visible")
          .and("have.text", "admin.servers.test_connection")
          .and("not.be.disabled");
      });

    // Check that other fields are hidden
    cy.get('[data-test="meeting-count-field"]').should("not.exist");

    cy.get('[data-test="own-meeting-count-field"]').should("not.exist");

    cy.get('[data-test="participant-count-field"]').should("not.exist");

    cy.get('[data-test="video-count-field"]').should("not.exist");

    // Check that panic button is hidden (missing permissions)
    cy.get('[data-test="servers-panic-button"]').should("not.exist");

    // Save new server
    cy.fixture("server.json").then((server) => {
      server.data.id = 30;
      server.data.description = "Testserver 01 for testing purposes";
      server.data.secret = "Secret123456789";
      server.data.strength = 6;

      const newServerRequest = interceptIndefinitely(
        "POST",
        "api/v1/servers",
        {
          statusCode: 201,
          body: server,
        },
        "newServerRequest",
      );

      cy.intercept("GET", "api/v1/servers/30", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");

      cy.get('[data-test="overlay"]').should("not.exist");
      cy.get('[data-test="servers-save-button"]')
        .should("be.visible")
        .and("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");

      // Check that fields are disabled
      cy.get("#name").should("be.disabled");
      cy.get("#description").should("be.disabled");
      cy.get("#version").should("be.disabled");
      cy.get("#base_url").should("be.disabled");
      cy.get("#secret").should("be.disabled");
      cy.get('[data-test="strength-rating"]').should(
        "have.class",
        "p-disabled",
      );
      cy.get('[data-test="status-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get("#healthStatus").and("be.disabled");
      cy.get('[data-test="servers-test-connection-button"]').should(
        "be.disabled",
      );

      cy.get('[data-test="servers-save-button"]')
        .should("be.disabled")
        .then(() => {
          newServerRequest.sendResponse();
        });
    });

    cy.wait("@newServerRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        base_url: "https://localhost/bigbluebutton",
        description: "Testserver 01 for testing purposes",
        id: null,
        name: "Server 01",
        secret: "Secret123456789",
        status: 1,
        strength: 6,
      });
    });

    cy.wait("@serverRequest");

    // Check that redirect to server view worked
    cy.url().should("include", "/admin/servers/30");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.view_{"name":"Server 01"}',
      );
  });

  it("add new server errors", function () {
    cy.visit("/admin/servers/new");

    // Set values
    cy.get("#name").should("have.value", "").type("Server 01");
    cy.get("#description")
      .should("have.value", "")
      .type("Testserver 01 for testing purposes");
    cy.get("#base_url")
      .should("have.value", "")
      .type("https://localhost/bigbluebutton");
    cy.get("#secret").should("have.value", "").type("Secret123456789");
    cy.get('[data-test="strength-rating-option"]').eq(5).click();
    cy.get('[data-test="status-dropdown-items"]').should("not.exist");
    cy.get('[data-test="status-dropdown"]').click();
    cy.get('[data-test="status-dropdown-items"]').should("be.visible");
    cy.get('[data-test="status-dropdown-option"]').eq(0).click();

    // Check with 422 error
    cy.intercept("POST", "api/v1/servers", {
      statusCode: 422,
      body: {
        errors: {
          name: ["The name field is required."],
          description: ["The description field is required."],
          base_url: ["The base url field is required."],
          secret: ["The secret field is required."],
          strength: ["The strength field is required."],
          status: ["The status field is required."],
        },
      },
    }).as("newServerRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@newServerRequest");

    // Check error messages
    cy.get('[data-test="name-field"]').should(
      "include.text",
      "The name field is required.",
    );

    cy.get('[data-test="description-field"]').should(
      "include.text",
      "The description field is required.",
    );

    cy.get('[data-test="base-url-field"]').should(
      "include.text",
      "The base url field is required.",
    );

    cy.get('[data-test="secret-field"]').should(
      "include.text",
      "The secret field is required.",
    );

    cy.get('[data-test="strength-field"]').should(
      "include.text",
      "The strength field is required.",
    );

    cy.get('[data-test="status-field"]').should(
      "include.text",
      "The status field is required.",
    );

    // Check with 500 error
    cy.intercept("POST", "api/v1/servers", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("newServerRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@newServerRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="name-field"]').should(
      "not.include.text",
      "The name field is required.",
    );

    cy.get('[data-test="description-field"]').should(
      "not.include.text",
      "The description field is required.",
    );

    cy.get('[data-test="base-url-field"]').should(
      "not.include.text",
      "The base url field is required.",
    );

    cy.get('[data-test="secret-field"]').should(
      "not.include.text",
      "The secret field is required.",
    );

    cy.get('[data-test="strength-field"]').should(
      "not.include.text",
      "The strength field is required.",
    );

    cy.get('[data-test="status-field"]').should(
      "not.include.text",
      "The status field is required.",
    );

    // Check with 404 error
    cy.interceptAdminServersIndexRequests();
    cy.intercept("POST", "api/v1/servers", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("newServerRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@newServerRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/servers/new");
    cy.url().should("include", "/admin/servers");

    cy.wait("@serversRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload
    cy.visit("/admin/servers/new");

    // Check with 401 error
    cy.intercept("POST", "api/v1/servers", {
      statusCode: 401,
    }).as("newServerRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@newServerRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
