import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

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

  it('join running meeting', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 508307005,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    });

    const joinRequest = interceptIndefinitely('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'joinRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-join-button]').should('not.be.disabled').and('contain', 'rooms.join').click();
    cy.get('[data-test=room-join-button]').should('be.disabled').then(() => {
      joinRequest.sendResponse();
    });

    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.query).to.contain({
        name: '',
        record_attendance: '0',
        record: '0',
        record_video: '0'
      });
    });

    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
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
