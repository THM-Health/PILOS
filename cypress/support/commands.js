// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('bypassLogin', (name, password)=>{
  //ToDo should normally be done with request not with ui
  cy.session([name,password], () =>{
    cy.visit('/login');
    cy.get('#__BVID__33___BV_tab_button__').click();
    cy.get('#localEmail').type(name);
    cy.get('#localPassword').type(password);
    cy.get('button').eq(2).contains('Login').click();
    //check if redirected to /rooms
    cy.url().should('include', '/room');
  },
    {
      cacheAcrossSpecs:true
    }
  )

})
