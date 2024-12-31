import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Meetings index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptMeetingsIndexRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAny", "meetings.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/meetings");
  });

  it("visit with user without permission to view meetings", function () {
    cy.intercept("GET", "api/v1/currentUser", {
      statusCode: 200,
      fixture: "currentUser.json",
    });

    cy.visit("/meetings");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/meetings");
    cy.get("h1").should("be.visible").and("contain", "home.title");
  });

  it("load meetings", function () {
    const meetingsRequest = interceptIndefinitely(
      "GET",
      "api/v1/meetings*",
      { fixture: "meetings.json" },
      "meetingsRequest",
    );

    cy.visit("/meetings");

    cy.contains("meetings.currently_running").should("be.visible");

    // Test loading
    cy.get('[data-test="meeting-search"]').within(() => {
      cy.get("input").should("be.visible").and("be.disabled");
      cy.get("button").should("be.visible").and("be.disabled");
    });

    cy.get('[data-test="meetings-reload-button"]')
      .should("be.visible")
      .and("be.disabled");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        meetingsRequest.sendResponse();
      });

    cy.wait("@meetingsRequest");

    // Check that loading is over
    cy.get('[data-test="meeting-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.get('[data-test="meetings-reload-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that headers are displayed correctly
    cy.get('[data-test="meeting-header-cell"]').should("have.length", 9);

    cy.get('[data-test="meeting-header-cell"]')
      .eq(0)
      .should("have.text", "meetings.start");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(1)
      .should("have.text", "rooms.name");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(2)
      .should("have.text", "meetings.owner");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(3)
      .should("have.text", "app.server");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(4)
      .within(() => {
        cy.get(".fa-users").should("be.visible");
      });
    cy.get('[data-test="meeting-header-cell"]')
      .eq(5)
      .within(() => {
        cy.get(".fa-headphones").should("be.visible");
      });
    cy.get('[data-test="meeting-header-cell"]')
      .eq(6)
      .within(() => {
        cy.get(".fa-microphone").should("be.visible");
      });
    cy.get('[data-test="meeting-header-cell"]')
      .eq(7)
      .within(() => {
        cy.get(".fa-video").should("be.visible");
      });
    cy.get('[data-test="meeting-header-cell"]')
      .eq(8)
      .should("have.text", "app.actions");

    // Check that meetings are displayed correctly
    cy.get('[data-test="meeting-item"]').should("have.length", 3);

    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="meeting-item-cell"]').should("have.length", 9);

        cy.get('[data-test="meeting-item-cell"]')
          .eq(0)
          .should("have.text", "02/12/2021, 19:09");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(1)
          .should("have.text", "Meeting One");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(2)
          .should("have.text", "John Doe");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(3)
          .should("have.text", "Server 01");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(4)
          .should("have.text", "10");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(5)
          .should("have.text", "5");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(6)
          .should("have.text", "5");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(7)
          .should("have.text", "3");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(8)
          .within(() => {
            cy.get('[data-test="meeting-view-room-button"]')
              .should("be.visible")
              .and("have.attr", "href", "/rooms/abc-def-123");
          });
      });

    cy.get('[data-test="meeting-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="meeting-item-cell"]').should("have.length", 9);

        cy.get('[data-test="meeting-item-cell"]')
          .eq(0)
          .should("have.text", "02/12/2021, 19:10");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(1)
          .should("have.text", "Meeting Two");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(2)
          .should("have.text", "Max Doe");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(3)
          .should("have.text", "Server 02");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(4)
          .should("have.text", "50");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(5)
          .should("have.text", "30");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(6)
          .should("have.text", "20");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(7)
          .should("have.text", "10");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(8)
          .within(() => {
            cy.get('[data-test="meeting-view-room-button"]')
              .should("be.visible")
              .and("have.attr", "href", "/rooms/def-abc-123");
          });
      });

    cy.get('[data-test="meeting-item"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="meeting-item-cell"]').should("have.length", 9);

        cy.get('[data-test="meeting-item-cell"]')
          .eq(0)
          .should("have.text", "02/12/2021, 18:14");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(1)
          .should("have.text", "Meeting Three");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(2)
          .should("have.text", "John Doe");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(3)
          .should("have.text", "Server 01");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(4)
          .should("include.text", "---");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(5)
          .should("include.text", "---");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(6)
          .should("include.text", "---");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(7)
          .should("include.text", "---");

        cy.get('[data-test="meeting-item-cell"]')
          .eq(8)
          .within(() => {
            cy.get('[data-test="meeting-view-room-button"]')
              .should("be.visible")
              .and("have.attr", "href", "/rooms/def-abc-456");
          });
      });
  });

  it("load meetings errors", function () {
    cy.intercept("GET", "api/v1/meetings*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("meetingsRequest");

    cy.visit("/meetings");

    cy.wait("@meetingsRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="meeting-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.get('[data-test="meetings-reload-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Reload with correct data
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("include.text", "app.reload")
      .click();

    cy.wait("@meetingsRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that meeting is shown and contains the correct data
    cy.get('[data-test="meeting-item"]').should("have.length", 1);

    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/meetings*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("meetingsRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    cy.get('[data-test="meeting-search"]').within(() => {
      cy.get("input").should("be.visible").and("not.be.disabled");
      cy.get("button").should("be.visible").and("not.be.disabled");
    });

    cy.get('[data-test="meetings-reload-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Reload with correct data
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("include.text", "app.reload")
      .click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that meeting is shown and contains the correct data
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/meetings*", {
      statusCode: 401,
    }).as("meetingsRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@meetingsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/meetings");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/meetings");

    cy.wait("@meetingsRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/meetings");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load meetings page out of bounds", function () {
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 2;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;
      meetings.meta.total = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.visit("/meetings");

    cy.wait("@meetingsRequest");

    // Switch to next page but respond with no meetings on second page
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = [];
      meetings.meta.current_page = 2;
      meetings.meta.from = null;
      meetings.meta.per_page = 2;
      meetings.meta.to = null;
      meetings.meta.total = 2;
      meetings.meta.total_no_filter = 2;

      const emptyMeetingsRequest = interceptIndefinitely(
        "GET",
        "api/v1/meetings*",
        {
          statusCode: 200,
          body: meetings,
        },
        "meetingsRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("meetings.json").then((meetings) => {
        meetings.data = meetings.data.slice(0, 2);
        meetings.meta.per_page = 2;
        meetings.meta.to = 2;
        meetings.meta.total = 2;
        meetings.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/meetings*", {
          statusCode: 200,
          body: meetings,
        })
          .as("meetingsRequest")
          .then(() => {
            emptyMeetingsRequest.sendResponse();
          });
      });
    });

    // Wait for first meetings request and check that pge is still the same
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second request and check that page is reset
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that pagination is shown correctly
    cy.get('[data-test="paginator-page"]').should("have.length", 1);
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("meeting search", function () {
    cy.visit("/meetings");
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query.search).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no meetings found for this search query
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = [];
      meetings.meta.from = null;
      meetings.meta.per_page = 1;
      meetings.meta.to = null;
      meetings.meta.total = 0;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-search"] > input').should("have.value", "");
    cy.get('[data-test="meeting-search"] > input').type("Test");
    cy.get('[data-test="meeting-search"] > button').click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query.search).to.eql("Test");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no meetings are displayed
    cy.contains("meetings.no_data_filtered").should("be.visible");
    cy.get('[data-test="meeting-item"]').should("have.length", 0);

    // Check with no meetings available
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = [];
      meetings.meta.from = null;
      meetings.meta.per_page = 1;
      meetings.meta.to = null;
      meetings.meta.total = 0;
      meetings.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-search"] > input').clear();
    cy.get('[data-test="meeting-search"] > input').type("Test2");
    cy.get('[data-test="meeting-search"] > input').type("{enter}");

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query.search).to.eql("Test2");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct message is shown and no meetings are displayed
    cy.contains("meetings.no_data").should("be.visible");
    cy.get('[data-test="meeting-item"]').should("have.length", 0);

    // Check with 2 meetings on 2 pages
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 2;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;
      meetings.meta.total = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-search"] > input').clear();
    cy.get('[data-test="meeting-search"] > input').type("Meeting");
    cy.get('[data-test="meeting-search"] > button').click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query.search).to.eql("Meeting");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(1, 2);
      meetings.meta.current_page = 2;
      meetings.meta.from = 2;
      meetings.meta.last_page = 2;
      meetings.meta.per_page = 1;
      meetings.meta.to = 2;
      meetings.meta.total = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if search query stays the same after changing the page
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query.search).to.eql("Meeting");
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    cy.get('[data-test="meeting-search"] > input').should(
      "have.value",
      "Meeting",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:10")
      .and("include.text", "Meeting Two");

    // Change search query and make sure that the page is reset
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 2;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;
      meetings.meta.total = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-search"] > input').clear();
    cy.get('[data-test="meeting-search"] > input').type("Meet");
    cy.get('[data-test="meeting-search"] > button').click();

    // Check that meetings are loaded with the page reset to the first page
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query.search).to.eql("Meet");
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("sort meetings", function () {
    cy.visit("/meetings");

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "start",
        sort_direction: "asc",
      });
    });

    // Check that correct columns are sortable and correct sorting type is shown
    cy.get('[data-test="meeting-header-cell"]').should("have.length", 9);
    cy.get('[data-test="meeting-header-cell"]')
      .eq(0)
      .should("have.text", "meetings.start")
      .and("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "true");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(1)
      .should("have.text", "rooms.name")
      .and("not.have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(2)
      .should("have.text", "meetings.owner")
      .and("not.have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(3)
      .should("have.text", "app.server")
      .and("not.have.attr", "data-p-sortable-column", "true");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(5)
      .should("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(6)
      .should("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(7)
      .should("have.attr", "data-p-sortable-column", "true")
      .and("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(8)
      .should("have.text", "app.actions")
      .and("not.have.attr", "data-p-sortable-column", "true");

    // Change sorting type and respond with 3 meetings on 3 different pages
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-header-cell"]').eq(4).click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "room.participant_count",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="meeting-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "false");
    cy.get('[data-test="meeting-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "true");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(1, 2);
      meetings.meta.current_page = 2;
      meetings.meta.from = 2;
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "room.participant_count",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="meeting-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:10")
      .and("include.text", "Meeting Two");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-header-cell"]').eq(4).click();

    // Check that meetings are loaded with the page reset to the first page
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "room.participant_count",
        sort_direction: "desc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
    // Check that sorting is correct
    cy.get('[data-test="meeting-header-cell"]')
      .eq(0)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="meeting-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "descending");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One");

    // Change sorting type again
    cy.get('[data-test="meeting-header-cell"]').eq(5).click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "room.listener_count",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="meeting-header-cell"]')
      .eq(4)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="meeting-header-cell"]')
      .eq(5)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Switch to next page
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(1, 2);
      meetings.meta.current_page = 2;
      meetings.meta.from = 2;
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that sorting stays the same
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
        sort_by: "room.listener_count",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting stays the same
    cy.get('[data-test="meeting-header-cell"]')
      .eq(5)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:10")
      .and("include.text", "Meeting Two");

    // Change sorting and make sure that the page is reset
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 3;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="meeting-header-cell"]').eq(6).click();

    // Check that meetings are loaded with the page reset to the first page
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "room.voice_participant_count",
        sort_direction: "asc",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that sorting is correct
    cy.get('[data-test="meeting-header-cell"]')
      .eq(5)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="meeting-header-cell"]')
      .eq(6)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");

    // Change sorting again
    cy.get('[data-test="meeting-header-cell"]').eq(7).click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
        sort_by: "room.video_count",
        sort_direction: "asc",
      });
    });

    // Check that sorting is correct
    cy.get('[data-test="meeting-header-cell"]')
      .eq(6)
      .should("have.attr", "data-p-sorted", "false");

    cy.get('[data-test="meeting-header-cell"]')
      .eq(7)
      .should("have.attr", "data-p-sorted", "true")
      .and("have.attr", "aria-sort", "ascending");
  });

  it("reload meetings", function () {
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(0, 1);
      meetings.meta.last_page = 2;
      meetings.meta.per_page = 1;
      meetings.meta.to = 1;
      meetings.meta.total = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.visit("/meetings");

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get('[data-test="meetings-reload-button"]').click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One");

    // Switch to next page
    cy.fixture("meetings.json").then((meetings) => {
      meetings.data = meetings.data.slice(1, 2);
      meetings.meta.current_page = 2;
      meetings.meta.from = 2;
      meetings.meta.last_page = 2;
      meetings.meta.per_page = 1;
      meetings.meta.to = 2;
      meetings.meta.total = 2;

      cy.intercept("GET", "api/v1/meetings*", {
        statusCode: 200,
        body: meetings,
      }).as("meetingsRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Reload
    cy.get('[data-test="meetings-reload-button"]').click();

    // Check that page stays the same
    cy.wait("@meetingsRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct meeting is shown
    cy.get('[data-test="meeting-item"]').should("have.length", 1);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:10")
      .and("include.text", "Meeting Two");
  });

  it("view room of meeting", function () {
    cy.visit("/meetings");

    cy.wait("@meetingsRequest");

    cy.interceptRoomViewRequests();

    // Click on view room button
    cy.get('[data-test="meeting-item"]').should("have.length", 3);
    cy.get('[data-test="meeting-item"]')
      .eq(0)
      .should("include.text", "02/12/2021, 19:09")
      .and("include.text", "Meeting One")
      .find('[data-test="meeting-view-room-button"]')
      .click();

    // Check that redirect worked
    cy.url().should("include", "/rooms/abc-def-123");
    cy.url().should("not.include", "/meetings");
  });
});
