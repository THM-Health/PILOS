import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin servers view server actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServersViewRequests();

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
  });

  it("delete server", function () {
    cy.fixture("server.json").then((server) => {
      server.data.status = -1;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");

    cy.get('[data-test="servers-delete-button"]').click();

    cy.get('[data-test="servers-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="servers-delete-dialog"]')
      .should("include.text", "admin.servers.delete.title")
      .should(
        "include.text",
        'admin.servers.delete.confirm_{"name":"Server 01"}',
      );

    // Confirm delete of server
    const deleteServerRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/servers/1",
      { statusCode: 204 },
      "deleteServerRequest",
    );

    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(1, 4);
      servers.meta.to = 3;
      servers.meta.total = 3;
      servers.meta.total_no_filter = 3;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
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
        deleteServerRequest.sendResponse();
      });

    cy.wait("@deleteServerRequest");
    cy.wait("@serversRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/servers/1");
    cy.url().should("include", "/admin/servers");

    // Check that server was deleted
    cy.get('[data-test="server-item"]').should("have.length", 3);

    // Check that dialog is closed
    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");
  });

  it("delete server errors", function () {
    cy.fixture("server.json").then((server) => {
      server.data.status = -1;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");

    cy.get('[data-test="servers-delete-button"]').click();

    cy.get('[data-test="servers-delete-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/servers/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteServerRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteServerRequest");

    // Check that dialog is still open and that error message is shown
    cy.get('[data-test="servers-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("DELETE", "api/v1/servers/1", {
      statusCode: 401,
    }).as("deleteServerRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteServerRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/1");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("check connection", function () {
    cy.visit("/admin/servers/1");
    cy.wait("@serverRequest");

    cy.get("#healthStatus")
      .should("have.value", "admin.servers.online")
      .and("be.disabled");

    // Check connection
    const checkConnectionRequest = interceptIndefinitely(
      "POST",
      "api/v1/servers/check",
      {
        statusCode: 200,
        body: {
          connection_ok: false,
          secret_ok: false,
        },
      },
      "checkConnectionRequest",
    );

    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.visible")
      .and("have.text", "admin.servers.test_connection")
      .and("not.be.disabled")
      .click();

    // Check loading (offline)
    cy.get('[data-test="servers-test-connection-button"]')
      .should("be.disabled")
      .then(() => {
        checkConnectionRequest.sendResponse();
      });

    cy.wait("@checkConnectionRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        base_url: "https://localhost/bigbluebutton",
        secret: "123456789",
      });
    });

    // Check that loading is finished
    cy.get('[data-test="servers-test-connection-button"]').should(
      "not.be.disabled",
    );

    // Check that connection status is updated
    cy.get("#healthStatus")
      .should("have.value", "admin.servers.offline")
      .and("be.disabled");

    cy.get('[data-test="health-status-field"]').should(
      "include.text",
      "admin.servers.offline_reason.connection",
    );

    // Check connection again (wrong  secret)
    cy.intercept("POST", "api/v1/servers/check", {
      statusCode: 200,
      body: {
        connection_ok: true,
        secret_ok: false,
      },
    }).as("checkConnectionRequest");

    cy.get('[data-test="servers-test-connection-button"]').click();

    cy.wait("@checkConnectionRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        base_url: "https://localhost/bigbluebutton",
        secret: "123456789",
      });
    });

    // Check that connection status is updated
    cy.get("#healthStatus")
      .should("have.value", "admin.servers.offline")
      .and("be.disabled");

    cy.get('[data-test="health-status-field"]').should(
      "include.text",
      "admin.servers.offline_reason.secret",
    );

    // Check connection again (valid connection)
    cy.intercept("POST", "api/v1/servers/check", {
      statusCode: 200,
      body: {
        connection_ok: true,
        secret_ok: true,
      },
    }).as("checkConnectionRequest");

    cy.get('[data-test="servers-test-connection-button"]').click();

    cy.wait("@checkConnectionRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        base_url: "https://localhost/bigbluebutton",
        secret: "123456789",
      });
    });

    // Check that connection status is updated
    cy.get("#healthStatus")
      .should("have.value", "admin.servers.online")
      .and("be.disabled");

    cy.get('[data-test="health-status-field"]').should(
      "not.include.text",
      "admin.servers.offline_reason",
    );
  });

  it("check connection errors", function () {
    cy.visit("/admin/servers/1");
    cy.wait("@serverRequest");

    cy.get("#healthStatus")
      .should("have.value", "admin.servers.online")
      .and("be.disabled");

    // Check with 500 error
    cy.intercept("POST", "api/v1/servers/check", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("checkConnectionRequest");

    cy.get('[data-test="servers-test-connection-button"]').click();

    cy.wait("@checkConnectionRequest");

    // Check that connection status is updated
    cy.get("#healthStatus")
      .should("have.value", "admin.servers.unknown")
      .and("be.disabled");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("POST", "api/v1/servers/check", {
      statusCode: 401,
    }).as("checkConnectionRequest");

    cy.get('[data-test="servers-test-connection-button"]').click();

    cy.wait("@checkConnectionRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/1");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("panic", function () {
    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    const panicRequest = interceptIndefinitely(
      "GET",
      "api/v1/servers/1/panic",
      {
        statusCode: 200,
        body: {
          total: 5,
          success: 3,
        },
      },
      "panicRequest",
    );

    cy.fixture("server.json").then((server) => {
      server.data.status = -1;
      server.data.health = null;
      server.data.participant_count = null;
      server.data.listener_count = null;
      server.data.voice_participant_count = null;
      server.data.video_count = null;
      server.data.meeting_count = null;
      server.data.own_meeting_count = 0;
      server.data.version = null;

      cy.intercept("GET", "api/v1/servers/1", {
        statusCode: 200,
        body: server,
      }).as("serverRequest");
    });

    cy.get('[data-test="servers-panic-button"]').click();

    cy.get('[data-test="servers-panic-button"]')
      .should("be.disabled")
      .then(() => {
        panicRequest.sendResponse();
      });

    cy.wait("@panicRequest");
    cy.wait("@serverRequest");

    // Check that toast message is shown
    cy.checkToastMessage([
      'admin.servers.flash.panic.description_{"total":5,"success":3}',
      "admin.servers.flash.panic.title",
    ]);

    // Check that server status is updated
    cy.get('[data-test="status-dropdown"]').should(
      "have.text",
      "admin.servers.disabled",
    );

    // Check that server health is updated
    cy.get("#healthStatus")
      .should("have.value", "admin.servers.unknown")
      .and("be.disabled");

    cy.get('[data-test="meeting-count-field"]').should("not.exist");

    cy.get('[data-test="own-meeting-count-field"]').should("not.exist");

    cy.get('[data-test="participant-count-field"]').should("not.exist");

    cy.get('[data-test="video-count-field"]').should("not.exist");

    // Check that panic button is hidden (missing permissions)
    cy.get('[data-test="servers-panic-button"]').should("not.exist");
  });

  it("panic errors", function () {
    cy.visit("/admin/servers/1");

    cy.wait("@serverRequest");

    // Check with 500 error
    cy.intercept("GET", "api/v1/servers/1/panic", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("panicRequest");

    cy.get('[data-test="servers-panic-button"]').click();

    cy.wait("@panicRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("GET", "api/v1/servers/1/panic", {
      statusCode: 401,
    }).as("panicRequest");

    cy.get('[data-test="servers-panic-button"]').click();

    cy.wait("@panicRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers/1");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("switch between edit and view", function () {
    cy.visit("/admin/servers/1/edit");

    cy.wait("@serverRequest");

    // Check values and change them
    cy.get("#name")
      .should("not.be.disabled")
      .and("have.value", "Server 01")
      .clear();
    cy.get("#name").type("Server 02");
    cy.get("#description")
      .should("not.be.disabled")
      .and("have.value", "Testserver 01")
      .clear();
    cy.get("#description").type("Testserver 02 for testing purposes");
    cy.get("#base_url")
      .should("not.be.disabled")
      .and("have.value", "https://localhost/bigbluebutton")
      .clear();
    cy.get("#base_url").type("https://localhost/bigbluebutton2");
    cy.get("#secret")
      .should("not.be.disabled")
      .and("have.value", "123456789")
      .clear();
    cy.get("#secret").type("Secret123456789");
    cy.get('[data-test="strength-rating"]').should(
      "not.have.class",
      "p-disabled",
    );
    for (let i = 0; i < 10; i++) {
      cy.get('[data-test="strength-rating-option"]')
        .eq(i)
        .should("have.attr", "data-p-active", i < 2 ? "true" : "false");
    }
    cy.get('[data-test="strength-rating-option"]').eq(5).click();
    cy.get('[data-test="status-dropdown"]')
      .should("include.text", "admin.servers.enabled")
      .within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });
    cy.get('[data-test="status-dropdown-items"]').should("not.exist");
    cy.get('[data-test="status-dropdown"]').click();
    cy.get('[data-test="status-dropdown-items"]').should("be.visible");
    cy.get('[data-test="status-dropdown-option"]').eq(2).click();

    // Check that other fields are hidden
    cy.get('[data-test="meeting-count-field"]').should("not.exist");

    cy.get('[data-test="own-meeting-count-field"]').should("not.exist");

    cy.get('[data-test="participant-count-field"]').should("not.exist");

    cy.get('[data-test="video-count-field"]').should("not.exist");

    // Check that panic button is hidden
    cy.get('[data-test="servers-panic-button"]').should("not.exist");

    // Check that save button is shown
    cy.get('[data-test="servers-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="servers-cancel-edit-button"]').click();

    // Check if redirected to view page
    cy.url().should("include", "/admin/servers/1");
    cy.url().should("not.include", "/edit");

    cy.wait("@serverRequest");

    // Check that changes were not saved
    cy.get("#name").should("be.disabled").and("have.value", "Server 01");
    cy.get("#description")
      .should("be.disabled")
      .and("have.value", "Testserver 01");
    cy.get("#base_url")
      .should("be.disabled")
      .and("have.value", "https://localhost/bigbluebutton");
    cy.get("#secret").should("be.disabled").and("have.value", "123456789");
    cy.get('[data-test="strength-rating"]').should("have.class", "p-disabled");
    for (let i = 0; i < 10; i++) {
      cy.get('[data-test="strength-rating-option"]')
        .eq(i)
        .should("have.attr", "data-p-active", i < 2 ? "true" : "false");
    }
    cy.get('[data-test="status-dropdown"]')
      .should("include.text", "admin.servers.enabled")
      .within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

    // Check that other fields and panic button are shown
    cy.get("#meetingCount")
      .should("have.value", "3")
      .and("be.visible")
      .and("be.disabled");
    cy.get("#ownMeetingCount")
      .should("have.value", "2")
      .and("be.visible")
      .and("be.disabled");
    cy.get("#participantCount")
      .should("have.value", "14")
      .and("be.visible")
      .and("be.disabled");
    cy.get("#videoCount")
      .should("have.value", "7")
      .and("be.visible")
      .and("be.disabled");
    cy.get('[data-test="servers-panic-button"]').should("be.visible");

    // Check that save button is hidden
    cy.get('[data-test="servers-save-button"]').should("not.exist");

    // Switch back to edit
    cy.get('[data-test="servers-edit-button"]').click();

    // Check if redirected to edit page
    cy.url().should("include", "/admin/servers/1/edit");

    cy.wait("@serverRequest");

    // Check that original values are shown
    cy.get("#name").should("not.be.disabled").and("have.value", "Server 01");
    cy.get("#description")
      .should("not.be.disabled")
      .and("have.value", "Testserver 01");
    cy.get("#base_url")
      .should("not.be.disabled")
      .and("have.value", "https://localhost/bigbluebutton");
    cy.get("#secret").should("not.be.disabled").and("have.value", "123456789");
    cy.get('[data-test="strength-rating"]').should(
      "not.have.class",
      "p-disabled",
    );
    for (let i = 0; i < 10; i++) {
      cy.get('[data-test="strength-rating-option"]')
        .eq(i)
        .should("have.attr", "data-p-active", i < 2 ? "true" : "false");
    }
    cy.get('[data-test="status-dropdown"]')
      .should("include.text", "admin.servers.enabled")
      .within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });
    // Check that other fields are hidden
    cy.get('[data-test="meeting-count-field"]').should("not.exist");

    cy.get('[data-test="own-meeting-count-field"]').should("not.exist");

    cy.get('[data-test="participant-count-field"]').should("not.exist");

    cy.get('[data-test="video-count-field"]').should("not.exist");

    // Check that panic button is hidden
    cy.get('[data-test="servers-panic-button"]').should("not.exist");

    // Check that save button is shown
    cy.get('[data-test="servers-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });
});
