import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Room Index", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/rooms");
  });

  it("check list of rooms and opening room view", function () {
    const roomRequestInterception = interceptIndefinitely(
      "GET",
      "api/v1/rooms?*",
      { fixture: "rooms.json" },
      "roomRequest",
    );
    cy.interceptRoomViewRequests();

    cy.visit("/rooms");

    // Test loading

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Room search field
    cy.get("[data-test=room-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("be.disabled");
        cy.get("button").should("be.disabled");
      });

    // Room filter buttons
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="rooms-filter-button"]').eq(0).should("be.disabled");
    cy.get('[data-test="rooms-filter-button"]').eq(1).should("be.disabled");
    cy.get('[data-test="rooms-filter-button"]').eq(2).should("be.disabled");

    // Only favorites button
    cy.get("[data-test=only-favorites-button]").should("be.disabled");

    // Room type dropdown
    cy.get("[data-test=room-type-dropdown]").within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get("[data-test=filter-button]").should("not.be.visible");

    // Sorting dropdown
    cy.get("[data-test=sorting-type-dropdown]").within(() => {
      cy.get(".p-select-label")
        .should("have.attr", "aria-disabled", "true")
        .then(() => {
          roomRequestInterception.sendResponse();
        });
    });

    cy.wait("@roomRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Make sure that components are not disabled after response
    // Room search field
    cy.get("[data-test=room-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

    // Room filter buttons
    cy.get('[data-test="rooms-filter-button"]').should("not.be.disabled");

    // Only favorites button
    cy.get("[data-test=only-favorites-button]").should("not.be.disabled");

    // Room type dropdown
    cy.get("[data-test=room-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get("[data-test=filter-button]").should("not.be.visible");

    // Check that room info dialog is closed
    cy.get('[data-test="room-info-dialog"]').should("not.exist");

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').should("have.length", 3);

    cy.get('[data-test="room-card"]')
      .eq(2)
      .should("include.text", "Meeting Three");
    cy.get('[data-test="room-card"]').eq(2).should("include.text", "John Doe");
    cy.get('[data-test="room-card"]')
      .eq(2)
      .should(
        "include.text",
        'rooms.index.room_component.last_ran_till_{"date":"08/21/2023, 10:20"}',
      );
    cy.get('[data-test="room-card"]')
      .eq(2)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/def-abc-456");
        cy.get('[data-test="room-info-button"]').should("not.exist");
        cy.get('[data-test="room-favorites-button"]')
          .should("be.visible")
          .and("have.attr", "aria-label", "rooms.favorites.add");
      });

    cy.get('[data-test="room-card"]')
      .eq(1)
      .should("include.text", "Meeting Two");
    cy.get('[data-test="room-card"]').eq(1).should("include.text", "John Doe");
    cy.get('[data-test="room-card"]')
      .eq(1)
      .should(
        "include.text",
        'rooms.index.room_component.running_since_{"date":"08/21/2023, 10:18"}',
      );
    cy.get('[data-test="room-card"]')
      .eq(1)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/def-abc-123");
        cy.get('[data-test="room-info-button"]').should("not.exist");
        cy.get('[data-test="room-favorites-button"]')
          .should("be.visible")
          .and("have.attr", "aria-label", "rooms.favorites.remove");
      });

    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Meeting One");
    cy.get('[data-test="room-card"]').eq(0).should("include.text", "John Doe");
    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "rooms.index.room_component.never_started");
    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/abc-def-123");
        cy.get('[data-test="room-favorites-button"]')
          .should("be.visible")
          .and("have.attr", "aria-label", "rooms.favorites.add");

        // Open room info dialog for this room
        cy.get('[data-test="room-info-button"]').click();
      });

    // Check that room info dialog is open and contains the correct data
    cy.get('[data-test="room-info-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Meeting One").should("be.visible");
        cy.contains("John Doe").should("be.visible");
        cy.contains("Room short description").should("be.visible");
        cy.contains("rooms.index.room_component.never_started").should(
          "be.visible",
        );

        // Open room view
        cy.get('[data-test="dialog-continue-button"]').click();
      });

    cy.url().should("include", "/rooms/abc-def-123");
  });

  it("check list of rooms with rooms.filterAll permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    const roomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms*",
      { fixture: "rooms.json" },
      "roomRequest",
    );

    cy.visit("/rooms");

    // Check loading
    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Room search field
    cy.get('[data-test="room-search"]')
      .eq(0)
      .within(() => {
        cy.get("input").should("be.disabled");
        cy.get("button").should("be.disabled");
      });

    // Room filter buttons
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="rooms-filter-button"]').eq(0).should("be.disabled");
    cy.get('[data-test="rooms-filter-button"]').eq(1).should("be.disabled");
    cy.get('[data-test="rooms-filter-button"]').eq(2).should("be.disabled");

    // Rooms filter all button
    cy.get('[data-test="rooms-filter-all-button"]').should("be.disabled");

    // Only favorites button
    cy.get('[data-test="only-favorites-button"]').should("be.disabled");

    // Room type dropdown
    cy.get('[data-test="room-type-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="filter-button"]').should("not.be.visible");

    // Sorting dropdown
    cy.get('[data-test="sorting-type-dropdown"]').within(() => {
      cy.get(".p-select-label")
        .should("have.attr", "aria-disabled", "true")
        .then(() => {
          roomRequest.sendResponse();
        });
    });

    cy.wait("@roomRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    // Make sure that components are not disabled after response
    // Room search field
    cy.get("[data-test=room-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

    // Room filter buttons
    cy.get('[data-test="rooms-filter-button"]').should("not.be.disabled");
    cy.get('[data-test="rooms-filter-all-button"]').should("not.be.disabled");

    // Only favorites button
    cy.get('[data-test="only-favorites-button"]').should("not.be.disabled");

    // Room type dropdown
    cy.get('[data-test="room-type-dropdown"]').within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.get('[data-test="filter-button"]').should("not.be.visible");

    // Check that room info dialog is closed
    cy.get('[data-test="room-info-dialog"]').should("not.exist");

    // Check if rooms are shown
    cy.get('[data-test="room-card"]').should("have.length", 3);
  });

  it("click on room card to open room view", function () {
    cy.interceptRoomViewRequests();

    const roomRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123",
      { fixture: "room.json" },
      "roomRequest",
    );

    cy.visit("/rooms");

    // Click on room card to open room view
    cy.get('[data-test="room-card"]').eq(0).click();

    cy.url().should("include", "/rooms/abc-def-123");

    cy.get('[data-test="no-room-overlay"]')
      .should("be.visible")
      .then(() => {
        roomRequest.sendResponse();
      });

    cy.wait("@roomRequest");

    cy.get('[data-test="no-room-overlay"]').should("not.exist");
  });

  it("sorting", function () {
    cy.visit("/rooms");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "last_started",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown-items]").should("not.exist");

    // Check that correct sorting type is displayed
    cy.get("[data-test=sorting-type-dropdown]")
      .should("have.text", "rooms.index.sorting.last_started")
      .click();

    cy.get("[data-test=sorting-type-dropdown-items]")
      .should("be.visible")
      .within(() => {
        // Check that sorting options are shown correctly
        cy.get("[data-test=sorting-type-dropdown-option]").should(
          "have.length",
          3,
        );
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(0)
          .should("include.text", "rooms.index.sorting.last_started");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(0)
          .should("have.attr", "aria-selected", "true");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(1)
          .should("include.text", "rooms.index.sorting.alpha");
        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(2)
          .should("include.text", "rooms.index.sorting.room_type");

        // Change sorting type and respond with 3 rooms on 3 different pages
        cy.fixture("rooms.json").then((rooms) => {
          rooms.data = rooms.data.slice(0, 1);
          rooms.meta.last_page = 3;
          rooms.meta.per_page = 1;
          rooms.meta.to = 1;

          cy.intercept("GET", "api/v1/rooms?*", {
            statusCode: 200,
            body: rooms,
          }).as("roomRequest");
        });

        cy.get("[data-test=sorting-type-dropdown-option]").eq(1).click();
      });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "alpha",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown-items]").should("not.exist");

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.index.sorting.alpha",
    );

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if sorting stays the same after changing page
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "alpha",
        page: "2",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "rooms.index.sorting.alpha",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting Two");

    // Change sorting again and make sure that page is reset
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get("[data-test=sorting-type-dropdown]").click();
    cy.get("[data-test=sorting-type-dropdown-option]").eq(2).click();

    // Check that rooms are loaded with the page reset to the first page
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "room_type",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("search", function () {
    cy.visit("/rooms");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.search).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check with no rooms found for this search query
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-search"] > input').type("Test");
    cy.get('[data-test="room-search"] > button').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Test",
        page: "1",
      });
    });

    // Check if correct message is shown and no rooms are displayed
    cy.contains("rooms.no_rooms_found").should("be.visible");
    cy.get('[data-test="room-card"]').should("have.length", 0);

    // Check with no rooms available
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;
      rooms.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type("Test2");
    cy.get('[data-test="room-search"] > input').type("{enter}");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Test2",
        page: "1",
      });
    });

    // Check if correct message is shown and no rooms are displayed
    cy.contains("rooms.no_rooms_available").should("be.visible");
    cy.get('[data-test="room-card"]').should("have.length", 0);

    // Check with 2 rooms on 2 pages
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data.slice(0, 1);
      rooms.meta.last_page = 2;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;
      rooms.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type("Meeting");
    cy.get('[data-test="room-search"] > button').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Meeting",
        page: "1",
      });
    });

    // Check that correct room is shown
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 2;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;
      rooms.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Meeting",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="room-search"] > input').should("have.value", "Meeting");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting Two");

    // Change search query and make sure that page is reset
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 2;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;
      rooms.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type("Meet");
    cy.get('[data-test="room-search"] > button').click();

    // Check that rooms are loaded with the page reset to the first page
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        search: "Meet",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("filter room type", function () {
    cy.visit("/rooms");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query.room_type).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should("not.exist");

    // Check that correct room type is displayed
    cy.get('[data-test="room-type-dropdown"]')
      .should("have.text", "rooms.room_types.all")
      .click();

    cy.get('[data-test="room-type-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        // Check that room types are shown correctly
        cy.get('[data-test="room-type-dropdown-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="room-type-dropdown-option"]')
          .eq(0)
          .should("have.text", "Lecture");
        cy.get('[data-test="room-type-dropdown-option"]')
          .eq(1)
          .should("have.text", "Meeting");
        cy.get('[data-test="room-type-dropdown-option"]')
          .eq(2)
          .should("have.text", "Exam");
        cy.get('[data-test="room-type-dropdown-option"]')
          .eq(3)
          .should("have.text", "Seminar");
      });

    // Change room type and respond with no rooms found for this room type
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-type-dropdown-option"]').eq(1).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_type: "2",
        page: "1",
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should("not.exist");
    cy.contains("rooms.no_rooms_found").should("be.visible");

    // Check that room type is shown correctly and change it again to check for no rooms available
    cy.get('[data-test="room-type-dropdown"]')
      .should("have.text", "Meeting")
      .click();

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;
      rooms.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-type-dropdown-option"]').eq(2).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_type: "3",
        page: "1",
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should("not.exist");
    cy.contains("rooms.no_rooms_available").should("be.visible");

    // Check that room type is shown correctly and change it again to check with 3 rooms on 3 pages
    cy.get('[data-test="room-type-dropdown"]')
      .should("have.text", "Exam")
      .click();

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-type-dropdown-option"]').eq(3).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_type: "4",
        page: "1",
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should("not.exist");

    cy.get('[data-test="room-type-dropdown"]').should("have.text", "Seminar");

    // Check that correct room is shown
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if room type stays the same after changing page
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_type: "4",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="room-type-dropdown"]').should("have.text", "Seminar");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting Two");

    // Change room type again and make sure that page is reset
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-type-dropdown"]').click();
    cy.get('[data-test="room-type-dropdown-option"]').eq(0).click();

    // Check that rooms are loaded with the page reset to the first page
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_type: "1",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });

  it("filter without viewAll permission", function () {
    cy.visit("/rooms");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });
    });

    // Check that filter buttons are shown correctly
    cy.get('[data-test="rooms-filter-all-button"]').should("not.exist");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="rooms-filter-button"]')
      .eq(0)
      .should("have.text", "rooms.index.show_own")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(1)
      .should("have.text", "rooms.index.show_shared")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(2)
      .should("have.text", "rooms.index.show_public")
      .and("have.attr", "aria-pressed", "false");

    // Trigger filter button and respond with no rooms available for this filter combination
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;
      rooms.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="rooms-filter-button"]').eq(1).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "0",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });
    });

    // Check correct message is shown
    cy.contains("rooms.no_rooms_available").should("be.visible");

    // Check that button was updated
    cy.get('[data-test="rooms-filter-button"]')
      .eq(1)
      .should("have.attr", "aria-pressed", "false");

    // Trigger filter button and respond with 3 rooms on 3 different pages
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="rooms-filter-button"]').eq(2).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "0",
        filter_public: "1",
        filter_all: "0",
        page: "1",
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that button was updated
    cy.get('[data-test="rooms-filter-button"]')
      .eq(2)
      .should("have.attr", "aria-pressed", "true");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "0",
        filter_public: "1",
        filter_all: "0",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting Two");

    // Check that button did not change
    cy.get('[data-test="rooms-filter-button"]')
      .eq(2)
      .should("have.attr", "aria-pressed", "true");

    // Trigger another filter button and make sure that the page is reset
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="rooms-filter-button"]').eq(0).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "0",
        filter_shared: "0",
        filter_public: "1",
        filter_all: "0",
        page: "1",
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that button was updated
    cy.get('[data-test="rooms-filter-button"]')
      .eq(0)
      .should("have.attr", "aria-pressed", "false");
  });

  it("filter with viewAll permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/rooms");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });
    });

    // Check that filter buttons are shown correctly
    cy.get('[data-test="rooms-filter-all-button"]')
      .should("have.text", "rooms.index.show_all")
      .and("have.attr", "aria-pressed", "false");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="rooms-filter-button"]')
      .eq(0)
      .should("have.text", "rooms.index.show_own")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(1)
      .should("have.text", "rooms.index.show_shared")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(2)
      .should("have.text", "rooms.index.show_public")
      .and("have.attr", "aria-pressed", "false");

    // Trigger filter all button and respond with no rooms available for this filter combination
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;
      rooms.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "1",
        page: "1",
      });
    });

    // Check that correct message is shown
    cy.contains("rooms.no_rooms_available").should("be.visible");

    // Check that other filter buttons are disabled and filter all button is updated
    cy.get('[data-test="rooms-filter-all-button"]')
      .should("have.text", "rooms.index.show_all")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 0);

    // Trigger filter all button again and check that other filter buttons did not change
    cy.intercept("GET", "api/v1/rooms*", { fixture: "rooms.json" }).as(
      "roomRequest",
    );

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "0",
        filter_all: "0",
        page: "1",
      });
    });

    cy.get('[data-test="rooms-filter-all-button"]')
      .should("have.text", "rooms.index.show_all")
      .and("have.attr", "aria-pressed", "false");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="rooms-filter-button"]')
      .eq(0)
      .should("have.text", "rooms.index.show_own")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(1)
      .should("have.text", "rooms.index.show_shared")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(2)
      .should("have.text", "rooms.index.show_public")
      .and("have.attr", "aria-pressed", "false");

    // Trigger filter button (don't change response)
    cy.get('[data-test="rooms-filter-button"]').eq(2).click();
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "1",
        filter_all: "0",
        page: "1",
      });
    });

    // Trigger filter all button and respond with 3 rooms on 3 different pages
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "1",
        filter_all: "1",
        page: "1",
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that button was updated and other filter buttons are hidden
    cy.get('[data-test="rooms-filter-all-button"]').should(
      "have.attr",
      "aria-pressed",
      "true",
    );
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 0);

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "1",
        filter_all: "1",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting Two");

    // Check that button was updated and other filter buttons are still hidden
    cy.get('[data-test="rooms-filter-all-button"]').should(
      "have.attr",
      "aria-pressed",
      "true",
    );
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 0);

    // Trigger filter button again and make sure that the page is reset
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        filter_own: "1",
        filter_shared: "1",
        filter_public: "1",
        filter_all: "0",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that button was updated
    cy.get('[data-test="rooms-filter-all-button"]').should(
      "have.attr",
      "aria-pressed",
      "false",
    );

    // Check that the other filter buttons are shown again and still have the same state
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="rooms-filter-button"]')
      .eq(0)
      .should("have.text", "rooms.index.show_own")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(1)
      .should("have.text", "rooms.index.show_shared")
      .and("have.attr", "aria-pressed", "true");
    cy.get('[data-test="rooms-filter-button"]')
      .eq(2)
      .should("have.text", "rooms.index.show_public")
      .and("have.attr", "aria-pressed", "true");
  });

  it("show favorites", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/rooms");

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "0",
        page: "1",
      });
    });

    // Check that filter options are shown
    cy.get('[data-test="rooms-filter-all-button"]').should("be.visible");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="room-type-dropdown"]').should("be.visible");

    // Click on only favorites button and reload with no favorites
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.from = null;
      rooms.meta.per_page = 1;
      rooms.meta.to = null;
      rooms.meta.total = 0;
      rooms.meta.total_no_filter = 0;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="only-favorites-button"]')
      .should("have.text", "rooms.index.only_favorites")
      .click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "1",
        page: "1",
      });
    });

    // Check that correct message is shown and no rooms are shown
    cy.contains("rooms.index.no_favorites").should("be.visible");
    cy.get('[data-test="room-card"]').should("have.length", 0);

    // Check that filter options are hidden
    cy.get('[data-test="rooms-filter-all-button"]').should("not.exist");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 0);
    cy.get('[data-test="room-type-dropdown"]').should("not.exist");

    // Click on only favorites button again
    cy.intercept("GET", "api/v1/rooms*", { fixture: "rooms.json" }).as(
      "roomRequest",
    );
    cy.get('[data-test="only-favorites-button"]').click();
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "0",
        page: "1",
      });
    });

    // Check that filter options are shown again
    cy.get('[data-test="rooms-filter-all-button"]').should("be.visible");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="room-type-dropdown"]').should("be.visible");

    // Trigger only favorites button again and respond with 3 rooms on 3 different pages
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="only-favorites-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "1",
        page: "1",
      });
    });

    // Check that filter options are hidden
    cy.get('[data-test="rooms-filter-all-button"]').should("not.exist");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 0);
    cy.get('[data-test="room-type-dropdown"]').should("not.exist");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should("have.length", 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "1",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that filter options are still hidden
    cy.get('[data-test="rooms-filter-all-button"]').should("not.exist");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 0);
    cy.get('[data-test="room-type-dropdown"]').should("not.exist");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting Two");

    // Trigger only favorites button again and make sure that the page is reset
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="only-favorites-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "0",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check that filter options are shown again
    cy.get('[data-test="rooms-filter-all-button"]').should("be.visible");
    cy.get('[data-test="rooms-filter-button"]').should("have.length", 3);
    cy.get('[data-test="room-type-dropdown"]').should("be.visible");

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]')
      .should("have.length", 1)
      .and("include.text", "Meeting One");
  });

  it("trigger favorites button", function () {
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.visit("/rooms");

    cy.wait("@roomRequest");

    // Test trigger favorites from room card

    // Test add room to favorites
    const addToFavoritesRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/favorites",
      {
        statusCode: 204,
      },
      "addFavoritesRequest",
    );

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.data[0].is_favorite = true;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]').click();
        cy.get('[data-test="room-favorites-button"]')
          .should("be.disabled")
          .then(() => {
            addToFavoritesRequest.sendResponse();
          });

        cy.wait("@addFavoritesRequest");
        cy.wait("@roomRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            page: "1",
          });
        });

        cy.get('[data-test="room-favorites-button"]').should(
          "have.attr",
          "aria-label",
          "rooms.favorites.remove",
        );
      });

    // Change page to the next page
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomRequest");

    // Test remove room from favorites
    const deleteFromFavorites = interceptIndefinitely(
      "DELETE",
      "api/v1/rooms/def-abc-123/favorites",
      {
        statusCode: 204,
      },
      "deleteFavoritesRequest",
    );

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.data[0].is_favorite = false;
      rooms.data[0].short_description = "Room short descriptions";
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]').click();
        cy.get('[data-test="room-favorites-button"]')
          .should("be.disabled")
          .then(() => {
            deleteFromFavorites.sendResponse();
          });

        cy.wait("@deleteFavoritesRequest");
        cy.wait("@roomRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            // Check that page stayed the same
            page: "2",
          });
        });

        cy.get('[data-test="room-favorites-button"]').should(
          "have.attr",
          "aria-label",
          "rooms.favorites.add",
        );
      });

    // Test trigger favorites from room info dialog

    // Test add room to favorites
    cy.intercept("POST", "api/v1/rooms/def-abc-123/favorites", {
      statusCode: 204,
    }).as("addFavoritesRequest");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.data[0].short_description = "Room short descriptions";
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-info-dialog"]').should("not.exist");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-info-button"]').click();
      });

    cy.get('[data-test="room-info-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="room-favorites-button"]')
          .should("have.attr", "aria-label", "rooms.favorites.add")
          .click();
      });

    cy.wait("@addFavoritesRequest");
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    cy.get('[data-test="room-info-dialog"]').should("not.exist");

    // Test remove room from favorites
    cy.intercept("DELETE", "api/v1/rooms/def-abc-123/favorites", {
      statusCode: 204,
    }).as("deleteFavoritesRequest");

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(1, 2);
      rooms.data[0].is_favorite = false;
      rooms.data[0].short_description = "Room short descriptions";
      rooms.meta.current_page = 2;
      rooms.meta.from = 2;
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-info-dialog"]').should("not.exist");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-info-button"]').click();
      });

    cy.get('[data-test="room-info-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="room-favorites-button"]')
          .should("have.attr", "aria-label", "rooms.favorites.remove")
          .click();
      });

    cy.wait("@deleteFavoritesRequest");
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    cy.get('[data-test="room-info-dialog"]').should("not.exist");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-info-button"]').click();
      });

    cy.get('[data-test="room-info-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="room-favorites-button"]').should(
          "have.attr",
          "aria-label",
          "rooms.favorites.add",
        );
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Test trigger favorites when only favorites are shown

    // Trigger only favorites button and respond with 4 rooms on 2 different pages
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 2);
      rooms.data[0].is_favorite = true;
      rooms.meta.last_page = 2;
      rooms.meta.per_page = 2;
      rooms.meta.to = 2;
      rooms.meta.total = 4;
      rooms.meta.total_no_filter = 4;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="only-favorites-button"]').click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "1",
        page: "1",
      });
    });

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(2, 3);
      rooms.data[0].is_favorite = true;
      rooms.data.push({
        id: "abc-def-456",
        name: "Meeting Four",
        owner: {
          id: 1,
          name: "John Doe",
        },
        last_meeting: null,
        type: {
          id: 2,
          name: "Meeting",
          color: "#4a5c66",
        },
        is_favorite: true,
        short_description: null,
      });
      rooms.meta.current_page = 2;
      rooms.meta.from = 3;
      rooms.meta.last_page = 2;
      rooms.meta.per_page = 2;
      rooms.meta.to = 4;
      rooms.meta.total = 4;
      rooms.meta.total_no_filter = 4;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        only_favorites: "1",
        page: "2",
      });
    });

    // Remove first room from favorites
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [
        {
          id: "abc-def-456",
          name: "Meeting Four",
          owner: {
            id: 1,
            name: "John Doe",
          },
          last_meeting: null,
          type: {
            id: 2,
            name: "Meeting",
            color: "#4a5c66",
          },
          is_favorite: true,
          short_description: null,
        },
      ];
      rooms.meta.current_page = 2;
      rooms.meta.from = 3;
      rooms.meta.last_page = 2;
      rooms.meta.per_page = 2;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.intercept("DELETE", "api/v1/rooms/def-abc-456/favorites", {
      statusCode: 204,
    }).as("deleteFavoritesRequest");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .find('[data-test="room-favorites-button"]')
      .click();

    cy.wait("@deleteFavoritesRequest");
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Delete second room from favorites and respond with no rooms on the second page
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = [];
      rooms.meta.current_page = 2;
      rooms.meta.from = null;
      rooms.meta.per_page = 2;
      rooms.meta.to = null;
      rooms.meta.total = 2;
      rooms.meta.total_no_filter = 2;

      const emptyRoomRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms?*",
        {
          statusCode: 200,
          body: rooms,
        },
        "roomRequest",
      );

      cy.intercept("DELETE", "api/v1/rooms/abc-def-456/favorites", {
        statusCode: 204,
      }).as("deleteFavoritesRequest");

      cy.get('[data-test="room-card"]')
        .eq(0)
        .find('[data-test="room-favorites-button"]')
        .click();

      cy.fixture("rooms.json").then((rooms) => {
        rooms.data = rooms.data.slice(0, 2);
        rooms.data[0].is_favorite = true;
        rooms.meta.per_page = 2;
        rooms.meta.to = 2;
        rooms.meta.total = 2;
        rooms.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/rooms?*", {
          statusCode: 200,
          body: rooms,
        })
          .as("roomRequest")
          .then(() => {
            emptyRoomRequest.sendResponse();
          });
      });
    });

    cy.wait("@deleteFavoritesRequest");
    // Wait for first room request and check that page is still the same
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second room request and check that page is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });
  });

  it("trigger favorites button errors", function () {
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.visit("/rooms");

    cy.wait("@roomRequest");

    // Test add to favorites with general error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 500,
      body: {
        message: "Test add favorite error",
      },
    }).as("addFavoritesRequest");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]')
          .should("have.attr", "aria-label", "rooms.favorites.add")
          .click();

        cy.wait("@addFavoritesRequest");
        cy.wait("@roomRequest");
      });

    // Check that error message is shown and button stayed the same
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test add favorite error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test add to favorites with unauthenticated error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 401,
    }).as("addFavoritesRequest");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]')
          .should("have.attr", "aria-label", "rooms.favorites.add")
          .click();

        cy.wait("@addFavoritesRequest");
        cy.wait("@roomRequest");
      });

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/rooms");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit rooms again with a room that is already a favorite
    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.data[0].is_favorite = true;

      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    cy.visit("/rooms");

    cy.wait("@roomRequest");

    // Test remove from favorites with general error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 500,
      body: {
        message: "Test remove favorite error",
      },
    }).as("deleteFavoritesRequest");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]')
          .should("have.attr", "aria-label", "rooms.favorites.remove")
          .click();

        cy.wait("@deleteFavoritesRequest");
        cy.wait("@roomRequest");
      });

    // Check that error message is shown and button stayed the same
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test remove favorite error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Test remove from favorites with unauthenticated error
    cy.intercept("DELETE", "api/v1/rooms/abc-def-123/favorites", {
      statusCode: 401,
    }).as("addFavoritesRequest");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]')
          .should("have.attr", "aria-label", "rooms.favorites.remove")
          .click();

        cy.wait("@addFavoritesRequest");
        cy.wait("@roomRequest");
      });

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/rooms");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("error loading rooms", function () {
    cy.intercept("GET", "api/v1/rooms*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRequest");

    cy.visit("/rooms");
    cy.wait("@roomRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    // Room search field
    cy.get("[data-test=room-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

    // Only favorites button
    cy.get("[data-test=only-favorites-button]").should("not.be.disabled");

    // Room type dropdown
    cy.get("[data-test=room-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    // Sorting dropdown
    cy.get("[data-test=sorting-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Check if reload button exists and click it
    cy.get("[data-test=reload-button]")
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').should("have.length", 1);

    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Meeting One");

    // Check that reload button does not exist
    cy.get('[data-test="reload-button"]').should("not.exist");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/rooms*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that components are not disabled
    // Room search field
    cy.get("[data-test=room-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

    // Only favorites button
    cy.get("[data-test=only-favorites-button]").should("not.be.disabled");

    // Room type dropdown
    cy.get("[data-test=room-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    // Sorting dropdown
    cy.get("[data-test=sorting-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    // Check that components are not disabled
    // Room search field
    cy.get("[data-test=room-search]")
      .eq(0)
      .within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

    // Only favorites button
    cy.get("[data-test=only-favorites-button]").should("not.be.disabled");

    // Room type dropdown
    cy.get("[data-test=room-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    // Sorting dropdown
    cy.get("[data-test=sorting-type-dropdown]").within(() => {
      cy.get(".p-select-label").should(
        "not.have.attr",
        "aria-disabled",
        "true",
      );
    });

    cy.fixture("rooms.json").then((rooms) => {
      rooms.data = rooms.data.slice(0, 1);
      rooms.meta.last_page = 3;
      rooms.meta.per_page = 1;
      rooms.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms?*", {
        statusCode: 200,
        body: rooms,
      }).as("roomRequest");
    });

    // Check if reload button exists and click it
    cy.get("[data-test=reload-button]")
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').should("have.length", 1);

    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Meeting One");

    // Check that reload button does not exist
    cy.get("[data-test=reload-button]").should("not.exist");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms*", {
      statusCode: 401,
    }).as("roomRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/rooms");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Reload page with 401 error
    cy.visit("/rooms");

    cy.wait("@roomRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("error loading room types", function () {
    const roomTypesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roomTypes",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "roomTypesRequest",
    );

    cy.visit("/rooms");

    cy.wait("@roomRequest");

    // Check loading
    cy.get('[data-test="room-type-dropdown"]')
      .should("be.visible")
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true")
      .then(() => {
        roomTypesRequest.sendResponse();
      });

    cy.wait("@roomTypesRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    const roomTypeInterception = interceptIndefinitely(
      "GET",
      "api/v1/roomTypes*",
      { fixture: "roomTypes.json" },
    );

    // Check that room type select is shown correctly and click on reload button
    cy.get("[data-test=room-type-dropdown]").should("not.exist");
    cy.get("[data-test=room-type-inputgroup]")
      .should("include.text", "rooms.room_types.loading_error")
      .within(() => {
        cy.get("button").click();
        // Check that button is disabled after click
        cy.get("button")
          .should("be.disabled")
          .then(() => {
            // Send correct response and check that reload button does not exist after reload
            roomTypeInterception.sendResponse();
            cy.get("button").should("not.exist");
          });
      });

    // Check that dropdown exists and error message is not shown after correct response
    cy.get("[data-test=room-type-dropdown]");
    cy.get("[data-test=room-type-inputgroup]").should(
      "not.include.text",
      "rooms.room_types.loading_error",
    );

    // Reload with unauthenticated error
    cy.intercept("GET", "api/v1/roomTypes", {
      statusCode: 401,
    }).as("roomTypeRequest");

    cy.reload();

    cy.wait("@roomTypeRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/rooms");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
