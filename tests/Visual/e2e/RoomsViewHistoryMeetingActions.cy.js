describe("Rooms view history meeting actions", function () {
  it("show stats", function () {
    cy.init();

    cy.visit("/rooms/abc-def-123#tab=history");

    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      fixture: "roomHistory.json",
    }).as("roomHistoryRequest");

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.intercept(
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
      {
        fixture: "roomHistoryStats.json",
      },
    ).as("statsRequest");

    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .find('[data-test="room-history-statistic-button"]')
      .click();

    cy.wait("@statsRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that chart is displayed
    cy.get('[data-test="chart"] > canvas')
      .should("be.visible")
      .should("have.attr", "style")
      .and("include", "display: block");

    cy.get('[data-test="chart"] > canvas').should(
      "have.attr",
      "width",
      1163 * window.devicePixelRatio,
    );

    cy.get('[data-test="chart"] > canvas').happoScreenshot();
  });
});
