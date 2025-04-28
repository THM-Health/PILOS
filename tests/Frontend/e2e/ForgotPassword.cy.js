import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Forgot password", function () {
  beforeEach(function () {
    cy.intercept("GET", "api/v1/locale/en", { fixture: "en.json" });

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

    cy.visit("/forgot_password");

    cy.url().should("include", "/404").and("not.include", "/forgot_password");
  });

  it("check with password change forbidden", function () {
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;
      config.data.user.password_change_allowed = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/forgot_password");

    cy.url().should("include", "/404").and("not.include", "/forgot_password");
  });

  it("visit with logged in user", function () {
    cy.intercept("GET", "api/v1/currentUser", {
      statusCode: 200,
      fixture: "currentUser.json",
    });

    cy.visit("/forgot_password");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.guests_only");

    // Check that user is redirected to home page
    cy.url().should("not.include", "/forgot_password");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("forgot password", function () {
    cy.visit("/forgot_password");

    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept("GET", "/sanctum/csrf-cookie", {
      statusCode: 200,
      headers: {
        "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/",
      },
    }).as("cookieRequest");

    // Intercept forgot password request
    const forgotPasswordRequest = interceptIndefinitely(
      "POST",
      "api/v1/password/email",
      {
        statusCode: 200,
        body: {
          message: "Success!",
        },
      },
      "forgotPasswordRequest",
    );

    // Check that email field is shown correctly and click on submit button
    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "app.email")
      .within(() => {
        cy.get("#email")
          .should("be.visible")
          .and("have.value", "")
          .type("JohnDoe@domain.tld");
      });

    cy.get('[data-test="send-reset-link-button"]')
      .should("have.text", "auth.send_password_reset_link")
      .click();

    // Check loading
    cy.get("#email").should("be.disabled");
    cy.get('[data-test="send-reset-link-button"]')
      .should("be.disabled")
      .then(() => {
        forgotPasswordRequest.sendResponse();
      });

    cy.wait("@cookieRequest");

    // Check if correct data gets sent
    cy.wait("@forgotPasswordRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        email: "JohnDoe@domain.tld",
      });
      expect(interception.request.headers).to.contain({
        "x-xsrf-token": "test-csrf",
      });
    });

    // Check if success message is shown
    cy.checkToastMessage("Success!");

    // Check that user is redirected to home page
    cy.url().should("not.include", "/forgot_password");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("forgot password errors", function () {
    cy.visit("/forgot_password");

    cy.get("#email").type("JohnDoe@domain.tld");

    // Check with 422 error
    cy.intercept("POST", "api/v1/password/email", {
      statusCode: 422,
      body: {
        errors: {
          email: ["The email fiel is required."],
        },
      },
    }).as("forgotPasswordRequest");

    cy.get('[data-test="send-reset-link-button"]').click();

    cy.wait("@forgotPasswordRequest");

    // Check that error message is shown
    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "The email fiel is required.");

    // Check with 500 error
    cy.intercept("POST", "api/v1/password/email", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("forgotPasswordRequest");

    cy.get('[data-test="send-reset-link-button"]').click();

    cy.wait("@forgotPasswordRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error message is hidden
    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("not.include.text", "The email fiel is required.");
  });
});
