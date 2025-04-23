import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";
import { parseFormData } from "../support/utils/formData.js";
import { _arrayBufferToBase64 } from "../support/utils/fileHelper.js";

describe("Admin settings with edit permission", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminSettingsRequest();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "settings.viewAny",
        "settings.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("change application settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.application");

    cy.get('[data-test="application-name-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.name.title")
      .and("include.text", "admin.settings.name.description")
      .within(() => {
        cy.get("#application-name")
          .should("have.value", "Test Application")
          .clear();
        cy.get("#application-name").type("PILOS test application");
      });

    cy.get('[ data-test="help-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.help_url.title")
      .and("include.text", "admin.settings.help_url.description")
      .within(() => {
        cy.get("#help-url")
          .should("have.value", "")
          .type("http://www.pilos.com/help");
      });

    cy.get('[data-test="legal-notice-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.legal_notice_url.title")
      .and("include.text", "admin.settings.legal_notice_url.description")
      .within(() => {
        cy.get("#legal-notice-url")
          .should("have.value", "")
          .type("http://www.pilos.com/legal_notice");
      });

    cy.get('[data-test="privacy-policy-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.privacy_policy_url.title")
      .and("include.text", "admin.settings.privacy_policy_url.description")
      .within(() => {
        cy.get("#privacy-policy-url")
          .should("have.value", "")
          .type("http://www.pilos.com/privacy_policy");
      });

    cy.get('[data-test="pagination-page-size-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.pagination_page_size.title")
      .and("include.text", "admin.settings.pagination_page_size.description")
      .within(() => {
        cy.get("#pagination-page-size").should("have.value", "5").clear();
        cy.get("#pagination-page-size").type("3");
      });

    cy.get('[data-test="toast-lifetime-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.toast_lifetime.title")
      .and("include.text", "admin.settings.toast_lifetime.description")
      .within(() => {
        cy.get('[data-test="toast-lifetime-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#toast-lifetime-mode-unlimited")
              .should("be.checked")
              .and("not.be.disabled");
          });

        cy.get('[data-test="toast-lifetime-custom-input"]').should("not.exist");

        cy.get('[data-test="toast-lifetime-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.settings.toast_lifetime.custom")
          .within(() => {
            cy.get("#toast-lifetime-mode-custom")
              .should("not.be.checked")
              .and("not.be.disabled")
              .click();
          });

        cy.get('[data-test="toast-lifetime-custom-input"]')
          .should("be.visible")
          .and("have.value", "5")
          .clear();
        cy.get('[data-test="toast-lifetime-custom-input"]').type("10");
      });

    // Check timezone setting and change it
    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="default-timezone-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.default_timezone")
      .within(() => {
        cy.get('[data-test="timezone-dropdown"]')
          .should("have.text", "UTC")
          .click();
      });

    cy.get('[data-test="timezone-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="timezone-dropdown-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(0)
          .should("have.text", "America/New_York");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(1)
          .should("have.text", "Australia/Sydney");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(2)
          .should("have.text", "Europe/Berlin");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(3)
          .should("have.text", "UTC");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(3)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="timezone-dropdown-option"]').eq(2).click();
      });

    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );

    cy.get('[data-test="no-welcome-page-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.no_welcome_page")
      .within(() => {
        cy.get("#no-welcome-page").should("be.checked").click();
      });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.general_name = "PILOS test application";
      settings.data.general_help_url = "http://www.pilos.com/help";
      settings.data.general_legal_notice_url =
        "http://www.pilos.com/legal_notice";
      settings.data.general_privacy_policy_url =
        "http://www.pilos.com/privacy_policy";
      settings.data.general_pagination_page_size = 3;
      settings.data.general_toast_lifetime = 10;
      settings.data.general_default_timezone = "Europe/Berlin";
      settings.data.general_no_welcome_page = false;

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("general_name")).to.equal("PILOS test application");
      expect(formData.get("general_help_url")).to.equal(
        "http://www.pilos.com/help",
      );
      expect(formData.get("general_legal_notice_url")).to.equal(
        "http://www.pilos.com/legal_notice",
      );
      expect(formData.get("general_privacy_policy_url")).to.equal(
        "http://www.pilos.com/privacy_policy",
      );
      expect(formData.get("general_pagination_page_size")).to.equal("3");
      expect(formData.get("general_toast_lifetime")).to.equal("10");
      expect(formData.get("general_default_timezone")).to.equal(
        "Europe/Berlin",
      );
      expect(formData.get("general_no_welcome_page")).to.equal("0");
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get("#application-name").should("have.value", "PILOS test application");
    cy.get("#help-url").should("have.value", "http://www.pilos.com/help");
    cy.get("#legal-notice-url").should(
      "have.value",
      "http://www.pilos.com/legal_notice",
    );
    cy.get("#privacy-policy-url").should(
      "have.value",
      "http://www.pilos.com/privacy_policy",
    );
    cy.get("#pagination-page-size").should("have.value", "3");
    cy.get("#toast-lifetime-mode-unlimited")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#toast-lifetime-mode-custom")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get('[data-test="toast-lifetime-custom-input"]').should(
      "have.value",
      "10",
    );
    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );
    cy.get("#no-welcome-page").should("not.be.checked");

    // Change settings again (Clear url fields and change toast lifetime to unlimited)
    cy.get("#help-url").clear();
    cy.get("#legal-notice-url").clear();
    cy.get("#privacy-policy-url").clear();

    cy.get("#toast-lifetime-mode-unlimited").click();
    cy.get('[data-test="toast-lifetime-custom-input"]').should("not.exist");

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.general_name = "PILOS test application";
      settings.data.general_pagination_page_size = 3;
      settings.data.general_toast_lifetime = 0;
      settings.data.general_default_timezone = "Europe/Berlin";
      settings.data.general_no_welcome_page = false;

      cy.intercept("POST", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="settings-save-button"]')
      .should("include.text", "app.save")
      .click();

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("general_name")).to.equal("PILOS test application");
      expect(formData.get("general_help_url")).to.equal("");
      expect(formData.get("general_legal_notice_url")).to.equal("");
      expect(formData.get("general_privacy_policy_url")).to.equal("");
      expect(formData.get("general_pagination_page_size")).to.equal("3");
      expect(formData.get("general_toast_lifetime")).to.equal("0");
      expect(formData.get("general_default_timezone")).to.equal(
        "Europe/Berlin",
      );
      expect(formData.get("general_no_welcome_page")).to.equal("0");
    });

    // Check that settings are shown correctly
    cy.get("#application-name").should("have.value", "PILOS test application");
    cy.get("#help-url").should("have.value", "");
    cy.get("#legal-notice-url").should("have.value", "");
    cy.get("#privacy-policy-url").should("have.value", "");
    cy.get("#pagination-page-size").should("have.value", "3");
    cy.get("#toast-lifetime-mode-unlimited")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#toast-lifetime-mode-custom")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get('[data-test="toast-lifetime-custom-input"]').should("not.exist");
    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );
    cy.get("#no-welcome-page").should("not.be.checked");
  });

  it("change theme settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.theme.title");

    cy.get('[data-test="favicon-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.favicon.title")
      .within(() => {
        cy.checkSettingsImageSelector(
          "/images/favicon.ico",
          "favicon.ico",
          false,
        );
      });

    cy.get('[data-test="favicon-dark-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.favicon_dark.title")
      .within(() => {
        cy.checkSettingsImageSelector(
          "/images/favicon-dark.ico",
          "favicon-dark.ico",
          false,
        );
      });

    cy.get('[data-test="logo-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo.title")
      .within(() => {
        cy.checkSettingsImageSelector("/images/logo.svg", "logo.svg", false);
      });

    cy.get('[data-test="logo-dark-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo_dark.title")
      .within(() => {
        cy.checkSettingsImageSelector(
          "/images/logo-dark.svg",
          "logo-dark.svg",
          false,
        );
      });

    cy.get('[data-test="primary-color-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.theme.primary_color")
      .within(() => {
        cy.get('[data-test="color-button"]').should("have.length", 10);

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("have.attr", "role", "button")
            .and(
              "not.have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and(i === 4 ? "have.class" : "not.have.class", "selected");
        }

        // Clear custom color and check that color buttons are not selected
        cy.get("#theme-primary-color")
          .should("have.value", "#22c55e")
          .and("not.be.disabled")
          .clear();

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("not.have.class", "selected");
        }

        // Set custom color and check that color buttons is selected
        cy.get("#theme-primary-color").type("#14b8a6");

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should(i === 3 ? "have.class" : "not.have.class", "selected");
        }
      });

    cy.get('[data-test="theme-rounded-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.theme.rounded")
      .within(() => {
        cy.get("#theme-rounded").should("be.checked").click();
      });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.theme_favicon = "/images/favicon2.ico";
      settings.data.theme_favicon_dark = "/images/favicon-dark2.ico";
      settings.data.theme_logo = "/images/logo2.svg";
      settings.data.theme_logo_dark = "/images/logo-dark2.svg";
      settings.data.theme_primary_color = "#14b8a6";
      settings.data.theme_rounded = false;

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      const uploadedFavicon = formData.get("theme_favicon_file");

      expect(uploadedFavicon.name).to.eql("favicon.ico");
      expect(uploadedFavicon.type).to.eql("image/vnd.microsoft.icon");
      cy.fixture("files/favicon.ico", "base64").then((content) => {
        uploadedFavicon.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(base64).to.eql(content);
        });
      });

      expect(formData.get("theme_favicon")).to.eql(null);

      const uploadedFaviconDark = formData.get("theme_favicon_dark_file");
      expect(uploadedFaviconDark.name).to.eql("favicon-dark.ico");
      expect(uploadedFaviconDark.type).to.eql("image/vnd.microsoft.icon");
      cy.fixture("files/favicon-dark.ico", "base64").then((content) => {
        uploadedFaviconDark.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      expect(formData.get("theme_favicon_dark")).to.eql(null);

      const uploadedLogo = formData.get("theme_logo_file");
      expect(uploadedLogo.name).to.eql("logo.svg");
      expect(uploadedLogo.type).to.eql("image/svg+xml");
      cy.fixture("files/logo.svg", "base64").then((content) => {
        uploadedLogo.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      expect(formData.get("theme_logo")).to.eql(null);

      const uploadedLogoDark = formData.get("theme_logo_dark_file");
      expect(uploadedLogoDark.name).to.eql("logo-dark.svg");
      expect(uploadedLogoDark.type).to.eql("image/svg+xml");
      cy.fixture("files/logo-dark.svg", "base64").then((content) => {
        uploadedLogoDark.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      expect(formData.get("theme_logo_dark")).to.eql(null);

      expect(formData.get("theme_primary_color")).to.equal("#14b8a6");
      expect(formData.get("theme_rounded")).to.equal("0");
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get('[data-test="favicon-field"]')
      .find('[data-test="settings-image-preview"]')
      .should("have.attr", "src")
      .and("include", "/images/favicon2.ico");
    cy.get('[data-test="favicon-dark-field"]')
      .find('[data-test="settings-image-preview"]')
      .should("have.attr", "src")
      .and("include", "/images/favicon-dark2.ico");
    cy.get('[data-test="logo-field"]')
      .find('[data-test="settings-image-preview"]')
      .should("have.attr", "src")
      .and("include", "/images/logo2.svg");
    cy.get('[data-test="logo-dark-field"]')
      .find('[data-test="settings-image-preview"]')
      .should("have.attr", "src")
      .and("include", "/images/logo-dark2.svg");
    cy.get('[data-test="primary-color-field"]').within(() => {
      for (let i = 0; i < 10; i++) {
        cy.get('[data-test="color-button"]')
          .eq(i)
          .should(i === 3 ? "have.class" : "not.have.class", "selected");
      }

      cy.get("#theme-primary-color").should("have.value", "#14b8a6");
    });
    cy.get("#theme-rounded").should("not.be.checked");

    // Save changes again
    cy.fixture("settings.json").then((settings) => {
      settings.data.theme_favicon = "/images/favicon2.ico";
      settings.data.theme_favicon_dark = "/images/favicon-dark2.ico";
      settings.data.theme_logo = "/images/logo2.svg";
      settings.data.theme_logo_dark = "/images/logo-dark2.svg";
      settings.data.theme_primary_color = "#14b8a6";
      settings.data.theme_rounded = false;

      cy.intercept("POST", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("saveChangesRequest");

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("theme_favicon_file")).to.eql(null);
      expect(formData.get("theme_favicon")).to.eql("/images/favicon2.ico");

      expect(formData.get("theme_favicon_dark_file")).to.eql(null);
      expect(formData.get("theme_favicon_dark")).to.eql(
        "/images/favicon-dark2.ico",
      );

      expect(formData.get("theme_logo_file")).to.eql(null);
      expect(formData.get("theme_logo")).to.eql("/images/logo2.svg");

      expect(formData.get("theme_logo_dark_file")).to.eql(null);
      expect(formData.get("theme_logo_dark")).to.eql("/images/logo-dark2.svg");

      expect(formData.get("theme_primary_color")).to.equal("#14b8a6");
      expect(formData.get("theme_rounded")).to.equal("0");
    });
  });

  it("change banner settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.banner.title");

    cy.get('[data-test="banner-enabled-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.enabled")
      .and("include.text", "app.enable")
      .within(() => {
        cy.get("#banner-enabled").should("not.be.checked").click();
      });

    cy.get('[data-test="banner-preview-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.preview")
      .within(() => {
        cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
        cy.get('[data-test="app-banner"]').within(() => {
          cy.get('[data-test="banner-title"]').should("not.exist");
          cy.get('[data-test="banner-icon"]').should("not.exist");
          cy.get('[data-test="banner-message"]').should("have.text", "");
          cy.get('[data-test="banner-link-button"]').should("not.exist");
        });
      });

    cy.get('[data-test="banner-title-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.banner_title")
      .within(() => {
        cy.get("#banner-title").should("have.value", "").type("Banner title");
      });

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]').should("not.exist");
      cy.get('[data-test="banner-message"]').should("have.text", "");
      cy.get('[data-test="banner-link-button"]').should("not.exist");
    });

    cy.get('[data-test="banner-icon-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.icon")
      .and("include.text", "admin.settings.banner.icon_description")
      .within(() => {
        cy.get("#banner-icon")
          .should("have.value", "")
          .type("fa-solid fa-door-open");
      });

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]').should("have.text", "");
      cy.get('[data-test="banner-link-button"]').should("not.exist");
    });

    cy.get('[data-test="banner-message-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.message")
      .within(() => {
        cy.get("#banner-message")
          .should("have.value", "")
          .type("Banner text message");
      });

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]').should("not.exist");
    });

    cy.get('[data-test="banner-link-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link")
      .within(() => {
        cy.get("#banner-link").should("have.value", "").type("/rooms");
      });

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_blank")
        .and("have.text", "/rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "primary")
        .and("not.have.class", "p-0 underline")
        .and("not.have.attr", "style");
    });

    cy.get('[data-test="banner-link-text-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_text")
      .within(() => {
        cy.get("#banner-link-text").should("have.value", "").type("Rooms");
      });

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_blank")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "primary")
        .and("not.have.class", "p-0 underline")
        .and("not.have.attr", "style");
    });

    cy.get('[data-test="banner-link-style-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="banner-link-style-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_style")
      .within(() => {
        cy.get('[data-test="banner-link-style-dropdown"]')
          .should("have.text", "app.button_styles.primary")
          .click();
      });

    cy.get('[data-test="banner-link-style-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="banner-link-style-dropdown-option"]').should(
          "have.length",
          3,
        );

        cy.get('[data-test="banner-link-style-dropdown-option"]')
          .eq(0)
          .should("have.text", "app.button_styles.primary")
          .should("have.attr", "aria-selected", "true");
        cy.get('[data-test="banner-link-style-dropdown-option"]')
          .eq(1)
          .should("have.text", "app.button_styles.secondary");
        cy.get('[data-test="banner-link-style-dropdown-option"]')
          .eq(2)
          .should("have.text", "app.button_styles.link");

        cy.get('[data-test="banner-link-style-dropdown-option"]').eq(2).click();
      });

    cy.get('[data-test="banner-link-style-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="banner-link-style-dropdown"]').should(
      "have.text",
      "app.button_styles.link",
    );

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_blank")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("not.have.attr", "style");
    });

    cy.get('[data-test="banner-link-target-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="banner-link-target-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_target")
      .within(() => {
        cy.get('[data-test="banner-link-target-dropdown"]')
          .should("have.text", "app.link_targets.blank")
          .click();
      });

    cy.get('[data-test="banner-link-target-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="banner-link-target-dropdown-option"]').should(
          "have.length",
          2,
        );

        cy.get('[data-test="banner-link-target-dropdown-option"]')
          .eq(0)
          .should("have.text", "app.link_targets.blank")
          .should("have.attr", "aria-selected", "true");
        cy.get('[data-test="banner-link-target-dropdown-option"]')
          .eq(1)
          .should("have.text", "app.link_targets.self");

        cy.get('[data-test="banner-link-target-dropdown-option"]')
          .eq(1)
          .click();
      });

    cy.get('[data-test="banner-link-target-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="banner-link-target-dropdown"]').should(
      "have.text",
      "app.link_targets.self",
    );

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]').should("not.have.attr", "style");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("not.have.attr", "style");
    });

    cy.get('[data-test="banner-color-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.color")
      .and("include.text", "admin.room_types.custom_color")
      .within(() => {
        cy.get('[data-test="color-button"]').should("have.length", 2);

        for (let i = 0; i < 2; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("have.attr", "role", "button")
            .and(
              "not.have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and("not.have.class", "selected");
        }

        // Clear custom color and check that color buttons are not selected
        cy.get("#banner-color")
          .should("have.value", "")
          .and("not.be.disabled")
          .type("#6366f1");

        for (let i = 0; i < 2; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("not.have.class", "selected");
        }

        // Set custom color and check that color buttons is selected
        cy.get("#banner-color").clear();
        cy.get("#banner-color").type("#FFFFFF");

        for (let i = 0; i < 2; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should(i === 0 ? "have.class" : "not.have.class", "selected");
        }
      });

    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("not.include", "background-color");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("have.attr", "style")
        .and("include", "color: rgb(255, 255, 255)");
    });

    cy.get('[data-test="banner-background-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.background")
      .and("include.text", "admin.room_types.custom_color")
      .within(() => {
        cy.get('[data-test="color-button"]').should("have.length", 10);

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("have.attr", "role", "button")
            .and(
              "not.have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and("not.have.class", "selected");
        }

        // Clear custom color and check that color buttons are not selected
        cy.get("#banner-background")
          .should("have.value", "")
          .and("not.be.disabled")
          .type("#FFFFFF");

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should("not.have.class", "selected");
        }

        // Set custom color and check that color buttons is selected
        cy.get("#banner-background").clear();
        cy.get("#banner-background").type("#6366f1");

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should(i === 0 ? "have.class" : "not.have.class", "selected");
        }

        cy.get('[data-test="color-button"]').eq(7).click();

        cy.get("#banner-background").should("have.value", "#ef4444");

        for (let i = 0; i < 10; i++) {
          cy.get('[data-test="color-button"]')
            .eq(i)
            .should(i === 7 ? "have.class" : "not.have.class", "selected");
        }
      });

    // Check that banner preview was updated
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("include", "background-color: rgb(239, 68, 68);");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("have.attr", "style")
        .and("include", "color: rgb(255, 255, 255)");
    });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
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

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("banner_enabled")).to.equal("1");
      expect(formData.get("banner_title")).to.equal("Banner title");
      expect(formData.get("banner_icon")).to.equal("fa-solid fa-door-open");
      expect(formData.get("banner_message")).to.equal("Banner text message");
      expect(formData.get("banner_link")).to.equal("/rooms");
      expect(formData.get("banner_link_text")).to.equal("Rooms");
      expect(formData.get("banner_link_style")).to.equal("link");
      expect(formData.get("banner_link_target")).to.equal("self");
      expect(formData.get("banner_color")).to.equal("#FFFFFF");
      expect(formData.get("banner_background")).to.equal("#ef4444");
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get("#banner-enabled").should("be.checked");

    // Check that banner preview is shown correctly
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("include", "background-color: rgb(239, 68, 68);");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("have.attr", "style")
        .and("include", "color: rgb(255, 255, 255)");
    });

    cy.get("#banner-title").should("have.value", "Banner title");
    cy.get("#banner-icon").should("have.value", "fa-solid fa-door-open");
    cy.get("#banner-message").should("have.value", "Banner text message");
    cy.get("#banner-link").should("have.value", "/rooms");
    cy.get("#banner-link-text").should("have.value", "Rooms");
    cy.get('[data-test="banner-link-style-dropdown"]').should(
      "have.text",
      "app.button_styles.link",
    );
    cy.get('[data-test="banner-link-target-dropdown"]').should(
      "have.text",
      "app.link_targets.self",
    );
    cy.get('[data-test="banner-color-field"]').within(() => {
      cy.get("#banner-color").should("have.value", "#FFFFFF");

      for (let i = 0; i < 2; i++) {
        cy.get('[data-test="color-button"]')
          .eq(i)
          .should(i === 0 ? "have.class" : "not.have.class", "selected");
      }
    });

    cy.get('[data-test="banner-background-field"]').within(() => {
      cy.get("#banner-background").should("have.value", "#ef4444");

      for (let i = 0; i < 10; i++) {
        cy.get('[data-test="color-button"]')
          .eq(i)
          .should(i === 7 ? "have.class" : "not.have.class", "selected");
      }
    });

    // Change settings again (Clear inputs and disable banner)
    cy.get("#banner-enabled").click();

    // Check that banner preview is still shown correctly
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("include", "background-color: rgb(239, 68, 68);");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]')
        .should("be.visible")
        .and("have.class", "fa-solid fa-door-open");
      cy.get('[data-test="banner-message"]')
        .should("be.visible")
        .and("have.text", "Banner text message");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Rooms");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("have.attr", "style")
        .and("include", "color: rgb(255, 255, 255)");
    });

    cy.get("#banner-title").clear();
    cy.get("#banner-icon").clear();
    cy.get("#banner-message").clear();
    cy.get("#banner-link").clear();
    cy.get("#banner-link-text").clear();
    cy.get("#banner-color").clear();
    cy.get("#banner-background").clear();

    // Check that banner preview is reset
    cy.get('[data-test="banner-preview-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.preview")
      .within(() => {
        cy.get('[data-test="app-banner"]')
          .should("have.attr", "style")
          .and("not.include", "background-color")
          .and("not.include", "color");
        cy.get('[data-test="app-banner"]').within(() => {
          cy.get('[data-test="banner-title"]').should("not.exist");
          cy.get('[data-test="banner-icon"]').should("not.exist");
          cy.get('[data-test="banner-message"]').should("have.text", "");
          cy.get('[data-test="banner-link-button"]').should("not.exist");
        });
      });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.banner_link_style = "link";
      settings.data.banner_link_target = "self";

      cy.intercept("POST", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="settings-save-button"]')
      .should("include.text", "app.save")
      .click();

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("banner_enabled")).to.equal("0");
      expect(formData.get("banner_title")).to.equal("");
      expect(formData.get("banner_icon")).to.equal("");
      expect(formData.get("banner_message")).to.equal("");
      expect(formData.get("banner_link")).to.equal("");
      expect(formData.get("banner_link_text")).to.equal("");
      expect(formData.get("banner_link_style")).to.equal("link");
      expect(formData.get("banner_link_target")).to.equal("self");
      expect(formData.get("banner_color")).to.equal("");
      expect(formData.get("banner_background")).to.equal("");
    });

    // Check that settings are shown correctly
    cy.get("#banner-enabled").should("not.be.checked");
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("not.include", "background-color")
      .and("not.include", "color");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]').should("not.exist");
      cy.get('[data-test="banner-icon"]').should("not.exist");
      cy.get('[data-test="banner-message"]').should("have.text", "");
      cy.get('[data-test="banner-link-button"]').should("not.exist");
    });

    cy.get("#banner-title").should("have.value", "");
    cy.get("#banner-icon").should("have.value", "");
    cy.get("#banner-message").should("have.value", "");
    cy.get("#banner-link").should("have.value", "");
    cy.get("#banner-link-text").should("have.value", "");
    cy.get('[data-test="banner-link-style-dropdown"]').should(
      "have.text",
      "app.button_styles.link",
    );
    cy.get('[data-test="banner-link-target-dropdown"]').should(
      "have.text",
      "app.link_targets.self",
    );
    cy.get('[data-test="banner-color-field"]').within(() => {
      cy.get("#banner-color").should("have.value", "");

      for (let i = 0; i < 2; i++) {
        cy.get('[data-test="color-button"]')
          .eq(i)
          .should("not.have.class", "selected");
      }
    });

    cy.get('[data-test="banner-background-field"]').within(() => {
      cy.get("#banner-background").should("have.value", "");

      for (let i = 0; i < 10; i++) {
        cy.get('[data-test="color-button"]')
          .eq(i)
          .should("not.have.class", "selected");
      }
    });
  });

  it("change room settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("app.rooms");

    cy.get('[data-test="room-limit-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.room_limit.title")
      .and("include.text", "admin.settings.room_limit.description")
      .within(() => {
        cy.get('[data-test="room-limit-mode-unlimited-field"]')
          .should("be.visible")
          .should("include.text", "app.unlimited")
          .within(() => {
            cy.get("#room-limit-mode-unlimited")
              .should("be.checked")
              .and("not.be.disabled");
          });

        cy.get("#room-limit-custom").should("not.exist");

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#room-limit-mode-custom").should("not.be.checked").click();
          });

        cy.get("#room-limit-custom")
          .should("be.visible")
          .and("have.value", "0")
          .clear();
        cy.get("#room-limit-custom").type("10");
      });

    // Room token expiration
    cy.get('[data-test="room-token-expiration-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-token-expiration-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.room_token_expiration.title")
      .and("include.text", "admin.settings.room_token_expiration.description")
      .within(() => {
        cy.get('[data-test="room-token-expiration-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="room-token-expiration-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="room-token-expiration-dropdown-option"]').should(
          "have.length",
          8,
        );

        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="room-token-expiration-dropdown-option"]')
          .eq(1)
          .click();
      });

    cy.get('[data-test="room-token-expiration-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-token-expiration-dropdown"]').should(
      "have.text",
      "admin.settings.two_weeks",
    );

    // Auto delete deadline
    cy.get('[data-test="room-auto-delete-deadline-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-auto-delete-deadline-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.room_auto_delete.deadline_period.title",
      )
      .and(
        "include.text",
        "admin.settings.room_auto_delete.deadline_period.description",
      )
      .within(() => {
        cy.get('[data-test="room-auto-delete-deadline-dropdown"]')
          .should("have.text", "admin.settings.two_weeks")
          .click();
      });

    cy.get('[data-test="room-auto-delete-deadline-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="room-auto-delete-deadline-dropdown-option"]',
        ).should("have.length", 3);

        cy.get('[data-test="room-auto-delete-deadline-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get('[data-test="room-auto-delete-deadline-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get('[data-test="room-auto-delete-deadline-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get('[data-test="room-auto-delete-deadline-dropdown-option"]')
          .eq(1)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="room-auto-delete-deadline-dropdown-option"]')
          .eq(0)
          .click();
      });

    cy.get('[data-test="room-auto-delete-deadline-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-auto-delete-deadline-dropdown"]').should(
      "have.text",
      "admin.settings.one_week",
    );

    // Auto delete inactive period
    cy.get('[data-test="room-auto-delete-inactive-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-auto-delete-inactive-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.room_auto_delete.inactive_period.title",
      )
      .and(
        "include.text",
        "admin.settings.room_auto_delete.inactive_period.description",
      )
      .within(() => {
        cy.get('[data-test="room-auto-delete-inactive-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="room-auto-delete-inactive-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="room-auto-delete-inactive-dropdown-option"]',
        ).should("have.length", 8);

        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="room-auto-delete-inactive-dropdown-option"]')
          .eq(2)
          .click();
      });

    cy.get('[data-test="room-auto-delete-inactive-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-auto-delete-inactive-dropdown"]').should(
      "have.text",
      "admin.settings.one_month",
    );

    // Auto delete never used period
    cy.get('[data-test="room-auto-delete-never-used-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-auto-delete-never-used-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.room_auto_delete.never_used_period.title",
      )
      .and(
        "include.text",
        "admin.settings.room_auto_delete.never_used_period.description",
      )
      .within(() => {
        cy.get('[data-test="room-auto-delete-never-used-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="room-auto-delete-never-used-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="room-auto-delete-never-used-dropdown-option"]',
        ).should("have.length", 8);

        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="room-auto-delete-never-used-dropdown-option"]')
          .eq(6)
          .click();
      });

    cy.get('[data-test="room-auto-delete-never-used-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="room-auto-delete-never-used-dropdown"]').should(
      "have.text",
      "admin.settings.two_years",
    );

    cy.get('[data-test="room-file-terms-of-use-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.room_file_terms_of_use.title")
      .and("include.text", "admin.settings.room_file_terms_of_use.description")
      .within(() => {
        cy.get("#room-file-terms-of-use")
          .should("be.visible")
          .and("have.value", "Room file terms of use")
          .clear();
        cy.get("#room-file-terms-of-use").type("New room file terms of use");
      });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.room_limit = 10;
      settings.data.room_token_expiration = 14;
      settings.data.room_auto_delete_deadline_period = 7;
      settings.data.room_auto_delete_inactive_period = 30;
      settings.data.room_auto_delete_never_used_period = 730;
      settings.data.room_file_terms_of_use = "New room file terms of use";

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("room_limit")).to.equal("10");
      expect(formData.get("room_token_expiration")).to.equal("14");
      expect(formData.get("room_auto_delete_deadline_period")).to.equal("7");
      expect(formData.get("room_auto_delete_inactive_period")).to.equal("30");
      expect(formData.get("room_auto_delete_never_used_period")).to.equal(
        "730",
      );
      expect(formData.get("room_file_terms_of_use")).to.equal(
        "New room file terms of use",
      );
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get("#room-limit-mode-unlimited")
      .should("not.be.checked")
      .and("not.be.disabled");
    cy.get("#room-limit-mode-custom")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#room-limit-custom").should("have.value", "10");
    cy.get('[data-test="room-token-expiration-dropdown"]').should(
      "have.text",
      "admin.settings.two_weeks",
    );
    cy.get('[data-test="room-auto-delete-deadline-dropdown"]').should(
      "have.text",
      "admin.settings.one_week",
    );
    cy.get('[data-test="room-auto-delete-inactive-dropdown"]').should(
      "have.text",
      "admin.settings.one_month",
    );
    cy.get('[data-test="room-auto-delete-never-used-dropdown"]').should(
      "have.text",
      "admin.settings.two_years",
    );
    cy.get("#room-file-terms-of-use").should(
      "have.value",
      "New room file terms of use",
    );

    // Change settings again (Clear inputs and change room limit to unlimited)
    cy.get("#room-limit-mode-unlimited").click();
    cy.get("#room-limit-custom").should("not.exist");

    cy.get("#room-file-terms-of-use").clear();

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.room_limit = -1;
      settings.data.room_token_expiration = 14;
      settings.data.room_auto_delete_deadline_period = 7;
      settings.data.room_auto_delete_inactive_period = 30;
      settings.data.room_auto_delete_never_used_period = 730;
      settings.data.room_file_terms_of_use = null;

      cy.intercept("POST", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="settings-save-button"]')
      .should("include.text", "app.save")
      .click();

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("room_limit")).to.equal("-1");
      expect(formData.get("room_token_expiration")).to.equal("14");
      expect(formData.get("room_auto_delete_deadline_period")).to.equal("7");
      expect(formData.get("room_auto_delete_inactive_period")).to.equal("30");
      expect(formData.get("room_auto_delete_never_used_period")).to.equal(
        "730",
      );
      expect(formData.get("room_file_terms_of_use")).to.equal("");
    });

    // Check that settings are shown correctly
    cy.get("#room-limit-mode-unlimited")
      .should("be.checked")
      .and("not.be.disabled");
    cy.get("#room-limit-mode-custom")
      .should("not.be.checked")
      .and("not.be.disabled");

    cy.get("#room-limit-custom").should("not.exist");
    cy.get('[data-test="room-token-expiration-dropdown"]').should(
      "have.text",
      "admin.settings.two_weeks",
    );
    cy.get('[data-test="room-auto-delete-deadline-dropdown"]').should(
      "have.text",
      "admin.settings.one_week",
    );
    cy.get('[data-test="room-auto-delete-inactive-dropdown"]').should(
      "have.text",
      "admin.settings.one_month",
    );
    cy.get('[data-test="room-auto-delete-never-used-dropdown"]').should(
      "have.text",
      "admin.settings.two_years",
    );
    cy.get("#room-file-terms-of-use").should("have.value", "");
  });

  it("change user settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("app.users");

    cy.get('[data-test="password-change-allowed-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.password_change_allowed")
      .within(() => {
        cy.get("#password-change-allowed").should("be.checked").click();
      });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.user_password_change_allowed = false;

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("user_password_change_allowed")).to.equal("0");
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get("#password-change-allowed").should("not.be.checked");
  });

  it("change recording and statistics settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.recording_and_statistics_title");

    cy.get('[data-test="statistics-servers-enabled-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.statistics.servers.enabled_title")
      .and("include.text", "app.enable")
      .within(() => {
        cy.get("#statistics-servers-enabled").should("be.checked").click();
      });

    // Statistics servers retention period
    cy.get(
      '[data-test="statistics-servers-retention-period-dropdown-items"]',
    ).should("not.exist");
    cy.get('[data-test="statistics-servers-retention-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.statistics.servers.retention_period_title",
      )
      .within(() => {
        cy.get('[data-test="statistics-servers-retention-period-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="statistics-servers-retention-period-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        ).should("have.length", 8);

        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get(
          '[data-test="statistics-servers-retention-period-dropdown-option"]',
        )
          .eq(3)
          .click();
      });

    cy.get(
      '[data-test="statistics-servers-retention-period-dropdown-items"]',
    ).should("not.exist");
    cy.get('[data-test="statistics-servers-retention-period-dropdown"]').should(
      "have.text",
      "admin.settings.three_month",
    );

    // Statistics meetings enabled
    cy.get("[data-test=statistics-meetings-enabled-field]")
      .should("be.visible")
      .and("include.text", "admin.settings.statistics.meetings.enabled_title")
      .within(() => {
        cy.get("#statistics-meetings-enabled").should("be.checked").click();
      });

    // Statistics meetings retention period
    cy.get(
      '[data-test="statistics-meetings-retention-period-dropdown-items"]',
    ).should("not.exist");
    cy.get('[data-test="statistics-meetings-retention-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.statistics.meetings.retention_period_title",
      )
      .within(() => {
        cy.get('[data-test="statistics-meetings-retention-period-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="statistics-meetings-retention-period-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        ).should("have.length", 8);

        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get(
          '[data-test="statistics-meetings-retention-period-dropdown-option"]',
        )
          .eq(4)
          .click();
      });

    cy.get(
      '[data-test="statistics-meetings-retention-period-dropdown-items"]',
    ).should("not.exist");
    cy.get(
      '[data-test="statistics-meetings-retention-period-dropdown"]',
    ).should("have.text", "admin.settings.six_month");

    // Attendance retention period
    cy.get('[data-test="attendance-retention-period-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="attendance-retention-period-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.attendance.retention_period_title")
      .within(() => {
        cy.get('[data-test="attendance-retention-period-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="attendance-retention-period-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="attendance-retention-period-dropdown-option"]',
        ).should("have.length", 8);

        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="attendance-retention-period-dropdown-option"]')
          .eq(5)
          .click();
      });

    cy.get('[data-test="attendance-retention-period-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="attendance-retention-period-dropdown"]').should(
      "have.text",
      "admin.settings.one_year",
    );

    // Recording retention period
    cy.get('[data-test="recording-retention-period-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="recording-retention-period-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.recording.retention_period_title")
      .within(() => {
        cy.get('[data-test="recording-retention-period-dropdown"]')
          .should("have.text", "app.unlimited")
          .click();
      });

    cy.get('[data-test="recording-retention-period-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get(
          '[data-test="recording-retention-period-dropdown-option"]',
        ).should("have.length", 8);

        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(0)
          .should("have.text", "admin.settings.one_week");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(1)
          .should("have.text", "admin.settings.two_weeks");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(2)
          .should("have.text", "admin.settings.one_month");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(3)
          .should("have.text", "admin.settings.three_month");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(4)
          .should("have.text", "admin.settings.six_month");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(5)
          .should("have.text", "admin.settings.one_year");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(6)
          .should("have.text", "admin.settings.two_years");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(7)
          .should("have.text", "app.unlimited");
        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(7)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="recording-retention-period-dropdown-option"]')
          .eq(0)
          .click();
      });

    cy.get('[data-test="recording-retention-period-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="recording-retention-period-dropdown"]').should(
      "have.text",
      "admin.settings.one_week",
    );

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.recording_server_usage_enabled = false;
      settings.data.recording_server_usage_retention_period = 90;
      settings.data.recording_meeting_usage_enabled = false;
      settings.data.recording_meeting_usage_retention_period = 180;
      settings.data.recording_attendance_retention_period = 365;
      settings.data.recording_recording_retention_period = 7;

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("recording_server_usage_enabled")).to.equal("0");
      expect(formData.get("recording_server_usage_retention_period")).to.equal(
        "90",
      );
      expect(formData.get("recording_meeting_usage_enabled")).to.equal("0");
      expect(formData.get("recording_meeting_usage_retention_period")).to.equal(
        "180",
      );
      expect(formData.get("recording_attendance_retention_period")).to.equal(
        "365",
      );
      expect(formData.get("recording_recording_retention_period")).to.equal(
        "7",
      );
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get("#statistics-servers-enabled").should("not.be.checked");
    cy.get('[data-test="statistics-servers-retention-period-dropdown"]').should(
      "have.text",
      "admin.settings.three_month",
    );
    cy.get("#statistics-meetings-enabled").should("not.be.checked");
    cy.get(
      '[data-test="statistics-meetings-retention-period-dropdown"]',
    ).should("have.text", "admin.settings.six_month");
    cy.get('[data-test="attendance-retention-period-dropdown"]').should(
      "have.text",
      "admin.settings.one_year",
    );
    cy.get('[data-test="recording-retention-period-dropdown"]').should(
      "have.text",
      "admin.settings.one_week",
    );
  });

  it("change bbb settings", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.bbb.title");

    cy.get('[data-test="bbb-logo-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo.title")
      .within(() => {
        cy.checkSettingsImageSelector("/images/logo.svg", "logo.svg", true);
      });

    cy.get('[data-test="bbb-logo-dark-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo_dark.title")
      .within(() => {
        cy.checkSettingsImageSelector(
          "/images/logo-dark.svg",
          "logo-dark.svg",
          true,
        );
      });

    cy.get('[data-test="bbb-style-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.bbb.style.title")
      .within(() => {
        cy.checkSettingsFileSelector("", "bbb_style.css", true);
      });

    cy.get('[data-test="default-presentation-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.default_presentation")
      .within(() => {
        cy.checkSettingsFileSelector("", "testFile.txt", true);
      });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.bbb_logo = "/images/logo.svg";
      settings.data.bbb_logo_dark = "/images/logo-dark.svg";
      settings.data.bbb_style = "/files/bbb_style.css";
      settings.data.bbb_default_presentation = "/files/testFile.txt";

      const saveChangesRequest = interceptIndefinitely(
        "POST",
        "api/v1/settings",
        {
          statusCode: 200,
          body: settings,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="settings-save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="settings-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      const uploadedBBBLogo = formData.get("bbb_logo_file");
      expect(uploadedBBBLogo.name).to.eql("logo.svg");
      expect(uploadedBBBLogo.type).to.eql("image/svg+xml");
      cy.fixture("files/logo.svg", "base64").then((content) => {
        uploadedBBBLogo.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      expect(formData.get("bbb_logo")).to.equal(null);

      const uploadedBBBLogoDark = formData.get("bbb_logo_dark_file");
      expect(uploadedBBBLogoDark.name).to.eql("logo-dark.svg");
      expect(uploadedBBBLogoDark.type).to.eql("image/svg+xml");
      cy.fixture("files/logo-dark.svg", "base64").then((content) => {
        uploadedBBBLogoDark.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      expect(formData.get("bbb_logo_dark")).to.equal(null);

      const uploadedBBBStyle = formData.get("bbb_style");
      expect(uploadedBBBStyle.name).to.eql("bbb_style.css");
      expect(uploadedBBBStyle.type).to.eql("text/css");

      cy.fixture("files/bbb_style.css", "base64").then((content) => {
        uploadedBBBStyle.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      const uploadedDefaultPresentation = formData.get(
        "bbb_default_presentation",
      );
      expect(uploadedDefaultPresentation.name).to.eql("testFile.txt");
      expect(uploadedDefaultPresentation.type).to.eql("text/plain");

      cy.fixture("files/testFile.txt", "base64").then((content) => {
        uploadedDefaultPresentation.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="settings-save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get('[data-test="bbb-logo-field"]').within(() => {
      cy.get('[data-test="settings-image-url-input"]').should(
        "have.value",
        "/images/logo.svg",
      );

      cy.get('[data-test="settings-image-delete-button"]').should("be.visible");
    });

    cy.get('[data-test="bbb-logo-dark-field"]').within(() => {
      cy.get('[data-test="settings-image-url-input"]').should(
        "have.value",
        "/images/logo-dark.svg",
      );

      cy.get('[data-test="settings-image-delete-button"]').should("be.visible");
    });

    cy.get('[data-test="bbb-style-field"]').within(() => {
      cy.get('[data-test="file-input-button"]').should(
        "have.text",
        "app.browse",
      );

      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");

      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", "/files/bbb_style.css");
    });

    cy.get('[data-test="default-presentation-field"]').within(() => {
      cy.get('[data-test="file-input-button"]').should(
        "have.text",
        "app.browse",
      );

      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");

      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", "/files/testFile.txt");
    });

    // Change settings again (delete files and images)
    cy.get('[data-test="bbb-logo-field"]').within(() => {
      cy.get('[data-test="settings-image-delete-button"]').click();

      cy.get('[data-test="settings-image-url-input"]').should("not.exist");
      cy.get('[data-test="file-input-button"]').should("not.exist");
      cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-image-undo-delete-button"]')
        .should("be.visible")
        .and("have.text", "app.undo_delete")
        .click();

      cy.get('[data-test="settings-image-url-input"]').should(
        "have.value",
        "/images/logo.svg",
      );

      cy.get('[data-test="settings-image-delete-button"]')
        .should("be.visible")
        .click();
    });

    cy.get('[data-test="bbb-logo-dark-field"]').within(() => {
      cy.get('[data-test="settings-image-delete-button"]').click();

      cy.get('[data-test="settings-image-url-input"]').should("not.exist");
      cy.get('[data-test="file-input-button"]').should("not.exist");
      cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-image-undo-delete-button"]')
        .should("be.visible")
        .and("have.text", "app.undo_delete")
        .click();

      cy.get('[data-test="settings-image-url-input"]').should(
        "have.value",
        "/images/logo-dark.svg",
      );

      cy.get('[data-test="settings-image-delete-button"]')
        .should("be.visible")
        .click();
    });

    cy.get('[data-test="bbb-style-field"]').within(() => {
      cy.get('[data-test="settings-file-delete-button"]').click();

      cy.get('[data-test="file-input-button"]').should("not.exist");
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-file-view-button"]').should("not.exist");
      cy.get('[data-test="settings-file-undo-delete-button"]')
        .should("be.visible")
        .and("have.text", "app.undo_delete")
        .click();

      cy.get('[data-test="file-input-button"]').should(
        "have.text",
        "app.browse",
      );

      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", "/files/bbb_style.css");

      cy.get('[data-test="settings-file-delete-button"]')
        .should("be.visible")
        .click();
    });

    cy.get('[data-test="default-presentation-field"]').within(() => {
      cy.get('[data-test="settings-file-delete-button"]').click();

      cy.get('[data-test="file-input-button"]').should("not.exist");
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-file-view-button"]').should("not.exist");
      cy.get('[data-test="settings-file-undo-delete-button"]')
        .should("be.visible")
        .and("have.text", "app.undo_delete")
        .click();

      cy.get('[data-test="file-input-button"]').should(
        "have.text",
        "app.browse",
      );

      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", "/files/testFile.txt");

      cy.get('[data-test="settings-file-delete-button"]')
        .should("be.visible")
        .click();
    });

    // Save changes
    cy.fixture("settings.json").then((settings) => {
      settings.data.bbb_logo = null;
      settings.data.bbb_logo_dark = null;
      settings.data.bbb_style = null;
      settings.data.bbb_default_presentation = null;

      cy.intercept("POST", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="settings-save-button"]')
      .should("include.text", "app.save")
      .click();

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("bbb_logo_file")).to.eql(null);
      expect(formData.get("bbb_logo")).to.eql("");
      expect(formData.get("bbb_logo_dark")).to.eql("");
      expect(formData.get("bbb_style")).to.eql("");
      expect(formData.get("bbb_default_presentation")).to.be.eql("");
    });

    // Check that settings are shown correctly
    cy.get('[data-test="bbb-logo-field"]').within(() => {
      cy.get('[data-test="settings-image-url-input"]')
        .should("be.visible")
        .and("have.value", "");
      cy.get('[data-test="file-input-button"]').should("be.visible");
      cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-image-undo-delete-button"]').should(
        "not.exist",
      );
    });

    cy.get('[data-test="bbb-logo-dark-field"]').within(() => {
      cy.get('[data-test="settings-image-url-input"]')
        .should("be.visible")
        .and("have.value", "");
      cy.get('[data-test="file-input-button"]').should("be.visible");
      cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-image-undo-delete-button"]').should(
        "not.exist",
      );
    });

    cy.get('[data-test="bbb-style-field"]').within(() => {
      cy.get('[data-test="file-input-button"]').should("be.visible");
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-file-view-button"]').should("not.exist");
      cy.get('[data-test="settings-file-undo-delete-button"]').should(
        "not.exist",
      );
    });

    cy.get('[data-test="default-presentation-field"]').within(() => {
      cy.get('[data-test="file-input-button"]').should("be.visible");
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
      cy.get('[data-test="settings-file-view-button"]').should("not.exist");
      cy.get('[data-test="settings-file-undo-delete-button"]').should(
        "not.exist",
      );
    });

    // Save settings again
    cy.fixture("settings.json").then((settings) => {
      settings.data.bbb_logo = null;
      settings.data.bbb_logo_dark = null;
      settings.data.bbb_style = null;
      settings.data.bbb_default_presentation = null;

      cy.intercept("POST", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("saveChangesRequest");
    });

    cy.get('[data-test="settings-save-button"]')
      .should("include.text", "app.save")
      .click();

    cy.wait("@saveChangesRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      expect(formData.get("bbb_logo_file")).to.eql(null);
      expect(formData.get("bbb_logo")).to.eql(null);
      expect(formData.get("bbb_logo_dark_file")).to.eql(null);
      expect(formData.get("bbb_logo_dark")).to.eql(null);
      expect(formData.get("bbb_style")).to.eql(null);
      expect(formData.get("bbb_default_presentation")).to.be.eql(null);
    });
  });

  it("save changes errors", function () {
    // Check with 422 errors
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.intercept("POST", "api/v1/settings", {
      statusCode: 422,
      body: {
        message: "The given data was invalid.",
        errors: {
          general_name: ["The general name field is required."],
          general_help_url: ["The selected general help url is invalid."],
          general_legal_notice_url: [
            "The selected general legal notice url is invalid.",
          ],
          general_privacy_policy_url: [
            "The selected general privacy policy url is invalid.",
          ],
          general_pagination_page_size: [
            "The general pagination page size field is required.",
          ],
          general_toast_lifetime: [
            "The general toast lifetime field is required.",
          ],
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
          banner_enabled: ["The banner enabled field is required."],
          banner_title: ["The selected banner title is invalid."],
          banner_icon: ["The selected banner icon is invalid."],
          banner_message: ["The selected banner message is invalid."],
          banner_link: ["The selected banner link is invalid."],
          banner_link_text: ["The selected banner link text is invalid."],
          banner_link_style: ["The selected banner link style is invalid."],
          banner_link_target: ["The selected banner link target is invalid."],
          banner_color: ["The selected banner color is invalid."],
          banner_background: [
            "The selected banner background color is invalid.",
          ],
          room_limit: ["The room limit field is required."],
          room_token_expiration: [
            "The selected room token expiration is invalid.",
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
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="settings-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that errors are shown correctly
    cy.get('[data-test="application-name-field"]').should(
      "include.text",
      "The general name field is required.",
    );
    cy.get('[data-test="help-url-field"]').should(
      "include.text",
      "The selected general help url is invalid.",
    );
    cy.get('[data-test="legal-notice-url-field"]').should(
      "include.text",
      "The selected general legal notice url is invalid.",
    );
    cy.get('[data-test="privacy-policy-url-field"]').should(
      "include.text",
      "The selected general privacy policy url is invalid.",
    );
    cy.get('[data-test="pagination-page-size-field"]').should(
      "include.text",
      "The general pagination page size field is required.",
    );
    cy.get('[data-test="toast-lifetime-field"]').should(
      "include.text",
      "The general toast lifetime field is required.",
    );
    cy.get('[data-test="default-timezone-field"]').should(
      "include.text",
      "The general default timezone field is required.",
    );
    cy.get('[data-test="no-welcome-page-field"]').should(
      "include.text",
      "The selected general no welcome page field is invalid.",
    );

    cy.get('[data-test="favicon-field"]')
      .should("include.text", "The theme favicon field is required.")
      .and("include.text", "The theme favicon file field is required.");
    cy.get('[data-test="favicon-dark-field"]')
      .should("include.text", "The theme favicon dark field is required.")
      .and("include.text", "The theme favicon dark file field is required.");
    cy.get('[data-test="logo-field"]')
      .should("include.text", "The theme logo field is required.")
      .and("include.text", "The theme logo file field is required.");
    cy.get('[data-test="logo-dark-field"]')
      .should("include.text", "The theme logo dark field is required.")
      .and("include.text", "The theme logo dark file field is required.");
    cy.get('[data-test="primary-color-field"]').should(
      "include.text",
      "The theme primary color field is required.",
    );
    cy.get('[data-test="theme-rounded-field"]').should(
      "include.text",
      "The theme rounded field is required.",
    );

    cy.get('[data-test="banner-enabled-field"]').should(
      "include.text",
      "The banner enabled field is required.",
    );
    cy.get('[data-test="banner-title-field"]').should(
      "include.text",
      "The selected banner title is invalid.",
    );
    cy.get('[data-test="banner-icon-field"]').should(
      "include.text",
      "The selected banner icon is invalid.",
    );
    cy.get('[data-test="banner-message-field"]').should(
      "include.text",
      "The selected banner message is invalid.",
    );
    cy.get('[data-test="banner-link-field"]').should(
      "include.text",
      "The selected banner link is invalid.",
    );
    cy.get('[data-test="banner-link-text-field"]').should(
      "include.text",
      "The selected banner link text is invalid.",
    );
    cy.get('[data-test="banner-link-style-field"]').should(
      "include.text",
      "The selected banner link style is invalid.",
    );
    cy.get('[data-test="banner-link-target-field"]').should(
      "include.text",
      "The selected banner link target is invalid.",
    );
    cy.get('[data-test="banner-color-field"]').should(
      "include.text",
      "The selected banner color is invalid.",
    );
    cy.get('[data-test="banner-background-field"]').should(
      "include.text",
      "The selected banner background color is invalid.",
    );

    cy.get('[data-test="room-limit-field"]').should(
      "include.text",
      "The room limit field is required.",
    );
    cy.get('[data-test="room-token-expiration-field"]').should(
      "include.text",
      "The selected room token expiration is invalid.",
    );
    cy.get('[data-test="room-auto-delete-deadline-period-field"]').should(
      "include.text",
      "The selected room auto delete deadline period is invalid.",
    );
    cy.get('[data-test="room-auto-delete-inactive-period-field"]').should(
      "include.text",
      "The selected room auto delete inactive period is invalid.",
    );
    cy.get('[data-test="room-auto-delete-never-used-period-field"]').should(
      "include.text",
      "The selected room auto delete never used period is invalid.",
    );
    cy.get('[data-test="room-file-terms-of-use-field"]').should(
      "include.text",
      "The selected room file terms of use is invalid.",
    );

    cy.get('[data-test="password-change-allowed-field"]').should(
      "include.text",
      "The user password change allowed field is required.",
    );

    cy.get('[data-test="statistics-servers-enabled-field"]').should(
      "include.text",
      "The recording server usage enabled field is required.",
    );
    cy.get('[data-test="statistics-servers-retention-period-field"]').should(
      "include.text",
      "The selected recording server usage retention period is invalid.",
    );
    cy.get('[data-test="statistics-meetings-enabled-field"]').should(
      "include.text",
      "The recording meeting usage enabled field is required.",
    );
    cy.get('[data-test="statistics-meetings-retention-period-field"]').should(
      "include.text",
      "The selected recording meeting usage retention period is invalid.",
    );
    cy.get('[data-test="attendance-retention-period-field"]').should(
      "include.text",
      "The selected recording attendance retention period is invalid.",
    );
    cy.get('[data-test="recording-retention-period-field"]').should(
      "include.text",
      "The selected recording recording retention period is invalid.",
    );

    cy.get('[data-test="bbb-logo-field"]')
      .should("include.text", "The logo field is required.")
      .and("include.text", "The logo file field is required.");
    cy.get('[data-test="bbb-logo-dark-field"]')
      .should("include.text", "The dark version logo field is required.")
      .and("include.text", "The dark version logo file field is required.");
    cy.get('[data-test="bbb-style-field"]').should(
      "include.text",
      "The bbb style field is required.",
    );
    cy.get('[data-test="default-presentation-field"]').should(
      "include.text",
      "The bbb default presentation field is required.",
    );

    // Check with 500 error
    cy.intercept("POST", "api/v1/settings", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="settings-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="application-name-field"]').should(
      "not.include.text",
      "The general name field is required.",
    );
    cy.get('[data-test="help-url-field"]').should(
      "not.include.text",
      "The selected general help url is invalid.",
    );
    cy.get('[data-test="legal-notice-url-field"]').should(
      "not.include.text",
      "The selected general legal notice url is invalid.",
    );
    cy.get('[data-test="privacy-policy-url-field"]').should(
      "not.include.text",
      "The selected general privacy policy url is invalid.",
    );
    cy.get('[data-test="pagination-page-size-field"]').should(
      "not.include.text",
      "The general pagination page size field is required.",
    );
    cy.get('[data-test="toast-lifetime-field"]').should(
      "not.include.text",
      "The general toast lifetime field is required.",
    );
    cy.get('[data-test="default-timezone-field"]').should(
      "not.include.text",
      "The general default timezone field is required.",
    );
    cy.get('[data-test="no-welcome-page-field"]').should(
      "not.include.text",
      "The selected general no welcome page field is invalid.",
    );

    cy.get('[data-test="favicon-field"]')
      .should("not.include.text", "The theme favicon field is required.")
      .and("not.include.text", "The theme favicon file field is required.");
    cy.get('[data-test="favicon-dark-field"]')
      .should("not.include.text", "The theme favicon dark field is required.")
      .and(
        "not.include.text",
        "The theme favicon dark file field is required.",
      );
    cy.get('[data-test="logo-field"]')
      .should("not.include.text", "The theme logo field is required.")
      .and("not.include.text", "The theme logo file field is required.");
    cy.get('[data-test="logo-dark-field"]')
      .should("not.include.text", "The theme logo dark field is required.")
      .and("not.include.text", "The theme logo dark file field is required.");
    cy.get('[data-test="primary-color-field"]').should(
      "not.include.text",
      "The theme primary color field is required.",
    );
    cy.get('[data-test="theme-rounded-field"]').should(
      "not.include.text",
      "The theme rounded field is required.",
    );

    cy.get('[data-test="banner-enabled-field"]').should(
      "not.include.text",
      "The banner enabled field is required.",
    );
    cy.get('[data-test="banner-title-field"]').should(
      "not.include.text",
      "The selected banner title is invalid.",
    );
    cy.get('[data-test="banner-icon-field"]').should(
      "not.include.text",
      "The selected banner icon is invalid.",
    );
    cy.get('[data-test="banner-message-field"]').should(
      "not.include.text",
      "The selected banner message is invalid.",
    );
    cy.get('[data-test="banner-link-field"]').should(
      "not.include.text",
      "The selected banner link is invalid.",
    );
    cy.get('[data-test="banner-link-text-field"]').should(
      "not.include.text",
      "The selected banner link text is invalid.",
    );
    cy.get('[data-test="banner-link-style-field"]').should(
      "not.include.text",
      "The selected banner link style is invalid.",
    );
    cy.get('[data-test="banner-link-target-field"]').should(
      "not.include.text",
      "The selected banner link target is invalid.",
    );
    cy.get('[data-test="banner-color-field"]').should(
      "not.include.text",
      "The selected banner color is invalid.",
    );
    cy.get('[data-test="banner-background-field"]').should(
      "not.include.text",
      "The selected banner background color is invalid.",
    );

    cy.get('[data-test="room-limit-field"]').should(
      "not.include.text",
      "The room limit field is required.",
    );
    cy.get('[data-test="room-token-expiration-field"]').should(
      "not.include.text",
      "The selected room token expiration is invalid.",
    );
    cy.get('[data-test="room-auto-delete-deadline-period-field"]').should(
      "not.include.text",
      "The selected room auto delete deadline period is invalid.",
    );
    cy.get('[data-test="room-auto-delete-inactive-period-field"]').should(
      "not.include.text",
      "The selected room auto delete inactive period is invalid.",
    );
    cy.get('[data-test="room-auto-delete-never-used-period-field"]').should(
      "not.include.text",
      "The selected room auto delete never used period is invalid.",
    );
    cy.get('[data-test="room-file-terms-of-use-field"]').should(
      "not.include.text",
      "The selected room file terms of use is invalid.",
    );

    cy.get('[data-test="password-change-allowed-field"]').should(
      "not.include.text",
      "The user password change allowed field is required.",
    );

    cy.get('[data-test="statistics-servers-enabled-field"]').should(
      "not.include.text",
      "The recording server usage enabled field is required.",
    );
    cy.get('[data-test="statistics-servers-retention-period-field"]').should(
      "not.include.text",
      "The selected recording server usage retention period is invalid.",
    );
    cy.get('[data-test="statistics-meetings-enabled-field"]').should(
      "not.include.text",
      "The recording meeting usage enabled field is required.",
    );
    cy.get('[data-test="statistics-meetings-retention-period-field"]').should(
      "not.include.text",
      "The selected recording meeting usage retention period is invalid.",
    );
    cy.get('[data-test="attendance-retention-period-field"]').should(
      "not.include.text",
      "The selected recording attendance retention period is invalid.",
    );
    cy.get('[data-test="recording-retention-period-field"]').should(
      "not.include.text",
      "The selected recording recording retention period is invalid.",
    );

    cy.get('[data-test="bbb-logo-field"]')
      .should("not.include.text", "The bbb logo field is required.")
      .and("not.include.text", "The bbb logo file field is required.");
    cy.get('[data-test="bbb-logo-dark-field"]')
      .should("not.include.text", "The bbb logo field is required.")
      .and("not.include.text", "The bbb logo file field is required.");
    cy.get('[data-test="bbb-style-field"]').should(
      "not.include.text",
      "The bbb style field is required.",
    );
    cy.get('[data-test="default-presentation-field"]').should(
      "not.include.text",
      "The bbb default presentation field is required.",
    );

    // Check with 413 error (payload too large)
    cy.intercept("POST", "api/v1/settings", {
      statusCode: 413,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="settings-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check error message is shown
    cy.checkToastMessage("app.flash.too_large");

    // Check with 401 error
    cy.intercept("POST", "api/v1/settings", {
      statusCode: 401,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="settings-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/settings");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
