import MCR from "monocart-coverage-reports";

/**
 * Code coverage of the frontend (opt-in with `COVERAGE=true`, Chromium only).
 *
 * The coverage is measured by the browser itself (V8) and mapped back to the source files (`resources/js/**`, including
 * the `<script>` of the Vue SFCs) with the source maps of the build. No instrumentation is needed, but the frontend must
 * be built with source maps and without minification: `npm run build -- --config vite.config.coverage.js`.
 * Every test adds its coverage to a shared cache, the report is created after the run (see `coverage-setup.js`).
 */
export const coverageOptions = {
  name: "PILOS frontend coverage",
  outputDir: "coverage",
  reports: [["lcovonly"], ["json"], ["console-summary"]],
  sourceFilter: (sourcePath) => sourcePath.startsWith("resources/js/"),
  // Only the app chunks have source maps (not the vendor and runtime chunks)
  entryFilter: (entry) =>
    entry.url.includes("/build/assets/") && !/vendor|runtime/.test(entry.url),
};

export const coverageFixture = [
  async ({ page, browserName }, use) => {
    if (!process.env.COVERAGE || browserName !== "chromium") {
      await use();
      return;
    }

    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use();
    const coverage = await page.coverage.stopJSCoverage();
    await MCR(coverageOptions).add(coverage);
  },
  { auto: true },
];
