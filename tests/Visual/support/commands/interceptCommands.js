/**
 * Intercept requests that are needed when visiting pages that require a logged in user
 * @memberof cy
 * @method init
 * @returns void
 */
Cypress.Commands.add("init", () => {
  cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });
  cy.intercept("GET", "api/v1/locale/en", {
    data: {},
    meta: {
      dateTimeFormat: {
        dateShort: {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        },
        dateLong: {
          year: "numeric",
          month: "short",
          day: "2-digit",
        },
        time: {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
        datetimeShort: {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
        datetimeLong: {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
      },
    },
  });

  cy.fixture("config.json").then((config) => {
    config.data.general.base_url = Cypress.config("baseUrl");

    cy.intercept("GET", "api/v1/config", {
      statusCode: 200,
      body: config,
    });
  });
});
