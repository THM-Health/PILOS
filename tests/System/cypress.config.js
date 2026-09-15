import { defineConfig } from "cypress";
import { execFileSync } from "child_process";
import dotenv from "dotenv";
import { findChromeForTesting } from "../Utils/cypress/chrome-for-testing.js";

dotenv.config({ path: "../../.env" });

const bbbTestServerHost = process.env.BBB_TEST_SERVER_HOST;

export default defineConfig({
  downloadsFolder: "downloads",
  fixturesFolder: "fixtures",
  screenshotsFolder: "screenshots",
  videosFolder: "videos",

  allowCypressEnv: false,

  e2e: {
    async setupNodeEvents(on, config) {
      const chromeForTesting = await findChromeForTesting();

      if (chromeForTesting.length > 0) {
        config.browsers = config.browsers.concat(chromeForTesting);
      }

      on("task", {
        seed() {
          execFileSync(
            "docker",
            [
              "compose",
              "-f",
              "../../compose.test.yml",
              "exec",
              "app",
              "pilos-cli",
              "demo:create",
              "--force",
              "--disable-bbb-session-check",
            ],
            {
              stdio: "pipe",
            },
          );

          return null;
        },
      });

      return config;
    },
    baseUrl: "http://localhost:9080",
    supportFile: "support/e2e.{js,jsx,ts,tsx}",
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",
  },

  expose: {
    BBB_TEST_SERVER_HOST: bbbTestServerHost,
  },

  viewportWidth: 1280,
  viewportHeight: 800,
});
