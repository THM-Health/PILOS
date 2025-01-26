/**
 * Check if a permission group is displayed correctly.
 * @memberof cy
 * @method roomTypeCheckDefaultRoomSettingCheckboxField
 * @param  {int} index
 * @param  {string} permission
 * @param  {boolean} explicit
 * @param  {boolean} included
 * @param  {boolean} disabled
 * @returns void
 */
Cypress.Commands.add(
  "checkPermissionGroup",
  (index, permission, explicit, included, disabled) => {
    cy.get('[data-test="permission-group"]')
      .eq(index)
      .should("include.text", permission);

    permission = permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

    cy.get('[data-test="permission-group"]')
      .eq(index)
      .should("include.text", "admin.roles.permissions." + permission)
      .within(() => {
        cy.get("#" + permission.replace(".", "\\."))
          .should(explicit ? "be.checked" : "not.be.checked")
          .and(disabled ? "be.disabled" : "not.be.disabled");
        cy.get('[data-test="permission-included-icon"]').should(
          included ? "be.visible" : "not.exist",
        );
        cy.get('[data-test="permission-not-included-icon"]').should(
          included ? "not.exist" : "be.visible",
        );
      });
  },
);

/**
 * Check if the room limit help dialog is shown correctly and close it.
 * @memberof cy
 * @method roomTypeCheckDefaultRoomSettingCheckboxField
 * @returns void
 */
Cypress.Commands.add("checkRoomLimitHelpDialog", () => {
  cy.get('[data-test="roles-room-limit-help-dialog"]')
    .should("be.visible")
    .and("include.text", "app.room_limit")
    .and("include.text", "admin.roles.room_limit.help_modal.info")
    .and("include.text", "admin.roles.room_limit.help_modal.examples")
    .and("include.text", "admin.roles.room_limit.help_modal.note")
    .within(() => {
      // Check that table is shown correctly
      cy.get("tr").should("have.length", 8);

      cy.get("tr")
        .eq(0)
        .within(() => {
          cy.get("th").should("have.length", 4);
          cy.get("th")
            .eq(0)
            .should(
              "include.text",
              "admin.roles.room_limit.help_modal.system_default",
            );
          cy.get("th")
            .eq(1)
            .should("include.text", "admin.roles.room_limit.help_modal.role_a");
          cy.get("th")
            .eq(2)
            .should("include.text", "admin.roles.room_limit.help_modal.role_b");

          cy.get("th").eq(3).should("include.text", "app.room_limit");
        });

      cy.get("tr")
        .eq(1)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "5");
          cy.get("td").eq(1).should("include.text", "X");
          cy.get("td").eq(2).should("include.text", "X");
          cy.get("td").eq(3).should("include.text", "5");
        });

      cy.get("tr")
        .eq(2)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "1");
          cy.get("td").eq(1).should("include.text", "5");
          cy.get("td").eq(2).should("include.text", "X");
          cy.get("td").eq(3).should("include.text", "5");
        });

      cy.get("tr")
        .eq(3)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "5");
          cy.get("td").eq(1).should("include.text", "1");
          cy.get("td").eq(2).should("include.text", "X");
          cy.get("td").eq(3).should("include.text", "1");
        });

      cy.get("tr")
        .eq(4)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "5");
          cy.get("td").eq(1).should("include.text", "1");
          cy.get("td").eq(2).should("include.text", "2");
          cy.get("td").eq(3).should("include.text", "2");
        });

      cy.get("tr")
        .eq(5)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "5");
          cy.get("td")
            .eq(1)
            .should(
              "include.text",
              "admin.roles.room_limit.help_modal.system_default",
            );
          cy.get("td").eq(2).should("include.text", "2");
          cy.get("td").eq(3).should("include.text", "5");
        });

      cy.get("tr")
        .eq(6)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "5");
          cy.get("td")
            .eq(1)
            .should(
              "include.text",
              "admin.roles.room_limit.help_modal.system_default",
            );
          cy.get("td").eq(2).should("include.text", "10");
          cy.get("td").eq(3).should("include.text", "10");
        });

      cy.get("tr")
        .eq(7)
        .within(() => {
          cy.get("td").should("have.length", 4);
          cy.get("td").eq(0).should("include.text", "5");
          cy.get("td").eq(1).should("include.text", "app.unlimited");
          cy.get("td").eq(2).should("include.text", "2");
          cy.get("td").eq(3).should("include.text", "app.unlimited");
        });

      // Close room limit help dialog
      cy.get('[data-test="dialog-header-close-button"]').click();
    });
});
