import { defineConfig } from 'cypress';

export default defineConfig({
  //ToDo find port that works (only necessary for component testing)
  port: 5178,

  downloadsFolder: 'tests/Frontend/downloads',
  fixturesFolder: 'tests/Frontend/fixtures',
  screenshotsFolder: 'tests/Frontend/screenshots',
  videosFolder: 'tests/Frontend/videos',

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost',
    experimentalStudio: true,
    supportFile: 'tests/Frontend/support/e2e.{js,jsx,ts,tsx}',
    specPattern: 'tests/Frontend/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },

  component: {
    indexHtmlFile: 'tests/Frontend/support/component-index.html',
    supportFile: 'tests/Frontend/support/component.js',
    specPattern: 'tests/Frontend/component/**/*.cy.{js,jsx,ts,tsx}',
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
});
