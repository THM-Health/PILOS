import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin server pools view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminServerPoolsViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "servers.viewAny",
        "serverPools.viewAny",
        "serverPools.view",
        "serverPools.update",
        "serverPools.create",
        "serverPools.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("delete server pool", function () {
    cy.visit("/admin/server_pools/1");

    cy.wait("@serverPoolRequest");

    cy.get('[data-test="server-pools-delete-dialog"]').should("not.exist");

    cy.get('[data-test="server-pools-delete-button"]').click();

    cy.get('[data-test="server-pools-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="server-pools-delete-dialog"]')
      .should("include.text", "admin.server_pools.delete.title")
      .should(
        "include.text",
        'admin.server_pools.delete.confirm_{"name":"Test"}',
      );

    // Confirm delete of server pool
    const deleteServerPoolRequest = interceptIndefinitely(
      "DELETE",
      "api/v1/serverPools/1",
      { statusCode: 204 },
      "deleteServerPoolRequest",
    );

    cy.fixture("serverPools.json").then((serverPools) => {
      serverPools.data = serverPools.data.slice(1, 2);
      serverPools.meta.to = 1;
      serverPools.meta.total = 1;
      serverPools.meta.total_no_filter = 1;

      cy.intercept("GET", "api/v1/serverPools*", {
        statusCode: 200,
        body: serverPools,
      }).as("serverPoolsRequest");
    });

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    // Check loading
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .and("be.disabled");

    cy.get('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        deleteServerPoolRequest.sendResponse();
      });

    cy.wait("@deleteServerPoolRequest");
    cy.wait("@serverPoolsRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/server_pools/1");
    cy.url().should("include", "/admin/server_pools");
  });

  it("delete server pool errors", function () {
    cy.visit("/admin/server_pools/1");
    cy.wait("@serverPoolRequest");

    cy.get('[data-test="server-pools-delete-dialog"]').should("not.exist");

    cy.get('[data-test="server-pools-delete-button"]').click();

    cy.get('[data-test="server-pools-delete-dialog"]').should("be.visible");

    // Check room type attached (428 error)
    cy.intercept("DELETE", "api/v1/serverPools/1", {
      statusCode: 428,
      body: {
        error: 428,
        message: "app.errors.server_pool_delete_failed",
        room_types: [
          {
            id: 1,
            name: "Lecture",
            description: null,
            color: "#80BA27",
            model_name: "RoomType",
            updated_at: "2021-01-12T14:35:11.000000Z",
          },
          {
            id: 2,
            name: "Meeting",
            description: null,
            color: "#4a5c66",
            model_name: "RoomType",
            updated_at: "2021-01-12T14:35:11.000000Z",
          },
        ],
      },
    });

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.get('[data-test="server-pools-delete-dialog"]').should("be.visible");

    // Check that error is shown correctly
    cy.get('[data-test="server-pools-delete-dialog"]')
      .should("include.text", "admin.server_pools.delete.failed")
      .and("include.text", "Lecture")
      .and("include.text", "Meeting");

    // Check that action buttons are hidden
    cy.get('[data-test="dialog-cancel-button"]').should("not.exist");
    cy.get('[data-test="dialog-continue-button"]').should("not.exist");

    // Close dialog
    cy.get('[data-test="dialog-header-close-button"]').click();

    cy.get('[data-test="server-pools-delete-dialog"]').should("not.exist");

    // Open dialog again
    cy.get('[data-test="server-pools-delete-button"]').click();

    // Check with 500 error
    cy.intercept("DELETE", "api/v1/serverPools/1", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteServerPoolRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteServerPoolRequest");

    // Check that dialog is still open and that error message is shown
    cy.get('[data-test="server-pools-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check with 401 error
    cy.intercept("DELETE", "api/v1/serverPools/1", {
      statusCode: 401,
    }).as("deleteServerPoolRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteServerPoolRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/server_pools/1");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("switch between edit and view", function () {
    cy.visit("/admin/server_pools/1/edit");

    cy.wait("@serverPoolRequest");
    cy.wait("@serversRequest");

    // Check values and change them
    cy.get("#name").should("not.be.disabled").and("have.value", "Test").clear();
    cy.get("#name").type("Server Pool 1");

    cy.get("#description")
      .should("not.be.disabled")
      .and("have.value", "Pool for testing")
      .clear();
    cy.get("#description").type("Server Pool 1 description");

    cy.get('[data-test="server-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="server-chip"]').should("have.length", 2);
        cy.get('[data-test="server-chip"]')
          .eq(0)
          .should("include.text", "Server 01")
          .find('[data-test="remove-server-button"]')
          .should("be.visible");
        cy.get('[data-test="server-chip"]')
          .eq(1)
          .should("include.text", "Server 02")
          .find('[data-test="remove-server-button"]')
          .should("be.visible");
      });

    cy.get('[data-test="server-dropdown"]').click();
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(2).click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="server-dropdown"]').within(() => {
      cy.get('[data-test="server-chip"]').should("have.length", 3);
      cy.get('[data-test="server-chip"]')
        .eq(0)
        .should("include.text", "Server 01")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");

      cy.get('[data-test="server-chip"]')
        .eq(1)
        .should("include.text", "Server 02")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");
      cy.get('[data-test="server-chip"]')
        .eq(2)
        .should("include.text", "Server 03")
        .find('[data-test="remove-server-button"]')
        .should("be.visible");
    });

    // Close dropdown
    cy.get(".multiselect__select").click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Check that save button is shown
    cy.get('[data-test="server-pools-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Switch to view
    cy.get('[data-test="server-pools-cancel-edit-button"]').click();

    // Check if redirected to view page
    cy.url().should("include", "/admin/server_pools/1");
    cy.url().should("not.include", "/edit");

    cy.wait("@serverPoolRequest");

    // Check that changes were not saved
    cy.get("#name").should("be.disabled").and("have.value", "Test");
    cy.get("#description")
      .should("be.disabled")
      .and("have.value", "Pool for testing");

    cy.get('[data-test="server-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="server-chip"]').should("have.length", 2);
        cy.get('[data-test="server-chip"]')
          .eq(0)
          .should("include.text", "Server 01")
          .find('[data-test="remove-server-button"]')
          .should("not.exist");
        cy.get('[data-test="server-chip"]')
          .eq(1)
          .should("include.text", "Server 02")
          .find('[data-test="remove-server-button"]')
          .should("not.exist");
      });

    // Check that save button is hidden
    cy.get('[data-test="server-pools-save-button"]').should("not.exist");

    // Switch back to edit
    cy.get('[data-test="server-pools-edit-button"]').click();

    // Check if redirected to edit page
    cy.url().should("include", "/admin/server_pools/1/edit");

    cy.wait("@serverPoolRequest");
    cy.wait("@serversRequest");

    // Check that original values are shown
    cy.get("#name").should("not.be.disabled").and("have.value", "Test");
    cy.get("#description")
      .should("not.be.disabled")
      .and("have.value", "Pool for testing");

    cy.get('[data-test="server-dropdown"]')
      .should("not.have.class", "multiselect--disabled")
      .within(() => {
        cy.get('[data-test="server-chip"]').should("have.length", 2);
        cy.get('[data-test="server-chip"]')
          .eq(0)
          .should("include.text", "Server 01")
          .find('[data-test="remove-server-button"]')
          .should("be.visible");
        cy.get('[data-test="server-chip"]')
          .eq(1)
          .should("include.text", "Server 02")
          .find('[data-test="remove-server-button"]')
          .should("be.visible");
      });

    // Check that save button is shown
    cy.get('[data-test="server-pools-save-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });
});
