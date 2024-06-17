import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms index create new room', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: ['rooms.create'],
        model_name: 'User',
        room_limit: -1
      }
    });
  });

  it('button to create new room hidden', function () {
    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: [],
        model_name: 'User',
        room_limit: -1
      }
    });

    cy.visit('/rooms');
    cy.wait('@roomRequest');
    // Check that room create button is hidden for user that does not have the permission to create rooms
    cy.get('[data-test=room-create-button]').should('not.exist');
    // Check that room limit tag does not exist
    cy.contains('rooms.room_limit').should('not.exist');
  });

  it('create new room', function () {
    // Intercept room view requests (needed for redirect after room creation)
    cy.interceptRoomViewRequests();

    const createRoomRequest = interceptIndefinitely('POST', 'api/v1/rooms', {
      statusCode: 201,
      body: {
        data: {
          id: 'abc-def-123',
          owner: {
            id: 1,
            name: 'John Doe'
          },
          type: {
            id: 2,
            name: 'Meeting',
            color: '#4a5c66'
          }
        }
      }
    }, 'createRoomRequest');

    cy.visit('/rooms');

    // Check that room create modal is hidden
    cy.get('[data-test=room-create-dialog]').should('not.exist');
    // Check that room limit tag does not exist
    cy.contains('rooms.room_limit').should('not.exist');
    // Open room create modal
    cy.get('[data-test=room-create-button]').should('have.text', 'rooms.create.title').click();

    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Check that room type details does not exist (no room type selected)
      cy.get('[data-test=room-type-details]').should('not.exist');

      cy.contains('rooms.create.title').should('be.visible');
      cy.get('#room-name').should('have.value', '').type('New Room');
      // Check that the room types are shown correctly
      cy.get('[data-test=room-type-select-option]').should('have.length', 4);

      cy.get('[data-test=room-type-select-option]').eq(0).should('have.text', 'Vorlesung');
      cy.get('[data-test=room-type-select-option]').eq(1).should('have.text', 'Meeting');
      cy.get('[data-test=room-type-select-option]').eq(2).should('have.text', 'Prüfung');
      cy.get('[data-test=room-type-select-option]').eq(3).should('have.text', 'Übung');

      // Select a room type
      cy.get('[data-test=room-type-select-option]').eq(0).click();

      // Check that room type details are shown correctly
      cy.get('[data-test=room-type-details]').should('be.visible').within(() => {
        cy.contains('settings.room_types.missing_description').should('be.visible');
        // Check that default room settings are hidden
        cy.contains('rooms.settings.general.title').should('not.be.visible');

        // Open default settings
        cy.get('a').should('have.text', 'settings.room_types.default_room_settings.title').click();
        // Check that default room settings are shown
        cy.contains('rooms.settings.general.title').should('be.visible');
      });

      // Create new room
      cy.get('.p-button').eq(1).should('have.text', 'rooms.create.ok').click();

      // Check loading
      cy.get('#room-name').should('be.disabled');
      cy.get('.p-listbox-list').should('have.attr', 'aria-disabled', 'true');
      cy.get('.p-button').eq(1).should('be.disabled').then(() => {
        createRoomRequest.sendResponse();
      });
    });

    // Check if correct request is send
    cy.wait('@createRoomRequest').then(interception => {
      expect(interception.request.body).to.contain({
        name: 'New Room',
        room_type: 1
      });
    });

    // Check if redirected to the created room
    cy.url().should('include', '/rooms/abc-def-123');
  });

  it('create new room errors', function () {
    // Create new room without room type

    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid',
        errors: {
          room_type: ['The Room type field is required.']
        }
      }
    }).as('createRoomRequest');

    cy.visit('/rooms');

    // Open room create modal
    cy.get('[data-test=room-create-button]').should('have.text', 'rooms.create.title').click();

    // Open room create modal
    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.value', '').type('New Room');

      // Create new room
      cy.get('.p-button').eq(1).should('have.text', 'rooms.create.ok').click();
    });

    cy.wait('@createRoomRequest');

    // Check that error gets displayed
    cy.get('[data-test=room-create-dialog]').contains('The Room type field is required.').should('be.visible');

    // Create new room without name

    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid',
        errors: {
          name: ['The Name field is required.']
        }
      }
    }).as('createRoomRequest');

    //
    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Remove text from name input
      cy.get('#room-name').should('have.value', 'New Room').clear();
      // Select a room type
      cy.get('[data-test=room-type-select-option]').eq(0).click();

      // Create new room
      cy.get('.p-button').eq(1).should('have.text', 'rooms.create.ok').click();
    });

    cy.wait('@createRoomRequest');

    // Check that error gets displayed
    cy.get('[data-test=room-create-dialog]').contains('The Name field is required.').should('be.visible');
    cy.get('[data-test=room-create-dialog]').contains('The Room type field is required.').should('not.exist');

    // Create new room forbidden

    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: 403
    }).as('createRoomRequest');

    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Create new room
      cy.get('.p-button').eq(1).should('have.text', 'rooms.create.ok').click();
    });

    cy.wait('@createRoomRequest');

    cy.get('[data-test=room-create-dialog]').should('not.exist');

    // Check if error message is visible
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.no_new_room');
  });

  it('create new room limit reached', function () {
    cy.intercept('GET', 'api/v1/locale/en', {
      data: {
        app: {
          flash: {
            server_error: {
              message: ':message'
            }
          }
        },
        rooms: {
          room_limit: 'rooms.room_limit: :has/:max'
        }
      }
    });

    cy.intercept('GET', 'api/v1/rooms*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          to: 5,
          total: 0,
          total_no_filter: 0,
          total_own: 0
        }
      }
    });

    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: ['rooms.create'],
        model_name: 'User',
        room_limit: 1
      }
    });

    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: 463,
      body: {
        message: 'Test'
      }
    }).as('createRoomRequest');

    cy.visit('/rooms');

    // Check if room limit is shown
    cy.contains('rooms.room_limit: 0/1').should('be.visible');

    // Open room create modal
    cy.get('[data-test=room-create-button]').should('have.text', 'rooms.create.title').click();
    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.text', '').type('New Room');

      // Select a room type
      cy.get('[data-test=room-type-select-option]').eq(0).click();

      // Change response so that the room limit gets reached
      cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' });

      // Create new room
      cy.get('.p-button').eq(1).should('have.text', 'rooms.create.ok').click();
    });

    cy.wait('@createRoomRequest');

    cy.get('[data-test=room-create-dialog]').should('not.exist');

    // Check if error message is visible
    cy.get('.p-toast').should('be.visible').and('include.text', 'Test');
    cy.get('[data-test=room-create-button]').should('be.disabled');

    // Check if room limit is updated
    cy.contains('rooms.room_limit: 1/1').should('be.visible');
  });
});
