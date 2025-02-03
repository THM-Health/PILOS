import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin roles view role actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRolesViewRequests();

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
    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");

    cy.get('[data-test="roles-delete-button"]').click();

    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="roles-delete-dialog"]')
      .should("include.text", "admin.roles.delete.title")
      .should("include.text", 'admin.roles.delete.confirm_{"name":"Staff"}');

    // Confirm deletion of role
    const deleteRoleRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/roles/2",
      {
        statusCode: 204,
      },
      "deleteRoleRequest",
    );

    cy.fixture("roles.json").then((roles) => {
      roles.data = roles.data.filter((role) => role.id !== 2);
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

    // Check that redirect worked
    cy.url().should("not.include", "/admin/roles/2");
    cy.url().should("include", "/admin/roles");

    // Check that role was deleted
    cy.get('[data-test="role-item"]').should("have.length", 2);

    // Check that dialog was closed
    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");
  });

  it("delete role errors", function () {
    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-delete-dialog"]').should("not.exist");

    cy.get('[data-test="roles-delete-button"]').click();

    cy.get('[data-test="roles-delete-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/roles/2", {
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
    cy.intercept("DELETE", "api/v1/roles/2", {
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
    cy.intercept("DELETE", "api/v1/roles/2", {
      statusCode: 401,
    }).as("deleteRoleRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteRoleRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("switch between edit and view", function () {
    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check values and change them
    cy.get("#name").should("have.value", "Staff").clear();
    cy.get("#name").type("Staff 2");

    cy.get("#default").should("be.checked");
    cy.get("#unlimited").should("not.be.checked");
    cy.get("#room-limit").should("not.exist");
    cy.get("#custom").should("not.be.checked").click();
    cy.get("#room-limit").should("exist").should("have.value", "0").type("10");

    // Permission list
    cy.checkPermissionGroup(0, "rooms.create", true, true, false);
    cy.get("#rooms\\.create").click();
    cy.checkPermissionGroup(1, "rooms.viewAll", true, true, false);
    cy.get("#rooms\\.view_all").click();
    cy.checkPermissionGroup(2, "rooms.manage", false, false, false);
    cy.get("#rooms\\.manage").click();

    cy.checkPermissionGroup(3, "meetings.viewAny", true, true, false);
    cy.get("#meetings\\.view_any").click();
    cy.checkPermissionGroup(4, "admin.view", false, true, false);
    cy.get("#admin\\.view").click();

    cy.checkPermissionGroup(5, "settings.viewAny", false, false, false);
    cy.get("#settings\\.view_any").click();
    cy.checkPermissionGroup(6, "settings.update", false, false, false);
    cy.get("#settings\\.update").click();
    cy.checkPermissionGroup(7, "system.monitor", false, false, false);
    cy.get("#system\\.monitor").click();

    cy.checkPermissionGroup(8, "users.viewAny", true, true, false);
    cy.get("#users\\.view_any").click();
    cy.checkPermissionGroup(9, "users.view", false, false, false);
    cy.get("#users\\.view").click();
    cy.checkPermissionGroup(10, "users.update", false, false, false);
    cy.get("#users\\.update").click();
    cy.checkPermissionGroup(11, "users.create", false, false, false);
    cy.get("#users\\.create").click();
    cy.checkPermissionGroup(12, "users.delete", false, false, false);
    cy.get("#users\\.delete").click();
    cy.checkPermissionGroup(
      13,
      "users.updateOwnAttributes",
      false,
      true,
      false,
    );
    cy.get("#users\\.update_own_attributes").click();

    cy.checkPermissionGroup(14, "roles.viewAny", false, true, false);
    cy.get("#roles\\.view_any").click();
    cy.checkPermissionGroup(15, "roles.view", false, false, false);
    cy.get("#roles\\.view").click();
    cy.checkPermissionGroup(16, "roles.update", false, false, false);
    cy.get("#roles\\.update").click();
    cy.checkPermissionGroup(17, "roles.create", false, false, false);
    cy.get("#roles\\.create").click();
    cy.checkPermissionGroup(18, "roles.delete", false, false, false);
    cy.get("#roles\\.delete").click();

    cy.checkPermissionGroup(19, "roomTypes.view", false, true, false);
    cy.get("#room_types\\.view").click();
    cy.checkPermissionGroup(20, "roomTypes.update", true, true, false);
    cy.get("#room_types\\.update").click();
    cy.checkPermissionGroup(21, "roomTypes.create", true, true, false);
    cy.get("#room_types\\.create").click();
    cy.checkPermissionGroup(22, "roomTypes.delete", true, true, false);
    cy.get("#room_types\\.delete").click();

    cy.checkPermissionGroup(23, "servers.viewAny", false, false, false);
    cy.get("#servers\\.view_any").click();
    cy.checkPermissionGroup(24, "servers.view", false, false, false);
    cy.get("#servers\\.view").click();
    cy.checkPermissionGroup(25, "servers.update", false, false, false);
    cy.get("#servers\\.update").click();
    cy.checkPermissionGroup(26, "servers.create", false, false, false);
    cy.get("#servers\\.create").click();
    cy.checkPermissionGroup(27, "servers.delete", false, false, false);
    cy.get("#servers\\.delete").click();

    cy.checkPermissionGroup(28, "serverPools.viewAny", false, false, false);
    cy.get("#server_pools\\.view_any").click();
    cy.checkPermissionGroup(29, "serverPools.view", false, false, false);
    cy.get("#server_pools\\.view").click();
    cy.checkPermissionGroup(30, "serverPools.update", false, false, false);
    cy.get("#server_pools\\.update").click();
    cy.checkPermissionGroup(31, "serverPools.create", false, false, false);
    cy.get("#server_pools\\.create").click();
    cy.checkPermissionGroup(32, "serverPools.delete", false, false, false);
    cy.get("#server_pools\\.delete").click();

    // Check that save button is shown
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="roles-cancel-edit-button"]').click();

    // Check if redirect worked
    cy.url().should("include", "/admin/roles/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@roleRequest");

    // Check that changes were not saved
    cy.get("#name").should("have.value", "Staff").and("be.disabled");

    cy.get("#default").should("be.checked").and("be.disabled");
    cy.get("#unlimited").should("not.be.checked").and("be.disabled");
    cy.get("#room-limit").should("not.exist");
    cy.get("#custom").should("not.be.checked").and("be.disabled");

    // Permission list
    cy.checkPermissionGroup(0, "rooms.create", true, true, true);
    cy.checkPermissionGroup(1, "rooms.viewAll", true, true, true);
    cy.checkPermissionGroup(2, "rooms.manage", false, false, true);

    cy.checkPermissionGroup(3, "meetings.viewAny", true, true, true);
    cy.checkPermissionGroup(4, "admin.view", false, true, true);

    cy.checkPermissionGroup(5, "settings.viewAny", false, false, true);
    cy.checkPermissionGroup(6, "settings.update", false, false, true);
    cy.checkPermissionGroup(7, "system.monitor", false, false, true);

    cy.checkPermissionGroup(8, "users.viewAny", true, true, true);
    cy.checkPermissionGroup(9, "users.view", false, false, true);
    cy.checkPermissionGroup(10, "users.update", false, false, true);
    cy.checkPermissionGroup(11, "users.create", false, false, true);
    cy.checkPermissionGroup(12, "users.delete", false, false, true);
    cy.checkPermissionGroup(
      13,
      "users.updateOwnAttributes",
      false,
      false,
      true,
    );

    cy.checkPermissionGroup(14, "roles.viewAny", false, true, true);
    cy.checkPermissionGroup(15, "roles.view", false, false, true);
    cy.checkPermissionGroup(16, "roles.update", false, false, true);
    cy.checkPermissionGroup(17, "roles.create", false, false, true);
    cy.checkPermissionGroup(18, "roles.delete", false, false, true);

    cy.checkPermissionGroup(19, "roomTypes.view", false, true, true);
    cy.checkPermissionGroup(20, "roomTypes.update", true, true, true);
    cy.checkPermissionGroup(21, "roomTypes.create", true, true, true);
    cy.checkPermissionGroup(22, "roomTypes.delete", true, true, true);

    cy.checkPermissionGroup(23, "servers.viewAny", false, false, true);
    cy.checkPermissionGroup(24, "servers.view", false, false, true);
    cy.checkPermissionGroup(25, "servers.update", false, false, true);
    cy.checkPermissionGroup(26, "servers.create", false, false, true);
    cy.checkPermissionGroup(27, "servers.delete", false, false, true);

    cy.checkPermissionGroup(28, "serverPools.viewAny", false, true, true);
    cy.checkPermissionGroup(29, "serverPools.view", false, false, true);
    cy.checkPermissionGroup(30, "serverPools.update", false, false, true);
    cy.checkPermissionGroup(31, "serverPools.create", false, false, true);
    cy.checkPermissionGroup(32, "serverPools.delete", false, false, true);

    // Check that save button is not visible
    cy.get('[data-test="roles-save-button"]').should("not.exist");

    // Switch back to edit page
    cy.get('[data-test="roles-edit-button"]').click();

    // Check if redirect worked
    cy.url().should("include", "/admin/roles/2/edit");

    cy.wait("@roleRequest");

    // Check that original values are shown
    cy.get("#name").should("have.value", "Staff");

    cy.get("#default").should("be.checked");
    cy.get("#unlimited").should("not.be.checked");
    cy.get("#room-limit").should("not.exist");
    cy.get("#custom").should("not.be.checked");

    // Permission list
    cy.checkPermissionGroup(0, "rooms.create", true, true, false);
    cy.checkPermissionGroup(1, "rooms.viewAll", true, true, false);
    cy.checkPermissionGroup(2, "rooms.manage", false, false, false);

    cy.checkPermissionGroup(3, "meetings.viewAny", true, true, false);
    cy.checkPermissionGroup(4, "admin.view", false, true, false);

    cy.checkPermissionGroup(5, "settings.viewAny", false, false, false);
    cy.checkPermissionGroup(6, "settings.update", false, false, false);
    cy.checkPermissionGroup(7, "system.monitor", false, false, false);

    cy.checkPermissionGroup(8, "users.viewAny", true, true, false);
    cy.checkPermissionGroup(9, "users.view", false, false, false);
    cy.checkPermissionGroup(10, "users.update", false, false, false);
    cy.checkPermissionGroup(11, "users.create", false, false, false);
    cy.checkPermissionGroup(12, "users.delete", false, false, false);
    cy.checkPermissionGroup(
      13,
      "users.updateOwnAttributes",
      false,
      false,
      false,
    );

    cy.checkPermissionGroup(14, "roles.viewAny", false, true, false);
    cy.checkPermissionGroup(15, "roles.view", false, false, false);
    cy.checkPermissionGroup(16, "roles.update", false, false, false);
    cy.checkPermissionGroup(17, "roles.create", false, false, false);
    cy.checkPermissionGroup(18, "roles.delete", false, false, false);

    cy.checkPermissionGroup(19, "roomTypes.view", false, true, false);
    cy.checkPermissionGroup(20, "roomTypes.update", true, true, false);
    cy.checkPermissionGroup(21, "roomTypes.create", true, true, false);
    cy.checkPermissionGroup(22, "roomTypes.delete", true, true, false);

    cy.checkPermissionGroup(23, "servers.viewAny", false, false, false);
    cy.checkPermissionGroup(24, "servers.view", false, false, false);
    cy.checkPermissionGroup(25, "servers.update", false, false, false);
    cy.checkPermissionGroup(26, "servers.create", false, false, false);
    cy.checkPermissionGroup(27, "servers.delete", false, false, false);

    cy.checkPermissionGroup(28, "serverPools.viewAny", false, true, false);
    cy.checkPermissionGroup(29, "serverPools.view", false, false, false);
    cy.checkPermissionGroup(30, "serverPools.update", false, false, false);
    cy.checkPermissionGroup(31, "serverPools.create", false, false, false);
    cy.checkPermissionGroup(32, "serverPools.delete", false, false, false);

    // Check that save button is shown
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });
});
