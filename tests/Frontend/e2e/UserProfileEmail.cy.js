import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("User Profile Email", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptUserProfileRequests();
  });

  it("check view and save changes", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    cy.contains("admin.users.email").should("be.visible");

    // Check that fields are shown correctly and try to change email setting
    cy.get('[data-test="email-tab-current-password-field"]')
      .should("be.visible")
      .and("include.text", "auth.current_password")
      .within(() => {
        cy.get("#current_password")
          .should("have.value", "")
          .type("secretPassword123#");
      });

    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "app.email")
      .within(() => {
        cy.get("#email").should("have.value", "JohnDoe@domain.tld").clear();
        cy.get("#email").type("john.doe@example.com");
      });

    // Save changes
    const saveChangesRequest = interceptIndefinitely(
      "PUT",
      "api/v1/users/1/email",
      {
        statusCode: 202,
      },
      "saveChangesRequest",
    );

    cy.get('[data-test="user-tab-email-save-button"]')
      .should("have.text", "auth.change_email")
      .click();

    // Check loading
    cy.get("#current_password").should("be.disabled");
    cy.get("#email")
      .should("be.disabled")
      .then(() => {
        saveChangesRequest.sendResponse();
      });

    cy.wait("@saveChangesRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        email: "john.doe@example.com",
        current_password: "secretPassword123#",
      });
    });

    // Check that fields are enabled and changed back to the original values
    cy.get("#current_password").should("have.value", "").and("not.be.disabled");
    cy.get("#email")
      .should("have.value", "JohnDoe@domain.tld")
      .and("not.be.disabled");

    // Check that message is shown
    cy.get('[data-test="email-confirmation-message"]')
      .should("be.visible")
      .should(
        "include.text",
        'auth.send_email_confirm_mail_{"email":"john.doe@example.com"}',
      );

    // Submit again but server already has changed email
    cy.get("#current_password").type("secretPassword123#");
    cy.get("#email").clear();
    cy.get("#email").type("john.doe@example.com");

    cy.fixture("user.json").then((user) => {
      user.data.email = "john.doe@example.com";

      cy.intercept("PUT", "api/v1/users/1/email", {
        statusCode: 200,
        body: {
          data: user.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that message is hidden
    cy.get('[data-test="email-confirmation-message"]').should("not.exist");

    // Check that fields are enabled and email stayed the same
    cy.get("#current_password").should("have.value", "").and("not.be.disabled");
    cy.get("#email")
      .should("have.value", "john.doe@example.com")
      .and("not.be.disabled");
  });

  it("save changes errors", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    cy.get("#current_password").type("secretPassword123#");

    // Check with 471 error (email change throttle error)
    cy.intercept("PUT", "api/v1/users/1/email", {
      statusCode: 471,
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.checkToastMessage("auth.throttle_email");

    // Check with 422 error
    cy.intercept("PUT", "api/v1/users/1/email", {
      statusCode: 422,
      body: {
        errors: {
          email: ["The email field is required."],
          current_password: ["The current password is incorrect."],
        },
      },
    }).as("saveChangesRequest");

    cy.get("#current_password").type("secretPassword123#");
    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.get('[data-test="email-tab-current-password-field"]').should(
      "include.text",
      "The current password is incorrect.",
    );

    cy.get('[data-test="email-field"]').should(
      "include.text",
      "The email field is required.",
    );

    // Check with 500 error
    cy.intercept("PUT", "api/v1/users/1/email", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get("#current_password").type("secretPassword123#");
    cy.get('[data-test="user-tab-email-save-button"]').click();

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("PUT", "api/v1/users/1/email", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get("#current_password").type("secretPassword123#");
    cy.get('[data-test="user-tab-email-save-button"]').click();

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/profile");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("view without users.update permission", function () {
    cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    // Check that email setting is disabled and save button is hidden
    cy.get('[data-test="email-tab-current-password-field"]').should(
      "not.exist",
    );
    cy.get("#email")
      .should("be.disabled")
      .and("have.value", "JohnDoe@domain.tld");

    cy.get('[data-test="user-tab-email-save-button"]').should("not.exist");
  });

  it("view as external user", function () {
    cy.fixture("user.json").then((user) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "jdo";

      cy.intercept("GET", "api/v1/users/1", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    // Check that email setting is disabled and save button is hidden
    cy.get('[data-test="email-tab-current-password-field"]').should(
      "not.exist",
    );
    cy.get("#email")
      .should("be.disabled")
      .and("have.value", "JohnDoe@domain.tld");

    cy.get('[data-test="user-tab-email-save-button"]').should("not.exist");
  });
});
