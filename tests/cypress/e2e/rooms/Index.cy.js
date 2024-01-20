describe('room index spec', () => {

  beforeEach(()=>{
    cy.init();
    cy.intercept('GET', 'api/v1/roomTypes*', {fixture: 'exampleRoomTypes.json'}).as('roomTypeRequest');
    cy.intercept('GET', 'api/v1/rooms?*', {fixture: 'exampleRoomsResponse.json'}).as('roomRequest');
  });

  it('visit rooms', () => {
    cy.visit('/rooms');

    //check if buttons disabled ToDo overlay with spinner? / Could maybe cause problems (delay response?)
    cy.get('[data-cy="searchButton"]').should('be.disabled');
    cy.get('.form-group').should('be.disabled');
    cy.get('.dropdown-toggle').eq(2).should('be.disabled');
    cy.get('button').eq(5).should('be.disabled');
    cy.get('select').should('be.disabled');

    //check request
    cy.wait('@roomRequest').then(interception =>{
      expect(interception.request.query).to.contain({
        filter_all: '0',
        filter_own: '1',
        filter_public: '0',
        only_favorites: '0',
        sort_by: 'last_started'
      });
      // expect(interception.request.query.filter_own).to.equal('1');
      // expect(interception.request.query).to.contain({filter_public: '0'});
      // expect(interception.request.query.filter_shared).to.equal('1');
      // expect(interception.request.query.only_favorites).to.equal('0');
      // expect(interception.request.query.sort_by).to.equal('last_started');
    })

    cy.get('[data-cy="searchButton"]').should('not.be.disabled');
    cy.get('.form-group').should('not.be.disabled');
    cy.get('.dropdown-toggle').eq(2).should('not.be.disabled');
    cy.get('button').eq(4).should('not.be.visible');
    cy.get('button').eq(5).should('not.be.disabled');
    cy.get('select').should('not.be.disabled');

    //change size of viewport
    cy.viewport('iphone-7');

    cy.get('button').eq(4).should('be.visible');
    cy.get('button').eq(5).should('be.visible');
    cy.get('.form-group').should('not.be.visible');
    cy.get('select').should('not.be.visible');
    cy.get('.dropdown-toggle').eq(2).should('not.be.visible');

    //error
    cy.reload()
    cy.intercept('GET', 'api/v1/rooms?*', {statusCode:500}).as('roomRequest');
    cy.wait('@roomRequest');

    //could be used to change user
    cy.intercept('GET','api/v1/currentUser', {});
    cy.reload()
  })

})
