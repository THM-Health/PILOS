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
