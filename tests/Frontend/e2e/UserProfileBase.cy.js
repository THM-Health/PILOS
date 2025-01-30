import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";
import { parseFormData } from "../support/utils/formData.js";
import { _arrayBufferToBase64 } from "../support/utils/fileHelper.js";

describe("User Profile Base", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptUserProfileRequests();
  });

  it("check view and save changes", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.contains("admin.users.base_data").should("be.visible");

    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "JD");

    // Check firstname setting and change it
    cy.get('[data-test="firstname-field"]')
      .should("be.visible")
      .and("include.text", "app.firstname")
      .within(() => {
        cy.get("#firstname").should("have.value", "John");
        cy.get("#firstname").clear();
        cy.get("#firstname").type("Laura");
      });

    // Check lastname setting and change it
    cy.get('[data-test="lastname-field"]')
      .should("be.visible")
      .and("include.text", "app.lastname")
      .within(() => {
        cy.get("#lastname").should("have.value", "Doe");
        cy.get("#lastname").clear();
        cy.get("#lastname").type("Rivera");
      });

    // Check authenticator setting
    cy.get('[data-test="authenticator-field"]')
      .should("be.visible")
      .and("include.text", "auth.authenticator")
      .within(() => {
        cy.get("#authenticator")
          .should("have.value", "admin.users.authenticator.local")
          .and("be.disabled");
      });

    // Check profile image setting and upload new image
    cy.get('[data-test="profile-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.image.title")
      .within(() => {
        cy.get('[data-test="default-profile-image-preview"]')
          .should("be.visible")
          .and("include.text", "LR");
        cy.get('[data-test="profile-image-preview"]').should("not.exist");

        // Check that other buttons are hidden
        cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
        cy.get('[data-test="delete-image-button"]').should("not.exist");
        cy.get('[data-test="undo-delete-button"]').should("not.exist");

        // Upload new profile image
        cy.get('[data-test="upload-file-input"]').then((fileInput) => {
          cy.stub(fileInput[0], "click").as("fileInputClick");
        });

        cy.get('[data-test="upload-file-button"]')
          .should("be.visible")
          .and("have.text", "admin.users.image.upload")
          .click();

        // Check that button is connected to file input
        cy.get("@fileInputClick").should("be.calledOnce");

        cy.get('[data-test="crop-image-dialog"]').should("not.exist");

        cy.get('[data-test="upload-file-input"]')
          .should("not.be.visible")
          .selectFile("tests/Frontend/fixtures/files/profileImage.jpg", {
            force: true,
          });
      });

    cy.get('[data-test="crop-image-dialog"]')
      .should("be.visible")
      .and("include.text", "admin.users.image.crop");

    // Check if correct image is shown
    cy.fixture("files/profileImage.jpg", "base64").then((content) => {
      cy.get('[data-test="crop-image-dialog"]')
        .find("img")
        .should("have.attr", "src")
        .and("include", content);
    });

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "admin.users.image.save")
      .click();

    cy.get('[data-test="crop-image-dialog"]').should("not.exist");

    cy.get('[data-test="profile-image-field"]').within(() => {
      cy.get('[data-test="default-profile-image-preview"]').should("not.exist");
      cy.get('[data-test="profile-image-preview"]')
        .should("be.visible")
        .find("img")
        .should("have.attr", "src")
        .then((src) => {
          cy.fixture("files/profileImagePreview.jpg", "base64").then(
            (content) => {
              expect(src).to.eql("data:image/jpeg;base64," + content);
            },
          );
        });

      cy.get('[data-test="upload-file-button"]').should("be.visible");
      cy.get('[data-test="delete-image-button"]').should("not.exist");
      cy.get('[data-test="undo-delete-button"]').should("not.exist");

      // Reset image upload
      cy.get('[data-test="reset-file-upload-button"]')
        .should("be.visible")
        .and("have.text", "app.cancel")
        .click();

      cy.get('[data-test="default-profile-image-preview"]')
        .should("be.visible")
        .and("include.text", "LR");
      cy.get('[data-test="profile-image-preview"]').should("not.exist");

      cy.get('[data-test="upload-file-button"]').should("be.visible");
      cy.get('[data-test="delete-image-button"]').should("not.exist");
      cy.get('[data-test="undo-delete-button"]').should("not.exist");
      cy.get('[data-test="reset-file-upload-button"]').should("not.exist");

      // Upload image again
      cy.get('[data-test="upload-file-input"]')
        .should("not.be.visible")
        .selectFile("tests/Frontend/fixtures/files/profileImage.jpg", {
          force: true,
        });
    });

    cy.get('[data-test="crop-image-dialog"]')
      .should("be.visible")
      .and("include.text", "admin.users.image.crop");

    // Check if correct image is shown
    cy.fixture("files/profileImage.jpg", "base64").then((content) => {
      cy.get('[data-test="crop-image-dialog"]')
        .find("img")
        .should("have.attr", "src")
        .and("include", content);
    });

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "admin.users.image.save")
      .click();

    cy.get('[data-test="crop-image-dialog"]').should("not.exist");

    // Check that image and buttons are still shown correctly
    cy.get('[data-test="profile-image-field"]').within(() => {
      cy.get('[data-test="default-profile-image-preview"]').should("not.exist");
      cy.get('[data-test="profile-image-preview"]')
        .should("be.visible")
        .find("img")
        .should("have.attr", "src")
        .then((src) => {
          cy.fixture("files/profileImagePreview.jpg", "base64").then(
            (content) => {
              expect(src).to.eql("data:image/jpeg;base64," + content);
            },
          );
        });

      cy.get('[data-test="upload-file-button"]').should("be.visible");
      cy.get('[data-test="delete-image-button"]').should("not.exist");
      cy.get('[data-test="undo-delete-button"]').should("not.exist");

      cy.get('[data-test="reset-file-upload-button"]').should("be.visible");
    });

    // Check locale setting and change it
    cy.intercept("GET", "api/v1/locale/de", {
      data: {},
      meta: {
        dateTimeFormat: {
          dateShort: {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          },
          dateLong: {
            year: "numeric",
            month: "short",
            day: "2-digit",
          },
          time: {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
          datetimeShort: {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
          datetimeLong: {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
        },
      },
    });

    cy.get('[data-test="locale-dropdown-items"]').should("not.exist");
    cy.get('[data-test="locale-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.user_locale")
      .within(() => {
        cy.get('[data-test="locale-dropdown"]')
          .should("have.text", "English")
          .click();
      });

    cy.get('[data-test="locale-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="locale-dropdown-option"]').should("have.length", 3);

        cy.get('[data-test="locale-dropdown-option"]')
          .eq(0)
          .should("have.text", "Deutsch");
        cy.get('[data-test="locale-dropdown-option"]')
          .eq(1)
          .should("have.text", "English");
        cy.get('[data-test="locale-dropdown-option"]')
          .eq(1)
          .should("have.attr", "aria-selected", "true");
        cy.get('[data-test="locale-dropdown-option"]')
          .eq(2)
          .should("have.text", "Français");

        cy.get('[data-test="locale-dropdown-option"]').eq(0).click();
      });

    cy.get('[data-test="locale-dropdown-items"]').should("not.exist");
    cy.get('[data-test="locale-dropdown"]').should("have.text", "Deutsch");

    // Check timezone setting and change it
    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="timezone-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.timezone")
      .within(() => {
        cy.get('[data-test="timezone-dropdown"]')
          .should("have.text", "UTC")
          .click();
      });

    cy.get('[data-test="timezone-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="timezone-dropdown-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(0)
          .should("have.text", "America/New_York");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(1)
          .should("have.text", "Australia/Sydney");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(2)
          .should("have.text", "Europe/Berlin");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(3)
          .should("have.text", "UTC");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(3)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="timezone-dropdown-option"]').eq(2).click();
      });

    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );

    // Save changes
    cy.fixture("userDataCurrentUser.json").then((user) => {
      user.data.firstname = "Laura";
      user.data.lastname = "Rivera";
      user.data.user_locale = "de";
      user.data.timezone = "Europe/Berlin";
      user.data.image = Cypress.config("baseUrl") + "/test.jpg";
      user.data.updated_at = "2024-09-13T14:22:26.000000Z";

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/users/1",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

      cy.fixture("currentUser.json").then((currentUser) => {
        currentUser.data.firstname = "Laura";
        currentUser.data.lastname = "Rivera";
        currentUser.data.user_locale = "de";
        currentUser.data.permissions = ["users.updateOwnAttributes"];

        cy.intercept("GET", "api/v1/currentUser", {
          statusCode: 200,
          body: currentUser,
        }).as("currentUserRequest");
      });

      cy.get('[data-test="user-tab-profile-save-button"]')
        .should("be.visible")
        .and("have.text", "app.save")
        .click();

      // Check loading
      cy.get("#firstname").should("be.disabled");
      cy.get("#lastname").should("be.disabled");
      cy.get("#authenticator").should("be.disabled");

      cy.get('[data-test="upload-file-button"]').should("be.disabled");
      cy.get('[data-test="reset-file-upload-button"]').should("be.disabled");

      cy.get('[data-test="locale-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get('[data-test="timezone-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get('[data-test="user-tab-profile-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("user_locale")).to.eql("de");
      expect(formData.get("timezone")).to.eql("Europe/Berlin");
      expect(formData.get("firstname")).to.eql("Laura");
      expect(formData.get("lastname")).to.eql("Rivera");
      expect(formData.get("_method")).to.eql("PUT");
      expect(formData.get("updated_at")).to.eql("2024-09-13T14:20:26.000000Z");

      const uploadedFile = formData.get("image");
      expect(uploadedFile.name).to.eql("image.png");
      expect(uploadedFile.type).to.eql("image/jpeg");
      cy.fixture("files/profileImagePreview.jpg", "base64").then((content) => {
        uploadedFile.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });
    });

    cy.wait("@currentUserRequest");

    // Check if changes are saved and shown in the view
    cy.get("#firstname").should("have.value", "Laura").and("not.be.disabled");
    cy.get("#lastname").should("have.value", "Rivera").and("not.be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.local")
      .and("be.disabled");

    cy.get('[data-test="upload-file-button"]').should("be.visible");
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("be.visible");
    cy.get('[data-test="undo-delete-button"]').should("not.exist");

    cy.get('[data-test="default-profile-image-preview"]').should("not.exist");
    cy.get('[data-test="profile-image-preview"]')
      .should("be.visible")
      .find("img")
      .should("have.attr", "src", Cypress.config("baseUrl") + "/test.jpg");

    cy.get('[data-test="locale-dropdown"]').should("have.text", "Deutsch");
    cy.get('[data-test="locale-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );
    cy.get('[data-test="timezone-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    // Delete profile image
    cy.get('[data-test="delete-image-button"]')
      .should("have.text", "admin.users.image.delete")
      .click();

    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "LR");

    // Check visibility of other buttons
    cy.get('[data-test="upload-file-button"]').should("not.exist");
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("not.exist");

    // Undo delete
    cy.get('[data-test="undo-delete-button"]')
      .should("have.text", "app.undo_delete")
      .click();

    cy.get('[data-test="default-profile-image-preview"]').should("not.exist");
    cy.get('[data-test="profile-image-preview"]')
      .should("be.visible")
      .find("img")
      .should("have.attr", "src", Cypress.config("baseUrl") + "/test.jpg");

    // Delete again and save changes
    cy.get('[data-test="delete-image-button"]').click();

    cy.fixture("userDataCurrentUser.json").then((user) => {
      user.data.firstname = "Laura";
      user.data.lastname = "Rivera";
      user.data.user_locale = "de";
      user.data.timezone = "Europe/Berlin";
      user.data.updated_at = "2024-09-13T14:24:26.000000Z";

      cy.intercept("POST", "api/v1/users/1", {
        statusCode: 200,
        body: user,
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="user-tab-profile-save-button"]').click();

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("user_locale")).to.eql("de");
      expect(formData.get("timezone")).to.eql("Europe/Berlin");
      expect(formData.get("firstname")).to.eql("Laura");
      expect(formData.get("lastname")).to.eql("Rivera");
      expect(formData.get("_method")).to.eql("PUT");
      expect(formData.get("updated_at")).to.eql("2024-09-13T14:22:26.000000Z");
      expect(formData.get("image")).to.eql("");
    });

    cy.wait("@currentUserRequest");

    cy.get('[data-test="delete-image-button"]').should("not.exist");

    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "LR");
  });

  it("save changes errors", function () {
    cy.visit("/profile");

    cy.wait("@userRequest");

    // Check with 422 error
    cy.intercept("POST", "api/v1/users/1", {
      statusCode: 422,
      body: {
        errors: {
          firstname: ["The firstname field is required."],
          lastname: ["The lastname field is required."],
          user_locale: ["The user locale field is required."],
          timezone: ["The timezone field is required."],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-profile-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that error messages are shown
    cy.get('[data-test="firstname-field"]').should(
      "include.text",
      "The firstname field is required.",
    );

    cy.get('[data-test="lastname-field"]').should(
      "include.text",
      "The lastname field is required.",
    );

    cy.get('[data-test="locale-field"]').should(
      "include.text",
      "The user locale field is required.",
    );

    cy.get('[data-test="timezone-field"]').should(
      "include.text",
      "The timezone field is required.",
    );

    // Check with 500 error
    cy.intercept("POST", "api/v1/users/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-profile-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that 422 error messages are hidden
    cy.get('[data-test="firstname-field"]').should(
      "not.include.text",
      "The firstname field is required.",
    );

    cy.get('[data-test="lastname-field"]').should(
      "not.include.text",
      "The lastname field is required.",
    );

    cy.get('[data-test="locale-field"]').should(
      "not.include.text",
      "The user locale field is required.",
    );

    cy.get('[data-test="timezone-field"]').should(
      "not.include.text",
      "The timezone field is required.",
    );

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 428 error (stale error)
    cy.fixture("userDataCurrentUser.json").then((user) => {
      const newModel = user.data;
      newModel.firstname = "Laura";
      newModel.lastname = "Rivera";
      newModel.user_locale = "de";
      newModel.timezone = "Europe/Berlin";

      cy.intercept("POST", "api/v1/users/1", {
        statusCode: 428,
        body: {
          message: " The user entity was updated in the meanwhile!",
          new_model: newModel,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-user-dialog"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-user-dialog"]')
      .should("be.visible")
      .and("include.text", "The user entity was updated in the meanwhile!");

    cy.get('[data-test="stale-dialog-reload-button"]').click();

    // Check that changes are shown in the view
    cy.get("#firstname").should("have.value", "Laura").and("not.be.disabled");
    cy.get("#lastname").should("have.value", "Rivera").and("not.be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.local")
      .and("be.disabled");

    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "LR");

    cy.get('[data-test="locale-dropdown"]').should("have.text", "Deutsch");

    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );

    // Check with 401 error
    cy.intercept("POST", "api/v1/users/1", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="user-tab-profile-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/profile");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("view without users.updateOwnAttributes permission", function () {
    cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get("#firstname").should("have.value", "John").and("be.disabled");
    cy.get("#lastname").should("have.value", "Doe").and("be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.local")
      .and("be.disabled");

    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "JD");

    // Check image buttons
    cy.get('[data-test="upload-file-button"]').should("be.visible");
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("not.exist");
    cy.get('[data-test="undo-delete-button"]').should("not.exist");

    cy.get('[data-test="locale-dropdown"]').should("have.text", "English");
    cy.get('[data-test="timezone-dropdown"]').should("have.text", "UTC");
    cy.get('[data-test="locale-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });
    cy.get('[data-test="timezone-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });
  });

  it("view as external user", function () {
    cy.fixture("userDataCurrentUser.json").then((user) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "jdo";

      cy.intercept("GET", "api/v1/users/1", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.visit("/profile");

    cy.wait("@userRequest");

    cy.get("#firstname").should("have.value", "John").and("be.disabled");
    cy.get("#lastname").should("have.value", "Doe").and("be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.ldap")
      .and("be.disabled");

    cy.get('[data-test="authenticator-id-field"]')
      .should("include.text", "auth.authenticator_id")
      .within(() => {
        cy.get("#authenticator_id")
          .should("have.value", "jdo")
          .and("be.disabled");
      });

    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "JD");

    // Check image buttons
    cy.get('[data-test="upload-file-button"]').should("be.visible");
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("not.exist");
    cy.get('[data-test="undo-delete-button"]').should("not.exist");

    cy.get('[data-test="locale-dropdown"]').should("have.text", "English");
    cy.get('[data-test="timezone-dropdown"]').should("have.text", "UTC");
    cy.get('[data-test="locale-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });
    cy.get('[data-test="timezone-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });
  });

  it("load timezones error", function () {
    const timezonesRequest = interceptIndefinitely(
      "GET",
      "api/v1/getTimezones",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "timezonesRequest",
    );

    cy.visit("/profile");

    cy.wait("@userRequest");

    // Check loading
    cy.get('[data-test="user-tab-profile-save-button"]').should("be.disabled");

    cy.get('[data-test="timezone-dropdown"]')
      .should("be.visible")
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true")
      .then(() => {
        timezonesRequest.sendResponse();
      });

    cy.wait("@timezonesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "admin.users.timezone")
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true");

    // Reload timezones without error
    cy.intercept("GET", "api/v1/getTimezones", {
      fixture: "timezones.json",
    }).as("timezonesRequest");

    cy.get('[data-test="timezone-reload-button"]').click();

    cy.wait("@timezonesRequest");

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .find(".p-select-label")
      .should("not.have.attr", "aria-disabled", "true");

    cy.get('[data-test="timezone-dropdown"]').click();

    cy.get('[data-test="timezone-dropdown-option"]').should("have.length", 4);
    cy.get('[data-test="timezone-dropdown-option"]')
      .eq(0)
      .should("have.text", "America/New_York");
    cy.get('[data-test="timezone-dropdown-option"]')
      .eq(1)
      .should("have.text", "Australia/Sydney");
    cy.get('[data-test="timezone-dropdown-option"]')
      .eq(2)
      .should("have.text", "Europe/Berlin");
    cy.get('[data-test="timezone-dropdown-option"]')
      .eq(3)
      .should("have.text", "UTC");
    cy.get('[data-test="timezone-dropdown-option"]')
      .eq(3)
      .should("have.attr", "aria-selected", "true");

    // Check with 401 error
    cy.intercept("GET", "api/v1/getTimezones", {
      statusCode: 401,
    }).as("timezonesRequest");

    cy.reload();

    cy.wait("@userRequest");

    cy.wait("@timezonesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/profile");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
