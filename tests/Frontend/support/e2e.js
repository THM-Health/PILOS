// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands/generalCommands.js";
import "./commands/roomCommands.js";
import "./commands/interceptCommands.js";
import "./commands/adminRoomTypesCommands.js";
import "./commands/adminSettingsCommands.js";
import "./commands/adminRolesCommands.js";
import "@cypress/code-coverage/support";

Cypress.on("uncaught:exception", (err) => {
  // Check if error should be ignored
  if (
    err.message.includes(
      "ResizeObserver loop completed with undelivered notifications.",
    )
  ) {
    // Ignore the error
    return false;
  }
});
