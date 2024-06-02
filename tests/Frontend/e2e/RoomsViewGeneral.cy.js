describe('Room View general', () => {

  beforeEach(()=>{
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it('click on room card to open room view', ()=>{
    cy.interceptRoomIndexRequests();
    cy.visit('/rooms');
    cy.wait('@roomRequest');

    cy.get('.room-card').eq(0).click();

    cy.url().should('contain', '/rooms/abc-def-123');
  });

  // ToDo tabs, start room, stop room, guest access, access code
});
