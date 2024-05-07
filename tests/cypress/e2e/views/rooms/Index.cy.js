describe('Room Index', () => {
  beforeEach(()=>{
    cy.init();
    cy.intercept('GET', 'api/v1/roomTypes*', {fixture: 'exampleRoomTypes.json'}).as('roomTypeRequest');
    cy.intercept('GET', 'api/v1/rooms?*', {fixture: 'exampleRoomsResponse.json'}).as('roomRequest');
  })

  it('check list of rooms', () => {
    cy.visit('/rooms');

    cy.get('.p-inputgroup').eq(0).within(()=>{
      cy.get('.p-inputtext').should('be.disabled');
      cy.get('.p-button').should('be.disabled');
    });

    //ToDo fix tests for loading (options: delaying the request, promise)
    // cy.get('.p-dropdown').eq(0).should('be.disabled');
    // cy.get('.p-dropdown').eq(1).should('be.disabled');

    cy.wait('@roomRequest');

    //ToDo delete or add alias completely
    cy.get('.room-card').as('rooms').should('have.length', 3);
    cy.get('@rooms').eq(0).should('contain', 'Meeting One');
    cy.get('@rooms').eq(0).within(()=>{
      cy.get('a').should('have.attr','href', '/rooms/abc-def-123');
    });
    cy.get('.room-card').eq(1).should('contain', 'Meeting Two');
    cy.get('@rooms').eq(1).within(()=>{
      cy.get('a').should('have.attr','href', '/rooms/def-abc-123');
    });
    cy.get('.room-card').eq(2).should('contain','Meeting Three');
    cy.get('@rooms').eq(2).within(()=>{
      cy.get('a').should('have.attr','href', '/rooms/def-abc-456');
    });
  })
})
