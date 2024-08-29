import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms view settings', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomSettingsRequest();
  });

  it('load settings', function () { // ToDo improve (custom command or function possible?)
    const roomSettingsRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123/settings', { fixture: 'exampleRoomSettings.json' }, 'roomSettingsRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('#tab-settings').click();

    cy.url().should('include', '/rooms/abc-def-123#settings');

    // Check loading
    cy.get('[data-test="room-delete-button"]')
      .should('have.text', 'rooms.modals.delete.title')
      .and('be.disabled');

    cy.get('[data-test="room-transfer-ownership-button"]')
      .should('have.text', 'rooms.modals.transfer_ownership.title')
      .and('be.disabled');

    cy.get('[data-test="room-settings-expert-mode-button"]')
      .should('have.text', 'rooms.settings.expert_mode.activate')
      .and('be.disabled');

    cy.get('[data-test="room-settings-save-button"]')
      .should('have.text', 'app.save')
      .and('be.disabled').then(() => {
        roomSettingsRequest.sendResponse();
      });

    cy.wait('@roomSettingsRequest');

    // General settings
    cy.contains('rooms.settings.general.title').should('be.visible');
    cy.get('[data-test="room-type-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.general.type')
      .find('#room-type').should('have.value', 'Meeting');

    cy.get('[data-test="room-name-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.name')
      .find('#room-name').should('have.value', 'Meeting One');

    cy.get('[data-test="access-code-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.access_code')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#access-code').should('have.value', '123456789');
      });

    cy.get('[data-test="allow-guests-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.general.access_by_guests')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#allow-guests').should('not.be.disabled').and('be.checked');
      });

    cy.get('[data-test="short-description-setting"]')
      .should('be.visible')
      .should('include.text', 'rooms.settings.general.short_description')
      .should('include.text', 'rooms.settings.general.chars_{"chars":"17 / 300"}')
      .find('#short-description').should('have.value', 'Short description');

    // Check other settings hidden
    // Video conference settings
    cy.contains('rooms.settings.video_conference.title').should('not.exist');

    // Recording settings
    cy.contains('rooms.settings.recordings.title').should('not.exist');

    // Restriction settings
    cy.contains('rooms.settings.restrictions.title').should('not.exist');

    // Participant settings
    cy.contains('rooms.settings.participants.title').should('not.exist');

    // Advanced settings
    cy.contains('rooms.settings.advanced.title').should('not.exist');

    // Activate expert mode
    cy.get('[data-test="room-settings-expert-mode-button"]').click();
    cy.get('[data-test="room-settings-expert-mode-dialog"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.expert_mode.activate')
      .and('include.text', 'rooms.settings.expert_mode.warning.activate')
      .find('[data-test="dialog-continue-button"]').click();

    // Check other settings visible
    // Video conference settings
    cy.contains('rooms.settings.video_conference.title').should('be.visible');

    cy.get('[data-test="everyone-can-start-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.video_conference.allow_starting')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#everyone-can-start').should('not.be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="mute-on-start-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.video_conference.microphone')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('be.visible');
        cy.get('#mute-on-start').should('be.disabled').and('be.checked');
      });

    cy.get('[data-test="lobby-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.video_conference.lobby.title')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('be.visible');
        cy.get('#lobby-disabled').should('be.disabled').and('not.be.checked');
        cy.get('#lobby-enabled').should('be.disabled').and('be.checked');
        cy.get('#lobby-only-for-guests').should('be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="welcome-setting"]')
      .should('be.visible')
      .should('include.text', 'rooms.settings.video_conference.welcome_message')
      .should('include.text', 'rooms.settings.general.chars_{"chars":"0 / 500"}')
      .find('#welcome-message').should('have.value', '');

    // Recording settings
    cy.contains('rooms.settings.recordings.title').should('be.visible');

    cy.get('[data-test="record-attendance-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.recordings.record_attendance')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#record-attendance').should('not.be.disabled').and('be.checked');
      });

    cy.get('[data-test="record-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.recordings.record_video_conference')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#record').should('not.be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="auto-start-recording-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.recordings.auto_start_recording')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#auto-start-recording').should('not.be.disabled').and('not.be.checked');
      });

    // Restriction settings
    cy.contains('rooms.settings.restrictions.title').should('be.visible');

    cy.get('[data-test="lock-settings-disable-cam-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.lock_settings_disable_cam')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#disable-cam').should('not.be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="webcams-only-for-moderator-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.webcams_only_for_moderator')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#webcams-only-for-moderator').should('not.be.disabled').and('be.checked');
      });

    cy.get('[data-test="lock-settings-disable-mic-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.lock_settings_disable_mic')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('be.visible');
        cy.get('#disable-mic').should('be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="lock-settings-disable-public-chat-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.lock_settings_disable_public_chat')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#disable-public-chat').should('not.be.disabled').and('be.checked');
      });

    cy.get('[data-test="lock-settings-disable-private-chat-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.lock_settings_disable_private_chat')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#disable-private-chat').should('not.be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="lock-settings-disable-note-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.lock_settings_disable_note')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('be.visible');
        cy.get('#disable-note').should('be.disabled').and('be.checked');
      });

    cy.get('[data-test="lock-settings-hide-user-list-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.restrictions.lock_settings_hide_user_list')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('#hide-user-list').should('not.be.disabled').and('be.checked');
      });

    // Participant settings
    cy.contains('rooms.settings.participants.title').should('be.visible');

    cy.get('[data-test="allow-membership-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.participants.allow_membership')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('be.visible');
        cy.get('#allow-membership').should('be.disabled').and('not.be.checked');
      });

    cy.get('[data-test="default-role-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.participants.default_role.title')
      .and('include.text', 'rooms.settings.participants.default_role.only_logged_in')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('[data-test="room-settings-default-role-button"]').should('have.length', 2);
        cy.get('[data-test="room-settings-default-role-button"]')
          .eq(0)
          .should('have.text', 'rooms.roles.participant')
          .and('have.attr', 'aria-pressed', 'true');
        cy.get('[data-test="room-settings-default-role-button"]')
          .eq(1)
          .should('have.text', 'rooms.roles.moderator')
          .and('have.attr', 'aria-pressed', 'false');
      });

    // Advanced settings
    cy.contains('rooms.settings.advanced.title').should('be.visible');

    cy.get('[data-test="visibility-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.settings.advanced.visibility.title')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
        cy.get('[data-test="room-settings-visibility-button"]').should('have.length', 2);
        cy.get('[data-test="room-settings-visibility-button"]')
          .eq(0)
          .should('have.text', 'rooms.settings.advanced.visibility.private')
          .and('have.attr', 'aria-pressed', 'false');
        cy.get('[data-test="room-settings-visibility-button"]')
          .eq(1)
          .should('have.text', 'rooms.settings.advanced.visibility.public')
          .and('have.attr', 'aria-pressed', 'true');
      });
  });

  it('load settings errors', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms/abc-def-123#settings');

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    cy.get('[data-test="room-delete-button"]').should('be.disabled');
    cy.get('[data-test="room-transfer-ownership-button"]').should('be.disabled');
    cy.get('[data-test="room-settings-expert-mode-button"]').should('be.disabled');
    cy.get('[data-test="room-settings-save-button"]').should('be.disabled');

    // Reload with 401 error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', {
      statusCode: 401
    });

    cy.get('[data-test="loading-retry-button"]').should('be.visible').and('have.text', 'app.reload').click();

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login?redirect=/rooms/abc-def-123');

    cy.checkToastMessage('app.flash.unauthenticated', false);
  });

  it('delete room', function () {
    cy.visit('/rooms/abc-def-123#settings');

    cy.wait('@roomSettingsRequest');

    cy.get('[data-test=room-delete-dialog]').should('not.exist');
    cy.get('[data-test="room-delete-button"]').should('have.text', 'rooms.modals.delete.title').click();
    cy.get('[data-test=room-delete-dialog]').should('be.visible');

    // Cancel delete of room
    cy.get('[data-test=room-delete-dialog]').find('[data-test="dialog-cancel-button"]').should('have.text', 'app.no').click();
    cy.get('[data-test=room-delete-dialog]').should('not.exist');

    // Open dialog again and check that dialog shows correct data
    cy.get('[data-test="room-delete-button"]').click();
    cy.get('[data-test=room-delete-dialog]')
      .should('be.visible')
      .should('include.text', 'rooms.modals.delete.title')
      .should('include.text', 'rooms.modals.delete.confirm_{"name":"Meeting One"}');

    // Confirm delete of room
    const deleteRoomRequest = interceptIndefinitely('DELETE', 'api/v1/rooms/abc-def-123', {
      statusCode: 204
    }, 'roomDeleteRequest');

    cy.interceptRoomIndexRequests();

    cy.get('[data-test=room-delete-dialog]').find('[data-test="dialog-continue-button"]').should('have.text', 'app.yes').click();
    cy.get('[data-test=room-delete-dialog]').find('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
      deleteRoomRequest.sendResponse();
    });

    cy.wait('@roomDeleteRequest');

    cy.url().should('include', '/rooms').and('not.include', '/abc-def-123');
  });

  it('delete room errors', function () {
    cy.visit('/rooms/abc-def-123#settings');

    cy.wait('@roomSettingsRequest');

    cy.get('[data-test=room-delete-dialog]').should('not.exist');
    cy.get('[data-test="room-delete-button"]').should('have.text', 'rooms.modals.delete.title').click();
    cy.get('[data-test=room-delete-dialog]').should('be.visible');

    // Check with 404 error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123', {
      statusCode: 404
    }).as('roomDeleteRequest');

    cy.get('[data-test=room-delete-dialog]').find('[data-test="dialog-continue-button"]').should('have.text', 'app.yes').click();

    cy.wait('@roomDeleteRequest');

    cy.checkToastMessage([
      'app.flash.server_error.empty_message',
      'app.flash.server_error.error_code_{"statusCode":404}'
    ]);

    // Check that modal stays open
    cy.get('[data-test=room-delete-dialog]').should('be.visible');

    // Check with 500 error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomDeleteRequest');

    cy.get('[data-test=room-delete-dialog]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@roomDeleteRequest');

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that modal stays open
    cy.get('[data-test=room-delete-dialog]').should('be.visible');

    // Check with 401 error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123', {
      statusCode: 401
    }).as('roomDeleteRequest');

    cy.get('[data-test=room-delete-dialog]').find('[data-test="dialog-continue-button"]').click();

    cy.wait('@roomDeleteRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login?redirect=/rooms/abc-def-123');

    cy.checkToastMessage('app.flash.unauthenticated', false);
  });
});
