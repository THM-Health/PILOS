import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('General', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it('all locales get rendered', function () {
    cy.visit('/rooms');

    // Open menu to check if the correct locales are shown
    cy.get('.fa-solid.fa-language').click();
    cy.get('[data-test="submenu"]').eq(1).within(() => {
      cy.get('[data-test="submenu-action"]').should('have.length', 3);
      cy.get('[data-test="submenu-action"]').eq(0).should('have.text', 'Deutsch');
      cy.get('[data-test="submenu-action"]').eq(1).should('have.text', 'English');
      cy.get('[data-test="submenu-action"]').eq(2).should('have.text', 'Français');
    });
  });

  it('changing selected locale', function () {
    // Intercept locale and de request
    const localeRequest = interceptIndefinitely('POST', '/api/v1/locale', {
      statusCode: 200
    }, 'localeRequest');

    cy.intercept('GET', '/api/v1/locale/de', {
      statusCode: 200
    }).as('deRequest');

    cy.visit('/rooms');

    cy.wait('@roomRequest');

    cy.get('[data-test="overlay"]').should('not.exist');
    // Open menu and click on a different locale than the current one
    cy.get('.fa-solid.fa-language').click();
    cy.get('[data-test="submenu"]').eq(1).should('be.visible').within(() => {
      cy.get('[data-test="submenu-action"]').eq(0).should('have.text', 'Deutsch').click();
    });

    // Check loading
    cy.get('[data-test="overlay"]').should('be.visible').then(() => {
      localeRequest.sendResponse();
    });

    // Check that the correct requests are made
    cy.wait('@localeRequest');
    cy.wait('@deRequest');

    // Check that the menu is closed
    cy.get('[data-test="submenu"]').should('not.be.visible');
  });

  it('changing selected locale error', function () {
    // Shows a corresponding error message and does not change the language on 422 error
    cy.intercept('POST', '/api/v1/locale', {
      statusCode: 422,
      body: {
        errors: {
          locale: ['Test']
        }
      }
    }).as('localeRequest');

    cy.intercept('GET', '/api/v1/locale/de', cy.spy().as('deRequestSpy'));

    cy.visit('/rooms');

    // Open menu and click on a different locale than the current one
    cy.get('.fa-solid.fa-language').click();
    cy.get('[data-test="submenu"]').eq(1).within(() => {
      cy.get('[data-test="submenu-action"]').eq(0).should('have.text', 'Deutsch').click();
    });

    // Check that the locale request was made
    cy.wait('@localeRequest');
    // Check that the request for the new language was not send (language stays the same after error)
    cy.get('@deRequestSpy').should('not.be.called');

    // Check if error message is shown
    cy.checkToastMessage('Test');

    // Test other errors
    cy.intercept('POST', '/api/v1/locale', {
      statusCode: 500,
      body: {
        message: ['Test']
      }
    }).as('localeRequest');

    cy.intercept('GET', '/api/v1/locale/de', cy.spy().as('deRequestSpy'));

    // Open menu and click on a different locale than the current one
    cy.get('.fa-solid.fa-language').click();
    cy.get('[data-test="submenu"]').eq(1).within(() => {
      cy.get('[data-test="submenu-action"]').eq(0).should('have.text', 'Deutsch').click();
    });

    // Check that the locale request was made
    cy.wait('@localeRequest');
    // Check that the request for the new language was not send (language stays the same after error)
    cy.get('@deRequestSpy').should('not.be.called');

    // Check if error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":["Test"]}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);
  });
});
