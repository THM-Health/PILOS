import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users edit others", function () {
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

    cy.get('[data-test="others-tab-button"]').click();

    cy.contains("admin.users.bbb").should("be.visible");

    cy.get('[data-test="bbb-skip-check-audio-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.skip_check_audio")
      .find("#bbb_skip_check_audio")
      .should("not.be.checked")
      .and("not.be.disabled")
      .click();

    // Save changes
    cy.fixture("userDataUser.json").then((user) => {
      user.data.bbb_skip_check_audio = true;

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/users/2",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");

      cy.get('[data-test="user-tab-others-save-button"]').click();

      // Check loading
      cy.get("#bbb_skip_check_audio").should("be.disabled");
      cy.get('[data-test="user-tab-others-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      expect(interception.request.body).to.include({
        bbb_skip_check_audio: true,
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

    cy.get('[data-test="others-tab-button"]').click();

    // Check with 422 error
    cy.intercept("POST", "api/v1/users/2", {
      statusCode: 422,
      body: {
        errors: {
          bbb_skip_check_audio: ["The bbb skip check audio field is required."],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.get("#bbb_skip_check_audio").should("not.be.checked");

    cy.get('[data-test="bbb-skip-check-audio-field"]').should(
      "include.text",
      "The bbb skip check audio field is required.",
    );

    // Check with 500 error
    cy.intercept("POST", "api/v1/users/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="bbb-skip-check-audio-field"]').should(
      "not.include.text",
      "The bbb skip check audio field is required.",
    );

    // Check with 428 error (stale error)
    cy.fixture("userDataUser.json").then((user) => {
      user.data.bbb_skip_check_audio = true;

      cy.intercept("POST", "api/v1/users/2", {
        statusCode: 428,
        body: {
          message: " The user entity was updated in the meanwhile!",
          new_model: user.data,
        },
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.get('[data-test="stale-user-dialog"]').should("not.exist");
    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-user-dialog"]')
      .should("be.visible")
      .and("include.text", "The user entity was updated in the meanwhile!");

    cy.get('[data-test="stale-dialog-reload-button"]').click();

    // Check that redirected to view page
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");

    // Visit edit page again
    cy.visit("/admin/users/2/edit");
    cy.get('[data-test="others-tab-button"]').click();

    // Check with 404 error
    cy.interceptAdminUsersIndexRequests();

    cy.intercept("POST", "api/v1/users/2", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-others-save-button"]').click();

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

    cy.get('[data-test="others-tab-button"]').click();

    // Check with 401 error
    cy.intercept("POST", "api/v1/users/2", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
