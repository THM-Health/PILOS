describe('App', () => {

  beforeEach(()=>{
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  //ToDo Think about moving to other test file
  it('successful logout no redirect', () => {
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 204,
      data:{
        redirect: false
      }
    });
    cy.visit('rooms');

    // Click on logout
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

    // Check if redirected to logout
    cy.url().should('contain', '/logout').should('not.contain', 'rooms');
    cy.contains('auth.logout_success');

    //ToDo?? Check if current user is reset (logout can only be accessed when logged out, should be enough)
  });

  it('successful logout with redirect', () => {
    cy.intercept('POST', 'api/v1/logout',{
      statusCode: 200,
      body:{
        redirect: '/'
      }
    });
    cy.visit('rooms');

    // Click on logout
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click().then(()=>{
        //ToDo Problem???
        //cy.url().should('contain', '/NewUrl');
      });
    });

    // Check if redirect works
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

    // Click on logout
    cy.get('[data-test=user-avatar]').click();
    cy.get('[data-test=submenu]').eq(0).within(()=>{
      cy.get('[data-test=submenu-action]').eq(1).should('contain', 'auth.logout').click();
    });

    // Check if error gets shown and user stays logged in
    cy.get('.p-toast').should('be.visible').and('contain', 'auth.flash.logout_error');
    cy.url().should('contain', '/rooms').and('not.contain', '/logout').and('not.contain', '/login');
  })

})
