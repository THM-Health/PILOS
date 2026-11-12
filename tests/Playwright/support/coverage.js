import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const nycOutputDir = ".nyc_output";

/**
 * Automatic fixture that collects the istanbul code coverage of the instrumented frontend build
 * (vite-plugin-istanbul, see vite.config.coverage.js). It is a no-op if the app is not instrumented.
 *
 * The coverage object `window.__coverage__` is lost when the page unloads (navigation, reload), so it is sent to Node
 * before every unload and at the end of the test. Every chunk is written as its own file into `.nyc_output`;
 * `npm run coverage:report` merges them with nyc (reporter and includes are configured in `.nycrc.json`).
 */
export const coverageFixture = [
  async ({ context }, use) => {
    mkdirSync(nycOutputDir, { recursive: true });

    await context.exposeFunction("__collectCoverage", (coverage) => {
      writeFileSync(`${nycOutputDir}/${randomUUID()}.json`, coverage);
    });
    await context.addInitScript(() => {
      window.addEventListener("beforeunload", () => {
        if (window.__coverage__) {
          window.__collectCoverage(JSON.stringify(window.__coverage__));
        }
      });
    });

    await use();

    for (const page of context.pages()) {
      const coverage = await page
        .evaluate(
          () => window.__coverage__ && JSON.stringify(window.__coverage__),
        )
        .catch(() => null);
      if (coverage) {
        writeFileSync(`${nycOutputDir}/${randomUUID()}.json`, coverage);
      }
    }
  },
  { auto: true },
];
