import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';
import env from '../../../resources/js/env.js';

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
    cy.get('[data-test="room-create-button"]').should('not.exist');
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
    cy.get('[data-test="room-create-dialog"]').should('not.exist');
    // Check that room limit tag does not exist
    cy.contains('rooms.room_limit').should('not.exist');
    // Open room create modal
    cy.get('[data-test="room-create-button"]').should('have.text', 'rooms.create.title').click();

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Check that room type details does not exist (no room type selected)
      cy.get('[data-test="room-type-details"]').should('not.exist');

      cy.contains('rooms.create.title').should('be.visible');
      cy.get('#room-name').should('have.value', '').type('New Room');
      // Check that the room types are shown correctly
      cy.get('[data-test="room-type-select-option"]').should('have.length', 4);

      cy.get('[data-test="room-type-select-option"]').eq(0).should('have.text', 'Lecture');
      cy.get('[data-test="room-type-select-option"]').eq(1).should('have.text', 'Meeting');
      cy.get('[data-test="room-type-select-option"]').eq(2).should('have.text', 'Exam');
      cy.get('[data-test="room-type-select-option"]').eq(3).should('have.text', 'Seminar');

      // Select a room type
      cy.get('[data-test="room-type-select-option"]').eq(0).click();

      // Check that room type details are shown correctly
      cy.get('[data-test="room-type-details"]').should('be.visible').within(() => {
        cy.contains('admin.room_types.missing_description').should('be.visible');
        // Check that default room settings are hidden
        cy.contains('rooms.settings.general.title').should('not.be.visible');

        // Open default settings
        cy.get('button').should('have.text', 'admin.room_types.default_room_settings.title').click();
        // Check that default room settings are shown
        cy.contains('rooms.settings.general.title').should('be.visible');
      });

      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();

      // Check loading
      cy.get('#room-name').should('be.disabled');
      cy.get('.p-listbox-list').should('have.attr', 'aria-disabled', 'true');
      cy.get('[data-test="dialog-save-button"]').should('be.disabled').then(() => {
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
      statusCode: env.HTTP_UNPROCESSABLE_ENTITY,
      body: {
        message: 'The given data was invalid',
        errors: {
          room_type: ['The Room type field is required.']
        }
      }
    }).as('createRoomRequest');

    cy.visit('/rooms');

    // Open room create modal
    cy.get('[data-test="room-create-button"]').should('have.text', 'rooms.create.title').click();

    // Open room create modal
    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.value', '').type('New Room');

      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@createRoomRequest');

    // Check that error gets displayed
    cy.get('[data-test="room-create-dialog"]').contains('The Room type field is required.').should('be.visible');

    // Create new room without name
    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: env.HTTP_UNPROCESSABLE_ENTITY,
      body: {
        message: 'The given data was invalid',
        errors: {
          name: ['The Name field is required.']
        }
      }
    }).as('createRoomRequest');

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Remove text from name input
      cy.get('#room-name').should('have.value', 'New Room').clear();
      // Select a room type
      cy.get('[data-test="room-type-select-option"]').eq(0).click();

      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@createRoomRequest');

    // Check that error gets displayed
    cy.get('[data-test="room-create-dialog"]').contains('The Name field is required.').should('be.visible');
    cy.get('[data-test="room-create-dialog"]').contains('The Room type field is required.').should('not.exist');

    // Create new room forbidden
    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: env.HTTP_FORBIDDEN
    }).as('createRoomRequest');

    cy.intercept('GET', 'api/v1/currentUser', { fixture: 'exampleUser.json' }).as('currentUserRequest');

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@createRoomRequest');
    cy.wait('@currentUserRequest');

    // Check that create room dialog is closed
    cy.get('[data-test="room-create-dialog"]').should('not.exist');

    // Check that create room button is disabled
    cy.get('[data-test="room-create-button"]').should('not.exist');

    // Check if error message is visible
    cy.get('.p-toast-message')
      .should('be.visible')
      .and('have.text', 'rooms.flash.no_new_room')
      .find('button')
      .click();
    cy.get('.p-toast-message').should('not.exist');

    // Reload page to check other errors
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

    cy.reload(); // ToDo find other way?? or create a new test for part after this ???

    // Other errors
    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('createRoomRequest');

    cy.get('[data-test="room-create-button"]').click();

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.value', '').type('New Room');

      // Select a room type
      cy.get('[data-test="room-type-select-option"]').eq(0).click();

      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@createRoomRequest');

    // Check that create room dialog is closed
    cy.get('[data-test="room-create-dialog"]').should('not.exist');

    // Check if error message is visible
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Test with 401 error
    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: env.HTTP_UNAUTHORIZED
    }).as('createRoomRequest');

    cy.get('[data-test="room-create-button"]').click();

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.value', '').type('New Room');

      // Select a room type
      cy.get('[data-test="room-type-select-option"]').eq(0).click();

      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@createRoomRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');
  });

  it('create new room limit reached', function () {
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
    }).as('roomRequest');

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
    }).as('currentUserRequest');

    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: env.HTTP_ROOM_LIMIT_EXCEEDED,
      body: {
        message: 'Test'
      }
    }).as('createRoomRequest');

    cy.visit('/rooms');

    cy.wait('@roomRequest');

    // Check if room limit is shown
    cy.contains('rooms.room_limit_{"has":0,"max":1}').should('be.visible');

    // Open room create modal
    cy.get('[data-test="room-create-button"]').should('have.text', 'rooms.create.title').click();
    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.text', '').type('New Room');

      // Select a room type
      cy.get('[data-test="room-type-select-option"]').eq(0).click();

      // Change response so that the room limit gets reached
      cy.intercept('GET', 'api/v1/rooms?*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 'abc-def-123',
              name: 'Meeting One',
              owner: {
                id: 1,
                name: 'John Doe'
              },
              last_meeting: null,
              type: {
                id: 2,
                name: 'Meeting',
                color: '#4a5c66'
              },
              is_favorite: false,
              short_description: 'Room short description'
            }
          ],
          meta: {
            current_page: 1,
            from: 1,
            last_page: 3,
            per_page: 1,
            to: 1,
            total: 3,
            total_no_filter: 3,
            total_own: 1
          }
        }
      }).as('roomRequest');

      // Create new room
      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@createRoomRequest');
    cy.wait('@currentUserRequest');
    cy.wait('@roomRequest');

    cy.get('[data-test="room-create-dialog"]').should('not.exist');

    // Check if error message is visible
    cy.get('.p-toast-message')
      .should('be.visible')
      .and('include.text', 'Test')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Check if room limit is updated and create button is disabled
    cy.get('[data-test="room-create-button"]').should('be.disabled');
    cy.contains('rooms.room_limit_{"has":1,"max":1}').should('be.visible');

    // Switch to next page
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 2,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: true,
            short_description: null
          }
        ],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomRequest');

    // Make sure that room limit and button stay the same
    cy.get('[data-test="room-create-button"]').should('be.disabled');
    cy.contains('rooms.room_limit_{"has":1,"max":1}').should('be.visible');

    // Check if room count is not based on items on the current page or the total results,
    // but all rooms of the user, independent of the search query
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
          total_own: 1
        }
      }
    });

    cy.get('[data-test="room-search"] > input').type('Test');
    cy.get('[data-test="room-search"] > input').type('{enter}');

    // Check if room limit is updated and create button is disabled
    cy.get('[data-test="room-create-button"]').should('be.disabled');
    cy.contains('rooms.room_limit_{"has":1,"max":1}').should('be.visible');
  });

  it('create new room limit reached when visiting', function () {
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
          total_own: 1
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

    cy.visit('/rooms');

    // Check if room limit is shown and create button is disabled
    cy.get('[data-test="room-create-button"]').should('be.disabled');
    cy.contains('rooms.room_limit_{"has":1,"max":1}').should('be.visible');
  });

  it('cancel create new room', function () {
    cy.visit('/rooms');

    // Check that room create modal is hidden
    cy.get('[data-test="room-create-dialog"]').should('not.exist');
    // Check that room limit tag does not exist
    cy.contains('rooms.room_limit').should('not.exist');
    // Open room create modal
    cy.get('[data-test="room-create-button"]').should('have.text', 'rooms.create.title').click();

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Check that room type details does not exist (no room type selected)
      cy.get('[data-test="room-type-details"]').should('not.exist');

      cy.get('#room-name').should('have.value', '').type('New Room');
      // Select a room type
      cy.get('[data-test="room-type-select-option"]').eq(0).click();

      cy.get('[data-test="room-type-details"]').should('be.visible');
    });

    // Cancel room creation
    cy.get('[data-test="dialog-cancel-button"]').click();

    // Check that room create modal is hidden
    cy.get('[data-test="room-create-dialog"]').should('not.exist');

    // Reopen room create modal
    cy.get('[data-test="room-create-button"]').should('have.text', 'rooms.create.title').click();

    cy.get('[data-test="room-create-dialog"]').should('be.visible').within(() => {
      // Check that selected values were reset
      cy.get('#room-name').should('have.value', '');
      cy.get('[data-test="room-type-details"]').should('not.exist');
    });
  });
});
