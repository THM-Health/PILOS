import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe.skip("General", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it("all locales get rendered", function () {
    cy.visit("/rooms");

    // Open menu to check if the correct locales are shown
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .within(() => {
        cy.get("li").should("have.length", 3);

        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch");

        cy.get('[data-test="navbar-locale-en"]')
          .should("exist")
          .should("have.text", "English");

        cy.get('[data-test="navbar-locale-fr"]')
          .should("exist")
          .should("have.text", "Français");
      });
  });

  it("hide locale menu if only one locale is available", function () {
    cy.intercept("GET", "/api/v1/locales", {
      statusCode: 200,
      body: ["en"],
    });
    cy.visit("/rooms");

    // Check locale select is not shown
    cy.get('[data-test="navbar-locale"]').should("not.exist");
  });

  it("changing selected locale", function () {
    // Intercept locale and de request
    const localeRequest = interceptIndefinitely(
      "POST",
      "/api/v1/locale",
      {
        statusCode: 200,
      },
      "localeRequest",
    );

    cy.intercept("GET", "/api/v1/locale/de", { fixture: "en.json" }).as(
      "deRequest",
    );

    cy.visit("/rooms");

    cy.wait("@roomRequest");

    cy.get('[data-test="overlay"]').should("not.exist");
    // Open menu and click on a different locale than the current one
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch")
          .click();
      });

    // Check loading
    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        localeRequest.sendResponse();
      });

    // Check that the correct requests are made
    cy.wait("@localeRequest");
    cy.wait("@deRequest");

    // Check that the menu is closed
    cy.get('[data-test="submenu"]').should("not.be.visible");
  });

  it("changing selected locale error", function () {
    // Shows a corresponding error message and does not change the language on 422 error
    cy.intercept("POST", "/api/v1/locale", {
      statusCode: 422,
      body: {
        message: "Test",
        errors: {
          locale: ["Test"],
        },
      },
    }).as("localeRequest");

    cy.intercept("GET", "/api/v1/locale/de", cy.spy().as("deRequestSpy"));

    cy.visit("/rooms");

    // Open menu and click on a different locale than the current one
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch")
          .click();
      });

    // Check that the locale request was made
    cy.wait("@localeRequest");
    // Check that the request for the new language was not send (language stays the same after error)
    cy.get("@deRequestSpy").should("not.be.called");

    // Check if error message is shown
    cy.checkToastMessage("Test");

    // Test other errors
    cy.intercept("POST", "/api/v1/locale", {
      statusCode: 500,
      body: {
        message: ["Test"],
      },
    }).as("localeRequest");

    cy.intercept("GET", "/api/v1/locale/de", cy.spy().as("deRequestSpy"));

    // Open menu and click on a different locale than the current one
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch")
          .click();
      });

    // Check that the locale request was made
    cy.wait("@localeRequest");
    // Check that the request for the new language was not send (language stays the same after error)
    cy.get("@deRequestSpy").should("not.be.called");

    // Check if error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":["Test"]}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
  });

  it("PrimeVue uses locale with exact match", function () {
    // Intercept locale change request
    cy.intercept("POST", "/api/v1/locale", {
      statusCode: 200,
    }).as("localeChange");

    // Intercept German locale request
    cy.intercept("GET", "api/v1/locale/de", { fixture: "en.json" }).as(
      "deLocale",
    );

    cy.visit("/rooms");
    cy.wait("@roomRequest");

    // Change to German locale
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch")
          .click();
      });

    cy.wait("@localeChange");
    cy.wait("@deLocale");

    // Check that PrimeVue pagination uses German locale
    // Check "Next Page" button aria-label
    cy.get('[data-test="paginator-next-button"]')
      .first()
      .should("have.attr", "aria-label", "Nächste Seite");

    // Check page number aria-label (should be "Seite 1")
    cy.get('[data-test="paginator-page"]')
      .first()
      .should("have.attr", "aria-label", "Seite 1");
  });

  it("PrimeVue uses parent locale for invalid language-region codes (de-XX -> de)", function () {
    // Test loading an (imaginary) region-specific locale that is supported by the backend but not by PrimeLocale (de-XX)

    // Add de-XX to enabled locales in config
    cy.fixture("config.json").then((config) => {
      config.data.general.enabled_locales = {
        en: "English",
        "de-xx": "Deutsch",
      };

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Intercept locale change request
    cy.intercept("POST", "/api/v1/locale", {
      statusCode: 200,
    }).as("localeChange");

    // Intercept invalid regional German locale request
    cy.intercept("GET", "api/v1/locale/de-xx", { fixture: "en.json" }).as(
      "de-xxLocale",
    );

    cy.visit("/rooms");
    cy.wait("@roomRequest");

    // Change to invalid regional German locale
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="navbar-locale-de-xx"]')
          .should("exist")
          .should("have.text", "Deutsch")
          .click();
      });

    cy.wait("@localeChange");
    cy.wait("@de-xxLocale");

    // Verify that PrimeVue uses German locale as fallback for the unsupported regional German locale (de-XX)
    cy.get('[data-test="paginator-next-button"]')
      .first()
      .should("have.attr", "aria-label", "Nächste Seite");

    cy.get('[data-test="paginator-page"]')
      .first()
      .should("have.attr", "aria-label", "Seite 1");
  });

  it("PrimeVue uses local fallback (en) for unsupported PrimeLocale locales", function () {
    // Add xx to enabled locales in config
    cy.fixture("config.json").then((config) => {
      config.data.general.enabled_locales = {
        en: "English",
        xx: "Invalid locale",
      };

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Intercept locale change request
    cy.intercept("POST", "/api/v1/locale", {
      statusCode: 200,
    }).as("localeChange");

    // Intercept Invalid locale request
    cy.intercept("GET", "api/v1/locale/xx", { fixture: "en.json" }).as(
      "xxLocale",
    );

    cy.visit("/rooms");
    cy.wait("@roomRequest");

    // Change to Invalid locale
    cy.get('[data-test="navbar-locale"]').click();
    cy.get('[data-test="submenu"]')
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="navbar-locale-xx"]')
          .should("exist")
          .should("have.text", "Invalid locale")
          .click();
      });

    cy.wait("@localeChange");
    cy.wait("@xxLocale");

    // Check that PrimeVue pagination uses English locale as fallback
    // Check "Next Page" button aria-label - should be in English
    cy.get('[data-test="paginator-next-button"]')
      .last()
      .should("have.attr", "aria-label", "Next Page");

    // Check page number aria-label (should be "Page 1")
    cy.get('[data-test="paginator-page"]')
      .last()
      .should("have.attr", "aria-label", "Page 1");
  });

  it("disabled welcome page redirect unauthenticated users to login", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("config.json").then((config) => {
      config.data.general.no_welcome_page = true;
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Visit the root page
    cy.visit("/");

    // Should be redirected to rooms overview, but since the user is not authenticated, should be redirected to login page
    cy.url().should("contain", "/login?redirect=/rooms");

    cy.get('[data-test="login-tab-button-local"]').should("be.visible");
  });

  it("disabled welcome page redirect authenticated users to rooms overview", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.no_welcome_page = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Visit the root page
    cy.visit("/");

    // Should be redirected to rooms overview
    cy.url().should("contain", "/rooms");
  });

  it("welcome page shown", function () {
    // Visit the root page
    cy.visit("/");

    // Check if the welcome page is shown
    cy.get("h1").should("be.visible").and("contain", "home.title");
  });

  it("check help button if help url specified", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.help_url = `${Cypress.expose("redirectBaseUrl")}/help?foo=a&bar=b`;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });
    cy.visit("/");

    cy.get('[data-test="navbar-help"]')
      .should("be.visible")
      .should(
        "have.attr",
        "href",
        `${Cypress.expose("redirectBaseUrl")}/help?foo=a&bar=b`,
      )
      .and("have.attr", "target", "_blank")
      .invoke("removeAttr", "target");

    cy.get('[data-test="navbar-help"]').click();

    // Check that redirect worked
    cy.url().should(
      "eq",
      `${Cypress.expose("redirectBaseUrl")}/help?foo=a&bar=b`,
    );
  });

  it("check help button hidden if help url not specified", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.help_url = "";

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });
    cy.visit("/");

    cy.get('[data-test="navbar-help"]').should("not.exist");
  });

  it("change to dark mode", function () {
    cy.visit("/");

    // Check if light mode is enabled by default
    cy.get("html").should("not.have.class", "dark");
    cy.get('[data-test="navbar-dark-mode"]')
      .find("svg")
      .should("have.attr", "data-test", "navbar-dark-mode-disabled-icon");

    // Change to dark mode
    cy.get('[data-test="navbar-dark-mode"]').click();

    // Check if dark mode is enabled
    cy.get("html").should("have.class", "dark");
    cy.get('[data-test="navbar-dark-mode"]')
      .find("svg")
      .should("have.attr", "data-test", "navbar-dark-mode-enabled-icon");

    // Change to light mode
    cy.get('[data-test="navbar-dark-mode"]').click();

    // Check if light mode is enabled
    cy.get("html").should("not.have.class", "dark");
    cy.get('[data-test="navbar-dark-mode"]')
      .find("svg")
      .should("have.attr", "data-test", "navbar-dark-mode-disabled-icon");
  });

  it("change to light mode", function () {
    cy.visit("/", {
      onBeforeLoad() {
        Cypress.expose("darkMode", true);
      },
    });

    // Check if dark mode is enabled by default
    cy.get("html").should("have.class", "dark");
    cy.get('[data-test="navbar-dark-mode"]')
      .find("svg")
      .should("have.attr", "data-test", "navbar-dark-mode-enabled-icon");

    // Change to light mode
    cy.get('[data-test="navbar-dark-mode"]').click();

    // Check if light mode is enabled
    cy.get("html").should("not.have.class", "dark");
    cy.get('[data-test="navbar-dark-mode"]')
      .find("svg")
      .should("have.attr", "data-test", "navbar-dark-mode-disabled-icon");

    // Change to dark mode
    cy.get('[data-test="navbar-dark-mode"]').click();

    // Check if dark mode is enabled
    cy.get("html").should("have.class", "dark");
    cy.get('[data-test="navbar-dark-mode"]')
      .find("svg")
      .should("have.attr", "data-test", "navbar-dark-mode-enabled-icon");
  });
});
