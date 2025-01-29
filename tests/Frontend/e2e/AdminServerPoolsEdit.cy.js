import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin server pools edit", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServerPoolsViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.update",
        "serverPools.create",
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

  it("visit with user without permission to edit server pools", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "serverPools.viewAny",
        "serverPools.view",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });

      cy.visit("/admin/server_pools/1/edit");

      cy.checkToastMessage("app.flash.unauthorized");

      // Check if welcome page is shown
      cy.url().should("not.include", "/admin/server_pools/1/edit");
      cy.get("h1").should("be.visible").and("include.text", "home.title");
    });
  });

  it("edit server pool", function () {
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 2);
      servers.meta.last_page = 2;
      servers.meta.per_page = 2;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    const serverPoolRequest = interceptIndefinitely(
      "GET",
      "api/v1/serverPools/1",
      { fixture: "serverPool.json" },
      "serverPoolRequest",
    );

    cy.visit("/admin/server_pools/1/edit");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="server-pools-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
    cy.get('[data-test="server-pools-save-button"]').should("be.disabled");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        serverPoolRequest.sendResponse();
      });

    cy.wait("@serverPoolRequest");
    cy.wait("@serversRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that correct buttons are shown
    cy.get('[data-test="server-pools-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/server_pools/1");
    cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
    cy.get('[data-test="server-pools-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.edit_{"name":"Test"}',
      );

    // Change server pool settings
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "Test").clear();
        cy.get("#name").type("Server Pool 1");
      });

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.edit_{"name":"Test"}',
      );

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description").should("have.value", "Pool for testing").clear();
        cy.get("#description").type("Server Pool 1 description");
      });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-field"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="server-dropdown"]').within(() => {
          cy.get('[data-test="server-chip"]').should("have.length", 2);

          cy.get('[data-test="server-chip"]')
            .eq(0)
            .should("include.text", "Server 01")
            .find('[data-test="remove-server-button"]')
            .should("be.visible");

          cy.get('[data-test="server-chip"]')
            .eq(1)
            .should("include.text", "Server 02")
            .find('[data-test="remove-server-button"]')
            .should("be.visible");
        });
        cy.get('[data-test="server-dropdown"]').click();
      });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 4);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Server 01")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Server 02")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should("include.text", "admin.servers.no_data")
      .and("not.be.visible");

    // Switch to next page
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(2, 4);
      servers.meta.current_page = 2;
      servers.meta.from = 3;
      servers.meta.last_page = 2;
      servers.meta.per_page = 2;
      servers.meta.to = 4;

      const serversRequest = interceptIndefinitely(
        "GET",
        "api/v1/servers*",
        {
          statusCode: 200,
          body: servers,
        },
        "serversRequest",
      );

      cy.get(".multiselect__content")
        .should("be.visible")
        .within(() => {
          cy.get('[data-test="previous-page-button"]')
            .should("include.text", "app.previous_page")
            .and("be.disabled");
          cy.get('[data-test="next-page-button"]')
            .should("include.text", "app.next_page")
            .and("not.be.disabled");

          cy.get('[data-test="next-page-button"]').click();

          // Check loading
          cy.get('[data-test="previous-page-button"]').should("be.disabled");
          cy.get('[data-test="next-page-button"]').should("be.disabled");
        });

      cy.get('[data-test="server-dropdown"]').should(
        "have.class",
        "multiselect--disabled",
      );

      cy.get('[data-test="server-pools-save-button"]')
        .should("be.disabled")
        .then(() => {
          serversRequest.sendResponse();
        });
    });

    cy.wait("@serversRequest");

    cy.get(".multiselect__content")
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]').should("not.be.disabled");
        cy.get('[data-test="next-page-button"]').should("be.disabled");
      });

    // Check that correct options are shown
    cy.get(".multiselect__option").should("have.length", 4);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Server 03")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Server 04")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should("include.text", "admin.servers.no_data")
      .and("not.be.visible");

    // Select servers
    cy.get(".multiselect__option").eq(0).click();
    cy.get(".multiselect__option").eq(1).click();

    // Check that servers are shown and remove one server
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="server-dropdown"]').within(() => {
      cy.get('[data-test="server-chip"]').should("have.length", 4);
      cy.get('[data-test="server-chip"]')
        .eq(0)
        .should("include.text", "Server 01")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(1)
        .should("include.text", "Server 02")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(2)
        .should("include.text", "Server 03")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(3)
        .should("include.text", "Server 04")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(1)
        .find('[data-test="remove-server-button"]')
        .click();
    });

    // Check that dropdown is hidden
    cy.get(".multiselect__content").should("not.be.visible");

    // Save changes
    cy.fixture("servers.json").then((servers) => {
      cy.fixture("serverPool.json").then((serverPool) => {
        serverPool.data.name = "Server Pool 1";
        serverPool.data.description = "Server Pool 1 description";
        serverPool.data.servers = servers.data.filter(
          (server) => server.id !== 2,
        );

        const saveChangesRequest = interceptIndefinitely(
          "PUT",
          "api/v1/serverPools/1",
          {
            statusCode: 200,
            body: serverPool,
          },
          "saveChangesRequest",
        );

        cy.intercept("GET", "api/v1/serverPools/1", {
          statusCode: 200,
          body: serverPool,
        }).as("serverPoolRequest");

        cy.get('[data-test="overlay"]').should("not.exist");

        cy.get('[data-test="server-pools-save-button"]')
          .should("be.visible")
          .and("have.text", "app.save")
          .click();

        // Check loading
        cy.get('[data-test="overlay"]').should("be.visible");

        // Check that fields are disabled
        cy.get("#name").should("be.disabled");
        cy.get("#description").should("be.disabled");

        cy.get('[data-test="server-dropdown"]').should(
          "have.class",
          "multiselect--disabled",
        );

        cy.get('[data-test="server-pools-save-button"]')
          .should("be.disabled")
          .then(() => {
            saveChangesRequest.sendResponse();
          });

        const serverPoolRequestData = { ...serverPool.data };
        serverPoolRequestData.servers = [1, 3, 4];

        cy.wait("@saveChangesRequest").then((interception) => {
          expect(interception.request.body).to.eql(serverPoolRequestData);
        });
      });
    });

    cy.wait("@serverPoolRequest");

    // Check that redirect to server pool view worked
    cy.url().should("include", "/admin/server_pools/1");
    cy.url().should("not.include", "/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.view_{"name":"Server Pool 1"}',
      );
  });

  it("save changes errors", function () {
    cy.visit("/admin/server_pools/1/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.edit_{"name":"Test"}',
      );

    // Set values
    cy.get("#name").clear();
    cy.get("#description").clear();
    cy.get("#description").type("Server Pool 1 description");
    cy.get('[data-test="server-dropdown"]').click();
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(0).click();
    cy.get(".multiselect__select").click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Check with 422 error
    cy.intercept("PUT", "api/v1/serverPools/1", {
      statusCode: 422,
      body: {
        message: "The given data was invalid.",
        errors: {
          name: ["The Name field is required."],
          description: [
            "The Description must not be greater than 255 characters.",
          ],
          servers: ["The server with the ID 1 could not be found."],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that error messages are shown
    cy.get('[data-test="name-field"]').should(
      "include.text",
      "The Name field is required.",
    );

    cy.get('[data-test="description-field"]').should(
      "include.text",
      "The Description must not be greater than 255 characters.",
    );

    cy.get('[data-test="server-field"]').should(
      "include.text",
      "The server with the ID 1 could not be found.",
    );

    cy.get("#name").type("Server Pool 1");

    // Check with 500 error
    cy.intercept("PUT", "api/v1/serverPools/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="name-field"]').should(
      "not.include.text",
      "The Name field is required.",
    );

    cy.get('[data-test="description-field"]').should(
      "not.include.text",
      "The Description must not be greater than 255 characters.",
    );

    cy.get('[data-test="server-field"]').should(
      "not.include.text",
      "The server with the ID 1 could not be found.",
    );

    // Check with 428 error (stale error)
    cy.fixture("serverPool.json").then((serverPool) => {
      serverPool.data.name = "Server Pool 1";
      serverPool.data.description = "Server Pool 1 description";
      serverPool.data.servers = serverPool.data.servers.slice(0, 1);

      cy.intercept("PUT", "api/v1/serverPools/1", {
        statusCode: 428,
        body: {
          new_model: serverPool.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-server-pool-dialog"]').should("not.exist");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-server-pool-dialog"]')
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

    cy.get('[data-test="stale-server-pool-dialog"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.edit_{"name":"Server Pool 1"}',
      );

    // Check that correct data is shown
    cy.get("#name").should("have.value", "Server Pool 1");
    cy.get("#description").should("have.value", "Server Pool 1 description");

    cy.get('[data-test="server-chip"]').should("have.length", 1);

    cy.get('[data-test="server-chip"]')
      .eq(0)
      .should("include.text", "Server 01");

    // Trigger 428 error (stale error) again
    cy.fixture("serverPool.json").then((serverPool) => {
      serverPool.data.name = "Server Pool 1";
      serverPool.data.description = "Server Pool 1 description";
      serverPool.data.servers = serverPool.data.servers.slice(0, 1);

      cy.intercept("PUT", "api/v1/serverPools/1", {
        statusCode: 428,
        body: {
          new_model: serverPool.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-server-pool-dialog"]').should("not.exist");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-server-pool-dialog"]')
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
    cy.fixture("serverPool.json").then((serverPool) => {
      serverPool.data.name = "Server Pool 1";
      serverPool.data.description = "Server Pool 1 description";
      serverPool.data.servers = serverPool.data.servers.slice(0, 1);

      cy.intercept("PUT", "api/v1/serverPools/1", {
        statusCode: 200,
        body: serverPool,
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/serverPools/1", {
        statusCode: 200,
        body: serverPool,
      }).as("serverPoolRequest");

      cy.get('[data-test="stale-dialog-accept-button"]').click();

      const serverPoolRequestData = { ...serverPool.data };
      serverPoolRequestData.servers = [1];

      // Check that correct data is sent
      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql(serverPoolRequestData);
      });
    });

    // Check that redirect worked
    cy.url().should("include", "/admin/server_pools/1");
    cy.url().should("not.include", "/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should(
        "include.text",
        'admin.breakcrumbs.server_pools.view_{"name":"Server Pool 1"}',
      );

    // Reload
    cy.visit("/admin/server_pools/1/edit");

    // Check with 404 error
    cy.interceptAdminServerPoolsIndexRequests();
    cy.intercept("PUT", "api/v1/serverPools/1", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/server_pools/1/edit");
    cy.url().should("include", "/admin/server_pools");

    cy.wait("@serverPoolsRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload
    cy.visit("/admin/server_pools/1/edit");

    // Check with 401 error
    cy.intercept("PUT", "api/v1/serverPools/1", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/1/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
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

    cy.visit("/admin/server_pools/1/edit");

    cy.wait("@serverPoolRequest");
    cy.wait("@serversRequest");

    cy.get('[data-test="server-pools-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/server_pools/1");
    cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="server-pools-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");
  });

  it("load server pool errors", function () {
    cy.intercept("GET", "api/v1/serverPools/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverPoolRequest");

    cy.visit("/admin/server_pools/1/edit");

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
    cy.url().should("not.include", "/admin/server_pools/1/edit");
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

    cy.visit("/admin/server_pools/1/edit");

    cy.wait("@serverPoolRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/1/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load servers errors", function () {
    // Check with 500 error
    const serversRequest = interceptIndefinitely(
      "GET",
      "api/v1/servers*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "serversRequest",
    );

    cy.visit("/admin/server_pools/1/edit");

    cy.wait("@serverPoolRequest");

    // Check loading
    cy.get('[data-test="server-pools-save-button"]').should("be.disabled");

    cy.get('[data-test="server-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .then(() => {
        serversRequest.sendResponse();
      });

    cy.wait("@serversRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="server-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="server-pools-save-button"]').should("be.disabled");

    // Reload servers without errors
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 2);
      servers.meta.last_page = 2;
      servers.meta.per_page = 2;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="servers-reload-button"]').click();

    cy.wait("@serversRequest");

    cy.get('[data-test="server-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="server-pools-save-button"]').should("not.be.disabled");

    cy.get('[data-test="servers-reload-button"]').should("not.exist");

    cy.get('[data-test="server-dropdown"]').click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 4);

    // Check with 500 error when switching pages
    cy.intercept("GET", "api/v1/servers*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serversRequest");

    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="next-page-button"]').click();

    cy.wait("@serversRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="server-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="server-pools-save-button"]').should("be.disabled");

    // Check with 401 error
    cy.intercept("GET", "api/v1/servers*", {
      statusCode: 401,
    }).as("serversRequest");

    cy.reload();

    cy.wait("@serverPoolRequest");
    cy.wait("@serversRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/1/edit");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit edit page again with servers
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 2);
      servers.meta.last_page = 2;
      servers.meta.per_page = 2;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.visit("/admin/server_pools/1/edit");

    cy.wait("@serverPoolRequest");
    cy.wait("@serversRequest");

    cy.get('[data-test="server-dropdown"]').click();

    // Check with 401 error when switching pages
    cy.intercept("GET", "api/v1/servers*", {
      statusCode: 401,
    }).as("serversRequest");

    cy.get(".multiselect__content").should("be.visible");

    cy.get('[data-test="next-page-button"]').click();

    cy.wait("@serversRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/1/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
