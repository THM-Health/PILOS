import {interceptIndefinitely} from "../../support/utils/interceptIndefinitely.js";

describe('Room Index', () => {
  beforeEach(()=>{
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  //ToDo?? Visit with user that is not logged in (Create command for this)

  it('check list of rooms', () => {
    const interception = interceptIndefinitely( 'GET','api/v1/rooms?*', {fixture: 'exampleRooms.json'}, 'roomRequest');

    cy.visit('/rooms');

    // Test loading
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(()=>{
      cy.get('.p-inputtext').should('be.disabled');
      cy.get('.p-button').should('be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(()=>{
      cy.get('.p-dropdown-label').should('have.attr', 'aria-disabled', 'true');
    });
    //ToDo?? filter button for small devices does not exist

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(()=> {
      cy.get('.p-dropdown-label').should('have.attr', 'aria-disabled', 'true');
    }).then(()=>{
      interception.sendResponse();
    });

    // Check if rooms are shown and contain the correct data
    cy.get('.room-card').as('rooms').should('have.length', 3);

    cy.get('@rooms').eq(0).should('contain', 'Meeting One');
    cy.get('@rooms').eq(0).should('contain', 'John Doe');
    cy.get('@rooms').eq(0).should('contain', 'rooms.index.room_component.never_started');
    cy.get('@rooms').eq(0).within(()=>{
      cy.get('a').should('have.attr','href', '/rooms/abc-def-123');
    });
    cy.get('@rooms').eq(1).should('contain', 'Meeting Two');
    cy.get('@rooms').eq(1).should('contain', 'John Doe');
    cy.get('@rooms').eq(1).should('contain', 'rooms.index.room_component.running_since');
    cy.get('@rooms').eq(1).within(()=>{
      cy.get('a').should('have.attr','href', '/rooms/def-abc-123');
    });
    cy.get('@rooms').eq(2).should('contain','Meeting Three');
    cy.get('@rooms').eq(2).should('contain', 'John Doe');
    cy.get('@rooms').eq(2).should('contain', 'rooms.index.room_component.last_ran_till');
    cy.get('@rooms').eq(2).within(()=>{
      cy.get('a').should('have.attr','href', '/rooms/def-abc-456');
    });

  });

  it('error loading rooms', () => {
    cy.intercept('GET', 'api/v1/rooms*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms');

    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    // Check that components are not disabled
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(()=>{
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(()=>{
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(()=> {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    //ToDo filter button for small devices does not exist

    cy.intercept('GET', 'api/v1/rooms*', {fixture: 'exampleRooms.json'});
    // Check if reload button exists and click it
    cy.get('[data-test=reload-button]').should('contain', 'app.reload').click();

    // Check if rooms are shown and contain the correct data
    cy.get('.room-card').as('rooms').should('have.length', 3);

    //Check that reload button does not exist
    cy.get('[data-test=reload-button]').should('not.exist');

    // Check that components are not disabled
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(()=>{
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(()=>{
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(()=> {
      cy.get('.p-dropdown-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    //ToDo filter button for small devices does not exist
  });

  it('error loading room types', () => {
    cy.intercept('GET', 'api/v1/roomTypes', {
      statusCode:500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms');

    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    cy.intercept('GET', 'api/v1/roomTypes*', {fixture: 'exampleRoomTypes.json'});

    cy.get('[data-test=room-type-dropdown').should('not.exist');
    cy.get('[data-test=room-type-inputgroup]').should('contain', 'rooms.room_types.loading_error').within(()=>{
      cy.get('button').click(); //ToDo loading??
    });

    cy.get('[data-test=room-type-dropdown');
    cy.get('[data-test=room-type-inputgroup]').should('not.contain', 'rooms.room_types.loading_error')

  });

  //ToDo other tests
});
