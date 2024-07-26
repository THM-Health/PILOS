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
  cy.intercept('GET', 'api/v1/currentUser', { fixture: 'exampleUser.json' });
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

Cypress.Commands.add('interceptRoomIndexRequests', () => {
  cy.intercept('GET', 'api/v1/roomTypes*', { fixture: 'exampleRoomTypes.json' });
  cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' }).as('roomRequest');
});

Cypress.Commands.add('interceptRoomViewRequests', () => {
  cy.intercept('GET', 'api/v1/config', {
    data: {
      general: { toast_lifetime: 0 },
      theme: { primary_color: '#14b8a6', rounded: true },
      room: { refresh_rate: 5000 }
    }
  });
  cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('roomRequest');
});

Cypress.Commands.add('testVisitWithoutCurrentUser', (path) => {
  cy.intercept('GET', 'api/v1/currentUser', {});

  cy.visit(path);
  cy.url().should('contain', '/login?redirect=' + path);
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
