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
import '../support/commands.js'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/vue'
import {createPinia} from "pinia";
import PrimeVue from "primevue/config";
import '../../../resources/sass/theme/thm/app.scss'

Cypress.Commands.add('mount', (component, options= {}) =>{ //ToDo fix or delete
  // Setup options object
  options.global = options.global || {}
  options.global.plugins = options.global.plugins || []
  options.global.plugins.push(createPinia())
  options.global.plugins.push(PrimeVue)



  return mount(component, options)
})

// Example use:
// cy.mount(MyComponent)
