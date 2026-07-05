// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from "cypress";
import configCodeCoverage from "@cypress/code-coverage/task";
import "dotenv/config";

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
    setupNodeEvents(on, config) {
      configCodeCoverage(on, config);

      // include any other plugin code...

      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
          launchOptions.preferences.default.intl = {
            acceptLanguages: "en",
            accept_languages: "en",
            selected_languages: "en",
          };

          launchOptions.args.push("--force-prefers-reduced-motion");

          return launchOptions;
        }

        if (browser.family === "firefox") {
          launchOptions.preferences["intl.accept_languages"] = "en";
          launchOptions.preferences["ui.prefersReducedMotion"] = 1;

          return launchOptions;
        }
      });

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },
    baseUrl: baseUrl,
    experimentalStudio: true,
    supportFile: "tests/Frontend/support/e2e.{js,jsx,ts,tsx}",
    specPattern: "tests/Frontend/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },

  viewportWidth: 1280,
  viewportHeight: 800,
});
