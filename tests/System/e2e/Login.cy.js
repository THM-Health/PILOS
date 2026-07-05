// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

describe("Login", function () {
  beforeEach(function () {
    cy.seed();
  });

  it("local login", function () {
    cy.visit("/login");

    // Local login
    cy.get('[data-test="login-tab-button-local"]').click();
    cy.get("#local-email").type("john.doe@example.org");
    cy.get("#local-password").type("johndoe");
    cy.get('[data-test="login-button"]').should("have.text", "Login").click();

    // Check toast message
    cy.get(".p-toast")
      .should("be.visible")
      .and("have.text", "Successfully logged in");
    // Check if redirect works
    cy.url().should("include", "/rooms").and("not.contain", "/login");
  });

  it("local login invalid", function () {
    cy.visit("/login");

    // Local login
    cy.get('[data-test="login-tab-button-local"]').click();
    cy.get("#local-email").type("john.doe@example.org");
    cy.get("#local-password").type("johndoe2");
    cy.get('[data-test="login-button"]').should("have.text", "Login").click();

    // Check error message
    cy.contains("These credentials do not match our records.").should(
      "be.visible",
    );
  });
});
