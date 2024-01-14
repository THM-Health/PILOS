
describe('example test with laracasts/cypress', () => {

  beforeEach(()=>{
    //Todo
    //Possible to use Factories with cy.create(...) ?

    //Using login to log in an existing user or create a new user and log in this user
    cy.login({email:'admin@test.de'});
  })
  it('visit rooms', () =>{
    //get current user and check if set correctly
    cy.currentUser().its('email').should('equal', 'admin@test.de');
    cy.visit('/rooms');

    cy.get('.card').should('have.length', 9);

    //change user
    cy.logout();
    cy.login({email:'test2@test.de'});
    cy.visit('/rooms');
    cy.contains('DarfKeine RäumeErstellen');
    cy.contains("Räume");
    cy.get('.card').should('have.length', 2);
  });

  it('visit meetings', () => {
    cy.visit('/meetings');
    cy.contains('Admin Test');
    cy.contains("Laufende Meetings");
  })

  it('visit settings', () => {
    cy.visit('/settings');
    cy.contains('Admin Test');
    cy.contains("Einstellungen");
  });

})
