describe("General", function () {
  beforeEach(function () {
    cy.seed();
  });

  it("all locales get rendered", function () {
    cy.loginAs("john");

    cy.visit("/rooms");

    // Open menu to check if the correct locales are shown
    cy.get(".fa-solid.fa-language").click();
    cy.get("[data-test=submenu]")
      .eq(1)
      .within(() => {
        cy.get("[data-test=submenu-action]").should("have.length", 3);
        cy.get("[data-test=submenu-action]")
          .eq(0)
          .should("have.text", "Deutsch (German)");
        cy.get("[data-test=submenu-action]")
          .eq(1)
          .should("have.text", "English");
        cy.get("[data-test=submenu-action]")
          .eq(2)
          .should("have.text", "Français (French)");
      });
  });

  it("changing selected locale", function () {
    cy.loginAs("john");

    cy.visit("/rooms");

    // Open menu and click on a different locale than the current one
    cy.get(".fa-solid.fa-language").click();
    cy.get("[data-test=submenu]")
      .eq(1)
      .should("be.visible")
      .within(() => {
        cy.get("[data-test=submenu-action]")
          .eq(0)
          .should("have.text", "Deutsch (German)")
          .click();
      });

    cy.contains("Räume").should("be.visible");
  });
});
