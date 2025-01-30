import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin server pools new", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServerPoolsNewRequests();

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
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/server_pools/new");
  });

  it("visit with user without permission to add new server pools", function () {
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

    cy.visit("/admin/server_pools/new");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/users");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("add new server pool with 1 server", function () {
    cy.visit("/admin/server_pools/new");

    // Check that header buttons are hidden
    cy.get('[data-test="server-pools-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
    cy.get('[data-test="server-pools-delete-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should("include.text", "admin.breakcrumbs.server_pools.new");

    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "").type("Server Pool 1");
      });

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index")
      .should("include.text", "admin.breakcrumbs.server_pools.new");

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description")
          .should("have.value", "")
          .type("Server Pool 1 description");
      });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-field"]')
      .should("be.visible")
      .and("include.text", "app.servers")
      .within(() => {
        cy.get('[data-test="server-dropdown"]').within(() => {
          cy.get(".multiselect__tags")
            .should("include.text", "admin.server_pools.select_servers")
            .click();
          cy.get('[data-test="server-chip"]').should("have.length", 0);
        });
      });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 6);
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
      .should("include.text", "Server 03")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should("include.text", "Server 04")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");

    cy.get(".multiselect__option")
      .eq(5)
      .should("include.text", "admin.servers.no_data")
      .and("not.be.visible");

    cy.get(".multiselect__option").eq(1).click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="server-dropdown"]').within(() => {
      cy.get('[data-test="server-chip"]').should("have.length", 1);
      cy.get('[data-test="server-chip"]')
        .eq(0)
        .should("include.text", "Server 02")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");
    });

    // Select second role
    cy.get(".multiselect__option").eq(2).click();

    // Check that roles are shown and remove second role
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="server-dropdown"]').within(() => {
      cy.get('[data-test="server-chip"]').should("have.length", 2);
      cy.get('[data-test="server-chip"]')
        .eq(0)
        .should("include.text", "Server 02")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(1)
        .should("include.text", "Server 03")
        .find('[data-test="remove-server-button"]')
        .should("be.visible")
        .click();
    });

    // Check that dialog is closed
    cy.get(".multiselect__content").should("not.be.visible");

    // Save new server pool
    cy.fixture("serverPool.json").then((serverPool) => {
      serverPool.data.id = 20;
      serverPool.data.name = "Server Pool 1";
      serverPool.data.description = "Server Pool 1 description";
      serverPool.data.servers = serverPool.data.servers.slice(1, 2);

      const newServerPoolRequest = interceptIndefinitely(
        "POST",
        "api/v1/serverPools",
        {
          statusCode: 201,
          body: serverPool,
        },
        "newServerPoolRequest",
      );

      cy.intercept("GET", "api/v1/serverPools/20", {
        statusCode: 200,
        body: serverPool,
      }).as("serverPoolRequest");

      cy.get('[data-test="overlay"]').should("not.exist");
      cy.get('[data-test="server-pools-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get("#name").should("be.disabled");
      cy.get("#description").should("be.disabled");
      cy.get('[data-test="server-dropdown"]').should(
        "have.class",
        "multiselect--disabled",
      );
      cy.get('[data-test="server-pools-save-button"]')
        .should("be.disabled")
        .then(() => {
          newServerPoolRequest.sendResponse();
        });
    });

    // Check request data
    cy.wait("@newServerPoolRequest").then((interception) => {
      expect(interception.request.body).to.deep.equal({
        name: "Server Pool 1",
        description: "Server Pool 1 description",
        servers: [2],
      });
    });

    cy.wait("@serverPoolRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that server pool page is shown
    cy.url().should("include", "/admin/server_pools/20");
  });

  it("add new server pool with several servers", function () {
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

    cy.visit("/admin/server_pools/new");

    cy.wait("@serversRequest");

    cy.get("#name").should("have.value", "").type("Server Pool 1");
    cy.get("#description")
      .should("have.value", "")
      .type("Server Pool 1 description");

    // Check server setting and change it
    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="server-field"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="server-dropdown"]').within(() => {
          cy.get(".multiselect__tags")
            .should("include.text", "admin.server_pools.select_servers")
            .click();
          cy.get('[data-test="server-chip"]').should("have.length", 0);
        });
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

    // Select server
    cy.get(".multiselect__option").eq(0).click();

    // Check that dropdown is still open
    cy.get(".multiselect__content").should("be.visible");

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

    cy.get('[data-test="server-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

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
    cy.get(".multiselect__option").eq(1).click();

    // Check that servers are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="server-dropdown"]').within(() => {
      cy.get('[data-test="server-chip"]').should("have.length", 2);
      cy.get('[data-test="server-chip"]')
        .eq(0)
        .should("include.text", "Server 01")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(1)
        .should("include.text", "Server 04")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");
    });

    // Close dialog
    cy.get(".multiselect__select").click({ force: true }); // ToDo remove force when possible

    // Check that dialog is closed
    cy.get(".multiselect__content").should("not.be.visible");

    // Save new server pool
    cy.fixture("servers.json").then((servers) => {
      cy.fixture("serverPool.json").then((serverPool) => {
        serverPool.data.id = 20;
        serverPool.data.name = "Server Pool 1";
        serverPool.data.description = "Server Pool 1 description";
        serverPool.data.servers = servers.data.filter(
          (server) => server.id === 1 || server.id === 4,
        );

        cy.intercept("POST", "api/v1/serverPools", {
          statusCode: 201,
          body: serverPool,
        }).as("newServerPoolRequest");

        cy.intercept("GET", "api/v1/serverPools/20", {
          statusCode: 200,
          body: serverPool,
        }).as("serverPoolRequest");
      });
    });

    cy.get('[data-test="server-pools-save-button"]').click();

    // Check request data
    cy.wait("@newServerPoolRequest").then((interception) => {
      expect(interception.request.body).to.deep.equal({
        name: "Server Pool 1",
        description: "Server Pool 1 description",
        servers: [1, 4],
      });
    });

    cy.wait("@serverPoolRequest");

    // Check that user page is shown
    cy.url().should("include", "/admin/server_pools/20");
  });

  it("add new server pool errors", function () {
    cy.visit("/admin/server_pools/new");

    // Set values
    cy.get("#description").type("Server Pool 1 description");
    cy.get('[data-test="server-dropdown"]').click();
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(0).click();
    cy.get(".multiselect__select").click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Check with 422 error
    cy.intercept("POST", "api/v1/serverPools", {
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
    }).as("newServerPoolRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@newServerPoolRequest");

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
    cy.intercept("POST", "api/v1/serverPools", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("newServerPoolRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@newServerPoolRequest");

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

    // Check with 401 error
    cy.intercept("POST", "api/v1/serverPools", {
      statusCode: 401,
    }).as("newServerPoolRequest");

    cy.get('[data-test="server-pools-save-button"]').click();

    cy.wait("@newServerPoolRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/new");

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

    cy.visit("/admin/server_pools/new");

    // Check loading
    cy.get('[data-test="server-pools-save-button"]').should("be.disabled");

    cy.get('[data-test="server-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .then(() => {
        serversRequest.sendResponse();
      });

    cy.wait("@serversRequest");

    // Check that error message is shown
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

    cy.get('[data-test="servers-reload-button"]').should("not.exist");

    cy.get('[data-test="server-pools-save-button"]').should("not.be.disabled");

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

    cy.wait("@serversRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/new");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit page again with servers
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

    cy.visit("/admin/server_pools/new");

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
    cy.url().should("include", "/login?redirect=/admin/server_pools/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
