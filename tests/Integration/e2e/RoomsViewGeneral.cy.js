describe('Room View general', function () {
  beforeEach(function () {
    cy.seed();
  });

  it('click on room card to open room view', function () {
    cy.loginAs('daniel');

    cy.visit('/rooms');

    cy.get('.room-card').eq(0).should('contain', 'Anatomy');
    cy.get('.room-card').eq(0).click();

    cy.url().should('contain', '/rooms/abc-def-123');
  });

  it('guest forbidden', function () {
    cy.visit('/rooms/abc-def-123');

    cy.contains('This room can only be used by authenticated users.');
  });

  it('room not found', function () {
    cy.visit('/rooms/123-456-789');

    cy.contains('The requested address was not found');
  });
});
