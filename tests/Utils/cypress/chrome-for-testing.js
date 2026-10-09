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
  uninstall,
} from "@puppeteer/browsers";

const BROWSER_NAME = "chrome-for-testing";

/**
 * Register Chrome for Testing with Cypress and set it as the default browser.
 *
 * @param config Cypress configuration object
 * @param {string} cacheDir Parent of the two Chrome caches.
 *   User installs live in `<cacheDir>/chrome` and are left untouched.
 *   The auto-updated stable build lives in `<cacheDir>/chrome/latest`.
 * @returns {Promise<void>}
 */
export async function setupChromeForTesting(config, cacheDir) {
  // Check if chrome for testing is already installed in the operating system (e.g. in CI)
  const hasSystemChromeForTesting = hasChromeForTesting(config);

  // Register user installs from the chrome cache under versioned names
  const chromeCacheBrowsers = await getInstalledChromeBrowsers(cacheDir);
  config.browsers = config.browsers.concat(
    chromeCacheBrowsers.map((chrome) => toCypressBrowser(chrome)),
  );

  // Auto-install the latest stable build into chrome/latest when the OS has none
  if (!hasSystemChromeForTesting) {
    const latestChrome = await ensureLatestChromeForTesting(cacheDir);
    config.browsers.push(toCypressBrowser(latestChrome, true));
  }

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
 * List Chrome for Testing installs in a Puppeteer cache, newest first.
 * Returns an empty list when `<cacheDir>/chrome` does not exist yet.
 *
 * @param {string} cacheDir Puppeteer cache root. Binaries live in `<cacheDir>/chrome`.
 * @returns {Promise<Array<{ buildId: string, executablePath: string }>>}
 */
async function getInstalledChromeBrowsers(cacheDir) {
  if (!fs.existsSync(path.join(cacheDir, "chrome"))) {
    return [];
  }

  const compareVersions = getVersionComparator(Browser.CHROME);

  return (await getInstalledBrowsers({ cacheDir }))
    .filter(
      ({ browser, executablePath }) =>
        browser === Browser.CHROME && fs.existsSync(executablePath),
    )
    .sort((a, b) => compareVersions(b.buildId, a.buildId))
    .map(({ buildId, executablePath }) => {
      return { buildId, executablePath };
    });
}

/**
 * Convert an installed Chrome for Testing build into a browser descriptor.
 *
 * @param {{ buildId: string, executablePath: string }} chrome
 * @param {boolean} canonical
 *   When true, registers the build as `chrome-for-testing` instead of a
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
function toCypressBrowser(chrome, canonical = false) {
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
 * Install the current stable build into the chrome/latest cache when it is missing,
 * uninstall older builds from that cache, and return the stable install.
 * User installs in the chrome cache are not removed.
 * Binaries live in `<cacheDir>/chrome/latest/chrome`.
 *
 * @param {string} cacheDir Parent of the chrome and chrome/latest caches
 * @returns {Promise<{ buildId: string, executablePath: string }>}
 */
async function ensureLatestChromeForTesting(cacheDir) {
  const latestCache = path.join(cacheDir, "chrome", "latest");
  const latestBuildId = await resolveBuildId(
    Browser.CHROME,
    detectBrowserPlatform(),
    BrowserTag.STABLE,
  );
  const latestCacheBrowsers = await getInstalledChromeBrowsers(latestCache);
  let latestChrome = latestCacheBrowsers.find(
    (chrome) => chrome.buildId === latestBuildId,
  );

  // Only install the latest stable build if it is not already installed
  if (!latestChrome) {
    console.info("Missing Chrome for Testing, installing...");

    const browser = await install({
      browser: Browser.CHROME,
      buildId: latestBuildId,
      cacheDir: latestCache,
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

    latestChrome = {
      buildId: browser.buildId,
      executablePath: browser.executablePath,
    };
  }

  // Cleanup, uninstall all-non-latest chrome for testing
  const uninstalls = [];
  latestCacheBrowsers.forEach((chrome) => {
    if (chrome.buildId === latestBuildId) {
      return;
    }

    uninstalls.push(
      uninstall({
        browser: Browser.CHROME,
        buildId: chrome.buildId,
        cacheDir: latestCache,
      }),
    );
  });
  await Promise.all(uninstalls);

  return latestChrome;
}
