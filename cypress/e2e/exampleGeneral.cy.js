import '../support/commands.js'
describe('General example test', () => {
  beforeEach(()=>{
    cy.bypassLogin("admin@test.de", "AdminPassword");
  });
  it('visit rooms', () => {
    cy.visit('/rooms');
    cy.contains('Admin Test');
    cy.contains("Räume");

    cy.get('.card').should('have.length', 9);
  });

  it('visit meetings', () => {
    cy.visit('/meetings');
    cy.contains('Admin Test');
    cy.contains("Laufende Meetings");
  });

  it('visit settings', () => {
    cy.visit('/settings');
    cy.contains('Admin Test');
    cy.contains("Einstellungen");
  });

  it('visit rooms then change user', () => {
    cy.visit('/rooms');
    cy.contains('Admin Test');
    cy.contains("Räume");
    cy.bypassLogin('test2@test.de', 'Testtest2!');
    cy.visit('/rooms');
    cy.contains('DarfKeine RäumeErstellen');
    cy.contains("Räume");
    cy.get('.card').should('have.length', 2);
  });

})
