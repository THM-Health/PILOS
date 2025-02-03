import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users index user actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersIndexRequests();

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
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.get('[data-test="user-item"]').should("have.length", 4);

    cy.get('[data-test="users-delete-dialog"]').should("not.exist");

    cy.get('[data-test="user-item"]')
      .eq(2)
      .find('[data-test="users-delete-button"]')
      .click();

    cy.get('[data-test="users-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="users-delete-dialog"]')
      .should("include.text", "admin.users.delete.title")
      .should(
        "include.text",
        'admin.users.delete.confirm_{"firstname":"Juan","lastname":"Walter"}',
      );

    // Confirm delete of user
    const deleteUserRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/users/3",
      { statusCode: 204 },
      "deleteUserRequest",
    );

    cy.fixture("users.json").then((users) => {
      users.data = users.data.filter((user) => user.id !== 3);
      users.meta.to = 3;
      users.meta.total = 3;
      users.meta.total_no_filter = 3;

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

    // Check that user was deleted
    cy.get('[data-test="user-item"]').should("have.length", 3);

    // Check that dialog is closed
    cy.get('[data-test="users-delete-dialog"]').should("not.exist");

    // Reopen dialog for different user
    cy.get('[data-test="user-item"]')
      .eq(1)
      .find('[data-test="users-delete-button"]')
      .click();

    cy.get('[data-test="users-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="users-delete-dialog"]')
      .should("include.text", "admin.users.delete.title")
      .should(
        "include.text",
        'admin.users.delete.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );

    // Cancel delete
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="users-delete-dialog"]').should("not.exist");
  });

  it("delete user errors", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.get('[data-test="user-item"]').should("have.length", 4);

    cy.get('[data-test="users-delete-dialog"]').should("not.exist");

    cy.get('[data-test="user-item"]')
      .eq(2)
      .find('[data-test="users-delete-button"]')
      .click();

    cy.get('[data-test="users-delete-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/users/3", {
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
    cy.intercept("DELETE", "api/v1/users/3", {
      statusCode: 401,
    }).as("deleteUserRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteUserRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("reset password", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.get('[data-test="users-reset-password-dialog"]').should("not.exist");

    cy.get('[data-test="user-item"]')
      .eq(1)
      .find('[data-test="users-reset-password-button"]')
      .click();

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
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.get('[data-test="users-reset-password-dialog"]').should("not.exist");

    cy.get('[data-test="user-item"]')
      .eq(1)
      .find('[data-test="users-reset-password-button"]')
      .click();

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

  it("open add new user page", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.interceptAdminUsersNewRequests();

    cy.get('[data-test="users-add-button"]').click();

    cy.url().should("include", "/admin/users/new");
  });

  it("open edit user page", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.interceptAdminUsersViewRequests();

    cy.get('[data-test="user-item"]')
      .eq(1)
      .find('[data-test="users-edit-button"]')
      .click();

    cy.url().should("include", "/admin/users/2/edit");

    // Reload and open edit page for current user but without edit permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.intercept("GET", "api/v1/users/1", {
      fixture: "userDataCurrentUser.json",
    }).as("userRequest");

    cy.get('[data-test="user-item"]')
      .eq(0)
      .find('[data-test="users-edit-button"]')
      .click();

    cy.url().should("include", "/admin/users/1/edit");
  });

  it("open view user page", function () {
    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.interceptAdminUsersViewRequests();

    cy.intercept("GET", "api/v1/users/2", {
      fixture: "userDataUser.json",
    }).as("userRequest");

    cy.get('[data-test="user-item"]')
      .eq(1)
      .find('[data-test="users-view-button"]')
      .click();

    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    // Reload and open edit page for current user but without view permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users");

    cy.wait("@usersRequest");

    cy.intercept("GET", "api/v1/users/1", {
      fixture: "userDataCurrentUser.json",
    }).as("userRequest");

    cy.get('[data-test="user-item"]')
      .eq(0)
      .find('[data-test="users-view-button"]')
      .click();

    cy.url().should("include", "/admin/users/1");
    cy.url().should("not.include", "/edit");
  });
});
