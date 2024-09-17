// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Intercept requests that are needed when visiting pages that require a logged in user
 * @memberof cy
 * @method init
 * @returns void
 */
Cypress.Commands.add('init', () => {
  cy.intercept('GET', 'api/v1/currentUser', { fixture: 'currentUser.json' });
  cy.intercept('GET', 'api/v1/locale/en', {
    data: {},
    meta: {
      dateTimeFormat: {
        dateShort: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        },
        dateLong: {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        },
        time: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        datetimeShort: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        datetimeLong: {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      }
    }
  });
  cy.intercept('GET', 'api/v1/config', {
    data: {
      theme: {
        primary_color: '#14b8a6',
        rounded: true
      },
      general: { toast_lifetime: 0 }
    }
  });
});

/**
 * Check that a user who visits this page without being logged in is redirected to the login page
 * @memberof cy
 * @method testVisitWithoutCurrentUser
 * @param  {string} path
 * @returns void
 */
Cypress.Commands.add('testVisitWithoutCurrentUser', (path) => {
  cy.intercept('GET', 'api/v1/currentUser', {});

  cy.visit(path);
  cy.url().should('contain', '/login?redirect=' + path);
});

/**
 * Check a toast message is displayed and has the given text or contains the given texts.
 * Toast message is closed afterwards (default behaviour can be changed).
 * @memberof cy
 * @method checkToastMessage
 * @param  {(string|string[])} messages The text of the toast message or an array of texts that should be contained in the toast message
 * @param  {boolean} [closeToastMessage=true]
 * @returns void
 */
Cypress.Commands.add('checkToastMessage', (messages, closeToastMessage = true) => {
  cy.get('.p-toast-message').should('be.visible');
  if (Array.isArray(messages)) {
    for (const message of messages) {
      cy.get('.p-toast-message').should('include.text', message);
    }
  } else {
    cy.get('.p-toast-message').should('have.text', messages);
  }
  if (closeToastMessage) {
    cy.get('.p-toast-message').find('button').click();
    cy.get('.p-toast-message').should('not.exist');
  }
});

/**
 * Check if a room setting field inside the room type details view is displayed correctly
 * @memberof cy
 * @method checkDefaultRoomSettingField
 * @param  {string} field
 * @param  {(boolean|string)} value
 * @param  {boolean} enforced
 * @param  {boolean} isInfo
 * @returns void
 */
Cypress.Commands.add('checkDefaultRoomSettingField', (field, value, enforced, isInfo) => {
  cy.get('[data-test="room-type-' + field + '-setting"]').within(() => {
    if (enforced) {
      cy.get('[data-test="room-setting-enforced-icon"]');
    } else {
      cy.get('[data-test="room-setting-enforced-icon"]').should('not.exist');
    }
    if (isInfo) {
      cy.get('[data-test="room-type-setting-enabled-icon"]').should('not.exist');
      cy.get('[data-test="room-type-setting-disabled-icon"]').should('not.exist');
      cy.get('[data-test="room-type-setting-info"]').should('have.text', value);
    } else {
      if (value) {
        cy.get('[data-test="room-type-setting-enabled-icon"]');
        cy.get('[data-test="room-type-setting-disabled-icon"]').should('not.exist');
      } else {
        cy.get('[data-test="room-type-setting-enabled-icon"]').should('not.exist');
        cy.get('[data-test="room-type-setting-disabled-icon"]');
      }
      cy.get('[data-test="room-setting-info-icon"]').should('not.exist');
    }
  });
});

/**
 * Check if the comparison between the current and new value for a room setting field is displayed correctly
 * inside the confirmation dialog
 * @memberof cy
 * @method checkCompareRoomSettingField
 * @param  {string} field
 * @param  {(boolean|string)} currentValue
 * @param  {boolean} currentEnforced
 * @param  {(boolean|string)} newValue
 * @param  {boolean} newEnforced
 * @param  {boolean} isInfo
 * @returns void
 */
