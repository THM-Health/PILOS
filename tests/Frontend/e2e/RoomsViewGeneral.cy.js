describe('Room View general', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it('click on room card to open room view', function () {
    cy.interceptRoomIndexRequests();
    cy.visit('/rooms');
    cy.wait('@roomRequest');

    cy.get('.room-card').eq(0).click();

    cy.url().should('contain', '/rooms/abc-def-123');
  });

  it('guest forbidden', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    });

    cy.visit('/rooms/abc-def-123');

    cy.contains('rooms.only_used_by_authenticated_users');
    cy.get('.p-button').should('not.be.disabled').should('contain', 'rooms.try_again');

    // ToDo reload??
  });

  it('test error', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms/abc-def-123');
    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    // Get reload button and reload without error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('roomRequest');
    cy.get('.p-button').should('not.be.disabled').should('contain', 'app.reload').click();

    cy.wait('@roomRequest');
    cy.contains('Meeting One');
  });

  it('room not found', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 404,
      body: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    });

    cy.visit('/rooms/abc-def-123');

    cy.url().should('contain', '/404').should('not.contain', '/rooms/abc-def-123');
  });
});
