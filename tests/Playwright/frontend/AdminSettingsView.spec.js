import { mergeTests } from "@playwright/test";
import { test as settingsControllerTest } from "../support/fixtures/settingsController.js";
import { test as timezonesTest } from "../support/fixtures/timezones.js";
import { expect } from "../support/test.js";
import {
  checkSettingsImageSelectorOnlyView,
  checkSettingsFileSelectorOnlyView,
} from "../support/admin.js";

const test = mergeTests(settingsControllerTest, timezonesTest);

test.describe("Admin settings with view permission only", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = ["admin.view", "settings.viewAny"];
  });

  test.describe("application", () => {
    test("shows the application settings disabled", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByText("admin.settings.application")).toBeVisible();

      const name = page.getByTestId("application-name-field");
      await expect(name).toBeVisible();
      await expect(name).toContainText("admin.settings.name.title");
      await expect(name).toContainText("admin.settings.name.description");
      await expect(name.locator("#application-name")).toHaveValue(
        "Test Application",
      );
      await expect(name.locator("#application-name")).toBeDisabled();

      const urlFields = [
        ["help-url", "help_url"],
        ["legal-notice-url", "legal_notice_url"],
        ["privacy-policy-url", "privacy_policy_url"],
        ["accessibility-statement-url", "accessibility_statement_url"],
      ];
      for (const [id, key] of urlFields) {
        const field = page.getByTestId(`${id}-field`);
        await expect(field).toBeVisible();
        await expect(field).toContainText(`admin.settings.${key}.title`);
        await expect(field).toContainText(`admin.settings.${key}.description`);
        await expect(field.locator(`#${id}`)).toHaveValue("");
        await expect(field.locator(`#${id}`)).toBeDisabled();
      }

      const pageSize = page.getByTestId("pagination-page-size-field");
      await expect(pageSize).toBeVisible();
      await expect(pageSize).toContainText(
        "admin.settings.pagination_page_size.title",
      );
      await expect(pageSize).toContainText(
        "admin.settings.pagination_page_size.description",
      );
      await expect(pageSize.locator("#pagination-page-size")).toHaveValue("5");
      await expect(pageSize.locator("#pagination-page-size")).toBeDisabled();

      const timezone = page.getByTestId("default-timezone-field");
      await expect(timezone).toBeVisible();
      await expect(timezone).toContainText("admin.settings.default_timezone");
      const timezoneDropdown = timezone.getByTestId("timezone-dropdown");
      await expect(timezoneDropdown).toHaveText("UTC");
      await expect(timezoneDropdown.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );

      const noWelcomePage = page.getByTestId("no-welcome-page-field");
      await expect(noWelcomePage).toBeVisible();
      await expect(noWelcomePage).toContainText(
        "admin.settings.no_welcome_page",
      );
      await expect(noWelcomePage.locator("#no-welcome-page")).toBeChecked();
      await expect(noWelcomePage.locator("#no-welcome-page")).toBeDisabled();
    });

    test("shows unlimited toast lifetime disabled", async ({ page }) => {
      await page.goto("/admin/settings");

      const lifetime = page.getByTestId("toast-lifetime-field");
      await expect(lifetime).toBeVisible();
      await expect(lifetime).toContainText(
        "admin.settings.toast_lifetime.title",
      );
      await expect(lifetime).toContainText(
        "admin.settings.toast_lifetime.description",
      );

      const unlimited = lifetime.getByTestId(
        "toast-lifetime-mode-unlimited-field",
      );
      await expect(unlimited).toBeVisible();
      await expect(unlimited).toContainText("app.unlimited");
      await expect(
        unlimited.locator("#toast-lifetime-mode-unlimited"),
      ).toBeChecked();
      await expect(
        unlimited.locator("#toast-lifetime-mode-unlimited"),
      ).toBeDisabled();

      await expect(
        lifetime.getByTestId("toast-lifetime-custom-input"),
      ).toBeHidden();

      const custom = lifetime.getByTestId("toast-lifetime-mode-custom-field");
      await expect(custom).toBeVisible();
      await expect(custom).toContainText(
        "admin.settings.toast_lifetime.custom",
      );
      await expect(
        custom.locator("#toast-lifetime-mode-custom"),
      ).not.toBeChecked();
      await expect(
        custom.locator("#toast-lifetime-mode-custom"),
      ).toBeDisabled();
    });

    test("shows custom toast lifetime disabled", async ({
      page,
      settingsResponse,
    }) => {
      settingsResponse.data.general_toast_lifetime = 10;
      await page.goto("/admin/settings");

      const lifetime = page.getByTestId("toast-lifetime-field");
      await expect(lifetime).toBeVisible();
      await expect(lifetime).toContainText(
        "admin.settings.toast_lifetime.title",
      );
      await expect(lifetime).toContainText(
        "admin.settings.toast_lifetime.description",
      );

      const unlimited = lifetime.getByTestId(
        "toast-lifetime-mode-unlimited-field",
      );
      await expect(unlimited).toBeVisible();
      await expect(unlimited).toContainText("app.unlimited");
      await expect(
        unlimited.locator("#toast-lifetime-mode-unlimited"),
      ).not.toBeChecked();
      await expect(
        unlimited.locator("#toast-lifetime-mode-unlimited"),
      ).toBeDisabled();

      const input = lifetime.getByTestId("toast-lifetime-custom-input");
      await expect(input).toBeVisible();
      await expect(input).toHaveValue("10");
      await expect(input).toBeDisabled();

      const custom = lifetime.getByTestId("toast-lifetime-mode-custom-field");
      await expect(custom).toBeVisible();
      await expect(custom).toContainText(
        "admin.settings.toast_lifetime.custom",
      );
      await expect(custom.locator("#toast-lifetime-mode-custom")).toBeChecked();
      await expect(
        custom.locator("#toast-lifetime-mode-custom"),
      ).toBeDisabled();
    });
  });

  test("shows the theme settings read-only", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.getByText("admin.settings.theme.title")).toBeVisible();

    const images = [
      ["favicon-field", "favicon", "/images/favicon.ico"],
      ["favicon-dark-field", "favicon_dark", "/images/favicon-dark.ico"],
      ["logo-field", "logo", "/images/logo.svg"],
      ["logo-dark-field", "logo_dark", "/images/logo-dark.svg"],
    ];
    for (const [testId, key, src] of images) {
      const field = page.getByTestId(testId);
      await expect(field).toBeVisible();
      await expect(field).toContainText(`admin.settings.${key}.title`);
      await checkSettingsImageSelectorOnlyView(field, src);
    }

    const color = page.getByTestId("primary-color-field");
    await expect(color).toBeVisible();
    await expect(color).toContainText("admin.settings.theme.primary_color");
    const colorButtons = color.getByTestId("color-button");
    await expect(colorButtons).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      const button = colorButtons.nth(i);
      await expect(button).toHaveAttribute("role", "button");
      await expect(button).toHaveClass(/pointer-events-none/);
      await expect(button).toHaveClass(/opacity-80/);
      await expect(button).not.toHaveClass(/cursor-pointer/);
      if (i === 4) {
        await expect(button).toHaveClass(/(^|\s)selected(\s|$)/);
      } else {
        await expect(button).not.toHaveClass(/(^|\s)selected(\s|$)/);
      }
    }
    await expect(color.locator("#theme-primary-color")).toHaveValue("#22c55e");
    await expect(color.locator("#theme-primary-color")).toBeDisabled();

    const rounded = page.getByTestId("theme-rounded-field");
    await expect(rounded).toBeVisible();
    await expect(rounded).toContainText("admin.settings.theme.rounded");
    await expect(rounded.locator("#theme-rounded")).toBeChecked();
    await expect(rounded.locator("#theme-rounded")).toBeDisabled();

    const colorMode = page.getByTestId("theme-enforced-color-mode-field");
    await expect(colorMode).toBeVisible();
    await expect(colorMode).toContainText(
      "admin.settings.theme.enforced_color_mode.title",
    );
    const colorModeDropdown = colorMode.getByTestId(
      "theme-enforced-color-mode-dropdown",
    );
    await expect(colorModeDropdown).toHaveText(
      "admin.settings.theme.enforced_color_mode.null",
    );
    await expect(colorModeDropdown.locator(".p-select-label")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    const customCss = page.getByTestId("theme-custom-css-field");
    await expect(customCss).toBeVisible();
    await expect(customCss).toContainText("admin.settings.theme.custom_css");
    await checkSettingsFileSelectorOnlyView(customCss, "");
  });

  test.describe("banner", () => {
    test("shows the empty banner settings disabled", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByText("admin.settings.banner.title")).toBeVisible();

      const enabled = page.getByTestId("banner-enabled-field");
      await expect(enabled).toBeVisible();
      await expect(enabled).toContainText("admin.settings.banner.enabled");
      await expect(enabled).toContainText("app.enable");
      await expect(enabled.locator("#banner-enabled")).not.toBeChecked();
      await expect(enabled.locator("#banner-enabled")).toBeDisabled();

      const previewField = page.getByTestId("banner-preview-field");
      await expect(previewField).toBeVisible();
      await expect(previewField).toContainText("admin.settings.banner.preview");
      const banner = previewField.getByTestId("app-banner");
      await expect(banner).toBeVisible();
      await expect(banner).not.toHaveAttribute("style", /.*/);
      await expect(banner.getByTestId("banner-title")).toHaveCount(0);
      await expect(banner.getByTestId("banner-icon")).toHaveCount(0);
      await expect(banner.getByTestId("banner-message")).toHaveText("");
      await expect(banner.getByTestId("banner-link-button")).toHaveCount(0);

      const textFields = [
        ["banner-title", "banner_title", null],
        ["banner-icon", "icon", "icon_description"],
        ["banner-message", "message", null],
        ["banner-link", "link", null],
        ["banner-link-text", "link_text", null],
      ];
      for (const [id, key, description] of textFields) {
        const field = page.getByTestId(`${id}-field`);
        await expect(field).toBeVisible();
        await expect(field).toContainText(`admin.settings.banner.${key}`);
        if (description) {
          await expect(field).toContainText(
            `admin.settings.banner.${description}`,
          );
        }
        await expect(field.locator(`#${id}`)).toHaveValue("");
        await expect(field.locator(`#${id}`)).toBeDisabled();
      }

      const linkStyle = page.getByTestId("banner-link-style-field");
      await expect(linkStyle).toBeVisible();
      await expect(linkStyle).toContainText("admin.settings.banner.link_style");
      const linkStyleDropdown = linkStyle.getByTestId(
        "banner-link-style-dropdown",
      );
      await expect(linkStyleDropdown).toHaveText("app.button_styles.primary");
      await expect(
        linkStyleDropdown.locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      const linkTarget = page.getByTestId("banner-link-target-field");
      await expect(linkTarget).toBeVisible();
      await expect(linkTarget).toContainText(
        "admin.settings.banner.link_target",
      );
      const linkTargetDropdown = linkTarget.getByTestId(
        "banner-link-target-dropdown",
      );
      await expect(linkTargetDropdown).toHaveText("app.link_targets.blank");
      await expect(
        linkTargetDropdown.locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      const color = page.getByTestId("banner-color-field");
      await expect(color).toBeVisible();
      await expect(color).toContainText("admin.settings.banner.color");
      await expect(color).toContainText("admin.room_types.custom_color");
      const colorButtons = color.getByTestId("color-button");
      await expect(colorButtons).toHaveCount(2);
      for (let i = 0; i < 2; i++) {
        const button = colorButtons.nth(i);
        await expect(button).toHaveAttribute("role", "button");
        await expect(button).toHaveClass(/pointer-events-none/);
        await expect(button).toHaveClass(/opacity-80/);
        await expect(button).not.toHaveClass(/cursor-pointer/);
        await expect(button).not.toHaveClass(/(^|\s)selected(\s|$)/);
      }
      await expect(color.locator("#banner-color")).toHaveValue("");
      await expect(color.locator("#banner-color")).toBeDisabled();

      const background = page.getByTestId("banner-background-field");
      await expect(background).toBeVisible();
      await expect(background).toContainText(
        "admin.settings.banner.background",
      );
      await expect(background).toContainText("admin.room_types.custom_color");
      const backgroundButtons = background.getByTestId("color-button");
      await expect(backgroundButtons).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
        const button = backgroundButtons.nth(i);
        await expect(button).toHaveAttribute("role", "button");
        await expect(button).toHaveClass(/pointer-events-none/);
        await expect(button).toHaveClass(/opacity-80/);
        await expect(button).not.toHaveClass(/cursor-pointer/);
        await expect(button).not.toHaveClass(/(^|\s)selected(\s|$)/);
      }
      await expect(background.locator("#banner-background")).toHaveValue("");
      await expect(background.locator("#banner-background")).toBeDisabled();
    });

    test.describe("with banner configured", () => {
      test.beforeEach(async ({ page, settingsResponse }) => {
        Object.assign(settingsResponse.data, {
          banner_enabled: true,
          banner_title: "Banner title",
          banner_icon: "fa-solid fa-door-open",
          banner_message: "Banner text message",
          banner_link: "/rooms",
          banner_link_text: "Rooms",
          banner_link_style: "link",
          banner_link_target: "self",
          banner_color: "#FFFFFF",
          banner_background: "#ef4444",
        });
        await page.goto("/admin/settings");
        await expect(page.getByTestId("banner-enabled-field")).toBeVisible();
      });

      test("shows the banner preview", async ({ page }) => {
        await expect(page.locator("#banner-enabled")).toBeChecked();
        await expect(page.locator("#banner-enabled")).toBeDisabled();

        const previewField = page.getByTestId("banner-preview-field");
        await expect(previewField).toBeVisible();
        await expect(previewField).toContainText(
          "admin.settings.banner.preview",
        );

        const banner = previewField.getByTestId("app-banner");
        await expect(banner).toHaveAttribute(
          "style",
          /color: rgb\(255, 255, 255\);/,
        );
        await expect(banner).toHaveAttribute(
          "style",
          /background-color: rgb\(239, 68, 68\);/,
        );
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

        const link = banner.getByTestId("banner-link-button");
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", "/rooms");
        await expect(link).toHaveAttribute("target", "_self");
        await expect(link).toHaveText("Rooms");
        await expect(link).toHaveAttribute("data-p-severity", "link");
        await expect(link).toHaveClass(/p-0 underline/);
        await expect(link).toHaveAttribute(
          "style",
          /color: rgb\(255, 255, 255\)/,
        );
      });

      test("shows the banner inputs disabled", async ({ page }) => {
        await expect(page.locator("#banner-title")).toHaveValue("Banner title");
        await expect(page.locator("#banner-title")).toBeDisabled();
        await expect(page.locator("#banner-icon")).toHaveValue(
          "fa-solid fa-door-open",
        );
        await expect(page.locator("#banner-icon")).toBeDisabled();
        await expect(page.locator("#banner-message")).toHaveValue(
          "Banner text message",
        );
        await expect(page.locator("#banner-message")).toBeDisabled();
        await expect(page.locator("#banner-link")).toHaveValue("/rooms");
        await expect(page.locator("#banner-link")).toBeDisabled();
        await expect(page.locator("#banner-link-text")).toHaveValue("Rooms");
        await expect(page.locator("#banner-link-text")).toBeDisabled();

        const linkStyle = page.getByTestId("banner-link-style-field");
        await expect(linkStyle).toBeVisible();
        await expect(linkStyle).toContainText(
          "admin.settings.banner.link_style",
        );
        const linkStyleDropdown = linkStyle.getByTestId(
          "banner-link-style-dropdown",
        );
        await expect(linkStyleDropdown).toHaveText("app.button_styles.link");
        await expect(
          linkStyleDropdown.locator(".p-select-label"),
        ).toHaveAttribute("aria-disabled", "true");

        const linkTarget = page.getByTestId("banner-link-target-field");
        await expect(linkTarget).toBeVisible();
        await expect(linkTarget).toContainText(
          "admin.settings.banner.link_target",
        );
        const linkTargetDropdown = linkTarget.getByTestId(
          "banner-link-target-dropdown",
        );
        await expect(linkTargetDropdown).toHaveText("app.link_targets.self");
        await expect(
          linkTargetDropdown.locator(".p-select-label"),
        ).toHaveAttribute("aria-disabled", "true");
      });

      test("shows the banner colors", async ({ page }) => {
        const color = page.getByTestId("banner-color-field");
        await expect(color).toBeVisible();
        await expect(color).toContainText("admin.settings.banner.color");
        await expect(color).toContainText("admin.room_types.custom_color");
        const colorButtons = color.getByTestId("color-button");
        await expect(colorButtons).toHaveCount(2);
        for (let i = 0; i < 2; i++) {
          const button = colorButtons.nth(i);
          await expect(button).toHaveAttribute("role", "button");
          await expect(button).toHaveClass(/pointer-events-none/);
          await expect(button).toHaveClass(/opacity-80/);
          await expect(button).not.toHaveClass(/cursor-pointer/);
          if (i === 0) {
            await expect(button).toHaveClass(/(^|\s)selected(\s|$)/);
          } else {
            await expect(button).not.toHaveClass(/(^|\s)selected(\s|$)/);
          }
        }
        await expect(color.locator("#banner-color")).toHaveValue("#FFFFFF");
        await expect(color.locator("#banner-color")).toBeDisabled();

        const background = page.getByTestId("banner-background-field");
        await expect(background).toBeVisible();
        await expect(background).toContainText(
          "admin.settings.banner.background",
        );
        await expect(background).toContainText("admin.room_types.custom_color");
        const backgroundButtons = background.getByTestId("color-button");
        await expect(backgroundButtons).toHaveCount(10);
        for (let i = 0; i < 10; i++) {
          const button = backgroundButtons.nth(i);
          await expect(button).toHaveAttribute("role", "button");
          await expect(button).toHaveClass(/pointer-events-none/);
          await expect(button).toHaveClass(/opacity-80/);
          await expect(button).not.toHaveClass(/cursor-pointer/);
          if (i === 7) {
            await expect(button).toHaveClass(/(^|\s)selected(\s|$)/);
          } else {
            await expect(button).not.toHaveClass(/(^|\s)selected(\s|$)/);
          }
        }
        await expect(background.locator("#banner-background")).toHaveValue(
          "#ef4444",
        );
        await expect(background.locator("#banner-background")).toBeDisabled();
      });
    });
  });

  test.describe("rooms", () => {
    test.beforeEach(({ settingsResponse }) => {
      settingsResponse.data.room_auto_delete_inactive_period = 30;
      settingsResponse.data.room_auto_delete_never_used_period = 730;
    });

    test("shows the room settings disabled", async ({ page }) => {
      await page.goto("/admin/settings");

      const limit = page.getByTestId("room-limit-field");
      await expect(limit).toBeVisible();
      await expect(limit).toContainText("admin.settings.room_limit.title");
      await expect(limit).toContainText(
        "admin.settings.room_limit.description",
      );

      const unlimited = limit.getByTestId("room-limit-mode-unlimited-field");
      await expect(unlimited).toBeVisible();
      await expect(unlimited).toContainText("app.unlimited");
      await expect(
        unlimited.locator("#room-limit-mode-unlimited"),
      ).toBeChecked();
      await expect(
        unlimited.locator("#room-limit-mode-unlimited"),
      ).toBeDisabled();

      await expect(limit.locator("#room-limit-custom")).toBeHidden();

      const custom = limit.getByTestId("room-limit-mode-custom-field");
      await expect(custom).toBeVisible();
      await expect(custom).toContainText("admin.roles.room_limit.custom");
      await expect(custom.locator("#room-limit-mode-custom")).not.toBeChecked();
      await expect(custom.locator("#room-limit-mode-custom")).toBeDisabled();

      const expiration = page.getByTestId(
        "room-personalized-link-expiration-field",
      );
      await expect(expiration).toBeVisible();
      await expect(expiration).toContainText(
        "admin.settings.room_personalized_link_expiration.title",
      );
      await expect(expiration).toContainText(
        "admin.settings.room_personalized_link_expiration.description",
      );
      const expirationDropdown = expiration.getByTestId(
        "room-personalized-link-expiration-dropdown",
      );
      await expect(expirationDropdown).toHaveText("app.unlimited");
      await expect(
        expirationDropdown.locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");

      const periods = [
        ["deadline", "deadline", "admin.settings.two_weeks"],
        ["inactive", "inactive", "admin.settings.one_month"],
        ["never-used", "never_used", "admin.settings.two_years"],
      ];
      for (const [id, key, text] of periods) {
        const field = page.getByTestId(`room-auto-delete-${id}-period-field`);
        await expect(field).toBeVisible();
        await expect(field).toContainText(
          `admin.settings.room_auto_delete.${key}_period.title`,
        );
        await expect(field).toContainText(
          `admin.settings.room_auto_delete.${key}_period.description`,
        );
        const fieldDropdown = field.getByTestId(
          `room-auto-delete-${id}-dropdown`,
        );
        await expect(fieldDropdown).toHaveText(text);
        await expect(fieldDropdown.locator(".p-select-label")).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      }

      const terms = page.getByTestId("room-file-terms-of-use-field");
      await expect(terms).toBeVisible();
      await expect(terms).toContainText(
        "admin.settings.room_file_terms_of_use.title",
      );
      await expect(terms).toContainText(
        "admin.settings.room_file_terms_of_use.description",
      );
      await expect(terms.locator("#room-file-terms-of-use")).toBeVisible();
      await expect(terms.locator("#room-file-terms-of-use")).toHaveValue(
        "Room file terms of use",
      );
      await expect(terms.locator("#room-file-terms-of-use")).toBeDisabled();

      const hideOwner = page.getByTestId("room-hide-owner-field");
      await expect(hideOwner).toBeVisible();
      await expect(hideOwner).toContainText(
        "admin.settings.room_hide_owner_from_guests",
      );
      await expect(hideOwner.locator("#room-hide-owner")).not.toBeChecked();
      await expect(hideOwner.locator("#room-hide-owner")).toBeDisabled();
    });

    test("shows a custom room limit and hidden owner disabled", async ({
      page,
      settingsResponse,
    }) => {
      settingsResponse.data.room_limit = 10;
      settingsResponse.data.room_hide_owner_from_guests = true;
      await page.goto("/admin/settings");

      const limit = page.getByTestId("room-limit-field");
      await expect(limit).toBeVisible();
      await expect(limit).toContainText("admin.settings.room_limit.title");
      await expect(limit).toContainText(
        "admin.settings.room_limit.description",
      );

      const unlimited = limit.getByTestId("room-limit-mode-unlimited-field");
      await expect(unlimited).toBeVisible();
      await expect(unlimited).toContainText("app.unlimited");
      await expect(
        unlimited.locator("#room-limit-mode-unlimited"),
      ).not.toBeChecked();
      await expect(
        unlimited.locator("#room-limit-mode-unlimited"),
      ).toBeDisabled();

      await expect(limit.locator("#room-limit-custom")).toBeVisible();
      await expect(limit.locator("#room-limit-custom")).toHaveValue("10");
      await expect(limit.locator("#room-limit-custom")).toBeDisabled();

      const custom = limit.getByTestId("room-limit-mode-custom-field");
      await expect(custom).toBeVisible();
      await expect(custom).toContainText("admin.roles.room_limit.custom");
      await expect(custom.locator("#room-limit-mode-custom")).toBeChecked();
      await expect(custom.locator("#room-limit-mode-custom")).toBeDisabled();

      const hideOwner = page.getByTestId("room-hide-owner-field");
      await expect(hideOwner).toBeVisible();
      await expect(hideOwner).toContainText(
        "admin.settings.room_hide_owner_from_guests",
      );
      await expect(hideOwner.locator("#room-hide-owner")).toBeChecked();
      await expect(hideOwner.locator("#room-hide-owner")).toBeDisabled();
    });
  });

  test.describe("users", () => {
    test("shows the user settings enabled but disabled for editing", async ({
      page,
    }) => {
      await page.goto("/admin/settings");

      const password = page.getByTestId("password-change-allowed-field");
      await expect(password).toBeVisible();
      await expect(password).toContainText(
        "admin.settings.password_change_allowed",
      );
      await expect(password.locator("#password-change-allowed")).toBeChecked();
      await expect(password.locator("#password-change-allowed")).toBeDisabled();

      const search = page.getByTestId("user-search-by-name-field");
      await expect(search).toBeVisible();
      await expect(search).toContainText(
        "admin.settings.user_search_by_name.title",
      );
      await expect(search).toContainText(
        "admin.settings.user_search_by_name.description",
      );
      await expect(search.locator("#user-search-by-name")).toBeChecked();
      await expect(search.locator("#user-search-by-name")).toBeDisabled();
    });

    test("shows the user settings turned off and disabled", async ({
      page,
      settingsResponse,
    }) => {
      settingsResponse.data.user_password_change_allowed = false;
      settingsResponse.data.user_search_by_name = false;
      await page.goto("/admin/settings");

      const password = page.getByTestId("password-change-allowed-field");
      await expect(password).toBeVisible();
      await expect(password).toContainText(
        "admin.settings.password_change_allowed",
      );
      await expect(
        password.locator("#password-change-allowed"),
      ).not.toBeChecked();
      await expect(password.locator("#password-change-allowed")).toBeDisabled();

      const search = page.getByTestId("user-search-by-name-field");
      await expect(search).toBeVisible();
      await expect(search).toContainText(
        "admin.settings.user_search_by_name.title",
      );
      await expect(search).toContainText(
        "admin.settings.user_search_by_name.description",
      );
      await expect(search.locator("#user-search-by-name")).not.toBeChecked();
      await expect(search.locator("#user-search-by-name")).toBeDisabled();
    });
  });

  test("shows the recording and statistics settings disabled", async ({
    page,
    settingsResponse,
  }) => {
    Object.assign(settingsResponse.data, {
      recording_server_usage_retention_period: 90,
      recording_meeting_usage_retention_period: 180,
      recording_attendance_retention_period: 365,
      recording_recording_retention_period: 7,
    });
    await page.goto("/admin/settings");
    await expect(
      page.getByText("admin.settings.recording_and_statistics_title"),
    ).toBeVisible();

    for (const kind of ["servers", "meetings"]) {
      const enabled = page.getByTestId(`statistics-${kind}-enabled-field`);
      await expect(enabled).toBeVisible();
      await expect(enabled).toContainText(
        `admin.settings.statistics.${kind}.enabled_title`,
      );
      await expect(
        enabled.locator(`#statistics-${kind}-enabled`),
      ).toBeChecked();
      await expect(
        enabled.locator(`#statistics-${kind}-enabled`),
      ).toBeDisabled();
    }
    await expect(
      page.getByTestId("statistics-servers-enabled-field"),
    ).toContainText("app.enable");

    const periods = [
      [
        "statistics-servers-retention-period",
        "admin.settings.statistics.servers.retention_period_title",
        "admin.settings.three_month",
      ],
      [
        "statistics-meetings-retention-period",
        "admin.settings.statistics.meetings.retention_period_title",
        "admin.settings.six_month",
      ],
      [
        "attendance-retention-period",
        "admin.settings.attendance.retention_period_title",
        "admin.settings.one_year",
      ],
      [
        "recording-retention-period",
        "admin.settings.recording.retention_period_title",
        "admin.settings.one_week",
      ],
    ];
    for (const [id, title, text] of periods) {
      const field = page.getByTestId(`${id}-field`);
      await expect(field).toBeVisible();
      await expect(field).toContainText(title);
      const fieldDropdown = field.getByTestId(`${id}-dropdown`);
      await expect(fieldDropdown).toHaveText(text);
      await expect(fieldDropdown.locator(".p-select-label")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    }
  });

  test.describe("bbb", () => {
    test("shows the empty bbb settings read-only", async ({ page }) => {
      await page.goto("/admin/settings");

      const logo = page.getByTestId("bbb-logo-field");
      await expect(logo).toBeVisible();
      await expect(logo).toContainText("admin.settings.logo.title");
      await checkSettingsImageSelectorOnlyView(logo, "/images/logo.svg");

      const logoDark = page.getByTestId("bbb-logo-dark-field");
      await expect(logoDark).toBeVisible();
      await expect(logoDark).toContainText("admin.settings.logo_dark.title");
      await checkSettingsImageSelectorOnlyView(
        logoDark,
        "/images/logo-dark.svg",
      );

      const style = page.getByTestId("bbb-style-field");
      await expect(style).toBeVisible();
      await expect(style).toContainText("admin.settings.bbb.style.title");
      await checkSettingsFileSelectorOnlyView(style, "");

      const presentation = page.getByTestId("default-presentation-field");
      await expect(presentation).toBeVisible();
      await expect(presentation).toContainText(
        "admin.settings.default_presentation",
      );
      await checkSettingsFileSelectorOnlyView(presentation, "");

      const welcome = page.getByTestId("bbb-default-welcome-message-field");
      await expect(welcome).toBeVisible();
      await expect(welcome).toContainText(
        "admin.settings.bbb.default_welcome_message.title",
      );
      await expect(welcome).toContainText(
        'app.char_counter_{"chars":0,"max":500}',
      );
      await expect(welcome.locator("#bbb-default-welcome-message")).toHaveValue(
        "",
      );
      await expect(
        welcome.locator("#bbb-default-welcome-message"),
      ).toBeDisabled();
    });

    test("shows configured bbb settings read-only", async ({
      page,
      settingsResponse,
    }) => {
      Object.assign(settingsResponse.data, {
        bbb_logo: null,
        bbb_logo_dark: null,
        bbb_style: "/files/bbb_style.css",
        bbb_default_presentation: "/files/testFile.txt",
        bbb_default_welcome_message: "Welcome to our BigBlueButton meetings!",
      });
      await page.goto("/admin/settings");

      const logo = page.getByTestId("bbb-logo-field");
      await expect(logo).toBeVisible();
      await expect(logo).toContainText("admin.settings.logo.title");
      await checkSettingsImageSelectorOnlyView(logo, "");

      const logoDark = page.getByTestId("bbb-logo-dark-field");
      await expect(logoDark).toBeVisible();
      await expect(logoDark).toContainText("admin.settings.logo_dark.title");
      await checkSettingsImageSelectorOnlyView(logoDark, "");

      const style = page.getByTestId("bbb-style-field");
      await expect(style).toBeVisible();
      await expect(style).toContainText("admin.settings.bbb.style.title");
      await checkSettingsFileSelectorOnlyView(style, "/files/bbb_style.css");

      const presentation = page.getByTestId("default-presentation-field");
      await expect(presentation).toBeVisible();
      await expect(presentation).toContainText(
        "admin.settings.default_presentation",
      );
      await checkSettingsFileSelectorOnlyView(
        presentation,
        "/files/testFile.txt",
      );

      const welcome = page.getByTestId("bbb-default-welcome-message-field");
      await expect(welcome).toBeVisible();
      await expect(welcome).toContainText(
        "admin.settings.bbb.default_welcome_message.title",
      );
      await expect(welcome).toContainText(
        'app.char_counter_{"chars":38,"max":500}',
      );
      await expect(welcome.locator("#bbb-default-welcome-message")).toHaveValue(
        "Welcome to our BigBlueButton meetings!",
      );
      await expect(
        welcome.locator("#bbb-default-welcome-message"),
      ).toBeDisabled();
    });
  });
});
