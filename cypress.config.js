import { defineConfig } from "cypress";

export default defineConfig({
  port: 5176, //ToDo find port that works with component testing
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: "http://localhost",
    experimentalStudio: true,
  },

  component: {
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
