import '../support/commands.js'
describe('General example test', () => {
  beforeEach(()=>{
    //Todo
    //Possible to interact with database with cy.request(...)?
    //create users, post, ... ?

    //Use bypassLogin to login the user
    cy.bypassLogin("admin@test.de", "AdminPassword");

  });
  it('visit rooms', () => {
    cy.visit('/rooms');
    cy.contains('Admin Test');
    cy.contains("Räume");

    cy.get('.card').should('have.length', 9);


    //change user
    cy.bypassLogin('test2@test.de', 'Testtest2!');
    cy.visit('/rooms');
    cy.contains('DarfKeine RäumeErstellen');
    cy.contains("Räume");
    cy.get('.card').should('have.length', 2);

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

})
