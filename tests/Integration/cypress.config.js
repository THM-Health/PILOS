import { defineConfig } from 'cypress';

export default defineConfig({

  downloadsFolder: 'downloads',
  fixturesFolder: 'fixtures',
  screenshotsFolder: 'screenshots',
  videosFolder: 'videos',

  e2e: {
    baseUrl: 'http://localhost:9080',
    experimentalStudio: true,
    supportFile: 'support/e2e.{js,jsx,ts,tsx}',
    specPattern: 'e2e/**/*.cy.{js,jsx,ts,tsx}',
  }
});
