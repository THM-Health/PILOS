import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users view user actions", function () {
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
        "users.delete",
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

  it("delete user", function () {
    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-delete-dialog"]').should("not.exist");

    cy.get('[data-test="users-delete-button"]').click();

    cy.get('[data-test="users-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="users-delete-dialog"]')
      .should("include.text", "admin.users.delete.title")
      .should(
        "include.text",
        'admin.users.delete.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );

    // Confirm delete of user
    const deleteUserRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/users/2",
      { statusCode: 204 },
      "deleteUserRequest",
    );

    cy.fixture("users.json").then((users) => {
      users.data = users.data.slice(0, 2);
      users.meta.to = 2;
      users.meta.total = 2;
      users.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/users*", {
        statusCode: 200,
        body: users,
      }).as("usersRequest");
    });

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();
    // Check loading
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .should("be.disabled");
    cy.get('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        deleteUserRequest.sendResponse();
      });

    cy.wait("@deleteUserRequest");
    cy.wait("@usersRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/users/2");
    cy.url().should("include", "/admin/users");

    // Check that user was deleted
    cy.get('[data-test="user-item"]').should("have.length", 2);

    // Check that dialog is closed
    cy.get('[data-test="users-delete-dialog"]').should("not.exist");
  });

  it("delete user errors", function () {
    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-delete-dialog"]').should("not.exist");

    cy.get('[data-test="users-delete-button"]').click();

    cy.get('[data-test="users-delete-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/users/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteUserRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteUserRequest");

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="users-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("DELETE", "api/v1/users/2", {
      statusCode: 401,
    }).as("deleteUserRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteUserRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("reset password", function () {
    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-reset-password-dialog"]').should("not.exist");

    cy.get('[data-test="users-reset-password-button"]').click();

    cy.get('[data-test="users-reset-password-dialog"]').should("be.visible");

    cy.get('[data-test="users-reset-password-dialog"]')
      .should("include.text", "admin.users.reset_password.title")
      .should(
        "include.text",
        'admin.users.reset_password.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );

    // Confirm reset if password
    const resetPasswordRequest = interceptIndefinitely(
      "POST",
      "api/v1/users/2/resetPassword",
      { statusCode: 204 },
      "resetPasswordRequest",
    );

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    // Check loading
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .should("be.disabled");
    cy.get('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        resetPasswordRequest.sendResponse();
      });

    cy.wait("@resetPasswordRequest");

    // Check that toast message is shown
    cy.checkToastMessage(
      'admin.users.password_reset_success_{"mail":"LauraWRivera@domain.tld"}',
    );

    // Check that dialog is closed
    cy.get('[data-test="users-reset-password-dialog"]').should("not.exist");
  });

  it("reset password errors", function () {
    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-reset-password-dialog"]').should("not.exist");

    cy.get('[data-test="users-reset-password-button"]').click();

    cy.get('[data-test="users-reset-password-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("POST", "api/v1/users/2/resetPassword", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("resetPasswordRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@resetPasswordRequest");

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="users-reset-password-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("POST", "api/v1/users/2/resetPassword", {
      statusCode: 401,
    }).as("resetPasswordRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@resetPasswordRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("switch between edit and view", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    // Check base tab
    // Change values of all fields
    cy.get("#firstname").should("have.value", "Laura").clear();
    cy.get("#firstname").type("Juan");
    cy.get("#lastname").should("have.value", "Rivera").clear();
    cy.get("#lastname").type("Walter");

    cy.get('[data-test="upload-file-input"]')
      .should("not.be.visible")
      .selectFile("tests/Frontend/fixtures/files/profileImage.jpg", {
        force: true,
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

    cy.get('[data-test="locale-dropdown"]')
      .should("have.text", "English")
      .click();

    cy.get('[data-test="locale-dropdown-option"]').eq(0).click();

    cy.get('[data-test="locale-dropdown-items"]').should("not.exist");
    cy.get('[data-test="locale-dropdown"]').should("have.text", "Deutsch");

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .click();

    cy.get('[data-test="timezone-dropdown-option"]').eq(2).click();

    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );

    // Check that save button is shown
    cy.get('[data-test="user-tab-profile-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="users-cancel-edit-button"]').click();

    // Check if redirected to view page
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");

    // Check that changes were not saved
    cy.get("#firstname").should("have.value", "Laura").and("be.disabled");
    cy.get("#lastname").should("have.value", "Rivera").and("be.disabled");
    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "LR");
    cy.get('[data-test="locale-dropdown"]')
      .should("have.text", "English")
      .within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });
    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

    // Check that save button is hidden
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    // Switch to edit again
    cy.get('[data-test="users-edit-button"]').click();

    cy.url().should("include", "/admin/users/2/edit");

    cy.wait("@userRequest");

    // Check that original values are shown
    cy.get("#firstname")
      .should("have.value", "Laura")
      .should("not.be.disabled");
    cy.get("#lastname")
      .should("have.value", "Rivera")
      .should("not.be.disabled");
    cy.get('[data-test="profile-image-preview"]').should("not.exist");
    cy.get('[data-test="default-profile-image-preview"]')
      .should("be.visible")
      .and("include.text", "LR");
    cy.get('[data-test="locale-dropdown"]')
      .should("have.text", "English")
      .within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });
    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

    // Check that save button is shown
    cy.get('[data-test="user-tab-profile-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check email tab
    cy.get('[data-test="email-tab-button"]').click();

    // Change value of email field
    cy.get("#email").should("have.value", "LauraWRivera@domain.tld").type("e");

    // Check that save button is shown
    cy.get('[data-test="user-tab-email-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="users-cancel-edit-button"]').click();

    // Check if redirected to view page
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");

    // Switch to email tab and check that changes are not saved
    cy.get('[data-test="email-tab-button"]').click();

    cy.get("#email")
      .should("have.value", "LauraWRivera@domain.tld")
      .should("be.disabled");

    // Check that save button is hidden
    cy.get('[data-test="user-tab-email-save-button"]').should("not.exist");

    // Switch back to edit
    cy.get('[data-test="users-edit-button"]').click();

    // Check if redirected to edit page
    cy.url().should("include", "/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="email-tab-button"]').click();

    // Check that original values are shown
    cy.get("#email")
      .should("have.value", "LauraWRivera@domain.tld")
      .should("not.be.disabled");

    // Check that save button is shown
    cy.get('[data-test="user-tab-email-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check security tab
    cy.get('[data-test="security-tab-button"]').click();

    // Change value of role field
    cy.get('[data-test="role-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="role-chip"]').should("have.length", 2);
        cy.get('[data-test="role-chip"]')
          .eq(0)
          .should("include.text", "Students")
          .find('[data-test="remove-role-button"]')
          .should("not.exist");
        cy.get('[data-test="role-chip"]')
          .eq(1)
          .should("include.text", "Staff")
          .find('[data-test="remove-role-button"]')
          .should("be.visible");
      });

    cy.get('[data-test="role-dropdown"]').click();
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(0).click();

    // Check that roles are shown correctly
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 3);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("include.text", "Students")
        .find('[data-test="remove-role-button"]')
        .should("not.exist");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .should("include.text", "Staff")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
      cy.get('[data-test="role-chip"]')
        .eq(2)
        .should("include.text", "Superuser")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
    });

    // Close dropdown
    cy.get(".multiselect__select").click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Change value of password field
    cy.get("#new_password").type("secretPassword123#");
    cy.get("#new_password_confirmation").type("secretPassword123#");

    // Check that save buttons are shown
    cy.get('[data-test="users-roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="change-password-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="users-cancel-edit-button"]').click();

    // Check if redirected to view page and check that changes are not saved
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="role-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="role-chip"]').should("have.length", 2);
        cy.get('[data-test="role-chip"]')
          .eq(0)
          .should("include.text", "Students")
          .find('[data-test="remove-role-button"]')
          .should("not.exist");
        cy.get('[data-test="role-chip"]')
          .eq(1)
          .should("include.text", "Staff")
          .find('[data-test="remove-role-button"]')
          .should("not.exist");
      });

    // Check that password fields are hidden
    cy.get('[data-test="new-password-field"]').should("not.exist");

    cy.get('[data-test="new-password-confirmation-field"]').should("not.exist");

    // Check that save buttons are hidden
    cy.get('[data-test="users-roles-save-button"]').should("not.exist");
    cy.get('[data-test="change-password-save-button"]').should("not.exist");

    // Switch back to edit page
    cy.get('[data-test="users-edit-button"]').click();

    cy.url().should("include", "/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check that original values are shown
    cy.get('[data-test="role-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="role-chip"]').should("have.length", 2);
        cy.get('[data-test="role-chip"]')
          .eq(0)
          .should("include.text", "Students")
          .find('[data-test="remove-role-button"]')
          .should("not.exist");
        cy.get('[data-test="role-chip"]')
          .eq(1)
          .should("include.text", "Staff")
          .find('[data-test="remove-role-button"]')
          .should("be.visible");
      });

    cy.get("#new_password").should("have.value", "");
    cy.get("#new_password_confirmation").should("have.value", "");

    // Check that save buttons are shown
    cy.get('[data-test="users-roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="change-password-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check other tab
    cy.get('[data-test="others-tab-button"]').click();

    // Change value of bbb_skip_check_audio
    cy.get("#bbb_skip_check_audio").click();

    // Check that save button is shown
    cy.get('[data-test="user-tab-others-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="users-cancel-edit-button"]').click();

    // Check if redirected to view page
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");

    // Switch to others tab and check if changes are not saved
    cy.get('[data-test="others-tab-button"]').click();

    cy.get("#bbb_skip_check_audio")
      .should("not.be.checked")
      .should("be.disabled");

    // Check that save button is hidden
    cy.get('[data-test="user-tab-others-save-button"]').should("not.exist");

    // Switch back to edit page
    cy.get('[data-test="users-edit-button"]').click();

    // Check if redirected to edit page
    cy.url().should("include", "/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="others-tab-button"]').click();

    // Check that original value is shown
    cy.get("#bbb_skip_check_audio")
      .should("not.be.checked")
      .should("not.be.disabled");

    // Check that save button is shown
    cy.get('[data-test="user-tab-others-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });
});
