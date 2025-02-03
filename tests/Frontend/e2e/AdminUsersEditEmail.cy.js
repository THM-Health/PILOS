import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users edit email", function () {
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

  it("check view and save changes", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    cy.contains("admin.users.email").should("be.visible");

    // Check that fields are shown correctly and try to change email setting
    cy.get('[data-test="email-tab-current-password-field"]').should(
      "not.exist",
    );

    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "app.email")
      .within(() => {
        cy.get("#email")
          .should("have.value", "LauraWRivera@domain.tld")
          .and("not.be.disabled")
          .clear();
        cy.get("#email").type("laura.rivera@example.com");
      });

    // Save changes
    cy.fixture("userDataUser.json").then((user) => {
      user.data.email = "laura.rivera@example.com";

      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/users/2/email",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

      cy.intercept("GET", "/api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");

      cy.get('[data-test="user-tab-email-save-button"]')
        .should("have.text", "auth.change_email")
        .click();

      // Check loading
      cy.get("#current_password").should("not.exist");
      cy.get("#email")
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        email: "laura.rivera@example.com",
      });
    });

    // Check that redirect to user view worked
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");
  });

  it("save changes errors", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    // Check with 422 error
    cy.intercept("PUT", "api/v1/users/2/email", {
      statusCode: 422,
      body: {
        errors: {
          email: ["The email field is required."],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.get('[data-test="email-field"]').should(
      "include.text",
      "The email field is required.",
    );

    // Check with 500 error
    cy.intercept("PUT", "api/v1/users/2/email", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="email-field"]').should(
      "not.include.text",
      "The email field is required.",
    );

    // Check with 404 error
    cy.interceptAdminUsersIndexRequests();

    cy.intercept("PUT", "api/v1/users/2/email", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("not.include", "/admin/users/2/edit");
    cy.url().should("include", "/admin/users");

    cy.wait("@usersRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Visit edit page again
    cy.visit("/admin/users/2/edit");
    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    // Check with 401 error
    cy.intercept("PUT", "api/v1/users/2/email", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("view for external user", function () {
    cy.fixture("userDataUser.json").then((user) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "lwr";

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    // Check that email setting is disabled and save button is hidden
    cy.get('[data-test="email-tab-current-password-field"]').should(
      "not.exist",
    );
    cy.get("#email")
      .should("be.disabled")
      .and("have.value", "LauraWRivera@domain.tld");

    cy.get('[data-test="user-tab-email-save-button"]').should("not.exist");
  });
});
