import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

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

      cy.get('[data-test="participant-co-owner-group"]').within(() => {
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
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null }
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
      expect(interception.request.body).to.eql({
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
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 1, image: null }
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
      expect(interception.request.body).to.eql({
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

    // Close dialog
    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-bulk-edit-dialog"]').should('not.exist');

    // Check that users are still selected
    cy.get('[data-test="room-members-select-all-checkbox"] > input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('be.checked');

    // Open dialog again and select moderator role
    cy.get('[data-test="room-members-bulk-edit-button"]').should('be.visible').click();
    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('#participant-moderator').click();

    // Check with 422 error (one of the users isn't a member)
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 422,
      body: {
        message: 'The user \'Laura Rivera\' isn\'t a member.',
        errors: {
          'users.0': ['The user \'Laura Rivera\' isn\'t a member.']
        }
      }
    }).as('bulkEditRequest');

    cy.get('[data-test="room-members-bulk-edit-dialog"]').find('[data-test="dialog-save-button"]').click();
    cy.wait('@bulkEditRequest');

    // Check that dialog is still shown and error is displayed
    cy.get('[data-test="room-members-bulk-edit-dialog"]')
      .should('be.visible')
      .and('include.text', 'The user \'Laura Rivera\' isn\'t a member.');

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

  it('bulk delete members', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    // Check that delete button is hidden when no users are selected
    cy.get('[data-test="room-members-bulk-delete-button"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');

    // Check with 1 user
    // Check that no user is selected and select first user
    cy.get('[data-test="room-member-item').should('have.length', 3);
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('not.be.checked').click();
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.checked');

    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('not.be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('not.be.checked');

    // Check that delete button is shown and open bulk delete dialog
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('be.visible').click();

    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('be.visible').within(() => {
      cy.contains('rooms.members.modals.remove.title_bulk_{"numberOfSelectedUsers":1}').should('be.visible');
      cy.contains('rooms.members.modals.remove.confirm_bulk_{"numberOfSelectedUsers":1}').should('be.visible');

      cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }).as('bulkDeleteRequest');

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: {
          data: [
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null }
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

      cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.no');
      cy.get('[data-test="dialog-continue-button"]').should('have.text', 'app.yes').click();
    });

    cy.wait('@bulkDeleteRequest').then(interception => {
      expect(interception.request.body).to.eql({
        users: [5]
      });
    });
    cy.wait('@roomMembersRequest');

    // Check that bulk delete dialog is closed and bulk delete button is hidden
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('not.exist');

    // Check that user was removed
    cy.get('[data-test="room-member-item"]').should('have.length', 2);

    // Check with several users
    // Select the remaining two users and check if select all checkbox is checked
    cy.get('[data-test="room-member-item"]').eq(0).find('input').click();
    cy.get('[data-test="room-member-item"]').eq(1).find('input').click();

    cy.get('[data-test="room-members-select-all-checkbox"] > input').should('be.checked');

    // Open bulk delete dialog
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('be.visible').click();

    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('be.visible').within(() => {
      cy.contains('rooms.members.modals.remove.title_bulk_{"numberOfSelectedUsers":2}').should('be.visible');
      cy.contains('rooms.members.modals.remove.confirm_bulk_{"numberOfSelectedUsers":2}').should('be.visible');

      cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }).as('bulkDeleteRequest');

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: {
          data: [],
          meta: {
            current_page: 1,
            from: null,
            last_page: 1,
            per_page: 3,
            to: null,
            total: 0,
            total_no_filter: 0
          }
        }
      }).as('roomMembersRequest');

      cy.get('[data-test="dialog-cancel-button"]').should('have.text', 'app.no');
      cy.get('[data-test="dialog-continue-button"]').should('have.text', 'app.yes').click();
    });

    cy.wait('@bulkDeleteRequest').then(interception => {
      expect(interception.request.body).to.eql({
        users: [6, 7]
      });
    });
    cy.wait('@roomMembersRequest');

    // Check that bulk delete dialog is closed and bulk delete button is hidden
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('not.exist');

    // Check that users were removed
    cy.get('[data-test="room-member-item"]').should('have.length', 0);
    cy.contains('rooms.members.nodata').should('be.visible');
  });

  it('bulk delete members errors', function () {
    cy.visit('/rooms/abc-def-123#members');

    cy.wait('@roomMembersRequest');

    // Select all users
    cy.get('[data-test="room-members-select-all-checkbox"]').click();

    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');
    cy.get('[data-test="room-members-bulk-delete-button"]').should('be.visible').click();
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('be.visible');

    // Check with 422 error (one of the users isn't a member)
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 422,
      body: {
        message: 'The user \'Laura Rivera\' isn\'t a member.',
        errors: {
          'users.0': ['The user \'Laura Rivera\' isn\'t a member.']
        }
      }
    }).as('bulkDeleteRequest');

    cy.get('[data-test="room-members-bulk-delete-dialog"]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@bulkDeleteRequest');

    // Check that dialog is still shown and error is displayed
    cy.get('[data-test="room-members-bulk-delete-dialog"]')
      .should('be.visible')
      .and('include.text', 'The user \'Laura Rivera\' isn\'t a member.');

    // Check with 500 error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('bulkDeleteRequest');

    cy.get('[data-test="room-members-bulk-delete-dialog"]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@bulkDeleteRequest');

    // Check that the dialog is closed and error is displayed
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('not.exist');
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that users are still selected
    cy.get('[data-test="room-members-select-all-checkbox"] > input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(0).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(1).find('input').should('be.checked');
    cy.get('[data-test="room-member-item"]').eq(2).find('input').should('be.checked');

    // Open bulk delete dialog again
    cy.get('[data-test="room-members-bulk-delete-button"]').should('be.visible').click();
    cy.get('[data-test="room-members-bulk-delete-dialog"]').should('be.visible');

    // Check with 401 error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 401
    }).as('bulkDeleteRequest');

    cy.get('[data-test="room-members-bulk-delete-dialog"]').find('[data-test="dialog-continue-button"]').click();
    cy.wait('@bulkDeleteRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.checkToastMessage('app.flash.unauthenticated', false);
  });

  it('bulk import members', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0
        }
      }
    }).as('roomMembersRequest');

    cy.visit('/rooms/abc-def-123#members');
    cy.wait('@roomMembersRequest');

    cy.get('#overlay_menu').should('not.exist');

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get('#overlay_menu').should('be.visible');

    // Click on add several users option
    cy.get('[data-test="room-members-bulk-import-dialog"]').should('not.exist');
    cy.get('#overlay_menu_1').should('have.text', 'rooms.members.bulk_import_users').click();
    cy.get('[data-test="room-members-bulk-import-dialog"]').should('be.visible').within(() => {
      cy.contains('rooms.members.bulk_import_users');

      // Check that continue button is disabled and shows the correct text
      cy.get('[data-test="dialog-continue-button"]').should('have.text', 'rooms.members.modals.add.add').and('be.disabled');
      // Check that textarea is empty and enter users
      cy.get('[data-test="room-members-bulk-import-textarea"]')
        .should('have.value', '')
        .and('have.attr', 'placeholder', 'rooms.members.modals.bulk_import.list_placeholder')
        .type('LauraWRivera@domain.tld\nLauraMWalter@domain.tld');

      // Check that button is enabled
      cy.get('[data-test="dialog-continue-button"]').should('not.be.disabled');

      // Check that roles are shown correctly
      cy.get('[data-test="participant-role-group"]').within(() => {
        cy.contains('rooms.roles.participant');
        cy.get('#participant-role').should('be.checked').and('have.value', 1);
      });

      cy.get('[data-test="participant-moderator-group"]').within(() => {
        cy.contains('rooms.roles.moderator');
        cy.get('#participant-moderator').should('not.be.checked').and('have.value', 2);
      });

      cy.get('[data-test="participant-co-owner-group"]').within(() => {
        cy.contains('rooms.roles.co_owner');
        cy.get('#participant-co_owner').should('not.be.checked').and('have.value', 3);
      });

      // Select moderator role
      cy.get('#participant-moderator').click();

      // Check with only valid users
      const bulkImportRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }, 'bulkImportRequest');

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 2, image: null },
            { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 2, image: null }
          ],
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 4,
            to: 2,
            total: 2,
            total_no_filter: 2
          }
        }
      }).as('roomMembersRequest');

      // Save
      cy.get('[data-test="dialog-continue-button"]').click();

      // Check loading
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled');
      cy.get('[data-test="room-members-bulk-import-textarea"]').should('be.disabled').then(() => {
        bulkImportRequest.sendResponse();
      });

      cy.wait('@bulkImportRequest').then(interception => {
        expect(interception.request.body).to.eql({
          role: 2,
          user_emails: [
            'laurawrivera@domain.tld',
            'lauramwalter@domain.tld'
          ]
        });
      });

      cy.wait('@roomMembersRequest');

      cy.get('[data-test="room-members-bulk-import-list"]').should('include.text', 'rooms.members.modals.bulk_import.imported_users');
      cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 2);
      cy.get('[data-test="room-members-bulk-import-list-item"]')
        .eq(0)
        .should('have.text', 'laurawrivera@domain.tld')
        .find('button').should('be.disabled');
      cy.get('[data-test="room-members-bulk-import-list-item"]')
        .eq(1)
        .should('have.text', 'lauramwalter@domain.tld')
        .find('button').should('be.disabled');

      cy.get('[data-test="room-members-copy-and-close-button"]').should('not.exist');
      // Close dialog
      cy.get('[data-test="dialog-close-button"]').should('have.text', 'app.close').click();
    });

    cy.get('[data-test="room-members-bulk-import-dialog"]').should('not.exist');
    cy.get('[data-test="room-member-item"]').should('have.length', 2);

    // Check with valid and invalid users
    cy.get('[data-test="room-members-add-button"]').click();
    cy.get('#overlay_menu_1').should('have.text', 'rooms.members.bulk_import_users').click();
    cy.get('[data-test="room-members-bulk-import-dialog"]').should('be.visible').within(() => {
      // Enter users with valid and invalid emails
      cy.get('[data-test="room-members-bulk-import-textarea"]').should('have.value', '');
      cy.get('[data-test="room-members-bulk-import-textarea"]').type('\n\n\nJuanMWalter@domain.tld\ntammyglaw@do  main  .tld\n\nnotAn\tE  ma il\ninvalidemail@domain.tld\n\n\n');
      // Check that role stayed selected
      cy.get('#participant-moderator').should('be.checked');
      // Select co_owner role
      cy.get('#participant-co_owner').click();

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 422,
        body: {
          errors: {
            'user_emails.2': ['notanemail must be a valid email adress.'],
            'user_emails.3': ['No user was found with this e-mail']
          }
        }
      }).as('bulkImportRequest');

      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@bulkImportRequest').then(interception => {
        expect(interception.request.body).to.eql({
          role: 3,
          user_emails: [
            'juanmwalter@domain.tld',
            'tammyglaw@domain.tld',
            'notanemail',
            'invalidemail@domain.tld'
          ]
        });
      });

      // Go back and check that text inside the textarea is still there
      cy.get('[data-test="dialog-back-button"]').should('have.text', 'app.back').click();
      cy.get('[data-test="room-members-bulk-import-textarea"]').should('have.value', '\n\n\nJuanMWalter@domain.tld\ntammyglaw@do  main  .tld\n\nnotAn\tE  ma il\ninvalidemail@domain.tld\n\n\n');

      cy.get('[data-test="dialog-continue-button"]').click();
      cy.wait('@bulkImportRequest');

      // Check that lists are shown correctly
      cy.get('[data-test="room-members-bulk-import-list"]').should('have.length', 2);
      cy.get('[data-test="room-members-bulk-import-list"]')
        .eq(0)
        .should('include.text', 'rooms.members.modals.bulk_import.can_import_users')
        .within(() => {
          cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 2);
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(0)
            .should('have.text', 'juanmwalter@domain.tld')
            .find('button').should('be.disabled');
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(1)
            .should('have.text', 'tammyglaw@domain.tld')
            .find('button').should('be.disabled');
        });
      cy.get('[data-test="room-members-bulk-import-list"]')
        .eq(1)
        .should('include.text', 'rooms.members.modals.bulk_import.cannot_import_users')
        .within(() => {
          cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 2);
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(0).within(() => {
              cy.contains('notanemail').should('be.visible');
              cy.contains('notanemail must be a valid email adress.').should('not.be.visible');
              cy.get('button').click();
              cy.contains('notanemail must be a valid email adress.').should('be.visible');
            });
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(1).within(() => {
              cy.contains('invalidemail@domain.tld').should('be.visible');
              cy.contains('No user was found with this e-mail').should('not.be.visible');
              cy.get('button').click();
              cy.contains('No user was found with this e-mail').should('be.visible');
            });
        });

      cy.contains('rooms.members.modals.bulk_import.import_importable_question').should('be.visible');

      // Import importable users
      cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }).as('bulkImportRequest');

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 2, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 3, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null },
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

      cy.get('[data-test="dialog-continue-button"]').should('have.text', 'rooms.members.modals.bulk_import.import_importable_button').click();

      cy.wait('@bulkImportRequest').then(interception => {
        expect(interception.request.body).to.eql({
          role: 3,
          user_emails: [
            'juanmwalter@domain.tld',
            'tammyglaw@domain.tld'
          ]
        });
      });

      cy.wait('@roomMembersRequest');

      // Check that lists are shown correctly
      cy.get('[data-test="room-members-bulk-import-list"]').should('have.length', 2);

      cy.get('[data-test="room-members-bulk-import-list"]')
        .eq(0)
        .should('include.text', 'rooms.members.modals.bulk_import.imported_users')
        .within(() => {
          cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 2);
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(0)
            .should('have.text', 'juanmwalter@domain.tld')
            .find('button').should('be.disabled');
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(1)
            .should('have.text', 'tammyglaw@domain.tld')
            .find('button').should('be.disabled');
        });
      cy.get('[data-test="room-members-bulk-import-list"]')
        .eq(1)
        .should('include.text', 'rooms.members.modals.bulk_import.could_not_import_users')
        .within(() => {
          cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 2);
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(0).within(() => {
              cy.contains('notanemail').should('be.visible');
              cy.contains('notanemail must be a valid email adress.').should('not.be.visible');
              cy.get('button').click();
              cy.contains('notanemail must be a valid email adress.').should('be.visible');
            });
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(1).within(() => {
              cy.contains('invalidemail@domain.tld').should('be.visible');
              cy.contains('No user was found with this e-mail').should('not.be.visible');
              cy.get('button').click();
              cy.contains('No user was found with this e-mail').should('be.visible');
            });
        });

      cy.get('[data-test="dialog-close-button"]').should('have.text', 'app.close');
      cy.get('[data-test="room-members-copy-and-close-button"]').should('have.text', 'rooms.members.modals.bulk_import.copy_and_close').click();

      // Close dialog with copy and close button // ToDo check if this always works
      cy.window().then(win => {
        win.navigator.clipboard.readText().then(text => {
          expect(text).to.eq('notanemail\ninvalidemail@domain.tld');
        });
      });
    });

    cy.get('[data-test="room-members-bulk-import-dialog"]').should('not.exist');

    cy.checkToastMessage('rooms.members.modals.bulk_import.copied_invalid_users');

    // Check that members are shown correctly
    cy.get('[data-test="room-member-item"]').should('have.length', 4);

    // Check with only invalid users
    cy.get('[data-test="room-members-add-button"]').click();
    cy.get('#overlay_menu_1').should('have.text', 'rooms.members.bulk_import_users').click();
    cy.get('[data-test="room-members-bulk-import-dialog"]').should('be.visible').within(() => {
      // Enter only invalid users
      cy.get('[data-test="room-members-bulk-import-textarea"]').should('have.value', '');
      cy.get('[data-test="room-members-bulk-import-textarea"]').type('invalidEmail@domain.tld\nnotAnEmail');

      // Check that role stayed selected
      cy.get('#participant-co_owner').should('be.checked');
      // Select participant role
      cy.get('#participant-role').click();

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 422,
        body: {
          errors: {
            'user_emails.0': ['No user was found with this e-mail'],
            'user_emails.1': ['notanemail must be a valid email adress.']
          }
        }
      }).as('bulkImportRequest');

      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@bulkImportRequest').then(interception => {
        expect(interception.request.body).to.eql({
          role: 1,
          user_emails: [
            'invalidemail@domain.tld',
            'notanemail'
          ]
        });
      });

      // Go back and check that text inside the textarea is still there
      cy.get('[data-test="dialog-back-button"]').should('have.text', 'app.back').click();
      cy.get('[data-test="room-members-bulk-import-textarea"]').should('have.value', 'invalidEmail@domain.tld\nnotAnEmail');

      cy.get('[data-test="dialog-continue-button"]').click();
      cy.wait('@bulkImportRequest');

      // Check that lists are shown correctly
      cy.get('[data-test="room-members-bulk-import-list"]').should('have.length', 1);
      cy.get('[data-test="room-members-bulk-import-list"]')
        .eq(0)
        .should('include.text', 'rooms.members.modals.bulk_import.cannot_import_users')
        .within(() => {
          cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 2);
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(0).within(() => {
              cy.contains('invalidemail@domain.tld').should('be.visible');
              cy.contains('No user was found with this e-mail').should('not.be.visible');
              cy.get('button').click();
              cy.contains('No user was found with this e-mail').should('be.visible');
            });
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(1).within(() => {
              cy.contains('notanemail').should('be.visible');
              cy.contains('notanemail must be a valid email adress.').should('not.be.visible');
              cy.get('button').click();
              cy.contains('notanemail must be a valid email adress.').should('be.visible');
            });
        });

      // Check that button to add valid users is hidden
      cy.get('[data-test="dialog-continue-button"]').should('not.exist');

      // Go back and enter valid user and save
      cy.get('[data-test="dialog-back-button"]').should('have.text', 'app.back').click();
      cy.get('[data-test="room-members-bulk-import-textarea"]').clear();
      cy.get('[data-test="room-members-bulk-import-textarea"]').type('maxdoe@domain.tld');

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
        statusCode: 204
      }).as('bulkImportRequest');

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', {
        statusCode: 200,
        body: {
          data: [
            { id: 2, firstname: 'Max', lastname: 'Doe', email: 'maxdoe@domain.tld', role: 1, image: null },
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 2, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 3, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null },
            { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 2, image: null }
          ],
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 5,
            to: 5,
            total: 5,
            total_no_filter: 5
          }
        }
      }).as('roomMembersRequest');

      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@bulkImportRequest').then(interception => {
        expect(interception.request.body).to.eql({
          role: 1,
          user_emails: ['maxdoe@domain.tld']
        });
      });

      cy.wait('@roomMembersRequest');

      // Check that lists are shown correctly
      cy.get('[data-test="room-members-bulk-import-list"]').should('have.length', 1);
      cy.get('[data-test="room-members-bulk-import-list"]')
        .eq(0)
        .should('include.text', 'rooms.members.modals.bulk_import.imported_users')
        .within(() => {
          cy.get('[data-test="room-members-bulk-import-list-item"]').should('have.length', 1);
          cy.get('[data-test="room-members-bulk-import-list-item"]')
            .eq(0)
            .should('have.text', 'maxdoe@domain.tld')
            .find('button').should('be.disabled');
        });

      // Close dialog
      cy.get('[data-test="dialog-close-button"]').should('have.text', 'app.close').click();
    });

    cy.get('[data-test="room-members-bulk-import-dialog"]').should('not.exist');
    cy.get('[data-test="room-member-item"]').should('have.length', 5);
  });

  it('bulk import members errors', function () {
    cy.visit('/rooms/abc-def-123#members');
    cy.wait('@roomMembersRequest');

    cy.get('[data-test="room-members-add-button"]').click();
    cy.get('#overlay_menu_1').should('have.text', 'rooms.members.bulk_import_users').click();
    cy.get('[data-test="room-members-bulk-import-dialog"]').should('be.visible');

    cy.get('[data-test="room-members-bulk-import-textarea"]').type('\n');

    // Check with 422 error (email field is required)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 422,
      body: {
        errors: {
          user_emails: ['The user emails field is required.']
        }
      }
    }).as('bulkImportRequest');

    cy.get('[data-test="room-members-bulk-import-dialog"]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@bulkImportRequest');

    cy.get('[data-test="room-members-bulk-import-dialog"]')
      .should('be.visible')
      .and('include.text', 'The user emails field is required.');

    cy.get('[data-test="room-members-bulk-import-textarea"]').type('laurawrivera@domain.tld');

    // Check with 422 error (role field is required)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 422,
      body: {
        errors: {
          user_emails: ['The selected role is invalid.']
        }
      }
    }).as('bulkImportRequest');

    cy.get('[data-test="room-members-bulk-import-dialog"]').find('[data-test="dialog-continue-button"]').click();
    cy.wait('@bulkImportRequest');

    cy.get('[data-test="room-members-bulk-import-dialog"]')
      .should('be.visible')
      .and('include.text', 'The selected role is invalid.');

    // Check with 500 error
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('bulkImportRequest');

    cy.get('[data-test="room-members-bulk-import-dialog"]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@bulkImportRequest');

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that dialog is still shown

    cy.get('[data-test="room-members-bulk-import-dialog"]')
      .should('be.visible');

    cy.get('[data-test="room-members-bulk-import-textarea"]').should('have.value', '\nlaurawrivera@domain.tld');

    // Check with 401 error
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/member/bulk', {
      statusCode: 401
    }).as('bulkImportRequest');

    cy.get('[data-test="room-members-bulk-import-dialog"]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@bulkImportRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login');

    cy.checkToastMessage('app.flash.unauthenticated', false);
  });
});
