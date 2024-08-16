describe('Rooms view members bulk', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomMembersRequest();
  });

  it('bulk edit members', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    // Check that edit button is hidden when no users are selected
    cy.get('[data-test="room-members-bulk-edit-button"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');

    // Check that no user is selected and select first user
    cy.get('[data-test="room-member-item').should('have.length', 3);
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('not.be.checked').click();
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.checked');

    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.checked');

    // Check that correct roles are shown
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.participant');
    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'rooms.roles.moderator');
    cy.get('[data-test="room-member-item"]').eq(2).should('include.text', 'rooms.roles.co_owner');

    // Check that edit button is shown and open bulk edit dialog
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible').click();

    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('be.visible').within(() => {
      cy.contains('rooms.members.modals.edit.title_bulk_{"numberOfSelectedUsers":1}').should('be.visible');

      // Check that roles are shown correctly
      cy.get('[data-test="participant-role-group"]').within(() => {
        cy.contains('rooms.roles.participant');
        cy.get('#participant-role').should('not.be.checked').and('have.value', 1);
      });

      cy.get('[data-test="participant-moderator-group"]').within(() => {
        cy.contains('rooms.roles.moderator');
        cy.get('#participant-moderator').should('not.be.checked').and('have.value', 2);
      });

      cy.get('[data-test="participant-co_owner-group"]').within(() => {
        cy.contains('rooms.roles.co_owner');
        cy.get('#participant-co_owner').should('not.be.checked').and('have.value', 3);
      });

      // Select moderator role and save
      cy.get('#participant-moderator').click();

      cy.intercept('PUT', 'api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }).as('bulkEditRequest');

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

      cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.cancel');
      cy.get('[data-test="dialog-save-button"]').should('have.text', 'app.save').click();
    });

    cy.wait('@bulkEditRequest').then(interception => {
      expect(interception.request.body).to.deep.equal({
        role: 2,
        users: [5]
      });
    });
    cy.wait('@roomMembersRequest');

    // Check that bulk edit dialog is closed and bulk edit button is hidden
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-edit-button"]').should('not.exist');

    // Check that correct roles are shown and first user is not selected
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.moderator');
    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'rooms.roles.moderator');
    cy.get('[data-test="room-member-item"]').eq(2).should('include.text', 'rooms.roles.co_owner');

    // Select all users
    cy.get('[data-test="room-members-select-all-checkbox"]').click();

    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('be.checked');

    // Open bulk edit dialog
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible').click();

    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('be.visible').within(() => {
      cy.contains('rooms.members.modals.edit.title_bulk_{"numberOfSelectedUsers":3}').should('be.visible');

      // Select participant role and save
      // Select moderator role and save
      cy.get('#participant-role').click();

      cy.intercept('PUT', 'api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }).as('bulkEditRequest');

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 1, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 1, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
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

      cy.get('[data-test="dialog-save-button"]').click();
    });

    cy.wait('@bulkEditRequest').then(interception => {
      expect(interception.request.body).to.deep.equal({
        role: 1,
        users: [5, 6, 7]
      });
    });
    cy.wait('@roomMembersRequest');

    // Check that correct roles are shown and no user is selected
    cy.get('[data-test="room-member-item"]').eq(0).should('include.text', 'rooms.roles.participant');
    cy.get('[data-test="room-member-item"]').eq(1).should('include.text', 'rooms.roles.participant');
    cy.get('[data-test="room-member-item"]').eq(2).should('include.text', 'rooms.roles.participant');

    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.checked');

    // Check that bulk edit dialog is closed and bulk edit button is hidden
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-edit-button"]').should('not.exist');
  });

  it('bulk edit members errors', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    // Select all users
    cy.get('[data-test="room-members-select-all-checkbox"]').click();

    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible').click();

    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('be.visible');

    // Check with 422 error (role field is required)
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 422,
      body: {
        message: 'The Role field is required.',
        errors: {
          role: ['The Role field is required.']
        }
      }
    }).as('bulkEditRequest');

    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('[data-test="dialog-save-button"]').click();
    cy.wait('@bulkEditRequest');

    // Check that dialog is still shown and error is displayed
    cy.get('[data-test="room-members-bulk-edit-dialog"]')
      .should('be.visible')
      .and('include.text', 'The Role field is required.');

    // Select moderator role
    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('#participant-moderator').click();

    // ToDo 422 error (the user ... isn't a member) (fix display of error message first)

    // Check with 500 error
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('bulkEditRequest');

    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('[data-test="dialog-save-button"]').click();
    cy.wait('@bulkEditRequest');

    // Check that the dialog is closed and error is displayed
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that users are still selected
    cy.get('[data-test="room-members-select-all-checkbox"] > input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('be.checked');

    // Open bulk edit dialog again
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible').click();
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('be.visible');
    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('#participant-moderator').click();

    // Check with 401 error
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 401
    }).as('bulkEditRequest');

    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('[data-test="dialog-save-button"]').click();
    cy.wait('@bulkEditRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.checkToastMessage('app.flash.unauthenticated', false);
  });
});
