/**
 * Check if a field for the default room settings inside the room type form is displayed correctly.
 * @memberof cy
 * @method roomTypeCheckDefaultRoomSettingCheckboxField
 * @param  {string} field
 * @param  {(boolean|string)} value
 * @param  {boolean} enforced
 * @param  {boolean} viewOnly
 * @returns void
 */
Cypress.Commands.add(
  "roomTypeCheckDefaultRoomSettingCheckboxField",
  (field, value, enforced, viewOny) => {
    cy.get("#" + field + "-default")
      .should(value ? "be.checked" : "not.be.checked")
      .and(viewOny ? "be.disabled" : "not.be.disabled");

    cy.get('[data-test="' + field + '-enforced"]')
      .should(
        "have.text",
        enforced
          ? "admin.room_types.default_room_settings.enforced"
          : "admin.room_types.default_room_settings.default",
      )
      .and(viewOny ? "be.disabled" : "not.be.disabled");
  },
);
