import path from "node:path";
import { defineConfig } from "cypress";
import configCodeCoverage from "@cypress/code-coverage/task";
import "dotenv/config";
import { setupBrowserLaunch } from "./tests/Utils/cypress/browser-launch.js";
import { setupChromeForTesting } from "./tests/Utils/cypress/chrome-for-testing.js";

const baseUrl = process.env.APP_URL || "http://localhost";

export default defineConfig({
  downloadsFolder: "tests/Frontend/downloads",
  fixturesFolder: "tests/Frontend/fixtures",
  screenshotsFolder: "tests/Frontend/screenshots",
  videosFolder: "tests/Frontend/videos",

  expose: {
    redirectBaseUrl: "https://thm-health.github.io/PILOS-Redirect_Test_Pages",
  },

  e2e: {
    async setupNodeEvents(on, config) {
      await setupChromeForTesting(config, path.resolve("."));

      configCodeCoverage(on, config);

      setupBrowserLaunch(on);

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },
    baseUrl: baseUrl,
    supportFile: "tests/Frontend/support/e2e.{js,jsx,ts,tsx}",
    specPattern: "tests/Frontend/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },

  viewportWidth: 1280,
  viewportHeight: 800,
});
