import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Verify email", function () {
  beforeEach(function () {
    cy.init();
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

    cy.visit("/verify_email");

    cy.url().should("include", "/404").and("not.include", "/verify_email");
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/verify_email");
  });

  it("verify email", function () {
    const verifyEmailRequest = interceptIndefinitely(
      "POST",
      "api/v1/email/verify",
      {
        statusCode: 200,
      },
      "verifyEmailRequest",
    );

    cy.visit("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    cy.contains("app.verify_email.title").should("be.visible");

    // Check loading
    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        verifyEmailRequest.sendResponse();
      });

    cy.wait("@verifyEmailRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        email: "MaxDoe@domain.tld",
        token: "Token123",
      });
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that correct message is shown
    cy.get('[data-test="verify-success-message"]')
      .should("be.visible")
      .and("include.text", "app.verify_email.success");
    cy.get('[data-test="verify-invalid-message"]').should("not.exist");
    cy.get('[data-test="verify-error-message"]').should("not.exist");
  });

  it("verify email errors", function () {
    // Check with 422 error (missing props)
    cy.intercept("POST", "api/v1/email/verify", {
      statusCode: 422,
      body: {
        errors: {
          email: ["The email field is required."],
          token: ["The token field is required."],
        },
      },
    }).as("verifyEmailRequest");

    cy.visit("/verify_email");

    cy.wait("@verifyEmailRequest");

    // Check that correct message is shown
    cy.get('[data-test="verify-success-message"]').should("not.exist");
    cy.get('[data-test="verify-invalid-message"]')
      .should("be.visible")
      .and("include.text", "app.verify_email.invalid");
    cy.get('[data-test="verify-error-message"]').should("not.exist");

    // Check with 422 error (invalid token)
    cy.intercept("POST", "api/v1/email/verify", {
      statusCode: 422,
    }).as("verifyEmailRequest");

    cy.visit("/verify_email?email=MaxDoe@domain.tld&token=Token123");

    cy.wait("@verifyEmailRequest");

    // Check that correct message is shown
    cy.get('[data-test="verify-success-message"]').should("not.exist");
    cy.get('[data-test="verify-invalid-message"]')
      .should("be.visible")
      .and("include.text", "app.verify_email.invalid");
    cy.get('[data-test="verify-error-message"]').should("not.exist");

    // Check with other error
    cy.intercept("POST", "api/v1/email/verify", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("verifyEmailRequest");

    cy.reload();

    cy.wait("@verifyEmailRequest");

    // Check that correct message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="verify-success-message"]').should("not.exist");
    cy.get('[data-test="verify-invalid-message"]').should("not.exist");
    cy.get('[data-test="verify-error-message"]')
      .should("be.visible")
      .and("include.text", "app.verify_email.fail");

    // Check with 429 error
    cy.intercept("POST", "api/v1/email/verify", {
      statusCode: 429,
      body: {
        message: "Too many requests",
      },
    }).as("verifyEmailRequest");

    cy.reload();

    cy.wait("@verifyEmailRequest");

    // Check that correct message is shown
    cy.checkToastMessage("app.flash.too_many_requests");

    cy.get('[data-test="verify-success-message"]').should("not.exist");
    cy.get('[data-test="verify-invalid-message"]').should("not.exist");
    cy.get('[data-test="verify-error-message"]')
      .should("be.visible")
      .and("include.text", "app.verify_email.fail");

    // Check with 401 error
    cy.intercept("POST", "api/v1/email/verify", {
      statusCode: 401,
    }).as("verifyEmailRequest");

    cy.reload();

    cy.wait("@verifyEmailRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/verify_email");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
