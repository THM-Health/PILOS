import MCR from "monocart-coverage-reports";
import { coverageOptions } from "./coverage.js";

/**
 * Global setup (only used with `COVERAGE=true`): clears the coverage cache and returns the teardown that creates the report.
 */
export default async function globalSetup() {
  await MCR(coverageOptions).cleanCache();

  return async () => {
    await MCR(coverageOptions).generate();
  };
}
