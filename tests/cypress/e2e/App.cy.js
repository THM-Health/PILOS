describe('App', () => {

  beforeEach(()=>{
    cy.init();
    cy.interceptRoomIndexRequests();
    cy.intercept('GET', 'api/v1/settings', []);
  });

  //ToDo Think about moving to other test file
  it('Successful logout no redirect', () => {
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 204,
      data:{
        redirect: false
      }
    });
    cy.visit('rooms');
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

    cy.url().should('contain', '/logout').should('not.contain', 'rooms');

  });

  it('Successful logout with redirect', () => {
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 200,
      body:{
        redirect: '/'
      }
    });
    cy.visit('rooms');
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click().then(()=>{
        //ToDo Problem???
        //cy.url().should('contain', '/NewUrl');
      });
    });
    cy.url().should('not.contain', 'logout');
  });

  it('failed logout', ()=>{
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 500,
      body:{
        message: 'Test'
      }
    });

    cy.visit('/rooms');

    cy.get('[data-test=user-avatar]').click();

    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

    cy.get('.p-toast').should('contain', 'auth.flash.logout_error');
  })

})
