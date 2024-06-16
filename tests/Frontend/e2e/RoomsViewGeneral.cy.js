import {interceptIndefinitely} from "../support/utils/interceptIndefinitely.js";

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

    cy.url().should('include', '/rooms/abc-def-123');
  });

  it('guest forbidden', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');
    // Check that the error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

    // Get reload button and reload without error
    const reloadRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' },'roomRequest');
    cy.get('.p-button').should('have.text', 'rooms.try_again').click();
    cy.get('.p-button').should('be.disabled').then(()=>{
      reloadRequest.sendResponse();
    });

    cy.wait('@roomRequest');
    cy.contains('Meeting One').should('be.visible');
  });

  it('test error', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms/abc-def-123');
    cy.get('.p-toast').should('be.visible').and('include.text', 'app.flash.server_error.message');

    // Get reload button and reload without error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('roomRequest');
    cy.get('.p-button').should('have.text', 'app.reload').click();

    cy.wait('@roomRequest');
    cy.contains('Meeting One').should('be.visible');
  });

  it('room not found', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 404,
      body: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    });

    cy.visit('/rooms/abc-def-123');

    cy.url().should('include', '/404').should('not.include', '/rooms/abc-def-123');
  });
});
