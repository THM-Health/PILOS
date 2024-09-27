/**
 * Check that a user who visits this page without being logged in is redirected to the login page
 * @memberof cy
 * @method testVisitWithoutCurrentUser
 * @param  {string} path
 * @returns void
 */
Cypress.Commands.add('testVisitWithoutCurrentUser', (path) => {
  cy.intercept('GET', 'api/v1/currentUser', {});

  cy.visit(path);
  cy.url().should('contain', '/login?redirect=' + path);
});

/**
 * Check a toast message is displayed and has the given text or contains the given texts.
 * Toast message is closed afterwards (default behaviour can be changed).
 * @memberof cy
 * @method checkToastMessage
 * @param  {(string|string[])} messages The text of the toast message or an array of texts that should be contained in the toast message
 * @param  {boolean} [closeToastMessage=true]
 * @returns void
 */
// ToDo multiple toasts (change this or add separate command)
Cypress.Commands.add('checkToastMessage', (messages, closeToastMessage = true) => {
  cy.get('.p-toast-message').should('be.visible');
  if (Array.isArray(messages)) {
    for (const message of messages) {
      cy.get('.p-toast-message').should('include.text', message);
    }
  } else {
    cy.get('.p-toast-message').should('have.text', messages);
  }
  if (closeToastMessage) {
    cy.get('.p-toast-message').find('button').click();
    cy.get('.p-toast-message').should('not.exist');
  }
});