Cypress.Commands.add('checkCompareRoomSettingField', (field, currentValue, currentEnforced, newValue, newEnforced, isInfo) => {
  cy.get('[data-test="room-type-' + field + '-comparison"]').within(() => {
    if (currentEnforced) {
      cy.get('[data-test="current-enforced"] > [data-test="room-setting-enforced-icon"]');
    } else {
      cy.get('[data-test="current-enforced"] > [data-test="room-setting-enforced-icon"]').should('not.exist');
    }
    if (newEnforced) {
      cy.get('[data-test="new-enforced"] > [data-test="room-setting-enforced-icon"]');
    } else {
      cy.get('[data-test="new-enforced"] > [data-test="room-setting-enforced-icon"]').should('not.exist');
    }
    if (isInfo) {
      cy.get('[data-test="current-enabled"]').should('not.exist');
      cy.get('[data-test="current-disabled"]').should('not.exist');
      cy.get('[data-test="current-info"]').should('have.text', currentValue);
      cy.get('[data-test="new-enabled"]').should('not.exist');
      cy.get('[data-test="new-disabled"]').should('not.exist');
      cy.get('[data-test="new-info"]').should('have.text', newValue);
    } else {
      if (currentValue) {
        cy.get('[data-test="current-enabled"]');
        cy.get('[data-test="current-disabled"]').should('not.exist');
      } else {
        cy.get('[data-test="current-enabled"]').should('not.exist');
        cy.get('[data-test="current-disabled"]');
      }
      if (newValue) {
        cy.get('[data-test="new-enabled"]');
        cy.get('[data-test="new-disabled"]').should('not.exist');
      } else {
        cy.get('[data-test="new-enabled"]').should('not.exist');
        cy.get('[data-test="new-disabled"]');
      }
      cy.get('[data-test="current-info"]').should('not.exist');
      cy.get('[data-test="new-info"]').should('not.exist');
    }
  });
});

/**
 * Intercept all requests that are needed when visiting the room index page
 * @memberof cy
 * @method interceptRoomIndexRequests
 * @returns void
 */
Cypress.Commands.add('interceptRoomIndexRequests', () => {
  cy.intercept('GET', 'api/v1/roomTypes*', { fixture: 'roomTypes.json' });
  cy.intercept('GET', 'api/v1/rooms*', { fixture: 'rooms.json' }).as('roomRequest');
});

/**
 * Intercept all requests that are needed when visiting the room view page (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomViewRequests
 * @returns void
 */
Cypress.Commands.add('interceptRoomViewRequests', () => {
  cy.intercept('GET', 'api/v1/config', {
    data: {
      general: { toast_lifetime: 0 },
      theme: { primary_color: '#14b8a6', rounded: true },
      room: { refresh_rate: 5000 }
    }
  });
  cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'room.json' }).as('roomRequest');
});

/**
 * Intercept all requests that are needed when visiting the files tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomFilesRequest
 * @returns void
 */
Cypress.Commands.add('interceptRoomFilesRequest', () => {
  cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', { fixture: 'roomFiles.json' }).as('roomFilesRequest');
});

/**
 * Intercept all requests that are needed when visiting the members tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomMembersRequest
 * @returns void
 */
Cypress.Commands.add('interceptRoomMembersRequest', () => {
  cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', { fixture: 'roomMembers.json' }).as('roomMembersRequest');
});

/**
 * Intercept all requests that are needed when visiting the settings tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomSettingsRequest
 * @returns void
 */
Cypress.Commands.add('interceptRoomSettingsRequest', () => {
  cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', { fixture: 'roomSettings.json' }).as('roomSettingsRequest');

  cy.intercept('GET', 'api/v1/config', {
    data: {
      theme: {
        primary_color: '#14b8a6',
        rounded: true
      },
      general: { toast_lifetime: 0 },
      room: { refresh_rate: 5000 },
      bbb: { welcome_message_limit: 500 }
    }
  });
});

/**
 * Intercept all requests that are needed when visiting the user profile page
 * @memberof cy
 * @method interceptUserProfileRequests
 * @returns void
 */
Cypress.Commands.add('interceptUserProfileRequests', () => {
  cy.fixture('currentUser.json').then((currentUser) => {
    currentUser.data.permissions = ['users.updateOwnAttributes'];

    cy.intercept('GET', 'api/v1/currentUser', currentUser);
  });

  cy.intercept('GET', 'api/v1/config', {
    data: {
      theme: {
        primary_color: '#14b8a6',
        rounded: true
      },
      general: {
        toast_lifetime: 0,
        enabled_locales: {
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      },
      user: {
        password_change_allowed: true
      }
    }
  });
  cy.intercept('GET', 'api/v1/locale/de', {
    data: {},
    meta: {
      dateTimeFormat: {
        dateShort: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        },
        dateLong: {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        },
        time: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        datetimeShort: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        datetimeLong: {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      }
    }
  });
  cy.intercept('GET', 'api/v1/users/1', { fixture: 'user.json' }).as('userRequest');
  cy.intercept('GET', 'api/v1/getTimezones', { fixture: 'timezones.json' });
  cy.intercept('GET', 'api/v1/sessions', { fixture: 'sessions.json' });
});
