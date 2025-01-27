import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin roles index role actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRolesIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
        "roles.create",
        "roles.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("delete role", function () {
    cy.visit("/admin/roles");

    cy.wait("@rolesRequest");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");

    cy.get('[data-test="role-item"]')
      .eq(2)
      .find('[data-test="roles-delete-button"]')
      .click();

    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="roles-delete-dialog"]')
      .should("include.text", "admin.roles.delete.title")
      .should("include.text", 'admin.roles.delete.confirm_{"name":"Students"}');

    // Confirm deletion of role
    const deleteRoleRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/roles/3",
      {
        statusCode: 204,
      },
      "deleteRoleRequest",
    );

    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.filter((role) => role.id !== 3);
      roles.meta.to = 2;
      roles.meta.total = 2;
      roles.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/roles*", {
        statusCode: 200,
        body: roles,
      }).as("rolesRequest");
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
        deleteRoleRequest.sendResponse();
      });

    cy.wait("@deleteRoleRequest");
    cy.wait("@rolesRequest");

    // Check that role was deleted
    cy.get('[data-test="role-item"]').should("have.length", 2);

    // Check that dialog was closed
    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");

    // Reopen dialog for different user
    cy.get('[data-test="role-item"]')
      .eq(1)
      .find('[data-test="roles-delete-button"]')
      .click();

    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="roles-delete-dialog"]')
      .should("include.text", "admin.roles.delete.title")
      .should("include.text", 'admin.roles.delete.confirm_{"name":"Staff"}');

    // Cancel deletion of role
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .click();
    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");
  });

  it("delete role errors", function () {
    cy.visit("/admin/roles");

    cy.wait("@rolesRequest");

    cy.get('[data-test="role-item"]').should("have.length", 3);

    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");

    cy.get('[data-test="role-item"]')
      .eq(2)
      .find('[data-test="roles-delete-button"]')
      .click();

    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/roles/3", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteRoleRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoleRequest");

    // Check that dialog is still open and that error message is shown
    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 464 error
    cy.intercept("DELETE", "api/v1/roles/3", {
      statusCode: 464,
      body: {
        message:
          "The role is linked to users and therefore it can't be deleted!",
      },
    }).as("deleteRoleRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoleRequest");

    // Check that dialog is still open and that error message is shown
    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"The role is linked to users and therefore it can\'t be deleted!"}',
      'app.flash.server_error.error_code_{"statusCode":464}',
    ]);

    // Check with 401 error
    cy.intercept("DELETE", "api/v1/roles/3", {
      statusCode: 401,
    }).as("deleteRoleRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoleRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("open add new role page", function () {
    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.interceptAdminRolesNewRequests();

    cy.get('[data-test="roles-add-button"]').click();
    cy.url().should("include", "/admin/roles/new");
  });

  it("open edit role page", function () {
    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.interceptAdminRolesViewRequests();

    cy.get('[data-test="role-item"]')
      .eq(1)
      .find('[data-test="roles-edit-button"]')
      .click();
    cy.url().should("include", "/admin/roles/2/edit");
  });

  it("open view role page", function () {
    cy.visit("/admin/roles");
    cy.wait("@rolesRequest");

    cy.interceptAdminRolesViewRequests();

    cy.get('[data-test="role-item"]')
      .eq(1)
      .find('[data-test="roles-view-button"]')
      .click();
    cy.url().should("include", "/admin/roles/2");
  });
});
