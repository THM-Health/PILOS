describe("Footer", function () {
  beforeEach(function () {
    cy.init();
  });

  it("check footer shown correctly with 2 links, version and no whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "https://example.org/legal";
      config.data.general.privacy_policy_url = "https://example.org/privacy";
      config.data.general.version = "1.0.0";
      config.data.general.whitelabel = false;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");

    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.legal_notice")
          .and("have.attr", "href", "https://example.org/legal");

        cy.get('[data-test="privacy-policy-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.privacy_policy")
          .and("have.attr", "href", "https://example.org/privacy");

        cy.get('[data-test="github-button"]')
          .should("be.visible")
          .and("have.text", "PILOS")
          .and("have.attr", "href", "https://github.com/THM-Health/PILOS");
        cy.get('[data-test="version"]')
          .should("be.visible")
          .and("have.text", "app.version 1.0.0");
      });
  });

  it("check footer shown correctly with only legal notice link, no version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "https://example.org/legal";
      config.data.general.privacy_policy_url = "";
      config.data.general.version = null;
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");

    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.legal_notice")
          .and("have.attr", "href", "https://example.org/legal");

        cy.get('[data-test="privacy-policy-button"]').should("not.exist");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]').should("not.exist");
      });
  });

  it("check footer shown correctly with only privacy policy link, no version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "";
      config.data.general.privacy_policy_url = "https://example.org/privacy";
      config.data.general.version = null;
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]').should("not.exist");

        cy.get('[data-test="privacy-policy-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.privacy_policy")
          .and("have.attr", "href", "https://example.org/privacy");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]').should("not.exist");
      });
  });

  it("check footer shown correctly with no links, no version and no whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "";
      config.data.general.privacy_policy_url = "";
      config.data.general.version = null;
      config.data.general.whitelabel = false;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]').should("not.exist");

        cy.get('[data-test="privacy-policy-button"]').should("not.exist");

        cy.get('[data-test="github-button"]')
          .should("be.visible")
          .and("have.text", "PILOS")
          .and("have.attr", "href", "https://github.com/THM-Health/PILOS");
        cy.get('[data-test="version"]').should("not.exist");
      });
  });

  it("check footer shown correctly with no links, version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "";
      config.data.general.privacy_policy_url = "";
      config.data.general.version = "1.0.0";
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]').should("not.exist");

        cy.get('[data-test="privacy-policy-button"]').should("not.exist");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]')
          .should("be.visible")
          .and("have.text", "app.version 1.0.0");
      });
  });

  it("check footer shown correctly with 2 links, version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "https://example.org/legal";
      config.data.general.privacy_policy_url = "https://example.org/privacy";
      config.data.general.version = "1.0.0";
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.legal_notice")
          .and("have.attr", "href", "https://example.org/legal");

        cy.get('[data-test="privacy-policy-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.privacy_policy")
          .and("have.attr", "href", "https://example.org/privacy");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]')
          .should("be.visible")
          .and("have.text", "app.version 1.0.0");
      });
  });

  it("check footer shown correctly with 2 links, no version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "https://example.org/legal";
      config.data.general.privacy_policy_url = "https://example.org/privacy";
      config.data.general.version = "";
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.legal_notice")
          .and("have.attr", "href", "https://example.org/legal");

        cy.get('[data-test="privacy-policy-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.privacy_policy")
          .and("have.attr", "href", "https://example.org/privacy");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]').should("not.exist");
      });
  });

  it("check footer hidden with no links, no version and whitelabel", function () {
    // Reload without footer
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "";
      config.data.general.privacy_policy_url = "";
      config.data.general.version = "";
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    cy.get('[data-test="app-footer"]').should("not.exist");
  });

  it("check footer shown correctly with only legal notice link, version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "https://example.org/legal";
      config.data.general.privacy_policy_url = "";
      config.data.general.version = "1.2.0";
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");

    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.legal_notice")
          .and("have.attr", "href", "https://example.org/legal");

        cy.get('[data-test="privacy-policy-button"]').should("not.exist");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]')
          .should("be.visible")
          .and("have.text", "app.version 1.2.0");
      });
  });

  it("check footer shown correctly with only privacy policy link, version and whitelabel", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "";
      config.data.general.privacy_policy_url = "https://example.org/privacy";
      config.data.general.version = "2.1.0";
      config.data.general.whitelabel = true;

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    // Check that footer is shown correctly
    cy.get('[data-test="app-footer"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="legal-notice-button"]').should("not.exist");

        cy.get('[data-test="privacy-policy-button"]')
          .should("be.visible")
          .and("have.text", "app.footer.privacy_policy")
          .and("have.attr", "href", "https://example.org/privacy");

        cy.get('[data-test="github-button"]').should("not.exist");
        cy.get('[data-test="version"]')
          .should("be.visible")
          .and("have.text", "app.version 2.1.0");
      });
  });

  it("open legal notice link", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.legal_notice_url = "https://example.org/?foo=a&bar=b";

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    cy.get('[data-test="legal-notice-button"]').click();

    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("open privacy policy link", function () {
    cy.fixture("config.json").then((config) => {
      config.data.general.privacy_policy_url =
        "https://example.org/?foo=a&bar=b";

      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");
    cy.wait("@configRequest");

    cy.get('[data-test="privacy-policy-button"]').click();

    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });
});
