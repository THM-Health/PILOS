import fs from "node:fs";
import path from "node:path";
import * as readline from "node:readline";
import {
  Browser,
  BrowserTag,
  detectBrowserPlatform,
  getInstalledBrowsers,
  getVersionComparator,
  install,
  resolveBuildId,
} from "@puppeteer/browsers";

const BROWSER_NAME = "chrome-for-testing";

/** Directory where this helper downloads Chrome for Testing binaries (`<cwd>/chrome`). */
const CACHE_DIR = path.resolve(".");

/**
 * Register Chrome for Testing with Cypress and set it as the default browser.
 *
 * @param config Cypress configuration object
 * @returns {Promise<void>}
 */
export async function setupChromeForTesting(config) {
  // Check if chrome for testing is already installed in the operating system (e.g. in CI)
  const hasSystemChromeForTesting = hasChromeForTesting(config);

  // Get the latest stable build ID from the browser database
  const stableBuildId = await getLatestStableBuildId();

  // Get list of local Chrome for Testing installs
  let localBrowsers = await getLocalChromeBrowsers();

  // Check if the latest stable build is already installed locally
  const hasLocalStable = localBrowsers.some(
    (chrome) => chrome.buildId === stableBuildId,
  );

  // Install the latest stable build if it is not already installed
  if (!hasSystemChromeForTesting && !hasLocalStable) {
    await installChromeForTesting(stableBuildId);
    localBrowsers = await getLocalChromeBrowsers();
  }

  // Add local browsers to list of supported browsers
  config.browsers = config.browsers.concat(
    localBrowsers.map((chrome) =>
      toCypressBrowser(chrome, {
        canonical:
          !hasSystemChromeForTesting && chrome.buildId === stableBuildId,
      }),
    ),
  );

  // Set Chrome for Testing as the default browser
  if (hasChromeForTesting(config)) {
    config.defaultBrowser = BROWSER_NAME;
  }
}

/**
 * Check if the browser list has one browser with the name "chrome-for-testing".
 *
 * @param config Cypress configuration object
 * @returns {boolean}
 */
function hasChromeForTesting(config) {
  return config.browsers.some((browser) => browser.name === BROWSER_NAME);
}

/**
 * Get list of local Chrome for Testing installs, newest first.
 * Returns an empty list when the download directory does not exist yet.
 *
 * @returns {Promise<Array<{ buildId: string, executablePath: string }>>}
 */
async function getLocalChromeBrowsers() {
  if (!fs.existsSync(path.join(CACHE_DIR, "chrome"))) {
    return [];
  }

  const compareVersions = getVersionComparator(Browser.CHROME);

  return (await getInstalledBrowsers({ cacheDir: CACHE_DIR }))
    .filter(
      ({ browser, executablePath }) =>
        browser === Browser.CHROME && fs.existsSync(executablePath),
    )
    .sort((a, b) => compareVersions(b.buildId, a.buildId))
    .map((chrome) => {
      return {
        buildId: chrome.buildId,
        executablePath: chrome.executablePath,
      };
    });
}

/**
 * Convert a local Chrome for Testing install into a browser descriptor.
 *
 * @param {{ buildId: string, executablePath: string }} chrome
 * @param {{ canonical: boolean }} options
 *   `canonical` registers the build as `chrome-for-testing` instead of a
 *   versioned name.
 * @returns {{
 *   name: string,
 *   family: string,
 *   channel: string,
 *   displayName: string,
 *   version: string,
 *   majorVersion: number,
 *   path: string,
 * }}
 */
function toCypressBrowser(chrome, { canonical }) {
  return {
    name: canonical ? BROWSER_NAME : `${BROWSER_NAME}-${chrome.buildId}`,
    family: "chromium",
    channel: "stable",
    displayName: "Chrome for Testing",
    version: chrome.buildId,
    majorVersion: Number.parseInt(chrome.buildId, 10),
    path: chrome.executablePath,
  };
}

/**
 * Get the latest stable build ID from the browser database.
 *
 * @returns {Promise<string>}
 */
async function getLatestStableBuildId() {
  const platform = detectBrowserPlatform();

  return resolveBuildId(Browser.CHROME, platform, BrowserTag.STABLE);
}

/**
 * Install Chrome for Testing.
 *
 * @param {string} buildId
 * @returns {Promise<void>}
 */
async function installChromeForTesting(buildId) {
  console.info("Missing Chrome for Testing, installing...");

  await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir: CACHE_DIR,
    downloadProgressCallback: (downloadedBytes, totalBytes) => {
      const progressPercentage = Math.floor(
        (downloadedBytes / totalBytes) * 100,
      );

      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0, null);
      process.stdout.write(
        `Downloading Chrome for Testing: ${progressPercentage}%`,
      );
    },
  });

  console.info("\nChrome for Testing installed successfully");
}
