import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin roles view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRolesViewRequests();

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
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/roles/2");
  });

  it("visit with user without permission to view roles", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "roles.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.visit("/admin/roles/2");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/room_types/3");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check rolesView shown correctly", function () {
    const roleRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles/2",
      { fixture: "role.json" },
      "roleRequest",
    );

    cy.visit("/admin/roles/2");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        roleRequest.sendResponse();
      });

    cy.wait("@roleRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that buttons are still hidden
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.roles.index")
      .should("include.text", 'admin.breakcrumbs.roles.view_{"name":"Staff"}');

    // Check that role data is shown correctly
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "Staff").and("be.disabled");
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
            cy.get("#default").should("be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#unlimited").should("not.be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#custom").should("not.be.checked").and("be.disabled");
          });
        cy.get("#room-limit").should("not.exist");

        // Open room limit help dialog
        cy.get('[data-test="roles-room-limit-help-button"]').click();
      });

    cy.checkRoomLimitHelpDialog();

    cy.get('[data-test="roles-room-limit-help-dialog"]').should("not.exist");

    // Check that permissions are shown correctly
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
            cy.checkPermissionGroup(0, "rooms.create", true, true, true);
            cy.checkPermissionGroup(1, "rooms.viewAll", true, true, true);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", true, true, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, true, true);
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

            cy.checkPermissionGroup(0, "system.monitor", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(5)
          .should("include.text", "admin.roles.permissions.users.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 6);

            cy.checkPermissionGroup(0, "users.viewAny", true, true, true);
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

            cy.checkPermissionGroup(0, "roles.viewAny", false, true, true);
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

            cy.checkPermissionGroup(0, "roomTypes.view", false, true, true);
            cy.checkPermissionGroup(1, "roomTypes.update", true, true, true);
            cy.checkPermissionGroup(2, "roomTypes.create", true, true, true);
            cy.checkPermissionGroup(3, "roomTypes.delete", true, true, true);
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
  });

  it("check rolesView with no permissions available", function () {
    cy.intercept("GET", "api/v1/permissions", {
      statusCode: 200,
      body: {
        data: [],
        meta: { restrictions: [""] },
      },
    }).as("permissionsRequest");

    cy.visit("/admin/roles/2");

    cy.wait("@permissionsRequest");

    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "Staff").and("be.disabled");
      });

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
            cy.get("#default").should("be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#unlimited").should("not.be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#custom").should("not.be.checked").and("be.disabled");
          });
        cy.get("#room-limit").should("not.exist");
      });
    // Check that permissions are shown correctly
    cy.contains("admin.roles.permissions_title").should("be.visible");

    cy.get('[data-test="permission-list"]').should("not.exist");

    cy.contains("admin.roles.no_options").should("be.visible");
  });

  it("check rolesView with different permission dependencies", function () {
    cy.fixture("permissions.json").then((permissions) => {
      permissions.data[18].included_permissions = [];
      permissions.data[19].included_permissions = [];
      permissions.data[20].included_permissions = [];
      permissions.data[21].included_permissions = [];

      cy.intercept("GET", "api/v1/permissions", {
        statusCode: 200,
        body: permissions,
      }).as("permissionsRequest");
    });

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that permissions are shown correctly
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
            cy.checkPermissionGroup(0, "rooms.create", true, true, true);
            cy.checkPermissionGroup(1, "rooms.viewAll", true, true, true);
            cy.checkPermissionGroup(2, "rooms.manage", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(1)
          .should("include.text", "admin.roles.permissions.meetings.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "meetings.viewAny", true, true, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(2)
          .should("include.text", "admin.roles.permissions.admin.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 1);

            cy.checkPermissionGroup(0, "admin.view", false, true, true);
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

            cy.checkPermissionGroup(0, "system.monitor", false, false, true);
          });

        cy.get('[data-test="permission-category"]')
          .eq(5)
          .should("include.text", "admin.roles.permissions.users.title")
          .within(() => {
            cy.get('[data-test="permission-group"]').should("have.length", 6);

            cy.checkPermissionGroup(0, "users.viewAny", true, true, true);
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

            cy.checkPermissionGroup(0, "roles.viewAny", false, true, true);
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
            cy.checkPermissionGroup(1, "roomTypes.update", true, true, true);
            cy.checkPermissionGroup(2, "roomTypes.create", true, true, true);
            cy.checkPermissionGroup(3, "roomTypes.delete", true, true, true);
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
      });
  });

  it("check rolesView with different room limit settings", function () {
    // Check with different default
    cy.fixture("config.json").then((config) => {
      config.data.room.limit = 5;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/admin/roles/2");
    cy.wait("@roleRequest");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get('[data-test="room-limit-mode-default-field"]')
          .should("be.visible")
          .should("include.text", 'admin.roles.room_limit.default_{"value":5}')
          .within(() => {
            cy.get("#default").should("be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#unlimited").should("not.be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#custom").should("not.be.checked").and("be.disabled");
          });
        cy.get("#room-limit").should("not.exist");
      });

    // Reload with room limit set to unlimited
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = -1;

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.reload();
    cy.wait("@roleRequest");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get('[data-test="room-limit-mode-default-field"]')
          .should("be.visible")
          .should("include.text", 'admin.roles.room_limit.default_{"value":5}')
          .within(() => {
            cy.get("#default").should("not.be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#unlimited").should("be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#custom").should("not.be.checked").and("be.disabled");
          });
        cy.get("#room-limit").should("not.exist");
      });

    // Reload with room limit set to custom
    cy.fixture("role.json").then((role) => {
      role.data.room_limit = 2;

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.reload();
    cy.wait("@roleRequest");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "app.room_limit")
      .within(() => {
        cy.get('[data-test="room-limit-mode-default-field"]')
          .should("be.visible")
          .should("include.text", 'admin.roles.room_limit.default_{"value":5}')
          .within(() => {
            cy.get("#default").should("not.be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#unlimited").should("not.be.checked").and("be.disabled");
          });

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#custom").should("be.checked").and("be.disabled");
          });
        cy.get("#room-limit")
          .should("be.visible")
          .and("have.value", "2")
          .and("be.disabled");
      });
  });

  it("load role errors", function () {
    cy.intercept("GET", "api/v1/roles/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roleRequest");

    cy.visit("/admin/roles/2");

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
    cy.url().should("not.include", "/admin/roles/2");
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

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load permissions errors", function () {
    const permissionsRequest = interceptIndefinitely(
      "GET",
      "api/v1/permissions",
      { statusCode: 500, body: { message: "Test" } },
      "permissionsRequest",
    );

    cy.visit("/admin/roles/2");
    cy.wait("@roleRequest");

    // Check loading
    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]').should("not.exist");

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
    cy.get('[data-test="roles-save-button"]').should("not.exist");

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

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");
    cy.wait("@permissionsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/roles/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("check button visibility with update permission", function () {
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

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]')
      .should("be.visible")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/roles/2/edit");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
    cy.get('[data-test="roles-save-button"]').should("not.exist");
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
      });
    });

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]')
      .should("be.visible")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/roles/2/edit");
    cy.get('[data-test="roles-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="roles-save-button"]').should("not.exist");
  });

  it("check button visibility for user that is superuser", function () {
    // Check when viewing role that is not a superuser role
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.create",
        "roles.update",
        "roles.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/roles/2/edit");
    cy.get('[data-test="roles-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check when viewing role that is a superuser role
    cy.fixture("role.json").then((role) => {
      role.data.superuser = true;

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.reload();

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/roles/2/edit");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
  });

  it("check button visibility for user that is no superuser", function () {
    // Check when viewing role that is not a superuser role
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;

      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "roles.view",
        "roles.create",
        "roles.update",
        "roles.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/roles/2");

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/roles/2/edit");
    cy.get('[data-test="roles-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check when viewing role that is a superuser role
    cy.fixture("role.json").then((role) => {
      role.data.superuser = true;

      cy.intercept("GET", "api/v1/roles/2", {
        statusCode: 200,
        body: role,
      }).as("roleRequest");
    });

    cy.reload();

    cy.wait("@roleRequest");

    cy.get('[data-test="roles-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="roles-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/roles/2/edit");
    cy.get('[data-test="roles-delete-button"]').should("not.exist");
  });
});
