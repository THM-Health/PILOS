import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms view settings', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomSettingsRequest();
  });

  it('load settings', function () {
    cy.fixture('roomSettings.json').then((roomSettings) => {
      roomSettings.data.expert_mode = false;

      const roomSettingsRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123/settings', {
        statusCode: 200,
        body: roomSettings
      }, 'roomSettingsRequest');

      cy.visit('/rooms/abc-def-123');

      cy.get('#tab-settings').click();

      cy.url().should('include', '/rooms/abc-def-123#settings');

      // Check loading

      // Check that overlay is shown
      cy.get('[data-test="overlay"]').should('be.visible');

      // Check that buttons are disabled
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
    });

    cy.wait('@roomSettingsRequest');

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should('not.exist');

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

    // Check that expert mode is activated
    cy.get('[data-test="room-settings-expert-mode-button"]').should('have.text', 'rooms.settings.expert_mode.deactivate');

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
        cy.get('#record-attendance').should('not.be.disabled').and('not.be.checked');
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

    cy.get('[data-test="overlay"]').should('be.visible');

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

  it('load settings with different permissions', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', { fixture: 'roomSettings.json' }).as('roomSettingsRequest');

    // Check with co_owner
    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.last_meeting = { start: '2023-08-21 08:18:28:00', end: null };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.visit('/rooms/abc-def-123#settings');

    cy.wait('@roomRequest');
    cy.wait('@roomSettingsRequest');

    // Check that delete and transfer ownership buttons are hidden but other buttons are shown
    cy.get('[data-test="room-settings-expert-mode-button"]')
      .should('have.text', 'rooms.settings.expert_mode.deactivate')
      .and('not.be.disabled');

    cy.get('[data-test="room-delete-button"]').should('not.exist');

    cy.get('[data-test="room-transfer-ownership-button"]').should('not.exist');

    cy.get('[data-test="room-settings-save-button"]')
      .should('have.text', 'app.save')
      .and('not.be.disabled');

    // General settings
    cy.get('#room-type').should('have.value', 'Meeting').and('not.be.disabled');
    cy.get('[data-test="room-type-change-button"]').should('not.be.disabled');
    cy.get('#room-name').should('have.value', 'Meeting One').and('not.be.disabled');
    cy.get('#access-code').should('have.value', '123456789').and('not.be.disabled');
    cy.get('[data-test="generate-access-code-button"]').should('not.be.disabled');
    cy.get('[data-test="clear-access-code-button"]').should('not.be.disabled');
    cy.get('#allow-guests').should('be.checked').and('not.be.disabled');

    // Video conference settings
    cy.get('#everyone-can-start').should('not.be.checked').and('not.be.disabled');
    cy.get('#mute-on-start').should('be.checked').and('be.disabled');
    cy.get('#lobby-disabled').should('not.be.checked').and('be.disabled');
    cy.get('#lobby-enabled').should('be.checked').and('be.disabled');
    cy.get('#lobby-only-for-guests').should('not.be.checked').and('be.disabled');
    cy.get('#welcome-message').should('have.value', 'Welcome message').and('not.be.disabled');

    // Recording settings
    cy.get('#record-attendance').should('not.be.checked').and('not.be.disabled');
    cy.get('#record').should('not.be.checked').and('not.be.disabled');
    cy.get('#auto-start-recording').should('not.be.checked').and('not.be.disabled');

    // Restriction settings
    cy.get('#disable-cam').should('not.be.checked').and('not.be.disabled');
    cy.get('#webcams-only-for-moderator').should('be.checked').and('not.be.disabled');
    cy.get('#disable-mic').should('not.be.checked').and('be.disabled');
    cy.get('#disable-public-chat').should('be.checked').and('not.be.disabled');
    cy.get('#disable-private-chat').should('not.be.checked').and('not.be.disabled');
    cy.get('#disable-note').should('be.checked').and('be.disabled');
    cy.get('#hide-user-list').should('be.checked').and('not.be.disabled');

    // Participant settings
    cy.get('#allow-membership').should('not.be.checked').and('be.disabled');
    cy.get('[data-test="room-settings-default-role-button"]').should('have.length', 2);
    cy.get('[data-test="room-settings-default-role-button"]')
      .eq(0)
      .should('have.text', 'rooms.roles.participant')
      .and('have.attr', 'aria-pressed', 'true')
      .and('not.be.disabled');
    cy.get('[data-test="room-settings-default-role-button"]')
      .eq(1)
      .should('have.text', 'rooms.roles.moderator')
      .and('have.attr', 'aria-pressed', 'false')
      .and('not.be.disabled');

    // Advanced settings
    cy.get('[data-test="room-settings-visibility-button"]').should('have.length', 2);
    cy.get('[data-test="room-settings-visibility-button"]')
      .eq(0)
      .should('have.text', 'rooms.settings.advanced.visibility.private')
      .and('have.attr', 'aria-pressed', 'false')
      .and('not.be.disabled');

    cy.get('[data-test="room-settings-visibility-button"]')
      .eq(1)
      .should('have.text', 'rooms.settings.advanced.visibility.public')
      .and('have.attr', 'aria-pressed', 'true')
      .and('not.be.disabled');

    // Check with rooms.viewAll permission
    cy.fixture('currentUser.json').then((currentUser) => {
      currentUser.data.permissions = ['rooms.viewAll'];
      cy.intercept('GET', 'api/v1/currentUser', {
        statusCode: 200,
        body: currentUser
      });
    });

    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.last_meeting = { start: '2023-08-21 08:18:28:00', end: null };
      room.data.current_user.permissions = ['rooms.viewAll'];

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.reload();

    cy.wait('@roomRequest');
    cy.wait('@roomSettingsRequest');

    // Check that buttons are hidden
    cy.get('[data-test="room-settings-expert-mode-button"]').should('not.exist');
    cy.get('[data-test="room-delete-button"]').should('not.exist');
    cy.get('[data-test="room-transfer-ownership-button"]').should('not.exist');
    cy.get('[data-test="room-settings-save-button"]').should('not.exist');

    // General settings
    cy.get('#room-type').should('have.value', 'Meeting').and('be.disabled');
    cy.get('[data-test="room-type-change-button"]').should('not.exist');
    cy.get('#room-name').should('have.value', 'Meeting One').and('be.disabled');
    cy.get('#access-code').should('have.value', '123456789').and('be.disabled');
    cy.get('[data-test="generate-access-code-button"]').should('not.exist');
    cy.get('[data-test="clear-access-code-button"]').should('not.exist');
    cy.get('#allow-guests').should('be.checked').and('be.disabled');

    // Video conference settings
    cy.get('#everyone-can-start').should('not.be.checked').and('be.disabled');
    cy.get('#mute-on-start').should('be.checked').and('be.disabled');
    cy.get('#lobby-disabled').should('not.be.checked').and('be.disabled');
    cy.get('#lobby-enabled').should('be.checked').and('be.disabled');
    cy.get('#lobby-only-for-guests').should('not.be.checked').and('be.disabled');
    cy.get('#welcome-message').should('have.value', 'Welcome message').and('be.disabled');

    // Recording settings
    cy.get('#record-attendance').should('not.be.checked').and('be.disabled');
    cy.get('#record').should('not.be.checked').and('be.disabled');
    cy.get('#auto-start-recording').should('not.be.checked').and('be.disabled');

    // Restriction settings#
    cy.get('#disable-cam').should('not.be.checked').and('be.disabled');
    cy.get('#webcams-only-for-moderator').should('be.checked').and('be.disabled');
    cy.get('#disable-mic').should('not.be.checked').and('be.disabled');
    cy.get('#disable-public-chat').should('be.checked').and('be.disabled');
    cy.get('#disable-private-chat').should('not.be.checked').and('be.disabled');
    cy.get('#disable-note').should('be.checked').and('be.disabled');
    cy.get('#hide-user-list').should('be.checked').and('be.disabled');

    // Participant settings
    cy.get('#allow-membership').should('not.be.checked').and('be.disabled');
    cy.get('[data-test="room-settings-default-role-button"]').should('have.length', 2);
    cy.get('[data-test="room-settings-default-role-button"]')
      .eq(0)
      .should('have.text', 'rooms.roles.participant')
      .and('have.attr', 'aria-pressed', 'true')
      .and('be.disabled');
    cy.get('[data-test="room-settings-default-role-button"]')
      .eq(1)
      .should('have.text', 'rooms.roles.moderator')
      .and('have.attr', 'aria-pressed', 'false')
      .and('be.disabled');

    // Advanced settings
    cy.get('[data-test="room-settings-visibility-button"]').should('have.length', 2);
    cy.get('[data-test="room-settings-visibility-button"]')
      .eq(0)
      .should('have.text', 'rooms.settings.advanced.visibility.private')
      .and('have.attr', 'aria-pressed', 'false')
      .and('be.disabled');

    cy.get('[data-test="room-settings-visibility-button"]')
      .eq(1)
      .should('have.text', 'rooms.settings.advanced.visibility.public')
      .and('have.attr', 'aria-pressed', 'true')
      .and('be.disabled');

    // Check with rooms.manage permission
    cy.fixture('currentUser.json').then((currentUser) => {
      currentUser.data.permissions = ['rooms.create', 'rooms.viewAll', 'rooms.manage'];
      cy.intercept('GET', 'api/v1/currentUser', {
        statusCode: 200,
        body: currentUser
      });
    });

    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.last_meeting = { start: '2023-08-21 08:18:28:00', end: null };
      room.data.current_user.permissions = ['rooms.create', 'rooms.viewAll', 'rooms.manage'];

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.reload();

    cy.wait('@roomRequest');
    cy.wait('@roomSettingsRequest');

    // Check that delete and transfer ownership buttons are hidden but other buttons are shown
    cy.get('[data-test="room-settings-expert-mode-button"]')
      .should('have.text', 'rooms.settings.expert_mode.deactivate')
      .and('not.be.disabled');

    cy.get('[data-test="room-delete-button"]').should('not.be.disabled');

    cy.get('[data-test="room-transfer-ownership-button"]').should('not.be.disabled');

    cy.get('[data-test="room-settings-save-button"]')
      .should('have.text', 'app.save')
      .and('not.be.disabled');

    // General settings
    cy.get('#room-type').should('have.value', 'Meeting').and('not.be.disabled');
    cy.get('[data-test="room-type-change-button"]').should('not.be.disabled');
    cy.get('#room-name').should('have.value', 'Meeting One').and('not.be.disabled');
    cy.get('#access-code').should('have.value', '123456789').and('not.be.disabled');
    cy.get('[data-test="generate-access-code-button"]').should('not.be.disabled');
    cy.get('[data-test="clear-access-code-button"]').should('not.be.disabled');
    cy.get('#allow-guests').should('be.checked').and('not.be.disabled');

    // Video conference settings
    cy.get('#everyone-can-start').should('not.be.checked').and('not.be.disabled');
    cy.get('#mute-on-start').should('be.checked').and('be.disabled');
    cy.get('#lobby-disabled').should('not.be.checked').and('be.disabled');
    cy.get('#lobby-enabled').should('be.checked').and('be.disabled');
    cy.get('#lobby-only-for-guests').should('not.be.checked').and('be.disabled');
    cy.get('#welcome-message').should('have.value', 'Welcome message').and('not.be.disabled');

    // Recording settings
    cy.get('#record-attendance').should('not.be.checked').and('not.be.disabled');
    cy.get('#record').should('not.be.checked').and('not.be.disabled');
    cy.get('#auto-start-recording').should('not.be.checked').and('not.be.disabled');

    // Restriction settings
    cy.get('#disable-cam').should('not.be.checked').and('not.be.disabled');
    cy.get('#webcams-only-for-moderator').should('be.checked').and('not.be.disabled');
    cy.get('#disable-mic').should('not.be.checked').and('be.disabled');
    cy.get('#disable-public-chat').should('be.checked').and('not.be.disabled');
    cy.get('#disable-private-chat').should('not.be.checked').and('not.be.disabled');
    cy.get('#disable-note').should('be.checked').and('be.disabled');
    cy.get('#hide-user-list').should('be.checked').and('not.be.disabled');

    // Participant settings
    cy.get('#allow-membership').should('not.be.checked').and('be.disabled');
    cy.get('[data-test="room-settings-default-role-button"]').should('have.length', 2);
    cy.get('[data-test="room-settings-default-role-button"]')
      .eq(0)
      .should('have.text', 'rooms.roles.participant')
      .and('have.attr', 'aria-pressed', 'true')
      .and('not.be.disabled');
    cy.get('[data-test="room-settings-default-role-button"]')
      .eq(1)
      .should('have.text', 'rooms.roles.moderator')
      .and('have.attr', 'aria-pressed', 'false')
      .and('not.be.disabled');

    // Advanced settings
    cy.get('[data-test="room-settings-visibility-button"]').should('have.length', 2);
    cy.get('[data-test="room-settings-visibility-button"]')
      .eq(0)
      .should('have.text', 'rooms.settings.advanced.visibility.private')
      .and('have.attr', 'aria-pressed', 'false')
      .and('not.be.disabled');

    cy.get('[data-test="room-settings-visibility-button"]')
      .eq(1)
      .should('have.text', 'rooms.settings.advanced.visibility.public')
      .and('have.attr', 'aria-pressed', 'true')
      .and('not.be.disabled');
  });

  it('change settings', function () {
    cy.fixture('roomTypesWithSettings.json').then((roomTypes) => {
      cy.fixture('roomSettings.json').then((roomSettings) => {
        roomSettings.data.room_type = roomTypes.data[0];

        cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', {
          statusCode: 200,
          body: roomSettings
        }).as('roomSettingsRequest');
      });
    });

    cy.visit('/rooms/abc-def-123#settings');

    // Change settings
    cy.get('#room-name').clear();
    cy.get('#room-name').type('Meeting Two');

    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get('#access-code').should('have.value', '').and('have.attr', 'placeholder', 'rooms.settings.general.unprotected_placeholder');
    cy.get('[data-test="clear-access-code-button"]').should('not.exist');
    cy.get('[data-test="generate-access-code-button"]').click();
    cy.get('#access-code').should('not.have.value', '').then((accessCodeInput) => {
      const newAccessCodeValue = accessCodeInput[0].value;

      cy.get('#allow-guests').click();
      cy.get('#short-description').clear();
      cy.get('#short-description').type('Short description two');

      cy.get('#everyone-can-start').click();
      cy.get('#mute-on-start').click();
      cy.get('#lobby-only-for-guests').click();
      cy.get('#welcome-message').type('Welcome message');

      cy.get('#record-attendance').click();
      cy.get('#record').click();
      cy.get('#auto-start-recording').click();

      cy.get('#disable-cam').click();
      cy.get('#webcams-only-for-moderator').click();
      cy.get('#disable-mic').click();
      cy.get('#disable-public-chat').click();
      cy.get('#disable-private-chat').click();
      cy.get('#disable-note').click();
      cy.get('#hide-user-list').click();

      cy.get('#allow-membership').click();
      cy.get('[data-test="room-settings-default-role-button"]').eq(1).click();

      cy.get('[data-test="room-settings-visibility-button"]').eq(0).click();

      // Deactivate expert mode and activate again
      cy.get('[data-test="room-settings-expert-mode-button"]').click();
      cy.get('[data-test="room-settings-expert-mode-dialog"]').find('[data-test="dialog-continue-button"]').click();

      cy.get('[data-test="room-settings-expert-mode-button"]').click();
      cy.get('[data-test="room-settings-expert-mode-dialog"]').find('[data-test="dialog-continue-button"]').click();

      // Check that expert settings are reset to the default values and change settings again
      cy.get('#room-name').should('have.value', 'Meeting Two');
      cy.get('#access-code').should('have.value', newAccessCodeValue);
      cy.get('#allow-guests').should('not.be.checked');
      cy.get('#short-description').should('have.value', 'Short description two');

      cy.get('#everyone-can-start').should('not.be.checked').click();
      cy.get('#mute-on-start').should('be.checked').click();
      cy.get('#lobby-enabled').should('be.checked');
      cy.get('#lobby-only-for-guests').should('not.be.checked').click();
      cy.get('#welcome-message').should('have.value', '').type('Welcome message');

      cy.get('#record-attendance').should('not.be.checked').click();
      cy.get('#record').should('not.be.checked').click();
      cy.get('#auto-start-recording').should('not.be.checked').click();

      cy.get('#disable-cam').should('not.be.checked').click();
      cy.get('#webcams-only-for-moderator').should('be.checked').click();
      cy.get('#disable-mic').should('not.be.checked').click();
      cy.get('#disable-public-chat').should('be.checked').click();
      cy.get('#disable-private-chat').should('not.be.checked').click();
      cy.get('#disable-note').should('be.checked').click();
      cy.get('#hide-user-list').should('be.checked').click();

      cy.get('#allow-membership').should('not.be.checked').click();
      cy.get('[data-test="room-settings-default-role-button"]').eq(0).should('have.attr', 'aria-pressed', 'true');
      cy.get('[data-test="room-settings-default-role-button"]').eq(1).should('have.attr', 'aria-pressed', 'false').click();

      cy.get('[data-test="room-settings-visibility-button"]').eq(1).should('have.attr', 'aria-pressed', 'true');
      cy.get('[data-test="room-settings-visibility-button"]').eq(0).should('have.attr', 'aria-pressed', 'false').click();

      // Save settings
      cy.fixture('roomTypesWithSettings.json').then((roomTypes) => {
        cy.fixture('roomSettings.json').then((roomSettings) => {
          roomSettings.data.name = 'Meeting Two';
          roomSettings.data.access_code = newAccessCodeValue;
          roomSettings.data.allow_guests = false;
          roomSettings.data.short_description = 'Short description two';
          roomSettings.data.everyone_can_start = true;
          roomSettings.data.mute_on_start = false;
          roomSettings.data.record_attendance = true;
          roomSettings.data.record = true;
          roomSettings.data.auto_start_recording = true;
          roomSettings.data.lobby = 2;
          roomSettings.data.lock_settings_disable_cam = true;
          roomSettings.data.webcams_only_for_moderator = false;
          roomSettings.data.lock_settings_disable_mic = true;
          roomSettings.data.lock_settings_disable_public_chat = false;
          roomSettings.data.lock_settings_disable_private_chat = true;
          roomSettings.data.lock_settings_disable_note = false;
          roomSettings.data.lock_settings_hide_user_list = false;
          roomSettings.data.allow_membership = true;
          roomSettings.data.default_role = 2;
          roomSettings.data.visibility = 0;
          roomSettings.data.room_type = roomTypes.data[0];

          const saveRoomSettingsRequest = interceptIndefinitely('PUT', 'api/v1/rooms/abc-def-123', {
            statusCode: 200,
            body: roomSettings

          }, 'roomSettingsSaveRequest');

          cy.get('[data-test="room-settings-save-button"]').click();

          // Check loading
          cy.get('[data-test="overlay"]').should('be.visible');
          // Check that overlay is shown
          cy.get('[data-test="overlay"]').should('be.visible');

          // Check that buttons are disabled
          cy.get('[data-test="room-delete-button"]').should('be.disabled');
          cy.get('[data-test="room-transfer-ownership-button"]').should('be.disabled');
          cy.get('[data-test="room-settings-expert-mode-button"]').should('be.disabled');
          cy.get('[data-test="room-settings-save-button"]').should('be.disabled').then(() => {
            saveRoomSettingsRequest.sendResponse();
          });

          cy.wait('@roomSettingsSaveRequest').then((interception) => {
            expect(interception.request.body).to.eql({
              name: 'Meeting Two',
              expert_mode: true,
              access_code: parseInt(newAccessCodeValue),
              allow_guests: false,
              short_description: 'Short description two',
              everyone_can_start: true,
              mute_on_start: false,
              record_attendance: true,
              record: true,
              auto_start_recording: true,
              lobby: 2,
              lock_settings_disable_cam: true,
              webcams_only_for_moderator: false,
              lock_settings_disable_mic: true,
              lock_settings_disable_public_chat: false,
              lock_settings_disable_private_chat: true,
              lock_settings_disable_note: false,
              lock_settings_hide_user_list: false,
              allow_membership: true,
              default_role: 2,
              visibility: 0,
              room_type: 1,
              welcome: 'Welcome message'
            });
          });
        });
      });

      // Check that overlay is hidden
      cy.get('[data-test="overlay"]').should('not.exist');

      // Check that buttons are enabled
      cy.get('[data-test="room-delete-button"]').should('not.be.disabled');
      cy.get('[data-test="room-transfer-ownership-button"]').should('not.be.disabled');
      cy.get('[data-test="room-settings-expert-mode-button"]').should('not.be.disabled');
      cy.get('[data-test="room-settings-save-button"]').should('not.be.disabled');

      // Check that settings are shown correctly
      cy.get('#room-name').should('have.value', 'Meeting Two');
      cy.get('#access-code').should('have.value', newAccessCodeValue);
      cy.get('#allow-guests').should('not.be.checked');
      cy.get('#short-description').should('have.value', 'Short description two');

      cy.get('#everyone-can-start').should('be.checked');
      cy.get('#mute-on-start').should('not.be.checked');
      cy.get('#lobby-only-for-guests').should('be.checked');
      cy.get('#welcome-message').should('have.value', 'Welcome message');

      cy.get('#record-attendance').should('be.checked');
      cy.get('#record').should('be.checked');
      cy.get('#auto-start-recording').should('be.checked');

      cy.get('#disable-cam').should('be.checked');
      cy.get('#webcams-only-for-moderator').should('not.be.checked');
      cy.get('#disable-mic').should('be.checked');
      cy.get('#disable-public-chat').should('not.be.checked');
      cy.get('#disable-private-chat').should('be.checked');
      cy.get('#disable-note').should('not.be.checked');
      cy.get('#hide-user-list').should('not.be.checked');

      cy.get('#allow-membership').should('be.checked');
      cy.get('[data-test="room-settings-default-role-button"]').eq(1).should('have.attr', 'aria-pressed', 'true');

      cy.get('[data-test="room-settings-visibility-button"]').eq(0).should('have.attr', 'aria-pressed', 'true');
    });

    // Deactivate expert mode and change settings again
    cy.get('[data-test="room-settings-expert-mode-button"]').click();
    cy.get('[data-test="room-settings-expert-mode-dialog"]').find('[data-test="dialog-continue-button"]').click();

    cy.get('#room-name').clear();
    cy.get('#room-name').type('Meeting Three');

    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get('#access-code').should('have.value', '');
    cy.get('#allow-guests').click();
    cy.get('#short-description').clear();

    // Save settings

    cy.fixture('roomTypesWithSettings.json').then((roomTypes) => {
      cy.fixture('roomSettings.json').then((roomSettings) => {
        roomSettings.data.name = 'Meeting Three';
        roomSettings.data.expert_mode = false;
        roomSettings.data.access_code = null;
        roomSettings.data.allow_guests = true;
        roomSettings.data.short_description = null;

        cy.intercept('PUT', 'api/v1/rooms/abc-def-123', {
          statusCode: 200,
          body: roomSettings
        }).as('roomSettingsSaveRequest');

        cy.get('[data-test="room-settings-save-button"]').click();
      });
    });

    cy.wait('@roomSettingsSaveRequest').then((interception) => {
      expect(interception.request.body).to.eql({
        name: 'Meeting Three',
        expert_mode: false,
        access_code: null,
        allow_guests: true,
        short_description: '',
        everyone_can_start: true,
        mute_on_start: false,
        record_attendance: true,
        record: true,
        auto_start_recording: true,
        lobby: 2,
        lock_settings_disable_cam: true,
        webcams_only_for_moderator: false,
        lock_settings_disable_mic: true,
        lock_settings_disable_public_chat: false,
        lock_settings_disable_private_chat: true,
        lock_settings_disable_note: false,
        lock_settings_hide_user_list: false,
        allow_membership: true,
        default_role: 2,
        visibility: 0,
        room_type: 1,
        welcome: 'Welcome message'
      });
    });

    // Check that settings are shown correctly
    cy.get('#room-name').should('have.value', 'Meeting Three');
    cy.get('#access-code').should('have.value', '');
    cy.get('#allow-guests').should('be.checked');

    cy.get('[data-test="room-settings-expert-mode-button"]').should('have.text', 'rooms.settings.expert_mode.activate');
  });

  it('change settings errors', function () {
    cy.fixture('roomTypesWithSettings.json').then((roomTypes) => {
      cy.fixture('roomSettings.json').then((roomSettings) => {
        roomSettings.data.room_type = roomTypes.data[0];
        roomSettings.data.room_type.has_access_code_enforced = true;
        roomSettings.data.access_code = null;

        cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', {
          statusCode: 200,
          body: roomSettings
        }).as('roomSettingsRequest');
      });
    });

    cy.visit('/rooms/abc-def-123#settings');

    // Check that access code setting is shown correctly
    cy.get('[data-test="access-code-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.access_code')
      .and('include.text', 'rooms.settings.general.access_code_enforced')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]');
        cy.get('#access-code').should('have.value', '');
      });

    // Save settings and respond with 422 errors
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123', {
      statusCode: 422,
      body: {
        errors: {
          access_code: ['The room requires an access code because of its room type.'],
          welcome: ['The Welcome message may not be greater than 250 characters.'],
          everyone_can_start: ['The Everyone can start field is required.'],
          mute_on_start: ['The Mute on start field is required.'],
          record_attendance: ['The Record attendance field is required.'],
          record: ['The Record field is required.'],
          auto_start_recording: ['The Auto start recording field is required.'],
          lobby: ['The Lobby field is required.'],
          lock_settings_disable_cam: ['The Disable cam field is required.'],
          webcams_only_for_moderator: ['The Webcams only for moderator field is required.'],
          lock_settings_disable_mic: ['The Disable mic field is required.'],
          lock_settings_disable_public_chat: ['The Disable public chat field is required.'],
          lock_settings_disable_private_chat: ['The Disable private chat field is required.'],
          lock_settings_disable_note: ['The Disable note field is required.'],
          lock_settings_hide_user_list: ['The Hide user list field is required.'],
          allow_membership: ['The Allow membership field is required.'],
          default_role: ['The Default role field is required.'],
          visibility: ['The Visibility field is required.']
        }
      }
    }).as('roomSettingsSaveRequest');

    cy.get('[data-test="room-settings-save-button"]').click();

    // Check that error messages are set
    cy.get('[data-test="access-code-setting"]').should('include.text', 'The room requires an access code because of its room type.');
    cy.get('[data-test="everyone-can-start-setting"]').should('include.text', 'The Everyone can start field is required.');
    cy.get('[data-test="mute-on-start-setting"]').should('include.text', 'The Mute on start field is required.');
    cy.get('[data-test="lobby-setting"]').should('include.text', 'The Lobby field is required.');
    cy.get('[data-test="welcome-setting"]').should('include.text', 'The Welcome message may not be greater than 250 characters.');
    cy.get('[data-test="record-attendance-setting"]').should('include.text', 'The Record attendance field is required.');
    cy.get('[data-test="record-setting"]').should('include.text', 'The Record field is required.');
    cy.get('[data-test="auto-start-recording-setting"]').should('include.text', 'The Auto start recording field is required.');
    cy.get('[data-test="lock-settings-disable-cam-setting"]').should('include.text', 'The Disable cam field is required.');
    cy.get('[data-test="webcams-only-for-moderator-setting"]').should('include.text', 'The Webcams only for moderator field is required.');
    cy.get('[data-test="lock-settings-disable-mic-setting"]').should('include.text', 'The Disable mic field is required.');
    cy.get('[data-test="lock-settings-disable-public-chat-setting"]').should('include.text', 'The Disable public chat field is required.');
    cy.get('[data-test="lock-settings-disable-private-chat-setting"]').should('include.text', 'The Disable private chat field is required.');
    cy.get('[data-test="lock-settings-disable-note-setting"]').should('include.text', 'The Disable note field is required.');
    cy.get('[data-test="lock-settings-hide-user-list-setting"]').should('include.text', 'The Hide user list field is required.');
    cy.get('[data-test="allow-membership-setting"]').should('include.text', 'The Allow membership field is required.');
    cy.get('[data-test="default-role-setting"]').should('include.text', 'The Default role field is required.');
    cy.get('[data-test="visibility-setting"]').should('include.text', 'The Visibility field is required.');

    // Disable expert mode and save settings again without error
    cy.get('[data-test="room-settings-expert-mode-button"]').click();
    cy.get('[data-test="room-settings-expert-mode-dialog"]').find('[data-test="dialog-continue-button"]').click();

    // Generate new access code
    cy.get('[data-test="generate-access-code-button"]').click();

    cy.fixture('roomTypesWithSettings.json').then((roomTypes) => {
      cy.fixture('roomSettings.json').then((roomSettings) => {
        roomSettings.data.expert_mode = false;
        roomSettings.data.room_type = roomTypes.data[0];
        roomSettings.data.room_type.has_access_code_enforced = true;
        roomSettings.data.room_type.has_access_code_default = false;

        cy.intercept('PUT', 'api/v1/rooms/abc-def-123', {
          statusCode: 200,
          body: roomSettings
        }).as('roomSettingsSaveRequest');

        cy.get('[data-test="room-settings-save-button"]').click();
      });
    });

    cy.wait('@roomSettingsSaveRequest');

    // Check that access code is shown correctly
    cy.get('[data-test="access-code-setting"]')
      .should('be.visible')
      .and('include.text', 'rooms.access_code')
      .and('include.text', 'rooms.settings.general.access_code_prohibited')
      .and('not.include.text', 'The room requires an access code because of its room type.')
      .within(() => {
        cy.get('[data-test="room-setting-enforced-icon"]');
        cy.get('#access-code').should('have.value', '123456789');
      });

    // Save settings and respond with 422 errors
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123', {
      statusCode: 422,
      body: {
        errors: {
          access_code: ['The room requires an access code because of its room type.'],
          room_type: ['The room type is invalid.'],
          name: ['The Name may not be greater than 50 characters. '],
          short_description: ['The Short description may not be greater than 300 characters.'],
          allow_guests: ['The Allow guests field is required.']
        }
      }
    }).as('roomSettingsSaveRequest');

    cy.get('[data-test="room-settings-save-button"]').click();

    cy.wait('@roomSettingsSaveRequest');

    // Check that error messages are set
    cy.get('[data-test="access-code-setting"]').should('include.text', 'The room requires an access code because of its room type.');
    cy.get('[data-test="room-type-setting"]').should('include.text', 'The room type is invalid.');
    cy.get('[data-test="room-name-setting"]').should('include.text', 'The Name may not be greater than 50 characters.');
    cy.get('[data-test="short-description-setting"]').should('include.text', 'The Short description may not be greater than 300 characters.');
    cy.get('[data-test="allow-guests-setting"]').should('include.text', 'The Allow guests field is required.');

    // Save settings and respond with 500 error
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomSettingsSaveRequest');

    cy.get('[data-test="room-settings-save-button"]').click();

    cy.wait('@roomSettingsSaveRequest');

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Save settings and respond with 401 error
    cy.intercept('PUT', 'api/v1/rooms/abc-def-123', {
      statusCode: 401
    }).as('roomSettingsSaveRequest');

    cy.get('[data-test="room-settings-save-button"]').click();

    cy.wait('@roomSettingsSaveRequest');

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
