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
