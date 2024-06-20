describe('Room Index', function () {
  beforeEach(function () {
    cy.seed();
  });

  it('visit with user that is not logged in', function () {
    cy.testVisitWithoutCurrentUser('/rooms');
  });

  it('check list of rooms', function () {
    cy.loginAs('daniel');

    cy.visit('/rooms');

    // Check if rooms are shown and contain the correct data
    cy.get('.room-card').should('have.length', 5);

    cy.get('.room-card').eq(0).should('contain', 'Anatomy');
    cy.get('.room-card').eq(0).should('contain', 'Daniel Osorio');
    cy.get('.room-card').eq(0).should('contain', 'Never started before');
    cy.get('.room-card').eq(0).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-123');
    });
    cy.get('.room-card').eq(1).should('contain', 'Exam Room');
    cy.get('.room-card').eq(1).should('contain', 'Angela Jones');
    cy.get('.room-card').eq(1).should('contain', 'Never started before');
    cy.get('.room-card').eq(1).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-456');
    });
    cy.get('.room-card').eq(2).should('contain', 'Math');
    cy.get('.room-card').eq(2).should('contain', 'Daniel Osorio');
    cy.get('.room-card').eq(2).should('contain', 'Never started before');
    cy.get('.room-card').eq(2).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-234');
    });
  });
});
