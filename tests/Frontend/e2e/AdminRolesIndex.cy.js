import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin roles index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRolesIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "roles.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/roles");
  });

  it("visit with user without permission to view roles", function () {
    // Check with missing roles.viewAny permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/roles");
    cy.get("h1").should("be.visible").and("contain", "home.title");
  });

  it("load roles", function () {
    const rolesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles*",
      {
        fixture: "roles.json",
      },
      "rolesRequest",
    );
    cy.visit("/admin/roles");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="role-search"]').within(() => {
      cy.get("input").should("be.visible").and("be.disabled");
      cy.get("button").should("be.visible").and("be.disabled");
    });

    cy.get('[data-test="roles-add-buton"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        rolesRequest.sendResponse();
      });

    cy.wait("@rolesRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get('[data-test="role-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.get('[data-test="roles-add-buton"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index");

    // Check that table headers are shown correctly
    cy.get('[data-test="role-header-cell"]').should("have.length", 1);

    cy.get('[data-test="role-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name");

    // Check that roles are displayed correctly
    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="role-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="role-item-cell"]')
          .eq(0)
          .should("include.text", "Superuser")
          .and("include.text", "admin.roles.superuser");
      });

    cy.get('[data-test="role-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="role-item-cell"]')
          .eq(0)
          .should("include.text", "Staff")
          .and("not.include.text", "admin.roles.superuser");
      });

    cy.get('[data-test="role-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="role-item-cell"]')
          .eq(0)
          .should("include.text", "Students")
          .and("not.include.text", "admin.roles.superuser");
      });
  });

  it("load roles errors", function () {
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("rolesRequest");

    cy.visit("/admin/roles");

    cy.wait("@rolesRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="role-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 200,
      fixture: "roles.json",
    }).as("rolesRequest");

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@rolesRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that roles are shown and contain the correct data
    cy.get('[data-test="role-item"]').should("have.length", 3);
    cy.get('[data-test="role-item"]')
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser");
    cy.get('[data-test="role-item"]').eq(1).should("include.text", "Staff");
    cy.get('[data-test="role-item"]').eq(2).should("include.text", "Students");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("rolesRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@rolesRequest").then((interception) => {
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
    cy.get('[data-test="role-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(0, 1);
      roles.meta.last_page = 1;
      roles.meta.per_page = 1;
      roles.meta.to = 1;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that role is shown and contains the correct data
    cy.get('[data-test="role-item"]').should("have.length", 1);
    cy.get('[data-test="role-item"]')
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/admin/roles");

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load roles page out of bounds", function () {
    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(0, 1);
      roles.meta.last_page = 2;
      roles.meta.per_page = 1;
      roles.meta.to = 1;
      roles.meta.total = 2;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.visit("/admin/roles");

    cy.wait("@rolesRequest");

    // Switch to next page but respond with no roles on second page
    cy.fixture("roles.json").then((roles) => {
      roles.data = [];
      roles.meta.current_page = 2;
      roles.meta.last_page = 1;
      roles.meta.from = null;
      roles.meta.per_page = 2;
      roles.meta.to = null;
      roles.meta.total = 2;
      roles.meta.total_no_filter = 2;

      const emptyRolesRequest = interceptIndefinitely(
        "GET",
        "api/v1/roles*",
        {
          statusCode: 200,
          body: roles,
        },
        "rolesRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("roles.json").then((roles) => {
        roles.data = roles.data.slice(0, 2);
        roles.meta.per_page = 2;
        roles.meta.to = 2;
        roles.meta.total = 2;
        roles.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/roles*", {
          statusCode: 200,
          body: roles,
        })
          .as("rolesRequest")
          .then(() => {
            emptyRolesRequest.sendResponse();
          });
      });
    });

    // Wait for first user request and check that page is still the same
    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second user request and check that page is reset
    cy.wait("@rolesRequest").then((interception) => {
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

  it("role search", function () {
    cy.visit("/admin/roles");

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query.name).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no roles found for this search query
    cy.fixture("roles.json").then((roles) => {
      roles.data = [];
      roles.meta.from = null;
      roles.meta.per_page = 1;
      roles.meta.to = null;
      roles.meta.total = 0;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="role-search"] > input').should("have.value", "");
    cy.get('[data-test="role-search"] > input').type("Test");
    cy.get('[data-test="role-search"] > button').click();

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query.name).to.equal("Test");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no roles are displayed
    cy.contains("admin.roles.no_data_filtered").should("be.visible");
    cy.get('[data-test="role-item"]').should("not.exist");

    // Check with no roles available
    cy.fixture("roles.json").then((roles) => {
      roles.data = [];
      roles.meta.from = null;
      roles.meta.per_page = 1;
      roles.meta.to = null;
      roles.meta.total = 0;
      roles.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="role-search"] > input').clear();
    cy.get('[data-test="role-search"] > input').type("Test2");
    cy.get('[data-test="role-search"] > input').type("{enter}");

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query.name).to.equal("Test2");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no roles are displayed
    cy.contains("admin.roles.no_data").should("be.visible");
    cy.get('[data-test="role-item"]').should("have.length", 0);

    // Check with 2 roles on 2 pages
    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(0, 1);
      roles.meta.last_page = 2;
      roles.meta.per_page = 1;
      roles.meta.to = 1;
      roles.meta.total = 2;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="role-search"] > input').clear();
    cy.get('[data-test="role-search"] > input').type("e");
    cy.get('[data-test="role-search"] > button').click();

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query.name).to.equal("e");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct role is shown
    cy.get('[data-test="role-item"]').should("have.length", 1);
    cy.get('[data-test="role-item"]')
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(1, 2);
      roles.meta.current_page = 2;
      roles.meta.from = 2;
      roles.meta.last_page = 2;
      roles.meta.per_page = 1;
      roles.meta.to = 2;
      roles.meta.total = 2;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        name: "e",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="role-search"] > input').should("have.value", "e");

    // Check that correct user is shown
    cy.get('[data-test="role-item"]').should("have.length", 1);
    cy.get('[data-test="role-item"]').eq(0).should("include.text", "Staff");

    // Change search query and make sure that the page is reset
    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(0, 1);
      roles.meta.last_page = 2;
      roles.meta.per_page = 1;
      roles.meta.to = 1;
      roles.meta.total = 2;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="role-search"] > input').clear();
    cy.get('[data-test="role-search"] > input').type("o");
    cy.get('[data-test="role-search"] > button').click();

    // Check that roles are loaded with the page reset to the first page
    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        name: "o",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("sort roles", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "name",
        sort_direction: "asc",
      });
    });

    // Check that correct columns are sortable and correct sorting type and direction is shown
    cy.get('[data-test="role-header-cell"]').should("have.length", 2);
    cy.get('[data-test="role-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");
    cy.get('[data-test="role-header-cell"]')
      .eq(1)
      .should("have.text", "app.actions")
      .and("not.have.attr", "data-p-sortable-column", "true");

    // Change sorting direction and response with 3 roles on 3 pages
    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(0, 1);
      roles.meta.last_page = 3;
      roles.meta.per_page = 1;
      roles.meta.to = 1;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="role-header-cell"]').eq(0).click();

    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "name",
        sort_direction: "desc",
      });
    });

    // Check that sorting is shown correctly
    cy.get('[data-test="role-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct role is shown
    cy.get('[data-test="role-item"]').should("have.length", 1);
    cy.get('[data-test="role-item"]')
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(1, 2);
      roles.meta.current_page = 2;
      roles.meta.from = 2;
      roles.meta.last_page = 3;
      roles.meta.per_page = 1;
      roles.meta.to = 2;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@rolesRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "name",
        sort_direction: "desc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is shown correctly
    cy.get('[data-test="role-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct role is shown
    cy.get('[data-test="role-item"]').should("have.length", 1);
    cy.get('[data-test="role-item"]').eq(0).should("include.text", "Staff");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.slice(0, 1);
      roles.meta.last_page = 3;
      roles.meta.per_page = 1;
      roles.meta.to = 1;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
    });

    cy.get('[data-test="role-header-cell"]').eq(0).click();

    // Check that roles are loaded with the page reset to the first page
    cy.wait("@rolesRequest").then((interception) => {
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

    // Check that sorting is shown correctly
    cy.get('[data-test="role-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct role is shown
    cy.get('[data-test="role-item"]').should("have.length", 1);
    cy.get('[data-test="role-item"]')
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser");
  });

  it("check button visibility with view permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.get('[data-test="roles-add-button"]').should("not.exist");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="role-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1");
        cy.get('[data-test="roles-edit-button"]').should("not.exist");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2");
        cy.get('[data-test="roles-edit-button"]').should("not.exist");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3");
        cy.get('[data-test="roles-edit-button"]').should("not.exist");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.get('[data-test="roles-add-button"]').should("not.exist");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="role-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with add permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
        "roles.create",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.get('[data-test="roles-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/roles/new");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="role-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
        "roles.create",
        "roles.delete",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.get('[data-test="roles-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/roles/new");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="role-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2/edit");
        cy.get('[data-test="roles-delete-button"]').should("be.visible");
      });

    cy.get('[data-test="role-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3/edit");
        cy.get('[data-test="roles-delete-button"]').should("be.visible");
      });
  });

  it("check button visibility for user that is no superuser", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
        "roles.create",
        "roles.delete",
      ];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.get('[data-test="roles-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/roles/new");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="role-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/1/edit");
        cy.get('[data-test="roles-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="role-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/2/edit");
        cy.get('[data-test="roles-delete-button"]').should("be.visible");
      });

    cy.get('[data-test="role-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="roles-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3");
        cy.get('[data-test="roles-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/roles/3/edit");
        cy.get('[data-test="roles-delete-button"]').should("be.visible");
      });
  });
});
