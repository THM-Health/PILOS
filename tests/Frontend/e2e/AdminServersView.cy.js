import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin servers view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServersViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/servers/1");
  });

  it("visit with user without permission to view servers", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "servers.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/servers/1");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/servers/1");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check serverView shown correctly (server enabled)", function () {
    const serverRequest = interceptIndefinitely(
      "GET",
      "api/v1/servers/1",
      { fixture: "server.json" },
      "serverRequest",
    );
    cy.visit("/admin/servers/1");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        serverRequest.sendResponse();
      });

    cy.wait("@serverRequest");

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that buttons are still hidden (missing permissions)
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.servers.index")
      .should(
        "include.text",
        'admin.breakcrumbs.servers.view_{"name":"Server 01"}',
      );

    // Check that server data is shown correctly
    cy.get('[data-test="name-field"]')
      .should("be.visible")
      .and("include.text", "app.model_name")
      .within(() => {
        cy.get("#name").should("have.value", "Server 01").and("be.disabled");
      });

    cy.get('[data-test="description-field"]')
      .should("be.visible")
      .and("include.text", "app.description")
      .within(() => {
        cy.get("#description")
          .should("have.value", "Testserver 01")
          .and("be.disabled");
      });

    cy.get('[data-test="version-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.version")
      .within(() => {
        cy.get("#version").should("have.value", "2.4.5").and("be.disabled");
      });

    cy.get('[data-test="base-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.base_url")
      .within(() => {
        cy.get("#base_url")
          .should("have.value", "https://localhost/bigbluebutton")
          .and("be.disabled");
      });

    cy.get('[data-test="secret-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.secret")
      .within(() => {
        cy.get("#secret").should("have.value", "123456789").and("be.disabled");
      });

    cy.get('[data-test="strength-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.strength")
      .and("include.text", "admin.servers.strength_description")
      .within(() => {
        cy.get('[data-test="strength-rating"]').should(
          "have.class",
          "p-disabled",
        );

        cy.get('[data-test="strength-rating-option"]').should(
          "have.length",
          10,
        );

        // Check that correct options are active
        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="strength-rating-option"]')
            .eq(i)
            .should("have.attr", "data-p-active", i < 2 ? "true" : "false");
        }
      });

    cy.get('[data-test="status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.status")
      .within(() => {
        cy.get('[data-test="status-dropdown"]')
          .should("have.text", "admin.servers.enabled")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });
    cy.get('[data-test="health-status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.connection")
      .within(() => {
        cy.get("#healthStatus")
          .should("have.value", "admin.servers.online")
          .and("be.disabled");
        cy.get('[data-test="servers-test-connection-button"]')
          .should("be.visible")
          .and("have.text", "admin.servers.test_connection")
          .and("not.be.disabled");
      });

    cy.get('[data-test="meeting-count-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.meeting_count")
      .and("include.text", "admin.servers.meeting_description")
      .within(() => {
        cy.get("#meetingCount").should("have.value", "3").and("be.disabled");
      });

    cy.get('[data-test="own-meeting-count-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.own_meeting_count")
      .and("include.text", "admin.servers.own_meeting_description")
      .within(() => {
        cy.get("#ownMeetingCount").should("have.value", "2").and("be.disabled");
      });

    cy.get('[data-test="participant-count-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.participant_count")
      .within(() => {
        cy.get("#participantCount")
          .should("have.value", "14")
          .and("be.disabled");
      });

    cy.get('[data-test="video-count-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.video_count")
      .within(() => {
        cy.get("#videoCount").should("have.value", "7").and("be.disabled");
      });

    // Check that panic button is hidden (missing permissions)
    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("check serverView shown correctly (server draining)", function () {
    cy.fixture("server.json").then((server) => {
      server.data.status = 0;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check that buttons are hidden (missing permissions)
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    // Check that changed fields are shown correctly
    cy.get('[data-test="status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.status")
      .within(() => {
        cy.get('[data-test="status-dropdown"]')
          .should("have.text", "admin.servers.draining")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });
    cy.get('[data-test="health-status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.connection")
      .within(() => {
        cy.get("#healthStatus")
          .should("have.value", "admin.servers.online")
          .and("be.disabled");
        cy.get('[data-test="servers-test-connection-button"]')
          .should("be.visible")
          .and("have.text", "admin.servers.test_connection")
          .and("not.be.disabled");
      });

    // Check that additional fields are shown
    cy.get('[data-test="meeting-count-field"]').should("be.visible");
    cy.get('[data-test="own-meeting-count-field"]').should("be.visible");
    cy.get('[data-test="participant-count-field"]').should("be.visible");
    cy.get('[data-test="video-count-field"]').should("be.visible");

    // Check that panic button is hidden (missing permissions)
    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("check serverView shown correctly (server disabled)", function () {
    cy.fixture("server.json").then((server) => {
      server.data.status = -1;
      server.data.health = 0;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check that buttons are hidden (missing permissions)
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    // Check that changed fields are shown correctly
    cy.get('[data-test="status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.status")
      .within(() => {
        cy.get('[data-test="status-dropdown"]')
          .should("have.text", "admin.servers.disabled")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="health-status-field"]')
      .should("be.visible")
      .and("include.text", "admin.servers.connection")
      .within(() => {
        cy.get("#healthStatus")
          .should("have.value", "admin.servers.unhealthy")
          .and("be.disabled");
        cy.get('[data-test="servers-test-connection-button"]')
          .should("be.visible")
          .and("have.text", "admin.servers.test_connection")
          .and("not.be.disabled");
      });

    cy.get('[data-test="meeting-count-field"]').should("not.exist");

    cy.get('[data-test="own-meeting-count-field"]').should("not.exist");

    cy.get('[data-test="participant-count-field"]').should("not.exist");

    cy.get('[data-test="video-count-field"]').should("not.exist");

    // Check that panic button is hidden (missing permissions)
    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
        "servers.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check with server enabled
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/servers/1/edit");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "admin.servers.panic");

    // Reload page but with server draining
    cy.fixture("server.json").then((server) => {
      server.data.status = 0;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.reload();

    // Check with server draining
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/servers/1/edit");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "admin.servers.panic");

    // Reload page but with server disabled
    cy.fixture("server.json").then((server) => {
      server.data.status = -1;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.reload();

    // Check with server disabled
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/servers/1/edit");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "servers.view",
        "servers.update",
        "servers.create",
        "servers.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check with server enabled
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/servers/1/edit");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "admin.servers.panic");

    // Reload page but with server draining
    cy.fixture("server.json").then((server) => {
      server.data.status = 0;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.reload();

    // Check with server draining
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/servers/1/edit");
    cy.get('[data-test="servers-delete-button"]').should("not.exist");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "admin.servers.panic");

    // Reload page but with server disabled
    cy.fixture("server.json").then((server) => {
      server.data.status = -1;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.reload();

    // Check with server disabled
    cy.get('[data-test="servers-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="servers-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "app.edit")
      .and("have.attr", "href", "/admin/servers/1/edit");
    cy.get('[data-test="servers-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled");

    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("open view errors", function () {
    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("serverRequest");

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 200,
      fixture: "server.json",
    }).as("serverRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@serverRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload page with 404 errors
    cy.interceptAdminServersIndexRequests();

    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("serverRequest");

    cy.reload();

    cy.wait("@serverRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/servers/1");
    cy.url().should("include", "/admin/servers");

    cy.wait("@serversRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/servers/1", {
      statusCode: 401,
    }).as("serverRequest");

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/1");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
