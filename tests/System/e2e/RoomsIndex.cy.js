describe('Room Index', function () {
  beforeEach(function () {
    cy.seed();
  });

  it('visit with user that is not logged in', function () {
    cy.testVisitWithoutCurrentUser('/rooms');
  });

  it('check list of rooms, filter, search and favorites', function () {
    cy.loginAs('daniel');

    cy.visit('/rooms');

    // Check if rooms are shown and contain the correct data
    cy.get('.room-card').should('have.length', 5);

    // By default, sort by last started
    cy.get('.room-card').eq(0).should('include.text', 'Meeting Room');
    cy.get('.room-card').eq(0).should('include.text', 'Angela Jones');
    cy.get('.room-card').eq(0).should('include.text', 'Running since 01/01/2024, 08:00');
    cy.get('.room-card').eq(0).should('include.text', '2 Participant(s)');
    cy.get('.room-card').eq(0).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-345');
    });

    cy.get('.room-card').eq(1).should('include.text', 'Anatomy');
    cy.get('.room-card').eq(1).should('include.text', 'Daniel Osorio');
    cy.get('.room-card').eq(1).should('include.text', 'Last run until 01/01/2024, 11:00');
    cy.get('.room-card').eq(1).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-123');
    });

    cy.get('.room-card').eq(2).should('include.text', 'Math');
    cy.get('.room-card').eq(2).should('include.text', 'Daniel Osorio');
    cy.get('.room-card').eq(2).should('include.text', 'Last run until 01/01/2024, 12:00');
    cy.get('.room-card').eq(2).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-234');
    });

    cy.get('.room-card').eq(3).should('include.text', 'Exam Room');
    cy.get('.room-card').eq(3).should('include.text', 'Angela Jones');
    cy.get('.room-card').eq(3).should('include.text', 'Never started before');
    cy.get('.room-card').eq(3).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-456');
    });

    // Change sorting
    cy.get('[data-test="sorting-type-dropdown"]').click();
    cy.get('[data-test="sorting-type-dropdown-items"]').within(() => {
      cy.get('.p-dropdown-item').eq(1).click();
    });
    cy.get('.room-card').eq(0).should('include.text', 'Anatomy');
    cy.get('.room-card').eq(1).should('include.text', 'Exam Room');
    cy.get('.room-card').eq(2).should('include.text', 'Math');
    cy.get('.room-card').eq(3).should('include.text', 'Meeting Room');
    cy.get('.room-card').eq(4).should('include.text', 'Seminar Room');

    // Test search
    cy.get('[data-test="room-search"] > input').type('Anatomy');
    cy.get('[data-test="room-search"] > input').type('{enter}');
    cy.get('.room-card').should('have.length', 1);

    // Clear search
    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type('{enter}');
    cy.get('.room-card').should('have.length', 5);

    // Disable shared rooms
    cy.get('[aria-label="Shared rooms"] > .p-button-label').click();
    cy.get('.room-card').should('have.length', 2);

    // Disable own rooms
    cy.get('[aria-label="Own rooms"] > .p-button-label').click();
    cy.get('.room-card').should('have.length', 0);
    cy.contains('No rooms selected').should('be.visible');

    // Reset filter
    cy.get('[data-test="filter-reset-button"]').click();
    cy.get('.room-card').should('have.length', 5);

    // Mark two rooms as favorites
    cy.get('.room-card').eq(2).within(() => {
      cy.get('[data-test="room-favorites-button"]').click();
    });
    cy.get('.room-card').eq(3).within(() => {
      cy.get('[data-test="room-favorites-button"]').click();
    });

    // Filter by favorites
    cy.get('[data-test="only-favorites-button"]').click();
    cy.get('.room-card').should('have.length', 2);

    // Disable favorites filter
    cy.get('[data-test="only-favorites-button"]').click();
    cy.get('.room-card').should('have.length', 5);

    // Filter by room type
    cy.get('[data-test="room-type-dropdown"]').click();
    cy.get('[data-test="room-type-dropdown-items"]').within(() => {
      cy.get('.p-dropdown-item').eq(1).click();
    });
    cy.get('.room-card').should('have.length', 2);
  });

  it('click on room card to open room view', function () {
    cy.loginAs('daniel');

    cy.visit('/rooms');

    cy.get('.room-card').eq(0).should('include.text', 'Meeting Room');
    cy.get('.room-card').eq(0).click();

    cy.url().should('include', '/rooms/abc-def-345');
  });
});