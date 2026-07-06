// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Check that the final state of the test is correct, e.g. that there are no unexpected error toasts.
 * This should be called at the end of every test to make sure that unexpected errors aren't missed in the tests.
 * @memberof cy
 * @method checkFinalState
 * @returns {Cypress.Chainable<void>}
 */
Cypress.Commands.add("checkFinalState", () => {
  return cy.url({ log: false }).then((currentUrl) => {
    const currentOrigin = new URL(currentUrl).origin;
    const baseOrigin = new URL(Cypress.config().baseUrl).origin;

    if (currentOrigin === baseOrigin) {
      cy.log("Check final state");
      // Check that all toasts that maybe have been created during the test have been removed
      // This makes sure that unexpected error toasts that are not handled in the test will cause the test to fail,
      // which makes sure that we don't miss any unexpected errors in the tests
      cy.get(".p-toast-message").should("not.exist");
    }
  });
});

/**
 * Check that a user who visits this page without being logged in is redirected to the login page
 * @memberof cy
 * @method testVisitWithoutCurrentUser
 * @param  {string} path
 * @returns void
 */
Cypress.Commands.add("testVisitWithoutCurrentUser", (path) => {
  cy.intercept("GET", "api/v1/currentUser", {});

  cy.visit(path);
  cy.url().should("contain", "/login?redirect=" + path);
});

/**
 * Check a toast message is displayed and has the given text or contains the given texts.
 * Toast message is closed afterwards (default behaviour can be changed).
 * @memberof cy
 * @method checkToastMessage
 * @param  {(string|string[])} messages The text of the toast message or an array of texts that should be contained in the toast message
 * @returns void
 */
Cypress.Commands.add("checkToastMessage", (messages) => {
  cy.contains(
    ".p-toast-message",
    Array.isArray(messages) ? messages[0] : messages,
  ).then(($toast) => {
    cy.wrap($toast, { log: false }).should("be.visible");

    if (Array.isArray(messages)) {
      for (const message of messages) {
        cy.wrap($toast, { log: false }).should("include.text", message);
      }
    } else {
      cy.wrap($toast, { log: false }).should("have.text", messages);
    }
    cy.wrap($toast, { log: false }).find("button").click();
    cy.wrap($toast, { log: false }).should("not.exist");
  });
});
