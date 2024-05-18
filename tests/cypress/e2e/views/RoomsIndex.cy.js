import {interceptIndefinitely} from "../../support/utils/interceptIndefinitely.js";

describe('Room Index', () => {
  beforeEach(()=>{
    cy.init();
    cy.intercept('GET', 'api/v1/roomTypes*', {fixture: 'exampleRoomTypes.json'}).as('roomTypeRequest');
  })

  it('check list of rooms', () => {
    const interception = interceptIndefinitely( 'GET','api/v1/rooms?*', {fixture: 'exampleRooms.json'}, 'roomRequest');


    cy.visit('/rooms');

    cy.get('.p-inputgroup').eq(0).within(()=>{
      cy.get('.p-inputtext').should('be.disabled');
      cy.get('.p-button').should('be.disabled');
    });

    cy.get('.p-inputgroup').eq(1).within(()=> {
      cy.get('.p-dropdown-label').should('have.attr', 'aria-disabled', 'true');
    })

    //ToDo finish testing loading

    cy.get('.p-inputgroup').eq(2).within(()=> {
      cy.get('.p-dropdown-label').should('have.attr', 'aria-disabled', 'true');
    }).then(()=>{
      interception.sendResponse();
    })

    cy.wait('@roomRequest').then(interception => { //ToDo delete again
      expect(interception.request.query).to.contain({
        filter_all: '0',
        filter_own: '1',
        filter_public: '0',
        only_favorites: '0',
        sort_by: 'last_started'
      });
    });

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

  //ToDo
})
