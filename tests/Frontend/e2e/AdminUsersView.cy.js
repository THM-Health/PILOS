import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersViewRequests();

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

    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/users/");
  });

  it("visit with user without permission to view users", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/users/2");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check userView shown correctly", function () {
    const userRequest = interceptIndefinitely(
      "GET",
      "api/v1/users/2",
      { fixture: "userDataUser.json" },
      "userRequest",
    );

    cy.visit("/admin/users/2");

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

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]').should("not.exist");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    cy.get('[data-test="base-tab-button"]').should("be.visible");
    cy.get('[data-test="email-tab-button"]').should("be.visible");
    cy.get('[data-test="security-tab-button"]').should("be.visible");
    cy.get('[data-test="others-tab-button"]').should("be.visible");

    // Check that user data is shown and all inputs are disabled
    // Base tab
    cy.get("#firstname").should("have.value", "Laura").and("be.disabled");
    cy.get("#lastname").should("have.value", "Rivera").and("be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.local")
      .and("be.disabled");

    // Check that profile image buttons are hidden
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("not.exist");
    cy.get('[data-test="undo-delete-button"]').should("not.exist");
    cy.get('[data-test="upload-file-input"]').should("not.exist");

    cy.get('[data-test="locale-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="timezone-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    // Email tab
    cy.get('[data-test="email-tab-button"]').click();

    cy.get("#email")
      .should("have.value", "LauraWRivera@domain.tld")
      .and("be.disabled");

    // Security tab
    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="role-dropdown"]')
      .should("include.text", "Students")
      .should("include.text", "Staff")
      .should("have.class", "multiselect--disabled");

    // Check others tab
    cy.get('[data-test="others-tab-button"]').click();

    cy.get("#bbb_skip_check_audio").should("not.be.checked").and("be.disabled");
  });

  it("check userView with ldap user", function () {
    cy.fixture("userDataUser.json").then((user) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "lwr";

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get("#firstname").should("have.value", "Laura").and("be.disabled");
    cy.get("#lastname").should("have.value", "Rivera").and("be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.ldap")
      .and("be.disabled");

    cy.get('[data-test="authenticator-id-field"]')
      .should("include.text", "auth.authenticator_id")
      .within(() => {
        cy.get("#authenticator_id")
          .should("have.value", "lwr")
          .and("be.disabled");
      });

    // Check that profile image buttons are hidden
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("not.exist");
    cy.get('[data-test="undo-delete-button"]').should("not.exist");
    cy.get('[data-test="upload-file-input"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    cy.get('[data-test="locale-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="timezone-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    // Email tab
    cy.get('[data-test="email-tab-button"]').click();

    cy.get("#email")
      .should("have.value", "LauraWRivera@domain.tld")
      .and("be.disabled");

    // Security tab
    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="role-dropdown"]')
      .should("include.text", "Students")
      .should("include.text", "Staff")
      .should("have.class", "multiselect--disabled");

    // Check others tab
    cy.get('[data-test="others-tab-button"]').click();

    cy.get("#bbb_skip_check_audio").should("not.be.checked").and("be.disabled");
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/users/2/edit");
    cy.get('[data-test="users-reset-password-button"]').should("be.visible");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.delete",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]').should("not.exist");
    cy.get('[data-test="users-delete-button"]').should("be.visible");
  });

  it("open view errors", function () {
    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("userRequest");

    cy.visit("admin/users/2");

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

    // Check that redirect worked and error message is shown
    cy.url().should("not.include", "/admin/users/2");
    cy.url().should("include", "/admin/users");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 401,
    }).as("userRequest");

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
