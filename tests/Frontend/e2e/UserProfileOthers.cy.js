import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("User Profile Others", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptUserProfileRequests();
  });

  it("check view and save changes", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="others-tab-button"]').click();

    cy.contains("admin.users.bbb").should("be.visible");

    cy.get('[data-test="bbb-skip-check-audio-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.skip_check_audio")
      .find("#bbb_skip_check_audio")
      .should("not.be.checked")
      .click();

    // Save changes
    cy.fixture("userDataCurrentUser.json").then((user) => {
      user.data.bbb_skip_check_audio = true;

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/users/1",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

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

    // Check that the changes are shown
    cy.get("#bbb_skip_check_audio").should("be.checked");
  });

  it("save changes errors", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get('[data-test="others-tab-button"]').click();

    // Check with 422 error
    cy.intercept("POST", "api/v1/users/1", {
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
    cy.intercept("POST", "api/v1/users/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");
    // Check that 422 error messages are hidden
    cy.get('[data-test="bbb-skip-check-audio-field"]').should(
      "not.include.text",
      "The bbb skip check audio field is required.",
    );

    // Check that the error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 428 error (stale error)
    cy.fixture("userDataCurrentUser.json").then((user) => {
      const newModel = user.data;
      newModel.bbb_skip_check_audio = true;

      cy.intercept("POST", "api/v1/users/1", {
        statusCode: 428,
        body: {
          message: " The user entity was updated in the meanwhile!",
          new_model: newModel,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-user-dialog"]').should("not.exist");
    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-user-dialog"]')
      .should("be.visible")
      .and("include.text", "The user entity was updated in the meanwhile!");

    cy.get('[data-test="stale-dialog-reload-button"]').click();

    // Check that the changes are shown
    cy.get("#bbb_skip_check_audio").should("be.checked");

    // Check with 401 error
    cy.intercept("POST", "api/v1/users/1", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-others-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/profile");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
