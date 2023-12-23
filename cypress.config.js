import { defineConfig } from "cypress";

export default defineConfig({
  port: 5176, //ToDo find port that works with component testing
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: "http://localhost:5173",
    experimentalStudio: true,
  },

  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
