import { defineConfig } from 'cypress';
import 'dotenv/config'

const baseUrl = process.env.APP_URL  || 'http://localhost';

export default defineConfig({

  downloadsFolder: 'tests/Frontend/downloads',
  fixturesFolder: 'tests/Frontend/fixtures',
  screenshotsFolder: 'tests/Frontend/screenshots',
  videosFolder: 'tests/Frontend/videos',

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: baseUrl,
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
