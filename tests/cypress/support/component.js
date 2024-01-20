// ***********************************************************
// This example support/component.js is processed and
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
import './commands.js'
import '../../../resources/sass/theme/thm/app.scss'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/vue2'
import {createPinia} from "pinia";
import BootstrapVue from "bootstrap-vue";

Cypress.Commands.add('mount', (component, options ={})=>{
  // Setup options object
  options.extensions = options.extensions || {};
  options.extensions.components = options.extensions.components || {};
  options.extensions.plugins = options.extensions.plugins || [];

  /* Add any global plugins */
  options.extensions.plugins.push({
      install(app) {
        app.use(createPinia());
        app.use(BootstrapVue);
      },
    });

  /* Add any global components */
  // options.extensions.components['Button'] = Button;

  return mount(component, options);
});

// Example use:
// cy.mount(MyComponent)
