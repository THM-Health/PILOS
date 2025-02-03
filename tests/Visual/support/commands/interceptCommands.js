/**
 * Intercept requests that are needed when visiting pages that require a logged in user
 * @memberof cy
 * @method init
 * @returns void
 */
Cypress.Commands.add("init", () => {
  cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });

  cy.fixture("config.json").then((config) => {
    config.data.general.base_url = Cypress.config("baseUrl");

    cy.intercept("GET", "api/v1/config", {
      statusCode: 200,
      body: config,
    });
  });
});
