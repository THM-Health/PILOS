describe("Logout", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it("successful logout no redirect", function () {
    cy.intercept("POST", "api/v1/logout", {
      statusCode: 204,
      data: {
        redirect: false,
      },
    }).as("logoutRequest");
    cy.visit("rooms");

    // Click on logout
    cy.get('[data-test="user-avatar"]').click();
    cy.get('[data-test="submenu"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="submenu-action"]')
          .eq(1)
          .should("have.text", "auth.logout")
          .click();
      });

    cy.wait("@logoutRequest");

    // Check if redirected to logout
    cy.url().should("include", "/logout").should("not.include", "/rooms");
    cy.contains("auth.logout_success").should("be.visible");

    // Check redirect to home page
    cy.get('[data-test="home-button"]').should("have.text", "app.home").click();
    cy.url().should("not.include", "/logout");
  });

  it("successful logout with redirect", function () {
    cy.intercept("POST", "api/v1/logout", {
      statusCode: 200,
      body: {
        redirect: "https://example.org/?foo=a&bar=b",
      },
    }).as("logoutRequest");
    cy.visit("rooms");
    // Click on logout
    cy.get("[data-test=user-avatar]").click();
    cy.get("[data-test=submenu]")
      .eq(0)
      .within(() => {
        cy.get("[data-test=submenu-action]")
          .eq(1)
          .should("contain", "auth.logout")
          .click();
      });
    cy.wait("@logoutRequest");
    // Check if redirect worked
    cy.origin("https://example.org", () => {
      cy.url().should("eq", "https://example.org/?foo=a&bar=b");
    });
  });

  it("failed logout", function () {
    cy.intercept("POST", "api/v1/logout", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("logoutRequest");

    cy.visit("/rooms");

    // Click on logout
    cy.get('[data-test="user-avatar"]').click();
    cy.get('[data-test="submenu"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="submenu-action"]')
          .eq(1)
          .should("have.text", "auth.logout")
          .click();
      });

    cy.wait("@logoutRequest");

    // Check if error gets shown and user stays logged in
    cy.checkToastMessage("auth.flash.logout_error");

    cy.url()
      .should("include", "/rooms")
      .and("not.include", "/logout")
      .and("not.include", "/login");
  });
});
