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
      cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test=filter-button]').should('not.be.visible');

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-select-label')
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
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test=filter-button]').should('not.be.visible');

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').should('have.length', 3);

    cy.get('[data-test="room-card"]').eq(0).should('contain', 'Meeting One');
    cy.get('[data-test="room-card"]').eq(0).should('contain', 'John Doe');
    cy.get('[data-test="room-card"]').eq(0).should('contain', 'rooms.index.room_component.never_started');
    cy.get('[data-test="room-card"]').eq(0).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-123');
    });
    cy.get('[data-test="room-card"]').eq(1).should('contain', 'Meeting Two');
    cy.get('[data-test="room-card"]').eq(1).should('contain', 'John Doe');
    cy.get('[data-test="room-card"]').eq(1).should('contain', 'rooms.index.room_component.running_since');
    cy.get('[data-test="room-card"]').eq(1).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/def-abc-123');
    });
    cy.get('[data-test="room-card"]').eq(2).should('contain', 'Meeting Three');
    cy.get('[data-test="room-card"]').eq(2).should('contain', 'John Doe');
    cy.get('[data-test="room-card"]').eq(2).should('contain', 'rooms.index.room_component.last_ran_till');
    cy.get('[data-test="room-card"]').eq(2).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/def-abc-456');
    });
  });

  it('click on room card to open room view', function () {
    cy.interceptRoomViewRequests();
    cy.visit('/rooms');
    cy.wait('@roomRequest');

    cy.get('[data-test="room-card"]').eq(0).click();

    cy.url().should('include', '/rooms/abc-def-123');
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

    // Check that error message gets shown
    cy.get('.p-toast')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

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
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' });
    // Check if reload button exists and click it
    cy.get('[data-test=reload-button]').should('include.text', 'app.reload').click();

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').as('rooms').should('have.length', 3);

    cy.get('[data-test="room-card"]').eq(0).should('include.text', 'Meeting One');
    cy.get('[data-test="room-card"]').eq(1).should('include.text', 'Meeting Two');
    cy.get('[data-test="room-card"]').eq(2).should('include.text', 'Meeting Three');

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
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
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
    cy.get('.p-toast')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

    const roomTypeInterception = interceptIndefinitely('GET', 'api/v1/roomTypes*', { fixture: 'exampleRoomTypes.json' });

    // Check that room type select is shown correctly and click on reload button
    cy.get('[data-test=room-type-dropdown').should('not.exist');
    cy.get('[data-test=room-type-inputgroup]').should('include.text', 'rooms.room_types.loading_error').within(() => {
      cy.get('.p-button').click();
      // Check that button is disabled after click
      cy.get('.p-button').should('be.disabled').and('have.class', 'p-button-loading').then(() => {
        // Send correct response and check that reload button does not exist after reload
        roomTypeInterception.sendResponse();
        cy.get('.p-button').should('not.exist');
      });
    });

    // Check that dropdown exists and error message is not shown after correct response
    cy.get('[data-test=room-type-dropdown');
    cy.get('[data-test=room-type-inputgroup]').should('not.include.text', 'rooms.room_types.loading_error');
  });
});
