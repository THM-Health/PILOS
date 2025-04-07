import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin room types index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminRoomTypesIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/room_types");
  });

  it("load room types", function () {
    const roomTypesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roomTypes*",
      { fixture: "roomTypes.json" },
      "roomTypesRequest",
    );
    cy.visit("/admin/room_types");

    cy.contains("admin.title");

    // Test loading
    cy.get('[data-test="room-type-search"]').within(() => {
      cy.get("input").should("be.visible").and("be.disabled");
      cy.get("button").should("be.visible").and("be.disabled");
    });

    cy.get('[data-test="room-types-add-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        roomTypesRequest.sendResponse();
      });

    cy.wait("@roomTypesRequest");

    // Check that loading is over
    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get('[data-test="room-type-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.get('[data-test="room-types-add-button"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.room_types.index");

    // Check that table headers are displayed correctly
    cy.get('[data-test="room-type-header-cell"]').should("have.length", 1);

    cy.get('[data-test="room-type-header-cell"]')
      .eq(0)
      .should("have.text", "app.model_name");

    // Check that room types are displayed correctly
    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Lecture");
      });
  });

  it("load room types errors", function () {
    cy.intercept("GET", "api/v1/roomTypes*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomTypesRequest");

    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="room-type-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.intercept("GET", "api/v1/roomTypes*", {
      statusCode: 200,
      fixture: "roomTypes.json",
    }).as("roomTypesRequest");

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@roomTypesRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that room types are shown and contain the correct data
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]').eq(0).should("include.text", "Exam");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Lecture");

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/roomTypes*", {
      statusCode: 401,
    }).as("roomTypesRequest");

    cy.reload();

    cy.wait("@roomTypesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/room_types");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load room types with no data", function () {
    cy.fixture("roomTypes.json").then((roomTypes) => {
      roomTypes.data = [];
      cy.intercept("GET", "api/v1/roomTypes*", {
        statusCode: 200,
        body: roomTypes,
      }).as("roomTypesRequest");
    });

    cy.visit("/admin/room_types");
  });

  it("room type search and sorting", function () {
    cy.visit("/admin/room_types");

    // Check that all room types are shown
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]').eq(0).should("include.text", "Exam");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Lecture");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct room types are shown
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .should("include.text", "Meeting");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Seminar");

    // Enter search query with no results
    cy.get('[data-test="room-type-search"]').within(() => {
      cy.get("input").type("Search without results");
      cy.get("button").click();
    });

    // Check that no room types and correct message are shown
    cy.get('[data-test="room-type-item"]').should("have.length", 0);
    cy.contains("admin.room_types.no_data_filtered").should("be.visible");

    // Change search query
    cy.get('[data-test="room-type-search"]').within(() => {
      cy.get("input").clear();
      cy.get("input").type("Exam");
      cy.get("button").click();
    });

    // Check that correct room types are shown
    cy.get('[data-test="room-type-item"]').should("have.length", 1);
    cy.get('[data-test="room-type-item"]').eq(0).should("include.text", "Exam");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 1);

    // Check that correct pagination is active (page is reset to first page)
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Change search query
    cy.get('[data-test="room-type-search"]').within(() => {
      cy.get("input").clear();
      cy.get("input").type("e");
      cy.get("input").type("{enter}");
    });

    // Check that correct room types are shown
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]').eq(0).should("include.text", "Exam");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Lecture");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .should("include.text", "Meeting");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Seminar");

    // Change sort order
    cy.get('[data-test="room-type-header-cell"]').eq(0).click();

    // Check that correct room types are shown
    cy.get('[data-test="room-type-item"]').should("have.length", 2);
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .should("include.text", "Seminar");
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .should("include.text", "Meeting");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active (page is reset to first page)
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("check button visibility with view permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "roomTypes.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-add-button"]').should("not.exist");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3");
        cy.get('[data-test="room-types-edit-button"]').should("not.exist");
        cy.get('[data-test="room-types-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1");
        cy.get('[data-test="room-types-edit-button"]').should("not.exist");
        cy.get('[data-test="room-types-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-add-button"]').should("not.exist");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3");
        cy.get('[data-test="room-types-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3/edit");
        cy.get('[data-test="room-types-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1");
        cy.get('[data-test="room-types-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1/edit");
        cy.get('[data-test="room-types-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with add permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
        "roomTypes.create",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types/new");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3");
        cy.get('[data-test="room-types-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3/edit");
        cy.get('[data-test="room-types-delete-button"]').should("not.exist");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1");
        cy.get('[data-test="room-types-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1/edit");
        cy.get('[data-test="room-types-delete-button"]').should("not.exist");
      });
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
        "roomTypes.create",
        "roomTypes.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-add-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/room_types/new");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3");
        cy.get('[data-test="room-types-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/3/edit");
        cy.get('[data-test="room-types-delete-button"]').should("be.visible");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-types-view-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1");
        cy.get('[data-test="room-types-edit-button"]')
          .should("be.visible")
          .and("have.attr", "href", "/admin/room_types/1/edit");
        cy.get('[data-test="room-types-delete-button"]').should("be.visible");
      });
  });
});
