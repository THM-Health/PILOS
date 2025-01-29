import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin roles edit", function () {
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
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/roles/2/edit");
  });

  it("visit with user without permission to edit roles", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles/2/edit");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/roles/2/edit");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("edit role", function () {
    const roleRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles/2",
      { fixture: "role.json" },
      "roleRequest",
    );

    cy.visit("/admin/roles/2/edit");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]').should("be.disabled");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        roleRequest.sendResponse();
      });

    cy.wait("@roleRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that correct buttons are shown
    cy.get('[data-test="roles-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/roles/2");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should("include.text", 'admin.breakcrumbs.roles.edit_{"name":"Staff"}');

    // Change role settings
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "Staff").clear();
        cy.get("#name").type("Standard role");
      });

    // Check that breadcrumbs stays the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should("include.text", 'admin.breakcrumbs.roles.edit_{"name":"Staff"}');

    cy.get('[data-test="roles-room-limit-help-dialog"]').should("not.exist");
    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get('[data-test="room-limit-mode-default-field"]')
          .should("be.visible")
          .should(
            "include.text",
            'admin.roles.room_limit.default_{"value":"app.unlimited"}',
          )
          .within(() => {
            cy.get("#default").should("be.checked").and("not.be.disabled");
          });

        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#unlimited")
              .should("not.be.checked")
              .and("not.be.disabled")
              .click();
          });

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#custom").should("not.be.checked").and("not.be.disabled");
          });
        cy.get("#room-limit").should("not.exist");

        // Open room limit help dialog
        cy.get('[data-test="roles-room-limit-help-button"]').click();
      });

    cy.checkRoomLimitHelpDialog();

    cy.get('[data-test="roles-room-limit-help-dialog"]').should("not.exist");

    // Change permissions
    cy.contains("admin.roles.permissions_title").should("be.visible");

    cy.get('[data-test="permission-list"]')
      .should("be.visible")
      .and("include.text", "admin.roles.permission_name")
      .and("include.text", "admin.roles.permission_explicit")
      .and("include.text", "admin.roles.permission_included")
      .within(() => {
        cy.get('[data-test="permission-category"]').should("have.length", 10);

        cy.get('[data-test="permission-category"]')
          .eq(0)
          .should("include.text", "admin.roles.permissions.rooms.title")
          .within(() => {
            cy.checkPermissionGroup(0, "rooms.create", true, true, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", true, true, false);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, false);

            cy.get("#rooms\\.manage").click();
            cy.get("#rooms\\.create").click();
            cy.get("#rooms\\.view_all").click();

            cy.checkPermissionGroup(0, "rooms.create", false, true, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, true, false);
            cy.checkPermissionGroup(2, "rooms.manage", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", true, true, false);

            cy.get("#meetings\\.view_any").click();

            cy.checkPermissionGroup(0, "meetings.viewAny", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, true, false);

            cy.get("#admin\\.view").click();

            cy.checkPermissionGroup(0, "admin.view", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(3)
          .should("include.text", "admin.roles.permissions.settings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 2);

            cy.checkPermissionGroup(0, "settings.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "settings.update", false, false, false);

            cy.get("#settings\\.update").click();

            cy.checkPermissionGroup(0, "settings.viewAny", false, true, false);
            cy.checkPermissionGroup(1, "settings.update", true, true, false);

            cy.get("#settings\\.view_any").click();

            cy.checkPermissionGroup(0, "settings.viewAny", true, true, false);
            cy.checkPermissionGroup(1, "settings.update", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(4)
          .should("include.text", "admin.roles.permissions.system.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "system.monitor", false, false, false);

            cy.get("#system\\.monitor").click();

            cy.checkPermissionGroup(0, "system.monitor", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(5)
          .should("include.text", "admin.roles.permissions.users.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 6);

            cy.checkPermissionGroup(0, "users.viewAny", true, true, false);
            cy.checkPermissionGroup(1, "users.view", false, false, false);
            cy.checkPermissionGroup(2, "users.update", false, false, false);
            cy.checkPermissionGroup(3, "users.create", false, false, false);
            cy.checkPermissionGroup(4, "users.delete", false, false, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              false,
              false,
              false,
            );

            cy.get("#users\\.update_own_attributes").click();
            cy.get("#users\\.delete").click();
            cy.get("#users\\.create").click();
            cy.get("#users\\.update").click();
            cy.get("#users\\.view").click();
            cy.get("#users\\.view_any").click();

            cy.checkPermissionGroup(0, "users.viewAny", false, true, false);
            cy.checkPermissionGroup(1, "users.view", true, true, false);
            cy.checkPermissionGroup(2, "users.update", true, true, false);
            cy.checkPermissionGroup(3, "users.create", true, true, false);
            cy.checkPermissionGroup(4, "users.delete", true, true, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              true,
              true,
              false,
            );
          });

        cy.get('[data-test="permission-category"]')
          .eq(6)
          .should("include.text", "admin.roles.permissions.roles.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "roles.viewAny", false, true, false);
            cy.checkPermissionGroup(1, "roles.view", false, false, false);
            cy.checkPermissionGroup(2, "roles.update", false, false, false);
            cy.checkPermissionGroup(3, "roles.create", false, false, false);
            cy.checkPermissionGroup(4, "roles.delete", false, false, false);

            cy.get("#roles\\.delete").click();
            cy.get("#roles\\.create").click();
            cy.get("#roles\\.update").click();
            cy.get("#roles\\.view").click();
            cy.get("#roles\\.view_any").click();

            cy.checkPermissionGroup(0, "roles.viewAny", true, true, false);
            cy.checkPermissionGroup(1, "roles.view", true, true, false);
            cy.checkPermissionGroup(2, "roles.update", true, true, false);
            cy.checkPermissionGroup(3, "roles.create", true, true, false);
            cy.checkPermissionGroup(4, "roles.delete", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(7)
          .should("include.text", "admin.roles.permissions.room_types.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 4);

            cy.checkPermissionGroup(0, "roomTypes.view", false, true, false);
            cy.checkPermissionGroup(1, "roomTypes.update", true, true, false);
            cy.checkPermissionGroup(2, "roomTypes.create", true, true, false);
            cy.checkPermissionGroup(3, "roomTypes.delete", true, true, false);

            cy.get("#room_types\\.delete").click();
            cy.get("#room_types\\.create").click();
            cy.get("#room_types\\.update").click();
            cy.get("#room_types\\.view").click();

            cy.checkPermissionGroup(0, "roomTypes.view", true, true, false);
            cy.checkPermissionGroup(1, "roomTypes.update", false, false, false);
            cy.checkPermissionGroup(2, "roomTypes.create", false, false, false);
            cy.checkPermissionGroup(3, "roomTypes.delete", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(8)
          .should("include.text", "admin.roles.permissions.servers.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "servers.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "servers.view", false, false, false);
            cy.checkPermissionGroup(2, "servers.update", false, false, false);
            cy.checkPermissionGroup(3, "servers.create", false, false, false);
            cy.checkPermissionGroup(4, "servers.delete", false, false, false);

            cy.get("#servers\\.delete").click();
            cy.get("#servers\\.create").click();
            cy.get("#servers\\.update").click();
            cy.get("#servers\\.view").click();
            cy.get("#servers\\.view_any").click();

            cy.checkPermissionGroup(0, "servers.viewAny", true, true, false);
            cy.checkPermissionGroup(1, "servers.view", true, true, false);
            cy.checkPermissionGroup(2, "servers.update", true, true, false);
            cy.checkPermissionGroup(3, "servers.create", true, true, false);
            cy.checkPermissionGroup(4, "servers.delete", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(9)
          .should("include.text", "admin.roles.permissions.server_pools.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, false, false);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              4,
              "serverPools.delete",
              false,
              false,
              false,
            );

            cy.get("#server_pools\\.delete").click();
            cy.get("#server_pools\\.create").click();
            cy.get("#server_pools\\.update").click();
            cy.get("#server_pools\\.view").click();
            cy.get("#server_pools\\.view_any").click();

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              true,
              true,
              false,
            );
            cy.checkPermissionGroup(1, "serverPools.view", true, true, false);
            cy.checkPermissionGroup(2, "serverPools.update", true, true, false);
            cy.checkPermissionGroup(3, "serverPools.create", true, true, false);
            cy.checkPermissionGroup(4, "serverPools.delete", true, true, false);
          });
      });

    // Save changes
    cy.fixture("superuserRole.json").then((role) => {
      const selectedPermissions = [
        5, 7, 9, 8, 35, 20, 19, 18, 17, 16, 14, 13, 12, 11, 10, 21, 29, 28, 27,
        26, 25, 34, 33, 32, 31, 30,
      ];
      role.data.name = "Standard role";
      role.data.room_limit = -1;
      role.data.superuser = false;
      role.data.permissions = role.data.permissions.filter((permission) =>
        selectedPermissions.includes(permission.id),
      );

      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/roles/2",
        {
          statusCode: 200,
          body: role,
        },
        "saveChangesRequest",
      );

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="overlay"]').should("not.exist");

      cy.get('[data-test="roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");

      cy.get("#name").should("be.disabled");
      cy.get("#default").should("be.disabled");
      cy.get("#unlimited").should("be.disabled");
      cy.get("#custom").should("be.disabled");
      cy.get("#room-limit").should("not.exist");

      cy.get("#rooms\\.create").should("not.exist");
      cy.get("#rooms\\.view_all").should("not.exist");
      cy.get("#rooms\\.manage").should("not.exist");
      cy.get("#meetings\\.view_any").should("not.exist");
      cy.get("#admin\\.view").should("not.exist");
      cy.get("#settings\\.view_any").should("not.exist");
      cy.get("#settings\\.update").should("not.exist");
      cy.get("#system\\.monitor").should("not.exist");
      cy.get("#roles\\.view_any").should("not.exist");
      cy.get("#roles\\.view").should("not.exist");
      cy.get("#roles\\.update").should("not.exist");
      cy.get("#roles\\.create").should("not.exist");
      cy.get("#roles\\.delete").should("not.exist");
      cy.get("#users\\.view_any").should("not.exist");
      cy.get("#users\\.view").should("not.exist");
      cy.get("#users\\.update").should("not.exist");
      cy.get("#users\\.create").should("not.exist");
      cy.get("#users\\.delete").should("not.exist");
      cy.get("#users\\.update_own_attributes").should("not.exist");
      cy.get("#room_types\\.view").should("not.exist");
      cy.get("#room_types\\.update").should("not.exist");
      cy.get("#room_types\\.create").should("not.exist");
      cy.get("#room_types\\.delete").should("not.exist");
      cy.get("#servers\\.view_any").should("not.exist");
      cy.get("#servers\\.view").should("not.exist");
      cy.get("#servers\\.update").should("not.exist");
      cy.get("#servers\\.create").should("not.exist");
      cy.get("#servers\\.delete").should("not.exist");
      cy.get("#server_pools\\.view_any").should("not.exist");
      cy.get("#server_pools\\.view").should("not.exist");
      cy.get("#server_pools\\.update").should("not.exist");
      cy.get("#server_pools\\.create").should("not.exist");
      cy.get("#server_pools\\.delete").should("not.exist");

      cy.get('[data-test="roles-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });

      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: "Standard role",
          room_limit: -1,
          permissions: selectedPermissions,
          updated_at: role.data.updated_at,
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/2");
    cy.url().should("not.include", "/edit");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should(
        "include.text",
        'admin.breakcrumbs.roles.view_{"name":"Standard role"}',
      );
  });

  it("edit role with different room limits", function () {
    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    cy.get("#name").should("have.value", "Staff");

    // Add new role with custom room limit
    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get("#default").should("be.checked").and("not.be.disabled");

        cy.get("#unlimited").should("not.be.checked").and("not.be.disabled");

        cy.get("#custom").should("not.be.checked").and("not.be.disabled");
        cy.get("#room-limit").should("not.exist");

        cy.get("#custom").click();

        cy.get("#room-limit")
          .should("be.visible")
          .and("have.value", "0")
          .type("5");
      });

    // Save changes
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = 5;

      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/roles/2",
        {
          statusCode: 200,
          body: role,
        },
        "saveChangesRequest",
      );

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="overlay"]').should("not.exist");

      cy.get('[data-test="roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");

      cy.get("#name").should("be.disabled");
      cy.get("#default").should("be.disabled");
      cy.get("#unlimited").should("be.disabled");
      cy.get("#custom").should("be.disabled");
      cy.get("#room-limit").should("be.disabled");

      cy.get('[data-test="roles-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });

      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: role.data.name,
          room_limit: 5,
          permissions: role.data.permissions.map((permission) => permission.id),
          updated_at: role.data.updated_at,
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/2");
    cy.url().should("not.include", "/edit");

    // Reload page with unlimited room limit
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = -1;

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    cy.get("#name").should("have.value", "Staff");

    // Save without changing room limit
    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get("#default").should("not.be.checked").and("not.be.disabled");

        cy.get("#unlimited").should("be.checked").and("not.be.disabled");

        cy.get("#custom").should("not.be.checked").and("not.be.disabled");
        cy.get("#room-limit").should("not.exist");
      });

    // Save Changes
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = -1;

      cy.intercept("PUT", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: role.data.name,
          room_limit: -1,
          permissions: role.data.permissions.map((permission) => permission.id),
          updated_at: role.data.updated_at,
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/2");
    cy.url().should("not.include", "/edit");

    // Reload page with custom room limit
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = 5;

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });
    cy.visit("/admin/roles/2/edit");

    cy.get("#name").should("have.value", "Staff");

    // Change room limit to default
    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get("#default").should("not.be.checked").and("not.be.disabled");

        cy.get("#unlimited").should("not.be.checked").and("not.be.disabled");

        cy.get("#custom").should("be.checked").and("not.be.disabled");
        cy.get("#room-limit").should("be.visible").and("have.value", "5");

        // Switch back to default
        cy.get("#default").click();

        cy.get("#room-limit").should("not.exist");
      });

    // Save Changes
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = null;

      cy.intercept("PUT", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: role.data.name,
          room_limit: null,
          permissions: role.data.permissions.map((permission) => permission.id),
          updated_at: role.data.updated_at,
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/2");
    cy.url().should("not.include", "/edit");
  });

  it("check permission list with different permission dependencies", function () {
    cy.fixture("permissions.json").then((permissions) => {
      for (let i = 0; i < permissions.data.length; i++) {
        permissions.data[i].included_permissions = [];
      }

      cy.intercept("GET", "api/v1/permissions", {
        statusCode: 200,
        body: permissions,
      }).as("permissionsRequest");
    });

    cy.fixture("role.json").then((role) => {
      role.data.permissions = [];

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.visit("/admin/roles/2/edit");

    cy.wait("@permissionsRequest");

    cy.get('[data-test="permission-list"]')
      .should("be.visible")
      .and("include.text", "admin.roles.permission_name")
      .and("include.text", "admin.roles.permission_explicit")
      .and("include.text", "admin.roles.permission_included")
      .within(() => {
        cy.get('[data-test="permission-category"]').should("have.length", 10);

        cy.get('[data-test="permission-category"]')
          .eq(0)
          .should("include.text", "admin.roles.permissions.rooms.title")
          .within(() => {
            cy.checkPermissionGroup(0, "rooms.create", false, false, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, false, false);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, false);

            cy.get("#rooms\\.manage").click();

            cy.checkPermissionGroup(0, "rooms.create", false, false, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, false, false);
            cy.checkPermissionGroup(2, "rooms.manage", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(3)
          .should("include.text", "admin.roles.permissions.settings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 2);

            cy.checkPermissionGroup(0, "settings.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "settings.update", false, false, false);

            cy.get("#settings\\.update").click();

            cy.checkPermissionGroup(0, "settings.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "settings.update", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(4)
          .should("include.text", "admin.roles.permissions.system.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "system.monitor", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(5)
          .should("include.text", "admin.roles.permissions.users.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 6);

            cy.checkPermissionGroup(0, "users.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "users.view", false, false, false);
            cy.checkPermissionGroup(2, "users.update", false, false, false);
            cy.checkPermissionGroup(3, "users.create", false, false, false);
            cy.checkPermissionGroup(4, "users.delete", false, false, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              false,
              false,
              false,
            );

            cy.get("#users\\.delete").click();

            cy.checkPermissionGroup(0, "users.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "users.view", false, false, false);
            cy.checkPermissionGroup(2, "users.update", false, false, false);
            cy.checkPermissionGroup(3, "users.create", false, false, false);
            cy.checkPermissionGroup(4, "users.delete", true, true, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              false,
              false,
              false,
            );
          });

        cy.get('[data-test="permission-category"]')
          .eq(6)
          .should("include.text", "admin.roles.permissions.roles.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "roles.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "roles.view", false, false, false);
            cy.checkPermissionGroup(2, "roles.update", false, false, false);
            cy.checkPermissionGroup(3, "roles.create", false, false, false);
            cy.checkPermissionGroup(4, "roles.delete", false, false, false);

            cy.get("#roles\\.delete").click();

            cy.checkPermissionGroup(0, "roles.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "roles.view", false, false, false);
            cy.checkPermissionGroup(2, "roles.update", false, false, false);
            cy.checkPermissionGroup(3, "roles.create", false, false, false);
            cy.checkPermissionGroup(4, "roles.delete", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(7)
          .should("include.text", "admin.roles.permissions.room_types.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 4);

            cy.checkPermissionGroup(0, "roomTypes.view", false, false, false);
            cy.checkPermissionGroup(1, "roomTypes.update", false, false, false);
            cy.checkPermissionGroup(2, "roomTypes.create", false, false, false);
            cy.checkPermissionGroup(3, "roomTypes.delete", false, false, false);

            cy.get("#room_types\\.delete").click();

            cy.checkPermissionGroup(0, "roomTypes.view", false, false, false);
            cy.checkPermissionGroup(1, "roomTypes.update", false, false, false);
            cy.checkPermissionGroup(2, "roomTypes.create", false, false, false);
            cy.checkPermissionGroup(3, "roomTypes.delete", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(8)
          .should("include.text", "admin.roles.permissions.servers.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "servers.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "servers.view", false, false, false);
            cy.checkPermissionGroup(2, "servers.update", false, false, false);
            cy.checkPermissionGroup(3, "servers.create", false, false, false);
            cy.checkPermissionGroup(4, "servers.delete", false, false, false);

            cy.get("#servers\\.delete").click();

            cy.checkPermissionGroup(0, "servers.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "servers.view", false, false, false);
            cy.checkPermissionGroup(2, "servers.update", false, false, false);
            cy.checkPermissionGroup(3, "servers.create", false, false, false);
            cy.checkPermissionGroup(4, "servers.delete", true, true, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(9)
          .should("include.text", "admin.roles.permissions.server_pools.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, false, false);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              4,
              "serverPools.delete",
              false,
              false,
              false,
            );

            cy.get("#server_pools\\.delete").click();

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, false, false);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(4, "serverPools.delete", true, true, false);
          });
      });
  });

  it("check permission list with restricted permissions", function () {
    cy.fixture("permissions.json").then((permissions) => {
      permissions.meta.restrictions = [
        "servers.*",
        "system.monitor",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.create",
        "serverPools.update",
        "serverPools.delete",
      ];

      cy.intercept("GET", "api/v1/permissions", {
        statusCode: 200,
        body: permissions,
      }).as("permissionsRequest");
    });

    cy.fixture("role.json").then((role) => {
      role.data.permissions = [];

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.visit("/admin/roles/2/edit");

    cy.wait("@permissionsRequest");

    // Check that permission list is shown correctly
    cy.get('[data-test="permission-list"]')
      .should("be.visible")
      .and("include.text", "admin.roles.permission_name")
      .and("include.text", "admin.roles.permission_explicit")
      .and("include.text", "admin.roles.permission_included")
      .within(() => {
        cy.get('[data-test="permission-category"]').should("have.length", 10);

        cy.get('[data-test="permission-category"]')
          .eq(0)
          .should("include.text", "admin.roles.permissions.rooms.title")
          .within(() => {
            cy.checkPermissionGroup(0, "rooms.create", false, false, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, false, false);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(3)
          .should("include.text", "admin.roles.permissions.settings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 2);

            cy.checkPermissionGroup(0, "settings.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "settings.update", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(4)
          .should("include.text", "admin.roles.permissions.system.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "system.monitor", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(5)
          .should("include.text", "admin.roles.permissions.users.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 6);

            cy.checkPermissionGroup(0, "users.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "users.view", false, false, false);
            cy.checkPermissionGroup(2, "users.update", false, false, false);
            cy.checkPermissionGroup(3, "users.create", false, false, false);
            cy.checkPermissionGroup(4, "users.delete", false, false, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              false,
              false,
              false,
            );
          });

        cy.get('[data-test="permission-category"]')
          .eq(6)
          .should("include.text", "admin.roles.permissions.roles.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "roles.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "roles.view", false, false, false);
            cy.checkPermissionGroup(2, "roles.update", false, false, false);
            cy.checkPermissionGroup(3, "roles.create", false, false, false);
            cy.checkPermissionGroup(4, "roles.delete", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(7)
          .should("include.text", "admin.roles.permissions.room_types.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 4);

            cy.checkPermissionGroup(0, "roomTypes.view", false, false, false);
            cy.checkPermissionGroup(1, "roomTypes.update", false, false, false);
            cy.checkPermissionGroup(2, "roomTypes.create", false, false, false);
            cy.checkPermissionGroup(3, "roomTypes.delete", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(8)
          .should("include.text", "admin.roles.permissions.servers.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "servers.viewAny", false, false, true);
            cy.checkPermissionGroup(1, "servers.view", false, false, true);
            cy.checkPermissionGroup(2, "servers.update", false, false, true);
            cy.checkPermissionGroup(3, "servers.create", false, false, true);
            cy.checkPermissionGroup(4, "servers.delete", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(9)
          .should("include.text", "admin.roles.permissions.server_pools.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              false,
              false,
              true,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, false, true);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              false,
              true,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              false,
              true,
            );
            cy.checkPermissionGroup(
              4,
              "serverPools.delete",
              false,
              false,
              true,
            );
          });

        // Select permission that includes disabled permission
        cy.get("#room_types\\.delete").click();

        cy.get('[data-test="permission-category"]')
          .eq(9)
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              false,
              true,
              true,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, false, true);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              false,
              true,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              false,
              true,
            );
            cy.checkPermissionGroup(
              4,
              "serverPools.delete",
              false,
              false,
              true,
            );
          });
      });

    // Reload with different restricted permissions
    cy.fixture("permissions.json").then((permissions) => {
      permissions.meta.restrictions = [
        "rooms.*",
        "meetings.viewAny",
        "admin.view",
        "settings.*",
        "users.*",
        "roles.*",
        "roomTypes.*",
      ];

      cy.intercept("GET", "api/v1/permissions", {
        statusCode: 200,
        body: permissions,
      }).as("permissionsRequest");
    });

    cy.reload();

    cy.wait("@permissionsRequest");

    // Check that permission list is shown correctly
    cy.get('[data-test="permission-list"]')
      .should("be.visible")
      .and("include.text", "admin.roles.permission_name")
      .and("include.text", "admin.roles.permission_explicit")
      .and("include.text", "admin.roles.permission_included")
      .within(() => {
        cy.get('[data-test="permission-category"]').should("have.length", 10);

        cy.get('[data-test="permission-category"]')
          .eq(0)
          .should("include.text", "admin.roles.permissions.rooms.title")
          .within(() => {
            cy.checkPermissionGroup(0, "rooms.create", false, false, true);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, false, true);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(3)
          .should("include.text", "admin.roles.permissions.settings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 2);

            cy.checkPermissionGroup(0, "settings.viewAny", false, false, true);
            cy.checkPermissionGroup(1, "settings.update", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(4)
          .should("include.text", "admin.roles.permissions.system.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "system.monitor", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(5)
          .should("include.text", "admin.roles.permissions.users.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 6);

            cy.checkPermissionGroup(0, "users.viewAny", false, false, true);
            cy.checkPermissionGroup(1, "users.view", false, false, true);
            cy.checkPermissionGroup(2, "users.update", false, false, true);
            cy.checkPermissionGroup(3, "users.create", false, false, true);
            cy.checkPermissionGroup(4, "users.delete", false, false, true);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              false,
              false,
              true,
            );
          });

        cy.get('[data-test="permission-category"]')
          .eq(6)
          .should("include.text", "admin.roles.permissions.roles.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "roles.viewAny", false, false, true);
            cy.checkPermissionGroup(1, "roles.view", false, false, true);
            cy.checkPermissionGroup(2, "roles.update", false, false, true);
            cy.checkPermissionGroup(3, "roles.create", false, false, true);
            cy.checkPermissionGroup(4, "roles.delete", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(7)
          .should("include.text", "admin.roles.permissions.room_types.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 4);

            cy.checkPermissionGroup(0, "roomTypes.view", false, false, true);
            cy.checkPermissionGroup(1, "roomTypes.update", false, false, true);
            cy.checkPermissionGroup(2, "roomTypes.create", false, false, true);
            cy.checkPermissionGroup(3, "roomTypes.delete", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(8)
          .should("include.text", "admin.roles.permissions.servers.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(0, "servers.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "servers.view", false, false, false);
            cy.checkPermissionGroup(2, "servers.update", false, false, false);
            cy.checkPermissionGroup(3, "servers.create", false, false, false);
            cy.checkPermissionGroup(4, "servers.delete", false, false, false);
          });

        cy.get('[data-test="permission-category"]')
          .eq(9)
          .should("include.text", "admin.roles.permissions.server_pools.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 5);

            cy.checkPermissionGroup(
              0,
              "serverPools.viewAny",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, false, false);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              false,
              false,
            );
            cy.checkPermissionGroup(
              4,
              "serverPools.delete",
              false,
              false,
              false,
            );
          });
      });
  });

  it("edit role errors", function () {
    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should("include.text", 'admin.breakcrumbs.roles.edit_{"name":"Staff"}');

    // Check with 422 error
    cy.intercept("PUT", "api/v1/roles/2", {
      statusCode: 422,
      body: {
        errors: {
          name: ["The Name field is required."],
          room_limit: ["The Room limit must be at least -1."],
          permissions: ["The Permissions field must be present."],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="roles-save-button"]')
      .should("have.text", "app.save")
      .click();

    cy.wait("@saveChangesRequest");

    // Check error messages
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "The Name field is required.");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "The Room limit must be at least -1.");

    cy.contains("The Permissions field must be present.").should("be.visible");

    // Check with 500 error
    cy.intercept("PUT", "api/v1/roles/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check error message
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("not.include.text", "The Name field is required.");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("not.include.text", "The Room limit must be at least -1.");

    cy.contains("The Permissions field must be present.").should("not.exist");

    // Check with 428 error (stale error)
    cy.fixture("role.json").then((role) => {
      role.data.name = "Standard role";
      role.data.room_limit = -1;

      cy.intercept("PUT", "api/v1/roles/2", {
        statusCode: 428,
        body: {
          new_model: role.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-role-dialog"]').should("not.exist");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-role-dialog"]')
      .should("be.visible")
      .and("include.text", "app.errors.stale_error")
      .within(() => {
        // Check buttons
        cy.get('[data-test="stale-dialog-reject-button"]')
          .should("be.visible")
          .and("have.text", "app.reload");
        cy.get('[data-test="stale-dialog-accept-button"]')
          .should("be.visible")
          .and("have.text", "app.overwrite");
      });

    // Reload
    cy.get('[data-test="stale-dialog-reject-button"]').click();

    cy.get('[data-test="stale-role-dialog"]').should("not.exist");

    // Check that breadcrumbs is updated
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should(
        "include.text",
        'admin.breakcrumbs.roles.edit_{"name":"Standard role"}',
      );

    // Check that correct data is shown
    cy.get("#name").should("have.value", "Standard role");
    cy.get("#unlimited").should("be.checked");
    cy.get("#room-limit").should("not.exist");

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

    // Trigger 428 error (stale error) again
    cy.fixture("superuserRole.json").then((role) => {
      role.data.name = "Standard role 2";
      role.data.room_limit = -1;
      role.data.superuser = false;

      cy.intercept("PUT", "api/v1/roles/2", {
        statusCode: 428,
        body: {
          new_model: role.data,
        },
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="stale-role-dialog"]').should("not.exist");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-role-dialog"]')
      .should("be.visible")
      .and("include.text", "app.errors.stale_error")
      .within(() => {
        // Check buttons
        cy.get('[data-test="stale-dialog-reject-button"]')
          .should("be.visible")
          .and("have.text", "app.reload");
        cy.get('[data-test="stale-dialog-accept-button"]')
          .should("be.visible")
          .and("have.text", "app.overwrite");
      });

    // Overwrite
    cy.fixture("role.json").then((role) => {
      role.data.name = "Standard role";
      role.data.room_limit = -1;

      cy.intercept("PUT", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="stale-dialog-accept-button"]').click();

      // Check that correct data is sent
      cy.wait("@saveChangesRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: role.data.name,
          room_limit: role.data.room_limit,
          permissions: role.data.permissions.map((permission) => permission.id),
          updated_at: role.data.updated_at,
        });
      });
    });

    // Check that redirect worked
    cy.url().should("include", "/admin/roles/2");
    cy.url().should("not.include", "/edit");

    // Check that breadcrumbs stays the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should(
        "include.text",
        'admin.breakcrumbs.roles.view_{"name":"Standard role"}',
      );

    // Reload
    cy.visit("/admin/roles/2/edit");

    // Check with 404 error
    cy.interceptAdminRolesIndexRequests();
    cy.intercept("PUT", "api/v1/roles/2", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/roles/2/edit");
    cy.url().should("include", "/admin/roles");

    cy.wait("@rolesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload
    cy.visit("/admin/roles/2/edit");

    // Check with 401 error
    cy.intercept("PUT", "api/v1/roles/2", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load permissions errors", function () {
    const permissionsRequest = interceptIndefinitely(
      "GET",
      "api/v1/permissions",
      { statusCode: 500, body: { message: "Test" } },
      "permissionsRequest",
    );

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    // Check loading
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("be.disabled");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        permissionsRequest.sendResponse();
      });

    cy.wait("@permissionsRequest");

    // Check that loading is done
    // Check that overlay is still shown because of error
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that buttons are still hidden
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("be.disabled");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/permissions", {
      statusCode: 200,
      fixture: "permissions.json",
    }).as("permissionsRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload with 401 error
    cy.intercept("GET", "api/v1/permissions", {
      statusCode: 401,
    }).as("permissionsRequest");

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load role errors", function () {
    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roleRequest");

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 200,
      fixture: "role.json",
    }).as("roleRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload with 404 error
    cy.interceptAdminRolesIndexRequests();

    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("roleRequest");

    cy.reload();

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/roles/2/edit");
    cy.url().should("include", "/admin/roles");

    cy.wait("@rolesRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 401,
    }).as("roleRequest");

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("check button visibility with delete permission", function () {
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
      }).as("currentUserRequest");
    });

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/roles/2");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");
  });

  it("check view for user that is superuser", function () {
    // Check when viewing role that is not a superuser role
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
      }).as("currentUserRequest");
    });

    cy.fixture("role.json").then((role) => {
      role.data.room_limit = 5;
      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/roles/2");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check name field not disabled
    cy.get("#name").should("not.be.disabled");

    // Check room limit field not disabled
    cy.get("#default").should("not.be.disabled");
    cy.get("#unlimited").should("not.be.disabled");
    cy.get("#custom").should("not.be.disabled");
    cy.get("#room-limit").should("not.be.disabled");

    // Check permission list not disabled
    cy.get("#rooms\\.create").should("not.be.disabled");
    cy.get("#rooms\\.view_all").should("not.be.disabled");
    cy.get("#rooms\\.manage").should("not.be.disabled");
    cy.get("#meetings\\.view_any").should("not.be.disabled");
    cy.get("#admin\\.view").should("not.be.disabled");
    cy.get("#settings\\.view_any").should("not.be.disabled");
    cy.get("#settings\\.update").should("not.be.disabled");
    cy.get("#system\\.monitor").should("not.be.disabled");
    cy.get("#roles\\.view_any").should("not.be.disabled");
    cy.get("#roles\\.view").should("not.be.disabled");
    cy.get("#roles\\.update").should("not.be.disabled");
    cy.get("#roles\\.create").should("not.be.disabled");
    cy.get("#roles\\.delete").should("not.be.disabled");
    cy.get("#users\\.view_any").should("not.be.disabled");
    cy.get("#users\\.view").should("not.be.disabled");
    cy.get("#users\\.update").should("not.be.disabled");
    cy.get("#users\\.create").should("not.be.disabled");
    cy.get("#users\\.delete").should("not.be.disabled");
    cy.get("#users\\.update_own_attributes").should("not.be.disabled");
    cy.get("#room_types\\.view").should("not.be.disabled");
    cy.get("#room_types\\.update").should("not.be.disabled");
    cy.get("#room_types\\.create").should("not.be.disabled");
    cy.get("#room_types\\.delete").should("not.be.disabled");
    cy.get("#servers\\.view_any").should("not.be.disabled");
    cy.get("#servers\\.view").should("not.be.disabled");
    cy.get("#servers\\.update").should("not.be.disabled");
    cy.get("#servers\\.create").should("not.be.disabled");
    cy.get("#servers\\.delete").should("not.be.disabled");
    cy.get("#server_pools\\.view_any").should("not.be.disabled");
    cy.get("#server_pools\\.view").should("not.be.disabled");
    cy.get("#server_pools\\.update").should("not.be.disabled");
    cy.get("#server_pools\\.create").should("not.be.disabled");
    cy.get("#server_pools\\.delete").should("not.be.disabled");

    // Check when viewing role that is a superuser role
    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 200,
      fixture: "superuserRole.json",
    }).as("roleRequest");

    cy.reload();

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/roles/2");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check name field not disabled
    cy.get("#name").should("not.be.disabled");

    // Check room limit field is disabled
    cy.get("#default").should("be.disabled");
    cy.get("#unlimited").should("be.disabled");
    cy.get("#custom").should("be.disabled");
    cy.get("#room-limit").should("not.exist");

    // Check permission list is shown correctly and disabled
    cy.contains("admin.roles.permissions_title").should("be.visible");

    cy.checkPermissionGroup(0, "rooms.create", true, true, true);
    cy.checkPermissionGroup(1, "rooms.viewAll", true, true, true);
    cy.checkPermissionGroup(2, "rooms.manage", true, true, true);

    cy.checkPermissionGroup(3, "meetings.viewAny", true, true, true);
    cy.checkPermissionGroup(4, "admin.view", true, true, true);

    cy.checkPermissionGroup(5, "settings.viewAny", true, true, true);
    cy.checkPermissionGroup(6, "settings.update", true, true, true);
    cy.checkPermissionGroup(7, "system.monitor", true, true, true);

    cy.checkPermissionGroup(8, "users.viewAny", true, true, true);
    cy.checkPermissionGroup(9, "users.view", true, true, true);
    cy.checkPermissionGroup(10, "users.update", true, true, true);
    cy.checkPermissionGroup(11, "users.create", true, true, true);
    cy.checkPermissionGroup(12, "users.delete", true, true, true);
    cy.checkPermissionGroup(13, "users.updateOwnAttributes", true, true, true);

    cy.checkPermissionGroup(14, "roles.viewAny", true, true, true);
    cy.checkPermissionGroup(15, "roles.view", true, true, true);
    cy.checkPermissionGroup(16, "roles.update", true, true, true);
    cy.checkPermissionGroup(17, "roles.create", true, true, true);
    cy.checkPermissionGroup(18, "roles.delete", true, true, true);

    cy.checkPermissionGroup(19, "roomTypes.view", true, true, true);
    cy.checkPermissionGroup(20, "roomTypes.update", true, true, true);
    cy.checkPermissionGroup(21, "roomTypes.create", true, true, true);
    cy.checkPermissionGroup(22, "roomTypes.delete", true, true, true);

    cy.checkPermissionGroup(23, "servers.viewAny", true, true, true);
    cy.checkPermissionGroup(24, "servers.view", true, true, true);
    cy.checkPermissionGroup(25, "servers.update", true, true, true);
    cy.checkPermissionGroup(26, "servers.create", true, true, true);
    cy.checkPermissionGroup(27, "servers.delete", true, true, true);

    cy.checkPermissionGroup(28, "serverPools.viewAny", true, true, true);
    cy.checkPermissionGroup(29, "serverPools.view", true, true, true);
    cy.checkPermissionGroup(30, "serverPools.update", true, true, true);
    cy.checkPermissionGroup(31, "serverPools.create", true, true, true);
    cy.checkPermissionGroup(32, "serverPools.delete", true, true, true);
  });

  it("check view for user that is no superuser", function () {
    // Check when viewing role that is not a superuser role
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;
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
      }).as("currentUserRequest");
    });

    cy.fixture("role.json").then((role) => {
      role.data.room_limit = 5;
      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.visit("/admin/roles/2/edit");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/roles/2");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check name field not disabled
    cy.get("#name").should("not.be.disabled");

    // Check room limit field not disabled
    cy.get("#default").should("not.be.disabled");
    cy.get("#unlimited").should("not.be.disabled");
    cy.get("#custom").should("not.be.disabled");
    cy.get("#room-limit").should("not.be.disabled");

    // Check permission list not disabled
    cy.get("#rooms\\.create").should("not.be.disabled");
    cy.get("#rooms\\.view_all").should("not.be.disabled");
    cy.get("#rooms\\.manage").should("not.be.disabled");
    cy.get("#meetings\\.view_any").should("not.be.disabled");
    cy.get("#admin\\.view").should("not.be.disabled");
    cy.get("#settings\\.view_any").should("not.be.disabled");
    cy.get("#settings\\.update").should("not.be.disabled");
    cy.get("#system\\.monitor").should("not.be.disabled");
    cy.get("#roles\\.view_any").should("not.be.disabled");
    cy.get("#roles\\.view").should("not.be.disabled");
    cy.get("#roles\\.update").should("not.be.disabled");
    cy.get("#roles\\.create").should("not.be.disabled");
    cy.get("#roles\\.delete").should("not.be.disabled");
    cy.get("#users\\.view_any").should("not.be.disabled");
    cy.get("#users\\.view").should("not.be.disabled");
    cy.get("#users\\.update").should("not.be.disabled");
    cy.get("#users\\.create").should("not.be.disabled");
    cy.get("#users\\.delete").should("not.be.disabled");
    cy.get("#users\\.update_own_attributes").should("not.be.disabled");
    cy.get("#room_types\\.view").should("not.be.disabled");
    cy.get("#room_types\\.update").should("not.be.disabled");
    cy.get("#room_types\\.create").should("not.be.disabled");
    cy.get("#room_types\\.delete").should("not.be.disabled");
    cy.get("#servers\\.view_any").should("not.be.disabled");
    cy.get("#servers\\.view").should("not.be.disabled");
    cy.get("#servers\\.update").should("not.be.disabled");
    cy.get("#servers\\.create").should("not.be.disabled");
    cy.get("#servers\\.delete").should("not.be.disabled");
    cy.get("#server_pools\\.view_any").should("not.be.disabled");
    cy.get("#server_pools\\.view").should("not.be.disabled");
    cy.get("#server_pools\\.update").should("not.be.disabled");
    cy.get("#server_pools\\.create").should("not.be.disabled");
    cy.get("#server_pools\\.delete").should("not.be.disabled");

    // Check when viewing role that is a superuser role
    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 200,
      fixture: "superuserRole.json",
    }).as("roleRequest");

    cy.reload();

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.cancel_editing")
      .and("have.attr", "href", "/admin/roles/2");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.save");

    // Check name field not disabled
    cy.get("#name").should("not.be.disabled");

    // Check room limit field is disabled
    cy.get("#default").should("be.disabled");
    cy.get("#unlimited").should("be.disabled");
    cy.get("#custom").should("be.disabled");
    cy.get("#room-limit").should("not.exist");

    // Check permission list is shown correctly and disabled
    cy.contains("admin.roles.permissions_title").should("be.visible");

    cy.checkPermissionGroup(0, "rooms.create", true, true, true);
    cy.checkPermissionGroup(1, "rooms.viewAll", true, true, true);
    cy.checkPermissionGroup(2, "rooms.manage", true, true, true);

    cy.checkPermissionGroup(3, "meetings.viewAny", true, true, true);
    cy.checkPermissionGroup(4, "admin.view", true, true, true);

    cy.checkPermissionGroup(5, "settings.viewAny", true, true, true);
    cy.checkPermissionGroup(6, "settings.update", true, true, true);
    cy.checkPermissionGroup(7, "system.monitor", true, true, true);

    cy.checkPermissionGroup(8, "users.viewAny", true, true, true);
    cy.checkPermissionGroup(9, "users.view", true, true, true);
    cy.checkPermissionGroup(10, "users.update", true, true, true);
    cy.checkPermissionGroup(11, "users.create", true, true, true);
    cy.checkPermissionGroup(12, "users.delete", true, true, true);
    cy.checkPermissionGroup(13, "users.updateOwnAttributes", true, true, true);

    cy.checkPermissionGroup(14, "roles.viewAny", true, true, true);
    cy.checkPermissionGroup(15, "roles.view", true, true, true);
    cy.checkPermissionGroup(16, "roles.update", true, true, true);
    cy.checkPermissionGroup(17, "roles.create", true, true, true);
    cy.checkPermissionGroup(18, "roles.delete", true, true, true);

    cy.checkPermissionGroup(19, "roomTypes.view", true, true, true);
    cy.checkPermissionGroup(20, "roomTypes.update", true, true, true);
    cy.checkPermissionGroup(21, "roomTypes.create", true, true, true);
    cy.checkPermissionGroup(22, "roomTypes.delete", true, true, true);

    cy.checkPermissionGroup(23, "servers.viewAny", true, true, true);
    cy.checkPermissionGroup(24, "servers.view", true, true, true);
    cy.checkPermissionGroup(25, "servers.update", true, true, true);
    cy.checkPermissionGroup(26, "servers.create", true, true, true);
    cy.checkPermissionGroup(27, "servers.delete", true, true, true);

    cy.checkPermissionGroup(28, "serverPools.viewAny", true, true, true);
    cy.checkPermissionGroup(29, "serverPools.view", true, true, true);
    cy.checkPermissionGroup(30, "serverPools.update", true, true, true);
    cy.checkPermissionGroup(31, "serverPools.create", true, true, true);
    cy.checkPermissionGroup(32, "serverPools.delete", true, true, true);
  });
});
