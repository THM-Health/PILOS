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
Cypress.Commands.add('checkToastMessage', (messages, closeToastMessage = true) => {
  cy.contains('.p-toast-message', Array.isArray(messages) ? messages[0] : messages).then(($toast) => {
    cy.wrap($toast, { log: false }).should('be.visible');

    if (Array.isArray(messages)) {
      for (const message of messages) {
        cy.wrap($toast, { log: false }).should('include.text', message);
      }
    } else {
      cy.wrap($toast, { log: false }).should('have.text', messages);
    }
    cy.wrap($toast, { log: false }).find('button').click();
    cy.wrap($toast, { log: false }).should('not.exist');
  });
});
