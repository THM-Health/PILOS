import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin server pools view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServerPoolsViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "serverPools.viewAny",
        "serverPools.view",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/server_pools/1");
  });

  it("visit with user without permission to view server pools", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "serverPools.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/server_pools/1");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/servers/1");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check serverPoolView shown correctly", function () {
    const serverPoolRequest = interceptIndefinitely(
      "GET",
      "api/v1/serverPools/1",
      { fixture: "serverPool.json" },
      "serverPoolRequest",
    );

    cy.visit("/admin/server_pools/1");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="server-pools-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
    cy.get('[data-test="server-pools-save-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        serverPoolRequest.sendResponse();
      });

    cy.wait("@serverPoolRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that buttons are still hidden
    cy.get('[data-test="server-pools-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
    cy.get('[data-test="server-pools-save-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.view_{"name":"Test"}',
      );

    // Check that server pool data is shown correctly
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "Test").and("be.disabled");
      });

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description")
          .should("have.value", "Pool for testing")
          .and("be.disabled");
      });

    cy.get('[data-test="server-field"]')
      .should("be.visible")
      .and("include.text", "app.servers")
      .within(() => {
        cy.get('[data-test="server-dropdown"]')
          .should("have.class", "multiselect--disabled")
          .within(() => {
            cy.get('[data-test="server-chip"]').should("have.length", 2);
            cy.get('[data-test="server-chip"]')
              .eq(0)
              .should("include.text", "Server 01")
              .find('[data-test="remove-server-button"]')
              .should("not.exist");
            cy.get('[data-test="server-chip"]')
              .eq(1)
              .should("include.text", "Server 02")
              .find('[data-test="remove-server-button"]')
              .should("not.exist");
          });
      });
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/server_pools/1");

    cy.wait("@serverPoolRequest");

    cy.get('[data-test="server-pools-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/server_pools/1/edit");
    cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
    cy.get('[data-test="server-pools-save-button"]').should("not.exist");
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.update",
        "serverPools.create",
        "serverPools.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/server_pools/1");

    cy.wait("@serverPoolRequest");

    cy.get('[data-test="server-pools-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/server_pools/1/edit");
    cy.get('[data-test="server-pools-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="server-pools-save-button"]').should("not.exist");
  });

  it("open view errors", function () {
    cy.intercept("GET", "api/v1/serverPools/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverPoolRequest");

    cy.visit("/admin/server_pools/1");

    cy.wait("@serverPoolRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/serverPools/1", {
      statusCode: 200,
      fixture: "serverPool.json",
    }).as("serverPoolRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@serverPoolRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload page with 404 errors
    cy.interceptAdminServerPoolsIndexRequests();

    cy.intercept("GET", "api/v1/serverPools/1", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("serverPoolRequest");

    cy.reload();

    cy.wait("@serverPoolRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/server_pools/1");
    cy.url().should("include", "/admin/server_pools");

    cy.wait("@serverPoolsRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/serverPools/1", {
      statusCode: 401,
    }).as("serverPoolRequest");

    cy.visit("/admin/server_pools/1");

    cy.wait("@serverPoolRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/1");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
