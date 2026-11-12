import { readFileSync } from "node:fs";
import { test } from "../support/fixtures/adminSettings.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  getFileContentType,
  mockMethod,
  nthRequest,
  parseFormData,
} from "../support/utils.js";
import {
  checkSettingsImageSelector,
  checkSettingsFileSelector,
} from "../support/admin.js";

test.use({ authenticated: true });

test.describe("Admin settings with edit permission", () => {
  let saveButton;

  test.beforeEach(async ({ page, config, currentUser }) => {
    currentUser.data.permissions = [
      "admin.view",
      "settings.viewAny",
      "settings.update",
    ];

    // Add favicon settings to config because otherwise page will always
    // be reloaded if settings are saved
    config.data.theme.favicon = "/images/favicon.ico";
    config.data.theme.favicon_dark = "/images/favicon-dark.ico";

    saveButton = page.getByTestId("settings-save-button");
  });

  test.describe("application", () => {
    test("shows the application settings", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.application")).toBeVisible();

      const nameField = page.getByTestId("application-name-field");
      await expect(nameField).toBeVisible();
      await expect(nameField).toContainText("admin.settings.name.title");
      await expect(nameField).toContainText("admin.settings.name.description");
      await expect(nameField.locator("#application-name")).toHaveValue(
        "Test Application",
      );

      const helpUrlField = page.getByTestId("help-url-field");
      await expect(helpUrlField).toBeVisible();
      await expect(helpUrlField).toContainText("admin.settings.help_url.title");
      await expect(helpUrlField).toContainText(
        "admin.settings.help_url.description",
      );
      await expect(helpUrlField.locator("#help-url")).toHaveValue("");

      const legalNoticeField = page.getByTestId("legal-notice-url-field");
      await expect(legalNoticeField).toBeVisible();
      await expect(legalNoticeField).toContainText(
        "admin.settings.legal_notice_url.title",
      );
      await expect(legalNoticeField).toContainText(
        "admin.settings.legal_notice_url.description",
      );
      await expect(legalNoticeField.locator("#legal-notice-url")).toHaveValue(
        "",
      );

      const privacyField = page.getByTestId("privacy-policy-url-field");
      await expect(privacyField).toBeVisible();
      await expect(privacyField).toContainText(
        "admin.settings.privacy_policy_url.title",
      );
      await expect(privacyField).toContainText(
        "admin.settings.privacy_policy_url.description",
      );
      await expect(privacyField.locator("#privacy-policy-url")).toHaveValue("");

      const accessibilityField = page.getByTestId(
        "accessibility-statement-url-field",
      );
      await expect(accessibilityField).toContainText(
        "admin.settings.accessibility_statement_url.title",
      );
      await expect(accessibilityField).toContainText(
        "admin.settings.accessibility_statement_url.description",
      );
      await expect(
        accessibilityField.locator("#accessibility-statement-url"),
      ).toHaveValue("");

      const pageSizeField = page.getByTestId("pagination-page-size-field");
      await expect(pageSizeField).toBeVisible();
      await expect(pageSizeField).toContainText(
        "admin.settings.pagination_page_size.title",
      );
      await expect(pageSizeField).toContainText(
        "admin.settings.pagination_page_size.description",
      );
      await expect(pageSizeField.locator("#pagination-page-size")).toHaveValue(
        "5",
      );

      const noWelcomePageField = page.getByTestId("no-welcome-page-field");
      await expect(noWelcomePageField).toBeVisible();
      await expect(noWelcomePageField).toContainText(
        "admin.settings.no_welcome_page",
      );
      await expect(
        noWelcomePageField.locator("#no-welcome-page"),
      ).toBeChecked();
    });

    test("shows the toast lifetime setting and the custom input", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("toast-lifetime-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.toast_lifetime.title");
      await expect(field).toContainText(
        "admin.settings.toast_lifetime.description",
      );

      const unlimitedField = field.getByTestId(
        "toast-lifetime-mode-unlimited-field",
      );
      await expect(unlimitedField).toBeVisible();
      await expect(unlimitedField).toContainText("app.unlimited");
      await expect(
        unlimitedField.locator("#toast-lifetime-mode-unlimited"),
      ).toBeChecked();
      await expect(
        unlimitedField.locator("#toast-lifetime-mode-unlimited"),
      ).toBeEnabled();

      const customInput = field.getByTestId("toast-lifetime-custom-input");
      await expect(customInput).toHaveCount(0);

      const customField = field.getByTestId("toast-lifetime-mode-custom-field");
      await expect(customField).toBeVisible();
      await expect(customField).toContainText(
        "admin.settings.toast_lifetime.custom",
      );
      const customRadio = customField.locator("#toast-lifetime-mode-custom");
      await expect(customRadio).not.toBeChecked();
      await expect(customRadio).toBeEnabled();
      await customRadio.click();

      await expect(customInput).toBeVisible();
      await expect(customInput).toHaveValue("5");
    });

    test("shows the default timezone setting and changes it", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const items = page.getByTestId("timezone-dropdown-items");
      await expect(items).toHaveCount(0);

      const field = page.getByTestId("default-timezone-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.default_timezone");
      const dropdown = field.getByTestId("timezone-dropdown");
      await expect(dropdown).toHaveText("UTC");
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId("timezone-dropdown-option");
      await expect(options).toHaveText([
        "America/New_York",
        "Australia/Sydney",
        "Europe/Berlin",
        "UTC",
      ]);
      await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");

      await options.nth(2).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("Europe/Berlin");
    });

    test("saves changed application settings", async ({ page, settings }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page.locator("#application-name").fill("PILOS test application");
      await page.locator("#help-url").fill("http://www.pilos.com/help");
      await page
        .locator("#legal-notice-url")
        .fill("http://www.pilos.com/legal_notice");
      await page
        .locator("#privacy-policy-url")
        .fill("http://www.pilos.com/privacy_policy");
      await page
        .locator("#accessibility-statement-url")
        .fill("http://www.pilos.com/accessibility");
      await page.locator("#pagination-page-size").fill("3");

      await page.locator("#toast-lifetime-mode-custom").click();
      await page.getByTestId("toast-lifetime-custom-input").fill("10");

      await page.getByTestId("timezone-dropdown").click();
      await page.getByTestId("timezone-dropdown-option").nth(2).click();
      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "Europe/Berlin",
      );

      await page.locator("#no-welcome-page").click();

      settings.data.general_name = "PILOS test application";
      settings.data.general_help_url = "http://www.pilos.com/help";
      settings.data.general_legal_notice_url =
        "http://www.pilos.com/legal_notice";
      settings.data.general_privacy_policy_url =
        "http://www.pilos.com/privacy_policy";
      settings.data.general_accessibility_statement_url =
        "http://www.pilos.com/accessibility";
      settings.data.general_pagination_page_size = 3;
      settings.data.general_toast_lifetime = 10;
      settings.data.general_default_timezone = "Europe/Berlin";
      settings.data.general_no_welcome_page = false;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("general_name")).toBe("PILOS test application");
      expect(formData.get("general_help_url")).toBe(
        "http://www.pilos.com/help",
      );
      expect(formData.get("general_legal_notice_url")).toBe(
        "http://www.pilos.com/legal_notice",
      );
      expect(formData.get("general_privacy_policy_url")).toBe(
        "http://www.pilos.com/privacy_policy",
      );
      expect(formData.get("general_accessibility_statement_url")).toBe(
        "http://www.pilos.com/accessibility",
      );
      expect(formData.get("general_pagination_page_size")).toBe("3");
      expect(formData.get("general_toast_lifetime")).toBe("10");
      expect(formData.get("general_default_timezone")).toBe("Europe/Berlin");
      expect(formData.get("general_no_welcome_page")).toBe("0");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#application-name")).toHaveValue(
        "PILOS test application",
      );
      await expect(page.locator("#help-url")).toHaveValue(
        "http://www.pilos.com/help",
      );
      await expect(page.locator("#legal-notice-url")).toHaveValue(
        "http://www.pilos.com/legal_notice",
      );
      await expect(page.locator("#privacy-policy-url")).toHaveValue(
        "http://www.pilos.com/privacy_policy",
      );
      await expect(page.locator("#accessibility-statement-url")).toHaveValue(
        "http://www.pilos.com/accessibility",
      );
      await expect(page.locator("#pagination-page-size")).toHaveValue("3");
      await expect(
        page.locator("#toast-lifetime-mode-unlimited"),
      ).not.toBeChecked();
      await expect(
        page.locator("#toast-lifetime-mode-unlimited"),
      ).toBeEnabled();
      await expect(page.locator("#toast-lifetime-mode-custom")).toBeChecked();
      await expect(page.locator("#toast-lifetime-mode-custom")).toBeEnabled();
      await expect(page.getByTestId("toast-lifetime-custom-input")).toHaveValue(
        "10",
      );
      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "Europe/Berlin",
      );
      await expect(page.locator("#no-welcome-page")).not.toBeChecked();
    });

    test("saves cleared url fields and unlimited toast lifetime", async ({
      page,
      settings,
    }) => {
      settings.data.general_name = "PILOS test application";
      settings.data.general_help_url = "http://www.pilos.com/help";
      settings.data.general_legal_notice_url =
        "http://www.pilos.com/legal_notice";
      settings.data.general_privacy_policy_url =
        "http://www.pilos.com/privacy_policy";
      settings.data.general_accessibility_statement_url =
        "http://www.pilos.com/accessibility";
      settings.data.general_pagination_page_size = 3;
      settings.data.general_toast_lifetime = 10;
      settings.data.general_default_timezone = "Europe/Berlin";
      settings.data.general_no_welcome_page = false;
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page.locator("#help-url").fill("");
      await page.locator("#legal-notice-url").fill("");
      await page.locator("#privacy-policy-url").fill("");
      await page.locator("#accessibility-statement-url").fill("");

      await page.locator("#toast-lifetime-mode-unlimited").click();
      await expect(page.getByTestId("toast-lifetime-custom-input")).toHaveCount(
        0,
      );

      settings.data.general_help_url = null;
      settings.data.general_legal_notice_url = null;
      settings.data.general_privacy_policy_url = null;
      settings.data.general_accessibility_statement_url = null;
      settings.data.general_toast_lifetime = 0;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("general_name")).toBe("PILOS test application");
      expect(formData.get("general_help_url")).toBe("");
      expect(formData.get("general_legal_notice_url")).toBe("");
      expect(formData.get("general_privacy_policy_url")).toBe("");
      expect(formData.get("general_accessibility_statement_url")).toBe("");
      expect(formData.get("general_pagination_page_size")).toBe("3");
      expect(formData.get("general_toast_lifetime")).toBe("0");
      expect(formData.get("general_default_timezone")).toBe("Europe/Berlin");
      expect(formData.get("general_no_welcome_page")).toBe("0");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#application-name")).toHaveValue(
        "PILOS test application",
      );
      await expect(page.locator("#help-url")).toHaveValue("");
      await expect(page.locator("#legal-notice-url")).toHaveValue("");
      await expect(page.locator("#privacy-policy-url")).toHaveValue("");
      await expect(page.locator("#accessibility-statement-url")).toHaveValue(
        "",
      );
      await expect(page.locator("#pagination-page-size")).toHaveValue("3");
      await expect(
        page.locator("#toast-lifetime-mode-unlimited"),
      ).toBeChecked();
      await expect(
        page.locator("#toast-lifetime-mode-unlimited"),
      ).toBeEnabled();
      await expect(
        page.locator("#toast-lifetime-mode-custom"),
      ).not.toBeChecked();
      await expect(page.locator("#toast-lifetime-mode-custom")).toBeEnabled();
      await expect(page.getByTestId("toast-lifetime-custom-input")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "Europe/Berlin",
      );
      await expect(page.locator("#no-welcome-page")).not.toBeChecked();
    });
  });

  test.describe("theme without page reload", () => {
    test("shows the logo setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.theme.title")).toBeVisible();

      const field = page.getByTestId("logo-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.logo.title");
      await checkSettingsImageSelector(
        page,
        field,
        "/images/logo.svg",
        "logo.svg",
        false,
      );
    });

    test("shows the dark logo setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("logo-dark-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.logo_dark.title");
      await checkSettingsImageSelector(
        page,
        field,
        "/images/logo-dark.svg",
        "logo-dark.svg",
        false,
      );
    });

    test("selects the primary color with the custom color input", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("primary-color-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.theme.primary_color");
      const buttons = field.getByTestId("color-button");
      const selectedButtons = buttons.and(page.locator(".selected"));
      await expect(buttons).toHaveCount(10);
      await expect(buttons.and(page.locator("[role=button]"))).toHaveCount(10);
      await expect(
        buttons.and(
          page.locator(".pointer-events-none.cursor-not-allowed.opacity-80"),
        ),
      ).toHaveCount(0);
      await expect(buttons.nth(4)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(selectedButtons).toHaveCount(1);

      // Clear custom color and check that color buttons are not selected
      const input = field.locator("#theme-primary-color");
      await expect(input).toHaveValue("#22c55e");
      await expect(input).toBeEnabled();
      await input.fill("");
      await expect(buttons).toHaveCount(10);
      await expect(selectedButtons).toHaveCount(0);

      // Set custom color and check that color button is selected
      await input.fill("#14b8a6");
      await expect(buttons).toHaveCount(10);
      await expect(buttons.nth(3)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(selectedButtons).toHaveCount(1);
    });

    test("saves uploaded logos, primary color and rounded setting without reload", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page
        .getByTestId("logo-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "logo.svg",
          mimeType: "image/svg+xml",
          buffer: readFileSync("tests/Playwright/fixtures/files/logo.svg"),
        });
      await page
        .getByTestId("logo-dark-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "logo-dark.svg",
          mimeType: "image/svg+xml",
          buffer: readFileSync("tests/Playwright/fixtures/files/logo-dark.svg"),
        });

      const colorField = page.getByTestId("primary-color-field");
      await colorField.locator("#theme-primary-color").fill("#14b8a6");

      const roundedField = page.getByTestId("theme-rounded-field");
      await expect(roundedField).toBeVisible();
      await expect(roundedField).toContainText("admin.settings.theme.rounded");
      await expect(roundedField.locator("#theme-rounded")).toBeChecked();
      await roundedField.locator("#theme-rounded").click();

      const colorModeField = page.getByTestId(
        "theme-enforced-color-mode-field",
      );
      const colorModeDropdown = page.getByTestId(
        "theme-enforced-color-mode-dropdown",
      );
      await expect(
        page.getByTestId("theme-enforced-color-mode-dropdown-items"),
      ).toHaveCount(0);
      await expect(colorModeField).toBeVisible();
      await expect(colorModeField).toContainText(
        "admin.settings.theme.enforced_color_mode.title",
      );
      await expect(colorModeDropdown).toHaveText(
        "admin.settings.theme.enforced_color_mode.null",
      );
      await colorModeDropdown.click();

      const colorModeItems = page.getByTestId(
        "theme-enforced-color-mode-dropdown-items",
      );
      await expect(colorModeItems).toBeVisible();
      const colorModeOptions = colorModeItems.getByTestId(
        "theme-enforced-color-mode-dropdown-option",
      );
      await expect(colorModeOptions).toHaveCount(3);
      await expect(colorModeOptions.nth(2)).toHaveText(
        "admin.settings.theme.enforced_color_mode.dark",
      );
      await colorModeOptions.nth(2).click();
      await expect(colorModeDropdown).toHaveText(
        "admin.settings.theme.enforced_color_mode.dark",
      );

      settings.data.theme_logo = "/images/logo2.svg";
      settings.data.theme_logo_dark = "/images/logo-dark2.svg";
      settings.data.theme_primary_color = "#14b8a6";
      settings.data.theme_rounded = false;
      settings.data.theme_enforced_color_mode = "dark";
      // Respond with custom css set to check that it is handled correctly in the next request
      settings.data.theme_custom_css = "/storage/styles/theme_custom_css.css";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("theme_favicon_file")).toBeNull();
      expect(formData.get("theme_favicon")).toBe("/images/favicon.ico");
      expect(formData.get("theme_favicon_dark_file")).toBeNull();
      expect(formData.get("theme_favicon_dark")).toBe(
        "/images/favicon-dark.ico",
      );
      const logoFile = formData.get("theme_logo_file");
      expect(logoFile.name).toBe("logo.svg");
      expect(logoFile.type).toBe("image/svg+xml");
      expect(Buffer.from(await logoFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/logo.svg"),
      );
      expect(formData.get("theme_logo")).toBeNull();
      const logoDarkFile = formData.get("theme_logo_dark_file");
      expect(logoDarkFile.name).toBe("logo-dark.svg");
      expect(logoDarkFile.type).toBe("image/svg+xml");
      expect(Buffer.from(await logoDarkFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/logo-dark.svg"),
      );
      expect(formData.get("theme_logo_dark")).toBeNull();
      expect(formData.get("theme_primary_color")).toBe("#14b8a6");
      expect(formData.get("theme_rounded")).toBe("0");
      expect(formData.get("theme_enforced_color_mode")).toBe("dark");
      expect(formData.get("theme_custom_css")).toBeNull();

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(
        page.getByTestId("logo-field").getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/logo2\.svg/);
      await expect(
        page
          .getByTestId("logo-dark-field")
          .getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/logo-dark2\.svg/);
      const buttons = colorField.getByTestId("color-button");
      await expect(buttons).toHaveCount(10);
      await expect(buttons.nth(3)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(buttons.and(page.locator(".selected"))).toHaveCount(1);
      await expect(colorField.locator("#theme-primary-color")).toHaveValue(
        "#14b8a6",
      );
      await expect(page.locator("#theme-rounded")).not.toBeChecked();
      await expect(
        page.getByTestId("theme-enforced-color-mode-dropdown"),
      ).toHaveText("admin.settings.theme.enforced_color_mode.dark");

      // Check that page was not reloaded
      expect(settingsRequests).toHaveLength(1);
    });

    test("saves without changes and does not send the unchanged custom css", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      settings.data.theme_logo = "/images/logo2.svg";
      settings.data.theme_logo_dark = "/images/logo-dark2.svg";
      settings.data.theme_primary_color = "#14b8a6";
      settings.data.theme_rounded = false;
      settings.data.theme_enforced_color_mode = "dark";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      // First save responds with a custom css that was not set by the user
      settings.data.theme_custom_css = "/storage/styles/theme_custom_css.css";
      const firstSave = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const firstConfigRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();
      await nthRequest(firstSave);
      await firstConfigRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      settings.data.theme_custom_css = null;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("theme_favicon_file")).toBeNull();
      expect(formData.get("theme_favicon")).toBe("/images/favicon.ico");
      expect(formData.get("theme_favicon_dark_file")).toBeNull();
      expect(formData.get("theme_favicon_dark")).toBe(
        "/images/favicon-dark.ico",
      );
      expect(formData.get("theme_logo_file")).toBeNull();
      expect(formData.get("theme_logo")).toBe("/images/logo2.svg");
      expect(formData.get("theme_logo_dark_file")).toBeNull();
      expect(formData.get("theme_logo_dark")).toBe("/images/logo-dark2.svg");
      expect(formData.get("theme_primary_color")).toBe("#14b8a6");
      expect(formData.get("theme_rounded")).toBe("0");
      expect(formData.get("theme_enforced_color_mode")).toBe("dark");
      // Make sure that custom css is null, even though it is set (not changed by the user)
      expect(formData.get("theme_custom_css")).toBeNull();

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(
        page.getByTestId("logo-field").getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/logo2\.svg/);
      await expect(
        page
          .getByTestId("logo-dark-field")
          .getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/logo-dark2\.svg/);
      const colorField = page.getByTestId("primary-color-field");
      const buttons = colorField.getByTestId("color-button");
      await expect(buttons).toHaveCount(10);
      await expect(buttons.nth(3)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(buttons.and(page.locator(".selected"))).toHaveCount(1);
      await expect(colorField.locator("#theme-primary-color")).toHaveValue(
        "#14b8a6",
      );
      await expect(page.locator("#theme-rounded")).not.toBeChecked();
      expect(settingsRequests).toHaveLength(1);
    });

    test("saves changed logo urls without reload", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      settings.data.theme_logo = "/images/logo2.svg";
      settings.data.theme_logo_dark = "/images/logo-dark2.svg";
      settings.data.theme_primary_color = "#14b8a6";
      settings.data.theme_rounded = false;
      settings.data.theme_enforced_color_mode = "dark";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const logoUrl = page
        .getByTestId("logo-field")
        .getByTestId("settings-image-url-input");
      await expect(logoUrl).toHaveValue("/images/logo2.svg");
      await logoUrl.fill("/images/logo3.svg");

      const logoDarkUrl = page
        .getByTestId("logo-dark-field")
        .getByTestId("settings-image-url-input");
      await expect(logoDarkUrl).toHaveValue("/images/logo-dark2.svg");
      await logoDarkUrl.fill("/images/logo-dark3.svg");

      settings.data.theme_logo = "/images/logo3.svg";
      settings.data.theme_logo_dark = "/images/logo-dark3.svg";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("theme_favicon_file")).toBeNull();
      expect(formData.get("theme_favicon")).toBe("/images/favicon.ico");
      expect(formData.get("theme_favicon_dark_file")).toBeNull();
      expect(formData.get("theme_favicon_dark")).toBe(
        "/images/favicon-dark.ico",
      );
      expect(formData.get("theme_logo_file")).toBeNull();
      expect(formData.get("theme_logo")).toBe("/images/logo3.svg");
      expect(formData.get("theme_logo_dark_file")).toBeNull();
      expect(formData.get("theme_logo_dark")).toBe("/images/logo-dark3.svg");
      expect(formData.get("theme_primary_color")).toBe("#14b8a6");
      expect(formData.get("theme_rounded")).toBe("0");
      expect(formData.get("theme_enforced_color_mode")).toBe("dark");
      expect(formData.get("theme_custom_css")).toBeNull();

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(
        page.getByTestId("logo-field").getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/logo3\.svg/);
      await expect(
        page
          .getByTestId("logo-dark-field")
          .getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/logo-dark3\.svg/);
      const colorField = page.getByTestId("primary-color-field");
      const buttons = colorField.getByTestId("color-button");
      await expect(buttons).toHaveCount(10);
      await expect(buttons.nth(3)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(buttons.and(page.locator(".selected"))).toHaveCount(1);
      await expect(colorField.locator("#theme-primary-color")).toHaveValue(
        "#14b8a6",
      );
      await expect(page.locator("#theme-rounded")).not.toBeChecked();
      expect(settingsRequests).toHaveLength(1);
    });
  });

  test.describe("theme favicon", () => {
    test("shows the favicon setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.theme.title")).toBeVisible();

      const field = page.getByTestId("favicon-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.favicon.title");
      await checkSettingsImageSelector(
        page,
        field,
        "/images/favicon.ico",
        "favicon.ico",
        false,
      );
    });

    test("saves an uploaded favicon and reloads the page", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page
        .getByTestId("favicon-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "favicon.ico",
          mimeType: getFileContentType("favicon.ico"),
          buffer: readFileSync("tests/Playwright/fixtures/files/favicon.ico"),
        });

      settings.data.theme_favicon = "/images/favicon2.ico";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      const faviconFile = formData.get("theme_favicon_file");
      expect(faviconFile.name).toBe("favicon.ico");
      expect(faviconFile.type).toBe("image/vnd.microsoft.icon");
      expect(Buffer.from(await faviconFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/favicon.ico"),
      );
      expect(formData.get("theme_favicon")).toBeNull();

      // Config is loaded regardless of whether the page is reloaded or not
      await configRequest;
      // Check that page was reloaded
      await expect.poll(() => settingsRequests.length).toBe(2);

      await expect(
        page.getByTestId("favicon-field").getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/favicon2\.ico/);
    });

    test("saves a changed favicon url and reloads the page", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      settings.data.theme_favicon = "/images/favicon2.ico";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const urlInput = page
        .getByTestId("favicon-field")
        .getByTestId("settings-image-url-input");
      await expect(urlInput).toHaveValue("/images/favicon2.ico");
      await urlInput.fill("/images/favicon3.ico");

      settings.data.theme_favicon = "/images/favicon3.ico";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("theme_favicon_file")).toBeNull();
      expect(formData.get("theme_favicon")).toBe("/images/favicon3.ico");

      await configRequest;
      await expect.poll(() => settingsRequests.length).toBe(2);

      await expect(
        page.getByTestId("favicon-field").getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/favicon3\.ico/);
    });
  });

  test.describe("theme favicon dark", () => {
    test("shows the dark favicon setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.theme.title")).toBeVisible();

      const field = page.getByTestId("favicon-dark-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.favicon_dark.title");
      await checkSettingsImageSelector(
        page,
        field,
        "/images/favicon-dark.ico",
        "favicon-dark.ico",
        false,
      );
    });

    test("saves an uploaded dark favicon and reloads the page", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page
        .getByTestId("favicon-dark-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "favicon-dark.ico",
          mimeType: getFileContentType("favicon-dark.ico"),
          buffer: readFileSync(
            "tests/Playwright/fixtures/files/favicon-dark.ico",
          ),
        });

      settings.data.theme_favicon_dark = "/images/favicon-dark2.ico";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      const faviconDarkFile = formData.get("theme_favicon_dark_file");
      expect(faviconDarkFile.name).toBe("favicon-dark.ico");
      expect(faviconDarkFile.type).toBe("image/vnd.microsoft.icon");
      expect(Buffer.from(await faviconDarkFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/favicon-dark.ico"),
      );
      expect(formData.get("theme_favicon_dark")).toBeNull();

      await configRequest;
      await expect.poll(() => settingsRequests.length).toBe(2);

      await expect(
        page
          .getByTestId("favicon-dark-field")
          .getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/favicon-dark2\.ico/);
    });

    test("saves a changed dark favicon url and reloads the page", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      settings.data.theme_favicon_dark = "/images/favicon-dark2.ico";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const urlInput = page
        .getByTestId("favicon-dark-field")
        .getByTestId("settings-image-url-input");
      await expect(urlInput).toHaveValue("/images/favicon-dark2.ico");
      await urlInput.fill("/images/favicon-dark3.ico");

      settings.data.theme_favicon_dark = "/images/favicon-dark3.ico";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("theme_favicon_dark_file")).toBeNull();
      expect(formData.get("theme_favicon_dark")).toBe(
        "/images/favicon-dark3.ico",
      );

      await configRequest;
      await expect.poll(() => settingsRequests.length).toBe(2);

      await expect(
        page
          .getByTestId("favicon-dark-field")
          .getByTestId("settings-image-preview"),
      ).toHaveAttribute("src", /\/images\/favicon-dark3\.ico/);
    });
  });

  test.describe("theme custom css", () => {
    test("shows the custom css setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.theme.title")).toBeVisible();

      const field = page.getByTestId("theme-custom-css-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.theme.custom_css");
      await checkSettingsFileSelector(
        page,
        field,
        "",
        "theme_custom_css.css",
        true,
      );
    });

    test("saves an uploaded custom css file and reloads the page", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page
        .getByTestId("theme-custom-css-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "theme_custom_css.css",
          mimeType: "text/css",
          buffer: readFileSync(
            "tests/Playwright/fixtures/files/theme_custom_css.css",
          ),
        });

      settings.data.theme_custom_css = "/storage/styles/theme_custom_css.css";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      const cssFile = formData.get("theme_custom_css");
      expect(cssFile.name).toBe("theme_custom_css.css");
      expect(cssFile.type).toBe("text/css");
      expect(Buffer.from(await cssFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/theme_custom_css.css"),
      );

      await configRequest;
      await expect.poll(() => settingsRequests.length).toBe(2);

      const field = page.getByTestId("theme-custom-css-field");
      await expect(field.getByTestId("file-input-button")).toHaveText(
        "app.browse",
      );
      await expect(
        field.getByTestId("settings-file-delete-button"),
      ).toBeVisible();
      const viewButton = field.getByTestId("settings-file-view-button");
      await expect(viewButton).toBeVisible();
      await expect(viewButton).toContainText("app.view");
      await expect(viewButton).toHaveAttribute(
        "href",
        "/storage/styles/theme_custom_css.css",
      );
    });

    test("saves a removed custom css file and reloads the page", async ({
      page,
      settings,
      settingsRequests,
    }) => {
      settings.data.theme_custom_css = "/storage/styles/theme_custom_css.css";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("theme-custom-css-field");
      await field.getByTestId("settings-file-delete-button").click();

      settings.data.theme_custom_css = null;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("theme_custom_css")).toBe("");

      await configRequest;
      await expect.poll(() => settingsRequests.length).toBe(2);

      await expect(field.getByTestId("file-input-button")).toHaveText(
        "app.browse",
      );
      await expect(
        field.getByTestId("settings-file-delete-button"),
      ).toHaveCount(0);
      await expect(field.getByTestId("settings-file-view-button")).toHaveCount(
        0,
      );
    });
  });

  test.describe("banner", () => {
    let banner;

    test.beforeEach(async ({ page }) => {
      banner = page
        .getByTestId("banner-preview-field")
        .getByTestId("app-banner");
    });

    test("shows the banner enabled setting and an empty preview", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.banner.title")).toBeVisible();

      const field = page.getByTestId("banner-enabled-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.banner.enabled");
      await expect(field).toContainText("app.enable");
      await expect(field.locator("#banner-enabled")).not.toBeChecked();
      await field.locator("#banner-enabled").click();
      await expect(field.locator("#banner-enabled")).toBeChecked();

      const preview = page.getByTestId("banner-preview-field");
      await expect(preview).toBeVisible();
      await expect(preview).toContainText("admin.settings.banner.preview");
      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toHaveCount(0);
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText("");
      await expect(banner.getByTestId("banner-link-button")).toHaveCount(0);
    });

    test("updates the banner preview with the title", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("banner-title-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.banner.banner_title");
      await expect(field.locator("#banner-title")).toHaveValue("");
      await field.locator("#banner-title").fill("Banner title");

      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toBeVisible();
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText("");
      await expect(banner.getByTestId("banner-link-button")).toHaveCount(0);
    });

    test("updates the banner preview with the icon", async ({
      page,
      settings,
    }) => {
      settings.data.banner_title = "Banner title";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("banner-icon-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.banner.icon");
      await expect(field).toContainText(
        "admin.settings.banner.icon_description",
      );
      await expect(field.locator("#banner-icon")).toHaveValue("");
      await field.locator("#banner-icon").fill("fa-solid fa-door-open");

      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toBeVisible();
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toBeVisible();
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText("");
      await expect(banner.getByTestId("banner-link-button")).toHaveCount(0);
    });

    test("updates the banner preview with the message", async ({
      page,
      settings,
    }) => {
      settings.data.banner_title = "Banner title";
      settings.data.banner_icon = "fa-solid fa-door-open";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("banner-message-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.banner.message");
      await expect(field.locator("#banner-message")).toHaveValue("");
      await field.locator("#banner-message").fill("Banner text message");

      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toBeVisible();
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toBeVisible();
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toBeVisible();
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(banner.getByTestId("banner-link-button")).toHaveCount(0);
    });

    test("updates the banner preview with the link and link text", async ({
      page,
      settings,
    }) => {
      settings.data.banner_title = "Banner title";
      settings.data.banner_icon = "fa-solid fa-door-open";
      settings.data.banner_message = "Banner text message";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const linkButton = banner.getByTestId("banner-link-button");

      const linkField = page.getByTestId("banner-link-field");
      await expect(linkField).toBeVisible();
      await expect(linkField).toContainText("admin.settings.banner.link");
      await expect(linkField.locator("#banner-link")).toHaveValue("");
      await linkField.locator("#banner-link").fill("/rooms");

      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_blank");
      await expect(linkButton).toHaveText("/rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "primary");
      await expect(linkButton).not.toHaveClass(/p-0 underline/);
      await expect(linkButton).not.toHaveAttribute("style", /.+/);

      const linkTextField = page.getByTestId("banner-link-text-field");
      await expect(linkTextField).toBeVisible();
      await expect(linkTextField).toContainText(
        "admin.settings.banner.link_text",
      );
      await expect(linkTextField.locator("#banner-link-text")).toHaveValue("");
      await linkTextField.locator("#banner-link-text").fill("Rooms");

      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_blank");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "primary");
      await expect(linkButton).not.toHaveClass(/p-0 underline/);
      await expect(linkButton).not.toHaveAttribute("style", /.+/);
    });

    test("changes the link style of the banner", async ({ page, settings }) => {
      settings.data.banner_title = "Banner title";
      settings.data.banner_icon = "fa-solid fa-door-open";
      settings.data.banner_message = "Banner text message";
      settings.data.banner_link = "/rooms";
      settings.data.banner_link_text = "Rooms";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await expect(page.getByTestId("banner-link-style-field")).toContainText(
        "admin.settings.banner.link_style",
      );
      const dropdown = page.getByTestId("banner-link-style-dropdown");
      const items = page.getByTestId("banner-link-style-dropdown-items");
      await expect(dropdown).toHaveText("app.button_styles.primary");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId("banner-link-style-dropdown-option");
      await expect(options).toHaveText([
        "app.button_styles.primary",
        "app.button_styles.secondary",
        "app.button_styles.link",
      ]);
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

      await options.nth(2).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("app.button_styles.link");

      const linkButton = banner.getByTestId("banner-link-button");
      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_blank");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "link");
      await expect(linkButton).toHaveClass(/p-0 underline/);
      await expect(linkButton).not.toHaveAttribute("style", /.+/);
    });

    test("changes the link target of the banner", async ({
      page,
      settings,
    }) => {
      settings.data.banner_title = "Banner title";
      settings.data.banner_icon = "fa-solid fa-door-open";
      settings.data.banner_message = "Banner text message";
      settings.data.banner_link = "/rooms";
      settings.data.banner_link_text = "Rooms";
      settings.data.banner_link_style = "link";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await expect(page.getByTestId("banner-link-target-field")).toContainText(
        "admin.settings.banner.link_target",
      );
      const dropdown = page.getByTestId("banner-link-target-dropdown");
      const items = page.getByTestId("banner-link-target-dropdown-items");
      await expect(dropdown).toHaveText("app.link_targets.blank");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId("banner-link-target-dropdown-option");
      await expect(options).toHaveText([
        "app.link_targets.blank",
        "app.link_targets.self",
      ]);
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

      await options.nth(1).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("app.link_targets.self");

      const linkButton = banner.getByTestId("banner-link-button");
      await expect(banner).not.toHaveAttribute("style", /.+/);
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_self");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "link");
      await expect(linkButton).toHaveClass(/p-0 underline/);
      await expect(linkButton).not.toHaveAttribute("style", /.+/);
    });

    test("changes the text color of the banner", async ({ page, settings }) => {
      settings.data.banner_title = "Banner title";
      settings.data.banner_message = "Banner text message";
      settings.data.banner_link = "/rooms";
      settings.data.banner_link_text = "Rooms";
      settings.data.banner_link_style = "link";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("banner-color-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.banner.color");
      await expect(field).toContainText("admin.room_types.custom_color");
      const buttons = field.getByTestId("color-button");
      const selectedButtons = buttons.and(page.locator(".selected"));
      await expect(buttons).toHaveCount(2);
      await expect(buttons.and(page.locator("[role=button]"))).toHaveCount(2);
      await expect(
        buttons.and(
          page.locator(".pointer-events-none.cursor-not-allowed.opacity-80"),
        ),
      ).toHaveCount(0);
      await expect(selectedButtons).toHaveCount(0);

      // Custom color that is not one of the buttons
      const input = field.locator("#banner-color");
      await expect(input).toHaveValue("");
      await expect(input).toBeEnabled();
      await input.fill("#6366f1");
      await expect(buttons).toHaveCount(2);
      await expect(selectedButtons).toHaveCount(0);

      // Set color of a button and check that the button is selected
      await input.fill("#FFFFFF");
      await expect(buttons).toHaveCount(2);
      await expect(buttons.nth(0)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(selectedButtons).toHaveCount(1);

      const linkButton = banner.getByTestId("banner-link-button");
      await expect(banner).toHaveAttribute("style", /.+/);
      await expect(banner).toHaveAttribute(
        "style",
        /(^|[\s;])color: rgb\(255, 255, 255\);/,
      );
      await expect(banner).not.toHaveAttribute("style", /background-color/);
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_blank");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "link");
      await expect(linkButton).toHaveClass(/p-0 underline/);
      await expect(linkButton).toHaveAttribute(
        "style",
        /color: rgb\(255, 255, 255\)/,
      );
    });

    test("changes the background color of the banner", async ({
      page,
      settings,
    }) => {
      settings.data.banner_title = "Banner title";
      settings.data.banner_message = "Banner text message";
      settings.data.banner_color = "#FFFFFF";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("banner-background-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.banner.background");
      await expect(field).toContainText("admin.room_types.custom_color");
      const buttons = field.getByTestId("color-button");
      const selectedButtons = buttons.and(page.locator(".selected"));
      await expect(buttons).toHaveCount(10);
      await expect(buttons.and(page.locator("[role=button]"))).toHaveCount(10);
      await expect(
        buttons.and(
          page.locator(".pointer-events-none.cursor-not-allowed.opacity-80"),
        ),
      ).toHaveCount(0);
      await expect(selectedButtons).toHaveCount(0);

      // Custom color that is not one of the buttons
      const input = field.locator("#banner-background");
      await expect(input).toHaveValue("");
      await expect(input).toBeEnabled();
      await input.fill("#FFFFFF");
      await expect(buttons).toHaveCount(10);
      await expect(selectedButtons).toHaveCount(0);

      // Set color of a button and check that the button is selected
      await input.fill("#6366f1");
      await expect(buttons).toHaveCount(10);
      await expect(buttons.nth(0)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(selectedButtons).toHaveCount(1);

      // Select a color with the button
      await buttons.nth(7).click();
      await expect(input).toHaveValue("#ef4444");
      await expect(buttons).toHaveCount(10);
      await expect(buttons.nth(7)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(selectedButtons).toHaveCount(1);

      await expect(banner).toHaveAttribute("style", /.+/);
      await expect(banner).toHaveAttribute(
        "style",
        /(^|[\s;])color: rgb\(255, 255, 255\);/,
      );
      await expect(banner).toHaveAttribute(
        "style",
        /background-color: rgb\(239, 68, 68\);/,
      );
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(banner.getByTestId("banner-link-button")).toHaveCount(0);
    });

    test("saves the banner settings", async ({ page, settings }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page.locator("#banner-enabled").click();
      await page.locator("#banner-title").fill("Banner title");
      await page.locator("#banner-icon").fill("fa-solid fa-door-open");
      await page.locator("#banner-message").fill("Banner text message");
      await page.locator("#banner-link").fill("/rooms");
      await page.locator("#banner-link-text").fill("Rooms");
      await page.getByTestId("banner-link-style-dropdown").click();
      await page
        .getByTestId("banner-link-style-dropdown-option")
        .nth(2)
        .click();
      await page.getByTestId("banner-link-target-dropdown").click();
      await page
        .getByTestId("banner-link-target-dropdown-option")
        .nth(1)
        .click();
      await page.locator("#banner-color").fill("#FFFFFF");
      await page
        .getByTestId("banner-background-field")
        .getByTestId("color-button")
        .nth(7)
        .click();

      settings.data.banner_enabled = true;
      settings.data.banner_title = "Banner title";
      settings.data.banner_icon = "fa-solid fa-door-open";
      settings.data.banner_message = "Banner text message";
      settings.data.banner_link = "/rooms";
      settings.data.banner_link_text = "Rooms";
      settings.data.banner_link_style = "link";
      settings.data.banner_link_target = "self";
      settings.data.banner_color = "#FFFFFF";
      settings.data.banner_background = "#ef4444";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("banner_enabled")).toBe("1");
      expect(formData.get("banner_title")).toBe("Banner title");
      expect(formData.get("banner_icon")).toBe("fa-solid fa-door-open");
      expect(formData.get("banner_message")).toBe("Banner text message");
      expect(formData.get("banner_link")).toBe("/rooms");
      expect(formData.get("banner_link_text")).toBe("Rooms");
      expect(formData.get("banner_link_style")).toBe("link");
      expect(formData.get("banner_link_target")).toBe("self");
      expect(formData.get("banner_color")).toBe("#FFFFFF");
      expect(formData.get("banner_background")).toBe("#ef4444");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#banner-enabled")).toBeChecked();
      const linkButton = banner.getByTestId("banner-link-button");
      await expect(banner).toHaveAttribute("style", /.+/);
      await expect(banner).toHaveAttribute(
        "style",
        /(^|[\s;])color: rgb\(255, 255, 255\);/,
      );
      await expect(banner).toHaveAttribute(
        "style",
        /background-color: rgb\(239, 68, 68\);/,
      );
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_self");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "link");
      await expect(linkButton).toHaveClass(/p-0 underline/);
      await expect(linkButton).toHaveAttribute(
        "style",
        /color: rgb\(255, 255, 255\)/,
      );

      await expect(page.locator("#banner-title")).toHaveValue("Banner title");
      await expect(page.locator("#banner-icon")).toHaveValue(
        "fa-solid fa-door-open",
      );
      await expect(page.locator("#banner-message")).toHaveValue(
        "Banner text message",
      );
      await expect(page.locator("#banner-link")).toHaveValue("/rooms");
      await expect(page.locator("#banner-link-text")).toHaveValue("Rooms");
      await expect(page.getByTestId("banner-link-style-dropdown")).toHaveText(
        "app.button_styles.link",
      );
      await expect(page.getByTestId("banner-link-target-dropdown")).toHaveText(
        "app.link_targets.self",
      );

      const colorField = page.getByTestId("banner-color-field");
      await expect(colorField.locator("#banner-color")).toHaveValue("#FFFFFF");
      const colorButtons = colorField.getByTestId("color-button");
      await expect(colorButtons).toHaveCount(2);
      await expect(colorButtons.nth(0)).toHaveClass(/(^|\s)selected(\s|$)/);
      await expect(colorButtons.and(page.locator(".selected"))).toHaveCount(1);

      const backgroundField = page.getByTestId("banner-background-field");
      await expect(backgroundField.locator("#banner-background")).toHaveValue(
        "#ef4444",
      );
      const backgroundButtons = backgroundField.getByTestId("color-button");
      await expect(backgroundButtons).toHaveCount(10);
      await expect(backgroundButtons.nth(7)).toHaveClass(
        /(^|\s)selected(\s|$)/,
      );
      await expect(
        backgroundButtons.and(page.locator(".selected")),
      ).toHaveCount(1);
    });

    test("saves a disabled banner with cleared inputs", async ({
      page,
      settings,
    }) => {
      settings.data.banner_enabled = true;
      settings.data.banner_title = "Banner title";
      settings.data.banner_icon = "fa-solid fa-door-open";
      settings.data.banner_message = "Banner text message";
      settings.data.banner_link = "/rooms";
      settings.data.banner_link_text = "Rooms";
      settings.data.banner_link_style = "link";
      settings.data.banner_link_target = "self";
      settings.data.banner_color = "#FFFFFF";
      settings.data.banner_background = "#ef4444";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const linkButton = banner.getByTestId("banner-link-button");
      await expect(banner).toHaveAttribute("style", /.+/);
      await expect(banner).toHaveAttribute(
        "style",
        /(^|[\s;])color: rgb\(255, 255, 255\);/,
      );
      await expect(banner).toHaveAttribute(
        "style",
        /background-color: rgb\(239, 68, 68\);/,
      );
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_self");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "link");
      await expect(linkButton).toHaveClass(/p-0 underline/);
      await expect(linkButton).toHaveAttribute(
        "style",
        /color: rgb\(255, 255, 255\)/,
      );

      // Disabling the banner does not change the preview
      await page.locator("#banner-enabled").click();
      await expect(page.locator("#banner-enabled")).not.toBeChecked();
      await expect(banner).toHaveAttribute("style", /.+/);
      await expect(banner).toHaveAttribute(
        "style",
        /(^|[\s;])color: rgb\(255, 255, 255\);/,
      );
      await expect(banner).toHaveAttribute(
        "style",
        /background-color: rgb\(239, 68, 68\);/,
      );
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
      await expect(linkButton).toBeVisible();
      await expect(linkButton).toHaveAttribute("href", "/rooms");
      await expect(linkButton).toHaveAttribute("target", "_self");
      await expect(linkButton).toHaveText("Rooms");
      await expect(linkButton).toHaveAttribute("data-p-severity", "link");
      await expect(linkButton).toHaveClass(/p-0 underline/);
      await expect(linkButton).toHaveAttribute(
        "style",
        /color: rgb\(255, 255, 255\)/,
      );

      await page.locator("#banner-title").fill("");
      await page.locator("#banner-icon").fill("");
      await page.locator("#banner-message").fill("");
      await page.locator("#banner-link").fill("");
      await page.locator("#banner-link-text").fill("");
      await page.locator("#banner-color").fill("");
      await page.locator("#banner-background").fill("");

      // Check that banner preview is reset
      const preview = page.getByTestId("banner-preview-field");
      await expect(preview).toBeVisible();
      await expect(preview).toContainText("admin.settings.banner.preview");
      await expect(banner).toHaveAttribute("style", /.*/);
      await expect(banner).not.toHaveAttribute("style", /(^|[\s;])color:/);
      await expect(banner).not.toHaveAttribute("style", /background-color/);
      await expect(banner.getByTestId("banner-title")).toHaveCount(0);
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText("");
      await expect(linkButton).toHaveCount(0);

      settings.data.banner_enabled = false;
      settings.data.banner_title = null;
      settings.data.banner_icon = null;
      settings.data.banner_message = null;
      settings.data.banner_link = null;
      settings.data.banner_link_text = null;
      settings.data.banner_color = null;
      settings.data.banner_background = null;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("banner_enabled")).toBe("0");
      expect(formData.get("banner_title")).toBe("");
      expect(formData.get("banner_icon")).toBe("");
      expect(formData.get("banner_message")).toBe("");
      expect(formData.get("banner_link")).toBe("");
      expect(formData.get("banner_link_text")).toBe("");
      expect(formData.get("banner_link_style")).toBe("link");
      expect(formData.get("banner_link_target")).toBe("self");
      expect(formData.get("banner_color")).toBe("");
      expect(formData.get("banner_background")).toBe("");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#banner-enabled")).not.toBeChecked();
      await expect(banner).toHaveAttribute("style", /.*/);
      await expect(banner).not.toHaveAttribute("style", /(^|[\s;])color:/);
      await expect(banner).not.toHaveAttribute("style", /background-color/);
      await expect(banner.getByTestId("banner-title")).toHaveCount(0);
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText("");
      await expect(linkButton).toHaveCount(0);

      await expect(page.locator("#banner-title")).toHaveValue("");
      await expect(page.locator("#banner-icon")).toHaveValue("");
      await expect(page.locator("#banner-message")).toHaveValue("");
      await expect(page.locator("#banner-link")).toHaveValue("");
      await expect(page.locator("#banner-link-text")).toHaveValue("");
      await expect(page.getByTestId("banner-link-style-dropdown")).toHaveText(
        "app.button_styles.link",
      );
      await expect(page.getByTestId("banner-link-target-dropdown")).toHaveText(
        "app.link_targets.self",
      );

      const colorField = page.getByTestId("banner-color-field");
      await expect(colorField.locator("#banner-color")).toHaveValue("");
      await expect(colorField.getByTestId("color-button")).toHaveCount(2);
      await expect(
        colorField.getByTestId("color-button").and(page.locator(".selected")),
      ).toHaveCount(0);

      const backgroundField = page.getByTestId("banner-background-field");
      await expect(backgroundField.locator("#banner-background")).toHaveValue(
        "",
      );
      await expect(backgroundField.getByTestId("color-button")).toHaveCount(10);
      await expect(
        backgroundField
          .getByTestId("color-button")
          .and(page.locator(".selected")),
      ).toHaveCount(0);
    });
  });

  test.describe("rooms", () => {
    test("shows the room limit setting and the custom input", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(
        page.getByText("app.rooms", { exact: true }).first(),
      ).toBeVisible();

      const field = page.getByTestId("room-limit-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.room_limit.title");
      await expect(field).toContainText(
        "admin.settings.room_limit.description",
      );

      const unlimitedField = field.getByTestId(
        "room-limit-mode-unlimited-field",
      );
      await expect(unlimitedField).toBeVisible();
      await expect(unlimitedField).toContainText("app.unlimited");
      await expect(
        unlimitedField.locator("#room-limit-mode-unlimited"),
      ).toBeChecked();
      await expect(
        unlimitedField.locator("#room-limit-mode-unlimited"),
      ).toBeEnabled();

      await expect(field.locator("#room-limit-custom")).toHaveCount(0);

      const customField = field.getByTestId("room-limit-mode-custom-field");
      await expect(customField).toBeVisible();
      await expect(customField).toContainText("admin.roles.room_limit.custom");
      await expect(
        customField.locator("#room-limit-mode-custom"),
      ).not.toBeChecked();
      await customField.locator("#room-limit-mode-custom").click();

      await expect(field.locator("#room-limit-custom")).toBeVisible();
      await expect(field.locator("#room-limit-custom")).toHaveValue("0");
      await field.locator("#room-limit-custom").fill("10");
      await expect(field.locator("#room-limit-custom")).toHaveValue("10");
    });

    test("changes the personalized link expiration", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("room-personalized-link-expiration-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.settings.room_personalized_link_expiration.title",
      );
      await expect(field).toContainText(
        "admin.settings.room_personalized_link_expiration.description",
      );
      const dropdown = page.getByTestId(
        "room-personalized-link-expiration-dropdown",
      );
      const items = page.getByTestId(
        "room-personalized-link-expiration-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "room-personalized-link-expiration-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(1).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.two_weeks");
    });

    test("changes the auto delete deadline period", async ({
      page,
      settings,
    }) => {
      settings.data.room_personalized_link_expiration = 14;
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("room-auto-delete-deadline-period-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.settings.room_auto_delete.deadline_period.title",
      );
      await expect(field).toContainText(
        "admin.settings.room_auto_delete.deadline_period.description",
      );
      const dropdown = page.getByTestId("room-auto-delete-deadline-dropdown");
      const items = page.getByTestId(
        "room-auto-delete-deadline-dropdown-items",
      );
      await expect(dropdown).toHaveText("admin.settings.two_weeks");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "room-auto-delete-deadline-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
      ]);
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

      await options.nth(0).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.one_week");
    });

    test("changes the auto delete inactive period", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("room-auto-delete-inactive-period-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.settings.room_auto_delete.inactive_period.title",
      );
      await expect(field).toContainText(
        "admin.settings.room_auto_delete.inactive_period.description",
      );
      const dropdown = page.getByTestId("room-auto-delete-inactive-dropdown");
      const items = page.getByTestId(
        "room-auto-delete-inactive-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "room-auto-delete-inactive-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(2).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.one_month");
    });

    test("changes the auto delete never used period", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId(
        "room-auto-delete-never-used-period-field",
      );
      await expect(field).toContainText(
        "admin.settings.room_auto_delete.never_used_period.title",
      );
      await expect(field).toContainText(
        "admin.settings.room_auto_delete.never_used_period.description",
      );
      const dropdown = page.getByTestId("room-auto-delete-never-used-dropdown");
      const items = page.getByTestId(
        "room-auto-delete-never-used-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "room-auto-delete-never-used-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(6).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.two_years");
    });

    test("shows the room file terms of use and hide owner settings", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const termsField = page.getByTestId("room-file-terms-of-use-field");
      await expect(termsField).toBeVisible();
      await expect(termsField).toContainText(
        "admin.settings.room_file_terms_of_use.title",
      );
      await expect(termsField).toContainText(
        "admin.settings.room_file_terms_of_use.description",
      );
      const terms = termsField.locator("#room-file-terms-of-use");
      await expect(terms).toBeVisible();
      await expect(terms).toHaveValue("Room file terms of use");
      await terms.fill("New room file terms of use");
      await expect(terms).toHaveValue("New room file terms of use");

      const hideOwnerField = page.getByTestId("room-hide-owner-field");
      await expect(hideOwnerField).toBeVisible();
      await expect(hideOwnerField).toContainText(
        "admin.settings.room_hide_owner_from_guests",
      );
      await expect(
        hideOwnerField.locator("#room-hide-owner"),
      ).not.toBeChecked();
      await hideOwnerField.locator("#room-hide-owner").click();
      await expect(hideOwnerField.locator("#room-hide-owner")).toBeChecked();
    });

    test("saves the room settings", async ({ page, settings }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page.locator("#room-limit-mode-custom").click();
      await page.locator("#room-limit-custom").fill("10");
      await page
        .getByTestId("room-personalized-link-expiration-dropdown")
        .click();
      await page
        .getByTestId("room-personalized-link-expiration-dropdown-option")
        .nth(1)
        .click();
      await page.getByTestId("room-auto-delete-deadline-dropdown").click();
      await page
        .getByTestId("room-auto-delete-deadline-dropdown-option")
        .nth(0)
        .click();
      await page.getByTestId("room-auto-delete-inactive-dropdown").click();
      await page
        .getByTestId("room-auto-delete-inactive-dropdown-option")
        .nth(2)
        .click();
      await page.getByTestId("room-auto-delete-never-used-dropdown").click();
      await page
        .getByTestId("room-auto-delete-never-used-dropdown-option")
        .nth(6)
        .click();
      await page
        .locator("#room-file-terms-of-use")
        .fill("New room file terms of use");
      await page.locator("#room-hide-owner").click();

      settings.data.room_limit = 10;
      settings.data.room_personalized_link_expiration = 14;
      settings.data.room_auto_delete_deadline_period = 7;
      settings.data.room_auto_delete_inactive_period = 30;
      settings.data.room_auto_delete_never_used_period = 730;
      settings.data.room_file_terms_of_use = "New room file terms of use";
      settings.data.room_hide_owner_from_guests = true;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("room_limit")).toBe("10");
      expect(formData.get("room_personalized_link_expiration")).toBe("14");
      expect(formData.get("room_auto_delete_deadline_period")).toBe("7");
      expect(formData.get("room_auto_delete_inactive_period")).toBe("30");
      expect(formData.get("room_auto_delete_never_used_period")).toBe("730");
      expect(formData.get("room_file_terms_of_use")).toBe(
        "New room file terms of use",
      );
      expect(formData.get("room_hide_owner_from_guests")).toBe("1");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(
        page.locator("#room-limit-mode-unlimited"),
      ).not.toBeChecked();
      await expect(page.locator("#room-limit-mode-unlimited")).toBeEnabled();
      await expect(page.locator("#room-limit-mode-custom")).toBeChecked();
      await expect(page.locator("#room-limit-mode-custom")).toBeEnabled();
      await expect(page.locator("#room-limit-custom")).toHaveValue("10");
      await expect(
        page.getByTestId("room-personalized-link-expiration-dropdown"),
      ).toHaveText("admin.settings.two_weeks");
      await expect(
        page.getByTestId("room-auto-delete-deadline-dropdown"),
      ).toHaveText("admin.settings.one_week");
      await expect(
        page.getByTestId("room-auto-delete-inactive-dropdown"),
      ).toHaveText("admin.settings.one_month");
      await expect(
        page.getByTestId("room-auto-delete-never-used-dropdown"),
      ).toHaveText("admin.settings.two_years");
      await expect(page.locator("#room-file-terms-of-use")).toHaveValue(
        "New room file terms of use",
      );
      await expect(page.locator("#room-hide-owner")).toBeChecked();
    });

    test("saves an unlimited room limit and cleared terms of use", async ({
      page,
      settings,
    }) => {
      settings.data.room_personalized_link_expiration = 14;
      settings.data.room_auto_delete_deadline_period = 7;
      settings.data.room_auto_delete_inactive_period = 30;
      settings.data.room_auto_delete_never_used_period = 730;
      settings.data.room_limit = 10;
      settings.data.room_file_terms_of_use = "New room file terms of use";
      settings.data.room_hide_owner_from_guests = true;
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#room-limit-custom")).toHaveValue("10");
      await page.locator("#room-limit-mode-unlimited").click();
      await expect(page.locator("#room-limit-custom")).toHaveCount(0);
      await page.locator("#room-file-terms-of-use").fill("");
      await page.locator("#room-hide-owner").click();

      settings.data.room_limit = -1;
      settings.data.room_file_terms_of_use = null;
      settings.data.room_hide_owner_from_guests = false;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("room_limit")).toBe("-1");
      expect(formData.get("room_personalized_link_expiration")).toBe("14");
      expect(formData.get("room_auto_delete_deadline_period")).toBe("7");
      expect(formData.get("room_auto_delete_inactive_period")).toBe("30");
      expect(formData.get("room_auto_delete_never_used_period")).toBe("730");
      expect(formData.get("room_file_terms_of_use")).toBe("");
      expect(formData.get("room_hide_owner_from_guests")).toBe("0");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#room-limit-mode-unlimited")).toBeChecked();
      await expect(page.locator("#room-limit-mode-unlimited")).toBeEnabled();
      await expect(page.locator("#room-limit-mode-custom")).not.toBeChecked();
      await expect(page.locator("#room-limit-mode-custom")).toBeEnabled();
      await expect(page.locator("#room-limit-custom")).toHaveCount(0);
      await expect(
        page.getByTestId("room-personalized-link-expiration-dropdown"),
      ).toHaveText("admin.settings.two_weeks");
      await expect(
        page.getByTestId("room-auto-delete-deadline-dropdown"),
      ).toHaveText("admin.settings.one_week");
      await expect(
        page.getByTestId("room-auto-delete-inactive-dropdown"),
      ).toHaveText("admin.settings.one_month");
      await expect(
        page.getByTestId("room-auto-delete-never-used-dropdown"),
      ).toHaveText("admin.settings.two_years");
      await expect(page.locator("#room-file-terms-of-use")).toHaveValue("");
      await expect(page.locator("#room-hide-owner")).not.toBeChecked();
    });
  });

  test.describe("users", () => {
    test("shows the user settings", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(
        page.getByText("app.users", { exact: true }).first(),
      ).toBeVisible();

      const passwordField = page.getByTestId("password-change-allowed-field");
      await expect(passwordField).toBeVisible();
      await expect(passwordField).toContainText(
        "admin.settings.password_change_allowed",
      );
      await expect(
        passwordField.locator("#password-change-allowed"),
      ).toBeChecked();

      const searchField = page.getByTestId("user-search-by-name-field");
      await expect(searchField).toBeVisible();
      await expect(searchField).toContainText(
        "admin.settings.user_search_by_name.title",
      );
      await expect(searchField.locator("#user-search-by-name")).toBeChecked();
    });

    test("saves the user settings", async ({ page, settings }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page.locator("#password-change-allowed").click();
      await page.locator("#user-search-by-name").click();

      settings.data.user_password_change_allowed = false;
      settings.data.user_search_by_name = false;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("user_password_change_allowed")).toBe("0");
      expect(formData.get("user_search_by_name")).toBe("0");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(page.locator("#password-change-allowed")).not.toBeChecked();
      await expect(page.locator("#user-search-by-name")).not.toBeChecked();
    });
  });

  test.describe("recording and statistics", () => {
    test("changes the server statistics settings", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(
        page.getByText("admin.settings.recording_and_statistics_title"),
      ).toBeVisible();

      const enabledField = page.getByTestId("statistics-servers-enabled-field");
      await expect(enabledField).toBeVisible();
      await expect(enabledField).toContainText(
        "admin.settings.statistics.servers.enabled_title",
      );
      await expect(enabledField).toContainText("app.enable");
      await expect(
        enabledField.locator("#statistics-servers-enabled"),
      ).toBeChecked();
      await enabledField.locator("#statistics-servers-enabled").click();
      await expect(
        enabledField.locator("#statistics-servers-enabled"),
      ).not.toBeChecked();

      await expect(
        page.getByTestId("statistics-servers-retention-period-field"),
      ).toContainText(
        "admin.settings.statistics.servers.retention_period_title",
      );
      const dropdown = page.getByTestId(
        "statistics-servers-retention-period-dropdown",
      );
      const items = page.getByTestId(
        "statistics-servers-retention-period-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "statistics-servers-retention-period-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(3).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.three_month");
    });

    test("changes the meeting statistics settings", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const enabledField = page.getByTestId(
        "statistics-meetings-enabled-field",
      );
      await expect(enabledField).toBeVisible();
      await expect(enabledField).toContainText(
        "admin.settings.statistics.meetings.enabled_title",
      );
      await expect(
        enabledField.locator("#statistics-meetings-enabled"),
      ).toBeChecked();
      await enabledField.locator("#statistics-meetings-enabled").click();
      await expect(
        enabledField.locator("#statistics-meetings-enabled"),
      ).not.toBeChecked();

      await expect(
        page.getByTestId("statistics-meetings-retention-period-field"),
      ).toContainText(
        "admin.settings.statistics.meetings.retention_period_title",
      );
      const dropdown = page.getByTestId(
        "statistics-meetings-retention-period-dropdown",
      );
      const items = page.getByTestId(
        "statistics-meetings-retention-period-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "statistics-meetings-retention-period-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(4).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.six_month");
    });

    test("changes the attendance retention period", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await expect(
        page.getByTestId("attendance-retention-period-field"),
      ).toContainText("admin.settings.attendance.retention_period_title");
      const dropdown = page.getByTestId("attendance-retention-period-dropdown");
      const items = page.getByTestId(
        "attendance-retention-period-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "attendance-retention-period-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(5).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.one_year");
    });

    test("changes the recording retention period", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await expect(
        page.getByTestId("recording-retention-period-field"),
      ).toContainText("admin.settings.recording.retention_period_title");
      const dropdown = page.getByTestId("recording-retention-period-dropdown");
      const items = page.getByTestId(
        "recording-retention-period-dropdown-items",
      );
      await expect(dropdown).toHaveText("app.unlimited");
      await expect(items).toHaveCount(0);
      await dropdown.click();

      await expect(items).toBeVisible();
      const options = items.getByTestId(
        "recording-retention-period-dropdown-option",
      );
      await expect(options).toHaveText([
        "admin.settings.one_week",
        "admin.settings.two_weeks",
        "admin.settings.one_month",
        "admin.settings.three_month",
        "admin.settings.six_month",
        "admin.settings.one_year",
        "admin.settings.two_years",
        "app.unlimited",
      ]);
      await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");

      await options.nth(0).click();
      await expect(items).toHaveCount(0);
      await expect(dropdown).toHaveText("admin.settings.one_week");
    });

    test("saves the recording and statistics settings", async ({
      page,
      settings,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page.locator("#statistics-servers-enabled").click();
      await page
        .getByTestId("statistics-servers-retention-period-dropdown")
        .click();
      await page
        .getByTestId("statistics-servers-retention-period-dropdown-option")
        .nth(3)
        .click();
      await page.locator("#statistics-meetings-enabled").click();
      await page
        .getByTestId("statistics-meetings-retention-period-dropdown")
        .click();
      await page
        .getByTestId("statistics-meetings-retention-period-dropdown-option")
        .nth(4)
        .click();
      await page.getByTestId("attendance-retention-period-dropdown").click();
      await page
        .getByTestId("attendance-retention-period-dropdown-option")
        .nth(5)
        .click();
      await page.getByTestId("recording-retention-period-dropdown").click();
      await page
        .getByTestId("recording-retention-period-dropdown-option")
        .nth(0)
        .click();

      settings.data.recording_server_usage_enabled = false;
      settings.data.recording_server_usage_retention_period = 90;
      settings.data.recording_meeting_usage_enabled = false;
      settings.data.recording_meeting_usage_retention_period = 180;
      settings.data.recording_attendance_retention_period = 365;
      settings.data.recording_recording_retention_period = 7;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("recording_server_usage_enabled")).toBe("0");
      expect(formData.get("recording_server_usage_retention_period")).toBe(
        "90",
      );
      expect(formData.get("recording_meeting_usage_enabled")).toBe("0");
      expect(formData.get("recording_meeting_usage_retention_period")).toBe(
        "180",
      );
      expect(formData.get("recording_attendance_retention_period")).toBe("365");
      expect(formData.get("recording_recording_retention_period")).toBe("7");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      await expect(
        page.locator("#statistics-servers-enabled"),
      ).not.toBeChecked();
      await expect(
        page.getByTestId("statistics-servers-retention-period-dropdown"),
      ).toHaveText("admin.settings.three_month");
      await expect(
        page.locator("#statistics-meetings-enabled"),
      ).not.toBeChecked();
      await expect(
        page.getByTestId("statistics-meetings-retention-period-dropdown"),
      ).toHaveText("admin.settings.six_month");
      await expect(
        page.getByTestId("attendance-retention-period-dropdown"),
      ).toHaveText("admin.settings.one_year");
      await expect(
        page.getByTestId("recording-retention-period-dropdown"),
      ).toHaveText("admin.settings.one_week");
    });
  });

  test.describe("bigbluebutton", () => {
    test("shows the bbb logo setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
      await expect(page.getByText("admin.settings.bbb.title")).toBeVisible();

      const field = page.getByTestId("bbb-logo-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.logo.title");
      await checkSettingsImageSelector(
        page,
        field,
        "/images/logo.svg",
        "logo.svg",
        true,
      );
    });

    test("shows the bbb dark logo setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("bbb-logo-dark-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.logo_dark.title");
      await checkSettingsImageSelector(
        page,
        field,
        "/images/logo-dark.svg",
        "logo-dark.svg",
        true,
      );
    });

    test("shows the bbb style setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("bbb-style-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.bbb.style.title");
      await checkSettingsFileSelector(page, field, "", "bbb_style.css", true);
    });

    test("shows the default presentation setting and handles file uploads", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("default-presentation-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText("admin.settings.default_presentation");
      await checkSettingsFileSelector(page, field, "", "testFile.txt", true);
    });

    test("shows the default welcome message with a character counter", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const field = page.getByTestId("bbb-default-welcome-message-field");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        "admin.settings.bbb.default_welcome_message.title",
      );
      await expect(field).toContainText(
        'app.char_counter_{"chars":0,"max":500}',
      );

      const input = field.locator("#bbb-default-welcome-message");
      await expect(input).toHaveValue("");
      await expect(input).toBeEnabled();
      await input.fill("Welcome to BBB");
      await expect(field).toBeVisible();
      await expect(field).toContainText(
        'app.char_counter_{"chars":14,"max":500}',
      );
    });

    test("saves uploaded bbb files and the welcome message", async ({
      page,
      settings,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await page
        .getByTestId("bbb-logo-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "logo.svg",
          mimeType: "image/svg+xml",
          buffer: readFileSync("tests/Playwright/fixtures/files/logo.svg"),
        });
      await page
        .getByTestId("bbb-logo-dark-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "logo-dark.svg",
          mimeType: "image/svg+xml",
          buffer: readFileSync("tests/Playwright/fixtures/files/logo-dark.svg"),
        });
      await page
        .getByTestId("bbb-style-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "bbb_style.css",
          mimeType: "text/css",
          buffer: readFileSync("tests/Playwright/fixtures/files/bbb_style.css"),
        });
      await page
        .getByTestId("default-presentation-field")
        .getByTestId("file-input-input")
        .setInputFiles({
          name: "testFile.txt",
          mimeType: "text/plain",
          buffer: readFileSync("tests/Playwright/fixtures/files/testFile.txt"),
        });
      await page.locator("#bbb-default-welcome-message").fill("Welcome to BBB");

      settings.data.bbb_logo = "/images/logo.svg";
      settings.data.bbb_logo_dark = "/images/logo-dark.svg";
      settings.data.bbb_style = "/files/bbb_style.css";
      settings.data.bbb_default_presentation = "/files/testFile.txt";
      settings.data.bbb_default_welcome_message = "Welcome to BigBlueButton";
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
        hold: true,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(saveButton).toBeDisabled();
      save.release();

      const formData = await parseFormData(await nthRequest(save));
      const logoFile = formData.get("bbb_logo_file");
      expect(logoFile.name).toBe("logo.svg");
      expect(logoFile.type).toBe("image/svg+xml");
      expect(Buffer.from(await logoFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/logo.svg"),
      );
      expect(formData.get("bbb_logo")).toBeNull();
      const logoDarkFile = formData.get("bbb_logo_dark_file");
      expect(logoDarkFile.name).toBe("logo-dark.svg");
      expect(logoDarkFile.type).toBe("image/svg+xml");
      expect(Buffer.from(await logoDarkFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/logo-dark.svg"),
      );
      expect(formData.get("bbb_logo_dark")).toBeNull();
      const styleFile = formData.get("bbb_style");
      expect(styleFile.name).toBe("bbb_style.css");
      expect(styleFile.type).toBe("text/css");
      expect(Buffer.from(await styleFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/bbb_style.css"),
      );
      const presentationFile = formData.get("bbb_default_presentation");
      expect(presentationFile.name).toBe("testFile.txt");
      expect(presentationFile.type).toBe("text/plain");
      expect(Buffer.from(await presentationFile.arrayBuffer())).toEqual(
        readFileSync("tests/Playwright/fixtures/files/testFile.txt"),
      );
      expect(formData.get("bbb_default_welcome_message")).toBe(
        "Welcome to BBB",
      );

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      const logoField = page.getByTestId("bbb-logo-field");
      await expect(
        logoField.getByTestId("settings-image-url-input"),
      ).toHaveValue("/images/logo.svg");
      await expect(
        logoField.getByTestId("settings-image-delete-button"),
      ).toBeVisible();

      const logoDarkField = page.getByTestId("bbb-logo-dark-field");
      await expect(
        logoDarkField.getByTestId("settings-image-url-input"),
      ).toHaveValue("/images/logo-dark.svg");
      await expect(
        logoDarkField.getByTestId("settings-image-delete-button"),
      ).toBeVisible();

      for (const [testId, href] of [
        ["bbb-style-field", "/files/bbb_style.css"],
        ["default-presentation-field", "/files/testFile.txt"],
      ]) {
        const field = page.getByTestId(testId);
        await expect(field.getByTestId("file-input-button")).toHaveText(
          "app.browse",
        );
        await expect(
          field.getByTestId("settings-file-delete-button"),
        ).toBeVisible();
        const viewButton = field.getByTestId("settings-file-view-button");
        await expect(viewButton).toBeVisible();
        await expect(viewButton).toContainText("app.view");
        await expect(viewButton).toHaveAttribute("href", href);
      }
    });

    test("deletes bbb files and images and saves the deletion", async ({
      page,
      settings,
    }) => {
      settings.data.bbb_logo = "/images/logo.svg";
      settings.data.bbb_logo_dark = "/images/logo-dark.svg";
      settings.data.bbb_style = "/files/bbb_style.css";
      settings.data.bbb_default_presentation = "/files/testFile.txt";
      settings.data.bbb_default_welcome_message = "Welcome to BigBlueButton";
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      for (const [testId, url] of [
        ["bbb-logo-field", "/images/logo.svg"],
        ["bbb-logo-dark-field", "/images/logo-dark.svg"],
      ]) {
        const field = page.getByTestId(testId);
        const deleteButton = field.getByTestId("settings-image-delete-button");
        const undoButton = field.getByTestId(
          "settings-image-undo-delete-button",
        );

        await deleteButton.click();
        await expect(undoButton).toBeVisible();
        await expect(undoButton).toHaveText("app.undo_delete");
        await expect(field.getByTestId("settings-image-url-input")).toHaveCount(
          0,
        );
        await expect(field.getByTestId("file-input-button")).toHaveCount(0);
        await expect(deleteButton).toHaveCount(0);

        await undoButton.click();
        await expect(field.getByTestId("settings-image-url-input")).toHaveValue(
          url,
        );
        await expect(deleteButton).toBeVisible();

        await deleteButton.click();
        await expect(undoButton).toBeVisible();
      }

      for (const [testId, href] of [
        ["bbb-style-field", "/files/bbb_style.css"],
        ["default-presentation-field", "/files/testFile.txt"],
      ]) {
        const field = page.getByTestId(testId);
        const deleteButton = field.getByTestId("settings-file-delete-button");
        const undoButton = field.getByTestId(
          "settings-file-undo-delete-button",
        );
        const viewButton = field.getByTestId("settings-file-view-button");

        await deleteButton.click();
        await expect(undoButton).toBeVisible();
        await expect(undoButton).toHaveText("app.undo_delete");
        await expect(field.getByTestId("file-input-button")).toHaveCount(0);
        await expect(deleteButton).toHaveCount(0);
        await expect(viewButton).toHaveCount(0);

        await undoButton.click();
        await expect(field.getByTestId("file-input-button")).toHaveText(
          "app.browse",
        );
        await expect(viewButton).toBeVisible();
        await expect(viewButton).toContainText("app.view");
        await expect(viewButton).toHaveAttribute("href", href);
        await expect(deleteButton).toBeVisible();

        await deleteButton.click();
        await expect(undoButton).toBeVisible();
      }

      const welcomeField = page.getByTestId(
        "bbb-default-welcome-message-field",
      );
      await expect(welcomeField).toBeVisible();
      await expect(welcomeField).toContainText(
        "admin.settings.bbb.default_welcome_message.title",
      );
      await expect(welcomeField).toContainText(
        'app.char_counter_{"chars":24,"max":500}',
      );
      const welcomeInput = welcomeField.locator("#bbb-default-welcome-message");
      await expect(welcomeInput).toHaveValue("Welcome to BigBlueButton");
      await expect(welcomeInput).toBeEnabled();
      await welcomeInput.fill("");
      await expect(welcomeField).toBeVisible();
      await expect(welcomeField).toContainText(
        'app.char_counter_{"chars":0,"max":500}',
      );

      settings.data.bbb_logo = null;
      settings.data.bbb_logo_dark = null;
      settings.data.bbb_style = null;
      settings.data.bbb_default_presentation = null;
      settings.data.bbb_default_welcome_message = null;
      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("bbb_logo_file")).toBeNull();
      expect(formData.get("bbb_logo")).toBe("");
      expect(formData.get("bbb_logo_dark")).toBe("");
      expect(formData.get("bbb_style")).toBe("");
      expect(formData.get("bbb_default_presentation")).toBe("");
      expect(formData.get("bbb_default_welcome_message")).toBe("");

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();

      for (const testId of ["bbb-logo-field", "bbb-logo-dark-field"]) {
        const field = page.getByTestId(testId);
        await expect(
          field.getByTestId("settings-image-url-input"),
        ).toBeVisible();
        await expect(field.getByTestId("settings-image-url-input")).toHaveValue(
          "",
        );
        await expect(field.getByTestId("file-input-button")).toBeVisible();
        await expect(
          field.getByTestId("settings-image-delete-button"),
        ).toHaveCount(0);
        await expect(
          field.getByTestId("settings-image-undo-delete-button"),
        ).toHaveCount(0);
      }

      for (const testId of ["bbb-style-field", "default-presentation-field"]) {
        const field = page.getByTestId(testId);
        await expect(field.getByTestId("file-input-button")).toBeVisible();
        await expect(
          field.getByTestId("settings-file-delete-button"),
        ).toHaveCount(0);
        await expect(
          field.getByTestId("settings-file-view-button"),
        ).toHaveCount(0);
        await expect(
          field.getByTestId("settings-file-undo-delete-button"),
        ).toHaveCount(0);
      }
    });

    test("saves empty bbb settings without sending unchanged values", async ({
      page,
      settings,
    }) => {
      settings.data.bbb_logo = null;
      settings.data.bbb_logo_dark = null;
      settings.data.bbb_style = null;
      settings.data.bbb_default_presentation = null;
      settings.data.bbb_default_welcome_message = null;
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const save = await mockMethod(page, "POST", "**/api/v1/settings", {
        json: settings,
      });
      const configRequest = page.waitForRequest("**/api/v1/config");
      await expect(saveButton).toContainText("app.save");
      await saveButton.click();

      const formData = await parseFormData(await nthRequest(save));
      expect(formData.get("bbb_logo_file")).toBeNull();
      expect(formData.get("bbb_logo")).toBeNull();
      expect(formData.get("bbb_logo_dark_file")).toBeNull();
      expect(formData.get("bbb_logo_dark")).toBeNull();
      expect(formData.get("bbb_style")).toBeNull();
      expect(formData.get("bbb_default_presentation")).toBeNull();

      await configRequest;
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(saveButton).toBeEnabled();
    });
  });

  test.describe("save changes errors", () => {
    const errors = {
      general_name: ["The general name field is required."],
      general_help_url: ["The selected general help url is invalid."],
      general_legal_notice_url: [
        "The selected general legal notice url is invalid.",
      ],
      general_privacy_policy_url: [
        "The selected general privacy policy url is invalid.",
      ],
      general_accessibility_statement_url: [
        "The selected general accessibility url is invalid.",
      ],
      general_pagination_page_size: [
        "The general pagination page size field is required.",
      ],
      general_toast_lifetime: ["The general toast lifetime field is required."],
      general_default_timezone: [
        "The general default timezone field is required.",
      ],
      general_no_welcome_page: [
        "The selected general no welcome page field is invalid.",
      ],
      theme_favicon: ["The theme favicon field is required."],
      theme_favicon_file: ["The theme favicon file field is required."],
      theme_favicon_dark: ["The theme favicon dark field is required."],
      theme_favicon_dark_file: [
        "The theme favicon dark file field is required.",
      ],
      theme_logo: ["The theme logo field is required."],
      theme_logo_file: ["The theme logo file field is required."],
      theme_logo_dark: ["The theme logo dark field is required."],
      theme_logo_dark_file: ["The theme logo dark file field is required."],
      theme_primary_color: ["The theme primary color field is required."],
      theme_rounded: ["The theme rounded field is required."],
      theme_custom_css: ["The theme custom css field is required."],
      banner_enabled: ["The banner enabled field is required."],
      banner_title: ["The selected banner title is invalid."],
      banner_icon: ["The selected banner icon is invalid."],
      banner_message: ["The selected banner message is invalid."],
      banner_link: ["The selected banner link is invalid."],
      banner_link_text: ["The selected banner link text is invalid."],
      banner_link_style: ["The selected banner link style is invalid."],
      banner_link_target: ["The selected banner link target is invalid."],
      banner_color: ["The selected banner color is invalid."],
      banner_background: ["The selected banner background color is invalid."],
      room_limit: ["The room limit field is required."],
      room_personalized_link_expiration: [
        "The selected room personalized room links expiration is invalid.",
      ],
      room_auto_delete_deadline_period: [
        "The selected room auto delete deadline period is invalid.",
      ],
      room_auto_delete_inactive_period: [
        "The selected room auto delete inactive period is invalid.",
      ],
      room_auto_delete_never_used_period: [
        "The selected room auto delete never used period is invalid.",
      ],
      room_file_terms_of_use: [
        "The selected room file terms of use is invalid.",
      ],
      room_hide_owner_from_guests: [
        "The selected room hide owner for guests field is invalid.",
      ],
      user_password_change_allowed: [
        "The user password change allowed field is required.",
      ],
      recording_server_usage_enabled: [
        "The recording server usage enabled field is required.",
      ],
      recording_server_usage_retention_period: [
        "The selected recording server usage retention period is invalid.",
      ],
      recording_meeting_usage_enabled: [
        "The recording meeting usage enabled field is required.",
      ],
      recording_meeting_usage_retention_period: [
        "The selected recording meeting usage retention period is invalid.",
      ],
      recording_attendance_retention_period: [
        "The selected recording attendance retention period is invalid.",
      ],
      recording_recording_retention_period: [
        "The selected recording recording retention period is invalid.",
      ],
      bbb_logo: ["The logo field is required."],
      bbb_logo_file: ["The logo file field is required."],
      bbb_logo_dark: ["The dark version logo field is required."],
      bbb_logo_dark_file: ["The dark version logo file field is required."],
      bbb_style: ["The bbb style field is required."],
      bbb_default_presentation: [
        "The bbb default presentation field is required.",
      ],
      bbb_default_welcome_message: [
        "The bbb default welcome message must not be greater than 500 characters.",
      ],
    };

    // Field (data-test) and the error messages that have to be shown in it
    const fieldErrors = [
      ["application-name-field", [errors.general_name]],
      ["help-url-field", [errors.general_help_url]],
      ["legal-notice-url-field", [errors.general_legal_notice_url]],
      ["privacy-policy-url-field", [errors.general_privacy_policy_url]],
      [
        "accessibility-statement-url-field",
        [errors.general_accessibility_statement_url],
      ],
      ["pagination-page-size-field", [errors.general_pagination_page_size]],
      ["toast-lifetime-field", [errors.general_toast_lifetime]],
      ["default-timezone-field", [errors.general_default_timezone]],
      ["no-welcome-page-field", [errors.general_no_welcome_page]],
      ["favicon-field", [errors.theme_favicon, errors.theme_favicon_file]],
      [
        "favicon-dark-field",
        [errors.theme_favicon_dark, errors.theme_favicon_dark_file],
      ],
      ["logo-field", [errors.theme_logo, errors.theme_logo_file]],
      [
        "logo-dark-field",
        [errors.theme_logo_dark, errors.theme_logo_dark_file],
      ],
      ["primary-color-field", [errors.theme_primary_color]],
      ["theme-rounded-field", [errors.theme_rounded]],
      ["theme-custom-css-field", [errors.theme_custom_css]],
      ["banner-enabled-field", [errors.banner_enabled]],
      ["banner-title-field", [errors.banner_title]],
      ["banner-icon-field", [errors.banner_icon]],
      ["banner-message-field", [errors.banner_message]],
      ["banner-link-field", [errors.banner_link]],
      ["banner-link-text-field", [errors.banner_link_text]],
      ["banner-link-style-field", [errors.banner_link_style]],
      ["banner-link-target-field", [errors.banner_link_target]],
      ["banner-color-field", [errors.banner_color]],
      ["banner-background-field", [errors.banner_background]],
      ["room-limit-field", [errors.room_limit]],
      [
        "room-personalized-link-expiration-field",
        [errors.room_personalized_link_expiration],
      ],
      [
        "room-auto-delete-deadline-period-field",
        [errors.room_auto_delete_deadline_period],
      ],
      [
        "room-auto-delete-inactive-period-field",
        [errors.room_auto_delete_inactive_period],
      ],
      [
        "room-auto-delete-never-used-period-field",
        [errors.room_auto_delete_never_used_period],
      ],
      ["room-file-terms-of-use-field", [errors.room_file_terms_of_use]],
      ["room-hide-owner-field", [errors.room_hide_owner_from_guests]],
      ["password-change-allowed-field", [errors.user_password_change_allowed]],
      [
        "statistics-servers-enabled-field",
        [errors.recording_server_usage_enabled],
      ],
      [
        "statistics-servers-retention-period-field",
        [errors.recording_server_usage_retention_period],
      ],
      [
        "statistics-meetings-enabled-field",
        [errors.recording_meeting_usage_enabled],
      ],
      [
        "statistics-meetings-retention-period-field",
        [errors.recording_meeting_usage_retention_period],
      ],
      [
        "attendance-retention-period-field",
        [errors.recording_attendance_retention_period],
      ],
      [
        "recording-retention-period-field",
        [errors.recording_recording_retention_period],
      ],
      ["bbb-logo-field", [errors.bbb_logo, errors.bbb_logo_file]],
      [
        "bbb-logo-dark-field",
        [errors.bbb_logo_dark, errors.bbb_logo_dark_file],
      ],
      ["bbb-style-field", [errors.bbb_style]],
      ["default-presentation-field", [errors.bbb_default_presentation]],
      [
        "bbb-default-welcome-message-field",
        [errors.bbb_default_welcome_message],
      ],
    ].map(([testId, messages]) => [testId, messages.flat()]);

    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("application-name-field")).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    test("shows the validation errors of a 422 response", async ({ page }) => {
      await mockMethod(page, "POST", "**/api/v1/settings", {
        status: 422,
        json: {
          message: "The general name field is required. (and 49 more errors)",
          errors,
        },
      });
      await saveButton.click();

      await expectToastAndClose(
        page,
        "The general name field is required. (and 49 more errors)",
      );

      for (const [testId, messages] of fieldErrors) {
        const field = page.getByTestId(testId);
        for (const message of messages) {
          await expect(field).toBeVisible();
          await expect(field).toContainText(message);
        }
      }
    });

    test("shows the error and hides the validation errors on a 500 response", async ({
      page,
    }) => {
      await mockMethod(page, "POST", "**/api/v1/settings", {
        status: 422,
        json: {
          message: "The general name field is required. (and 49 more errors)",
          errors,
        },
      });
      await saveButton.click();
      await expectToastAndClose(
        page,
        "The general name field is required. (and 49 more errors)",
      );
      await expect(page.getByTestId("application-name-field")).toContainText(
        errors.general_name[0],
      );

      await mockMethod(page, "POST", "**/api/v1/settings", {
        status: 500,
        json: { message: "Test" },
      });
      await saveButton.click();

      const toast = page.locator(".p-toast-message");
      await expect(toast).toContainText(
        'app.flash.server_error.error_code_{"statusCode":500}',
      );
      await expectToastAndClose(
        page,
        'app.flash.server_error.message_{"message":"Test"}',
      );

      // Check that 422 error messages are hidden
      for (const [testId, messages] of fieldErrors) {
        const field = page.getByTestId(testId);
        for (const message of messages) {
          await expect(field).not.toContainText(message);
        }
      }
    });

    test("shows an error on a 413 response", async ({ page }) => {
      await mockMethod(page, "POST", "**/api/v1/settings", {
        status: 413,
        json: { message: "Test" },
      });
      await saveButton.click();

      await expect(page.locator(".p-toast-message")).toHaveCount(1);
      await expectToastAndClose(page, "app.flash.too_large");
    });

    test("redirects to the login on a 401 response", async ({ page }) => {
      await mockMethod(page, "POST", "**/api/v1/settings", {
        status: 401,
        json: { message: "Test" },
      });
      await saveButton.click();

      await expect(page).toHaveURL(/\/login\?redirect=\/admin\/settings/);
      await expectToastAndClose(page, "app.flash.unauthenticated");
    });
  });
});
