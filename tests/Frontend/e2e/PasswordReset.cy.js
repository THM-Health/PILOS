import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Password reset", function () {
  beforeEach(function () {
    cy.intercept("GET", "api/v1/locale/en", {});

    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
  });

  it("check with local auth disabled", function () {
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/reset_password");

    cy.url().should("include", "/404").and("not.include", "/forgot_password");
  });

  it("visit with logged in user", function () {
    cy.intercept("GET", "api/v1/currentUser", {
      statusCode: 200,
      fixture: "currentUser.json",
    });

    cy.visit("/reset_password");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.guests_only");

    // Check that user is redirected to home page
    cy.url().should("not.include", "/forgot_password");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("reset password of existing user", function () {
    cy.visit("/reset_password?email=johndoe@domain.tld&token=Token123");

    cy.contains("auth.input_new_password").should("be.visible");
    cy.contains("auth.input_new_password_new_user").should("not.exist");

    cy.get('[data-test="new-password-field"]')
      .should("include.text", "auth.new_password")
      .should("be.visible")
      .within(() => {
        cy.get("#new_password").should("be.visible").type("secretPassword123#");
      });

    cy.get('[data-test="password-confirmation-field"]')
      .should("include.text", "auth.new_password_confirmation")
      .should("be.visible")
      .within(() => {
        cy.get("#password_confirmation")
          .should("be.visible")
          .type("secretPassword123#");
      });

    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept("GET", "/sanctum/csrf-cookie", {
      statusCode: 200,
      headers: {
        "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/",
      },
    }).as("cookieRequest");

    cy.intercept("GET", "api/v1/currentUser", {
      statusCode: 200,
      fixture: "currentUser.json",
    }).as("currentUserRequest");

    const resetPasswordRequest = interceptIndefinitely(
      "POST",
      "api/v1/password/reset",
      {
        statusCode: 200,
        body: {
          message: "Success!",
        },
      },
      "resetPasswordRequest",
    );

    cy.get('[data-test="reset-password-button"]')
      .should("have.text", "auth.change_password")
      .click();

    // Check loading
    cy.get("#new_password").should("be.disabled");
    cy.get("#password_confirmation").should("be.disabled");

    cy.get('[data-test="reset-password-button"]')
      .should("be.disabled")
      .then(() => {
        resetPasswordRequest.sendResponse();
      });

    cy.wait("@cookieRequest");
    cy.wait("@resetPasswordRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        email: "johndoe@domain.tld",
        password: "secretPassword123#",
        password_confirmation: "secretPassword123#",
        token: "Token123",
      });

      expect(interception.request.headers).to.contain({
        "x-xsrf-token": "test-csrf",
      });
    });

    cy.wait("@currentUserRequest");

    // Check that success message is shown
    cy.checkToastMessage("Success!");

    // Check that user is redirected to home page
    cy.url().should("not.include", "/reset_password");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("reset password view for new user", function () {
    cy.visit(
      "/reset_password?email=johndoe@domain.tld&token=Token123&welcome=true",
    );

    cy.contains("auth.input_new_password_new_user").should("be.visible");

    cy.get('[data-test="reset-password-button"]').should(
      "have.text",
      "auth.set_password",
    );
  });

  it("reset password errors", function () {
    cy.visit("/reset_password");

    cy.get("#new_password").type("secretPassword123");
    cy.get("#password_confirmation").type("newSecretPassword123#");

    // Check 422 error
    cy.intercept("POST", "api/v1/password/reset", {
      statusCode: 422,
      body: {
        errors: {
          password: ["The New password field is required."],
          password_confirmation: [
            "The New password confirmation field is required.",
          ],
        },
      },
    }).as("resetPasswordRequest");

    cy.get('[data-test="reset-password-button"]').click();

    cy.wait("@resetPasswordRequest");

    // Check that error message is shown
    cy.get('[data-test="new-password-field"]').should(
      "include.text",
      "The New password field is required.",
    );

    cy.get('[data-test="password-confirmation-field"]').should(
      "include.text",
      "The New password confirmation field is required.",
    );

    // Check with other 422 errors
    cy.intercept("POST", "api/v1/password/reset", {
      statusCode: 422,
      body: {
        errors: {
          email: ["The Email field is required."],
          token: ["The Token field is required."],
        },
      },
    }).as("resetPasswordRequest");

    cy.get("#new_password").clear();
    cy.get("#new_password").type("newSecretPassword123#");

    cy.get('[data-test="reset-password-button"]').click();

    cy.wait("@resetPasswordRequest");

    // Check that previous 422 error messages are hidden
    cy.get('[data-test="new-password-field"]').should(
      "not.include.text",
      "The New password field is required.",
    );
    cy.get('[data-test="password-confirmation-field"]').should(
      "not.include.text",
      "The New password confirmation field is required.",
    );

    // Check that new error messages are shown
    cy.contains("The Email field is required.").should("be.visible");
    cy.contains("The Token field is required.").should("be.visible");

    // Check with 500 error
    cy.intercept("POST", "api/v1/password/reset", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("resetPasswordRequest");

    cy.get('[data-test="reset-password-button"]').click();

    cy.wait("@resetPasswordRequest");

    // Check that 422 error messages are hidden
    cy.contains("The Email field is required.").should("not.exist");
    cy.contains("The Token field is required.").should("not.exist");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 429 error
    cy.intercept("POST", "api/v1/password/reset", {
      statusCode: 429,
      body: {
        message: "Too many requests",
      },
    }).as("resetPasswordRequest");

    cy.get('[data-test="reset-password-button"]').click();

    cy.wait("@resetPasswordRequest");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.too_many_requests");
  });
});
