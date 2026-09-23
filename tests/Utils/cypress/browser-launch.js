/**
 * Apply the same browser launch settings to every Cypress suite.
 *
 * @param on Cypress plugin event registrar
 * @returns {void}
 */
export function setupBrowserLaunch(on) {
  on("before:browser:launch", (browser, launchOptions) => {
    if (browser.family === "chromium") {
      launchOptions.preferences.default.intl = {
        acceptLanguages: "en",
        accept_languages: "en",
        selected_languages: "en",
      };

      launchOptions.preferences.default.profile = {
        password_manager_leak_detection: false,
      };

      launchOptions.args.push("--force-prefers-reduced-motion");

      return launchOptions;
    }

    if (browser.family === "firefox") {
      launchOptions.preferences["intl.accept_languages"] = "en";
      launchOptions.preferences["ui.prefersReducedMotion"] = 1;

      return launchOptions;
    }
  });
}
