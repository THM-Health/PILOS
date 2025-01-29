import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users edit", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersViewRequests();

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

    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/users/2/edit");
  });

  it("visit with user without permission to edit users", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "roles.viewAny",
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

  it("check visiting edit user page of a superuser", function () {
    cy.fixture("userDataUser.json").then((user) => {
      user.data.superuser = true;

      user.data.roles.push({
        id: 1,
        name: "Superuser",
        automatic: true,
        superuser: true,
      });

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    // Check with being a superuser
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/users/2");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    cy.get('[data-test="base-tab-button"]').should("be.visible");
    cy.get('[data-test="email-tab-button"]').should("be.visible");
    cy.get('[data-test="security-tab-button"]').should("be.visible");
    cy.get('[data-test="others-tab-button"]').should("be.visible");

    // Check without being a superuser
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;
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

    cy.reload();

    cy.wait("@userRequest");

    // Check that redirected to view page
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");
  });

  it("visit edit user page", function () {
    const userRequest = interceptIndefinitely(
      "GET",
      "api/v1/users/2",
      { fixture: "userDataUser.json" },
      "userRequest",
    );

    cy.visit("/admin/users/2/edit");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]').should("not.exist");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    cy.get('[data-test="base-tab-button"]').should("not.exist");
    cy.get('[data-test="email-tab-button"]').should("not.exist");
    cy.get('[data-test="security-tab-button"]').should("not.exist");
    cy.get('[data-test="others-tab-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        userRequest.sendResponse();
      });

    cy.wait("@userRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get('[data-test="users-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/users/2");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.users.index")
      .should(
        "include.text",
        'admin.breakcrumbs.users.edit_{"firstname":"Laura","lastname":"Rivera"}',
      );

    cy.get('[data-test="base-tab-button"]').should("be.visible");
    cy.get('[data-test="email-tab-button"]').should("be.visible");
    cy.get('[data-test="security-tab-button"]').should("be.visible");
    cy.get('[data-test="others-tab-button"]').should("be.visible");
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "users.create",
        "users.delete",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/users/2");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="user-tab-profile-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });

  it("visit edit user page errors", function () {
    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("userRequest");

    cy.visit("admin/users/2/edit");

    cy.wait("@userRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/users/2", {
      fixture: "userDataUser.json",
    }).as("userRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@userRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");

    // Reload page with 404 errors
    cy.interceptAdminUsersIndexRequests();

    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("userRequest");

    cy.reload();

    cy.wait("@userRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/users/2/edit");
    cy.url().should("include", "/admin/users");

    cy.wait("@usersRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 401,
    }).as("userRequest");

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
