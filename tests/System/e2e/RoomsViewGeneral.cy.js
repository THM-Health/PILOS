describe("Room View general", function () {
  beforeEach(function () {
    cy.seed();
  });

  it("open room as owner", function () {
    cy.loginAs("daniel");

    cy.visit("/rooms/abc-def-123");

    cy.contains("Anatomy").should("be.visible");
  });

  it("open room as user without membership", function () {
    cy.loginAs("angela");

    cy.visit("/rooms/abc-def-123");

    cy.contains("Anatomy").should("be.visible");
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="access-code-field"] input').type("111111111");
    cy.get('[data-test="room-login-button"]').click();
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get('[data-test="access-code-field"] input').clear();

    cy.get('[data-test="access-code-field"] input').type("123456789");
    cy.get('[data-test="room-login-button"]').click();
    cy.get('[data-test="room-access-overlay"]').should("not.exist");
  });

  it("guest forbidden", function () {
    cy.visit("/rooms/abc-def-123");

    cy.contains("This room can only be used by authenticated users.").should(
      "be.visible",
    );
  });

  it("guest allowed", function () {
    cy.visit("/rooms/abc-def-234");

    cy.contains("Math").should("be.visible");
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    cy.get('[data-test="participant-name-field"] > #participant-name').type(
      "John Doe",
    );
    cy.get('[data-test="access-code-field"] input').type("111111111");
    cy.get('[data-test="room-login-button"]').click();
    cy.get('[data-test="room-access-overlay"]').should("be.visible");
    cy.get('[data-test="access-code-field"] input').clear();

    cy.get('[data-test="access-code-field"] input').type("123456789");
    cy.get('[data-test="room-login-button"]').click();
    cy.get('[data-test="room-access-overlay"]').should("not.exist");
  });

  it("room not found", function () {
    cy.visit("/rooms/123-456-789");

    cy.contains("The requested address was not found").should("be.visible");
  });
});
