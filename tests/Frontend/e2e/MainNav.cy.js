describe("Main navigation", function () {
  beforeEach(function () {
    cy.init();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("shows no main menu entries for unauthenticated users", function () {
    cy.intercept("GET", "api/v1/currentUser", {});

    cy.visit("/");

    cy.get('[data-test="navbar-rooms"]').should("not.exist");
    cy.get('[data-test="navbar-meetings"]').should("not.exist");
    cy.get('[data-test="navbar-admin"]').should("not.exist");
    cy.get('[data-test="navbar-monitor"]').should("not.exist");
  });

  it("shows only rooms entry without permissions", function () {
    cy.visit("/");

    cy.get('[data-test="navbar-rooms"]')
      .should("exist")
      .and("have.attr", "href", "/rooms");
    cy.get('[data-test="navbar-meetings"]').should("not.exist");
    cy.get('[data-test="navbar-admin"]').should("not.exist");
    cy.get('[data-test="navbar-monitor"]').should("not.exist");
  });

  it("shows meetings entry with meetings.viewAny permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["meetings.viewAny"];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/");

    cy.get('[data-test="navbar-rooms"]')
      .should("exist")
      .and("have.attr", "href", "/rooms");
    cy.get('[data-test="navbar-meetings"]')
      .should("exist")
      .and("have.attr", "href", "/meetings");
    cy.get('[data-test="navbar-admin"]').should("not.exist");
    cy.get('[data-test="navbar-monitor"]').should("not.exist");
  });

  it("shows admin entry with admin.view permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/");

    cy.get('[data-test="navbar-rooms"]')
      .should("exist")
      .and("have.attr", "href", "/rooms");
    cy.get('[data-test="navbar-meetings"]').should("not.exist");
    cy.get('[data-test="navbar-admin"]')
      .should("exist")
      .and("have.attr", "href", "/admin");
    cy.get('[data-test="navbar-monitor"]').should("not.exist");
  });

  it("shows monitor menu with system.monitor permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["system.monitor"];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/");

    cy.get('[data-test="navbar-rooms"]')
      .should("exist")
      .and("have.attr", "href", "/rooms");
    cy.get('[data-test="navbar-meetings"]').should("not.exist");
    cy.get('[data-test="navbar-admin"]').should("not.exist");
    cy.get('[data-test="navbar-monitor"]').should("exist");
  });

  describe("monitor submenu", function () {
    beforeEach(function () {
      cy.fixture("currentUser.json").then((currentUser) => {
        currentUser.data.permissions = ["system.monitor"];

        cy.intercept("GET", "api/v1/currentUser", {
          statusCode: 200,
          body: currentUser,
        });
      });
    });

    it("shows horizon entry", function () {
      cy.fixture("config.json").then((config) => {
        config.data.monitor = {
          horizon: true,
          pulse: false,
          telescope: false,
        };

        cy.intercept("GET", "/api/v1/config", config);
      });

      cy.visit("/");

      cy.get("#mainmenu").within(() => {
        cy.get('[data-test="navbar-monitor"]').click();

        cy.get('[data-test="submenu"]')
          .should("be.visible")
          .within(() => {
            cy.get('[data-test="navbar-monitor-horizon"]')
              .should("exist")
              .and("have.attr", "href", "/horizon")
              .and("have.attr", "target", "_blank");
          });
      });
    });

    it("shows pulse entry when monitor.pulse is true", function () {
      cy.fixture("config.json").then((config) => {
        config.data.monitor = {
          horizon: true,
          pulse: true,
          telescope: false,
        };

        cy.intercept("GET", "/api/v1/config", config);
      });

      cy.visit("/");

      cy.get("#mainmenu").within(() => {
        cy.get('[data-test="navbar-monitor"]').click();

        cy.get('[data-test="submenu"]')
          .should("be.visible")
          .within(() => {
            cy.get('[data-test="navbar-monitor-pulse"]')
              .should("exist")
              .and("have.attr", "href", "/pulse")
              .and("have.attr", "target", "_blank");
          });
      });
    });

    it("hides pulse entry when monitor.pulse is false", function () {
      cy.fixture("config.json").then((config) => {
        config.data.monitor = {
          horizon: true,
          pulse: false,
          telescope: true,
        };

        cy.intercept("GET", "/api/v1/config", config);
      });

      cy.visit("/");

      cy.get("#mainmenu").within(() => {
        cy.get('[data-test="navbar-monitor"]').click();

        cy.get('[data-test="submenu"]')
          .should("be.visible")
          .within(() => {
            cy.get('[data-test="navbar-monitor-pulse"]').should("not.exist");
          });
      });
    });

    it("shows telescope entry when monitor.telescope is true", function () {
      cy.fixture("config.json").then((config) => {
        config.data.monitor = {
          horizon: true,
          pulse: false,
          telescope: true,
        };

        cy.intercept("GET", "/api/v1/config", config);
      });

      cy.visit("/");

      cy.get("#mainmenu").within(() => {
        cy.get('[data-test="navbar-monitor"]').click();

        cy.get('[data-test="submenu"]')
          .should("be.visible")
          .within(() => {
            cy.get('[data-test="navbar-monitor-telescope"]')
              .should("exist")
              .and("have.attr", "href", "/telescope")
              .and("have.attr", "target", "_blank");
          });
      });
    });

    it("hides telescope entry when monitor.telescope is false", function () {
      cy.fixture("config.json").then((config) => {
        config.data.monitor = {
          horizon: true,
          pulse: true,
          telescope: false,
        };

        cy.intercept("GET", "/api/v1/config", config);
      });

      cy.visit("/");

      cy.get("#mainmenu").within(() => {
        cy.get('[data-test="navbar-monitor"]').click();

        cy.get('[data-test="submenu"]')
          .should("be.visible")
          .within(() => {
            cy.get('[data-test="navbar-monitor-telescope"]').should(
              "not.exist",
            );
          });
      });
    });
  });
});
