import { defineConfig } from 'cypress';
import vitePreprocessor from 'cypress-vite';

export default defineConfig({
  e2e: {
    setupNodeEvents (on, config) {
    },
    baseUrl: 'http://localhost:5173',
    experimentalStudio: true
  }
});
