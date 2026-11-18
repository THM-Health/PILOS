import { defineConfig } from "vite";
import commonConfig from "./vite.config.common.js";

/**
 * Build for the code coverage of the Playwright tests: the browser measures the coverage and maps it to the source with the
 * source maps. Without minification, otherwise the coverage can not be mapped to lines precisely.
 */
export default ({ mode }) => {
  const config = commonConfig(mode);

  config.build.sourcemap = true;
  config.build.minify = false;

  return defineConfig(config);
};
