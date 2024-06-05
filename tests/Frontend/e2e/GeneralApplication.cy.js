import env from '../../../resources/js/env.js';

describe('General', () => {

  beforeEach(()=>{
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it('successful logout no redirect', () => {
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 204,
      data:{
        redirect: false
      }
    }).as('logoutRequest');
    cy.visit('rooms');

    // Click on logout
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

    cy.wait('@logoutRequest');

    // Check if redirected to logout
    cy.url().should('contain', '/logout').should('not.contain', '/rooms');
    cy.contains('auth.logout_success');
  });

  it('failed logout', ()=>{
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 500,
      body:{
        message: 'Test'
      }
    }).as('logoutRequest');

    cy.visit('/rooms');

    // Click on logout
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

    cy.wait('@logoutRequest')

    // Check if error gets shown and user stays logged in
    cy.get('.p-toast').should('be.visible').and('contain', 'auth.flash.logout_error');
    cy.url().should('contain', '/rooms').and('not.contain', '/logout').and('not.contain', '/login');
  });

  it('all locales get rendered', ()=>{

    cy.intercept('GET', 'api/v1/settings',{
      data: {
        enabled_locales:{
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      }
    });

    cy.visit('/rooms');

    // Open menu to check if the correct locales are shown
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).within(()=>{
      cy.get('[data-test=submenu-action]').should('have.length', 3);
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch');
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'English');
      cy.get('[data-test=submenu-action]').eq(2).should('contain', 'Français');
    });
  });

  it('changing selected locale', ()=>{
    cy.intercept('GET', 'api/v1/settings',{
      data: {
        default_locale: 'en',
        enabled_locales:{
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      }
    });

    //Intercept locale and de request
    cy.intercept('POST', '/api/v1/locale', {
      statusCode: 200
    }).as('localeRequest');

    cy.intercept('GET', '/api/v1/locale/de', {
      statusCode: 200
    }).as('deRequest');

    cy.visit('/rooms');
    // Open menu and click on a different locale than the current one
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).should('be.visible').within(()=>{
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch').click();
    });

    // Check that the correct requests are made
    cy.wait('@localeRequest')
    cy.wait('@deRequest');

    // Check that the menu is closed
    cy.get('[data-test=submenu]').should('not.be.visible');
  });

  it('shows a corresponding error message and does not change the language on 422', ()=>{
    cy.intercept('GET', 'api/v1/settings',{
      data: {
        toast_lifetime: 0,
        default_locale: 'en',
        enabled_locales:{
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      }
    });

    cy.intercept('POST', '/api/v1/locale', {
      statusCode: env.HTTP_UNPROCESSABLE_ENTITY,
      body: {
        errors: {
          locale: ['Test']
        }
      }
    }).as('localeRequest');

    cy.intercept('GET', '/api/v1/locale/de', cy.spy().as('deRequestSpy'));

    cy.visit('/rooms');

    // Open menu and click on a different locale than the current one
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).within(()=>{
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch').click();
    });

    // Check that the locale request was made
    cy.wait('@localeRequest');
    // Check that the request for the new language was not send (language stays the same after error)
    cy.get('@deRequestSpy').should('not.be.called');

    //Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('contain', 'Test');
  });

  it('test other errors', ()=>{
    cy.intercept('GET', 'api/v1/settings',{
      data: {
        toast_lifetime: 0,
        default_locale: 'en',
        enabled_locales:{
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      }
    });

    cy.intercept('POST', '/api/v1/locale', {
      statusCode: 500,
      body: {
        message: ['Test']
      }
    }).as('localeRequest');

    cy.intercept('GET', '/api/v1/locale/de', cy.spy().as('deRequestSpy'));

    // Open menu and click on a different locale than the current one
    cy.visit('/rooms');
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).within(()=>{
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch').click();
    });

    // Check that the locale request was made
    cy.wait('@localeRequest');
    // Check that the request for the new language was not send (language stays the same after error)
    cy.get('@deRequestSpy').should('not.be.called');

    //Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    });

});
