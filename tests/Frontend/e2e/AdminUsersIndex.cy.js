import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/users");
  });

  it("visit with user without permission to view users", function () {
    // Check with missing users.viewAny permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/users");
    cy.get("h1").should("be.visible").and("contain", "home.title");
  });

  it("load users", function () {
    const usersRequest = interceptIndefinitely(
      "GET",
      "api/v1/users*",
      { fixture: "users.json" },
      "usersRequest",
    );

    cy.visit("/admin/users");

    cy.contains("admin.title");

    // Test loading
    cy.get("[data-test=user-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("be.disabled");
        cy.get("button").should("be.visible").and("be.disabled");
      });

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="users-add-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        usersRequest.sendResponse();
      });

    cy.wait("@usersRequest");

    // Check that loading is over
    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get("[data-test=user-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("not.be.disabled");
        cy.get("button").should("be.visible").and("not.be.disabled");
      });

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="users-add-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.users.index");

    // Check that headers are displayed correctly
    cy.get('[data-test="user-header-cell"]').should("have.length", 7);

    cy.get('[data-test="user-header-cell"]')
      .eq(0)
      .should("have.text", "app.id");
    cy.get('[data-test="user-header-cell"]')
      .eq(1)
      .should("have.text", "app.firstname");
    cy.get('[data-test="user-header-cell"]')
      .eq(2)
      .should("have.text", "app.lastname");
    cy.get('[data-test="user-header-cell"]')
      .eq(3)
      .should("have.text", "admin.users.email");
    cy.get('[data-test="user-header-cell"]')
      .eq(4)
      .should("have.text", "admin.users.authenticator.title");
    cy.get('[data-test="user-header-cell"]')
      .eq(5)
      .should("have.text", "app.roles");
    cy.get('[data-test="user-header-cell"]')
      .eq(6)
      .should("have.text", "app.actions");

    // Check that users are displayed correctly
    cy.get('[data-test="user-item"]').should("have.length", 4);

    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="user-item-cell"]').should("have.length", 7);

        cy.get('[data-test="user-item-cell"]').eq(0).should("have.text", "1");
        cy.get('[data-test="user-item-cell"]')
          .eq(1)
          .should("have.text", "John");
        cy.get('[data-test="user-item-cell"]').eq(2).should("have.text", "Doe");
        cy.get('[data-test="user-item-cell"]')
          .eq(3)
          .should("have.text", "JohnDoe@domain.tld");
        cy.get('[data-test="user-item-cell"]')
          .eq(4)
          .should("have.text", "admin.users.authenticator.local");
        cy.get('[data-test="user-item-cell"]')
          .eq(5)
          .should("have.text", "Superuser");

        cy.get('[data-test="user-item-cell"]')
          .eq(6)
          .within(() => {
            cy.get('[data-test="users-view-button"]').should("be.visible");
            cy.get('[data-test="users-edit-button"]').should("be.visible");
            cy.get('[data-test="users-delete-button"]').should("not.exist");
            cy.get('[data-test="users-reset-password-button"]').should(
              "not.exist",
            );
          });
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="user-item-cell"]').should("have.length", 7);

        cy.get('[data-test="user-item-cell"]').eq(0).should("have.text", "2");
        cy.get('[data-test="user-item-cell"]')
          .eq(1)
          .should("have.text", "Laura");
        cy.get('[data-test="user-item-cell"]')
          .eq(2)
          .should("have.text", "Rivera");
        cy.get('[data-test="user-item-cell"]')
          .eq(3)
          .should("have.text", "LauraWRivera@domain.tld");
        cy.get('[data-test="user-item-cell"]')
          .eq(4)
          .should("have.text", "admin.users.authenticator.local");
        cy.get('[data-test="user-item-cell"]')
          .eq(5)
          .should("have.text", "StudentsStaff");

        cy.get('[data-test="user-item-cell"]')
          .eq(6)
          .within(() => {
            cy.get('[data-test="users-view-button"]').should("not.exist");
            cy.get('[data-test="users-edit-button"]').should("not.exist");
            cy.get('[data-test="users-delete-button"]').should("not.exist");
            cy.get('[data-test="users-reset-password-button"]').should(
              "not.exist",
            );
          });
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="user-item-cell"]').should("have.length", 7);

        cy.get('[data-test="user-item-cell"]').eq(0).should("have.text", "3");
        cy.get('[data-test="user-item-cell"]')
          .eq(1)
          .should("have.text", "Juan");
        cy.get('[data-test="user-item-cell"]')
          .eq(2)
          .should("have.text", "Walter");
        cy.get('[data-test="user-item-cell"]')
          .eq(3)
          .should("have.text", "JuanMWalter@domain.tld");
        cy.get('[data-test="user-item-cell"]')
          .eq(4)
          .should("have.text", "admin.users.authenticator.ldap");
        cy.get('[data-test="user-item-cell"]')
          .eq(5)
          .should("have.text", "Students");

        cy.get('[data-test="user-item-cell"]')
          .eq(6)
          .within(() => {
            cy.get('[data-test="users-view-button"]').should("not.exist");
            cy.get('[data-test="users-edit-button"]').should("not.exist");
            cy.get('[data-test="users-delete-button"]').should("not.exist");
            cy.get('[data-test="users-reset-password-button"]').should(
              "not.exist",
            );
          });
      });

    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="user-item-cell"]').should("have.length", 7);

        cy.get('[data-test="user-item-cell"]').eq(0).should("have.text", "100");
        cy.get('[data-test="user-item-cell"]').eq(1).should("have.text", "Max");
        cy.get('[data-test="user-item-cell"]').eq(2).should("have.text", "Doe");
        cy.get('[data-test="user-item-cell"]')
          .eq(3)
          .should("have.text", "MaxDoe@domain.tld");
        cy.get('[data-test="user-item-cell"]')
          .eq(4)
          .should("have.text", "admin.users.authenticator.local");
        cy.get('[data-test="user-item-cell"]')
          .eq(5)
          .should("have.text", "Superuser");

        cy.get('[data-test="user-item-cell"]')
          .eq(6)
          .within(() => {
            cy.get('[data-test="users-view-button"]').should("not.exist");
            cy.get('[data-test="users-edit-button"]').should("not.exist");
            cy.get('[data-test="users-delete-button"]').should("not.exist");
            cy.get('[data-test="users-reset-password-button"]').should(
              "not.exist",
            );
          });
      });
  });

  it("load users errors", function () {
    cy.intercept("GET", "api/v1/users*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("usersRequest");

    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get("[data-test=user-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("not.be.disabled");
        cy.get("button").should("be.visible").and("not.be.disabled");
      });

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 3;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    cy.wait("@usersRequest");

    // Check that overlay gets hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if user is shown and contains the correct data
    cy.get('[data-test="user-item"]').should("have.length", 1);

    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/users*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("usersRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@usersRequest").then((interception) => {
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
    cy.get("[data-test=user-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("be.visible").and("not.be.disabled");
        cy.get("button").should("be.visible").and("not.be.disabled");
      });

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that overlay gets hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check if user is shown and contains the correct data
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/users*", {
      statusCode: 401,
    }).as("usersRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@usersRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load users page out of bounds", function () {
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 2;
      users.meta.per_page = 1;
      users.meta.to = 1;
      users.meta.total = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.visit("/admin/users");
    cy.wait("@usersRequest");

    // Switch to next page but respond with no users on second page
    cy.fixture("users.json").then((users) => {
      users.data = [];
      users.meta.current_page = 2;
      users.meta.from = null;
      users.meta.per_page = 2;
      users.meta.to = null;
      users.meta.total = 2;
      users.meta.total_no_filter = 2;

      const emptyUsersRequest = interceptIndefinitely(
        "GET",
        "api/v1/users*",
        {
          statusCode: 200,
          body: users,
        },
        "usersRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("users.json").then((users) => {
        users.data = users.data.slice(0, 2);
        users.meta.per_page = 2;
        users.meta.to = 2;
        users.meta.total = 2;
        users.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/users*", {
          statusCode: 200,
          body: users,
        })
          .as("usersRequest")
          .then(() => {
            emptyUsersRequest.sendResponse();
          });
      });
    });

    // Wait for first user request and check that page is still the same
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second user request and check that page is reset
    cy.wait("@usersRequest").then((interception) => {
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

  it("load roles errors", function () {
    const rolesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "rolesRequest",
    );

    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check loading
    cy.get('[data-test="role-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .then(() => {
        rolesRequest.sendResponse();
      });

    cy.wait("@rolesRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that multiselect is disabled
    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    // Reload roles
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.get('[data-test="roles-reload-button"]').should("be.visible").click();

    cy.wait("@rolesRequest");

    // Check that multiselect is enabled and shown correctly
    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");

    // Switch to next page with 500 error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("rolesRequest");

    cy.get(".multiselect__content").within(() => {
      cy.get('[data-test="next-page-button"]').click();
    });

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that multiselect is closed and disabled
    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    // Reload roles
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.get('[data-test="roles-reload-button"]').should("be.visible").click();

    cy.wait("@rolesRequest");

    // Check that multiselect is enabled and shown correctly
    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");
    cy.get('[data-test="role-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.get(".multiselect__content").within(() => {
      cy.get('[data-test="next-page-button"]').click();
    });

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/admin/users");

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("user search", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.name).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no users found for this search query
    cy.fixture("users.json").then((users) => {
      users.data = [];
      users.meta.from = null;
      users.meta.per_page = 1;
      users.meta.to = null;
      users.meta.total = 0;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-search"] > input').should("have.value", "");
    cy.get('[data-test="user-search"] > input').type("Test");
    cy.get('[data-test="user-search"] > button').click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.name).to.equal("Test");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no users are displayed
    cy.contains("admin.users.no_data_filtered").should("be.visible");
    cy.get('[data-test="user-item"]').should("not.exist");

    // Check with no users available
    cy.fixture("users.json").then((users) => {
      users.data = [];
      users.meta.from = null;
      users.meta.per_page = 1;
      users.meta.to = null;
      users.meta.total = 0;
      users.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-search"] > input').clear();
    cy.get('[data-test="user-search"] > input').type("Test2");
    cy.get('[data-test="user-search"] > input').type("{enter}");

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.name).to.equal("Test2");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no users are displayed
    cy.contains("admin.users.no_data").should("be.visible");
    cy.get('[data-test="user-item"]').should("have.length", 0);

    // Check with 2 users on 2 pages
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 2;
      users.meta.per_page = 1;
      users.meta.to = 1;
      users.meta.total = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-search"] > input').clear();
    cy.get('[data-test="user-search"] > input').type("e");
    cy.get('[data-test="user-search"] > button').click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.name).to.equal("e");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(1, 2);
      users.meta.current_page = 2;
      users.meta.from = 2;
      users.meta.last_page = 2;
      users.meta.per_page = 1;
      users.meta.to = 2;
      users.meta.total = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        name: "e",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="user-search"] > input').should("have.value", "e");

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "Laura");

    // Change search query and make sure that the page is reset
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 2;
      users.meta.per_page = 1;
      users.meta.to = 1;
      users.meta.total = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-search"] > input').clear();
    cy.get('[data-test="user-search"] > input').type("o");
    cy.get('[data-test="user-search"] > button').click();

    // Check that users are loaded with the page reset to the first page
    cy.wait("@usersRequest").then((interception) => {
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

  it("filter users", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.role).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="clear-roles-button"]').should("not.exist");

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter")
      .click();

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");

    // Change role and respond with no users found for this role
    cy.fixture("users.json").then((users) => {
      users.data = [];
      users.meta.from = null;
      users.meta.per_page = 1;
      users.meta.to = null;
      users.meta.total = 0;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get(".multiselect__option").eq(1).click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.role).to.equal("2");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.contains("admin.users.no_data_filtered").should("be.visible");
    cy.get('[data-test="user-item"]').should("have.length", 0);

    // Check that role are shown correctly and change it again to check for no users available
    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "Staff")
      .click();
    cy.get('[data-test="clear-roles-button"]').should("be.visible");

    cy.fixture("users.json").then((users) => {
      users.data = [];
      users.meta.from = null;
      users.meta.per_page = 1;
      users.meta.to = null;
      users.meta.total = 0;
      users.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get(".multiselect__option").eq(2).click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.role).to.equal("3");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.contains("admin.users.no_data").should("be.visible");
    cy.get('[data-test="user-item"]').should("have.length", 0);

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "Students")
      .click();
    cy.get('[data-test="clear-roles-button"]').should("be.visible");

    // Check with 3 users on 3 pages
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.data[0].roles = [{ id: 4, name: "Dean", automatic: false }];
      users.meta.last_page = 3;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    // Switch to next role page
    cy.get(".multiselect__content")
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]')
          .should("include.text", "app.previous_page")
          .and("be.disabled");
        cy.get('[data-test="next-page-button"]')
          .should("include.text", "app.next_page")
          .and("not.be.disabled");

        const userRoleRequest = interceptIndefinitely(
          "GET",
          "api/v1/roles*",
          {
            statusCode: 200,
            body: {
              data: [
                {
                  id: 4,
                  name: "Dean",
                  default: false,
                  updated_at: "2021-01-08T15:51:08.000000Z",
                  model_name: "Role",
                  room_limit: 20,
                },
                {
                  id: 5,
                  name: "Faculty",
                  default: false,
                  updated_at: "2021-03-19T09:12:44.000000Z",
                  model_name: "Role",
                  room_limit: 20,
                },
                {
                  id: 6,
                  name: "Manager",
                  default: false,
                  updated_at: "2021-05-22T11:55:21.000000Z",
                  model_name: "Role",
                  room_limit: -1,
                },
              ],
              meta: {
                current_page: 2,
                from: 4,
                last_page: 2,
                per_page: 3,
                to: 6,
                total: 6,
              },
            },
          },
          "userRoleRequest",
        );
        cy.get('[data-test="next-page-button"]').click();

        // Check loading
        cy.get('[data-test="previous-page-button"]').should("be.disabled");
        cy.get('[data-test="next-page-button"]')
          .should("be.disabled")
          .then(() => {
            userRoleRequest.sendResponse();
          });
      });

    cy.wait("@userRoleRequest");

    cy.get(".multiselect__content")
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]').should("not.be.disabled");
        cy.get('[data-test="next-page-button"]').should("be.disabled");
      });

    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Dean")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Faculty")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Manager")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");

    cy.get(".multiselect__option").eq(0).click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.role).to.equal("4");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "Dean");
    cy.get('[data-test="clear-roles-button"]').should("be.visible");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(1, 2);
      users.meta.current_page = 2;
      users.meta.from = 2;
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        role: "4",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "Dean");
    cy.get('[data-test="clear-roles-button"]').should("be.visible");

    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "Laura");

    // Clear role and make sure that page is reset
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="clear-roles-button"]').click();

    // Check that users are loaded with the page reset to the first page
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query.role).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="role-dropdown"]')
      .find(".multiselect__tags")
      .should("include.text", "admin.users.role_filter");

    cy.get('[data-test="clear-roles-button"]').should("not.exist");
  });

  it("sort users", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "id",
        sort_direction: "asc",
      });
    });

    // Check that correct columns are sortable and correct sorting type is shown
    cy.get('[data-test="user-header-cell"]').should("have.length", 7);
    cy.get('[data-test="user-header-cell"]')
      .eq(0)
      .should("have.text", "app.id")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "true");
    cy.get('[data-test="user-header-cell"]')
      .eq(1)
      .should("have.text", "app.firstname")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="user-header-cell"]')
      .eq(2)
      .should("have.text", "app.lastname")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="user-header-cell"]')
      .eq(3)
      .should("have.text", "admin.users.email")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="user-header-cell"]')
      .eq(4)
      .should("have.text", "admin.users.authenticator.title")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="user-header-cell"]')
      .eq(5)
      .should("have.text", "app.roles")
      .and("not.have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="user-header-cell"]')
      .eq(6)
      .should("have.text", "app.actions")
      .and("not.have.attr", "data-p-sortable-column", "true");

    // Change sorting type and response with 4 users on 4 different pages
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-header-cell"]').eq(1).click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "firstname",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="user-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="user-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true");

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(1, 2);
      users.meta.current_page = 2;
      users.meta.from = 2;
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "firstname",
        sort_direction: "asc",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="user-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "Laura");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-header-cell"]').eq(1).click();

    // Check that users are loaded with the page reset to the first page
    cy.wait("@usersRequest").then((interception) => {
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

    // Check that sorting is correct
    cy.get('[data-test="user-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    // Change sorting type again
    cy.get('[data-test="user-header-cell"]').eq(2).click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "lastname",
        sort_direction: "asc",
        page: "1",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="user-header-cell"]')
      .eq(1)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="user-header-cell"]')
      .eq(2)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Switch to next page
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(1, 2);
      users.meta.current_page = 2;
      users.meta.from = 2;
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "lastname",
        sort_direction: "asc",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="user-header-cell"]')
      .eq(2)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "Laura");

    // Change sorting and make sure that the page is reset
    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 1);
      users.meta.last_page = 4;
      users.meta.per_page = 1;
      users.meta.to = 1;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="user-header-cell"]').eq(3).click();

    // Check that users are loaded with the page reset to the first page
    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "email",
        sort_direction: "asc",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is correct
    cy.get('[data-test="user-header-cell"]')
      .eq(2)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="user-header-cell"]')
      .eq(3)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct user is shown
    cy.get('[data-test="user-item"]').should("have.length", 1);
    cy.get('[data-test="user-item"]').eq(0).should("include.text", "John");

    // Change sorting again
    cy.get('[data-test="user-header-cell"]').eq(4).click();

    cy.wait("@usersRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "authenticator",
        sort_direction: "asc",
        page: "1",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="user-header-cell"]')
      .eq(3)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="user-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");
  });

  it("check button visibility with view permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");
    cy.wait("@usersRequest");

    cy.get('[data-test="users-add-button"]').should("not.exist");
    cy.get('[data-test="user-item"]').should("have.length", 4);
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2");
        cy.get('[data-test="users-edit-button"]').should("not.exist");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3");
        cy.get('[data-test="users-edit-button"]').should("not.exist");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100");
        cy.get('[data-test="users-edit-button"]').should("not.exist");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });
  });

  it("check button visibility with update permission", function () {
    // Check with local users enabled
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");

    cy.get('[data-test="users-add-button"]').should("not.exist");
    cy.get('[data-test="user-item"]').should("have.length", 4);
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]').should("be.visible");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]').should("be.visible");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]').should("be.visible");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });

    // Check with local users disabled (Reset password button should not be visible)
    cy.intercept("GET", "api/v1/config", { fixture: "config.json" });

    cy.reload();

    cy.get('[data-test="users-add-button"]').should("not.exist");

    cy.get('[data-test="user-item"]').should("have.length", 4);
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]').should("be.visible");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]').should("be.visible");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]').should("be.visible");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });
  });

  it("check button visibility with add permission", function () {
    // Check with local users enabled
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");
    cy.wait("@usersRequest");

    cy.get('[data-test="users-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/users/new");
    cy.get('[data-test="user-item"]').should("have.length", 4);
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });

    // Check with local users disabled
    cy.intercept("GET", "api/v1/config", { fixture: "config.json" });

    cy.reload();

    cy.get('[data-test="users-add-button"]').should("not.exist");
    cy.get('[data-test="user-item"]').should("have.length", 4);
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");
    cy.wait("@usersRequest");

    cy.get('[data-test="users-add-button"]').should("be.visible");
    cy.get('[data-test="user-item"]').should("have.length", 4);
    // Check that delete button for current user does not exist
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2/edit");
        cy.get('[data-test="users-delete-button"]').should("be.visible");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3/edit");
        cy.get('[data-test="users-delete-button"]').should("be.visible");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });
    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100/edit");
        cy.get('[data-test="users-delete-button"]').should("be.visible");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });
  });

  it("check button visibility for user that is no superuser", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.delete",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");
    cy.wait("@usersRequest");

    cy.get('[data-test="users-add-button"]').should("be.visible");
    cy.get('[data-test="user-item"]').should("have.length", 4);
    // Check that delete button for current user does not exist
    cy.get('[data-test="user-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/1/edit");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });

    cy.get('[data-test="user-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/2/edit");
        cy.get('[data-test="users-delete-button"]').should("be.visible");
        cy.get('[data-test="users-reset-password-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="user-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3");
        cy.get('[data-test="users-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/3/edit");
        cy.get('[data-test="users-delete-button"]').should("be.visible");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });
    cy.get('[data-test="user-item"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="users-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/users/100");
        cy.get('[data-test="users-edit-button"]').should("not.exist");
        cy.get('[data-test="users-delete-button"]').should("not.exist");
        cy.get('[data-test="users-reset-password-button"]').should("not.exist");
      });
  });
});
