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

Cypress.Commands.add('seed', () => {
  cy.exec('docker compose -f ../../compose.test.yml exec app pilos-cli demo:create --force');
});

Cypress.Commands.add('loginAs', (name) => {
  const validCredentials = [
    { name: 'john', email: 'john.doe@example.org', password: 'johndoe' },
    { name: 'daniel', email: 'daniel.osorio@example.org', password: 'danielosorio' },
    { name: 'angela', email: 'angela.jones@example.org', password: 'angelajones' },
    { name: 'hoyt', email: 'hoyt.hastings@example.org', password: 'hoythastings' },
    { name: 'william', email: 'william.white@example.org', password: 'williamwhite' },
    { name: 'thomas', email: 'thomas.bolden@example.org', password: 'thomasbolden' }
  ];

  const user = validCredentials.find((user) => user.name === name);

  cy.visit('/login');

  // Check if ldap login tab is shown correctly and click on login button
  cy.get('[data-test="login-tab-local"]').within(() => {
    cy.get('#local-email').type(user.email);
    cy.get('#local-password').type(user.password);

    cy.get('.p-button').should('have.text', 'Login').click();
  });

  // Check toast message
  cy.get('.p-toast').should('be.visible').and('have.text', 'Successfully logged in');
});

Cypress.Commands.add('testVisitWithoutCurrentUser', (path) => {
  cy.intercept('GET', 'api/v1/currentUser', {});

  cy.visit(path);
  cy.url().should('include', '/login?redirect=' + path);
});
