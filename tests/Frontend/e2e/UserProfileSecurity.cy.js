import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("User Profile Security", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptUserProfileRequests();
  });

  it("check view and change settings", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.contains("admin.users.roles_and_permissions").should("be.visible");

    // Check that role-select is disabled and shows the correct roles
    cy.get('[data-test="roles-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]')
          .should("include.text", "Admin")
          .should("include.text", "User")
          .should("have.class", "multiselect--disabled");
      });

    // Check that password fields are shown correctly and try to change password
    cy.get('[data-test="security-tab-current-password-field"]')
      .should("be.visible")
      .and("include.text", "auth.current_password")
      .within(() => {
        cy.get("#current_password")
          .should("have.value", "")
          .type("secretPassword123#");
      });

    cy.get('[data-test="new-password-field"]')
      .should("be.visible")
      .and("include.text", "auth.new_password")
      .within(() => {
        cy.get("#new_password")
          .should("have.value", "")
          .type("newSecretPassword123#");
      });

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("be.visible")
      .and("include.text", "auth.new_password_confirmation")
      .within(() => {
        cy.get("#new_password_confirmation")
          .should("have.value", "")
          .type("newSecretPassword123#");
      });

    // Try to change password
    cy.fixture("user").then((user) => {
      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/users/1/password",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="change-password-save-button"]')
        .should("have.text", "auth.change_password")
        .click();

      // Check loading
      cy.get('[data-test="security-tab-current-password-field"]')
        .find("#current_password")
        .should("be.disabled");
      cy.get("#new_password").should("be.disabled");
      cy.get("#new_password_confirmation")
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        new_password: "newSecretPassword123#",
        new_password_confirmation: "newSecretPassword123#",
        current_password: "secretPassword123#",
      });
    });

    // Check that fields are enabled and changed back to the original values
    cy.get('[data-test="security-tab-current-password-field"]')
      .find("#current_password")
      .should("have.value", "")
      .and("not.be.disabled");
    cy.get("#new_password").should("have.value", "").and("not.be.disabled");
    cy.get("#new_password_confirmation")
      .should("have.value", "")
      .and("not.be.disabled");

    // Check that message is shown
    cy.checkToastMessage("auth.flash.password_changed");

    // Check that all sessions are shown
    cy.get('[data-test="session-panel"]').should("have.length", 2);

    cy.get('[data-test="session-panel"]')
      .eq(0)
      .should("be.visible")
      .should("include.text", "Windows")
      .should("include.text", "auth.sessions.current")
      .should("include.text", "auth.sessions.browser Chrome")
      .should("include.text", "auth.sessions.ip 10.9.1.2");

    cy.get('[data-test="session-panel"]')
      .eq(1)
      .should("be.visible")
      .should("include.text", "iOS")
      .should("include.text", "01/23/2022, 16:55")
      .should("include.text", "auth.sessions.browser Mobile Safari")
      .should("include.text", "auth.sessions.ip 10.9.1.5");

    // Logout all other sessions
    const logoutAllRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/sessions",
      {
        statusCode: 204,
      },
      "logoutAllRequest",
    );

    cy.fixture("sessions.json").then((sessions) => {
      sessions.data = sessions.data.slice(0, 1);

      cy.intercept("GET", "api/v1/sessions", {
        statusCode: 200,
        body: sessions,
      }).as("getSessionsRequest");
    });

    cy.get('[data-test="logout-all-sessions-button"]')
      .should("have.text", "auth.sessions.logout_all")
      .click();

    // Check loading
    cy.get('[data-test="logout-all-sessions-button"]')
      .should("be.disabled")
      .then(() => {
        logoutAllRequest.sendResponse();
      });

    cy.wait("@logoutAllRequest");
    cy.wait("@getSessionsRequest");

    // Check that toast message is shown
    cy.checkToastMessage("auth.flash.logout_all_others");

    // Check that only the current session is shown
    cy.get('[data-test="session-panel"]').should("have.length", 1);
    cy.get('[data-test="session-panel"]')
      .eq(0)
      .should("be.visible")
      .should("include.text", "Windows")
      .should("include.text", "auth.sessions.current")
      .should("include.text", "auth.sessions.browser Chrome")
      .should("include.text", "auth.sessions.ip 10.9.1.2");
  });

  it("view without password change allowed", function () {
    cy.fixture("config.json").then((config) => {
      config.data.user.password_change_allowed = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.contains("admin.users.roles_and_permissions").should("be.visible");

    // Check that role-select is disabled and shows the correct roles
    cy.get('[data-test="roles-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]')
          .should("include.text", "Admin")
          .should("include.text", "User")
          .should("have.class", "multiselect--disabled");
      });

    // Check that password fields are not shown
    cy.get('[data-test="security-tab-current-password-field"]').should(
      "not.exist",
    );
    cy.get('[data-test="new-password-field"]').should("not.exist");
    cy.get('[data-test="new-password-confirmation-field"]').should("not.exist");

    // Check that all sessions are shown
    cy.get('[data-test="session-panel"]').should("have.length", 2);

    cy.get('[data-test="session-panel"]')
      .eq(0)
      .should("be.visible")
      .should("include.text", "Windows")
      .should("include.text", "auth.sessions.current")
      .should("include.text", "auth.sessions.browser Chrome")
      .should("include.text", "auth.sessions.ip 10.9.1.2");

    cy.get('[data-test="session-panel"]')
      .eq(1)
      .should("be.visible")
      .should("include.text", "iOS")
      .should("include.text", "01/23/2022, 16:55")
      .should("include.text", "auth.sessions.browser Mobile Safari")
      .should("include.text", "auth.sessions.ip 10.9.1.5");

    // Check that button to logout all other sessions is shown
    cy.get('[data-test="logout-all-sessions-button"]')
      .should("have.text", "auth.sessions.logout_all")
      .should("not.be.disabled");
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

    cy.get('[data-test="security-tab-button"]').click();

    cy.contains("admin.users.roles_and_permissions").should("be.visible");

    // Check that role-select is disabled and shows the correct roles
    cy.get('[data-test="roles-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]')
          .should("include.text", "Admin")
          .should("include.text", "User")
          .should("have.class", "multiselect--disabled");
      });

    // Check that password fields are not shown
    cy.get('[data-test="security-tab-current-password-field"]').should(
      "not.exist",
    );
    cy.get('[data-test="new-password-field"]').should("not.exist");
    cy.get('[data-test="new-password-confirmation-field"]').should("not.exist");

    // Check that all sessions are shown
    cy.get('[data-test="session-panel"]').should("have.length", 2);

    cy.get('[data-test="session-panel"]')
      .eq(0)
      .should("be.visible")
      .should("include.text", "Windows")
      .should("include.text", "auth.sessions.current")
      .should("include.text", "auth.sessions.browser Chrome")
      .should("include.text", "auth.sessions.ip 10.9.1.2");

    cy.get('[data-test="session-panel"]')
      .eq(1)
      .should("be.visible")
      .should("include.text", "iOS")
      .should("include.text", "01/23/2022, 16:55")
      .should("include.text", "auth.sessions.browser Mobile Safari")
      .should("include.text", "auth.sessions.ip 10.9.1.5");

    // Check that button to logout all other sessions is shown
    cy.get('[data-test="logout-all-sessions-button"]')
      .should("have.text", "auth.sessions.logout_all")
      .should("not.be.disabled");
  });

  it("change settings errors", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="security-tab-current-password-field"]')
      .find("#current_password")
      .type("secretPassword123#");

    cy.get('[data-test="new-password-field"]').type("newSecretPassword123#");
    cy.get('[data-test="new-password-confirmation-field"]').type(
      "newSecretPassword123#",
    );

    // Check 422 error when changing password
    cy.intercept("PUT", "api/v1/users/1/password", {
      statusCode: 422,
      body: {
        errors: {
          current_password: ["The Current password field is required."],
          new_password: ["The New password field is required."],
          new_password_confirmation: [
            "The New password confirmation field is required.",
          ],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.get('[data-test="security-tab-current-password-field"]').should(
      "include.text",
      "The Current password field is required.",
    );

    cy.get('[data-test="new-password-field"]').should(
      "include.text",
      "The New password field is required.",
    );

    cy.get('[data-test="new-password-confirmation-field"]').should(
      "include.text",
      "The New password confirmation field is required.",
    );

    // Check 500 error when changing password
    cy.get('[data-test="security-tab-current-password-field"]')
      .find("#current_password")
      .should("have.value", "")
      .type("secretPassword123#");

    cy.get('[data-test="new-password-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.intercept("PUT", "api/v1/users/1/password", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that 422 error messages are hidden
    cy.get('[data-test="security-tab-current-password-field"]').should(
      "not.include.text",
      "The Current password field is required.",
    );

    cy.get('[data-test="new-password-field"]').should(
      "not.include.text",
      "The New password field is required.",
    );

    cy.get('[data-test="new-password-confirmation-field"]').should(
      "not.include.text",
      "The New password confirmation field is required.",
    );

    // Cheock that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check 401 error when changing password
    cy.get('[data-test="security-tab-current-password-field"]')
      .find("#current_password")
      .should("have.value", "")
      .type("secretPassword123#");

    cy.get('[data-test="new-password-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.intercept("PUT", "api/v1/users/1/password", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/profile");

    cy.checkToastMessage("app.flash.unauthenticated");

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check 500 error when deleting sessions
    cy.intercept("DELETE", "api/v1/sessions", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("logoutAllRequest");

    cy.get('[data-test="logout-all-sessions-button"]').click();

    cy.wait("@logoutAllRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check 401 error when deleting sessions
    cy.intercept("DELETE", "api/v1/sessions", {
      statusCode: 401,
    }).as("logoutAllRequest");

    cy.get('[data-test="logout-all-sessions-button"]').click();

    cy.wait("@logoutAllRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/profile");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load sessions error", function () {
    const sessionsRequest = interceptIndefinitely(
      "GET",
      "api/v1/sessions",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "getSessionsRequest",
    );

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check loading
    cy.get('[data-test="session-panel"]').should("have.length", 0);
    cy.get('[data-test="loading-retry-button"]').should("not.exist");
    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        sessionsRequest.sendResponse();
      });

    cy.wait("@getSessionsRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown and no sessions are shown
    cy.get('[data-test="session-panel"]').should("have.length", 0);
    cy.get('[data-test="overlay"]').should("be.visible");

    // Reload without error
    cy.intercept("GET", "api/v1/sessions", { fixture: "sessions.json" }).as(
      "getSessionsRequest",
    );

    cy.get('[data-test="loading-retry-button"]')
      .should("have.text", "app.reload")
      .click();

    cy.wait("@getSessionsRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that all sessions are shown
    cy.get('[data-test="session-panel"]').should("have.length", 2);

    cy.get('[data-test="session-panel"]')
      .eq(0)
      .should("be.visible")
      .should("include.text", "Windows")
      .should("include.text", "auth.sessions.current")
      .should("include.text", "auth.sessions.browser Chrome")
      .should("include.text", "auth.sessions.ip 10.9.1.2");

    cy.get('[data-test="session-panel"]')
      .eq(1)
      .should("be.visible")
      .should("include.text", "iOS")
      .should("include.text", "01/23/2022, 16:55")
      .should("include.text", "auth.sessions.browser Mobile Safari")
      .should("include.text", "auth.sessions.ip 10.9.1.5");
  });
});
