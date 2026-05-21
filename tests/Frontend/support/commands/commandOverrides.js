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
Cypress.Commands.overwrite("visit", (originalFn, urlOrOptions, options) => {
  return cy.checkFinalState().then(() => {
    // Determine url and options based on the arguments passed to visit
    // Add log: false to options to prevent logging the original visit command
    const url = typeof urlOrOptions === "string" ? urlOrOptions : undefined;
    const visitOptions =
      typeof urlOrOptions === "object" ? urlOrOptions : options;

    // Log the visit command with url and options
    Cypress.log({
      name: "visit",
      message: url ? url : visitOptions.url,
      consoleProps: () => {
        return {
          Options: visitOptions,
        };
      },
    });

    // Call the original visit function with the modified url and options
    if (url !== undefined) {
      return originalFn(url, {
        log: false,
        ...visitOptions,
      });
    } else {
      return originalFn({
        log: false,
        ...visitOptions,
      });
    }
  });
});

/**
 * Override for reload
 * Checks final state before performing the reload, to make sure that unexpected errors that may have happened previously are caught.
 */
Cypress.Commands.overwrite(
  "reload",
  (originalFn, forceReloadOrOptions, options) => {
    return cy.checkFinalState().then(() => {
      // Determine forceReload and options based on the arguments passed to reload
      // Add log: false to options to prevent logging the original reload command
      const forceReload =
        typeof forceReloadOrOptions === "boolean"
          ? forceReloadOrOptions
          : undefined;

      const reloadOptions =
        typeof forceReloadOrOptions === "object"
          ? forceReloadOrOptions
          : options;

      // Log the reload command with the modified forceReload and options
      Cypress.log({
        name: "reload",
        message: "",
        consoleProps: () => {
          return {
            "Force reload": forceReload !== undefined ? forceReload : undefined,
            Options: reloadOptions,
          };
        },
      });

      // Call the original reload function with the modified forceReload and options
      if (forceReload !== undefined) {
        return originalFn(forceReload, {
          log: false,
          ...reloadOptions,
        });
      } else {
        return originalFn({
          log: false,
          ...reloadOptions,
        });
      }
    });
  },
);
