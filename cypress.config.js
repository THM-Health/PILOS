import { defineConfig } from 'cypress';
import  index from './cypress/plugins/index.js';

export default defineConfig({
  port: 9998, //ToDo find port that works with component testing
  chromeWebSecurity: false,
  retries: 0,
  defaultCommandTimeout: 5000,
  watchForFileChanges: false,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixture',
  e2e: {
    setupNodeEvents(on, config) {
      return index(on, config)
    },
    baseUrl: 'http://localhost',
    experimentalStudio: true,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/index.js',
  },
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
