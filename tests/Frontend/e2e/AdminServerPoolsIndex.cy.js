import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin server pools index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServerPoolsIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "serverPools.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/server_pools");
  });

  it("visit with user without permission to view server pools", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.visit("/admin/server_pools");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/servers");
    cy.get("h1").should("be.visible").and("contain", "home.title");
  });

  it("load server pools", function () {
    const serverPoolRequest = interceptIndefinitely(
      "GET",
      "api/v1/serverPools*",
      { fixture: "serverPools.json" },
      "serverPoolsRequest",
    );

    cy.visit("/admin/server_pools");

    cy.contains("admin.title");

    // Test loading
    cy.get('[data-test="server-pool-search"]').within(() => {
      cy.get("input").should("be.visible").and("be.disabled");
      cy.get("button").should("be.visible").and("be.disabled");
    });

    cy.get('[data-test="server-pools-add-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        serverPoolRequest.sendResponse();
      });

    cy.wait("@serverPoolsRequest");

    // Check that loading is over
    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get('[data-test="server-pool-search"]')
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("not.be.disabled");
        cy.get("button").should("be.visible").and("not.be.disabled");
      });

    cy.get('[data-test="server-pools-add-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.server_pools.index");

    // Check that table headers are displayed correctly
    cy.get('[data-test="server-pool-header-cell"]').should("have.length", 3);

    cy.get('[data-test="server-pool-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name");

    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.text", "admin.server_pools.server_count");

    cy.get('[data-test="server-pool-header-cell"]')
      .eq(2)
      .should("have.text", "app.actions");

    // Check that server pools are displayed correctly
    cy.get('[data-test="server-pool-item"]').should("have.length", 2);

    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-pool-item-cell"]')
          .eq(0)
          .should("have.text", "Test");
        cy.get('[data-test="server-pool-item-cell"]')
          .eq(1)
          .should("have.text", "2");
        cy.get('[data-test="server-pool-item-cell"]')
          .eq(2)
          .within(() => {
            cy.get('[data-test="server-pools-view-button"]').should(
              "not.exist",
            );
            cy.get('[data-test="server-pools-edit-button"]').should(
              "not.exist",
            );
            cy.get('[data-test="server-pools-delete-button"]').should(
              "not.exist",
            );
          });
      });

    cy.get('[data-test="server-pool-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="server-pool-item-cell"]')
          .eq(0)
          .should("have.text", "Production");
        cy.get('[data-test="server-pool-item-cell"]')
          .eq(1)
          .should("have.text", "1");
        cy.get('[data-test="server-pool-item-cell"]')
          .eq(2)
          .within(() => {
            cy.get('[data-test="server-pools-view-button"]').should(
              "not.exist",
            );
            cy.get('[data-test="server-pools-edit-button"]').should(
              "not.exist",
            );
            cy.get('[data-test="server-pools-delete-button"]').should(
              "not.exist",
            );
          });
      });
  });

  it("load server pools errors", function () {
    cy.intercept("GET", "api/v1/serverPools*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverPoolsRequest");

    cy.visit("/admin/server_pools");

    cy.wait("@serverPoolsRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="server-pool-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    cy.wait("@serverPoolsRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if server pool is shown and contains the correct data
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Test");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/serverPools*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverPoolsRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@serverPoolsRequest").then((interception) => {
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
    cy.get('[data-test="server-pool-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    // Check that page is reset
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if server pool is shown and contains the correct data
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Test");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/serverPools*", {
      statusCode: 401,
      body: {
        message: "Test",
      },
    }).as("serverPoolsRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@serverPoolsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/admin/server_pools");

    cy.wait("@serverPoolsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load server pools page out of bounds", function () {
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.visit("/admin/server_pools");
    cy.wait("@serverPoolsRequest");

    // Switch to next page but respond with no server pools on second page
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = [];
      serverPools.meta.current_page = 2;
      serverPools.meta.from = null;
      serverPools.meta.per_page = 2;
      serverPools.meta.to = null;

      const emptyServerPoolsRequest = interceptIndefinitely(
        "GET",
        "api/v1/serverPools*",
        { body: serverPools },
        "serverPoolsRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.intercept("GET", "api/v1/serverPools*", {
        fixture: "serverPools.json",
      })
        .as("serverPoolsRequest")
        .then(() => {
          emptyServerPoolsRequest.sendResponse();
        });
    });

    // Wait for first request and check that page 8is still the same
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second request and check that page is reset
    cy.wait("@serverPoolsRequest").then((interception) => {
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

  it("server pools search", function () {
    cy.visit("/admin/server_pools");
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query.name).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no server pools found for this search query
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = [];
      serverPools.meta.from = null;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = null;
      serverPools.meta.total = 0;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-search"] > input').should("have.value", "");
    cy.get('[data-test="server-pool-search"] > input').type("Test");
    cy.get('[data-test="server-pool-search"] > button').click();

    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Test");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no server pools are displayed
    cy.contains("admin.server_pools.no_data_filtered").should("be.visible");
    cy.get('[data-test="server-pool-item"]').should("have.length", 0);

    // Check with no server pools available
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = [];
      serverPools.meta.from = null;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = null;
      serverPools.meta.total = 0;
      serverPools.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-search"] > input').clear();
    cy.get('[data-test="server-pool-search"] > input').type("Test2");
    cy.get('[data-test="server-pool-search"] > input').type("{enter}");

    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Test2");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no server pools are displayed
    cy.contains("admin.server_pools.no_data").should("be.visible");
    cy.get('[data-test="server-pool-item"]').should("have.length", 0);

    // Check with 2 server pools on 2 pages
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-search"] > input').clear();
    cy.get('[data-test="server-pool-search"] > input').type("T");
    cy.get('[data-test="server-pool-search"] > button').click();

    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("T");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct server pool is shown
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Test");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(1, 2);
      serverPools.meta.current_page = 2;
      serverPools.meta.from = 2;
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 2;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if search query stays the same after changing the page
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("T");
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    cy.get('[data-test="server-pool-search"] >input').should("have.value", "T");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct server pool is shown
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Production");

    // Change search query and make sure that the page is reset
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-search"] > input').type("e");
    cy.get('[data-test="server-pool-search"] > button').click();

    // Check that server pools are loaded with the page reset to the first page
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query.name).to.eql("Te");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("sort server pools", function () {
    cy.visit("admin/server_pools");

    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });
    });

    // Check that correct columns are sortable and correct sorting type is shown
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "true");
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.text", "admin.server_pools.server_count")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(2)
      .should("have.text", "app.actions")
      .and("not.have.attr", "data-p-sortable-column", "true");

    // Change sorting type and respond with 2 servers on 2 different pages
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-header-cell"]').eq(1).click();

    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "servers_count",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true");

    // Check that correct server pool is shown
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Test");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(1, 2);
      serverPools.meta.current_page = 2;
      serverPools.meta.from = 2;
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 2;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "servers_count",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct server pool is shown
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Production");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-header-cell"]').eq(1).click();

    // Check that server pools are loaded with the page reset to the first page
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "servers_count",
        sort_direction: "desc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is correct
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct server pool is shown
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Test");

    // Switch to next page
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(1, 2);
      serverPools.meta.current_page = 2;
      serverPools.meta.from = 2;
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 2;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "servers_count",
        sort_direction: "desc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct server pool is shown
    cy.get('[data-test="server-pool-item"]').should("have.length", 1);
    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .should("include.text", "Production");

    // Change sorting and make sure that the page is reset
    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(0, 1);
      serverPools.meta.last_page = 2;
      serverPools.meta.per_page = 1;
      serverPools.meta.to = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="server-pool-header-cell"]').eq(0).click();

    // Check that server pools are loaded with the page reset to the first page
    cy.wait("@serverPoolsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is correct
    cy.get('[data-test="server-pool-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="server-pool-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");
  });

  it("check button visibility with view permission", function () {
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

    cy.visit("/admin/server_pools");
    cy.wait("@serverPoolsRequest");

    cy.get('[data-test="server-pools-add-button"]').should("not.exist");

    cy.get('[data-test="server-pool-item"]').should("have.length", 2);

    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1");
        cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
        cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-pool-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2");
        cy.get('[data-test="server-pools-edit-button"]').should("not.exist");
        cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
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

    cy.visit("/admin/server_pools");
    cy.wait("@serverPoolsRequest");

    cy.get('[data-test="server-pools-add-button"]').should("not.exist");

    cy.get('[data-test="server-pool-item"]').should("have.length", 2);

    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1");
        cy.get('[data-test="server-pools-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1/edit");
        cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-pool-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2");
        cy.get('[data-test="server-pools-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2/edit");
        cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with add permission", function () {
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

    cy.visit("/admin/server_pools");
    cy.wait("@serverPoolsRequest");

    cy.get('[data-test="server-pools-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/server_pools/new");

    cy.get('[data-test="server-pool-item"]').should("have.length", 2);

    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1");
        cy.get('[data-test="server-pools-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1/edit");
        cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="server-pool-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2");
        cy.get('[data-test="server-pools-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2/edit");
        cy.get('[data-test="server-pools-delete-button"]').should("not.exist");
      });
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

    cy.visit("/admin/server_pools");
    cy.wait("@serverPoolsRequest");

    cy.get('[data-test="server-pools-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/server_pools/new");

    cy.get('[data-test="server-pool-item"]').should("have.length", 2);

    cy.get('[data-test="server-pool-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1");
        cy.get('[data-test="server-pools-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/1/edit");
        cy.get('[data-test="server-pools-delete-button"]').should("be.visible");
      });

    cy.get('[data-test="server-pool-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="server-pools-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2");
        cy.get('[data-test="server-pools-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/server_pools/2/edit");
        cy.get('[data-test="server-pools-delete-button"]').should("be.visible");
      });
  });
});
