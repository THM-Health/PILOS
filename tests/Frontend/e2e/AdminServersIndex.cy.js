import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin servers index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServersIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "servers.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/servers");
  });

  it("visit with user without permission to view servers", function () {
    // Check with missing servers.viewAny permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/servers");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/servers");
    cy.get("h1").should("be.visible").and("contain", "home.title");
  });

  it("load servers", function () {
    const serversRequest = interceptIndefinitely(
      "GET",
      "api/v1/servers*",
      { fixture: "servers.json" },
      "serversRequest",
    );

    cy.visit("/admin/servers");

    cy.contains("admin.title");

    // Test loading
    cy.get('[data-test="server-search"]')
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("be.disabled");
        cy.get("button").should("be.visible").and("be.disabled");
      });

    cy.get('[data-test="servers-reload-usage-button"]')
      .should("include.text", "admin.servers.reload")
      .should("be.disabled");
    cy.get('[data-test="servers-reload-no-usage-button"]').should(
      "be.disabled",
    );

    cy.get('[data-test="servers-add-button"]').should("not.exist");

    cy.contains("admin.servers.usage_info").should("be.visible");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        serversRequest.sendResponse();
      });

    cy.wait("@serversRequest");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index");

    // Check that loading is over
    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get('[data-test="server-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.get('[data-test="servers-reload-usage-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="servers-reload-no-usage-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    cy.get('[data-test="servers-add-button"]').should("not.exist");

    cy.contains("admin.servers.usage_info").should("be.visible");

    // Check that headers are displayed correctly
    cy.get('[data-test="server-header-cell"]').should("have.length", 7);

    cy.get('[data-test="server-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name");

    cy.get('[data-test="server-header-cell"]')
      .eq(1)
      .should("have.text", "admin.servers.status");

    cy.get('[data-test="server-header-cell"]')
      .eq(2)
      .should("have.text", "admin.servers.connection");

    cy.get('[data-test="server-header-cell"]')
      .eq(3)
      .should("have.text", "admin.servers.version");

    cy.get('[data-test="server-header-cell"]')
      .eq(4)
      .should("have.text", "admin.servers.meeting_count");

    cy.get('[data-test="server-header-cell"]')
      .eq(5)
      .should("have.text", "admin.servers.participant_count");

    cy.get('[data-test="server-header-cell"]')
      .eq(6)
      .should("have.text", "admin.servers.video_count");

    // Check that servers are displayed correctly
    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').should("have.length", 7);

        cy.get('[data-test="server-item-cell"]')
          .eq(0)
          .should("have.text", "Server 01");

        cy.get('[data-test="server-item-cell"]')
          .eq(1)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.enabled");

        cy.get('[data-test="server-item-cell"]')
          .eq(2)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.online");

        cy.get('[data-test="server-item-cell"]')
          .eq(3)
          .should("have.text", "2.4.5");

        cy.get('[data-test="server-item-cell"]').eq(4).should("have.text", "2");

        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "10");

        cy.get('[data-test="server-item-cell"]').eq(6).should("have.text", "5");
      });

    cy.get('[data-test="server-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').should("have.length", 7);

        cy.get('[data-test="server-item-cell"]')
          .eq(0)
          .should("have.text", "Server 02");

        cy.get('[data-test="server-item-cell"]')
          .eq(1)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.enabled");

        cy.get('[data-test="server-item-cell"]')
          .eq(2)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.unhealthy");

        cy.get('[data-test="server-item-cell"]')
          .eq(3)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(4)
          .should("have.text", "10");

        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "50");

        cy.get('[data-test="server-item-cell"]').eq(6).should("have.text", "5");
      });

    cy.get('[data-test="server-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').should("have.length", 7);

        cy.get('[data-test="server-item-cell"]')
          .eq(0)
          .should("have.text", "Server 03");

        cy.get('[data-test="server-item-cell"]')
          .eq(1)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.disabled");

        cy.get('[data-test="server-item-cell"]')
          .eq(2)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.offline");

        cy.get('[data-test="server-item-cell"]')
          .eq(3)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(4)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(6)
          .should("have.text", " --- ");
      });

    cy.get('[data-test="server-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').should("have.length", 7);

        cy.get('[data-test="server-item-cell"]')
          .eq(0)
          .should("have.text", "Server 04");

        cy.get('[data-test="server-item-cell"]')
          .eq(1)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.draining");

        cy.get('[data-test="server-item-cell"]')
          .eq(2)
          .find("span")
          .should("include.attr", "aria-label", "admin.servers.online");

        cy.get('[data-test="server-item-cell"]')
          .eq(3)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(4)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", " --- ");

        cy.get('[data-test="server-item-cell"]')
          .eq(6)
          .should("have.text", " --- ");
      });
  });

  it("load servers errors", function () {
    cy.intercept("GET", "api/v1/servers*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serversRequest");

    cy.visit("/admin/servers");

    cy.wait("@serversRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="server-search"]')
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("not.be.disabled");
        cy.get("button").should("be.visible").and("not.be.disabled");
      });

    cy.get('[data-test="servers-reload-usage-button"]').should(
      "not.be.disabled",
    );
    cy.get('[data-test="servers-reload-no-usage-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    // Check that update usage is set correctly when reloading servers
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.update_usage).to.eql("false");
    });

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if server is shown and contains the correct data
    cy.get('[data-test="server-item"]').should("have.length", 1);

    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 01");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/servers*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serversRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="server-search"]')
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("not.be.disabled");
        cy.get("button").should("be.visible").and("not.be.disabled");
      });

    cy.get('[data-test="servers-reload-usage-button"]').should(
      "not.be.disabled",
    );
    cy.get('[data-test="servers-reload-no-usage-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        update_usage: "false",
        page: "1",
      });
    });

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if server is shown and contains the correct data
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 01");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/servers*", {
      statusCode: 401,
    }).as("serversRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@serversRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/admin/servers");

    cy.wait("@serversRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load servers page out of bounds", function () {
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 2;
      servers.meta.per_page = 1;
      servers.meta.to = 1;
      servers.meta.total = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.visit("/admin/servers");
    cy.wait("@serversRequest");

    // Switch to next page but respond with no servers on second page
    cy.fixture("servers.json").then((servers) => {
      servers.data = [];
      servers.meta.current_page = 2;
      servers.meta.from = null;
      servers.meta.per_page = 2;
      servers.meta.to = null;
      servers.meta.total = 2;
      servers.meta.total_no_filter = 2;

      const emptyServersRequest = interceptIndefinitely(
        "GET",
        "api/v1/servers*",
        {
          statusCode: 200,
          body: servers,
        },
        "serversRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("servers.json").then((servers) => {
        servers.data = servers.data.slice(0, 2);
        servers.meta.per_page = 2;
        servers.meta.to = 2;
        servers.meta.total = 2;
        servers.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/servers*", {
          statusCode: 200,
          body: servers,
        })
          .as("serversRequest")
          .then(() => {
            emptyServersRequest.sendResponse();
          });
      });
    });

    // Wait for first servers request and check that page is still the same
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second servers request and check that page is reset
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that pagination is shown correctly
    cy.get('[data-test="paginator-page"]').should("have.length", 1);
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("server search", function () {
    cy.visit("/admin/servers");
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.name).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
        update_usage: "false",
      });
    });

    // Check with no servers found for this search query
    cy.fixture("servers.json").then((servers) => {
      servers.data = [];
      servers.meta.from = null;
      servers.meta.per_page = 1;
      servers.meta.to = null;
      servers.meta.total = 0;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-search"] > input').should("have.value", "");
    cy.get('[data-test="server-search"] > input').type("Test");
    cy.get('[data-test="server-search"] > button').click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Test");
      expect(interception.request.query).to.contain({
        page: "1",
        update_usage: "false",
      });
    });

    // Check that correct message is shown and no servers are displayed
    cy.contains("admin.servers.no_data_filtered").should("be.visible");
    cy.get('[data-test="server-item"]').should("have.length", 0);

    // Check with no servers available
    cy.fixture("servers.json").then((servers) => {
      servers.data = [];
      servers.meta.from = null;
      servers.meta.per_page = 1;
      servers.meta.to = null;
      servers.meta.total = 0;
      servers.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-search"] > input').clear();
    cy.get('[data-test="server-search"] > input').type("Test2");
    cy.get('[data-test="server-search"] > input').type("{enter}");

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Test2");
      expect(interception.request.query).to.contain({
        page: "1",
        update_usage: "false",
      });
    });

    // Check that correct message is shown and no servers are displayed
    cy.contains("admin.servers.no_data").should("be.visible");
    cy.get('[data-test="server-item"]').should("have.length", 0);

    // Check with 2 servers on 2 pages
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 2;
      servers.meta.per_page = 1;
      servers.meta.to = 1;
      servers.meta.total = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-search"] > input').clear();
    cy.get('[data-test="server-search"] > input').type("Server");
    cy.get('[data-test="server-search"] > button').click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Server");
      expect(interception.request.query).to.contain({
        page: "1",
        update_usage: "false",
      });
    });

    // Check that correct server is shown
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 01");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(1, 2);
      servers.meta.current_page = 2;
      servers.meta.from = 2;
      servers.meta.last_page = 2;
      servers.meta.per_page = 1;
      servers.meta.to = 2;
      servers.meta.total = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Server");
      expect(interception.request.query).to.contain({
        page: "2",
        update_usage: "false",
      });
    });

    cy.get('[data-test="server-search"] > input').should(
      "have.value",
      "Server",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct server is shown
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 02");

    // Change search query and make sure that the page is reset
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 2;
      servers.meta.per_page = 1;
      servers.meta.to = 1;
      servers.meta.total = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-search"] > input').clear();
    cy.get('[data-test="server-search"] > input').type("Se");
    cy.get('[data-test="server-search"] > button').click();

    // Check that servers are loaded with the page reset to the first page
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Se");
      expect(interception.request.query).to.contain({
        page: "1",
        update_usage: "false",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("sort servers", function () {
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

    cy.visit("/admin/servers");

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });
    });

    // Check that correct columns are sortable and correct sorting type is shown
    cy.get('[data-test="server-header-cell"]').should("have.length", 8);
    cy.get('[data-test="server-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "true");
    cy.get('[data-test="server-header-cell"]')
      .eq(1)
      .should("have.text", "admin.servers.status")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="server-header-cell"]')
      .eq(2)
      .should("have.text", "admin.servers.connection")
      .and("not.have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="server-header-cell"]')
      .eq(3)
      .should("have.text", "admin.servers.version")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="server-header-cell"]')
      .eq(4)
      .should("have.text", "admin.servers.meeting_count")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="server-header-cell"]')
      .eq(5)
      .should("have.text", "admin.servers.participant_count")
      .and("have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="server-header-cell"]')
      .eq(6)
      .should("have.text", "admin.servers.video_count")
      .and("have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="server-header-cell"]')
      .eq(7)
      .should("have.text", "app.actions")
      .and("not.have.attr", "data-p-sortable-column", "true");

    // Change sorting type and respond with 4 servers on 4 different pages
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-header-cell"]').eq(1).click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "status",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="server-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true");

    // Check that correct server is shown
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 01");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(1, 2);
      servers.meta.current_page = 2;
      servers.meta.from = 2;
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "status",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="server-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct server is shown
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 02");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-header-cell"]').eq(1).click();

    // Check that servers are loaded with the page reset to the first page
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "status",
        sort_direction: "desc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is correct
    cy.get('[data-test="server-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct server is shown
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 01");

    // Change sorting type again
    cy.get('[data-test="server-header-cell"]').eq(3).click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "version",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="server-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-header-cell"]')
      .eq(3)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Switch to next page
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(1, 2);
      servers.meta.current_page = 2;
      servers.meta.from = 2;
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "version",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="server-header-cell"]')
      .eq(3)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct server is shown
    cy.get('[data-test="server-item"]').should("have.length", 1);
    cy.get('[data-test="server-item"]')
      .eq(0)
      .should("include.text", "Server 02");

    // Change sorting and make sure that the page is reset
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="server-header-cell"]').eq(4).click();

    // Check that servers are loaded with the page reset to the first page
    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "meeting_count",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is correct
    cy.get('[data-test="server-header-cell"]')
      .eq(3)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Change sorting again
    cy.get('[data-test="server-header-cell"]').eq(5).click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "participant_count",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="server-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-header-cell"]')
      .eq(5)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Change sorting again
    cy.get('[data-test="server-header-cell"]').eq(6).click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "video_count",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="server-header-cell"]')
      .eq(5)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-header-cell"]')
      .eq(6)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");
  });

  it("check button visibility with view permission", function () {
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

    cy.visit("/admin/servers");
    cy.wait("@serversRequest");

    cy.get('[data-test="servers-add-button"]').should("not.exist");

    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/servers/1");
        cy.get('[data-test="servers-edit-button"]').should("not.exist");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/servers/2");
        cy.get('[data-test="servers-edit-button"]').should("not.exist");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/servers/3");
        cy.get('[data-test="servers-edit-button"]').should("not.exist");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/servers/4");
        cy.get('[data-test="servers-edit-button" ]').should("not.exist");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with update permission", function () {
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

    cy.visit("/admin/servers");
    cy.wait("@serversRequest");

    cy.get('[data-test="servers-add-button"]').should("not.exist");

    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/1");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/1/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/2");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/2/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/3");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/3/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/4");
        cy.get('[data-test="servers-edit-button" ]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/4/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with add permission", function () {
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

    cy.visit("/admin/servers");
    cy.wait("@serversRequest");

    cy.get('[data-test="servers-add-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.attr", "href", "/admin/servers/new");

    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/1");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/1/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/2");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/2/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/3");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/3/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/4");
        cy.get('[data-test="servers-edit-button" ]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/4/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });
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

    cy.visit("/admin/servers");
    cy.wait("@serversRequest");

    cy.get('[data-test="servers-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/servers/new");

    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/1");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/1/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/2");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/2/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/3");
        cy.get('[data-test="servers-edit-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/3/edit");
        cy.get('[data-test="servers-delete-button"]').should("be.visible");
      });

    cy.get('[data-test="server-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="servers-view-button"]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/4");
        cy.get('[data-test="servers-edit-button" ]')
          .should("be.visible")
          .and("not.be.disabled")
          .and("have.attr", "href", "/admin/servers/4/edit");
        cy.get('[data-test="servers-delete-button"]').should("not.exist");
      });
  });
});
