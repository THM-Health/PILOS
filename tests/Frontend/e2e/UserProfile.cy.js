import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('User Profile', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptUserProfileRequests();
  });

  it('open user profile', function () {
    cy.interceptRoomIndexRequests();

    const userRequest = interceptIndefinitely('GET', 'api/v1/users/1', { fixture: 'user.json' }, 'userRequest');

    cy.visit('/rooms');

    // Open profile
    cy.get('[data-test="user-avatar"]').click();
    cy.get('[data-test="submenu"]').eq(0).within(() => {
      cy.get('[data-test="submenu-action"]').eq(0).should('have.text', 'app.profile').click();
    });

    cy.url().should('include', '/profile');

    cy.get('[data-test="user-profile"]').should('be.visible');

    cy.get('[data-test="base-tab-button"]').should('not.exist');
    cy.get('[data-test="email-tab-button"]').should('not.exist');
    cy.get('[data-test="security-tab-button"]').should('not.exist');
    cy.get('[data-test="others-tab-button"]').should('not.exist');

    cy.get('[data-test="overlay"]').should('be.visible').then(() => {
      userRequest.sendResponse();
    });

    cy.wait('@userRequest');

    cy.get('[data-test="overlay"]').should('not.exist');
    cy.get('[data-test="base-tab-button"]').should('be.visible');
    cy.get('[data-test="email-tab-button"]').should('be.visible');
    cy.get('[data-test="security-tab-button"]').should('be.visible');
    cy.get('[data-test="others-tab-button"]').should('be.visible');
  });

  it('open user profile errors', function () {
    cy.intercept('GET', 'api/v1/users/1', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('userRequest');

    cy.visit('/profile');

    cy.wait('@userRequest');

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should('be.visible');

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Reload with correct data
    cy.intercept('GET', 'api/v1/users/1', {
      fixture: 'user.json'
    }).as('userRequest');

    cy.get('[data-test="loading-retry-button"]')
      .should('be.visible')
      .and('have.text', 'app.reload')
      .click();

    cy.wait('@userRequest');

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should('not.exist');

    // Reload page with 401 error
    cy.intercept('GET', 'api/v1/users/1', {
      statusCode: 401
    }).as('userRequest');

    cy.reload();

    cy.wait('@userRequest');

    // Check that redirect worked and error message is shown
    cy.url().should('include', '/login?redirect=/profile');

    cy.checkToastMessage('app.flash.unauthenticated', false);
  });
});
