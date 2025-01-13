import { defineConfig } from "cypress";
import "dotenv/config";
import happoTask from "happo-cypress/task.js";

const baseUrl = process.env.APP_URL || "http://localhost";
export default defineConfig({
  downloadsFolder: "downloads",
  fixturesFolder: "fixtures",
  screenshotsFolder: "screenshots",
  videosFolder: "videos",

  e2e: {
    setupNodeEvents(on, config) {
      happoTask.register(on);

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },

    baseUrl: baseUrl,
    experimentalStudio: true,
    supportFile: "support/e2e.{js,jsx,ts,tsx}",
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",
  },

  viewportWidth: 1280,
  viewportHeight: 800,
});
