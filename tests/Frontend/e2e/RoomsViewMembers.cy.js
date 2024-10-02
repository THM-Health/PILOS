import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms view members', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomMembersRequest();
  });

  it('load members', function () {
    const roomMembersRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123/member*', { fixture: 'roomMembers.json' }, 'roomMembersRequest');
    cy.visit('/rooms/abc-def-123');

    cy.get('#tab-members').click();

    cy.url().should('include', '/rooms/abc-def-123#tab=members');

    // Check loading

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should('be.visible');

    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('be.disabled');
      cy.get('button').should('be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('be.disabled').then(() => {
      roomMembersRequest.sendResponse();
    });

    cy.wait('@roomMembersRequest');

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should('not.exist');

    // Check that loading is done
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('not.be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('not.be.disabled');

    // Check list of members
    cy.get('[data-test="room-member-item"]').should('have.length', 3);

    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'LR');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Rivera');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'LauraWRivera@domain.tld');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.participant');

    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'JW');
    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'Juan Walter');
    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'JuanMWalter@domain.tld');
    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'rooms.roles.moderator');

    cy.get('[data-test="room-member-item"]').eq(2).should('include.text', 'Tammy Law');
    cy.get('[data-test="room-member-item"]').eq(2).should('include.text', 'TammyGLaw@domain.tld');
    cy.get('[data-test="room-member-item"]').eq(2).should('include.text', 'rooms.roles.co_owner');
    cy.get('[data-test="room-member-item"]').eq(2).find('img').should('have.attr', 'src', 'test.jpg');
  });

  it('load members errors', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomMembersRequest');

    cy.visit('/rooms/abc-def-123#tab=members');
    cy.wait('@roomRequest');
    cy.wait('@roomMembersRequest');

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should('be.visible');

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('not.be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('not.be.disabled');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]').should('include.text', 'app.reload').click();
    cy.wait('@roomMembersRequest');

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should('not.exist');

    // Check if member is shown and contains the correct data
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Rivera');

    // Check that reload button does not exist
    cy.get('[data-test="loading-retry-button"]').should('not.exist');

    // Switch to next page with general error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait('@roomMembersRequest');

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('not.be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('not.be.disabled');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]').should('include.text', 'app.reload').click();
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    // Check if member is shown and contains the correct data
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Rivera');

    // Check that reload button does not exist
    cy.get('[data-test="loading-retry-button"]').should('not.exist');

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');

    // Switch to next page with 401 error
    // ToDo Change to custom command (difficult because members need to be loaded "normally" first)
    cy.fixture('room.json').then((room) => {
      room.data.current_user = null;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    // 401 error room that has no access code
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 401
    }).as('roomMembersRequest');

    cy.interceptRoomFilesRequest();
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomMembersRequest');

    // Check that room gets reloaded
    cy.wait('@roomRequest');

    // Check that file tab is shown
    cy.wait('@roomFilesRequest');
    cy.url().should('not.include', '#tab=members');
    cy.url().should('include', '/rooms/abc-def-123#tab=files');

    // Check that error message is shown
    cy.checkToastMessage('app.flash.unauthenticated');
    cy.contains('auth.login').should('be.visible');

    // Reload with logged in user and members
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'room.json' }).as('roomRequest');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.reload();
    cy.wait('@roomRequest');
    cy.get('#tab-members').click();

    // 401 error but room has an access code
    // Switch to next page with 401 error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 401
    }).as('roomMembersRequest');

    cy.fixture('room.json').then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomMembersRequest');

    // Check that room gets reloaded
    cy.wait('@roomRequest');

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');

    // Check that error message is shown
    cy.checkToastMessage('app.flash.unauthenticated');
    cy.contains('auth.login').should('be.visible');

    // 401 error but guests are forbidden
    // Reload with logged in user and members
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'room.json' }).as('roomRequest');
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.reload();
    cy.wait('@roomRequest');
    cy.get('#tab-members').click();

    // Switch to next page with 401 error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 401
    }).as('roomMembersRequest');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('roomRequest');

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomMembersRequest');

    // Check that room gets reloaded
    cy.wait('@roomRequest');

    // Check that the error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');
    cy.checkToastMessage('app.flash.unauthenticated');
    cy.contains('auth.login').should('be.visible');

    // Reload with logged in user and members
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'room.json' }).as('roomRequest');
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.reload();
    cy.wait('@roomRequest');
    cy.get('#tab-members').click();

    // respond with 403 error
    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.is_member = true;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    // 403 error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 403,
      body: {
        message: 'This action is unauthorized.'
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait('@roomMembersRequest');

    // Check that room gets reloaded
    cy.wait('@roomRequest');
    cy.wait('@roomMembersRequest');

    // Check that file tab is shown
    cy.wait('@roomFilesRequest');

    cy.url().should('not.include', '#tab=members');
    cy.url().should('include', '/rooms/abc-def-123#tab=files');

    // Check that error message is shown
    cy.checkToastMessage('app.flash.unauthorized');

    // Check auth errors when loading members
    cy.checkRoomAuthErrorsLoadingTab('GET', 'api/v1/rooms/abc-def-123/member*', 'members');
  });

  it('add new member', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest');

    cy.get('#overlay_menu').should('not.exist');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu').should('be.visible');

    // Click on add single user option
    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');

    cy.intercept('GET', '/api/v1/users/search?query=*', {
      statusCode: 200,
      body: {
        data: [
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', image: null },
          { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', image: null }
        ]
      }
    }).as('userSearchRequest');

    cy.get('.multiselect__content').should('not.be.visible');

    cy.get('[data-test="select-user-dropdown"]').should('include.text', 'rooms.members.modals.add.placeholder').click();

    cy.get('[data-test="select-user-dropdown"]').find('input').type('Laura');

    cy.wait('@userSearchRequest').then(interception => {
      expect(interception.request.query).to.contain({
        query: 'L'
      });
    });
    cy.wait('@userSearchRequest').then(interception => {
      expect(interception.request.query).to.contain({
        query: 'La'
      });
    });
    cy.wait('@userSearchRequest').then(interception => {
      expect(interception.request.query).to.contain({
        query: 'Lau'
      });
    });
    cy.wait('@userSearchRequest').then(interception => {
      expect(interception.request.query).to.contain({
        query: 'Laur'
      });
    });

    cy.wait('@userSearchRequest').then(interception => {
      expect(interception.request.query).to.contain({
        query: 'Laura'
      });
    });

    // Check if correct options are shown
    cy.get('.multiselect__content').should('be.visible');
    cy.get('.multiselect__option').should('have.length', 4);
    cy.get('.multiselect__option').eq(0)
      .should('include.text', 'Laura Rivera')
      .and('include.text', 'LauraWRivera@domain.tld')
      .and('be.visible');
    cy.get('.multiselect__option').eq(1)
      .should('include.text', 'Laura Walter')
      .and('include.text', 'LauraMWalter@domain.tld')
      .and('be.visible');
    cy.get('.multiselect__option').eq(2)
      .should('include.text', 'rooms.members.modals.add.no_result')
      .and('not.be.visible');
    cy.get('.multiselect__option').eq(3)
      .should('include.text', 'rooms.members.modals.add.no_options')
      .and('not.be.visible');

    // Select new user
    cy.get('.multiselect__option').eq(1).click();
    cy.get('.multiselect__content').should('not.be.visible');

    // Check that role checkboxes and labels are shown correctly
    cy.get('[data-test="participant-role-group"]').within(() => {
      cy.contains('rooms.roles.participant');
      cy.get('#participant-role').should('not.be.checked');
    });

    cy.get('[data-test="moderator-role-group"]').within(() => {
      cy.contains('rooms.roles.moderator');
      cy.get('#moderator-role').should('not.be.checked');
    });

    cy.get('[data-test="co-owner-role-group"]').within(() => {
      cy.contains('rooms.roles.co_owner');
      cy.get('#co_owner-role').should('not.be.checked');
    });

    // Select role (moderator)
    cy.get('#moderator-role').click();
    cy.get('#moderator-role').should('be.checked');

    // Add user to the room
    const addUserRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/member', {
      statusCode: 204
    }, 'addUserRequest');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data.push({ id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 2, image: null });
      roomMembers.meta.per_page = 4;
      roomMembers.meta.to = 4;
      roomMembers.meta.total = 4;
      roomMembers.meta.total_no_filter = 4;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="dialog-save-button"]').should('have.text', 'rooms.members.modals.add.add').click();

    // Check loading and send response
    cy.get('[data-test="select-user-dropdown"]').find('input').should('be.disabled');

    cy.get('#participant-role').should('be.disabled');
    cy.get('#moderator-role').should('be.disabled');
    cy.get('#co_owner-role').should('be.disabled');

    cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.cancel').and('be.disabled');
    cy.get('[data-test="dialog-save-button"]').should('be.disabled').then(() => {
      addUserRequest.sendResponse();
    });

    // Check that correct data was sent
    cy.wait('@addUserRequest').then(interception => {
      expect(interception.request.body).to.eql({
        user: 10,
        role: 2
      });
    });

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    // Check that new member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 4);

    cy.get('[data-test="room-member-item"]').eq(3).should('include.text', 'LW');
    cy.get('[data-test="room-member-item"]').eq(3).should('include.text', 'Laura Walter');
    cy.get('[data-test="room-member-item"]').eq(3).should('include.text', 'LauraMWalter@domain.tld');
    cy.get('[data-test="room-member-item"]').eq(3).should('include.text', 'rooms.roles.moderator');
  });

  it('add new member errors', function () {
    cy.visit('/rooms/abc-def-123#tab=members');
    cy.wait('@roomRequest');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');

    // Test 500 error on user search
    cy.intercept('GET', '/api/v1/users/search?query=*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('userSearchRequest');

    cy.get('[data-test="select-user-dropdown"]').click();
    cy.get('[data-test="select-user-dropdown"]').find('input').type('L');

    cy.wait('@userSearchRequest');

    // Check that dialog is still open and error message is shown
    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    cy.checkRoomAuthErrors(() => {
      cy.get('[data-test="room-members-add-button"]').click();
      cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();
      cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');
      cy.get('[data-test="select-user-dropdown"]').click();
      cy.get('[data-test="select-user-dropdown"]').find('input').type('a');
    }, 'GET', '/api/v1/users/search?query=*', 'members');

    // Reload page to check other errors
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'room.json' }).as('roomRequest');
    cy.reload();
    cy.wait('@roomRequest');
    cy.get('#tab-members').click();

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');

    cy.intercept('GET', '/api/v1/users/search?query=*', {
      statusCode: 200,
      body: {
        data: [
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', image: null },
          { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', image: null }
        ]
      }
    }).as('userSearchRequest');

    cy.get('[data-test="select-user-dropdown"]').click();
    cy.get('[data-test="select-user-dropdown"]').find('input').type('L');

    cy.wait('@userSearchRequest');

    // Select new user
    cy.get('.multiselect__content').should('be.visible');
    cy.get('.multiselect__option').should('have.length', 4);
    cy.get('.multiselect__option').eq(0)
      .should('include.text', 'Laura Rivera')
      .and('include.text', 'LauraWRivera@domain.tld')
      .and('be.visible');
    cy.get('.multiselect__option').eq(1)
      .should('include.text', 'Laura Walter')
      .and('include.text', 'LauraMWalter@domain.tld')
      .and('be.visible');
    cy.get('.multiselect__option').eq(2)
      .should('include.text', 'rooms.members.modals.add.no_result')
      .and('not.be.visible');
    cy.get('.multiselect__option').eq(3)
      .should('include.text', 'rooms.members.modals.add.no_options')
      .and('not.be.visible');
    cy.get('.multiselect__option').eq(1).click();
    cy.get('.multiselect__content').should('not.be.visible');

    // Try to add user to the room and respond with 422 error (role missing)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member', {
      statusCode: 422,
      body: {
        message: 'The Role field is required.',
        errors: {
          role: ['The Role field is required.']
        }
      }
    }).as('addUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@addUserRequest');

    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible').and('include.text', 'The Role field is required.');

    // Select role (participant)
    cy.get('#participant-role').click();

    // Try to add user to the room and respond with 422 error (user is already a member of the room)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid.',
        errors: {
          user: ['The user is already member of the room.']
        }
      }
    }).as('addUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@addUserRequest');

    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible').and('include.text', 'The user is already member of the room.');

    // Try to add user to the room and respond with 500 error
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('addUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@addUserRequest');

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    cy.checkRoomAuthErrors(() => {
      cy.get('[data-test="room-members-add-button"]').click();
      cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();
      cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');
      cy.get('[data-test="dialog-save-button"]').click();
    }, 'POST', '/api/v1/rooms/abc-def-123/member', 'members');
  });

  it('edit member', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.participant');

    // Open edit dialog
    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    cy.get('[data-test="room-members-edit-dialog"]').should('be.visible');

    // Check that roles are shown correctly
    cy.get('[data-test="participant-role-group"]').within(() => {
      cy.contains('rooms.roles.participant');
      cy.get('#participant-role').should('be.checked');
    });

    cy.get('[data-test="moderator-role-group"]').within(() => {
      cy.contains('rooms.roles.moderator');
      cy.get('#moderator-role').should('not.be.checked');
    });

    cy.get('[data-test="co-owner-role-group"]').within(() => {
      cy.contains('rooms.roles.co_owner');
      cy.get('#co_owner-role').should('not.be.checked');
    });

    // Select new role (moderator)
    cy.get('#moderator-role').click();
    cy.get('#participant-role').should('not.be.checked');
    cy.get('#moderator-role').should('be.checked');

    // Save changes
    const editUserRequest = interceptIndefinitely('PUT', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 204
    }, 'editUserRequest');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data[0].role = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="dialog-save-button"]').should('have.text', 'app.save').click();

    // Check loading and send response
    cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.cancel').and('be.disabled');
    cy.get('[data-test="dialog-save-button"]').should('be.disabled').then(() => {
      editUserRequest.sendResponse();
    });

    cy.wait('@editUserRequest').then(interception => {
      expect(interception.request.body).to.eql({
        role: 2
      });
    });

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    // Check that role was updated
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.moderator');
  });

  it('edit member errors', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    // Check with member gone
    cy.intercept('PUT', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 410,
      body: {
        message: 'The person is not a member of this room (anymore).'
      }
    }).as('editUserRequest');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(1, 3);
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;
      roomMembers.meta.total_no_filter = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@editUserRequest');

    // Check that room members get reloaded and dialog gets closed
    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    cy.get('[data-test="room-member-item"]').should('have.length', 2);

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"The person is not a member of this room (anymore)."}',
      'app.flash.server_error.error_code_{"statusCode":410}'
    ]);

    // Check with 500 error
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    cy.intercept('PUT', '/api/v1/rooms/abc-def-123/member/6', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('editUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@editUserRequest');

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-edit-dialog"]').should('be.visible');
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    cy.checkRoomAuthErrors(() => {
      cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();
      cy.get('[data-test="dialog-save-button"]').click();
    }, 'PUT', '/api/v1/rooms/abc-def-123/member/6', 'members');
  });

  it('delete member', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').should('have.length', 3);

    // Open delete member dialog
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();
    cy.get('[data-test="room-members-delete-dialog"]').should('be.visible');

    // Check that dialog shows correct data
    cy.get('[data-test="room-members-delete-dialog"]')
      .should('be.visible')
      .should('include.text', 'rooms.members.modals.remove.title')
      .should('include.text', 'rooms.members.modals.remove.confirm_{"firstname":"Laura","lastname":"Rivera"}');

    // Confirm delete of member
    const deleteMemberRequest = interceptIndefinitely('DELETE', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 204
    }, 'deleteMemberRequest');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(1, 3);
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;
      roomMembers.meta.total_no_filter = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="dialog-continue-button"]').should('have.text', 'app.yes').click();
    cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.no').and('be.disabled');
    cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
      deleteMemberRequest.sendResponse();
    });

    cy.wait('@deleteMemberRequest');
    cy.wait('@roomMembersRequest');

    // Check that member was deleted
    cy.get('[data-test="room-member-item"]').should('have.length', 2);

    // Check that delete dialog is closed
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');
  });

  it('delete member errors', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').should('have.length', 3);

    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();

    // Check delete with member gone
    cy.intercept('DELETE', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 410,
      body: {
        message: 'The person is not a member of this room (anymore).'
      }
    }).as('deleteMemberRequest');

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(1, 3);
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;
      roomMembers.meta.total_no_filter = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@deleteMemberRequest');
    cy.wait('@roomMembersRequest');

    // Check that user list was updated and dialog is closed
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-member-item"]').should('have.length', 2);

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"The person is not a member of this room (anymore)."}',
      'app.flash.server_error.error_code_{"statusCode":410}'
    ]);

    // Check with 500 error
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();

    // Check delete with member gone
    cy.intercept('DELETE', '/api/v1/rooms/abc-def-123/member/6', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('deleteMemberRequest');

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@deleteMemberRequest');

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-delete-dialog"]').should('be.visible');
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');

    cy.checkRoomAuthErrors(() => {
      cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    }, 'DELETE', '/api/v1/rooms/abc-def-123/member/6', 'members');
  });

  it('search members', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query.search).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    // Check with no members found for this search query
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [];
      roomMembers.meta.from = null;
      roomMembers.meta.to = null;
      roomMembers.meta.total = 0;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="room-members-search"] > input').type('Test');
    cy.get('[data-test="room-members-search"] > button').click();

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Test',
        page: '1'
      });
    });

    // Check if correct message is shown and no members are displayed
    cy.get('[data-test="room-member-item"]').should('have.length', 0);
    cy.contains('app.filter_no_results').should('be.visible');

    // Check with no members in room
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [];
      roomMembers.meta.from = null;
      roomMembers.meta.to = null;
      roomMembers.meta.total = 0;
      roomMembers.meta.total_no_filter = 0;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="room-members-search"] > input').clear();
    cy.get('[data-test="room-members-search"]').type('Test2');
    cy.get('[data-test="room-members-search"] > input').type('{enter}');

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Test2',
        page: '1'
      });
    });

    // Check if correct message is shown and no members are displayed
    cy.get('[data-test="room-member-item"]').should('have.length', 0);
    cy.contains('rooms.members.nodata').should('be.visible');

    // Check with 2 members on 2 pages
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 2;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;
      roomMembers.meta.total = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="room-members-search"] > input').clear();
    cy.get('[data-test="room-members-search"]').type('Laura');
    cy.get('[data-test="room-members-search"] > button').click();

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Laura',
        page: '1'
      });
    });

    // Check that correct member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Rivera');

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should('have.length', 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');

    // Switch to next page
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [{ id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 1, image: null }];
      roomMembers.meta.current_page = 2;
      roomMembers.meta.last_page = 2;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.from = 2;
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing the page
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Laura',
        page: '2'
      });
    });

    cy.get('[data-test="room-members-search"] > input').should('have.value', 'Laura');

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(1).should('have.attr', 'data-p-active', 'true');

    // Check that correct member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Walter');

    // Change search query and make sure that the page is reset
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 2;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;
      roomMembers.meta.total = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="room-members-search"] > input').clear();
    cy.get('[data-test="room-members-search"]').type('Laur');
    cy.get('[data-test="room-members-search"] > button').click();

    // Check that members are loaded with the page reset to the first page
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Laur',
        page: '1'
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');
  });

  it('filter members', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    cy.get('[data-test="filter-dropdown-items"]').should('not.exist');

    // Check that correct filter is displayed
    cy.get('[data-test="filter-dropdown"]').should('have.text', 'rooms.members.filter.all').click();

    cy.get('[data-test="filter-dropdown-items"]').should('be.visible').within(() => {
      // check that filter options are shown correctly

      cy.get('[data-test=filter-dropdown-option]').should('have.length', 4);

      cy.get('[data-test=filter-dropdown-option]').eq(0).should('have.text', 'rooms.members.filter.all');
      cy.get('[data-test=filter-dropdown-option]').eq(0).should('have.attr', 'aria-selected', 'true');
      cy.get('[data-test=filter-dropdown-option]').eq(1).should('have.text', 'rooms.members.filter.participant_role');
      cy.get('[data-test=filter-dropdown-option]').eq(2).should('have.text', 'rooms.members.filter.moderator_role');
      cy.get('[data-test=filter-dropdown-option]').eq(3).should('have.text', 'rooms.members.filter.co_owner_role');
    });

    // Change filter and respond with no members found for this filter
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [];
      roomMembers.meta.from = null;
      roomMembers.meta.to = null;
      roomMembers.meta.total = 0;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test=filter-dropdown-option]').eq(1).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter: 'participant_role',
        page: '1'
      });
    });

    cy.get('[data-test=filter-dropdown]').should('have.text', 'rooms.members.filter.participant_role');

    // Check if correct message is shown and no members are displayed
    cy.contains('app.filter_no_results').should('be.visible');
    cy.get('[data-test="room-member-item"]').should('have.length', 0);
    cy.get('[data-test=filter-dropdown-items]').should('have.length', 0);

    // Change filter again and respond with no members in room
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [];
      roomMembers.meta.from = null;
      roomMembers.meta.to = null;
      roomMembers.meta.total = 0;
      roomMembers.meta.total_no_filter = 0;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test=filter-dropdown]').click();
    cy.get('[data-test=filter-dropdown-option]').eq(2).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter: 'moderator_role',
        page: '1'
      });
    });

    cy.get('[data-test=filter-dropdown]').should('have.text', 'rooms.members.filter.moderator_role');

    // Check if correct message is shown and no members are displayed
    cy.contains('rooms.members.nodata').should('be.visible');
    cy.get('[data-test="room-member-item"]').should('have.length', 0);
    cy.get('[data-test=filter-dropdown-items]').should('have.length', 0);

    // Change filter again and respond with 2 members on 2 pages
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.data[0].role = 3;
      roomMembers.meta.last_page = 2;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;
      roomMembers.meta.total = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test=filter-dropdown]').click();
    cy.get('[data-test=filter-dropdown-option]').eq(3).click();

    // Check that correct filter is sent with request and check that correct filter is displayed
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter: 'co_owner_role',
        page: '1'
      });
    });

    cy.get('[data-test=filter-dropdown]').should('have.text', 'rooms.members.filter.co_owner_role');

    // Check that correct member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Rivera');

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should('have.length', 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');

    // Switch to next page
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [{ id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 3, image: null }];
      roomMembers.meta.current_page = 2;
      roomMembers.meta.last_page = 2;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.from = 2;
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check that the filter stayed the same after changing the page
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter: 'co_owner_role',
        page: '2'
      });
    });

    cy.get('[data-test=filter-dropdown]').should('have.text', 'rooms.members.filter.co_owner_role');

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(1).should('have.attr', 'data-p-active', 'true');

    // Check that correct member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Walter');

    // Change filter again (reset filter) and make sure that the page is reset
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 2;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;
      roomMembers.meta.total = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test=filter-dropdown]').click();
    cy.get('[data-test=filter-dropdown-option]').eq(0).click();

    // Check that filter and page were reset
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query.filter).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');
  });

  it('sort members', function () {
    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'lastname',
        sort_direction: 'asc',
        page: '1'
      });
    });

    cy.get('[data-test="sorting-type-dropdown-items"]').should('not.exist');

    // Check that correct sorting type is displayed
    cy.get('[data-test="sorting-type-dropdown"]').should('have.text', 'app.lastname').click();

    cy.get('[data-test="sorting-type-dropdown-items"]').should('be.visible').within(() => {
      cy.get('[data-test=sorting-type-dropdown-option]').should('have.length', 2);
      cy.get('[data-test=sorting-type-dropdown-option]').eq(0).should('have.text', 'app.firstname');
      cy.get('[data-test=sorting-type-dropdown-option]').eq(1).should('have.text', 'app.lastname');
      cy.get('[data-test=sorting-type-dropdown-option]').eq(1).should('have.attr', 'aria-selected', 'true');

      // Change sorting type and respond with 3 members on 3 different pages
      cy.fixture('roomMembers.json').then(roomMembers => {
        roomMembers.data = roomMembers.data.slice(0, 1);
        roomMembers.meta.last_page = 3;
        roomMembers.meta.per_page = 1;
        roomMembers.meta.to = 1;

        cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
          statusCode: 200,
          body: roomMembers
        }).as('roomMembersRequest');
      });

      cy.get('[data-test=sorting-type-dropdown-option]').eq(0).click();
    });

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'firstname',
        sort_direction: 'asc',
        page: '1'
      });
    });

    cy.get('[data-test=sorting-type-dropdown-items]').should('not.exist');

    cy.get('[data-test=sorting-type-dropdown]').should('have.text', 'app.firstname');

    // Check that correct member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Laura Rivera');

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should('have.length', 3);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');

    // Switch to next page
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(1, 2);
      roomMembers.meta.current_page = 2;
      roomMembers.meta.from = 2;
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'firstname',
        sort_direction: 'asc',
        page: '2'
      });
    });

    cy.get('[data-test=sorting-type-dropdown]').should('have.text', 'app.firstname');

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(1).should('have.attr', 'data-p-active', 'true');

    // Check that correct member is shown
    cy.get('[data-test="room-member-item"]').should('have.length', 1);
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'Juan Walter');

    // Change sorting direction and make sure that the page is reset
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="sorting-type-inputgroup"]').find('button').click();

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'firstname',
        sort_direction: 'desc',
        page: '1'
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');

    // Switch to next page
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(1, 2);
      roomMembers.meta.current_page = 2;
      roomMembers.meta.from = 2;
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 2;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'firstname',
        sort_direction: 'desc',
        page: '2'
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(1).should('have.attr', 'data-p-active', 'true');

    // Change sorting type and make sure that the page is reset
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = roomMembers.data.slice(0, 1);
      roomMembers.meta.last_page = 3;
      roomMembers.meta.per_page = 1;
      roomMembers.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test=sorting-type-dropdown]').click();
    cy.get('[data-test=sorting-type-dropdown-option]').eq(1).click();

    // Check that members are loaded with the page reset to the first page
    cy.wait('@roomMembersRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'lastname',
        sort_direction: 'desc',
        page: '1'
      });
    });

    cy.get('[data-test=sorting-type-dropdown]').should('have.text', 'app.lastname');

    // Check that correct pagination is active
  });

  it('check button visibility co_owner', function () {
    cy.fixture('room').then(room => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      });
    });

    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data.unshift({ id: 1, firstname: 'John', lastname: 'Doe', email: 'JohnDoe@domain.tld', role: 3, image: null });
      roomMembers.meta.per_page = 4;
      roomMembers.meta.to = 4;
      roomMembers.meta.total = 4;
      roomMembers.meta.total_no_filter = 4;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.visit('/rooms/abc-def-123#tab=members');

    // Check that add buttons are shown
    cy.get('[data-test="room-members-add-button"]').should('be.visible').click();
    cy.get('#overlay_menu_0').should('be.visible').and('have.text', 'rooms.members.add_single_user');
    cy.get('#overlay_menu_1').should('be.visible').and('have.text', 'rooms.members.bulk_import_users');

    // Check that checkbox to select all members is shown
    cy.get('[data-test="room-members-select-all-checkbox"]').should('be.visible');

    // Check that all users are shown
    cy.get('[data-test="room-member-item"]').should('have.length', 4);

    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'JD');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'John Doe');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'JohnDoe@domain.tld');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.co_owner');
    cy.get('[data-test="room-member-item"]').eq(0).within(() => {
      cy.get('[data-test="room-members-edit-button"]').should('not.exist');
      cy.get('[data-test="room-members-delete-button"]').should('not.exist');
    });

    // Check that checkbox of current user (co_owner) is disabled
    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('input')
      .should('be.disabled')
      .and('not.be.checked');

    // Check that checkbox to select other members is not disabled and edit and delete buttons are shown
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.disabled');
    cy.get('[data-test="room-member-item"]').eq(1).within(() => {
      cy.get('[data-test="room-members-edit-button"]');
      cy.get('[data-test="room-members-delete-button"]');
    });

    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.disabled');
    cy.get('[data-test="room-member-item"]').eq(2).within(() => {
      cy.get('[data-test="room-members-edit-button"]');
      cy.get('[data-test="room-members-delete-button"]');
    });

    cy.get('[data-test="room-member-item"]').eq(3).find('input').should('not.be.disabled');
    cy.get('[data-test="room-member-item"]').eq(3).within(() => {
      cy.get('[data-test="room-members-edit-button"]');
      cy.get('[data-test="room-members-delete-button"]');
    });

    // Check that checkbox of current user (co_owner) is not selected when selecting all members
    cy.get('[data-test="room-members-select-all-checkbox"]').click();

    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('input')
      .should('be.disabled')
      .and('not.be.checked');

    // Check that other users are selected
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(3).find('input').should('be.checked');

    // Check that bulk edit and bulk delete buttons are shown
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('be.visible');

    cy.get('[data-test="room-members-bulk-edit-button"]').click();

    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('include.text', 'rooms.members.modals.edit.title_bulk_{"numberOfSelectedUsers":3}');
    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('[data-test="dialog-cancel-button"]').click();

    // Reload members with only self as member (role co_owner)
    cy.fixture('roomMembers.json').then(roomMembers => {
      roomMembers.data = [{ id: 1, firstname: 'John', lastname: 'Doe', email: 'JohnDoe@domain.tld', role: 3, image: null }];
      roomMembers.meta.to = 1;
      roomMembers.meta.total = 1;
      roomMembers.meta.total_no_filter = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: roomMembers
      }).as('roomMembersRequest');
    });

    cy.get('[data-test="room-members-reload-button"]').click();

    // Check that select all checkbox is hidden
    cy.get('[data-test="room-members-select-all-checkbox"]').should('not.exist');
  });

  it('check button visibility with rooms.viewAll and rooms.manage permissions', function () {
    // Check with rooms.viewAll permission
    cy.fixture('currentUser.json').then(currentUser => {
      currentUser.data.permissions = ['rooms.viewAll'];
      cy.intercept('GET', 'api/v1/currentUser', {
        statusCode: 200,
        body: currentUser
      });
    });

    cy.fixture('room').then(room => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.allow_membership = true;
      room.data.current_user.permissions = ['rooms.viewAll'];

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.visit('/rooms/abc-def-123#tab=members');

    cy.wait('@roomRequest');
    cy.wait('@roomMembersRequest');

    // Check that add buttons are hidden
    cy.get('[data-test="room-members-add-button"]').should('not.exist');

    // Check that checkbox to select all members is hidden
    cy.get('[data-test="room-members-select-all-checkbox"]').should('not.exist');

    // Check that all users are shown
    cy.get('[data-test="room-member-item"]').should('have.length', 3);

    // Check that checkboxes and edit and delete buttons are not shown
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('not.exist');
    cy.get('[data-test="room-member-item"]').eq(0).within(() => {
      cy.get('[data-test="room-members-edit-button"]').should('not.exist');
      cy.get('[data-test="room-members-delete-button"]').should('not.exist');
    });

    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.exist');
    cy.get('[data-test="room-member-item"]').eq(1).within(() => {
      cy.get('[data-test="room-members-edit-button"]').should('not.exist');
      cy.get('[data-test="room-members-delete-button"]').should('not.exist');
    });

    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.exist');
    cy.get('[data-test="room-member-item"]').eq(2).within(() => {
      cy.get('[data-test="room-members-edit-button"]').should('not.exist');
      cy.get('[data-test="room-members-delete-button"]').should('not.exist');
    });

    // Reload with rooms.manage permission
    cy.fixture('currentUser.json').then(currentUser => {
      currentUser.data.permissions = ['rooms.create', 'rooms.viewAll', 'rooms.manage'];
      cy.intercept('GET', 'api/v1/currentUser', {
        statusCode: 200,
        body: currentUser
      });
    });

    cy.fixture('room').then(room => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.allow_membership = true;
      room.data.current_user.permissions = ['rooms.create', 'rooms.viewAll', 'rooms.manage'];

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.reload();

    cy.wait('@roomRequest');
    cy.wait('@roomMembersRequest');

    // Check that add buttons are shown
    cy.get('[data-test="room-members-add-button"]').should('be.visible').click();
    cy.get('#overlay_menu_0').should('be.visible').and('have.text', 'rooms.members.add_single_user');
    cy.get('#overlay_menu_1').should('be.visible').and('have.text', 'rooms.members.bulk_import_users');

    // Check that checkbox to select all members is shown
    cy.get('[data-test="room-members-select-all-checkbox"]').should('be.visible');

    // Check that all users are shown
    cy.get('[data-test="room-member-item"]').should('have.length', 3);

    // Check that checkboxes are not disabled and edit and delete buttons are shown
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('not.be.disabled');
    cy.get('[data-test="room-member-item"]').eq(0).within(() => {
      cy.get('[data-test="room-members-edit-button"]');
      cy.get('[data-test="room-members-delete-button"]');
    });

    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.disabled');
    cy.get('[data-test="room-member-item"]').eq(1).within(() => {
      cy.get('[data-test="room-members-edit-button"]');
      cy.get('[data-test="room-members-delete-button"]');
    });

    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.disabled');
    cy.get('[data-test="room-member-item"]').eq(2).within(() => {
      cy.get('[data-test="room-members-edit-button"]');
      cy.get('[data-test="room-members-delete-button"]');
    });

    // Select all users
    cy.get('[data-test="room-members-select-all-checkbox"]').click();

    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('be.checked');

    // Check that bulk edit and bulk delete buttons are shown
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('be.visible');
  });
});
