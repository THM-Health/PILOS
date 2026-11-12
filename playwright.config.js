import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const baseURL = process.env.APP_URL || "http://localhost";

/**
 * Visual tests use Playwright's native screenshot comparison (expect(...).toHaveScreenshot()).
 * Baselines are committed and must be created/updated with the same Linux environment as CI:
 *   docker run --rm -v "$PWD":/work -w /work --ipc=host mcr.microsoft.com/playwright:v1.65.0-noble \
 *     npx playwright test --project=visual --update-snapshots
 *
 * Projects group the suites (frontend, visual, system) and browsers.
 *   npx playwright test --project=frontend            Chrome for Testing (default for development)
 *   npx playwright test --project=frontend-firefox    Firefox
 *   npx playwright test                               everything
 * Install Firefox with: npx playwright install firefox
 */
export default defineConfig({
  outputDir: "tests/Playwright/test-results",
  // Visual baselines are generated on Linux only (see the visual project), so no platform suffix in the path
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries are enabled on CI to absorb infrastructure hiccups. Tests that only pass on a retry are reported as "flaky"
  // (GitHub annotation + HTML report). Set `failOnFlakyTests: true` to turn them into failures instead.
  retries: process.env.CI ? 2 : 0,
  failOnFlakyTests: false,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL,
    // Same environment as the Cypress setup
    timezoneId: "America/New_York",
    locale: "en-US",
    reducedMotion: "reduce",
    // Use `data-test` attributes for page.getByTestId()
    testIdAttribute: "data-test",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "frontend",
      testDir: "tests/Playwright/frontend",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "frontend-firefox",
      testDir: "tests/Playwright/frontend",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "visual",
      testDir: "tests/Playwright/visual",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        // Same as Cypress visual init: do not mock locale; load English from the real API
        mockLocale: false,
      },
    },
    {
      // All tests share one database that is reset before every test: run with --workers=1
      name: "system",
      testDir: "tests/Playwright/system",
      fullyParallel: false,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        // Real stack started with compose.test.yml
        baseURL: "http://localhost:9080",
      },
    },
  ],
});
