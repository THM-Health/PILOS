import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const bbbTestServerHost = process.env.BBB_TEST_SERVER_HOST;

export default defineConfig({
  downloadsFolder: "downloads",
  fixturesFolder: "fixtures",
  screenshotsFolder: "screenshots",
  videosFolder: "videos",

  allowCypressEnv: false,

  e2e: {
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
