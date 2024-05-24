describe('MainNav', () => {

  beforeEach(()=>{
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  //ToDo Move to other test file
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
    cy.url().should('contain', '/logout').should('not.contain', 'rooms');
    cy.contains('auth.logout_success');
  });

  it('failed logout', ()=>{
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 500,
      body:{
        message: 'Test'
      }
    });

    cy.visit('/rooms');

    // Click on logout
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

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

    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).within(()=>{
      cy.get('[data-test=submenu-action]').should('have.length', 3);
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch');
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'English');
      cy.get('[data-test=submenu-action]').eq(2).should('contain', 'Français');
    });
  });

  it('changing selected locale', ()=>{
    cy.intercept('GET', 'api/v1/settings',{ //ToDo think about moving outside of test cases
      data: {
        default_locale: 'en',
        enabled_locales:{
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      }
    });

    cy.intercept('POST', '/api/v1/locale', { //ToDo add wait
      statusCode: 200
    });

    cy.intercept('GET', '/api/v1/locale/de', {
      statusCode: 200
    }).as('localeRequest');

    cy.visit('/rooms');
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).should('be.visible').within(()=>{
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch').click();
    });

    cy.wait('@localeRequest');

    cy.get('[data-test=submenu]').should('not.be.visible');
  });

  it('shows a corresponding error message and does not change the language on 422', ()=>{
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

    cy.intercept('POST', '/api/v1/locale', { //ToDo add wait
      statusCode: 422,
      body: {
        errors: {
          locale: ['Test']
        }
      }
    });

    cy.visit('/rooms');
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).within(()=>{
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch').click();
    });

    cy.get('.p-toast').should('be.visible').and('contain', 'Test');

    //ToDo Check that locale stays the same (possibility to check that intercepted request was not called with spy()?)

  });

  it('test other errors', ()=>{
    cy.intercept('GET', 'api/v1/settings',{ //ToDo think about moving outside of test cases
      data: {
        default_locale: 'en',
        enabled_locales:{
          de: 'Deutsch',
          en: 'English',
          fr: 'Français'
        }
      }
    });

    cy.intercept('POST', '/api/v1/locale', { //ToDo add wait
      statusCode: 500,
      body: {
        message: ['Test']
      }
    });

    cy.visit('/rooms');
    cy.get('.p-menuitem').eq(4).click();
    cy.get('[data-test=submenu]').eq(1).within(()=>{
      cy.get('[data-test=submenu-action]').eq(0).should('contain', 'Deutsch').click();
    });

    cy.get('.p-toast').should('be.visible').and('contain', 'app.flash.server_error.message');

    //ToDo Check that locale stays the same (possibility to check that intercepted request was not called with spy()?)

  });

});
