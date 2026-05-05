/**
 * Override for visit
 * Checks final state before performing the visit, to make sure that unexpected errors that may have happened previously are caught.
 */
Cypress.Commands.overwrite("visit", (originalFn, url, options) => {
  return cy
    .wrap(null, { log: false })
    .then(() => {
      cy.checkFinalState();
    })
    .then(() => {
      cy.log(`Visit ${url}`);
      return originalFn(url, options);
    });
});

/**
 * Override for reload
 * Checks final state before performing the reload, to make sure that unexpected errors that may have happened previously are caught.
 */
Cypress.Commands.overwrite("reload", (originalFn, options) => {
  return cy
    .wrap(null, { log: false })
    .then(() => {
      cy.checkFinalState();
    })
    .then(() => {
      cy.log("Reload page");
      return originalFn(options);
    });
});
