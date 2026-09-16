import { defineConfig } from "cypress";
import "dotenv/config";
import happoTask from "happo/cypress/task";
import { setupChromeForTesting } from "../Utils/cypress/chrome-for-testing.js";

const baseUrl = process.env.APP_URL || "http://localhost";
export default defineConfig({
  downloadsFolder: "downloads",
  fixturesFolder: "fixtures",
  screenshotsFolder: "screenshots",
  videosFolder: "videos",

  allowCypressEnv: false,

  e2e: {
    async setupNodeEvents(on, config) {
      happoTask.register(on);

      await setupChromeForTesting(config);

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },

    baseUrl: baseUrl,
    supportFile: "support/e2e.{js,jsx,ts,tsx}",
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",
  },

  viewportWidth: 1280,
  viewportHeight: 800,
});
