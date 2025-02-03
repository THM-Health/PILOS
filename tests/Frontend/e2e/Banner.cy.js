describe("Banner", function () {
  beforeEach(function () {
    cy.init();
  });

  it("check banner shown when enabled", function () {
    cy.fixture("config.json").then((config) => {
      config.data.banner.enabled = true;
      config.data.banner.title = "Banner title";
      config.data.banner.icon = "fa-solid fa-door-open";
      config.data.banner.message = "Banner text message";
      config.data.banner.link = "https://example.org/?foo=a&bar=b";
      config.data.banner.link_text = "Example link";
      config.data.banner.link_style = "link";
      config.data.banner.link_target = "blank";
      config.data.banner.color = "#FFFFFF";
      config.data.banner.background = "#000000";
      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");

    cy.wait("@configRequest");

    // Check that banner is shown correctly
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("include", "background-color: rgb(0, 0, 0);");
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
        .and("have.attr", "href", "https://example.org/?foo=a&bar=b")
        .and("have.attr", "target", "_blank")
        .and("have.text", "Example link");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "link")
        .and("have.class", "p-0 underline")
        .and("have.attr", "style")
        .and("include", "color: rgb(255, 255, 255)");
    });

    // Reload with different banner settings
    cy.fixture("config.json").then((config) => {
      config.data.banner.enabled = true;
      config.data.banner.title = "New banner title";
      config.data.banner.message = "Banner message";
      config.data.banner.color = "#000000";
      config.data.banner.background = "#ef4444";
      cy.intercept("GET", "/api/v1/config", config).as("configRequest");

      cy.reload();

      cy.wait("@configRequest");

      // Check that banner is shown correctly
      cy.get('[data-test="app-banner"]')
        .should("have.attr", "style")
        .and("include", "color: rgb(0, 0, 0);")
        .and("include", "background-color: rgb(239, 68, 68);");
      cy.get('[data-test="app-banner"]').within(() => {
        cy.get('[data-test="banner-title"]')
          .should("be.visible")
          .and("include.text", "New banner title");
        cy.get('[data-test="banner-icon"]').should("not.exist");
        cy.get('[data-test="banner-message"]')
          .should("be.visible")
          .and("have.text", "Banner message");
        cy.get('[data-test="banner-link-button"]').should("not.exist");
      });
    });
  });

  it("check banner link works correctly", function () {
    cy.fixture("config.json").then((config) => {
      config.data.banner.enabled = true;
      config.data.banner.title = "Banner title";
      config.data.banner.link = Cypress.config("baseUrl") + "/rooms";
      config.data.banner.link_text = "Room link";
      config.data.banner.link_style = "danger";
      config.data.banner.link_target = "self";
      config.data.banner.color = "#FFFFFF";
      config.data.banner.background = "#000000";
      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");

    cy.interceptRoomIndexRequests();

    // Check that banner is shown correctly
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("include", "background-color: rgb(0, 0, 0);");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]').should("not.exist");
      cy.get('[data-test="banner-message"]')
        .should("not.be.visible")
        .and("have.text", "");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", Cypress.config("baseUrl") + "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Room link");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "danger")
        .and("not.have.class", "p-0 underline");

      cy.get('[data-test="banner-link-button"]').click();
    });

    // Check that redirect worked
    cy.url().should("contain", "/rooms");

    // Check that banner is still shown
    cy.get('[data-test="app-banner"]')
      .should("have.attr", "style")
      .and("include", "color: rgb(255, 255, 255);")
      .and("include", "background-color: rgb(0, 0, 0);");
    cy.get('[data-test="app-banner"]').within(() => {
      cy.get('[data-test="banner-title"]')
        .should("be.visible")
        .and("include.text", "Banner title");
      cy.get('[data-test="banner-icon"]').should("not.exist");
      cy.get('[data-test="banner-message"]')
        .should("not.be.visible")
        .and("have.text", "");
      cy.get('[data-test="banner-link-button"]')
        .should("be.visible")
        .and("have.attr", "href", Cypress.config("baseUrl") + "/rooms")
        .and("have.attr", "target", "_self")
        .and("have.text", "Room link");
      cy.get('[data-test="banner-link-button"]')
        .find("button")
        .should("have.attr", "data-p-severity", "danger")
        .and("not.have.class", "p-0 underline");
    });
  });

  it("check banner hidden if disabled", function () {
    cy.fixture("config.json").then((config) => {
      config.data.banner.enabled = false;
      config.data.banner.title = "Banner title";
      config.data.banner.icon = "fa-solid fa-door-open";
      config.data.banner.message = "Banner text message";
      config.data.banner.link = Cypress.config("baseUrl") + "/rooms";
      config.data.banner.link_text = "Rooms";
      config.data.banner.link_style = "link";
      config.data.banner.link_target = "blank";
      config.data.banner.color = "#FFFFFF";
      config.data.banner.background = "#000000";
      cy.intercept("GET", "/api/v1/config", config).as("configRequest");
    });

    cy.visit("/");

    cy.wait("@configRequest");

    // Check that banner is shown correctly
    cy.get('[data-test="app-banner"]').should("not.exist");
  });
});
