import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin servers edit", function () {
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
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/servers/1/edit");
  });

  it("visit with user without permission to edit servers", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/users/2/edit");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("edit server", function () {
    const serverRequest = interceptIndefinitely(
      "GET",
      "api/v1/servers/1",
      { fixture: "server.json" },
      "serverRequest",
    );

    cy.visit("/admin/servers/1/edit");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("be.disabled");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        serverRequest.sendResponse();
      });

    cy.wait("@serverRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that buttons are still hidden (missing permissions)
    cy.get('[data-test="servers-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/servers/1");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.edit_{"name":"Server 01"}',
      );

    // Change server settings
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").and("have.value", "Server 01").clear();
        cy.get("#name").type("Server 02");
      });

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.edit_{"name":"Server 01"}',
      );

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description").and("have.value", "Testserver 01").clear();
        cy.get("#description").type("Testserver 02 for testing purposes");
      });

    cy.get('[data-test="version-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.version")
      .within(() => {
        cy.get("#version").should("have.value", "2.4.5").and("be.disabled");
      });

    cy.get('[data-test="base-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.base_url")
      .within(() => {
        cy.get("#base_url")
          .and("have.value", "https://localhost/bigbluebutton")
          .clear();
        cy.get("#base_url").type("https://localhost/bigbluebutton2");
      });

    cy.get('[data-test="secret-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.secret")
      .within(() => {
        cy.get("#secret").and("have.value", "123456789").clear();
        cy.get("#secret").type("Secret123456789");
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
            .should("have.attr", "data-p-active", i < 2 ? "true" : "false");
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
          .should("have.text", "admin.servers.enabled")
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

        cy.get('[data-test="status-dropdown-option"]').eq(2).click();
      });

    cy.get('[data-test="status-dropdown-items"]').should("not.exist");
    cy.get('[data-test="status-dropdown"]').should(
      "have.text",
      "admin.servers.disabled",
    );

    cy.get('[data-test="health-status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.connection")
      .within(() => {
        cy.get("#healthStatus")
          .should("have.value", "admin.servers.online")
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

    // Check that panic button is hidden
    cy.get('[data-test="servers-panic-button"]').should("not.exist");

    // Save changes
    cy.fixture("server.json").then((server) => {
      server.data.name = "Server 02";
      server.data.description = "Testserver 02 for testing purposes";
      server.data.base_url = "https://localhost/bigbluebutton2";
      server.data.secret = "Secret123456789";
      server.data.strength = 6;
      server.data.status = -1;

      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/servers/1",
        {
          statusCode: 200,
          body: server,
        },
        "saveChangesRequest",
      );

      cy.intercept("GET", "api/v1/servers/1", {
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
          saveChangesRequest.sendResponse();
        });

      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql(server.data);
      });
    });

    cy.wait("@serverRequest");

    // Check that redirect to server view worked
    cy.url().should("include", "/admin/servers/1");
    cy.url().should("not.include", "/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.view_{"name":"Server 02"}',
      );
  });

  it("save changes errors", function () {
    cy.visit("/admin/servers/1/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.edit_{"name":"Server 01"}',
      );

    // Check with 422 error
    cy.intercept("PUT", "api/v1/servers/1", {
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
    }).as("saveChangesRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@saveChangesRequest");

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

    // Set values
    cy.get("#name").and("have.value", "Server 01").clear();
    cy.get("#name").type("Server 02");
    cy.get("#description").and("have.value", "Testserver 01").clear();
    cy.get("#description").type("Testserver 02 for testing purposes");
    cy.get("#base_url")
      .and("have.value", "https://localhost/bigbluebutton")
      .clear();
    cy.get("#base_url").type("https://localhost/bigbluebutton2");
    cy.get("#secret").and("have.value", "123456789").clear();
    cy.get("#secret").type("Secret123456789");
    for (let i = 0; i < 10; i++) {
      cy.get('[data-test="strength-rating-option"]')
        .eq(i)
        .should("have.attr", "data-p-active", i < 2 ? "true" : "false");
    }
    cy.get('[data-test="strength-rating-option"]').eq(5).click();
    cy.get('[data-test="status-dropdown"]').should(
      "include.text",
      "admin.servers.enabled",
    );
    cy.get('[data-test="status-dropdown-items"]').should("not.exist");
    cy.get('[data-test="status-dropdown"]').click();
    cy.get('[data-test="status-dropdown-items"]').should("be.visible");
    cy.get('[data-test="status-dropdown-option"]').eq(2).click();

    // Check with 500 error
    cy.intercept("PUT", "api/v1/servers/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@saveChangesRequest");

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

    // Check with 428 error (stale error)
    cy.fixture("server.json").then((server) => {
      server.data.name = "Server 03";
      server.data.description = "Testserver 03 for testing purposes";
      server.data.base_url = "https://localhost/bigbluebutton3";
      server.data.secret = "Secret987654321";
      server.data.strength = 5;
      server.data.status = 1;

      cy.intercept("PUT", "api/v1/servers/1", {
        statusCode: 428,
        body: {
          new_model: server.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-server-dialog"]').should("not.exist");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-server-dialog"]')
      .should("be.visible")
      .and("include.text", "app.errors.stale_error")
      .within(() => {
        // Check buttons
        cy.get('[data-test="stale-dialog-reject-button"]')
          .should("be.visible")
          .and("have.text", "app.reload");
        cy.get('[data-test="stale-dialog-accept-button"]')
          .should("be.visible")
          .and("have.text", "app.overwrite");
      });

    // Reload
    cy.get('[data-test="stale-dialog-reject-button"]').click();

    cy.get('[data-test="stale-server-dialog"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.edit_{"name":"Server 03"}',
      );

    // Check that correct data is shown
    cy.get("#name").should("have.value", "Server 03");
    cy.get("#description").should(
      "have.value",
      "Testserver 03 for testing purposes",
    );
    cy.get("#base_url").should(
      "have.value",
      "https://localhost/bigbluebutton3",
    );
    cy.get("#secret").should("have.value", "Secret987654321");
    for (let i = 0; i < 10; i++) {
      cy.get('[data-test="strength-rating-option"]')
        .eq(i)
        .should("have.attr", "data-p-active", i < 5 ? "true" : "false");
    }
    cy.get('[data-test="status-dropdown"]').should(
      "include.text",
      "admin.servers.enabled",
    );

    // Trigger 428 error (stale error) again
    cy.fixture("server.json").then((server) => {
      server.data.name = "Server 04";
      server.data.description = "Testserver 04 for testing purposes";
      server.data.base_url = "https://localhost/bigbluebutton4";
      server.data.secret = "123456789Secret";
      server.data.strength = 4;
      server.data.status = 10;

      cy.intercept("PUT", "api/v1/servers/1", {
        statusCode: 428,
        body: {
          new_model: server.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-server-dialog"]').should("not.exist");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-server-dialog"]')
      .should("be.visible")
      .and("include.text", "app.errors.stale_error")
      .within(() => {
        // Check buttons
        cy.get('[data-test="stale-dialog-reject-button"]')
          .should("be.visible")
          .and("have.text", "app.reload");
        cy.get('[data-test="stale-dialog-accept-button"]')
          .should("be.visible")
          .and("have.text", "app.overwrite");
      });

    // Overwrite
    cy.fixture("server.json").then((server) => {
      server.data.name = "Server 03";
      server.data.description = "Testserver 03 for testing purposes";
      server.data.base_url = "https://localhost/bigbluebutton3";
      server.data.secret = "Secret987654321";
      server.data.strength = 5;
      server.data.status = 1;

      cy.intercept("PUT", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");

      cy.get('[data-test="stale-dialog-accept-button"]').click();

      // Check that correct data is sent
      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql(server.data);
      });
    });

    // Check that redirect worked
    cy.url().should("include", "/admin/servers/1");
    cy.url().should("not.include", "/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.view_{"name":"Server 03"}',
      );

    // Reload
    cy.visit("/admin/servers/1/edit");

    // Check with 404 error
    cy.interceptAdminServersIndexRequests();
    cy.intercept("PUT", "api/v1/servers/1", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/servers/1/edit");
    cy.url().should("include", "/admin/servers");

    cy.wait("@serversRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload
    cy.visit("/admin/servers/1/edit");

    // Check with 401 error
    cy.intercept("PUT", "api/v1/servers/1", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="servers-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/1/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("check button visibility with delete permission", function () {
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

    cy.visit("/admin/servers/1/edit");

    cy.wait("@serverRequest");

    // Check with server enabled
    cy.get('[data-test="servers-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/servers/1");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]').should("not.exist");

    // Reload page but with server draining
    cy.fixture("server.json").then((server) => {
      server.data.status = 0;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.reload();

    // Check with server draining
    cy.get('[data-test="servers-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/servers/1");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]').should("not.exist");

    // Reload page but with server disabled
    cy.fixture("server.json").then((server) => {
      server.data.status = -1;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.reload();

    // Check with server disabled
    cy.get('[data-test="servers-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/servers/1");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="servers-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("load server errors", function () {
    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverRequest");

    cy.visit("/admin/servers/1/edit");

    cy.wait("@serverRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 200,
      fixture: "server.json",
    }).as("serverRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@serverRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");

    // Reload page with 404 errors
    cy.interceptAdminServersIndexRequests();

    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("serverRequest");

    cy.reload();

    cy.wait("@serverRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/servers/1");
    cy.url().should("include", "/admin/servers");

    cy.wait("@serversRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 401,
    }).as("serverRequest");

    cy.visit("/admin/servers/1/edit");

    cy.wait("@serverRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/1/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
