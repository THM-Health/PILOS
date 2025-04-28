describe("General", function () {
  beforeEach(function () {
    cy.seed();
  });

  it("all locales get rendered", function () {
    cy.loginAs("john");

    cy.visit("/rooms");

    // Open menu to check if the correct locales are shown
    cy.get('[data-test="navbar-locale"]').click();
    cy.get("[data-test=submenu]")
      .eq(1)
      .within(() => {
        cy.get("li").should("have.length", 3);

        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch (German)");

        cy.get('[data-test="navbar-locale-en"]')
          .should("exist")
          .should("have.text", "English");

        cy.get('[data-test="navbar-locale-fr"]')
          .should("exist")
          .should("have.text", "Français (French)");
      });
  });

  it("changing selected locale", function () {
    cy.loginAs("john");

    cy.visit("/rooms");

    // Open menu and click on a different locale than the current one
    cy.get('[data-test="navbar-locale"]').click();
    cy.get("[data-test=submenu]")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="navbar-locale-de"]')
          .should("exist")
          .should("have.text", "Deutsch (German)");

        cy.get('[data-test="navbar-locale-de"]').click();
      });

    cy.contains("Räume").should("be.visible");
  });
});
