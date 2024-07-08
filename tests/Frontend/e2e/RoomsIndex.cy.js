import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Room Index', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it('visit with user that is not logged in', function () {
    cy.testVisitWithoutCurrentUser('/rooms');
  });

  it('check list of rooms', function () {
    const roomRequestInterception = interceptIndefinitely('GET', 'api/v1/rooms?*', { fixture: 'exampleRooms.json' }, 'roomRequest');

    cy.visit('/rooms');

    // Test loading
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('be.disabled');
      cy.get('.p-button').should('be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label').should('have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test=filter-button]').should('not.be.visible');

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label')
        .should('have.attr', 'aria-disabled', 'true')
        .then(() => {
          roomRequestInterception.sendResponse();
        });
    });

    // Make sure that components are not disabled after response
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test=filter-button]').should('not.be.visible');

    // Check if rooms are shown and contain the correct data
    cy.get('.room-card').should('have.length', 3);

    cy.get('.room-card').eq(0).should('contain', 'Meeting One');
    cy.get('.room-card').eq(0).should('contain', 'John Doe');
    cy.get('.room-card').eq(0).should('contain', 'rooms.index.room_component.never_started');
    cy.get('.room-card').eq(0).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-123');
    });
    cy.get('.room-card').eq(1).should('contain', 'Meeting Two');
    cy.get('.room-card').eq(1).should('contain', 'John Doe');
    cy.get('.room-card').eq(1).should('contain', 'rooms.index.room_component.running_since');
    cy.get('.room-card').eq(1).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/def-abc-123');
    });
    cy.get('.room-card').eq(2).should('contain', 'Meeting Three');
    cy.get('.room-card').eq(2).should('contain', 'John Doe');
    cy.get('.room-card').eq(2).should('contain', 'rooms.index.room_component.last_ran_till');
    cy.get('.room-card').eq(2).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/def-abc-456');
    });
  });

  it('error loading rooms', function () {
    cy.intercept('GET', 'api/v1/rooms*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomRequest');

    cy.visit('/rooms');
    cy.wait('@roomRequest');

    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    // Check that components are not disabled
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' });
    // Check if reload button exists and click it
    cy.get('[data-test=reload-button]').should('contain', 'app.reload').click();

    // Check if rooms are shown and contain the correct data
    cy.get('.room-card').as('rooms').should('have.length', 3);

    // Check that reload button does not exist
    cy.get('[data-test=reload-button]').should('not.exist');

    // Check that components are not disabled
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });
  });

  it('error loading room types', function () {
    cy.intercept('GET', 'api/v1/roomTypes', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms');

    // Check that error message gets shown
    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    const roomTypeInterception = interceptIndefinitely('GET', 'api/v1/roomTypes*', { fixture: 'exampleRoomTypes.json' });

    // Check that room type select is shown correctly and click on reload button
    cy.get('[data-test=room-type-dropdown').should('not.exist');
    cy.get('[data-test=room-type-inputgroup]').should('contain', 'rooms.room_types.loading_error').within(() => {
      cy.get('.p-button').click();
      // Check that button is disabled
      cy.get('.p-button').should('be.disabled').and('have.class', 'p-button-loading').then(() => {
        // Send correct response and check that reload button does not exist after reload
        roomTypeInterception.sendResponse();
        cy.get('.p-button').should('not.exist');
      });
    });

    // Check that dropdown exists and error message is not shown after correct response
    cy.get('[data-test=room-type-dropdown');
    cy.get('[data-test=room-type-inputgroup]').should('not.contain', 'rooms.room_types.loading_error');
  });

  it('button to create new room hidden', function () {
    cy.visit('/rooms');
    cy.wait('@roomRequest');
    // Check that room create button is hidden for user that does not have the permission to create rooms
    cy.get('[data-test=room-create-button]').should('not.exist');
  });

  it('create new room', function () {
    // Intercept room view requests (needed for redirect after room creation)
    cy.interceptRoomViewRequests();

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

    cy.intercept('POST', 'api/v1/rooms', {
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
    }).as('createRoomRequest');

    cy.visit('/rooms');

    // Check that room create modal is hidden
    cy.get('[data-test=room-create-dialog]').should('not.exist');
    // Open room create modal
    cy.get('[data-test=room-create-button]').should('contain', 'rooms.create.title').click();

    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Check that room type details does not exist (no room type selected)
      cy.get('[data-test=room-type-details]').should('not.exist');

      cy.contains('rooms.create.title');
      cy.get('#room-name').should('have.text', '').type('New Room');
      // Check that the room types are shown correctly
      cy.get('[data-test=room-type-select-option]').should('have.length', 4);

      cy.get('[data-test=room-type-select-option]').eq(0).should('contain', 'Vorlesung');
      cy.get('[data-test=room-type-select-option]').eq(1).should('contain', 'Meeting');
      cy.get('[data-test=room-type-select-option]').eq(2).should('contain', 'Prüfung');
      cy.get('[data-test=room-type-select-option]').eq(3).should('contain', 'Übung');

      // Select a room type
      cy.get('[data-test=room-type-select-option]').eq(0).click();

      // Check that room type details are shown correctly
      cy.get('[data-test=room-type-details]').should('be.visible').within(() => {
        cy.contains('admin.room_types.missing_description');
        // Check that default room settings are hidden
        cy.contains('rooms.settings.general.title').should('not.be.visible');

        // Open default settings
        cy.get('a').should('contain', 'admin.room_types.default_room_settings.title').click();
        // Check that default room settings are shown
        cy.contains('rooms.settings.general.title').should('be.visible');
      });

      // Create new room
      cy.get('.p-button').eq(1).should('contain', 'rooms.create.ok').click();
    });

    // Check if correct request is send
    cy.wait('@createRoomRequest').then(interception => {
      expect(interception.request.body).to.contain({
        name: 'New Room',
        room_type: 1
      });
    });

    // Check if redirected to the created room
    cy.url().should('contain', '/rooms/abc-def-123');
  });

  it('create new room without name', function () {
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

    cy.intercept('POST', 'api/v1/rooms', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid',
        errors: {
          name: ['The Name field is required.']
        }
      }
    }).as('createRoomRequest');

    cy.visit('/rooms');

    // Open room create modal
    cy.get('[data-test=room-create-button]').should('contain', 'rooms.create.title').click();
    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Check that room name input is empty
      cy.get('#room-name').should('have.text', '');
      // Select a room type
      cy.get('[data-test=room-type-select-option]').eq(0).click();

      // Create new room
      cy.get('.p-button').eq(1).should('contain', 'rooms.create.ok').click();
    });

    cy.wait('@createRoomRequest');

    // Check that error gets displayed
    cy.get('[data-test=room-create-dialog]').contains('The Name field is required.');
  });

  it('create new room without room type', function () {
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
    cy.get('[data-test=room-create-button]').should('contain', 'rooms.create.title').click();
    cy.get('[data-test=room-create-dialog]').should('be.visible').within(() => {
      // Enter room name
      cy.get('#room-name').should('have.text', '').type('New Room');

      // Create new room
      cy.get('.p-button').eq(1).should('contain', 'rooms.create.ok').click();
    });

    cy.wait('@createRoomRequest');

    // Check that error gets displayed
    cy.get('[data-test=room-create-dialog]').contains('The Room type field is required.');
  });
});
