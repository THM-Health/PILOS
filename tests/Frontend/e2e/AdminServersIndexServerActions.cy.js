import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin servers index server actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServersIndexRequests();

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
    cy.fixture("servers.json").then((servers) => {
      servers.data[3].status = -1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });
    cy.visit("admin/servers");
    cy.wait("@serversRequest");

    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");

    cy.get('[data-test="server-item"]')
      .eq(3)
      .find('[data-test="servers-delete-button"]')
      .click();

    cy.get('[data-test="servers-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="servers-delete-dialog"]')
      .should("include.text", "admin.servers.delete.title")
      .should(
        "include.text",
        'admin.servers.delete.confirm_{"name":"Server 04"}',
      );

    // Confirm delete of server
    const deleteServerRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/servers/4",
      { statusCode: 204 },
      "deleteServerRequest",
    );

    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 3);
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

    // Check that server was deleted
    cy.get('[data-test="server-item"]').should("have.length", 3);

    // Check that dialog is closed
    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");

    // Reopen dialog for different user
    cy.get('[data-test="server-item"]')
      .eq(2)
      .find('[data-test="servers-delete-button"]')
      .click();

    cy.get('[data-test="servers-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="servers-delete-dialog"]')
      .should("include.text", "admin.servers.delete.title")
      .should(
        "include.text",
        'admin.servers.delete.confirm_{"name":"Server 03"}',
      );

    // Cancel delete of server
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");
  });

  it("delete server errors", function () {
    cy.visit("admin/servers");
    cy.wait("@serversRequest");

    cy.get('[data-test="server-item"]').should("have.length", 4);

    cy.get('[data-test="servers-delete-dialog"]').should("not.exist");

    cy.get('[data-test="server-item"]')
      .eq(2)
      .find('[data-test="servers-delete-button"]')
      .click();

    cy.get('[data-test="servers-delete-dialog"]').should("be.visible");

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/servers/3", {
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
    cy.intercept("DELETE", "api/v1/servers/3", {
      statusCode: 401,
    }).as("deleteServerRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteServerRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/servers");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("reload servers", function () {
    cy.visit("/admin/servers");

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        update_usage: "false",
        page: "1",
      });
    });

    // Check that usage is shown correctly
    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').eq(4).should("have.text", "2");

        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "10");
        cy.get('[data-test="server-item-cell"]').eq(6).should("have.text", "5");
      });

    // Reload with update usage and check that query is correct and respond with 4 servers on 4 different pages
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(0, 1);
      servers.data[0].meeting_count = 3;
      servers.data[0].participant_count = 50;
      servers.data[0].video_count = 6;
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 1;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    // Reload with update usage
    cy.get('[data-test="servers-reload-usage-button"]').click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        update_usage: "true",
        page: "1",
      });
    });

    // Check that usage is shown correctly
    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').eq(4).should("have.text", "3");
        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "50");
        cy.get('[data-test="server-item-cell"]').eq(6).should("have.text", "6");
      });

    // Change page and check that usage is not updated
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(1, 2);
      servers.meta.current_page = 2;
      servers.meta.from = 2;
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        update_usage: "false",
        page: "2",
      });
    });

    // Check that usage is shown correctly
    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-item-cell"]')
          .eq(4)
          .should("have.text", "10");
        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "50");
        cy.get('[data-test="server-item-cell"]').eq(6).should("have.text", "5");
      });

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Reload with update usage again and check that page stays the same
    cy.fixture("servers.json").then((servers) => {
      servers.data = servers.data.slice(1, 2);
      servers.data[0].meeting_count = 6;
      servers.data[0].participant_count = 60;
      servers.data[0].video_count = 10;
      servers.meta.current_page = 2;
      servers.meta.from = 2;
      servers.meta.last_page = 4;
      servers.meta.per_page = 1;
      servers.meta.to = 2;

      cy.intercept("GET", "api/v1/servers*", {
        statusCode: 200,
        body: servers,
      }).as("serversRequest");
    });
    cy.get('[data-test="servers-reload-usage-button"]').click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        update_usage: "true",
        page: "2",
      });
    });

    // Check that usage is shown correctly
    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').eq(4).should("have.text", "6");
        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "60");
        cy.get('[data-test="server-item-cell"]')
          .eq(6)
          .should("have.text", "10");
      });

    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Reload without update usage and check that page stays the same
    cy.get('[data-test="servers-reload-no-usage-button"]').click();

    cy.wait("@serversRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        update_usage: "false",
        page: "2",
      });
    });

    // Check that usage is shown correctly
    cy.get('[data-test="server-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="server-item-cell"]').eq(4).should("have.text", "6");
        cy.get('[data-test="server-item-cell"]')
          .eq(5)
          .should("have.text", "60");
        cy.get('[data-test="server-item-cell"]')
          .eq(6)
          .should("have.text", "10");
      });

    cy.get('[data-test="paginator-page"]').should("have.length", 4);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");
  });

  it("open add new server page", function () {
    cy.visit("/admin/servers");

    cy.wait("@serversRequest");

    cy.get('[data-test="servers-add-button"]').click();

    cy.url().should("include", "/admin/servers/new");
  });

  it("open edit server page", function () {
    cy.visit("/admin/servers");

    cy.wait("@serversRequest");

    cy.interceptAdminServersViewRequests();

    cy.get('[data-test="server-item"]')
      .eq(0)
      .find('[data-test="servers-edit-button"]')
      .click();

    cy.url().should("include", "/admin/servers/1/edit");
  });

  it("open view server page", function () {
    cy.visit("/admin/servers");

    cy.wait("@serversRequest");

    cy.interceptAdminServersViewRequests();

    cy.get('[data-test="server-item"]')
      .eq(0)
      .find('[data-test="servers-view-button"]')
      .click();

    cy.url().should("include", "/admin/servers/1");
    cy.url().should("not.include", "/edit");
  });
});
