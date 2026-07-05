// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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

// Import commands.js using ES2015 syntax:
import "./commands.js";
import { patchMatchMedia } from "../../Utils/cypress/matchMediaHelper.js";

Cypress.on("window:before:load", (win) => {
  // Set default value for dark mode to false, can be overridden in tests using Cypress.expose("darkMode", true/false)
  Cypress.expose("darkMode", false);

  // Patch the matchMedia function to allow simulating dark mode in tests
  patchMatchMedia(win);
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
