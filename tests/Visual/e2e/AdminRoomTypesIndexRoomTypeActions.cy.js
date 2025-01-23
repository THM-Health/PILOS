describe("Admin room types index room type actions", function () {
  it("show clear button in room type replacement select", function () {
    cy.init();

    cy.intercept("GET", "api/v1/roomTypes*", {
      fixture: "roomTypes.json",
    }).as("roomTypesRequest");

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
        "roomTypes.create",
        "roomTypes.delete",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/room_types");

    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    cy.get('[data-test="room-types-delete-dialog"]').should("not.exist");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .find('[data-test="room-types-delete-button"]')
      .click();

    // Check that replacement room types are loaded
    cy.wait("@roomTypesRequest");

    cy.get('[data-test="room-types-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="replacement-room-type-dropdown-items"]').should(
      "not.exist",
    );

    cy.get('[data-test="replacement-room-type-field"]').should("be.visible");

    cy.get('[data-test="replacement-room-type-field"]').happoScreenshot({
      component: "RoomTypeReplacementSelect",
      variant: "empty",
    });

    cy.get('[data-test="replacement-room-type-dropdown"]')
      .should("have.text", "-- No replacement --")
      .click();

    // Check that replacement room types are shown correctly
    cy.get('[data-test="replacement-room-type-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test = "replacement-room-type-dropdown-option"]').should(
          "have.length",
          3,
        );

        cy.get('[data-test="replacement-room-type-dropdown-option"]')
          .eq(0)
          .should("have.text", "Lecture")
          .click();
      });

    cy.get('[data-test="replacement-room-type-dropdown-items"]').should(
      "not.exist",
    );
    cy.get('[data-test="replacement-room-type-dropdown"]').should(
      "have.text",
      "Lecture",
    );

    cy.get('[data-test="replacement-room-type-field"]').happoScreenshot({
      component: "RoomTypeReplacementSelect",
      variant: "selected",
    });
  });
});
