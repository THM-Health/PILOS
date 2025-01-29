import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin settings general", function () {
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

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/settings");
  });

  it("visit with user without permission to view settings", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/settings");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/room_types/3/edit");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check loading only view", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view", "settings.viewAny"];

      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    const settingsRequest = interceptIndefinitely(
      "GET",
      "api/v1/settings",
      {
        fixture: "settings.json",
      },
      "settingsRequest",
    );

    cy.visit("/admin/settings");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="overlay"]').should("be.visible");

    cy.get('[data-test="settings-save-button"]')
      .should("not.exist")
      .then(() => {
        settingsRequest.sendResponse();
      });

    // Check if settings are shown
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.settings");
  });

  it("check loading with edit permission", function () {
    const settingsRequest = interceptIndefinitely(
      "GET",
      "api/v1/settings",
      {
        fixture: "settings.json",
      },
      "settingsRequest",
    );

    cy.visit("/admin/settings");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="overlay"]').should("be.visible");

    cy.get('[data-test="settings-save-button"]')
      .should("be.disabled")
      .and("include.text", "app.save")
      .then(() => {
        settingsRequest.sendResponse();
      });

    // Check if settings are shown
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.settings");
  });

  it("load settings errors", function () {
    // Check with 500 error
    cy.intercept("GET", "api/v1/settings", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    });

    cy.visit("/admin/settings");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that overlay and reload button are shown and reload without error
    cy.intercept("GET", "api/v1/settings", {
      fixture: "settings.json",
    });
    cy.get('[data-test="overlay"]').should("be.visible");
    cy.get('[data-test="loading-retry-button"]')
      .should("have.text", "app.reload")
      .click();

    // Check that overlay and reload button are hidden
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check with 401 error
    cy.intercept("GET", "api/v1/settings", {
      statusCode: 401,
    });

    cy.reload();

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/settings");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load timezones error", function () {
    const timezonesRequest = interceptIndefinitely(
      "GET",
      "api/v1/getTimezones",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "timezonesRequest",
    );

    cy.visit("/admin/settings");

    cy.wait("@settingsRequest");

    // Check loading
    cy.get("[data-test=settings-save-button]").should("be.disabled");

    cy.get('[data-test="timezone-dropdown"]')
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true")
      .then(() => {
        timezonesRequest.sendResponse();
      });

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "admin.settings.default_timezone")
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true");

    // Reload timezones without error
    cy.intercept("GET", "api/v1/getTimezones", {
      fixture: "timezones.json",
    }).as("timezonesRequest");

    cy.get('[data-test="timezone-reload-button"]').click();

    cy.wait("@timezonesRequest");

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .find(".p-select-label")
      .should("not.have.attr", "aria-disabled", "true");

    cy.get('[data-test="timezone-dropdown"]').click();

    cy.get('[data-test="timezone-dropdown-option"]').should("have.length", 4);
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

    // Check with 401 error
    cy.intercept("GET", "api/v1/getTimezones", {
      statusCode: 401,
    }).as("timezonesRequest");

    cy.reload();

    cy.wait("@settingsRequest");

    cy.wait("@timezonesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/settings");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
