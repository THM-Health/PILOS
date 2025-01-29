import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin roles new", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRolesNewRequests();

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

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/roles/new");
  });

  it("visit with user without permission to add new roles", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.visit("/admin/roles/new");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/room_types");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("add new role", function () {
    cy.visit("/admin/roles/new");

    // Check that header buttons are hidden
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should("include.text", "admin.breakcrumbs.roles.new");

    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "").type("Standard role");
      });

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
              .and("not.be.disabled");
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
            cy.checkPermissionGroup(0, "rooms.create", false, false, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, false, false);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, false);

            cy.get("#rooms\\.manage").click();

            cy.checkPermissionGroup(0, "rooms.create", false, true, false);
            cy.checkPermissionGroup(1, "rooms.viewAll", false, true, false);
            cy.checkPermissionGroup(2, "rooms.manage", true, true, false);

            cy.get("#rooms\\.create").click();
            cy.get("#rooms\\.view_all").click();
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", false, false, false);

            cy.get("#meetings\\.view_any").click();
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, false, false);

            cy.get("#admin\\.view").click();
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
          });

        cy.get('[data-test="permission-category"]')
          .eq(4)
          .should("include.text", "admin.roles.permissions.system.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "system.monitor", false, false, false);

            cy.get("#system\\.monitor").click();
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

            cy.get("#users\\.update_own_attributes").click();

            cy.checkPermissionGroup(0, "users.viewAny", false, false, false);
            cy.checkPermissionGroup(1, "users.view", false, false, false);
            cy.checkPermissionGroup(2, "users.update", false, false, false);
            cy.checkPermissionGroup(3, "users.create", false, false, false);
            cy.checkPermissionGroup(4, "users.delete", false, false, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              true,
              true,
              false,
            );

            cy.get("#users\\.delete").click();

            cy.checkPermissionGroup(0, "users.viewAny", false, true, false);
            cy.checkPermissionGroup(1, "users.view", false, true, false);
            cy.checkPermissionGroup(2, "users.update", false, true, false);
            cy.checkPermissionGroup(3, "users.create", false, true, false);
            cy.checkPermissionGroup(4, "users.delete", true, true, false);
            cy.checkPermissionGroup(
              5,
              "users.updateOwnAttributes",
              true,
              true,
              false,
            );

            cy.get("#users\\.create").click();
            cy.get("#users\\.update").click();
            cy.get("#users\\.view").click();
            cy.get("#users\\.view_any").click();
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

            cy.checkPermissionGroup(0, "roles.viewAny", false, true, false);
            cy.checkPermissionGroup(1, "roles.view", false, true, false);
            cy.checkPermissionGroup(2, "roles.update", false, true, false);
            cy.checkPermissionGroup(3, "roles.create", false, true, false);
            cy.checkPermissionGroup(4, "roles.delete", true, true, false);

            cy.get("#roles\\.create").click();
            cy.get("#roles\\.update").click();
            cy.get("#roles\\.view").click();
            cy.get("#roles\\.view_any").click();
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

            cy.checkPermissionGroup(0, "roomTypes.view", false, true, false);
            cy.checkPermissionGroup(1, "roomTypes.update", false, true, false);
            cy.checkPermissionGroup(2, "roomTypes.create", false, true, false);
            cy.checkPermissionGroup(3, "roomTypes.delete", true, true, false);

            cy.get("#room_types\\.create").click();
            cy.get("#room_types\\.update").click();
            cy.get("#room_types\\.view").click();
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

            cy.checkPermissionGroup(0, "servers.viewAny", false, true, false);
            cy.checkPermissionGroup(1, "servers.view", false, true, false);
            cy.checkPermissionGroup(2, "servers.update", false, true, false);
            cy.checkPermissionGroup(3, "servers.create", false, true, false);
            cy.checkPermissionGroup(4, "servers.delete", true, true, false);

            cy.get("#servers\\.create").click();
            cy.get("#servers\\.update").click();
            cy.get("#servers\\.view").click();
            cy.get("#servers\\.view_any").click();
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
              true,
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
              true,
              false,
            );
            cy.checkPermissionGroup(1, "serverPools.view", false, true, false);
            cy.checkPermissionGroup(
              2,
              "serverPools.update",
              false,
              true,
              false,
            );
            cy.checkPermissionGroup(
              3,
              "serverPools.create",
              false,
              true,
              false,
            );
            cy.checkPermissionGroup(4, "serverPools.delete", true, true, false);

            cy.get("#server_pools\\.create").click();
            cy.get("#server_pools\\.update").click();
            cy.get("#server_pools\\.view").click();
            cy.get("#server_pools\\.view_any").click();
          });
      });

    // Add new role
    cy.fixture("superuserRole.json").then((role) => {
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.superuser = false;

      const newRoleRequest = interceptIndefinitely(
        "POST",
        "api/v1/roles",
        {
          statusCode: 201,
          body: role,
        },
        "newRoleRequest",
      );

      cy.intercept("GET", "api/v1/roles/40", {
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
          newRoleRequest.sendResponse();
        });

      cy.wait("@newRoleRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: "Standard role",
          room_limit: null,
          permissions: [
            5, 3, 4, 6, 7, 9, 8, 35, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10,
            24, 23, 22, 21, 29, 28, 27, 26, 25, 34, 33, 32, 31, 30,
          ],
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/40");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should(
        "include.text",
        'admin.breakcrumbs.roles.view_{"name":"Standard role"}',
      );
  });

  it("add new role with different room limits", function () {
    cy.visit("/admin/roles/new");

    cy.get("#name").should("have.value", "").type("Standard role");

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

    // Add new role
    cy.fixture("role.json").then((role) => {
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.room_limit = 5;
      role.data.permissions = [];

      const newRoleRequest = interceptIndefinitely(
        "POST",
        "api/v1/roles",
        {
          statusCode: 201,
          body: role,
        },
        "newRoleRequest",
      );

      cy.intercept("GET", "api/v1/roles/40", {
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
          newRoleRequest.sendResponse();
        });

      cy.wait("@newRoleRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: "Standard role",
          room_limit: 5,
          permissions: [],
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/40");

    // Reload page
    cy.visit("/admin/roles/new");

    cy.get("#name").should("have.value", "").type("Standard role");

    // Add new role with unlimited  room limit
    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get("#default").should("be.checked").and("not.be.disabled");

        cy.get("#unlimited")
          .should("not.be.checked")
          .and("not.be.disabled")
          .click();

        cy.get("#custom").should("not.be.checked").and("not.be.disabled");
        cy.get("#room-limit").should("not.exist");
      });

    // Add new role
    cy.fixture("role.json").then((role) => {
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.room_limit = -1;
      role.data.permissions = [];

      cy.intercept("POST", "api/v1/roles", {
        statusCode: 201,
        body: role,
      }).as("newRoleRequest");

      cy.intercept("GET", "api/v1/roles/40", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      cy.wait("@newRoleRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: "Standard role",
          room_limit: -1,
          permissions: [],
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/40");

    // Reload page
    cy.visit("/admin/roles/new");

    cy.get("#name").should("have.value", "").type("Standard role");

    // Add new role with default room limit
    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get("#default").should("be.checked").and("not.be.disabled");

        cy.get("#unlimited")
          .should("not.be.checked")
          .and("not.be.disabled")
          .click();

        cy.get("#custom").should("not.be.checked").and("not.be.disabled");
        cy.get("#room-limit").should("not.exist");

        // Switch back to default
        cy.get("#default").click();
      });

    // Add new role
    cy.fixture("role.json").then((role) => {
      role.data.id = 40;
      role.data.name = "Standard role";
      role.data.room_limit = null;
      role.data.permissions = [];

      cy.intercept("POST", "api/v1/roles", {
        statusCode: 201,
        body: role,
      }).as("newRoleRequest");

      cy.intercept("GET", "api/v1/roles/40", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");

      cy.get('[data-test="roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      cy.wait("@newRoleRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          name: "Standard role",
          room_limit: null,
          permissions: [],
        });
      });
    });

    cy.wait("@roleRequest");

    // Check that role page is shown
    cy.url().should("include", "/admin/roles/40");
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

    cy.visit("/admin/roles/new");

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

    cy.visit("/admin/roles/new");

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

  it("add roles errors", function () {
    cy.visit("/admin/roles/new");

    cy.get("#name").should("have.value", "").type("Standard role");

    // Check with 422 error
    cy.intercept("POST", "api/v1/roles", {
      statusCode: 422,
      body: {
        errors: {
          name: ["The Name field is required."],
          room_limit: ["The Room limit must be at least -1."],
          permissions: ["The Permissions field must be present."],
        },
      },
    }).as("newRoleRequest");

    cy.get('[data-test="roles-save-button"]')
      .should("have.text", "app.save")
      .click();

    cy.wait("@newRoleRequest");

    // Check error messages
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "The Name field is required.");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "The Room limit must be at least -1.");

    cy.contains("The Permissions field must be present.").should("be.visible");

    // Check with 500 error
    cy.intercept("POST", "api/v1/roles", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("newRoleRequest");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@newRoleRequest");

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

    // Check with 401 error
    cy.intercept("POST", "api/v1/roles", {
      statusCode: 401,
    }).as("newRoleRequest");

    cy.get('[data-test="roles-save-button"]').click();

    cy.wait("@newRoleRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load permissions errors", function () {
    const permissionsRequest = interceptIndefinitely(
      "GET",
      "api/v1/permissions",
      { statusCode: 500, body: { message: "Test" } },
      "permissionsRequest",
    );

    cy.visit("/admin/roles/new");

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

    cy.wait("@permissionsRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload with 401 error
    cy.intercept("GET", "api/v1/permissions", {
      statusCode: 401,
    }).as("permissionsRequest");

    cy.visit("/admin/roles/new");

    cy.wait("@permissionsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
