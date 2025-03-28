describe("Room Index", function () {
  beforeEach(function () {
    cy.seed();
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/rooms");
  });

  it("check list of rooms, filter, search and favorites", function () {
    cy.loginAs("daniel");

    cy.visit("/rooms");

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').should("have.length", 5);

    // By default, sort by last started
    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Meeting Room");
    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Angela Jones");
    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Running since 01/01/2024, 08:00");
    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "2 Participant(s)");
    cy.get('[data-test="room-card"]')
      .eq(0)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/abc-def-345");
      });

    cy.get('[data-test="room-card"]').eq(1).should("include.text", "Anatomy");
    cy.get('[data-test="room-card"]')
      .eq(1)
      .should("include.text", "Daniel Osorio");
    cy.get('[data-test="room-card"]')
      .eq(1)
      .should("include.text", "Last run until 01/01/2024, 11:00");
    cy.get('[data-test="room-card"]')
      .eq(1)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/abc-def-123");
      });

    cy.get('[data-test="room-card"]').eq(2).should("include.text", "Math");
    cy.get('[data-test="room-card"]')
      .eq(2)
      .should("include.text", "Daniel Osorio");
    cy.get('[data-test="room-card"]')
      .eq(2)
      .should("include.text", "Last run until 01/01/2024, 12:00");
    cy.get('[data-test="room-card"]')
      .eq(2)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/abc-def-234");
      });

    cy.get('[data-test="room-card"]').eq(3).should("include.text", "Exam Room");
    cy.get('[data-test="room-card"]')
      .eq(3)
      .should("include.text", "Angela Jones");
    cy.get('[data-test="room-card"]')
      .eq(3)
      .should("include.text", "Never started before");
    cy.get('[data-test="room-card"]')
      .eq(3)
      .within(() => {
        cy.get("a").should("have.attr", "href", "/rooms/abc-def-456");
      });

    // Change sorting
    cy.get('[data-test="sorting-type-dropdown"]').click();
    cy.get('[data-test="sorting-type-dropdown-items"]').within(() => {
      cy.get(".p-select-option").eq(1).click();
    });
    cy.get('[data-test="room-card"]').eq(0).should("include.text", "Anatomy");
    cy.get('[data-test="room-card"]').eq(1).should("include.text", "Exam Room");
    cy.get('[data-test="room-card"]').eq(2).should("include.text", "Math");
    cy.get('[data-test="room-card"]')
      .eq(3)
      .should("include.text", "Meeting Room");
    cy.get('[data-test="room-card"]')
      .eq(4)
      .should("include.text", "Seminar Room");

    // Test search
    cy.get('[data-test="room-search"] > input').type("Anatomy");
    cy.get('[data-test="room-search"] > input').type("{enter}");
    cy.get('[data-test="room-card"]').should("have.length", 1);

    // Clear search
    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type("{enter}");
    cy.get('[data-test="room-card"]').should("have.length", 5);

    // Disable shared rooms
    cy.get("button").contains("Shared rooms").click();
    cy.get('[data-test="room-card"]').should("have.length", 2);

    // Enable shared rooms
    cy.get("button").contains("Shared rooms").click();
    cy.get('[data-test="room-card"]').should("have.length", 5);

    // Disable own rooms
    cy.get("button").contains("Own rooms").click();
    cy.get('[data-test="room-card"]').should("have.length", 3);

    // Enable own rooms
    cy.get("button").contains("Own rooms").click();
    cy.get('[data-test="room-card"]').should("have.length", 5);

    // Mark two rooms as favorites
    cy.get('[data-test="room-card"]')
      .eq(2)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]').click();
      });
    cy.get('[data-test="room-card"]')
      .eq(3)
      .within(() => {
        cy.get('[data-test="room-favorites-button"]').click();
      });

    // Filter by favorites
    cy.get('[data-test="only-favorites-button"]').click();
    cy.get('[data-test="room-card"]').should("have.length", 2);

    // Disable favorites filter
    cy.get('[data-test="only-favorites-button"]').click();
    cy.get('[data-test="room-card"]').should("have.length", 5);

    // Filter by room type
    cy.get('[data-test="room-type-dropdown"]').click();
    cy.get('[data-test="room-type-dropdown-items"]').within(() => {
      cy.get(".p-select-option").eq(2).click();
    });
    cy.get('[data-test="room-card"]').should("have.length", 2);

    // Clear room type filter
    cy.get('[data-test="room-type-dropdown"]').click();
    cy.get('[data-test="room-type-dropdown-items"]').within(() => {
      cy.get(".p-select-option").eq(0).click();
    });
    cy.get('[data-test="room-card"]').should("have.length", 5);
  });

  it("click on room card to open room view", function () {
    cy.loginAs("daniel");

    cy.visit("/rooms");

    cy.get('[data-test="room-card"]')
      .eq(0)
      .should("include.text", "Meeting Room");
    cy.get('[data-test="room-card"]').eq(0).click();

    cy.url().should("include", "/rooms/abc-def-345");
  });
});
