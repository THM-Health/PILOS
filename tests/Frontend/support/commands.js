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

Cypress.Commands.add('testVisitWithoutCurrentUser', (path) => {
  cy.intercept('GET', 'api/v1/currentUser', {});

  cy.visit(path);
  cy.url().should('contain', '/login?redirect=' + path);
});

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

Cypress.Commands.add('interceptRoomIndexRequests', () => {
  cy.intercept('GET', 'api/v1/roomTypes*', { fixture: 'roomTypes.json' });
  cy.intercept('GET', 'api/v1/rooms*', { fixture: 'rooms.json' }).as('roomRequest');
});

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

Cypress.Commands.add('interceptRoomFilesRequest', () => {
  cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', { // ToDo add fixture
    statusCode: 200,
    body: {
      data: [],
      meta: {
        from: null
      }
    }
  });
});

Cypress.Commands.add('interceptRoomMembersRequest', () => {
  cy.intercept('GET', 'api/v1/rooms/abc-def-123/member*', { fixture: 'roomMembers.json' }).as('roomMembersRequest');
});

Cypress.Commands.add('interceptRoomSettingsRequest', () => { // ToDo improve fixtures
  cy.intercept('GET', 'api/v1/rooms/abc-def-123/settings', { fixture: 'roomSettingsNoExpert.json' }).as('roomSettingsRequest');

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

Cypress.Commands.add('interceptUserProfileRequests', () => {
  cy.intercept('GET', 'api/v1/currentUser', {
    data: {
      id: 1,
      firstname: 'John',
      lastname: 'Doe',
      locale: 'en',
      permissions: ['users.updateOwnAttributes'],
      model_name: 'User',
      room_limit: -1
    }
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
      }
    }
  });
  cy.intercept('GET', 'api/v1/users/1', { fixture: 'user.json' }).as('userRequest');
  cy.intercept('GET', 'api/v1/getTimezones', { fixture: 'timezones.json' });
  cy.intercept('GET', 'api/v1/sessions', { fixture: 'sessions.json' });
});
