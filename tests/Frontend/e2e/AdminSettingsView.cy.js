describe("Admin settings with edit permission", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminSettingsRequest();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "settings.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("check application settings with only view permission", function () {
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
          .and("be.disabled");
      });

    cy.get('[ data-test="help-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.help_url.title")
      .and("include.text", "admin.settings.help_url.description")
      .within(() => {
        cy.get("#help-url").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="legal-notice-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.legal_notice_url.title")
      .and("include.text", "admin.settings.legal_notice_url.description")
      .within(() => {
        cy.get("#legal-notice-url").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="privacy-policy-url-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.privacy_policy_url.title")
      .and("include.text", "admin.settings.privacy_policy_url.description")
      .within(() => {
        cy.get("#privacy-policy-url")
          .should("have.value", "")
          .and("be.disabled");
      });

    cy.get('[data-test="pagination-page-size-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.pagination_page_size.title")
      .and("include.text", "admin.settings.pagination_page_size.description")
      .within(() => {
        cy.get("#pagination-page-size")
          .should("have.value", "5")
          .and("be.disabled");
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
              .and("be.disabled");
          });
        cy.get('[data-test="toast-lifetime-custom-input"]').should("not.exist");

        cy.get('[data-test="toast-lifetime-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.settings.toast_lifetime.custom")
          .within(() => {
            cy.get("#toast-lifetime-mode-custom")
              .should("not.be.checked")
              .and("be.disabled");
          });
      });

    cy.get('[data-test="default-timezone-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.default_timezone")
      .within(() => {
        cy.get('[data-test="timezone-dropdown"]')
          .should("have.text", "UTC")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="no-welcome-page-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.no_welcome_page")
      .within(() => {
        cy.get("#no-welcome-page").should("be.checked").and("be.disabled");
      });

    // Reload with different settings
    cy.fixture("settings.json").then((settings) => {
      settings.data.general_toast_lifetime = 10;

      cy.intercept("GET", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("settingsRequest");
    });

    cy.reload();

    cy.wait("@settingsRequest");

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
              .should("not.be.checked")
              .and("be.disabled");
          });
        cy.get('[data-test="toast-lifetime-custom-input"]')
          .should("be.visible")
          .and("have.value", "10")
          .and("be.disabled");

        cy.get('[data-test="toast-lifetime-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.settings.toast_lifetime.custom")
          .within(() => {
            cy.get("#toast-lifetime-mode-custom")
              .should("be.checked")
              .and("be.disabled");
          });
      });
  });

  it("check theme settings with only view permission", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.theme.title");

    cy.get('[data-test="favicon-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.favicon.title")
      .within(() => {
        cy.checkSettingsImageSelectorOnlyView("/images/favicon.ico");
      });

    cy.get('[data-test="favicon-dark-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.favicon_dark.title")
      .within(() => {
        cy.checkSettingsImageSelectorOnlyView("/images/favicon-dark.ico");
      });

    cy.get('[data-test="logo-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo.title")
      .within(() => {
        cy.checkSettingsImageSelectorOnlyView("/images/logo.svg");
      });

    cy.get('[data-test="logo-dark-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo_dark.title")
      .within(() => {
        cy.checkSettingsImageSelectorOnlyView("/images/logo-dark.svg");
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
              "have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and(i === 4 ? "have.class" : "not.have.class", "selected");
        }

        cy.get("#theme-primary-color")
          .should("have.value", "#22c55e")
          .and("be.disabled");
      });

    cy.get('[data-test="theme-rounded-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.theme.rounded")
      .within(() => {
        cy.get("#theme-rounded").should("be.checked").and("be.disabled");
      });
  });

  it("check banner settings with only view permission", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.banner.title");

    cy.get('[data-test="banner-enabled-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.enabled")
      .and("include.text", "app.enable")
      .within(() => {
        cy.get("#banner-enabled").should("not.be.checked").and("be.disabled");
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
        cy.get("#banner-title").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="banner-icon-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.icon")
      .and("include.text", "admin.settings.banner.icon_description")
      .within(() => {
        cy.get("#banner-icon").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="banner-message-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.message")
      .within(() => {
        cy.get("#banner-message").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="banner-link-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link")
      .within(() => {
        cy.get("#banner-link").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="banner-link-text-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_text")
      .within(() => {
        cy.get("#banner-link-text").should("have.value", "").and("be.disabled");
      });

    cy.get('[data-test="banner-link-style-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_style")
      .within(() => {
        cy.get('[data-test="banner-link-style-dropdown"]')
          .should("have.text", "app.button_styles.primary")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="banner-link-target-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_target")
      .within(() => {
        cy.get('[data-test="banner-link-target-dropdown"]')
          .should("have.text", "app.link_targets.blank")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
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
              "have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and("not.have.class", "selected");
        }

        cy.get("#banner-color").should("have.value", "").and("be.disabled");
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
              "have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .and("not.have.class", "selected");
        }

        cy.get("#banner-background")
          .should("have.value", "")
          .and("be.disabled");
      });

    // Reload with different settings
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

      cy.intercept("GET", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("settingsRequest");
    });

    cy.reload();

    cy.wait("@settingsRequest");

    cy.get("#banner-enabled").should("be.checked").and("be.disabled");

    cy.get('[data-test="banner-preview-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.preview")
      .within(() => {
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
      });

    cy.get("#banner-title")
      .should("have.value", "Banner title")
      .and("be.disabled");
    cy.get("#banner-icon")
      .should("have.value", "fa-solid fa-door-open")
      .and("be.disabled");
    cy.get("#banner-message")
      .should("have.value", "Banner text message")
      .and("be.disabled");
    cy.get("#banner-link").should("have.value", "/rooms").and("be.disabled");
    cy.get("#banner-link-text")
      .should("have.value", "Rooms")
      .and("be.disabled");
    cy.get('[data-test="banner-link-style-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_style")
      .within(() => {
        cy.get('[data-test="banner-link-style-dropdown"]')
          .should("have.text", "app.button_styles.link")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="banner-link-target-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.banner.link_target")
      .within(() => {
        cy.get('[data-test="banner-link-target-dropdown"]')
          .should("have.text", "app.link_targets.self")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
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
              "have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .should(i === 0 ? "have.class" : "not.have.class", "selected");
        }

        cy.get("#banner-color")
          .should("have.value", "#FFFFFF")
          .and("be.disabled");
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
              "have.class",
              "pointer-events-none cursor-not-allowed opacity-80",
            )
            .should(i === 7 ? "have.class" : "not.have.class", "selected");
        }

        cy.get("#banner-background")
          .should("have.value", "#ef4444")
          .and("be.disabled");
      });
  });

  it("check room settings with only view permission", function () {
    cy.fixture("settings.json").then((settings) => {
      settings.data.room_auto_delete_inactive_period = 30;
      settings.data.room_auto_delete_never_used_period = 730;

      cy.intercept("GET", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("settingsRequest");
    });

    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

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
              .and("be.disabled");
          });

        cy.get("#room-limit-custom").should("not.exist");

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#room-limit-mode-custom")
              .should("not.be.checked")
              .and("be.disabled");
          });
      });

    cy.get('[data-test="room-token-expiration-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.room_token_expiration.title")
      .and("include.text", "admin.settings.room_token_expiration.description")
      .within(() => {
        cy.get('[data-test="room-token-expiration-dropdown"]')
          .should("have.text", "app.unlimited")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

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
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

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
          .should("have.text", "admin.settings.one_month")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

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
          .should("have.text", "admin.settings.two_years")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="room-file-terms-of-use-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.room_file_terms_of_use.title")
      .and("include.text", "admin.settings.room_file_terms_of_use.description")
      .within(() => {
        cy.get("#room-file-terms-of-use")
          .should("be.visible")
          .and("have.value", "Room file terms of use")
          .and("be.disabled");
      });

    // Reload with different settings
    cy.fixture("settings.json").then((settings) => {
      settings.data.room_limit = 10;
      settings.data.room_auto_delete_inactive_period = 30;
      settings.data.room_auto_delete_never_used_period = 730;

      cy.intercept("GET", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("settingsRequest");
    });

    cy.reload();

    cy.wait("@settingsRequest");

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
              .should("not.be.checked")
              .and("be.disabled");
          });

        cy.get("#room-limit-custom")
          .should("be.visible")
          .and("have.value", "10")
          .and("be.disabled");

        cy.get('[data-test="room-limit-mode-custom-field"]')
          .should("be.visible")
          .should("include.text", "admin.roles.room_limit.custom")
          .within(() => {
            cy.get("#room-limit-mode-custom")
              .should("be.checked")
              .and("be.disabled");
          });
      });
  });

  it("check user settings with only view permission", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.get('[data-test="password-change-allowed-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.password_change_allowed")
      .within(() => {
        cy.get("#password-change-allowed")
          .should("be.checked")
          .and("be.disabled");
      });
  });

  it("check recording and statistics settings with only view permission", function () {
    cy.fixture("settings.json").then((settings) => {
      settings.data.recording_server_usage_retention_period = 90;
      settings.data.recording_meeting_usage_retention_period = 180;
      settings.data.recording_attendance_retention_period = 365;
      settings.data.recording_recording_retention_period = 7;

      cy.intercept("GET", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("settingsRequest");
    });

    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.contains("admin.settings.recording_and_statistics_title");

    cy.get('[data-test="statistics-servers-enabled-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.statistics.servers.enabled_title")
      .and("include.text", "app.enable")
      .within(() => {
        cy.get("#statistics-servers-enabled")
          .should("be.checked")
          .and("be.disabled");
      });

    cy.get('[data-test="statistics-servers-retention-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.statistics.servers.retention_period_title",
      )
      .within(() => {
        cy.get('[data-test="statistics-servers-retention-period-dropdown"]')
          .should("have.text", "admin.settings.three_month")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get("[data-test=statistics-meetings-enabled-field]")
      .should("be.visible")
      .and("include.text", "admin.settings.statistics.meetings.enabled_title")
      .within(() => {
        cy.get("#statistics-meetings-enabled")
          .should("be.checked")
          .and("be.disabled");
      });

    cy.get('[data-test="statistics-meetings-retention-period-field"]')
      .should("be.visible")
      .and(
        "include.text",
        "admin.settings.statistics.meetings.retention_period_title",
      )
      .within(() => {
        cy.get('[data-test="statistics-meetings-retention-period-dropdown"]')
          .should("have.text", "admin.settings.six_month")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="attendance-retention-period-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.attendance.retention_period_title")
      .within(() => {
        cy.get('[data-test="attendance-retention-period-dropdown"]')
          .should("have.text", "admin.settings.one_year")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });

    cy.get('[data-test="recording-retention-period-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.recording.retention_period_title")
      .within(() => {
        cy.get('[data-test="recording-retention-period-dropdown"]')
          .should("have.text", "admin.settings.one_week")
          .within(() => {
            cy.get(".p-select-label").should(
              "have.attr",
              "aria-disabled",
              "true",
            );
          });
      });
  });

  it("check bbb settings with only view permission", function () {
    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    cy.get('[data-test="bbb-logo-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo.title")
      .within(() => {
        cy.checkSettingsImageSelectorOnlyView("/images/logo.svg");
      });

    cy.get('[data-test="bbb-style-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.bbb.style.title")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView("");
      });

    cy.get('[data-test="default-presentation-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.default_presentation")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView("");
      });

    // Reload with different settings
    cy.fixture("settings.json").then((settings) => {
      settings.data.bbb_logo = null;
      settings.data.bbb_style = "/files/bbb_style.css";
      settings.data.bbb_default_presentation = "/files/testFile.txt";

      cy.intercept("GET", "api/v1/settings", {
        statusCode: 200,
        body: settings,
      }).as("settingsRequest");
    });

    cy.reload();

    cy.wait("@settingsRequest");

    cy.get('[data-test="bbb-logo-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.logo.title")
      .within(() => {
        cy.checkSettingsImageSelectorOnlyView("");
      });

    cy.get('[data-test="bbb-style-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.bbb.style.title")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView("/files/bbb_style.css");
      });

    cy.get('[data-test="default-presentation-field"]')
      .should("be.visible")
      .and("include.text", "admin.settings.default_presentation")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView("/files/testFile.txt");
      });
  });
});
