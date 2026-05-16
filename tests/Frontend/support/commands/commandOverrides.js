// Override for window.it used for all tests, to check the final state after each test, to make sure that unexpected errors
// or states that may have happened during the test are caught.

const originalIt = window.it;

window.it = function (title, optionsOrFunction, fn) {
  // Determine test function and options based on the arguments passed to it
  const testFn =
    typeof optionsOrFunction === "function" ? optionsOrFunction : fn;
  const testOptions =
    typeof optionsOrFunction === "object" ? { ...optionsOrFunction } : {};

  if (typeof testFn !== "function") {
    // Call the original it function with the provided arguments
    // This is necessary to make it.skip work correctly
    return originalIt(title, optionsOrFunction, fn);
  }

  // Call the original it function with the modified test function and options
  return originalIt(title, testOptions, function () {
    testFn();
    cy.checkFinalState();
  });
};

// Add the original it.only and it.skip methods to the window object
// originalIt.only and originalIt.skip will use the overridden window.it function
window.it.only = originalIt.only;
window.it.skip = originalIt.skip;

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
      cy.log(`Visit ${url}`).then(() => {
        return originalFn(url, options);
      });
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
      cy.log("Reload").then(() => {
        return originalFn(options);
      });
    });
});
