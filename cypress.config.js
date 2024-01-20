import { defineConfig } from "cypress";

export default defineConfig({
  port: 5177, //ToDo find port that works with component testing
  downloadsFolder: 'test/cypress/downloads',
  fixturesFolder: 'tests/cypress/fixtures',
  screenshotsFolder: 'tests/cypress/screenshots',
  videosFolder: 'tests/cypress/videos',
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: "http://localhost",
    experimentalStudio: true,
    supportFile: 'tests/cypress/support/e2e.{js,jsx,ts,tsx}',
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  },

  component: {
    indexHtmlFile: 'tests/cypress/support/component-index.html',
    supportFile: 'tests/cypress/support/component.js',
    specPattern: 'tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
