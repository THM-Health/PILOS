import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms view members', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomMembersRequest();
  });

  it('load members', function () {
    const roomMembersRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123/member*', { fixture: 'exampleRoomMembers.json' }, 'roomMembersRequest');
    cy.visit('/rooms/abc-def-123');

    cy.get('#tab-members').click();

    cy.url().should('include', '/rooms/abc-def-123#members');

    // Check loading
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('be.disabled');
      cy.get('button').should('be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-inputgroup"').within(() => {
      cy.get('[data-test="sorting-dropdown"').within(() => {
        cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('be.disabled').then(() => {
      roomMembersRequest.sendResponse();
    });

    cy.wait('@roomMembersRequest');

    // Check that loading is done
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-inputgroup"').within(() => {
      cy.get('[data-test="sorting-dropdown"').within(() => {
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
    cy.get('[data-test="room-member-item"]').eq(2).find('img').should('have.attr', 'src', 'http://domain.tld/storage/profile_images/1234abc.jpg');
  });

  it('load members errors', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomMembersRequest');

    cy.visit('/rooms/abc-def-123#members');
    cy.wait('@roomMembersRequest');

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Check that components are not disabled
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-inputgroup"').within(() => {
      cy.get('[data-test="sorting-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('not.be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('not.be.disabled');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5,
            firstname: 'Laura',
            lastname: 'Rivera',
            email: 'LauraWRivera@domain.tld',
            role: 1,
            image: null
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3
        }
      }
    }).as('roomMembersRequest');

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]').should('include.text', 'app.reload').click();
    cy.wait('@roomMembersRequest');

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
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Check that components are not disabled
    cy.get('[data-test="room-members-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-inputgroup"').within(() => {
      cy.get('[data-test="sorting-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-members-add-button"]').should('not.be.disabled');

    cy.get('[data-test="room-members-reload-button"]').should('not.be.disabled');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5,
            firstname: 'Laura',
            lastname: 'Rivera',
            email: 'LauraWRivera@domain.tld',
            role: 1,
            image: null
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3
        }
      }
    }).as('roomMembersRequest');

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

    // Check that correct pagination is active // ToDo fix error in pagination
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');

    // Switch to next page with 401 error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 401
    }).as('roomMembersRequest');

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait('@roomMembersRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');

    // Reload page with 401 error
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');
  });

  it('add new member', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    cy.get('#overlay_menu').should('not.exist');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu').should('be.visible');

    // Click on add single user option
    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');

    // Cancel add of new member
    cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.cancel').click();

    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    // Open dialog again

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu_0').click();

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
    cy.get('.multiselect__option').eq(0).should('include.text', 'Laura Rivera');
    cy.get('.multiselect__option').eq(0).should('include.text', 'LauraWRivera@domain.tld');
    cy.get('.multiselect__option').eq(1).should('include.text', 'Laura Walter');
    cy.get('.multiselect__option').eq(1).should('include.text', 'LauraMWalter@domain.tld');
    cy.get('.multiselect__option').eq(2).should('include.text', 'rooms.members.modals.add.no_result').and('not.be.visible');
    cy.get('.multiselect__option').eq(3).should('include.text', 'rooms.members.modals.add.no_options').and('not.be.visible');

    // Select new user
    cy.get('.multiselect__option').eq(1).click();
    cy.get('.multiselect__content').should('not.be.visible');

    // Check that role checkboxes and labels are shown correctly
    cy.get('[data-test="participant-role-group"]').within(() => {
      cy.contains('rooms.roles.participant');
      cy.get('#participant-role').should('not.be.checked');
    });

    cy.get('[data-test="participant-moderator-group"]').within(() => {
      cy.contains('rooms.roles.moderator');
      cy.get('#participant-moderator').should('not.be.checked');
    });

    cy.get('[data-test="participant-co_owner-group"]').within(() => {
      cy.contains('rooms.roles.co_owner');
      cy.get('#participant-co_owner').should('not.be.checked');
    });

    // Select role (moderator)
    cy.get('#participant-moderator').click();
    cy.get('#participant-moderator').should('be.checked');

    // Add user to the room
    const addUserRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/member', {
      statusCode: 204
    }, 'addUserRequest');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' },
          { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 2, image: null }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 4,
          to: 4,
          total: 4,
          total_no_filter: 4
        }
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="dialog-save-button"]').should('have.text', 'rooms.members.modals.add.add').click();

    // Check loading and send response
    cy.get('[data-test="dialog-cancel-button"]').and('be.disabled');
    cy.get('[data-test="dialog-save-button"]').should('be.disabled').then(() => {
      addUserRequest.sendResponse();
    });

    // Check that correct data was sent
    cy.wait('@addUserRequest').then(interception => {
      expect(interception.request.body).to.deep.equal({
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
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

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

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Check that dialog is still open
    cy.get('[data-test="room-members-add-single-dialog"]').should('be.visible');

    // Test 401 error on user search
    cy.intercept('GET', '/api/v1/users/search?query=*', {
      statusCode: 401
    }).as('userSearchRequest');

    cy.get('[data-test="select-user-dropdown"]').click();
    cy.get('[data-test="select-user-dropdown"]').find('input').type('a');

    cy.wait('@userSearchRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');

    // Reload page to check other errors

    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

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
    cy.get('.multiselect__option').eq(1).click();

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

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Make sure that dialog gets closed
    cy.get('[data-test="room-members-add-single-dialog"]').should('not.exist');

    // Open dialog again
    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu_0').should('have.text', 'rooms.members.add_single_user').click();

    // Try to add user to the room and respond with 500 error
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member', {
      statusCode: 401
    }).as('addUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@addUserRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');
  });

  it('edit member', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.participant');

    // Open edit dialog
    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    cy.get('[data-test="room-members-edit-dialog"]').should('be.visible');

    // Cancel edit member
    cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.cancel').click();

    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    // Open dialog again
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    cy.get('[data-test="room-members-edit-dialog"]').should('be.visible');

    // Check that roles are shown correctly
    cy.get('[data-test="participant-role-group"]').within(() => {
      cy.contains('rooms.roles.participant');
      cy.get('#participant-role').should('be.checked');
    });

    cy.get('[data-test="participant-moderator-group"]').within(() => {
      cy.contains('rooms.roles.moderator');
      cy.get('#participant-moderator').should('not.be.checked');
    });

    cy.get('[data-test="participant-co_owner-group"]').within(() => {
      cy.contains('rooms.roles.co_owner');
      cy.get('#participant-co_owner').should('not.be.checked');
    });

    // Select new role (moderator)
    cy.get('#participant-moderator').click();
    cy.get('#participant-role').should('not.be.checked');
    cy.get('#participant-moderator').should('be.checked');

    // Save changes
    const editUserRequest = interceptIndefinitely('PUT', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 204
    }, 'editUserRequest');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 2, image: null },
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 3,
          to: 3,
          total: 3,
          total_no_filter: 3
        }
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="dialog-save-button"]').should('have.text', 'app.save').click();

    // Check loading and send response
    cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
    cy.get('[data-test="dialog-save-button"]').should('be.disabled').then(() => {
      editUserRequest.sendResponse();
    });

    cy.wait('@editUserRequest').then(interception => {
      expect(interception.request.body).to.deep.equal({
        role: 2
      });
    });

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    // Check that role was updated
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.moderator');
  });

  it('edit member errors', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    // Check with member gone
    cy.intercept('PUT', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 410,
      body: {
        message: 'The person is not a member of this room (anymore).'
      }
    }).as('editUserRequest');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 3,
          to: 2,
          total: 2,
          total_no_filter: 2
        }
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@editUserRequest');

    // Check that room members get reloaded and dialog gets closed
    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    cy.get('[data-test="room-member-item"]').should('have.length', 2);

    // Check with 500 error
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    // Check with member gone
    cy.intercept('PUT', '/api/v1/rooms/abc-def-123/member/6', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('editUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@editUserRequest');

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    cy.get('[data-test="room-members-edit-dialog"]').should('not.exist');

    // Check with 401 error
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-edit-button"]').click();

    // Check with member gone
    cy.intercept('PUT', '/api/v1/rooms/abc-def-123/member/6', {
      statusCode: 401
    }).as('editUserRequest');

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait('@editUserRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');
  });

  it('delete member', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-member-item"]').should('have.length', 3);

    // Open delete member dialog
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();
    cy.get('[data-test="room-members-delete-dialog"]').should('be.visible');

    // Cancel delete of member
    cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.no').click();
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');

    // Open delete dialog again
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();

    // Check that dialog shows correct data
    cy.get('[data-test="room-members-delete-dialog"]')
      .should('be.visible')
      .should('include.text', 'rooms.members.modals.remove.title')
      .should('include.text', 'rooms.members.modals.remove.confirm_{"firstname":"Laura","lastname":"Rivera"}');

    // Confirm delete of member
    const deleteMemberRequest = interceptIndefinitely('DELETE', '/api/v1/rooms/abc-def-123/member/5', {
      statusCode: 204
    }, 'deleteMemberRequest');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 3,
          to: 2,
          total: 2,
          total_no_filter: 2
        }
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="dialog-continue-button"]').should('have.text', 'app.yes').click();
    cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
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
    cy.visit('/rooms/abc-def-123#members');

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

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 3,
          to: 2,
          total: 2,
          total_no_filter: 2
        }
      }
    }).as('roomMembersRequest');

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@deleteMemberRequest');
    cy.wait('@roomMembersRequest');

    // Check that user list was updated and dialog is closed
    cy.get('[data-test="room-member-item"]').should('have.length', 2);
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');

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

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Check that dialog is closed
    cy.get('[data-test="room-members-delete-dialog"]').should('not.exist');

    // Check with 401 error
    cy.get('[data-test="room-member-item"]').eq(0).find('[data-test="room-members-delete-button"]').click();

    // Check delete with member gone
    cy.intercept('DELETE', '/api/v1/rooms/abc-def-123/member/6', {
      statusCode: 401
    }).as('deleteMemberRequest');

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@deleteMemberRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('have.text', 'app.flash.unauthenticated');
  });
});
