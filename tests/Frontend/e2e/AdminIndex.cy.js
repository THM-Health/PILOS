describe("Admin index", function () {
  beforeEach(function () {
    cy.init();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin");
  });

  it("visit without permission to view admin pages", function () {
    cy.intercept("GET", "api/v1/currentUser", {
      statusCode: 200,
      fixture: "currentUser.json",
    });

    cy.visit("/admin");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check admin index with all permissions", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "settings.viewAny",
        "roles.viewAny",
        "users.viewAny",
        "serverPools.viewAny",
        "servers.viewAny",
        "streaming.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/settings")
      .and("include.text", "admin.settings.title")
      .and("include.text", "admin.settings.tile_description");

    cy.get('[data-test="admin-users-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/users")
      .and("include.text", "app.users")
      .and("include.text", "admin.users.tile_description");

    cy.get('[data-test="admin-roles-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/roles")
      .and("include.text", "app.roles")
      .and("include.text", "admin.roles.tile_description");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/servers")
      .and("include.text", "app.servers")
      .and("include.text", "admin.servers.tile_description");

    cy.get('[data-test="admin-server-pools-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/server_pools")
      .and("include.text", "app.server_pools")
      .and("include.text", "admin.server_pools.tile_description");

    // Check streaming card is visible, but the link is disabled
    cy.get('[data-test="admin-streaming-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin")
      .and("include.text", "app.streaming")
      .and("include.text", "admin.streaming.tile_description");
  });

  it("open admin settings", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "settings.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/settings")
      .and("include.text", "admin.settings.title")
      .and("include.text", "admin.settings.tile_description");

    cy.get('[data-test="admin-users-link"]').should("not.exist");

    cy.get('[data-test="admin-roles-link"]').should("not.exist");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]').should("not.exist");

    cy.get('[data-test="admin-server-pools-link"]').should("not.exist");

    cy.get('[data-test="admin-streaming-link"]').should("not.exist");

    cy.interceptAdminSettingsRequest();
    cy.get('[data-test="admin-settings-link"]').click();

    cy.url().should("include", "/admin/settings");
  });

  it("open admin users", function () {
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

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]').should("not.exist");

    cy.get('[data-test="admin-users-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/users")
      .and("include.text", "app.users")
      .and("include.text", "admin.users.tile_description");

    cy.get('[data-test="admin-roles-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/roles")
      .and("include.text", "app.roles")
      .and("include.text", "admin.roles.tile_description");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]').should("not.exist");

    cy.get('[data-test="admin-server-pools-link"]').should("not.exist");

    cy.interceptAdminUsersIndexRequests();

    cy.get('[data-test="admin-users-link"]').click();

    cy.url().should("include", "/admin/users");
  });

  it("open admin roles", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "roles.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]').should("not.exist");

    cy.get('[data-test="admin-users-link"]').should("not.exist");

    cy.get('[data-test="admin-roles-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/roles")
      .and("include.text", "app.roles")
      .and("include.text", "admin.roles.tile_description");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]').should("not.exist");

    cy.get('[data-test="admin-server-pools-link"]').should("not.exist");

    cy.interceptAdminRolesIndexRequests();

    cy.get('[data-test="admin-roles-link"]').click();

    cy.url().should("include", "/admin/roles");
  });

  it("open admin room types", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]').should("not.exist");

    cy.get('[data-test="admin-users-link"]').should("not.exist");

    cy.get('[data-test="admin-roles-link"]').should("not.exist");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]').should("not.exist");

    cy.get('[data-test="admin-server-pools-link"]').should("not.exist");

    cy.interceptAdminRoomTypesIndexRequests();

    cy.get('[data-test="admin-room-types-link"]').click();

    cy.url().should("include", "/admin/room_types");
  });

  it("open admin servers", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "servers.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]').should("not.exist");

    cy.get('[data-test="admin-users-link"]').should("not.exist");

    cy.get('[data-test="admin-roles-link"]').should("not.exist");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/servers")
      .and("include.text", "app.servers")
      .and("include.text", "admin.servers.tile_description");

    cy.get('[data-test="admin-server-pools-link"]').should("not.exist");

    cy.interceptAdminServersIndexRequests();

    cy.get('[data-test="admin-servers-link"]').click();

    cy.url().should("include", "/admin/servers");
  });

  it("open admin server pools", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "serverPools.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]').should("not.exist");

    cy.get('[data-test="admin-users-link"]').should("not.exist");

    cy.get('[data-test="admin-roles-link"]').should("not.exist");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]').should("not.exist");

    cy.get('[data-test="admin-server-pools-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/server_pools")
      .and("include.text", "app.server_pools")
      .and("include.text", "admin.server_pools.tile_description");

    cy.interceptAdminServerPoolsIndexRequests();

    cy.get('[data-test="admin-server-pools-link"]').click();

    cy.url().should("include", "/admin/server_pools");
  });

  it("open admin streaming", function () {
    cy.fixture("config.json").then((config) => {
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "streaming.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin");

    cy.contains("admin.title").should("be.visible");
    cy.contains("admin.overview").should("be.visible");
    cy.contains("admin.overview_description").should("be.visible");

    cy.get('[data-test="admin-settings-link"]').should("not.exist");

    cy.get('[data-test="admin-users-link"]').should("not.exist");

    cy.get('[data-test="admin-roles-link"]').should("not.exist");

    cy.get('[data-test="admin-room-types-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types")
      .and("include.text", "app.room_types")
      .and("include.text", "admin.room_types.tile_description");

    cy.get('[data-test="admin-servers-link"]').should("not.exist");

    cy.get('[data-test="admin-server-pools-link"]').should("not.exist");

    cy.get('[data-test="admin-streaming-link"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/streaming_settings")
      .and("include.text", "app.streaming")
      .and("include.text", "admin.streaming.tile_description");

    cy.interceptAdminStreamingIndexRequests();

    cy.get('[data-test="admin-streaming-link"]').click();

    cy.url().should("include", "/admin/streaming_settings");
  });
});
