import fs from "node:fs";
import path from "node:path";
import { getInstalledBrowsers } from "@puppeteer/browsers";

export async function findChromeForTesting() {
  const cacheDirectory = path.resolve(".");

  if (!fs.existsSync(path.join(cacheDirectory, "chrome"))) {
    return [];
  }

  const installedBrowsers = await getInstalledBrowsers({
    cacheDir: cacheDirectory,
  });
  return installedBrowsers
    .filter(
      ({ browser, executablePath }) =>
        browser === "chrome" && fs.existsSync(executablePath),
    )
    .map((chrome) => ({
      name: `chrome-for-testing-${chrome.buildId}`,
      family: "chromium",
      channel: "stable",
      displayName: `Chrome for Testing`,
      version: chrome.buildId,
      majorVersion: Number.parseInt(chrome.buildId, 10),
      path: chrome.executablePath,
    }));
}
