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
  cy.intercept('GET', 'api/v1/locale/en', {});
  cy.intercept('GET', 'api/v1/settings', {
    data: {
      toast_lifetime: 0
    }
  });
});

Cypress.Commands.add('interceptRoomIndexRequests', () => {
  cy.intercept('GET', 'api/v1/roomTypes*', { fixture: 'exampleRoomTypes.json' });
  cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' }).as('roomRequest');
});

Cypress.Commands.add('interceptRoomViewRequests', () => {
  cy.intercept('GET', 'api/v1/settings', {
    data: {
      room_refresh_rate: Number.MAX_SAFE_INTEGER,
      toast_lifetime: 0
    }
  });
  cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' });
});

Cypress.Commands.add('testVisitWithoutCurrentUser', (path) => {
  cy.intercept('GET', 'api/v1/currentUser', {});

  cy.visit(path);
  cy.url().should('contain', '/login?redirect=' + path);
});
